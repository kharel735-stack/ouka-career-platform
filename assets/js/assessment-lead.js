/* ============================================================================
 * assessment-lead.js  ―  無料適性診断の結果を School OS（Lead Master）へ送る
 * ----------------------------------------------------------------------------
 * ★何をするか
 *   結果ページが表示されたときに、回答＋診断結果を Apps Script へ1回だけ送ります。
 *   送信先は config.js の endpoints.appsScriptUrl（未設定なら何も送りません）。
 *
 * ★成功の判定（2026-09-04 追加）
 *   「HTTPが通ったか」ではなく「Apps Script が Lead Master に保存した」と
 *   答えたときだけ成功にします＝レスポンスが ok:true かつ leadId を持つこと。
 *   ok:false（例：同意の値が合わずサーバーで弾かれた）・受付番号なし・通信失敗・
 *   タイムアウトは、すべて失敗として扱い、画面に「もう一度送信」を出します。
 *   以前は catch が握りつぶしていたため、画面には結果が出るのに Lead Master には
 *   1行も入らない状態に誰も気づけませんでした（サイレント欠落）。
 *   送信状態は localStorage に PENDING / SENT / FAILED で残します。
 *
 * ★個人情報について（大事）
 *   ・送信前に必ず本人の同意（privacyConsent）を確認します。同意が無ければ送りません。
 *   ・ブラウザから直接スプレッドシートには書き込みません。必ず Apps Script を経由します。
 *   ・通信は HTTPS（Apps Script の /exec）です。
 *   ・二重送信を防ぐため、送信済みの印を localStorage に残します。
 *
 * 依存：config.js, main.js, form-connector.js, assessment-scoring.js
 * ==========================================================================*/
