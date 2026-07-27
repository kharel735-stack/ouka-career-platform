/* ============================================================================
 * teachers-data.js  ―  先生（教員）の紹介
 * ----------------------------------------------------------------------------
 * ★先生を増やすのはかんたん：下の配列に1人1オブジェクトを足すだけ。
 *
 *   {
 *     name: "Madhu",                       // 表示名
 *     role: { ja: "日本語 担当", en: "Japanese teacher", ne: "" },
 *     photo: "",                            // 顔写真ファイル名（assets/images/teachers/ に置く。任意）
 *     video: "",                            // 紹介/インタビュー動画（下記いずれか。任意）
 *                                           //   ・YouTube等の「埋め込みURL」 https://www.youtube.com/embed/XXXX
 *                                           //   ・Googleドライブの埋め込みURL https://drive.google.com/file/d/XXXX/preview
 *                                           //   ・ローカル動画ファイル名 "intro.mp4"（assets/images/teachers/ に置く）
 *     study: { ja: "", en: "", ne: "" },    // いま学んでいること（日本語・指導法など）
 *     career: { ja: "", en: "", ne: "" }    // 歩み・キャリアアップ（日本での経験を一から十まで）
 *   }
 *
 * ★動画インタビューの内容の目安：
 *   ・どうやって言語（日本語）を身につけたか（学びのキャリア）
 *   ・日本へ行って何をしたのか（現場・仕事の経験を一から十まで）
 *   ・生徒へのメッセージ
 *
 * ★注意：氏名・写真・動画の公開は本人の同意を得たものだけにしてください。
 * ==========================================================================*/

window.OUKA_TEACHERS = [
  // ここに先生を足していってください（初期は空。準備中と表示されます）。
  // 例（コメントを外して使う）:
  // {
  //   name: "Madhu",
  //   role: { ja: "日本語 担当", en: "Japanese teacher" },
  //   photo: "madhu.jpg",
  //   video: "https://www.youtube.com/embed/XXXXXXXX",
  //   study: { ja: "日本語教育能力・N2の学習を継続中", en: "Continuing Japanese-teaching methodology and N2 study" },
  //   career: { ja: "来日→現場経験→帰国後に指導者へ。学びのキャリアを生徒に伝える。", en: "Went to Japan, gained on-site experience, now teaches." }
  // },
];
