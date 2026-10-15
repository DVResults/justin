#!/usr/bin/env python3
"""chi.pa Stellenanzeigen fuer Facebook-Gruppen (1080 x 1350, 4:5).

Drei Designs (klassik, blau, gruen) je Standort. Inhalte stehen unten in JOBS.
  python3 build.py          -> schreibt <standort>-<design>.html
  node render.js            -> rendert alle HTML zu PNG (2x, 2160 x 2700)
"""
import base64, math, os, random

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '..', 'anzeigen', 'assets')
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()
FONTS = open(os.path.join(ASSETS, 'fonts.css')).read()
LOGO = 'data:image/png;base64,' + b64(os.path.join(ASSETS, 'chipa-logo.png'))

G, B, R, O, INK = '#7ab51d', '#1581c9', '#e2001a', '#f5a02a', '#1b1b1b'

JOBS = {
    'hannover': dict(
        city='Hannover', city_line='WIR SUCHEN IN<br>HANNOVER!',
        hours='ca. 20&ndash;40 h / Woche', when='Start: ab sofort oder sp&auml;ter',
        shift='vormittags, nachmittags oder flexibel',
        perks=['32 Urlaubstage j&auml;hrlich', 'Unbefristeter Arbeitsvertrag', 'Verg&uuml;tung nach TV&Ouml;D S12',
               'Flexible Gleitzeit &amp; Diensthandy', 'Fahrzeugpark &amp; GVH-Karte f&uuml;r Dienstfahrten',
               'Arbeitgeberfinanzierte Betriebsrente', 'Fortbildung, Fachberatung &amp; Supervision',
               'Sports &amp; Spa Hannover (S&uuml;dstadt &amp; List)', 'Betriebsausfl&uuml;ge &amp; Kaffee-Flatrate'],
        profil=['Studium Soziale Arbeit / Sozialp&auml;dagogik (Diplom oder B.A.)',
                'Erfahrung in der Jugendhilfe', 'F&uuml;hrerschein Klasse B (zwingend)'],
        bonus='Sports &amp; Spa<br>inklusive', h1k=76, h1g=70),
    'goettingen': dict(
        city='G&ouml;ttingen &amp; Northeim', city_line='WIR SUCHEN IN<br>G&Ouml;TTINGEN &amp; NORTHEIM!',
        hours='ca. 30&ndash;35 h / Woche', when='Start: ab sofort oder sp&auml;ter',
        shift='vorwiegend nachmittags, flexibel',
        perks=['32 Urlaubstage j&auml;hrlich', 'Unbefristeter Arbeitsvertrag', 'Verg&uuml;tung nach TV&Ouml;D S12',
               'Flexible Arbeitszeiten &amp; Diensthandy', 'Fahrzeugpark f&uuml;r Dienstfahrten',
               'Arbeitgeberfinanzierte Betriebsrente', 'Willkommenspaket &amp; Weiterbildungsgutschein',
               'McFit-Mitgliedschaft &amp; Gesundheitsbonus', 'Betriebsausfl&uuml;ge &amp; Kaffee-Flatrate'],
        profil=['Studium Soziale Arbeit, Sozial- oder Heilp&auml;dagogik (B.A., M.A. oder Diplom)',
                'Mind. 1 Jahr Erfahrung in der Jugendhilfe', 'F&uuml;hrerschein Klasse B (zwingend)'],
        bonus='McFit<br>inklusive', h1k=62, h1g=58),
}


