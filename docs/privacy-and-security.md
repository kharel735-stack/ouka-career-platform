# 個人情報・セキュリティ方針（実装）

## 守っていること
- **APIキー・Slack Webhook を公開JSに書かない** … `config.js` は公開情報のみ。秘密は Apps Script のスクリプトプロパティ（サーバー側）。
- **健康情報をSlackへ送らない** … `SlackNotifier.gs` は氏名・連絡先・希望職種など安全項目のみ送信。住所・健康・パスポートは送らない。
- **パスポート画像をPhase1で収集しない** … 顔写真は任意で、ファイルは**送信も保存もしない**（端末内の確認のみ）。
- **入力内容をURLに含めない** … 診断結果は `localStorage`（`ouka_assessment_v1_result`）で受け渡し。URLパラメータに個人情報を載せない。
- **個人情報同意を必須** … 診断STEP1と申込フォームで同意チェック必須。Apps Script側でも `privacyConsent==='YES'` を検証。
- **利用目的の明示** … `privacy.html` に取得情報・利用目的・第三者提供・健康情報の扱いを記載。
- **不要な個人情報を集めない** … 健康項目は任意・最小限。注意文を画面表示。
- **一時保存の説明と削除** … 診断イントロに `localStorage` 保存の説明。結果ページに「一時保存データを削除」ボタン。
- **XSS対策** … ユーザー入力は `textContent`／`escapeHtml()` で挿入。`innerHTML` は翻訳ファイルの固定文（`data-i18n-html`）のみ。
- **入力検証** … ブラウザ（必須・メール・電話）＋ Apps Script（必須・同意）で二重に検証。

## localStorage に保存する内容
| キー | 内容 | 削除方法 |
|------|------|----------|
| `ouka_assessment_v1` | 診断の途中入力（answers, step） | 診断の「最初からやり直す」／結果の削除ボタン |
| `ouka_assessment_v1_result` | 診断結果＋回答 | 結果ページの「一時保存データを削除」 |
| `ouka_lang` | 表示言語（ja/en） | ブラウザのデータ削除 |

いずれも**この端末のブラウザ内のみ**。送信は本人が同意して送信操作をしたときだけ。

## 送信の安全設計
- 送信先URL（Apps Script / Googleフォーム）が**未設定なら送信完了を表示しない**。
- Apps Scriptは `application/x-www-form-urlencoded`（`payload=JSON`）で受信し、`JSON.parse`。
- `studentId` はサーバー側で発行（ブラウザで確定しない）。
- Slack失敗時もSheets登録は成功（`safe_()` でtry/catch）。

## 運用上の注意
- 公開前に `config.js` の電話・メール・住所・地図・各フォームURLを確認。
- Apps Scriptを更新したら**再デプロイ**（新しいバージョン）で反映。
- スプレッドシートの共有範囲は必要最小限（スタッフのみ）に。
