/* ============================================================================
 * videos.js ― 「押したらすぐ動画が出る」リンク集（データのみ）
 *
 *  ★ここに入れるのは、実際に開いて確認した直リンクだけ（2026-09-23 確認）。
 *  ★url ＝ 押したらその動画が始まるURL。探す必要のあるページは入れない。
 *  ★steps ＝ 直リンクが無い教材のための「やさしい日本語の行き方」（3〜5手）。
 *  ★own: true ＝ 桜花が自分で作る予定の動画（まだ無い）。作ったら file を入れる。
 *  ★外食は入れない（2026-09-23 代表指示）。
 * ==========================================================================*/
window.OUKA_VIDEOS = {
  /* 生活：出入国在留管理庁「生活オリエンテーション動画」ネパール語・YouTube・無料 */
  life_nepali: {
    title: "日本の生活（ネパール語）",
    org: "出入国在留管理庁",
    note: "ネパール語で見られます。日本に来る前に見ておく動画です。",
    items: [
      { label: "① はじめに", url: "https://www.youtube.com/watch?v=BgjF6bGOV5w" },
      { label: "② 交通ルール", url: "https://www.youtube.com/watch?v=B0vnvh-YcQE" },
      { label: "③ 生活のルール（暮らし）", url: "https://www.youtube.com/watch?v=PwaWgqMK3CI" },
      { label: "④ 生活のルール（公共の場所）", url: "https://www.youtube.com/watch?v=AON9jrp0g4A" },
      { label: "⑤ 病院", url: "https://www.youtube.com/watch?v=hg8DJ_mmuSQ" },
      { label: "⑥ 緊急・災害", url: "https://www.youtube.com/watch?v=epEmA_Pw8N8" },
      { label: "⑦ 入管の手続き・住所の手続き", url: "https://www.youtube.com/watch?v=03wiqR1_Y00" },
      { label: "⑧ 健康保険", url: "https://www.youtube.com/watch?v=SI9u-Ic14jA" },
      { label: "⑨ 年金", url: "https://www.youtube.com/watch?v=GIS3Dnwx0mc" },
      { label: "⑩ 税金", url: "https://www.youtube.com/watch?v=s8eMkJezuL4" },
      { label: "⑪ 仕事・労働", url: "https://www.youtube.com/watch?v=Lu56O3zYKOo" },
      { label: "⑫ 相談する場所", url: "https://www.youtube.com/watch?v=r4R8c_eUOkQ" },
      { label: "⑬ はじめての日本語", url: "https://www.youtube.com/watch?v=uvgVAX-jQnw" },
      { label: "⑭ おわりに", url: "https://www.youtube.com/watch?v=FpmII4oMIxU" },
      { label: "⑮ まとめ（短い版）", url: "https://www.youtube.com/watch?v=RIo3isILg_0" },
      { label: "① 〜 ⑭ ぜんぶ（長い版）", url: "https://www.youtube.com/watch?v=aVFUFfBjo2c" }
    ]
  },

  /* 日本生活適応：テーマから入って、ネパール語／日本語のどちらでも見られる。
     ネパール語＝出入国在留管理庁の動画（YouTube直リンク・確認済 2026-09-23）
     日本語＝文部科学省「つながる ひろがる にほんごでのくらし」の動画（ページ内の位置まで飛ぶ） */
  life_topics: [
    { topic: "ゴミの出し方", q: "ゴミはいつ、どこに出す？分け方は？",
      ne: { label: "生活のルール（暮らし）", url: "https://www.youtube.com/watch?v=PwaWgqMK3CI" },
      ja: { label: "「ゴミ出しのマナー」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_07" } },
    { topic: "市役所・住所の手続き", q: "市役所とは？引っ越したら何をする？",
      ne: { label: "入管の手続き・住所の手続き", url: "https://www.youtube.com/watch?v=03wiqR1_Y00" },
      ja: { label: "「役所での住民登録」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_04" } },
    { topic: "病院", q: "具合が悪い。どこへ行く？何と言う？",
      ne: { label: "病院", url: "https://www.youtube.com/watch?v=hg8DJ_mmuSQ" },
      ja: { label: "「医療制度」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_01" } },
    { topic: "緊急・地震・火事", q: "119番・110番。地震のときは？",
      ne: { label: "緊急・災害", url: "https://www.youtube.com/watch?v=epEmA_Pw8N8" },
      ja: { label: "「緊急時の対応」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_05" } },
    { topic: "交通ルール", q: "自転車・歩き方・電車のルール",
      ne: { label: "交通ルール", url: "https://www.youtube.com/watch?v=B0vnvh-YcQE" },
      ja: null },
    { topic: "税金・年金・健康保険", q: "給料から引かれるお金は何？",
      ne: { label: "税金 ／ 年金 ／ 健康保険", url: "https://www.youtube.com/watch?v=s8eMkJezuL4" },
      ja: { label: "「税金の制度」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_02" } },
    { topic: "仕事・労働のルール", q: "働く時間、休み、給料のきまり",
      ne: { label: "仕事・労働", url: "https://www.youtube.com/watch?v=Lu56O3zYKOo" },
      ja: null },
    { topic: "困ったときの相談", q: "日本語が分からない。どこに相談する？",
      ne: { label: "相談する場所", url: "https://www.youtube.com/watch?v=r4R8c_eUOkQ" },
      ja: { label: "「相談窓口」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_08" } },
    { topic: "近所づきあい・自治会", q: "あいさつ、ゴミ当番、行事",
      ne: null,
      ja: { label: "「地域での活動」について知っておこう", url: "https://tsunagarujp.mext.go.jp/useful-videos/#USEFULVIDEO01_movie_06" } },
    { topic: "はじめての日本語", q: "生活でまず使う日本語",
      ne: { label: "はじめての日本語", url: "https://www.youtube.com/watch?v=uvgVAX-jQnw" },
      ja: { label: "つながる ひろがる にほんごでのくらし（レベル0から）", url: "https://tsunagarujp.mext.go.jp/level00/" } }
  ],

  /* 分野ごとの動画。url がある＝押したらすぐ見られる。steps がある＝行き方を見せる。 */
  fields: {
    nogyo: [
      { label: "農業機械の安全（STOP! マイルール）", url: "https://www.youtube.com/watch?v=3UFGWKKSZeY", org: "農林水産省", lang: "日本語", min: "" },
      { label: "安全な農作業のために", url: "https://www.youtube.com/watch?v=D9JSI_lgE5s", org: "農林水産省", lang: "日本語" },
      { label: "シートベルトをしていますか？", url: "https://www.youtube.com/watch?v=j0yxgL1fGN0", org: "農林水産省", lang: "日本語" },
      { label: "トラクターの安全作業の基本", url: "https://www.youtube.com/watch?v=EP_4Q0wKVso", org: "農林水産省", lang: "日本語" },
      { label: "農作業の事故にあった人の話", url: "https://www.youtube.com/watch?v=Q4uAcBGuNzc", org: "農林水産省", lang: "日本語" },
      { label: "農作業安全の基礎の研修", url: "https://www.youtube.com/watch?v=N3jc5TEefm4", org: "農林水産省", lang: "日本語" },
      { label: "耕うん機の使い方", own: true, org: "桜花（これから作る）", lang: "やさしい日本語＋ネパール語字幕",
        note: "世の中に外国人むけの動画がありません。学校の機械で撮ります。" },
      { label: "刈払機（草刈り機）の使い方", own: true, org: "桜花（これから作る）", lang: "やさしい日本語＋ネパール語字幕" },
      { label: "道具の名前と片付け", own: true, org: "桜花（これから作る）", lang: "やさしい日本語＋ネパール語字幕" }
    ],
    kaigo: [
      { label: "介護の日本語（にほんごをまなぼう）", steps: [
          "「にほんごをまなぼう」のページを開く",
          "上の「学習する」を押す",
          "自分のレベルを選ぶ",
          "会話の場面を選んで、音を聞く"
        ], url_page: "https://aft.kaigo-nihongo.jp/rpv/", org: "厚生労働省の事業", lang: "日本語" },
      { label: "移乗（ベッド→車いす）", own: true, org: "桜花（これから作る）", lang: "やさしい日本語＋ネパール語字幕" },
      { label: "食事介助・おむつ交換の声かけ", own: true, org: "桜花（これから作る）", lang: "やさしい日本語＋ネパール語字幕" }
    ],
    kensetsu: [
      { label: "外国人建設就労者の安全教育（英語・中国語・ベトナム語・インドネシア語）", steps: [
          "建災防のページを開く",
          "下に進む",
          "自分の言葉（English / 中文 / Viet nam / Bahasa Indonesia）を押す",
          "見たい題名を押す"
        ], url_page: "https://www.kensaibou.or.jp/safe_tech/foreign_worker_education/index.html",
        org: "建設業労働災害防止協会", lang: "4言語（ネパール語はありません）" },
      { label: "KY（危険予知）の動画", url_page: "https://www.tokubetu.or.jp/ky_movie", org: "建災防ほか", lang: "日本語",
        steps: ["ページを開く", "見たい題名を押す", "動画が始まる"] }
    ]
  }
};
