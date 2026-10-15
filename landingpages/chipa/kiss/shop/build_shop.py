#!/usr/bin/env python3
"""Build the WooCommerce product images for KISS 2. Auflage (1500 x 2000 px).
Run:  python3 build_shop.py && node render.js   (NODE_PATH must contain playwright)"""
import base64, os, re, sys
here = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(here))
from build import piece  # puzzle edge generator shared with the one-pagers

p = lambda *a: os.path.join(here, *a)
kiss = lambda *a: os.path.join(here, '..', *a)
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

PAGES = ['_01_produktfoto', '_02_neu', '_03_module', '_04_zielgruppe']


def puzzle():
    X, Y, w, h = 120, 740, 630, 560
    fills = ['#8a3fb0', '#d93d8c', '#efe3f7', '#2b2a2b']
    hcut, vcut = [+1, -1], [-1, +1]
    out = []
    for r in range(2):
        for c in range(2):
            x0, y0 = X + c * w, Y + r * h
            d = piece(x0, y0, x0 + w, y0 + h,
                      top=-hcut[c] if r else 0, right=vcut[r] if c == 0 else 0,
                      bottom=hcut[c] if r == 0 else 0, left=-vcut[r] if c else 0, lref=150)
            out.append(f'<path d="{d}" fill="{fills[r * 2 + c]}" stroke="#fff" stroke-width="10" stroke-linejoin="round"/>')
    return ''.join(out)


CHECK = ('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#d93d8c"/>'
         '<path d="M6.5 12.5l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>')

common_css = open(p('_common.css')).read()
repl = {
    '/*COMMON*/': common_css,
    '/*FONTS*/': open(kiss('..', 'anzeigen', 'assets', 'fonts.css')).read(),
    '/*LOGO*/': b64(kiss('..', 'anzeigen', 'assets', 'chipa-logo.png')),
    '/*COVER*/': 'data:image/png;base64,' + b64(kiss('assets', 'cover_up.png')),
    '/*PUZZLE*/': puzzle(),
    '/*CHECK*/': CHECK,
}
for name in PAGES:
    s = open(p(name + '.src.html')).read()
    for k in ('/*COMMON*/',):
        s = s.replace(k, repl[k])
    s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(kiss('assets', m.group(1))), s)
    for k, v in repl.items():
        s = s.replace(k, v)
    out = name.lstrip('_') + '.html'
    open(p(out), 'w').write(s)
    print('built', out)
