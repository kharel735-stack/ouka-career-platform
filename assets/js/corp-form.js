/* ============================================================================
 * corp-form.js  ―  法人・機関からのお問い合わせフォーム
 * ----------------------------------------------------------------------------
 * ★個人の入学相談・適性診断とは「別管理」です。
 *   送信先は同じ Apps Script ですが、formType が "CORP_LEAD" なので
 *   School OS の「Corp Lead Master」シート（営業＝Sales OS 側）に入ります。
 *   学生の Lead Master とは混ざりません。
 *
 * ・送信先（config.js の endpoints.appsScriptUrl）が未設定のときは、
 *   「準備中」と表示し、電話番号をご案内します。嘘の完了は出しません。
 * ・入力内容は HTTPS で送信します。
 *
 * 依存：config.js, main.js, form-connector.js
 * ==========================================================================*/
(function () {
  "use strict";

  var MSG = {
    pending: {
      ja: "ただいまフォームを準備中です。お手数ですが、携帯 9712064098、または WhatsApp +81-09017583522 へご連絡ください。",
      en: "The form is not live yet. Please call 9712064098 or contact us on WhatsApp +81-09017583522.",
      ne: "फारम अझै तयार भइसकेको छैन। कृपया मोबाइल 9712064098 वा WhatsApp +81-09017583522 मा सम्पर्क गर्नुहोस्।"
    },
    error: {
      ja: "送信に失敗しました。通信環境をご確認のうえ、もう一度お試しください。解決しない場合はお電話ください。",
      en: "Sending failed. Please check your connection and try again, or call us.",
      ne: "पठाउन असफल। इन्टरनेट जाँचेर फेरि प्रयास गर्नुहोस्, वा फोन गर्नुहोस्।"
    },
    sending: { ja: "送信しています…", en: "Sending…", ne: "पठाउँदै…" }
  };

  function pick(o) { return window.OUKA ? OUKA.pick(o, OUKA.getLang()) : o.ja; }

  function setStatus(text, isError) {
    var box = document.getElementById("corp-status");
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
    box.style.borderLeftColor = isError ? "var(--danger)" : "var(--green-700)";
  }

  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (el) {
      var wrap = el.closest(".field");
      var bad = (el.type === "checkbox") ? !el.checked : !String(el.value || "").trim();
      if (!bad && el.type === "email") {
        bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      }
      if (wrap) wrap.classList.toggle("has-error", bad);
      if (bad && ok) { try { el.focus(); } catch (e) {} }
      if (bad) ok = false;
    });
    return ok;
  }

  function collect(form) {
    var d = { formType: "CORP_LEAD" };
    new FormData(form).forEach(function (v, k) { d[k] = v; });
    d.consent = form.querySelector("#cf_consent") && form.querySelector("#cf_consent").checked ? "YES" : "NO";
    d.applicationSource = "OUKA_WEBSITE_B2B";
    d.uiLang = window.OUKA ? OUKA.getLang() : "ja";
    d.pageUrl = location.href.split("#")[0];
    return d;
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    if (!validate(form)) return;

    var btn = document.getElementById("cf_submit");
    if (btn) { btn.disabled = true; }
    setStatus(pick(MSG.sending), false);

    if (!window.OUKA_FORM) { setStatus(pick(MSG.pending), true); if (btn) btn.disabled = false; return; }

    OUKA_FORM.submit(collect(form)).then(function (res) {
      /* SENT＝受付番号まで取れた／SENT_UNCONFIRMED＝届いたが答えを読めなかった。
         どちらも「受け付けました」と出す（届いているのに送り直させないため）。
         2026-08-07 追加：お問い合わせフォームと同じ扱いに揃えた。 */
      if (res && (res.status === "SENT" || res.status === "SENT_UNCONFIRMED")) {
        form.hidden = true;
        var box = document.getElementById("corp-status");
        if (box) box.hidden = true;
        var thanks = document.getElementById("corp-thanks");
        if (thanks) { thanks.hidden = false; thanks.scrollIntoView({ behavior: "smooth", block: "center" }); }
      } else {
        /* 送信先が未設定（PENDING）＝ 嘘の完了は出さず、電話をご案内する */
        setStatus(pick(MSG.pending), true);
        if (btn) btn.disabled = false;
      }
    })["catch"](function () {
      setStatus(pick(MSG.error), true);
      if (btn) btn.disabled = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("corp-form");
    if (form) form.addEventListener("submit", onSubmit);
  });
})();
