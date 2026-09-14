/* portal.js — OUKA School Operations Portal shell
 * Existing Teacher Daily Workflow remains unchanged.
 * This layer only controls navigation after authenticated session rendering.
 */
(function () {
  'use strict';

  var allowFlow = false;

  function $(id) { return document.getElementById(id); }
  function show(el, on) { if (el) el.hidden = !on; }

  function roleFromWho() {
    var text = ($('who') && $('who').textContent) || '';
    var m = text.match(/（([^）]+)）\s*$/);
    return m ? m[1] : '';
  }

  function renderPortal() {
    var role = roleFromWho();
    var title = $('portalRoleTitle');
    var note = $('portalRoleNote');
    if (title) title.textContent = role ? role + ' ホーム' : 'OUKA School OS';

    var teacherCard = $('teacherPortalCard');
    var teacherBtn = $('openTeacherFlow');
    var canUseTeacher = ['SUPER_ADMIN', 'SCHOOL_ADMIN', 'TEACHER'].indexOf(role) >= 0;
    show(teacherCard, canUseTeacher);
    if (teacherBtn) teacherBtn.disabled = !canUseTeacher;

    if (note) {
      if (role === 'SUPER_ADMIN') note.textContent = '学校全体を管理する入口です。まず既存の教師日次業務を安全に統合し、各OSを順番に接続します。';
      else if (role === 'TEACHER') note.textContent = '今日の授業・出席・授業結果・日報をここから記録します。';
      else if (role === 'SCHOOL_ADMIN') note.textContent = '学校運営と教師業務の入口です。';
      else note.textContent = 'あなたの権限で利用できる業務を表示します。';
    }
  }

  function openPortal() {
    allowFlow = false;
    renderPortal();
    show($('flowView'), false);
    show($('portalView'), true);
    window.scrollTo(0, 0);
  }

  function openTeacherFlow() {
    allowFlow = true;
    show($('portalView'), false);
    show($('flowView'), true);
    window.scrollTo(0, 0);
  }

  function wire() {
    var open = $('openTeacherFlow');
    var home = $('portalHomeBtn');
    if (open) open.addEventListener('click', openTeacherFlow);
    if (home) home.addEventListener('click', openPortal);

    /* app.js owns authentication. When it reveals flowView after a valid
       server session, redirect once to the portal shell. */
    var flow = $('flowView');
    if (flow && window.MutationObserver) {
      new MutationObserver(function () {
        var loggedIn = $('who') && $('who').textContent.trim();
        if (!flow.hidden && loggedIn && !allowFlow) openPortal();
      }).observe(flow, { attributes: true, attributeFilter: ['hidden'] });
    }

    /* Logout/login transitions must never leave the portal visible. */
    var login = $('loginView');
    if (login && window.MutationObserver) {
      new MutationObserver(function () {
        if (!login.hidden) {
          allowFlow = false;
          show($('portalView'), false);
        }
      }).observe(login, { attributes: true, attributeFilter: ['hidden'] });
    }
  }

  document.addEventListener('DOMContentLoaded', wire);
})();
