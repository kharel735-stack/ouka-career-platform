/* Clerk username/password compatibility shim — 2026-09-14
 *
 * OUKA app.js uses the legacy one-call form:
 *   signIn.create({ strategy: 'password', identifier, password })
 *
 * Current Clerk sign-in expects identifier creation first, then the password
 * first-factor attempt. This shim keeps app.js unchanged while translating
 * that legacy call into Clerk's current two-step flow.
 *
 * Password is never persisted; it is only forwarded to Clerk and the local
 * reference is released immediately after the factor attempt is created.
 */
(function () {
  'use strict';

  var installed = false;
  var tries = 0;
  var MAX_TRIES = 200; /* 20 seconds at 100ms */

  function install() {
    if (installed) return true;

    var clerk = window.Clerk;
    var signIn = clerk && clerk.client && clerk.client.signIn;
    if (!signIn || typeof signIn.create !== 'function') return false;

    var originalCreate = signIn.create.bind(signIn);

    signIn.create = function (params) {
      var p = params || {};

      /* Only translate OUKA's username/password legacy call. */
      if (p.strategy !== 'password' || !p.identifier || !p.password) {
        return originalCreate(params);
      }

      var identifier = p.identifier;
      var password = p.password;

      return originalCreate({ identifier: identifier }).then(function (attempt) {
        identifier = null;
        if (!attempt || typeof attempt.attemptFirstFactor !== 'function') {
          password = null;
          throw new Error('Clerk password factor is unavailable');
        }

        var factorPromise = attempt.attemptFirstFactor({
          strategy: 'password',
          password: password
        });
        password = null;
        return factorPromise;
      }, function (err) {
        identifier = null;
        password = null;
        throw err;
      });
    };

    installed = true;
    return true;
  }

  function waitForClerk() {
    if (install()) return;
    tries += 1;
    if (tries < MAX_TRIES) setTimeout(waitForClerk, 100);
  }

  waitForClerk();
})();
