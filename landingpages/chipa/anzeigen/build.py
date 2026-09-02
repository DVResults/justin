# -*- coding: utf-8 -*-
"""Baut die chi.pa-Stellenanzeige in allen Meta-Formaten.

  python3 build.py                 -> HTML mit Platzhalter-Silhouette
  python3 build.py <person-url>    -> HTML mit diesem Foto (URL oder Dateiname)

Schriften und Logo stecken als base64 in der Datei, sie laeuft also offline.
"""
import base64, io, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')

def b64(path):
    return base64.b64encode(open(path, 'rb').read()).decode()

FALLBACK = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3FMOEY2sW2O9UHP9weQoM4ut9qO/668c2d66-29bc-4b03-bd2d-835dc50d6ccb.png'  # freigestelltes Portrait, falls person.png fehlt
PERSON = sys.argv[1] if len(sys.argv) > 1 else 'person.png'

# ---------------------------------------------------------------- Inhalte ----
CITY      = 'Hannover'
ROLE_A    = 'Sozialarbeiter*in'
ROLE_B    = 'Sozialp&auml;dagog*in'
ROLE_SUB  = 'in HzE f&uuml;r die ambulante Jugendhilfe'
PENSUM    = 'Vollzeit / Teilzeit &middot; 20&ndash;40 h pro Woche'
BADGE     = 'Ab sofort oder sp&auml;ter'
CTA       = 'Sende uns deinen Lebenslauf an<br>bewerbung@chipa.de!'

PERKS = [
    '32 Urlaubstage j&auml;hrlich',
    'Unbefristeter Arbeitsvertrag',
    'Verg&uuml;tung nach TV&Ouml;D S12',
    'Multiprofessionelles Team',
    'Fortbildungen &amp; Fachberatung',
    'Sports-&amp;-Spa-Mitgliedschaft',
    'GVH-Karte &amp; Fahrzeugpark',
    'Betriebsrente, AG-finanziert',
    'Teamevents &amp; Betriebsausfl&uuml;ge',
]
PROFIL = [
    'Studium Sozialp&auml;dagogik / Soziale Arbeit',
    'gerne Erfahrung mit Kindern &amp; Jugendlichen',
    'F&uuml;hrerschein Klasse B (zwingend)',
]

# ---------------------------------------------------------------- Formate ----
# safe_top / safe_bottom: Bereiche, die auf dem Handy von der Plattform-UI
# ueberdeckt werden koennen. Text und Logo bleiben ausserhalb.
FORMATS = {
    'feed-4x5': dict(w=1080, h=1350, k=1.12, col=566, person=864, bleed=60, logo=64,
                     padx=54, safe_top=112, safe_bottom=54,
                     label='Meta Feed 4:5 (empfohlen)'),
    'feed-1x1': dict(w=1080, h=1080, k=0.99, col=546, person=740, bleed=20, logo=54,
                     padx=48, safe_top=96,  safe_bottom=44,
                     label='Meta Feed 1:1'),
    'story-9x16': dict(w=1080, h=1920, k=1.24, col=606, person=674, bleed=60, logo=76,
                     padx=64, safe_top=300, safe_bottom=340,
                     label='Stories / Reels 9:16'),
}

