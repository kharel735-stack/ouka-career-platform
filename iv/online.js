/* online.js ― OUKA PLATFORM のオンライン版（https://abas-globalgroup.com/iv/）だけで動く層
 *
 * ★2026-09-25 代表指示「ネパールのどこからでも使えるように。生徒は生徒の画面しか入れない」
 *
 * この層が持つもの
 *   ① ログイン（本番と同じ Clerk。ユーザー名＋パスワード、新しい端末では確認コード）
 *   ② 役割で開ける画面を決める（生徒＝生徒だけ／先生＝先生と生徒／代表・校長＝全部。面接は学校のMac版）
 *   ③ 教材（Day1〜128・546問・先生の勉強）はログインしてから受け口（IvLayer）から受け取る
 *      ＝このフォルダ（公開されるファイル）に教材の中身は1文字も入っていない
 *   ④ 記録（問題・宿題・先生の勉強・週次ふるい）は、変わった時に自動で送る。
 *      回線が切れていたら端末に貯め、つながったら送る。未送信の数を画面に出す（送れたふりをしない）
 *   ⑤ 教材PDFは押した時に受け口から受け取って開く（生徒には生徒用だけ）
 *
 * ★パスワードは Clerk に渡すだけ。保存しない・受け口に送らない（auth.js の約束をそのまま守る）。
 * ★ローカル版（Mac の中の面接アプリ）はこのファイルを読まない。
 */
