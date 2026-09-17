/* ============================================================================
 * jp-wrap.js  ―  日本語の見出しを「意味のかたまり」で改行する
 * ----------------------------------------------------------------------------
 * ★なぜ必要か
 *   ブラウザは日本語をどこでも改行します。そのため
 *     「OUKA WAY ― 学生全員が大 / 切にする行動指針」   ← 単語の途中で切れる
 *     「私たちの未来像（ / VISION）」                   ← 括弧のあとで切れる
 *   のように、読みにくい場所で行が変わってしまいます。
 *
 * ★やっていること
 *   見出し・ボタン・質問文などの文字列を、助詞や品詞の切れ目で
 *   小さなかたまり（文節）に分け、それぞれを <span class="jw"> で包みます。
 *   span は inline-block なので、ブラウザは「かたまりの境目」でしか改行できません。
 *   → 単語の途中や括弧の直後では切れなくなります。
 *
 *   ・日本語（漢字・かな）が入っていない文字列は何もしません（英語・ネパール語は素通り）。
 *   ・1つのかたまりが画面幅より長いときだけ、途中でも折り返します（横スクロール防止）。
 *   ・文字は textContent で入れるので、HTMLが混ざることはありません（安全）。
 *
 * 依存：main.js（言語切替の ouka:langchange を受け取る）
 * ==========================================================================*/
