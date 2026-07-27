/* ============================================================================
 * result.js  ―  診断結果ページの描画
 * ・結果は localStorage（storageKey + "_result"）から読み込みます。
 * ・URLに個人情報は載せません（sessionStorage/localStorage を使用）。
 * 依存：config.js, translations.js, assessment-scoring.js, main.js
 * ==========================================================================*/

(function () {
  "use strict";

  var STORAGE_KEY = (OUKA.cfg.behavior && OUKA.cfg.behavior.storageKey) || "ouka_assessment_v1";
  var RESULT_KEY = STORAGE_KEY + "_result";

  function lang() { return OUKA.getLang(); }
  function L(obj) { return OUKA.pick(obj, lang()); }

  function loadResult() {
    try {
      var raw = localStorage.getItem(RESULT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  var payload = null;

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function statusTagClass(code) {
    var st = OUKA.jobStatus(code);
    return st === "active" ? "badge--active" : (st === "consulting" ? "badge--consulting" : "badge--preparing");
  }

  function render() {
    if (!payload) return;
    var r = payload.result;
    var ans = payload.answers || {};

    // ヘッダー
    document.getElementById("r-name").textContent = ans.fullName || ans.fullNameRoman || "—";
    document.getElementById("r-date").textContent = (payload.meta && payload.meta.date) || OUKA.dateStamp();
    document.getElementById("r-overall").textContent = L(r.overall);

    // 上位3職種
    var topWrap = document.getElementById("r-top-jobs");
    topWrap.innerHTML = "";
    r.top3.forEach(function (job, i) {
      var row = el("div", { "class": "top-job" });
      row.appendChild(el("div", { "class": "rank" }, String(i + 1)));
      var jn = el("div", { "class": "jn" });
      jn.appendChild(document.createTextNode(L(job.name)));
      jn.appendChild(el("small", null, job.code));
      var tag = el("span", { "class": "job-status-tag " + statusTagClass(job.code) }, OUKA.jobStatusLabel(job.code, lang()));
      jn.appendChild(tag);
      row.appendChild(jn);
      var sc = el("div", { "class": "sc" });
      sc.appendChild(document.createTextNode(String(job.score)));
      sc.appendChild(el("small", null, " " + OUKA.t("result.scoreUnit")));
      row.appendChild(sc);
      topWrap.appendChild(row);
    });

    // スコアバー（全職種）
    var bars = document.getElementById("r-score-bars");
    bars.innerHTML = "";
    r.scores.forEach(function (job) {
      var row = el("div", { "class": "score-bar" });
      row.appendChild(el("div", { "class": "lbl" }, L(job.name)));
      var track = el("div", { "class": "track" });
      var bar = el("div", { "class": "bar" });
      bar.style.width = Math.max(3, job.score) + "%";
      track.appendChild(bar);
      row.appendChild(track);
      row.appendChild(el("div", { "class": "val" }, job.score + OUKA.t("result.scoreUnit")));
      bars.appendChild(row);
    });

    // 強み
    var st = document.getElementById("r-strengths");
    st.innerHTML = "";
    if (r.strengths.length === 0) {
      st.appendChild(el("li", null, lang() === "en" ? "Let's find your strengths together at the consultation." : "面談で一緒に強みを見つけましょう。"));
    }
    r.strengths.forEach(function (s) { st.appendChild(el("li", null, L(s))); });

    // 注意点
    var ct = document.getElementById("r-cautions");
    ct.innerHTML = "";
    r.cautions.forEach(function (c) { ct.appendChild(el("li", null, L(c))); });

    // 職種別 詳細（上位3）
    var det = document.getElementById("r-details");
    det.innerHTML = "";
    r.top3.forEach(function (job, i) {
      var full = OUKA_SCORING.getJob(job.code);
      if (!full) return;
      var card = el("div", { "class": "detail-card" });
      card.appendChild(el("h3", null, (i + 1) + ". " + L(full.name) + "（" + job.score + OUKA.t("result.scoreUnit") + "）"));
      var why = el("p", { "class": "kv" });
      why.appendChild(el("b", null, OUKA.t("result.why") + "： "));
      why.appendChild(document.createTextNode(L(full.why)));
      card.appendChild(why);
      var jp = el("p", { "class": "kv" });
      jp.appendChild(el("b", null, OUKA.t("result.neededJp") + "： "));
      jp.appendChild(document.createTextNode(L(full.neededJp)));
      card.appendChild(jp);
      var pr = el("p", { "class": "kv" });
      pr.appendChild(el("b", null, OUKA.t("result.prepare") + "： "));
      pr.appendChild(document.createTextNode(L(full.prepare)));
      card.appendChild(pr);
      det.appendChild(card);
    });
  }

  function bind() {
    payload = loadResult();
    if (!payload || !payload.result) {
      document.getElementById("no-data").hidden = false;
      document.getElementById("result-root").hidden = true;
      return;
    }
    document.getElementById("no-data").hidden = true;
    document.getElementById("result-root").hidden = false;

    render();
    document.addEventListener("ouka:langchange", render);

    document.getElementById("btn-print").addEventListener("click", function () { window.print(); });

    var clearBtn = document.getElementById("btn-clear");
    clearBtn.textContent = (lang() === "en" ? "Delete temporary saved data on this device" : "この端末の一時保存データを削除する");
    clearBtn.addEventListener("click", function () {
      if (confirm(lang() === "en" ? "Delete saved answers and result from this device?" : "この端末に保存された回答と結果を削除しますか？")) {
        try { localStorage.removeItem(RESULT_KEY); localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        window.location.href = "index.html";
      }
    });
    document.addEventListener("ouka:langchange", function () {
      clearBtn.textContent = (lang() === "en" ? "Delete temporary saved data on this device" : "この端末の一時保存データを削除する");
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
