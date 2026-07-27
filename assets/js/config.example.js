/* ============================================================================
 * config.example.js  ―  桜花スキルトレーニングセンター Webプラットフォーム 設定テンプレート
 * ----------------------------------------------------------------------------
 * このファイルは「見本」です。実際に使うときは、このファイルをコピーして
 *   assets/js/config.js
 * という名前で保存し、下の値を書き換えてください。
 *
 *   1. Finder（Mac）/ エクスプローラー（Windows）で config.example.js をコピー
 *   2. コピーしたファイルの名前を config.js に変更
 *   3. 下の「★ここを書き換える」の値を、実際のURL・電話番号などに変更
 *
 * ⚠ 重要な注意
 *   - このファイルは公開されます（ブラウザで誰でも中身を見られます）。
 *   - SlackのWebhook URL・APIキー・パスワードなど「秘密の情報」は
 *     絶対にここへ書かないでください。それらは Apps Script 側（サーバー側）で管理します。
 *   - ここに書いてよいのは「公開しても問題ないURL・電話番号・住所」だけです。
 * ==========================================================================*/

window.OUKA_CONFIG = {

  /* --- 学校の基本情報（公開情報のみ） ------------------------------------ */
  school: {
    // ⚠ 学校名に「＆」「and」「アンド」を絶対に入れないこと
    nameJa: "桜花スキルトレーニングセンター",
    nameEn: "OUKA Skill Training Center",
    legalName: "Ouka Skill Training Center Pvt. Ltd.",
    phone: "9743472638",              // ★ここを書き換える（携帯・代表電話）
    landline: "501919",               // ★ここを書き換える（固定電話。無ければ空 "")
    whatsapp: "9743472638",           // ★ここを書き換える（WhatsApp番号。国番号込み推奨: 977...）
    email: "",                        // ★ここを書き換える（例: info@example.com）未設定なら空のまま
    addressJa: "Gaidakot 5, ネパール",
    addressEn: "Gaidakot 5, Nepal",
    // Google マップの「共有」→「地図を埋め込む」または場所URLを貼る。未設定なら空。
    mapUrl: ""                        // ★ここを書き換える（例: https://maps.google.com/?q=...）
  },

  /* --- 外部フォーム・送信先URL --------------------------------------------
   * 未設定（空文字 "")のままにしておくと、その送信ボタンは「準備中」として扱われ、
   * 「架空の送信完了」は絶対に表示されません（安全側に倒す設計）。
   * ---------------------------------------------------------------------- */
  endpoints: {
    // 方法A: 既存のGoogleフォームへ遷移させる場合のURL
    studentFormUrl:    "",   // ★学生登録フォーム（Googleフォームの共有URL）
    assessmentFormUrl: "",   // ★適性診断フォーム
    interviewFormUrl:  "",   // ★面談申込フォーム
    companyFormUrl:    "",   // ★企業問い合わせフォーム

    // 方法B: Apps Script Web App へ直接POSTする場合のURL（/exec で終わるURL）
    //   設定されている場合のみ、ホームページのフォームから直接送信します。
    //   未設定なら方法A/Cにフォールバックします。
    appsScriptUrl:     "",   // ★Apps Script Web App URL（例: https://script.google.com/macros/s/XXXX/exec）

    // 方法C: Googleフォームの「事前入力(prefill)」を使う場合の設定
    //   事前入力URLの「entry.XXXXXXX」番号を、データ項目名に対応づけます。
    //   Googleフォームで「事前入力したリンクを取得」して番号を調べ、下に記入してください。
    //   未設定の項目は引き継がれません（空でも動作します）。
    prefill: {
      // baseUrl は Googleフォームの「.../viewform?usp=pp_url」形式のURL
      baseUrl: "",           // ★事前入力の土台URL
      // entryMap: { データ項目名: "entry.XXXXXXXXX" }
      entryMap: {
        // fullName:       "entry.111111111",
        // fullNameRoman:  "entry.222222222",
        // phone:          "entry.333333333",
        // whatsapp:       "entry.444444444",
        // email:          "entry.555555555",
        // japaneseLevel:  "entry.666666666",
        // preferredJob1:  "entry.777777777",
        // recommendedJob1:"entry.888888888"
      }
    }
  },

  /* --- 連携状態の表示（true/false）----------------------------------------
   * ここは「UI上の表示」を制御するだけです。実際のSlack送信はApps Script側で行います。
   * ---------------------------------------------------------------------- */
  integrations: {
    slackEnabled: false,   // Slack通知の運用を開始したら true（画面の案内表記が変わるだけ）
    apiEnabled: false      // 将来のAPI連携（Phase2以降）。今は false
  },

  /* --- 対象職種と表示ステータス --------------------------------------------
   * code: 職種コード（英語固定値。スコア計算・データ連携はこのコードで行う。変更しない）
   * status: "active"（現在対応中） / "preparing"（対応準備中） /
   *         "consulting"（相談受付中） / "hidden"（非表示）
   *
   * 表示名（日本語/英語/ネパール語）は translations.js 側で管理します。
   * ---------------------------------------------------------------------- */
  jobStatus: {
    CONSTRUCTION:         "active",     // 建設
    CAREGIVING:           "active",     // 介護
    AGRICULTURE:          "active",     // 農業
    FOOD_SERVICE:         "active",     // 外食
    HOSPITALITY:          "preparing",  // 宿泊
    MANUFACTURING:        "preparing",  // 製造
    AUTO_MAINTENANCE:     "preparing",  // 自動車整備
    IT_ENGINEERING:       "preparing",  // IT・エンジニア
    OFFICE_INTERPRETATION:"preparing"   // 事務・通訳
  },

  /* --- 動作設定 ----------------------------------------------------------- */
  behavior: {
    defaultLang: "ja",              // 初期表示言語: "ja" / "en"（"ne"は将来追加）
    availableLangs: ["ja", "en"],   // 切替可能な言語。ネパール語を足すときは "ne" を追加
    assessmentVersion: "v1.0",      // 適性診断のバージョン（データに記録される）
    applicationSource: "OUKA_WEBSITE", // 流入経路の固定値
    storageKey: "ouka_assessment_v1"   // localStorage のキー名
  }
};
