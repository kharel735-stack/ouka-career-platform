# School OS 連携ガイド

ホームページは **School OS への「入口」** です。最初から独自DBは作らず、既存の
Google Forms / Sheets / Apps Script / Slack と連携します。

## 3つの連携方法
| 方法 | 使う場面 | 設定 |
|------|----------|------|
| **A. Googleフォームへ遷移** | まず確実に運用したい | `config.js > endpoints.*FormUrl` にフォームURL |
| **B. Apps Scriptへ直接POST** | サイト内で完結させたい | `config.js > endpoints.appsScriptUrl` にWeb App URL |
| **C. 事前入力(prefill)URL** | 入力を引き継いでフォームで送信 | `config.js > endpoints.prefill` |

Phase1は **A と C** を確実に使える構造。**B は URL を設定したときだけ**有効。
どれも未設定なら「送信完了」は出さず、「準備中／スタッフへ連絡」を表示します（架空の完了を出さない）。

## データの流れ
```
ホームページ（適性診断・申込）
   │  方法B: payload=JSON を POST
   ▼
Apps Script Web App（Code.gs）
   │  studentId を発行・バリデーション
   ├─▶ Student Master（登録）
   ├─▶ Journey（APPLICATIONステージ）
   ├─▶ Interview & Matching（面談待ち）
   └─▶ Slack #os-inbox（新規申込通知：安全項目のみ）
   ▼
スタッフが確認 → 正式な適性評価・面接へ
```

## 方法A/C のセットアップ（Googleフォーム）
1. Googleフォームを作成（学生登録／面談／企業／診断）。
2. **A**: フォームの「送信 > リンク」URLを `endpoints.studentFormUrl` 等に設定。
3. **C**: フォームの「⋮ > 事前入力したURLを取得」で各項目に仮値を入れて生成し、
   URLの `entry.XXXX` 番号を `endpoints.prefill.entryMap` に対応づけ、
   `endpoints.prefill.baseUrl` に土台URL（`.../viewform?usp=pp_url`）を設定。

## 方法B のセットアップ（Apps Script）
`../apps-script/README.md` を参照。要点:
- スクリプトプロパティに `SHEET_ID`（と任意で Slack）を設定。
- ウェブアプリとしてデプロイ（実行=自分 / アクセス=全員）。
- 発行された `/exec` URL を `endpoints.appsScriptUrl` に設定。

## 列名が違うとき
`../apps-script/SheetMapper.gs` の各 `map`（キー=シートの見出し名）を実際の列に合わせて修正。
見出しが無ければ初回送信時に自動追加します。

## Slack通知
- Webhook（`SLACK_WEBHOOK_URL`）または Bot Token（`SLACK_BOT_TOKEN`+`SLACK_CHANNEL`）。
- 送るのは安全な項目のみ（住所・健康・パスポートは送らない）。
- Slackが失敗してもSheets登録は成功します。
