/* ============================================================================
 * social.js  ―  SNS公式アカウントのリンクをフッターに出す
 * ----------------------------------------------------------------------------
 * ★設定は assets/js/config.js の social だけ。
 *   URLを入れた項目だけアイコンが出ます（空の項目は出ません）。
 *   1つも入っていなければ、SNS欄そのものが表示されません（空の枠は出さない）。
 *
 * 依存：config.js（先に読み込むこと）
 * ==========================================================================*/
(function () {
  "use strict";

  var CFG = window.OUKA_CONFIG || {};
  var S = CFG.social || {};
  var school = CFG.school || {};

  /* 表示順とラベル（アイコン画像は使わず、文字だけ＝表示速度を落とさない） */
  var ORDER = [
    { key: "facebook",  label: "f",  name: "Facebook" },
    { key: "instagram", label: "IG", name: "Instagram" },
    { key: "tiktok",    label: "TT", name: "TikTok" },
    { key: "youtube",   label: "YT", name: "YouTube" },
    { key: "line",      label: "LINE", name: "LINE" },
    { key: "whatsapp",  label: "WA", name: "WhatsApp" }
  ];

  function urlFor(item) {
    var v = (S[item.key] || "").trim();
    if (!v) return "";
    /* whatsapp: "auto" は school.whatsapp から自動生成 */
    if (item.key === "whatsapp" && v === "auto") {
      var num = (school.whatsappIntl || school.whatsapp || "").replace(/[^0-9]/g, "");
      return num ? "https://wa.me/" + num : "";
    }
    return /^https?:\/\//.test(v) ? v : "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    var ul = document.getElementById("social-links");
    if (!ul) return;

    var n = 0;
    ORDER.forEach(function (item) {
      var href = urlFor(item);
      if (!href) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", item.name);
      a.title = item.name;
      a.textContent = item.label;
      li.appendChild(a);
      ul.appendChild(li);
      n++;
    });

    if (n > 0) ul.removeAttribute("hidden");
  });
})();
