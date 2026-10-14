#!/usr/bin/env python3
"""Build KISS_OnePager_Manual_2Auflage.html from _onepager-manual.src.html.
Drop the real book cover as assets/cover.jpg or assets/cover.png to replace the mock."""
import base64, math, os
here = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(here, *a)
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

s = open(p('_onepager-manual.src.html')).read()
s = s.replace('/*FONTS*/', open(p('..', 'anzeigen', 'assets', 'fonts.css')).read())
s = s.replace('/*PACIFICO*/', b64(p('assets', 'Pacifico-Regular.ttf')))
s = s.replace('/*LOGO*/', b64(p('..', 'anzeigen', 'assets', 'chipa-logo.png')))

# starburst
n = 16
pts = []
for i in range(2 * n):
    r = 49 if i % 2 == 0 else 39
    a = math.pi * i / n
    pts.append(f'{r*math.sin(a):.1f},{-r*math.cos(a):.1f}')
s = s.replace('/*BURST*/', ' '.join(pts))

# wavy banner: wavy top and bottom edge, 126 x 46 units
def wave(y0, amp, x0, x1, waves, reverse=False):
    xs = [x0 + (x1 - x0) * k / 120 for k in range(121)]
    if reverse: xs = xs[::-1]
    return [(x, y0 + amp * math.sin((x - x0) / (x1 - x0) * waves * 2 * math.pi)) for x in xs]
top = wave(6, 3.2, 0, 126, 3.5)
bot = wave(40, 3.2, 0, 126, 3.5, reverse=True)
d = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in top + bot) + ' Z'
s = s.replace('/*WAVE*/', d)

cover = next((p('assets', f) for f in ('cover.jpg', 'cover.png') if os.path.exists(p('assets', f))), None)
if cover:
    mime = 'image/jpeg' if cover.endswith('jpg') else 'image/png'
    s = s.replace('<!--COVER-->', f'<img alt="KISS-Manual Cover" src="data:{mime};base64,{b64(cover)}">')
else:
    s = s.replace('<!--COVER-->', '''<div class="mock"><div class="stripes"><i style="background:#3a8fd0"></i><i style="background:#e3061d"></i><i style="background:#86bc25"></i></div>
      <h3>KISS-<br>SCHUL-<br>TRAINING</h3><p>Förderung der Sozialkompetenz in Gruppen</p>
      <div class="ed">2. AUFLAGE<small>überarbeitet und erweitert</small></div></div>''')

open(p('KISS_OnePager_Manual_2Auflage.html'), 'w').write(s)
print('built', 'with cover' if cover else 'with mock cover')