(function () {
  "use strict";
  var CFG = window.OUKA_ONLINE_CONFIG || {};
  var A = window.OukaAuth;
  var $ = function (id) { return document.getElementById(id); };

  var SETTINGS_KEY = "ouka_interview_settings_v1";   /* app.js と同じ */
  var CONTENT_KEY = "ouka_iv_content_v1";            /* 教材の控え（細い回線のため） */
  var SENT_KEY = "ouka_iv_sent_v1";                  /* 送った記録の指紋 */
  var WATCH = { ouka_drill_v1: 1, ouka_homework_v1: 1, ouka_teacher_study_v1: 1, ouka_grade_v1: 1 };
  var INTERVIEW_ROUTES = { candidates: 1, upload: 1, "new": 1, start: 1, q: 1, result: 1, results: 1 };

  var clerkReady = null, loginStarted = false, codeStep = null, who = null, appLoaded = false;

  /* ------------------------------------------------------------ 画面 */
  function show(el, on) { if (el) el.hidden = !on; }
  function setErr(msg) { $("loginErr").textContent = msg || ""; }
  function setBusy(on, text) {
    var b = $("loginBtn");
    if (b) { b.disabled = !!on; b.textContent = on ? (text || "ログイン中…") : "ログイン"; }
  }
  function clearSecret() { var el = $("fPassword"); if (el) el.value = ""; }
  function toLogin(msg) {
    codeStep = null;
    show($("codeForm"), false);
    show($("loginForm"), true);
    show($("loginView"), true);
    show($("appShell"), false);
    clearSecret();
    setBusy(false);
    setErr(msg || "");
  }

  /* 受け口の短い符号 → 日本語（中身は出さない） */
  var MSG = {
    E_AUTH: "ログインの有効期限が切れました。もう一度ログインしてください。",
    E_NO_ROLE: "ログインはできましたが、このアカウントにはOUKAの権限が登録されていません。代表に連絡してください。",
    E_FORBIDDEN: "このアカウントでは使えません。代表に連絡してください。",
    E_DISABLED: "このアカウントは停止されています。代表に連絡してください。",
    E_EXPIRED: "このアカウントの有効期間が切れています。代表に連絡してください。",
    E_NOT_YET: "このアカウントはまだ使えません（開始日の前です）。",
    E_NOT_CONFIGURED: "サーバーの設定がまだ終わっていません。代表に連絡してください。",
    E_ROLE_HEADER: "権限の表の形が変わっています。代表に連絡してください。",
    E_NO_CONTENT: "教材がまだサーバーに入っていません。代表に連絡してください。",
    E_BUSY: "いま混み合っています。少し待ってからもう一度。"
  };
  function msgOf(res) {
    var code = res && res.error ? String(res.error) : "";
    return (MSG[code] || "うまくいきませんでした。") + (code ? "（" + code + "）" : "");
  }

  /* ------------------------------------------------------------ 通信 */
  function freshToken() {
    var c = window.Clerk;
    if (!c || !c.session) return Promise.resolve("");
    return Promise.resolve(c.session.getToken());
  }
  /* Apps Script は OPTIONS を扱えない＝text/plain で送る（本番 /app/ と同じ作法） */
  function api(action, extra) {
    return freshToken().then(function (token) {
      if (!token) { toLogin(MSG.E_AUTH); throw new Error("E_AUTH"); }
      var body = A.buildBody(token, action, extra || {});
      body.session_token = token;
      return fetch(CFG.ivLayerUrl, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body)
      }).then(function (r) { return r.json(); }, function () { throw new Error("NETWORK"); });
    }).then(function (res) {
      if (res && res.error === "E_AUTH") toLogin(MSG.E_AUTH);
      return res;
    });
  }

  /* ------------------------------------------------------------ Clerk */
  var SESSION_WAIT_MS = 3000, SESSION_STEP_MS = 150;
  function waitForSession(clerk, left) {
    if (clerk && clerk.session) return Promise.resolve(clerk.session);
    if (left <= 0) return Promise.resolve(null);
    return new Promise(function (d) { setTimeout(d, SESSION_STEP_MS); })
      .then(function () { return waitForSession(clerk, left - SESSION_STEP_MS); });
  }
  function loadClerk() {
    if (window.Clerk && window.Clerk.load) {              /* テストでは先に置いてある */
      return Promise.resolve(window.Clerk.load({})).then(function () { return window.Clerk; });
    }
    return new Promise(function (resolve, reject) {
      var url = A.scriptUrl(CFG.clerkPublishableKey);
      if (!url) { reject(new Error("clerkPublishableKey が正しくありません")); return; }
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
      setBusy(false);
      show($("loginForm"), false);
      show($("codeForm"), true);
      $("codeHint").textContent = plan.message;
      $("fCode").value = "";
      return new Promise(function (resolve, reject) {
        codeStep = {
          submit: function (raw) {
            var v = A.validateCode(raw);
            $("fCode").value = "";
            if (!v.ok) { setErr(v.error); return; }
            setErr("");
            Promise.resolve(signIn.attemptSecondFactor({ strategy: plan.strategy, code: v.code })).then(function (done) {
              codeStep = null;
              show($("codeForm"), false); show($("loginForm"), true);
              setBusy(true);
              resolve(done);
            }, function (err) {
              var m = A.mapSecondFactorError(err);
              if (m.retry) { setErr(A.formatError(m)); return; }
              codeStep = null;
              reject({ oukaCategory: m.category, detail: m.detail, message: m.message });
            });
          },
          cancel: function () { codeStep = null; reject(A.sessionError("second_factor_cancelled")); }
        };
      });
    });
  }

  function onLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    setErr("");
    var secret = $("fPassword").value;
    var v = A.validate({ username: $("fUsername").value, password: secret });
    if (!v.ok) { secret = null; clearSecret(); setErr(v.errors.join("\n")); return; }
    if (!clerkReady) { secret = null; clearSecret(); setErr("ログイン基盤を読み込めていません。画面を読み込み直してください。"); return; }
    setBusy(true);
    loginStarted = true;
    var phase = "authentication";
    clerkReady.then(function (clerk) {
      var p;
      try { p = clerk.client.signIn.create({ identifier: v.username, password: secret }); }
      finally { secret = null; clearSecret(); }
      return Promise.resolve(p).then(function (res) {
        return (res && res.status === "needs_second_factor") ? secondFactor(clerk, res) : res;
      }).then(function (res) {
        if (!res || res.status !== "complete" || !res.createdSessionId) throw A.signInStatusError(res);
        return clerk.setActive({ session: res.createdSessionId });
      }, function (err) { if (!A.isAlreadySignedIn(err)) throw err; })
        .then(function () { return waitForSession(clerk, SESSION_WAIT_MS); })
        .then(function (sess) { if (!sess) throw A.sessionError("no_active_session"); });
    }).then(function () {
      phase = "authorization";
      return start();
    }).catch(function (err) {
      secret = null; clearSecret(); setBusy(false); loginStarted = false;
      /* 権限が無いアカウントは、ログインしたままにしない（共用の端末で次の人が入れるように） */
      if (phase === "authorization" && window.Clerk && window.Clerk.signOut) window.Clerk.signOut();
      var m = phase === "authentication" ? A.mapSignInError(err) : A.mapRequestError(err);
      if (err && err.oukaCategory && err.message) m.message = err.message;
      setErr(A.formatError(m));
    });
  }

  function onLogout() {
    var c = window.Clerk;
    Promise.resolve(c && c.signOut ? c.signOut() : null).then(function () {
      /* 共用の端末で、前の人の名前が残らないようにする（記録そのものは消さない） */
      try {
        var s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        s.student_name = ""; s.teacher_name = "";
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
      } catch (x) { /* 使えなくても止めない */ }
      location.replace(location.pathname);
    });
  }

  /* ------------------------------------------------------------ 役割 */
  function allow(r) {
    if (!who) return false;
    var n = r && r.name;
    if (INTERVIEW_ROUTES[n]) return false;             /* 面接は学校のMac版（オンラインは次の段階） */
    if (n === "check") return !!who.can.teacher;       /* 先生＝提出状況／代表・校長＝代表の確認 */
    if (n === "hub" || n === "soon") return !!who.can[r.hub];
    if (n === "home") return !!who.can.teacher;         /* 生徒のホームは「生徒・学習」 */
    return n === "setfield";
  }
  function home() { return who && who.can.teacher ? "#/" : "#/student"; }

  /* 名前は本人のアカウントの名前で決まる（打たせない＝ほかの人の名前で出せない） */
  function setNames() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch (x) { s = {}; }
    s.student_name = who.role === "STUDENT" ? who.name : "";
    s.teacher_name = who.can.teacher ? who.name : "";
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (x) { /* 止めない */ }
  }
  function afterRender(view) {
    /* 生徒には「OUKA PLATFORM へ」（先生・面接の入口）への戻るボタンを出さない */
    if (!who.can.teacher) {
      Array.prototype.forEach.call(view.querySelectorAll('a[href="#/"]'), function (a) { a.style.display = "none"; });
    }
    ["hwName", "tsName"].forEach(function (id) {
      var el = view.querySelector("#" + id);
      if (!el) return;
      el.readOnly = true;
      el.title = "ログインした人の名前です";
      if (!el.value) el.placeholder = "（この画面は生徒のアカウントで使います）";
    });
    badge();
  }

  /* ------------------------------------------------------------ 教材 */
  function readContent() {
    try { return JSON.parse(localStorage.getItem(CONTENT_KEY) || "null"); } catch (x) { return null; }
  }
  function loadContent() {
    var cached = readContent();
    var have = cached && cached.content_ver ? cached.content_ver : "";
    return api("content", { have: have }).then(function (res) {
      if (res && res.ok && res.same && cached) return cached;
      if (res && res.ok && res.lessons) {
        var c = { content_ver: res.content_ver, lessons: res.lessons, study: res.study || null };
        try { localStorage.setItem(CONTENT_KEY, JSON.stringify(c)); } catch (x) { /* 入らなくても今は使える */ }
        return c;
      }
      if (cached && res && res.error !== "E_FORBIDDEN") return cached;   /* 回線が細い日は控えで動かす */
      throw new Error(msgOf(res));
    }, function (err) {
      if (cached) return cached;                                        /* 圏外でも前回の教材で授業できる */
      throw err;
    });
  }

  var matCache = {};
  function openMaterial(file) {
    var w = window.open("", "_blank");                 /* 先に開く（あとで開くとブロックされる） */
    if (w) w.document.write('<p style="font:16px sans-serif;padding:24px">教材を読み込んでいます…</p>');
    var done = function (url) { if (w) w.location.href = url; else location.href = url; };
    if (matCache[file]) { done(matCache[file]); return; }
    api("material", { file: file }).then(function (res) {
      if (!res || !res.ok) throw new Error(msgOf(res));
      var bin = atob(res.data), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      matCache[file] = URL.createObjectURL(new Blob([buf], { type: res.type || "application/pdf" }));
      done(matCache[file]);
    }).catch(function (err) {
      if (w) w.document.body.innerHTML = '<p style="font:16px sans-serif;padding:24px">開けませんでした：' +
        String(err.message).replace(/[<>&]/g, "") + "</p>";
    });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="materials/"]');
    if (!a || !who) return;
    e.preventDefault();
    e.stopPropagation();
    openMaterial(decodeURIComponent(a.getAttribute("href").slice("materials/".length)));
  }, true);

  /* ------------------------------------------------------------ 自動で送る */
  function sentMap() { try { return JSON.parse(localStorage.getItem(SENT_KEY) || "{}") || {}; } catch (x) { return {}; } }
  function keyOf(r) { return [who.id, r.type, r.who, r.no, r.week || ""].join("|"); }
  function sigOf(r) { return JSON.stringify(r); }
  /* 送る物＝この人が出せる物だけ（共用の端末に残った、ほかの人の記録は送らない） */
  function pending() {
    if (!who || !window.OUKA_APP_API) return [];
    var sent = sentMap();
    return window.OUKA_APP_API.studyRecords().filter(function (r) {
      if (r.type === "hw" || r.type === "drill") { if (!(who.role === "STUDENT" && r.who === who.name)) return false; }
      else if (r.type === "study") { if (!(who.can.teacher && r.who === who.name)) return false; }
      else if (r.type === "grade") { if (!who.can.teacher) return false; }
      else return false;
      return sent[keyOf(r)] !== sigOf(r);
    });
  }
  var timer = null, sending = false, lastErr = "";
  function changed(key) {
    if (!WATCH[key]) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 2500);
    badge();
  }
  function flush() {
    if (sending || !who) return;
    var list = pending().slice(0, 200);
    if (!list.length) { lastErr = ""; badge(); return; }
    sending = true;
    api("learn", { records: list }).then(function (res) {
      if (!res || !res.ok) throw new Error((res && res.error) || "NO_RESPONSE");
      var sent = sentMap();
      list.forEach(function (r) { sent[keyOf(r)] = sigOf(r); });
      try { localStorage.setItem(SENT_KEY, JSON.stringify(sent)); } catch (x) { /* 次にまた送るだけ */ }
      lastErr = "";
      sending = false;
      if (pending().length) flush(); else badge();
    }).catch(function (err) {
      sending = false;
      lastErr = String(err.message || err);
      badge();
    });
  }
  function badge() {
    var el = $("syncBadge");
    if (!el || !who) return;
    var n = pending().length;
    el.hidden = false;
    el.className = "sync-badge" + (n ? " sync-wait" : "");
    el.textContent = n ? "未送信 " + n + " 件" + (lastErr ? "（圏外？）" : "") : "送信ずみ";
  }
  window.addEventListener("online", function () { flush(); });
  setInterval(function () { if (who && navigator.onLine !== false) flush(); }, 60000);

  /* ------------------------------------------------------------ 起動 */
  function start() {
    setBusy(true, "確認中…");
    return api("session", {}).then(function (s) {
      if (!s || !s.ok) throw { oukaCategory: "APP_LAYER_ERROR", detail: s && s.error, message: msgOf(s) };
      who = { id: "", role: s.role, name: String(s.name || "").trim(), can: s.can || {}, students: s.students || [] };
      return freshToken().then(function (t) {
        try { who.id = JSON.parse(atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || ""; }
        catch (x) { who.id = who.name; }
      });
    }).then(function () {
      if (!who.can.student && !who.can.teacher) {
        throw { oukaCategory: "APP_LAYER_ERROR", detail: "no_learning",
                message: "このアカウントは面接用です。面接は学校のMacの面接アプリで行ってください。" };
      }
      setBusy(true, "教材を読み込んでいます…");
      return loadContent();
    }).then(function (c) {
      window.OUKA_LESSONS = c.lessons;
      window.OUKA_TEACHER_STUDY = who.can.teacher ? c.study : null;
      setNames();
      window.OUKA_ONLINE = {
        role: who.role, name: who.name, can: who.can, students: who.students,
        allow: allow, home: home, changed: changed, afterRender: afterRender, api: api
      };
      $("who").textContent = who.name + "（" + ({ STUDENT: "生徒", TEACHER: "先生", CEO: "代表",
        SCHOOL_ADMIN: "校長", SUPER_ADMIN: "管理者" }[who.role] || who.role) + "）";
      /* 面接の入口は出さない（学校のMac版） */
      Array.prototype.forEach.call(document.querySelectorAll('.bar-nav a[href="#/candidates"], .bar-nav a[href="#/results"]'),
        function (a) { a.hidden = true; a.style.display = "none"; });   /* .btn の display が hidden に勝つため */
      $("homeBtn").setAttribute("href", home());
      document.querySelector(".brand").setAttribute("href", home());
      show($("loginView"), false);
      show($("appShell"), true);
      setBusy(false);
      if (!location.hash || location.hash === "#/" && !who.can.teacher) location.replace(home());
      if (!appLoaded) {
        appLoaded = true;
        var el = document.createElement("script");
        el.src = "app.js";
        el.onload = function () { flush(); };
        document.body.appendChild(el);
      }
    });
  }

  function boot() {
    $("loginForm").addEventListener("submit", onLogin);
    $("codeForm").addEventListener("submit", function (e) { e.preventDefault(); if (codeStep) codeStep.submit($("fCode").value); });
    $("codeCancel").addEventListener("click", function () { if (codeStep) codeStep.cancel(); toLogin(""); });
    $("logoutBtn").addEventListener("click", onLogout);
    if (!CFG.ivLayerUrl || !/^https:\/\//.test(CFG.ivLayerUrl) || !A.clerkHost(CFG.clerkPublishableKey || "")) {
      setErr("設定（config.js）が足りません。代表に連絡してください。");
      $("loginBtn").disabled = true;
      return;
    }
    clerkReady = loadClerk();
    clerkReady.then(function (clerk) {
      return waitForSession(clerk, SESSION_WAIT_MS).then(function (sess) {
        if (!sess || loginStarted) return;
        return start().catch(function (err) {
          setBusy(false);
          setErr(err && err.message ? err.message : "自動ログインに失敗しました。もう一度ログインしてください。");
        });
      });
    }).catch(function (e) {
      setErr(e && e.message ? e.message : "ログイン基盤を読み込めませんでした");
      $("loginBtn").disabled = true;
    });
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
