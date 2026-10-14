#!/usr/bin/env python3
"""Build KISS_OnePager_Manual_2Auflage.html from _onepager-manual.src.html.
Embeds fonts (assets/*.ttf + ../anzeigen/assets/fonts.css), the chi.pa logo and the book cover (assets/cover.png)."""
import base64, os, re
here = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(here, *a)
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

s = open(p('_onepager-manual.src.html')).read()
s = s.replace('/*FONTS*/', open(p('..', 'anzeigen', 'assets', 'fonts.css')).read())
s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(p('assets', m.group(1))), s)
s = s.replace('/*LOGO*/', b64(p('..', 'anzeigen', 'assets', 'chipa-logo.png')))
s = s.replace('/*COVER*/', 'data:image/png;base64,' + b64(p('assets', 'cover.png')))

# hand-drawn checkbox with green tick
CHECK = ('<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round" stroke-linejoin="round">'
         '<path d="M3.5 6.2 L18.6 5.4 L19.2 20.4 L4.2 20.8 Z" stroke="#2b2a2b" stroke-width="1.5"/>'
         '<path d="M7 12.5 L11 17 L22 2.5" stroke="#7cb526" stroke-width="2.8"/></svg>')
s = s.replace('/*CHECK*/', CHECK)

open(p('KISS_OnePager_Manual_2Auflage.html'), 'w').write(s)
print('built')
