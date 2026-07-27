#!/bin/bash
# ============================================================================
# apply-domain.sh ― ドメイン確定後、REPLACE-DOMAIN を実ドメインに一括置換
# ----------------------------------------------------------------------------
# 使い方:
#   cd ouka-career-platform
#   ./_tools/apply-domain.sh ouka-skill.com
#
# 対象: 全 *.html / sitemap.xml / robots.txt（_tools/ とzipは対象外）
# 実行後は index.html をブラウザで開き、OGP/canonical のURLを目視確認。
# ※ プレースホルダーに戻したい時は同じ要領で実ドメイン→REPLACE-DOMAIN。
# ============================================================================
set -euo pipefail

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "使い方: ./_tools/apply-domain.sh <ドメイン>   例) ./_tools/apply-domain.sh ouka-skill.com"
  exit 1
fi

# http(s):// や末尾スラッシュが付いていても正規化
DOMAIN="${DOMAIN#http://}"
DOMAIN="${DOMAIN#https://}"
DOMAIN="${DOMAIN%/}"

cd "$(dirname "$0")/.."   # ouka-career-platform/ へ

count=0
while IFS= read -r -d '' f; do
  if grep -q "REPLACE-DOMAIN" "$f"; then
    # macOS(BSD sed)。GNU sedなら sed -i の書式が異なる点に注意。
    sed -i '' "s|REPLACE-DOMAIN|${DOMAIN}|g" "$f"
    echo "  ✓ $f"
    count=$((count+1))
  fi
done < <(find . \( -name '*.html' -o -name 'sitemap.xml' -o -name 'robots.txt' \) \
              -not -path './_tools/*' -not -path './node_modules/*' -print0)

echo ""
echo "完了: ${count} ファイルの REPLACE-DOMAIN を ${DOMAIN} に置換しました。"
echo "次: index.html をブラウザで開き、canonical / og:url / og:image のURLを確認。"
