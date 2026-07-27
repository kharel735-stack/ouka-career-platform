/* ============================================================================
 * application.js  ―  入学・面談 申込フォーム
 * ・適性診断の結果（localStorage）があれば自動反映（二度打ち防止）。
 * ・School OS 用のデータ構造を作り、form-connector 経由で送信。
 * ・送信先が未設定なら「架空の送信完了」を出さず、案内と代替導線を表示。
 * 依存：config.js, translations.js, assessment-questions.js,
 *       assessment-scoring.js, main.js, form-connector.js
 * ==========================================================================*/

(function () {
  "use strict";

  var STORAGE_KEY = (OUKA.cfg.behavior && OUKA.cfg.behavior.storageKey) || "ouka_assessment_v1";
  var RESULT_KEY = STORAGE_KEY + "_result";

  function lang() { return OUKA.getLang(); }
  function L(o) { return OUKA.pick(o, lang()); }

  function findField(stepId, fieldId) {
    var step = OUKA_QUESTIONS.steps.filter(function (s) { return s.id === stepId; })[0];
    if (!step) return null;
    return step.fields.filter(function (f) { return f.id === fieldId; })[0] || null;
  }

  function fillSelect(sel, options, current) {
    if (!sel) return;
    sel.innerHTML = "";
    sel.appendChild(newOption("", OUKA.t("common.selectPlaceholder")));
    options.forEach(function (o) {
      sel.appendChild(newOption(o.value, L(o.label), current === o.value));
    });
  }
  function newOption(value, text, selected) {
    var op = document.createElement("option");
    op.value = value; op.textContent = text;
    if (selected) op.selected = true;
    return op;
  }

  function jobOptions() {
    var opts = OUKA_SCORING.visibleCodes(OUKA.cfg).map(function (c) {
      return { value: c, label: OUKA_SCORING.getJob(c).name };
    });
    opts.push({ value: "OTHER_CONSULT", label: { ja: "その他・要相談", en: "Other / consult" } });
    return opts;
  }

  function buildRadioGroup(container, name, options, current) {
    container.innerHTML = "";
    options.forEach(function (o) {
      var id = name + "_" + o.value;
      var label = document.createElement("label");
      label.className = "opt-btn"; label.setAttribute("for", id);
      var input = document.createElement("input");
      input.type = "radio"; input.name = name; input.id = id; input.value = o.value;
      if (current === o.value) input.checked = true;
      label.appendChild(input);
      var dot = document.createElement("span"); dot.className = "dot"; label.appendChild(dot);
      var span = document.createElement("span"); span.textContent = L(o.label); label.appendChild(span);
      container.appendChild(label);
    });
  }
  function radioValue(name) {
    var checked = document.querySelector('input[name="' + name + '"]:checked');
    return checked ? checked.value : "";
  }

  var answers = {};       // 診断からの回答
  var result = null;      // 診断結果

  function loadCarryover() {
    try {
      var raw = localStorage.getItem(RESULT_KEY);
      if (!raw) return;
      var payload = JSON.parse(raw);
      answers = payload.answers || {};
      result = payload.result || null;
    } catch (e) {}
  }

  function prefill() {
    var map = {
      a_fullName: "fullName", a_fullNameRoman: "fullNameRoman", a_dob: "dateOfBirth",
      a_age: "age", a_nationality: "nationality", a_phone: "phone", a_whatsapp: "whatsapp",
      a_email: "email", a_address: "address", a_guardianName: "guardianName", a_guardianPhone: "guardianPhone"
    };
    Object.keys(map).forEach(function (elId) {
      var v = answers[map[elId]];
      var el = document.getElementById(elId);
      if (el && v != null && v !== "") el.value = v;
    });
    // gender / japaneseLevel / jobs は select 生成時に current 指定
  }

  function setupSelects() {
    var genderField = findField("basic", "gender");
    fillSelect(document.getElementById("a_gender"), genderField ? genderField.options : [], answers.gender);

    var jpField = findField("japanese", "japaneseLevel");
    fillSelect(document.getElementById("a_jpLevel"), jpField ? jpField.options : [], answers.japaneseLevel);

    var courseOptions = [
      { value: "CONSTRUCTION_COURSE", label: { ja: "建設 集中コース", en: "Construction intensive" } },
      { value: "GENERAL_COURSE", label: { ja: "総合コース", en: "General course" } },
      { value: "CONSULT", label: { ja: "相談して決める", en: "Decide at consultation" } }
    ];
    fillSelect(document.getElementById("a_course"), courseOptions, answers.course);

    var jobs = jobOptions();
    fillSelect(document.getElementById("a_job1"), jobs, answers.preferredJob1);
    fillSelect(document.getElementById("a_job2"), jobs, answers.preferredJob2);
    fillSelect(document.getElementById("a_job3"), jobs, answers.preferredJob3);

    buildRadioGroup(document.getElementById("a_method"), "interviewMethod",
      [{ value: "VISIT", label: { ja: OUKA.t("application.methodVisit"), en: "In person" } },
       { value: "ONLINE", label: { ja: OUKA.t("application.methodOnline"), en: "Online" } }],
      "VISIT");
    buildRadioGroup(document.getElementById("a_guardianJoin"), "guardianJoin",
      [{ value: "YES", label: { ja: OUKA.t("common.yes"), en: "Yes" } },
       { value: "NO", label: { ja: OUKA.t("common.no"), en: "No" } }],
      "");
  }

  function showCarryover() {
    if (!result) return;
    var box = document.getElementById("carryover");
    var jobsWrap = document.getElementById("carryover-jobs");
    var recField = document.getElementById("rec-jobs-field");
    box.hidden = false;
    var names = result.top3.map(function (j, i) {
      return (i + 1) + ". " + (j.name[lang()] || j.name.ja) + "（" + j.score + OUKA.t("result.scoreUnit") + "）";
    });
    jobsWrap.textContent = names.join("　");
    recField.hidden = false;
    document.getElementById("a_recjobs").value = result.top3.map(function (j) {
      return (j.name[lang()] || j.name.ja) + "(" + j.score + ")";
    }).join(" / ");
  }

  /* ---- School OS 用データ構造 ---- */
  function buildSchoolOSData() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var top = (result && result.top3) || [];
    function jobCode(i) { return top[i] ? top[i].code : ""; }
    function jobScore(i) { return top[i] ? top[i].score : ""; }

    return {
      studentId: "",                       // ← Apps Script側で発行
      applicationDate: OUKA.dateStamp(),
      fullName: g("a_fullName"),
      fullNameRoman: g("a_fullNameRoman"),
      dateOfBirth: g("a_dob"),
      age: g("a_age"),
      gender: g("a_gender"),
      nationality: g("a_nationality"),
      address: g("a_address"),
      phone: g("a_phone"),
      whatsapp: g("a_whatsapp"),
      email: g("a_email"),
      guardianName: g("a_guardianName"),
      guardianPhone: g("a_guardianPhone"),
      passportStatus: answers.passportStatus || "",
      maritalStatus: answers.maritalStatus || "",
      education: answers.education || "",
      major: answers.major || "",
      currentJob: answers.currentJob || "",
      workExperience: answers.experienceYears || "",
      japaneseLevel: g("a_jpLevel"),
      jlptStatus: answers.jlptStatus || "",
      jftStatus: answers.jftStatus || "",
      studyHoursPerDay: answers.studyHoursPerDay || "",
      course: g("a_course"),
      preferredJob1: g("a_job1"),
      preferredJob2: g("a_job2"),
      preferredJob3: g("a_job3"),
      recommendedJob1: jobCode(0), recommendedJob1Score: jobScore(0),
      recommendedJob2: jobCode(1), recommendedJob2Score: jobScore(1),
      recommendedJob3: jobCode(2), recommendedJob3Score: jobScore(2),
      desiredDepartureDate: answers.desiredDepartureDate || "",
      familyConsent: answers.familyConsent || "",
      interviewRequested: "YES",
      interviewMethod: radioValue("interviewMethod"),
      interviewDate: g("a_interviewDate"),
      guardianJoin: radioValue("guardianJoin"),
      freeNote: g("a_note"),
      privacyConsent: document.getElementById("a_consent").checked ? "YES" : "NO",
      assessmentVersion: (result && result.version) || (OUKA.cfg.behavior && OUKA.cfg.behavior.assessmentVersion) || "v1.0",
      applicationSource: (OUKA.cfg.behavior && OUKA.cfg.behavior.applicationSource) || "OUKA_WEBSITE",
      status: "NEW_APPLICATION",
      formType: "STUDENT_APPLICATION"
    };
  }

  /* ---- バリデーション ---- */
  function validate() {
    var ok = true;
    function fieldErr(inputId, cond) {
      var input = document.getElementById(inputId);
      var field = input ? input.closest(".field") : null;
      if (!field) return;
      if (cond) { field.classList.add("has-error"); ok = false; }
      else field.classList.remove("has-error");
    }
    var name = document.getElementById("a_fullName").value.trim();
    fieldErr("a_fullName", !name);
    var phone = document.getElementById("a_phone").value.trim();
    fieldErr("a_phone", !phone || !OUKA.isPhone(phone));
    var email = document.getElementById("a_email").value.trim();
    fieldErr("a_email", email && !OUKA.isEmail(email));
    fieldErr("a_consent", !document.getElementById("a_consent").checked);
    return ok;
  }

  /* ---- 状態表示 ---- */
  function showStatus(kind, html) {
    var box = document.getElementById("app-status");
    box.hidden = false;
    box.className = "notice " + (kind === "warn" ? "notice--warn" : "");
    box.innerHTML = html;
  }
  function contactFallbackHtml() {
    var s = OUKA.cfg.school || {};
    var parts = [];
    if (s.phone) parts.push('<a href="tel:' + OUKA.escapeHtml(s.phone) + '">' + OUKA.t("common.phone") + "：" + OUKA.escapeHtml(s.phone) + "</a>");
    if (s.whatsapp) parts.push('<a href="https://wa.me/' + OUKA.escapeHtml(s.whatsapp.replace(/[^0-9]/g, "")) + '" target="_blank" rel="noopener">WhatsApp：' + OUKA.escapeHtml(s.whatsapp) + "</a>");
    if (s.email) parts.push('<a href="mailto:' + OUKA.escapeHtml(s.email) + '">' + OUKA.t("common.email") + "：" + OUKA.escapeHtml(s.email) + "</a>");
    return parts.length ? ("<div style='margin-top:8px'>" + parts.join(" ／ ") + "</div>") : "";
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      showStatus("warn", OUKA.escapeHtml(lang() === "en" ? "Please check the required fields." : "必須項目をご確認ください。"));
      return;
    }
    var data = buildSchoolOSData();
    var btn = document.getElementById("a_submit");

    // 方法B（Apps Script）が使えるとき
    if (OUKA_FORM.hasAppsScript()) {
      btn.disabled = true;
      showStatus("", OUKA.escapeHtml(OUKA.t("common.loading")));
      OUKA_FORM.submit(data).then(function (res) {
        if (res.status === "SENT") {
          document.getElementById("app-form").hidden = true;
          var thanks = document.getElementById("app-thanks");
          thanks.hidden = false;
          if (res.studentId) document.getElementById("thanks-id").textContent = "Student ID: " + res.studentId;
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          pendingFlow(data);
          btn.disabled = false;
        }
      }).catch(function () {
        // 通信失敗 → Googleフォームへ誘導（あれば）
        btn.disabled = false;
        errorFlow(data);
      });
      return;
    }

    // 方法A/C（Googleフォーム）または未設定
    pendingFlow(data);
  }

  function pendingFlow(data) {
    // Googleフォーム（方法C: 事前入力 → 方法A: そのまま）があれば案内
    var link = "";
    if (OUKA_FORM.hasPrefill()) link = OUKA_FORM.buildPrefillUrl(data);
    else if (OUKA_FORM.hasGoogleForm("student")) link = OUKA_FORM.formUrl("student");
    else if (OUKA_FORM.hasGoogleForm("interview")) link = OUKA_FORM.formUrl("interview");

    if (link) {
      showStatus("", (lang() === "en"
        ? "Please continue on the official form: "
        : "公式フォームで続けてください：") +
        '<a class="btn btn--primary" style="margin-left:8px" href="' + OUKA.escapeHtml(link) + '" target="_blank" rel="noopener">' +
        OUKA.escapeHtml(lang() === "en" ? "Open form" : "フォームを開く") + "</a>");
    } else {
      // 送信先未設定：架空の完了は出さない
      showStatus("warn", OUKA.escapeHtml(OUKA.t("common.preparingNotice")) + contactFallbackHtml());
    }
    window.scrollTo({ top: document.getElementById("app-status").offsetTop - 100, behavior: "smooth" });
  }

  function errorFlow(data) {
    var link = OUKA_FORM.hasPrefill() ? OUKA_FORM.buildPrefillUrl(data)
             : (OUKA_FORM.hasGoogleForm("student") ? OUKA_FORM.formUrl("student") : "");
    var extra = link ? ('<a class="btn btn--primary" style="margin-left:8px" href="' + OUKA.escapeHtml(link) + '" target="_blank" rel="noopener">' + OUKA.escapeHtml(lang() === "en" ? "Open form" : "フォームを開く") + "</a>") : contactFallbackHtml();
    showStatus("warn", OUKA.escapeHtml(lang() === "en"
      ? "Sending failed. Please try the official form or contact staff."
      : "送信に失敗しました。公式フォームまたはスタッフへご連絡ください。") + extra);
  }

  function bind() {
    loadCarryover();
    setupSelects();
    prefill();
    showCarryover();

    // 生年月日→年齢
    var dob = document.getElementById("a_dob");
    dob.addEventListener("change", function () {
      var age = OUKA.calcAge(dob.value);
      document.getElementById("a_age").value = (age === "" ? "" : age);
    });

    document.getElementById("app-form").addEventListener("submit", onSubmit);

    document.addEventListener("ouka:langchange", function () {
      setupSelects(); prefill(); showCarryover();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind);
  else bind();
})();
