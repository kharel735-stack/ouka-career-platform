/* auth.js — OUKA Web App の「ログインの考え方」だけを持つ層
 *
 * ★CEO決定 AUTH-CHANGE-01（2026-09-08）:
 *   Google Sign-In を中止し、Username + Password（Clerk）へ変更。
 *   一般ユーザー向け Sign Up は作らない。アカウントは管理者が発行する。
 *   Password は Sheets / APP_ROLE / Script Properties / LocalStorage / Git /
 *   Logs / Audit Log のどこにも保存しない。
 *
 * このファイルが持たないもの:
 *   DOM／通信／Clerk SDK そのもの／Password の保管場所。
 *   ここにあるのは「入力を確かめる」「エラーを日本語にする」
 *   「送ってよい形を作る」だけ。だから node で全部テストできる。
 *
 * ★Password の扱い（この層の約束）:
 *   1. Password を変数に溜めない。関数の引数として受け取り、そのまま Clerk へ渡す
 *      形を作るだけで、戻り値にも状態にも残さない。
 *   2. サーバー（App Layer）へ送る本文に Password を入れる経路が存在しない。
 *      buildBody() は Password を見つけたら例外を投げて止まる。
 *   3. 画面に出す文言に、入力された Password を混ぜない。
 *   4. ログに出す時は必ず redact() を通す。
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OukaAuth = api;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* ログインの状態。画面はこの4つしか取らない。 */
  var STATES = ['signed_out', 'signing_in', 'signed_in', 'expired'];

  var LIMITS = { username: 64, secret: 256 };

  /* 本文に入っていてはいけないキー（Password と秘密の持ち出し防止） */
  var FORBIDDEN_KEYS = ['password', 'passwd', 'pwd', 'secret', 'credential',
                        'identifier', 'pin', 'otp'];

  function trim(s) {
    return String(s === undefined || s === null ? '' : s).replace(/^\s+|\s+$/g, '');
  }

  /* ------------------------------------------------------------ 入力の確認 */

  /* ★エラー文に入力値そのものを混ぜない（画面にもログにも残さないため）。 */
  function validate(cred) {
    cred = cred || {};
    var user = trim(cred.username);
    var secretLen = String(cred.password === undefined || cred.password === null
                           ? '' : cred.password).length;
    var e = [];

    if (!user) e.push('ユーザー名を入れてください');
    else if (user.length > LIMITS.username) e.push('ユーザー名が長すぎます');
    else if (/\s/.test(user)) e.push('ユーザー名に空白は使えません');

    if (!secretLen) e.push('パスワードを入れてください');
    else if (secretLen > LIMITS.secret) e.push('パスワードが長すぎます');

    return { ok: e.length === 0, errors: e, username: user };
  }

  /* -------------------------------------------------- Clerk の場所を求める */

  /* Publishable Key は「公開してよい鍵」で、中に接続先ホストが入っている。
     pk_test_<base64("host$")> / pk_live_<base64("host$")>
     ブラウザの atob に頼らず自分で解く（node でもそのままテストできる）。 */
  function b64decode(s) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    s = String(s).replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');
    var out = '', bits = 0, acc = 0;
    for (var i = 0; i < s.length; i++) {
      var v = chars.indexOf(s.charAt(i));
      if (v < 0) return '';
      acc = (acc << 6) | v;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        out += String.fromCharCode((acc >> bits) & 0xff);
      }
    }
    return out;
  }

  function clerkHost(publishableKey) {
    var pk = trim(publishableKey);
    if (!pk) return '';
    if (pk.indexOf('pk_test_') !== 0 && pk.indexOf('pk_live_') !== 0) return '';
    var decoded = b64decode(pk.substring(8));
    if (!decoded) return '';
    var host = decoded.replace(/\$+$/, '');
    /* ホスト名として妥当な文字だけ。ここが緩いと別のサイトへ誘導されうる。 */
    if (!/^[a-z0-9.-]+$/i.test(host)) return '';
    if (host.indexOf('..') >= 0 || host.charAt(0) === '.' || host.indexOf('.') < 0) return '';
    return host;
  }

  /* サーバー（Apps Script）の IV_CLERK_ISSUER に入れるべき値。
     画面とサーバーが同じ Clerk を見ているかを人が確かめられるようにする。 */
  function issuerFor(publishableKey) {
    var h = clerkHost(publishableKey);
    return h ? 'https://' + h : '';
  }

  /* ClerkJS の置き場所。Clerk 自身のホストから読む（第三者CDNを挟まない）。 */
  function scriptUrl(publishableKey) {
    var h = clerkHost(publishableKey);
    return h ? 'https://' + h + '/npm/@clerk/clerk-js@5/dist/clerk.browser.js' : '';
  }

  /* ------------------------------------------------------------ エラー翻訳 */

  /* ★ユーザー名の存在有無を画面で区別しない。
     「そのユーザー名は無い」と答えると、誰が登録されているかを外から数えられる。 */
  var SAME_FOR_BOTH = 'ユーザー名またはパスワードが違います。';

  function clerkErrorCode(err) {
    if (!err) return '';
    if (err.errors && err.errors.length && err.errors[0] && err.errors[0].code) {
      return String(err.errors[0].code);
    }
    if (err.code) return String(err.code);
    return '';
  }

  /* ★すでにログイン済みを表す Clerk のエラー（AUTH-CHANGE-01 実機修正 2026-09-10）。
     これは「失敗」ではない。既存セッションがあるという意味なので、
     エラーで終わらせず、そのセッションのまま認証処理を続ける。 */
  var ALREADY_SIGNED_IN = ['session_exists', 'identifier_already_signed_in'];

  function isAlreadySignedIn(err) {
    return ALREADY_SIGNED_IN.indexOf(clerkErrorCode(err)) >= 0;
  }

  function mapSignInError(err) {
    var code = clerkErrorCode(err);
    var status = err && (err.status || err.statusCode);
    var map = {
      form_identifier_not_found: SAME_FOR_BOTH,
      form_password_incorrect:   SAME_FOR_BOTH,
      form_param_format_invalid: SAME_FOR_BOTH,
      form_param_nil:            'ユーザー名とパスワードを入れてください。',
      session_exists:            'すでにログインしています。画面を読み込み直してください。',
      user_locked:               'このアカウントは一時的にロックされています。管理者に連絡してください。',
      identifier_already_signed_in: 'すでにログインしています。画面を読み込み直してください。'
    };
    if (map[code]) return { code: code, message: map[code] };
    if (status === 429 || code === 'too_many_requests') {
      return { code: 'too_many_requests', message: '試行が多すぎます。少し時間をおいてからやり直してください。' };
    }
    if (status === 0 || code === 'network_error') {
      return { code: 'network_error', message: '通信に失敗しました。電波と回線を確かめてください。' };
    }
    /* 未知のエラーでも、中身をそのまま画面に出さない（入力値が混ざりうる）。 */
    return { code: code || 'unknown', message: 'ログインできませんでした。もう一度お試しください。' };
  }

  /* サーバー（App Layer）が返した拒否理由を画面の言葉にする。
     ★セッション切れは「もう一度ログイン」へ戻す。それ以外は戻さない。 */
  var EXPIRED_ERRORS = ['IDENTITY_EXPIRED', 'IDENTITY_NO_TOKEN', 'IDENTITY_MALFORMED',
                        'IDENTITY_NOT_YET_VALID', 'IDENTITY_BAD_SIGNATURE',
                        'IDENTITY_UNKNOWN_KID', 'IDENTITY_IAT_IN_FUTURE'];

  function isExpired(res) {
    if (!res || res.ok === true) return false;
    return EXPIRED_ERRORS.indexOf(String(res.error)) >= 0;
  }

  function mapServerError(res) {
    if (!res) return { expired: false, message: '応答がありません。' };
    var code = String(res.error === undefined ? '' : res.error);
    var map = {
      NO_ROLE:           'このアカウントはまだ登録されていません。管理者に連絡してください。',
      ACCOUNT_DISABLED:  'このアカウントは停止されています。管理者に連絡してください。',
      ROLE_EXPIRED:      'このアカウントの有効期間が切れています。管理者に連絡してください。',
      DUPLICATE_ACCOUNT: 'アカウントが二重に登録されています。管理者に連絡してください。',
      BAD_ROLE:          '権限の設定が正しくありません。管理者に連絡してください。',
      IDENTITY_BAD_AZP:  'この画面のアドレスからはログインできません。管理者に連絡してください。',
      IDENTITY_NO_AZP:   'この画面のアドレスからはログインできません。管理者に連絡してください。',
      IDENTITY_BAD_ISS:  'ログイン設定が正しくありません。管理者に連絡してください。',
      IDENTITY_NOT_CONFIGURED: 'サーバーのログイン設定が終わっていません。管理者に連絡してください。'
    };
    if (isExpired(res)) {
      return { expired: true, message: 'ログインの有効期限が切れました。もう一度ログインしてください。' };
    }
    return { expired: false, message: map[code] || ('ログインできませんでした（' + (code || '不明') + '）。') };
  }

  /* --------------------------------------------------- 送ってよい形を作る */

  function findForbidden(obj, depth) {
    depth = depth || 0;
    var hits = [];
    if (!obj || typeof obj !== 'object' || depth > 6) return hits;
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var low = String(k).toLowerCase();
      for (var i = 0; i < FORBIDDEN_KEYS.length; i++) {
        if (low.indexOf(FORBIDDEN_KEYS[i]) >= 0) { hits.push(k); break; }
      }
      hits = hits.concat(findForbidden(obj[k], depth + 1));
    }
    return hits;
  }

  /* App Layer へ送る本文。★Password を含む本文は作れない（例外で止まる）。 */
  function buildBody(sessionToken, action, extra) {
    var body = { session_token: String(sessionToken === undefined ? '' : sessionToken),
                 action: String(action === undefined ? '' : action) };
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) body[k] = extra[k];
    }
    var bad = findForbidden(extra || {});
    if (bad.length) {
      /* ここに来るのは作り間違い。黙って送らずに止める。 */
      throw new Error('この項目はサーバーへ送れません: ' + bad.join(', '));
    }
    return body;
  }

  /* ログ・画面表示の前に必ず通す。Password とトークンを伏せる。 */
  function redact(obj, depth) {
    depth = depth || 0;
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (depth > 6) return '***';
    var out = Array.isArray(obj) ? [] : {};
    for (var k in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
      var low = String(k).toLowerCase();
      var hide = low.indexOf('token') >= 0;
      for (var i = 0; i < FORBIDDEN_KEYS.length && !hide; i++) {
        if (low.indexOf(FORBIDDEN_KEYS[i]) >= 0) hide = true;
      }
      out[k] = hide ? '***' : redact(obj[k], depth + 1);
    }
    return out;
  }

  /* 設定が足りているか。画面を出す前に確かめる。 */
  function checkConfig(cfg) {
    cfg = cfg || {};
    var e = [];
    var pk = trim(cfg.clerkPublishableKey);
    if (!pk || pk.indexOf('★') === 0) e.push('config.js の clerkPublishableKey が未設定です');
    else if (!clerkHost(pk)) e.push('config.js の clerkPublishableKey の形式が正しくありません');
    var url = trim(cfg.appLayerUrl);
    if (!url || url.indexOf('★') === 0) e.push('config.js の appLayerUrl が未設定です');
    else if (url.indexOf('https://') !== 0) e.push('appLayerUrl は https で始まる必要があります');
    return { ok: e.length === 0, errors: e };
  }

  return {
    STATES: STATES,
    LIMITS: LIMITS,
    FORBIDDEN_KEYS: FORBIDDEN_KEYS,
    validate: validate,
    clerkHost: clerkHost,
    issuerFor: issuerFor,
    scriptUrl: scriptUrl,
    isAlreadySignedIn: isAlreadySignedIn,
    mapSignInError: mapSignInError,
    mapServerError: mapServerError,
    isExpired: isExpired,
    buildBody: buildBody,
    findForbidden: findForbidden,
    redact: redact,
    checkConfig: checkConfig
  };
}));