def deco(w, h):
    """Boegen und Netzgrafik, an die jeweilige Leinwandhoehe angepasst."""
    net_tr = ('M980 40 L1042 118 L968 196 L1040 262 M980 40 L900 96 L968 196 '
              'M900 96 L830 30 M1042 118 L1074 60 M968 196 L886 236 L830 170 '
              'M886 236 L920 320 L1010 300 L1040 262 M920 320 L860 380')
    dots_tr = [(980,40),(1042,118),(968,196),(1040,262),(900,96),(830,30),
               (1074,60),(886,236),(830,170),(920,320),(1010,300),(860,380)]
    net_bl = ('M20 700 L96 760 L40 850 L120 906 L44 980 M96 760 L180 726 '
              'L246 800 L180 880 L120 906 M246 800 L330 764 M180 880 L214 968 '
              'L300 940 M40 850 L-30 900')
    dots_bl = [(20,700),(96,760),(40,850),(120,906),(44,980),(180,726),
               (246,800),(180,880),(330,764),(214,968),(300,940)]
    dy = h - 1080                      # Netz unten links mitwandern lassen
    dots = ''.join('<circle cx="%d" cy="%d" r="4.5"/>' % (x, y) for x, y in dots_tr)
    dots += ''.join('<circle cx="%d" cy="%d" r="4.5"/>' % (x, y + dy) for x, y in dots_bl)
    return f'''<svg class="deco" width="{w}" height="{h}" viewBox="0 0 {w} {h}" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M 4 300 A 260 260 0 0 1 264 40" stroke="#7ab51d" stroke-width="58" stroke-linecap="round"/>
<circle cx="352" cy="30" r="27" fill="#7ab51d"/>
<path d="M {w-8} {h-322} A 300 300 0 0 1 {w-308} {h-22}" stroke="#1581c9" stroke-width="58" stroke-linecap="round"/>
<g stroke="#b9bec6" stroke-width="1.5" opacity=".8"><path d="{net_tr}"/><path transform="translate(0,{dy})" d="{net_bl}"/></g>
<g fill="#9aa1ab">{dots}</g></svg>'''

