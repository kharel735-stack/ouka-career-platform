/*******************************************************************************
 * SlackNotifier.gs  ―  Slackへ新規申込を通知
 * -----------------------------------------------------------------------------
 * ★個人情報を送りすぎない：住所・健康情報・パスポート情報は通知しません。
 * ★Slack通知が失敗しても、Sheetsへの登録は失敗させません（呼び出し側でtry/catch）。
 * ・Incoming Webhook（SLACK_WEBHOOK_URL）を優先。無ければ Bot Token（chat.postMessage）。
 *******************************************************************************/

function notifySlack_(text) {
  var c = CFG_();
  if (c.slackWebhook) {
    UrlFetchApp.fetch(c.slackWebhook, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ text: text }),
      muteHttpExceptions: true
    });
    return;
  }
  if (c.slackBotToken) {
    UrlFetchApp.fetch('https://slack.com/api/chat.postMessage', {
      method: 'post',
      contentType: 'application/json; charset=utf-8',
      headers: { Authorization: 'Bearer ' + c.slackBotToken },
      payload: JSON.stringify({ channel: c.slackChannel, text: text }),
      muteHttpExceptions: true
    });
    return;
  }
  // どちらも未設定：通知しない（エラーにしない）
  Logger.log('Slack not configured; skip notify.');
}

/* 学生申込の通知メッセージ（安全な項目のみ） */
function slackTextForStudent_(d, studentId) {
  var lines = [
    '*新規学生申込*',
    '氏名：' + (d.fullName || '-') + (d.fullNameRoman ? ' (' + d.fullNameRoman + ')' : ''),
    '日本語レベル：' + (d.japaneseLevel || '-'),
    '第1希望職種：' + (d.preferredJob1 || '-'),
    '適性診断 第1候補：' + (d.recommendedJob1 || '-') + (d.recommendedJob1Score !== '' && d.recommendedJob1Score != null ? '（' + d.recommendedJob1Score + '点）' : ''),
    '希望渡航時期：' + (d.desiredDepartureDate || '-'),
    '面談希望：' + (d.interviewRequested || '-') + (d.interviewMethod ? ' / ' + d.interviewMethod : ''),
    '電話番号：' + (d.phone || '-'),
    'WhatsApp：' + (d.whatsapp || '-'),
    '受付日時：' + (new Date()).toLocaleString('ja-JP'),
    'Student ID：' + (studentId || '-')
  ];
  return lines.join('\n');
}

/* 企業問い合わせの通知 */
function slackTextForCompany_(d) {
  return [
    '*新規 企業問い合わせ*',
    '会社名：' + (d.companyName || '-'),
    '担当者：' + (d.contactPerson || '-'),
    '職種：' + (d.jobType || '-'),
    '採用予定人数：' + (d.headcount || '-'),
    '面接希望：' + (d.wantInterview || '-') + ' / 提携希望：' + (d.wantPartnership || '-'),
    'メール：' + (d.email || '-'),
    '受付日時：' + (new Date()).toLocaleString('ja-JP')
  ].join('\n');
}

/* お問い合わせの通知 */
function slackTextForContact_(d) {
  return [
    '*新規 お問い合わせ*',
    'お名前：' + (d.name || '-'),
    '種別：' + (d.inquiryType || '-'),
    '内容：' + ((d.message || '-').substring(0, 200)),
    '受付日時：' + (new Date()).toLocaleString('ja-JP')
  ].join('\n');
}

/* 提携・送り出し機関の連携相談の通知 */
function slackTextForPartner_(d) {
  return [
    '*新規 連携相談（提携・送り出し機関）*',
    '機関・会社名：' + (d.orgName || '-'),
    '国・地域：' + (d.country || '-'),
    '種別：' + (d.partnerType || '-'),
    '担当者：' + (d.contactPerson || '-'),
    'メール：' + (d.email || '-'),
    '受付日時：' + (new Date()).toLocaleString('ja-JP')
  ].join('\n');
}

/* テスト送信（エディタから実行） */
function testSlack() {
  notifySlack_('*テスト通知*\nSchool OS 連携（Apps Script）からのテストです。');
}
