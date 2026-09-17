/* ============================================================================
 * analytics.js  ―  Google Analytics 4（GA4）の読み込み
 * ----------------------------------------------------------------------------
 * ★設定は1か所だけ： assets/js/config.js の analytics.ga4Id に測定IDを入れる。
 *     例) ga4Id: "G-XXXXXXXXXX"
 *   空のあいだは何も読み込みません（不要な通信ゼロ＝ページも重くなりません）。
 *   ID を入れたら、このファイルを触らずに再アップロードするだけで計測が始まります。
 *
 * 取得の考え方（学校サイトなので控えめに）：
 *   - IPは匿名化。広告向けの機能（シグナル/リマーケ）は既定でオフ。
 *   - 個人情報（氏名・電話・診断の回答）は一切送りません。
 *   - 適性診断の「開始」「完了」、申し込み「送信」だけをイベントとして数えます。
 *     → どのページから応募につながったかが分かります。
 *
 * 依存：config.js（先に読み込むこと）
 * ==========================================================================*/
(function () {
  "use strict";

  var CFG = (window.OUKA_CONFIG && window.OUKA_CONFIG.analytics) || {};
  var ID = (CFG.ga4Id || "").trim();

  /* 測定IDが未設定なら何もしない */
  if (!ID) return;

  /* ローカル確認（file:// や localhost）では数えない＝実データを汚さない */
  var host = location.hostname;
  if (CFG.skipLocalhost !== false &&
      (location.protocol === "file:" || host === "localhost" || host === "127.0.0.1" || host === "")) {
    return;
  }

  /* 接続先を先に名前解決しておく（体感を少し速くする） */
  var pre = document.createElement("link");
  pre.rel = "preconnect";
  pre.href = "https://www.googletagmanager.com";
  pre.crossOrigin = "";
  document.head.appendChild(pre);

  /* gtag.js を非同期で読み込む（描画をブロックしない） */
  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ID);
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", ID, {
    anonymize_ip: true,
    allow_google_signals: CFG.allowGoogleSignals === true,
    allow_ad_personalization_signals: CFG.allowAdPersonalization === true,
    /* 表示中の言語も一緒に記録（ja/en/ne のどれで見られているか分かる） */
    language: document.documentElement.getAttribute("lang") || "ja"
  });

  /* ---- サイト内の主要な行動だけをイベントにする ---------------------------- */
  function send(name, params) {
    try { gtag("event", name, params || {}); } catch (e) {}
  }

  document.addEventListener("DOMContentLoaded", function () {
    /* 無料適性診断を始めた */
    document.querySelectorAll('a[href*="assessment.html"]').forEach(function (a) {
      a.addEventListener("click", function () {
        send("assessment_start", { from_page: location.pathname });
      });
    });
    /* 申し込み・お問い合わせフォームを送信した */
    document.querySelectorAll("form").forEach(function (f) {
      f.addEventListener("submit", function () {
        send("form_submit", { form_id: f.id || f.getAttribute("name") || "unknown" });
      });
    });
    /* 電話・WhatsAppを押した */
    document.querySelectorAll('a[href^="tel:"], a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (a) {
      a.addEventListener("click", function () {
        send("contact_click", { method: a.getAttribute("href").indexOf("tel:") === 0 ? "tel" : "whatsapp" });
      });
    });
  });

  /* 適性診断の結果が表示された（result.js が出すイベントに相乗り） */
  document.addEventListener("ouka:result-shown", function () {
    send("assessment_complete", {});
  });
})();
