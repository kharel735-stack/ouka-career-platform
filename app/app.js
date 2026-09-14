/* app.js — OUKA 統合Webアプリ クライアント（Teacher Daily Workflow）
 *
 * CEO決定 2026-09-08:
 *   - Secret を Client JS に置かない
 *   - Client が名乗る username / user_id をサーバーは信用しない
 *   - 3画面に分けず 1画面で「今日の授業確認→出席→授業結果→日報→確認→送信→完了」
 *   - 開発中は TEST データのみ。実学生への LIVE Write は禁止
 *
 * ★CEO決定 AUTH-CHANGE-01（2026-09-08）:
 *   - Google Sign-In を中止。ログインは Username + Password（Clerk）
 *   - この画面に Sign Up は無い。アカウントは管理者が発行する
 *   - Password は LocalStorage にも変数にも残さない。Clerk へ渡したら参照を切る
 *   - Clerk の Session Token は寿命が短いので、通信のたびに取り直す
 *
 * このファイルが持たないもの:
 *   Password の保管場所／トークンの保管場所／スプレッドシートID／権限の判断。
 *   ロールはサーバーが返したものをそのまま使う。
 *   LocalStorage に入れるのは名簿の下書きだけ（Password もトークンも入れない）。
 */
(function () {
  'use strict';

  var W = window.OukaWorkflow;
  var A = window.OukaAuth;
  var S = window.OukaStudent;
  var CFG = window.OUKA_APP || {};
  var clerkReady = null;          /* Clerk の読み込みが終わったことを表す Promise */
  var session = null;
  var state = null;
  var step = 'today';
  var NINE = ['INPUT', 'REPEAT', 'WRITE', 'USE', 'PAIR', 'CREATE', 'PRESENT', 'TEST', 'ACTION'];
  var ROSTER_KEY = 'ouka.roster.';

  /* ------------------------------------------------------------ 小道具 */
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function show(el, on) { if (el) el.hidden = !on; }
  function todayYmd() {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function setErrors(list) {
    $('errors').textContent = (list && list.length) ? list.join('\n') : '';
  }

  /* 端末に置くのは名簿の下書きだけ。無くても動く。 */
  function loadRoster(klass) {
    try { return JSON.parse(localStorage.getItem(ROSTER_KEY + klass) || '[]'); }
    catch (x) { return []; }
  }
  function saveRoster(klass, roster) {
    try { localStorage.setItem(ROSTER_KEY + klass, JSON.stringify(roster)); } catch (x) { /* 使えなくても動く */ }
  }

  /* --------------------------------------------------- Clerk のセッション */

  /* ★実機修正 2026-09-10（AUTH-CHANGE-01）:
     Clerk のセッション復元は load() の解決と同時とは限らない。
     一度きりの判定にすると、既存セッションがあるのに拾えず、
     ログイン画面のまま止まる（実機で発生）。短い時間だけ待って拾う。
     見つからなければ未ログインとして扱い、ログイン画面のままにする。 */
  var SESSION_WAIT_MS = 3000, SESSION_STEP_MS = 150;

  function waitForSession(clerk, msLeft) {
    if (clerk && clerk.session) return Promise.resolve(clerk.session);
    if (msLeft <= 0) return Promise.resolve(null);
    return new Promise(function (done) { setTimeout(done, SESSION_STEP_MS); })
      .then(function () { return waitForSession(clerk, msLeft - SESSION_STEP_MS); });
  }

  /* ------------------------------------------------------------ 通信 */

  /* ★Clerk の Session Token は寿命が短い（既定60秒）。
     溜め込まず、送る直前に必ず取り直す。だからこの画面はトークンを持たない。 */
  function freshToken() {
    var c = window.Clerk;
    if (!c || !c.session) return Promise.resolve('');
    return Promise.resolve(c.session.getToken());
  }

  /* Content-Type を text/plain にすると preflight が飛ばない。
     Apps Script は OPTIONS を扱えないので、これが必要。 */
  function api(action, extra) {
    var chk = A.checkConfig(CFG);
    if (!chk.ok) return Promise.reject(new Error(chk.errors.join(' / ')));

    return freshToken().then(function (token) {
      if (!token) { toLogin('ログインの有効期限が切れました。もう一度ログインしてください。'); 
                    throw new Error('セッションがありません'); }
      /* ★buildBody は Password を含む本文を作れない（見つけたら例外で止まる）。 */
      var body = A.buildBody(token, action, extra || {});
      return fetch(CFG.appLayerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      }).then(function (r) { return r.json(); })
        .then(function (res) {
          /* セッション切れは全画面共通でログインへ戻す */
          if (A.isExpired(res)) toLogin(A.mapServerError(res).message);
          return res;
        });
    });
  }

  /* ------------------------------------------------------------ ログイン */

  /* ★入力欄のパスワードを即座に消す。画面にもDOMにも残さない。 */
  function clearSecretField() {
    var el = $('fPassword');
    if (el) { el.value = ''; }
  }

  function setBusy(on) {
    var b = $('loginBtn');
    if (b) { b.disabled = !!on; b.textContent = on ? 'ログイン中…' : 'ログイン'; }
  }

  /* ログイン画面へ戻す。セッション切れ・ログアウトの共通の出口。 */
  function toLogin(message) {
    session = null;
    state = null;
    clearSecretField();
    show($('flowView'), false);
    show($('studentView'), false);
    show($('loginView'), true);
    show($('logoutBtn'), false);
    $('who').textContent = '';
    $('loginErr').textContent = message || '';
    setBusy(false);
  }

  /* ★Username + Password。Password はここでだけ触り、Clerk へ渡したら参照を切る。
     変数にも state にも LocalStorage にも残さない。 */
  function onLogin(e) {
    if (e && e.preventDefault) e.preventDefault();
    $('loginErr').textContent = '';

    var user = $('fUsername').value;
    var secret = $('fPassword').value;
    var v = A.validate({ username: user, password: secret });
    if (!v.ok) { secret = null; $('loginErr').textContent = v.errors.join('\n'); return; }

    if (!clerkReady) { secret = null; $('loginErr').textContent = 'ログイン基盤を読み込めていません。画面を読み込み直してください。'; return; }

    setBusy(true);
    clerkReady.then(function (clerk) {
      /* Clerk へ渡したらすぐ手放す（この関数を抜けた後どこにも残らない）。 */
      var p = clerk.client.signIn.create({
        strategy: 'password', identifier: v.username, password: secret
      });
      secret = null;
      clearSecretField();
      return p.then(function (res) {
        if (!res || res.status !== 'complete') {
          throw { errors: [{ code: 'form_password_incorrect' }] };
        }
        return clerk.setActive({ session: res.createdSessionId });
      }, function (err) {
        /* ★すでにログイン済みは失敗ではない（AUTH-CHANGE-01 実機修正）。
           エラーで終わらせず、その既存セッションのまま認証を続ける。 */
        if (!A.isAlreadySignedIn(err)) throw err;
        return waitForSession(clerk, SESSION_WAIT_MS).then(function (sess) {
          if (!sess) throw err;
        });
      });
    }).then(function () {
      return api('session', {});
    }).then(onSession).catch(function (err) {
      secret = null;
      clearSecretField();
      setBusy(false);
      var m = A.mapSignInError(err);
      $('loginErr').textContent = m.message;
    });
  }

  function onLogout() {
    var c = window.Clerk;
    var done = (c && c.signOut) ? c.signOut() : Promise.resolve();
    Promise.resolve(done).then(function () {
      $('fUsername').value = '';
      toLogin('ログアウトしました。');
    });
  }

  function onSession(s) {
    setBusy(false);
    if (!s || !s.ok) {
      /* ★NO_ROLE のとき権限の情報は何も出さない。出せるのは「登録されていない」だけ。 */
      $('loginErr').textContent = A.mapServerError(s).message;
      return;
    }
    session = s;
    $('who').textContent = (s.display_name || '') + '（' + s.role + '）';
    show($('loginView'), false);
    show($('logoutBtn'), true);
    if (s.home_view === 'student') {
      show($('flowView'), false);
      show($('studentView'), true);
      loadStudent();
      return;
    }
    show($('studentView'), false);
    show($('flowView'), true);
    show($('testWrap'), !!s.can_write_test);

    state = W.emptyState(todayYmd());
    state.klass = s.assigned_class || '';
    state.teacherId = s.teacher_id || '';
    state.report.teacherName = s.display_name || '';
    $('fDate').value = state.date;
    $('fClass').value = state.klass;
    $('fTeacherName').value = state.report.teacherName;

    if (s.can_write.indexOf('attendance') < 0) {
      setErrors(['このアカウントは記録の入力ができません（' + s.role + '）。']);
      $('nextBtn').disabled = true;
    }
    loadToday();
    renderChips();
    goto('today');
  }

  /* Student は read だけを呼ぶ。サーバー側で student_id 本人1件に固定される。 */
  function loadStudent() {
    $('studentStatus').textContent = '読み込み中…';
    $('studentErr').textContent = '';
    api('read', {}).then(function (r) {
      if (!r || !r.ok) {
        $('studentStatus').textContent = '';
        $('studentErr').textContent = '学習記録を読み込めませんでした。';
        return;
      }
      var list = (r.data && r.data.students) || [];
      if (list.length !== 1 || String(list[0].student_ref || '') !== String(session.student_id || '')) {
        $('studentStatus').textContent = '';
        $('studentErr').textContent = '本人の学習記録を確認できませんでした。管理者に連絡してください。';
        return;
      }
      var v = S.viewModel(list[0]);
      var rows = [
        ['今日の課題', v.todayTask], ['現在のLEVEL', v.level],
        ['現在のDay・範囲', v.currentDay], ['出席状況', v.attendance],
        ['宿題', v.homework], ['直近テスト', v.latestTest],
        ['弱点', v.weakness], ['学習時間', v.learningTime], ['次の目標', v.nextGoal]
      ];
      $('studentStatus').className = 'student-grid';
      $('studentStatus').innerHTML = rows.map(function (x) {
        return '<div class="student-item"><span class="k">' + esc(x[0]) +
          '</span><span class="v">' + esc(x[1]) + '</span></div>';
      }).join('');
    }).catch(function () {
      $('studentStatus').textContent = '';
      $('studentErr').textContent = '通信に失敗しました。もう一度ログインしてください。';
    });
  }

  /* ---------------------------------------------------- 1. 今日の授業 */
  function loadToday() {
    api('read', {}).then(function (r) {
      if (!r || !r.ok) { $('todayPlan').textContent = '今日の予定を取れませんでした。'; return; }
      var d = r.data || {};
      var me = (d.teachers || [])[0] || {};
      var plan = me.today_plan || {};
      var planned = (d.school_status && d.school_status.day && d.school_status.day.planned_day_id) || plan.day_id || '';

      state.plannedDay = planned || '';
      if (!$('fActualDay').value && planned) $('fActualDay').value = planned;
      if (!$('fClass').value && me.assigned_class) $('fClass').value = me.assigned_class;

      var units = (plan.lesson_units || []).join(' / ') || '（授業ユニットの記録なし）';
      $('todayPlan').innerHTML =
        '<div class="sumrow"><span class="k">予定のDay</span><span class="v">' + esc(planned || '—') +
          (plan.is_estimated ? ' <span class="muted">（開校日からの推定）</span>' : '') + '</span></div>' +
        '<div class="sumrow"><span class="k">担当クラス</span><span class="v">' + esc(me.assigned_class || '—') + '</span></div>' +
        '<div class="sumrow"><span class="k">今日の授業ユニット</span><span class="v">' + esc(units) + '</span></div>' +
        '<div class="sumrow"><span class="k">今日の日報</span><span class="v">' +
          ((me.daily_report && me.daily_report.status === 'NOT_RECORDED') ? '未提出' : esc((me.daily_report || {}).status || '—')) +
        '</span></div>';
      $('dayHint').textContent = planned ? '予定は ' + planned + '。実際に進んだDayを入れてください。' : '';

      var perms = me.permissions || [];
      var live = perms.filter(function (p) { return !p.expired && p.permission !== 'BLOCKED'; });
      if (perms.length && !live.length) {
        $('permWarn').innerHTML =
          '<b>授業許可が有効ではありません。</b><br>' +
          '記録はできますが、授業許可の再評価は校長・代表の判断です。' +
          '<span class="muted">（このアプリから許可を出すことはできません）</span>';
        show($('permWarn'), true);
      }
    }).catch(function (e) { $('todayPlan').textContent = '通信に失敗しました: ' + e.message; });
  }

  /* ---------------------------------------------------- 2. 出席 */

  /* 名簿の正本は APP_CLASS_ROSTER（サーバー）＝
     Phase1 Teacher Assignment / Display Source of Truth。
     ★Student Master ではない。取れなければ端末の下書きを使う。 */
  function loadRosterThenRender() {
    if (state.rosterSource === 'server' && state.roster.length) { renderRoster(); return; }
    if (!session || !session.can_read_roster) { useLocalRoster('この権限では名簿を読めません。'); return; }

    $('rosterNote').textContent = '名簿を読み込んでいます…';
    renderRoster();
    api('roster', { options: { 'class': state.klass, date: state.date } }).then(function (r) {
      if (!r || !r.ok) { useLocalRoster('名簿を読めませんでした（' + ((r && r.error) || '不明') + '）。'); return; }
      var fromServer = W.rosterFromServer(r.students);
      if (!fromServer.length) {
        useLocalRoster('APP_CLASS_ROSTER にこのクラスの生徒が登録されていません。');
        return;
      }
      state.roster = fromServer;
      state.rosterSource = 'server';
      $('rosterNote').textContent = 'APP_CLASS_ROSTER から ' + fromServer.length + '人を読み込みました。';
      renderRoster();
    }).catch(function (e) { useLocalRoster('通信に失敗しました: ' + e.message); });
  }

  function useLocalRoster(why) {
    var saved = loadRoster(state.klass);
    if (saved.length && !state.roster.length) state.roster = saved;
    state.rosterSource = state.roster.length ? 'local' : 'none';
    $('rosterNote').innerHTML = esc(why) +
      '<br><b>下の欄から手で追加できます。</b>この場合の名簿はこの端末だけの下書きです。';
    renderRoster();
  }

  function renderRoster() {
    var box = $('attList');
    if (!state.roster.length) {
      box.innerHTML = '<p class="muted">上の欄に生徒IDを入れて「追加」してください。' +
                      '一度入れるとこの端末に残ります。</p>';
      $('attTally').textContent = '';
      return;
    }
    box.innerHTML = state.roster.map(function (r) {
      var a = state.attendance[r.id] || {};
      function marks(part) {
        return W.ATT_VALUES.map(function (v) {
          return '<button type="button" data-id="' + esc(r.id) + '" data-part="' + part + '" data-v="' + v + '"' +
                 (a[part] === v ? ' class="sel"' : '') + '>' + v + '</button>';
        }).join('');
      }
      return '<div class="stu">' +
        '<div class="top"><span class="id">' + esc(r.id) + '</span>' +
          '<span class="muted">' + esc(r.name || '') + '</span>' +
          '<button type="button" class="rm" data-rm="' + esc(r.id) + '">削除</button></div>' +
        '<div class="marks"><span class="lbl">午前</span>' + marks('am') + '</div>' +
        '<div class="marks"><span class="lbl">午後</span>' + marks('pm') + '</div>' +
        '<div class="extra">' +
          '<input type="number" inputmode="numeric" placeholder="遅刻(分)" data-f="late" data-id="' + esc(r.id) + '" value="' + esc(a.late || '') + '">' +
          '<input type="text" placeholder="欠席の理由" data-f="reason" data-id="' + esc(r.id) + '" value="' + esc(a.reason || '') + '">' +
        '</div></div>';
    }).join('');

    var t = W.tally(state);
    $('attTally').textContent = '出席 ' + t.present + ' / ' + t.total +
      '　遅刻 ' + t.late.length + '　欠席 ' + t.absent.length;
  }

  function onAttClick(e) {
    var b = e.target.closest ? e.target.closest('button') : null;
    if (!b) return;
    if (b.dataset.rm) {
      state.roster = W.removeFromRoster(state.roster, b.dataset.rm);
      delete state.attendance[b.dataset.rm];
      saveRoster(state.klass, state.roster);
      renderRoster(); return;
    }
    if (b.dataset.id && b.dataset.part) {
      var a = state.attendance[b.dataset.id] || (state.attendance[b.dataset.id] = {});
      a[b.dataset.part] = b.dataset.v;
      renderRoster();
    }
  }
  function onAttInput(e) {
    var f = e.target.dataset && e.target.dataset.f;
    if (!f) return;
    var a = state.attendance[e.target.dataset.id] || (state.attendance[e.target.dataset.id] = {});
    a[f] = e.target.value;
  }

  /* ---------------------------------------------------- 3. 授業結果 */
  function renderChips() {
    $('stepChips').innerHTML = NINE.map(function (n) {
      var on = state.lesson.missingSteps.indexOf(n) >= 0;
      return '<button type="button" data-step9="' + n + '"' + (on ? ' class="sel"' : '') + '>' + n + '</button>';
    }).join('');
  }
  function onChip(e) {
    var b = e.target.closest ? e.target.closest('button[data-step9]') : null;
    if (!b) return;
    var n = b.dataset.step9, i = state.lesson.missingSteps.indexOf(n);
    if (i >= 0) state.lesson.missingSteps.splice(i, 1); else state.lesson.missingSteps.push(n);
    renderChips();
  }

  /* ---------------------------------------------------- 5. 確認 */
  function renderSummary() {
    var s = W.summary(state);
    function r(k, v) { return '<div class="sumrow"><span class="k">' + esc(k) + '</span><span class="v">' + v + '</span></div>'; }
    $('summary').innerHTML =
      (s.mode === 'TEST' ? '<div class="warn"><b>テストとして記録します。</b>実学生の記録とは混ざりません。</div>' : '') +
      (s.day_gap ? '<div class="warn">予定は <b>' + esc(s.planned_day) + '</b> ですが、実施は <b>' + esc(s.actual_day) + '</b> です。</div>' : '') +
      r('日付', esc(s.date) + '（' + esc(s.dow) + '）') +
      r('クラス', esc(s.klass)) +
      r('実施したDay', esc(s.actual_day)) +
      r('生徒', s.students + '人（出席 ' + s.present + '・遅刻 ' + s.late + '・欠席 ' + s.absent + '）') +
      r('科目', esc(s.subject)) +
      r('宿題 / 小テスト', esc(s.homework || '—') + ' / ' + esc(s.quiz || '—')) +
      r('時間超過', s.overtime ? esc(s.overtime) + '分' : 'なし') +
      r('発話ラウンド', esc(s.speaking_rounds || '0') + '（全員が1回ずつ＝1）') +
      r('できなかった9ステップ', s.missing_steps.length ? esc(s.missing_steps.join(' , ')) : 'なし') +
      r('ACTION', s.action_achieved ? '使わせた' : '<span class="err">できなかった</span>') +
      r('書き込む行', '出席 ' + s.rows.attendance + ' / 授業記録 ' + s.rows.lesson_log +
        ' / 日報 ' + s.rows.daily_report + ' / 集計用 ' + s.rows.teacher_daily);
  }

  /* ---------------------------------------------------- 6. 送信 */
  function send() {
    var batches = W.buildBatches(state), results = [];
    $('sending').textContent = '保存しています…';

    function one(i) {
      if (i >= batches.length) return Promise.resolve();
      var b = batches[i];
      $('sending').textContent = b.label + 'を保存しています…（' + (i + 1) + '/' + batches.length + '）';
      return api('write', { op: b.op, rows: b.rows, mode: b.mode, client: 'M4-M6/' + W.writeId(state) })
        .then(function (r) {
          results.push(Object.assign({ label: b.label }, r || { ok: false, error: 'NO_RESPONSE' }));
          /* 前が通らなければ次へ進まない（半端な記録を増やさない）。 */
          if (!r || !r.ok) return;
          return one(i + 1);
        });
    }

    one(0).then(function () {
      var d = W.digest(results);
      $('doneBox').innerHTML =
        '<p class="' + (d.ok ? 'ok' : 'err') + '">' + esc(d.message) + '</p>' +
        '<div class="sumrow"><span class="k">新しく入った行</span><span class="v">' + d.appended + '</span></div>' +
        '<div class="sumrow"><span class="k">すでにあった行</span><span class="v">' + d.duplicate + '</span></div>' +
        (d.rejected ? '<div class="sumrow"><span class="k">受け付けられなかった行</span><span class="v err">' + d.rejected + '</span></div>' : '') +
        (d.failed.length ? '<div class="warn">' + d.failed.map(function (f) {
          return esc(f.label) + '：' + esc(f.error) + (f.message ? '（' + esc(f.message) + '）' : '');
        }).join('<br>') + '</div>' : '') +
        '<p class="muted">Google スプレッドシートを開く必要はありません。</p>';
      goto('done');
    }).catch(function (e) {
      $('doneBox').innerHTML = '<p class="err">送信に失敗しました: ' + esc(e.message) + '</p>';
      goto('done');
    });
  }

  /* ---------------------------------------------------- 画面の切替 */
  function collect() {
    state.date = $('fDate').value;
    state.klass = $('fClass').value;
    state.actualDay = $('fActualDay').value;
    state.mode = ($('fTestMode') && $('fTestMode').checked) ? 'TEST' : 'LIVE';
    state.lesson.subject = $('fSubject').value;
    state.lesson.range = $('fRange').value;
    state.lesson.homework = $('fHomework').value;
    state.lesson.quiz = $('fQuiz').value;
    state.lesson.overtime = $('fOvertime').value;
    state.lesson.speakingRounds = $('fRounds').value;
    state.lesson.note = $('fLessonNote').value;
    state.report.teacherName = $('fTeacherName').value;
    state.report.what = $('fWhat').value;
    state.report.why = $('fWhy').value;
    state.report.result = $('fResult').value;
    state.report.reflect = $('fReflect').value;
    state.report.improve = $('fImprove').value;
    var a = document.querySelector('input[name=action]:checked');
    state.report.actionAchieved = a ? (a.value === 'yes') : null;
  }

  function goto(next) {
    step = next;
    Array.prototype.forEach.call(document.querySelectorAll('.step'), function (el) {
      show(el, el.dataset.step === step);
    });
    var order = W.STEPS, i = order.indexOf(step);
    Array.prototype.forEach.call($('stepper').children, function (li) {
      var j = order.indexOf(li.dataset.step);
      li.className = (li.dataset.step === step) ? 'on' : (j >= 0 && j < i ? 'done' : '');
    });
    show($('modeBadge'), state && state.mode === 'TEST');
    setErrors([]);
    show($('nav'), step !== 'send');
    $('backBtn').disabled = (i <= 0 || step === 'done');
    $('nextBtn').textContent = step === 'confirm' ? 'この内容で送信' : '次へ';
    show($('nextBtn'), step !== 'done');
    if (step === 'attendance') loadRosterThenRender();
    if (step === 'confirm') renderSummary();
    if (step === 'send') send();
    window.scrollTo(0, 0);
  }

  function onNext() {
    collect();
    var v = W.canAdvance(step, state);
    if (!v.ok) { setErrors(v.errors); return; }
    if (step === 'confirm') { goto('send'); return; }
    goto(W.nextStep(step));
  }

  function onAdd() {
    var r = W.addToRoster(state.roster, { id: $('newId').value, name: $('newName').value });
    if (!r.ok) { $('rosterHint').textContent = r.error; return; }
    state.roster = r.roster;
    $('rosterHint').textContent = r.hint || '';
    $('newId').value = ''; $('newName').value = '';
    saveRoster(state.klass, state.roster);
    renderRoster();
  }

  /* ---------------------------------------------------- 起動 */
  function wire() {
    $('loginForm').addEventListener('submit', onLogin);
    $('logoutBtn').addEventListener('click', onLogout);
    $('nextBtn').addEventListener('click', onNext);
    $('backBtn').addEventListener('click', function () { collect(); goto(W.prevStep(step)); });
    $('addStudent').addEventListener('click', onAdd);
    $('newId').addEventListener('keydown', function (e) { if (e.key === 'Enter') onAdd(); });
    $('attList').addEventListener('click', onAttClick);
    $('attList').addEventListener('input', onAttInput);
    $('stepChips').addEventListener('click', onChip);
    $('fClass').addEventListener('change', function () {
      collect();
      /* クラスを変えたら名簿は取り直す */
      state.roster = []; state.rosterSource = 'none';
    });
    $('againBtn').addEventListener('click', function () {
      var keep = state.roster, src = state.rosterSource, klass = state.klass;
      var name = state.report.teacherName, tid = state.teacherId;
      state = W.emptyState(todayYmd());
      state.roster = keep; state.rosterSource = src; state.klass = klass;
      state.report.teacherName = name; state.teacherId = tid;
      ['fWhat', 'fWhy', 'fResult', 'fReflect', 'fImprove', 'fLessonNote', 'fRounds'].forEach(function (id) { $(id).value = ''; });
      Array.prototype.forEach.call(document.querySelectorAll('input[name=action]'), function (r) { r.checked = false; });
      renderChips(); goto('today');
    });
  }

  /* ★ClerkJS は Clerk 自身のホストから読む（Publishable Key の中に入っている）。
     第三者のCDNを挟まない。Publishable Key は公開してよい値で、秘密ではない。 */
  function loadClerk() {
    return new Promise(function (resolve, reject) {
      var url = A.scriptUrl(CFG.clerkPublishableKey);
      if (!url) { reject(new Error('clerkPublishableKey が正しくありません')); return; }
      var el = document.createElement('script');
      el.src = url;
      el.async = true;
      el.crossOrigin = 'anonymous';
      el.setAttribute('data-clerk-publishable-key', CFG.clerkPublishableKey);
      el.onload = function () {
        if (!window.Clerk) { reject(new Error('ログイン基盤を読み込めませんでした')); return; }
        Promise.resolve(window.Clerk.load({})).then(function () { resolve(window.Clerk); }, reject);
      };
      el.onerror = function () { reject(new Error('ログイン基盤に接続できませんでした')); };
      document.head.appendChild(el);
    });
  }

  function boot() {
    var chk = A.checkConfig(CFG);
    if (!chk.ok) {
      $('loginErr').textContent = chk.errors.join('\n');
      $('loginBtn').disabled = true;
      return;
    }
    clerkReady = loadClerk();
    clerkReady.then(function (clerk) {
      /* すでにログイン中なら、そのまま今日の記録へ進む。
         ★復元を少し待つ（一度きりの判定では取りこぼす）。 */
      return waitForSession(clerk, SESSION_WAIT_MS).then(function (sess) {
        if (!sess) return;                       /* 未ログイン＝ログイン画面のまま */
        return api('session', {}).then(onSession).catch(function (e) {
          /* ★黙って止まらない。理由を画面に出す（実機で原因が見えなかったため）。 */
          $('loginErr').textContent = '自動ログインに失敗しました: ' + e.message;
        });
      });
    }).catch(function (e) {
      $('loginErr').textContent = e.message;
      $('loginBtn').disabled = true;
    });
  }

  document.addEventListener('DOMContentLoaded', function () { wire(); boot(); });
})();
