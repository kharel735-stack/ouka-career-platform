/* photo.js ― 写真で入れる（2026-09-29 代表「写真で入れれない？」）
 *
 * ★このファイルがするのは2つだけ：
 *   ① 写真を小さくする（送る量を減らす。ネパールの細い回線でも送れるように）
 *   ② 読み取った文字（Google の OCR）から、金額・日付・相手の「下書き」を作る
 * ★下書きは推測。読めない所は空のまま。最後は人が見て直してから保存する。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FinPhoto = api;
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TOTAL_WORDS = /(合\s*計|総\s*額|お?買上|お支払|請求金額|ご請求額|税込|小計|振込金額|金額|TOTAL|Total|Grand|Amount|Net|जम्मा|कुल|रकम|भुक्तानी)/;
  var SKIP_PARTY = /(明細|領収|レシート|receipt|invoice|請求書|納品書|見積|TEL|Tel|電話|〒|FAX|http|www|@|登録番号|No\.|№|\d{2,4}[\/\-年]\d{1,2})/i;

  function norm(s) {
    return String(s || "")
      .replace(/[०-९]/g, function (d) { return String("०१२३४५६७८९".indexOf(d)); })
      .replace(/[０-９]/g, function (d) { return String(d.charCodeAt(0) - 0xff10); })
      .replace(/[，]/g, ",").replace(/[．]/g, ".").replace(/[￥]/g, "¥").replace(/　/g, " ");
  }

  /* 1行から「お金らしい数」を取り出す（電話番号・郵便番号・日付は外す） */
  function moneyIn(line) {
    var out = [], re = /(¥|Rs\.?|रु\.?|NPR)?\s*(\d{1,3}(?:,\d{2,3})+|\d+)(?:\.(\d{1,2}))?\s*(円|-|\/-)?/g, m;
    var s = line.replace(/\d{2,4}[\/\-.年]\d{1,2}[\/\-.月]\d{1,2}日?/g, " ").replace(/\d{2,4}-\d{2,4}-\d{3,4}/g, " ")
      .replace(/\d{1,2}:\d{2}/g, " ");
    while ((m = re.exec(s))) {
      var digits = m[2].replace(/,/g, "");
      if (digits.length > 9) continue;
      var v = Number(digits + (m[3] ? "." + m[3] : ""));
      if (!(v > 0)) continue;
      out.push({ v: v, mark: !!(m[1] || m[4]) });
    }
    return out;
  }

  function amountOf(lines) {
    var best = null;
    for (var i = 0; i < lines.length; i++) {
      if (!TOTAL_WORDS.test(lines[i])) continue;
      var nums = moneyIn(lines[i]);
      if (!nums.length && lines[i + 1]) nums = moneyIn(lines[i + 1]);   /* 「合計」の次の行に金額がある書き方 */
      nums.forEach(function (n) { if (!best || n.v > best) best = n.v; });
    }
    if (best) return best;
    lines.forEach(function (l) { moneyIn(l).forEach(function (n) { if (n.mark && (!best || n.v > best)) best = n.v; }); });
    return best;
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ok(y, m, d) {
    if (!(y >= 2000 && y <= 2059 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return "";
    var s = y + "-" + pad(m) + "-" + pad(d), t = new Date(s + "T00:00:00Z");
    return !isNaN(t.getTime()) && t.toISOString().slice(0, 10) === s ? s : "";
  }
  /* 日付。★ネパールの暦（BS・2080年台）は西暦に直せないので読まない（空のまま） */
  function dateOf(text) {
    var m, r;
    if ((m = /令和\s*(\d{1,2})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/.exec(text)) && (r = ok(2018 + Number(m[1]), Number(m[2]), Number(m[3])))) return r;
    var re = /(20\d{2})\s*[\/\-.年]\s*(\d{1,2})\s*[\/\-.月]\s*(\d{1,2})/g;
    while ((m = re.exec(text))) { if ((r = ok(Number(m[1]), Number(m[2]), Number(m[3])))) return r; }
    re = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})\b/g;                          /* 28/09/2026（日/月/年） */
    while ((m = re.exec(text))) { if ((r = ok(Number(m[3]), Number(m[2]), Number(m[1])))) return r; }
    return "";
  }

  /* 相手＝上の方にある、店名・会社名らしい行 */
  function partyOf(lines) {
    /* 「振込先 ○○」「支払先：○○」「To: ○○」と書いてあれば、それを優先 */
    /* ★請求書の「振込先」は請求した側の口座＝相手ではない。請求書ではこの読み方をしない */
    var invoice = lines.some(function (l) { return /(請求書|invoice)/i.test(l); });
    for (var j = 0; !invoice && j < lines.length; j++) {
      var m = /^(振込先|お振込先|支払先|宛先|受取人|Payee|Pay to|To)(?:\s*[:：]\s*|\s+)(.{2,40})$/i.exec(lines[j].trim());
      if (m) return m[2].replace(/\s*(御中|様|殿)$/, "");
    }
    for (var i = 0; i < Math.min(lines.length, 8); i++) {
      var l = lines[i].trim();
      if (l.length < 2 || l.length > 40 || SKIP_PARTY.test(l) || TOTAL_WORDS.test(l)) continue;
      if ((l.match(/[0-9¥,.\-]/g) || []).length > l.length / 2) continue;
      return l.replace(/\s*(御中|様|殿)$/, "");
    }
    return "";
  }

  function currencyOf(text) {
    if (/(Rs\.?|रु|रुपैयाँ|NPR|नेपाल)/.test(text)) return "NPR";
    if (/(¥|円|税込|消費税)/.test(text)) return "JPY";
    return "";
  }

  function parse(text) {
    var t = norm(text), lines = t.split(/\r?\n/).map(function (x) { return x.trim(); }).filter(Boolean);
    return { amount: amountOf(lines), date: dateOf(t), party: partyOf(lines), cur: currencyOf(t) };
  }

  /* 写真を長い辺 1600px の JPEG にして base64 で返す（ブラウザだけで動く） */
  function shrink(file, max) {
    max = max || 1600;
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file), img = new Image();
      img.onload = function () {
        var k = Math.min(1, max / Math.max(img.width, img.height));
        var c = document.createElement("canvas");
        c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("写真を読めませんでした")); };
      img.src = url;
    });
  }

  /* PDF はそのまま送る（中身は変えない） */
  function readFile(file) {
    return new Promise(function (resolve, reject) {
      var r = new FileReader();
      r.onload = function () { resolve(r.result); };
      r.onerror = function () { reject(new Error("ファイルを読めませんでした")); };
      r.readAsDataURL(file);
    });
  }

  return { parse: parse, moneyIn: moneyIn, dateOf: dateOf, shrink: shrink, readFile: readFile };
}));
