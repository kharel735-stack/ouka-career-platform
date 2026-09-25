/* ============================================================================
 * app.js ― OUKA 会話面接アプリ（Phase1：ブラウザだけで動く・保存は localStorage）
 *
 *  前半 Core  … 質問の組み立て・集計・レベル判定・CSV読込（Node からテストできる純粋関数）
 *  後半 UI    … 画面（ホーム → 開始 → 1問ずつ採点 → 結果 → 全結果）
 *
 *  データは data/candidates.js と data/questions.js にだけ書く。ここは書き換えない。
 * ==========================================================================*/
(function (root) {
  "use strict";

  /* ======================================================================
   * Core
   * ==================================================================== */
  var LEVELS = [
    { min: 4.5, label: "非常に高い会話力" },
    { min: 3.8, label: "日本での就労会話にかなり対応可能" },
    { min: 3.0, label: "基本会話可能・弱点研修推奨" },
    { min: 2.0, label: "企業面接前に会話研修が必要" },
    { min: 1.0, label: "基礎日本語から再教育" }
  ];

  var SCORE_GUIDE = [
    { score: 5, short: "自然に詳しく", text: "質問を一度で理解し、自然な日本語で詳しく説明できる。追加質問にも対応できる。" },
    { score: 4, short: "普通に会話", text: "ほぼ質問を理解し、普通に会話できる。多少の文法ミスや言い直しは問題なし。" },
    { score: 3, short: "短文・補助あり", text: "内容は理解できるが短文中心。少し言い換えや補助が必要。" },
    { score: 2, short: "単語・短い返答", text: "単語や非常に短い返答が中心。何度も質問を言い換える必要がある。" },
    { score: 1, short: "ほぼ回答できない", text: "日本語だけではほぼ回答できない。質問の理解または会話成立が難しい。" }
  ];

  function round2(n) { return Math.round(n * 100) / 100; }

  function normText(s) { return String(s || "").replace(/[\s　、。,.!?！？「」]/g, ""); }

  /* 候補者1人分の質問リストを作る。並び＝カテゴリー順 → (first, 共通, 経歴セット, 個別, 辞めた理由, last) */
  function buildQuestions(cand, bank) {
    var catOrder = {};
    bank.categories.forEach(function (c, i) { catOrder[c.code] = i; });
    var skip = cand.skip || [];
    var ended = cand.work_ended === true;
    var job = cand.job || "この";
    var places = bank.template_places || {};
    function fill(t, setName) {
      var place = cand.work_place || places[setName] || "前の職場";
      return t.replace(/\{place\}/g, place).replace(/\{job\}/g, job);
    }
    var items = [];

    function push(id, cat, text, rank) {
      if (!(cat in catOrder)) throw new Error("カテゴリーが不正です: " + cat + "（" + text + "）");
      items.push({ question_id: id, category: cat, text: text, rank: rank, seq: items.length });
    }

    bank.common.forEach(function (q) {
      if (skip.indexOf(q.id) >= 0) return;
      push(q.id, q.cat, q.text, q.last ? 4 : 1);
    });
    (cand.question_sets || []).forEach(function (setName) {
      var set = bank.templates[setName];
      if (!set) throw new Error("質問セットがありません: " + setName + "（" + cand.name + "）");
      set.forEach(function (q) {
        if (skip.indexOf(q.id) >= 0) return;
        if (q.only === "ended" && !ended) return;
        var t = (ended && q.text_past) ? q.text_past : q.text;
        push(q.id, q.cat, fill(t, setName), q.only === "ended" ? 3.5 : 2);
      });
    });
    (cand.extra_questions || []).forEach(function (q, i) {
      push("X" + (i < 9 ? "0" : "") + (i + 1), q.cat, fill(q.text), q.first ? 0 : 3);
    });

    items.sort(function (a, b) {
      return (catOrder[a.category] - catOrder[b.category]) || (a.rank - b.rank) || (a.seq - b.seq);
    });

    var seen = {};
    var out = [];
    items.forEach(function (q) {
      var k = normText(q.text);
      if (seen[k]) return;
      seen[k] = true;
      out.push(q);
    });

    /* 上限（既定40問）を超えたら、質問が一番多いカテゴリーから経歴セットの質問を後ろから減らす */
    var max = bank.max_questions || 40;
    while (out.length > max) {
      var cnt = {};
      out.forEach(function (q) { if (q.rank === 2) cnt[q.category] = (cnt[q.category] || 0) + 1; });
      var cats = Object.keys(cnt);
      if (!cats.length) break;
      var total = {};
      out.forEach(function (q) { total[q.category] = (total[q.category] || 0) + 1; });
      cats.sort(function (x, y) { return total[y] - total[x]; });
      for (var i = out.length - 1; i >= 0; i--) {
        if (out[i].rank === 2 && out[i].category === cats[0]) { out.splice(i, 1); break; }
      }
    }
    return out.map(function (q) { return { question_id: q.question_id, category: q.category, text: q.text }; });
  }

  /* 短縮版：各カテゴリーの先頭から short_limits の数だけ残す */
  function shortList(questions, bank) {
    var lim = bank.short_limits || {}, used = {};
    return questions.filter(function (q) {
      used[q.category] = (used[q.category] || 0) + 1;
      return used[q.category] <= (lim[q.category] || 0);
    });
  }

  function catName(bank, code) {
    for (var i = 0; i < bank.categories.length; i++) if (bank.categories[i].code === code) return bank.categories[i].name;
    return code;
  }

  function levelFor(avg) {
    if (avg == null) return "";
    for (var i = 0; i < LEVELS.length; i++) if (avg >= LEVELS[i].min) return LEVELS[i].label;
    return LEVELS[LEVELS.length - 1].label;
  }

  /* 集計。平均は採点済みの質問だけで割る（未採点は0点にしない）。判定は小数2桁に丸めた値で行う。 */
  function stats(questions, answers, bank) {
    answers = answers || {};
    var dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    var sum = 0, answered = 0, skipped = 0;
    var byCat = {};
    bank.categories.forEach(function (c) { byCat[c.code] = { code: c.code, name: c.name, count: 0, answered: 0, sum: 0 }; });
    questions.forEach(function (q) {
      var c = byCat[q.category];
      c.count++;
      var a = answers[q.question_id];
      var s = a && a.score;
      if (a && a.skipped) skipped++;
      else if (s >= 1 && s <= 5) {
        dist[s]++; sum += s; answered++;
        c.answered++; c.sum += s;
      }
    });
    var avg = answered ? round2(sum / answered) : null;
    var cats = bank.categories.map(function (c) {
      var x = byCat[c.code];
      return { code: x.code, name: x.name, count: x.count, answered: x.answered, avg: x.answered ? round2(x.sum / x.answered) : null };
    }).filter(function (x) { return x.count > 0; });
    return {
      total: questions.length, answered: answered, skipped: skipped, unscored: questions.length - answered - skipped,
      sum: sum, avg: avg, level: levelFor(avg), dist: dist, byCat: cats
    };
  }

  /* ---------- CSV ---------- */
  function parseCSV(text) {
    text = String(text || "").replace(/^\uFEFF/, "");
    var rows = [], row = [], field = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else q = false;
        } else field += ch;
      } else if (ch === '"') q = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += ch;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return String(c).trim() !== ""; }); });
  }

  function splitList(s) {
    return String(s || "").split(/[;|、]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  function parseEnded(s) {
    s = String(s || "").trim().toLowerCase();
    if (/^(yes|y|true|1|ended|辞めた|退職|済)$/.test(s)) return true;
    if (/^(no|n|false|0|current|在職|現職|今も)$/.test(s)) return false;
    return null;
  }

  /* 候補者CSV → 候補者データ。列名は data/candidates_template.csv と同じ。 */
  function candidatesFromCSV(text) {
    var rows = parseCSV(text);
    if (rows.length < 2) throw new Error("CSVに候補者の行がありません");
    var head = rows[0].map(function (h) { return String(h).trim(); });
    var col = function (r, name) { var i = head.indexOf(name); return i >= 0 ? String(r[i] == null ? "" : r[i]).trim() : ""; };
    ["candidate_id", "name"].forEach(function (h) {
      if (head.indexOf(h) < 0) throw new Error("CSVに「" + h + "」列がありません");
    });
    var out = [];
    rows.slice(1).forEach(function (r, idx) {
      var id = col(r, "candidate_id"), name = col(r, "name");
      if (!id || !name) throw new Error((idx + 2) + "行目：candidate_id と name は必須です");
      var extras = String(col(r, "extra_questions")).split("|").map(function (x) { return x.trim(); }).filter(Boolean).map(function (x) {
        var m = x.match(/^([A-Ga-g])\s*[:：]\s*(.+)$/);
        if (!m) throw new Error((idx + 2) + "行目：extra_questions は「D:質問文」の形で書いてください → " + x);
        return { cat: m[1].toUpperCase(), text: m[2].trim() };
      });
      var no = parseInt(col(r, "no"), 10);
      out.push({
        no: isNaN(no) ? 9999 : no,
        candidate_id: id,
        name: name,
        job: col(r, "job"),
        japanese_cert: col(r, "japanese_cert"),
        ssw_cert: col(r, "ssw_cert"),
        work_history: col(r, "work_history"),
        question_sets: splitList(col(r, "question_sets")),
        work_place: col(r, "work_place"),
        work_ended: parseEnded(col(r, "work_ended")),
        extra_questions: extras,
        skip: splitList(col(r, "skip"))
      });
    });
    return out;
  }

  function mergeCandidates(base, extra) {
    var map = {};
    (base || []).concat(extra || []).forEach(function (c) { map[c.candidate_id] = c; });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) {
      return (a.no - b.no) || (a.candidate_id < b.candidate_id ? -1 : 1);
    });
  }

  /* 面接当日の登録フォーム → 候補者データ。番号と候補者番号は既存の続きを自動で振る。 */
  var WORK_TYPES = [
    { code: "restaurant", set: "restaurant", label: "レストラン" },
    { code: "school", set: "school", label: "学校" },
    { code: "agriculture", set: "agriculture", label: "農業" },
    { code: "hospital", set: "hospital", label: "病院・受付" },
    { code: "care", set: "care_exp", label: "介護の仕事" },
    { code: "other", set: "work_general", label: "その他の仕事" },
    { code: "none", set: "no_work", label: "職歴なし" }
  ];

  function newCandidateFromForm(f, existing) {
    var name = String(f.name || "").trim();
    if (!name) throw new Error("名前を入れてください");
    var job = String(f.job || "").trim() || "介護";
    var works = (f.works || []).filter(function (w) { return WORK_TYPES.some(function (t) { return t.code === w; }); });
    if (!works.length) works = ["none"];
    var sets = works.map(function (w) { return WORK_TYPES.filter(function (t) { return t.code === w; })[0].set; });
    if (/介護/.test(job)) { if (works.indexOf("care") < 0) sets.push("care_new"); }
    else sets.push("job_general");
    var realWorks = works.filter(function (w) { return w !== "none"; });
    var place = realWorks.length === 1 ? String(f.work_place || "").trim() : "";
    var ended = f.work_ended === "yes" ? true : f.work_ended === "no" ? false : null;
    var maxNo = 0, maxId = 0;
    (existing || []).forEach(function (c) {
      if (c.no < 9999 && c.no > maxNo) maxNo = c.no;
      var m = String(c.candidate_id).match(/^OUKA-C(\d+)$/);
      if (m && +m[1] > maxId) maxId = +m[1];
    });
    var labels = works.map(function (w) { return WORK_TYPES.filter(function (t) { return t.code === w; })[0].label; });
    var hist = labels.join("・") + (place ? "（" + place + "）" : "") +
      (realWorks.length ? (ended === true ? "／辞めた" : ended === false ? "／今も働いている" : "") : "");
    return {
      no: maxNo + 1,
      candidate_id: "OUKA-C" + ("00" + (maxId + 1)).slice(-3),
      name: name, job: job,
      japanese_cert: String(f.japanese_cert || "").trim(),
      ssw_cert: String(f.ssw_cert || "").trim(),
      work_history: hist + "（面接当日に登録）",
      question_sets: sets, work_place: place, work_ended: ended,
      extra_questions: [], skip: [], added_on: f.today || ""
    };
  }

  /* スプレッドシートへ送る1件分（schema ouka.interview.v1）。sig は「前回送った内容から変わったか」の判定用。 */
  function buildSyncPayload(cand, questions, rec, bank, mode) {
    var st = stats(questions, rec.answers, bank);
    var cats = {};
    st.byCat.forEach(function (x) { cats[x.code] = x.avg; });
    var record = {
      candidate_id: cand.candidate_id, name: cand.name, job: cand.job || "", interview_date: rec.interview_date || "",
      status: rec.interview_status || "", mode: mode === "short" ? "short" : "full",
      total: st.total, answered: st.answered, skipped: st.skipped, unscored: st.unscored, sum: st.sum,
      avg: st.avg, level: st.level, cats: cats, memo: rec.memo || "",
      answers: questions.map(function (q, i) {
        var a = rec.answers[q.question_id];
        return { no: i + 1, question_id: q.question_id, category: q.category, text: q.text,
          score: a && !a.skipped ? a.score : null, skipped: !!(a && a.skipped) };
      })
    };
    var str = JSON.stringify(record), h = 5381;
    for (var i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return { schema: "ouka.interview.v1", record: record, sig: h.toString(16) + ":" + str.length };
  }

  /* バックアップの合流。同じ候補者は updated_at が新しい方を残す（古い方で上書きしない）。 */
  function mergeBackup(current, incoming) {
    var cur = (current && current.records) || {}, inc = (incoming && incoming.records) || {};
    if (!incoming || incoming.app !== "ouka-interview") throw new Error("このアプリのバックアップではありません");
    var out = {}, added = 0, updated = 0, kept = 0;
    Object.keys(cur).forEach(function (k) { out[k] = cur[k]; });
    Object.keys(inc).forEach(function (k) {
      var a = out[k], b = inc[k];
      if (!a) { out[k] = b; added++; return; }
      if (String(b.updated_at || "") > String(a.updated_at || "")) { out[k] = b; updated++; }
      else kept++;
    });
    var cands = mergeCandidates((incoming.candidates || []), (current && current.candidates) || []);
    return { records: out, candidates: cands, added: added, updated: updated, kept: kept };
  }

  /* ----------------------------------------------------------------------
   * 履歴書テキストの読み取り（キーワードの拾い上げ。AI解析ではない）
   *   ★書いてあった文字だけを返す。書いていないことは空のままにして、面接で確認する。
   * -------------------------------------------------------------------- */
  var RESUME_RULES = [
    { code: "care", words: ["介護", "care giver", "caregiver", "care work", "caretaker", "nursing home", "old age home", "care home", "elderly"] },
    { code: "hospital", words: ["病院", "hospital", "clinic", "medical", "診療所"] },  /* 「受付」は職種であって職場ではないので入れない */
    { code: "restaurant", words: ["レストラン", "restaurant", "cafe", "café", "hotel", "ホテル", "kitchen", "waiter", "waitress", "cook", "chef", "厨房", "調理"] },
    { code: "school", words: ["学校", "school", "teacher", "教師", "講師", "教員"] },
    { code: "agriculture", words: ["農業", "agriculture", "farm", "farming", "farmer", "畑"] },
    { code: "other", words: ["建設", "construction", "factory", "工場", "driver", "運転", "shop", "store", "security", "警備", "sales", "営業"] }
  ];
  var NO_WORK_WORDS = ["職歴なし", "no work experience", "no experience", "fresher", "未経験"];
  var WORK_HEAD = /(work\s*experience|employment|職歴|勤務|経歴|experience)/i;
  var OTHER_HEAD = /(education|学歴|qualification|資格|language|skill|training|certificate|personal|reference|hobby|address|contact)/i;
  var CERT_LINE = /(jft|jlpt|\bn[1-5]\b|skill\s*(evaluation\s*)?test|技能測定|介護技能|介護日本語|試験|passed|合格|certificate)/i;

  function resumeLines(text) {
    return String(text || "").split(/[\r\n]+/).map(function (x) { return x.trim(); }).filter(Boolean);
  }

  /* 職歴の欄だけを取り出す。見出しが無ければ、資格・試験の行を除いた全体を使う。 */
  function workSection(lines) {
    var inWork = false, out = [], sawHead = false;
    lines.forEach(function (l) {
      var isWork = WORK_HEAD.test(l) && l.length < 40;
      var isOther = OTHER_HEAD.test(l) && l.length < 40;
      if (isWork) { inWork = true; sawHead = true; return; }
      if (isOther) { inWork = false; return; }
      if (inWork) out.push(l);
    });
    if (sawHead && out.length) return { lines: out, section: true };
    return { lines: lines.filter(function (l) { return !CERT_LINE.test(l); }), section: false };
  }

  function parseResume(text) {
    var lines = resumeLines(text);
    var name = "";
    for (var i = 0; i < lines.length && !name; i++) {
      var m = lines[i].match(/^(?:name|氏名|名前)\s*[:：]\s*(.+)$/i);
      if (m) name = m[1].trim();
    }
    if (!name) {
      for (var j = 0; j < Math.min(lines.length, 8) && !name; j++) {
        if (/^[A-Z][A-Z .'-]{4,40}$/.test(lines[j])) name = lines[j].replace(/\s+/g, " ").trim();
      }
    }
    var noWork = NO_WORK_WORDS.filter(function (w) { return String(text).toLowerCase().indexOf(w.toLowerCase()) >= 0; });
    var ws = workSection(lines.filter(function (l) {
      return !NO_WORK_WORDS.some(function (w) { return l.toLowerCase().indexOf(w.toLowerCase()) >= 0; });
    }));
    var workText = ws.lines.join("\n");
    var low = workText.toLowerCase();
    var found = [], works = [];
    RESUME_RULES.forEach(function (r) {
      var hit = r.words.filter(function (w) { return low.indexOf(w.toLowerCase()) >= 0; });
      if (hit.length) { works.push(r.code); found.push(r.code + "：" + hit.slice(0, 3).join(" / ")); }
    });
    /* 「職歴なし」と書いてある時は、それを優先する（学校名などを職歴にしない） */
    if (noWork.length) { works = ["none"]; found = ["none：「" + noWork[0] + "」の記載"]; }
    var jp = [], ssw = [];
    lines.forEach(function (l) {
      if (/(JFT|JLPT|N[1-5]\b|A2|日本語能力|日本語試験)/i.test(l)) jp.push(l);
      if (/(介護技能|介護日本語|skill\s*(evaluation\s*)?test|特定技能|SSW|技能測定)/i.test(l)) ssw.push(l);
    });
    var place = "";
    if (!noWork.length) ws.lines.forEach(function (l) {
      if (place || (name && l.indexOf(name) >= 0)) return;
      var p = l.match(/(?:at|勤務先|会社|職場)\s*[:：]?\s*([A-Za-z][A-Za-z0-9 .&'-]{3,40})/);
      if (p) { place = p[1].trim(); return; }
      var q = l.match(/\b([A-Z][A-Za-z&.'-]*(?:\s+[A-Z][A-Za-z&.'-]*){0,4})\b/);
      if (q && q[1].length >= 4 && !OTHER_HEAD.test(q[1]) && !WORK_HEAD.test(q[1])) place = q[1].trim();
    });
    var ended = null;
    if (/(現在|present|current|now|〜現在)/i.test(low)) ended = false;
    else if (/(until|まで|退職|辞め|to\s*20\d\d)/i.test(low)) ended = true;
    return {
      name: name, works: works, work_place: place,
      japanese_cert: jp.slice(0, 2).join(" / "), ssw_cert: ssw.slice(0, 2).join(" / "),
      work_ended: ended === false ? "no" : ended === true ? "yes" : "",
      evidence: found, from_section: ws.section, lines: lines.length
    };
  }

  /* 宿題の文（「①… ②… ③… ④…」）を、書き込む欄に分ける。
     番号が無い時は1つの欄として扱う（勝手に作らない）。 */
  function splitHomework(text) {
    var t = String(text || "").trim();
    if (!t) return [];
    var marks = ["①", "②", "③", "④", "⑤", "⑥"];
    var pos = [];
    marks.forEach(function (m) { var i = t.indexOf(m); if (i >= 0) pos.push({ m: m, i: i }); });
    pos.sort(function (a, b) { return a.i - b.i; });
    if (!pos.length) return [{ no: "①", text: t }];
    return pos.map(function (p, k) {
      var end = k + 1 < pos.length ? pos[k + 1].i : t.length;
      return { no: p.m, text: t.slice(p.i + p.m.length, end).trim() };
    });
  }

  function csvCell(v) {
    var s = v == null ? "" : String(v);
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  /* ---------- 週次ふるい（金曜）の判定 ----------
   * 正本＝SOP/週次ふるい_レベル判定_第1期.md ／ 評価シート＝教材26
   *   A：合計80以上 かつ 話す16以上 かつ 実行16以上
   *   B：合計60〜79
   *   C：合計60未満、または 話す・実行のどちらかが10点未満
   * ★「Aでも基準を割ったらBに戻す」（SOP）ので、Cでなく Aの条件を満たさない物は B とする。
   * ★新しい基準を作らない。ここを直す時は先にSOPを直す。 */
  var FURUI = { KEYS: ["R", "L", "W", "S", "A"],
    LABEL: { R: "読む", L: "聞く", W: "書く", S: "話す", A: "実行" },
    OBS: [["taido", "態度"], ["shiji", "指示理解"], ["kyocho", "協調"], ["shuchu", "集中"]],
    MARKS: ["◎", "○", "△", "×"] };

  function furuiScore(sc) {
    var t = 0, filled = 0;
    FURUI.KEYS.forEach(function (k) {
      var v = sc && sc[k];
      if (v === "" || v == null) return;
      var n = Number(v);
      if (!isFinite(n)) return;
      t += Math.max(0, Math.min(20, n));
      filled++;
    });
    return { total: t, filled: filled, done: filled === FURUI.KEYS.length };
  }

  function furuiLevel(sc) {
    var r = furuiScore(sc);
    if (!r.done) return "";                        /* 5つ全部そろうまで判定しない */
    var sp = Number(sc.S), ac = Number(sc.A);
    if (sp < 10 || ac < 10) return "C";            /* 話す・実行は他で代替できない */
    if (r.total >= 80 && sp >= 16 && ac >= 16) return "A";
    if (r.total >= 60) return "B";
    return "C";
  }

  /* 金曜の日付（その週の金曜。日曜なら前の金曜） */
  function fridayOf(d) {
    var x = new Date(d || new Date());
    x.setHours(12, 0, 0, 0);
    x.setDate(x.getDate() + ((5 - x.getDay()) + 7) % 7 - (x.getDay() === 6 || x.getDay() === 0 ? 7 : 0));
    return x.toISOString().slice(0, 10);
  }


  var Core = {
    LEVELS: LEVELS, SCORE_GUIDE: SCORE_GUIDE, buildQuestions: buildQuestions, stats: stats, levelFor: levelFor,
    parseCSV: parseCSV, candidatesFromCSV: candidatesFromCSV, mergeCandidates: mergeCandidates,
    catName: catName, csvCell: csvCell, round2: round2,
    shortList: shortList, newCandidateFromForm: newCandidateFromForm, WORK_TYPES: WORK_TYPES,
    buildSyncPayload: buildSyncPayload, mergeBackup: mergeBackup, parseResume: parseResume, splitHomework: splitHomework,
    FURUI: FURUI, furuiScore: furuiScore, furuiLevel: furuiLevel, fridayOf: fridayOf
  };
  if (typeof module !== "undefined" && module.exports) module.exports = Core;
  if (typeof document === "undefined") return;
  root.OUKA_IV = Core;

  /* ======================================================================
   * UI
   * ==================================================================== */
  var BANK = window.OUKA_INTERVIEW_QUESTIONS;
  var KEY = "ouka_interview_v1";
  var IMPORT_KEY = "ouka_interview_imported_v1";
  var SETTINGS_KEY = "ouka_interview_settings_v1";
  var HW_KEY = "ouka_homework_v1";
  var TS_KEY = "ouka_teacher_study_v1";   /* 先生の勉強の記録 */
  var DR_KEY = "ouka_drill_v1";          /* 問題（546問）の答えと正誤 */
  var GR_KEY = "ouka_grade_v1";          /* 週次ふるい（金曜）の採点 */
  var ROSTER_KEY = "ouka_roster_v1";     /* 代表が入れる名簿（先生・生徒） */
  var AUTO_DELAY = 300;
  /* config.local.js（このパソコンだけの設定・リポジトリに入れない）に送り先と合言葉がある時だけ送信機能が動く */
  var CONFIG = window.OUKA_INTERVIEW_CONFIG || {};
  var SYNC_ON = !!(CONFIG.sync_url && CONFIG.sync_token);
  /* オンライン版（abas-globalgroup.com/iv/）の時だけ入る。ログイン・役割・自動送信は online.js が持つ。
     ★Mac の中で動くローカル版では null＝下の分岐は1つも効かない（今までどおり）。 */
  var ONLINE = window.OUKA_ONLINE || null;

  var view = document.getElementById("view");
  var headName = document.getElementById("headName");
  var modal = document.getElementById("modal");
  var autoTimer = null;

  /* ---------- 保存 ---------- */
  function readJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; } catch (e) { return fallback; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); }
    catch (e) { toast("保存できませんでした（ブラウザの保存領域を確認してください）"); return false; }
    if (ONLINE && ONLINE.changed) ONLINE.changed(key);     /* 記録が変わった＝自動で送る */
    return true;
  }
  function db() { var d = readJSON(KEY, null); return d && d.records ? d : { records: {} }; }
  function getRec(cid) { return db().records[cid] || null; }
  function putRec(rec) { var d = db(); rec.updated_at = new Date().toISOString(); d.records[rec.candidate_id] = rec; writeJSON(KEY, d); }
  function settings() { return readJSON(SETTINGS_KEY, { auto_next: true }); }

  /* ---------- 録音・録画の保存（IndexedDB。localStorageには入らない大きさのため） ---------- */
  var MDB = { name: "ouka_media", store: "items", ver: 1, db: null };
  function mediaOpen() {
    if (MDB.db) return Promise.resolve(MDB.db);
    return new Promise(function (res, rej) {
      var r = indexedDB.open(MDB.name, MDB.ver);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains(MDB.store)) {
          var st = db.createObjectStore(MDB.store, { keyPath: "id" });
          st.createIndex("day", "day", { unique: false });
        }
      };
      r.onsuccess = function () { MDB.db = r.result; res(MDB.db); };
      r.onerror = function () { rej(r.error || new Error("保存領域を開けません")); };
    });
  }
  function mediaTx(mode, fn) {
    return mediaOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(MDB.store, mode);
        var out = fn(tx.objectStore(MDB.store));
        tx.oncomplete = function () { res(out && out.result !== undefined ? out.result : out); };
        tx.onerror = function () { rej(tx.error); };
      });
    });
  }
  function mediaPut(item) { return mediaTx("readwrite", function (st) { return st.put(item); }); }
  function mediaDel(id) { return mediaTx("readwrite", function (st) { return st.delete(id); }); }
  function mediaAll() {
    return mediaOpen().then(function (db) {
      return new Promise(function (res, rej) {
        var out = [];
        var req = db.transaction(MDB.store, "readonly").objectStore(MDB.store).openCursor();
        req.onsuccess = function () {
          var c = req.result;
          if (!c) { res(out.sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); })); return; }
          out.push(c.value); c.continue();
        };
        req.onerror = function () { rej(req.error); };
      });
    });
  }
  function mediaSize(list) { return list.reduce(function (n, x) { return n + (x.size || 0); }, 0); }
  function mb(n) { return (n / 1048576).toFixed(1) + " MB"; }

  /* ---------- 宿題の提出（この端末に保存する。先生は「提出物確認」で見る） ---------- */
  function hwAll() { return readJSON(HW_KEY, {}); }
  function hwKey(student, day) { return String(day) + "|" + String(student || "").trim(); }
  function hwGet(student, day) { return hwAll()[hwKey(student, day)] || null; }
  function hwPut(rec) {
    var all = hwAll();
    rec.saved_at = new Date().toISOString();
    all[hwKey(rec.student, rec.day)] = rec;
    writeJSON(HW_KEY, all);
  }
  function hwOfDay(day) {
    var all = hwAll();
    return Object.keys(all).map(function (k) { return all[k]; })
      .filter(function (r) { return String(r.day) === String(day); })
      .sort(function (a, b) { return String(b.submitted_at || b.saved_at).localeCompare(String(a.submitted_at || a.saved_at)); });
  }
  /* ---------- 週次ふるい（金曜）の採点 ---------- */
  function grAll() { return readJSON(GR_KEY, {}); }
  function grKey(week, student) { return String(week) + "|" + String(student || "").trim(); }
  function grGet(week, student) { return grAll()[grKey(week, student)] || null; }
  function grPut(rec) {
    var all = grAll();
    rec.saved_at = new Date().toISOString();
    rec.total = Core.furuiScore(rec.score).total;
    rec.level = Core.furuiLevel(rec.score);
    all[grKey(rec.week, rec.student)] = rec;
    writeJSON(GR_KEY, all);
  }
  function grWeeks() {
    var w = {};
    Object.keys(grAll()).forEach(function (k) { w[grAll()[k].week] = 1; });
    return Object.keys(w).sort().reverse();
  }
  /* その生徒の「先週のレベル」＝いまの週より前で一番新しい物 */
  function grPrevLevel(week, student) {
    var rows = Object.keys(grAll()).map(function (k) { return grAll()[k]; })
      .filter(function (r) { return String(r.student).trim() === String(student).trim() && r.week < week && r.level; })
      .sort(function (a, b) { return a.week < b.week ? 1 : -1; });
    return rows.length ? rows[0].level : "";
  }
  /* 3週続けて C（赤信号。SOP 5） */
  function grStuckC(student) {
    var rows = Object.keys(grAll()).map(function (k) { return grAll()[k]; })
      .filter(function (r) { return String(r.student).trim() === String(student).trim() && r.level; })
      .sort(function (a, b) { return a.week < b.week ? 1 : -1; }).slice(0, 3);
    return rows.length === 3 && rows.every(function (r) { return r.level === "C"; });
  }
  /* 採点する相手＝名簿＋すでに記録のある人 */
  function gradeNames() {
    var names = roster("student").slice().concat(ONLINE && ONLINE.students ? ONLINE.students : []);
    var add = function (n) { n = String(n || "").trim(); if (n && names.indexOf(n) < 0) names.push(n); };
    Object.keys(hwAll()).forEach(function (k) { add(hwAll()[k].student); });
    Object.keys(drAll()).forEach(function (k) { add(drAll()[k].student); });
    Object.keys(grAll()).forEach(function (k) { add(grAll()[k].student); });
    return names.sort();
  }

  /* ---------- 問題の記録（学習履歴の材料。生徒に入力させない＝答えた物から自動で残す） ---------- */
  function drAll() { return readJSON(DR_KEY, {}); }
  function drKey(student, day) { return String(day) + "|" + String(student || "").trim(); }
  function drGet(student, day) { return drAll()[drKey(student, day)] || null; }
  function drSave(day, ids, picked, field) {
    var name = studentName();
    if (!name) return null;                      /* 名前が無い時は残さない（誰のか分からないため） */
    var all = drAll();
    var answered = ids.filter(function (id) { return picked[id] != null; });
    var correct = answered.filter(function (id) { return picked[id] === LESSONS.problems[id].answer; });
    var rec = {
      student: name, day: day, field: field || "",
      total: ids.length, answered: answered.length, correct: correct.length,
      wrong_ids: answered.filter(function (id) { return picked[id] !== LESSONS.problems[id].answer; }),
      saved_at: new Date().toISOString()
    };
    all[drKey(name, day)] = rec;
    writeJSON(DR_KEY, all);
    return rec;
  }
  /* 1人分の学習履歴＝やった物を日付順に並べたもの（新しい入力は1つも要らない） */
  function historyOf(name) {
    name = String(name || "").trim();
    var rows = {};
    var put = function (day, k, v, at) {
      var r = rows[day] || (rows[day] = { day: day, at: "" });
      r[k] = v;
      if (at && at > r.at) r.at = at;
    };
    Object.keys(drAll()).forEach(function (k) {
      var r = drAll()[k];
      if (String(r.student).trim() === name) put(r.day, "drill", r, r.saved_at);
    });
    Object.keys(hwAll()).forEach(function (k) {
      var r = hwAll()[k];
      if (String(r.student).trim() === name) put(r.day, "hw", r, r.submitted_at || r.saved_at);
    });
    return Object.keys(rows).map(function (d) { return rows[d]; })
      .sort(function (a, b) { return b.day - a.day; });
  }

  /* ---------- 先生の勉強の記録（この端末に保存する。代表は「代表の確認」で見る） ---------- */
  function tsAll() { return readJSON(TS_KEY, {}); }
  function tsKey(teacher, unit) { return String(unit) + "|" + String(teacher || "").trim(); }
  function tsGet(teacher, unit) { return tsAll()[tsKey(teacher, unit)] || null; }
  function tsPut(rec) {
    var all = tsAll();
    rec.saved_at = new Date().toISOString();
    all[tsKey(rec.teacher, rec.unit)] = rec;
    writeJSON(TS_KEY, all);
  }
  function tsList() {
    var all = tsAll();
    return Object.keys(all).map(function (k) { return all[k]; });
  }
  function tsByTeacher() {
    var by = {};
    tsList().forEach(function (r) {
      var n = String(r.teacher || "").trim();
      if (!n) return;
      (by[n] = by[n] || []).push(r);
    });
    return by;
  }
  function teacherName() { return String(settings().teacher_name || "").trim(); }
  function setTeacherName(v) { var s2 = settings(); s2.teacher_name = String(v || "").trim(); writeJSON(SETTINGS_KEY, s2); }
  /* 名簿（代表が1行1人で入れる）。空でよい＝入れた時だけ「出していない人」が出せる */
  function roster(kind) {
    var r = readJSON(ROSTER_KEY, {});
    return String(r[kind] || "").split("\n").map(function (x) { return x.trim(); })
      .filter(function (x) { return x; });
  }
  function setRoster(kind, text) {
    var r = readJSON(ROSTER_KEY, {});
    r[kind] = String(text || "");
    writeJSON(ROSTER_KEY, r);
  }

  function studentName() { return String(settings().student_name || "").trim(); }
  function setStudentName(v) { var s2 = settings(); s2.student_name = String(v || "").trim(); writeJSON(SETTINGS_KEY, s2); }

  function candidates() { return mergeCandidates(window.OUKA_INTERVIEW_CANDIDATES || [], readJSON(IMPORT_KEY, [])); }
  function findCand(cid) { var l = candidates(); for (var i = 0; i < l.length; i++) if (l[i].candidate_id === cid) return l[i]; return null; }

  /* mode: "full"＝全問 / "short"＝短縮版。面接を始めた時に候補者ごとに記録する。 */
  var qCache = {};
  function questionsFor(c, mode) {
    var k = mode + JSON.stringify(c);
    if (!qCache[k]) {
      var all = buildQuestions(c, BANK);
      qCache[k] = mode === "short" ? shortList(all, BANK) : all;
    }
    return qCache[k];
  }
  function modeOf(c) { var r = getRec(c.candidate_id); return r && r.mode === "short" ? "short" : "full"; }
  function questionsOf(c) { return questionsFor(c, modeOf(c)); }
  function isAdded(c) { return readJSON(IMPORT_KEY, []).some(function (x) { return x.candidate_id === c.candidate_id; }); }

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2);
  }

  function ensureRec(c) {
    return getRec(c.candidate_id) || {
      candidate_id: c.candidate_id, candidate_name: c.name, interview_date: "",
      interview_status: "未実施", mode: "full", current_index: 0, memo: "", answers: {}
    };
  }

  function statusOf(c) {
    var r = getRec(c.candidate_id);
    if (!r) return "未実施";
    if (r.interview_status === "完了") return "完了";
    var any = Object.keys(r.answers || {}).some(function (k) { return r.answers[k].score || r.answers[k].skipped; });
    return any ? "面接中" : "未実施";
  }

  /* score に null を渡すと「飛ばした」として記録する（平均には入れない） */
  function saveScore(c, idx, score) {
    var qs = questionsOf(c), q = qs[idx];
    var rec = ensureRec(c);
    if (!rec.interview_date) rec.interview_date = today();
    if (rec.interview_status === "未実施") rec.interview_status = "面接中";
    rec.candidate_name = c.name;
    rec.answers[q.question_id] = {
      candidate_id: c.candidate_id, candidate_name: c.name, question_id: q.question_id,
      question_text: q.text, category: q.category, score: score,
      interview_date: rec.interview_date, scored_at: new Date().toISOString()
    };
    if (score == null) rec.answers[q.question_id].skipped = true;
    rec.current_index = idx;
    if (stats(qs, rec.answers, BANK).unscored === 0) rec.interview_status = "完了";
    putRec(rec);
  }

  function setIndex(c, idx) {
    var rec = getRec(c.candidate_id);
    if (!rec) return;
    rec.current_index = idx;
    putRec(rec);
  }

  /* ---------- 共通部品 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function fmt(n) { return n == null ? "—" : n.toFixed(2); }
  function go(hash) { if (location.hash === hash) render(); else location.hash = hash; }
  function cHash(c) { return "#/c/" + encodeURIComponent(c.candidate_id); }

  var toastTimer = null;
  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  function openModal(html) {
    modal.innerHTML = '<div class="modal-box" role="dialog" aria-modal="true">' + html +
      '<button class="btn modal-close" data-act="close-modal">閉じる</button></div>';
    modal.hidden = false;
  }
  function closeModal() { modal.hidden = true; modal.innerHTML = ""; }
  function modalOpen() { return !modal.hidden; }

  function showGuide() {
    openModal('<h2>採点基準（会話力だけを見る）</h2><p class="muted">漢字・読み・書き・文法試験は採点しません。</p><dl class="guide">' +
      SCORE_GUIDE.map(function (g) { return "<dt>" + g.score + "</dt><dd>" + esc(g.text) + "</dd>"; }).join("") +
      '</dl><h3>平均点の目安（参考評価）</h3><ul class="levels">' +
      '<li><b>4.50〜5.00</b> 非常に高い会話力</li><li><b>3.80〜4.49</b> 日本での就労会話にかなり対応可能</li>' +
      '<li><b>3.00〜3.79</b> 基本会話可能・弱点研修推奨</li><li><b>2.00〜2.99</b> 企業面接前に会話研修が必要</li>' +
      '<li><b>1.00〜1.99</b> 基礎日本語から再教育</li></ul><p class="muted">採用可否は自動で決めません。最終判断は面接官が行います。</p>');
  }

  function showMemo(c) {
    var rec = ensureRec(c);
    openModal('<h2>面接官メモ <span class="muted">（任意）</span></h2><p class="muted">例：日本在住経験あり／聞き返し多い／介護経験は詳しく説明できた</p>' +
      '<textarea id="memoBox" rows="5" maxlength="500">' + esc(rec.memo || "") + "</textarea>");
    var box = document.getElementById("memoBox");
    box.focus();
    box.addEventListener("input", function () {
      var r = ensureRec(c);
      r.memo = box.value;
      putRec(r);
    });
  }

  /* ---------- OUKA PLATFORM（入口の一覧） ----------
   * 「候補者・面接」だけが中身入り。「生徒・学習」「先生」は入口だけで、中身はこれから入れる。
   * ここに嘘の機能を置かない＝空の入口は「まだ中身がありません」と正直に出す。 */
  var HUBS = {
    student: {
      title: "生徒・学習", icon: "▶",
      items: [
        { key: "today", label: "今日の教材", note: "その日に使う教材（プリント・スライド）がここに並ぶ" },
        { key: "drill", label: "問題", note: "ドリル・小テスト。問題バンクから出す" },
        { key: "homework", label: "宿題", note: "出されている宿題と締切" },
        { key: "media", label: "動画・音声", note: "動画学習シートとシャドーイング用の音声" },
        { key: "emergency", label: "緊急のとき", note: "119・110・#9910などの番号と、電話で言うこと" },
        { key: "speak", label: "声・動画で出す", note: "発音を録音する／はっぴょうの動画を出す" },
        { key: "submit", label: "提出", note: "宿題・作文・録音の提出口" },
        { key: "history", label: "学習履歴", note: "いつ何を勉強したかの記録" },
        { key: "progress", label: "進捗", note: "技能別Level（R/L/W/S/A）と週次の位置" }
      ]
    },
    teacher: {
      title: "先生", icon: "▶",
      items: [
        { key: "today", label: "今日の授業", note: "日次授業指示書（9ステップ）を1日1枚で表示" },
        { key: "materials", label: "教材", note: "その授業で配る教材の一覧" },
        { key: "study", label: "先生の勉強", note: "先生が自分で日本語を勉強する本（N5→N1・雑学・漢字・教え方メモ）" },
        { key: "guide", label: "Teacher Guide", note: "教え方・板書・つまずきへの対応（SOP/教師授業マニュアル を入れる予定）" },
        { key: "assign", label: "宿題を出す", note: "クラス・生徒を選んで宿題を割り当てる" },
        { key: "inbox", label: "提出物確認", note: "誰が出した・出していないかの一覧" },
        { key: "grade", label: "採点", note: "小テスト・作文の採点入力" },
        { key: "progress", label: "生徒進捗", note: "クラス全体と生徒ごとの到達状況" }
      ]
    }
  };

  function renderPlatform() {
    headName.textContent = "";
    var list = candidates();
    var done = list.filter(function (c) { return statusOf(c) === "完了"; }).length;
    var doing = list.filter(function (c) { return statusOf(c) === "面接中"; }).length;
    view.innerHTML =
      '<section class="platform">' +
      fileWarning() +
      '<h1 class="pf-title">OUKA PLATFORM</h1>' +
      (!ONLINE || ONLINE.can.teacher ? '<div class="pf-top"><a class="btn" href="#/check">' +
        (ONLINE && !ONLINE.can.check ? "提出状況（生徒）" : "代表の確認（誰がやっていないか）") + "</a></div>" : "") +
      (LESSONS ? fieldPicker() : "") +
      '<div class="pf-grid">' +
      (ONLINE ? (ONLINE.can.interview
        ? '<div class="pf-card"><h2>候補者・面接</h2><p class="pf-stat pf-empty">面接は、いまは学校のMacの面接アプリで行います（オンライン版は次の段階）。</p></div>'
        : "") : '<div class="pf-card pf-live"><h2>候補者・面接</h2>' +
      '<p class="pf-stat">候補者 ' + list.length + "人　／　面接中 " + doing + "　完了 " + done + "</p>" +
      '<div class="pf-links">' +
      '<a class="btn btn-primary btn-xl" id="pfUpload" href="#/upload">＋ 履歴書をアップロード</a>' +
      '<a class="btn btn-xl" id="pfNew" href="#/new">＋ 新規候補者</a>' +
      '<a class="btn btn-xl" id="pfList" href="#/candidates">候補者一覧・面接</a>' +
      '<a class="btn btn-xl" href="#/results">全結果・評価資料</a>' +
      "</div></div>") +
      Object.keys(HUBS).filter(function (k) { return !ONLINE || ONLINE.can[k]; }).map(function (k) {
        var h = HUBS[k];
        var liveN = h.items.filter(function (it) { return LIVE[k + "/" + it.key] && LESSONS; }).length;
        return '<div class="pf-card' + (liveN ? " pf-live" : "") + '"><h2>' + esc(h.title) + "</h2>" +
          (liveN ? '<p class="pf-stat">' + (currentField().code ? esc(currentField().label) + "コース" : "コース未選択") + "　／　教材 Day1〜" + dayCount() + "　／　今日＝Day " + currentDay() + "</p>"
            : '<p class="pf-stat pf-empty">入口だけ（中身はこれから）</p>') +
          '<div class="pf-links pf-small">' +
          h.items.map(function (it) {
            var live = LIVE[k + "/" + it.key] && LESSONS;
            return '<a class="btn' + (live ? "" : " btn-soon") + '" href="#/' + k + "/" + it.key + '">' + esc(it.label) + (live ? "" : "<small>準備中</small>") + "</a>";
          }).join("") +
          "</div></div>";
      }).join("") +
      "</div>" +
      '<p class="muted small">面接の評価は会話力だけを見ます。参考評価であり、採用可否は面接官が判断します。</p>' +
      "</section>";
  }

  function renderHub(key) {
    var h = HUBS[key];
    headName.textContent = h.title;
    view.innerHTML = '<section class="home"><div class="home-head"><h1>' + esc(h.title) + '</h1>' +
      '<div class="tools"><a class="btn btn-primary" href="#/">OUKA PLATFORM へ</a></div></div>' +
      '<div class="cand-grid">' + h.items.map(function (it) {
        var live = LIVE[key + "/" + it.key] && LESSONS;
        return '<a class="cand" href="#/' + key + "/" + it.key + '" data-item="' + it.key + '"><span class="cand-name">' + esc(it.label) + "</span>" +
          (live ? '<span class="chip st-完了">使える</span>' : '<span class="chip st-未実施">準備中</span>') + "</a>";
      }).join("") + "</div></section>";
  }

  function renderSoon(key, item) {
    var h = HUBS[key] || { title: "", items: [] };
    var it = h.items.filter(function (x) { return x.key === item; })[0] || { label: item, note: "" };
    headName.textContent = h.title + "／" + it.label;
    view.innerHTML = '<section class="start"><div class="start-name"><h1>' + esc(it.label) + "</h1>" +
      '<span class="chip st-未実施">準備中</span></div>' +
      '<div class="soon"><p><b>ここにはまだ中身がありません。</b></p>' +
      "<p>入る予定のもの：" + esc(it.note) + "</p>" +
      "<p class='muted small'>データ（生徒・教材・宿題）を入れると、この画面に出るようになります。" +
      "面接の機能はそのまま使えます。</p></div>" +
      '<div class="start-btns"><a class="btn btn-xl" href="#/' + key + '">' + esc(h.title) + 'の入口へ戻る</a>' +
      '<a class="btn btn-primary btn-xl" href="#/">OUKA PLATFORM へ</a></div></section>';
  }

  /* ---------- 教材（data/lessons.js ＝ 6ヶ月標準教育パッケージ Ver1.0 をそのまま取り込んだもの） ----------
   * 文言は日次授業指示書PDFと一字一句同じ（_tools/教材データを取り込む.py が同じ関数から作る）。
   * ここで教育内容を書き足さない。 */
  var LESSONS = window.OUKA_LESSONS || null;
  var STUDY = window.OUKA_TEACHER_STUDY || null;
  var FIELDS = window.OUKA_FIELDS || { list: [], common_media: [], neutral_categories: [] };
  var VIDEOS = window.OUKA_VIDEOS || { life_nepali: { items: [] }, fields: {} };
  var EMG = window.OUKA_EMERGENCY || null;
  function fieldList() { return (FIELDS.list || []).filter(function (f) { return f.active; }); }
  var NO_FIELD = { code: "", label: "コース未選択", media: [] };
  function currentField() {
    var c = settings().field;
    var l = fieldList();
    for (var i = 0; i < l.length; i++) if (l[i].code === c) return l[i];
    return NO_FIELD;   /* ★勝手に建設にしない。選ぶまで未選択 */
  }
  function setField(code) { var s2 = settings(); s2.field = code; writeJSON(SETTINGS_KEY, s2); }
  function isKensetsu() { return currentField().code === "kensetsu"; }
  function neutralCat(cat) { return (FIELDS.neutral_categories || []).indexOf(cat) >= 0; }
  function fieldPicker() {
    var cur = currentField();
    return '<div class="field-pick' + (cur.code ? "" : " field-pick-need") + '">' +
      "<span class='field-label'>" + (cur.code ? "コース：" : "コースを選んでください →") + "</span>" +
      fieldList().map(function (f) {
        return '<button class="btn btn-field' + (f.code === cur.code ? " btn-primary" : "") + '" data-act="set-field" data-field="' + f.code + '">' + esc(f.label) + "</button>";
      }).join("") + "</div>";
  }
  /* コース未選択のときに、その場で選べる案内を出す（空の画面を出さない） */
  function needField(where) {
    return '<div class="warn"><b>コースが選ばれていません。</b>上の［' +
      fieldList().map(function (f) { return f.label; }).join("］［") + "］から選ぶと、" + where + "がその分野のものに変わります。</div>";
  }
  /* 押したらすぐ動画が出るカード。直リンクが無いものは「行き方」を出す。 */
  function videoCard(v) {
    if (v.own) {
      return '<div class="video-card own"><span class="v-badge own">これから作る</span>' +
        '<span class="v-title">' + esc(v.label) + "</span>" +
        '<span class="v-meta">' + esc(v.org || "") + (v.lang ? "　／　" + esc(v.lang) : "") + "</span>" +
        (v.note ? '<span class="v-note">' + esc(v.note) + "</span>" : "") + "</div>";
    }
    if (v.url) {
      return '<a class="video-card" target="_blank" rel="noopener" href="' + esc(v.url) + '">' +
        '<span class="v-badge">▶ すぐ見る</span><span class="v-title">' + esc(v.label) + "</span>" +
        '<span class="v-meta">' + esc(v.org || "") + (v.lang ? "　／　" + esc(v.lang) : "") + "</span></a>";
    }
    var steps = (v.steps || []).map(function (t, i) { return "<li>" + esc(t) + "</li>"; }).join("");
    return '<div class="video-card steps-card">' +
      '<span class="v-badge way">行き方</span><span class="v-title">' + esc(v.label) + "</span>" +
      '<span class="v-meta">' + esc(v.org || "") + (v.lang ? "　／　" + esc(v.lang) : "") + "</span>" +
      (steps ? "<ol class='v-steps'>" + steps + "</ol>" : "") +
      (v.url_page ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(v.url_page) + '">ページを開く</a>' : "") + "</div>";
  }

  function mediaCard(m) {
    return '<a class="media-card" target="_blank" rel="noopener" href="' + esc(m.url) + '">' +
      '<span class="media-type">' + esc(m.type) + "</span>" +
      '<span class="media-title">' + esc(m.title) + "</span>" +
      '<span class="media-meta">' + esc(m.org) + "　／　" + esc(m.lang) + "</span></a>";
  }
  var LIVE = { "teacher/today": 1, "teacher/materials": 1, "student/today": 1, "student/drill": 1, "student/homework": 1,
    "student/media": 1, "student/emergency": 1, "student/submit": 1, "student/speak": 1, "teacher/inbox": 1,
    "teacher/study": 1, "student/history": 1, "teacher/grade": 1 };
  var MAT_BASE = "materials/";

  function dayCount() { return LESSONS ? LESSONS.days.length : 0; }
  function currentDay() {
    var n = parseInt(settings().current_day, 10);
    return n >= 1 && n <= dayCount() ? n : 1;
  }
  function setCurrentDay(n) { var s = settings(); s.current_day = n; writeJSON(SETTINGS_KEY, s); }
  function dayData(n) { return LESSONS && LESSONS.days[n - 1]; }
  function matInfo(file) {
    var list = (LESSONS && LESSONS.materials) || [];
    for (var i = 0; i < list.length; i++) if (list[i].file === file) return list[i];
    return null;
  }
  function matLink(file, cls) {
    var m = matInfo(file);
    var title = m ? m.no + " " + m.title : file;
    if (!m) return '<span class="muted">' + esc(title) + "（ファイルなし）</span>";
    return '<a class="btn ' + (cls || "") + '" target="_blank" rel="noopener" href="' + MAT_BASE + encodeURIComponent(m.file) + '">' + esc(title) + "</a>";
  }

  function dayNav(role, item, n) {
    var max = dayCount(), cur = currentDay();
    var opts = "";
    for (var i = 1; i <= max; i++) {
      var dd = dayData(i);
      opts += '<option value="' + i + '"' + (i === n ? " selected" : "") + ">Day " + i + (dd.is_test ? "（ふるい）" : "") + (i === cur ? " ← 今日" : "") + "</option>";
    }
    return '<div class="day-nav">' +
      '<a class="btn" id="dayPrev" href="#/' + role + "/" + item + "/" + Math.max(1, n - 1) + '"' + (n <= 1 ? ' aria-disabled="true"' : "") + ">← 前のDay</a>" +
      '<select id="daySel" data-role="' + role + '" data-item="' + item + '">' + opts + "</select>" +
      '<a class="btn" id="dayNext" href="#/' + role + "/" + item + "/" + Math.min(max, n + 1) + '">次のDay →</a>' +
      (role === "teacher" ? (n === cur ? '<span class="chip st-完了">今日のDay</span>' :
        '<button class="btn btn-primary" id="setToday" data-act="set-today" data-day="' + n + '">このDayを「今日」にする</button>') : "") +
      "</div>";
  }

  function noLessons() {
    view.innerHTML = '<section class="start"><div class="soon"><p><b>教材データが入っていません。</b></p>' +
      "<p>パソコンで <code>python3 _tools/教材データを取り込む.py</code> を実行すると入ります。</p></div></section>";
  }

  function kv(k, v) { return "<tr><th>" + k + "</th><td>" + v + "</td></tr>"; }

  /* 先生：今日の授業（日次授業指示書 1日分） */
  function renderTeacherDay(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    headName.textContent = "先生／今日の授業 Day " + n;
    var steps = d.steps.map(function (s, i) {
      return '<div class="step"><span class="step-no">' + (i + 1) + "</span><b>" + esc(s.name) + "</b><div>" + s.text + "</div></div>";
    }).join("");
    var tests = d.tests.map(function (t) { return "<tr><td>" + t.item + "</td><td class='num'>" + esc(t.count) + "</td><td class='num'>" + esc(t.points) + "</td></tr>"; }).join("");
    view.innerHTML = '<section class="lesson">' + dayNav("teacher", "today", n) + fieldPicker() +
      '<div class="lesson-head"><h1>Day ' + d.day + ' <small>Week ' + d.week + (d.is_test ? "　／　週次ふるい（テスト日）" : "") + "</small></h1>" +
      '<span class="chip lv">' + esc(d.level) + "</span></div>" +
      (d.note ? '<div class="warn"><b>' + d.note.title + "</b>　" + d.note.text + "</div>" : "") +
      '<table class="profile lesson-tab">' +
      kv("目標LEVEL", esc(d.level + "　／　" + d.phase)) + kv("みん日", esc(d.lesson)) +
      kv("今日の文法", "<b>" + esc(d.grammar) + "</b>") + kv("今日の語彙", esc(d.vocab)) + kv("今日の漢字", esc(d.kanji)) +
      kv("安全・仕事", "共通仕事：" + esc(d.work) + "<br>安全：" + esc(d.safety) + "<br>" +
        (isKensetsu() || !currentField().code ? esc(d.kensetsu_label) + "：" + esc(d.kensetsu)
          : '<span class="muted">' + esc(d.kensetsu_label) + "：" + esc(d.kensetsu) +
            '</span><br><span class="warn-inline">↑ これは建設の内容。' + esc(currentField().label) +
            'コースでは、この行の代わりに' + (d.day > 62 ? esc(currentField().label) + "の実技" : "日本語の指示で動く訓練（Language Action）") +
            "を行う。" + esc(currentField().label) + "の実技教材はまだ作っていない。</span>")) +
      "</table>" +
      '<h2 class="sec-h">使う物</h2><div class="mat-row">' + d.materials.map(function (f) { return matLink(f); }).join("") + "</div>" +
      '<p class="small">問題バンク：' + d.bank_text + "</p>" +
      '<p class="small">動画：' + (d.video ? '<a target="_blank" rel="noopener" href="' + esc(d.video.url) + '">' + esc(d.video.title) + "</a>" : "この日は動画なし（前回の動画学習シートの未完了分を仕上げる）") + "</p>" +
      '<h2 class="sec-h">授業（9ステップ）</h2>' + steps +
      '<div class="step"><span class="step-no">8</span><b>TEST</b><div><table class="rtable test-tab"><thead><tr><th>項目</th><th>問数</th><th>配点</th></tr></thead><tbody>' + tests +
      "</tbody></table><p class='small'><b>合格点</b>　" + d.total + "</p></div></div>" +
      '<div class="step"><span class="step-no">9</span><b>ACTION</b><div>' + d.action + "</div></div>" +
      '<div class="box"><b>宿題</b>　' + d.homework + "</div>" +
      '<div class="box"><b>不合格ルート</b>　' + d.fail_route + "</div>" +
      '<p class="muted small">出典：6ヶ月標準教育パッケージ Ver1.0（凍結）の日次授業指示書と同じ内容。Day1〜128は標準進度で、暦日とは一致しない。</p>' +
      "</section>";
    bindDaySel();
  }

  /* 先生：教材（PDF一覧） */
  function renderTeacherMaterials() {
    if (!LESSONS) return noLessons();
    headName.textContent = "先生／教材";
    var group = function (who, title) {
      return '<h2 class="sec-h">' + title + '</h2><div class="mat-grid">' + LESSONS.materials.filter(function (m) { return m.for === who; })
        .map(function (m) { return matLink(m.file, "mat-btn"); }).join("") + "</div>";
    };
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>教材</h1>' +
      '<div class="tools"><a class="btn btn-primary" href="#/teacher/today">今日の授業</a></div></div>' +
      group("student", "生徒にも見せる教材") + group("teacher", "先生用（テスト・記録用紙・先生向け説明）") +
      '<p class="muted small">押すとPDFが別のタブで開きます。中身は配布用PDF／教材_第1期 と同じもの（' + esc(LESSONS.source.imported_at) + " 取り込み）。</p></section>";
  }

  /* 先生：先生の勉強（N5→N1。本体のPDFはこのアプリの materials に入っている） */
  var STUDY_BOOKS = [
    { file: "P1_先生の勉強ノート_第1巻_N5.pdf", title: "第1巻", note: "N5前半／A4 26枚・ユニット12・漢字62字・宿題72こ", ready: true },
    { title: "第2巻", note: "N5後半／みん日 L1-25 の残り・自動詞と他動詞の入口", ready: false },
    { title: "第3巻", note: "N4／みん日 L26-50・普通体・受身・敬語の入口", ready: false },
    { title: "第4巻", note: "N3／職場の文書・新聞の見出し", ready: false },
    { title: "第5巻", note: "N2→N1／読解・聴解・語彙1万語", ready: false }
  ];
  var STUDY_ROAD = [
    ["第1段", "N5", "文字・あいさつ・数字・基本文型", "3ヶ月", "桜花の模試 80点"],
    ["第2段", "N4", "みん日 L26-50・敬語の入口", "4ヶ月", "JLPT N4 合格"],
    ["第3段", "N3", "新聞の見出し・職場の文書", "6ヶ月", "JLPT N3 合格"],
    ["第4段", "N2 → N1", "読解・聴解・語彙1万語", "12〜18ヶ月", "JLPT N2 → N1 合格"]
  ];
  var STUDY_WEEK = [
    ["月〜金", "授業の予習で自分の教材を1ユニット進める", "各30分"],
    ["火・木", "みなと／いろどりで聞く・話す", "各45分"],
    ["土", "漢字と雑学（書き取り＋背景を読む）", "90分"],
    ["毎月最終土", "模試（段に合わせたレベル）", "120分"]
  ];
  var STUDY_LINKS = [
    { title: "JFにほんごeラーニング みなと", org: "国際交流基金", url: "https://minato-jf.jp/" },
    { title: "いろどり 生活の日本語", org: "国際交流基金", url: "https://www.irodori.jpf.go.jp/" },
    { title: "まるごとサイト", org: "国際交流基金", url: "https://www.marugoto.org/" },
    { title: "NEWS WEB EASY", org: "NHK", url: "https://www3.nhk.or.jp/news/easy/" }
  ];

  /* ---------- 代表の確認（誰がやっていないかを1枚で見る） ---------- */
  function jdate(v) { return String(v || "").slice(0, 16).replace("T", " "); }

  function checkTeacherRows() {
    var by = tsByTeacher(), total = studyUnits().length;
    var names = Object.keys(by);
    roster("teacher").forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    names.sort();
    return names.map(function (n) {
      var rs = (by[n] || []);
      var sub = rs.filter(function (r) { return r.submitted_at; });
      var scores = sub.map(function (r) { return r.score; }).filter(function (v) { return typeof v === "number"; });
      var last = rs.map(function (r) { return r.submitted_at || r.saved_at || ""; }).sort().pop() || "";
      return {
        name: n, total: total, submitted: sub.length, writing: rs.length - sub.length,
        units: sub.map(function (r) { return r.unit; }).sort(function (a, b) { return a - b; }),
        avg: scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : null,
        hw_done: sub.reduce(function (t, r) { return t + (r.hw || []).filter(function (x) { return x; }).length; }, 0),
        hw_total: sub.reduce(function (t, r) { return t + ((r.hw_items || []).length); }, 0),
        last: last,
        notes: sub.filter(function (r) { return String(r.note || "").trim(); })
      };
    });
  }
  function checkStudentRows() {
    var by = {};
    Object.keys(hwAll()).forEach(function (k) {
      var r = hwAll()[k], n = String(r.student || "").trim();
      if (n) (by[n] = by[n] || []).push(r);
    });
    var names = Object.keys(by);
    Object.keys(drAll()).forEach(function (k) {
      var n = String(drAll()[k].student || "").trim();
      if (n && names.indexOf(n) < 0) names.push(n);
    });
    roster("student").forEach(function (n) { if (names.indexOf(n) < 0) names.push(n); });
    names.sort();
    return names.map(function (n) {
      var rs = by[n] || [];
      var sub = rs.filter(function (r) { return r.submitted_at; });
      var dr = Object.keys(drAll()).map(function (k) { return drAll()[k]; })
        .filter(function (r) { return String(r.student).trim() === n; });
      return {
        name: n, submitted: sub.length, writing: rs.length - sub.length,
        days: sub.map(function (r) { return r.day; }).sort(function (a, b) { return a - b; }),
        q: dr.reduce(function (t, r) { return t + r.answered; }, 0),
        ok: dr.reduce(function (t, r) { return t + r.correct; }, 0),
        last: rs.concat(dr).map(function (r) { return r.submitted_at || r.saved_at || ""; }).sort().pop() || ""
      };
    });
  }

  /* オンライン版：記録はスプレッドシートにある＝そこから読んで出す（この端末の中は見ない）。
     先生には生徒の分だけ、代表・校長には先生の勉強も。書いた文・録音はサーバーに無い。 */
  function renderCheckOnline() {
    headName.textContent = ONLINE.can.check ? "代表の確認" : "提出状況";
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>' + esc(headName.textContent) + "</h1>" +
      '<div class="tools"><a class="btn" href="#/">ホーム</a></div></div><p class="muted">読み込み中…</p></section>';
    ONLINE.api("learn_list", {}).then(function (res) {
      if (route().name !== "check") return;
      if (!res || !res.ok) throw new Error((res && res.error) || "応答なし");
      var by = {};
      var get = function (n) { return by[n] || (by[n] = { name: n, hw: 0, q: 0, ok: 0, days: [], last: "", lv: "", week: "" }); };
      (res.hw || []).forEach(function (r) {
        var x = get(r["生徒"]);
        if (r["状態"] === "提出") x.hw++;
        if (r["提出日時"] > x.last) x.last = r["提出日時"];
      });
      (res.drill || []).forEach(function (r) {
        var x = get(r["生徒"]);
        x.q += Number(r["解いた"]) || 0; x.ok += Number(r["正解"]) || 0;
        if (x.days.indexOf(r.Day) < 0) x.days.push(r.Day);
        if (r["記録日時"] > x.last) x.last = r["記録日時"];
      });
      (res.grade || []).forEach(function (r) {
        var x = get(r["生徒"]);
        if (r["週(金)"] >= x.week) { x.week = r["週(金)"]; x.lv = r["今週"]; }
      });
      (ONLINE.students || []).forEach(get);
      var rows = Object.keys(by).sort().map(function (k) { return by[k]; });
      var zero = rows.filter(function (x) { return !x.hw && !x.q; }).map(function (x) { return x.name; });
      var srows = rows.length ? rows.map(function (x) {
        return "<tr><td><b>" + esc(x.name) + "</b></td><td class='num'>" + x.hw + "</td>" +
          "<td class='num'>" + (x.q ? x.ok + " / " + x.q : "—") + "</td>" +
          "<td>" + (x.days.length ? "Day " + esc(x.days.sort(function (a, b) { return a - b; }).slice(-8).join(", ")) : '<span class="muted">まだ0</span>') + "</td>" +
          "<td>" + (x.lv ? esc(x.week) + "　<b>" + esc(x.lv) + "</b>" : "—") + "</td>" +
          "<td>" + (x.last ? esc(jdate(x.last)) : '<span class="chip st-未実施">記録なし</span>') + "</td></tr>";
      }).join("") : '<tr><td colspan="6" class="muted">まだ記録がありません。</td></tr>';
      var trows = "";
      if (res.study) {
        var tb = {};
        res.study.forEach(function (r) {
          var x = tb[r["先生"]] || (tb[r["先生"]] = { name: r["先生"], sub: 0, units: [], hw: 0, last: "" });
          if (r["状態"] === "提出") { x.sub++; x.units.push(r["ユニット"]); }
          x.hw += Number(r["宿題できた"]) || 0;
          if (r["提出日時"] > x.last) x.last = r["提出日時"];
        });
        trows = Object.keys(tb).sort().map(function (k) {
          var x = tb[k];
          return "<tr><td><b>" + esc(x.name) + "</b></td><td class='num'>" + x.sub + "</td><td>" + esc(x.units.join(", ")) + "</td>" +
            "<td class='num'>" + x.hw + "</td><td>" + (x.last ? esc(jdate(x.last)) : "—") + "</td></tr>";
        }).join("") || '<tr><td colspan="5" class="muted">まだ記録がありません。</td></tr>';
      }
      view.innerHTML = '<section class="lesson"><div class="home-head"><h1>' + esc(headName.textContent) + "</h1>" +
        '<div class="tools"><a class="btn" href="#/">ホーム</a></div></div>' +
        '<div class="box"><b>スプレッドシート「OUKA_会話面接結果」に届いている記録です。</b>' +
        "生徒が問題を解く・宿題を出すと、その場で自動で届きます（送るボタンは要りません）。" +
        "宿題に書いた文と録音は、生徒のスマホの中だけにあります（サーバーには送っていません）。</div>" +
        '<h2 class="sec-h">生徒</h2>' +
        '<table class="rtable"><thead><tr><th>生徒</th><th>宿題提出</th><th>問題 正解/解いた</th><th>やったDay</th><th>週次ふるい（最新）</th><th>最後</th></tr></thead><tbody>' +
        srows + "</tbody></table>" +
        (zero.length ? '<div class="warn">まだ1つもやっていない生徒：<b>' + esc(zero.join("、")) + "</b></div>" : "") +
        (res.study ? '<h2 class="sec-h">先生の勉強（N5→N1）</h2>' +
          '<table class="rtable"><thead><tr><th>先生</th><th>提出ユニット数</th><th>番号</th><th>宿題できた</th><th>最後</th></tr></thead><tbody>' +
          trows + "</tbody></table>" : "") +
        "</section>";
    }).catch(function (err) {
      if (route().name !== "check") return;
      view.innerHTML = '<section class="lesson"><h1>' + esc(headName.textContent) + "</h1>" +
        '<div class="warn">読めませんでした（' + esc(err.message) + "）。電波を確かめて、もう一度開いてください。</div>" +
        '<a class="btn" href="#/">ホーム</a></section>';
    });
  }

  function renderCheck() {
    if (ONLINE) return renderCheckOnline();
    headName.textContent = "代表の確認";
    var T = checkTeacherRows(), S = checkStudentRows();
    var tnames = roster("teacher"), snames = roster("student");
    var bar = function (a, b) {
      var pc = b ? Math.round(a / b * 100) : 0;
      return '<div class="bar-wrap"><div class="bar-in" style="width:' + pc + '%"></div></div><span class="num">' + a + " / " + b + "</span>";
    };
    var trows = T.length ? T.map(function (r) {
      return "<tr><td><b>" + esc(r.name) + "</b></td><td>" + bar(r.submitted, r.total) + "</td>" +
        "<td>" + (r.units.length ? esc(r.units.join(", ")) : '<span class="muted">まだ0</span>') + "</td>" +
        "<td class='num'>" + (r.hw_total ? r.hw_done + " / " + r.hw_total : "—") + "</td>" +
        "<td class='num'>" + (r.avg == null ? "—" : r.avg) + "</td>" +
        "<td>" + (r.last ? esc(jdate(r.last)) : '<span class="chip st-未実施">記録なし</span>') + "</td></tr>";
    }).join("") : '<tr><td colspan="6" class="muted">まだ記録がありません。</td></tr>';
    var notes = [];
    T.forEach(function (r) {
      r.notes.slice(-3).forEach(function (x) {
        notes.push('<div class="hw-card"><div class="hw-head"><b>' + esc(r.name) + "</b>" +
          '<span class="chip st-完了">UNIT ' + esc(x.unit) + "　" + esc(jdate(x.submitted_at)) + "</span></div>" +
          '<div class="hw-ans">' + esc(x.note) + "</div></div>");
      });
    });
    var srows = S.length ? S.map(function (r) {
      return "<tr><td><b>" + esc(r.name) + "</b></td><td class='num'>" + r.submitted + "</td>" +
        "<td class='num'>" + (r.q ? r.ok + " / " + r.q : "—") + "</td>" +
        "<td>" + (r.days.length ? "Day " + esc(r.days.slice(-8).join(", ")) : '<span class="muted">まだ0</span>') + "</td>" +
        "<td>" + (r.last ? esc(jdate(r.last)) : '<span class="chip st-未実施">記録なし</span>') + "</td></tr>";
    }).join("") : '<tr><td colspan="5" class="muted">まだ提出がありません。</td></tr>';
    var zeroT = T.filter(function (r) { return !r.submitted; }).map(function (r) { return r.name; });
    var zeroS = S.filter(function (r) { return !r.submitted; }).map(function (r) { return r.name; });
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>代表の確認</h1>' +
      '<div class="tools">' +
      (SYNC_ON ? '<button class="btn btn-primary" data-act="study-send">スプレッドシートへ送る</button>' : "") +
      '<button class="btn" data-act="check-export">CSVで書き出す</button>' +
      '<a class="btn" href="#/">ホーム</a></div></div>' +
      (SYNC_ON
        ? '<div class="box"><b>この画面に出るのは、この端末の中にある記録です。</b>' +
          '<b>「スプレッドシートへ送る」</b>を押すと、スプレッドシート「OUKA_会話面接結果」の' +
          '<b>先生の勉強／宿題／問題</b>の3つのタブに入ります（同じ人・同じ番号は上書き）。' +
          '送るのは<b>やったかどうかと数だけ</b>です。宿題に書いた文・録音・動画は送りません。</div>'
        : '<div class="box"><b>この画面に出るのは、この端末（このブラウザ）の中にある記録だけです。</b>' +
          '送信の設定（config.local.js）がこのパソコンにありません。CSVで書き出して渡してください。</div>') +
      '<h2 class="sec-h">先生の勉強（N5→N1）</h2>' +
      '<table class="rtable"><thead><tr><th>先生</th><th>提出したユニット</th><th>番号</th><th>宿題</th><th>平均点</th><th>最後</th></tr></thead><tbody>' +
      trows + "</tbody></table>" +
      (zeroT.length ? '<div class="warn">まだ1つも出していない先生：<b>' + esc(zeroT.join("、")) + "</b></div>" : "") +
      (notes.length ? '<h2 class="sec-h">先生が書いた「わからない所」（新しい順に3つずつ）</h2>' + notes.join("") : "") +
      '<h2 class="sec-h">生徒の宿題</h2>' +
      '<table class="rtable"><thead><tr><th>生徒</th><th>宿題提出</th><th>問題 正解/解いた</th><th>出したDay</th><th>最後</th></tr></thead><tbody>' +
      srows + "</tbody></table>" +
      (zeroS.length ? '<div class="warn">まだ1つも出していない生徒：<b>' + esc(zeroS.join("、")) + "</b></div>" : "") +
      '<h2 class="sec-h">名簿（入れると「出していない人」が出ます）</h2>' +
      '<div class="two-col">' +
      '<label class="ts-row ts-note">先生の名前（1行に1人）<textarea id="rosterT" rows="4" placeholder="MADHU&#10;SHANTI">' + esc(tnames.join("\n")) + "</textarea></label>" +
      '<label class="ts-row ts-note">生徒の名前（1行に1人）<textarea id="rosterS" rows="4" placeholder="SITA RAI&#10;RAM THAPA">' + esc(snames.join("\n")) + "</textarea></label>" +
      "</div>" +
      '<div class="start-btns"><button class="btn btn-primary btn-xl" data-act="roster-save">名簿を保存</button></div>' +
      '<p class="muted small">名簿はこの端末に保存されます。School OS の名簿とはつながっていません。</p>' +
      "</section>";
  }

  /* ---------- 学習の記録をスプレッドシートへ送る（2026-09-24） ----------
   * 面接と同じ口・同じ合言葉。School OS には触れない。
   * 送るのは「やったかどうかと数」だけ＝宿題に書いた文・録音・動画は送らない。 */
  function studyRecords() {
    var out = [];
    tsList().forEach(function (r) {
      if (!String(r.teacher || "").trim()) return;
      out.push({ type: "study", who: r.teacher, no: r.unit, title: r.title || "",
        check: r.check || [], hw: r.hw || [], score: r.score,
        note: r.note || "", submitted_at: r.submitted_at || "", saved_at: r.saved_at || "" });
    });
    var all = hwAll();
    Object.keys(all).forEach(function (k) {
      var r = all[k];
      if (!String(r.student || "").trim()) return;
      var written = Object.keys(r.answers || {}).filter(function (i) { return String(r.answers[i]).trim(); }).length;
      out.push({ type: "hw", who: r.student, no: r.day, written: written,
        questions: (r.questions || []).length,
        submitted_at: r.submitted_at || "", saved_at: r.saved_at || "" });
    });
    var dall = drAll();
    Object.keys(dall).forEach(function (k) {
      var r = dall[k];
      if (!String(r.student || "").trim()) return;
      out.push({ type: "drill", who: r.student, no: r.day, field: r.field || "",
        answered: r.answered, correct: r.correct, total: r.total, saved_at: r.saved_at || "" });
    });
    var gall = grAll();
    Object.keys(gall).forEach(function (k) {
      var r = gall[k];
      if (!String(r.student || "").trim()) return;
      out.push({ type: "grade", who: r.student, no: 0, week: r.week,
        score: r.score || {}, obs: r.obs || {}, total: r.total,
        level: r.level || "", prev: grPrevLevel(r.week, r.student),
        note: r.note || "", saved_at: r.saved_at || "" });
    });
    return out;
  }

  function studySend(btn) {
    if (!SYNC_ON) { toast("送信の設定がありません（config.local.js）"); return; }
    var recs = studyRecords();
    if (!recs.length) { toast("送る記録がありません"); return; }
    if (btn) { btn.disabled = true; btn.textContent = "送っています…"; }
    var done = 0, chunks = [];
    for (var i = 0; i < recs.length; i += 200) chunks.push(recs.slice(i, i + 200));
    var step = function (i) {
      if (i >= chunks.length) {
        toast(done + " 件を送りました");
        render();
        return;
      }
      fetch(CONFIG.sync_url, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ token: CONFIG.sync_token, kind: "study", records: chunks[i] })
      }).then(function (res) { return res.json(); }).then(function (out) {
        if (!out || !out.ok) throw new Error((out && out.error) || "応答なし");
        done += chunks[i].length;
        step(i + 1);
      }).catch(function (err) {
        toast("送れませんでした（" + err.message + "）。記録はこのパソコンに残っています");
        if (btn) { btn.disabled = false; btn.textContent = "スプレッドシートへ送る"; }
      });
    };
    step(0);
  }

  function checkExport() {
    var lines = ["kind,name,unit_or_day,title,state,score,note,submitted_at"];
    tsList().forEach(function (r) {
      var hd = (r.hw || []).filter(function (x) { return x; }).length;
      lines.push(["先生の勉強", r.teacher, r.unit,
        (r.title || "") + "（宿題 " + hd + " / " + ((r.hw_items || []).length) + "）",
        r.submitted_at ? "提出" : "書きかけ",
        r.score == null ? "" : r.score, r.note || "", r.submitted_at || r.saved_at || ""].map(csvCell).join(","));
    });
    var all = hwAll();
    Object.keys(all).forEach(function (k) {
      var r = all[k];
      var w = Object.keys(r.answers || {}).filter(function (i) { return String(r.answers[i]).trim(); }).length;
      lines.push(["宿題", r.student, r.day, "書いた " + w + " / " + ((r.questions || []).length),
        r.submitted_at ? "提出" : "書きかけ", "", "", r.submitted_at || r.saved_at || ""].map(csvCell).join(","));
    });
    var dall = drAll();
    Object.keys(dall).forEach(function (k) {
      var r = dall[k];
      lines.push(["問題", r.student, r.day, "正解 " + r.correct + " / 解いた " + r.answered + "（全" + r.total + "問）",
        "", "", "", r.saved_at || ""].map(csvCell).join(","));
    });
    if (lines.length === 1) { toast("書き出すものがありません"); return; }
    var blob = new Blob(["﻿" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "OUKA_提出状況_" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    toast("CSVに書き出しました（" + (lines.length - 1) + "行）");
  }

  /* 先生の勉強：ユニットの一覧（画面で読める＋やった記録が残る） */
  function studyUnits() { return (STUDY && STUDY.units) || []; }
  function studyUnit(n) {
    var us = studyUnits();
    for (var i = 0; i < us.length; i++) if (us[i].no === n) return us[i];
    return null;
  }
  function tsState(rec) {
    if (!rec) return "";
    if (rec.submitted_at) return "提出";
    return "書きかけ";
  }
  function studyUnitsBlock() {
    var us = studyUnits();
    if (!us.length) {
      return '<h2 class="sec-h">画面で読む</h2><div class="soon"><p>まだ中身がありません。</p>' +
        '<p class="muted small">data/teacher_study.js がありません。' +
        '<b>python3 配布用PDF/P_先生の勉強/_tools/先生の勉強ブック出力.py</b> で作られます。</p></div>';
    }
    var name = teacherName();
    var mine = us.map(function (u) { return name ? tsGet(name, u.no) : null; });
    var done = mine.filter(function (r) { return r && r.submitted_at; }).length;
    var rules = (STUDY.kanji_rules_r || STUDY.kanji_rules || []).map(function (t) { return "<li>" + t + "</li>"; }).join("");
    var w20 = (STUDY.source.write20 || []).map(function (c) { return '<span class="w20">' + esc(c) + "</span>"; }).join("");
    return (rules ?
      '<h2 class="sec-h">漢字の はじめかた</h2>' +
      '<div class="box"><b>漢字は やめません。</b>生徒に N4（漢字 300字ぐらい）を 教えます。' +
      '登録日本語教員の 試験も 日本語です。<b>でも ぜんぶ 同じように やりません。</b>' +
      '<ol class="kj-rules">' + rules + "</ol>" +
      '<div class="w20-lab">書けるように する 20字</div><div class="w20row">' + w20 + "</div></div>" : "") +
      '<h2 class="sec-h">画面で読む（読んだら記録が残ります）</h2>' +
      '<div class="hw-name"><label>先生の名前<input id="tsName" value="' + esc(name) + '" placeholder="例：MADHU" autocomplete="off"></label>' +
      '<span class="muted small">名前を入れると、どこまで進んだかが残ります。</span></div>' +
      (name ? '<p class="small">提出ずみ <b>' + done + " / " + us.length + "</b> ユニット　／　宿題 <b>" +
        mine.reduce(function (t, r) { return t + ((r && r.hw) || []).filter(function (x) { return x; }).length; }, 0) +
        "</b> こ できた</p>" : '<div class="warn">名前を入れてから始めてください。</div>') +
      '<div class="mat-grid">' + us.map(function (u, i) {
        var st = tsState(mine[i]);
        return '<a class="btn mat-btn" href="#/teacher/study/' + u.no + '">' +
          "UNIT " + u.no + "　" + esc(u.title) +
          "<small>" + esc(u.sub) + (st ? "／" + st : "") + "</small></a>";
      }).join("") + "</div>";
  }

  /* 先生の勉強：1ユニットを読む＋記録する＋提出する */
  function renderTeacherStudyUnit(n) {
    var u = studyUnit(n);
    if (!u) { go("#/teacher/study"); return; }
    var name = teacherName();
    var rec = name ? tsGet(name, n) : null;
    var done = rec && rec.submitted_at;
    var us = studyUnits();
    headName.textContent = "先生／勉強 UNIT " + n;
    var nav = '<div class="day-nav">' +
      (n > 1 ? '<a class="btn btn-sm" href="#/teacher/study/' + (n - 1) + '">← 前</a>' : '<span class="btn btn-sm btn-soon">← 前</span>') +
      '<a class="btn btn-sm" href="#/teacher/study">一覧</a>' +
      (n < us.length ? '<a class="btn btn-sm" href="#/teacher/study/' + (n + 1) + '">次 →</a>' : '<span class="btn btn-sm btn-soon">次 →</span>') +
      "</div>";
    var kot = u.kotoba.map(function (k) { return "<b>" + esc(k.w) + "</b>" + (k.mean ? "（" + esc(k.mean) + "）" : ""); }).join("　");
    var bun = u.bunpou.map(function (b) { return "<li><b>" + esc(b.pattern) + '</b>　<span class="muted">' + esc(b.example) + "</span></li>"; }).join("");
    var kj = u.kanji.map(function (k) {
      return '<tr><td class="kj">' + esc(k.c) + (k.write ? '<span class="wbadge">書く</span>' : "") +
        '</td><td class="en3">' + esc(k.en || "") + "</td><td><b>" + esc(k.kun) + "</b></td>" +
        '<td class="on">' + esc(k.on) + "</td><td class='num'>" + esc(k.strokes || "") + "</td><td>" +
        (k.origin_r || k.origin) + "</td><td>" + esc(k.words) + "</td></tr>";
    }).join("");
    var osh = (u.oshie_r || u.oshie).map(function (t) { return "<li>" + t + "</li>"; }).join("");
    var chkTexts = u.check_r || u.check;
    var chk = u.check.map(function (t, i) {
      var on = rec && rec.check && rec.check[i];
      return '<label class="ts-chk"><input type="checkbox" class="ts-c" data-i="' + i + '"' +
        (on ? " checked" : "") + (done ? " disabled" : "") + "> " + chkTexts[i] + "</label>";
    }).join("");
    var hwItems = u.shukudai || [];
    var hwTexts = u.shukudai_r || hwItems;
    var hwBox = hwItems.map(function (t, i) {
      var on = rec && rec.hw && rec.hw[i];
      return '<label class="ts-chk ts-hw"><input type="checkbox" class="ts-h" data-i="' + i + '"' +
        (on ? " checked" : "") + (done ? " disabled" : "") + "> " + hwTexts[i] + "</label>";
    }).join("");
    view.innerHTML = '<section class="lesson">' + nav +
      '<div class="lesson-head"><h1>UNIT ' + u.no + "　" + (u.title_r || esc(u.title)) + "</h1>" +
      (done ? '<span class="chip st-完了">提出しました</span>' : (rec ? '<span class="chip st-面接中">書きかけ</span>' : "")) + "</div>" +
      '<p class="muted small">' + esc(u.sub) + "</p>" +
      '<div class="sec-box"><h2 class="sec-h">① ことば</h2><p class="small">' + kot + "</p></div>" +
      '<div class="sec-box"><h2 class="sec-h">① 文法（この回で言えるようにする形）</h2><ul class="small">' + bun + "</ul></div>" +
      '<div class="sec-box zat"><h2 class="sec-h">② 雑学 ― ' + (u.zatsugaku.title_r || esc(u.zatsugaku.title)) + "</h2>" +
      '<div class="easy"><div class="easy-t">やさしい日本語</div><p>' + (u.easy_r || esc(u.easy || "")) + "</p>" +
      '<p class="en2">' + esc(u.en || "") + "</p></div>" +
      '<details class="kuwa"><summary>くわしく（あとで 読む）</summary><p class="small">' +
      (u.zatsugaku.body_r || u.zatsugaku.body) + "</p></details></div>" +
      '<div class="sec-box"><h2 class="sec-h">③ 漢字</h2>' +
      '<p class="kj-rule">おぼえるのは <b>「くん」と「意味」</b>だけ。<b>「おん」は あとで</b>。' +
      '<b class="wtext">書く</b> の 字は 書けるように、ほかは <b>読めれば いい</b>。' +
      '<a href="#/teacher/study">漢字の はじめかた →</a></p>' +
      '<table class="rtable"><thead><tr><th>字</th><th>意味</th><th>くん</th><th>おん</th><th>画</th><th>成り立ち</th><th>語例</th></tr></thead><tbody>' +
      kj + "</tbody></table></div>" +
      '<div class="sec-box"><h2 class="sec-h">④ 教え方メモ（生徒に教えるとき）</h2><ul class="small">' + osh + "</ul></div>" +
      '<h2 class="sec-h">やったことを書く（これが提出になります）</h2>' +
      (name ? "" : '<div class="warn">「一覧」で先生の名前を入れてから書いてください。</div>') +
      '<div class="ts-form">' +
      '<div class="ts-lab">自分の確認</div><div class="ts-chks">' + chk + "</div>" +
      (hwBox ? '<div class="ts-lab">宿題　つぎの じゅぎょうまでに やる</div><div class="ts-chks">' + hwBox + "</div>" : "") +
      '<label class="ts-row">自分のテストの点（100点満点）<input id="tsScore" type="number" min="0" max="100" value="' +
      esc(rec && rec.score != null ? rec.score : "") + '"' + (done ? " readonly" : "") + "></label>" +
      '<label class="ts-row ts-note">書いた文・わからなかった所<textarea id="tsNote" rows="4" placeholder="例：「は」と「が」がまだ分かりません。作った文を3つ書く。"' +
      (done ? " readonly" : "") + ">" + esc(rec && rec.note ? rec.note : "") + "</textarea></label></div>" +
      '<div class="start-btns">' +
      (done ? '<button class="btn btn-xl" data-act="ts-edit">直す</button>'
            : '<button class="btn btn-primary btn-xl" data-act="ts-submit">提出する</button>') +
      '<button class="btn btn-xl" data-act="ts-save">とちゅうで保存</button>' +
      '<a class="btn btn-xl" target="_blank" rel="noopener" href="' + MAT_BASE + encodeURIComponent(STUDY.source.pdf) + '">紙のPDF</a></div>' +
      (done ? '<p class="muted small">提出 ' + esc(String(rec.submitted_at).slice(0, 16).replace("T", " ")) + "</p>" : "") +
      '<p class="muted small">保存されるのは<b>この端末の中だけ</b>です。代表に見せるときは「代表の確認」でCSVに書き出します。</p>' +
      "</section>";
    bindTeacherName();
  }

  function tsCollect(n) {
    var u = studyUnit(n);
    var check = [];
    Array.prototype.forEach.call(document.querySelectorAll(".ts-c"), function (el) {
      check[parseInt(el.getAttribute("data-i"), 10)] = el.checked;
    });
    var hw = [];
    Array.prototype.forEach.call(document.querySelectorAll(".ts-h"), function (el) {
      hw[parseInt(el.getAttribute("data-i"), 10)] = el.checked;
    });
    var sc = document.getElementById("tsScore");
    var nt = document.getElementById("tsNote");
    var old = tsGet(teacherName(), n) || {};
    return {
      teacher: teacherName(), unit: n, title: u.title,
      check: check, items: u.check,
      hw: hw, hw_items: u.shukudai || [],
      score: sc && String(sc.value).trim() !== "" ? Math.max(0, Math.min(100, parseInt(sc.value, 10) || 0)) : null,
      note: nt ? nt.value : "",
      submitted_at: old.submitted_at || ""
    };
  }
  function tsSave(n, tell) {
    if (!teacherName()) { toast("先に名前を入れてください"); return; }
    tsPut(tsCollect(n));
    if (tell) toast("保存しました");
  }
  function tsSubmit(n) {
    if (!teacherName()) { toast("先に名前を入れてください"); return; }
    var rec = tsCollect(n);
    var ok = (rec.check || []).filter(function (x) { return x; }).length +
      (rec.hw || []).filter(function (x) { return x; }).length;
    if (!ok && !String(rec.note).trim() && rec.score == null) { toast("まだ何も していません"); return; }
    rec.submitted_at = new Date().toISOString();
    tsPut(rec);
    toast("提出しました");
    render();
  }

  function renderTeacherStudy() {
    headName.textContent = "先生／先生の勉強";
    var books = STUDY_BOOKS.map(function (b) {
      return b.ready
        ? '<a class="btn mat-btn" target="_blank" rel="noopener" href="' + MAT_BASE + encodeURIComponent(b.file) + '">' +
            esc(b.title) + "<small>" + esc(b.note) + "</small></a>"
        : '<span class="btn mat-btn btn-soon">' + esc(b.title) + "<small>" + esc(b.note) + "／まだありません</small></span>";
    }).join("");
    var road = STUDY_ROAD.map(function (r) {
      return "<tr><td>" + esc(r[0]) + "</td><td><b>" + esc(r[1]) + "</b>　" + esc(r[2]) + "</td><td>" + esc(r[3]) + "</td><td>" + esc(r[4]) + "</td></tr>";
    }).join("");
    var week = STUDY_WEEK.map(function (r) {
      return "<tr><td>" + esc(r[0]) + "</td><td>" + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>";
    }).join("");
    var links = STUDY_LINKS.map(function (l) {
      return '<a class="btn" target="_blank" rel="noopener" href="' + esc(l.url) + '">' + esc(l.title) + "<small>" + esc(l.org) + "</small></a>";
    }).join("");
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>先生の勉強</h1>' +
      '<div class="tools"><a class="btn" href="#/teacher">先生トップ</a></div></div>' +
      '<div class="big-card"><div class="big-k">この本は</div><div class="big-v">生徒に教えるための本ではありません。先生が自分で勉強するための本です。</div></div>' +
      '<p class="small">1ユニット＝A4 2枚。<b>1枚目＝よむ</b>（ことば・文法／雑学／漢字）、' +
      '<b>2枚目＝やる</b>（教え方メモ／自分の確認／<b>宿題6つ</b>／書く練習）。</p>' +
      '<h2 class="sec-h">本（押すとPDFが開きます）</h2><div class="mat-grid">' + books + "</div>" +
      studyUnitsBlock() +
      '<h2 class="sec-h">N5 から N1 までの道のり</h2>' +
      '<table class="rtable"><thead><tr><th>段</th><th>目標</th><th>目安</th><th>出口の確認</th></tr></thead><tbody>' + road + "</tbody></table>" +
      '<p class="small">まじめにやって <b>2〜3年</b>です。「1年でN1」とは言いません。ただし<b>N4までは早くできます</b>。生徒用のDay1〜128を教えながら、自分も復習できるからです。</p>' +
      '<h2 class="sec-h">1週間の回し方</h2>' +
      '<table class="rtable"><thead><tr><th>いつ</th><th>やること</th><th>時間</th></tr></thead><tbody>' + week + "</tbody></table>" +
      '<h2 class="sec-h">無料で使えるもの（公式）</h2><div class="mat-grid">' + links + "</div>" +
      '<h2 class="sec-h">その先 ― 登録日本語教員（日本の国家資格）</h2>' +
      '<table class="profile">' +
      kv("受験資格", "年齢・国籍・学歴・母語を問いません。だれでも受験できます") +
      kv("試験", "基礎試験と応用試験。日本語で行われます") +
      kv("会場", "<b>日本国内のみ</b>（全国9地域）。海外会場は確認できていません") +
      kv("資格になる条件", "試験の合格に加えて、<b>日本国内の登録実践研修機関で実践研修を修了</b>する必要があります") +
      "</table>" +
      '<div class="box"><b>正直に言います。</b>ネパールにいるままでは、この資格は取れません。受験と実践研修のために日本へ行く必要があります（日程・渡航費・滞在費）。' +
      '応用試験は日本語で行われ、N1に近い読解と聴解の力が必要です。だから<b>まずN1を目指すのが正しい順番</b>です。<br>' +
      '費用が動くことは、このアプリでは決めません（かのんの許可→代表の承認）。<b>ここが決めるのは勉強の道すじだけです。</b></div>' +
      '<p class="muted small">設計の正本＝SOP/先生の学習OS_N5からN1.md ／ 本体＝配布用PDF/P_先生の勉強/</p>' +
      "</section>";
    bindTeacherName();
  }

  /* 先生の名前を入れたら覚える（一覧・ユニットのどちらの画面でも使う） */
  function bindTeacherName() {
    var nm = document.getElementById("tsName");
    if (!nm) return;
    nm.addEventListener("change", function () { setTeacherName(nm.value); render(); });
  }

  /* 生徒：今日の教材 */
  function renderStudentToday(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    headName.textContent = "生徒／今日の教材 Day " + n;
    var mats = d.materials.filter(function (f) { var m = matInfo(f); return m && m.for === "student"; });
    view.innerHTML = '<section class="lesson">' + dayNav("student", "today", n) +
      '<div class="lesson-head"><h1>Day ' + d.day + (d.is_test ? " <small>今日は週次ふるい（テスト）</small>" : "") + "</h1></div>" +
      '<div class="big-card"><div class="big-k">今日の文型</div><div class="big-v">' + esc(d.focus) + "</div></div>" +
      '<table class="profile lesson-tab">' + kv("教科書", esc(d.lesson) + "　練習A・B") + kv("ことば", esc(d.vocab)) + kv("漢字", esc(d.kanji)) +
      kv("仕事", esc(d.work)) + kv("安全", esc(d.safety)) + "</table>" +
      '<h2 class="sec-h">今日使うプリント</h2><div class="mat-row">' + (mats.length ? mats.map(function (f) { return matLink(f); }).join("") : '<span class="muted">この日に配るプリントはありません（先生の指示を聞く）</span>') + "</div>" +
      '<div class="start-btns"><a class="btn btn-primary btn-xl" href="#/student/drill/' + n + '">問題をやる</a>' +
      '<a class="btn btn-xl" href="#/student/media/' + n + '">動画</a><a class="btn btn-xl" href="#/student/homework/' + n + '">宿題</a></div>' +
      "</section>";
    bindDaySel();
  }

  /* 生徒：宿題（書いて出す。紙で出したい人はPDFを印刷する） */
  function renderStudentHomework(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    var name = studentName();
    var items = splitHomework(d.homework);
    var rec = name ? hwGet(name, n) : null;
    var done = rec && rec.submitted_at;
    headName.textContent = "生徒／宿題 Day " + n;
    view.innerHTML = '<section class="lesson">' + dayNav("student", "homework", n) +
      '<div class="lesson-head"><h1>Day ' + d.day + " の宿題</h1>" +
      (done ? '<span class="chip st-完了">提出しました</span>' : (rec ? '<span class="chip st-面接中">書きかけ</span>' : "")) + "</div>" +
      '<div class="hw-name"><label>名前（なまえ）<input id="hwName" value="' + esc(name) + '" placeholder="例：SITA RAI" autocomplete="off"></label>' +
      '<span class="muted small">名前を入れると、書いたものが保存されます。</span></div>' +
      (name ? "" : '<div class="warn">名前を入れてから書いてください。</div>') +
      '<div class="hw-list">' + items.map(function (it, i) {
        var val = rec && rec.answers ? (rec.answers[i] || "") : "";
        return '<div class="hw-item"><div class="hw-q"><span class="hw-no">' + esc(it.no) + "</span>" + esc(it.text) + "</div>" +
          '<textarea class="hw-a" data-i="' + i + '" rows="3" placeholder="ここに書く"' + (done ? " readonly" : "") + ">" + esc(val) + "</textarea></div>";
      }).join("") + "</div>" +
      '<div class="box"><b>ACTION（明日の朝礼で確認）</b>　' + d.action + "</div>" +
      '<div class="start-btns">' +
      (done ? '<button class="btn btn-xl" id="hwEdit" data-act="hw-edit">直す</button>'
            : '<button class="btn btn-primary btn-xl" id="hwSubmit" data-act="hw-submit">提出する</button>') +
      '<button class="btn btn-xl" id="hwSave" data-act="hw-save">とちゅうで保存</button>' +
      '<a class="btn btn-xl" href="#/student/submit">自分の提出を見る</a></div>' +
      (done ? '<p class="muted small">提出 ' + esc(String(rec.submitted_at).slice(0, 16).replace("T", " ")) + "</p>" : "") +
      '<h2 class="sec-h">紙で出す人</h2><div class="mat-row">' + matLink("24_なぞり書き_ひらがなカタカナ.pdf") + matLink("27_動画学習シート.pdf") + "</div>" +
      '<p class="muted small">提出はこの端末に保存されます。先生は「先生 → 提出物確認」で見られます。' +
      "ほかの端末やスプレッドシートへ送る仕組みは、まだ入れていません。</p>" +
      "</section>";
    bindDaySel();
    var nm = document.getElementById("hwName");
    nm.addEventListener("change", function () { setStudentName(nm.value); render(); });
    Array.prototype.forEach.call(document.querySelectorAll(".hw-a"), function (ta) {
      ta.addEventListener("input", function () { hwSave(n, false); });
    });
  }

  function hwCollect(day) {
    var name = studentName();
    var d = dayData(day);
    var answers = {};
    Array.prototype.forEach.call(document.querySelectorAll(".hw-a"), function (ta) {
      answers[ta.getAttribute("data-i")] = ta.value;
    });
    var old = hwGet(name, day) || {};
    return {
      student: name, day: day, field: currentField().code || "", answers: answers,
      questions: splitHomework(d.homework).map(function (x) { return x.no + " " + x.text; }),
      submitted_at: old.submitted_at || ""
    };
  }

  function hwSave(day, tell) {
    var name = studentName();
    if (!name) { if (tell) toast("先に名前を入れてください"); return false; }
    hwPut(hwCollect(day));
    if (tell) toast("保存しました");
    return true;
  }

  function hwSubmit(day) {
    var name = studentName();
    if (!name) { toast("先に名前を入れてください"); return; }
    var rec = hwCollect(day);
    var written = Object.keys(rec.answers).filter(function (k) { return String(rec.answers[k]).trim(); }).length;
    if (!written) { toast("まだ何も書いていません"); return; }
    if (written < rec.questions.length && !confirm("書いていない欄があります。このまま提出しますか？")) return;
    rec.submitted_at = new Date().toISOString();
    hwPut(rec);
    toast("提出しました");
    render();
  }

  /* 生徒：声・動画で提出（発音練習と60秒発表） */
  var REC = { rec: null, chunks: [], stream: null, startedAt: 0, timer: null, kind: "audio", phrase: "" };

  function speakPhrases(d) {
    var out = [{ label: "今日の文型で1文", text: d.focus }];
    if (d.vocab) out.push({ label: "今日のことば", text: d.vocab });
    if (d.work) out.push({ label: "仕事のことば", text: d.work });
    out.push({ label: "60秒はっぴょう（PRESENT）", text: "今日の内容を " + (d.day > 62 ? "60秒" : "30秒") + " で話す（原稿を見ない）" });
    return out;
  }

  function renderStudentSpeak(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    var name = studentName();
    headName.textContent = "生徒／声・動画 Day " + n;
    view.innerHTML = '<section class="lesson">' + dayNav("student", "speak", n) +
      '<div class="lesson-head"><h1>声・動画で出す</h1><span class="chip st-面接中">この端末に保存</span></div>' +
      '<div class="hw-name"><label>名前（なまえ）<input id="hwName" value="' + esc(name) + '" placeholder="例：SITA RAI" autocomplete="off"></label></div>' +
      (name ? "" : '<div class="warn">名前を入れてから録音してください。</div>') +
      '<h2 class="sec-h">声を録る（言ってみる）</h2>' +
      '<div class="rec-list">' + speakPhrases(d).map(function (p, i) {
        return '<div class="rec-item"><div class="rec-q"><span class="rec-k">' + esc(p.label) + "</span>" + esc(p.text) + "</div>" +
          '<button class="btn btn-primary rec-btn" data-act="rec-start" data-kind="audio" data-i="' + i + '">● 録音する</button></div>';
      }).join("") + "</div>" +
      '<h2 class="sec-h">動画で出す</h2>' +
      '<div class="rec-item"><div class="rec-q"><span class="rec-k">はっぴょうの動画</span>' +
      "スマホやタブレットのカメラで撮って、ここから出します（60秒まで）。</div>" +
      '<label class="btn btn-primary rec-btn">動画をえらぶ／撮る<input type="file" id="vidIn" accept="video/*" capture="user" hidden></label></div>' +
      '<div id="recNow"></div>' +
      '<h2 class="sec-h">出したもの</h2><div id="mediaList" class="muted">読み込み中…</div>' +
      '<p class="muted small">声と動画はこの端末の中だけに保存されます。先生は「先生 → 提出物確認」で聞けます。' +
      "端末がいっぱいにならないよう、確認した分は消してください。</p></section>";
    bindDaySel();
    var nm = document.getElementById("hwName");
    nm.addEventListener("change", function () { setStudentName(nm.value); render(); });
    document.getElementById("vidIn").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (!studentName()) { toast("先に名前を入れてください"); return; }
      if (f.size > 60 * 1048576) { toast("動画が大きすぎます（60MBまで）。短く撮ってください"); return; }
      saveMedia({ kind: "video", phrase: "はっぴょうの動画", blob: f, mime: f.type || "video/mp4", day: n });
    });
    refreshMediaList(n);
  }

  function saveMedia(o) {
    var item = {
      id: (o.kind === "video" ? "V" : "A") + Date.now() + "-" + Math.random().toString(16).slice(2, 8),
      student: studentName(), day: o.day, kind: o.kind, phrase: o.phrase,
      blob: o.blob, mime: o.mime, size: o.blob.size, created_at: new Date().toISOString(), submitted_at: new Date().toISOString()
    };
    return mediaPut(item).then(function () {
      toast((o.kind === "video" ? "動画" : "声") + "を出しました（" + mb(item.size) + "）");
      refreshMediaList(o.day);
    }).catch(function (e) { toast("保存できません：" + e.message); });
  }

  function refreshMediaList(day) {
    var box = document.getElementById("mediaList");
    if (!box) return;
    mediaAll().then(function (all) {
      var mine = all.filter(function (x) { return x.student === studentName() && String(x.day) === String(day); });
      if (!mine.length) { box.className = "soon"; box.innerHTML = "<p>まだありません。</p>"; return; }
      box.className = "rec-list";
      box.innerHTML = mine.map(function (x) {
        var url = URL.createObjectURL(x.blob);
        return '<div class="rec-item done"><div class="rec-q"><span class="rec-k">' + (x.kind === "video" ? "動画" : "声") + "</span>" +
          esc(x.phrase) + '　<span class="muted small">' + mb(x.size) + "　" + esc(String(x.created_at).slice(11, 16)) + "</span></div>" +
          (x.kind === "video" ? '<video src="' + url + '" controls playsinline class="rec-media"></video>'
            : '<audio src="' + url + '" controls class="rec-media"></audio>') +
          '<button class="btn btn-sm" data-act="media-del" data-id="' + esc(x.id) + '" data-day="' + esc(day) + '">消す</button></div>';
      }).join("");
    }).catch(function (e) { box.textContent = "読み込めません：" + e.message; });
  }

  function recStart(kind, phrase, day) {
    if (!studentName()) { toast("先に名前を入れてください"); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { toast("この端末では録音できません"); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
      REC.stream = stream; REC.chunks = []; REC.kind = kind; REC.phrase = phrase; REC.startedAt = Date.now();
      var mr = new MediaRecorder(stream);
      REC.rec = mr;
      mr.ondataavailable = function (e) { if (e.data && e.data.size) REC.chunks.push(e.data); };
      mr.onstop = function () {
        var blob = new Blob(REC.chunks, { type: mr.mimeType || "audio/webm" });
        stream.getTracks().forEach(function (t) { t.stop(); });
        clearInterval(REC.timer);
        var el = document.getElementById("recNow"); if (el) el.innerHTML = "";
        REC.rec = null;
        if (blob.size > 0) saveMedia({ kind: "audio", phrase: phrase, blob: blob, mime: blob.type, day: day });
      };
      mr.start();
      var el = document.getElementById("recNow");
      if (el) el.innerHTML = '<div class="rec-now"><span class="rec-dot"></span><b>録音中</b>　<span id="recSec">0</span> 秒　' +
        esc(phrase) + '<button class="btn btn-primary" data-act="rec-stop">■ とめる</button></div>';
      REC.timer = setInterval(function () {
        var sec = Math.floor((Date.now() - REC.startedAt) / 1000);
        var e2 = document.getElementById("recSec"); if (e2) e2.textContent = sec;
        if (sec >= 90) recStop();   /* 長すぎる録音を止める（端末がいっぱいになるため） */
      }, 250);
    }).catch(function (e) { toast("マイクが使えません（許可を押してください）"); });
  }
  function recStop() { if (REC.rec && REC.rec.state !== "inactive") REC.rec.stop(); }

  /* 生徒：自分の提出を見る */
  function renderStudentSubmit() {
    var name = studentName();
    headName.textContent = "生徒／提出";
    var mine = Object.keys(hwAll()).map(function (k) { return hwAll()[k]; })
      .filter(function (r) { return r.student === name; })
      .sort(function (a, b) { return b.day - a.day; });
    view.innerHTML = '<section class="lesson"><div class="lesson-head"><h1>' + (name ? esc(name) + " の提出" : "提出") + "</h1></div>" +
      (name ? "" : '<div class="warn">名前が入っていません。「宿題」の画面で名前を入れてください。</div>') +
      (mine.length ? '<table class="rtable"><thead><tr><th>Day</th><th>状態</th><th>書いた数</th><th>日時</th><th></th></tr></thead><tbody>' +
        mine.map(function (r) {
          var w = Object.keys(r.answers || {}).filter(function (k) { return String(r.answers[k]).trim(); }).length;
          return "<tr><td>Day " + esc(r.day) + "</td><td>" + (r.submitted_at ? '<span class="chip st-完了">提出</span>' : '<span class="chip st-面接中">書きかけ</span>') +
            "</td><td class='num'>" + w + " / " + (r.questions || []).length + "</td><td>" +
            esc(String(r.submitted_at || r.saved_at || "").slice(0, 16).replace("T", " ")) +
            '</td><td><a class="btn btn-sm" href="#/student/homework/' + esc(r.day) + '">開く</a></td></tr>';
        }).join("") + "</tbody></table>"
        : '<div class="soon"><p>まだ提出はありません。</p></div>') +
      '<div class="start-btns"><a class="btn btn-primary btn-xl" href="#/student/homework">今日の宿題へ</a></div></section>';
  }

  /* 先生：採点（週次ふるい・金曜）＝評価シート26と同じ形 */
  function renderTeacherGrade() {
    var r = route();
    var week = (settings().grade_week || "").match(/^\d{4}-\d{2}-\d{2}$/) ? settings().grade_week : Core.fridayOf();
    var names = gradeNames();
    headName.textContent = "先生／採点 " + week;
    var weeks = grWeeks();
    if (weeks.indexOf(week) < 0) weeks.unshift(week);
    var rows = names.map(function (n, i) {
      var rec = grGet(week, n) || { score: {}, obs: {}, note: "" };
      var sc = rec.score || {};
      var lv = Core.furuiLevel(sc), tot = Core.furuiScore(sc);
      var prev = grPrevLevel(week, n);
      var cells = Core.FURUI.KEYS.map(function (k) {
        return '<td><input class="gr-n" type="number" min="0" max="20" data-n="' + esc(n) + '" data-k="' + k + '"' +
          ' value="' + esc(sc[k] == null ? "" : sc[k]) + '"></td>';
      }).join("");
      var obs = Core.FURUI.OBS.map(function (o) {
        return '<td><select class="gr-o" data-n="' + esc(n) + '" data-k="' + o[0] + '">' +
          '<option value=""></option>' +
          Core.FURUI.MARKS.map(function (m) {
            return '<option value="' + m + '"' + ((rec.obs || {})[o[0]] === m ? " selected" : "") + ">" + m + "</option>";
          }).join("") + "</select></td>";
      }).join("");
      return "<tr" + (grStuckC(n) ? ' class="gr-stuck"' : "") + "><td class='num'>" + (i + 1) + "</td>" +
        "<td class='gr-name'>" + esc(n) + (grStuckC(n) ? '<span class="chip st-未実施">3週C</span>' : "") + "</td>" +
        cells +
        "<td class='num gr-tot'>" + (tot.filled ? tot.total : "") + "</td>" +
        "<td class='gr-lv'>" + (lv ? '<span class="lv lv-' + lv + '">' + lv + "</span>" : '<span class="muted">—</span>') + "</td>" +
        "<td class='muted'>" + (prev || "—") + "</td>" +
        obs +
        '<td><input class="gr-note" data-n="' + esc(n) + '" value="' + esc(rec.note || "") + '" placeholder="上がる方法"></td></tr>';
    }).join("");
    var done = names.filter(function (n) { return Core.furuiLevel((grGet(week, n) || {}).score || {}); });
    var cnt = { A: 0, B: 0, C: 0 };
    done.forEach(function (n) { cnt[Core.furuiLevel(grGet(week, n).score)]++; });
    var half = done.length && cnt.C > done.length / 2;
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>採点（週次ふるい）</h1>' +
      '<div class="tools"><label class="gr-week">週（金曜）<input id="grWeek" type="date" value="' + esc(week) + '"></label>' +
      '<a class="btn" href="#/teacher">先生トップ</a></div></div>' +
      (names.length
        ? '<div class="box small"><b>5つ×20点＝100点。</b>' +
          '<b>A</b>＝合計80以上 かつ 話す16以上 かつ 実行16以上／<b>B</b>＝合計60〜79／' +
          '<b>C</b>＝合計60未満、または <b>話す・実行のどちらかが10点未満</b>。' +
          '5つ全部入れるまで判定は出ません。<b>結果は金曜に本人へ言わない（月曜の朝礼で発表）。</b></div>' +
          '<div class="pf-grid hist-sum"><div class="big-card"><div class="big-k">A</div><div class="big-v">' + cnt.A + " 人</div></div>" +
          '<div class="big-card"><div class="big-k">B</div><div class="big-v">' + cnt.B + " 人</div></div>" +
          '<div class="big-card"><div class="big-k">C</div><div class="big-v">' + cnt.C + " 人</div></div>" +
          '<div class="big-card"><div class="big-k">入力できた</div><div class="big-v">' + done.length + "<small> / " + names.length + "</small></div></div></div>" +
          (half ? '<div class="warn"><b>赤信号：Cが半数を超えました。</b>生徒ではなく<b>授業のやり方</b>を見直す合図です（校長と代表で進度を確認）。</div>' : "") +
          '<div class="gr-wrap"><table class="rtable gr-tab"><thead><tr><th>#</th><th>氏名</th>' +
          Core.FURUI.KEYS.map(function (k) { return "<th>" + Core.FURUI.LABEL[k] + "<small>20</small></th>"; }).join("") +
          "<th>計</th><th>今週</th><th>先週</th>" +
          Core.FURUI.OBS.map(function (o) { return "<th>" + o[1] + "</th>"; }).join("") +
          "<th>ひとこと（上がる方法）</th></tr></thead><tbody>" + rows + "</tbody></table></div>" +
          '<div class="start-btns"><button class="btn btn-primary btn-xl" data-act="gr-save">保存する</button>' +
          (SYNC_ON ? '<button class="btn btn-xl" data-act="study-send">スプレッドシートへ送る</button>' : "") +
          '<a class="btn btn-xl" href="#/check">代表の確認</a></div>' +
          '<p class="muted small">観察4項目（◎○△×）は<b>0〜3ヶ月</b>の記録＝Day62の職種適性の再判定に使います。' +
          '言い方は「<b>今週はC</b>」。「Cの人」とは言いません。</p>'
        : '<div class="soon"><p>採点する生徒がいません。</p>' +
          '<p class="muted small"><a href="#/check">代表の確認</a>の「名簿」に生徒の名前を入れてください（1行に1人）。</p></div>') +
      "</section>";
    var wk = document.getElementById("grWeek");
    if (wk) wk.addEventListener("change", function () {
      var s2 = settings(); s2.grade_week = wk.value; writeJSON(SETTINGS_KEY, s2); render();
    });
  }

  function gradeCollect(week) {
    var box = {};
    var pick = function (n) { return box[n] || (box[n] = { week: week, student: n, score: {}, obs: {}, note: "" }); };
    Array.prototype.forEach.call(document.querySelectorAll(".gr-n"), function (el) {
      var v = String(el.value).trim();
      if (v !== "") pick(el.getAttribute("data-n")).score[el.getAttribute("data-k")] = Math.max(0, Math.min(20, parseInt(v, 10) || 0));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".gr-o"), function (el) {
      if (el.value) pick(el.getAttribute("data-n")).obs[el.getAttribute("data-k")] = el.value;
    });
    Array.prototype.forEach.call(document.querySelectorAll(".gr-note"), function (el) {
      if (String(el.value).trim()) pick(el.getAttribute("data-n")).note = el.value;
    });
    return box;
  }
  function gradeSave(week) {
    var box = gradeCollect(week), n = 0;
    Object.keys(box).forEach(function (k) { grPut(box[k]); n++; });
    toast(n ? n + " 人分を保存しました" : "まだ何も入っていません");
    if (n) render();
  }

  /* 生徒：学習履歴（新しい入力は1つも無い。やった物から自動で作る） */
  function renderStudentHistory() {
    var name = studentName();
    headName.textContent = "生徒／学習履歴";
    var rows = name ? historyOf(name) : [];
    var q = rows.reduce(function (t, r) { return t + (r.drill ? r.drill.answered : 0); }, 0);
    var ok = rows.reduce(function (t, r) { return t + (r.drill ? r.drill.correct : 0); }, 0);
    var hw = rows.filter(function (r) { return r.hw && r.hw.submitted_at; }).length;
    var pct = q ? Math.round(ok / q * 100) : 0;
    view.innerHTML = '<section class="lesson"><div class="home-head"><h1>' +
      (name ? esc(name) + " の学習履歴" : "学習履歴") + "</h1>" +
      '<div class="tools"><a class="btn" href="#/student">生徒トップ</a></div></div>' +
      (name ? "" : '<div class="warn">名前が入っていません。「宿題」の画面で名前を入れてください。</div>') +
      (rows.length
        ? '<div class="pf-grid hist-sum">' +
            '<div class="big-card"><div class="big-k">やった日</div><div class="big-v">' + rows.length + " 日</div></div>" +
            '<div class="big-card"><div class="big-k">解いた問題</div><div class="big-v">' + q + " 問</div></div>" +
            '<div class="big-card"><div class="big-k">正解</div><div class="big-v">' + ok + "<small> / " + q + "（" + pct + "%）</small></div></div>" +
            '<div class="big-card"><div class="big-k">宿題を出した</div><div class="big-v">' + hw + " 日</div></div>" +
          "</div>" +
          '<table class="rtable"><thead><tr><th>Day</th><th>問題</th><th>正解</th><th>宿題</th><th>いつ</th></tr></thead><tbody>' +
          rows.map(function (r) {
            var d = r.drill;
            return "<tr><td>Day " + esc(r.day) + "</td>" +
              "<td class='num'>" + (d ? d.answered + " / " + d.total : "—") + "</td>" +
              "<td class='num'>" + (d ? d.correct + (d.answered ? "（" + Math.round(d.correct / d.answered * 100) + "%）" : "") : "—") + "</td>" +
              "<td>" + (r.hw ? (r.hw.submitted_at ? '<span class="chip st-完了">提出</span>' : '<span class="chip st-面接中">書きかけ</span>') : '<span class="muted">—</span>') + "</td>" +
              "<td>" + esc(jdate(r.at)) + "</td></tr>";
          }).join("") + "</tbody></table>"
        : '<div class="soon"><p>まだ記録がありません。</p>' +
          '<p class="muted small">「問題」を解くと、その日の点がここに残ります。名前を入れてから始めてください。</p></div>') +
      '<div class="start-btns"><a class="btn btn-primary btn-xl" href="#/student/drill">問題をやる</a>' +
      '<a class="btn btn-xl" href="#/student/homework">宿題</a></div>' +
      '<p class="muted small">この記録は<b>この端末の中だけ</b>にあります。先生・代表に届くようにするには送信の口が要ります。</p>' +
      "</section>";
  }

  /* 先生：提出物確認 */
  function renderTeacherInbox(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var list = hwOfDay(n);
    var d = dayData(n);
    headName.textContent = "先生／提出物確認 Day " + n;
    view.innerHTML = '<section class="lesson">' + dayNav("teacher", "inbox", n) +
      (ONLINE ? '<div class="box small"><b>オンライン版では、ここに出るのはこの端末で書かれた宿題だけです。</b>' +
        '生徒ごとに「出したか」は <a href="#/check">提出状況</a> で見られます（書いた文はサーバーに送っていません）。</div>' : "") +
      '<div class="lesson-head"><h1>Day ' + n + " の提出</h1>" +
      '<span class="chip ' + (list.length ? "st-完了" : "st-未実施") + '">' + list.length + " 人</span>" +
      '<div class="tools"><button class="btn" data-act="hw-export">提出をCSVで保存</button></div></div>' +
      '<div class="box small"><b>この日の宿題</b>　' + d.homework + "</div>" +
      (list.length ? list.map(function (r) {
        var qs = r.questions || [];
        return '<div class="hw-card"><div class="hw-head"><b>' + esc(r.student) + "</b>" +
          (r.submitted_at ? '<span class="chip st-完了">提出 ' + esc(String(r.submitted_at).slice(0, 16).replace("T", " ")) + "</span>"
            : '<span class="chip st-面接中">書きかけ</span>') + "</div>" +
          Object.keys(r.answers || {}).sort().map(function (k) {
            var a = String(r.answers[k] || "").trim();
            return '<div class="hw-ans"><span class="hw-no">' + esc(qs[k] ? qs[k].slice(0, 1) : "・") + "</span>" +
              (a ? esc(a) : '<span class="muted">（書いていない）</span>') + "</div>";
          }).join("") + "</div>";
      }).join("")
        : '<div class="soon"><p>この日の提出はまだありません。</p><p class="muted small">生徒が「宿題」の画面で名前を入れて提出すると、ここに出ます（同じ端末の中だけ）。</p></div>') +
      '<h2 class="sec-h">声・動画の提出</h2><div id="tMedia" class="muted">読み込み中…</div>' +
      "</section>";
    bindDaySel();
    mediaAll().then(function (all) {
      var box = document.getElementById("tMedia");
      if (!box) return;
      var today2 = all.filter(function (x) { return String(x.day) === String(n); });
      if (!today2.length) { box.className = "soon"; box.innerHTML = "<p>この日の声・動画はありません。</p>"; return; }
      box.className = "rec-list";
      box.innerHTML = today2.map(function (x) {
        var url = URL.createObjectURL(x.blob);
        return '<div class="rec-item done"><div class="rec-q"><b>' + esc(x.student || "（名前なし）") + "</b>　" +
          '<span class="rec-k">' + (x.kind === "video" ? "動画" : "声") + "</span>" + esc(x.phrase) +
          '　<span class="muted small">' + mb(x.size) + "</span></div>" +
          (x.kind === "video" ? '<video src="' + url + '" controls playsinline class="rec-media"></video>'
            : '<audio src="' + url + '" controls class="rec-media"></audio>') +
          '<a class="btn btn-sm" download="' + esc((x.student || "x") + "_Day" + x.day + (x.kind === "video" ? ".webm" : ".webm")) + '" href="' + url + '">保存</a>' +
          '<button class="btn btn-sm" data-act="media-del" data-id="' + esc(x.id) + '" data-day="' + esc(n) + '">消す</button></div>';
      }).join("") + '<p class="muted small">合計 ' + mb(mediaSize(today2)) + "　／　端末に保存されています。確認したら消してください。</p>";
    });
  }

  function hwExport(day) {
    var list = hwOfDay(day);
    if (!list.length) { toast("この日の提出はありません"); return; }
    var lines = ["day,student,field,no,question,answer,submitted_at"];
    list.forEach(function (r) {
      (r.questions || []).forEach(function (q, i) {
        lines.push([r.day, r.student, r.field, q.slice(0, 1), q, (r.answers || {})[i] || "", r.submitted_at || ""].map(csvCell).join(","));
      });
    });
    var blob = new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "OUKA_宿題提出_Day" + day + "_" + today() + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* 生徒：動画（押したらすぐ見られるものを先に出す） */
  function renderStudentMedia(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    var f = currentField();
    headName.textContent = "生徒／動画 Day " + n;
    var vids = (VIDEOS.fields && VIDEOS.fields[f.code]) || [];
    var ready = vids.filter(function (v) { return v.url; });
    var ways = vids.filter(function (v) { return !v.url && !v.own; });
    var own = vids.filter(function (v) { return v.own; });
    var life = VIDEOS.life_nepali || { items: [] };
    var dayVideo = d.video && (isKensetsu() || !f.code || !/建設|現場|入場者|KY/.test(d.video.title)) ? d.video : null;

    view.innerHTML = '<section class="lesson">' + dayNav("student", "media", n) + fieldPicker() +
      '<div class="lesson-head"><h1>動画' + (f.code ? "　<small>" + esc(f.label) + "コース</small>" : "") + "</h1></div>" +
      (f.code ? "" : needField("この下の動画")) +
      (dayVideo ? '<div class="box"><b>今日（Day ' + n + "）の動画</b>　" +
        '<a target="_blank" rel="noopener" href="' + esc(dayVideo.url) + '">' + esc(dayVideo.title) + "</a></div>" : "") +
      (ready.length ? '<h2 class="sec-h">押したらすぐ見られる（' + esc(f.label) + "）</h2><div class=\"video-grid\">" + ready.map(videoCard).join("") + "</div>" : "") +
      '<h2 class="sec-h">日本の生活を知る（知りたいことから探す）</h2>' +
      '<p class="muted small">ネパール語＝出入国在留管理庁の動画／日本語＝文部科学省「つながる ひろがる にほんごでのくらし」。どちらも無料です。</p>' +
      '<div class="topic-grid">' + (VIDEOS.life_topics || []).map(function (t) {
        return '<div class="topic-card"><span class="t-name">' + esc(t.topic) + "</span>" +
          '<span class="t-q">' + esc(t.q) + "</span><span class='t-btns'>" +
          (t.ne ? '<a class="btn btn-primary" target="_blank" rel="noopener" href="' + esc(t.ne.url) + '">▶ ネパール語</a>' : '<span class="muted small">ネパール語なし</span>') +
          (t.ja ? '<a class="btn" target="_blank" rel="noopener" href="' + esc(t.ja.url) + '">▶ 日本語</a>' : "") +
          "</span></div>";
      }).join("") + "</div>" +
      '<h2 class="sec-h">日本の生活（ネパール語・1本ずつ全部）</h2>' +
      '<div class="video-grid life">' + life.items.map(function (it) {
        return videoCard({ label: it.label, url: it.url, org: life.org, lang: "ネパール語" });
      }).join("") + "</div>" +
      (ways.length ? '<h2 class="sec-h">ページから探して見るもの（行き方）</h2><div class="video-grid">' + ways.map(videoCard).join("") + "</div>" : "") +
      (own.length ? '<h2 class="sec-h">桜花でこれから作る動画</h2>' +
        '<p class="muted small">外国人むけの動画が世の中にないところです。学校で撮って、やさしい日本語とネパール語字幕を付けます。</p>' +
        '<div class="video-grid">' + own.map(videoCard).join("") + "</div>" : "") +
      /* テキスト・学習サイト（ネパール語版など。動画ではないが授業で使う） */
      (f.code
        ? '<h2 class="sec-h">' + esc(f.label) + "の教材（テキスト・学習サイト）</h2>" +
          (f.media && f.media.length ? '<div class="media-grid">' + f.media.map(mediaCard).join("") + "</div>"
            : '<div class="box">この分野の教材リンクはまだ入れていません。</div>')
        : fieldList().map(function (x) {
            return '<h2 class="sec-h">' + esc(x.label) + "の教材（テキスト・学習サイト）</h2>" +
              (x.media.length ? '<div class="media-grid">' + x.media.map(mediaCard).join("") + "</div>" : '<div class="box">まだありません。</div>');
          }).join("")) +
      '<h2 class="sec-h">分野に関係なく使えるもの</h2><div class="media-grid">' + (FIELDS.common_media || []).map(mediaCard).join("") + "</div>" +
      '<h2 class="sec-h">動画は見るだけにしない</h2>' +
      '<ol class="steps-ol"><li>見る</li><li>シャドーイング5回</li><li>内容を確認する</li><li>作文する</li><li>ペアで話す</li><li>60秒で発表する</li><li>撮影して自分で見る</li><li>翌週もう一度</li></ol>' +
      '<div class="mat-row">' + matLink("27_動画学習シート.pdf") + '<a class="btn" href="#/student/today/' + n + '">今日の教材へ</a></div>' +
      '<p class="muted small">リンク先は外部の公式サイト（出入国在留管理庁・農林水産省・厚生労働省・建災防など）です。' +
      "リンクは先方の都合で変わることがあるので、授業で使う前に先生が1回開いて確かめてください。</p>" +
      "</section>";
    bindDaySel();
  }

  /* 生徒：問題（1問ずつ・その場で答え合わせ。記録はまだ残さない） */
  var quiz = null;
  function renderStudentDrill(n) {
    if (!LESSONS) return noLessons();
    n = n || currentDay();
    var d = dayData(n);
    var ids = [], srcOf = {}, hidden = 0;
    d.bank.forEach(function (b) {
      b.ids.forEach(function (id) {
        if (!LESSONS.problems[id] || ids.indexOf(id) >= 0) return;
        if (currentField().code && !isKensetsu() && !neutralCat(b.category)) { hidden++; return; }   /* 建設固有の問題は他コースでは出さない */
        ids.push(id); srcOf[id] = b.source + "／" + b.category;
      });
    });
    if (!quiz || quiz.day !== n) quiz = { day: n, ids: ids, idx: 0, picked: {} };
    headName.textContent = "生徒／問題 Day " + n;
    if (!ids.length) {
      view.innerHTML = '<section class="lesson">' + dayNav("student", "drill", n) + fieldPicker() +
        '<div class="soon"><p><b>' + esc(currentField().label) + "コースで使える問題が、この日はありません。</b></p>" +
        (hidden ? "<p>この日の問題 " + hidden + "問は建設の内容（工具・施工など）なので出していません。</p>" : "") +
        "<p>" + esc(currentField().label) + "の問題はこれから作ります。今日は「動画・教材」の公式テキストを使ってください。</p></div>" +
        '<div class="start-btns"><a class="btn btn-xl" href="#/student/media/' + n + '">' + esc(currentField().label) + 'の教材へ</a></div></section>';
      return bindDaySel();
    }
    if (quiz.idx >= ids.length) {
      var ok = ids.filter(function (id) { return quiz.picked[id] === LESSONS.problems[id].answer; }).length;
      view.innerHTML = '<section class="lesson">' + dayNav("student", "drill", n) +
        '<div class="big-card"><div class="big-k">Day ' + n + ' の問題　おわり</div><div class="big-v" id="drillScore">' + ok + " / " + ids.length + "</div></div>" +
        '<div class="start-btns"><button class="btn btn-primary btn-xl" data-act="drill-again">もう一度</button>' +
        '<a class="btn btn-xl" href="#/student/today/' + n + '">今日の教材へ</a></div>' +
        (studentName()
          ? '<p class="muted small">この点数は <b>' + esc(studentName()) + '</b> の学習履歴に残りました。' +
            '<a href="#/student/history">学習履歴を見る</a></p>'
          : '<div class="warn">名前が入っていないので<b>記録が残りません</b>。「宿題」の画面で名前を入れてください。</div>') +
        "</section>";
      return bindDaySel();
    }
    var id = ids[quiz.idx], p = LESSONS.problems[id], picked = quiz.picked[id];
    var choices = p.choices.map(function (c, i) {
      var cls = "choice";
      if (picked != null) cls += c === p.answer ? " ok" : (c === picked ? " ng" : " dim");
      return '<button class="' + cls + '" data-act="drill-pick" data-i="' + i + '"' + (picked != null ? " disabled" : "") + ">" + esc(c) + "</button>";
    }).join("");
    view.innerHTML = '<section class="q-screen drill">' + dayNav("student", "drill", n) +
      (hidden ? '<p class="muted small drill-note">建設の問題 ' + hidden + "問は" + esc(currentField().label) + "コースでは出していません。</p>" : "") +
      '<div class="q-top"><span class="q-count" id="drillCount">' + (quiz.idx + 1) + " / " + ids.length + "</span>" +
      '<span class="q-cat">' + esc(srcOf[id] || p.bank + "／" + p.category) + "</span>" +
      (p.status && p.status !== "公開" ? '<span class="q-done">問題は作成中（' + esc(p.status) + "）</span>" : "") + "</div>" +
      '<div class="q-text drill-q" id="drillQ">' + esc(p.q) + "</div>" +
      (p.hint_ne ? '<p class="muted drill-hint">' + esc(p.hint_ne) + "</p>" : "") +
      '<div class="choices">' + choices + "</div>" +
      (picked != null ? '<div class="box drill-exp" id="drillExp"><b>' + (picked === p.answer ? "正解" : "正解は「" + esc(p.answer) + "」") + "</b>　" + esc(p.explain) + "</div>" : "") +
      '<div class="q-nav"><button class="btn btn-nav" data-act="drill-prev"' + (quiz.idx === 0 ? " disabled" : "") + ">← 前へ</button><div class='q-mid'></div>" +
      '<button class="btn btn-primary btn-nav" id="drillNext" data-act="drill-next">' + (quiz.idx === ids.length - 1 ? "おわり" : "次へ →") + "</button></div>" +
      "</section>";
    bindDaySel();
  }

  /* 生徒：緊急のとき（番号・言うこと・場面ごとの動き方） */
  function renderEmergency() {
    if (!EMG) return noLessons();
    headName.textContent = "緊急のとき";
    view.innerHTML = '<section class="lesson emg">' +
      '<div class="lesson-head"><h1>緊急のとき</h1><span class="chip st-完了">全国共通・24時間・無料（110／119）</span></div>' +
      '<div class="warn"><b>いのちが危ないときは、日本語が下手でも電話してよい。</b>「たすけてください」と言って、<b>場所</b>を言う。切らないで待つ。</div>' +
      '<div class="emg-grid">' + EMG.numbers.map(function (n) {
        return '<div class="emg-card ' + esc(n.color) + '">' +
          '<div class="emg-no">' + esc(n.no) + "</div>" +
          '<div class="emg-name">' + esc(n.name) + "</div>" +
          '<div class="emg-k">こんな時</div><ul>' + n.when.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" +
          '<div class="emg-k">電話で言うこと</div><ol>' + n.say.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ol>" +
          '<p class="emg-note">' + esc(n.note) + "</p>" +
          '<a class="btn btn-sm" target="_blank" rel="noopener" href="' + esc(n.url) + '">出典：' + esc(n.src) + "</a></div>";
      }).join("") + "</div>" +
      '<h2 class="sec-h">こんな時どうする（順番）</h2>' +
      '<table class="rtable emg-tab"><thead><tr><th>こんな時</th><th>すること（順番）</th><th>電話</th></tr></thead><tbody>' +
      EMG.cases.map(function (c) {
        return "<tr><td><b>" + esc(c.case) + "</b></td><td>" +
          c.steps.map(function (x, i) { return (i + 1) + "．" + esc(x); }).join("<br>") + "</td><td class='num'>" + esc(c.call || "—") + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<h2 class="sec-h">電話の前に、書いておく</h2>' +
      '<ol class="steps-ol">' + EMG.before.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ol>" +
      '<h2 class="sec-h">読む・見る</h2><div class="media-grid">' +
      EMG.materials.map(function (m) { return mediaCard({ title: m.title, url: m.url, org: m.org, lang: m.lang, type: /youtube/.test(m.url) ? "動画" : "資料" }); }).join("") +
      "</div>" +
      '<p class="muted small">番号は ' + esc(EMG.updated) + " に公式サイトで確認したものです。授業で使う前に先生がもう一度確かめてください。" +
      "会社・学校・支援機関の電話番号は、この画面には入っていません。紙に書いて持たせてください。</p>" +
      "</section>";
  }

  function bindDaySel() {
    var sel = document.getElementById("daySel");
    if (sel) sel.addEventListener("change", function () {
      go("#/" + sel.getAttribute("data-role") + "/" + sel.getAttribute("data-item") + "/" + sel.value);
    });
  }

  function renderLive(hub, item, n) {
    var k = hub + "/" + item;
    if (k === "teacher/today") return renderTeacherDay(n);
    if (k === "teacher/materials") return renderTeacherMaterials();
    if (k === "teacher/study") return n ? renderTeacherStudyUnit(n) : renderTeacherStudy();
    if (k === "student/today") return renderStudentToday(n);
    if (k === "student/drill") return renderStudentDrill(n);
    if (k === "student/homework") return renderStudentHomework(n);
    if (k === "student/media") return renderStudentMedia(n);
    if (k === "student/emergency") return renderEmergency();
    if (k === "student/submit") return renderStudentSubmit();
    if (k === "student/history") return renderStudentHistory();
    if (k === "teacher/grade") return renderTeacherGrade();
    if (k === "student/speak") return renderStudentSpeak(n);
    if (k === "teacher/inbox") return renderTeacherInbox(n);
  }

  /* ---------- 画面：履歴書アップロード ---------- */
  /* いま選ばれている履歴書ファイル（ドラッグでも「選ぶ」でも、ここに1つだけ入る） */
  var cvPicked = null;
  var cvExtract = { method: "", chars: 0 };

  /* 読み取りサーバー（面接アプリを開く.command で一緒に立ち上がる）が居るか確かめる */
  function cvServerReady() {
    if (location.protocol === "file:") return Promise.resolve(false);
    return fetch("cv-ping", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; });
  }

  function cvSay(html, kind) {
    var el = document.getElementById("cvStatus");
    if (!el) return;
    el.className = "cv-status" + (kind ? " cv-" + kind : "");
    el.innerHTML = html;
  }

  /* ファイルをこのMacの中の読み取りサーバーに渡して、文字にして返してもらう。
     ★ネットには出さない。読み取ったのは「書いてある文字」だけで、中身の解釈はしない。 */
  function cvRead(file) {
    if (!file) return;
    cvPicked = file;
    cvExtract = { method: "", chars: 0 };
    var box = document.getElementById("cvResult");
    if (box) box.innerHTML = "";
    var mb = (file.size / 1048576).toFixed(1);
    cvSay("「" + esc(file.name) + "」（" + mb + "MB）を読んでいます…　<span class=\"muted\">写真・スキャンの履歴書は少し時間がかかります</span>", "busy");
    fetch("cv-extract", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream", "X-File-Name": encodeURIComponent(file.name) },
      body: file
    }).then(function (r) { return r.json(); }).then(function (j) {
      var ta = document.getElementById("cvText");
      if (!ta) return;
      var notes = (j.notes || []).map(esc).join("　／　");
      if (!j.ok || !j.text) {
        cvSay("<b>このファイルからは文字を読めませんでした。</b>" + (notes ? "<br>" + notes : "") +
          "<br>下の欄に手で貼り付けてください（履歴書ファイル自体は記録に残ります）。", "ng");
        return;
      }
      ta.value = j.text;
      cvExtract = { method: j.method || "", chars: j.chars || j.text.length };
      var how = j.method === "ocr" ? "写真から文字を読みました（OCR）"
        : j.method === "text+ocr" ? "PDFの文字＋写真から読みました"
        : "PDFの文字をそのまま読みました";
      cvSay("<b>" + esc(how) + "</b>　" + (j.chars || 0) + "文字" +
        (j.pages ? "・" + j.pages + "ページ" : "") + "・" + (j.seconds || 0) + "秒" +
        (notes ? "<br><span class=\"muted\">" + notes + "</span>" : "") +
        "<br><b>読み間違いがあります。下の文字を見て直してください。</b>", "ok");
      cvParse();
    }).catch(function (e) {
      cvSay("<b>読み取りサーバーに届きませんでした。</b>「面接アプリを開く.command」から開き直すと自動で読めます。" +
        "いまは下の欄に貼り付けてください。<br><span class=\"muted\">（" + esc(e.message) + "）</span>", "ng");
    });
  }

  function renderUpload() {
    headName.textContent = "履歴書から候補者を作る";
    view.innerHTML =
      '<section class="newform"><h1>履歴書を入れる</h1>' +
      '<p class="muted small">① 履歴書のPDF・写真を入れる → <b>自動で文字を読みます</b>　② 読んだ文字を見て直す　③「読み取る」→ 内容を確認して直す　④ 登録して面接へ</p>' +
      '<div class="cv-drop" id="cvDrop">' +
      '<div class="cv-drop-big">ここに履歴書をドラッグしてください</div>' +
      '<div class="muted small">PDF・写真（スマホで撮ったものでも可）・Word・テキスト　／　40MBまで</div>' +
      '<label class="btn btn-primary btn-xl">ファイルを選ぶ<input type="file" id="cvFile" accept=".pdf,.png,.jpg,.jpeg,.heic,.heif,.tif,.tiff,.webp,.txt,.csv,.doc,.docx,.rtf" hidden></label>' +
      "</div>" +
      '<div class="cv-status" id="cvStatus">確認しています…</div>' +
      '<div class="f-grid">' +
      '<label class="f-wide">履歴書の文字（自動で入ります。直せます）<textarea id="cvText" rows="10" placeholder="履歴書を上に入れると、ここに文字が入ります。読めなかった時は、ここに貼り付けてください。"></textarea></label>' +
      "</div>" +
      '<div class="start-btns"><button class="btn btn-primary btn-xl" id="cvParse" data-act="cv-parse">読み取る</button>' +
      '<a class="btn btn-xl" href="#/new">手で入力する</a>' +
      '<a class="btn btn-xl" href="#/">やめる</a></div>' +
      '<div id="cvResult"></div>' +
      '<p class="note-inline muted small">★読み取りは<b>このMacの中だけ</b>で行います（ネットに送りません）。取り出すのは<b>書いてある文字だけ</b>で、AIの解析ではありません。' +
      "写真・手書き・ネパール語（デーヴァナーガリー文字）は読み間違い・読み落としがあります。" +
      "拾えなかった項目は空のままにして、面接で確認してください。履歴書に書いていないことを、こちらで作ることはありません。</p>" +
      "</section>";

    cvPicked = null;
    cvExtract = { method: "", chars: 0 };

    var input = document.getElementById("cvFile");
    var drop = document.getElementById("cvDrop");
    input.addEventListener("change", function () { cvRead(input.files[0]); });
    ["dragenter", "dragover"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("over"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("over"); });
    });
    drop.addEventListener("drop", function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) cvRead(f); else toast("ファイルを1つ入れてください");
    });

    cvServerReady().then(function (ok) {
      if (ok) cvSay("履歴書を入れてください。<b>PDFも写真も、このMacの中で自動で文字にします。</b>");
      else cvSay("<b>いまは自動で読めません。</b>「面接アプリを開く.command」から開き直すと、PDF・写真から自動で文字を読めます。" +
        "このままでも、下の欄に貼り付ければ使えます。", "ng");
    });
  }

  function cvParse() {
    var text = document.getElementById("cvText").value;
    var file = cvPicked;
    if (!text.trim()) { toast("履歴書を入れるか、文字を貼り付けてください"); return; }
    var r = parseResume(text);
    var box = document.getElementById("cvResult");
    var checked = function (code) { return r.works.indexOf(code) >= 0 ? " checked" : ""; };
    box.innerHTML =
      '<h2 class="cv-h">読み取った内容（必ず確認して直してください）</h2>' +
      '<p class="muted small">' + (r.evidence.length ? "拾えた言葉：" + esc(r.evidence.join("　／　")) : "職歴らしい言葉は拾えませんでした。下で選んでください。") +
      "　（" + r.lines + "行を確認" + (r.from_section ? "・職歴欄から" : "") + "）</p>" +
      '<form id="cvForm" autocomplete="off"><div class="f-grid">' +
      '<label class="f-wide">名前 <b class="req">必須</b><input name="name" id="cvName" value="' + esc(r.name) + '" placeholder="例：SITA RAI"></label>' +
      '<label>職種<input name="job" value="介護"></label>' +
      '<label>職場名<input name="work_place" value="' + esc(r.work_place) + '"></label>' +
      '<fieldset class="f-wide"><legend>職歴（直せます）</legend><div class="chips">' +
      WORK_TYPES.map(function (t) {
        return '<label class="pick"><input type="checkbox" name="works" value="' + t.code + '"' + checked(t.code) + "><span>" + t.label + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<fieldset class="f-wide"><legend>その仕事は今も続けている？</legend><div class="chips">' +
      ['<label class="pick"><input type="radio" name="work_ended" value="no"' + (r.work_ended === "no" ? " checked" : "") + "><span>今も働いている</span></label>",
       '<label class="pick"><input type="radio" name="work_ended" value="yes"' + (r.work_ended === "yes" ? " checked" : "") + "><span>辞めた</span></label>",
       '<label class="pick"><input type="radio" name="work_ended" value=""' + (r.work_ended ? "" : " checked") + "><span>分からない</span></label>"].join("") +
      "</div></fieldset>" +
      '<label>日本語資格<input name="japanese_cert" value="' + esc(r.japanese_cert) + '"></label>' +
      '<label>SSW資格<input name="ssw_cert" value="' + esc(r.ssw_cert) + '"></label>' +
      "</div>" +
      '<div class="start-btns"><button class="btn btn-primary btn-xl" type="submit" id="cvSubmit">この内容で登録して面接へ</button></div></form>';
    document.getElementById("cvForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      try {
        var cand = newCandidateFromForm({
          name: fd.get("name"), job: fd.get("job"), works: fd.getAll("works"), work_place: fd.get("work_place"),
          work_ended: fd.get("work_ended"), japanese_cert: fd.get("japanese_cert"), ssw_cert: fd.get("ssw_cert"), today: today()
        }, candidates());
        cand.resume = { file: file ? file.name : "", size: file ? file.size : 0, added_on: today(), text_lines: r.lines,
          read_by: cvExtract.method || "貼り付け", read_chars: cvExtract.chars || text.length };
        cand.work_history = (cand.work_history || "") + (file ? "／履歴書：" + file.name : "");
        buildQuestions(cand, BANK);
        writeJSON(IMPORT_KEY, mergeCandidates(readJSON(IMPORT_KEY, []), [cand]));
        go(cHash(cand));
      } catch (err) { toast(err.message); }
    });
    document.getElementById("cvName").focus();
  }

  /* ---------- 画面：ホーム ---------- */
  function renderHome() {
    headName.textContent = "";
    var list = candidates();
    var imported = readJSON(IMPORT_KEY, []).length;
    view.innerHTML =
      '<section class="home">' +
      '<div class="home-head"><h1>候補者を選んでください</h1>' +
      '<div class="tools"><a class="btn btn-primary" id="uploadBtn" href="#/upload">＋ 履歴書</a>' +
      '<a class="btn" id="newBtn" href="#/new">＋ 新しい候補者</a>' +
      '<a class="btn" href="#/results">全結果</a>' +
      '<button class="btn" data-act="guide">採点基準</button>' +
      '<label class="btn">CSVで候補者を追加<input type="file" id="csvIn" accept=".csv,text/csv" hidden></label>' +
      (imported ? '<button class="btn btn-ghost" data-act="clear-import">追加分を一覧から消す（' + imported + "人）</button>" : "") +
      "</div></div>" +
      fileWarning() +
      (list.length ? "" : '<div class="soon"><p><b>候補者がまだ登録されていません。</b></p>' +
        "<p>「＋ 履歴書」または「＋ 新しい候補者」から登録すると、ここに並びます。</p></div>") +
      '<div class="cand-grid">' +
      list.map(function (c) {
        var st = statusOf(c);
        var s = stats(questionsOf(c), (getRec(c.candidate_id) || {}).answers, BANK);
        return '<a class="cand" href="' + cHash(c) + '" data-cid="' + esc(c.candidate_id) + '">' +
          '<span class="cand-no">' + esc(c.no) + "</span>" +
          '<span class="cand-name">' + esc(c.name) + "</span>" +
          '<span class="chip st-' + st + '">' + st + (s.avg != null ? " " + fmt(s.avg) : "") + "</span></a>";
      }).join("") + "</div></section>";

    document.getElementById("csvIn").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var add = candidatesFromCSV(fr.result);
          add.forEach(function (c) { buildQuestions(c, BANK); });
          writeJSON(IMPORT_KEY, mergeCandidates(readJSON(IMPORT_KEY, []), add));
          toast(add.length + "人を読み込みました");
          render();
        } catch (err) { toast("読み込めません：" + err.message); }
      };
      fr.readAsText(f, "utf-8");
    });
  }

  /* ---------- 画面：新しい候補者（面接当日にその場で登録） ---------- */
  function renderNew() {
    headName.textContent = "新しい候補者";
    var jobs = ["介護", "外食", "建設", "農業", "工業製品製造", "飲食料品製造", "ビルクリーニング", "宿泊", "自動車運送"];
    view.innerHTML =
      '<section class="newform"><h1>新しい候補者を登録して面接する</h1>' +
      '<form id="newForm" autocomplete="off">' +
      '<div class="f-grid">' +
      '<label class="f-wide">名前 <b class="req">必須</b><input name="name" id="fName" placeholder="例：SITA RAI"></label>' +
      '<label>職種<input name="job" id="fJob" value="介護" list="jobList"><datalist id="jobList">' +
      jobs.map(function (j) { return '<option value="' + j + '">'; }).join("") + "</datalist></label>" +
      '<label>職場名 <span class="muted">（職歴を1つ選んだ時だけ質問に入る）</span><input name="work_place" id="fPlace" placeholder="例：CALM RESTAURANT"></label>' +
      '<fieldset class="f-wide"><legend>職歴（当てはまるものを全部）</legend><div class="chips">' +
      WORK_TYPES.map(function (t) {
        return '<label class="pick"><input type="checkbox" name="works" value="' + t.code + '"><span>' + t.label + "</span></label>";
      }).join("") + "</div></fieldset>" +
      '<fieldset class="f-wide"><legend>その仕事は今も続けている？</legend><div class="chips">' +
      '<label class="pick"><input type="radio" name="work_ended" value="no"><span>今も働いている</span></label>' +
      '<label class="pick"><input type="radio" name="work_ended" value="yes"><span>辞めた</span></label>' +
      '<label class="pick"><input type="radio" name="work_ended" value="" checked><span>分からない</span></label></div></fieldset>' +
      '<label>日本語資格<input name="japanese_cert" placeholder="例：JFT-Basic A2 合格"></label>' +
      '<label>SSW資格<input name="ssw_cert" placeholder="例：介護技能評価試験 合格"></label>' +
      "</div>" +
      '<p class="muted small">職歴と職種から質問を自動で作ります（介護なら介護の質問、それ以外は「なぜ日本で○○の仕事をしたいですか？」など）。</p>' +
      '<div class="start-btns"><button class="btn btn-primary btn-xl" type="submit" id="newSubmit">登録して面接へ</button>' +
      '<a class="btn btn-xl" href="#/">やめる</a></div>' +
      "</form></section>";
    document.getElementById("fName").focus();
    document.getElementById("newForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var fd = new FormData(e.target);
      try {
        var cand = newCandidateFromForm({
          name: fd.get("name"), job: fd.get("job"), works: fd.getAll("works"), work_place: fd.get("work_place"),
          work_ended: fd.get("work_ended"), japanese_cert: fd.get("japanese_cert"), ssw_cert: fd.get("ssw_cert"), today: today()
        }, candidates());
        buildQuestions(cand, BANK);
        writeJSON(IMPORT_KEY, mergeCandidates(readJSON(IMPORT_KEY, []), [cand]));
        go(cHash(cand));
      } catch (err) { toast(err.message); }
    });
  }

  /* ---------- 画面：面接開始 ---------- */
  function renderStart(c) {
    headName.textContent = c.no + ". " + c.name;
    var qs = questionsOf(c);
    var rec = getRec(c.candidate_id);
    var st = statusOf(c);
    var s = stats(qs, rec && rec.answers, BANK);
    var resumeIdx = rec ? Math.min(rec.current_index || 0, qs.length - 1) : 0;
    var btns;
    if (st === "未実施") {
      btns = '<button class="btn btn-primary btn-xl" id="startBtn" data-act="start" data-mode="full">面接を開始する（全' + questionsFor(c, "full").length + "問）</button>" +
        '<button class="btn btn-xl" id="startShortBtn" data-act="start" data-mode="short">短縮版で開始（' + questionsFor(c, "short").length + "問）</button>";
    } else if (st === "面接中") {
      btns = '<a class="btn btn-primary btn-xl" id="startBtn" href="' + cHash(c) + "/q/" + (resumeIdx + 1) + '">続きから再開（Q' + (resumeIdx + 1) + "）</a>" +
        '<a class="btn btn-xl" href="' + cHash(c) + '/q/1">Q1から見直す</a>' +
        '<a class="btn btn-xl" href="' + cHash(c) + '/result">途中の結果を見る</a>';
    } else {
      btns = '<a class="btn btn-primary btn-xl" id="startBtn" href="' + cHash(c) + '/result">結果を見る</a>' +
        '<a class="btn btn-xl" href="' + cHash(c) + '/q/1">質問を見直す</a>';
    }
    var row = function (k, v) { return "<tr><th>" + k + "</th><td>" + esc(v || "—") + "</td></tr>"; };
    view.innerHTML =
      '<section class="start">' +
      '<div class="start-name"><span class="cand-no">' + esc(c.no) + "</span><h1>" + esc(c.name) + "</h1>" +
      '<span class="chip st-' + st + '">' + st + "</span></div>" +
      '<table class="profile">' +
      row("候補者番号", c.candidate_id) + row("職種", c.job) + row("日本語資格", c.japanese_cert) +
      row("SSW資格", c.ssw_cert) + row("主な職歴", c.work_history) +
      row("面接質問数", (st === "未実施" ? questionsFor(c, "full").length + "問（短縮版 " + questionsFor(c, "short").length + "問）"
        : qs.length + "問" + (modeOf(c) === "short" ? "・短縮版" : "") + "（採点済み " + s.answered + "問" + (s.skipped ? "・飛ばし " + s.skipped + "問" : "") + "）")) +
      "</table>" +
      '<p class="muted small">資格・職歴は履歴書の記載です（原本は未確認）。</p>' +
      '<div class="start-btns">' + btns + "</div>" +
      '<div class="start-links">' +
      (rec ? '<button class="linkbtn" data-act="reset">この候補者の採点をすべて消す</button>' : "") +
      (isAdded(c) ? '<button class="linkbtn" data-act="remove-cand">この候補者を一覧から消す</button>' : "") + "</div>" +
      "</section>";
  }

  /* ---------- 画面：質問 ---------- */
  function renderQuestion(c, n) {
    var qs = questionsOf(c);
    if (n < 1 || n > qs.length || isNaN(n)) { go(cHash(c) + "/q/1"); return; }
    headName.textContent = c.no + ". " + c.name;
    var idx = n - 1, q = qs[idx];
    var rec = getRec(c.candidate_id);
    if (rec && rec.current_index !== idx) setIndex(c, idx);
    var ans = rec && rec.answers[q.question_id];
    var cur = ans ? ans.score : 0;
    var s = stats(qs, rec && rec.answers, BANK);
    var last = idx === qs.length - 1;
    var auto = settings().auto_next;

    view.innerHTML =
      '<section class="q-screen" data-idx="' + idx + '">' +
      '<div class="q-top"><span class="q-count" id="qCount">Q' + n + " / " + qs.length + "</span>" +
      '<span class="q-cat" id="qCat">' + q.category + " " + esc(catName(BANK, q.category)) + "</span>" +
      (ans && ans.skipped ? '<span class="q-skipped" id="qSkipped">飛ばした質問</span>' : "") +
      '<span class="q-done">採点済み ' + s.answered + " / " + qs.length + (s.skipped ? "・飛ばし " + s.skipped : "") + "</span></div>" +
      '<div class="progress"><i style="width:' + Math.round((n / qs.length) * 100) + '%"></i></div>' +
      '<div class="q-text" id="qText">' + esc(q.text) + "</div>" +
      '<div class="scores" role="group" aria-label="採点">' +
      [1, 2, 3, 4, 5].map(function (v) {
        var g = SCORE_GUIDE[5 - v];
        return '<button class="score s' + v + (cur === v ? " on" : "") + '" data-score="' + v + '" aria-pressed="' + (cur === v) + '">' +
          "<b>" + v + "</b><small>" + g.short + "</small></button>";
      }).join("") + "</div>" +
      '<div class="q-nav">' +
      '<button class="btn btn-nav" id="prevBtn" data-act="prev"' + (idx === 0 ? " disabled" : "") + ">← 前へ</button>" +
      '<div class="q-mid">' +
      '<button class="btn" id="skipBtn" data-act="skip">飛ばす</button>' +
      '<button class="btn" data-act="guide">採点基準</button>' +
      '<button class="btn" data-act="memo">メモ' + (rec && rec.memo ? " ✓" : "") + "</button>" +
      '<button class="btn btn-ghost" data-act="toggle-auto" id="autoBtn">自動で次へ：' + (auto ? "ON" : "OFF") + "</button>" +
      "</div>" +
      (last
        ? '<button class="btn btn-primary btn-nav" id="resultBtn" data-act="finish">結果を見る</button>'
        : '<button class="btn btn-primary btn-nav" id="nextBtn" data-act="next">次へ →</button>') +
      "</div></section>";
  }

  /* v＝1〜5 / null＝飛ばす（飛ばした時は自動送りの設定に関係なく次へ） */
  function onScore(v) {
    var r = route();
    if (r.name !== "q") return;
    var c = findCand(r.cid), idx = r.n - 1;
    saveScore(c, idx, v);
    clearTimeout(autoTimer);
    renderQuestion(c, r.n);
    var qs = questionsOf(c);
    if ((settings().auto_next || v == null) && idx < qs.length - 1) {
      autoTimer = setTimeout(function () {
        var now = route();
        if (now.name === "q" && now.cid === r.cid && now.n === r.n && !modalOpen()) go(cHash(c) + "/q/" + (r.n + 1));
      }, AUTO_DELAY);
    } else if (idx === qs.length - 1) {
      toast("最後の質問です。「結果を見る」を押してください");
    }
  }

  function move(delta) {
    var r = route();
    if (r.name !== "q") return;
    clearTimeout(autoTimer);
    var c = findCand(r.cid), qs = questionsOf(c), n = r.n + delta;
    if (n < 1) return;
    if (n > qs.length) { finish(c); return; }
    go(cHash(c) + "/q/" + n);
  }

  function finish(c) {
    var rec = ensureRec(c);
    rec.interview_status = "完了";
    if (!rec.interview_date) rec.interview_date = today();
    putRec(rec);
    go(cHash(c) + "/result");
    if (SYNC_ON) sendResult(c);
  }

  /* ---------- スプレッドシートへ送る ---------- */
  function payloadOf(c) { return buildSyncPayload(c, questionsOf(c), ensureRec(c), BANK, modeOf(c)); }

  function syncState(c) {
    var rec = getRec(c.candidate_id);
    if (!rec || statusOf(c) === "未実施") return "";
    if (rec.synced_sig && rec.synced_sig === payloadOf(c).sig) return "送信済み";
    return rec.synced_at ? "変更あり・未送信" : "未送信";
  }

  var sending = {};
  function sendResult(c, quiet) {
    if (!SYNC_ON || sending[c.candidate_id]) return Promise.resolve(false);
    var rec = getRec(c.candidate_id);
    if (!rec || !rec.interview_date) return Promise.resolve(false);
    var p = payloadOf(c);
    sending[c.candidate_id] = true;
    return fetch(CONFIG.sync_url, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ token: CONFIG.sync_token, schema: p.schema, record: p.record })
    }).then(function (res) { return res.json(); }).then(function (out) {
      if (!out || !out.ok) throw new Error((out && out.error) || "応答なし");
      var r = getRec(c.candidate_id);
      r.synced_sig = p.sig; r.synced_at = new Date().toISOString();
      putRec(r);
      if (!quiet) toast(c.name + " をスプレッドシートに送りました");
      return true;
    }).catch(function (err) {
      toast("送れませんでした（" + err.message + "）。結果はこのパソコンに残っています");
      return false;
    }).then(function (ok) {
      delete sending[c.candidate_id];
      var r = route();
      if ((r.name === "result" && r.cid === c.candidate_id) || r.name === "results") refreshSyncView();
      return ok;
    });
  }

  function sendAllPending() {
    var list = candidates().filter(function (c) { var s = syncState(c); return s === "未送信" || s === "変更あり・未送信"; });
    if (!list.length) { toast("未送信の結果はありません"); return; }
    var okN = 0, i = 0;
    (function next() {
      if (i >= list.length) { toast(okN + " / " + list.length + " 人を送りました"); return; }
      sendResult(list[i++], true).then(function (ok) { if (ok) okN++; next(); });
    })();
  }

  /* 送信後に画面全体を描き直さず、送信状態の表示だけ更新する（面接官の操作を邪魔しない） */
  function refreshSyncView() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-sync-cid]"), function (el) {
      var c = findCand(el.getAttribute("data-sync-cid"));
      if (c) el.outerHTML = syncChip(c);
    });
  }

  function syncChip(c) {
    if (!SYNC_ON) return "";
    var s = syncState(c);
    if (!s) return '<span class="sync-chip" data-sync-cid="' + esc(c.candidate_id) + '"></span>';
    return '<span class="sync-chip sync-' + (s === "送信済み" ? "ok" : "ng") + '" data-sync-cid="' + esc(c.candidate_id) + '">' + s + "</span>";
  }

  /* ---------- 画面：結果 ---------- */
  function renderResult(c) {
    headName.textContent = c.no + ". " + c.name;
    var qs = questionsOf(c);
    var rec = getRec(c.candidate_id) || ensureRec(c);
    var s = stats(qs, rec.answers, BANK);
    var maxD = Math.max(1, s.dist[5], s.dist[4], s.dist[3], s.dist[2], s.dist[1]);
    var st = statusOf(c);
    view.innerHTML =
      '<section class="result">' +
      '<div class="res-head"><h1>' + esc(c.name) + ' <span class="muted">' + esc(c.candidate_id) + "</span></h1>" +
      '<span class="chip st-' + st + '">' + st + "</span>" +
      '<span class="muted">面接日 ' + esc(rec.interview_date || "—") + "</span>" + syncChip(c) +
      '<div class="res-btns">' + (SYNC_ON && rec.interview_date ? '<button class="btn" id="sendBtn" data-act="send">スプレッドシートに送る</button>' : "") +
      '<a class="btn" href="' + cHash(c) + "/q/" + (Math.min(rec.current_index || 0, qs.length - 1) + 1) + '">質問に戻って修正</a>' +
      '<a class="btn" href="#/results">全結果</a><a class="btn btn-primary" href="#/">ホームへ</a></div></div>' +
      '<div class="res-grid">' +
      '<div class="res-card res-main">' +
      '<div class="avg"><span id="resAvg">' + fmt(s.avg) + '</span><small> / 5</small></div>' +
      '<div class="level" id="resLevel">' + esc(s.level || "未採点") + "</div>" +
      '<p class="muted small">参考評価です。採用可否は自動で決めません。最終判断は面接官が行います。</p>' +
      '<table class="nums">' +
      "<tr><th>総質問数</th><td id='resTotal'>" + s.total + "</td></tr>" +
      "<tr><th>回答済み</th><td id='resAnswered'>" + s.answered + "</td></tr>" +
      "<tr><th>未採点</th><td id='resUnscored'>" + s.unscored + "</td></tr>" +
      (s.skipped ? "<tr><th>飛ばした質問</th><td id='resSkipped'>" + s.skipped + "</td></tr>" : "") +
      "<tr><th>合計点</th><td id='resSum'>" + s.sum + "</td></tr></table></div>" +
      '<div class="res-card res-dist"><h2>点数の内訳</h2><div class="bars">' +
      [5, 4, 3, 2, 1].map(function (v) {
        return '<div class="bar-row"><span class="bar-k">' + v + '点</span><span class="bar"><i class="s' + v + '" style="width:' +
          Math.round((s.dist[v] / maxD) * 100) + '%"></i></span><span class="bar-v" data-dist="' + v + '">' + s.dist[v] + "問</span></div>";
      }).join("") + "</div></div>" +
      '<div class="res-card res-cat"><h2>カテゴリー別平均</h2><div class="bars">' +
      s.byCat.map(function (x) {
        return '<div class="bar-row"><span class="bar-k">' + x.code + " " + esc(x.name) + '</span><span class="bar"><i style="width:' +
          (x.avg == null ? 0 : Math.round((x.avg / 5) * 100)) + '%"></i></span><span class="bar-v" data-cat="' + x.code + '">' +
          fmt(x.avg) + "</span></div>";
      }).join("") + "</div></div>" +
      '<div class="res-card res-memo"><h2>面接官メモ</h2><p class="memo-view">' + (rec.memo ? esc(rec.memo) : '<span class="muted">なし</span>') + "</p>" +
      '<button class="btn" data-act="memo">メモを書く</button></div>' +
      "</div></section>";
  }

  /* ---------- 画面：全結果 ---------- */
  function renderResults() {
    headName.textContent = "";
    var list = candidates();
    view.innerHTML =
      '<section class="results"><div class="home-head"><h1>全候補者の結果</h1>' +
      '<div class="tools">' + (SYNC_ON ? '<button class="btn" id="sendAllBtn" data-act="send-all">未送信をまとめて送る</button>' : "") +
      '<button class="btn" data-act="export">結果をCSVで保存</button>' +
      '<button class="btn" id="backupBtn" data-act="backup">バックアップを保存</button>' +
      '<label class="btn" id="restoreBtn">バックアップを読み込む<input type="file" id="bkIn" accept=".json,application/json" hidden></label>' +
      '<button class="btn btn-ghost" id="wipeBtn" data-act="wipe">データを初期化</button><a class="btn btn-primary" href="#/">ホームへ</a></div></div>' +
      fileWarning() + '<table class="rtable"><thead><tr><th>No</th><th>名前</th><th>面接状況</th><th>平均点</th><th>会話レベル</th><th>採点</th><th>面接日</th>' + (SYNC_ON ? "<th>送信</th>" : "") + "</tr></thead><tbody>" +
      list.map(function (c) {
        var rec = getRec(c.candidate_id);
        var s = stats(questionsOf(c), rec && rec.answers, BANK);
        var st = statusOf(c);
        var href = st === "未実施" ? cHash(c) : cHash(c) + "/result";
        return '<tr data-cid="' + esc(c.candidate_id) + '"><td>' + esc(c.no) + '</td><td><a href="' + href + '">' + esc(c.name) + "</a></td>" +
          '<td><span class="chip st-' + st + '">' + st + "</span></td><td class='num'>" + fmt(s.avg) + "</td><td>" + esc(s.level || "—") +
          "</td><td class='num'>" + s.answered + " / " + s.total + (s.skipped ? "<small class='muted'>（飛ばし" + s.skipped + "）</small>" : "") + "</td><td>" + esc((rec && rec.interview_date) || "—") + "</td>" + (SYNC_ON ? "<td>" + syncChip(c) + "</td>" : "") + "</tr>";
      }).join("") + "</tbody></table>" +
      '<p class="muted small">平均点・会話レベルは参考評価です。採用可否は面接官が判断します。</p></section>';

    document.getElementById("bkIn").addEventListener("change", function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        try {
          var inc = JSON.parse(fr.result);
          var cur = { records: db().records, candidates: readJSON(IMPORT_KEY, []) };
          var m = mergeBackup(cur, inc);
          writeJSON(KEY, { records: m.records });
          writeJSON(IMPORT_KEY, m.candidates.filter(function (c) {
            return !(window.OUKA_INTERVIEW_CANDIDATES || []).some(function (b) { return b.candidate_id === c.candidate_id; });
          }));
          toast("読み込みました（追加 " + m.added + "人・更新 " + m.updated + "人・そのまま " + m.kept + "人）");
          render();
        } catch (err) { toast("読み込めません：" + err.message); }
      };
      fr.readAsText(f, "utf-8");
    });
  }

  function backup() {
    var data = { app: "ouka-interview", ver: 1, saved_at: new Date().toISOString(),
      records: db().records, candidates: readJSON(IMPORT_KEY, []) };
    var blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "OUKA_会話面接_バックアップ_" + today() + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    toast("バックアップを保存しました（ダウンロードフォルダ）");
  }

  function exportCSV() {
    var cols = ["candidate_id", "candidate_name", "question_id", "question_text", "category", "score", "interview_date", "interview_status", "mode", "memo"];
    var lines = [cols.join(",")];
    candidates().forEach(function (c) {
      var rec = getRec(c.candidate_id);
      if (!rec) return;
      var st = statusOf(c);
      questionsOf(c).forEach(function (q) {
        var a = rec.answers[q.question_id];
        lines.push([c.candidate_id, c.name, q.question_id, q.text, q.category + " " + catName(BANK, q.category),
          a ? (a.skipped ? "飛ばし" : a.score) : "", rec.interview_date, st, modeOf(c) === "short" ? "短縮版" : "全問", rec.memo].map(csvCell).join(","));
      });
    });
    if (lines.length === 1) { toast("まだ保存する結果がありません"); return; }
    var blob = new Blob(["\uFEFF" + lines.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "OUKA_会話面接結果_" + today() + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- ルーター ---------- */
  function route() {
    var h = (location.hash || "#/").replace(/^#/, "");
    var m;
    if (h === "/results") return { name: "results" };
    if (h === "/new") return { name: "new" };
    var sf = h.match(/^\/set\/([a-z]+)$/);
    if (sf) return { name: "setfield", code: sf[1] };
    if (h === "/check") return { name: "check" };
    if (h === "/candidates") return { name: "candidates" };
    if (h === "/upload") return { name: "upload" };
    if (h === "/student") return { name: "hub", hub: "student" };
    if (h === "/teacher") return { name: "hub", hub: "teacher" };
    var mm = h.match(/^\/(student|teacher)\/([a-z_]+)(?:\/(\d+))?$/);
    if (mm) return { name: "soon", hub: mm[1], item: mm[2], day: mm[3] ? parseInt(mm[3], 10) : 0 };
    if ((m = h.match(/^\/c\/([^/]+)\/q\/(\d+)$/))) return { name: "q", cid: decodeURIComponent(m[1]), n: parseInt(m[2], 10) };
    if ((m = h.match(/^\/c\/([^/]+)\/result$/))) return { name: "result", cid: decodeURIComponent(m[1]) };
    if ((m = h.match(/^\/c\/([^/]+)$/))) return { name: "start", cid: decodeURIComponent(m[1]) };
    return { name: "home" };
  }

  /* ファイルとして開くと Google へ送れない（Apps Script への送信が返らない）。気づけるように出す。 */
  function fileWarning() {
    if (location.protocol !== "file:") return "";
    return '<div class="warn">この開き方では<b>スプレッドシートに送れません</b>。' +
      '「面接アプリを開く.command」から開き直してください。' +
      (Object.keys(db().records).length ? '採点済みの記録は<b>「バックアップを保存」</b>（下のボタン）→ 新しい画面の「バックアップを読み込む」で移せます。' : "") +
      '<button class="btn btn-sm" data-act="backup">バックアップを保存</button></div>';
  }

  function render() {
    /* 入力中の欄を消しながら描き直すとブラウザがエラーを出すので、先に手を離す */
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    clearTimeout(autoTimer);
    clearTimeout(toastTimer);
    document.getElementById("toast").classList.remove("show");
    closeModal();
    var r = route();
    /* オンライン版：役割で開けない画面は、その人のホームへ戻す（生徒は生徒の画面だけ） */
    if (ONLINE && !ONLINE.allow(r)) { location.replace(ONLINE.home()); return; }
    var c = r.cid ? findCand(r.cid) : null;
    if (r.cid && !c) { toast("候補者が見つかりません"); r = { name: "home" }; }
    document.body.setAttribute("data-screen", r.name);
    if (r.name === "setfield") {
      if (fieldList().some(function (f) { return f.code === r.code; })) { setField(r.code); toast(currentField().label + "コースにしました"); }
      go("#/student/media");
      return;
    }
    if (r.name === "home") renderPlatform();
    else if (r.name === "candidates") renderHome();
    else if (r.name === "upload") renderUpload();
    else if (r.name === "hub") renderHub(r.hub);
    else if (r.name === "soon") {
      var kk = r.hub + "/" + r.item;
      if (kk === "teacher/study") renderLive(r.hub, r.item, r.day || 0);
      else if (LIVE[kk] && LESSONS) renderLive(r.hub, r.item, r.day && r.day <= dayCount() ? r.day : 0);
      else renderSoon(r.hub, r.item);
    }
    else if (r.name === "check") renderCheck();
    else if (r.name === "results") { renderResults(); }
    else if (r.name === "new") renderNew();
    else if (r.name === "start") renderStart(c);
    else if (r.name === "q") renderQuestion(c, r.n);
    else if (r.name === "result") renderResult(c);
    view.scrollTop = 0;
    if (ONLINE && ONLINE.afterRender) ONLINE.afterRender(view);
  }

  /* ---------- 操作 ---------- */
  document.addEventListener("click", function (e) {
    var sb = e.target.closest("[data-score]");
    if (sb) { onScore(parseInt(sb.getAttribute("data-score"), 10)); return; }
    var el = e.target.closest("[data-act]");
    if (!el) { if (e.target === modal) closeModal(); return; }
    var act = el.getAttribute("data-act");
    var r = route(), c = r.cid ? findCand(r.cid) : null;
    if (act === "prev") move(-1);
    else if (act === "next") move(1);
    else if (act === "finish") finish(c);
    else if (act === "skip") onScore(null);
    else if (act === "send") sendResult(c);
    else if (act === "send-all") sendAllPending();
    else if (act === "start") {
      var rec = ensureRec(c);
      rec.mode = el.getAttribute("data-mode") === "short" ? "short" : "full";
      putRec(rec);
      go(cHash(c) + "/q/1");
    }
    else if (act === "guide") showGuide();
    else if (act === "memo") showMemo(c);
    else if (act === "close-modal") { closeModal(); if (r.name === "q" || r.name === "result") render(); }
    else if (act === "toggle-auto") { var s = settings(); s.auto_next = !s.auto_next; writeJSON(SETTINGS_KEY, s); render(); }
    else if (act === "export") exportCSV();
    else if (act === "backup") backup();
    else if (act === "cv-parse") cvParse();
    else if (act === "set-field") { setField(el.getAttribute("data-field")); toast(el.textContent + "コースにしました"); render(); }
    else if (act === "set-today") { setCurrentDay(parseInt(el.getAttribute("data-day"), 10)); toast("Day " + el.getAttribute("data-day") + " を「今日」にしました"); render(); }
    else if (act === "drill-pick" && quiz) {
      var pid = quiz.ids[quiz.idx];
      quiz.picked[pid] = LESSONS.problems[pid].choices[parseInt(el.getAttribute("data-i"), 10)];
      drSave(quiz.day, quiz.ids, quiz.picked, currentField().code);
      render();
    }
    else if (act === "drill-next" && quiz) { quiz.idx++; render(); }
    else if (act === "drill-prev" && quiz) { quiz.idx = Math.max(0, quiz.idx - 1); render(); }
    else if (act === "drill-again" && quiz) { quiz = null; render(); }
    else if (act === "hw-save") hwSave(route().day || currentDay(), true);
    else if (act === "hw-submit") hwSubmit(route().day || currentDay());
    else if (act === "hw-edit") {
      var rr = hwGet(studentName(), route().day || currentDay());
      if (rr) { rr.submitted_at = ""; hwPut(rr); render(); }
    }
    else if (act === "hw-export") hwExport(route().day || currentDay());
    else if (act === "ts-save") tsSave(route().day || 1, true);
    else if (act === "ts-submit") tsSubmit(route().day || 1);
    else if (act === "ts-edit") {
      var tr = tsGet(teacherName(), route().day || 1);
      if (tr) { tr.submitted_at = ""; tsPut(tr); render(); }
    }
    else if (act === "check-export") checkExport();
    else if (act === "study-send") studySend(el);
    else if (act === "gr-save") gradeSave(document.getElementById("grWeek").value);
    else if (act === "roster-save") {
      setRoster("teacher", (document.getElementById("rosterT") || {}).value);
      setRoster("student", (document.getElementById("rosterS") || {}).value);
      toast("名簿を保存しました");
      render();
    }
    else if (act === "rec-start") {
      var day = route().day || currentDay();
      var ph = speakPhrases(dayData(day))[parseInt(el.getAttribute("data-i"), 10)];
      recStart("audio", ph.label + "：" + ph.text, day);
    }
    else if (act === "rec-stop") recStop();
    else if (act === "media-del") {
      if (confirm("この録音／動画を消しますか？")) {
        mediaDel(el.getAttribute("data-id")).then(function () { toast("消しました"); refreshMediaList(el.getAttribute("data-day")); render(); });
      }
    }
    else if (act === "wipe") {
      if (!confirm("この端末に入っている面接データ（採点・メモ・登録した候補者）をすべて消します。\n先に「バックアップを保存」をしましたか？")) return;
      if (!confirm("本当に消しますか？元に戻せません。")) return;
      writeJSON(KEY, { records: {} });
      writeJSON(IMPORT_KEY, []);
      toast("この端末のデータを消しました");
      go("#/");
    }
    else if (act === "clear-import") {
      if (confirm("追加した候補者（当日登録・CSV）を一覧から消しますか？（採点結果は残ります）")) { writeJSON(IMPORT_KEY, []); render(); }
    } else if (act === "reset") {
      if (confirm(c.name + " の採点とメモをすべて消しますか？元に戻せません。")) {
        var d = db(); delete d.records[c.candidate_id]; writeJSON(KEY, d); render();
      }
    } else if (act === "remove-cand") {
      if (confirm(c.name + " を一覧から消しますか？採点とメモも消えます。元に戻せません。")) {
        writeJSON(IMPORT_KEY, readJSON(IMPORT_KEY, []).filter(function (x) { return x.candidate_id !== c.candidate_id; }));
        var d2 = db(); delete d2.records[c.candidate_id]; writeJSON(KEY, d2);
        go("#/");
      }
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modalOpen()) { closeModal(); render(); return; }
    var t = e.target;
    if (modalOpen() || (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT"))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (route().name !== "q") return;
    if (/^[1-5]$/.test(e.key)) { e.preventDefault(); onScore(parseInt(e.key, 10)); }
    else if (e.key === "s" || e.key === "S") { e.preventDefault(); onScore(null); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move(-1); }
  });

  /* オンライン版の自動送信が、この画面の記録を読むための口（ローカル版では使わない） */
  window.OUKA_APP_API = { studyRecords: studyRecords, render: function () { render(); } };

  window.addEventListener("hashchange", render);
  render();
})(this);