def network(w, h, seed, n=26, color='#b9bec6', box=None):
    """Grey dot-and-line network like in the Aichach-Friedberg template."""
    rnd = random.Random(seed)
    x0, y0, x1, y1 = box or (0, 0, w, h)
    pts = [(rnd.uniform(x0, x1), rnd.uniform(y0, y1)) for _ in range(n)]
    out = []
    for i, p in enumerate(pts):
        near = sorted(pts, key=lambda q: (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2)[1:4]
        for q in near:
            out.append(f'<line x1="{p[0]:.0f}" y1="{p[1]:.0f}" x2="{q[0]:.0f}" y2="{q[1]:.0f}"/>')
    dots = ''.join(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="5"/>' for x, y in pts)
    return (f'<svg class="net" viewBox="0 0 {w} {h}" style="position:absolute;left:0;top:0;width:{w}px;height:{h}px">'
            f'<g stroke="{color}" stroke-width="1.6" opacity=".7">{"".join(out)}</g><g fill="{color}">{dots}</g></svg>')


def lis(items, cls=''):
    return ''.join(f'<li class="{cls}">{t}</li>' for t in items)


BASE_CSS = """
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1080px;height:1350px;overflow:hidden}
body{font-family:'Montserrat',sans-serif;color:#1b1b1b;-webkit-font-smoothing:antialiased}
.ad{position:relative;width:1080px;height:1350px;overflow:hidden}
.a{position:absolute}
ul{list-style:none}
"""

CHECK = ('<svg viewBox="0 0 24 24" class="ck"><circle cx="12" cy="12" r="12" fill="{c}"/>'
         '<path d="M6.5 12.5l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>')


def page(css, body):
    return f'<!doctype html><html lang="de"><head><meta charset="utf-8"><style>{FONTS}{BASE_CSS}{css}</style></head><body><div class="ad">{body}</div></body></html>'


# ------------------------------------------------------------------ 1 klassik
def klassik(j):
    css = f"""
.ad{{background:#f6f5f2}}
.arc1{{left:-210px;top:-210px;width:430px;height:430px;border-radius:50%;border:58px solid {G}}}
.dot1{{left:236px;top:44px;width:52px;height:52px;border-radius:50%;background:{G}}}
.arc2{{right:-250px;bottom:-250px;width:440px;height:440px;border-radius:50%;border:56px solid {B}}}
.logo{{right:52px;top:46px;height:52px}}
h1{{left:0;right:0;top:118px;text-align:center;font-weight:900;font-size:{j['h1k']}px;line-height:1.02;color:{G};letter-spacing:-.01em;text-shadow:0 3px 0 rgba(0,0,0,.08)}}
.role{{left:0;right:0;top:300px;text-align:center;font-weight:800;font-size:45px;line-height:1.1}}
.role .r{{color:{R}}} .role .b{{color:{B}}}
.role small{{display:block;font-size:35px;color:{INK};margin-top:6px}}
.meta{{left:0;right:0;top:418px;text-align:center;font-family:'Source Sans 3';font-size:30px;color:#3c4149}}
.meta b{{font-weight:700;color:{INK}}}
.col{{left:64px;top:492px;width:610px}}
.col h3{{font-weight:800;font-size:33px;margin:0 0 10px}}
.col li{{position:relative;padding-left:30px;font-family:'Source Sans 3';font-size:27.5px;line-height:1.3;margin-bottom:4px}}
.col li:before{{content:"";position:absolute;left:4px;top:13px;width:11px;height:11px;border-radius:50%;background:{B}}}
.col li.p:before{{background:{R}}}
.col .gap{{height:20px}}
.facts{{left:700px;top:520px;width:330px;display:flex;flex-direction:column;gap:22px}}
.f{{border-radius:28px;padding:22px 26px;color:#fff;box-shadow:0 10px 24px rgba(0,0,0,.12)}}
.f b{{display:block;font-weight:900;font-size:46px;line-height:1}}
.f span{{font-family:'Source Sans 3';font-weight:600;font-size:24px;line-height:1.2}}
.pill{{left:0;right:0;top:1140px;display:flex;justify-content:center}}
.pill span{{background:{O};border-radius:60px;padding:16px 56px;font-weight:800;font-size:44px;box-shadow:0 8px 18px rgba(245,160,42,.35)}}
.cta{{left:0;right:0;top:1232px;text-align:center;font-weight:800;font-size:30px;line-height:1.25}}
.cta .m{{color:{B}}}
"""
    body = f"""
{network(1080, 1350, 3, n=9, box=(560, 4, 1000, 100))}
{network(1080, 1350, 7, n=9, box=(10, 1150, 250, 1340))}
<div class="a arc1"></div><div class="a dot1"></div><div class="a arc2"></div>
<img class="a logo" src="{LOGO}" alt="chi.pa">
<h1 class="a">{j['city_line']}</h1>
<div class="a role"><span class="r">Sozialarbeiter*in</span> &amp; <span class="b">Sozialp&auml;dagog*in</span><small>in HzE f&uuml;r die ambulante Jugendhilfe</small></div>
<div class="a meta"><b>{j['hours']}</b> &middot; {j['shift']} &middot; ab sofort</div>
<div class="a col"><h3>Dich erwarten:</h3><ul>{lis(j['perks'])}</ul><div class="gap"></div>
<h3>Dein Profil:</h3><ul>{lis(j['profil'], 'p')}</ul></div>
<div class="a facts">
  <div class="f" style="background:{G}"><b>S12</b><span>Verg&uuml;tung<br>nach TV&Ouml;D</span></div>
  <div class="f" style="background:{B}"><b>32</b><span>Urlaubstage<br>im Jahr</span></div>
  <div class="f" style="background:{R}"><b>Flexibel</b><span>Arbeitszeiten<br>&amp; Diensthandy</span></div>
</div>
<div class="a pill"><span>2 offene Stellen</span></div>
<div class="a cta">Sende uns deinen Lebenslauf an<br><span class="m">bewerbung@chipa.de</span>!</div>
"""
    return page(css, body)


# ------------------------------------------------------------------ 2 blau
def blau(j):
    css = f"""
.ad{{background:#fff}}
.top{{left:0;top:0;width:1080px;height:470px;background:linear-gradient(135deg,#1581c9 0%,#0d5f99 100%)}}
.wave{{left:0;top:430px;width:1080px;height:90px}}
.ring{{right:-130px;top:-130px;width:420px;height:420px;border-radius:50%;border:46px solid rgba(255,255,255,.14)}}
.ring2{{right:-70px;top:380px;width:170px;height:170px;border-radius:50%;background:{G};opacity:.95}}
.logo{{left:64px;top:52px;height:48px;background:#fff;border-radius:40px;padding:10px 22px;box-sizing:content-box}}
.k{{left:64px;top:150px;color:#cfe8f8;font-weight:800;font-size:28px;letter-spacing:.18em}}
h1{{left:64px;top:192px;width:960px;color:#fff;font-weight:900;font-size:66px;line-height:1.03}}
h1 span{{color:#b9f06b}}
.role{{left:64px;top:356px;color:#fff;font-weight:700;font-size:31px;line-height:1.25}}
.chips{{left:64px;top:545px;display:flex;gap:12px;width:960px}}
.chip{{border:3px solid {B};color:{B};border-radius:40px;padding:7px 20px;font-weight:800;font-size:22px;white-space:nowrap}}
.chip.g{{border-color:{G};color:#5a8a12}}
.cols{{left:64px;top:625px;width:952px;display:grid;grid-template-columns:1.25fr 1fr;gap:40px}}
.cols h3{{font-weight:800;font-size:31px;margin-bottom:12px}}
.cols h3 span{{color:{B}}}
.cols li{{display:grid;grid-template-columns:36px 1fr;align-items:start;font-family:'Source Sans 3';font-size:26px;line-height:1.28;margin-bottom:7px}}
.ck{{width:26px;height:26px;margin-top:3px}}
.box{{background:#f2f7fb;border-radius:26px;padding:26px 26px 18px}}
.box h3 span{{color:{R}}}
.bonus{{margin-top:22px;background:{G};color:#fff;border-radius:26px;padding:22px 26px;font-weight:900;font-size:34px;line-height:1.1}}
.bottom{{left:0;right:0;top:1180px;height:170px;background:{INK};display:flex;align-items:center;justify-content:space-between;padding:0 64px;color:#fff}}
.pill{{background:{O};color:{INK};border-radius:50px;padding:14px 40px;font-weight:900;font-size:38px}}
.cta{{text-align:right;font-weight:700;font-size:26px;line-height:1.35}}
.cta b{{display:block;font-weight:900;font-size:36px;color:#7fc4f0}}
"""
    body = f"""
<div class="a top"></div><div class="a ring"></div>
<svg class="a wave" viewBox="0 0 1080 90" preserveAspectRatio="none"><path d="M0 40 C 260 100, 520 0, 780 40 S 1080 60, 1080 30 V0 H0 Z" fill="#0f6aa8"/></svg>
<div class="a ring2"></div>
<img class="a logo" src="{LOGO}" alt="chi.pa">
<div class="a k">STELLENANGEBOT &middot; 2 OFFENE STELLEN</div>
<h1 class="a">Wir suchen dich in<br><span>{j['city']}!</span></h1>
<div class="a role">Sozialarbeiter*in / Sozialp&auml;dagog*in (w/m/d)<br>in HzE f&uuml;r die ambulante Jugendhilfe</div>
<div class="a chips"><span class="chip">{j['hours']}</span><span class="chip">{j['shift']}</span><span class="chip g">ab sofort</span></div>
<div class="a cols">
  <div><h3>Das <span>bieten</span> wir:</h3><ul>{''.join('<li>' + CHECK.format(c=B) + '<span>' + t + '</span></li>' for t in j['perks'])}</ul></div>
  <div><div class="box"><h3>Dein <span>Profil:</span></h3><ul>{''.join('<li>' + CHECK.format(c=R) + '<span>' + t + '</span></li>' for t in j['profil'])}</ul></div>
  <div class="bonus">{j['bonus']}</div></div>
</div>
<div class="a bottom"><span class="pill">2 offene Stellen</span><div class="cta">Sende uns deinen Lebenslauf an<b>bewerbung@chipa.de</b></div></div>
"""
    return page(css, body)


# ------------------------------------------------------------------ 3 gruen
def gruen(j):
    css = f"""
.ad{{background:{G}}}
.blob1{{left:-160px;top:-120px;width:620px;height:620px;border-radius:50%;background:#8cc531}}
.blob2{{right:-180px;bottom:120px;width:520px;height:520px;border-radius:50%;background:#6aa312}}
.logo{{left:60px;top:48px;height:46px;background:#fff;border-radius:40px;padding:10px 22px;box-sizing:content-box}}
.badge{{right:34px;top:18px;width:172px;height:172px;border-radius:50%;background:{O};color:{INK};display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(10deg);box-shadow:0 10px 22px rgba(0,0,0,.18)}}
.badge b{{font-weight:900;font-size:78px;line-height:.9}}
.badge span{{font-weight:800;font-size:24px;line-height:1.05;text-align:center}}
.k{{left:60px;top:150px;color:#fff;font-weight:800;font-size:28px;letter-spacing:.2em}}
h1{{left:58px;top:188px;width:900px;color:#fff;font-weight:900;font-size:{j['h1g']}px;line-height:1.02}}
.card{{left:44px;top:370px;width:992px;height:790px;background:#fff;border-radius:40px;box-shadow:0 18px 40px rgba(40,70,0,.25);padding:44px 48px}}
.card .role{{font-weight:800;font-size:36px;line-height:1.15}}
.card .role .r{{color:{R}}} .card .role .b{{color:{B}}}
.card .sub{{font-family:'Source Sans 3';font-size:27px;color:#3c4149;margin-top:8px}}
.card .sub b{{color:{INK}}}
.grid{{display:grid;grid-template-columns:1fr 1fr;gap:8px 28px;margin-top:26px}}
.it{{display:flex;gap:14px;align-items:center;background:#f3f8ea;border-radius:18px;padding:12px 16px;font-family:'Source Sans 3';font-weight:600;font-size:24px;line-height:1.2}}
.it i{{flex:0 0 14px;height:14px;border-radius:50%;background:{B}}}
.prof{{margin-top:24px;border-top:3px dashed #d9e7c4;padding-top:18px}}
.prof h3{{font-weight:800;font-size:28px;margin-bottom:8px}}
.prof li{{font-family:'Source Sans 3';font-size:25px;line-height:1.3;padding-left:26px;position:relative;margin-bottom:3px}}
.prof li:before{{content:"";position:absolute;left:2px;top:11px;width:11px;height:11px;border-radius:50%;background:{R}}}
.cta{{left:0;right:0;top:1196px;text-align:center;color:#fff;font-weight:800;font-size:32px;line-height:1.3}}
.cta b{{display:inline-block;margin-top:8px;background:#fff;color:{B};border-radius:50px;padding:10px 34px;font-weight:900;font-size:38px}}
"""
    body = f"""
<div class="a blob1"></div><div class="a blob2"></div>
<img class="a logo" src="{LOGO}" alt="chi.pa">
<div class="a badge"><b>2</b><span>offene<br>Stellen</span></div>
<div class="a k">JETZT BEWERBEN</div>
<h1 class="a">Verst&auml;rke unser Team in {j['city']}!</h1>
<div class="a card">
  <div class="role"><span class="r">Sozialarbeiter*in</span> / <span class="b">Sozialp&auml;dagog*in</span> (w/m/d)</div>
  <div class="sub">HzE, ambulante Jugendhilfe &middot; <b>{j['hours']}</b> &middot; {j['shift']} &middot; ab sofort</div>
  <div class="grid">{''.join('<div class="it"><i></i><span>' + t + '</span></div>' for t in j['perks'])}<div class="it" style="background:#eaf4fb"><i style="background:{G}"></i><span>Intensive Einarbeitung</span></div></div>
  <div class="prof"><h3>Dein Profil:</h3><ul>{lis(j['profil'])}</ul></div>
</div>
<div class="a cta">Sende uns deinen Lebenslauf an<br><b>bewerbung@chipa.de</b></div>
"""
    return page(css, body)


DESIGNS = {'1-klassik': klassik, '2-blau': blau, '3-gruen': gruen}

if __name__ == '__main__':
    for key, j in JOBS.items():
        for name, fn in DESIGNS.items():
            out = os.path.join(HERE, f'{key}-{name}.html')
            open(out, 'w').write(fn(j))
            print('built', os.path.basename(out))
