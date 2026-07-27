/* ============================================================================
 * faq-data.js  ―  よくある質問（FAQ）
 * ----------------------------------------------------------------------------
 * ★質問を増やすのはかんたん：下の配列に1問1オブジェクトを足すだけ。
 *   { cat:"カテゴリキー", q:{ja,en,ne}, a:{ja,en,ne} }
 *   cat は下の CATS のキー。3言語すべて（ja/en/ne）を必ず埋めること。
 *
 * ⚠ 言語ルール：ネパール語(ne)を空にしない。ne が無いと英語で表示されてしまう。
 *   質問・回答を足したら ja/en/ne の3つを必ず書く。
 * ⚠ コンプラ：就職・渡日・ビザ・永住・合格は「保証」しない表現にすること。
 *   「必ず」「絶対」「保証」は使わない。「目指す／条件を満たせば相談・支援」と書く。
 * ==========================================================================*/

window.OUKA_FAQ_CATS = {
  admission: { ja: "入学・費用", en: "Admission & fees", ne: "भर्ना र शुल्क" },
  study:     { ja: "日本語・学習", en: "Japanese & study", ne: "जापानी र अध्ययन" },
  jobs:      { ja: "仕事・職種", en: "Work & occupations", ne: "काम र पेसा" },
  japan:     { ja: "渡日・在留資格", en: "Going to Japan & status", ne: "जापान र निवास" },
  life:      { ja: "生活・家族", en: "Life & family", ne: "जीवन र परिवार" },
  check:     { ja: "適性診断について", en: "About the aptitude check", ne: "योग्यता जाँचबारे" }
};

