/* ============================================================================
 * fields.js ― 分野（コース）と、分野ごとの公式教材リンク（データのみ）
 *
 *  ★ここに入れるのは「実在を確認した公式・公的機関の無料教材」だけ。
 *    2026-09-23 に実際にページを開いて確認した（confirmed: "2026-09-23"）。
 *    リンクは先方の都合で変わる。授業で使う前に先生が1回開いて確かめる。
 *  ★外食は対象に入れない（2026-09-23 代表指示。代表が再開を言うまで追加しない）。
 *  ★lang は「その教材にある言語」。動画は日本語だけのものが多い。
 *
 *  neutral_categories = 分野が変わってもそのまま使える問題のカテゴリー。
 *    ここに無いカテゴリー（工具機械・施工・法令 等）は建設固有として、
 *    建設以外のコースでは既定で出さない（問題そのものは消さない）。
 * ==========================================================================*/
window.OUKA_FIELDS = {
  neutral_categories: [
    "あいさつ", "時間", "数・単位", "位置・方向", "天気・体調", "指示・報連相", "現場会話",
    "熱中症", "ヒューマンエラー", "安全装備", "保護具", "朝礼・KY"
  ],

  common_media: [
    { title: "職場のあんぜんサイト 安全衛生教育動画（業種別・3〜6分）", url: "https://anzeninfo.mhlw.go.jp/information/kyozaishiryo/jpn.html",
      org: "厚生労働省", type: "動画", lang: "日本語", confirmed: "2026-09-23" },
    { title: "NHK WORLD Easy Japanese for Work（仕事の日本語・動画）", url: "https://www3.nhk.or.jp/nhkworld/en/tv/easyjapaneseforwork/",
      org: "NHK WORLD", type: "動画", lang: "日本語・英語", confirmed: "2026-09-23" },
    { title: "生活オリエンテーション動画 15本（交通ルール・暮らし・病院・緊急・手続き・初歩の日本語）", url: "https://www.moj.go.jp/isa/support/coexistence/04_00078.html",
      org: "出入国在留管理庁", type: "動画", lang: "19言語・ネパール語あり（YouTube・無料）", confirmed: "2026-09-23" }
  ],

  list: [
    {
      code: "kaigo", label: "介護", active: true,
      media: [
        { title: "介護分野 特定技能評価試験 学習用テキスト（無料PDF）", url: "https://www.mhlw.go.jp/stf/newpage_28131.html",
          org: "厚生労働省", type: "テキスト", lang: "日本語・英語・ネパール語ほか", confirmed: "2026-09-23" },
        { title: "外国人のための介護福祉専門用語集・一問一答（無料PDF）", url: "https://www.mhlw.go.jp/stf/newpage_28131.html",
          org: "厚生労働省", type: "テキスト", lang: "日本語・英語・ネパール語ほか", confirmed: "2026-09-23" },
        { title: "にほんごをまなぼう（介護の日本語 学習サイト）", url: "https://aft.kaigo-nihongo.jp/rpv/",
          org: "国際厚生事業団（JICWELS）掲載", type: "学習サイト", lang: "日本語", confirmed: "2026-09-23" },
        { title: "日本語でケアナビ（看護・介護のことば）", url: "http://nihongodecarenavi.jp/",
          org: "国際交流基金", type: "辞書・用語", lang: "日本語・英語", confirmed: "2026-09-23" }
      ]
    },
    {
      code: "nogyo", label: "農業", active: true,
      media: [
        { title: "農業技能測定試験 学習用テキスト 耕種農業（無料PDF）", url: "https://asat-nca.jp/asat1/textbook",
          org: "全国農業会議所", type: "テキスト", lang: "日本語・ネパール語ほか", confirmed: "2026-09-23" },
        { title: "農業技能測定試験 学習用テキスト 畜産農業（無料PDF）", url: "https://asat-nca.jp/asat1/textbook",
          org: "全国農業会議所", type: "テキスト", lang: "日本語・ネパール語ほか", confirmed: "2026-09-23" },
        { title: "農業技能測定試験 日本語のテキスト（無料PDF）", url: "https://asat-nca.jp/jp/images/ASAT_JP_jpn2.pdf",
          org: "全国農業会議所", type: "テキスト", lang: "日本語", confirmed: "2026-09-23" },
        { title: "農作業安全の動画（トラクター・熱中症・事故事例ほか6本）", url: "https://www.maff.go.jp/j/seisan/sien/sizai/s_kikaika/anzen/siryo.html",
          org: "農林水産省", type: "動画", lang: "日本語", confirmed: "2026-09-23" },
        { title: "農作業安全対策（研修資料・リスクカルテ）", url: "https://www.maff.go.jp/j/seisan/sien/sizai/s_kikaika/anzen/index.html",
          org: "農林水産省", type: "資料", lang: "日本語", confirmed: "2026-09-23" },
        { title: "技能実習生向け 安全衛生マニュアル 耕種農業（無料PDF）", url: "https://www.mhlw.go.jp/stf/newpage_56354.html",
          org: "厚生労働省", type: "テキスト", lang: "日本語・英語ほか9言語（ネパール語なし）", confirmed: "2026-09-23" },
        { title: "技能実習生向け 安全衛生マニュアル 畜産農業（無料PDF）", url: "https://www.mhlw.go.jp/stf/newpage_56354.html",
          org: "厚生労働省", type: "テキスト", lang: "日本語・英語ほか9言語（ネパール語なし）", confirmed: "2026-09-23" },
        { title: "農作業安全を学びましょう（労働安全衛生教育テキスト・リーフレット）", url: "https://www.maff.go.jp/j/seisan/sien/sizai/s_kikaika/anzen/roudouanzenkyouiku.html",
          org: "農林水産省", type: "テキスト", lang: "日本語・英語・中国語・ベトナム語・インドネシア語（ネパール語なし）", confirmed: "2026-09-23" },
        { title: "農業機械の使い方・取扱説明書（トラクタ／管理機・耕うん機）", url: "https://agriculture.kubota.co.jp/after-support/userinfo/",
          org: "クボタ（メーカー公式）", type: "手順・取説", lang: "日本語（※動画ではなく写真と取説）", confirmed: "2026-09-23" }
      ]
    },
    {
      code: "kensetsu", label: "建設", active: true,
      media: [
        { title: "外国人建設就労者のための安全衛生教育映像（やさしい・多言語）", url: "https://www.kensaibou.or.jp/safe_tech/foreign_worker_education/index.html",
          org: "建設業労働災害防止協会", type: "動画", lang: "日本語・多言語", confirmed: "2026-09-23" },
        { title: "KY（危険予知）シリーズ動画", url: "https://www.tokubetu.or.jp/ky_movie",
          org: "建設業労働災害防止協会ほか", type: "動画", lang: "日本語", confirmed: "既存の教育パッケージに収載" },
        { title: "新規入場者教育 動画（ICT活用）", url: "https://www.kensaibou.or.jp/safe_tech/ict/entry/002918.html",
          org: "建設業労働災害防止協会", type: "動画", lang: "日本語", confirmed: "既存の教育パッケージに収載" }
      ]
    },
    {
      code: "shokuhin", label: "食品製造", active: false,
      media: []
    },
    {
      code: "seizo", label: "製造", active: false,
      media: []
    }
  ]
};