(function () {
  "use strict";

  /* 対象にする要素。見出し・短い説明文・ボタン・質問文など「読ませる」文字列だけ。
     本文の長い段落は、日本語では自由に折り返して問題ないので触りません。 */
  var TARGETS = [
    "h1", "h2", "h3",
    ".section-head p",       /* 見出しの下の説明 */
    ".hero__lead", ".hero p",
    ".result-hero .meta",
    ".btn", "summary",       /* ボタン・よくある質問 */
    ".card > h3", ".card > h4",
    ".eyebrow", ".chips li", ".pill",
    ".cmp th", ".stat__label", ".b2b-nav a"
  ].join(",");

  var HIRA  = /[ぁ-ゟ]/;
  var KATA  = /[゠-ヿㇰ-ㇿｦ-ﾟ]/;
  var KANJI = /[々〇〻㐀-䶿一-鿿豈-﫿]/;
  var LATIN = /[0-9A-Za-z０-９Ａ-Ｚａ-ｚ]/;
  var CJK   = /[぀-ヿ㐀-鿿]/;

  /* 行頭に置いてはいけない文字（閉じ括弧・句読点・小さい字・長音・くり返し記号） */
  var NO_START = "」』）〕］｝〉》】、。，．・：；！？!?)]}”’…‥ー〜～々ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ";
  /* このあとなら切ってよい文字（句読点と閉じ括弧だけ。長音「ー」などは含めない） */
  var BREAK_AFTER = "」』）〕］｝〉》】、。，．・：；！？!?)]}”’";
  /* 行末に置いてはいけない文字（開き括弧） */
  var OPENERS = "「『（〔［｛〈《【“‘([{";

  /* 助詞（このかなの後ろは切ってよい） */
  var PARTICLES = "はがをにへともやのかねよぞさでばな";

  function has(set, c) { return set.indexOf(c) >= 0; }

  /* text の i 文字目の「前」で改行してよいか */
  function canBreakAt(text, i) {
    var prev = text.charAt(i - 1), cur = text.charAt(i);
    if (!prev || !cur) return false;
    if (has(NO_START, cur)) return false;    /* 閉じ括弧・句読点・長音を行頭に出さない */
    if (has(OPENERS, prev)) return false;    /* 開き括弧を行末に残さない */
    if (HIRA.test(cur)) return false;        /* 助詞・送り仮名は前の語にくっつける */
    /* 「ご|相談」「お|問い合わせ」のように丁寧の接頭語だけが行末に残らないようにする */
    if (prev === "ご" || prev === "お" || prev === "御") return false;

    if (has(BREAK_AFTER, prev)) return true; /* 「、」「。」のあとは切ってよい */
    if (has(OPENERS, cur)) return true;      /* 「（」の前は切ってよい */

    if (HIRA.test(prev)) {
      /* 「漢字＋かな1文字＋漢字」は複合語の途中（問い合わせ・受け入れ・申し込み・
         読み替え など）。ただし、そのかなが助詞（〜が／〜を／〜の…）なら文節の
         切れ目なので切ってよい。 */
      if (!has(PARTICLES, prev) && KANJI.test(text.charAt(i - 2) || " ")) return false;
      /* 「10か|月」「3か|所」のように、数字＋かな＋漢字の数え方も切らない */
      if (LATIN.test(text.charAt(i - 2) || " ")) return false;
      return true;                           /* かな → 漢字/カタカナ は文節の切れ目 */
    }
    if (KANJI.test(prev) && KATA.test(cur)) return true;
    /* カタカナ → 漢字（「ネパール|語」など）では切らない。語のまとまりが崩れるため */
    /* 英数字と日本語のあいだでは切らない（「20|万円」「N4|コース」を防ぐ） */
    return false;
  }

  /* 文字列を文節っぽいかたまりに分ける。半角スペースは区切りとしてそのまま返す。 */
  function chunks(text) {
    var out = [], cur = "";
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (c === " " || c === "　" || c === "\n" || c === "\t") {
        if (cur) { out.push(cur); cur = ""; }
        out.push(" ");                      /* スペースは普通の空白として置く */
        continue;
      }
      if (cur && canBreakAt(text, i)) { out.push(cur); cur = ""; }
      cur += c;
    }
    if (cur) out.push(cur);
    return merge(out);
  }

  /* 「ご|相談」「お|問い合わせ」のように、接頭語1〜2文字が離れてしまうのを防ぐ */
  function merge(parts) {
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      var lonely = /^[ぁ-ゟ]+$/.test(p) ||          /* かなだけ（ご・お など） */
                   /^[0-9０-９①-⑳ⅰ-ⅹ.．,)）\-―—・]+$/.test(p);  /* 番号・記号だけ */
      if (p !== " " && p.length <= 2 && lonely && i + 1 < parts.length) {
        if (parts[i + 1] === " " && i + 2 < parts.length) {
          /* 「① 日本語教育」のように空白で続くときは、切れない空白でつなぐ */
          parts[i + 2] = p + "\u00A0" + parts[i + 2];
          i++;                                   /* 空白そのものは出力しない */
          continue;
        }
        if (parts[i + 1] !== " ") { parts[i + 1] = p + parts[i + 1]; continue; }
      }
      out.push(p);
    }
    return out;
  }

  function wrapOne(el) {
    /* 文字だけの要素にかぎる（中にリンクや画像がある見出しは触らない） */
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== 3) return;
    var text = el.textContent;
    if (!text || text.length < 6) return;
    if (!CJK.test(text)) return;            /* 英語・ネパール語はそのまま */

    /* flex / grid で並べている要素は触らない。
       かたまりが「部品」として扱われ、gap のぶん文字の間が空いてしまうため
       （ボタンやタグはもともと短いので、包まなくても不都合はない） */
    var disp = getComputedStyle(el).display;
    if (disp.indexOf("flex") >= 0 || disp.indexOf("grid") >= 0) return;

    var parts = chunks(text);
    if (parts.length < 2) return;

    var frag = document.createDocumentFragment();
    parts.forEach(function (p) {
      if (p === " ") { frag.appendChild(document.createTextNode(" ")); return; }
      var s = document.createElement("span");
      s.className = "jw";
      s.textContent = p;                    /* HTMLとしては解釈されない＝安全 */
      frag.appendChild(s);
    });
    el.textContent = "";
    el.appendChild(frag);
  }

  function run() {
    var lang = window.OUKA ? OUKA.getLang() : "ja";
    if (lang !== "ja") return;              /* 日本語のときだけ */
    try {
      document.querySelectorAll(TARGETS).forEach(wrapOne);
    } catch (e) { /* 何かあっても表示は壊さない */ }
  }

  document.addEventListener("DOMContentLoaded", run);
  document.addEventListener("ouka:langchange", function () {
    /* 言語切替の直後は applyI18n が文字を入れ直しているので、そのあとで包み直す */
    setTimeout(run, 0);
  });
})();
