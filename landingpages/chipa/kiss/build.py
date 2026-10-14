#!/usr/bin/env python3
"""Build the KISS one-pager variants from _onepager-*.src.html.

1 Markiert  – cream paper, centred cover, hand-drawn marker callouts
2 Puzzle    – cover palette, big type, facts as interlocking puzzle pieces
3 Schulhof  – flat illustration: bunting with facts, children holding up the book

Embeds fonts (assets/*.ttf + ../anzeigen/assets/fonts.css), the chi.pa logo, the
book cover (assets/cover.png) and generated SVG artwork. All coordinates in mm.
"""
import base64, math, os, re
here = os.path.dirname(os.path.abspath(__file__))
p = lambda *a: os.path.join(here, *a)
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()

VARIANTS = {
    '_onepager-1-markiert.src.html': 'KISS_OnePager_1_Markiert.html',
    '_onepager-2-puzzle.src.html': 'KISS_OnePager_2_Puzzle.html',
    '_onepager-3-schulhof.src.html': 'KISS_OnePager_3_Schulhof.html',
}

f2 = lambda v: f'{v:.2f}'.rstrip('0').rstrip('.')
pt = lambda x, y: f'{f2(x)} {f2(y)}'


# ---------------------------------------------------------------- puzzle
TAB = [('L', [(0.34, 0)]),
       ('C', [(0.40, 0), (0.42, -0.04), (0.39, -0.09)]),
       ('C', [(0.35, -0.16), (0.40, -0.24), (0.50, -0.24)]),
       ('C', [(0.60, -0.24), (0.65, -0.16), (0.61, -0.09)]),
       ('C', [(0.58, -0.04), (0.60, 0), (0.66, 0)]),
       ('L', [(1, 0)])]


