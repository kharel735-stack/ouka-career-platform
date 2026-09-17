/* ============================================================================
 * candidate-cards.js  ―  匿名候補者プロフィールのカードを描く
 * ----------------------------------------------------------------------------
 * データは candidate-samples.js（すべて架空のサンプル）。
 * 氏名・顔写真・電話・住所・パスポート・証明書番号は表示しません。
 * 依存：config.js, main.js, candidate-samples.js
 * ==========================================================================*/
(function () {
  "use strict";

  /* 表示する行と、その見出しに使う辞書キー（本文の翻訳と揃える） */
  var ROWS = [
    ["age", "cp.cl_age"], ["region", "cp.cl_region"], ["edu", "cp.cl_edu"],
    ["major", "cp.cl_major"], ["career", "cp.cl_career"], ["want", "cp.cl_want"],
    ["jpLevel", "cp.cl_jpLevel"], ["exam", "cp.cl_exam"], ["skillTest", "cp.cl_skillTest"],
    ["period", "cp.cl_period"], ["attend", "cp.cl_attend"], ["interview", "cp.cl_interview"],
    ["aptitude", "cp.cl_aptitude"], ["safety", "cp.cl_safety"], ["hrs", "cp.cl_hrs"],
    ["depart", "cp.cl_depart"]
  ];
  /* 数値そのものの項目（言語で変わらない） */
  var PLAIN = { attend: 1, interview: 1, safety: 1, hrs: 1 };

  function t(key) { return window.OUKA ? OUKA.t(key) : key; }
  function pick(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "string") return v;
    return window.OUKA ? OUKA.pick(v, OUKA.getLang()) : (v.ja || "");
  }

  function render() {
    var wrap = document.getElementById("cand-cards");
    if (!wrap) return;
    var list = window.OUKA_CANDIDATE_SAMPLES || [];
    wrap.innerHTML = "";

    list.forEach(function (c) {
      var card = document.createElement("div");
      card.className = "cand";

      var top = document.createElement("div");
      top.className = "cand__top";
      var id = document.createElement("span");
      id.className = "cand__id";
      id.textContent = c.id;
      var tag = document.createElement("span");
      tag.className = "cand__tag";
      tag.textContent = pick(c.tag);
      top.appendChild(id); top.appendChild(tag);
      card.appendChild(top);

      var tbl = document.createElement("table");
      ROWS.forEach(function (r) {
        var key = r[0], labelKey = r[1];
        if (c[key] === undefined) return;
        var tr = document.createElement("tr");
        var th = document.createElement("th");
        th.textContent = t(labelKey);
        var td = document.createElement("td");
        if (PLAIN[key]) {
          var b = document.createElement("span");
          b.className = "cand__score";
          b.textContent = c[key];
          td.appendChild(b);
        } else {
          td.textContent = pick(c[key]);
        }
        tr.appendChild(th); tr.appendChild(td);
        tbl.appendChild(tr);
      });
      card.appendChild(tbl);

      if (c.comment) {
        var note = document.createElement("p");
        note.className = "cand__note";
        note.textContent = t("cp.cl_comment") + "：" + pick(c.comment);
        card.appendChild(note);
      }
      wrap.appendChild(card);
    });
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", render);
})();
