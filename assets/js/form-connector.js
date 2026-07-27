/* ============================================================================
 * form-connector.js  ―  School OS への連携（Google Forms / Apps Script / 事前入力）
 * ----------------------------------------------------------------------------
 * 方法A: 既存のGoogleフォームへ遷移（config.endpoints.*FormUrl）
 * 方法B: Apps Script Web App へ直接POST（config.endpoints.appsScriptUrl）
 * 方法C: Googleフォームの事前入力(prefill)URLを作って遷移（config.endpoints.prefill）
 *
 * ★安全の原則
 *  ・どのURLも未設定のときは「送信完了」を絶対に表示しません。
 *    submit() は status:"PENDING" を返し、画面は「準備中」の案内を出します。
 *  ・studentId はブラウザでは確定しません（Apps Script側で発行）。
 *  ・POST は application/x-www-form-urlencoded（payload=JSON文字列）で送ります。
 *    → CORSプリフライトを避けるための「シンプルリクエスト」。Apps Script側は
 *      e.parameter.payload を JSON.parse します（apps-script/Code.gs 参照）。
 * ==========================================================================*/

window.OUKA_FORM = (function () {
  "use strict";

  function cfg() { return window.OUKA_CONFIG || {}; }
  function ep() { return (cfg().endpoints) || {}; }

  function hasAppsScript() { return !!(ep().appsScriptUrl && /^https?:\/\//.test(ep().appsScriptUrl)); }

  var FORM_KEYS = {
    student:   "studentFormUrl",
    assessment:"assessmentFormUrl",
    interview: "interviewFormUrl",
    company:   "companyFormUrl"
  };
  function formUrl(kind) {
    var key = FORM_KEYS[kind];
    var url = key ? ep()[key] : "";
    return (url && /^https?:\/\//.test(url)) ? url : "";
  }
  function hasGoogleForm(kind) { return !!formUrl(kind); }

  /* ---- 方法C: 事前入力URLを作る ---- */
  function hasPrefill() {
    var p = ep().prefill;
    return !!(p && p.baseUrl && p.entryMap && Object.keys(p.entryMap).length);
  }
  function buildPrefillUrl(data) {
    var p = ep().prefill;
    if (!hasPrefill()) return "";
    var base = p.baseUrl;
    var join = base.indexOf("?") >= 0 ? "&" : "?";
    var params = [];
    Object.keys(p.entryMap).forEach(function (field) {
      var entry = p.entryMap[field];
      var val = data[field];
      if (val !== undefined && val !== null && val !== "") {
        params.push(encodeURIComponent(entry) + "=" + encodeURIComponent(val));
      }
    });
    return params.length ? (base + join + params.join("&")) : base;
  }

  /* ---- 方法B: Apps Script へ POST ---- */
  function postToAppsScript(data, timeoutMs) {
    var url = ep().appsScriptUrl;
    timeoutMs = timeoutMs || 15000;
    var body = "payload=" + encodeURIComponent(JSON.stringify(data));

    var controller = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs) : null;

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body,
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      return res.text().then(function (txt) {
        var json = null;
        try { json = JSON.parse(txt); } catch (e) {}
        if (!res.ok) throw new Error("HTTP " + res.status);
        if (json && json.ok === false) throw new Error(json.error || "server error");
        return {
          status: "SENT",
          studentId: (json && json.studentId) || "",
          raw: json || txt
        };
      });
    }).catch(function (err) {
      if (timer) clearTimeout(timer);
      var e = new Error(err && err.message ? err.message : "network error");
      e.status = "ERROR";
      throw e;
    });
  }

  /* ---- 送信の入口 ----
   * 戻り値(Promise):
   *   { status:"SENT", studentId }  … Apps Scriptが受理
   *   { status:"PENDING" }          … 送信先未設定（画面は「準備中」を表示）
   *   reject: Error(status:"ERROR")  … 通信失敗（Googleフォームへ誘導する）
   */
  function submit(data) {
    if (hasAppsScript()) {
      return postToAppsScript(data);
    }
    return Promise.resolve({ status: "PENDING" });
  }

  return {
    hasAppsScript: hasAppsScript,
    hasGoogleForm: hasGoogleForm,
    formUrl: formUrl,
    hasPrefill: hasPrefill,
    buildPrefillUrl: buildPrefillUrl,
    submit: submit
  };
})();