window.OUKA_FAQ = [
  // --- 入学・費用 ---
  { cat: "admission",
    q: { ja: "入学の条件はありますか？", en: "Are there admission requirements?", ne: "भर्ना हुन कुनै सर्त छ?" },
    a: { ja: "健康で、日本で働く意思があり、学ぶ意欲のある方を歓迎します。日本語が未経験でも入学できます。詳しくは無料面談でご相談ください。",
         en: "We welcome those who are healthy, intend to work in Japan, and are motivated to learn. You can enroll even with no Japanese. Please ask at the free consultation.",
         ne: "स्वस्थ हुनुहुन्छ, जापानमा काम गर्ने इच्छा छ र सिक्ने जाँगर छ भने तपाईंलाई स्वागत छ। जापानी भाषा नजाने पनि भर्ना हुन सकिन्छ। विस्तृत कुरा नि:शुल्क परामर्शमा सोध्नुहोस्।" } },
  { cat: "admission",
    q: { ja: "学費はいくらですか？", en: "How much is the tuition?", ne: "शुल्क कति हो?" },
    a: { ja: "コースや期間によって異なります。金額・支払い方法は無料面談で具体的にご説明します。支払いの相談も可能です。",
         en: "It depends on the course and duration. We explain the exact amount and payment methods at the free consultation, and payment can be discussed.",
         ne: "कोर्स र अवधि अनुसार फरक पर्छ। रकम र भुक्तानीको तरिका नि:शुल्क परामर्शमा स्पष्ट रूपमा बताउँछौं। भुक्तानीबारे सल्लाह पनि गर्न सकिन्छ।" } },
  { cat: "admission",
    q: { ja: "支払いは分割できますか？", en: "Can I pay in installments?", ne: "शुल्क किस्ताबन्दीमा तिर्न सकिन्छ?" },
    a: { ja: "ご事情に応じて相談を受け付けています。まずは面談でご相談ください。",
         en: "We accept discussions depending on your situation. Please raise it at the consultation.",
         ne: "तपाईंको अवस्था अनुसार सल्लाह गर्न सकिन्छ। पहिले परामर्शमा कुरा गर्नुहोस्।" } },
  { cat: "admission",
    q: { ja: "申し込みはどうすればいいですか？", en: "How do I apply?", ne: "आवेदन कसरी दिने?" },
    a: { ja: "このサイトの「無料適性診断」を受けてから「入学・面談のお申し込み」に進むと、入力がスムーズです。お電話・WhatsAppでも受け付けます。",
         en: "Take the free aptitude check, then go to the enrollment/consultation form for a smooth flow. Phone and WhatsApp are also welcome.",
         ne: "यस साइटको \"नि:शुल्क योग्यता जाँच\" गरेपछि \"भर्ना/भेटघाट आवेदन\" मा जानुभयो भने विवरण भर्न सजिलो हुन्छ। फोन वा WhatsApp बाट पनि आवेदन लिन्छौं।" } },

  // --- 日本語・学習 ---
  { cat: "study",
    q: { ja: "日本語が全くできませんが大丈夫ですか？", en: "Is it okay if I can't speak Japanese at all?", ne: "मलाई जापानी भाषा बिल्कुल आउँदैन, हुन्छ?" },
    a: { ja: "はい。ひらがなから始められます。一人ひとりに合った学習計画を一緒に作ります。",
         en: "Yes. You can start from hiragana. We build a study plan suited to you.",
         ne: "हुन्छ। हिरागानादेखि सुरु गर्न सकिन्छ। हरेक व्यक्तिलाई सुहाउने अध्ययन योजना सँगै बनाउँछौं।" } },
  { cat: "study",
    q: { ja: "どのくらいで話せるようになりますか？", en: "How long until I can speak?", ne: "कति समयमा बोल्न सक्ने हुन्छु?" },
    a: { ja: "個人差がありますが、毎日の学習と練習で着実に伸びます。目標に向けて計画的に進めます（習得を保証するものではありません）。",
         en: "It varies by person, but with daily study and practice you steadily improve. We proceed toward your goal (mastery is not guaranteed).",
         ne: "व्यक्ति अनुसार फरक हुन्छ, तर दैनिक अध्ययन र अभ्यासले पक्का प्रगति हुन्छ। लक्ष्यतर्फ योजनाबद्ध रूपमा अघि बढ्छौं (सिकाइको ग्यारेन्टी होइन)।" } },
  { cat: "study",
    q: { ja: "オンラインでも学べますか？", en: "Can I learn online?", ne: "अनलाइनबाट पनि सिक्न सकिन्छ?" },
    a: { ja: "状況に応じてオンライン授業や補習に対応します。スマートフォンとインターネット環境があると便利です。",
         en: "We offer online classes and supplementary lessons depending on the situation. A smartphone and internet help.",
         ne: "अवस्था अनुसार अनलाइन कक्षा र थप कक्षा उपलब्ध गराउँछौं। स्मार्टफोन र इन्टरनेट भएमा सजिलो हुन्छ।" } },
  { cat: "study",
    q: { ja: "JLPTやJFT-Basicの対策はありますか？", en: "Do you prepare for JLPT / JFT-Basic?", ne: "JLPT वा JFT-Basic को तयारी हुन्छ?" },
    a: { ja: "はい。試験に向けた学習も行います。ただし合格を保証するものではありません。",
         en: "Yes, we study toward the exams. However, passing is not guaranteed.",
         ne: "हुन्छ। परीक्षाका लागि तयारी पनि गराउँछौं। तर उत्तीर्णको ग्यारेन्टी भने होइन।" } },

  // --- 仕事・職種 ---
  { cat: "jobs",
    q: { ja: "どんな仕事に就けますか？", en: "What kinds of jobs can I get?", ne: "कस्तो काम पाइन्छ?" },
    a: { ja: "建設・介護・農業・外食などを中心に育成します。実際の職種は、日本語力・経験・体力・試験・企業選考・在留資格要件などを確認して決まります。",
         en: "We focus on construction, caregiving, agriculture, food service, and more. The actual occupation is decided after confirming Japanese, experience, strength, exams, company selection, and status requirements.",
         ne: "निर्माण, स्याहार (केयर), कृषि, खाद्य सेवा आदिलाई केन्द्रमा राखेर तयार पार्छौं। वास्तविक पेसा भने जापानी भाषा, अनुभव, शारीरिक क्षमता, परीक्षा, कम्पनीको छनोट र निवास अनुमतिका सर्तहरू हेरेर निर्धारण हुन्छ।" } },
  { cat: "jobs",
    q: { ja: "自分に向いている仕事が分かりません。", en: "I don't know which job suits me.", ne: "मलाई कुन काम सुहाउँछ थाहा छैन।" },
    a: { ja: "無料の適性診断で、向いている可能性のある職種の方向性が分かります。結果は参考情報で、面談でさらに具体化します。",
         en: "The free aptitude check shows the direction of jobs that may suit you. Results are reference information and are refined at the consultation.",
         ne: "नि:शुल्क योग्यता जाँचबाट तपाईंलाई सुहाउन सक्ने पेसाको दिशा थाहा हुन्छ। नतिजा सन्दर्भ जानकारी हो, परामर्शमा अझ स्पष्ट पारिन्छ।" } },
  { cat: "jobs",
    q: { ja: "女性でも建設や介護で働けますか？", en: "Can women work in construction or caregiving?", ne: "महिलाले पनि निर्माण वा स्याहारमा काम गर्न सक्छन्?" },
    a: { ja: "職種や作業内容によります。体力・希望・適性をふまえ、無理のない選択を一緒に考えます。",
         en: "It depends on the occupation and tasks. We consider a realistic choice together based on strength, wishes, and aptitude.",
         ne: "पेसा र कामको प्रकृति अनुसार हुन्छ। शारीरिक क्षमता, इच्छा र योग्यता हेरेर उपयुक्त छनोट सँगै सोच्छौं।" } },

  // --- 渡日・在留資格 ---
  { cat: "japan",
    q: { ja: "必ず日本へ行けますか？", en: "Can I definitely go to Japan?", ne: "के म पक्का जापान जान पाउँछु?" },
    a: { ja: "いいえ、保証はできません。日本語力・試験・企業選考・在留資格要件などの条件を満たせるよう、相談・支援します。",
         en: "No, it cannot be guaranteed. We provide consultation and support so you can meet the conditions — Japanese, exams, company selection, and status requirements.",
         ne: "होइन, ग्यारेन्टी गर्न सकिँदैन। जापानी भाषा, परीक्षा, कम्पनी छनोट र निवास अनुमतिका सर्तहरू पूरा गर्न सकियोस् भनेर परामर्श र सहयोग गर्छौं।" } },
  { cat: "japan",
    q: { ja: "ビザは取れますか？", en: "Can I get a visa?", ne: "के भिसा पाइन्छ?" },
    a: { ja: "ビザ・在留資格の取得は保証できません。制度の要件は変わることがあり、最新の条件に沿って準備を進めます。",
         en: "Visa/residence status is not guaranteed. Requirements can change, and we prepare in line with the latest conditions.",
         ne: "भिसा/निवास अनुमति पाउने ग्यारेन्टी गर्न सकिँदैन। प्रणालीका सर्तहरू परिवर्तन हुन सक्छन्, त्यसैले पछिल्लो सर्त अनुसार तयारी अघि बढाउँछौं।" } },
  { cat: "japan",
    q: { ja: "特定技能と育成就労の違いは何ですか？", en: "What's the difference between SSW and ESD?", ne: "तोकिएको सीप (Tokutei Ginou) र विकास रोजगार (Ikusei Shurou) बीच के फरक छ?" },
    a: { ja: "制度・対象・条件が異なります。あなたの状況に合う道を面談で分かりやすく説明します。",
         en: "They differ in system, scope, and conditions. We explain the path that fits your situation at the consultation.",
         ne: "प्रणाली, दायरा र सर्तहरू फरक हुन्छन्। तपाईंको अवस्थासँग मिल्ने बाटो परामर्शमा सजिलोसँग बुझाउँछौं।" } },

  // --- 生活・家族 ---
  { cat: "life",
    q: { ja: "家族が反対しています。", en: "My family is against it.", ne: "मेरो परिवार विरोधमा छ।" },
    a: { ja: "ご家族の同意はとても大切です。費用・仕事・生活について、ご家族も一緒に面談で確認できます。",
         en: "Family consent is very important. Your family can join the consultation to review fees, work, and life.",
         ne: "परिवारको सहमति धेरै महत्त्वपूर्ण हुन्छ। खर्च, काम र जीवनबारे परिवार पनि सँगै परामर्शमा बुझ्न सक्नुहुन्छ।" } },
  { cat: "life",
    q: { ja: "日本での生活が不安です。", en: "I'm worried about life in Japan.", ne: "जापानको जीवनबारे मलाई चिन्ता छ।" },
    a: { ja: "生活・職場のルール（時間厳守・あいさつ・清掃・報連相・安全）を入学中に学びます。卒業後も相談・支援を続けます。",
         en: "You learn life and workplace rules during the program, and we continue consultation and support after graduation.",
         ne: "जीवन र कार्यस्थलका नियम (समयको पालना, अभिवादन, सरसफाइ, रिपोर्ट/सम्पर्क/परामर्श, सुरक्षा) भर्ना अवधिमै सिक्नुहुन्छ। स्नातकपछि पनि परामर्श र सहयोग जारी राख्छौं।" } },

  // --- 適性診断について ---
  { cat: "check",
    q: { ja: "適性診断は無料ですか？", en: "Is the aptitude check free?", ne: "योग्यता जाँच नि:शुल्क हो?" },
    a: { ja: "はい、無料です。スマートフォンから5〜10分で回答できます。",
         en: "Yes, it is free. It takes 5–10 minutes on a smartphone.",
         ne: "हो, नि:शुल्क हो। स्मार्टफोनबाट ५–१० मिनेटमा जवाफ दिन सकिन्छ।" } },
  { cat: "check",
    q: { ja: "診断結果で入学や仕事が決まりますか？", en: "Does the result decide enrollment or my job?", ne: "जाँचको नतिजाले भर्ना वा काम निर्धारण हुन्छ?" },
    a: { ja: "いいえ。結果は参考情報です。入学・職種は、日本語力・経験・体力・健康・試験・本人の希望・企業選考・在留資格要件などを確認して決めます。",
         en: "No. The result is reference information. Enrollment and occupation are decided after confirming Japanese, experience, strength, health, exams, your wishes, company selection, and status requirements.",
         ne: "होइन। नतिजा सन्दर्भ जानकारी मात्र हो। भर्ना र पेसा भने जापानी भाषा, अनुभव, शारीरिक क्षमता, स्वास्थ्य, परीक्षा, आफ्नो इच्छा, कम्पनी छनोट र निवास अनुमतिका सर्तहरू हेरेर निर्धारण हुन्छ।" } },
  { cat: "check",
    q: { ja: "入力した情報はどう使われますか？", en: "How is my entered information used?", ne: "मैले भरेको जानकारी कसरी प्रयोग हुन्छ?" },
    a: { ja: "入学相談・適切な職種相談・安全配慮・ご連絡のために使います。健康情報は限定的に扱い、SNSやSlackへは送りません。詳しくは「個人情報の取扱い」をご覧ください。",
         en: "For enrollment consultation, suitable job consultation, safety consideration, and contact. Health info is handled minimally and never sent to SNS/Slack. See 'Handling of personal information'.",
         ne: "भर्ना परामर्श, उपयुक्त पेसाको परामर्श, सुरक्षाको ध्यान र सम्पर्कका लागि प्रयोग हुन्छ। स्वास्थ्य जानकारी सीमित रूपमा मात्र प्रयोग गरिन्छ, SNS वा Slack मा पठाइँदैन। विस्तृत कुरा \"व्यक्तिगत जानकारीको व्यवस्थापन\" मा हेर्नुहोस्।" } }
];
