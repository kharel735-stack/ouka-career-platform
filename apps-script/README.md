# Apps Script（School OS 連携）セットアップ

このフォルダの `.gs` は、ホームページの申込を **Google Sheets（桜花_管理表）** へ登録し、**Slack** へ通知するサーバー側コードです。ブラウザからは直接Sheetsに書けないため、この「Apps Script Web App」が橋渡しをします。

> Phase1は「方法A（Googleフォームへ遷移）」だけでも運用できます。この Apps Script は「方法B（フォームから直接送信）」を使いたいときに設定してください。

---

## 1. スプレッドシートを用意

1. 「桜花_管理表」を開く（無ければ新規作成）。
2. URL の `/d/●●●●●/edit` の `●●●●●` が **スプレッドシートID** です。控えておきます。
3. タブ名は既定で次を使います（違う場合は `Config.gs` の `SHEET_NAMES` を修正）:
   - `Student Master` / `Journey` / `Interview & Matching` / `Company Inquiries` / `Contacts`
   - タブが無ければ、初回送信時に自動作成し、1行目に見出しを書き込みます。

## 2. Apps Script プロジェクトを作る

方法1（スプレッドシートに紐づける）: スプレッドシートの「拡張機能 > Apps Script」。
方法2（単体）: <https://script.google.com> で新規プロジェクト。

作成したら、このフォルダの4ファイルの中身を貼り付けます（ファイル名も同じに）:
`Code.gs` / `Config.gs` / `SheetMapper.gs` / `SlackNotifier.gs`

## 3. スクリプト プロパティ（秘密情報）を設定

Apps Script エディタ左の「⚙ プロジェクトの設定 > スクリプト プロパティ」で追加:

| キー | 値 | 必須 |
|------|----|------|
| `SHEET_ID` | スプレッドシートID | ✅ |
| `SLACK_WEBHOOK_URL` | Slack Incoming Webhook のURL | 任意 |
| `SLACK_BOT_TOKEN` | `xoxb-…`（WebhookでなくBotを使う場合） | 任意 |
| `SLACK_CHANNEL` | Bot使用時の通知先（例 `#os-inbox`） | 任意 |
| `STUDENT_ID_PREFIX` | 学生ID接頭辞（未設定なら `OUKA`） | 任意 |

> **Slack Webhook URL / Token は公開されるJavaScript(config.js)には絶対に書きません。** 必ずここ（サーバー側）に入れます。

## 4. 動作テスト（デプロイ前）

エディタで関数を選んで「実行」:
- `testConfig` … SHEET_ID・Slack設定・タブ一覧をログ確認
- `testSlack` … Slackへテスト通知（Slack設定時）
- `testDoPost` … ダミーの学生申込を1件登録＋通知

初回実行時は権限の承認を求められます（自分のGoogleアカウントで承認）。

## 5. ウェブアプリとしてデプロイ

「デプロイ > 新しいデプロイ > 種類=ウェブアプリ」:
- 説明: `OUKA School OS connector`
- 実行するユーザー: **自分**
- アクセスできるユーザー: **全員**

発行された **`https://script.google.com/macros/s/●●●/exec`** をコピーし、
`assets/js/config.js` の `endpoints.appsScriptUrl` に貼り付けます。

> コードを直したら、再デプロイ（「デプロイを管理 > 編集 > バージョン=新しいバージョン」）しないと反映されません。

## 6. 送信データと列マッピング

- ホームページが送る項目は `../docs/data-schema.md` を参照。
- 実際の列名が違うときは `SheetMapper.gs` の各 `map` を直します（キー=見出し名）。
- 見出しがシートに無い場合、初回に自動で追加します。

## 7. よくある質問

- **CORSエラーになる**: フォームは `application/x-www-form-urlencoded`（`payload=JSON`）で送るため、通常はプリフライトされません。うまくいかない場合は、Web Appのアクセス権が「全員」か、URLが `/exec` で終わっているかを確認。
- **Slackだけ来ない**: `SLACK_WEBHOOK_URL`（または `SLACK_BOT_TOKEN`+`SLACK_CHANNEL`）を確認。Slackが失敗してもSheets登録は成功します。
- **studentIdが空**: `STUDENT_APPLICATION` のときだけ発行します。企業/問い合わせは発行しません。
