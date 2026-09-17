/* ============================================================================
 * contact-sns.js  ―  お問い合わせページの SNS リンク
 * ----------------------------------------------------------------------------
 * ★設定は assets/js/config.js の social だけ。
 *   URLが入っているものだけ表示し、1つも無ければ SNS の欄そのものを出しません。
 *
 * ⚠ Facebook について
 *   config.js の facebookIsPersonal を true にすると「代表者Facebook」と表示します。
 *   代表個人のプロフィールを「会社公式」と表示しないための切り替えです。
 *   会社の公式ページを作ったら false にしてください。
 *
 * 依存：config.js, main.js
 * ==========================================================================*/
(function () {
  "use strict";

  var CFG = window.OUKA_CONFIG || {};
  var S = CFG.social || {};
  var school = CFG.school || {};

  var LABELS = {
    instagram: { ja: "Instagram", en: "Instagram", ne: "Instagram" },
    facebookOfficial: { ja: "Facebook（会社公式）", en: "Facebook (official page)", ne: "Facebook (आधिकारिक पेज)" },
    facebookPersonal: { ja: "代表者Facebook", en: "Representative's Facebook", ne: "प्रतिनिधिको Facebook" },
    tiktok: { ja: "TikTok", en: "TikTok", ne: "TikTok" },
    youtube: { ja: "YouTube", en: "YouTube", ne: "YouTube" },
    line: { ja: "LINE", en: "LINE", ne: "LINE" }
  };

  function pick(o) { return window.OUKA ? OUKA.pick(o, OUKA.getLang()) : o.ja; }
  function url(v) {
    v = String(v || "").trim();
    return /^https?:\/\//.test(v) ? v : "";
  }

  function render() {
    var wrap = document.getElementById("sns-links");
    var card = document.getElementById("sns-card");
    if (!wrap || !card) return;
    wrap.innerHTML = "";

    var list = [];
    if (url(S.instagram)) list.push([url(S.instagram), LABELS.instagram]);
    if (url(S.facebook)) {
      list.push([url(S.facebook), S.facebookIsPersonal ? LABELS.facebookPersonal : LABELS.facebookOfficial]);
    }
    if (url(S.tiktok)) list.push([url(S.tiktok), LABELS.tiktok]);
    if (url(S.youtube)) list.push([url(S.youtube), LABELS.youtube]);
    if (url(S.line)) list.push([url(S.line), LABELS.line]);

    if (!list.length) { card.hidden = true; return; }

    list.forEach(function (x, i) {
      if (i) wrap.appendChild(document.createTextNode("　"));
      var a = document.createElement("a");
      a.href = x[0];
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = pick(x[1]);
      wrap.appendChild(a);
    });
    card.hidden = false;
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", render);
})();
