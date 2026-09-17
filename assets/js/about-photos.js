/* ============================================================================
 * about-photos.js  ―  「学校について」ページの写真帯
 * ----------------------------------------------------------------------------
 * ★写真を入れるだけで自動で表示されます（写真が無ければ枠ごと出ません）。
 *   1) 写真を assets/images/gallery/ に置く
 *   2) assets/js/gallery-data.js の配列に1行足す
 *      { src:"training-01.jpg", caption:{ja:"…",en:"…",ne:"…"} }
 *   → このページの上位6枚に自動で並びます。
 *
 * ⚠ 写真は本人（未成年は保護者）の同意を得たものだけを掲載してください。
 * 依存：config.js, main.js, gallery-data.js
 * ==========================================================================*/
(function () {
  "use strict";

  var MAX = 6;

  function render() {
    var wrap = document.getElementById("about-photos");
    var note = document.getElementById("about-photos-note");
    if (!wrap) return;

    var items = (window.OUKA_GALLERY || []).slice(0, MAX);
    var lang = window.OUKA ? OUKA.getLang() : "ja";

    wrap.innerHTML = "";
    if (!items.length) {
      wrap.setAttribute("hidden", "");
      if (note) note.setAttribute("hidden", "");
      return;
    }

    items.forEach(function (g) {
      if (!g || !g.src) return;
      var cap = window.OUKA ? OUKA.pick(g.caption, lang) : (g.caption && g.caption.ja) || "";
      var fig = document.createElement("figure");
      var img = document.createElement("img");
      img.src = "assets/images/gallery/" + g.src;
      /* alt は説明文（無ければ学校名）＝画像検索にも効く */
      img.alt = cap || "桜花スキルトレーニングセンターの訓練の様子";
      img.loading = "lazy";
      img.decoding = "async";
      fig.appendChild(img);
      if (cap) {
        var fc = document.createElement("figcaption");
        fc.textContent = cap;
        fig.appendChild(fc);
      }
      wrap.appendChild(fig);
    });

    wrap.removeAttribute("hidden");
    if (note) note.removeAttribute("hidden");
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", render);
})();
