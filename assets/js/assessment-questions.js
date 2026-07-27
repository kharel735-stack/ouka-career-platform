/* ============================================================================
 * assessment-questions.js  ―  適性診断の質問定義（7ステップ）
 * ----------------------------------------------------------------------------
 * ・各質問は「id（変えない固定値）」「type」「多言語ラベル」を持ちます。
 * ・スコア計算（assessment-scoring.js）は、この "id" と選択肢の "value" を
 *   参照します。表示テキスト（label）を変えてもスコアは壊れません。
 *   → 質問文・言い回しは自由に直せます。id と value は変えないでください。
 *
 * type の種類：
 *   text / roman / textarea / tel / email / date … 入力欄
 *   number …… 数値（age は自動計算のため readonly）
 *   radio ……… 大きなボタンの単一選択（options 必須）
 *   select …… プルダウン単一選択（options 必須）
 *   checkbox … 複数選択（options 必須）
 *   likert …… 5段階（1〜5）。options 不要（共通の5段階を自動表示）
 *   jobselect  職種プルダウン（config の jobStatus と scoring の職種名から自動生成）
 *   consent … 同意チェックボックス（required にできる）
 *   file …… 顔写真（Phase1は任意・送信しない。ローカル確認用のみ）
 *
 * ラベルに ne(ネパール語)を足すときは、各 {ja, en} に ne を追記してください。
 * ==========================================================================*/

/* よく使う選択肢セット（使い回し用） */
var OUKA_OPT = {
  yesSomeNo: [
    { value: "YES",  label: { ja: "はい / できる",       en: "Yes / can" } },
    { value: "SOME", label: { ja: "少しできる",           en: "A little" } },
    { value: "NO",   label: { ja: "いいえ / できない",   en: "No / cannot" } }
  ],
  yesNo: [
    { value: "YES", label: { ja: "はい", en: "Yes" } },
    { value: "NO",  label: { ja: "いいえ", en: "No" } }
  ],
  yesNoUnsure: [
    { value: "YES",    label: { ja: "はい",         en: "Yes" } },
    { value: "NO",     label: { ja: "いいえ",       en: "No" } },
    { value: "UNSURE", label: { ja: "わからない",   en: "Not sure" } }
  ]
};

