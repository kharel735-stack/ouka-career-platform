/*******************************************************************************
 * Code.gs  ―  Web App の入口（doPost / doGet）
 * -----------------------------------------------------------------------------
 * ・ホームページ(form-connector.js)から application/x-www-form-urlencoded で
 *   payload=<JSON文字列> がPOSTされます。ここで JSON.parse して処理します。
 * ・formType により振り分け：
 *     STUDENT_APPLICATION → Student Master / Journey / Interview & Matching
 *     COMPANY_INQUIRY     → Company Inquiries
 *     CONTACT             → Contacts
 * ・studentId は「このサーバー側」で発行します（ブラウザでは確定しない）。
 * ・Slack通知が失敗しても、Sheets登録は成功として返します。
 *
 * デプロイ：「デプロイ > 新しいデプロイ > ウェブアプリ」
 *   実行するユーザー: 自分 / アクセスできるユーザー: 全員
 *   発行された /exec のURLを config.js の endpoints.appsScriptUrl に設定。
 *******************************************************************************/

function doGet(e) {
  // ヘルスチェック用
  return jsonOut_({ ok: true, service: 'OUKA School OS connector', time: new Date().toISOString() });
}

function doPost(e) {
  try {
    var data = parsePayload_(e);
    if (!data) return jsonOut_({ ok: false, error: 'no payload' });

    // 最低限のサーバー側バリデーション
    var formType = data.formType || 'STUDENT_APPLICATION';
    var vErr = validate_(formType, data);
    if (vErr) return jsonOut_({ ok: false, error: vErr });

    var c = CFG_();
    if (!c.sheetId) return jsonOut_({ ok: false, error: 'SHEET_ID not set' });
    var ss = SpreadsheetApp.openById(c.sheetId);
    var ctx = { today: todayStr_(), studentId: '' };

    if (formType === 'STUDENT_APPLICATION') {
      ctx.studentId = issueStudentId_();
      appendToSheet_(ss, MAP_STUDENT_MASTER, data, ctx);
      safe_(function () { appendToSheet_(ss, MAP_JOURNEY, data, ctx); });
      safe_(function () { appendToSheet_(ss, MAP_INTERVIEW, data, ctx); });
      safe_(function () { notifySlack_(slackTextForStudent_(data, ctx.studentId)); });
      return jsonOut_({ ok: true, studentId: ctx.studentId });

    } else if (formType === 'COMPANY_INQUIRY') {
      appendToSheet_(ss, MAP_COMPANY, data, ctx);
      safe_(function () { notifySlack_(slackTextForCompany_(data)); });
      return jsonOut_({ ok: true });

    } else if (formType === 'CONTACT') {
      appendToSheet_(ss, MAP_CONTACT, data, ctx);
      safe_(function () { notifySlack_(slackTextForContact_(data)); });
      return jsonOut_({ ok: true });

    } else if (formType === 'PARTNER_INQUIRY') {
      appendToSheet_(ss, MAP_PARTNER, data, ctx);
      safe_(function () { notifySlack_(slackTextForPartner_(data)); });
      return jsonOut_({ ok: true });
    }

    return jsonOut_({ ok: false, error: 'unknown formType: ' + formType });

  } catch (err) {
    return jsonOut_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

/* ---- payload の取り出し（form-urlencoded / JSON body 両対応） ---- */
function parsePayload_(e) {
  if (!e) return null;
  try {
    if (e.parameter && e.parameter.payload) return JSON.parse(e.parameter.payload);
    if (e.postData && e.postData.contents) {
      var body = e.postData.contents;
      if (e.postData.type && e.postData.type.indexOf('application/json') >= 0) return JSON.parse(body);
      // "payload=..." 形式
      var m = body.match(/(?:^|&)payload=([^&]*)/);
      if (m) return JSON.parse(decodeURIComponent(m[1].replace(/\+/g, ' ')));
    }
  } catch (err) { Logger.log('parse error: ' + err); }
  return null;
}

/* ---- サーバー側バリデーション ---- */
function validate_(formType, d) {
  if (formType === 'STUDENT_APPLICATION') {
    if (!clean_(d.fullName)) return 'fullName required';
    if (!clean_(d.phone)) return 'phone required';
    if (d.privacyConsent !== 'YES') return 'consent required';
  } else if (formType === 'COMPANY_INQUIRY') {
    if (!clean_(d.companyName)) return 'companyName required';
    if (!clean_(d.email)) return 'email required';
  } else if (formType === 'CONTACT') {
    if (!clean_(d.name)) return 'name required';
    if (!clean_(d.message)) return 'message required';
  } else if (formType === 'PARTNER_INQUIRY') {
    if (!clean_(d.orgName)) return 'orgName required';
    if (!clean_(d.email)) return 'email required';
  }
  return '';
}

/* ---- Student ID の発行（連番・排他制御） ---- */
function issueStudentId_() {
  var c = CFG_();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var props = PropertiesService.getScriptProperties();
    var seq = parseInt(props.getProperty('STUDENT_SEQ') || '0', 10) + 1;
    props.setProperty('STUDENT_SEQ', String(seq));
    var ym = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kathmandu', 'yyyyMM');
    return c.studentIdPrefix + '-' + ym + '-' + padLeft_(seq, 4);
  } finally {
    lock.releaseLock();
  }
}

/* ---- ユーティリティ ---- */
function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function safe_(fn) { try { fn(); } catch (e) { Logger.log('non-fatal: ' + e); } }
function clean_(s) { return (s == null) ? '' : String(s).trim(); }
function padLeft_(n, len) { var s = String(n); while (s.length < len) s = '0' + s; return s; }
function todayStr_() { return Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kathmandu', 'yyyy-MM-dd'); }

/* ---- 動作テスト（エディタから実行） ---- */
function testDoPost() {
  var e = { parameter: { payload: JSON.stringify({
    formType: 'STUDENT_APPLICATION',
    fullName: 'テスト 太郎', fullNameRoman: 'TARO TEST', phone: '9800000000',
    japaneseLevel: 'N5_LEVEL', preferredJob1: 'CONSTRUCTION',
    recommendedJob1: 'CONSTRUCTION', recommendedJob1Score: 82,
    desiredDepartureDate: '6M', interviewRequested: 'YES', interviewMethod: 'VISIT',
    privacyConsent: 'YES', applicationSource: 'OUKA_WEBSITE', status: 'NEW_APPLICATION'
  }) } };
  var res = doPost(e);
  Logger.log(res.getContent());
}
