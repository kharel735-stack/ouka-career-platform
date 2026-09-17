/* ============================================================================
 * visa-quiz.js  ―「あなたにはどの在留資格が向いていますか？」の簡易診断
 * ----------------------------------------------------------------------------
 * 5つの質問に答えると、いま向いている可能性が高い道を表示します。
 *
 * ⚠ これは制度上の判定ではありません。参考情報です。
 *   在留資格の可否は、学歴・職歴・試験結果・企業の採用・書類の内容など
 *   多くの要素で決まり、最終的に判断するのは日本政府です。
 *   結果の文言に「必ず」「保証」を使わないこと。
 *
 * 依存：config.js, translations.js, main.js（OUKA.pick / OUKA.getLang）
 * ==========================================================================*/
(function () {
  "use strict";

  /* ---- 質問（3言語）---------------------------------------------------- */
  var QUESTIONS = [
    {
      q: { ja: "日本へ行く一番の目的はどれですか？",
           en: "What is your main reason for going to Japan?",
           ne: "जापान जाने मुख्य उद्देश्य के हो?" },
      opts: [
        { t: { ja: "働いて収入を得たい", en: "To work and earn", ne: "काम गरेर कमाउने" }, s: { ssw: 3, esd: 2 } },
        { t: { ja: "勉強したい・進学したい", en: "To study or go on to higher education", ne: "पढ्ने वा उच्च शिक्षा" }, s: { study: 3 } },
        { t: { ja: "専門を活かして働きたい", en: "To use my specialism at work", ne: "आफ्नो विशेषज्ञतामा काम" }, s: { eng: 3, ssw: 1 } },
        { t: { ja: "まだ決めていない", en: "I have not decided", ne: "अझै निर्णय गरेको छैन" }, s: { jp: 2 } }
      ]
    },
    {
      q: { ja: "いまの日本語のレベルはどれですか？",
           en: "What is your current Japanese level?",
           ne: "अहिलेको जापानी स्तर कुन हो?" },
      opts: [
        { t: { ja: "まったく学んだことがない", en: "None at all", ne: "बिल्कुलै छैन" }, s: { jp: 3 } },
        { t: { ja: "ひらがな・カタカナは読める", en: "I can read hiragana and katakana", ne: "हिरागाना/काताकाना पढ्न सक्छु" }, s: { jp: 2, esd: 1 } },
        { t: { ja: "N5に合格している", en: "I have passed N5", ne: "N5 उत्तीर्ण छु" }, s: { esd: 2, ssw: 1 } },
        { t: { ja: "N4以上に合格している", en: "I have passed N4 or above", ne: "N4 वा माथि उत्तीर्ण छु" }, s: { ssw: 3, eng: 1 } }
      ]
    },
    {
      q: { ja: "最終学歴はどれですか？",
           en: "What is your highest level of education?",
           ne: "तपाईंको उच्चतम शिक्षा कुन हो?" },
      opts: [
        { t: { ja: "中学まで", en: "Lower secondary", ne: "माध्यमिकसम्म" }, s: { ssw: 2, esd: 2 } },
        { t: { ja: "高校（+2）を卒業", en: "High school (+2)", ne: "उच्च माध्यमिक (+2)" }, s: { ssw: 2, esd: 1, study: 1 } },
        { t: { ja: "専門学校・短大を卒業", en: "Vocational college or junior college", ne: "प्राविधिक वा कलेज" }, s: { eng: 2, ssw: 1, study: 1 } },
        { t: { ja: "大学を卒業", en: "University degree", ne: "स्नातक" }, s: { eng: 3, study: 1 } }
      ]
    },
    {
      q: { ja: "いつ働き始めたいですか？",
           en: "When do you want to start earning?",
           ne: "कहिलेदेखि कमाउन थाल्न चाहनुहुन्छ?" },
      opts: [
        { t: { ja: "できるだけ早く働いて仕送りしたい", en: "As soon as possible, to send money home", ne: "सकेसम्म चाँडो, घर पठाउन" }, s: { ssw: 3, esd: 2 } },
        { t: { ja: "1年くらい準備してからでよい", en: "After about a year of preparation", ne: "करिब १ वर्ष तयारीपछि" }, s: { ssw: 2, esd: 2 } },
        { t: { ja: "何年かかけて学んでからでよい", en: "After studying for several years", ne: "केही वर्ष पढेपछि" }, s: { study: 3, eng: 1 } },
        { t: { ja: "まず日本語を身につけたい", en: "I want to build my Japanese first", ne: "पहिले जापानी सिक्न चाहन्छु" }, s: { jp: 3 } }
      ]
    },
    {
      q: { ja: "学費と生活費として、年間200万円以上を準備できますか？",
           en: "Can you prepare over ¥2,000,000 a year for tuition and living costs?",
           ne: "शुल्क र जीवन खर्चका लागि वार्षिक ¥२०,००,००० भन्दा बढी जुटाउन सक्नुहुन्छ?" },
      opts: [
        { t: { ja: "準備できる", en: "Yes, I can", ne: "सक्छु" }, s: { study: 3, eng: 1 } },
        { t: { ja: "準備は難しい", en: "That would be difficult", ne: "गाह्रो छ" }, s: { ssw: 2, esd: 2 } },
        { t: { ja: "家族と相談しないと分からない", en: "I need to discuss it with my family", ne: "परिवारसँग सल्लाह गर्नुपर्छ" }, s: { ssw: 1, esd: 1, jp: 1 } }
      ]
    }
  ];

  /* ---- 結果（3言語）---------------------------------------------------- */
  var RESULTS = {
    ssw: {
      title: { ja: "特定技能 向き", en: "Specified Skilled Worker may suit you", ne: "Specified Skilled Worker सुहाउन सक्छ" },
      body: {
        ja: "働いて収入を得ることが目的で、学歴の要件がない道です。JFT-Basic A2 または JLPT N4 相当の日本語と、分野別の技能評価試験の合格が必要です。桜花の本科（約10か月）はこの道を目指す人のためのコースです。",
        en: "This route is about working and earning, and has no academic requirement. You need JFT-Basic A2 or JLPT N4 Japanese and a pass in the skills evaluation test for your field. Our main course (about 10 months) is built for this path.",
        ne: "यो बाटो काम गरेर कमाउनका लागि हो, शैक्षिक सर्त छैन। JFT-Basic A2 वा JLPT N4 जापानी र क्षेत्रको सीप परीक्षा उत्तीर्ण चाहिन्छ। हाम्रो मुख्य कोर्स (करिब १० महिना) यही बाटोका लागि हो।"
      }
    },
    esd: {
      title: { ja: "育成就労 向き", en: "Employment for Skill Development may suit you", ne: "Employment for Skill Development सुहाउन सक्छ" },
      body: {
        ja: "働きながら技能を身につけたい方に向く道です。2027年4月からの制度で、入国時の日本語は N5 相当以上が求められる方向です。原則3年で特定技能1号の水準を目指します。運用の詳細は今後さらに示される見込みです。",
        en: "This suits people who want to build skills while working. It starts in April 2027 and is expected to require around N5 Japanese on entry, developing you to SSW (i) level in about three years. Details are still being published.",
        ne: "काम गर्दै सीप बढाउन चाहनेलाई सुहाउँछ। २०२७ अप्रिलदेखि सुरु, प्रवेशमा करिब N5 जापानी अपेक्षित, करिब ३ वर्षमा SSW (i) स्तर। विवरण अझै आउँदैछ।"
      }
    },
    study: {
      title: { ja: "留学 向き", en: "Studying in Japan may suit you", ne: "जापानमा अध्ययन सुहाउन सक्छ" },
      body: {
        ja: "日本で学ぶことが主な目的で、学費と生活費を準備できる方に向く道です。初年度で約202万〜356万円が目安（概算）です。卒業後に日本で働くには、就職活動と在留資格の変更が必要です。「留学と日本就職の比較」ページで費用と違いを確認してください。",
        en: "This suits those whose main goal is study and who can fund tuition and living costs — roughly ¥2.02m–3.56m in the first year (estimate). To work in Japan afterwards you must job-hunt and change status. See our comparison page.",
        ne: "मुख्य उद्देश्य पढ्नु भएका र शुल्क तथा जीवन खर्च जुटाउन सक्नेलाई सुहाउँछ — पहिलो वर्ष करिब ¥२०.२–३५.६ लाख (अनुमान)। पछि काम गर्न रोजगार खोजी र अनुमति परिवर्तन चाहिन्छ। तुलना पृष्ठ हेर्नुहोस्।"
      }
    },
    eng: {
      title: { ja: "技術・人文知識・国際業務 向き", en: "Engineer / Specialist may suit you", ne: "Engineer / Specialist सुहाउन सक्छ" },
      body: {
        ja: "大学や専門学校で学んだ分野を活かして働く道です。学歴（大学卒・専門士など）または相当の実務経験が必要で、単純作業は対象になりません。更新に上限がなく、条件を満たせば家族帯同も可能です。桜花の第1期の主な対象ではありませんが、選択肢として知っておく価値があります。",
        en: "This route uses the field you studied at university or college. It requires a degree or equivalent experience, and manual-only work does not qualify. There is no cap on renewals and family may join if conditions are met. It is not our first-intake focus, but worth knowing.",
        ne: "विश्वविद्यालय वा कलेजमा पढेको क्षेत्र प्रयोग गर्ने बाटो। डिग्री वा समकक्ष अनुभव चाहिन्छ, साधारण श्रम मात्र पर्दैन। नवीकरणको सीमा छैन, सर्त पूरा भए परिवार पनि। हाम्रो पहिलो समूहको मुख्य लक्ष्य होइन, तर जान्न लायक।"
      }
    },
    jp: {
      title: { ja: "まず日本語学習から", en: "Start with Japanese", ne: "पहिले जापानी भाषाबाट" },
      body: {
        ja: "どの道に進むにしても、日本語がなければ選択肢が広がりません。まずは N5、次に N4／JFT-Basic A2 を目標にしましょう。学びながら進路を決めても遅くありません。無料相談で一緒に考えます。",
        en: "Whichever route you take, Japanese opens the options. Aim for N5 first, then N4 / JFT-Basic A2. You can decide your path while you study — it is not too late. Let us think it through together in a free consultation.",
        ne: "जुनसुकै बाटो रोजे पनि जापानी भाषाले विकल्प खोल्छ। पहिले N5, त्यसपछि N4 / JFT-Basic A2 लक्ष्य राख्नुहोस्। पढ्दै बाटो छान्दा पनि ढिलो हुँदैन। नि:शुल्क परामर्शमा सँगै सोचौं।"
      }
    }
  };

  var UI = {
    restart: { ja: "もう一度やる", en: "Start again", ne: "फेरि गर्नुहोस्" },
    result: { ja: "あなたに向いている可能性がある道", en: "A route that may suit you", ne: "तपाईंलाई सुहाउन सक्ने बाटो" },
    step: { ja: "問", en: "of", ne: "मध्ये" }
  };

  var state = { i: 0, score: {} };

  function pick(o) {
    var lang = window.OUKA ? OUKA.getLang() : "ja";
    return window.OUKA ? OUKA.pick(o, lang) : o.ja;
  }

  function render() {
    var root = document.getElementById("visa-quiz");
    if (!root) return;
    root.innerHTML = "";

    /* 進み具合 */
    var bar = document.createElement("div");
    bar.className = "quiz__bar";
    var fill = document.createElement("i");
    fill.style.width = Math.round(state.i / QUESTIONS.length * 100) + "%";
    bar.appendChild(fill);
    root.appendChild(bar);

    if (state.i < QUESTIONS.length) {
      var Q = QUESTIONS[state.i];
      var h = document.createElement("p");
      h.className = "quiz__q";
      h.textContent = (state.i + 1) + " / " + QUESTIONS.length + "　" + pick(Q.q);
      root.appendChild(h);

      var ul = document.createElement("ul");
      ul.className = "quiz__opts";
      Q.opts.forEach(function (o) {
        var li = document.createElement("li");
        var b = document.createElement("button");
        b.type = "button";
        b.textContent = pick(o.t);
        b.addEventListener("click", function () {
          Object.keys(o.s).forEach(function (k) {
            state.score[k] = (state.score[k] || 0) + o.s[k];
          });
          state.i++;
          render();
          root.scrollIntoView({ behavior: "smooth", block: "center" });
        });
        li.appendChild(b);
        ul.appendChild(li);
      });
      root.appendChild(ul);
      return;
    }

    /* 結果 */
    var best = "jp", max = -1;
    Object.keys(RESULTS).forEach(function (k) {
      var v = state.score[k] || 0;
      if (v > max) { max = v; best = k; }
    });
    var R = RESULTS[best];

    var wrap = document.createElement("div");
    wrap.className = "quiz__result";
    var kicker = document.createElement("p");
    kicker.style.cssText = "font-size:.78rem;letter-spacing:.12em;color:var(--pink-600);font-weight:800;margin:0 0 6px";
    kicker.textContent = pick(UI.result);
    var h3 = document.createElement("h3");
    h3.textContent = pick(R.title);
    var p = document.createElement("p");
    p.textContent = pick(R.body);
    wrap.appendChild(kicker); wrap.appendChild(h3); wrap.appendChild(p);

    var cta = document.createElement("p");
    cta.style.cssText = "display:flex;flex-wrap:wrap;gap:10px;margin:18px 0 0";
    [["student-application.html", { ja: "無料で相談する", en: "Ask us for free", ne: "नि:शुल्क सोध्नुहोस्" }, "btn btn--primary"],
     ["assessment.html", { ja: "職業の適性診断も受ける", en: "Also take the job aptitude check", ne: "पेसा योग्यता जाँच पनि" }, "btn btn--outline"],
     ["study-vs-work.html", { ja: "留学と日本就職を比べる", en: "Compare study and work", ne: "अध्ययन र रोजगारी तुलना" }, "btn btn--outline"]
    ].forEach(function (a) {
      var el = document.createElement("a");
      el.href = a[0]; el.className = a[2]; el.textContent = pick(a[1]);
      cta.appendChild(el);
    });
    wrap.appendChild(cta);

    var again = document.createElement("p");
    again.style.marginTop = "14px";
    var ab = document.createElement("button");
    ab.type = "button";
    ab.className = "btn btn--ghost";
    ab.textContent = pick(UI.restart);
    ab.addEventListener("click", function () { state = { i: 0, score: {} }; render(); });
    again.appendChild(ab);
    wrap.appendChild(again);

    root.appendChild(wrap);
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("ouka:langchange", function () {
    /* 言語を変えたら最初から（回答の意味が変わらないように） */
    state = { i: 0, score: {} };
    render();
  });
})();