def edge(p0, p1, s, lref, pos=0.5):
    """Path commands from p0 to p1. s=+1 knob outward (piece traversed clockwise), -1 inward, 0 flat."""
    if s == 0:
        return f'L{pt(*p1)}'
    L = math.dist(p0, p1)
    dx, dy = (p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L
    nx, ny = dy, -dx
    out = []
    for cmd, pts in TAB:
        q = []
        for x, y in pts:
            u = L if x == 1 else pos * L + (x - 0.5) * lref
            v = s * (-y) * lref
            q.append(pt(p0[0] + u * dx + v * nx, p0[1] + u * dy + v * ny))
        out.append(cmd + ' '.join(q))
    return ' '.join(out)


def piece(x0, y0, x1, y1, top=0, right=0, bottom=0, left=0, lref=34, pos=(0.5, 0.5, 0.5, 0.5)):
    return (f'M{pt(x0, y0)} ' + edge((x0, y0), (x1, y0), top, lref, pos[0]) + ' '
            + edge((x1, y0), (x1, y1), right, lref, pos[1]) + ' '
            + edge((x1, y1), (x0, y1), bottom, lref, pos[2]) + ' '
            + edge((x0, y1), (x0, y0), left, lref, pos[3]) + ' Z')


def puzzle_grid():
    X, Y, W, H = 92, 103, 103, 93
    w, h = W / 2, H / 2
    hcut = [+1, -1]      # knob direction across the horizontal cut, per column (+1 = down)
    vcut = [-1, +1]      # knob direction across the vertical cut, per row (+1 = right)
    fills = ['#8a3fb0', '#d93d8c', '#efe3f7', '#2b2a2b']
    out = []
    for r in range(2):
        for c in range(2):
            x0, y0 = X + c * w, Y + r * h
            top = -hcut[c] if r == 1 else 0
            bottom = hcut[c] if r == 0 else 0
            left = -vcut[r] if c == 1 else 0
            right = vcut[r] if c == 0 else 0
            d = piece(x0, y0, x0 + w, y0 + h, top, right, bottom, left, lref=30)
            out.append(f'<path d="{d}" fill="{fills[r * 2 + c]}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>')
    return ''.join(out)


def price_piece():
    d = piece(15, 218, 195, 268, top=+1, lref=30, pos=((143.5 - 15) / 180, .5, .5, .5))
    return f'<path d="{d}" fill="#2b2a2b"/>'


def loose_piece():
    big = piece(0, 0, 26, 26, top=+1, right=+1, bottom=-1, left=-1, lref=17)
    small = piece(0, 0, 15, 15, top=0, right=+1, bottom=+1, left=-1, lref=10)
    return (f'<g transform="translate(152 44) rotate(14 13 13)"><path d="{big}" fill="#8a3fb0"/></g>'
            f'<g transform="translate(182 54) rotate(-22 7.5 7.5)"><path d="{small}" fill="#efe3f7"/></g>')


# ---------------------------------------------------------------- kids
def kid(x, feet, scale, shirt, pants, skin, hair, style, hands, dress=False):
    top = feet - 60 * scale
    loc = lambda hx, hy: ((hx - x) / scale, (hy - top) / scale)
    g = [f'<g transform="translate({f2(x)} {f2(top)}) scale({scale})">']
    # legs + shoes
    if dress:
        g.append(f'<rect x="-6.2" y="42" width="4.6" height="14.5" rx="2" fill="{skin}"/><rect x="1.6" y="42" width="4.6" height="14.5" rx="2" fill="{skin}"/>')
    else:
        g.append(f'<rect x="-7.6" y="38" width="6.8" height="18.5" rx="2.2" fill="{pants}"/><rect x=".8" y="38" width="6.8" height="18.5" rx="2.2" fill="{pants}"/>')
    g.append('<ellipse cx="-4.6" cy="57.2" rx="5" ry="2.6" fill="#2b2a2b"/><ellipse cx="4.6" cy="57.2" rx="5" ry="2.6" fill="#2b2a2b"/>')
    # arms (drawn before torso so the shoulder joint is hidden)
    for sx, (hx, hy) in zip((-7, 7), (loc(*hands[0]), loc(*hands[1]))):
        mx, my = sx + (hx - sx) * .38, 23 + (hy - 23) * .38
        g.append(f'<path d="M{pt(sx, 23)} L{pt(hx, hy)}" stroke="{skin}" stroke-width="4.4" stroke-linecap="round"/>'
                 f'<path d="M{pt(sx, 23)} L{pt(mx, my)}" stroke="{shirt}" stroke-width="6" stroke-linecap="round"/>'
                 f'<circle cx="{f2(hx)}" cy="{f2(hy)}" r="2.6" fill="{skin}"/>')
    # torso / dress
    if dress:
        g.append(f'<path d="M-8 19.5 Q0 17.5 8 19.5 L13 46 Q0 48.5 -13 46 Z" fill="{shirt}"/>')
    else:
        g.append(f'<rect x="-9.5" y="18.5" width="19" height="23.5" rx="5.5" fill="{shirt}"/>')
    # head
    g.append(f'<circle cx="0" cy="10" r="8.6" fill="{skin}"/>')
    cap = '<path d="M-8.9 10.4 A8.9 8.9 0 0 1 8.9 10.4 Q4.5 4.6 -.6 6.4 Q-5.4 7.4 -8.9 10.4 Z" fill="{h}"/>'.replace('{h}', hair)
    if style == 'short':
        g.append(cap)
    elif style == 'pony':
        g.append(f'<ellipse cx="9.6" cy="7" rx="3.4" ry="5.6" transform="rotate(28 9.6 7)" fill="{hair}"/>' + cap)
    elif style == 'curly':
        g.append(''.join(f'<circle cx="{a}" cy="{b}" r="3.4" fill="{hair}"/>' for a, b in
                         [(-7.4, 8), (-5.6, 3.6), (-1.8, 1.4), (2.4, 1.4), (6, 3.6), (7.6, 8)]) + cap)
    elif style == 'long':
        g.append(f'<rect x="-10.2" y="7" width="4" height="17" rx="2" fill="{hair}"/><rect x="6.2" y="7" width="4" height="17" rx="2" fill="{hair}"/>' + cap)
    elif style == 'bun':
        g.append(f'<circle cx="0" cy="0" r="3.8" fill="{hair}"/>' + cap)
    # face
    g.append('<circle cx="-3.1" cy="11.2" r="1.05" fill="#2b2a2b"/><circle cx="3.1" cy="11.2" r="1.05" fill="#2b2a2b"/>'
             '<path d="M-2.8 14.2 Q0 16.9 2.8 14.2" stroke="#2b2a2b" stroke-width=".85" fill="none" stroke-linecap="round"/>'
             '<circle cx="-5.4" cy="13.8" r="1.5" fill="#ff7f7f" opacity=".45"/><circle cx="5.4" cy="13.8" r="1.5" fill="#ff7f7f" opacity=".45"/>')
    g.append('</g>')
    return ''.join(g)


def hill_y(x):
    t = x / 210
    return 238 - 24 * t * (1 - t)


def kids_scene():
    out = []
    # far left: talks (speech bubble above)
    x = 30; f = hill_y(x) + 1.5
    out.append(kid(x, f, .92, '#76b82a', '#1f5f8f', '#f2c9a0', '#3b2a20', 'short', [(x - 13, f - 30), (x + 9, f - 63)]))
    # the two holding the book (cover bottom corners at y ~ 201)
    x = 60; f = hill_y(x) + 1.5
    out.append(kid(x, f, 1, '#e3061d', '#2b2a2b', '#8d5a3b', '#1d1d1d', 'curly', [(x - 12, f - 66), (x + 15, f - 48)]))
    x = 150; f = hill_y(x) + 1.5
    out.append(kid(x, f, 1, '#ffcc00', '#5b3fa0', '#f5d2b8', '#c8762d', 'pony', [(x - 15, f - 48), (x + 12, f - 66)], dress=True))
    # far right: waves
    x = 184; f = hill_y(x) + 1.5
    out.append(kid(x, f, .9, '#1f86c8', '#2b2a2b', '#c98e5f', '#2a1c14', 'bun', [(x - 12, f - 28), (x + 14, f - 58)], dress=True))
    return ''.join(out)


def bunting():
    sag = lambda x: 5 + 11 * (1 - ((x - 105) / 105) ** 2)
    out = [f'<path d="M-2 {f2(sag(-2))} Q105 {f2(2 * sag(105) - 5)} 212 {f2(sag(212))}" stroke="#2b2a2b" stroke-width=".6" fill="none"/>']
    flags = [(30, '#1f86c8', '1–10', ['Klassen-', 'stufen']),
             (80, '#e3061d', '6', ['Module']),
             (130, '#76b82a', '50+', ['Übungen']),
             (180, '#8a3fb0', 'inkl.', ['Kopier-', 'vorlagen'])]
    small = [(4, '#ffcc00'), (206, '#ffcc00')]
    for x, c in small:
        y = sag(x)
        out.append(f'<path d="M{pt(x - 6, y)} L{pt(x + 6, y)} L{pt(x, y + 13)} Z" fill="{c}"/>')
    W, H = 44, 48
    for x, c, n, label in flags:
        y = sag(x)
        slope = math.degrees(math.atan(-22 * (x - 105) / 105 ** 2))
        g = [f'<g transform="translate({f2(x)} {f2(y)}) rotate({f2(slope)})">',
             f'<path d="M{-W / 2} 0 L{W / 2} 0 L0 {H} Z" fill="{c}"/>',
             f'<text x="0" y="14.5" text-anchor="middle" font-family="Fredoka" font-weight="600" font-size="11.5" fill="#fff">{n}</text>']
        for i, l in enumerate(label):
            g.append(f'<text x="0" y="{f2(20.8 + i * 4)}" text-anchor="middle" font-family="Fredoka" font-weight="500" font-size="3.9" fill="#fff">{l}</text>')
        g.append('</g>')
        out.append(''.join(g))
    return ''.join(out)


# ---------------------------------------------------------------- build
common = {
    '/*FONTS*/': open(p('..', 'anzeigen', 'assets', 'fonts.css')).read(),
    '/*LOGO*/': b64(p('..', 'anzeigen', 'assets', 'chipa-logo.png')),
    '/*COVER*/': 'data:image/png;base64,' + b64(p('assets', 'cover.png')),
    '/*PUZZLE2x2*/': puzzle_grid(),
    '/*PRICEPIECE*/': price_piece(),
    '/*LOOSEPIECE*/': loose_piece(),
    '/*KIDS3*/': kids_scene(),
    '/*BUNTING*/': bunting(),
}
for src, out in VARIANTS.items():
    s = open(p(src)).read()
    s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(p('assets', m.group(1))), s)
    for k, v in common.items():
        s = s.replace(k, v)
    open(p(out), 'w').write(s)
    print('built', out)
