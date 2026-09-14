/* Clerk username/password bridge — 2026-09-14
 *
 * app.js still contains the older one-call SignIn API.  This bridge owns only
 * the login form submit event and performs Clerk's current two-step flow:
 *   1) create sign-in with identifier
 *   2) attempt password first factor
 *   3) set the created session active
 *
 * The password is never persisted or sent to OUKA Apps Script.
 */
(function () {
  'use strict';

  function codeOf(err) {
    if (!err) return '';
    if (err.errors && err.errors[0] && err.errors[0].code) return String(err.errors[0].code);
    if (err.code) return String(err.code);
    return '';
  }

  function safeMessage(err) {
    var code = codeOf(err);
    if (code === 'form_identifier_not_found' || code === 'form_password_incorrect' ||
        code === 'form_param_format_invalid') {
      return 'ユーザー名またはパスワードが違います。';
    }
    if (code === 'too_many_requests') {
      return '試行が多すぎます。少し時間をおいてからやり直してください。';
    }
    if (code === 'user_locked') {
      return 'このアカウントは一時的にロックされています。管理者に連絡してください。';
    }
    return 'ログインできませんでした。もう一度お試しください。' + (code ? ' [' + code + ']' : '');
  }

  function install() {
    var form = document.getElementById('loginForm');
    var userEl = document.getElementById('fUsername');
    var passEl = document.getElementById('fPassword');
    var btn = document.getElementById('loginBtn');
    var errEl = document.getElementById('loginErr');
    if (!form || !userEl || !passEl || !btn || !errEl) return;

    /* Capture phase + stopImmediatePropagation prevents app.js's legacy
       submit listener from running for this form. */
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();

      var username = String(userEl.value || '').replace(/^\s+|\s+$/g, '');
      var password = String(passEl.value || '');
      errEl.textContent = '';

      if (!username) {
        password = null;
        errEl.textContent = 'ユーザー名を入れてください';
        return;
      }
      if (!password) {
        errEl.textContent = 'パスワードを入れてください';
        return;
      }

      var clerk = window.Clerk;
      if (!clerk || !clerk.client || !clerk.client.signIn) {
        password = null;
        passEl.value = '';
        errEl.textContent = 'ログイン基盤を読み込めていません。画面を読み込み直してください。';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'ログイン中…';

      var localPassword = password;
      password = null;

      Promise.resolve(clerk.client.signIn.create({ identifier: username }))
        .then(function (attempt) {
          if (!attempt || typeof attempt.attemptFirstFactor !== 'function') {
            throw new Error('password_factor_unavailable');
          }
          var p = attempt.attemptFirstFactor({
            strategy: 'password',
            password: localPassword
          });
          localPassword = null;
          passEl.value = '';
          return p;
        })
        .then(function (result) {
          if (!result || result.status !== 'complete' || !result.createdSessionId) {
            throw new Error('sign_in_not_complete');
          }
          return clerk.setActive({ session: result.createdSessionId });
        })
        .then(function () {
          /* app.js already knows how to restore an existing Clerk session and
             then ask OUKA App Layer for the user's role.  Reload into that path. */
          window.location.reload();
        })
        .catch(function (err) {
          localPassword = null;
          passEl.value = '';
          btn.disabled = false;
          btn.textContent = 'ログイン';
          errEl.textContent = safeMessage(err);
        });
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
