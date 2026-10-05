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
  var WATCH = { ouka_drill_v1: 1, ouka_homework_v1: 1, ouka_teacher_study_v1: 1, ouka_grade_v1: 1, ouka_report_v1: 1, ouka_ai_nepali_v1: 1, ouka_feedback_v1: 1, ouka_assign_v1: 1 };
  var INTERVIEW_ROUTES = { candidates: 1, upload: 1, "new": 1, start: 1, q: 1, result: 1, results: 1 };

  var clerkReady = null, loginStarted = false, codeStep = null, who = null, appLoaded = false;

  /* ------------------------------------------------------------ 画面 */
  function show(el, on) { if (el) el.hidden = !on; }
  function setErr(msg) { $("loginErr").textContent = msg || ""; }
  function setBusy(on, text) {
    var b = $("loginBtn");
    if (b) { b.disabled = !!on; b.textContent = on ? (text || "ログイン中…") : "ログイン"; }
  }
  function secretWipe() { clearSecret(); }
  function clearSecret() { var el = $("fPassword"); if (el) el.value = ""; }
  function toLogin(msg) {
    codeStep = null;
    show($("codeForm"), false);
    show($("taskBox"), false);
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
  /* 2026-10-05 本番で起きた：教材（数MB）を受け取る時、Google の受け渡し先がたまに 404 を返し、
   * 読めずに SyntaxError → ログイン画面へ戻された。読むだけの要求は 2回まで 自動でやり直す（書く要求はやり直さない＝二重に入れない）。 */
  var RETRY_READ = { boot: 1, session: 1, content: 1, material: 1, assign_get: 1, report_list: 1, learn_list: 1, photo_list: 1, photo_get: 1 };
  function api(action, extra, tries) {
    tries = tries || 0;
    return freshToken().then(function (token) {
      if (!token) { toLogin(MSG.E_AUTH); throw new Error("E_AUTH"); }
      var body = A.buildBody(token, action, extra || {});
      body.session_token = token;
      return fetch(CFG.ivLayerUrl, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body)
      }).then(function (r) {
        return r.text().then(function (t) {
          try { return JSON.parse(t); } catch (x) { throw new Error("NETWORK"); }   /* 404 の HTML などは 回線の失敗と同じ扱い */
        });
      }, function () { throw new Error("NETWORK"); });
    }).catch(function (err) {
      if (err && err.message === "NETWORK" && RETRY_READ[action] && tries < 2) {
        return new Promise(function (ok) { setTimeout(ok, tries ? 5000 : 2000); }).then(function () { return api(action, extra, tries + 1); });
      }
      throw err;
    }).then(function (res) {
      if (res && res.error === "E_AUTH") toLogin(MSG.E_AUTH);
      return res;
    });
  }


  /* ------------------------------------------------------------ ログインしたら /iv/ から出さない（2026-10-01）
   * 事故：パスワードを打つと、ホームページ（abas-globalgroup.com）へ飛ばされた。
   * 原因：Clerk は「パスワードを新しくする」などの追加の手続き（session task）があると、Clerk 自身のページ
   *       （accounts.abas-globalgroup.com）へ移り、終わると管理画面の after_sign_in_url＝ホームページへ戻す。
   *       本番は enforce_hibp_on_sign_in＝漏れたことのあるパスワードは、ログインの時に作り直しを求める。
   * 対策：Clerk の行き先をすべて /iv/ に固定し、手続きは /iv/ の中に Clerk の部品を出して済ませる。
   *       管理画面の設定は変えない（/app/ と同じ Clerk なので、/app/ に影響させない）。 */
  var IV_URL = location.href.split("#")[0].split("?")[0];   /* https://abas-globalgroup.com/iv/ */
  var TASK_MARK = "#/ouka-clerk-task";
  var TASK_MOUNT = { "reset-password": "mountTaskResetPassword", "setup-mfa": "mountTaskSetupMFA",
                     "choose-organization": "mountTaskChooseOrganization" };
  var TASK_TEXT = {
    "reset-password": "安全のため、パスワードを新しくする必要があります（15文字以上）。下で新しいパスワードを作ってください。終わると自動でこの画面に戻ります。\nFor security, please set a new password (15+ characters). You will come back here automatically.",
    "setup-mfa": "安全のため、追加の確認の設定が必要です。下の手順で設定してください。終わると自動でこの画面に戻ります。",
    "choose-organization": "所属を選んでください。終わると自動でこの画面に戻ります。"
  };
  var taskShown = false;
  function clerkOptions() {
    var task = IV_URL + TASK_MARK;
    return {
      signInForceRedirectUrl: IV_URL, signUpForceRedirectUrl: IV_URL,
      signInFallbackRedirectUrl: IV_URL, signUpFallbackRedirectUrl: IV_URL,
      afterSignOutUrl: IV_URL,
      taskUrls: { "reset-password": task, "setup-mfa": task, "choose-organization": task },
      routerPush: function (to) { return clerkGo(to, false); },
      routerReplace: function (to) { return clerkGo(to, true); }
    };
  }
  /* Clerk が同じサイトの中で移ろうとした時はここに来る。/iv/ の外へは行かせない */
  function clerkGo(to, replace) {
    var u;
    try { u = new URL(to, location.href); } catch (x) { return; }
    if (u.href.indexOf(TASK_MARK) >= 0) { showTask(); return; }
    if (taskShown || u.origin !== location.origin || u.pathname !== location.pathname) {
      taskShown = false;
      location.replace(IV_URL);          /* 手続きが終わった＝読み込み直してログイン済みで始める */
      return;
    }
    if (u.href === location.href) return;
    if (replace) location.replace(u.href); else location.assign(u.href);
  }
  function showTask() {
    var c = window.Clerk, s = c && c.session, t = s && s.currentTask;
    var fn = t && TASK_MOUNT[t.key] && c[TASK_MOUNT[t.key]];
    show($("loginView"), true); show($("appShell"), false);
    show($("loginForm"), false); show($("codeForm"), false);
    setBusy(false);
    if (!fn) {
      toLogin("ログインの途中で、追加の手続きが必要になりました（" + (t ? t.key : "不明") + "）。代表に連絡してください。");
      if (c && c.signOut) c.signOut();
      return;
    }
    if (taskShown) return;
    taskShown = true;
    $("taskHint").textContent = TASK_TEXT[t.key] || "";
    show($("taskBox"), true);
    fn.call(c, $("taskMount"), { redirectUrlComplete: IV_URL });
  }
  function cancelTask() {
    var c = window.Clerk;
    taskShown = false;
    show($("taskBox"), false);
    Promise.resolve(c && c.signOut ? c.signOut() : null).then(function () { toLogin(""); });
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
      return Promise.resolve(window.Clerk.load(clerkOptions())).then(function () { return window.Clerk; });
    }
    return new Promise(function (resolve, reject) {
      var url = A.scriptUrl(CFG.clerkPublishableKey);
      if (!url) { reject(new Error("clerkPublishableKey が正しくありません")); return; }
      var el = document.createElement("script");
      el.src = url; el.async = true; el.crossOrigin = "anonymous";
      el.setAttribute("data-clerk-publishable-key", CFG.clerkPublishableKey);
      el.onload = function () {
        if (!window.Clerk) { reject(new Error("ログイン基盤を読み込めませんでした")); return; }
        Promise.resolve(window.Clerk.load(clerkOptions())).then(function () { resolve(window.Clerk); }, reject);
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

  /* 2026-10-05 本番：スマホで 開いたままのタブが 古い画面（10/2）のまま ログインし「このアカウントは面接用です」と出た。
   * 公開ページの config.js を 読み直し、画面の指紋（build）が 変わっていたら 自分で 読み込み直す。
   * いつ見る＝ログインを押した時・タブに 戻ってきた時。読み込み直しは 1分に 1回まで（同じ所を ぐるぐる回らない）。 */
  var STALE_KEY = "ouka_iv_reloaded_at";
  function staleCheck() {
    if (!CFG.build || !window.fetch) return Promise.resolve(false);
    return fetch("config.js?t=" + Date.now(), { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (t) {
      var m = /\.build = "([0-9a-f]+)"/.exec(t || "");
      if (!m || m[1] === CFG.build) return false;
      var last = 0; try { last = +sessionStorage.getItem(STALE_KEY) || 0; } catch (x) { /* 止めない */ }
      if (Date.now() - last < 60000) return false;
      try { sessionStorage.setItem(STALE_KEY, String(Date.now())); } catch (x) { /* 止めない */ }
      location.reload();
      return true;
    }, function () { return false; });   /* 圏外＝そのまま使う */
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") staleCheck(); });
  window.addEventListener("pageshow", function (e) { if (e.persisted) staleCheck(); });

  function onLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!onLogin.checked) {
      onLogin.checked = true;
      setBusy(true, "確認中…");
      staleCheck().then(function (reloading) {
        if (reloading) { secretWipe(); setErr("新しい画面にしました。もう一度ログインしてください。"); return; }
        setBusy(false); onLogin();
      });
      return;
    }
    onLogin.checked = false;
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
        .then(function (sess) { if (!sess) throw A.sessionError("no_active_session"); return sess; });
    }).then(function (sess) {
      if (sess.status === "pending") { loginStarted = false; showTask(); return; }   /* 手続きは /iv/ の中で */
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
        localStorage.removeItem(WHO_KEY);   /* 次の人が 前の人として 開かない */
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
  /* 先生・代表＝ホーム／生徒＝生徒の画面／ネパール語を学ぶ人＝さくら先生のネパール語（2026-10-04） */
  function home() { return who && who.can.teacher ? "#/" : who && who.can.student ? "#/student" : "#/nepali/learn"; }

  /* 名前は本人のアカウントの名前で決まる（打たせない＝ほかの人の名前で出せない） */
  function setNames() {
    var s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") || {}; } catch (x) { s = {}; }
    s.student_name = who.role === "STUDENT" || who.role === "NEPALI_LEARNER" ? who.name : "";
    s.teacher_name = who.can.teacher ? who.name : "";
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch (x) { /* 止めない */ }
  }
  function afterRender(view) {
    /* 生徒には「OUKA PLATFORM へ」（先生・面接の入口）への戻るボタンを出さない */
    if (!who.can.teacher) {
      Array.prototype.forEach.call(view.querySelectorAll('a[href="#/"]'), function (a) { a.style.display = "none"; });
    }
    ["hwName", "tsName", "rpName", "asName"].forEach(function (id) {
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
      if (res && res.ok && (res.lessons || res.nepali)) {
        var c = { content_ver: res.content_ver, lessons: res.lessons || null, study: res.study || null, ne: res.ne || null, nepali: res.nepali || null };
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
      else if (r.type === "report") { if (!(who.can.teacher && r.who === who.name)) return false; }
      else if (r.type === "nepali") { if (!(who.can.nepali && r.who === who.name)) return false; }
      else if (r.type === "assign") { if (!(who.can.teacher && r.who === who.name)) return false; }
      else if (r.type === "feedback") { if (!((who.role === "STUDENT" || who.role === "NEPALI_LEARNER") && r.who === who.name)) return false; }
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
  /* ---- ノートの写真（2026-09-28）。1枚ずつ送る。送れたら端末には小さい控えだけ残す ---- */
  var photoWait = 0, photoBusy = false;
  function photoMine(x) {
    if (x.scope === "hw" || x.scope === "voice") return who.role === "STUDENT" && x.owner === who.name;   /* voice＝宿題の録音（2026-10-01） */
    if (x.scope === "study") return !!who.can.teacher && x.owner === who.name;
    return false;
  }
  function b64(blob) {
    return new Promise(function (res, rej) {
      var r = new FileReader();
      r.onload = function () { res(String(r.result).split(",")[1] || ""); };
      r.onerror = function () { rej(new Error("写真を読めません")); };
      r.readAsDataURL(blob);
    });
  }
  function photosChanged() { setTimeout(flushPhotos, 500); }
  function flushPhotos() {
    var A2 = window.OUKA_APP_API;
    if (photoBusy || !who || !A2 || !A2.photoQueue) return;
    photoBusy = true;
    A2.photoQueue().then(function (all) {
      var q = all.filter(photoMine);
      photoWait = q.length;
      badge();
      var one = function (i) {
        if (i >= q.length) return null;
        var x = q[i];
        return b64(x.blob).then(function (data) {
          return api("photo", { photo: { id: x.id, type: x.scope, no: x.no, item: x.item, mime: x.mime || "image/jpeg",
            data: data, text: x.text || "", taken_at: x.created_at } });
        }).then(function (res) {
          if (!res || !res.ok) throw new Error((res && res.error) || "NO_RESPONSE");
          return A2.photoSent(x, res.saved_at);
        }).then(function () { photoWait--; badge(); return one(i + 1); });
      };
      return one(0);
    }).then(function () {
      photoBusy = false;
      badge();
    }, function (err) {
      photoBusy = false;
      lastErr = String((err && err.message) || err);
      badge();
    });
  }
  function badge() {
    var el = $("syncBadge");
    if (!el || !who) return;
    var n = pending().length + photoWait;
    el.hidden = false;
    el.className = "sync-badge" + (n ? " sync-wait" : "");
    el.textContent = n ? "未送信 " + n + " 件" + (lastErr ? "（圏外？）" : "") : "送信ずみ";
  }
  window.addEventListener("online", function () { flush(); flushPhotos(); });
  setInterval(function () { if (who && navigator.onLine !== false) { flush(); flushPhotos(); } }, 60000);

  /* ------------------------------------------------------------ 起動
   * 2026-10-05 代表「何より 入れるか。『読み込んでいます』が 長すぎる。生徒が 20〜30人に 増えても」
   *  ① 2回目から＝この端末に 前回の「だれ」と 教材が あれば、待たずに 画面を出す（確かめは 裏で 1回。役割が 変わっていたら 入れ直す）。
   *  ② 初めて＝受け口は 1回だけ（boot＝だれ＋教材の鍵）。教材の中身は 鍵つきで 公開ページの横（c/*.bin）から 取る＝速い・人数に強い。
   *  ③ 鍵が使えない端末・古い受け口＝前の方法（session＋content）で 入る。★どこで失敗しても「入れない」は 作らない。 */
  var WHO_KEY = "ouka_iv_who_v1";
  function readWho() { try { return JSON.parse(localStorage.getItem(WHO_KEY) || "null"); } catch (x) { return null; } }
  function saveWho(sub, s, ver) {
    try { localStorage.setItem(WHO_KEY, JSON.stringify({ sub: sub, role: s.role, name: String(s.name || "").trim(), can: s.can || {}, students: s.students || [], ver: ver || "" })); }
    catch (x) { /* 入らなくても 今は使える */ }
  }
  function clerkSub() { var c = window.Clerk; return (c && c.user && c.user.id) || ""; }
  function sleep(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
  function b64bytes(b) { var t = atob(b), u = new Uint8Array(t.length); for (var i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; }
  function canParts() { return !!(window.crypto && crypto.subtle && typeof DecompressionStream !== "undefined" && window.Blob && Blob.prototype.stream); }
  function fetchPart(p, tries) {
    tries = tries || 0;
    return fetch(p.file).then(function (r) {
      if (!r.ok) throw new Error("PART_HTTP_" + r.status);
      return r.arrayBuffer();
    }).then(function (buf) {
      var u = new Uint8Array(buf);
      return crypto.subtle.importKey("raw", b64bytes(p.key), "AES-GCM", false, ["decrypt"]).then(function (k) {
        return crypto.subtle.decrypt({ name: "AES-GCM", iv: u.slice(0, 12) }, k, u.slice(12));
      });
    }).then(function (z) {
      return new Response(new Blob([z]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    }).then(function (t) { return JSON.parse(t); }).catch(function (err) {
      if (tries < 2) return sleep(tries ? 4000 : 1500).then(function () { return fetchPart(p, tries + 1); });
      throw err;
    });
  }
  function loadParts(res) {
    if (!res || !res.parts || !res.parts.length || !canParts()) return Promise.reject(new Error("NO_PARTS"));
    return Promise.all(res.parts.map(function (p) { return fetchPart(p); })).then(function (vals) {
      var c = { content_ver: res.content_ver, lessons: null, study: null, ne: null, nepali: null };
      res.parts.forEach(function (p, i) { c[p.part] = vals[i]; });
      try { localStorage.setItem(CONTENT_KEY, JSON.stringify(c)); } catch (x) { /* 入らなくても今は使える */ }
      return c;
    });
  }
  function noLearning() {
    return { oukaCategory: "APP_LAYER_ERROR", detail: "no_learning",
             message: "このアカウントは面接用です。面接は学校のMacの面接アプリで行ってください。" };
  }
  function idFromToken() {
    return freshToken().then(function (t) {
      try { who.id = JSON.parse(atob(String(t).split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || ""; }
      catch (x) { who.id = who.name; }
    });
  }
  function start() {
    var sub = clerkSub(), w = readWho(), cc = readContent();
    if (sub && w && w.sub === sub && w.ver && cc && cc.content_ver === w.ver && (w.can.student || w.can.teacher || w.can.nepali)) {
      who = { id: sub, role: w.role, name: w.name, can: w.can, students: w.students || [] };
      showApp(cc);
      recheck(sub, w, cc);
      return Promise.resolve();
    }
    setBusy(true, "確認中…");
    var s0 = null;
    return api("boot", {}).then(function (s) {
      if (s && !s.ok && (s.error === "E_ACTION" || s.error === "E_FORBIDDEN")) return oldStart();   /* 古い受け口 */
      if (!s || !s.ok) throw { oukaCategory: "APP_LAYER_ERROR", detail: s && s.error, message: msgOf(s) };
      s0 = s;
      who = { id: "", role: s.role, name: String(s.name || "").trim(), can: s.can || {}, students: s.students || [] };
      return idFromToken().then(function () {
        if (!who.can.student && !who.can.teacher && !who.can.nepali) throw noLearning();
        setBusy(true, "教材を読み込んでいます…");
        var c1 = readContent();
        if (c1 && s.content_ver && c1.content_ver === s.content_ver) return c1;
        return loadParts(s).catch(function () { return loadContent(); });    /* 鍵が使えない時は 前の方法 */
      }).then(function (c) {
        saveWho(who.id, s0, c.content_ver === s0.content_ver ? s0.content_ver : "");
        showApp(c);
      });
    });
  }
  /* 待たずに 開いた後の 確かめ（裏で 1回）。役割が 外された・止められた＝すぐ ログイン画面へ。回線の失敗では 何もしない。 */
  function recheck(sub, w, cc) {
    api("boot", {}).then(function (s) {
      if (!s) return;
      if (!s.ok) {
        if (s.error === "E_NO_ROLE" || s.error === "E_DISABLED" || s.error === "E_NOT_YET" || s.error === "E_EXPIRED") {
          try { localStorage.removeItem(WHO_KEY); } catch (x) { /* 止めない */ }
          toLogin(msgOf(s));
          show($("appShell"), false); show($("loginView"), true);
        }
        return;
      }
      var same = s.role === w.role && String(s.name || "").trim() === w.name && JSON.stringify(s.can || {}) === JSON.stringify(w.can || {});
      if (!same) { saveWho(sub, s, ""); location.reload(); return; }
      if (s.content_ver && s.content_ver !== cc.content_ver) {
        loadParts(s).then(function () { saveWho(sub, s, s.content_ver); }, function () { /* 次の起動で 取る */ });
      }
    }, function () { /* 圏外＝前回の教材で そのまま 使える */ });
  }
  /* 前の方法（session＋content の 2回）。古い受け口・鍵が使えない時だけ */
  function oldStart() {
    return api("session", {}).then(function (s) {
      if (!s || !s.ok) throw { oukaCategory: "APP_LAYER_ERROR", detail: s && s.error, message: msgOf(s) };
      who = { id: "", role: s.role, name: String(s.name || "").trim(), can: s.can || {}, students: s.students || [] };
      return idFromToken();
    }).then(function () {
      if (!who.can.student && !who.can.teacher && !who.can.nepali) throw noLearning();
      setBusy(true, "教材を読み込んでいます…");
      return loadContent();
    }).then(showApp);
  }
  function showApp(c) {
    window.OUKA_LESSONS = c.lessons;
    window.OUKA_TEACHER_STUDY = who.can.teacher ? c.study : null;
    window.OUKA_LESSONS_NE = who.can.teacher ? c.ne || null : null;
    window.OUKA_AI_NEPALI = who.can.nepali ? c.nepali || null : null;
    setNames();
    window.OUKA_ONLINE = {
      role: who.role, name: who.name, can: who.can, students: who.students,
      allow: allow, home: home, changed: changed, afterRender: afterRender, api: api, photosChanged: photosChanged
    };
    $("who").textContent = who.name + "（" + ({ STUDENT: "生徒", TEACHER: "先生", CEO: "代表",
      SCHOOL_ADMIN: "校長", SUPER_ADMIN: "管理者", NEPALI_LEARNER: "ネパール語" }[who.role] || who.role) + "）";
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
      el.src = "app.js" + (CFG.appVersion ? "?v=" + CFG.appVersion : "");   /* 古い app.js を使わせない */
      el.onload = function () { flush(); flushPhotos(); };
      document.body.appendChild(el);
    }
  }

  function boot() {
    $("loginForm").addEventListener("submit", onLogin);
    $("codeForm").addEventListener("submit", function (e) { e.preventDefault(); if (codeStep) codeStep.submit($("fCode").value); });
    $("codeCancel").addEventListener("click", function () { if (codeStep) codeStep.cancel(); toLogin(""); });
    $("logoutBtn").addEventListener("click", onLogout);
    $("taskCancel").addEventListener("click", cancelTask);
    if (!CFG.ivLayerUrl || !/^https:\/\//.test(CFG.ivLayerUrl) || !A.clerkHost(CFG.clerkPublishableKey || "")) {
      setErr("設定（config.js）が足りません。代表に連絡してください。");
      $("loginBtn").disabled = true;
      return;
    }
    try { if (Date.now() - (+sessionStorage.getItem(STALE_KEY) || 0) < 15000) setErr("新しい画面にしました。もう一度ログインしてください。"); } catch (x) { /* 止めない */ }
    clerkReady = loadClerk();
    clerkReady.then(function (clerk) {
      return waitForSession(clerk, SESSION_WAIT_MS).then(function (sess) {
        if (!sess || loginStarted) return;
        if (sess.status === "pending") { showTask(); return; }   /* 手続きの途中で閉じた人 */
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