(function () {
  "use strict";

  var CFG = window.OUKA_CONFIG || {};
  var STORE = (CFG.behavior && CFG.behavior.storageKey) || "ouka_assessment_v1";
  var RESULT_KEY = STORE + "_result";
  var SENT_KEY = STORE + "_sent";
  var STATUS_KEY = STORE + "_send_status";   /* PENDING / SENT / FAILED */

  /* 送信状態を残す。中身は運用の確認用で、画面には出さない。 */
  function writeStatus(status, extra) {
    var o = { status: status, at: new Date().toISOString() };
    if (extra) { for (var k in extra) { if (extra.hasOwnProperty(k)) o[k] = extra[k]; } }
    try { localStorage.setItem(STATUS_KEY, JSON.stringify(o)); } catch (e) {}
    return o;
  }
  function readStatus() {
    try { return JSON.parse(localStorage.getItem(STATUS_KEY) || "null"); } catch (e) { return null; }
  }

  /* Lead Master に保存されたと言い切れるレスポンスか。
     ・res.status === "SENT"（本文を読めた）
     ・かつ raw.ok === true
     ・かつ raw.leadId がある（＝Lead Master の受付番号が発番された）
     SENT_UNCONFIRMED（本文を読めなかった）は成功にしない。 */
  function isConfirmed(res) {
    if (!res || res.status !== "SENT") return false;
    var raw = res.raw || {};
    return raw.ok === true && !!raw.leadId;
  }

  function read(key) {
    try { return JSON.parse(localStorage.getItem(key) || "null"); } catch (e) { return null; }
  }

  /* 結果は assessment.js が {answers, result, meta} の形で保存している */
  function loadSaved() {
    var saved = read(RESULT_KEY);
    if (!saved || !saved.answers || !saved.result) return null;
    return saved;
  }

  /* 回答の中から、Lead Master に必要なものを平らな形にする */
  function flatten(answers, result) {
    var d = {};
    Object.keys(answers || {}).forEach(function (k) {
      var v = answers[k];
      if (Array.isArray(v)) v = v.join(",");          /* チェックボックスは , でつなぐ */
      if (v === null || v === undefined) v = "";
      d[k] = v;
    });

    /* 診断の上位3職種とスコア（英語コードではなく人が読める名前で入れる） */
    var lang = window.OUKA ? OUKA.getLang() : "ja";
    var top = (result && result.top3) || [];
    for (var i = 0; i < 3; i++) {
      var t = top[i];
      d["recommendedJob" + (i + 1)] = t ? (window.OUKA ? OUKA.pick(t.name, lang) : (t.name && t.name.ja) || t.code) : "";
      d["recommendedJob" + (i + 1) + "Score"] = t ? t.score : "";
    }

    /* 同意の値をサーバーの期待どおり "YES" / "NO" にそろえる。
     * assessment.js はチェックボックスの真偽値（true）で保存しているが、
     * Apps Script 側は文字列 "YES" を要求する（Code.gs validate_）。
     * ここで変換しないと 'consent required' で弾かれ、
     * 画面には結果が出るのに Lead Master に1行も入らない（2026-09-04 修正）。 */
    var __c = String(answers.privacyConsent || "").toUpperCase();
    d.privacyConsent = (__c === "YES" || __c === "TRUE") ? "YES" : "NO";

    /* Lead Masterに専用列がまだない重要回答は、既存の「備考」列へ構造化して残す。
       本番Apps Scriptの列構成を変更せず、回答消失を防ぐための互換レイヤー。 */
    var extraKeys = [
      "pastJobs","qualifications","goodTasks","weakTasks",
      "expManufacturing","expDriving","expPC","expTeam","expOutdoor","expNightShift","expStanding",
      "studyDaysPerWeek","canHomeworkDaily","canOnline","hasSmartphone","hasInternet",
      "canSharedLiving","routeInterest","preferredJob2","preferredJob3"
    ];
    var extraParts = [];
    extraKeys.forEach(function (k) {
      var v = answers[k];
      if (Array.isArray(v)) v = v.join(",");
      if (v !== undefined && v !== null && String(v).trim() !== "") extraParts.push(k + "=" + String(v));
    });
    if (extraParts.length) {
      var originalGoal = String(d.futureGoal || "").trim();
      d.futureGoal = (originalGoal ? originalGoal + "\n" : "") + "[OUKA_EXTRA_DATA] " + extraParts.join(" | ");
    }

    d.formType = "ASSESSMENT";
    d.applicationSource = (CFG.behavior && CFG.behavior.applicationSource) || "OUKA_WEBSITE";
    d.assessmentVersion = (CFG.behavior && CFG.behavior.assessmentVersion) || "";
    d.uiLang = lang;
    d.assessmentDate = (result && result.__date) || "";
    return d;
  }

  /* 送信できる状態か調べる。送れないときは理由（内部用）を返す。 */
  function prepare() {
    var ep = (CFG.endpoints && CFG.endpoints.appsScriptUrl) || "";
    if (!/^https?:\/\//.test(ep)) return { ok: false, reason: "no-endpoint" };

    var saved = loadSaved();
    if (!saved) return { ok: false, reason: "no-data" };
    var answers = saved.answers, result = saved.result, meta = saved.meta || {};

    /* 同意が無ければ送らない */
    var consent = String(answers.privacyConsent || "").toUpperCase();
    if (consent !== "YES" && consent !== "TRUE") return { ok: false, reason: "no-consent" };

    /* 連絡先が1つも無ければ送らない（営業できない行を作らない） */
    if (!answers.phone && !answers.whatsapp && !answers.email) return { ok: false, reason: "no-contact" };

    /* 二重送信を防ぐ印（送信が確認できた時だけ書く） */
    var stamp = String(meta.date || "") + "|" + String(meta.version || "") + "|" +
                String(answers.phone || answers.whatsapp || answers.email || "");
    return { ok: true, answers: answers, result: result, stamp: stamp };
  }

  /* 送信済み（確認済み）かどうか。二重送信防止はこの印だけで判断する。 */
  function alreadySent(stamp) {
    var sent = "";
    try { sent = localStorage.getItem(SENT_KEY) || ""; } catch (e) {}
    return sent === stamp;
  }

  function send(isRetry) {
    var p = prepare();
    if (!p.ok) {
      /* 送信先未設定・同意なしなどは「まだ送っていない」。画面には何も出さない。 */
      writeStatus("PENDING", { reason: p.reason });
      return Promise.resolve(false);
    }
    if (alreadySent(p.stamp)) { return Promise.resolve(true); }

    if (!window.OUKA_FORM || typeof OUKA_FORM.submit !== "function") {
      writeStatus("FAILED", { reason: "no-connector" });
      if (isRetry) showRetry();
      return Promise.resolve(false);
    }

    var attempts = ((readStatus() || {}).attempts || 0) + 1;
    return OUKA_FORM.submit(flatten(p.answers, p.result)).then(function (res) {
      /* ★ Lead Master に保存されたと言い切れる時だけ成功にする。
         SENT_UNCONFIRMED（本文を読めなかった）や ok:true でも受付番号なしは失敗扱い。 */
      if (isConfirmed(res)) {
        try { localStorage.setItem(SENT_KEY, p.stamp); } catch (e) {}
        writeStatus("SENT", { leadId: res.raw.leadId, attempts: attempts });
        hideRetry();
        show(res.raw.leadId);
        return true;
      }
      if (res && res.status === "PENDING") {     /* 送信先未設定 */
        writeStatus("PENDING", { reason: "endpoint-pending", attempts: attempts });
        return false;
      }
      writeStatus("FAILED", { reason: (res && res.status) || "unconfirmed", attempts: attempts });
      showRetry();
      return false;
    })["catch"](function (err) {
      /* サーバーが弾いた（ok:false）・通信失敗・タイムアウトはすべてここ。
         握りつぶさず FAILED として残し、再送できる状態にする。
         err.message はサーバー由来の文言なので画面には出さない。 */
      writeStatus("FAILED", { reason: (err && err.message) ? String(err.message).slice(0, 60) : "error",
                              attempts: attempts });
      showRetry();
      return false;
    });
  }

  /* 送信できたことを、そっと1行だけ知らせる */
  function show(leadId) {
    var host = document.getElementById("result-root") || document.querySelector("main");
    if (!host) return;
    if (document.getElementById("lead-sent")) return;
    var p = document.createElement("p");
    p.id = "lead-sent";
    p.className = "notice";
    p.style.cssText = "max-width:860px;margin:18px auto 0";
    var msg = {
      ja: "診断内容を学校へお送りしました。担当者からご連絡します。",
      en: "Your results have been sent to the school. Our staff will contact you.",
      ne: "तपाईंको नतिजा विद्यालयमा पठाइयो। हाम्रो टोलीले सम्पर्क गर्नेछ।"
    };
    p.textContent = (window.OUKA ? OUKA.pick(msg, OUKA.getLang()) : msg.ja) + (leadId ? "（受付番号 " + leadId + "）" : "");
    host.appendChild(p);
  }

  /* ------------------------------------------------------------------
   * 送れなかったときの再送UI
   *   ・技術的な理由やエラーコードは出さない（利用者には関係がないため）
   *   ・見た目は既存の .notice--warn と .btn--primary のみ。新しいCSSは足さない
   * ----------------------------------------------------------------*/
  var RETRY_ID = "lead-retry";

  function pick(msg) {
    return window.OUKA ? OUKA.pick(msg, OUKA.getLang()) : msg.ja;
  }

  function hideRetry() {
    var el = document.getElementById(RETRY_ID);
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function showRetry() {
    var host = document.getElementById("result-root") || document.querySelector("main");
    if (!host) return;
    if (document.getElementById(RETRY_ID)) return;      /* 二重に出さない */

    var box = document.createElement("div");
    box.id = RETRY_ID;
    box.className = "notice notice--warn";
    box.style.cssText = "max-width:860px;margin:18px auto 0";

    var p = document.createElement("p");
    p.style.cssText = "margin:0 0 10px";
    p.textContent = pick({
      ja: "診断結果は表示されていますが、データ送信を完了できませんでした。通信環境を確認して、もう一度送信してください。",
      en: "Your result is shown, but we could not finish sending your data. Please check your connection and send it again.",
      ne: "तपाईंको नतिजा देखिएको छ, तर डाटा पठाउने काम पूरा भएन। इन्टरनेट जाँच गरेर फेरि पठाउनुहोस्।"
    });
    box.appendChild(p);

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn btn--primary";
    btn.textContent = pick({ ja: "もう一度送信する", en: "Send again", ne: "फेरि पठाउनुहोस्" });
    btn.addEventListener("click", function () {
      btn.disabled = true;
      btn.textContent = pick({ ja: "送信中…", en: "Sending…", ne: "पठाउँदै…" });
      send(true).then(function (ok) {
        if (ok) return;                                  /* 成功時は send() が消す */
        btn.disabled = false;
        btn.textContent = pick({ ja: "もう一度送信する", en: "Send again", ne: "फेरि पठाउनुहोस्" });
      });
    });
    box.appendChild(btn);
    host.appendChild(box);
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* 結果の描画が終わってから送る */
    setTimeout(function () { send(false); }, 600);
  });

  /* 運用確認用（画面には出さない）。コンソールから状態を見るためだけのもの。 */
  window.OUKA_LEAD = { status: readStatus, resend: function () { return send(true); } };
})();
