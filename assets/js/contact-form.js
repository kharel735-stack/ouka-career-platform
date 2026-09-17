/* ============================================================================
 * contact-form.js  ―  お問い合わせフォーム（種別で入力項目を出し分け）
 * ----------------------------------------------------------------------------
 * ★考え方
 *   最初に「何のご相談か」だけを選んでいただき、
 *   その種別に必要な項目だけを出します。最初から全部は出しません。
 *   （スマートフォンで長すぎるフォームは、途中でやめられてしまうため）
 *
 * ★保存先
 *   formType:"CONTACT" として Apps Script へ送り、Contact Master に1行入ります。
 *   個人の適性診断データ（Lead Master）とは別のシートです。
 *
 * ★スパム対策（画面には見えません）
 *   ・hp … 人には見えない入力欄。ここに入力があれば機械とみなしてサーバー側で弾く
 *   ・elapsed … ページを開いてから送信までの秒数。3秒未満は機械とみなす
 *   ・送信ボタンは押した瞬間に無効化（二重送信の防止）
 *   ・同じ連絡先からの60秒以内の再送信はサーバー側で弾く
 *
 * 依存：config.js, main.js, form-connector.js
 * ==========================================================================*/
(function () {
  "use strict";

  var openedAt = Date.now();

  /* ---- 種別ごとに表示するブロック ---- */
  var GROUP = {
    ADMISSION: "student", GUARDIAN: "student", FEE: "student", VISA: "student",
    HIRING: "company", PROFILE: "company",
    PARTNER: "partner", PARTNER_NP: "partner", PARTNER_JP: "partner",
    PRESS: "", OTHER: ""
  };

  var MSG = {
    pending: {
      ja: "ただいまフォームを準備中です。お手数ですが、公式メール abas_group@outlook.jp、携帯 9712064098、または WhatsApp +81-09017583522 へご連絡ください。",
      en: "The form is not live yet. Please email abas_group@outlook.jp, call 9712064098, or contact us on WhatsApp +81-09017583522.",
      ne: "फारम अझै तयार छैन। कृपया abas_group@outlook.jp मा इमेल, मोबाइल 9712064098, वा WhatsApp +81-09017583522 मा सम्पर्क गर्नुहोस्।"
    },
    error: {
      ja: "送信に失敗しました。時間を置いて再度お試しください。公式メール abas_group@outlook.jp からもお問い合わせいただけます。",
      en: "Sending failed. Please try again later. You can also email abas_group@outlook.jp.",
      ne: "पठाउन असफल भयो। केही समयपछि पुन: प्रयास गर्नुहोस्। abas_group@outlook.jp मा इमेल पनि गर्न सक्नुहुन्छ।"
    },
    sending: { ja: "送信しています…", en: "Sending…", ne: "पठाउँदै…" },
    pickType: { ja: "まず、ご相談の種類を選んでください。", en: "Please choose the type of enquiry first.", ne: "पहिले सोधपुछको प्रकार छान्नुहोस्।" },
    tooFast: {
      ja: "先ほどの送信を受け付けています。同じ内容を続けて送る必要はありません（1分ほどお待ちください）。",
      en: "Your previous message has been received. No need to send the same thing again (please wait about a minute).",
      ne: "तपाईंको अघिल्लो सन्देश प्राप्त भइसक्यो। उही कुरा फेरि पठाउनु पर्दैन (करिब १ मिनेट पर्खनुहोस्)।"
    },
    needContact: {
      ja: "ご連絡先を1つ以上ご記入ください（メール・電話・WhatsApp のいずれか）。",
      en: "Please give at least one contact: email, phone or WhatsApp.",
      ne: "कम्तीमा एउटा सम्पर्क लेख्नुहोस् — इमेल, फोन वा WhatsApp।"
    }
  };

  function pick(o) { return window.OUKA ? OUKA.pick(o, OUKA.getLang()) : o.ja; }

  function setStatus(text, isError) {
    var box = document.getElementById("contact-status");
    if (!box) return;
    box.textContent = text;
    box.hidden = false;
    box.style.borderLeftColor = isError ? "var(--danger)" : "var(--green-700)";
  }

  /* 隠れている項目は必須を外す（見えない項目のせいで送信できなくなるのを防ぐ） */
  function setReq(root, on) {
    root.querySelectorAll("[data-req]").forEach(function (el) {
      if (on) el.setAttribute("required", "required");
      else el.removeAttribute("required");
    });
  }

  /* ---- 種別が変わったら、必要なブロックだけ出す ---- */
  function applyType() {
    var sel = document.getElementById("ct_inquiryType");
    var value = sel ? sel.value : "";
    var group = GROUP[value] || "";

    /* 共通項目（氏名・連絡先・相談内容・同意）は、種別を選んだら出す */
    var common = document.getElementById("blk-common");
    if (common) {
      common.hidden = !value;
      setReq(common, !!value);      /* 種別ごとのブロックも中に入っている */
    }
    /* 種別ごとのブロックは共通のあとに上書きする（入れ子のため順番が大事） */
    ["student", "company", "partner"].forEach(function (g) {
      var block = document.getElementById("blk-" + g);
      if (!block) return;
      var show = (g === group);
      block.hidden = !show;
      setReq(block, show);
    });

    /* FAQ：種別が未選択のあいだは3種類とも出す（開いた直後に空にしない）。
       種別を選んだら、その種別だけに絞る。 */
    ["student", "company", "partner"].forEach(function (g) {
      var f = document.getElementById("faq-" + g);
      if (f) f.hidden = group ? (g !== group) : false;
    });
  }

  function validate(form) {
    var ok = true;
    form.querySelectorAll("[required]").forEach(function (el) {
      if (el.offsetParent === null && el.type !== "hidden") return;   /* 非表示の項目は見ない */
      var wrap = el.closest(".field") || el.closest(".consent-row");
      var bad = (el.type === "checkbox") ? !el.checked : !String(el.value || "").trim();
      if (!bad && el.type === "email") bad = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (wrap) wrap.classList.toggle("has-error", bad);
      if (bad && ok) { try { el.focus(); } catch (e) {} }
      if (bad) ok = false;
    });
    return ok;
  }

  /* 連絡先が1つも無いと返信できないため、送信前にここで止める
     （サーバー側でも同じ判定をします） */
  function hasContact(form) {
    return ["ct_email", "ct_phone", "ct_whatsapp"].some(function (id) {
      var el = form.querySelector("#" + id);
      return el && !el.disabled && String(el.value || "").trim() !== "";
    });
  }

  function collect(form) {
    var d = { formType: "CONTACT" };
    new FormData(form).forEach(function (v, k) { d[k] = v; });
    d.consent = form.querySelector("#ct_consent") && form.querySelector("#ct_consent").checked ? "YES" : "NO";
    d.elapsed = Math.round((Date.now() - openedAt) / 1000);
    d.uiLang = window.OUKA ? OUKA.getLang() : "ja";
    d.pageUrl = location.href.split("#")[0];
    d.referrer = document.referrer || "";
    d.applicationSource = "OUKA_WEBSITE_CONTACT";
    return d;
  }

  function onSubmit(e) {
    e.preventDefault();
    var form = e.target;
    var sel = document.getElementById("ct_inquiryType");
    if (!sel || !sel.value) { setStatus(pick(MSG.pickType), true); sel && sel.focus(); return; }
    if (!validate(form)) return;
    if (!hasContact(form)) {
      setStatus(pick(MSG.needContact), true);
      var em = form.querySelector("#ct_email");
      if (em) { try { em.focus(); } catch (e2) {} }
      return;
    }

    var btn = document.getElementById("ct_submit");
    if (btn) btn.disabled = true;                     /* 二重送信の防止 */
    setStatus(pick(MSG.sending), false);

    if (!window.OUKA_FORM) { setStatus(pick(MSG.pending), true); if (btn) btn.disabled = false; return; }

    OUKA_FORM.submit(collect(form)).then(function (res) {
      /* SENT＝受付番号まで取れた／SENT_UNCONFIRMED＝届いたが番号を読めなかった。
         どちらも「受け付けました」と出す（送り直させないため） */
      if (res && (res.status === "SENT" || res.status === "SENT_UNCONFIRMED")) {
        var id = (res.raw && res.raw.contactId) || "";
        form.hidden = true;
        var box = document.getElementById("contact-status");
        if (box) box.hidden = true;
        var th = document.getElementById("contact-thanks");
        if (th) {
          var no = document.getElementById("contact-id");
          if (no) no.textContent = id;
          var wrap = document.getElementById("contact-id-wrap");
          if (wrap) wrap.hidden = !id;
          th.hidden = false;
          th.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else {
        setStatus(pick(MSG.pending), true);
        if (btn) btn.disabled = false;
      }
    })["catch"](function (err) {
      /* ⚠ サーバーの詳細なエラー内容は画面に出しません。
         ただし「60秒以内の再送信」だけは、失敗ではなく“もう届いている”状態なので
         そのことが分かる文言に切り替えます（同じ内容を何度も送らせないため）。 */
      var reason = String((err && err.message) || "");
      var msg = /too many requests/i.test(reason) ? MSG.tooFast : MSG.error;
      setStatus(pick(msg), true);
      if (btn) btn.disabled = false;
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", onSubmit);
    var sel = document.getElementById("ct_inquiryType");
    if (sel) sel.addEventListener("change", applyType);
    /* 上部の3つのカードから種別を選べるようにする */
    document.querySelectorAll("[data-pick-type]").forEach(function (a) {
      a.addEventListener("click", function () {
        var v = a.getAttribute("data-pick-type");
        if (sel) { sel.value = v; applyType(); }
      });
    });
    applyType();
  });
})();
