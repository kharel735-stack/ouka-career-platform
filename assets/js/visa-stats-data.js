/* ============================================================================
 * visa-stats-data.js  ―「データで見る日本就職」の数値
 * ----------------------------------------------------------------------------
 * ★ここに入っている数字は、すべて日本政府の公式資料から書き写した実数です。
 *   推測・概算・伝聞の数字は入れていません。
 *
 * 出典（2026-07-31 取得）
 *   [A] 出入国在留管理庁「令和７年末現在における在留外国人数について」
 *       https://www.moj.go.jp/isa/publications/press/13_00062.html
 *   [B] 出入国在留管理庁「特定技能制度運用状況（令和７年１２月末現在）」
 *       https://www.moj.go.jp/isa/content/001428398.pdf
 *       （※Bの数値はすべて速報値と明記されています）
 *
 * ⚠ 更新するときのルール
 *   1. 必ず上記の公式ページ／PDFを自分の目で見て、書き写すこと。
 *   2. SNS・他校サイト・まとめ記事の数字は使わないこと。
 *   3. 数字を変えたら asOf（いつ時点か）も必ず一緒に直すこと。
 *   4. 合計と内訳が一致するか足し算して確かめること。
 * ==========================================================================*/

window.OUKA_VISA_STATS = {

  /* --- 大きく見せる3つの数字 ------------------------------------------ */
  headline: [
    {
      label: { ja: "日本の在留外国人数", en: "Foreign residents in Japan", ne: "जापानमा विदेशी बासिन्दा" },
      value: "4,125,395",
      unit: { ja: "人", en: "people", ne: "जना" },
      note: { ja: "初めて400万人を超えました（前年比 +9.5%）",
              en: "Passed 4 million for the first time (+9.5% year on year)",
              ne: "पहिलो पटक ४० लाख नाघ्यो (गत वर्षभन्दा +९.५%)" },
      asOf: "2025年12月末", src: "A"
    },
    {
      label: { ja: "そのうちネパール国籍の方", en: "Of whom Nepali nationals", ne: "मध्ये नेपाली नागरिक" },
      value: "300,992",
      unit: { ja: "人", en: "people", ne: "जना" },
      note: { ja: "国籍別で第5位。1年で 67,949人 増えました",
              en: "5th largest nationality; up 67,949 in one year",
              ne: "राष्ट्रियता अनुसार ५औं; एक वर्षमा ६७,९४९ जना वृद्धि" },
      asOf: "2025年12月末", src: "A"
    },
    {
      label: { ja: "特定技能で在留している方（全国籍）", en: "Specified Skilled Workers (all nationalities)", ne: "Specified Skilled Worker (सबै देश)" },
      value: "390,296",
      unit: { ja: "人", en: "people", ne: "जना" },
      note: { ja: "半年前（2025年6月末）は 336,196人 でした",
              en: "Six months earlier (June 2025) it was 336,196",
              ne: "छ महिना अघि (जुन २०२५) ३३६,१९६ थियो" },
      asOf: "2025年12月末（速報値）", src: "B"
    }
  ],

  /* --- 分野別（合計 390,296人と一致することを確認済み）----------------- */
  byField: {
    title: { ja: "特定技能はどの分野で働いているか", en: "Which fields Specified Skilled Workers are in", ne: "SSW कुन क्षेत्रमा छन्" },
    asOf: "2025年12月末（速報値）", src: "B",
    total: 390296,
    rows: [
      { label: { ja: "飲食料品製造業", en: "Food & beverage manufacturing", ne: "खाद्य उत्पादन" }, value: 95644, pct: "24.5%" },
      { label: { ja: "介護", en: "Caregiving", ne: "केयर" }, value: 67871, pct: "17.4%" },
      { label: { ja: "工業製品製造業", en: "Industrial manufacturing", ne: "औद्योगिक उत्पादन" }, value: 57576, pct: "14.8%" },
      { label: { ja: "建設", en: "Construction", ne: "निर्माण" }, value: 51122, pct: "13.1%", highlight: true },
      { label: { ja: "外食業", en: "Food service", ne: "खाद्य सेवा" }, value: 44925, pct: "11.5%" },
      { label: { ja: "農業", en: "Agriculture", ne: "कृषि" }, value: 39234, pct: "10.1%" },
      { label: { ja: "その他", en: "Other fields", ne: "अन्य" }, value: 33924, pct: "8.7%" }
    ]
  },

  /* --- 国籍別（合計 390,296人と一致することを確認済み）----------------- */
  byNationality: {
    title: { ja: "特定技能の国籍別の内訳", en: "Specified Skilled Workers by nationality", ne: "SSW राष्ट्रियता अनुसार" },
    asOf: "2025年12月末（速報値）", src: "B",
    total: 390296,
    rows: [
      { label: { ja: "ベトナム", en: "Vietnam", ne: "भियतनाम" }, value: 164352, pct: "42.1%" },
      { label: { ja: "インドネシア", en: "Indonesia", ne: "इन्डोनेसिया" }, value: 86955, pct: "22.3%" },
      { label: { ja: "ミャンマー", en: "Myanmar", ne: "म्यानमार" }, value: 44523, pct: "11.4%" },
      { label: { ja: "フィリピン", en: "Philippines", ne: "फिलिपिन्स" }, value: 35862, pct: "9.2%" },
      { label: { ja: "中国", en: "China", ne: "चीन" }, value: 22105, pct: "5.7%" },
      { label: { ja: "ネパール", en: "Nepal", ne: "नेपाल" }, value: 12387, pct: "3.2%", highlight: true },
      { label: { ja: "カンボジア", en: "Cambodia", ne: "कम्बोडिया" }, value: 8500, pct: "2.2%" },
      { label: { ja: "タイ", en: "Thailand", ne: "थाइल्यान्ड" }, value: 6817, pct: "1.7%" },
      { label: { ja: "その他", en: "Other", ne: "अन्य" }, value: 8795, pct: "2.3%" }
    ]
  },

  /* --- 推移（制度開始からの半年ごと）----------------------------------- */
  trend: {
    title: { ja: "特定技能で働く人は年々増えています", en: "The number of Specified Skilled Workers keeps growing", ne: "SSW मा काम गर्ने संख्या बढ्दै छ" },
    asOf: "2019年6月末〜2025年12月末（速報値）", src: "B",
    rows: [
      { label: "2019.6", value: 20 },
      { label: "2019.12", value: 1621 },
      { label: "2020.6", value: 5950 },
      { label: "2020.12", value: 15663 },
      { label: "2021.6", value: 29144 },
      { label: "2021.12", value: 49666 },
      { label: "2022.6", value: 87472 },
      { label: "2022.12", value: 130923 },
      { label: "2023.6", value: 173101 },
      { label: "2023.12", value: 208462 },
      { label: "2024.6", value: 251747 },
      { label: "2024.12", value: 284466 },
      { label: "2025.6", value: 336196 },
      { label: "2025.12", value: 390296 }
    ]
  },

  /* --- ネパール国籍の特定技能の伸び ------------------------------------ */
  nepalTrend: {
    title: { ja: "ネパール国籍で特定技能の人も増えています", en: "Nepali Specified Skilled Workers are increasing too", ne: "नेपाली SSW पनि बढ्दै छन्" },
    asOf: "2024年12月末→2025年12月末（速報値）", src: "B",
    rows: [
      { label: "2024.12", value: 9381 },
      { label: "2025.12", value: 12387, highlight: true }
    ],
    note: { ja: "1年で 3,006人 増えました（+32%）。ただし全体に占める割合は3.2%で、ベトナム・インドネシアに比べるとまだ小さい規模です。",
            en: "Up 3,006 in one year (+32%). Still, at 3.2% of the total, the scale is small compared with Vietnam and Indonesia.",
            ne: "एक वर्षमा ३,००६ जना वृद्धि (+३२%)। तर कुलको ३.२% मात्र भएकाले भियतनाम र इन्डोनेसियाको तुलनामा सानो छ।" }
  },

  /* --- 出典 ------------------------------------------------------------- */
  sources: {
    /* 統計の正式名（「」の中）は日本語のまま。この名前で探さないと辿り着けないため。
       発表した省庁の名前だけを、読む人の言語で出す。 */
    A: { name: { ja: "出入国在留管理庁「令和７年末現在における在留外国人数について」",
                 en: "Immigration Services Agency 「令和７年末現在における在留外国人数について」",
                 ne: "अध्यागमन सेवा एजेन्सी 「令和７年末現在における在留外国人数について」" },
         url: "https://www.moj.go.jp/isa/publications/press/13_00062.html" },
    B: { name: { ja: "出入国在留管理庁「特定技能制度運用状況（令和７年１２月末現在・速報値）」",
                 en: "Immigration Services Agency 「特定技能制度運用状況（令和７年１２月末現在・速報値）」",
                 ne: "अध्यागमन सेवा एजेन्सी 「特定技能制度運用状況（令和７年１２月末現在・速報値）」" },
         url: "https://www.moj.go.jp/isa/applications/ssw/nyuukokukanri07_00215.html" }
  }
};
