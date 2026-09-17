/* ============================================================================
 * translations-nav.js ― ナビ・フッター・トップのカードの3言語辞書
 * ----------------------------------------------------------------------------
 * ★このファイルは _tools/build-newpages.py が生成します。手で編集しないでください。
 *   文言を直すときは _tools/content_compare.py / _tools/content_pages.py を直して再生成。
 * 全ページが読み込みます（軽量）。
 * 既存の window.OUKA_I18N に後から差し込みます（既存の文言は上書きしません）。
 * ==========================================================================*/
(function (add) {
  var base = window.OUKA_I18N = window.OUKA_I18N || {};
  function merge(dst, src) {
    Object.keys(src).forEach(function (k) {
      var v = src[k];
      if (v && typeof v === "object" && !Array.isArray(v)) {
        dst[k] = dst[k] && typeof dst[k] === "object" ? dst[k] : {};
        merge(dst[k], v);
      } else if (dst[k] === undefined) {
        dst[k] = v;
      }
    });
  }
  ["ja", "en", "ne"].forEach(function (lang) {
    if (!add[lang]) return;
    base[lang] = base[lang] || {};
    merge(base[lang], add[lang]);
  });
})({
  "ja": {
    "biz": {
      "eyebrow": "For Japanese employers",
      "title": "日本企業の採用ご担当者はこちら",
      "lead": "ネパール・ガイダコットで、日本語・職種別の技能・安全・日本の職場ルールまでを渡日前に教育しています。建設分野を中心に、特定技能での受け入れをご検討の企業さまへ人材をご紹介します。",
      "note": "※ 登録支援機関・有料職業紹介・監理団体・人材派遣の許可は受けていません。必要な許可・登録を伴う業務については、許可・登録を有する事業者との連携体制を整えた上で対応します。",
      "cta1": "採用について相談する",
      "cta2": "建設分野の人材を見る",
      "cta3": "特定技能の受け入れを調べる"
    },
    "nav": {
      "forCompanies2": "企業の採用ご担当者へ",
      "kensetsu": "建設分野の人材",
      "tokutei": "特定技能（企業向け）",
      "curriculum": "カリキュラム",
      "visaGuide": "日本へ行く方法",
      "compare": "留学と日本就職の比較",
      "why": "OUKAを選ぶ理由",
      "tuition": "学費",
      "flow2": "日本就職までの流れ",
      "parents": "保護者の方へ",
      "news": "お知らせ"
    },
    "cmp": {
      "ctaConsult": "自分に合う進路を相談する",
      "ctaCost": "費用の内訳を見る",
      "ctaFlow": "日本就職までの流れを見る",
      "ctaVisa": "ビザの違いを見る"
    },
    "more": {
      "heading": "くわしく知る",
      "lead": "費用・ビザ・カリキュラム・進路の選び方を、ページごとにまとめています。",
      "b0": "費用・期間・収入・リスクを20項目で並べました。目的によって正しい選択は違います。",
      "b1": "特定技能・育成就労・留学・技人国・家族帯同・永住の違いと、申請までの流れ。",
      "b2": "日本就職に特化した10の強みと、一般的な日本語学校との違い、10か月のロードマップ。",
      "b3": "20万円の内訳、含まれるもの・含まれないもの、返金と契約のルールを全公開。",
      "b4": "2つのコース、1日の時間割、週間時間割、教える科目、評価と補習のルール。",
      "b5": "適性診断から入学・学習・試験・面接・ビザ・渡日・定着支援までの13ステップ。",
      "b6": "教育方針・安全管理・費用・就職支援と、保護者からよくいただく質問。",
      "b7": "説明会の日程、募集の状況、授業の様子、制度の変更などの最新情報。"
    },
    "about": {
      "more": "理念・使命・OUKA WAY を見る"
    }
  },
  "en": {
    "biz": {
      "eyebrow": "For Japanese employers",
      "title": "For hiring managers at Japanese companies",
      "lead": "In Gaidakot, Nepal we teach Japanese, trade-specific skills, safety and Japanese workplace rules before departure. We introduce candidates — mainly in construction — to companies considering Specified Skilled Worker hiring.",
      "note": "Note: we hold no licence as a registered support organisation, fee-charging employment agency, supervising organisation or worker dispatch business. Work requiring such a licence is handled only after establishing cooperation with a licensed operator.",
      "cta1": "Talk to us about hiring",
      "cta2": "See our construction workforce",
      "cta3": "Learn about hiring under Specified Skilled Worker"
    },
    "nav": {
      "forCompanies2": "For employers in Japan",
      "kensetsu": "Construction workforce",
      "tokutei": "Specified Skilled Worker (for employers)",
      "curriculum": "Curriculum",
      "visaGuide": "How to go to Japan",
      "compare": "Study vs. work",
      "why": "Why OUKA",
      "tuition": "Tuition",
      "flow2": "Path to working in Japan",
      "parents": "For parents",
      "news": "News"
    },
    "cmp": {
      "ctaConsult": "Ask which route fits you",
      "ctaCost": "See the cost breakdown",
      "ctaFlow": "See the path to working in Japan",
      "ctaVisa": "See the visa differences"
    },
    "more": {
      "heading": "Learn more",
      "lead": "Costs, visas, the curriculum and how to choose your route — one page each.",
      "b0": "Cost, time, income and risk on 20 points. The right choice depends on your goal.",
      "b1": "The differences between SSW, skill development, study, specialist work, family stay and permanent residency, plus the application steps.",
      "b2": "Ten strengths focused on working in Japan, how we differ from a typical language school, and a 10-month roadmap.",
      "b3": "The breakdown of the ¥200,000 fee, what is and is not included, and the refund and contract rules.",
      "b4": "Two courses, the daily and weekly timetables, subjects, and the assessment and catch-up rules.",
      "b5": "Thirteen steps from the aptitude check through study, tests, interviews, visa, departure and settling in.",
      "b6": "Our approach, safety, costs and employment support, plus questions we often get from parents.",
      "b7": "Information sessions, admissions news, classes and changes to the rules."
    },
    "about": {
      "more": "See our philosophy, mission and the OUKA WAY"
    }
  },
  "ne": {
    "biz": {
      "eyebrow": "For Japanese employers",
      "title": "जापानी कम्पनीका भर्ना अधिकारीका लागि",
      "lead": "नेपालको गैंडाकोटमा हामी जापानी भाषा, पेसाअनुसारको सिप, सुरक्षा र जापानी कार्यस्थलका नियम जानुअघि नै सिकाउँछौं। मुख्यतया निर्माण क्षेत्रमा, विशिष्ट सिपमार्फत भर्ना सोच्दै गरेका कम्पनीहरूलाई उम्मेदवार परिचय गराउँछौं।",
      "note": "नोट: दर्ता सहयोग संस्था, शुल्क लिने रोजगार एजेन्सी, अनुगमन संस्था वा जनशक्ति आपूर्तिको कुनै इजाजत हामीसँग छैन। त्यस्तो इजाजत चाहिने काम, इजाजतप्राप्त सञ्चालकसँग सहकार्यको व्यवस्था मिलाएपछि मात्र गरिन्छ।",
      "cta1": "भर्नाबारे परामर्श गर्नुहोस्",
      "cta2": "निर्माण क्षेत्रका जनशक्ति हेर्नुहोस्",
      "cta3": "विशिष्ट सिपमार्फत भर्नाबारे जान्नुहोस्"
    },
    "nav": {
      "forCompanies2": "जापानका रोजगारदाताका लागि",
      "kensetsu": "निर्माण क्षेत्रका जनशक्ति",
      "tokutei": "विशिष्ट सिप (कम्पनीका लागि)",
      "curriculum": "पाठ्यक्रम",
      "visaGuide": "जापान जाने बाटो",
      "compare": "अध्ययन र रोजगारी तुलना",
      "why": "OUKA किन?",
      "tuition": "शुल्क",
      "flow2": "रोजगारीसम्मको बाटो",
      "parents": "अभिभावकलाई",
      "news": "सूचना"
    },
    "cmp": {
      "ctaConsult": "मलाई सुहाउने बाटो सोध्नुहोस्",
      "ctaCost": "खर्चको विवरण हेर्नुहोस्",
      "ctaFlow": "रोजगारीसम्मको बाटो हेर्नुहोस्",
      "ctaVisa": "भिसाको फरक हेर्नुहोस्"
    },
    "more": {
      "heading": "अझै जान्नुहोस्",
      "lead": "खर्च, भिसा, पाठ्यक्रम र बाटो छनोट — प्रत्येकको छुट्टै पृष्ठ।",
      "b0": "खर्च, समय, आय र जोखिम २० विषयमा। सही छनोट उद्देश्य अनुसार फरक।",
      "b1": "SSW, Skill Development, अध्ययन, विशेषज्ञ काम, परिवार बसोबास र स्थायी बसोबासको फरक, र आवेदन प्रक्रिया।",
      "b2": "जापानमा रोजगारीमा केन्द्रित १० बल, सामान्य भाषा विद्यालयसँग फरक, र १० महिनाको रोडम्याप।",
      "b3": "¥२००,००० को विवरण, के समावेश छ/छैन, र फिर्ता तथा सम्झौताका नियम।",
      "b4": "दुई कोर्स, दैनिक र साप्ताहिक तालिका, विषय, र मूल्यांकन तथा थप कक्षाका नियम।",
      "b5": "योग्यता जाँचदेखि अध्ययन, परीक्षा, अन्तर्वार्ता, भिसा, प्रस्थान र स्थायित्वसम्म १३ चरण।",
      "b6": "शिक्षा नीति, सुरक्षा, खर्च र रोजगार सहयोग, साथै अभिभावकबाट सोधिने प्रश्न।",
      "b7": "जानकारी सत्र, भर्ना सूचना, कक्षा र नियम परिवर्तन।"
    },
    "about": {
      "more": "हाम्रो दर्शन, मिशन र OUKA WAY हेर्नुहोस्"
    }
  }
});
