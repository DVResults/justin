#!/usr/bin/env python3
"""Build the KISS one-pager variants (A Schule, B Cover-Stil, C Bunt) from _onepager-*.src.html.
Embeds fonts (assets/*.ttf + ../anzeigen/assets/fonts.css), the chi.pa logo and the book cover (assets/cover.png).
Render to PDF/PNG afterwards with Playwright (see README)."""
import base64, os, re
here = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(here, *a)
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

VARIANTS = {
    '_onepager-A-schule.src.html': 'KISS_OnePager_A_Schule.html',
    '_onepager-B-cover.src.html': 'KISS_OnePager_B_Cover.html',
    '_onepager-C-bunt.src.html': 'KISS_OnePager_C_Bunt.html',
}

def kids():
    """Five flat children holding hands (viewBox 100 x 36)."""
    shirts = ['#1f86c8', '#e3061d', '#76b82a', '#ffcc00', '#8a3fb0']
    skins = ['#f2c9a0', '#8d5a3b', '#f5d2b8', '#c98e5f', '#e8b48a']
    hair = ['#3b2a20', '#1d1d1d', '#c8762d', '#2a1c14', '#5a3a22']
    out = []
    for i, cx in enumerate([10, 30, 50, 70, 90]):
        c = shirts[i]
        if i < 4:  # arm to the next child
            out.append(f'<path d="M{cx+4} 16 L{cx+10} 20 L{cx+16} 16" stroke="{c}" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
        if i == 0:
            out.append(f'<path d="M{cx-4} 16 L{cx-8} 22" stroke="{c}" stroke-width="2.4" stroke-linecap="round"/>')
        if i == 4:
            out.append(f'<path d="M{cx+4} 16 L{cx+8} 22" stroke="{c}" stroke-width="2.4" stroke-linecap="round"/>')
        out.append(f'<rect x="{cx-3.6}" y="25" width="2.8" height="9" rx="1.2" fill="#2b2a2b"/><rect x="{cx+0.8}" y="25" width="2.8" height="9" rx="1.2" fill="#2b2a2b"/>')
        if i % 2:   # dress / tunic
            out.append(f'<path d="M{cx-4.5} 13.5 Q{cx} 12 {cx+4.5} 13.5 L{cx+7} 27 L{cx-7} 27 Z" fill="{c}"/>')
        else:       # shirt
            out.append(f'<rect x="{cx-5}" y="13" width="10" height="13.5" rx="3" fill="{c}"/>')
        out.append(f'<circle cx="{cx}" cy="7" r="4.8" fill="{skins[i]}"/>')
        if i in (1, 3):   # long hair / bun
            out.append(f'<path d="M{cx-5} 7 A5 5 0 0 1 {cx+5} 7 L{cx+5.4} 11 L{cx+3.6} 9 L{cx+3.6} 6 Q{cx} 4.5 {cx-3.6} 6 L{cx-3.6} 9 L{cx-5.4} 11 Z" fill="{hair[i]}"/>')
        else:
            out.append(f'<path d="M{cx-4.9} 6.4 A4.9 4.9 0 0 1 {cx+4.9} 6.4 Q{cx+1} 3.6 {cx-4.9} 6.4 Z" fill="{hair[i]}"/>')
        out.append(f'<circle cx="{cx-1.6}" cy="7.4" r=".55" fill="#2b2a2b"/><circle cx="{cx+1.6}" cy="7.4" r=".55" fill="#2b2a2b"/>'
                   f'<path d="M{cx-1.5} 9.3 Q{cx} 10.6 {cx+1.5} 9.3" stroke="#2b2a2b" stroke-width=".5" fill="none" stroke-linecap="round"/>')
    return ''.join(out)

common = {
    '/*FONTS*/': open(p('..', 'anzeigen', 'assets', 'fonts.css')).read(),
    '/*LOGO*/': b64(p('..', 'anzeigen', 'assets', 'chipa-logo.png')),
    '/*COVER*/': 'data:image/png;base64,' + b64(p('assets', 'cover.png')),
    '/*KIDS*/': kids(),
}
for src, out in VARIANTS.items():
    s = open(p(src)).read()
    s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(p('assets', m.group(1))), s)
    for k, v in common.items():
        s = s.replace(k, v)
    open(p(out), 'w').write(s)
    print('built', out)
