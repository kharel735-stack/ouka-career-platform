/* ============================================================================
 * main.js  ―  全ページ共通：i18n / 言語切替 / ナビ / config反映 / 共通ユーティリティ
 * 依存：config.js, translations.js（先に読み込むこと）
 * ==========================================================================*/

window.OUKA = (function () {
  "use strict";

  var CFG = window.OUKA_CONFIG || {};
  var I18N = window.OUKA_I18N || {};
  var LANG_KEY = "ouka_lang";

  /* ---- 言語 ---- */
  function availableLangs() {
    return (CFG.behavior && CFG.behavior.availableLangs) || ["ja"];
  }
  function defaultLang() {
    return (CFG.behavior && CFG.behavior.defaultLang) || "ja";
  }
  function getLang() {
    // URLの ?lang=ja|en|ne を最優先（例：?lang=ne でネパール語リンクを直接共有できる）
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q && availableLangs().indexOf(q) >= 0) {
        try { localStorage.setItem(LANG_KEY, q); } catch (e) {}
        return q;
      }
    } catch (e) {}
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    if (saved && availableLangs().indexOf(saved) >= 0) return saved;
    return defaultLang();
  }
  function setLang(lang) {
    if (availableLangs().indexOf(lang) < 0) lang = defaultLang();
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.documentElement.setAttribute("lang", lang);
    applyI18n();
    syncLangButtons(lang);
    document.dispatchEvent(new CustomEvent("ouka:langchange", { detail: { lang: lang } }));
  }

  /* ---- 翻訳の取得（ドット記法・ja へフォールバック） ---- */
  function t(key, lang) {
    lang = lang || getLang();
    var val = dig(I18N[lang], key);
    if (val === undefined && lang === "ne") val = dig(I18N.en, key); // ネパール語は英語→日本語の順にフォールバック
    if (val === undefined && lang !== "ja") val = dig(I18N.ja, key);
    return (val === undefined) ? key : val;
  }

  /* 多言語オブジェクト {ja,en,ne} から現在言語を取り出す（ne→en→ja フォールバック） */
  function pick(obj, lang) {
    if (!obj) return "";
    lang = lang || getLang();
    if (obj[lang]) return obj[lang];
    if (lang === "ne" && obj.en) return obj.en;
    return obj.ja || obj.en || "";
  }
  function dig(obj, path) {
    if (!obj) return undefined;
    var parts = path.split(".");
    var cur = obj;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  /* ---- data-i18n の適用 ---- */
  function applyI18n() {
    var lang = getLang();

    // textContent（安全）
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      el.textContent = t(el.getAttribute("data-i18n"), lang);
    });
    // innerHTML（翻訳ファイル内の固定文のみ。ユーザー入力は絶対に使わない）
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      el.innerHTML = t(el.getAttribute("data-i18n-html"), lang);
    });
    // 属性（"placeholder:key" / 複数は ; 区切り）
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var kv = pair.split(":");
        if (kv.length === 2) el.setAttribute(kv[0].trim(), t(kv[1].trim(), lang));
      });
    });
  }

  function syncLangButtons(lang) {
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === lang ? "true" : "false");
    });
  }

  /* ---- config 反映（電話・住所・リンクなど公開情報） ---- */
  function applyConfig() {
    var s = CFG.school || {};
    // data-config="school.phone" 等をテキストに
    document.querySelectorAll("[data-config]").forEach(function (el) {
      var v = dig(CFG, el.getAttribute("data-config"));
      if (v) { el.textContent = v; }
      else if (el.hasAttribute("data-config-hide-empty")) { hide(el); }
    });
    // 電話リンク
    setLinks("[data-tel]", function (el) {
      var v = s.phone || ""; return v ? "tel:" + v : "";
    });
    setLinks("[data-landline]", function () { var v = s.landline || ""; return v ? "tel:" + v : ""; });
    // WhatsApp
    setLinks("[data-whatsapp]", function () {
      var v = (s.whatsapp || "").replace(/[^0-9]/g, "");
      return v ? "https://wa.me/" + v : "";
    });
    // メール
    setLinks("[data-email]", function () { return s.email ? "mailto:" + s.email : ""; });
    // 地図
    setLinks("[data-map]", function () { return s.mapUrl || ""; });

    // テキスト表示（電話・固定・WhatsApp・メール・住所）
    fillText("[data-show='phone']", s.phone);
    fillText("[data-show='landline']", s.landline);
    fillText("[data-show='whatsapp']", s.whatsapp);
    fillText("[data-show='email']", s.email);
    fillText("[data-show='address-ja']", s.addressJa);
    fillText("[data-show='address-en']", s.addressEn);
  }

  function setLinks(sel, hrefFn) {
    document.querySelectorAll(sel).forEach(function (el) {
      var href = hrefFn(el);
      if (href) { el.setAttribute("href", href); }
      else { // 未設定なら、その連絡手段の行を隠す（架空リンクを出さない）
        var wrap = el.closest("[data-contact-item]") || el;
        hide(wrap);
      }
    });
  }
  function fillText(sel, val) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (val) el.textContent = val;
      else { var wrap = el.closest("[data-contact-item]") || el; hide(wrap); }
    });
  }
  function hide(el) { if (el) el.style.display = "none"; }

  /* ---- ハンバーガーナビ ---- */
  function initNav() {
    var toggle = document.querySelector(".nav-toggle");
    var links = document.querySelector(".nav-links");
    if (!toggle || !links) return;
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { links.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); });
    });
  }

  /* ---- 言語ボタン（config.availableLangs から自動生成） ---- */
  var LANG_LABELS = { ja: "日本語", en: "EN", ne: "नेपाली" };
  function initLangSwitch() {
    var cur = getLang();
    document.querySelectorAll(".lang-switch").forEach(function (box) {
      box.innerHTML = "";
      availableLangs().forEach(function (lg) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-set-lang", lg);
        btn.setAttribute("aria-pressed", lg === cur ? "true" : "false");
        btn.textContent = LANG_LABELS[lg] || lg;
        btn.addEventListener("click", function () { setLang(lg); });
        box.appendChild(btn);
      });
    });
    // .lang-switch を使わず data-set-lang 単独指定がある場合も拾う
    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      if (btn.closest(".lang-switch")) return;
      if (btn.__ouka_bound) return;
      btn.__ouka_bound = true;
      btn.addEventListener("click", function () { setLang(btn.getAttribute("data-set-lang")); });
    });
  }

  /* ---- 職種名（コード→表示名） ---- */
  function jobName(code, lang) {
    lang = lang || getLang();
    var scoring = window.OUKA_SCORING;
    if (scoring) { var j = scoring.getJob(code); if (j) return pick(j.name, lang); }
    return code;
  }
  function jobStatus(code) {
    return (CFG.jobStatus && CFG.jobStatus[code]) || "hidden";
  }
  function jobStatusLabel(code, lang) {
    var st = jobStatus(code);
    if (st === "active") return t("jobs.statusActive", lang);
    if (st === "preparing") return t("jobs.statusPreparing", lang);
    if (st === "consulting") return t("jobs.statusConsulting", lang);
    return "";
  }

  /* ---- 共通ユーティリティ ---- */
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function calcAge(dobStr) {
    if (!dobStr) return "";
    var d = new Date(dobStr);
    if (isNaN(d.getTime())) return "";
    var today = new Date();
    var age = today.getFullYear() - d.getFullYear();
    var m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return (age >= 0 && age < 120) ? age : "";
  }
  function isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function isPhone(v) { return /^[0-9+\-\s()]{5,20}$/.test(v); }

  function nowStamp() {
    var d = new Date();
    function p(n){ return (n<10?"0":"")+n; }
    return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate()) +
           " " + p(d.getHours()) + ":" + p(d.getMinutes());
  }
  function dateStamp() {
    var d = new Date();
    function p(n){ return (n<10?"0":"")+n; }
    return d.getFullYear() + "-" + p(d.getMonth()+1) + "-" + p(d.getDate());
  }

  /* ---- 起動 ---- */
  function boot() {
    document.documentElement.setAttribute("lang", getLang());
    initNav();
    initLangSwitch();
    applyConfig();
    applyI18n();
    syncLangButtons(getLang());
    // フッターの年
    document.querySelectorAll("[data-year]").forEach(function (el){ el.textContent = new Date().getFullYear(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }

  return {
    cfg: CFG, i18n: I18N,
    t: t, dig: dig, pick: pick,
    getLang: getLang, setLang: setLang, availableLangs: availableLangs,
    applyI18n: applyI18n, applyConfig: applyConfig,
    jobName: jobName, jobStatus: jobStatus, jobStatusLabel: jobStatusLabel,
    escapeHtml: escapeHtml, calcAge: calcAge, isEmail: isEmail, isPhone: isPhone,
    nowStamp: nowStamp, dateStamp: dateStamp
  };
})();
