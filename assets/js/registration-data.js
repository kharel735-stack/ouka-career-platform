/* ============================================================================
 * registration-data.js  ―  学校の登録・認可の状況
 * ----------------------------------------------------------------------------
 * ★実際に保有・申請中のものだけを載せてください。
 *   取得していない許認可は載せない（コンプライアンス）。
 *
 *   status: "registered"（登録済み） / "applying"（申請中） / "preparing"（準備中）
 *   docImage: 証明書画像のファイル名（任意。assets/images/ に置く）。空なら「証明書」ボタンは出ません。
 *
 * ※初期値は、現時点で確認できている事実のみを記載しています。
 *   数値や番号（登記番号・PAN等）は、公開してよい範囲でスタッフが追記してください。
 * ==========================================================================*/

window.OUKA_REGISTRATION = [
  {
    key: "companyReg",
    label: { ja: "ネパール法人登記", en: "Company registration (Nepal)", ne: "" },
    value: { ja: "Ouka Skill Training Center Pvt. Ltd.（登記完了）", en: "Ouka Skill Training Center Pvt. Ltd. (registered)", ne: "" },
    status: "registered",
    docImage: ""   // 例: "reg-company.jpg"（証明書画像を assets/images/ に置いて指定）
  },
  {
    key: "pan",
    label: { ja: "PAN（納税者番号）", en: "PAN (tax number)", ne: "" },
    value: { ja: "手続き中", en: "In process", ne: "" },
    status: "applying",
    docImage: ""
  },
  // 以下はテンプレート。実際に取得/申請したら status と value を更新してください。
  // {
  //   key: "localBiz",
  //   label: { ja: "事業・営業登録", en: "Business registration", ne: "" },
  //   value: { ja: "準備中", en: "In preparation", ne: "" },
  //   status: "preparing",
  //   docImage: ""
  // },
];
