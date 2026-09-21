/* ============================================================================
 * assessment-scoring.js  ―  適性診断のスコア計算エンジン
 * ----------------------------------------------------------------------------
 * 【設計方針】
 *  ・職種は「英語コード（固定値）」で管理します（表示名は言語別）。
 *  ・各職種のスコアは、質問（assessment-questions.js の id）と選択肢(value)を
 *    参照して計算します。表示テキストを変えてもスコアは壊れません。
 *  ・スコアは 0〜100 点に正規化します（回答した項目だけで raw と max を積み上げ、
 *    score = round(raw / max * 100)）。→ 100 を超えることはありません。
 *  ・未回答の項目は raw にも max にも加えません（未回答で不利になりません）。
 *
 * 【職種の追加・調整のしかた】
 *  ・下の JOBS 配列に1件足すだけで新職種が増えます。
 *  ・L(qid, w) … likert質問(1〜5)。1→0点, 5→満点(w)。w は重み（既定1）。
 *  ・M(qid, map, w) … 選択式。map は {選択肢value: 0〜1の係数}。満点は w。
 *  ・重要な要素ほど w を大きく（例：その職種の実務経験 1.5〜2）。
 *
 * 【表示メッセージ】
 *  ・why(向いている理由) / prepare(準備) / neededJp(必要な日本語目安)/ cautions は
 *    {ja, en} で保持。ネパール語は各所に ne を足せば対応できます。
 * ==========================================================================*/

