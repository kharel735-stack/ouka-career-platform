#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build-seo.py ― 桜花HP SEOメタ・構造化データ 一括生成（再実行可能・冪等）
----------------------------------------------------------------------------
何をするか:
  1) 各HTMLの </head> 直前に <!-- SEO:BEGIN --> ... <!-- SEO:END --> ブロックを挿入
     - canonical / robots / og:locale(ja+en+ne) / theme-color
     - JSON-LD 構造化データ
         * index.html         … EducationalOrganization + WebSite
         * faq.html           … BreadcrumbList + FAQPage（faq-data.js を単一の情報源に）
         * その他の下層ページ … BreadcrumbList
  2) robots.txt / sitemap.xml をルートに生成
  3) OGPコメントの誤記（__OGBASE__）を実態（REPLACE-DOMAIN）へ整合

ドメインは REPLACE-DOMAIN のプレースホルダー。確定後に _tools/apply-domain.sh で一括置換。

使い方:  cd ouka-career-platform && python3 _tools/build-seo.py
再実行OK（SEO:BEGIN〜END を作り直すだけ。手編集した本文には触れない）。
FAQやページを増やしたら再実行すれば構造化データも追従する。
"""

import re, json, os, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://REPLACE-DOMAIN"
THEME_COLOR = "#c8447a"          # ロゴのローズ（style.css --pink-600）
TODAY = datetime.date.today().isoformat()

SCHOOL_NAME = "桜花スキルトレーニングセンター"
SCHOOL_ALT  = "OUKA Skill Training Center"
SCHOOL_LEGAL = "Ouka Skill Training Center Pvt. Ltd."

# --- ページ定義：ファイル名 → (パンくず表示名, robots, sitemap優先度, 更新頻度) -------
# robots: None=標準(index,follow)。"noindex"=結果ページ等。sitemap優先度 None=除外
PAGES = {
    "index.html":              ("ホーム",                 None,       "1.0", "weekly"),
    "education.html":          ("教育内容",               None,       "0.9", "monthly"),
    "visa.html":               ("ビザ・在留資格",          None,       "0.9", "monthly"),
    "assessment.html":         ("無料適性診断",            None,       "0.9", "monthly"),
    "company.html":            ("企業の方へ",             None,       "0.9", "monthly"),
    "teachers.html":           ("先生紹介",               None,       "0.7", "monthly"),
    "students.html":           ("在籍学生",               None,       "0.7", "weekly"),
    "gallery.html":            ("訓練の様子",             None,       "0.7", "weekly"),
    "faq.html":                ("よくある質問",           None,       "0.8", "monthly"),
    "contact.html":            ("お問い合わせ",           None,       "0.8", "yearly"),
    "student-application.html":("入学・面談のお申し込み",   None,       "0.8", "yearly"),
    "partners.html":           ("提携・送り出し機関",      None,       "0.6", "yearly"),
    "registration.html":       ("登録・認可",             None,       "0.5", "yearly"),
    "privacy.html":            ("個人情報の取扱い",        None,       "0.3", "yearly"),
    "terms.html":              ("利用規約",               None,       "0.3", "yearly"),
    # 結果ページ：URL単独で意味を持たず重複扱いされうるため noindex・sitemap除外
    "assessment-result.html":  ("適性診断の結果",         "noindex",  None,   None),
}

# ---------------------------------------------------------------------------
# FAQ を faq-data.js（単一の情報源）から抽出
# ---------------------------------------------------------------------------
def extract_faq(js_path):
    with open(js_path, encoding="utf-8") as f:
        src = f.read()
    # q: { ja: "…"  /  a: { ja: "…" を出現順に拾う。\" エスケープに対応。
    q = re.findall(r'q:\s*\{\s*ja:\s*"((?:[^"\\]|\\.)*)"', src)
    a = re.findall(r'a:\s*\{\s*ja:\s*"((?:[^"\\]|\\.)*)"', src)
    pairs = []
    for qq, aa in zip(q, a):
        pairs.append((qq.replace('\\"', '"'), aa.replace('\\"', '"')))
    return pairs

# ---------------------------------------------------------------------------
# JSON-LD 構築
# ---------------------------------------------------------------------------
def ld_organization():
    return {
        "@type": "EducationalOrganization",
        "@id": f"{DOMAIN}/#organization",
        "name": SCHOOL_NAME,
        "alternateName": SCHOOL_ALT,
        "legalName": SCHOOL_LEGAL,
        "url": f"{DOMAIN}/",
        "logo": f"{DOMAIN}/assets/images/logo.svg",
        "image": f"{DOMAIN}/assets/images/ogp.png",
        "description": "日本語を教える学校ではなく、日本企業で長く活躍できる人材を育てる教育機関。建設現場に特化した「日本語＋現場訓練」で、日本で働く準備をします。",
        "slogan": "Work to Japan",
        "telephone": "+977-9743472638",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Gaidakot 5",
            "addressLocality": "Gaidakot",
            "addressCountry": "NP",
        },
        "areaServed": ["NP", "JP"],
    }

def ld_website():
    return {
        "@type": "WebSite",
        "@id": f"{DOMAIN}/#website",
        "url": f"{DOMAIN}/",
        "name": SCHOOL_NAME,
        "alternateName": SCHOOL_ALT,
        "inLanguage": ["ja", "en", "ne"],
        "publisher": {"@id": f"{DOMAIN}/#organization"},
    }

def ld_breadcrumb(page, name):
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "ホーム", "item": f"{DOMAIN}/index.html"},
            {"@type": "ListItem", "position": 2, "name": name,   "item": f"{DOMAIN}/{page}"},
        ],
    }

def ld_faqpage(pairs):
    return {
        "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": q,
             "acceptedAnswer": {"@type": "Answer", "text": a}}
            for q, a in pairs
        ],
    }

def jsonld_for(page, name):
    if page == "index.html":
        graph = [ld_organization(), ld_website()]
    elif page == "faq.html":
        graph = [ld_breadcrumb(page, name), ld_faqpage(extract_faq(os.path.join(ROOT, "assets/js/faq-data.js")))]
    else:
        graph = [ld_breadcrumb(page, name)]
    if len(graph) == 1:
        doc = {"@context": "https://schema.org", **graph[0]}
    else:
        doc = {"@context": "https://schema.org", "@graph": graph}
    return json.dumps(doc, ensure_ascii=False, indent=2)

# ---------------------------------------------------------------------------
# SEOブロック生成 & 挿入
# ---------------------------------------------------------------------------
def seo_block(page, name, robots):
    robots_val = "noindex,follow" if robots == "noindex" else "index,follow,max-image-preview:large,max-snippet:-1"
    ld = jsonld_for(page, name)
    return (
        "  <!-- SEO:BEGIN （_tools/build-seo.py が生成。手で編集しない。再実行で更新される） -->\n"
        f'  <link rel="canonical" href="{DOMAIN}/{page}">\n'
        f'  <meta name="robots" content="{robots_val}">\n'
        '  <meta property="og:locale" content="ja_JP">\n'
        '  <meta property="og:locale:alternate" content="en_US">\n'
        '  <meta property="og:locale:alternate" content="ne_NP">\n'
        f'  <meta name="theme-color" content="{THEME_COLOR}">\n'
        '  <script type="application/ld+json">\n'
        f'{ld}\n'
        '  </script>\n'
        "  <!-- SEO:END -->\n"
    )

SEO_RE = re.compile(r'[ \t]*<!-- SEO:BEGIN.*?<!-- SEO:END -->\n?', re.DOTALL)

def process_html(page, name, robots):
    path = os.path.join(ROOT, page)
    if not os.path.exists(path):
        print(f"  ! 見つからない: {page}")
        return
    with open(path, encoding="utf-8") as f:
        html = f.read()
    # 既存SEOブロックを除去（再実行で作り直す）
    html = SEO_RE.sub("", html)
    # OGPコメントの誤記を整合
    html = html.replace(
        "（__OGBASE__はドメイン確定後に置換）",
        "（REPLACE-DOMAIN はドメイン確定後に _tools/apply-domain.sh で置換）",
    )
    block = seo_block(page, name, robots)
    # 最初の </head> の直前に挿入
    if "</head>" not in html:
        print(f"  ! </head> が無い: {page}")
        return
    html = html.replace("</head>", block + "</head>", 1)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  ✓ {page}  （{'noindex' if robots=='noindex' else 'index'}）")

# ---------------------------------------------------------------------------
# robots.txt / sitemap.xml
# ---------------------------------------------------------------------------
def write_robots():
    txt = (
        "# 桜花スキルトレーニングセンター — robots.txt\n"
        "User-agent: *\n"
        "Allow: /\n"
        "\n"
        f"Sitemap: {DOMAIN}/sitemap.xml\n"
    )
    with open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8") as f:
        f.write(txt)
    print("  ✓ robots.txt")

def write_sitemap():
    urls = []
    for page, (name, robots, prio, freq) in PAGES.items():
        if prio is None:   # noindex等は除外
            continue
        urls.append(
            "  <url>\n"
            f"    <loc>{DOMAIN}/{page}</loc>\n"
            f"    <lastmod>{TODAY}</lastmod>\n"
            f"    <changefreq>{freq}</changefreq>\n"
            f"    <priority>{prio}</priority>\n"
            "  </url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n"
        "</urlset>\n"
    )
    with open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  ✓ sitemap.xml（{len(urls)} URL）")

# ---------------------------------------------------------------------------
def main():
    print("■ HTMLへSEOブロックを挿入")
    for page, (name, robots, prio, freq) in PAGES.items():
        process_html(page, name, robots)
    print("■ ルートファイル生成")
    write_robots()
    write_sitemap()
    print(f"\n完了。ドメイン確定後: _tools/apply-domain.sh <ドメイン> で {DOMAIN} を一括置換。")

if __name__ == "__main__":
    main()
