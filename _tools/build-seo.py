#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""OUKA production SEO builder — Japan Job first, Nepal/Gaidakot expansion, production-domain safe."""
import re, json, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAIN = "https://abas-globalgroup.com"
THEME_COLOR = "#12294B"
TODAY = datetime.date.today().isoformat()
SCHOOL_NAME = "OUKA Skill Training Center"
SCHOOL_ALT = ["OUKA Nepal", "Ouka Skill Training Center", "桜花スキルトレーニングセンター", "ओउका"]
SCHOOL_LEGAL = "Ouka Skill Training Center Pvt. Ltd."
PAGES = {
 "index.html":("Japan Job / Work to Japan",None,"1.0","weekly"), "education.html":("Japan Job तयारीका लागि जापानी भाषा तथा तालिम",None,"0.9","weekly"),
 "visa.html":("Japan Job, SSW तथा Work in Japan जानकारी",None,"0.9","monthly"), "assessment.html":("Japan Job निःशुल्क मूल्याङ्कन",None,"0.9","monthly"),
 "company.html":("Japan Job candidate खोज्ने जापानी कम्पनीका लागि",None,"0.9","monthly"), "teachers.html":("शिक्षक",None,"0.7","monthly"),
 "students.html":("Japan Job तयारीमा रहेका विद्यार्थी",None,"0.8","weekly"), "gallery.html":("Japan Job तालिम गतिविधि",None,"0.7","weekly"),
 "faq.html":("Japan Job / Work in Japan प्रश्नोत्तर",None,"0.8","monthly"), "contact.html":("Japan Job सम्पर्क",None,"0.8","yearly"),
 "student-application.html":("Japan Job तयारी भर्ना तथा अन्तर्वार्ता आवेदन",None,"0.8","yearly"), "partners.html":("Japan Job साझेदार",None,"0.6","yearly"),
 "registration.html":("दर्ता",None,"0.5","yearly"), "privacy.html":("गोपनीयता",None,"0.3","yearly"),
 "terms.html":("सर्तहरू",None,"0.3","yearly"), "assessment-result.html":("मूल्याङ्कन नतिजा","noindex",None,None)}
def extract_faq(path):
 s=open(path,encoding="utf-8").read(); q=re.findall(r'q:\s*\{\s*ja:\s*"((?:[^"\\]|\\.)*)"',s); a=re.findall(r'a:\s*\{\s*ja:\s*"((?:[^"\\]|\\.)*)"',s)
 return [(x.replace('\\"','"'),y.replace('\\"','"')) for x,y in zip(q,a)]
def org():
 return {"@type":"EducationalOrganization","@id":DOMAIN+"/#organization","name":SCHOOL_NAME,"alternateName":SCHOOL_ALT,"legalName":SCHOOL_LEGAL,"url":DOMAIN+"/","logo":DOMAIN+"/assets/images/logo.svg","image":DOMAIN+"/assets/images/ogp.png","description":"Japan Job / Work in Japan बाट सुरु गरेर, Nepal का candidate लाई जापानी भाषा, JFT/JLPT, SSW, interview र जापानमा काम गर्न आवश्यक तयारी तथा तालिम प्रदान गर्ने संस्था।","slogan":"Work to Japan","telephone":"+977-9743472638","address":{"@type":"PostalAddress","streetAddress":"Gaidakot 5","addressLocality":"Gaidakot","addressRegion":"Nawalparasi East","addressCountry":"NP"},"areaServed":["Nepal","Japan"],"knowsAbout":["Japan job","Work in Japan","Japan employment preparation","Japanese job interview preparation","Specified Skilled Worker","SSW","JFT-Basic","JLPT","Japanese language training","Nepal to Japan employment","Gaidakot Japanese training"]}
def website(): return {"@type":"WebSite","@id":DOMAIN+"/#website","url":DOMAIN+"/","name":SCHOOL_NAME,"alternateName":["OUKA Nepal","Work to Japan","Japan Job Nepal"],"inLanguage":["ne","en","ja"],"publisher":{"@id":DOMAIN+"/#organization"}}
def crumb(page,name): return {"@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Japan Job / Work to Japan","item":DOMAIN+"/"},{"@type":"ListItem","position":2,"name":name,"item":DOMAIN+"/"+page}]}
def faq(pairs): return {"@type":"FAQPage","mainEntity":[{"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":a}} for q,a in pairs]}
def jsonld(page,name):
 graph=[org(),website()] if page=="index.html" else ([crumb(page,name),faq(extract_faq(os.path.join(ROOT,"assets/js/faq-data.js")))] if page=="faq.html" else [crumb(page,name)])
 return json.dumps({"@context":"https://schema.org","@graph":graph},ensure_ascii=False,indent=2)
def block(page,name,robots):
 canonical=DOMAIN+"/" if page=="index.html" else DOMAIN+"/"+page; rv="noindex,follow" if robots=="noindex" else "index,follow,max-image-preview:large,max-snippet:-1"
 return f'''  <!-- SEO:BEGIN -->\n  <link rel="canonical" href="{canonical}">\n  <meta name="robots" content="{rv}">\n  <meta property="og:locale" content="ne_NP">\n  <meta property="og:locale:alternate" content="en_US">\n  <meta property="og:locale:alternate" content="ja_JP">\n  <meta name="theme-color" content="{THEME_COLOR}">\n  <script type="application/ld+json">\n{jsonld(page,name)}\n  </script>\n  <!-- SEO:END -->\n'''
SEO_RE=re.compile(r'[ \t]*<!-- SEO:BEGIN.*?<!-- SEO:END -->\n?',re.DOTALL)
def process(page,name,robots):
 path=os.path.join(ROOT,page)
 if not os.path.exists(path): return
 html=open(path,encoding="utf-8").read(); html=SEO_RE.sub("",html); html=html.replace("<html lang=\"ja\">","<html lang=\"ne\">") if page=="index.html" else html
 html=html.replace("</head>",block(page,name,robots)+"</head>",1); open(path,"w",encoding="utf-8").write(html)
def main():
 for p,(n,r,prio,freq) in PAGES.items(): process(p,n,r)
 open(os.path.join(ROOT,"robots.txt"),"w",encoding="utf-8").write("User-agent: *\nAllow: /\n\nSitemap: "+DOMAIN+"/sitemap.xml\n")
 urls=[]
 for p,(n,r,prio,freq) in PAGES.items():
  if prio: urls.append(f"  <url>\n    <loc>{DOMAIN+'/' if p=='index.html' else DOMAIN+'/'+p}</loc>\n    <lastmod>{TODAY}</lastmod>\n    <changefreq>{freq}</changefreq>\n    <priority>{prio}</priority>\n  </url>")
 open(os.path.join(ROOT,"sitemap.xml"),"w",encoding="utf-8").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+"\n".join(urls)+'\n</urlset>\n')
if __name__=="__main__": main()