def build(name, f):
    li = lambda items: ''.join('<li>%s</li>' % t for t in items)
    logo = b64(os.path.join(ASSETS, 'chipa-logo.png'))
    fonts = io.open(os.path.join(ASSETS, 'fonts.css'), encoding='utf-8').read()
    w, h, k = f['w'], f['h'], f['k']
    return f'''<!doctype html>
<meta charset="utf-8">
<title>chi.pa {CITY} &ndash; {f['label']}</title>
<style>
{fonts}
:root{{--green:#7ab51d;--blue:#1581c9;--red:#e2001a;--ink:#1b1b1b;--orange:#f5a02a;--bg:#f4f2ee;--k:{k}}}
html,body{{margin:0;padding:0;background:#5a5a5a}}
.ad{{position:relative;width:{w}px;height:{h}px;overflow:hidden;background:var(--bg);
    font-family:'Source Sans 3','Segoe UI',system-ui,sans-serif;color:var(--ink)}}
.deco{{position:absolute;inset:0}}
.logo{{position:absolute;top:{max(30, f['safe_top']-f['logo']-18)}px;right:{f['padx']}px;height:{f['logo']}px;width:auto;z-index:4}}
/* FOTO: freigestelltes PNG. Fehlt es, blendet es sich aus. */
.person{{position:absolute;right:-{f['bleed']}px;bottom:0;height:{f['person']}px;width:auto;z-index:2;
        filter:drop-shadow(0 12px 26px rgba(21,41,77,.20))}}
.safe{{position:absolute;left:0;right:0;top:{f['safe_top']}px;bottom:{f['safe_bottom']}px;
      z-index:3;padding:0 {f['padx']}px;overflow:hidden}}
.fit{{transform-origin:top center}}
h1{{margin:0;padding-left:132px;font-family:'Montserrat',system-ui,sans-serif;font-weight:900;
   font-size:calc(73px*var(--k));line-height:1;color:var(--green);text-transform:uppercase;
   text-align:center;text-shadow:0 3px 0 rgba(21,41,77,.20)}}
.role{{margin:calc(18px*var(--k)) 0 0;text-align:center;font-weight:800;font-size:calc(44px*var(--k));line-height:1.06}}
.role .a{{color:var(--red)}} .role .b{{color:var(--blue)}}
.role2{{margin:1px 0 0;text-align:center;font-weight:800;font-size:calc(39px*var(--k));line-height:1.08}}
.pensum{{margin:calc(7px*var(--k)) 0 0;text-align:center;font-weight:400;font-size:calc(29px*var(--k));color:#3c4149}}
.cols{{margin-top:calc(16px*var(--k));width:{f['col']}px}}
h2{{margin:0 0 calc(6px*var(--k));font-family:'Montserrat',system-ui,sans-serif;font-weight:800;font-size:calc(34px*var(--k))}}
ul{{list-style:none;margin:0 0 calc(9px*var(--k));padding:0}}
li{{position:relative;padding:0 0 calc(4px*var(--k)) calc(30px*var(--k));font-size:calc(22.5px*var(--k));line-height:1.2}}
li::before{{content:"";position:absolute;left:calc(5px*var(--k));top:calc(9px*var(--k));
           width:calc(11px*var(--k));height:calc(11px*var(--k));border-radius:50%}}
.perks li::before{{background:var(--blue)}}
.profil li::before{{background:var(--red)}}
.badge{{display:inline-block;margin:0 0 0 40px;background:var(--orange);color:#1b1b1b;
       font-family:'Montserrat',system-ui,sans-serif;font-weight:800;font-size:calc(34px*var(--k));
       padding:calc(12px*var(--k)) calc(44px*var(--k));border-radius:99px}}
.cta{{margin:calc(10px*var(--k)) 0 0;width:{f['col']+34}px;text-align:center;
     font-family:'Montserrat',system-ui,sans-serif;font-weight:800;font-size:calc(32px*var(--k));line-height:1.26}}
/* Hilfslinien nur mit ?guides=1 */
.guide{{display:none;position:absolute;left:0;right:0;z-index:9;background:rgba(226,0,26,.13);
       border:1px dashed rgba(226,0,26,.55);pointer-events:none}}
body.guides .guide{{display:block}}
body.textonly .deco,body.textonly .logo,body.textonly .person{{display:none}}
body.textonly,body.textonly .ad{{background:transparent}}
</style>

<div class="ad" id="ad">
{deco(w, h)}
  <img class="logo" src="data:image/png;base64,{logo}" alt="chi.pa">
  <img class="person" src="person.png" alt=""
       onerror="this.onerror=null;this.src=FALLBACK;this.onerror=function(){{this.style.display='none'}}">
  <div class="guide" style="top:0;height:{f['safe_top']}px"></div>
  <div class="guide" style="bottom:0;height:{f['safe_bottom']}px"></div>

  <div class="safe">
    <div class="fit" id="fit">
      <h1>Wir suchen in<br>{CITY}!</h1>
      <p class="role"><span class="a">{ROLE_A}</span> &amp; <span class="b">{ROLE_B}</span></p>
      <p class="role2">{ROLE_SUB}</p>
      <p class="pensum">{PENSUM}</p>
      <div class="cols">
        <h2>Dich erwarten:</h2>
        <ul class="perks">{li(PERKS)}</ul>
        <h2>Dein Profil:</h2>
        <ul class="profil">{li(PROFIL)}</ul>
      </div>
      <div class="badge">{BADGE}</div>
      <p class="cta">{CTA}</p>
    </div>
  </div>
</div>

<script>
var FALLBACK="{FALLBACK}";
/* Auto-Fit: skaliert den Textblock herunter, falls er nicht in die sichere
   Flaeche passt. Dadurch kann nach dem Bearbeiten nichts abgeschnitten werden. */
(function(){{
  function fit(){{
    var box=document.getElementById('fit'), safe=box.parentNode;
    box.style.transform='none';
    var need=box.scrollHeight, avail=safe.clientHeight;
    var k=need>avail?avail/need:1;
    box.style.transform='scale('+k+')';
    box.setAttribute('data-fit',k.toFixed(3));
  }}
  if(document.fonts&&document.fonts.ready){{document.fonts.ready.then(fit);}}
  window.addEventListener('load',fit);
  if(location.search.indexOf('guides=1')>-1){{document.body.classList.add('guides');}}
  if(location.search.indexOf('layer=text')>-1){{document.body.classList.add('textonly');}}
  fit();
}})();
</script>
'''

if __name__ == '__main__':
    for name, f in FORMATS.items():
        out = os.path.join(HERE, 'hannover-%s.html' % name)
        io.open(out, 'w', encoding='utf-8').write(build(name, f))
        print('%-12s %4dx%-5d %s' % (name, f['w'], f['h'], os.path.basename(out)))