(function () {

  /* --- factor 生成ヘルパ --- */
  function L(qid, w) { return { kind: "likert", qid: qid, w: (w == null ? 1 : w) }; }
  function M(qid, map, w) { return { kind: "map", qid: qid, map: map, w: (w == null ? 1 : w) }; }

  /* よく使う係数マップ */
  var YSN = { YES: 1, SOME: 0.5, NO: 0 };          // はい/少し/いいえ
  var YN  = { YES: 1, NO: 0 };                       // はい/いいえ
  var RURAL = { RURAL: 1, EITHER: 0.7, CITY: 0.2 };  // 地方志向
  var EDU = { MASTER: 1, BACHELOR: 1, DIPLOMA: 0.7, UPPER_SEC: 0.4, LOWER_SEC: 0.2, OTHER: 0.3 };
  var JP_HIGH = { N3_PLUS: 1, N4_PASS: 0.85, N4_LEVEL: 0.65, N5_PASS: 0.45, N5_LEVEL: 0.3, HIRAGANA: 0.12, NONE: 0 };

  /* ---- 日本語の要件（2026-08-05 代表指示）--------------------------------
   * 職種ごとに「どのくらい日本語が要るか」は違います。ここでは
   *   ・現在の日本語レベル（japaneseLevel）
   *   ・JLPTの取得状況（jlptStatus）
   *   ・ひらがな／カタカナが読めるか
   * を職種ごとに別の重みで加点します。値は 0〜1（1が満点）。
   *
   *   介護       … JLPT N4以上で満点。ひらがな・カタカナが読めることも重視
   *   外食       … JLPT N5以上あれば満点
   *   建設       … 日本語未経験でも可（ここで差がつきにくい配点にする）
   *   製造       … N5相当以上で加点
   *   ホテル     … N4以上で大幅加点
   *   通訳・事務 … N3以上で大幅加点
   * ---------------------------------------------------------------------- */
  var JLPT_N4 = { N1: 1, N2: 1, N3: 1, N4: 1, N5: 0.4, NONE: 0 };   /* N4以上で満点（介護・ホテル） */
  var JLPT_N5 = { N1: 1, N2: 1, N3: 1, N4: 1, N5: 1,   NONE: 0 };   /* N5以上で満点（外食） */
  var JLPT_N3 = { N1: 1, N2: 1, N3: 1, N4: 0.5, N5: 0.2, NONE: 0 }; /* N3以上で満点（通訳・事務） */

  var JP_N5_UP = { N3_PLUS: 1, N4_PASS: 1, N4_LEVEL: 0.9, N5_PASS: 0.8, N5_LEVEL: 0.7, HIRAGANA: 0.2, NONE: 0 };
  var JP_N4_UP = { N3_PLUS: 1, N4_PASS: 1, N4_LEVEL: 0.85, N5_PASS: 0.5, N5_LEVEL: 0.35, HIRAGANA: 0.1, NONE: 0 };
  var JP_ANY   = { N3_PLUS: 1, N4_PASS: 1, N4_LEVEL: 1, N5_PASS: 1, N5_LEVEL: 1, HIRAGANA: 0.9, NONE: 0.8 };

  var KANA = { YES: 1, SOME: 0.6, NO: 0 };   /* ひらがな・カタカナが読めるか */

  /* --- 職種定義 --- */
  var JOBS = [
    {
      code: "CONSTRUCTION",
      name: { ja: "建設（電気・配管・土木・解体等）", en: "Construction (electrical/plumbing/civil/demolition)" },
      factors: [
        L("likeActive"), L("outdoorOk"), L("tempOk"), L("likeTools"), L("heightOk"),
        L("teamwork"), L("followRules"), L("punctual"), L("reportFail"), L("dirtyOk"),
        M("expConstruction", YSN, 1.5), M("canLiftHeavy", YSN), M("canStandLong", YSN),
        M("canOutdoorWork", YSN), M("heightResist", YSN),
        /* 建設：日本語未経験でも受け入れる（ここでは差がつきにくい配点） */
        M("japaneseLevel", JP_ANY, 0.6), M("canReadHiragana", KANA, 0.4)
      ],
      neededJp: { ja: "N5〜N4を目安（安全のことばと指示が分かること）", en: "Around N5–N4 (understand safety words and instructions)" },
      why: { ja: "体を動かす仕事・屋外・道具の扱い・チームでの安全作業への適性がうかがえます。", en: "You show aptitude for active, outdoor, tool-based work and safe teamwork." },
      prepare: { ja: "安全のことば（危険・注意・指差呼称）と、あいさつ・報連相を練習しましょう。", en: "Practice safety vocabulary, greetings, and reporting/communication." }
    },
    {
      code: "CAREGIVING",
      name: { ja: "介護", en: "Caregiving" },
      factors: [
        L("likeCare", 1.3), L("elderlyOk", 1.2), L("listenCalm"), L("talkStrangers"),
        L("repetitiveOk"), L("studyDaily"), L("followRules"), L("reportFail"), L("dirtyOk"),
        M("expCaregiving", YSN, 1.5), M("canNightShift", YSN), M("canStandLong", YSN),
        /* 介護：JLPT N4以上を重視。ひらがな・カタカナが読めること */
        M("japaneseLevel", JP_N4_UP, 1.6), M("jlptStatus", JLPT_N4, 1.4),
        M("canReadHiragana", KANA, 1.0), M("canReadKatakana", KANA, 0.8)
      ],
      neededJp: { ja: "N4以上が望ましい（利用者との会話・記録が必要）", en: "N4 or above preferred (conversation and records with users)" },
      why: { ja: "人の世話・傾聴・落ち着いた対応への適性がうかがえます。介護は日本語の会話力も大切です。", en: "You show aptitude for caring, listening, and calm support. Conversation skills matter in caregiving." },
      prepare: { ja: "会話の日本語と、あいさつ・体調をたずねる表現を練習しましょう。", en: "Practice conversational Japanese and phrases to ask about someone's condition." }
    },
    {
      code: "AGRICULTURE",
      name: { ja: "農業・畜産", en: "Agriculture / Livestock" },
      factors: [
        L("outdoorOk", 1.2), L("earlyOk"), L("likeActive"), L("likeNature", 1.2),
        L("repetitiveOk"), L("tempOk"), L("dirtyOk"),
        M("cityOrRural", RURAL), M("expAgriculture", YSN, 1.5), M("canOutdoorWork", YSN),
        M("canStandLong", YSN), M("canLiftHeavy", YSN)
      ],
      neededJp: { ja: "N5〜N4を目安（作業指示・天候・道具のことば）", en: "Around N5–N4 (task, weather, tool vocabulary)" },
      why: { ja: "屋外作業・早朝・植物や動物への興味・反復作業への適性がうかがえます。", en: "You show aptitude for outdoor, early-morning, nature-related, and repetitive work." },
      prepare: { ja: "作業指示のことばと、地方での生活・共同生活への準備をしましょう。", en: "Practice task-instruction vocabulary and prepare for rural and shared living." }
    },
    {
      code: "FOOD_SERVICE",
      name: { ja: "外食", en: "Food service" },
      factors: [
        L("likeCookServe", 1.3), L("talkStrangers"), L("busyCalm", 1.2), L("teamwork"),
        L("detailWork"), L("punctual"),
        M("canConverse", YSN), M("canStandLong", YSN), M("canNightShift", YSN),
        M("expFood", YSN, 1.5),
        /* 外食：JLPT N5以上あれば十分 */
        M("japaneseLevel", JP_N5_UP, 1.0), M("jlptStatus", JLPT_N5, 1.0),
        M("canReadHiragana", KANA, 0.6)
      ],
      neededJp: { ja: "N4を目安（接客・注文のやりとり）", en: "Around N4 (serving and taking orders)" },
      why: { ja: "接客・料理・忙しい環境での落ち着き・チームワークへの適性がうかがえます。", en: "You show aptitude for serving, cooking, staying calm when busy, and teamwork." },
      prepare: { ja: "接客の日本語（いらっしゃいませ・注文・会計）と清潔・衛生の習慣を練習しましょう。", en: "Practice service Japanese and hygiene habits." }
    },
    {
      code: "HOSPITALITY",
      name: { ja: "宿泊", en: "Hospitality" },
      factors: [
        L("likeCookServe"), L("talkStrangers", 1.2), L("teamwork"), L("detailWork", 1.2),
        L("busyCalm"), L("punctual"), L("followRules"),
        M("canConverse", YSN), M("canStandLong", YSN), M("canNightShift", YSN),
        /* ホテル：N4以上で大幅加点（接客のことばが要る） */
        M("japaneseLevel", JP_N4_UP, 1.8), M("jlptStatus", JLPT_N4, 1.6),
        M("canReadHiragana", KANA, 0.8)
      ],
      neededJp: { ja: "N4を目安（接客・案内のことば）", en: "Around N4 (guest service and guidance)" },
      why: { ja: "接客・丁寧な作業・チームワーク・落ち着いた対応への適性がうかがえます。", en: "You show aptitude for guest service, careful work, teamwork, and calm handling." },
      prepare: { ja: "接客・案内の日本語と、丁寧な清掃・整えの習慣を練習しましょう。", en: "Practice guest-service Japanese and careful cleaning/tidying." }
    },
    {
      code: "MANUFACTURING",
      name: { ja: "工場・製造", en: "Factory / Manufacturing" },
      factors: [
        L("repetitiveOk", 1.3), L("detailWork", 1.2), L("likeTools"), L("followRules"),
        L("teamwork"), L("punctual"), L("busyCalm"),
        M("canStandLong", YSN), M("canNightShift", YSN), M("expManufacturing", YSN, 1.5),
        /* 製造：N5相当以上で加点 */
        M("japaneseLevel", JP_N5_UP, 1.2), M("canReadHiragana", KANA, 0.6)
      ],
      neededJp: { ja: "N5〜N4を目安（作業手順・安全のことば）", en: "Around N5–N4 (procedures and safety words)" },
      why: { ja: "正確な反復作業・細かい作業・道具の扱い・安全とチームワークへの適性がうかがえます。", en: "You show aptitude for accurate repetitive work, detail, tools, safety, and teamwork." },
      prepare: { ja: "作業手順の日本語と、正確さ・時間厳守・安全の習慣を練習しましょう。", en: "Practice procedure Japanese and accuracy, punctuality, and safety habits." }
    },
    {
      code: "BUILDING_CLEANING",
      name: { ja: "ビルクリーニング", en: "Building Cleaning" },
      factors: [
        L("repetitiveOk", 1.3), L("detailWork", 1.2), L("dirtyOk", 1.2), L("followRules"),
        L("punctual"), L("reportFail"), L("teamwork"),
        M("canStandLong", YSN, 1.2), M("canNightShift", YSN), M("canConverse", YSN),
        M("japaneseLevel", JP_N5_UP, 0.8), M("canReadHiragana", KANA, 0.5)
      ],
      neededJp: { ja: "N5〜N4を目安（清掃手順・薬剤・安全表示のことば）", en: "Around N5–N4 (cleaning procedures, chemicals and safety signs)" },
      why: { ja: "正確な反復作業、細部への注意、ルール遵守、立ち仕事への適性がうかがえます。", en: "You show aptitude for accurate repetitive work, attention to detail, rules and standing work." },
      prepare: { ja: "清掃用具・薬剤・危険表示、報告の日本語を練習しましょう。", en: "Practice Japanese for cleaning tools, chemicals, hazard signs and reporting." }
    },
    {
      code: "DRIVING_TRANSPORT",
      name: { ja: "運転・運送", en: "Driving / Transport" },
      factors: [
        L("followRules", 1.4), L("punctual", 1.3), L("reportFail"), L("listenCalm"),
        L("teamwork"), L("busyCalm"),
        M("expDriving", YSN, 2.0), M("canConverse", YSN, 1.0),
        M("japaneseLevel", JP_N4_UP, 1.2), M("canReadHiragana", KANA, 0.6)
      ],
      neededJp: { ja: "N4前後を目安（安全指示・標識・報告連絡の理解を重視）", en: "Around N4 (safety instructions, signs and reporting)" },
      why: { ja: "運転経験、ルール遵守、時間管理、落ち着いた報告への適性がうかがえます。", en: "You show aptitude through driving experience, rule compliance, time management and calm reporting." },
      prepare: { ja: "日本の交通・安全用語、報連相、仕事で使う読み取りを練習しましょう。", en: "Practice Japanese traffic/safety terms, reporting and work-related reading." }
    },
    {
      code: "AUTO_MAINTENANCE",
      name: { ja: "自動車整備", en: "Auto maintenance" },
      factors: [
        L("likeTools", 1.3), L("likeLogic"), L("detailWork", 1.2), L("likeNewTech"),
        L("studyDaily"), L("teamwork"), L("followRules"),
        M("expDriving", YSN), M("expManufacturing", YSN)
      ],
      neededJp: { ja: "N4を目安（部品・工具・手順のことば）", en: "Around N4 (parts, tools, procedures)" },
      why: { ja: "道具・機械への興味、論理的思考、細かい作業、学び続ける姿勢への適性がうかがえます。", en: "You show aptitude for tools/machines, logical thinking, detail, and continuous learning." },
      prepare: { ja: "工具・部品の名前と、手順書を読む日本語を練習しましょう。", en: "Practice tool/part names and reading procedure manuals in Japanese." }
    },
    {
      code: "IT_ENGINEERING",
      name: { ja: "IT・エンジニア", en: "IT / Engineering" },
      factors: [
        L("interestPC", 1.3), L("likeLogic", 1.3), L("likeNewTech", 1.2), L("readComprehend"),
        L("studyDaily"), L("detailWork"),
        M("expPC", YSN, 1.5), M("education", EDU)
      ],
      neededJp: { ja: "N4〜N3を目安（読み書き・技術用語）＋英語があると有利", en: "Around N4–N3 (reading/writing, technical terms); English helps" },
      why: { ja: "パソコンへの興味、論理的思考、継続学習、読解への適性がうかがえます。", en: "You show aptitude for computers, logical thinking, continuous learning, and reading." },
      prepare: { ja: "パソコン基礎と、技術の日本語（または英語）の読み書きを練習しましょう。", en: "Build PC basics and practice reading/writing technical Japanese (or English)." }
    },
    {
      code: "OFFICE_INTERPRETATION",
      name: { ja: "事務・通訳", en: "Office / Interpretation" },
      factors: [
        M("japaneseLevel", JP_HIGH, 2), L("readComprehend", 1.3), L("talkStrangers"),
        L("detailWork", 1.2), L("interestPC"), L("listenCalm"),
        M("expPC", YSN), M("education", EDU),
        /* 通訳・事務：N3以上で大幅加点 */
        M("jlptStatus", JLPT_N3, 2.0), M("canReadHiragana", KANA, 0.5)
      ],
      neededJp: { ja: "N3以上が望ましい（読み書き・会話・通訳）", en: "N3 or above preferred (read/write, conversation, interpretation)" },
      why: { ja: "日本語の読み書き・会話、正確な事務作業、パソコンへの適性がうかがえます。", en: "You show aptitude for Japanese reading/writing, conversation, accurate office work, and PC use." },
      prepare: { ja: "日本語の読み書き（N3〜）と、書類・パソコンの基本を練習しましょう。", en: "Aim for N3+ reading/writing and practice documents and PC basics." }
    }
  ];

  /* --- 強みラベル（likert が高い＝4以上のとき表示） --- */
  var STRENGTH_LABELS = {
    likeActive:   { ja: "体を動かす仕事への意欲", en: "Motivation for active work" },
    outdoorOk:    { ja: "屋外作業への強さ", en: "Comfort with outdoor work" },
    likeTools:    { ja: "道具・機械の扱いへの関心", en: "Interest in tools and machines" },
    detailWork:   { ja: "細かい作業の丁寧さ", en: "Care with detailed work" },
    repetitiveOk: { ja: "正確な反復作業の力", en: "Accurate repetitive work" },
    likeCare:     { ja: "人を支える姿勢", en: "A caring attitude" },
    listenCalm:   { ja: "落ち着いて聞く力", en: "Calm listening" },
    teamwork:     { ja: "チームで協力する力", en: "Teamwork" },
    punctual:     { ja: "時間を守る意識", en: "Punctuality" },
    followRules:  { ja: "ルールを守る意識", en: "Respect for rules" },
    reportFail:   { ja: "正直に報告する姿勢", en: "Honest reporting" },
    studyDaily:   { ja: "学び続ける力", en: "Consistent studying" },
    talkStrangers:{ ja: "はじめての人とも話せる力", en: "Openness with new people" },
    busyCalm:     { ja: "忙しくても落ち着ける力", en: "Composure under pressure" },
    likeLogic:    { ja: "論理的に考える力", en: "Logical thinking" },
    likeNewTech:  { ja: "新しい技術を学ぶ意欲", en: "Eagerness for new tech" },
    readComprehend:{ ja: "読んで理解する力", en: "Reading comprehension" },
    workLong3y:   { ja: "長く働く意思", en: "Commitment to work long-term" },
    liveApart:    { ja: "自立して生活する覚悟", en: "Readiness to live independently" }
  };

  /* --- 1つの職種のスコア（0〜100） ---
   * 分母(max)は「その職種の全要素の重み合計（固定）」。
   * 未回答は raw に 0 を加える（＝その職種の要件に対する“証拠なし”）。
   * → 回答が重なった項目だけで満点化するのを防ぎ、職種間の判別性を保つ。
   *   多く答えるほど、また要件に合致するほどスコアが上がる（直感的）。
   */
  function scoreJob(job, answers) {
    var raw = 0, max = 0;
    for (var i = 0; i < job.factors.length; i++) {
      var f = job.factors[i];
      max += f.w;                       // 分母は固定（未回答でも計上）
      var v = answers[f.qid];
      if (v === undefined || v === null || v === "") continue; // 未回答は raw に 0
      if (f.kind === "likert") {
        var num = parseInt(v, 10);
        if (isNaN(num)) continue;
        raw += ((num - 1) / 4) * f.w;   // 1→0, 5→w
      } else if (f.kind === "map") {
        var c = f.map.hasOwnProperty(v) ? f.map[v] : 0;
        raw += c * f.w;
      }
    }
    if (max === 0) return 0;
    return Math.round((raw / max) * 100);
  }

  /* --- 強み（上位3つ） --- */
  function computeStrengths(answers) {
    var found = [];
    for (var qid in STRENGTH_LABELS) {
      if (!STRENGTH_LABELS.hasOwnProperty(qid)) continue;
      var v = parseInt(answers[qid], 10);
      if (!isNaN(v) && v >= 4) found.push({ qid: qid, v: v, label: STRENGTH_LABELS[qid] });
    }
    found.sort(function (a, b) { return b.v - a.v; });
    return found.slice(0, 3).map(function (x) { return x.label; });
  }

  /* --- 確認が必要な点（最大3つ・注意喚起。断定しない） --- */
  function computeCautions(answers, topCodes) {
    var out = [];
    var lvl = answers.japaneseLevel;
    var lowJp = (lvl === "NONE" || lvl === "HIRAGANA" || lvl === "N5_LEVEL");
    if (lowJp) {
      out.push({ ja: "日本語は これからの伸びが大切です。基礎から一緒に進めましょう。", en: "Japanese is still to be built — let's start from the basics together." });
    }
    if (answers.medication === "YES" || answers.backKneeConcern === "YES") {
      out.push({ ja: "健康面は、安全に働ける職種えらびのため面談で確認します（配慮のためで、不利にはしません）。", en: "We'll confirm health points at the consultation to choose safe work (for consideration, not a disadvantage)." });
    }
    if (topCodes.indexOf("CONSTRUCTION") >= 0 && answers.heightResist === "NO") {
      out.push({ ja: "高所への不安があるため、建設の中でも高所の少ない作業を相談しましょう。", en: "Since heights feel uneasy, let's discuss construction roles with less height work." });
    }
    if (answers.familyConsent === "NO" || answers.familyConsent === "DISCUSSING") {
      out.push({ ja: "ご家族の同意は、渡日に向けて大切です。面談で一緒に整理しましょう。", en: "Family consent matters for going to Japan — let's work through it at the consultation." });
    }
    if ((topCodes.indexOf("OFFICE_INTERPRETATION") >= 0 || topCodes.indexOf("IT_ENGINEERING") >= 0) && lvl !== "N3_PLUS") {
      out.push({ ja: "事務・IT系は求められる日本語が高めです。目標レベルを面談で設定しましょう。", en: "Office/IT roles need higher Japanese — let's set a target level at the consultation." });
    }
    if (out.length === 0) {
      out.push({ ja: "現時点では大きな懸念は見当たりません。面談で希望と条件を具体化しましょう。", en: "No major concerns for now — let's make your wishes and conditions concrete at the consultation." });
    }
    return out.slice(0, 3);
  }

  /* --- 総合コメント（トップ職種名を差し込む） --- */
  function overallComment(topName, lang) {
    if (lang === "en") {
      return "Based on your answers, roles such as " + topName + " may suit you. This is reference information — the actual path is decided together at a consultation.";
    }
    return "回答から、" + topName + " などの方向性が向いている可能性があります。これは参考情報です。実際の進み方は面談で一緒に決めましょう。";
  }

  /* --- 表示対象（hidden 以外）の職種コード --- */
  function visibleCodes(config) {
    var st = (config && config.jobStatus) || {};
    return JOBS.filter(function (j) { return st[j.code] !== "hidden"; })
               .map(function (j) { return j.code; });
  }

  function getJob(code) {
    for (var i = 0; i < JOBS.length; i++) if (JOBS[i].code === code) return JOBS[i];
    return null;
  }

  /* --- メイン：回答から結果を作る --- */
  function analyze(answers, config) {
    var codes = visibleCodes(config);
    var scored = codes.map(function (code) {
      var job = getJob(code);
      return { code: code, name: job.name, score: scoreJob(job, answers) };
    });
    scored.sort(function (a, b) { return b.score - a.score; });

    var top3 = scored.slice(0, 3);
    var topCodes = top3.map(function (x) { return x.code; });

    return {
      version: (config && config.behavior && config.behavior.assessmentVersion) || "v1.0",
      scores: scored,          // 全職種（表示対象）のスコア（降順）
      top3: top3,              // 上位3
      topCodes: topCodes,
      strengths: computeStrengths(answers),   // [{ja,en}...]
      cautions: computeCautions(answers, topCodes), // [{ja,en}...]
      overall: {
        ja: overallComment(top3.length ? top3[0].name.ja : "—", "ja"),
        en: overallComment(top3.length ? top3[0].name.en : "—", "en")
      }
    };
  }

  window.OUKA_SCORING = {
    JOBS: JOBS,
    getJob: getJob,
    visibleCodes: visibleCodes,
    analyze: analyze
  };
})();
