/* config.js — OUKA 今日の記録（/app/）の本番設定。
 *
 * ★ここにあるのは「ブラウザに配られる前提」の公開情報だけです。
 *   秘密（Clerk Secret Key sk_… / RL・WL・AL・OL のトークン / スプレッドシートID）は絶対に書かない。
 *   秘密はすべて Apps Script の Script Properties にあります。
 *
 * 設定元（2026-09-14）:
 *   clerkPublishableKey : Clerk Production instance（Primary domain abas-globalgroup.com・Verified）。
 *                         Frontend API = clerk.abas-globalgroup.com（本番 /v1/environment = production で確認）。
 *                         Publishable Key は Clerk の仕様どおり pk_live_ + base64("clerk.abas-globalgroup.com$")。
 *   appLayerUrl         : 本番 App Layer の Web App URL（/exec）。GET で service=OUKA App Layer・build=AP-2026-09-13-01-STUDENT を確認済み。
 *
 * このページの origin は https://abas-globalgroup.com 。
 * App Layer の IV_CLERK_ORIGINS はこの値と完全一致している必要がある（末尾スラッシュ・パスなし）。
 * 正本: kharel735-stack/abas-ops / ouka-school-app-v2 / OUKA_WEBAPP_OS/client/config.example.js
 */
window.OUKA_APP = {
  clerkPublishableKey: "pk_live_Y2xlcmsuYWJhcy1nbG9iYWxncm91cC5jb20k",

  /* 本番 App Layer の /exec URL */
  appLayerUrl: "https://script.google.com/macros/s/AKfycbzBEdTA9-Q5yyyo7lEjSbnBx-LdLLA4a-y5jfXe2PK5-L_yGB4mmao_UIte7NP59xvH/exec",

  lang: "ja"
};