window.OUKA_QUESTIONS = {

  /* likert の5段階ラベル（共通） */
  likertScale: [
    { value: 1, label: { ja: "全く当てはまらない",   en: "Strongly disagree" } },
    { value: 2, label: { ja: "あまり当てはまらない", en: "Disagree" } },
    { value: 3, label: { ja: "どちらともいえない",   en: "Neutral" } },
    { value: 4, label: { ja: "当てはまる",           en: "Agree" } },
    { value: 5, label: { ja: "とても当てはまる",     en: "Strongly agree" } }
  ],

  steps: [

    /* ============ STEP 1: 基本情報 ============ */
    {
      id: "basic",
      titleKey: "assessment.steps.basic",
      fields: [
        { id: "fullName",      type: "text",   required: true,  label: { ja: "氏名", en: "Full name" } },
        { id: "fullNameRoman", type: "roman",  required: true,  label: { ja: "氏名（ローマ字）", en: "Full name (Roman letters)" },
          help: { ja: "パスポートと同じつづりで（例：SITA SHARMA）", en: "As in passport (e.g., SITA SHARMA)" } },
        { id: "dateOfBirth",   type: "date",   required: true,  label: { ja: "生年月日", en: "Date of birth" } },
        { id: "age",           type: "number", required: false, readonly: true, label: { ja: "年齢（自動計算）", en: "Age (auto)" } },
        { id: "gender",        type: "radio",  required: true,  label: { ja: "性別", en: "Gender" },
          options: [
            { value: "MALE",   label: { ja: "男性", en: "Male" } },
            { value: "FEMALE", label: { ja: "女性", en: "Female" } },
            { value: "OTHER",  label: { ja: "その他 / 回答しない", en: "Other / prefer not to say" } }
          ] },
        { id: "nationality",   type: "text",   required: true,  label: { ja: "国籍", en: "Nationality" }, defaultValue: "ネパール" },
        { id: "address",       type: "text",   required: false, label: { ja: "現住所", en: "Current address" } },
        { id: "phone",         type: "tel",    required: true,  label: { ja: "電話番号", en: "Phone number" } },
        { id: "whatsapp",      type: "tel",    required: false, label: { ja: "WhatsApp番号", en: "WhatsApp number" } },
        { id: "email",         type: "email",  required: false, label: { ja: "メールアドレス", en: "Email" } },
        { id: "emergencyContact", type: "text", required: false, label: { ja: "緊急連絡先", en: "Emergency contact" } },
        { id: "guardianName",  type: "text",   required: false, label: { ja: "保護者氏名", en: "Guardian name" } },
        { id: "guardianPhone", type: "tel",    required: false, label: { ja: "保護者電話番号", en: "Guardian phone" } },
        { id: "passportStatus", type: "radio", required: false, label: { ja: "パスポートの有無", en: "Passport" },
          options: [
            { value: "HAVE",     label: { ja: "持っている",   en: "Have one" } },
            { value: "APPLYING", label: { ja: "申請中",       en: "Applying" } },
            { value: "NONE",     label: { ja: "まだ無い",     en: "Not yet" } }
          ] },
        { id: "maritalStatus", type: "radio",  required: false, label: { ja: "結婚状況", en: "Marital status" },
          options: [
            { value: "SINGLE",  label: { ja: "未婚", en: "Single" } },
            { value: "MARRIED", label: { ja: "既婚", en: "Married" } },
            { value: "OTHER",   label: { ja: "その他", en: "Other" } }
          ] },
        { id: "photo", type: "file", required: false, label: { ja: "顔写真（任意）", en: "Photo (optional)" },
          help: { ja: "Phase1では任意です。この写真は送信されず、この端末の表示のみに使われます。", en: "Optional in Phase 1. Not uploaded; used only for on-device preview." } },
        { id: "privacyConsent", type: "consent", required: true, label: { ja: "個人情報の取扱いに同意します", en: "I agree to the handling of personal information" },
          linkKey: "footer.privacy" }
      ]
    },

    /* ============ STEP 2: 日本語・学習状況 ============ */
    {
      id: "japanese",
      titleKey: "assessment.steps.japanese",
      fields: [
        { id: "japaneseLevel", type: "radio", required: true, label: { ja: "現在の日本語レベル", en: "Current Japanese level" },
          options: [
            { value: "NONE",     label: { ja: "未経験",         en: "None" } },
            { value: "HIRAGANA", label: { ja: "ひらがな学習中", en: "Learning hiragana" } },
            { value: "N5_LEVEL", label: { ja: "N5相当",         en: "Around N5" } },
            { value: "N5_PASS",  label: { ja: "N5取得",         en: "N5 passed" } },
            { value: "N4_LEVEL", label: { ja: "N4相当",         en: "Around N4" } },
            { value: "N4_PASS",  label: { ja: "N4取得",         en: "N4 passed" } },
            { value: "N3_PLUS",  label: { ja: "N3以上",         en: "N3 or above" } }
          ] },
        { id: "studyPeriod", type: "select", required: false, label: { ja: "日本語学習期間", en: "How long studying Japanese" },
          options: [
            { value: "NONE",  label: { ja: "なし",        en: "None" } },
            { value: "U6M",   label: { ja: "6か月未満",   en: "Under 6 months" } },
            { value: "6_12M", label: { ja: "6か月〜1年",  en: "6–12 months" } },
            { value: "1_2Y",  label: { ja: "1〜2年",      en: "1–2 years" } },
            { value: "O2Y",   label: { ja: "2年以上",     en: "Over 2 years" } }
          ] },
        { id: "jlptStatus", type: "select", required: false, label: { ja: "JLPT取得状況", en: "JLPT status" },
          options: [
            { value: "NONE", label: { ja: "なし", en: "None" } },
            { value: "N5",   label: { ja: "N5",   en: "N5" } },
            { value: "N4",   label: { ja: "N4",   en: "N4" } },
            { value: "N3",   label: { ja: "N3",   en: "N3" } },
            { value: "N2",   label: { ja: "N2",   en: "N2" } },
            { value: "N1",   label: { ja: "N1",   en: "N1" } }
          ] },
        { id: "jftStatus", type: "select", required: false, label: { ja: "JFT-Basic取得状況", en: "JFT-Basic status" },
          options: [
            { value: "NONE",     label: { ja: "なし",     en: "None" } },
            { value: "STUDYING", label: { ja: "勉強中",   en: "Studying" } },
            { value: "PASSED",   label: { ja: "合格",     en: "Passed" } }
          ] },
        { id: "canReadHiragana", type: "radio", required: false, label: { ja: "ひらがなが読めますか", en: "Can you read hiragana?" }, options: OUKA_OPT.yesSomeNo },
        { id: "canReadKatakana", type: "radio", required: false, label: { ja: "カタカナが読めますか", en: "Can you read katakana?" }, options: OUKA_OPT.yesSomeNo },
        { id: "canConverse",     type: "radio", required: false, label: { ja: "簡単な会話ができますか", en: "Can you hold a simple conversation?" }, options: OUKA_OPT.yesSomeNo },
        { id: "canIntroduce",    type: "radio", required: false, label: { ja: "日本語で自己紹介できますか", en: "Can you introduce yourself in Japanese?" }, options: OUKA_OPT.yesSomeNo },
        { id: "studyHoursPerDay", type: "select", required: false, label: { ja: "1日に勉強できる時間", en: "Study hours per day" },
          options: [
            { value: "U1", label: { ja: "1時間未満", en: "Under 1h" } },
            { value: "1_2", label: { ja: "1〜2時間", en: "1–2h" } },
            { value: "2_3", label: { ja: "2〜3時間", en: "2–3h" } },
            { value: "O3",  label: { ja: "3時間以上", en: "Over 3h" } }
          ] },
        { id: "studyDaysPerWeek", type: "select", required: false, label: { ja: "週に勉強できる日数", en: "Study days per week" },
          options: [
            { value: "1_2", label: { ja: "1〜2日", en: "1–2 days" } },
            { value: "3_4", label: { ja: "3〜4日", en: "3–4 days" } },
            { value: "5_6", label: { ja: "5〜6日", en: "5–6 days" } },
            { value: "7",   label: { ja: "毎日",   en: "Every day" } }
          ] },
        { id: "canHomeworkDaily", type: "radio", required: false, label: { ja: "宿題を毎日できますか", en: "Can you do homework daily?" }, options: OUKA_OPT.yesNo },
        { id: "canOnline",        type: "radio", required: false, label: { ja: "オンライン授業を受けられますか", en: "Can you attend online classes?" }, options: OUKA_OPT.yesNo },
        { id: "hasSmartphone",    type: "radio", required: false, label: { ja: "スマートフォンを持っていますか", en: "Do you have a smartphone?" }, options: OUKA_OPT.yesNo },
        { id: "hasInternet",      type: "radio", required: false, label: { ja: "インターネット環境がありますか", en: "Do you have internet access?" }, options: OUKA_OPT.yesNo }
      ]
    },

    /* ============ STEP 3: 学歴・職歴・技能 ============ */
    {
      id: "experience",
      titleKey: "assessment.steps.experience",
      fields: [
        { id: "education", type: "select", required: false, label: { ja: "最終学歴", en: "Highest education" },
          options: [
            { value: "LOWER_SEC", label: { ja: "中学卒",              en: "Lower secondary" } },
            { value: "UPPER_SEC", label: { ja: "高校卒（+2 / SLC）",  en: "Upper secondary (+2 / SLC)" } },
            { value: "DIPLOMA",   label: { ja: "専門・ディプロマ",    en: "Diploma / vocational" } },
            { value: "BACHELOR",  label: { ja: "学士（大学）",        en: "Bachelor's" } },
            { value: "MASTER",    label: { ja: "修士以上",            en: "Master's or above" } },
            { value: "OTHER",     label: { ja: "その他",              en: "Other" } }
          ] },
        { id: "major",          type: "text",   required: false, label: { ja: "専攻", en: "Major / field" } },
        { id: "graduationStatus", type: "radio", required: false, label: { ja: "卒業状況", en: "Graduation status" },
          options: [
            { value: "GRADUATED", label: { ja: "卒業",   en: "Graduated" } },
            { value: "ENROLLED",  label: { ja: "在学中", en: "Enrolled" } },
            { value: "LEFT",      label: { ja: "中退",   en: "Left before finishing" } }
          ] },
        { id: "currentJob",     type: "text",     required: false, label: { ja: "現在の仕事", en: "Current job" } },
        { id: "pastJobs",       type: "textarea", required: false, label: { ja: "過去の職歴", en: "Past work history" } },
        { id: "experienceYears", type: "select", required: false, label: { ja: "職務経験年数", en: "Years of work experience" },
          options: [
            { value: "NONE", label: { ja: "なし",     en: "None" } },
            { value: "U1",   label: { ja: "1年未満",  en: "Under 1y" } },
            { value: "1_3",  label: { ja: "1〜3年",   en: "1–3y" } },
            { value: "3_5",  label: { ja: "3〜5年",   en: "3–5y" } },
            { value: "O5",   label: { ja: "5年以上",  en: "Over 5y" } }
          ] },
        { id: "expConstruction",  type: "radio", required: false, label: { ja: "建設の経験", en: "Construction experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "expCaregiving",    type: "radio", required: false, label: { ja: "介護の経験", en: "Caregiving experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "expAgriculture",   type: "radio", required: false, label: { ja: "農業の経験", en: "Agriculture experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "expFood",          type: "radio", required: false, label: { ja: "飲食の経験", en: "Food service experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "expManufacturing", type: "radio", required: false, label: { ja: "製造の経験", en: "Manufacturing experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "expDriving",       type: "radio", required: false, label: { ja: "運転の経験（免許）", en: "Driving experience (license)" }, options: OUKA_OPT.yesSomeNo },
        { id: "expPC",            type: "radio", required: false, label: { ja: "パソコンの経験", en: "PC experience" }, options: OUKA_OPT.yesSomeNo },
        { id: "qualifications",   type: "textarea", required: false, label: { ja: "資格（あれば）", en: "Qualifications (if any)" } },
        { id: "goodTasks",        type: "textarea", required: false, label: { ja: "得意な作業", en: "Tasks you are good at" } },
        { id: "weakTasks",        type: "textarea", required: false, label: { ja: "苦手な作業", en: "Tasks you find hard" } },
        { id: "expTeam",      type: "radio", required: false, label: { ja: "チームで働いた経験", en: "Teamwork experience" }, options: OUKA_OPT.yesNo },
        { id: "expOutdoor",   type: "radio", required: false, label: { ja: "屋外作業の経験", en: "Outdoor work experience" }, options: OUKA_OPT.yesNo },
        { id: "expNightShift", type: "radio", required: false, label: { ja: "夜勤の経験", en: "Night-shift experience" }, options: OUKA_OPT.yesNo },
        { id: "expStanding",  type: "radio", required: false, label: { ja: "長時間立って働いた経験", en: "Long standing-work experience" }, options: OUKA_OPT.yesNo }
      ]
    },

    /* ============ STEP 4: 性格・仕事の進め方（likert 30問） ============ */
    {
      id: "personality",
      titleKey: "assessment.steps.personality",
      likertHintKey: "assessment.likertHint",
      fields: [
        { id: "likeActive",     type: "likert", label: { ja: "体を動かす仕事が好き", en: "I like physically active work" } },
        { id: "outdoorOk",      type: "likert", label: { ja: "屋外で働くことに抵抗がない", en: "I don't mind working outdoors" } },
        { id: "tempOk",         type: "likert", label: { ja: "暑い場所や寒い場所でも働ける", en: "I can work in hot or cold places" } },
        { id: "heightOk",       type: "likert", label: { ja: "高い場所での作業に抵抗が少ない", en: "I'm fairly comfortable working at heights" } },
        { id: "likeTools",      type: "likert", label: { ja: "道具や機械を使うことが好き", en: "I like using tools and machines" } },
        { id: "repetitiveOk",   type: "likert", label: { ja: "同じ作業を正確に続けられる", en: "I can repeat the same task accurately" } },
        { id: "detailWork",     type: "likert", label: { ja: "細かい作業が得意", en: "I'm good at detailed work" } },
        { id: "likeCare",       type: "likert", label: { ja: "人の世話をすることが好き", en: "I like taking care of people" } },
        { id: "elderlyOk",      type: "likert", label: { ja: "高齢者と話すことに抵抗がない", en: "I'm comfortable talking with older people" } },
        { id: "listenCalm",     type: "likert", label: { ja: "人の話を落ち着いて聞ける", en: "I can listen to others calmly" } },
        { id: "dirtyOk",        type: "likert", label: { ja: "汚れる仕事にも対応できる", en: "I can handle dirty work" } },
        { id: "likeNature",     type: "likert", label: { ja: "動物や植物が好き", en: "I like animals and plants" } },
        { id: "earlyOk",        type: "likert", label: { ja: "早朝勤務に対応できる", en: "I can work early mornings" } },
        { id: "likeCookServe",  type: "likert", label: { ja: "料理や接客が好き", en: "I like cooking and serving customers" } },
        { id: "talkStrangers",  type: "likert", label: { ja: "知らない人とも話せる", en: "I can talk with people I don't know" } },
        { id: "busyCalm",       type: "likert", label: { ja: "忙しい時間でも落ち着いて動ける", en: "I stay calm when it's busy" } },
        { id: "teamwork",       type: "likert", label: { ja: "チームで協力できる", en: "I can cooperate in a team" } },
        { id: "followOrders",   type: "likert", label: { ja: "上司の指示を守れる", en: "I can follow a supervisor's instructions" } },
        { id: "punctual",       type: "likert", label: { ja: "時間を守れる", en: "I keep time / am punctual" } },
        { id: "askQuestions",   type: "likert", label: { ja: "分からないことを質問できる", en: "I can ask when I don't understand" } },
        { id: "reportFail",     type: "likert", label: { ja: "失敗したときに報告できる", en: "I can report when I make a mistake" } },
        { id: "studyDaily",     type: "likert", label: { ja: "毎日勉強を続けられる", en: "I can keep studying every day" } },
        { id: "followRules",    type: "likert", label: { ja: "日本のルールを守る意思がある", en: "I intend to follow the rules in Japan" } },
        { id: "liveApart",      type: "likert", label: { ja: "家族と離れて生活できる", en: "I can live apart from my family" } },
        { id: "workLong3y",     type: "likert", label: { ja: "3年以上日本で働きたい", en: "I want to work in Japan for 3+ years" } },
        { id: "valueSkill",     type: "likert", label: { ja: "収入だけでなく技能習得も大切だと思う", en: "Not just income — gaining skills matters to me" } },
        { id: "interestPC",     type: "likert", label: { ja: "パソコンを使う仕事に興味がある", en: "I'm interested in computer-based work" } },
        { id: "likeLogic",      type: "likert", label: { ja: "計算や論理的に考えることが好き", en: "I like calculation and logical thinking" } },
        { id: "readComprehend", type: "likert", label: { ja: "文章を読んで理解することが得意", en: "I'm good at reading and understanding text" } },
        { id: "likeNewTech",    type: "likert", label: { ja: "新しい技術を学ぶことが好き", en: "I like learning new technologies" } }
      ]
    },

    /* ============ STEP 5: 体力・勤務環境（自己申告・必須最小限） ============ */
    {
      id: "physical",
      titleKey: "assessment.steps.physical",
      noticeKey: "disclaimer.health",
      fields: [
        { id: "canStandLong",  type: "radio", required: false, label: { ja: "長時間立っていられる", en: "I can stand for long periods" }, options: OUKA_OPT.yesSomeNo },
        { id: "canLiftHeavy",  type: "radio", required: false, label: { ja: "重い物を持つ仕事に対応できる", en: "I can handle heavy-lifting work" }, options: OUKA_OPT.yesSomeNo },
        { id: "canOutdoorWork", type: "radio", required: false, label: { ja: "屋外作業に対応できる", en: "I can handle outdoor work" }, options: OUKA_OPT.yesSomeNo },
        { id: "canNightShift", type: "radio", required: false, label: { ja: "夜勤に対応できる", en: "I can handle night shifts" }, options: OUKA_OPT.yesSomeNo },
        { id: "heightResist",  type: "radio", required: false, label: { ja: "高所作業への抵抗", en: "Comfort with working at heights" },
          options: [
            { value: "YES",  label: { ja: "抵抗はない",   en: "Comfortable" } },
            { value: "SOME", label: { ja: "少し不安がある", en: "A little uneasy" } },
            { value: "NO",   label: { ja: "とても不安がある", en: "Very uneasy" } }
          ] },
        { id: "bloodResist",   type: "radio", required: false, label: { ja: "血を見ることへの抵抗", en: "Comfort with seeing blood" },
          options: [
            { value: "YES",  label: { ja: "抵抗はない",   en: "Comfortable" } },
            { value: "SOME", label: { ja: "少し苦手",     en: "A little" } },
            { value: "NO",   label: { ja: "とても苦手",   en: "Very uncomfortable" } }
          ] },
        { id: "backKneeConcern", type: "radio", required: false, label: { ja: "腰や膝に不安がありますか（任意）", en: "Any back or knee concerns? (optional)" }, options: OUKA_OPT.yesNoUnsure },
        { id: "medication",      type: "radio", required: false, label: { ja: "定期的な治療や服薬がありますか（任意）", en: "Ongoing treatment or medication? (optional)" }, options: OUKA_OPT.yesNoUnsure },
        { id: "healthNote",      type: "textarea", required: false, label: { ja: "健康面で仕事上配慮してほしいこと（任意）", en: "Health matters you'd like considered at work (optional)" } }
      ]
    },

    /* ============ STEP 6: 希望条件 ============ */
    {
      id: "preference",
      titleKey: "assessment.steps.preference",
      fields: [
        { id: "preferredJob1", type: "jobselect", required: false, label: { ja: "希望職種（第1希望）", en: "Preferred job (1st)" } },
        { id: "preferredJob2", type: "jobselect", required: false, label: { ja: "希望職種（第2希望）", en: "Preferred job (2nd)" } },
        { id: "preferredJob3", type: "jobselect", required: false, label: { ja: "希望職種（第3希望）", en: "Preferred job (3rd)" } },
        { id: "preferredLocation", type: "text", required: false, label: { ja: "希望勤務地（あれば）", en: "Preferred work location (if any)" } },
        { id: "cityOrRural", type: "radio", required: false, label: { ja: "都会と地方のどちらを希望しますか", en: "City or rural?" },
          options: [
            { value: "CITY",   label: { ja: "都会",       en: "City" } },
            { value: "RURAL",  label: { ja: "地方",       en: "Rural" } },
            { value: "EITHER", label: { ja: "どちらでも", en: "Either" } }
          ] },
        { id: "desiredSalary", type: "select", required: false, label: { ja: "希望する月収（参考）", en: "Desired monthly income (reference)" },
          help: { ja: "※希望月収だけで職種は判定しません。", en: "Note: occupation is not decided by desired income alone." },
          options: [
            { value: "ANY",     label: { ja: "こだわらない",   en: "No preference" } },
            { value: "U18",     label: { ja: "18万円未満",     en: "Under 180k JPY" } },
            { value: "18_25",   label: { ja: "18〜25万円",     en: "180k–250k JPY" } },
            { value: "25_30",   label: { ja: "25〜30万円",     en: "250k–300k JPY" } },
            { value: "O30",     label: { ja: "30万円以上",     en: "Over 300k JPY" } }
          ] },
        { id: "canNightShiftPref", type: "radio", required: false, label: { ja: "夜勤は可能ですか", en: "Night shifts possible?" }, options: OUKA_OPT.yesNo },
        { id: "canOvertime",       type: "radio", required: false, label: { ja: "残業は可能ですか", en: "Overtime possible?" }, options: OUKA_OPT.yesNo },
        { id: "canDorm",           type: "radio", required: false, label: { ja: "寮生活は可能ですか", en: "Dormitory living possible?" }, options: OUKA_OPT.yesNo },
        { id: "canSharedLiving",   type: "radio", required: false, label: { ja: "共同生活は可能ですか", en: "Shared living possible?" }, options: OUKA_OPT.yesNo },
        { id: "desiredDepartureDate", type: "select", required: false, label: { ja: "日本へ行きたい時期", en: "When you'd like to go to Japan" },
          options: [
            { value: "ASAP",    label: { ja: "できるだけ早く", en: "As soon as possible" } },
            { value: "6M",      label: { ja: "6か月以内",     en: "Within 6 months" } },
            { value: "1Y",      label: { ja: "1年以内",       en: "Within 1 year" } },
            { value: "OVER1Y",  label: { ja: "1年より先",     en: "More than a year" } },
            { value: "UNDECIDED", label: { ja: "未定",        en: "Undecided" } }
          ] },
        { id: "desiredWorkYears", type: "select", required: false, label: { ja: "日本で働きたい年数", en: "Years you want to work in Japan" },
          options: [
            { value: "1_3", label: { ja: "1〜3年",  en: "1–3 years" } },
            { value: "3_5", label: { ja: "3〜5年",  en: "3–5 years" } },
            { value: "O5",  label: { ja: "5年以上", en: "Over 5 years" } }
          ] },
        { id: "futureGoal",  type: "textarea", required: false, label: { ja: "将来の目標", en: "Future goal" } },
        { id: "familyConsent", type: "radio", required: false, label: { ja: "家族の同意はありますか", en: "Do you have your family's consent?" },
          options: [
            { value: "YES",        label: { ja: "はい",       en: "Yes" } },
            { value: "DISCUSSING", label: { ja: "相談中",     en: "Discussing" } },
            { value: "NO",         label: { ja: "いいえ",     en: "No" } }
          ] },
        { id: "needTuitionConsult", type: "radio", required: false, label: { ja: "学費の支払相談が必要ですか", en: "Do you need to discuss tuition payment?" }, options: OUKA_OPT.yesNo },
        { id: "interviewRequested", type: "radio", required: false, label: { ja: "無料面談を希望しますか", en: "Would you like a free consultation?" }, options: OUKA_OPT.yesNo }
      ]
    },

    /* ============ STEP 7: 確認・送信 ============ */
    {
      id: "confirm",
      titleKey: "assessment.steps.confirm",
      isConfirm: true,
      fields: []
    }
  ]
};
