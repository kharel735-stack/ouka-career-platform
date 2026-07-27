/* ============================================================================
 * config.js  ―  桜花スキルトレーニングセンター Webプラットフォーム 実設定
 * ----------------------------------------------------------------------------
 * これは実際に読み込まれる設定ファイルです。
 * 使い方・注意は config.example.js を参照してください。
 *
 * ⚠ このファイルはブラウザで公開されます。Slack Webhook・APIキー・パスワードは
 *   ここに書かないでください（それらは apps-script 側で管理します）。
 *
 * 現状（Phase1 初期）：
 *   - 電話番号・住所は確定値を記入済み。
 *   - 各フォームURL・Apps Script URL は「未設定（空）」です。
 *     → 未設定の間は、送信ボタンは「準備中」と表示され、架空の送信完了は出ません。
 *   - 公開前に、下の endpoints の各URLを設定してください。
 * ==========================================================================*/

window.OUKA_CONFIG = {

  school: {
    nameJa: "桜花スキルトレーニングセンター",
    nameEn: "OUKA Skill Training Center",
    legalName: "Ouka Skill Training Center Pvt. Ltd.",
    phone: "9743472638",             // 携帯（代表）
    landline: "501919",              // 固定電話
    whatsapp: "9743472638",
    email: "",                       // 未設定：公開前に記入
    addressJa: "Gaidakot 5, ネパール",
    addressEn: "Gaidakot 5, Nepal",
    mapUrl: ""                       // 未設定：公開前に記入
  },

  endpoints: {
    studentFormUrl:    "",           // 未設定：Googleフォームの共有URLを記入
    assessmentFormUrl: "",           // 未設定
    interviewFormUrl:  "",           // 未設定
    companyFormUrl:    "",           // 未設定
    appsScriptUrl:     "",           // 未設定：Apps Script Web App URL（/exec）を記入すると直接POST送信が有効化
    prefill: {
      baseUrl: "",
      entryMap: {}
    }
  },

  integrations: {
    slackEnabled: false,
    apiEnabled: false
  },

  /* --- 掲載コンテンツ（訓練の様子・在籍学生・登録） --- */
  content: {
    // 在籍者数の見出し数値。null なら students-data.js の件数を表示。
    // 一覧に載せる人数より多く見せたいとき（実在籍数）だけ数値を入れる。
    enrollmentTotal: null,
    // 在籍学生の一覧（プロフィール）を公開するか
    showStudentRoster: true,
    // Googleフォト/ドライブの共有アルバム埋め込みURL（任意）。
    // 設定すると、写真をコードに足さなくてもアルバムを埋め込めます。
    galleryEmbedUrl: ""
  },

  jobStatus: {
    CONSTRUCTION:         "active",
    CAREGIVING:           "active",
    AGRICULTURE:          "active",
    FOOD_SERVICE:         "active",
    HOSPITALITY:          "active",
    MANUFACTURING:        "active",
    AUTO_MAINTENANCE:     "active",
    IT_ENGINEERING:       "active",
    OFFICE_INTERPRETATION:"active"
  },

  behavior: {
    defaultLang: "ja",
    availableLangs: ["ja", "en", "ne"],
    assessmentVersion: "v1.0",
    applicationSource: "OUKA_WEBSITE",
    storageKey: "ouka_assessment_v1"
  }
};
