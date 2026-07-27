/* ============================================================================
 * translations.js  ―  サイト共通UI文言の多言語辞書（i18n）
 * ----------------------------------------------------------------------------
 * ・ここには「サイト共通のUI文言」（ナビ・見出し・ボタン・FAQ・フッター・
 *   エラーメッセージ・注意文など）を入れます。
 * ・診断の「質問文・選択肢」は assessment-questions.js に、
 *   「職種の結果メッセージ」は assessment-scoring.js に、それぞれ多言語で入れます。
 *   （スコア計算のコード＝英語固定値と、表示テキストを分離するため）
 *
 * ★ネパール語を追加するとき：
 *   1) 下の OUKA_I18N に "ne": { ... } ブロックを ja と同じキー構成で追加
 *   2) config.js の behavior.availableLangs に "ne" を足す
 *   （キーが無い言語は自動的に ja へフォールバックします）
 *
 * 使い方（main.js が提供）: t("nav.about") のようにドットで参照します。
 * ==========================================================================*/

window.OUKA_I18N = {

  /* ==================== 日本語 ==================== */
  ja: {
    common: {
      langName: "日本語",
      free: "無料",
      required: "必須",
      optional: "任意",
      next: "次へ",
      back: "戻る",
      submit: "送信する",
      confirm: "確認する",
      loading: "読み込み中…",
      selectPlaceholder: "選択してください",
      yes: "はい",
      no: "いいえ",
      unknown: "わからない",
      close: "閉じる",
      print: "印刷する",
      restart: "最初からやり直す",
      startAssessment: "無料適性診断を受ける",
      consultNow: "入学相談をする",
      forCompanies: "企業の方はこちら",
      phone: "電話",
      whatsapp: "WhatsApp",
      email: "メール",
      address: "住所",
      preparingNotice: "現在、オンライン送信の準備中です。スタッフへ直接お問い合わせください。",
      contactStaff: "スタッフに連絡する"
    },

    nav: {
      about: "学校について",
      education: "教育内容",
      visa: "ビザ・在留資格",
      courses: "コース",
      teachers: "先生紹介",
      gallery: "訓練の様子",
      students: "在籍学生",
      registration: "登録・認可",
      partners: "提携・送り出し機関",
      assessment: "無料適性診断",
      flow: "入学の流れ",
      forCompanies: "企業の方へ",
      contact: "お問い合わせ",
      faq: "よくある質問",
      lang: "言語",
      menu: "メニュー"
    },

    hero: {
      title1: "日本で働く夢を、",
      title2: "現実に変える。",
      lead: "桜花スキルトレーニングセンターは、日本語だけを教える学校ではありません。仕事の基本・報連相・面接・日本での生活と職場のルールまでを、現場のリズムで一体的に学びます。ネパール・ガイダコットから、日本企業で長く信頼される即戦力（Work to Japan）を育て、渡日後10年までを見据えて一人ひとりに伴走します。",
      tagline: "私たちは日本語を教える学校ではありません。日本企業で長く活躍できる人材を育てる教育機関です。"
    },

    assessIntro: {
      heading: "あなたに向いている日本の仕事を確認する",
      lead: "日本語力、経験、性格、体力、働き方の希望などを回答し、向いている可能性のある職種を確認できます。",
      point1: "所要時間 約5〜10分",
      point2: "スマートフォン対応",
      point3: "診断結果をすぐ表示",
      point4: "診断後に無料相談が可能",
      point5: "結果は参考情報です",
      cta: "無料適性診断を始める"
    },

    about: {
      heading: "学校について",
      body: "桜花スキルトレーニングセンター（OUKA Skill Training Center）は、ネパール・ガイダコットにある人材育成機関です。私たちは「日本語を教える学校」ではなく、「日本企業で長く活躍できる人材を育てる教育機関」を掲げています。日本語教育に加えて、仕事の基本・報連相・面接・日本での生活と職場のルールまでを一体で学び、教室の中だけでなく現場のリズム（時間厳守・挨拶・清掃・安全・チーム作業）で身につけます。企業さまには「N4です」ではなく「建設適性◯点」のように、人物を数字で見える化してご紹介します。就職・ビザ・渡日・永住などを保証するものではなく、それぞれの目標に向けて条件を満たせるよう、入学から渡日後までていねいに相談・支援を続けます。"
    },

    pillars: {
      heading: "教育の3本柱",
      p1Title: "日本語教育",
      p1Body: "ひらがな・カタカナから、仕事で使う会話・報連相、面接で話す日本語まで段階的に学びます。あいさつ・数字・安全のことばなど、現場で本当に使う日本語を最優先にし、JLPT・JFT-Basic の対策も行います。",
      p2Title: "職業・専門教育",
      p2Body: "建設を中心に、職種ごとの基礎知識と、現場で必要な作業・道具・機械・安全のルールを学びます。座学だけで終わらせず、実践を通して体で覚えます。",
      p3Title: "日本生活・職場ルール教育",
      p3Body: "時間厳守・あいさつ・返事・清掃・整理整頓・報連相・安全（KY・指差呼称）など、日本の職場で信頼される習慣を、毎日の訓練の中で当たり前になるまで身につけます。",
      more: "くわしく見る"
    },

    strengths: {
      heading: "桜花の強み",
      s1: "日本就職に特化 ― 一般的な語学学校ではなく、日本の建設現場などで即戦力になるための教育に絞っています。",
      s2: "職業適性を数字で見える化 ― 「N4です」ではなく「建設適性◯点」のように、企業が判断しやすい形で人物を評価します（JRS）。",
      s3: "一人ひとりの個別学習計画 ― 日本語力・経験・体力・希望に合わせ、到達目標と学習の進め方を設計します。",
      s4: "実践的な面接指導 ― 日本企業の面接を想定し、話し方・受け答え・マナーを繰り返し練習します。",
      s5: "日本生活・職場ルール研修 ― 時間厳守・挨拶・清掃・報連相・安全を、現場のリズムで習慣になるまで訓練します。",
      s6: "入学から就職までの進捗管理 ― 出席・学習・面接・書類の状況を記録し、渡日まで並走します。",
      s7: "卒業後も10年伴走 ― 渡日後も相談・支援を続け、日本で長く活躍できるよう見守ります。"
    },

    jobs: {
      heading: "対応職種",
      lead: "現在ご相談いただける職種です。桜花は建設分野（電気・土木・鳶・左官・解体・配管・揚重・総合建設 など）を中心に、介護・農業・外食・製造・自動車整備・宿泊・IT・通訳 まで幅広く対応します。どの職種も、まずは無料適性診断と面談でご相談ください。",
      statusActive: "現在対応中",
      statusPreparing: "対応準備中",
      statusConsulting: "相談受付中"
    },

    flow: {
      heading: "入学から日本就職までの流れ",
      m1: "STEP 0", step1: "無料適性診断・お問い合わせ", d1: "スマホで5〜10分。まずは向いている仕事の方向性を確認します。",
      m2: "0か月目", step2: "面談・入学相談", d2: "日本語力・経験・希望・費用を確認し、学習の計画を一緒に決めます。",
      m3: "入学時", step3: "入学・レベルチェック", d3: "現在の日本語・体力・適性をチェックし、一人ひとりの到達目標を設定します。",
      m4: "1〜6か月", step4: "日本語＋職業＋生活の教育", d4: "週5日・9:00〜16:30。現場のリズムで、日本語・現場訓練・職場ルールを一体で学びます。",
      m5: "5〜6か月", step5: "適性評価・面接練習", d5: "「建設適性◯点」のように人物を評価し、日本企業の面接を想定して繰り返し練習します。",
      m6: "6〜8か月", step6: "企業面接・マッチング", d6: "希望と適性に合う日本企業と面接。内定後、在留資格・ビザの手続きへ進みます。",
      m7: "8〜12か月", step7: "渡日準備・出発", d7: "渡航・生活の準備を整え、日本へ出発。渡日直前まで無料で補習します。",
      m8: "渡日後〜10年", step8: "就職後も相談・支援", d8: "日本で長く活躍できるよう、渡日後も相談・支援を続けます。",
      total: "入学から渡日まで、目安 約8〜12か月",
      note: "各段階の進み方は、本人の日本語力・準備状況・試験結果・企業選考などにより異なります。就職・渡日・ビザ取得を保証するものではありません。"
    },

    tuition: {
      heading: "学費（費用）",
      lead: "学費は明確です。入学時に一括前払い（返金なし）。分割や支払い時期は面談でご相談いただけます。渡日前の補習・再受講・面接練習は、追加費用なくお付き合いします。",
      totalLabel: "学費 総額",
      totalNote: "入学時に一括前払い（返金なし）",
      breakdownCaption: "料金の条件",
      r1: "学費", r1n: "全コース共通 ¥200,000",
      r2: "支払い", r2n: "入学時に一括前払い",
      r3: "返金", r3n: "なし",
      r4: "N4合格者", r4n: "同額（割引はありません）",
      r5: "", r5n: "",
      totalRow: "合計",
      inHeading: "学費に含まれるもの",
      in1: "日本語・現場訓練・職場ルールの授業（週5日）",
      in2: "教材、安全装備の貸与、実習の材料",
      in3: "適性評価・面接練習・書類サポート",
      in4: "渡日直前までの無料補習・再受講",
      in5: "渡日後10年までの相談・支援",
      outHeading: "学費に含まれないもの（別途）",
      out1: "JLPT・JFT・特定技能評価試験などの受験料",
      out2: "パスポート・ビザ申請の実費",
      out3: "日本までの渡航費",
      out4: "日本での生活費・住居費",
      note: "学費は全コース共通20万円です。受験料・渡航費・生活費などの実費は別途かかります。支払い方法は面談でご確認いただけます。就職・渡日・ビザ取得を保証するものではありません。"
    },

    studentCta: {
      heading: "まずは無料適性診断から",
      body: "5〜10分の回答で、あなたに向いている可能性のある仕事の方向性がわかります。",
      button: "無料適性診断を受ける"
    },

    companyCta: {
      heading: "採用をお考えの日本企業の方へ",
      body: "桜花は、日本語だけでなく職業適性まで評価した人材をご紹介します。採用ニーズを教育に反映します。",
      button: "企業の方はこちら"
    },

    faq: {
      heading: "よくある質問",
      q1: "適性診断は無料ですか？",
      a1: "はい、無料です。スマートフォンから5〜10分で回答できます。",
      q2: "診断を受けたら必ず日本へ行けますか？",
      a2: "いいえ。診断は参考情報です。実際の職種や渡日は、日本語力・経験・試験結果・企業選考・在留資格要件などを確認したうえで決まります。就職や渡日を保証するものではありません。",
      q3: "日本語が全くできなくても大丈夫ですか？",
      a3: "はい。ひらがなから学べます。診断では現在の状況を回答いただき、一人ひとりに合った学習計画を相談します。",
      q4: "個人情報はどう扱われますか？",
      a4: "入学相談・適切な職種相談・安全配慮のために利用します。詳しくは「個人情報の取扱い」をご覧ください。",
      q5: "費用について相談できますか？",
      a5: "はい。面談で学費や支払いについてご相談いただけます。"
    },

    contactSection: {
      heading: "お問い合わせ",
      lead: "ご質問・ご相談はお気軽にどうぞ。"
    },

    footer: {
      tagline: "日本企業で長く活躍できる人材を育てる教育機関",
      privacy: "個人情報の取扱い",
      terms: "利用規約",
      copyright: "© 2026 Ouka Skill Training Center Pvt. Ltd."
    },

    disclaimer: {
      // ★診断結果に必ず表示する参考情報の注意（改変しないこと）
      result: "この診断結果は、回答内容をもとにした参考情報です。実際の職種は、日本語力、経験、体力、健康状態、試験結果、本人の希望、企業選考、在留資格要件などを確認したうえで決定します。",
      health: "健康に関する回答は、適切な職種相談と安全配慮のために使用します。診断結果だけで採用や入学を決定するものではありません。",
      storage: "入力内容は、この端末のブラウザ（localStorage）に一時保存され、途中から再開できます。送信は、あなたが同意して送信ボタンを押したときにのみ行われます。診断完了後は「一時保存データを削除」で消せます。"
    },

    assessment: {
      title: "無料適性診断",
      intro: "以下の質問に答えてください。所要時間は約5〜10分です。途中でやめても、同じ端末なら続きから再開できます。",
      resumeNotice: "前回の入力内容が見つかりました。続きから再開できます。",
      clearSaved: "一時保存を削除して最初から",
      stepOf: "／",
      steps: {
        basic: "基本情報",
        japanese: "日本語・学習状況",
        experience: "学歴・職歴・技能",
        personality: "性格・仕事の進め方",
        physical: "体力・勤務環境",
        preference: "希望条件",
        confirm: "確認・送信"
      },
      likertHint: "あてはまる度合いを選んでください。",
      confirmHeading: "入力内容の確認",
      confirmLead: "内容を確認し、よければ診断結果へ進んでください。修正は「戻る」でできます。",
      calcResult: "診断結果を見る",
      autosaved: "自動保存しました",
      requiredConsent: "個人情報の取扱いに同意していただくと、診断へ進めます。"
    },

    result: {
      title: "適性診断の結果",
      forWhom: "診断を受けた方",
      date: "診断日",
      overall: "総合コメント",
      strengths: "あなたの強み",
      cautions: "確認が必要な点",
      topJobs: "向いている可能性がある職種（上位3つ）",
      scoreChart: "職種別スコア",
      why: "向いている可能性がある理由",
      prepare: "今後の準備",
      neededJp: "必要な日本語レベルの目安",
      lowPriorityNote: "スコアが低い職種は「向いていない」という意味ではなく、「現時点の回答では優先度が低い」ことを表します。",
      recommendMeeting: "より正確な評価は、専門スタッフとの面談で行います。",
      applyBtn: "入学を申し込む",
      interviewBtn: "無料面談を申し込む",
      printBtn: "結果を印刷 / PDF保存",
      restartBtn: "最初から診断する",
      noData: "診断データが見つかりません。お手数ですが、もう一度診断を受けてください。",
      goAssessment: "診断を受ける",
      scoreUnit: "点"
    },

    application: {
      title: "入学・面談のお申し込み",
      intro: "診断を受けた方は、入力済みの情報が自動で反映されます（同じことを何度も入力する必要はありません）。",
      fromAssessment: "適性診断の結果を引き継いでいます。",
      course: "希望コース",
      interviewDate: "希望面談日時",
      interviewMethod: "面談方法",
      methodVisit: "来校",
      methodOnline: "オンライン",
      guardianJoin: "保護者の同席",
      freeNote: "自由記入（ご質問・ご要望など）",
      topJobsLabel: "診断の上位3職種",
      submit: "申し込む",
      thanksTitle: "お申し込みを受け付けました",
      thanksBody: "スタッフが内容を確認し、ご連絡します。"
    },

    company: {
      title: "日本企業の採用ご担当者さまへ",
      lead: "桜花は、日本語だけでなく職業適性まで評価した人材を育成・ご紹介します。企業の採用ニーズを教育内容に反映します。",
      policyHeading: "人材育成の方針",
      policyBody: "「N4です」ではなく「建設適性◯点」のように、人物を数字で評価してご紹介します。時間厳守・挨拶・清掃・報連相・安全といった、日本の職場で信頼される習慣を毎日の訓練で育てます。",
      evalHeading: "学生の評価項目",
      evalItems: ["日本語", "会話", "協調性", "リーダーシップ", "体力", "安全意識", "規律", "面接", "出席"],
      formHeading: "採用・提携のご相談",
      formLead: "以下をご記入ください。担当より折り返しご連絡します。",
      f_company: "会社名",
      f_person: "ご担当者名",
      f_email: "メールアドレス",
      f_phone: "電話番号",
      f_headcount: "採用予定人数",
      f_timing: "採用時期",
      f_jobtype: "職種",
      f_location: "勤務地",
      f_jobdesc: "仕事内容",
      f_jplevel: "必要な日本語レベル",
      f_skills: "必要な技能",
      f_dorm: "寮の有無",
      f_interview: "面接を希望する",
      f_partnership: "業務提携の相談を希望する",
      f_message: "その他ご要望",
      submit: "送信する"
    },

    contact: {
      title: "お問い合わせ",
      lead: "ご質問・ご相談はお気軽にどうぞ。フォームまたは電話・WhatsApp・メールでご連絡ください。",
      f_name: "お名前",
      f_email: "メールアドレス",
      f_phone: "電話番号",
      f_type: "お問い合わせ種別",
      type_student: "入学・学習について（学生・保護者）",
      type_company: "採用・提携について（企業）",
      type_other: "その他",
      f_message: "お問い合わせ内容",
      submit: "送信する"
    },

    privacy: {
      title: "個人情報の取扱い",
      updated: "最終更新：2026年",
      intro: "桜花スキルトレーニングセンター（Ouka Skill Training Center Pvt. Ltd.、以下「当校」）は、適性診断・入学相談・お問い合わせでお預かりする個人情報を、以下のとおり取り扱います。",
      s1t: "1. 取得する情報",
      s1b: "氏名・連絡先・生年月日・学歴職歴・日本語レベル・適性診断の回答・希望条件など、入学相談と教育・就職支援に必要な情報を取得します。パスポート画像はPhase1では収集しません。",
      s2t: "2. 利用目的",
      s2b: "入学相談、適切な職種相談、教育計画の作成、面接・就職支援、安全配慮、ご連絡のために利用します。診断結果だけで採用・入学を決定するものではありません。",
      s3t: "3. 健康に関する情報",
      s3b: "健康に関する回答は任意項目を最小限とし、適切な職種相談と安全配慮のためだけに利用します。SNSやSlackなどへ健康情報は通知しません。",
      s4t: "4. 端末内の一時保存",
      s4b: "診断の途中入力は、送信前はお使いの端末のブラウザ（localStorage）内にのみ保存され、当校サーバーへは送信されません。診断完了後に削除できます。",
      s5t: "5. 第三者提供",
      s5b: "ご本人の同意なく第三者へ提供しません。就職支援のために企業へ情報を共有する場合は、事前に目的をご説明します。",
      s6t: "6. お問い合わせ",
      s6b: "個人情報の確認・訂正・削除のご希望は、下記の連絡先までご連絡ください。"
    },

    terms: {
      title: "利用規約",
      updated: "最終更新：2026年",
      intro: "本規約は、桜花スキルトレーニングセンターのWebサイトおよび適性診断のご利用条件を定めるものです。",
      s1t: "1. 適性診断について",
      s1b: "適性診断の結果は、回答内容をもとにした参考情報です。職業選択を確定するものではありません。実際の職種・渡日・就職は、日本語力・経験・体力・健康状態・試験結果・本人の希望・企業選考・在留資格要件などを確認したうえで決定されます。",
      s2t: "2. 保証しない事項",
      s2b: "当校は、日本への渡航、就職、ビザ・在留資格の取得、永住、試験合格などを保証しません。これらは目標として、条件を満たせるよう相談・支援を行うものです。",
      s3t: "3. 入力情報の正確性",
      s3b: "ご入力いただく情報は、正確かつ最新のものをご記入ください。事実と異なる場合、適切な相談・支援ができないことがあります。",
      s4t: "4. 禁止事項",
      s4b: "虚偽の申告、他人へのなりすまし、当校または第三者の権利を侵害する行為を禁止します。",
      s5t: "5. 規約の変更",
      s5b: "本規約は必要に応じて改定することがあります。改定後の内容は本ページに掲載します。"
    },

    errors: {
      required: "この項目は必須です。",
      email: "メールアドレスの形式が正しくありません。",
      phone: "電話番号は数字で入力してください。",
      date: "日付を正しく入力してください。",
      consent: "続けるには同意が必要です。",
      selectOne: "1つ選んでください。",
      number: "数字で入力してください。"
    },

    pages: {
      edu: {
        title: "教育内容",
        lead: "日本語・職業/専門・日本での生活と職場ルールを、現場のリズムで一体的に学びます。",
        jpTitle: "日本語教育",
        jpBody: "ひらがな・カタカナから、仕事で使う会話・報連相まで段階的に学びます。あいさつ・自己紹介・数字・安全のことばなど、現場で本当に使う日本語を優先します。",
        jpPoints: ["ひらがな・カタカナ・基本のあいさつ", "仕事の会話と報連相", "安全・指示のことば", "面接で話す練習", "JLPT・JFT-Basicの対策"],
        vocTitle: "職業・専門教育",
        vocBody: "職種ごとの基礎知識と、現場で必要な作業・道具・安全のルールを学びます。建設を中心に、実践中心で身につけます。",
        vocPoints: ["職種の基礎知識", "道具・機械の扱い", "安全（KY・指差呼称）", "チーム作業・段取り"],
        lifeTitle: "日本生活・職場ルール教育",
        lifeBody: "時間厳守・あいさつ・清掃・報連相・安全など、日本の職場で信頼される習慣を毎日の訓練で身につけます。",
        lifePoints: ["時間厳守と身だしなみ", "あいさつ・返事", "清掃・整理整頓", "報連相", "日本での生活マナー"]
      },
      visa: {
        title: "ビザ・在留資格",
        lead: "日本で働くための代表的な在留資格（ビザ）と、桜花が目指す道すじをまとめました。制度は日本政府の運用により変わります。就職・ビザの取得・永住を保証するものではありません。",
        introTitle: "在留資格とは？（やさしい説明）",
        introBody: "「在留資格」は、外国人が日本でどんな活動をしてよいかを定めた許可です（一般に“ビザ”と呼ばれます）。桜花は、日本の建設分野などで働くことを目指す方を育てます。実際にどの在留資格になるかは、日本語力・試験の結果・企業の選考・在留資格の要件などにより決まります。最新の内容や個別の可否は、面談でご確認ください。",
        statusesTitle: "主な在留資格",
        s1Title: "特定技能1号",
        s1Body: "一定の技能と日本語力がある人が、決められた産業分野で即戦力として働ける在留資格です。桜花が最初に目指す出口の中心です。",
        s1Points: ["要件：技能試験＋日本語試験（JLPT N4／JFT-Basic A2 相当）に合格", "在留期間：通算で最長5年", "家族帯同：できません", "次のステップ：条件を満たせば特定技能2号へ"],
        s2Title: "特定技能2号",
        s2Body: "熟練した技能を持つ人向けの在留資格です。より長く日本で働けて、家族と暮らせる可能性があります。",
        s2Points: ["在留期間：更新できる（長く働ける）", "家族帯同：条件を満たせば できる", "永住：永住申請への道につながる", "対象分野：順次拡大中"],
        s3Title: "育成就労（2027年4月〜予定）",
        s3Body: "技能実習に代わる新しい制度です。原則3年で「特定技能1号」の水準まで育てることを目的とし、2027年4月1日から始まる予定です。",
        s3Points: ["育成期間：原則3年で特定技能1号の水準へ", "対象分野：特定技能の分野に合わせる見込み（建設 など）", "転籍：一定の条件で本人の希望による転籍が可能", "次のステップ：特定技能1号 → 2号へ"],
        legacyTitle: "技能実習について",
        legacyBody: "これまでの「技能実習」は、2027年4月から「育成就労」へ移行していく予定です。これから日本を目指す方は、育成就労・特定技能が中心になります。",
        pathTitle: "桜花が目指す道すじ",
        pathBody: "桜花で学ぶ（日本語＋現場訓練＋日本式マナー）→ 育成就労（3年）または 特定技能1号（試験に合格）→ 特定技能2号（更新できる・家族と暮らせる・永住への道）。卒業後も10年、相談・支援でご一緒します。就職・ビザ・渡日・永住は保証ではなく、条件を満たせるよう支援します。",
        tblCaption: "在留資格の早見表",
        tblHead: ["在留資格", "在留期間", "家族帯同", "主な要件・特徴"],
        tblRows: [
          ["特定技能1号", "通算5年まで", "不可", "技能試験＋日本語試験に合格"],
          ["特定技能2号", "更新できる", "できる", "熟練した技能。永住への道"],
          ["育成就労", "原則3年", "原則不可", "3年で特定技能1号の水準へ（2027年4月〜）"]
        ],
        note: "このページの内容は一般的な説明です（2026年時点）。制度は日本政府の運用により変わることがあります。実際に取得できる在留資格や条件は、日本語力・試験・企業選考・審査などにより決まり、桜花が就職・ビザ・渡日・永住を保証するものではありません。"
      },
      gallery: {
        title: "訓練の様子",
        lead: "日々の授業・現場訓練の様子です。",
        note: "写真は本人の同意を得たものだけを掲載しています。",
        empty: "写真は準備中です。順次掲載します。",
        addHint: "スタッフへ：写真は assets/images/gallery/ に入れ、gallery-data.js に1行足すと表示されます。"
      },
      students: {
        title: "在籍学生",
        lead: "桜花で学ぶ学生たちです。",
        enrolled: "在籍者数",
        unit: "名",
        showing: "掲載中",
        level: "日本語",
        qualification: "資格・訓練",
        course: "コース",
        since: "入学",
        consentNote: "掲載は本人の同意に基づきます。氏名は表示名（イニシャル可）です。",
        empty: "在籍学生の情報は準備中です。"
      },
      reg: {
        title: "学校の登録・認可",
        lead: "桜花スキルトレーニングセンターの登記・登録の状況です。",
        sRegistered: "登録済み",
        sApplying: "申請中",
        sPreparing: "準備中",
        disclaimer: "実際に保有・申請中のもののみを掲載しています。取得していない許認可は掲載しません。",
        docLabel: "証明書",
        viewDoc: "証明書を見る"
      },
      partners: {
        title: "提携・送り出し機関の皆さまへ",
        lead: "送り出し機関・企業・関係機関との連携を歓迎します。育てた人材を、正しく評価して橋渡しします。",
        listHeading: "提携・連携先",
        sendingOrg: "送り出し機関",
        partner: "提携先",
        company: "受け入れ企業",
        empty: "連携先は順次掲載します。",
        formHeading: "連携のご相談",
        formLead: "以下をご記入ください。担当より折り返します。",
        f_org: "機関・会社名",
        f_country: "国・地域",
        f_person: "ご担当者名",
        f_email: "メールアドレス",
        f_phone: "電話 / WhatsApp",
        f_type: "種別",
        f_message: "ご相談内容",
        submit: "送信する"
      },
      teachers: {
        title: "先生の紹介",
        lead: "桜花の教員です。日本語・現場・生活の指導に加え、教員自身も学び続けています。",
        role: "担当",
        study: "いま学んでいること",
        career: "歩み・キャリア",
        video: "紹介・インタビュー動画",
        videoNote: "動画では、どうやって日本語を身につけたか、日本で何をしたのか（一から十まで）を紹介します。",
        empty: "教員紹介は準備中です。"
      },
      faq: {
        title: "よくある質問",
        lead: "みなさんが気になることに、あらかじめお答えします。",
        allCat: "すべて",
        moreTitle: "それでも気になることは、お気軽にどうぞ",
        moreBody: "ここに無いご質問も、電話・WhatsApp・メール・フォームでお気軽にご連絡ください。",
        contactBtn: "お問い合わせ",
        consultBtn: "無料相談をする"
      }
    }
  },

  /* ==================== English ==================== */
  en: {
    common: {
      langName: "English",
      free: "Free",
      required: "Required",
      optional: "Optional",
      next: "Next",
      back: "Back",
      submit: "Submit",
      confirm: "Confirm",
      loading: "Loading…",
      selectPlaceholder: "Please select",
      yes: "Yes",
      no: "No",
      unknown: "Not sure",
      close: "Close",
      print: "Print",
      restart: "Start over",
      startAssessment: "Take the free aptitude check",
      consultNow: "Book a consultation",
      forCompanies: "For companies",
      phone: "Phone",
      whatsapp: "WhatsApp",
      email: "Email",
      address: "Address",
      preparingNotice: "Online submission is being prepared. Please contact our staff directly.",
      contactStaff: "Contact staff"
    },

    nav: {
      about: "About",
      education: "Education",
      visa: "Visas",
      courses: "Courses",
      teachers: "Teachers",
      gallery: "Training photos",
      students: "Students",
      registration: "Registration",
      partners: "Partners",
      assessment: "Free aptitude check",
      flow: "How to enroll",
      forCompanies: "For companies",
      contact: "Contact",
      faq: "FAQ",
      lang: "Language",
      menu: "Menu"
    },

    hero: {
      title1: "Turn your dream of working",
      title2: "in Japan into reality.",
      lead: "Not just Japanese language — you also learn the work, interviews, and daily-life rules in Japan. OUKA Skill Training Center develops people who can thrive at Japanese companies for the long term.",
      tagline: "We are not a Japanese-language school. We are a training institution that develops people who can thrive at Japanese companies for the long term."
    },

    assessIntro: {
      heading: "Find out which jobs in Japan may suit you",
      lead: "Answer questions about your Japanese ability, experience, personality, physical strength, and preferences to see which occupations may suit you.",
      point1: "About 5–10 minutes",
      point2: "Works on smartphones",
      point3: "See your result right away",
      point4: "Free consultation available afterwards",
      point5: "Results are reference information",
      cta: "Start the free aptitude check"
    },

    about: {
      heading: "About the school",
      body: "OUKA Skill Training Center, located in Gaidakot, Nepal, is a human-resource development institution. Beyond Japanese language, students learn work fundamentals, interviews, and daily-life and workplace rules in Japan, so they can thrive at Japanese companies for the long term. We do not guarantee employment, visas, travel to Japan, or permanent residency; we provide consultation and support toward those goals."
    },

    pillars: {
      heading: "Three pillars of education",
      p1Title: "Japanese language",
      p1Body: "Step by step, from hiragana and katakana to workplace conversation and reporting.",
      p2Title: "Vocational & specialized",
      p2Body: "Job-specific basics and the tasks and safety rules needed on site.",
      p3Title: "Life & workplace rules in Japan",
      p3Body: "Punctuality, greetings, cleaning, reporting, and safety — the habits trusted in Japanese workplaces.",
      more: "Learn more"
    },

    strengths: {
      heading: "Why OUKA",
      s1: "Education focused on working in Japan",
      s2: "Vocational aptitude evaluated (shown as scores)",
      s3: "Individual study plans",
      s4: "Interview coaching",
      s5: "Japan life & workplace-rule training",
      s6: "Progress tracking from enrollment to employment",
      s7: "Japanese employers' hiring needs reflected in education"
    },

    jobs: {
      heading: "Supported occupations",
      lead: "Current status. You can also discuss occupations marked as preparing or open for consultation.",
      statusActive: "Currently supported",
      statusPreparing: "In preparation",
      statusConsulting: "Open for consultation"
    },

    flow: {
      heading: "From enrollment to working in Japan",
      m1: "STEP 0", step1: "Free aptitude check / inquiry", d1: "5-10 minutes on your phone. See the direction of jobs that may suit you.",
      m2: "Month 0", step2: "Consultation", d2: "We review your Japanese, experience, wishes, and fees, and plan your studies together.",
      m3: "Enrollment", step3: "Enrollment & level check", d3: "We check your Japanese, strength, and aptitude, and set your personal goals.",
      m4: "Months 1-6", step4: "Japanese + vocational + life education", d4: "5 days/week, 9:00-16:30. Japanese, on-site training, and workplace rules at the rhythm of a real site.",
      m5: "Months 5-6", step5: "Aptitude evaluation & interview practice", d5: "Evaluated as 'construction aptitude ◯ points' and coached for Japanese company interviews.",
      m6: "Months 6-8", step6: "Company interview & matching", d6: "Interview with suitable Japanese companies, then residence-status / visa procedures.",
      m7: "Months 8-12", step7: "Preparation & departure", d7: "Prepare for travel and life, then depart for Japan. Free review until just before departure.",
      m8: "After arrival - 10 yrs", step8: "Support continues after employment", d8: "We keep supporting you so you can thrive in Japan for the long term.",
      total: "From enrollment to departure: about 8-12 months (guideline)",
      note: "Progress at each stage depends on Japanese ability, readiness, exam results, company selection, and more. Employment, travel, and visas are not guaranteed."
    },

    tuition: {
      heading: "Tuition (fees)",
      lead: "Tuition is clear. Paid in full at enrollment (non-refundable). Installments and timing can be discussed at the consultation. Review, re-takes, and interview practice before departure are included at no extra cost.",
      totalLabel: "Total tuition",
      totalNote: "Paid in full at enrollment (non-refundable)",
      breakdownCaption: "Payment terms",
      r1: "Tuition", r1n: "All courses: ¥200,000",
      r2: "Payment", r2n: "Paid in full at enrollment",
      r3: "Refund", r3n: "None",
      r4: "N4 holders", r4n: "Same fee (no discount)",
      r5: "", r5n: "",
      totalRow: "Total",
      inHeading: "Included in tuition",
      in1: "Japanese, on-site training, workplace-rule classes (5 days/week)",
      in2: "Textbooks, loaned safety gear, practice materials",
      in3: "Aptitude evaluation, interview practice, document support",
      in4: "Free review / re-takes until just before departure",
      in5: "Consultation & support for up to 10 years after arrival",
      outHeading: "Not included (separate)",
      out1: "Exam fees (JLPT, JFT, SSW skills tests, etc.)",
      out2: "Passport / visa application costs",
      out3: "Travel to Japan",
      out4: "Living and housing costs in Japan",
      note: "Tuition is ¥200,000 for all courses. Actual costs such as exam fees, travel, and living expenses are separate. Payment method can be discussed at the consultation. Employment, travel, and visas are not guaranteed."
    },

    studentCta: {
      heading: "Start with the free aptitude check",
      body: "In 5–10 minutes, see the direction of jobs that may suit you.",
      button: "Take the free aptitude check"
    },

    companyCta: {
      heading: "For Japanese companies considering hiring",
      body: "OUKA introduces people evaluated not only for Japanese but also for vocational aptitude, reflecting your hiring needs in our education.",
      button: "For companies"
    },

    faq: {
      heading: "Frequently asked questions",
      q1: "Is the aptitude check free?",
      a1: "Yes, it is free. You can complete it on a smartphone in 5–10 minutes.",
      q2: "If I take it, can I definitely go to Japan?",
      a2: "No. The check is reference information. Actual occupation and travel depend on Japanese ability, experience, exam results, company selection, residence-status requirements, and more. Employment or travel is not guaranteed.",
      q3: "Is it okay if I can't speak Japanese at all?",
      a3: "Yes. You can start from hiragana. In the check you tell us your current situation, and we discuss a study plan suited to you.",
      q4: "How is my personal information handled?",
      a4: "It is used for enrollment consultation, suitable job consultation, and safety consideration. See 'Handling of personal information'.",
      q5: "Can I discuss fees?",
      a5: "Yes. You can discuss tuition and payment at the consultation."
    },

    contactSection: {
      heading: "Contact",
      lead: "Feel free to reach out with any questions."
    },

    footer: {
      tagline: "A training institution developing people who thrive at Japanese companies for the long term",
      privacy: "Handling of personal information",
      terms: "Terms of use",
      copyright: "© 2026 Ouka Skill Training Center Pvt. Ltd."
    },

    disclaimer: {
      result: "This result is reference information based on your answers. Your actual occupation will be decided after confirming Japanese ability, experience, physical condition, health, exam results, your own wishes, company selection, residence-status requirements, and more.",
      health: "Health-related answers are used for suitable job consultation and safety consideration. Hiring or enrollment is not decided by the check alone.",
      storage: "Your entries are temporarily saved in this device's browser (localStorage) so you can resume. Data is only sent when you consent and press submit. After finishing you can delete the temporary data."
    },

    assessment: {
      title: "Free aptitude check",
      intro: "Please answer the questions below. It takes about 5–10 minutes. If you stop, you can resume on the same device.",
      resumeNotice: "We found your previous entries. You can resume where you left off.",
      clearSaved: "Delete saved data and start over",
      stepOf: "/",
      steps: {
        basic: "Basic information",
        japanese: "Japanese & study",
        experience: "Education & work",
        personality: "Personality & work style",
        physical: "Strength & work environment",
        preference: "Preferences",
        confirm: "Confirm & submit"
      },
      likertHint: "Choose how much this applies to you.",
      confirmHeading: "Confirm your entries",
      confirmLead: "Check your entries and proceed to the result. Use 'Back' to edit.",
      calcResult: "See my result",
      autosaved: "Saved automatically",
      requiredConsent: "Please agree to the handling of personal information to proceed."
    },

    result: {
      title: "Aptitude check result",
      forWhom: "For",
      date: "Date",
      overall: "Overall comment",
      strengths: "Your strengths",
      cautions: "Points to confirm",
      topJobs: "Occupations that may suit you (top 3)",
      scoreChart: "Scores by occupation",
      why: "Why it may suit you",
      prepare: "How to prepare",
      neededJp: "Japanese level guideline",
      lowPriorityNote: "A low score does not mean 'unsuited' — it means 'lower priority based on current answers.'",
      recommendMeeting: "A more accurate evaluation is done in a consultation with our staff.",
      applyBtn: "Apply for enrollment",
      interviewBtn: "Book a free consultation",
      printBtn: "Print / Save as PDF",
      restartBtn: "Take the check again",
      noData: "No result data found. Please take the check again.",
      goAssessment: "Take the check",
      scoreUnit: "pts"
    },

    application: {
      title: "Enrollment / consultation application",
      intro: "If you took the aptitude check, your entries are filled in automatically — no need to re-enter.",
      fromAssessment: "Your aptitude check result has been carried over.",
      course: "Preferred course",
      interviewDate: "Preferred date/time",
      interviewMethod: "Consultation method",
      methodVisit: "In person",
      methodOnline: "Online",
      guardianJoin: "Guardian to join",
      freeNote: "Free text (questions/requests)",
      topJobsLabel: "Top 3 occupations from the check",
      submit: "Apply",
      thanksTitle: "Your application has been received",
      thanksBody: "Our staff will review it and contact you."
    },

    company: {
      title: "To hiring managers at Japanese companies",
      lead: "OUKA develops and introduces people evaluated not only for Japanese but also for vocational aptitude, reflecting your hiring needs in our education.",
      policyHeading: "Our development policy",
      policyBody: "Instead of 'N4', we introduce people with numbers such as 'construction aptitude ◯ points.' Habits trusted in Japanese workplaces — punctuality, greetings, cleaning, reporting, safety — are built through daily training.",
      evalHeading: "Student evaluation items",
      evalItems: ["Japanese", "Conversation", "Teamwork", "Leadership", "Strength", "Safety", "Discipline", "Interview", "Attendance"],
      formHeading: "Hiring / partnership inquiry",
      formLead: "Please fill in the following and we will get back to you.",
      f_company: "Company name",
      f_person: "Contact person",
      f_email: "Email",
      f_phone: "Phone",
      f_headcount: "Planned number of hires",
      f_timing: "Hiring timing",
      f_jobtype: "Occupation",
      f_location: "Work location",
      f_jobdesc: "Job description",
      f_jplevel: "Required Japanese level",
      f_skills: "Required skills",
      f_dorm: "Dormitory available",
      f_interview: "Request an interview",
      f_partnership: "Request a partnership discussion",
      f_message: "Other requests",
      submit: "Submit"
    },

    contact: {
      title: "Contact",
      lead: "Feel free to reach out. Use the form, or contact us by phone, WhatsApp, or email.",
      f_name: "Name",
      f_email: "Email",
      f_phone: "Phone",
      f_type: "Inquiry type",
      type_student: "Enrollment/study (student/guardian)",
      type_company: "Hiring/partnership (company)",
      type_other: "Other",
      f_message: "Message",
      submit: "Submit"
    },

    privacy: {
      title: "Handling of personal information",
      updated: "Last updated: 2026",
      intro: "OUKA Skill Training Center (Ouka Skill Training Center Pvt. Ltd., 'the School') handles the personal information collected through the aptitude check, consultations, and inquiries as follows.",
      s1t: "1. Information we collect",
      s1b: "Name, contact details, date of birth, education and work history, Japanese level, aptitude-check answers, and preferences — information needed for consultation, education, and employment support. Passport images are not collected in Phase 1.",
      s2t: "2. Purpose of use",
      s2b: "Enrollment consultation, suitable job consultation, education planning, interview and employment support, safety consideration, and contact. Hiring/enrollment is not decided by the check alone.",
      s3t: "3. Health-related information",
      s3b: "Health-related items are kept minimal and used only for suitable job consultation and safety consideration. Health information is never sent to SNS or Slack.",
      s4t: "4. Temporary on-device storage",
      s4b: "In-progress entries are stored only in your device's browser (localStorage) before submission and are not sent to our servers. You can delete them after finishing.",
      s5t: "5. Provision to third parties",
      s5b: "We do not provide information to third parties without your consent. If information is shared with companies for employment support, we explain the purpose beforehand.",
      s6t: "6. Contact",
      s6b: "To review, correct, or delete your personal information, please contact us using the details below."
    },

    terms: {
      title: "Terms of use",
      updated: "Last updated: 2026",
      intro: "These terms set out the conditions for using the OUKA Skill Training Center website and aptitude check.",
      s1t: "1. About the aptitude check",
      s1b: "The result is reference information based on your answers. It does not finalize your occupation. Actual occupation, travel, and employment are decided after confirming Japanese ability, experience, strength, health, exam results, your wishes, company selection, and residence-status requirements.",
      s2t: "2. What we do not guarantee",
      s2b: "The School does not guarantee travel to Japan, employment, visa/residence status, permanent residency, or exam success. We provide consultation and support toward these goals.",
      s3t: "3. Accuracy of entries",
      s3b: "Please enter accurate, up-to-date information. If entries differ from the facts, appropriate consultation and support may not be possible.",
      s4t: "4. Prohibited actions",
      s4b: "False declarations, impersonation, and infringement of the rights of the School or third parties are prohibited.",
      s5t: "5. Changes to these terms",
      s5b: "These terms may be revised as needed. Revised content will be posted on this page."
    },

    errors: {
      required: "This field is required.",
      email: "The email format is invalid.",
      phone: "Please enter digits only for the phone number.",
      date: "Please enter a valid date.",
      consent: "Consent is required to continue.",
      selectOne: "Please choose one.",
      number: "Please enter a number."
    },

    pages: {
      edu: {
        title: "Education",
        lead: "Japanese, vocational/specialized, and daily-life & workplace rules — learned together at the rhythm of a real worksite.",
        jpTitle: "Japanese language",
        jpBody: "Step by step from hiragana/katakana to workplace conversation and reporting. We prioritize the Japanese truly used on site — greetings, self-introduction, numbers, safety words.",
        jpPoints: ["Hiragana, katakana, basic greetings", "Workplace conversation & reporting", "Safety & instruction vocabulary", "Interview speaking practice", "JLPT / JFT-Basic preparation"],
        vocTitle: "Vocational & specialized",
        vocBody: "Job-specific basics and the tasks, tools, and safety rules needed on site. Centered on construction, learned through practice.",
        vocPoints: ["Job-specific fundamentals", "Handling tools & machines", "Safety (KY, pointing-and-calling)", "Teamwork & job sequencing"],
        lifeTitle: "Life & workplace rules in Japan",
        lifeBody: "Punctuality, greetings, cleaning, reporting, and safety — habits trusted in Japanese workplaces, built through daily training.",
        lifePoints: ["Punctuality & appearance", "Greetings & responses", "Cleaning & tidiness", "Reporting/communication", "Daily-life manners in Japan"]
      },
      visa: {
        title: "Visas & Status of Residence",
        lead: "The main statuses of residence (visas) for working in Japan, and the path OUKA aims for. Rules change with Japanese government policy. Employment, obtaining a visa, and permanent residence are not guaranteed.",
        introTitle: "What is a status of residence? (in simple terms)",
        introBody: "A \"status of residence\" is the permission that defines what a foreign national may do in Japan (commonly called a \"visa\"). OUKA trains people aiming to work in fields such as construction in Japan. Which status you actually receive depends on your Japanese ability, exam results, the company's selection, and each status's requirements. Please confirm the latest details and your individual case at a consultation.",
        statusesTitle: "Main statuses of residence",
        s1Title: "Specified Skilled Worker (i)",
        s1Body: "For people with a certain level of skill and Japanese who can work as job-ready staff in a designated industry. This is OUKA's main first goal.",
        s1Points: ["Requirement: pass a skills test + a Japanese test (JLPT N4 / JFT-Basic A2 level)", "Period: up to 5 years in total", "Family: cannot be accompanied", "Next step: to SSW (ii) if conditions are met"],
        s2Title: "Specified Skilled Worker (ii)",
        s2Body: "For people with advanced skills. You can work in Japan longer and may live with your family.",
        s2Points: ["Period: renewable (work long-term)", "Family: can be accompanied if conditions are met", "Permanent residence: a path toward applying", "Fields: expanding gradually"],
        s3Title: "Employment for Skill Development (from Apr 2027)",
        s3Body: "A new system replacing the Technical Intern Training. It aims to develop workers to the SSW (i) level in about 3 years, and is scheduled to start on April 1, 2027.",
        s3Points: ["Training: about 3 years to reach SSW (i) level", "Fields: expected to match SSW fields (construction, etc.)", "Transfer: changing employer possible under certain conditions", "Next step: to SSW (i) → (ii)"],
        legacyTitle: "About Technical Intern Training",
        legacyBody: "The former \"Technical Intern Training\" is scheduled to transition to \"Employment for Skill Development\" from April 2027. For those aiming for Japan from now on, ESD and SSW will be the main routes.",
        pathTitle: "The path OUKA aims for",
        pathBody: "Study at OUKA (Japanese + on-site training + Japanese-style manners) → ESD (3 years) or SSW (i) (pass the tests) → SSW (ii) (renewable, live with family, path to permanent residence). We stay with you for up to 10 years after graduation. Employment, visas, travel to Japan, and permanent residence are not guaranteed; we support you to meet the conditions.",
        tblCaption: "Status of residence at a glance",
        tblHead: ["Status", "Period", "Family", "Key requirements / features"],
        tblRows: [
          ["SSW (i)", "Up to 5 years total", "No", "Pass skills + Japanese tests"],
          ["SSW (ii)", "Renewable", "Yes", "Advanced skills; path to PR"],
          ["ESD", "About 3 years", "Generally no", "Develop to SSW (i) level (from Apr 2027)"]
        ],
        note: "This page is a general explanation (as of 2026). Rules may change with Japanese government policy. The status you can actually obtain and its conditions depend on Japanese ability, exams, company selection, and screening. OUKA does not guarantee employment, visas, travel to Japan, or permanent residence."
      },
      gallery: {
        title: "Training photos",
        lead: "Scenes from daily classes and on-site training.",
        note: "Only photos with the person's consent are shown.",
        empty: "Photos are being prepared and will be posted soon.",
        addHint: "For staff: put images in assets/images/gallery/ and add one line to gallery-data.js."
      },
      students: {
        title: "Students",
        lead: "The students learning at OUKA.",
        enrolled: "Enrolled",
        unit: "",
        showing: "Shown",
        level: "Japanese",
        qualification: "Skills / training",
        course: "Course",
        since: "Enrolled",
        consentNote: "Shown with each person's consent. Names are display names (initials allowed).",
        empty: "Student information is being prepared."
      },
      reg: {
        title: "School registration",
        lead: "Registration status of OUKA Skill Training Center.",
        sRegistered: "Registered",
        sApplying: "Applying",
        sPreparing: "In preparation",
        disclaimer: "Only items actually held or in application are shown. Licenses not obtained are not listed.",
        docLabel: "Certificate",
        viewDoc: "View certificate"
      },
      partners: {
        title: "For sending organizations & partners",
        lead: "We welcome cooperation with sending organizations, companies, and related bodies. We evaluate the people we train fairly and connect them.",
        listHeading: "Partners",
        sendingOrg: "Sending organization",
        partner: "Partner",
        company: "Employer",
        empty: "Partners will be listed soon.",
        formHeading: "Partnership inquiry",
        formLead: "Please fill in the following and we will get back to you.",
        f_org: "Organization / company",
        f_country: "Country / region",
        f_person: "Contact person",
        f_email: "Email",
        f_phone: "Phone / WhatsApp",
        f_type: "Type",
        f_message: "Message",
        submit: "Submit"
      },
      teachers: {
        title: "Our teachers",
        lead: "The teachers at OUKA. Beyond teaching Japanese, on-site skills, and daily life, they keep learning themselves.",
        role: "In charge of",
        study: "What they are studying",
        career: "Journey & career",
        video: "Introduction / interview video",
        videoNote: "In the video, they share how they learned Japanese and what they did in Japan — from start to finish.",
        empty: "Teacher profiles are being prepared."
      },
      faq: {
        title: "Frequently asked questions",
        lead: "We answer the things people usually want to know, in advance.",
        allCat: "All",
        moreTitle: "Still have questions? Feel free to ask",
        moreBody: "For anything not listed here, reach us easily by phone, WhatsApp, email, or the form.",
        contactBtn: "Contact",
        consultBtn: "Book a free consultation"
      }
    }
  },

  /* ==================== नेपाली (Nepali) ====================
   * 主要なUI文言のみ翻訳。未翻訳キーは自動で英語→日本語にフォールバックします。
   * 追記するときは ja/en と同じキー構成で足してください。 */
  ne: {
    common: {
      langName: "नेपाली",
      free: "निःशुल्क",
      required: "आवश्यक",
      optional: "वैकल्पिक",
      next: "अर्को",
      back: "पछाडि",
      submit: "पठाउनुहोस्",
      confirm: "पुष्टि गर्नुहोस्",
      loading: "लोड हुँदैछ…",
      selectPlaceholder: "छान्नुहोस्",
      yes: "हो",
      no: "होइन",
      unknown: "थाहा छैन",
      close: "बन्द",
      print: "प्रिन्ट",
      restart: "सुरुबाट",
      startAssessment: "निःशुल्क योग्यता जाँच लिनुहोस्",
      consultNow: "भर्ना परामर्श",
      forCompanies: "कम्पनीहरूका लागि",
      phone: "फोन",
      whatsapp: "WhatsApp",
      email: "इमेल",
      address: "ठेगाना",
      preparingNotice: "अनलाइन पठाउने सुविधा तयारी हुँदैछ। कृपया स्टाफलाई सम्पर्क गर्नुहोस्।",
      contactStaff: "स्टाफलाई सम्पर्क गर्नुहोस्"
    },
    nav: {
      about: "विद्यालयबारे",
      education: "शिक्षा",
      visa: "भिसा",
      courses: "कोर्स",
      teachers: "शिक्षकहरू",
      gallery: "तालिमका तस्बिर",
      students: "विद्यार्थीहरू",
      registration: "दर्ता",
      partners: "साझेदार / पठाउने संस्था",
      assessment: "निःशुल्क योग्यता जाँच",
      flow: "भर्ना प्रक्रिया",
      forCompanies: "कम्पनीहरूका लागि",
      contact: "सम्पर्क",
      faq: "बारम्बार सोधिने प्रश्न",
      lang: "भाषा",
      menu: "मेनु"
    },
    hero: {
      title1: "जापानमा काम गर्ने सपनालाई,",
      title2: "यथार्थमा बदल्नुहोस्।",
      lead: "जापानी भाषा मात्र होइन — काम, अन्तर्वार्ता र जापानको जीवनका नियमहरू पनि सिकिन्छ। OUKA ले जापानी कम्पनीमा लामो समय टिक्न सक्ने जनशक्ति तयार गर्छ।",
      tagline: "हामी जापानी भाषा सिकाउने विद्यालय होइनौं। जापानी कम्पनीमा लामो समय काम गर्न सक्ने जनशक्ति तयार गर्ने संस्था हौं।"
    },
    assessIntro: {
      heading: "जापानमा तपाईंलाई कस्तो काम सुहाउँछ हेर्नुहोस्",
      lead: "जापानी क्षमता, अनुभव, स्वभाव, शारीरिक बल र इच्छाबारे उत्तर दिनुहोस्, अनि सुहाउन सक्ने पेसा हेर्नुहोस्।",
      point1: "लगभग ५–१० मिनेट",
      point2: "मोबाइलमा चल्छ",
      point3: "नतिजा तुरुन्तै",
      point4: "पछि निःशुल्क परामर्श",
      point5: "नतिजा सन्दर्भ जानकारी हो",
      cta: "निःशुल्क योग्यता जाँच सुरु गर्नुहोस्"
    },
    about: {
      heading: "विद्यालयबारे",
      body: "OUKA स्किल ट्रेनिङ सेन्टर नेपालको गैँडाकोटमा रहेको जनशक्ति विकास संस्था हो। हामी ‘जापानी भाषा सिकाउने विद्यालय’ होइन, ‘जापानी कम्पनीमा लामो समय टिक्ने जनशक्ति तयार गर्ने संस्था’ हौं। जापानी भाषासँगै काम, रिपोर्ट-सम्पर्क-सल्लाह (होरेन्सो), अन्तर्वार्ता र जापानको जीवन तथा कार्यस्थलका नियम एकसाथ सिकाइन्छ — कक्षामा मात्र होइन, वास्तविक साइटको लय (समयपालना, अभिवादन, सरसफाइ, सुरक्षा, टोली-काम) मा। कम्पनीलाई ‘N4 छ’ भन्ने होइन, ‘निर्माण योग्यता ◯ अंक’ जसरी व्यक्तिलाई अंकमा देखाएर सिफारिस गर्छौं। रोजगारी, भिसा, प्रस्थान वा स्थायी बसोबासको ग्यारेन्टी होइन; भर्नादेखि जापान पुगेपछिसम्म सर्त पूरा गर्न सहयोग गर्छौं।"
    },
    pillars: {
      heading: "शिक्षाका ३ आधार",
      p1Title: "जापानी भाषा शिक्षा",
      p1Body: "हिरागाना-काताकानादेखि कामको कुराकानी, होरेन्सो र अन्तर्वार्तामा बोल्ने जापानीसम्म क्रमशः सिकाइन्छ। अभिवादन, अंक, सुरक्षाका शब्द जस्ता साइटमा साँच्चै चाहिने भाषालाई प्राथमिकता दिँदै JLPT र JFT-Basic को तयारी पनि गरिन्छ।",
      p2Title: "पेसागत / प्राविधिक शिक्षा",
      p2Body: "निर्माणलाई केन्द्रमा राखी पेसाअनुसारको आधारभूत ज्ञान र साइटमा चाहिने काम, औजार, मेसिन र सुरक्षा नियम सिकाइन्छ। पढाइमा मात्र सीमित नराखी अभ्यासबाट शरीरले सिक्ने गरी।",
      p3Title: "जापानको जीवन / कार्यस्थल नियम शिक्षा",
      p3Body: "समयपालना, अभिवादन, जवाफ, सरसफाइ, मिलाएर राख्ने, होरेन्सो, सुरक्षा (KY, इसारा गरी बोलाउने) जस्ता जापानी कार्यस्थलमा विश्वास पाइने बानी दैनिक तालिममा स्वाभाविक नबनेसम्म सिकाइन्छ।",
      more: "विस्तृत हेर्नुहोस्"
    },
    strengths: {
      heading: "OUKA का बल",
      s1: "जापान रोजगारीमा केन्द्रित — सामान्य भाषा विद्यालय होइन, जापानको निर्माण साइट आदिमा तुरुन्तै काम गर्न सक्ने बनाउने शिक्षामा केन्द्रित।",
      s2: "योग्यतालाई अंकमा — ‘N4 छ’ होइन, ‘निर्माण योग्यता ◯ अंक’ जसरी कम्पनीले निर्णय गर्न सजिलो हुने गरी मूल्याङ्कन (JRS)।",
      s3: "प्रत्येकको व्यक्तिगत सिकाइ योजना — भाषा, अनुभव, बल र इच्छाअनुसार लक्ष्य र सिकाइको तरिका बनाइन्छ।",
      s4: "व्यावहारिक अन्तर्वार्ता तालिम — जापानी कम्पनीको अन्तर्वार्ता सोचेर बोल्ने, जवाफ र शिष्टाचार बारम्बार अभ्यास।",
      s5: "जापान जीवन / कार्यस्थल नियम तालिम — समयपालना, अभिवादन, सरसफाइ, होरेन्सो, सुरक्षा साइटको लयमा बानी नबनेसम्म।",
      s6: "भर्नादेखि रोजगारीसम्म प्रगति व्यवस्थापन — हाजिरी, सिकाइ, अन्तर्वार्ता र कागजातको अवस्था रेकर्ड गरी प्रस्थानसम्म सँगै।",
      s7: "स्नातकपछि पनि १० वर्ष सहयोग — पुगेपछि पनि परामर्श-सहयोग जारी राखी लामो समय टिक्न हेरचाह।"
    },
    jobs: {
      heading: "समर्थित पेसाहरू",
      lead: "हालको अवस्था। तयारी/परामर्शमा रहेका पेसाबारे पनि परामर्शमा कुरा गर्न सकिन्छ।",
      statusActive: "हाल उपलब्ध",
      statusPreparing: "तयारीमा",
      statusConsulting: "परामर्श खुला"
    },
    flow: {
      heading: "भर्नादेखि जापानमा रोजगारीसम्मको प्रक्रिया",
      m1: "चरण ०", step1: "निःशुल्क योग्यता जाँच / सोधपुछ", d1: "मोबाइलमा ५–१० मिनेट। सुहाउने कामको दिशा हेर्नुहोस्।",
      m2: "० महिना", step2: "परामर्श / भर्ना परामर्श", d2: "जापानी क्षमता, अनुभव, इच्छा र शुल्क हेरेर योजना सँगै बनाउँछौं।",
      m3: "भर्ना", step3: "भर्ना र स्तर जाँच", d3: "जापानी, शारीरिक बल र योग्यता जाँची व्यक्तिगत लक्ष्य तय गर्छौं।",
      m4: "१–६ महिना", step4: "जापानी + पेसागत + जीवन शिक्षा", d4: "हप्तामा ५ दिन, ९:००–१६:३०। वास्तविक साइटको लयमा सिकाइ।",
      m5: "५–६ महिना", step5: "योग्यता मूल्याङ्कन र अन्तर्वार्ता अभ्यास", d5: "‘निर्माण योग्यता ◯ अंक’ जसरी मूल्याङ्कन र अभ्यास।",
      m6: "६–८ महिना", step6: "कम्पनी अन्तर्वार्ता र म्याचिङ", d6: "उपयुक्त जापानी कम्पनीसँग अन्तर्वार्ता, त्यसपछि भिसा प्रक्रिया।",
      m7: "८–१२ महिना", step7: "तयारी र प्रस्थान", d7: "यात्रा र जीवनको तयारी, अनि जापान प्रस्थान।",
      m8: "पुगेपछि–१० वर्ष", step8: "रोजगारीपछि पनि सहयोग", d8: "जापानमा लामो समय टिक्न सहयोग जारी।",
      total: "भर्नादेखि प्रस्थानसम्म अनुमानित ~ ८–१२ महिना",
      note: "प्रत्येक चरण जापानी क्षमता, तयारी, परीक्षा नतिजा र कम्पनी छनोटमा भर पर्छ। रोजगारी/यात्रा/भिसाको ग्यारेन्टी छैन।"
    },
    tuition: {
      heading: "शुल्क (खर्च)",
      lead: "शुल्क स्पष्ट छ। भर्नाको समयमा एकमुष्ट अग्रिम भुक्तानी (फिर्ता हुँदैन)। किस्ता र समय परामर्शमा कुरा गर्न सकिन्छ।",
      totalLabel: "कुल शुल्क",
      totalNote: "भर्नामा एकमुष्ट (फिर्ता हुँदैन)",
      breakdownCaption: "शुल्कका सर्तहरू",
      r1: "शुल्क", r1n: "सबै कक्षा: ¥200,000",
      r2: "भुक्तानी", r2n: "भर्नामा एकमुष्ट अग्रिम",
      r3: "फिर्ता", r3n: "हुँदैन",
      r4: "N4 उत्तीर्ण", r4n: "उही शुल्क (छुट छैन)",
      r5: "", r5n: "",
      totalRow: "जम्मा",
      inHeading: "शुल्कमा समावेश",
      in1: "जापानी, साइट तालिम, नियमको कक्षा (हप्ता ५ दिन)",
      in2: "पाठ्यपुस्तक, सुरक्षा उपकरण, सामग्री",
      in3: "मूल्याङ्कन, अन्तर्वार्ता अभ्यास, कागजात सहयोग",
      in4: "प्रस्थानअघिसम्म निःशुल्क पुनः अभ्यास",
      in5: "पुगेपछि १० वर्षसम्म सहयोग",
      outHeading: "समावेश नभएको (छुट्टै)",
      out1: "परीक्षा शुल्क (JLPT, JFT, SSW आदि)",
      out2: "राहदानी / भिसा खर्च",
      out3: "जापानसम्मको यात्रा खर्च",
      out4: "जापानमा जीवनयापन / आवास खर्च",
      note: "शुल्क सबै कक्षाको लागि ¥200,000 हो। परीक्षा शुल्क, यात्रा र जीवनयापन खर्च छुट्टै लाग्छ। भुक्तानी विधि परामर्शमा पुष्टि गर्न सकिन्छ। रोजगारी, प्रस्थान र भिसा ग्यारेन्टी होइन।"
    },
    studentCta: { heading: "पहिले निःशुल्क योग्यता जाँचबाट", body: "५–१० मिनेटमा तपाईंलाई सुहाउन सक्ने कामको दिशा थाहा हुन्छ।", button: "निःशुल्क योग्यता जाँच लिनुहोस्" },
    companyCta: {
      heading: "जनशक्ति खोज्दै हुनुहुन्छ? (जापानी कम्पनी)",
      body: "OUKA ले भाषा मात्र होइन, पेसागत योग्यतासमेत मूल्याङ्कन गरेको जनशक्ति सिफारिस गर्छ। कम्पनीको आवश्यकता शिक्षामा प्रतिबिम्बित गर्छौं।",
      button: "कम्पनीहरूका लागि"
    },
    faq: {
      heading: "बारम्बार सोधिने प्रश्न",
      q1: "योग्यता जाँच निःशुल्क हो?",
      a1: "हो, निःशुल्क हो। मोबाइलबाट ५–१० मिनेटमा उत्तर दिन सकिन्छ।",
      q2: "जाँच लिएपछि पक्का जापान जान पाइन्छ?",
      a2: "होइन। जाँच सन्दर्भ जानकारी हो। वास्तविक पेसा र प्रस्थान — जापानी क्षमता, अनुभव, परीक्षा नतिजा, कम्पनी छनोट र निवास-स्थिति सर्तहरू जाँचेर तय हुन्छ। रोजगारी वा प्रस्थानको ग्यारेन्टी होइन।",
      q3: "जापानी बिल्कुल नआए पनि हुन्छ?",
      a3: "हुन्छ। हिरागानादेखि सिक्न सकिन्छ। जाँचमा हालको अवस्था लेख्नुहोस्, अनि प्रत्येकलाई सुहाउने सिकाइ योजना बनाउँछौं।",
      q4: "व्यक्तिगत जानकारी कसरी प्रयोग हुन्छ?",
      a4: "भर्ना परामर्श, उपयुक्त पेसा परामर्श र सुरक्षाका लागि प्रयोग हुन्छ। विस्तृत ‘व्यक्तिगत जानकारीको प्रयोग’ हेर्नुहोस्।",
      q5: "शुल्कबारे परामर्श गर्न सकिन्छ?",
      a5: "सकिन्छ। परामर्शमा शुल्क र भुक्तानीबारे कुरा गर्न सकिन्छ।"
    },
    contactSection: {
      heading: "सम्पर्क",
      lead: "प्रश्न वा परामर्श निःसंकोच गर्नुहोस्।"
    },
    footer: {
      tagline: "जापानी कम्पनीमा लामो समय टिक्ने जनशक्ति तयार गर्ने संस्था",
      privacy: "व्यक्तिगत जानकारीको प्रयोग",
      terms: "प्रयोगका सर्तहरू",
      copyright: "© 2026 Ouka Skill Training Center Pvt. Ltd."
    },
    disclaimer: {
      result: "यो नतिजा तपाईंको उत्तरमा आधारित सन्दर्भ जानकारी हो। वास्तविक पेसा — जापानी क्षमता, अनुभव, शारीरिक अवस्था, स्वास्थ्य, परीक्षा नतिजा, तपाईंको इच्छा, कम्पनी छनोट र निवास-स्थिति सर्तहरू जाँचेर निर्धारण गरिन्छ।",
      health: "स्वास्थ्यसम्बन्धी उत्तर उपयुक्त पेसा परामर्श र सुरक्षाका लागि मात्र प्रयोग हुन्छ। जाँच मात्रले भर्ना वा नियुक्ति निर्णय हुँदैन।",
      storage: "तपाईंका उत्तर यही यन्त्रको ब्राउजर (localStorage) मा अस्थायी रूपमा सुरक्षित हुन्छन्, जसले पछि जारी राख्न सकिन्छ। तपाईंले सहमति दिएर पठाउँदा मात्र डेटा पठाइन्छ।"
    },
    assessment: {
      title: "निःशुल्क योग्यता जाँच",
      intro: "तलका प्रश्नमा उत्तर दिनुहोस्। लगभग ५–१० मिनेट लाग्छ। बीचमा रोके पनि उही यन्त्रमा जारी राख्न सकिन्छ।",
      resumeNotice: "अघिको उत्तर भेटियो। जहाँ छाड्नुभयो त्यहीँबाट जारी राख्न सकिन्छ।",
      clearSaved: "सुरक्षित डेटा मेटाएर सुरुबाट",
      stepOf: "/",
      steps: {
        basic: "आधारभूत जानकारी",
        japanese: "जापानी र अध्ययन",
        experience: "शिक्षा र काम",
        personality: "स्वभाव र कार्यशैली",
        physical: "बल र कार्य-वातावरण",
        preference: "इच्छाहरू",
        confirm: "पुष्टि र पठाउने"
      },
      likertHint: "कति मिल्छ छान्नुहोस्।",
      confirmHeading: "उत्तरहरू पुष्टि",
      confirmLead: "उत्तर जाँच्नुहोस् र नतिजातिर जानुहोस्। सम्पादनका लागि ‘पछाडि’।",
      calcResult: "मेरो नतिजा हेर्नुहोस्",
      autosaved: "स्वतः सुरक्षित भयो",
      requiredConsent: "अगाडि बढ्न व्यक्तिगत जानकारीको प्रयोगमा सहमति दिनुहोस्।"
    },
    result: {
      title: "योग्यता जाँचको नतिजा",
      forWhom: "जसका लागि",
      date: "मिति",
      overall: "समग्र टिप्पणी",
      strengths: "तपाईंका बल",
      cautions: "पुष्टि गर्नुपर्ने कुरा",
      topJobs: "सुहाउन सक्ने पेसा (शीर्ष ३)",
      scoreChart: "पेसाअनुसार अंक",
      why: "किन सुहाउन सक्छ",
      prepare: "कसरी तयारी गर्ने",
      neededJp: "आवश्यक जापानी स्तर",
      lowPriorityNote: "कम अंकको अर्थ ‘नसुहाउने’ होइन — ‘हालको उत्तरअनुसार कम प्राथमिकता’ हो।",
      recommendMeeting: "थप सटीक मूल्याङ्कन स्टाफसँगको परामर्शमा गरिन्छ।",
      applyBtn: "भर्नाका लागि आवेदन",
      interviewBtn: "निःशुल्क परामर्श बुक",
      printBtn: "प्रिन्ट / PDF",
      restartBtn: "फेरि जाँच लिनुहोस्",
      noData: "नतिजा भेटिएन। कृपया फेरि जाँच लिनुहोस्।",
      goAssessment: "जाँच लिनुहोस्",
      scoreUnit: "अंक"
    },
    application: {
      title: "भर्ना / परामर्श आवेदन",
      intro: "जाँच लिनुभएको भए, भरिएको जानकारी स्वतः आउँछ (पटक-पटक लेख्नु पर्दैन)।",
      fromAssessment: "योग्यता जाँचको नतिजा जोडिएको छ।",
      course: "इच्छाएको कोर्स",
      interviewDate: "इच्छाएको परामर्श मिति/समय",
      interviewMethod: "परामर्श तरिका",
      methodVisit: "विद्यालय आउने",
      methodOnline: "अनलाइन",
      guardianJoin: "अभिभावक सँगै",
      freeNote: "स्वतन्त्र लेखन (प्रश्न/अनुरोध)",
      topJobsLabel: "जाँचका शीर्ष ३ पेसा",
      submit: "आवेदन गर्नुहोस्",
      thanksTitle: "आवेदन प्राप्त भयो",
      thanksBody: "स्टाफले हेरेर सम्पर्क गर्नेछ।"
    },
    company: {
      title: "जापानी कम्पनीका नियुक्ति प्रबन्धकहरूलाई",
      lead: "OUKA ले भाषा मात्र होइन, पेसागत योग्यतासमेत मूल्याङ्कन गरेको जनशक्ति तयार गरी सिफारिस गर्छ। कम्पनीको आवश्यकता शिक्षामा प्रतिबिम्बित गर्छौं।",
      policyHeading: "जनशक्ति विकास नीति",
      policyBody: "‘N4 छ’ होइन, ‘निर्माण योग्यता ◯ अंक’ जसरी व्यक्तिलाई अंकमा मूल्याङ्कन गरी सिफारिस गर्छौं। समयपालना, अभिवादन, सरसफाइ, होरेन्सो, सुरक्षा जस्ता जापानी कार्यस्थलमा विश्वास पाइने बानी दैनिक तालिममा बनाउँछौं।",
      evalHeading: "विद्यार्थी मूल्याङ्कन विषय",
      evalItems: ["जापानी", "कुराकानी", "सहकार्य", "नेतृत्व", "शारीरिक बल", "सुरक्षा चेतना", "अनुशासन", "अन्तर्वार्ता", "हाजिरी"],
      formHeading: "नियुक्ति / साझेदारी परामर्श",
      formLead: "तल भर्नुहोस्। जिम्मेवार व्यक्तिले सम्पर्क गर्नेछ।",
      f_company: "कम्पनीको नाम",
      f_person: "सम्पर्क व्यक्ति",
      f_email: "इमेल",
      f_phone: "फोन नम्बर",
      f_headcount: "नियुक्ति गर्ने संख्या",
      f_timing: "नियुक्ति समय",
      f_jobtype: "पेसा",
      f_location: "कार्यस्थल",
      f_jobdesc: "कामको विवरण",
      f_jplevel: "आवश्यक जापानी स्तर",
      f_skills: "आवश्यक सीप",
      f_dorm: "छात्रावास छ/छैन",
      f_interview: "अन्तर्वार्ता चाहन्छु",
      f_partnership: "व्यवसाय साझेदारी परामर्श चाहन्छु",
      f_message: "अन्य अनुरोध",
      submit: "पठाउनुहोस्"
    },
    contact: {
      title: "सम्पर्क",
      lead: "प्रश्न वा परामर्श निःसंकोच गर्नुहोस्। फारम वा फोन/WhatsApp/इमेलबाट सम्पर्क गर्नुहोस्।",
      f_name: "नाम",
      f_email: "इमेल",
      f_phone: "फोन नम्बर",
      f_type: "सोधपुछको प्रकार",
      type_student: "भर्ना/सिकाइबारे (विद्यार्थी/अभिभावक)",
      type_company: "नियुक्ति/साझेदारीबारे (कम्पनी)",
      type_other: "अन्य",
      f_message: "सोधपुछको विवरण",
      submit: "पठाउनुहोस्"
    },
    privacy: {
      title: "व्यक्तिगत जानकारीको प्रयोग",
      updated: "अन्तिम अद्यावधिक: सन् २०२६",
      intro: "OUKA स्किल ट्रेनिङ सेन्टर (Ouka Skill Training Center Pvt. Ltd., तल ‘हाम्रो विद्यालय’) ले योग्यता जाँच, भर्ना परामर्श र सोधपुछमा प्राप्त व्यक्तिगत जानकारी तल अनुसार प्रयोग गर्छ।",
      s1t: "१. सङ्कलन गरिने जानकारी",
      s1b: "नाम, सम्पर्क, जन्ममिति, शिक्षा-अनुभव, जापानी स्तर, जाँचका उत्तर र इच्छा जस्ता भर्ना परामर्श तथा शिक्षा-रोजगार सहयोगका लागि चाहिने जानकारी। Phase1 मा राहदानीको फोटो सङ्कलन गरिँदैन।",
      s2t: "२. प्रयोगको उद्देश्य",
      s2b: "भर्ना परामर्श, उपयुक्त पेसा परामर्श, शिक्षा योजना, अन्तर्वार्ता-रोजगार सहयोग, सुरक्षा र सम्पर्कका लागि प्रयोग हुन्छ। जाँच मात्रले नियुक्ति/भर्ना निर्णय हुँदैन।",
      s3t: "३. स्वास्थ्य जानकारी",
      s3b: "स्वास्थ्यसम्बन्धी उत्तर न्यूनतम राखी उपयुक्त पेसा परामर्श र सुरक्षाका लागि मात्र प्रयोग हुन्छ। SNS वा Slack मा स्वास्थ्य जानकारी पठाइँदैन।",
      s4t: "४. यन्त्रमा अस्थायी सुरक्षण",
      s4b: "जाँचको बीचको उत्तर पठाउनुअघि तपाईंकै यन्त्रको ब्राउजर (localStorage) मा मात्र रहन्छ, हाम्रो सर्भरमा पठाइँदैन। जाँचपछि मेट्न सकिन्छ।",
      s5t: "५. तेस्रो पक्षलाई नदिने",
      s5b: "तपाईंको सहमतिविना तेस्रो पक्षलाई दिइँदैन। रोजगार सहयोगका लागि कम्पनीलाई जानकारी बाँड्नुपर्दा उद्देश्य पहिल्यै बताइन्छ।",
      s6t: "६. सम्पर्क",
      s6b: "व्यक्तिगत जानकारी हेर्न/सच्याउन/मेट्न चाहनुहुन्छ भने तलको सम्पर्कमा सम्पर्क गर्नुहोस्।"
    },
    terms: {
      title: "प्रयोगका सर्तहरू",
      updated: "अन्तिम अद्यावधिक: सन् २०२६",
      intro: "यी सर्तहरूले OUKA स्किल ट्रेनिङ सेन्टरको वेबसाइट र योग्यता जाँचको प्रयोग-सर्त तोक्छन्।",
      s1t: "१. योग्यता जाँचबारे",
      s1b: "जाँचको नतिजा उत्तरमा आधारित सन्दर्भ जानकारी हो, पेसा निश्चित गर्ने होइन। वास्तविक पेसा, प्रस्थान र रोजगारी — जापानी क्षमता, अनुभव, बल, स्वास्थ्य, परीक्षा नतिजा, इच्छा, कम्पनी छनोट र निवास-स्थिति सर्तहरू जाँचेर तय हुन्छ।",
      s2t: "२. ग्यारेन्टी नगरिने कुरा",
      s2b: "हाम्रो विद्यालयले जापान यात्रा, रोजगारी, भिसा/निवास-स्थिति प्राप्ति, स्थायी बसोबास वा परीक्षा उत्तीर्ण ग्यारेन्टी गर्दैन। यी लक्ष्यका रूपमा, सर्त पूरा गर्न परामर्श-सहयोग गरिन्छ।",
      s3t: "३. जानकारीको सत्यता",
      s3b: "कृपया सही र पछिल्लो जानकारी भर्नुहोस्। तथ्यसँग नमिले उपयुक्त परामर्श-सहयोग नहुन सक्छ।",
      s4t: "४. निषेधित कार्य",
      s4b: "झूटा घोषणा, अरूको नक्कल, वा हाम्रो/तेस्रो पक्षको अधिकार उल्लङ्घन गर्ने कार्य निषेध छ।",
      s5t: "५. सर्त परिवर्तन",
      s5b: "आवश्यकताअनुसार यी सर्त संशोधन हुन सक्छन्। संशोधित सामग्री यसै पृष्ठमा राखिन्छ।"
    },
    errors: {
      required: "यो अनिवार्य हो।",
      email: "इमेल ठेगाना मिलेन।",
      phone: "फोन नम्बर अंकमा लेख्नुहोस्।",
      date: "मिति सही लेख्नुहोस्।",
      consent: "अगाडि बढ्न सहमति चाहिन्छ।",
      selectOne: "एउटा छान्नुहोस्।",
      number: "अंकमा लेख्नुहोस्।"
    },
    pages: {
      edu: {
        title: "शिक्षा",
        lead: "जापानी, पेसागत/प्राविधिक र जापानको जीवन तथा कार्यस्थल नियम — साइटको लयमा एकसाथ सिकाइन्छ।",
        jpTitle: "जापानी भाषा",
        jpBody: "हिरागाना-काताकानादेखि कामको कुराकानी र होरेन्सोसम्म क्रमशः। अभिवादन, परिचय, अंक, सुरक्षाका शब्द जस्ता साइटमा साँच्चै चाहिने जापानीलाई प्राथमिकता।",
        jpPoints: ["हिरागाना-काताकाना, आधारभूत अभिवादन", "कामको कुराकानी र होरेन्सो", "सुरक्षा/निर्देशनका शब्द", "अन्तर्वार्तामा बोल्ने अभ्यास", "JLPT / JFT-Basic तयारी"],
        vocTitle: "पेसागत / प्राविधिक",
        vocBody: "पेसाअनुसार आधारभूत ज्ञान र साइटमा चाहिने काम, औजार, सुरक्षा नियम। निर्माणलाई केन्द्रमा राखी अभ्यासबाट।",
        vocPoints: ["पेसाको आधारभूत ज्ञान", "औजार/मेसिन चलाउने", "सुरक्षा (KY, इसारा गरी बोलाउने)", "टोली-काम र योजना"],
        lifeTitle: "जापानको जीवन / कार्यस्थल नियम",
        lifeBody: "समयपालना, अभिवादन, सरसफाइ, होरेन्सो, सुरक्षा — जापानी कार्यस्थलमा विश्वास पाइने बानी दैनिक तालिमबाट।",
        lifePoints: ["समयपालना र प्रस्तुति", "अभिवादन र जवाफ", "सरसफाइ र मिलाउने", "होरेन्सो", "जापानको जीवन शिष्टाचार"]
      },
      visa: {
        title: "भिसा / निवास-स्थिति",
        lead: "जापानमा काम गर्न चाहिने मुख्य निवास-स्थिति (भिसा) र OUKA ले लक्ष्य गरेको बाटो। नियमहरू जापान सरकारको नीतिअनुसार बदलिन्छन्। रोजगारी, भिसा प्राप्ति र स्थायी बसोबासको ग्यारेन्टी छैन।",
        introTitle: "निवास-स्थिति भनेको के? (सरल व्याख्या)",
        introBody: "‘निवास-स्थिति’ भनेको विदेशीले जापानमा के गर्न पाउँछ भन्ने अनुमति हो (सामान्यतया ‘भिसा’ भनिन्छ)। OUKA ले जापानको निर्माण जस्ता क्षेत्रमा काम गर्न चाहनेलाई तयार गर्छ। वास्तवमा कुन स्थिति पाइन्छ — जापानी क्षमता, परीक्षा नतिजा, कम्पनी छनोट र स्थितिका सर्तमा भर पर्छ। पछिल्लो जानकारी र व्यक्तिगत अवस्था परामर्शमा पुष्टि गर्नुहोस्।",
        statusesTitle: "मुख्य निवास-स्थिति",
        s1Title: "विशिष्ट सीप १ (SSW i)",
        s1Body: "निश्चित सीप र जापानी भएका व्यक्तिले तोकिएको उद्योग क्षेत्रमा तुरुन्तै काम गर्न सक्ने स्थिति। OUKA ले पहिलो लक्ष्य गर्ने मुख्य बाटो।",
        s1Points: ["सर्त: सीप परीक्षा + जापानी परीक्षा (JLPT N4 / JFT-Basic A2 स्तर) उत्तीर्ण", "अवधि: जम्मा बढीमा ५ वर्ष", "परिवार: ल्याउन मिल्दैन", "अर्को चरण: सर्त पुगे विशिष्ट सीप २ तर्फ"],
        s2Title: "विशिष्ट सीप २ (SSW ii)",
        s2Body: "दक्ष सीप भएका व्यक्तिका लागि। जापानमा लामो समय काम गर्न र परिवारसँग बस्न सकिने सम्भावना।",
        s2Points: ["अवधि: नवीकरण गर्न सकिन्छ (लामो समय)", "परिवार: सर्त पुगे ल्याउन सकिन्छ", "स्थायी बसोबास: आवेदनको बाटो खुल्छ", "क्षेत्र: क्रमशः विस्तार हुँदै"],
        s3Title: "दक्षता विकास रोजगार (२०२७ अप्रिल–, प्रस्तावित)",
        s3Body: "प्राविधिक इन्टर्न तालिमको सट्टा आउने नयाँ प्रणाली। सामान्यतया ३ वर्षमा ‘विशिष्ट सीप १’ स्तरसम्म पुर्‍याउने लक्ष्य। सन् २०२७ अप्रिल १ बाट सुरु हुने प्रस्ताव।",
        s3Points: ["अवधि: सामान्यतया ३ वर्षमा विशिष्ट सीप १ स्तर", "क्षेत्र: विशिष्ट सीपका क्षेत्रसँग मिल्ने सम्भावना (निर्माण आदि)", "कम्पनी परिवर्तन: निश्चित सर्तमा सम्भव", "अर्को चरण: विशिष्ट सीप १ → २"],
        legacyTitle: "प्राविधिक इन्टर्न तालिमबारे",
        legacyBody: "अहिलेसम्मको ‘प्राविधिक इन्टर्न तालिम’ सन् २०२७ अप्रिलदेखि ‘दक्षता विकास रोजगार’ मा सर्दै जान्छ। अबदेखि जापान जानेका लागि दक्षता विकास रोजगार र विशिष्ट सीप मुख्य बाटो हुन्छन्।",
        pathTitle: "OUKA ले लक्ष्य गरेको बाटो",
        pathBody: "OUKA मा सिक्ने (जापानी + साइट तालिम + जापानी शिष्टाचार) → दक्षता विकास रोजगार (३ वर्ष) वा विशिष्ट सीप १ (परीक्षा उत्तीर्ण) → विशिष्ट सीप २ (नवीकरण, परिवारसँग बसोबास, स्थायी बसोबासको बाटो)। स्नातकपछि पनि १० वर्ष सँगै। रोजगारी, भिसा, प्रस्थान, स्थायी बसोबास ग्यारेन्टी होइन; सर्त पुर्‍याउन सहयोग गर्छौं।",
        tblCaption: "निवास-स्थिति द्रुत तालिका",
        tblHead: ["निवास-स्थिति", "अवधि", "परिवार", "मुख्य सर्त / विशेषता"],
        tblRows: [
          ["विशिष्ट सीप १", "जम्मा ५ वर्षसम्म", "मिल्दैन", "सीप + जापानी परीक्षा उत्तीर्ण"],
          ["विशिष्ट सीप २", "नवीकरण सम्भव", "मिल्छ", "दक्ष सीप। स्थायी बसोबासको बाटो"],
          ["दक्षता विकास रोजगार", "सामान्यतया ३ वर्ष", "सामान्यतया मिल्दैन", "३ वर्षमा विशिष्ट सीप १ स्तर (२०२७ अप्रिल–)"]
        ],
        note: "यस पृष्ठको सामग्री सामान्य व्याख्या हो (सन् २०२६ को अवस्था)। नियम जापान सरकारको नीतिअनुसार बदलिन सक्छ। वास्तवमा पाइने स्थिति र सर्त — जापानी क्षमता, परीक्षा, कम्पनी छनोट र जाँचमा भर पर्छ; OUKA ले रोजगारी, भिसा, प्रस्थान वा स्थायी बसोबास ग्यारेन्टी गर्दैन।"
      },
      gallery: {
        title: "तालिमका तस्बिर",
        lead: "दैनिक कक्षा र साइट तालिमका तस्बिर।",
        note: "सहमति दिएका तस्बिर मात्र राखिएका छन्।",
        empty: "तस्बिर तयारीमा छन्। क्रमशः राखिनेछ।",
        addHint: "स्टाफलाई: तस्बिर assets/images/gallery/ मा राखी gallery-data.js मा एक लाइन थप्दा देखिन्छ।"
      },
      students: {
        title: "विद्यार्थीहरू",
        lead: "OUKA मा सिक्ने विद्यार्थीहरू।",
        enrolled: "भर्ना संख्या",
        unit: "जना",
        showing: "देखाइँदै",
        level: "जापानी",
        qualification: "योग्यता / तालिम",
        course: "कोर्स",
        since: "भर्ना",
        consentNote: "प्रकाशन विद्यार्थीको सहमतिमा। नाम प्रदर्शन-नाम (इनिसियल पनि) हो।",
        empty: "विद्यार्थी जानकारी तयारीमा छ।"
      },
      reg: {
        title: "विद्यालय दर्ता / अनुमति",
        lead: "OUKA स्किल ट्रेनिङ सेन्टरको दर्ता-अवस्था।",
        sRegistered: "दर्ता भएको",
        sApplying: "आवेदनमा",
        sPreparing: "तयारीमा",
        disclaimer: "साँच्चै भएका/आवेदनमा रहेका मात्र राखिएका छन्। नलिएका अनुमति राखिँदैनन्।",
        docLabel: "प्रमाणपत्र",
        viewDoc: "प्रमाणपत्र हेर्नुहोस्"
      },
      partners: {
        title: "साझेदार / पठाउने संस्थाका लागि",
        lead: "पठाउने संस्था, कम्पनी र सम्बन्धित निकायसँगको सहकार्यलाई स्वागत छ। तयार गरेको जनशक्तिलाई सही मूल्याङ्कन गरी जोड्छौं।",
        listHeading: "साझेदार / सहकार्य",
        sendingOrg: "पठाउने संस्था",
        partner: "साझेदार",
        company: "स्वीकार गर्ने कम्पनी",
        empty: "सहकार्य निकाय क्रमशः राखिनेछ।",
        formHeading: "सहकार्य परामर्श",
        formLead: "तल भर्नुहोस्। जिम्मेवार व्यक्तिले सम्पर्क गर्नेछ।",
        f_org: "संस्था/कम्पनीको नाम",
        f_country: "देश / क्षेत्र",
        f_person: "सम्पर्क व्यक्ति",
        f_email: "इमेल",
        f_phone: "फोन / WhatsApp",
        f_type: "प्रकार",
        f_message: "परामर्शको विवरण",
        submit: "पठाउनुहोस्"
      },
      teachers: {
        title: "शिक्षक परिचय",
        lead: "OUKA का शिक्षकहरू। जापानी, साइट र जीवन सिकाउनुका साथै शिक्षक आफैँ पनि सिकिरहन्छन्।",
        role: "जिम्मेवारी",
        study: "अहिले सिकिरहेका कुरा",
        career: "यात्रा र करियर",
        video: "परिचय / अन्तर्वार्ता भिडियो",
        videoNote: "भिडियोमा जापानी कसरी सिके, जापानमा के गरे — सुरुदेखि अन्त्यसम्म बताइन्छ।",
        empty: "शिक्षक परिचय तयारीमा छ।"
      },
      faq: {
        title: "बारम्बार सोधिने प्रश्न",
        lead: "तपाईंलाई मन लाग्ने कुरामा पहिल्यै जवाफ।",
        allCat: "सबै",
        moreTitle: "अझै कुनै कुरा भए निःसंकोच सोध्नुहोस्",
        moreBody: "यहाँ नभएका प्रश्न पनि फोन, WhatsApp, इमेल वा फारमबाट सोध्नुहोस्।",
        contactBtn: "सम्पर्क",
        consultBtn: "निःशुल्क परामर्श"
      }
    }
  }
};
