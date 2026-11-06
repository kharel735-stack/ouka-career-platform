/* ============================================================================
 * emergency.js ― 緊急のとき（電話番号・言うこと・相談先）
 *
 *  ★番号は公式サイトで確認したものだけ（2026-09-23 確認）。
 *    110／119＝全国共通・24時間・通話無料。通訳を入れた三者通話ができる場合がある。
 *    #9910 道路緊急ダイヤル（国土交通省・24時間・無料）＝道路の落下物・穴・こわれ。
 *    #9110 警察相談専用電話＝事件事故になっていない相談。
 *    #8103（ハートさん）＝性犯罪被害相談（警察・全国共通）。
 *    #8891（はやくワンストップ）＝性犯罪・性暴力被害者のワンストップ支援センター。
 *  ★「何番にかけるか」を間違えると助けが遅れる。ここは推測で足さない。
 *  ★病院・警察の手続きの詳細は、生活・就労ガイドブック（ネパール語）を見る。
 * ==========================================================================*/
window.OUKA_EMERGENCY = {
  updated: "2026-09-23",

  /* 電話をかける前に、紙とスマホに書いておく（授業で書かせる） */
  before: [
    "自分の名前（ローマ字と、日本語の読み）",
    "今いる場所（住所・会社名・近くの建物）",
    "自分の電話番号",
    "会社（受入企業）の電話番号と、担当の人の名前",
    "学校・支援機関の電話番号"
  ],

  numbers: [
    {
      no: "119", name: "救急車・火事", color: "red",
      when: ["けがをした／急に具合が悪い", "火事", "人が倒れている"],
      say: [
        "「救急です」または「火事です」",
        "場所（住所・近くの建物）",
        "何があったか（例：仕事中に手をけがしました）",
        "自分の名前と電話番号"
      ],
      note: "全国共通・24時間・無料。日本語が話せない時は、通訳を入れて三者で話せることがある。",
      src: "総務省消防庁", url: "https://www.fdma.go.jp/publication/materials/post11.html"
    },
    {
      no: "110", name: "警察（事件・交通事故）", color: "blue",
      when: ["交通事故にあった／起こした", "物を盗まれた", "痴漢・暴力にあった", "けんか・あぶない人がいる"],
      say: [
        "「事故です」または「助けてください」",
        "場所（住所・近くの建物・道路の名前）",
        "いつ・何があったか",
        "けが人がいるか",
        "自分の名前と電話番号"
      ],
      note: "全国共通・24時間・無料。★交通事故は、小さな事故でも必ず110番する（警察の書類がないと保険が使えないことがある）。その場で示談にしない。",
      src: "警察庁・政府広報", url: "https://www.gov-online.go.jp/article/201309/entry-7508.html"
    },
    {
      no: "#9910", name: "道路の落下物・こわれ（道路緊急ダイヤル）", color: "orange",
      when: ["高速道路や国道に物が落ちている", "道路に穴がある・こわれている", "落とし物で危ない"],
      say: ["道路の名前・場所（上り／下り、近くの標識）", "何が落ちているか", "自分の名前と電話番号"],
      note: "国土交通省・24時間・通話無料。けが人がいる事故は #9910 ではなく 110／119。",
      src: "国土交通省", url: "https://www.mlit.go.jp/road/dia/"
    },
    {
      no: "#9110", name: "警察に相談（事件になっていないこと）", color: "blue",
      when: ["ストーカー・しつこい人がいる", "お金のトラブル", "不安なこと（すぐの危険ではない）"],
      say: ["何に困っているか", "いつから", "自分の名前と連絡先"],
      note: "急ぎで危ないときは 110。#9110 は相談の窓口（平日の昼が中心。地域によって時間が違う）。",
      src: "警察庁・政府広報", url: "https://www.gov-online.go.jp/prg/prg8410.html"
    },
    {
      no: "#8103", name: "性犯罪の被害相談（ハートさん）", color: "purple",
      when: ["痴漢にあった", "体をさわられた", "性的な被害を受けた"],
      say: ["話せる範囲でよい", "いつ・どこで", "今、安全かどうか"],
      note: "警察の相談窓口（全国共通）。あなたは悪くない。証拠が残ることがあるので、洗う前・着がえる前に相談する。",
      src: "警察庁", url: "https://www.npa.go.jp/higaisya/seihanzai/seihanzai.html"
    },
    {
      no: "#8891", name: "性暴力の被害者を助けるセンター（ワンストップ）", color: "purple",
      when: ["病院・警察・こころの相談を、まとめて相談したい"],
      say: ["いつ・どこで", "けがや体の心配", "だれにも言えない場合も相談できる"],
      note: "内閣府のワンストップ支援センター（全国共通）。医療・法律・こころの支援がつながる。",
      src: "内閣府 男女共同参画局", url: "https://www.gender.go.jp/policy/no_violence/seibouryoku/consult.html"
    }
  ],

  /* 場面ごとの動き方（順番）。番号の使い分けを間違えないための表。 */
  cases: [
    { case: "仕事中にけがをした", steps: ["まず安全な場所へ", "119（重いとき）／会社の人にすぐ言う", "会社に「労災です」と伝える", "病院で「仕事中のけがです」と言う"], call: "119" },
    { case: "交通事故にあった（車・自転車）", steps: ["けが人を確認", "110に電話", "相手の名前・車のナンバー・連絡先を聞く", "その場でお金の話をしない", "会社と学校に連絡"], call: "110" },
    { case: "高速道路で物が落ちている", steps: ["車を止めない（あぶない）", "安全な場所から #9910", "道路の名前と場所を言う"], call: "#9910" },
    { case: "痴漢にあった", steps: ["安全な場所へ移動", "駅員・近くの人に助けを求める", "110 または #8103", "洗う前・着がえる前に相談"], call: "110 / #8103" },
    { case: "財布・在留カードをなくした", steps: ["110（落とし物・盗難の届け）", "在留カードは入管へ届ける", "会社と学校に連絡"], call: "110" },
    { case: "地震・台風", steps: ["机の下に入る／火を消す", "外に出るときは頭を守る", "会社と学校に無事を連絡", "テレビ・アプリで情報を見る"], call: "" },
    { case: "急に具合が悪い（夜・休みの日）", steps: ["119（重いとき）", "軽いときは会社・学校に連絡して病院を聞く"], call: "119" }
  ],

  /* 読む・見る（ネパール語があるものを先に） */
  materials: [
    { title: "生活・就労ガイドブック（ネパール語・無料PDF）", url: "https://www.moj.go.jp/isa/content/001450892.pdf",
      org: "出入国在留管理庁", lang: "ネパール語" },
    { title: "生活・就労ガイドブック（やさしい日本語・無料PDF）", url: "https://www.moj.go.jp/isa/content/001423934.pdf",
      org: "出入国在留管理庁", lang: "やさしい日本語" },
    { title: "動画：緊急・災害（ネパール語）", url: "https://www.youtube.com/watch?v=epEmA_Pw8N8",
      org: "出入国在留管理庁", lang: "ネパール語" },
    { title: "動画：病院（ネパール語）", url: "https://www.youtube.com/watch?v=hg8DJ_mmuSQ",
      org: "出入国在留管理庁", lang: "ネパール語" },
    { title: "動画：「緊急時の対応」について知っておこう（日本語）", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_05",
      org: "文部科学省", lang: "日本語" },
    { title: "119番の正しいかけ方（日本語）", url: "https://www.fdma.go.jp/publication/materials/post11.html",
      org: "総務省消防庁", lang: "日本語" }
  ]
};

