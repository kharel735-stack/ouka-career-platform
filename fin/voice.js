/* voice.js ― 声で入れる（2026-09-28 代表指示「音声を入れて。まずネパール語から」）
 *
 * ★このファイルがするのは「話した文字から金額と通貨を読み取る」ことだけ。声そのものはブラウザ（端末）の
 *   音声認識が文字にする。録音はどこにも保存しない・受け口にも送らない（送るのは読み取った文字だけ）。
 * ★読み取れない時は金額を空のままにする（推測で入れない）。最後は人が見て直す。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FinVoice = api;
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var LANGS = [["ne-NP", "नेपाली"], ["ja-JP", "日本語"]];

  /* ネパール語の数のことば（音声認識が数字で返さない時のため） */
  var NE = {
    "शून्य": 0, "एक": 1, "दुई": 2, "तीन": 3, "चार": 4, "पाँच": 5, "पांच": 5, "छ": 6, "छः": 6, "सात": 7, "आठ": 8, "नौ": 9,
    "दश": 10, "दस": 10, "एघार": 11, "बाह्र": 12, "तेह्र": 13, "चौध": 14, "पन्ध्र": 15, "सोह्र": 16, "सत्र": 17, "अठार": 18,
    "उन्नाइस": 19, "बीस": 20, "एक्काइस": 21, "बाइस": 22, "तेइस": 23, "चौबीस": 24, "पच्चीस": 25, "तीस": 30, "पैंतीस": 35,
    "चालीस": 40, "पैंतालीस": 45, "पचास": 50, "पचपन्न": 55, "साठी": 60, "साठ": 60, "पैंसठ्ठी": 65, "सत्तरी": 70,
    "पचहत्तर": 75, "असी": 80, "पचासी": 85, "नब्बे": 90, "पन्चानब्बे": 95, "आधा": 0.5, "डेढ": 1.5, "साढे": 0
  };
  /* かける数（ネパール語・日本語・英語） */
  var MUL = { "सय": 100, "हजार": 1000, "लाख": 100000, "करोड": 10000000, "百": 100, "千": 1000, "万": 10000, "億": 100000000,
              "hundred": 100, "thousand": 1000, "lakh": 100000, "lakhs": 100000 };
  var NPR_WORDS = /रुपैयाँ|रुपैया|रुपियाँ|रुपियां|रूपैयाँ|ルピー|rupee|rupees|rs\b|npr/i;
  var JPY_WORDS = /円|येन|yen|jpy/i;

  function normalize(text) {
    var s = String(text || "");
    s = s.replace(/[०-९]/g, function (d) { return String("०१२३४५६७८९".indexOf(d)); });
    s = s.replace(/[０-９]/g, function (d) { return String(d.charCodeAt(0) - 0xff10); });
    s = s.replace(/(\d)[,，](?=\d{2,3}(\D|$))/g, "$1");           /* 30,000 → 30000（インド式 3,00,000 も） */
    s = s.replace(/(\d+(?:\.\d+)?)/g, " $1 ");                     /* 3万 → 3 万 */
    Object.keys(MUL).forEach(function (k) { if (/[^a-z]/i.test(k)) s = s.split(k).join(" " + k + " "); });
    return s.replace(/[。、,.!?।]/g, " ").replace(/\s+/g, " ").trim();
  }

  /* 金額を読む。数が1つも無ければ null。 */
  function amountOf(text) {
    var toks = normalize(text).split(" "), total = 0, cur = 0, seen = false, half = false;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], low = t.toLowerCase();
      if (/^\d+(\.\d+)?$/.test(t)) { cur += Number(t); seen = true; continue; }
      if (t === "साढे") { half = true; continue; }                 /* साढे तीन हजार＝3,500 */
      if (NE.hasOwnProperty(t) && t !== "साढे") { cur += NE[t]; seen = true; continue; }
      var m = MUL[t] || MUL[low];
      if (m) {
        seen = true;
        var base = (cur || 1) + (half ? 0.5 : 0);
        half = false;
        if (m === 100) { cur = base * 100; continue; }
        total += base * m; cur = 0;
        continue;
      }
    }
    if (!seen) return null;
    var v = Math.round((total + cur) * 100) / 100;
    return v > 0 ? v : null;
  }

  function currencyOf(text) {
    if (NPR_WORDS.test(text)) return "NPR";
    if (JPY_WORDS.test(text)) return "JPY";
    return "";
  }

  function supported(win) {
    win = win || (typeof window !== "undefined" ? window : {});
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  /* 1回だけ聞く。onText(文字, 確定したか) を呼ぶ。止める関数を返す。 */
  function listen(lang, onText, onEnd, onError) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var rec = new SR();
    rec.lang = lang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    rec.onresult = function (e) {
      var txt = "", fin = false;
      for (var i = e.resultIndex; i < e.results.length; i++) { txt += e.results[i][0].transcript; if (e.results[i].isFinal) fin = true; }
      onText(txt, fin);
    };
    rec.onerror = function (e) { if (onError) onError(e && e.error || "error"); };
    rec.onend = function () { if (onEnd) onEnd(); };
    rec.start();
    return function () { try { rec.stop(); } catch (x) { /* もう止まっている */ } };
  }

  return { LANGS: LANGS, normalize: normalize, amountOf: amountOf, currencyOf: currencyOf, supported: supported, listen: listen };
}));
