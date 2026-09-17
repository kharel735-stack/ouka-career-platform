/* ============================================================================
 * visa-stats.js  ―「データで見る日本就職」をグラフで描く
 * ----------------------------------------------------------------------------
 * 画像も外部ライブラリも使いません（CSSだけ・表示速度を落とさない）。
 * 数字は visa-stats-data.js の実数だけを使い、四捨五入や推測をしません。
 * 依存：config.js, main.js, visa-stats-data.js
 * ==========================================================================*/
(function () {
  "use strict";

  var D = window.OUKA_VISA_STATS || {};
  var UI = {
    asOf: { ja: "時点", en: "as of", ne: "मिति" },
    src: { ja: "出典", en: "Source", ne: "स्रोत" },
    people: { ja: "人", en: "people", ne: "जना" },
    total: { ja: "合計", en: "Total", ne: "जम्मा" }
  };

  function pick(o) {
    if (!o) return "";
    if (typeof o === "string") return o;
    var lang = window.OUKA ? OUKA.getLang() : "ja";
    return window.OUKA ? OUKA.pick(o, lang) : (o.ja || "");
  }
  function num(n) { return Number(n).toLocaleString("en-US"); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function srcLine(key, asOf) {
    var s = (D.sources || {})[key];
    var p = el("p", "chart__src");
    if (asOf) p.appendChild(document.createTextNode(asOf + " " + pick(UI.asOf) + "　"));
    if (s) {
      p.appendChild(document.createTextNode(pick(UI.src) + "："));
      var a = el("a", null, pick(s.name));
      a.href = s.url; a.target = "_blank"; a.rel = "noopener";
      p.appendChild(a);
    }
    return p;
  }

  /* ---- 大きな数字3枚 --------------------------------------------------- */
  function headline(root) {
    if (!D.headline) return;
    var grid = el("div", "stats");
    D.headline.forEach(function (h) {
      var c = el("div", "stat");
      c.appendChild(el("b", null, pick(h.label)));
      var v = el("span", "stat__val");
      v.textContent = h.value + pick(h.unit);
      c.appendChild(v);
      if (h.note) c.appendChild(el("span", "stat__note", pick(h.note)));
      c.appendChild(srcLine(h.src, h.asOf));
      grid.appendChild(c);
    });
    root.appendChild(grid);
  }

  /* ---- 横棒グラフ ------------------------------------------------------ */
  function barChart(root, data, cls) {
    if (!data) return;
    var wrap = el("div", "chart");
    wrap.appendChild(el("h3", "chart__title", pick(data.title)));

    var max = 0;
    data.rows.forEach(function (r) { if (r.value > max) max = r.value; });

    var list = el("div", "chart__bars");
    data.rows.forEach(function (r) {
      var row = el("div", "chart__row" + (r.highlight ? " is-hl" : ""));
      row.appendChild(el("span", "chart__label", pick(r.label)));
      var track = el("div", "chart__track");
      var fill = el("i", "chart__fill " + cls);
      fill.style.width = Math.max(1.5, r.value / max * 100) + "%";
      track.appendChild(fill);
      row.appendChild(track);
      var v = el("span", "chart__value", num(r.value) + (r.pct ? "　" + r.pct : ""));
      row.appendChild(v);
      list.appendChild(row);
    });
    wrap.appendChild(list);

    if (data.total) {
      wrap.appendChild(el("p", "chart__total",
        pick(UI.total) + "　" + num(data.total) + pick(UI.people)));
    }
    if (data.note) wrap.appendChild(el("p", "chart__note", pick(data.note)));
    wrap.appendChild(srcLine(data.src, data.asOf));
    root.appendChild(wrap);
  }

  /* ---- 縦棒（推移）----------------------------------------------------- */
  function columnChart(root, data) {
    if (!data) return;
    var wrap = el("div", "chart");
    wrap.appendChild(el("h3", "chart__title", pick(data.title)));

    var max = 0;
    data.rows.forEach(function (r) { if (r.value > max) max = r.value; });

    var cols = el("div", "chart__cols");
    data.rows.forEach(function (r, i) {
      var c = el("div", "chart__col");
      var box = el("div", "chart__barbox");
      var bar = el("i");
      bar.style.height = Math.max(2, r.value / max * 100) + "%";
      /* 最後の1本だけローズで強調 */
      if (i === data.rows.length - 1) bar.className = "is-last";
      bar.setAttribute("title", r.label + "：" + num(r.value) + pick(UI.people));
      box.appendChild(bar);
      c.appendChild(box);
      c.appendChild(el("span", "chart__collabel", r.label));
      cols.appendChild(c);
    });
    wrap.appendChild(cols);
    wrap.appendChild(el("p", "chart__total",
      data.rows[0].label + "　" + num(data.rows[0].value) + pick(UI.people) +
      "　→　" + data.rows[data.rows.length - 1].label + "　" +
      num(data.rows[data.rows.length - 1].value) + pick(UI.people)));
    wrap.appendChild(srcLine(data.src, data.asOf));
    root.appendChild(wrap);
  }

  function render() {
    var root = document.getElementById("visa-stats");
    if (!root) return;
    root.innerHTML = "";
    headline(root);
    columnChart(root, D.trend);
    barChart(root, D.byField, "chart__fill--green");
    barChart(root, D.byNationality, "chart__fill--pink");
    barChart(root, D.nepalTrend, "chart__fill--pink");
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", render);
})();
