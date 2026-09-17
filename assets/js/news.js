/* ============================================================================
 * news.js  ―  お知らせ・ブログの一覧を描画
 * 依存：config.js, translations.js, main.js, news-data.js
 * ==========================================================================*/
(function () {
  "use strict";

  function render() {
    var wrap = document.getElementById("news-list");
    var empty = document.getElementById("news-empty");
    if (!wrap) return;

    var items = (window.OUKA_NEWS || []).slice();
    var cats = window.OUKA_NEWS_CATS || {};
    var lang = window.OUKA ? OUKA.getLang() : "ja";

    /* 新しい順に並べる */
    items.sort(function (a, b) { return (b.date || "").localeCompare(a.date || ""); });

    wrap.innerHTML = "";
    if (!items.length) {
      if (empty) empty.removeAttribute("hidden");
      return;
    }
    if (empty) empty.setAttribute("hidden", "");

    items.forEach(function (n) {
      var art = document.createElement("article");
      art.className = "card";

      var meta = document.createElement("p");
      meta.style.cssText = "margin:0 0 8px;font-size:.82rem;letter-spacing:.06em;color:var(--pink-600);font-weight:700";
      var catName = cats[n.cat] ? (window.OUKA ? OUKA.pick(cats[n.cat], lang) : cats[n.cat].ja) : "";
      meta.textContent = (n.date || "") + (catName ? "　" + catName : "");
      art.appendChild(meta);

      var h = document.createElement("h3");
      h.textContent = window.OUKA ? OUKA.pick(n.title, lang) : (n.title && n.title.ja) || "";
      art.appendChild(h);

      var bodyText = window.OUKA ? OUKA.pick(n.body, lang) : (n.body && n.body.ja) || "";
      String(bodyText).split("\n").forEach(function (line) {
        if (!line.trim()) return;
        var p = document.createElement("p");
        p.textContent = line;          /* textContent＝HTMLを混ぜない（XSS対策） */
        art.appendChild(p);
      });

      wrap.appendChild(art);
    });
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", render);
})();
