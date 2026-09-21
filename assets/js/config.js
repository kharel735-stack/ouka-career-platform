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
    /* --- 連絡先（2026-09-04 代表確定）-----------------------------------
     * Mobile と WhatsApp は別の番号。ひとつにまとめないこと。
     *   Mobile   … ネパールの携帯。画面表示は 9712064098、発信は +977 付き。
     *   WhatsApp … 日本側の番号 +81-09017583522。
     *              wa.me は数字のみ・先頭0を落とした国際形式が必要なため
     *              whatsappIntl（819017583522）を別に持つ。
     *   固定電話 … 掲載しない（2026-09-04 代表判断）。main.js には
     *              [data-landline] の受け口だけ残してある。
     * ------------------------------------------------------------------ */
    phone: "9712064098",                  // Mobile（表示用）
    phoneTel: "+977-9712064098",          // Mobile（発信用・国番号つき）
    whatsapp: "+81-09017583522",          // WhatsApp（表示用）
    whatsappIntl: "819017583522",         // WhatsApp（wa.me 用・数字のみ）
    email: "abas_group@outlook.jp",  // 公式メール（2026-08-05 代表提示）
    addressJa: "Gaidakot 5, ネパール",
    addressEn: "Gaidakot 5, Nepal",
    addressNe: "गैँडाकोट ५, नेपाल",
    mapUrl: ""                       // 未設定：公開前に記入
  },

  /* --- SNS公式アカウント -------------------------------------------------
   * URLを入れたぶんだけ、フッターにアイコンが出ます（空の項目は表示されません）。
   * 検索評価にも効きます（構造化データの sameAs に自動で入るのは
   * _tools/seo.config.json の sameAs 側。両方に入れてください）。
   * -------------------------------------------------------------------- */
  social: {
    facebook:  "",                   // ★未設定。URLを入れると表示されます
    // ↓ true にすると「代表者Facebook」と表示します（代表個人のプロフィールを
    //   「会社公式」と誤表示しないための切り替え）。会社の公式ページを作ったら false に。
    facebookIsPersonal: true,
    instagram: "https://www.instagram.com/ouka_skill/",  // @ouka_skill（★URLの実在を要確認）
    tiktok:    "",                   // 例: "https://www.tiktok.com/@oukaskill"
    youtube:   "",                   // 例: "https://www.youtube.com/@oukaskill"
    line:      "",                   // 例: "https://line.me/R/ti/p/@xxxxxxx"
    whatsapp:  "auto"                // "auto" = school.whatsapp から自動生成。使わないなら ""
  },

  endpoints: {
    studentFormUrl:    "",           // 未設定：Googleフォームの共有URLを記入
    assessmentFormUrl: "",           // 未設定
    interviewFormUrl:  "",           // 未設定
    companyFormUrl:    "",           // 未設定
    // Apps Script Web App（/exec）。ここにURLが入ると、フォームは直接ここへPOSTします。
    // 2026-08-05 「桜花 ホームページ連携」プロジェクト（School OS とは別）の /exec。
    //            差し替えるときは、新しい /exec URL に置き換える。
    appsScriptUrl:     "https://script.google.com/macros/s/AKfycbwfExFWkpkGl6iQH8UTZ7ZriawY8N1E218IjllpsPDp4raRqqzZE1JxLtfcSunu1Lz9nA/exec",
    prefill: {
      baseUrl: "",
      entryMap: {}
    }
  },

  integrations: {
    slackEnabled: false,
    apiEnabled: false
  },

  /* --- アクセス解析（Google Analytics 4） ---
     ga4Id に測定ID（G-から始まる）を入れて再アップロードするだけで計測が始まります。
     空のあいだは何も読み込まないので、ページは重くなりません。
     取り方 → Googleアナリティクス → 管理 → データストリーム → ウェブ → 測定ID */
  analytics: {
    ga4Id: "",                      // 例: "G-XXXXXXXXXX"（未設定なら計測しない）
    skipLocalhost: true,            // 手元での確認は数えない
    allowGoogleSignals: false,      // 広告向け機能はオフ（学校サイトのため）
    allowAdPersonalization: false
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
    HOSPITALITY:          "hidden",
    MANUFACTURING:        "active",
    AUTO_MAINTENANCE:     "hidden",
    IT_ENGINEERING:       "hidden",
    OFFICE_INTERPRETATION:"hidden",
    BUILDING_CLEANING:    "active",
    DRIVING_TRANSPORT:    "active"
  },

  behavior: {
    defaultLang: "ne",   // ★初回訪問はネパール語で表示（日本語/英語へはヘッダーで切替）
    availableLangs: ["ja", "en", "ne"],
    assessmentVersion: "v1.1",
    applicationSource: "OUKA_WEBSITE",
    storageKey: "ouka_assessment_v1"
  }
};
