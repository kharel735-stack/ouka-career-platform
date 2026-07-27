/* ============================================================================
 * assessment.js  ―  7ステップ適性診断のフォームエンジン
 * 依存：config.js, translations.js, assessment-questions.js,
 *       assessment-scoring.js, main.js
 * ==========================================================================*/

(function () {
  "use strict";

  var Q = window.OUKA_QUESTIONS;
  var STEPS = Q.steps;
  var STORAGE_KEY = (OUKA.cfg.behavior && OUKA.cfg.behavior.storageKey) || "ouka_assessment_v1";
  var RESULT_KEY = STORAGE_KEY + "_result";

  var state = { step: 0, answers: {} };

  /* ---------- 保存 / 復元 ---------- */
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ step: state.step, answers: state.answers, ts: Date.now() }));
    } catch (e) {}
    flashAutosave();
  }
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (data && data.answers) { state.answers = data.answers; state.step = data.step || 0; return true; }
    } catch (e) {}
    return false;
  }
  function clearAll() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state = { step: 0, answers: {} };
  }

  var autosaveTimer = null;
  function flashAutosave() {
    var el = document.getElementById("autosave-flag");
    if (!el) return;
    el.classList.add("show");
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(function () { el.classList.remove("show"); }, 1200);
  }

  /* ---------- ユーティリティ ---------- */
  function lang() { return OUKA.getLang(); }
  function L(obj) { return OUKA.pick(obj, lang()); }

  function jobSelectOptions() {
    var opts = OUKA_SCORING.visibleCodes(OUKA.cfg).map(function (code) {
      return { value: code, label: OUKA_SCORING.getJob(code).name };
    });
    opts.push({ value: "OTHER_CONSULT", label: { ja: "その他・要相談", en: "Other / consult" } });
    return opts;
  }

  /* 選択肢 value → 表示ラベル（確認画面用） */
  function valueLabel(field, value) {
    if (value === undefined || value === null || value === "") return "—";
    if (field.type === "likert") {
      var sc = Q.likertScale.filter(function (s) { return String(s.value) === String(value); })[0];
      return sc ? L(sc.label) : value;
    }
    var opts = field.options;
    if (field.type === "jobselect") opts = jobSelectOptions();
    if (opts) {
      var found = opts.filter(function (o) { return o.value === value; })[0];
      if (found) return L(found.label);
    }
    if (field.type === "consent") return value ? (lang() === "en" ? "Agreed" : "同意") : "—";
    return value;
  }

  /* ---------- フィールド描画 ---------- */
  function el(tag, attrs, html) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) if (attrs.hasOwnProperty(k)) e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    return e;
  }

  function renderField(field) {
    var wrap = el("div", { "class": "q", "data-qid": field.id });
    // ラベル
    var lab = el("div", { "class": "q__label" });
    lab.appendChild(document.createTextNode(L(field.label)));
    if (field.required) lab.appendChild(el("span", { "class": "req" }, OUKA.t("common.required")));
    else if (["text","roman","tel","email","textarea","select","radio","jobselect","date","file"].indexOf(field.type) >= 0)
      lab.appendChild(el("span", { "class": "opt" }, OUKA.t("common.optional")));
    wrap.appendChild(lab);
    // help
    if (field.help) wrap.appendChild(el("div", { "class": "q__help" }, OUKA.escapeHtml(L(field.help))));

    var control = buildControl(field);
    wrap.appendChild(control);

    // error
    wrap.appendChild(el("div", { "class": "q__err" }, OUKA.t("errors.required")));
    return wrap;
  }

  function buildControl(field) {
    var val = state.answers[field.id];
    var t = field.type;

    if (t === "text" || t === "roman" || t === "tel" || t === "email" || t === "date" || t === "number") {
      var input = el("input", {
        type: (t === "roman" ? "text" : (t === "number" ? "number" : t)),
        id: "f_" + field.id, name: field.id
      });
      if (t === "roman") input.setAttribute("autocapitalize", "characters");
      if (field.readonly) input.setAttribute("readonly", "readonly");
      if (val == null && field.defaultValue != null && !field.readonly) val = field.defaultValue;
      if (val != null) input.value = val;
      input.addEventListener("input", function () { setAnswer(field.id, input.value); });
      // 生年月日→年齢自動計算
      if (field.id === "dateOfBirth") {
        input.addEventListener("change", function () {
          var age = OUKA.calcAge(input.value);
          setAnswer("age", age === "" ? "" : String(age));
          var ageInput = document.getElementById("f_age");
          if (ageInput) ageInput.value = age;
        });
      }
      return input;
    }

    if (t === "textarea") {
      var ta = el("textarea", { id: "f_" + field.id, name: field.id, rows: "3" });
      if (val != null) ta.value = val;
      ta.addEventListener("input", function () { setAnswer(field.id, ta.value); });
      return ta;
    }

    if (t === "select" || t === "jobselect") {
      var sel = el("select", { id: "f_" + field.id, name: field.id });
      sel.appendChild(el("option", { value: "" }, OUKA.escapeHtml(OUKA.t("common.selectPlaceholder"))));
      var options = (t === "jobselect") ? jobSelectOptions() : field.options;
      options.forEach(function (o) {
        var op = el("option", { value: o.value }, OUKA.escapeHtml(L(o.label)));
        if (val === o.value) op.setAttribute("selected", "selected");
        sel.appendChild(op);
      });
      sel.addEventListener("change", function () { setAnswer(field.id, sel.value); });
      return sel;
    }

    if (t === "radio") {
      var cols = field.options.length === 2 ? "cols-2" : (field.options.length === 3 ? "cols-3" : "");
      var group = el("div", { "class": "opt-btn-group " + cols, role: "radiogroup" });
      field.options.forEach(function (o) {
        var id = "f_" + field.id + "_" + o.value;
        var label = el("label", { "class": "opt-btn", "for": id });
        var input = el("input", { type: "radio", id: id, name: field.id, value: o.value });
        if (val === o.value) input.setAttribute("checked", "checked");
        input.addEventListener("change", function () { setAnswer(field.id, o.value); });
        label.appendChild(input);
        label.appendChild(el("span", { "class": "dot", "aria-hidden": "true" }));
        label.appendChild(el("span", null, OUKA.escapeHtml(L(o.label))));
        group.appendChild(label);
      });
      return group;
    }

    if (t === "likert") {
      var box = el("div", null, "");
      var lk = el("div", { "class": "likert", role: "radiogroup" });
      Q.likertScale.forEach(function (s) {
        var id = "f_" + field.id + "_" + s.value;
        var label = el("label", { "for": id, title: L(s.label) });
        var input = el("input", { type: "radio", id: id, name: field.id, value: s.value });
        if (String(val) === String(s.value)) input.setAttribute("checked", "checked");
        input.addEventListener("change", function () { setAnswer(field.id, String(s.value)); });
        label.appendChild(input);
        label.appendChild(el("span", { "class": "num" }, String(s.value)));
        label.appendChild(el("span", null, OUKA.escapeHtml(L(s.label))));
        lk.appendChild(label);
      });
      box.appendChild(lk);
      // スマホ用凡例（1=当てはまらない / 5=とても当てはまる）
      var legend = el("div", { "class": "likert-legend" });
      legend.appendChild(el("span", null, OUKA.escapeHtml(L(Q.likertScale[0].label))));
      legend.appendChild(el("span", null, OUKA.escapeHtml(L(Q.likertScale[4].label))));
      box.appendChild(legend);
      return box;
    }

    if (t === "consent") {
      var row = el("label", { "class": "consent-row" });
      var cb = el("input", { type: "checkbox", id: "f_" + field.id, name: field.id });
      if (val === true || val === "true") cb.setAttribute("checked", "checked");
      cb.addEventListener("change", function () { setAnswer(field.id, cb.checked); });
      row.appendChild(cb);
      var span = el("span", null, OUKA.escapeHtml(L(field.label)));
      if (field.linkKey) {
        span.appendChild(document.createTextNode(" ("));
        var a = el("a", { href: "privacy.html", target: "_blank", rel: "noopener" }, OUKA.escapeHtml(OUKA.t(field.linkKey)));
        span.appendChild(a);
        span.appendChild(document.createTextNode(")"));
      }
      row.appendChild(span);
      return row;
    }

    if (t === "file") {
      var fin = el("input", { type: "file", id: "f_" + field.id, name: field.id, accept: "image/*" });
      // Phase1：送信しない。選んでもファイル名だけ記録（内容は保存/送信しない）
      fin.addEventListener("change", function () {
        var name = fin.files && fin.files[0] ? fin.files[0].name : "";
        setAnswer("photoFilename", name);
      });
      return fin;
    }

    return el("div", null, "");
  }

  function setAnswer(id, value) {
    if (value === "" || value === null || value === undefined) delete state.answers[id];
    else state.answers[id] = value;
    // エラー表示解除
    var q = document.querySelector('.q[data-qid="' + id + '"]');
    if (q) q.classList.remove("has-error");
    save();
  }

  /* ---------- ステップ描画 ---------- */
  function renderStep() {
    var step = STEPS[state.step];
    document.getElementById("step-title").textContent = OUKA.t(step.titleKey);
    var sub = document.getElementById("step-sub");
    sub.textContent = "";

    var container = document.getElementById("step-container");
    container.innerHTML = "";

    if (step.isConfirm) {
      renderConfirm(container);
    } else {
      if (step.id === "personality" && step.likertHintKey) sub.textContent = OUKA.t(step.likertHintKey);
      if (step.noticeKey) {
        container.appendChild(el("div", { "class": "notice notice--warn", style: "margin-bottom:8px" }, OUKA.escapeHtml(OUKA.t(step.noticeKey))));
      }
      step.fields.forEach(function (f) { container.appendChild(renderField(f)); });
    }

    updateProgress();
    updateNavButtons();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderConfirm(container) {
    container.appendChild(el("div", { "class": "notice" }, OUKA.escapeHtml(OUKA.t("assessment.confirmLead"))));
    STEPS.forEach(function (step) {
      if (step.isConfirm || !step.fields.length) return;
      var group = el("div", { "class": "review-group" });
      group.appendChild(el("h3", null, OUKA.escapeHtml(OUKA.t(step.titleKey))));
      var dl = el("dl");
      var any = false;
      step.fields.forEach(function (f) {
        if (f.type === "file") return;
        var v = state.answers[f.id];
        if (v === undefined || v === null || v === "") return;
        any = true;
        var row = el("div", { "class": "review-row" });
        row.appendChild(el("dt", null, OUKA.escapeHtml(L(f.label))));
        row.appendChild(el("dd", null, OUKA.escapeHtml(valueLabel(f, v))));
        dl.appendChild(row);
      });
      if (!any) {
        var row2 = el("div", { "class": "review-row" });
        row2.appendChild(el("dd", null, "—"));
        dl.appendChild(row2);
      }
      group.appendChild(dl);
      container.appendChild(group);
    });
    container.appendChild(el("div", { "class": "notice notice--warn", style: "margin-top:8px" }, OUKA.escapeHtml(OUKA.t("disclaimer.result"))));
  }

  /* ---------- 進捗・ナビ ---------- */
  function updateProgress() {
    var total = STEPS.length;
    document.getElementById("progress").hidden = false;
    document.getElementById("progress-total").textContent = total;
    document.getElementById("progress-cur").textContent = state.step + 1;
    document.getElementById("progress-step-name").textContent = OUKA.t(STEPS[state.step].titleKey);
    document.getElementById("progress-fill").style.width = ((state.step + 1) / total * 100) + "%";

    var dots = document.getElementById("progress-dots");
    dots.innerHTML = "";
    STEPS.forEach(function (s, i) {
      var span = el("span", null, OUKA.escapeHtml(OUKA.t(s.titleKey)));
      if (i < state.step) span.className = "done";
      else if (i === state.step) span.className = "current";
      dots.appendChild(span);
    });
  }

  function updateNavButtons() {
    var back = document.getElementById("btn-back");
    var next = document.getElementById("btn-next");
    back.style.visibility = state.step === 0 ? "hidden" : "visible";
    var isLast = state.step === STEPS.length - 1;
    next.textContent = isLast ? OUKA.t("assessment.calcResult") : OUKA.t("common.next");
    next.classList.toggle("btn--primary", true);
  }

  /* ---------- バリデーション ---------- */
  function validateStep() {
    var step = STEPS[state.step];
    if (step.isConfirm) return true;
    var firstError = null;
    step.fields.forEach(function (f) {
      if (!f.required) return;
      var v = state.answers[f.id];
      var ok = (f.type === "consent") ? (v === true || v === "true") : (v !== undefined && v !== null && v !== "");
      var q = document.querySelector('.q[data-qid="' + f.id + '"]');
      if (!ok) {
        if (q) {
          q.classList.add("has-error");
          var err = q.querySelector(".q__err");
          if (err) err.textContent = (f.type === "consent") ? OUKA.t("assessment.requiredConsent")
                    : (f.type === "radio" || f.type === "select" ? OUKA.t("errors.selectOne") : OUKA.t("errors.required"));
        }
        if (!firstError) firstError = q;
      } else if (q) { q.classList.remove("has-error"); }
    });
    // 追加の形式チェック（メール・電話）
    step.fields.forEach(function (f) {
      var v = state.answers[f.id];
      if (!v) return;
      var q = document.querySelector('.q[data-qid="' + f.id + '"]');
      if (f.type === "email" && !OUKA.isEmail(v)) { markErr(q, OUKA.t("errors.email")); if (!firstError) firstError = q; }
      if (f.type === "tel" && !OUKA.isPhone(v)) { markErr(q, OUKA.t("errors.phone")); if (!firstError) firstError = q; }
    });
    if (firstError) { firstError.scrollIntoView({ behavior: "smooth", block: "center" }); return false; }
    return true;
  }
  function markErr(q, msg) {
    if (!q) return;
    q.classList.add("has-error");
    var err = q.querySelector(".q__err");
    if (err) err.textContent = msg;
  }

  /* ---------- 送信（結果計算） ---------- */
  function finish() {
    var result = OUKA_SCORING.analyze(state.answers, OUKA.cfg);
    var payload = {
      answers: state.answers,
      result: result,
      meta: {
        version: result.version,
        date: OUKA.dateStamp(),
        lang: lang(),
        source: (OUKA.cfg.behavior && OUKA.cfg.behavior.applicationSource) || "OUKA_WEBSITE"
      }
    };
    try { localStorage.setItem(RESULT_KEY, JSON.stringify(payload)); } catch (e) {}
    window.location.href = "assessment-result.html";
  }

  /* ---------- 起動 ---------- */
  function startForm(resume) {
    document.getElementById("intro").hidden = true;
    document.getElementById("assess-form").hidden = false;
    if (!resume) { state.step = 0; }
    renderStep();
  }

  function bind() {
    var hasSaved = load();
    var resumeBox = document.getElementById("resume-box");
    if (hasSaved && resumeBox) resumeBox.hidden = false;

    document.getElementById("btn-start").addEventListener("click", function () { startForm(hasSaved); });
    document.getElementById("btn-clear-intro").addEventListener("click", function () {
      clearAll(); location.reload();
    });
    document.getElementById("btn-restart").addEventListener("click", function () {
      if (confirm(lang() === "en" ? "Delete saved answers and start over?" : "保存した回答を削除して最初からやり直しますか？")) {
        clearAll(); location.reload();
      }
    });
    document.getElementById("btn-back").addEventListener("click", function () {
      if (state.step > 0) { state.step--; save(); renderStep(); }
    });
    document.getElementById("btn-next").addEventListener("click", function () {
      if (!validateStep()) return;
      if (state.step === STEPS.length - 1) { finish(); return; }
      state.step++; save(); renderStep();
    });

    // 言語切替でステップを再描画（ラベル反映）
    document.addEventListener("ouka:langchange", function () {
      if (!document.getElementById("assess-form").hidden) renderStep();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
