/* fin.js ― ABAS 財務アプリの画面（https://abas-globalgroup.com/fin/）
 *
 * ★この画面が持つもの＝ログイン・表示・入力だけ。数字の計算・権限の判断はすべて受け口（FinLayer）がする。
 *   画面で隠すのではなく、見せてはいけない数字はそもそも届かない。
 * ★パスワードは Clerk に渡すだけ（auth.js の約束のまま）。
 * ★端末に残すのは「前回選んだ法人・通貨・事業」だけ。金額・相手は残さない。
 */
(function () {
  "use strict";
  var CFG = window.OUKA_FIN_CONFIG || {};
  var A = window.OukaAuth;
  var $ = function (id) { return document.getElementById(id); };
  var LAST_KEY = "abas_fin_last_v1";

  var clerkReady = null, loginStarted = false, codeStep = null, me = null, opts = null, counts = {};
  var gen = 0;   /* 画面を切り替えるたびに増える。古い画面あての返事は捨てる（遅い回線で上書きしない） */

  /* ------------------------------------------------------------ 小物 */
  function esc(s) {
    return String(s === undefined || s === null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function yen(n) { var v = Math.round(Number(n) || 0); return (v < 0 ? "−" : "") + "¥" + Math.abs(v).toLocaleString("ja-JP"); }
  function money(cur, n) { return cur === "NPR" ? "Rs " + (Number(n) || 0).toLocaleString("ja-JP") : yen(n); }
  function today() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toast.h); toast.h = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function show(el, on) { if (el) el.hidden = !on; }
  function view(html) { $("view").innerHTML = html; }
  function loading() { view('<p class="empty">読み込んでいます…</p>'); }
  function readLast() { try { return JSON.parse(localStorage.getItem(LAST_KEY) || "{}") || {}; } catch (x) { return {}; } }
  function saveLast(o) { try { localStorage.setItem(LAST_KEY, JSON.stringify(o)); } catch (x) { /* 使えなくても止めない */ } }

  var MSG = {
    E_AUTH: "ログインの有効期限が切れました。もう一度ログインしてください。",
    E_NO_ROLE: "このアカウントには権限が登録されていません。代表に連絡してください。",
    E_NOT_ALLOWED: "このアカウントでは財務アプリを開けません。",
    E_FORBIDDEN: "この操作はこのアカウントではできません。",
    E_DISABLED: "このアカウントは停止されています。", E_EXPIRED: "このアカウントの有効期間が切れています。",
    E_NOT_YET: "このアカウントはまだ使えません。",
    E_NOT_CONFIGURED: "サーバーの設定がまだ終わっていません。代表に連絡してください。",
    E_HEADER: "Finance OS の列の名前が変わっています。何も書いていません。代表に連絡してください。",
    E_BUSY: "いま混み合っています。少し待ってからもう一度。",
    E_NO_PERMIT: "かのんの許可がまだありません。", E_STATE: "この支払（入金）は、いまの状態ではその操作ができません。",
    E_REASON: "理由を書いてください。", E_AMOUNT: "金額を正しく入れてください。", E_DATE: "日付を正しく入れてください。",
    E_FUTURE: "まだ来ていない日付では「入った」にできません。", E_PARTY: "相手を入れてください。",
    E_DUP: "同じ名前の支払先があります。", E_NEED_SETUP: "最初の設定がまだです。", E_DAY: "支払日は1〜31で入れてください。",
    E_BIZ: "事業を選んでください。", E_KIND: "区分を選んでください。", E_NOT_FOUND: "見つかりません。画面を読み込み直してください。"
  };
  function msgOf(res) {
    var c = res && res.error ? String(res.error) : "";
    return (MSG[c] || "うまくいきませんでした。") + (c ? "（" + c + "）" : "");
  }

  /* ------------------------------------------------------------ 通信 */
  function freshToken() {
    var c = window.Clerk;
    return c && c.session ? Promise.resolve(c.session.getToken()) : Promise.resolve("");
  }
  function api(action, extra) {
    return freshToken().then(function (token) {
      if (!token) { toLogin(MSG.E_AUTH); throw new Error("E_AUTH"); }
      var body = A.buildBody(token, action, extra || {});
      return fetch(CFG.finLayerUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) })
        .then(function (r) { return r.json(); }, function () { return { ok: false, error: "NETWORK" }; });
    }).then(function (res) {
      if (res && res.error === "E_AUTH") toLogin(MSG.E_AUTH);
      if (res && res.error === "NETWORK") res.message = "つながりません。電波を確かめてください（何も保存されていません）。";
      return res;
    });
  }
  /* 画面の読み込み用。返事が来る前に別の画面へ移っていたら、何もしない */
  function load(action, extra) {
    var g = gen;
    return api(action, extra).then(function (r) { return g === gen ? r : new Promise(function () {}); });
  }
  function fail(res) { view('<div class="card"><p class="err">' + esc(res && res.message || msgOf(res)) + "</p></div>"); }

  /* ------------------------------------------------------------ ログイン（/iv/ と同じ手順） */
  function setErr(m) { $("loginErr").textContent = m || ""; }
  function setBusy(on, text) { var b = $("loginBtn"); b.disabled = !!on; b.textContent = on ? (text || "ログイン中…") : "ログイン"; }
  function clearSecret() { $("fPassword").value = ""; }
  function toLogin(msg) {
    codeStep = null; me = null;
    show($("codeForm"), false); show($("loginForm"), true); show($("loginView"), true); show($("appShell"), false);
    clearSecret(); setBusy(false); setErr(msg || "");
  }
  var WAIT = 3000, STEP = 150;
  function waitForSession(c, left) {
    if (c && c.session) return Promise.resolve(c.session);
    if (left <= 0) return Promise.resolve(null);
    return new Promise(function (d) { setTimeout(d, STEP); }).then(function () { return waitForSession(c, left - STEP); });
  }
  function loadClerk() {
    if (window.Clerk && window.Clerk.load) {              /* テストでは先に置いてある */
      return Promise.resolve(window.Clerk.load({})).then(function () { return window.Clerk; });
    }
    return new Promise(function (resolve, reject) {
      var url = A.scriptUrl(CFG.clerkPublishableKey);
      if (!url) { reject(new Error("設定（config.js）が正しくありません")); return; }
      var el = document.createElement("script");
      el.src = url; el.async = true; el.crossOrigin = "anonymous";
      el.setAttribute("data-clerk-publishable-key", CFG.clerkPublishableKey);
      el.onload = function () {
        if (!window.Clerk) { reject(new Error("ログイン基盤を読み込めませんでした")); return; }
        Promise.resolve(window.Clerk.load({})).then(function () { resolve(window.Clerk); }, reject);
      };
      el.onerror = function () { reject(new Error("ログイン基盤に接続できませんでした。電波を確かめてください。")); };
      document.head.appendChild(el);
    });
  }
  function secondFactor(clerk, res) {
    var plan = A.secondFactorPlan(res);
    if (!plan) return Promise.reject(A.signInStatusError(res));
    var signIn = (res && typeof res.attemptSecondFactor === "function") ? res : clerk.client.signIn;
    var prepared = plan.prepare ? Promise.resolve(signIn.prepareSecondFactor(plan.prepare)) : Promise.resolve();
    return prepared.then(function () {
      setBusy(false); show($("loginForm"), false); show($("codeForm"), true);
      $("codeHint").textContent = plan.message; $("fCode").value = "";
      return new Promise(function (resolve, reject) {
        codeStep = {
          submit: function (raw) {
            var v = A.validateCode(raw); $("fCode").value = "";
            if (!v.ok) { setErr(v.error); return; }
            setErr("");
            Promise.resolve(signIn.attemptSecondFactor({ strategy: plan.strategy, code: v.code })).then(function (done) {
              codeStep = null; show($("codeForm"), false); show($("loginForm"), true); setBusy(true); resolve(done);
            }, function (err) {
              var m = A.mapSecondFactorError(err);
              if (m.retry) { setErr(A.formatError(m)); return; }
              codeStep = null; reject({ oukaCategory: m.category, detail: m.detail, message: m.message });
            });
          },
          cancel: function () { codeStep = null; reject(A.sessionError("second_factor_cancelled")); }
        };
      });
    });
  }
  function onLogin(e) {
    e.preventDefault(); setErr("");
    var secret = $("fPassword").value;
    var v = A.validate({ username: $("fUsername").value, password: secret });
    if (!v.ok) { secret = null; clearSecret(); setErr(v.errors.join("\n")); return; }
    if (!clerkReady) { secret = null; clearSecret(); setErr("ログイン基盤を読み込めていません。読み込み直してください。"); return; }
    setBusy(true); loginStarted = true;
    var phase = "authentication";
    clerkReady.then(function (clerk) {
      var p;
      try { p = clerk.client.signIn.create({ identifier: v.username, password: secret }); }
      finally { secret = null; clearSecret(); }
      return Promise.resolve(p).then(function (res) {
        return res && res.status === "needs_second_factor" ? secondFactor(clerk, res) : res;
      }).then(function (res) {
        if (!res || res.status !== "complete" || !res.createdSessionId) throw A.signInStatusError(res);
        return clerk.setActive({ session: res.createdSessionId });
      }, function (err) { if (!A.isAlreadySignedIn(err)) throw err; })
        .then(function () { return waitForSession(clerk, WAIT); })
        .then(function (s) { if (!s) throw A.sessionError("no_active_session"); });
    }).then(function () { phase = "authorization"; return start(); }).catch(function (err) {
      secret = null; clearSecret(); setBusy(false); loginStarted = false;
      if (phase === "authorization" && window.Clerk && window.Clerk.signOut) window.Clerk.signOut();
      var m = phase === "authentication" ? A.mapSignInError(err) : A.mapRequestError(err);
      if (err && err.message) m.message = err.message;
      setErr(A.formatError(m));
    });
  }
  function onLogout() {
    var c = window.Clerk;
    Promise.resolve(c && c.signOut ? c.signOut() : null).then(function () { location.replace(location.pathname); });
  }

  /* ------------------------------------------------------------ 画面の切り替え（携帯が主） */
  var LEVEL_NAME = { CEO: "代表", APPROVER: "許可者", LIMITED: "閲覧（限定）", CLERK: "入力" };
  function navFor() {
    var c = me.can;
    if (c.view) return [["#/", "ホーム", "⌂"], ["#/pay", "支払", "↗", "pay"], ["#/add", "入れる", "＋"], ["#/payees", "支払先", "☰"], ["#/more", "その他", "…"]];
    if (c.add) return [["#/add", "入れる", "＋"], ["#/mine", "入れた分", "☰"]];
    return [];
  }
  function drawNav() {
    var h = location.hash || "#/", items = navFor();
    var base = h.replace(/^(#\/[a-z]*).*$/, "$1");
    if (base === "#/payee") base = "#/payees";
    if (["#/month", "#/export", "#/share", "#/in", "#/members"].indexOf(base) >= 0) base = "#/more";
    $("tabs").hidden = !items.length;
    document.body.classList.toggle("has-nav", items.length > 0);
    $("tabs").innerHTML = items.map(function (t) {
      var n = t[3] && counts[t[3]] ? '<span class="count">' + counts[t[3]] + "</span>" : "";
      return '<a href="' + t[0] + '"' + (base === t[0] ? ' class="on"' : "") + '><span class="ic">' + t[2] + "</span>" + esc(t[1]) + n + "</a>";
    }).join("");
  }
  function route() {
    if (!me) return;
    var h = location.hash || "#/", c = me.can;
    gen++;
    if (stopVoice) stopVoice();
    drawNav();
    window.scrollTo(0, 0);
    var m = /^#\/payee\/([A-Za-z0-9-]+)$/.exec(h);
    if (m && c.payees) return pagePayee(m[1]);
    if (h === "#/add" && c.add) return pageAdd();
    if (h === "#/pay" && c.view) return pagePay();
    if (h === "#/payees" && c.payees) return pagePayees();
    if (h === "#/more" && c.view) return pageMore();
    if (h === "#/in" && c.view) return pageIn();
    if (h === "#/month" && c.view) return pageMonth();
    if (h === "#/share" && c.switches) return pageShare();
    if (h === "#/export" && c.view) return pageExport();
    if (h === "#/mine" && c.add) return pageMine();
    if (h === "#/members" && c.members) return pageMembers();
    if (c.view) return me.level === "CEO" ? pageControl() : pageKanon();
    if (c.limited) return pageLimited();
    if (c.add) { location.replace("#/add"); return; }
    view('<p class="empty">開ける画面がありません。</p>');
  }

  /* ------------------------------------------------------------ 部品 */
  function tile(k, v, cls, s, href) {
    var inner = '<div class="k">' + esc(k) + '</div><div class="v num ' + (cls || "") + '">' + v + "</div>" + (s ? '<div class="s">' + s + "</div>" : "");
    return href ? '<a class="tile link" href="' + href + '">' + inner + "</a>" : '<div class="tile">' + inner + "</div>";
  }
  function riskCard(c) {
    return '<div class="card risk"><span class="badge b-' + esc(c.label) + '">' + esc(c.label) + "</span><div>" +
      (c.days === null ? "支払の記録がまだ少ないので、何日もつかは計算できません。"
        : "いまの出費のペースで、使えるお金は <b>あと " + c.days + " 日分</b>") +
      '<div class="small muted">使えるお金 ' + yen(c.usable) + "・1日の出費 約" + yen(c.per_day) + "</div></div></div>";
  }
  function alertsHtml(list) {
    return list.map(function (a) { return '<div class="alert ' + esc(a.level) + '"><b>' + esc(a.kind) + "</b>" + esc(a.text) + "</div>"; }).join("");
  }
  function daysLeft(due) {
    var d = Math.round((Date.parse(due + "T00:00:00Z") - Date.parse(today() + "T00:00:00Z")) / 86400000);
    return d < 0 ? "期限切れ " + (-d) + "日" : d === 0 ? "今日が期限" : "あと" + d + "日";
  }
  function payBadges(o) {
    var b = "";
    if (o.dir !== "out" || !o.due || o.status === "支払済") return b;
    var d = Math.round((Date.parse(o.due + "T00:00:00Z") - Date.parse(today() + "T00:00:00Z")) / 86400000);
    if (d < 0) b += '<span class="tag red">期限切れ</span>';
    else if (d <= 3) b += '<span class="tag amber">準備 ' + daysLeft(o.due) + "</span>";
    if (d <= 7 && o.secured === false) b += '<span class="tag red">資金まだ</span>';
    if (o.secured) b += '<span class="tag green">資金確保済</span>';
    return b;
  }
  function itemHtml(o, acts) {
    var sign = o.dir === "in" ? "+" : "−";
    return '<div class="item"><div class="main"><div class="t">' + esc(o.party || "（相手なし）") + ' <span class="tag">' + esc(o.kind) + "</span>" + payBadges(o) + "</div>" +
      '<div class="m">' + esc(o.date) + (o.dir === "out" && o.due && o.status !== "支払済" ? "（期限）" : "") + "・" + esc(o.biz) + "・" + esc(o.status) +
      (o.memo ? "・" + esc(o.memo) : "") + "</div>" + (o.approver ? '<div class="m">' + esc(o.approver) + "</div>" : "") +
      (o.stop_reason ? '<div class="m" style="color:var(--red)">止めた理由：' + esc(o.stop_reason) + "</div>" : "") +
      (acts || "") + '</div><div class="amt num" style="color:var(--' + o.dir + ')">' + sign + money(o.cur, o.amount) + "</div></div>";
  }
  function btn(act, id, label, cls) {
    return '<button class="btn ' + (cls || "") + '" data-act="' + act + '" data-id="' + esc(id) + '">' + label + "</button>";
  }
  /* その人がその支払にできること（受け口が最終判断。ここは押せるボタンを出すだけ） */
  function actsFor(o) {
    var c = me.can, a = [];
    if (o.dir === "in") { if (c.receive && o.status !== "入金済") a.push(btn("recv", o.id, "入った")); return a.join(""); }
    var st = o.status;
    if (c.permit && (st === "未承認" && o.permit !== "許可" || st === "保留")) a.push(btn("permit", o.id, st === "保留" ? "やはり許可" : "許可する", "primary"));
    if (c.permit && st === "未承認") a.push(btn("stop", o.id, "止める", "danger"));
    if (c.approve && st === "未承認" && o.permit === "許可") a.push(btn("approve", o.id, "承認する", "primary"));
    if (c.pay && (st === "承認済" || st === "支払予定")) a.push(btn("paid", o.id, "支払った", "primary"));
    if (c.secure && st !== "保留" && st !== "支払済") a.push(o.secured ? btn("unsecure", o.id, "資金確保を取り消す") : btn("secure", o.id, "資金確保済にする"));
    return a.join("");
  }
  function list(items, withActs, emptyText) {
    return '<div class="card">' + (items.length ? items.map(function (o) {
      var a = withActs ? actsFor(o) : "";
      return itemHtml(o, a ? '<div class="acts">' + a + "</div>" : "");
    }).join("") : '<p class="empty">' + (emptyText || "ありません") + "</p>") + "</div>";
  }
  function bindActs(reload) {
    Array.prototype.forEach.call(document.querySelectorAll("[data-act]"), function (b) {
      b.onclick = function () { act(b.getAttribute("data-act"), b.getAttribute("data-id"), b, reload); };
    });
  }
  function act(kind, id, b, reload) {
    var send = function (action, extra, done) {
      var g = gen;
      b.disabled = true;
      api(action, extra).then(function (r) {
        if (!r.ok) { b.disabled = false; toast(r.message || msgOf(r)); return; }
        toast(done || "記録しました");
        if (g === gen) reload();
      });
    };
    if (kind === "permit") return send("permit", { id: id }, "許可しました");
    if (kind === "secure") return send("secure", { id: id }, "資金確保済にしました");
    if (kind === "unsecure") return send("secure", { id: id, undo: true }, "取り消しました");
    if (kind === "approve") { if (confirm("この支払を承認しますか？")) send("approve", { id: id }, "承認しました"); return; }
    if (kind === "stop") {
      var reason = prompt("止める理由（必須）");
      if (reason && reason.trim()) send("stop", { id: id, reason: reason.trim() }, "止めました");
      return;
    }
    if (kind === "paid") {
      var d = prompt("支払った日（YYYY-MM-DD）", today());
      if (d) send("mark_paid", { id: id, date: d.trim() }, "支払済にしました");
      return;
    }
    if (kind === "recv") {
      var d2 = prompt("入った日（YYYY-MM-DD）", today());
      if (d2) send("mark_received", { id: id, date: d2.trim() }, "入金済にしました");
    }
  }
  function setCounts(r) {
    counts.pay = (me.can.permit ? r.pending.to_permit : 0) + (me.can.approve ? r.pending.to_approve + r.pending.to_pay : 0) + r.todo.urge.length;
    drawNav();
  }

  /* ------------------------------------------------------------ 代表：コントロールルーム */
  function pageControl() {
    loading();
    load("today").then(function (r) {
      if (!r.ok) return fail(r);
      setCounts(r);
      var t = r.todo, c = r.cash, h = "";
      h += riskCard(c);
      h += '<h2>あなたの番</h2><div class="grid">' +
        tile("承認待ち", r.pending.to_approve + "件", r.pending.to_approve ? "out" : "", "かのん許可済み", "#/pay") +
        tile("支払待ち", r.pending.to_pay + "件", r.pending.to_pay ? "out" : "", "承認済・未払い", "#/pay") +
        tile("催促（資金まだ）", t.urge.length + "件", t.urge.length ? "out" : "", yen(t.urge_sum) + "・7日以内", "#/pay") +
        tile("準備（3日以内）", t.prep.length + "件", "", yen(t.prep_sum), "#/pay") + "</div>";
      if (r.to_approve.length) h += "<h3>承認待ち</h3>" + list(r.to_approve, true);
      if (r.to_pay.length) h += "<h3>支払待ち</h3>" + list(r.to_pay, true);
      if (t.urge.length) h += "<h3>催促：資金がまだ確保できていない</h3>" + list(t.urge, true);
      if (r.alerts.length) h += "<h2>気をつけること</h2>" + alertsHtml(r.alerts);
      h += todayBlocks(r);
      view(h);
      bindActs(pageControl);
    });
  }

  /* ------------------------------------------------------------ かのん：今日やること */
  function pageKanon() {
    loading();
    load("today").then(function (r) {
      if (!r.ok) return fail(r);
      setCounts(r);
      var t = r.todo, h = "";
      h += '<div class="quick"><a class="btn primary" href="#/add">＋ 支払を入れる</a><a class="btn" href="#/payee/new">＋ 支払先を登録</a></div>';
      h += '<h2>今日やること</h2><div class="grid">' +
        tile("許可待ち", r.pending.to_permit + "件", r.pending.to_permit ? "out" : "", "", "#/pay") +
        tile("催促（資金まだ）", t.urge.length + "件", t.urge.length ? "out" : "", yen(t.urge_sum), "#/pay") +
        tile("準備（3日以内）", t.prep.length + "件", "", yen(t.prep_sum), "#/pay") +
        tile("期限切れ", t.overdue.length + "件", t.overdue.length ? "out" : "", t.overdue.length ? yen(t.overdue_sum) : "", "#/pay") + "</div>";
      if (r.to_permit.length) h += "<h3>許可待ち</h3>" + list(r.to_permit, true);
      if (t.overdue.length) h += "<h3>期限を過ぎた未払い</h3>" + list(t.overdue, true);
      if (t.urge.length) h += "<h3>催促：7日以内・資金がまだ</h3>" + list(t.urge, true);
      if (t.prep.length) h += "<h3>準備：3日以内に払う</h3>" + list(t.prep, true);
      if (r.alerts.length) h += "<h2>気をつけること</h2>" + alertsHtml(r.alerts);
      h += riskCard(r.cash) + todayBlocks(r);
      view(h);
      bindActs(pageKanon);
    });
  }

  function todayBlocks(r) {
    var c = r.cash, h = "";
    h += "<h2>" + esc(r.date) + " の日報</h2><div class=\"grid\">" +
      tile("今日 入った", yen(r.today.in), "in") + tile("今日 出た", yen(r.today.out), "out") +
      tile("7日以内に払う", yen(r.due.week), "out", r.due.overdue ? "うち期限切れ " + yen(r.due.overdue) : "") +
      tile("まだ入っていない", yen(r.receivable.open), "", r.receivable.late ? "予定日を過ぎた分 " + yen(r.receivable.late) : "", "#/in") + "</div>";
    h += "<h2>" + esc(r.month.ym) + "（今月）</h2><div class=\"grid\">" +
      tile("売上（入金）", yen(r.month.in), "in") + tile("経費（支払）", yen(r.month.out), "out") +
      tile("差し引き", yen(r.month.profit), r.month.profit < 0 ? "out" : "in", "", "#/month") + "</div>";
    h += "<h2>この先のお金</h2><div class=\"card scroll\"><table><tr><th>いつまで</th><th class=r>入る予定</th><th class=r>払う予定</th><th class=r>残り</th></tr>" +
      r.forecast.map(function (f) {
        return "<tr><td>" + f.days + "日後</td><td class='r num'>" + yen(f.in) + "</td><td class='r num'>" + yen(f.out) + "</td><td class='r num'" +
          (f.short ? " style='color:var(--red);font-weight:700'" : "") + ">" + yen(f.balance) + (f.short ? "<div class=small>足りない " + yen(f.short) + "</div>" : "") + "</td></tr>";
      }).join("") + "</table><p class=note>入力された予定だけで計算しています。毎月の支払先を登録しておくと、自動で予定に入ります。</p></div>";
    h += "<details class=card><summary>口座の残高</summary><table>" + c.accounts.map(function (a) {
      return "<tr><td>" + esc(a.name) + "<div class=small>" + esc(a.corp) + "</div></td><td class='r num'>" + money(a.cur, a.balance) + "</td></tr>";
    }).join("") + "</table><p class=note>Finance OS（毎朝8時に再計算）の値です。</p></details>";
    return h;
  }

  /* ------------------------------------------------------------ 支払（期日順） */
  function pagePay() {
    loading();
    load("pending").then(function (r) {
      if (!r.ok) return fail(r);
      var t = r.todo, c = me.can, h = "";
      counts.pay = (c.permit ? r.to_permit.length : 0) + (c.approve ? r.to_approve.length + r.to_pay.length : 0) + t.urge.length;
      drawNav();
      if (t.overdue.length) h += "<h2>期限切れ（" + t.overdue.length + "）</h2>" + list(t.overdue, true);
      h += "<h2>7日以内に払う（" + t.week.length + "・" + yen(t.week_sum) + "）</h2>" +
        '<p class="note">3日前から「準備」。7日前で資金が確保できていなければ「資金まだ」＝毎朝8時に催促のメールが届きます。</p>' + list(t.week, true);
      h += "<h2>かのんの許可待ち（" + r.to_permit.length + "）</h2>" + (c.permit ? '<p class="note">許可しても、お金は動きません。代表が承認して支払います。</p>' : "") + list(r.to_permit, true);
      h += "<h2>代表の承認待ち（" + r.to_approve.length + "）</h2>" + list(r.to_approve, true);
      h += "<h2>支払待ち（承認済）（" + r.to_pay.length + "）</h2>" + (c.pay ? '<p class="note">実際に払った後に「支払った」を押してください。</p>' : "") + list(r.to_pay, true);
      if (r.stopped.length) h += "<h2>止めた支払（" + r.stopped.length + "）</h2>" + list(r.stopped, true);
      view(h);
      bindActs(pagePay);
    });
  }

  function pageIn() {
    loading();
    load("pending").then(function (r) {
      if (!r.ok) return fail(r);
      view("<h2>入金待ち（" + r.to_receive.length + "）</h2>" + list(r.to_receive, true));
      bindActs(pageIn);
    });
  }

  /* ------------------------------------------------------------ 入れる */
  var dir = "out";
  function pageAdd() {
    var draw = function () {
      var last = readLast(), o = opts.options, isIn = dir === "in", reg = opts.registry || [];
      var sel = function (id, lst, cur) {
        return '<select id="' + id + '">' + lst.map(function (x) { return "<option" + (x === cur ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") + "</select>";
      };
      var h = '<div class="card"><div class="seg"><button type="button" id="dIn" class="in' + (isIn ? " on" : "") + '">入ってくるお金</button>' +
        '<button type="button" id="dOut" class="out' + (!isIn ? " on" : "") + '">出ていくお金</button></div>' +
        voiceBox(last) +
        '<form id="addForm" autocomplete="off">' +
        (!isIn && reg.length ? '<label>登録した支払先から選ぶ<select id="aReg"><option value="">（選ばない）</option>' +
          reg.map(function (p, i) { return '<option value="' + i + '">' + esc(p.name) + (p.amount ? "（" + money(p.cur, p.amount) + "）" : "") + "</option>"; }).join("") +
          "</select></label>" : "") +
        '<div class="row3"><label>金額<input id="aAmt" inputmode="decimal" required placeholder="0"></label>' +
        "<label>通貨" + sel("aCur", o.cur, last.cur || "JPY") + "</label></div>" +
        "<label>" + (isIn ? "区分" : "費目") + sel("aKind", isIn ? o.in_kind : o.item, isIn ? last.inKind : last.outKind) + "</label>" +
        "<label>" + (isIn ? "だれから（取引先・生徒）" : "だれに（支払先）") +
        '<input id="aParty" list="aPartyList" required maxlength="80"></label><datalist id="aPartyList">' +
        (isIn ? opts.parties : opts.payees).map(function (p) { return '<option value="' + esc(p) + '">'; }).join("") + "</datalist>" +
        (isIn ? '<label class="check"><input type="checkbox" id="aRecv" checked> もう入った</label>' : "") +
        '<label id="aDateLabel">' + (isIn ? "入った日" : "支払の期限") + '<input id="aDate" type="date" required value="' + today() + '"></label>' +
        '<div class="row2"><label>法人' + sel("aCorp", o.corp, last.corp) + "</label>" +
        '<label>事業<select id="aBiz">' + o.biz.map(function (b) {
          return '<option value="' + esc(b) + '"' + (b === last.biz ? " selected" : "") + ">" + esc(b) + "</option>";
        }).join("") + "</select></label></div>" +
        "<details><summary>くわしく（内容・口座・方法）</summary>" +
        '<label>内容<input id="aMemo" maxlength="200" placeholder="例：9月分 給料"></label>' +
        '<div class="row2"><label>口座<select id="aAcc"><option value="">（あとで）</option>' + o.account.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></label>" +
        '<label>方法<select id="aMethod"><option value="">（あとで）</option>' + o.method.map(function (x) { return "<option>" + esc(x) + "</option>"; }).join("") + "</select></label></div>" +
        '<label>備考<textarea id="aNote" rows="2" maxlength="300"></textarea></label></details>' +
        '<button class="btn primary big" id="aSave" type="submit">' + (isIn ? "入金を記録する" : "支払を起案する") + "</button>" +
        (isIn ? "" : '<p class="note">支払は「未承認」で入ります。かのんの許可 → 代表の承認 → 代表が支払う、の順で進みます。</p>') +
        "</form></div>";
      view(h);
      $("dIn").onclick = function () { dir = "in"; draw(); };
      $("dOut").onclick = function () { dir = "out"; draw(); };
      bindVoice();
      if ($("aReg")) $("aReg").onchange = function () {
        var p = reg[Number(this.value)];
        if (!p) return;
        $("aParty").value = p.name; $("aCur").value = p.cur; $("aKind").value = p.kind; $("aCorp").value = p.corp; $("aBiz").value = p.biz;
        if (p.amount) $("aAmt").value = p.amount;
      };
      if (isIn) $("aRecv").onchange = function () { $("aDateLabel").firstChild.textContent = this.checked ? "入った日" : "入る予定の日"; };
      $("addForm").onsubmit = function (e) {
        e.preventDefault();
        var ent = { amount: Number(String($("aAmt").value).replace(/[,，\s]/g, "")), cur: $("aCur").value, kind: $("aKind").value,
          party: $("aParty").value.trim(), date: $("aDate").value, corp: $("aCorp").value, biz: $("aBiz").value,
          memo: $("aMemo").value.trim(), account: $("aAcc").value, method: $("aMethod").value, note: $("aNote").value.trim() };
        if (isIn) ent.received = $("aRecv").checked;
        if (!(ent.amount > 0)) { toast(MSG.E_AMOUNT); return; }
        $("aSave").disabled = true;
        api(isIn ? "add_income" : "add_payment", { entry: ent }).then(function (r) {
          $("aSave").disabled = false;
          if (!r.ok) { toast(r.message || msgOf(r)); return; }
          var l = readLast(); l.cur = ent.cur; l.corp = ent.corp; l.biz = ent.biz;
          if (isIn) l.inKind = ent.kind; else l.outKind = ent.kind;
          saveLast(l);
          toast((isIn ? "入金を記録しました " : "支払を起案しました ") + r.id);
          $("aAmt").value = ""; $("aParty").value = ""; $("aMemo").value = ""; $("aNote").value = "";
          if ($("aReg")) $("aReg").value = "";
        });
      };
    };
    if (opts) return draw();
    loading();
    load("options").then(function (r) { if (!r.ok) return fail(r); opts = r; draw(); });
  }

  /* ------------------------------------------------------------ 声で入れる（まずネパール語） */
  var stopVoice = null;
  function voiceBox(last) {
    var V = window.FinVoice;
    if (!V) return "";
    var lang = last.voiceLang || "ne-NP";
    if (!V.supported()) {
      return '<p class="note voice-off">🎤 このブラウザは声の入力に対応していません。キーボードのマイクで話してください' +
        "（Android の Gboard はネパール語で話せます）。</p>";
    }
    return '<div class="voice"><button type="button" class="btn mic" id="vMic">🎤 声で入れる</button>' +
      '<select id="vLang" aria-label="話すことば">' + V.LANGS.map(function (l) {
        return '<option value="' + l[0] + '"' + (l[0] === lang ? " selected" : "") + ">" + l[1] + "</option>";
      }).join("") + "</select></div>" +
      '<div class="voice-out" id="vOut" hidden><div id="vText"></div><div class="acts">' +
      '<button type="button" class="btn small" id="vParty">相手に入れる</button>' +
      '<button type="button" class="btn small" id="vMemo">内容に入れる</button></div>' +
      '<p class="note">例：「मधु सरको तलब तीस हजार」「भाडा ३० हजार रुपैयाँ」。金額は自動で入ります。声は保存しません。</p></div>';
  }
  function bindVoice() {
    var V = window.FinVoice, mic = $("vMic");
    if (!V || !mic) return;
    var heard = "";
    $("vLang").onchange = function () { var l = readLast(); l.voiceLang = this.value; saveLast(l); };
    mic.onclick = function () {
      if (stopVoice) { stopVoice(); return; }
      heard = "";
      mic.classList.add("on"); mic.textContent = "● 聞いています…（押すと止まる）";
      $("vOut").hidden = false; $("vText").textContent = "";
      var done = function () { stopVoice = null; mic.classList.remove("on"); mic.textContent = "🎤 声で入れる"; };
      try {
        stopVoice = V.listen($("vLang").value, function (txt, fin) {
          $("vText").textContent = txt;
          if (!fin) return;
          heard = txt;
          var amt = V.amountOf(txt), cur = V.currencyOf(txt);
          if (amt) $("aAmt").value = amt;
          if (cur) $("aCur").value = cur;
          if (!$("aMemo").value) $("aMemo").value = txt.slice(0, 200);
          toast(amt ? "金額 " + amt.toLocaleString("ja-JP") + " を入れました。相手を確かめてください。" : "金額が聞き取れませんでした。数字で入れてください。");
        }, done, function (err) {
          done();
          toast(err === "not-allowed" ? "マイクが許可されていません。ブラウザの設定で許可してください。" :
            err === "language-not-supported" ? "この端末はこのことばの声の入力に対応していません。日本語か、キーボードのマイクを使ってください。" :
            err === "no-speech" ? "声が聞こえませんでした。もう一度。" : "声の入力に失敗しました（" + err + "）");
        });
      } catch (x) { done(); toast("声の入力を始められませんでした。"); }
    };
    $("vParty").onclick = function () { if (heard || $("vText").textContent) $("aParty").value = (heard || $("vText").textContent).slice(0, 80); };
    $("vMemo").onclick = function () { if (heard || $("vText").textContent) $("aMemo").value = (heard || $("vText").textContent).slice(0, 200); };
  }

  /* ------------------------------------------------------------ 支払先 */
  var payeeCache = null;
  function pagePayees() {
    loading();
    load("payees").then(function (r) {
      if (!r.ok) return fail(r);
      payeeCache = r;
      var h = '<div class="quick"><a class="btn primary" href="#/payee/new">＋ 新しい支払先</a></div>' +
        '<p class="note">「毎月」にした支払先は、期日の10日前に支払が自動で起案されます（未承認で入り、かのんの許可から始まります）。</p>' +
        '<div class="card">' + (r.payees.length ? r.payees.map(function (p) {
          return '<a class="item link" href="#/payee/' + esc(p.id) + '"><div class="main"><div class="t">' + esc(p.name) + ' <span class="tag">' + esc(p.type) + "</span>" +
            (p.recurring ? '<span class="tag green">毎月 ' + p.day + "日</span>" : "") + (p.active ? "" : '<span class="tag">使っていない</span>') + "</div>" +
            '<div class="m">' + esc(p.kind) + "・" + esc(p.biz) + (p.bank ? "・振込先あり" : "") + "</div></div>" +
            '<div class="amt num">' + (p.recurring ? money(p.cur, p.amount) : "") + "</div></a>";
        }).join("") : '<p class="empty">まだ登録がありません。</p>') + "</div>";
      view(h);
    });
  }
  function pagePayee(id) {
    var draw = function (r) {
      var p = id === "new" ? { type: "業者", corp: "株式会社ABAS", biz: "桜花学校", kind: "外注費", cur: "JPY", active: true }
        : r.payees.filter(function (x) { return x.id === id; })[0];
      if (!p) return fail({ error: "E_NOT_FOUND" });
      var o = (opts && opts.options) || { corp: [], biz: [], item: [], cur: ["JPY", "NPR"] };
      var sel = function (fid, lst, cur) {
        return '<select id="' + fid + '">' + lst.map(function (x) { return "<option" + (x === cur ? " selected" : "") + ">" + esc(x) + "</option>"; }).join("") + "</select>";
      };
      view('<div class="card"><form id="pForm" autocomplete="off">' +
        '<label>名前（支払先）<input id="pName" required maxlength="80" value="' + esc(p.name || "") + '"></label>' +
        '<div class="row2"><label>種別' + sel("pType", r.kinds, p.type) + "</label><label>費目" + sel("pKind", o.item, p.kind) + "</label></div>" +
        '<div class="row2"><label>法人' + sel("pCorp", o.corp, p.corp) + "</label><label>事業" + sel("pBiz", o.biz, p.biz) + "</label></div>" +
        '<label class="check"><input type="checkbox" id="pRec"' + (p.recurring ? " checked" : "") + "> 毎月払う（給料・家賃など）</label>" +
        '<div id="pRecBox"' + (p.recurring ? "" : " hidden") + '><div class="row3"><label>毎月の金額<input id="pAmt" inputmode="decimal" value="' + esc(p.amount || "") + '"></label>' +
        "<label>通貨" + sel("pCur", o.cur, p.cur) + "</label></div>" +
        '<label>毎月の支払日（1〜31。31＝月末）<input id="pDay" type="number" min="1" max="31" inputmode="numeric" value="' + esc(p.day || "") + '"></label></div>' +
        '<label>振込先（銀行・支店・口座）<input id="pBank" maxlength="200" value="' + esc(p.bank || "") + '"></label>' +
        '<label>メモ<textarea id="pMemo" rows="2" maxlength="300">' + esc(p.memo || "") + "</textarea></label>" +
        (id === "new" ? "" : '<label class="check"><input type="checkbox" id="pActive"' + (p.active ? " checked" : "") + "> 使っている</label>") +
        '<button class="btn primary big" id="pSave" type="submit">' + (id === "new" ? "登録する" : "保存する") + "</button>" +
        '<a class="btn big ghost" href="#/payees">もどる</a></form></div>');
      $("pRec").onchange = function () { $("pRecBox").hidden = !this.checked; };
      $("pForm").onsubmit = function (e) {
        e.preventDefault();
        var rec = $("pRec").checked;
        var body = { id: id === "new" ? "" : id, name: $("pName").value.trim(), type: $("pType").value, kind: $("pKind").value,
          corp: $("pCorp").value, biz: $("pBiz").value, cur: rec ? $("pCur").value : (p.cur || "JPY"), recurring: rec,
          amount: rec ? Number(String($("pAmt").value).replace(/[,，\s]/g, "")) : 0, day: rec ? Number($("pDay").value) : 0,
          bank: $("pBank").value.trim(), memo: $("pMemo").value.trim(), active: $("pActive") ? $("pActive").checked : true };
        $("pSave").disabled = true;
        api("payee_save", { payee: body }).then(function (res) {
          $("pSave").disabled = false;
          if (!res.ok) { toast(res.error === "E_DUP" ? "同じ名前の支払先があります。" : res.error === "E_DAY" ? "支払日は1〜31で入れてください。" : msgOf(res)); return; }
          opts = null;
          toast("保存しました" + (res.created && res.created.length ? "（今月分の支払を起案しました）" : ""));
          location.hash = "#/payees";
        });
      };
    };
    loading();
    var need = [payeeCache && id !== "new" && payeeCache.payees.some(function (x) { return x.id === id; }) ? Promise.resolve(payeeCache) : load("payees"),
      opts ? Promise.resolve(opts) : load("options")];
    Promise.all(need).then(function (rs) {
      if (!rs[0].ok) return fail(rs[0]);
      if (rs[1] && rs[1].ok) opts = rs[1];
      draw(rs[0]);
    });
  }

  /* ------------------------------------------------------------ その他 */
  function pageMore() {
    var c = me.can, links = [["#/month", "月の数字（事業ごと・先月比）"], ["#/in", "入金待ち"], ["#/export", "書き出し（freee・税理士向けCSV）"]];
    if (c.switches) links.push(["#/share", "桒原に見せる項目"]);
    if (c.members) links.unshift(["#/members", "メンバー（だれが使えるか・毎朝のメール）"]);
    view('<div class="card">' + links.map(function (l) {
      return '<a class="item link" href="' + l[0] + '"><div class="main"><div class="t">' + esc(l[1]) + '</div></div><div class="amt">›</div></a>';
    }).join("") + '</div><p class="note">ホーム画面に追加すると、アプリのように開けます（iPhone＝共有 →「ホーム画面に追加」／Android＝メニュー →「ホーム画面に追加」）。</p>');
  }

  /* ------------------------------------------------------------ メンバー（代表だけ） */
  var LV = { "代表": "全部＋承認・支払", "許可者": "全部＋許可・停止（かのん）", "限定": "ONにした項目だけ（桒原）", "入力": "入れるだけ" };
  function pageMembers() {
    loading();
    load("members").then(function (r) {
      if (!r.ok) return fail(r);
      var opt = function (cur) { return r.levels.map(function (l) { return "<option value=\"" + l + "\"" + (l === cur ? " selected" : "") + ">" + l + "（" + LV[l] + "）</option>"; }).join(""); };
      var LN = { CEO: "代表", APPROVER: "許可者", LIMITED: "限定", CLERK: "入力" };
      var h = '<p class="note">ここに入っている人だけが財務アプリを開けます。先にログイン用のアカウント（OUKAのアカウント）が要ります。教師・生徒は入れられません。' +
        "毎朝のメール（準備・催促）は「代表」「許可者」でメールが入っている人にだけ届きます。</p>";
      h += "<h2>使える人</h2><div class=card>" + r.members.map(function (m, i) {
        return '<div class="member"><div class="t">' + esc(m.name) + (m.active ? "" : ' <span class="tag">停止中</span>') + "</div>" +
          '<label>権限<select data-m="' + i + '" class="mLv">' + opt(LN[m.level] || "") + "</select></label>" +
          '<label>毎朝のメール<input type="email" class="mMail" data-m="' + i + '" value="' + esc(m.email) + '" placeholder="なし"></label>' +
          '<div class="acts"><button class="btn primary mSave" data-m="' + i + '">保存</button>' +
          '<button class="btn mStop" data-m="' + i + '">' + (m.active ? "止める" : "もどす") + "</button></div></div>";
      }).join("") + "</div>";
      h += "<h2>足す</h2><div class=card>" + (r.candidates.length ?
        '<label>アカウント<select id="cId">' + r.candidates.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.name) + "（" + esc(c.role) + "）</option>"; }).join("") + "</select></label>" +
        '<label>権限<select id="cLv">' + opt("許可者") + "</select></label>" +
        '<label>毎朝のメール（代表・許可者だけ）<input type="email" id="cMail" placeholder="例 name@example.com"></label>' +
        '<button class="btn primary big" id="cAdd">足す</button>'
        : '<p class="empty">足せるアカウントがありません。先に OUKA のアカウント（ログイン）を作ってください。</p>') + "</div>";
      view(h);
      var save = function (m, extra, b) {
        var body = { id: m.id, name: m.name, level: LN[m.level] || "", email: m.email, active: m.active };
        Object.keys(extra).forEach(function (k) { body[k] = extra[k]; });
        b.disabled = true;
        api("member_save", { member: body }).then(function (res) {
          b.disabled = false;
          if (!res.ok) { toast(res.error === "E_SELF" ? "自分を代表から外すことはできません。" : res.error === "E_LEVEL" ? "その人は「代表」にできません。" :
            res.error === "E_EMAIL" ? "メールの形が正しくありません。" : msgOf(res)); return; }
          toast("保存しました"); pageMembers();
        });
      };
      Array.prototype.forEach.call(document.querySelectorAll(".mSave"), function (b) {
        b.onclick = function () {
          var i = b.getAttribute("data-m");
          save(r.members[i], { level: document.querySelector('.mLv[data-m="' + i + '"]').value, email: document.querySelector('.mMail[data-m="' + i + '"]').value.trim() }, b);
        };
      });
      Array.prototype.forEach.call(document.querySelectorAll(".mStop"), function (b) {
        b.onclick = function () { var m = r.members[b.getAttribute("data-m")]; save(m, { active: !m.active }, b); };
      });
      if ($("cAdd")) $("cAdd").onclick = function () {
        var sel = $("cId"), c = r.candidates[sel.selectedIndex];
        save({ id: c.id, name: c.name, level: "", email: "", active: true }, { level: $("cLv").value, email: $("cMail").value.trim() }, this);
      };
    });
  }

  /* ------------------------------------------------------------ 月 */
  var monthSel = "";
  function pageMonth() {
    loading();
    load("month", { month: monthSel }).then(function (r) {
      if (!r.ok) return fail(r);
      var m = r.month, p = r.prev, prevOf = {};
      p.by_biz.forEach(function (b) { prevOf[b.biz] = b; });
      var diff = function (a, b) { var d = a - b; return (d >= 0 ? "+" : "−") + yen(Math.abs(d)); };
      var h = '<div class="card"><label>月<input type="month" id="mSel" value="' + esc(m.ym) + '"></label></div>' +
        '<div class="grid">' + tile("売上（入金）", yen(m.in), "in", "先月 " + yen(p.in)) + tile("経費（支払）", yen(m.out), "out", "先月 " + yen(p.out)) +
        tile("差し引き", yen(m.profit), m.profit < 0 ? "out" : "in", "先月 " + yen(p.profit)) + "</div>";
      h += '<h2>事業ごと</h2><div class="card scroll"><table><tr><th>事業</th><th class=r>売上</th><th class=r>経費</th><th class=r>差し引き</th><th class=r>先月比</th></tr>' +
        (m.by_biz.length ? m.by_biz.map(function (b) {
          var pb = prevOf[b.biz] || { in: 0 };
          return "<tr><td>" + esc(b.biz) + "</td><td class='r num'>" + yen(b.in) + "</td><td class='r num'>" + yen(b.out) +
            "</td><td class='r num'>" + yen(b.profit) + "</td><td class='r num'>" + diff(b.in, pb.in) + "</td></tr>";
        }).join("") : "<tr><td colspan=5 class=empty>この月の記録はありません</td></tr>") + "</table>" +
        '<p class="note">売上＝入った日で数えた入金（借入・出資・口座振替・返金を除く）。経費＝払った日で数えた支払（口座振替・借入元金・改装・備品を除く）。税務の決算ではありません。</p></div>';
      h += "<h2>明細（" + r.items.length + "件）</h2>" + list(r.items, false);
      view(h);
      $("mSel").onchange = function () { monthSel = this.value; gen++; pageMonth(); };
    });
  }

  /* ------------------------------------------------------------ 桒原に見せる（スイッチ） */
  function pageShare() {
    loading();
    load("switches").then(function (r) {
      if (!r.ok) return fail(r);
      var h = '<p class="note">桒原さんに見える項目です。ONにした物だけがサーバーから届きます（画面で隠すのではありません）。' +
        "給与・人ごとの支払は、ここに出てきません＝桒原さんには常に見えません。切り替えには理由が必要で、記録が残ります。</p>" +
        '<div class="card">' + r.switches.map(function (s) {
          return '<div class="sw"><div class="main"><b>' + esc(s.key) + "</b> " + esc(s.name) +
            (s.by ? '<div class="small muted">' + esc(s.at) + "・" + esc(s.by) + "・" + esc(s.reason) + "</div>" : "") + "</div>" +
            '<span class="pill ' + (s.on ? "on" : "off") + '">' + (s.on ? "ON" : "OFF") + "</span>" +
            '<button class="btn small" data-key="' + esc(s.key) + '" data-on="' + (s.on ? "0" : "1") + '">' + (s.on ? "OFFにする" : "ONにする") + "</button></div>";
        }).join("") + "</div>";
      view(h);
      Array.prototype.forEach.call(document.querySelectorAll("[data-key]"), function (b) {
        b.onclick = function () {
          var on = b.getAttribute("data-on") === "1";
          var reason = prompt((on ? "ONにする" : "OFFにする") + "理由（必須・記録に残ります）");
          if (!reason || !reason.trim()) return;
          b.disabled = true;
          var g = gen;
          api("set_switch", { key: b.getAttribute("data-key"), on: on, reason: reason.trim() }).then(function (res) {
            if (!res.ok) { b.disabled = false; toast(msgOf(res)); return; }
            toast("切り替えました");
            if (g === gen) pageShare();
          });
        };
      });
    });
  }

  /* ------------------------------------------------------------ 桒原の画面（限定） */
  function pageLimited() {
    loading();
    load("limited").then(function (r) {
      if (!r.ok) return fail(r);
      var h = "";
      if (!r.show.length) h += '<p class="empty">いま見せてもらえる数字はありません。</p>';
      if (r.K1) h += '<div class="card risk"><span class="badge b-' + esc(r.K1.label) + '">' + esc(r.K1.label) + "</span><div>資金繰りの状態" +
        (r.K1.days !== null ? '<div class="small muted">いまの出費のペースで あと ' + r.K1.days + " 日分</div>" : "") + "</div></div>";
      if (r.K2) h += "<h2>いつまでに・いくら足りないか</h2><div class=\"grid\">" + r.K2.map(function (f) {
        return tile(f.days + "日後（" + f.until + "）", f.short ? yen(f.short) : "足りている", f.short ? "out" : "in", f.short ? "足りない額" : "");
      }).join("") + '</div><p class="note">入力された予定だけで計算しています。</p>';
      if (r.K3) h += "<h2>借入</h2><div class=card scroll><table><tr><th>借入先</th><th class=r>残高</th><th class=r>月の返済</th><th>次の返済日</th></tr>" +
        (r.K3.length ? r.K3.map(function (l) {
          return "<tr><td>" + esc(l.lender) + "<div class=small>" + esc(l.status) + "</div></td><td class='r num'>" + money(l.cur, l.balance) +
            "</td><td class='r num'>" + money(l.cur, l.monthly) + "</td><td>" + esc(l.next) + "</td></tr>";
        }).join("") : "<tr><td colspan=4 class=empty>ありません</td></tr>") + "</table></div>";
      if (r.K4) h += "<h2>資金調達の案件</h2><div class=card>" + (!r.K4.connected ? '<p class="empty">School OS の資金調達タブにつながっていません。</p>' :
        r.K4.items.map(function (f) {
          return '<div class="item"><div class="main"><div class="t">' + esc(f.who) + ' <span class="tag">' + esc(f.kind) + "</span></div>" +
            '<div class="m">' + esc(f.status) + (f.next ? "・次：" + esc(f.next) : "") + (f.due ? "（" + esc(f.due) + "）" : "") + "</div></div>" +
            '<div class="amt num">' + yen(f.amount) + '<div class="small muted">確度' + f.rate + "%</div></div></div>";
        }).join("")) + "</div>";
      if (r.K5) h += "<h2>事業別の売上（" + esc(r.K5.ym) + "）</h2><div class=card scroll><table>" + r.K5.by_biz.map(function (b) {
        return "<tr><td>" + esc(b.biz) + "</td><td class='r num'>" + yen(b.in) + "</td></tr>";
      }).join("") + "</table></div>";
      if (r.K6) h += "<h2>月の損益（" + esc(r.K6.ym) + "）</h2><div class=grid>" + tile("売上", yen(r.K6.in), "in") + tile("経費", yen(r.K6.out), "out") +
        tile("差し引き", yen(r.K6.profit), r.K6.profit < 0 ? "out" : "in") + "</div>";
      if (r.K7) h += "<h2>口座</h2><div class=card scroll><table>" + r.K7.map(function (a) {
        return "<tr><td>" + esc(a.name) + "</td><td class='r num'>" + money(a.cur, a.balance) + "</td></tr>";
      }).join("") + "</table></div>";
      if (r.K8) h += "<h2>今月の入金</h2>" + list(r.K8, false);
      if (r.K9) h += "<h2>今月の支払（給与などを除く）</h2>" + list(r.K9, false);
      view(h);
    });
  }

  /* ------------------------------------------------------------ 書き出し */
  function pageExport() {
    var t = today(), first = t.slice(0, 8) + "01";
    view('<div class="card"><p>freee・税理士に渡す形（CSV・Excelで開ける）で書き出します。決算・申告そのものは税理士（日本）・現地の監査（ネパール）が行います。</p>' +
      '<div class="row2"><label>から<input type="date" id="eFrom" value="' + first + '"></label><label>まで<input type="date" id="eTo" value="' + t + '"></label></div>' +
      '<button class="btn primary big" id="eGo">CSVを作る</button></div>');
    $("eGo").onclick = function () {
      var b = this; b.disabled = true;
      api("export", { from: $("eFrom").value, to: $("eTo").value }).then(function (r) {
        b.disabled = false;
        if (!r.ok) { toast(msgOf(r)); return; }
        var q = function (v) { var s = String(v === null || v === undefined ? "" : v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
        var csv = "﻿" + [r.head].concat(r.rows).map(function (row) { return row.map(q).join(","); }).join("\r\n") + "\r\n";
        var a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
        a.download = "ABAS_お金_" + $("eFrom").value + "_" + $("eTo").value + ".csv";
        document.body.appendChild(a); a.click(); a.remove();
        toast(r.rows.length + " 件を書き出しました");
      });
    };
  }

  /* ------------------------------------------------------------ 入れた分（入力だけの人） */
  function pageMine() {
    loading();
    load("mine").then(function (r) {
      if (!r.ok) return fail(r);
      view("<h2>この2週間に入れた分</h2>" + list(r.items, false));
    });
  }

  /* ------------------------------------------------------------ 起動 */
  function start() {
    setBusy(true, "確認中…");
    return api("session").then(function (s) {
      if (s && s.error === "E_NEED_SETUP") return setupScreen();
      if (!s || !s.ok) throw { oukaCategory: "APP_LAYER_ERROR", detail: s && s.error, message: s && s.message || msgOf(s) };
      me = { name: s.name, level: s.level, can: s.can || {} };
      $("who").textContent = me.name + "（" + (LEVEL_NAME[me.level] || me.level) + "）";
      show($("loginView"), false); show($("appShell"), true); setBusy(false);
      route();
    });
  }
  /* 初期設定（代表だけ・最初の1回）。本番 FINANCE OS に財務アプリ用のタブを足し、押した代表を登録する */
  function setupScreen() {
    show($("loginView"), false); show($("appShell"), true); setBusy(false);
    $("who").textContent = "初期設定";
    $("tabs").hidden = true;
    view('<div class="card"><h2>最初の設定</h2><p>財務アプリを使いはじめる準備をします（最初の1回だけ・代表だけ）。</p>' +
      '<ul class="small"><li>FINANCE OS に財務アプリ用のタブを8つ足します（今あるタブ・行・列は変えません）</li>' +
      "<li>事業に「中古車輸出」、入金区分に「中古車」を足します</li><li>毎朝8時の知らせ（準備・催促）を入れます</li>" +
      "<li>あなたを「代表」として登録します</li></ul>" +
      '<button class="btn primary big" id="doSetup">設定する</button></div>');
    $("doSetup").onclick = function () {
      var b = this; b.disabled = true; b.textContent = "設定しています…";
      api("setup").then(function (r) {
        if (!r.ok) { b.disabled = false; b.textContent = "設定する"; toast(msgOf(r)); return; }
        toast("設定しました");
        location.hash = "#/members";
        start();
      });
    };
  }

  function boot() {
    $("loginForm").addEventListener("submit", onLogin);
    $("codeForm").addEventListener("submit", function (e) { e.preventDefault(); if (codeStep) codeStep.submit($("fCode").value); });
    $("codeCancel").addEventListener("click", function () { if (codeStep) codeStep.cancel(); toLogin(""); });
    $("logoutBtn").addEventListener("click", onLogout);
    window.addEventListener("hashchange", route);
    if (!CFG.finLayerUrl || !/^https:\/\//.test(CFG.finLayerUrl) || !A.clerkHost(CFG.clerkPublishableKey || "")) {
      setErr("設定（config.js）が足りません。代表に連絡してください。"); $("loginBtn").disabled = true; return;
    }
    clerkReady = loadClerk();
    clerkReady.then(function (clerk) {
      return waitForSession(clerk, WAIT).then(function (sess) {
        if (!sess || loginStarted) return;
        return start().catch(function (err) { setBusy(false); setErr(err && err.message ? err.message : "もう一度ログインしてください。"); });
      });
    }).catch(function (e) { setErr(e && e.message ? e.message : "ログイン基盤を読み込めませんでした"); $("loginBtn").disabled = true; });
  }
  document.addEventListener("DOMContentLoaded", boot);
})();
