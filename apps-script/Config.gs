/*******************************************************************************
 * Config.gs  ―  School OS 連携の設定
 * -----------------------------------------------------------------------------
 * ★秘密情報（Slack Token / Webhook）は「コード」ではなく
 *   スクリプトプロパティ（プロジェクトの設定 > スクリプト プロパティ）に入れます。
 *   ここに直接 Webhook URL や Token を書かないでください（漏えい防止）。
 *
 * 設定するスクリプトプロパティ（キー = 値）:
 *   SHEET_ID           … 桜花_管理表（スプレッドシート）のID（URLの /d/●●●/edit の●●●）
 *   SLACK_WEBHOOK_URL  … Slack Incoming Webhook のURL（任意。使うなら設定）
 *   SLACK_BOT_TOKEN    … Slack Bot Token（xoxb-…）（Webhookの代わりに使う場合）
 *   SLACK_CHANNEL      … Bot Token 使用時の通知先チャンネル（例: #os-inbox）
 *   STUDENT_ID_PREFIX  … 学生IDの接頭辞（未設定なら "OUKA"）
 *******************************************************************************/

function CFG_() {
  var p = PropertiesService.getScriptProperties();
  return {
    sheetId:        p.getProperty('SHEET_ID') || '',
    slackWebhook:   p.getProperty('SLACK_WEBHOOK_URL') || '',
    slackBotToken:  p.getProperty('SLACK_BOT_TOKEN') || '',
    slackChannel:   p.getProperty('SLACK_CHANNEL') || '#os-inbox',
    studentIdPrefix:p.getProperty('STUDENT_ID_PREFIX') || 'OUKA'
  };
}

/* タブ（シート）名。実際の桜花_管理表のタブ名に合わせて変更してください。 */
var SHEET_NAMES = {
  studentMaster:      'Student Master',
  journey:            'Journey',
  interviewMatching:  'Interview & Matching',
  companyInquiry:     'Company Inquiries',
  contact:            'Contacts',
  partnerInquiry:     'Partner Inquiries'
};

/* 動作テスト用：設定が正しいか確認（エディタから実行してログを見る） */
function testConfig() {
  var c = CFG_();
  Logger.log('SHEET_ID set? ' + (!!c.sheetId));
  Logger.log('Slack webhook set? ' + (!!c.slackWebhook));
  Logger.log('Slack bot token set? ' + (!!c.slackBotToken));
  if (c.sheetId) {
    var ss = SpreadsheetApp.openById(c.sheetId);
    Logger.log('Spreadsheet name: ' + ss.getName());
    ss.getSheets().forEach(function (s) { Logger.log(' - tab: ' + s.getName()); });
  }
}
