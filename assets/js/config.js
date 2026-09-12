/* ============================================================================
 * config.js  ―  桜花スキルトレーニングセンター Webプラットフォーム 実設定
 * ----------------------------------------------------------------------------
 * これは実際に読み込まれる設定ファイルです。
 * 使い方・注意は config.example.js を参照してください。
 *
 * ⚠ このファイルはブラウザで公開されます。Slack Webhook・APIキー・パスワードは
 *   ここに書かないでください（それらは apps-script 側で管理します）。
 * ==========================================================================*/

window.OUKA_CONFIG = {
  school: {
    nameJa: "桜花スキルトレーニングセンター",
    nameEn: "OUKA Skill Training Center",
    legalName: "Ouka Skill Training Center Pvt. Ltd.",
    phone: "9743472638",
    landline: "501919",
    whatsapp: "9743472638",
    email: "",
    addressJa: "Gaidakot 5, ネパール",
    addressEn: "Gaidakot 5, Nepal",
    mapUrl: ""
  },

  endpoints: {
    studentFormUrl: "",
    assessmentFormUrl: "",
    interviewFormUrl: "",
    companyFormUrl: "",
    appsScriptUrl: "",
    prefill: { baseUrl: "", entryMap: {} }
  },

  integrations: { slackEnabled: false, apiEnabled: false },

  content: {
    enrollmentTotal: null,
    showStudentRoster: true,
    galleryEmbedUrl: ""
  },

  jobStatus: {
    CONSTRUCTION: "active",
    CAREGIVING: "active",
    AGRICULTURE: "active",
    FOOD_SERVICE: "paused",
    HOSPITALITY: "active",
    MANUFACTURING: "active",
    AUTO_MAINTENANCE: "active",
    IT_ENGINEERING: "active",
    OFFICE_INTERPRETATION: "active"
  },

  behavior: {
    defaultLang: "ne",
    availableLangs: ["ne", "ja", "en"],
    assessmentVersion: "v1.0",
    applicationSource: "OUKA_WEBSITE",
    storageKey: "ouka_assessment_v1"
  }
};