/* 英語（2026-10-26 代表「日本語と英語が混ざって分からない」）＝日本語の文をキーに 英語を引く。
 * ★番号と手順は 上の日本語と同じ意味。言う日本語（「 」）は 日本語のまま ローマ字と 意味を 添える。推測で 足さない。 */
window.OUKA_EMERGENCY_EN = {
  "全国共通・24時間・無料（110／119）": "Nationwide · 24 hours · free (110 / 119)",
  "いのちが危ないときは、日本語が下手でも電話してよい。": "If a life is in danger, call — even if your Japanese is not good.",
  "「たすけてください」と言って、": "Say \u300ctasukete kudasai\u300d (\u201cplease help\u201d) and give your ",
  "場所": "location",
  "を言う。切らないで待つ。": ". Do not hang up — wait on the line.",
  "こんな時": "When to call",
  "電話で言うこと": "What to say",
  "こんな時どうする（順番）": "What to do, step by step",
  "すること（順番）": "Steps",
  "電話": "Number",
  "電話の前に、書いておく": "Write these down before an emergency",
  "読む・見る": "Read & watch",
  "出典：": "Source: ",
  "救急車・火事": "Ambulance / Fire",
  "警察（事件・交通事故）": "Police (crime / traffic accident)",
  "道路の落下物・こわれ（道路緊急ダイヤル）": "Road hazard (Road Emergency Dial)",
  "警察に相談（事件になっていないこと）": "Police consultation (not an emergency)",
  "性犯罪の被害相談（ハートさん）": "Sexual crime victim consultation",
  "性暴力の被害者を助けるセンター（ワンストップ）": "Sexual violence support centre (one-stop)",
  "けがをした／急に具合が悪い": "You are injured or suddenly feel very sick",
  "火事": "There is a fire",
  "人が倒れている": "Someone has collapsed",
  "交通事故にあった／起こした": "You were in a traffic accident",
  "物を盗まれた": "Something was stolen",
  "痴漢・暴力にあった": "You were harassed or attacked",
  "けんか・あぶない人がいる": "A fight or a dangerous person",
  "高速道路や国道に物が落ちている": "An object is on an expressway or national road",
  "道路に穴がある・こわれている": "A hole or damage in the road",
  "落とし物で危ない": "A dropped object is dangerous",
  "ストーカー・しつこい人がいる": "Stalking or someone who will not leave you alone",
  "お金のトラブル": "Money trouble",
  "不安なこと（すぐの危険ではない）": "A worry (no immediate danger)",
  "痴漢にあった": "You were groped",
  "体をさわられた": "You were touched without consent",
  "性的な被害を受けた": "You suffered sexual harm",
  "病院・警察・こころの相談を、まとめて相談したい": "You want help with hospital, police and counselling in one place",
  "「救急です」または「火事です」": "Say \u300c\u6551\u6025\u3067\u3059\u300d (kyuukyuu desu = \u201cambulance\u201d) or \u300c\u706b\u4e8b\u3067\u3059\u300d (kaji desu = \u201cfire\u201d)",
  "場所（住所・近くの建物）": "Your location (address or a nearby building)",
  "何があったか（例：仕事中に手をけがしました）": "What happened (e.g. \u201cI hurt my hand at work\u201d)",
  "自分の名前と電話番号": "Your name and phone number",
  "「事故です」または「助けてください」": "Say \u300c\u4e8b\u6545\u3067\u3059\u300d (jiko desu = \u201cthere was an accident\u201d) or \u300c\u52a9\u3051\u3066\u304f\u3060\u3055\u3044\u300d (tasukete kudasai = \u201cplease help\u201d)",
  "場所（住所・近くの建物・道路の名前）": "Your location (address, nearby building, road name)",
  "いつ・何があったか": "When and what happened",
  "けが人がいるか": "Whether anyone is injured",
  "道路の名前・場所（上り／下り、近くの標識）": "Road name and place (up / down direction, nearby sign)",
  "何が落ちているか": "What has fallen",
  "何に困っているか": "What the problem is",
  "いつから": "Since when",
  "自分の名前と連絡先": "Your name and contact number",
  "話せる範囲でよい": "Tell only what you can",
  "いつ・どこで": "When and where",
  "今、安全かどうか": "Whether you are safe now",
  "けがや体の心配": "Injuries or health worries",
  "だれにも言えない場合も相談できる": "You can consult even if you cannot tell anyone",
  "全国共通・24時間・無料。日本語が話せない時は、通訳を入れて三者で話せることがある。": "Nationwide, 24 hours, free. If you cannot speak Japanese, an interpreter can sometimes join a three-way call.",
  "全国共通・24時間・無料。★交通事故は、小さな事故でも必ず110番する（警察の書類がないと保険が使えないことがある）。その場で示談にしない。": "Nationwide, 24 hours, free. Always call 110 after a traffic accident, even a small one (without a police report, insurance may not pay). Do not settle with the other person on the spot.",
  "国土交通省・24時間・通話無料。けが人がいる事故は #9910 ではなく 110／119。": "Ministry of Land, Infrastructure, Transport and Tourism. 24 hours, free. If someone is hurt, call 110 / 119, not #9910.",
  "急ぎで危ないときは 110。#9110 は相談の窓口（平日の昼が中心。地域によって時間が違う）。": "If it is urgent or dangerous, call 110. #9110 is a consultation line (mainly weekday daytime; hours differ by area).",
  "警察の相談窓口（全国共通）。あなたは悪くない。証拠が残ることがあるので、洗う前・着がえる前に相談する。": "Police consultation line (nationwide). It is not your fault. Evidence may remain, so call before washing or changing clothes.",
  "内閣府のワンストップ支援センター（全国共通）。医療・法律・こころの支援がつながる。": "Cabinet Office one-stop support centre (nationwide). Connects you to medical, legal and mental-health support.",
  "仕事中にけがをした": "You were injured at work",
  "交通事故にあった（車・自転車）": "A traffic accident (car or bicycle)",
  "高速道路で物が落ちている": "An object is on the expressway",
  "財布・在留カードをなくした": "You lost your wallet or residence card",
  "地震・台風": "Earthquake or typhoon",
  "急に具合が悪い（夜・休みの日）": "You suddenly feel sick (night or holiday)",
  "まず安全な場所へ": "Move to a safe place first",
  "119（重いとき）／会社の人にすぐ言う": "Call 119 if serious, and tell your company at once",
  "会社に「労災です」と伝える": "Tell the company \u300c\u52b4\u707d\u3067\u3059\u300d (rousai desu = \u201cwork injury\u201d)",
  "病院で「仕事中のけがです」と言う": "At the hospital say \u300c\u4ed5\u4e8b\u4e2d\u306e\u3051\u304c\u3067\u3059\u300d (shigoto-chuu no kega desu = \u201cI got hurt at work\u201d)",
  "けが人を確認": "Check for injured people",
  "110に電話": "Call 110",
  "相手の名前・車のナンバー・連絡先を聞く": "Get the other person\u2019s name, plate number and contact details",
  "その場でお金の話をしない": "Do not discuss money on the spot",
  "会社と学校に連絡": "Contact your company and school",
  "車を止めない（あぶない）": "Do not stop your car (dangerous)",
  "安全な場所から #9910": "Call #9910 from a safe place",
  "道路の名前と場所を言う": "Give the road name and place",
  "安全な場所へ移動": "Move to a safe place",
  "駅員・近くの人に助けを求める": "Ask station staff or people nearby for help",
  "110 または #8103": "Call 110 or #8103",
  "洗う前・着がえる前に相談": "Consult before washing or changing clothes",
  "110（落とし物・盗難の届け）": "Call 110 to report lost or stolen items",
  "在留カードは入管へ届ける": "Report a lost residence card to the Immigration Services Agency",
  "机の下に入る／火を消す": "Get under a desk; turn off fires",
  "外に出るときは頭を守る": "Protect your head if you go outside",
  "会社と学校に無事を連絡": "Tell your company and school you are safe",
  "テレビ・アプリで情報を見る": "Check information on TV or an app",
  "119（重いとき）": "Call 119 if serious",
  "軽いときは会社・学校に連絡して病院を聞く": "If mild, contact your company or school and ask which hospital to go to",
  "自分の名前（ローマ字と、日本語の読み）": "Your name (in Roman letters, and how to read it in Japanese)",
  "今いる場所（住所・会社名・近くの建物）": "Where you are (address, company name, nearby building)",
  "自分の電話番号": "Your phone number",
  "会社（受入企業）の電話番号と、担当の人の名前": "Your company\u2019s phone number and the name of your contact person",
  "学校・支援機関の電話番号": "Phone number of your school / support organisation",
  "総務省消防庁": "Fire and Disaster Management Agency",
  "警察庁・政府広報": "National Police Agency / Government Public Relations",
  "国土交通省": "Ministry of Land, Infrastructure, Transport and Tourism",
  "警察庁": "National Police Agency",
  "内閣府 男女共同参画局": "Cabinet Office, Gender Equality Bureau",
  "生活・就労ガイドブック（ネパール語・無料PDF）": "Life & Work Guidebook (Nepali, free PDF)",
  "生活・就労ガイドブック（やさしい日本語・無料PDF）": "Life & Work Guidebook (Easy Japanese, free PDF)",
  "動画：緊急・災害（ネパール語）": "Video: Emergencies & disasters (Nepali)",
  "動画：病院（ネパール語）": "Video: Hospital (Nepali)",
  "動画：「緊急時の対応」について知っておこう（日本語）": "Video: Know what to do in an emergency (Japanese)",
  "119番の正しいかけ方（日本語）": "How to call 119 correctly (Japanese)",
  "出入国在留管理庁": "Immigration Services Agency of Japan",
  "文部科学省": "Ministry of Education, Culture, Sports, Science and Technology",
  "ネパール語": "Nepali", "やさしい日本語": "Easy Japanese", "日本語": "Japanese",
  "動画": "Video", "資料": "Document",
  "緊急のとき": "Emergency",
  "番号は ": "These numbers were checked on the official sites on ",
  "：公式サイトで確認": ""
};
