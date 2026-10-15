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
    '_onepager-A-puzzle2.src.html': 'KISS_OnePager_A_Puzzle.html',
    '_onepager-B-poster.src.html': 'KISS_OnePager_B_Poster.html',
    '_onepager-C-editorial.src.html': 'KISS_OnePager_C_Editorial.html',
    '_onepager-D-launch.src.html': 'KISS_OnePager_D_Launch.html',
    '_onepager-E-tape.src.html': 'KISS_OnePager_E_Tape.html',
    '_onepager-F-bento.src.html': 'KISS_OnePager_F_Bento.html',
    '_onepager-G-puzzle3.src.html': 'KISS_OnePager_G_Puzzle.html',
    '_onepager-H-laedt.src.html': 'KISS_OnePager_H_Laedt.html',
    '_onepager-I-kalender.src.html': 'KISS_OnePager_I_Kalender.html',
    '_onepager-J-magazin.src.html': 'KISS_OnePager_J_Magazin.html',
    '_onepager-K-ticket-quer.src.html': 'KISS_OnePager_K_Ticket_quer.html',
    '_onepager-L-swiss.src.html': 'KISS_OnePager_L_Swiss.html',
    '_onepager-M-mega.src.html': 'KISS_OnePager_M_Mega.html',
    '_onepager-N-produkt.src.html': 'KISS_OnePager_N_Produkt.html',
    '_onepager-O-riso.src.html': 'KISS_OnePager_O_Riso.html',
    '_onepager-P-wall.src.html': 'KISS_OnePager_P_Wall.html',
    '_onepager-Q-diagonal.src.html': 'KISS_OnePager_Q_Diagonal.html',
    '_onepager-R-riso2.src.html': 'KISS_OnePager_R_Riso2.html',
    '_onepager-S-wall2.src.html': 'KISS_OnePager_S_Wall2.html',
    '_onepager-T-spread-quer.src.html': 'KISS_OnePager_T_Spread_quer.html',
    '_onepager-U-riso-quer.src.html': 'KISS_OnePager_U_Riso_quer.html',
    '_onepager-V-zahlen.src.html': 'KISS_OnePager_V_Zahlen.html',
    '_onepager-W-puzzle-full.src.html': 'KISS_OnePager_W_Puzzle.html',
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


def puzzle_grid(X=92, Y=103, W=103, H=93, lref=30, stroke=1.4,
                fills=('#8a3fb0', '#d93d8c', '#efe3f7', '#2b2a2b')):
    w, h = W / 2, H / 2
    hcut = [+1, -1]      # knob direction across the horizontal cut, per column (+1 = down)
    vcut = [-1, +1]      # knob direction across the vertical cut, per row (+1 = right)
    out = []
    for r in range(2):
        for c in range(2):
            x0, y0 = X + c * w, Y + r * h
            top = -hcut[c] if r == 1 else 0
            bottom = hcut[c] if r == 0 else 0
            left = -vcut[r] if c == 1 else 0
            right = vcut[r] if c == 0 else 0
            d = piece(x0, y0, x0 + w, y0 + h, top, right, bottom, left, lref=lref)
            out.append(f'<path d="{d}" fill="{fills[r * 2 + c]}" stroke="#fff" stroke-width="{stroke}" stroke-linejoin="round"/>')
    return ''.join(out)


def puzzle_rc(X, Y, W, H, rows, cols, fills, missing=None, lref=24, stroke=1.6,
              hcut=None, vcut=None, missing_stroke='#d93d8c'):
    """rows x cols jigsaw; fills[r][c]; `missing` (r, c) is drawn as a dashed outline only."""
    w, h = W / cols, H / rows
    # knob directions: +1 = down / right
    hcut = hcut or [[(+1 if (r + c) % 2 == 0 else -1) for c in range(cols)] for r in range(rows - 1)]
    vcut = vcut or [[(-1 if (r + c) % 2 == 0 else +1) for c in range(cols - 1)] for r in range(rows)]
    out, ghost = [], ''
    for r in range(rows):
        for c in range(cols):
            x0, y0 = X + c * w, Y + r * h
            top = -hcut[r - 1][c] if r > 0 else 0
            bottom = hcut[r][c] if r < rows - 1 else 0
            left = -vcut[r][c - 1] if c > 0 else 0
            right = vcut[r][c] if c < cols - 1 else 0
            d = piece(x0, y0, x0 + w, y0 + h, top, right, bottom, left, lref=lref)
            if missing == (r, c):
                ghost = (f'<path d="{d}" fill="#fff" stroke="{missing_stroke}" stroke-width="0.7" '
                         f'stroke-dasharray="2.4 1.6" stroke-linejoin="round"/>')
            else:
                out.append(f'<path d="{d}" fill="{fills[r][c]}" stroke="#fff" stroke-width="{stroke}" stroke-linejoin="round"/>')
    return ''.join(out) + ghost


def band_path(h=110, cuts=(210, 165, 120, 75, 30, 0), signs=(+1, -1, +1, -1, 0), lref=20, fill='#232223'):
    """Dark top band whose bottom edge is a jigsaw cut (knobs into / out of the white area)."""
    d = f'M0 0 H210 V{h} '
    for (a, b_), s in zip(zip(cuts, cuts[1:]), signs):
        d += edge((a, h), (b_, h), s, lref) + ' '
    return f'<path d="{d}L0 0 Z" fill="{fill}"/>'


def puzzle_float(X=15, Y=196, W=180, H=86, rows=2, cols=4, fills=None, hole=(0, 3), lref=20,
                 dx=-3, dy=-14, rot=7, labels=('IHR EXEMPLAR', 'bald erhältlich')):
    """Even jigsaw with one hole; the missing piece (exact same shape) hovers above the hole."""
    w, h = W / cols, H / rows
    hcut = [[(+1 if (r + c) % 2 == 0 else -1) for c in range(cols)] for r in range(rows - 1)]
    vcut = [[(-1 if (r + c) % 2 == 0 else +1) for c in range(cols - 1)] for r in range(rows)]
    out, hole_d = [], None
    for r in range(rows):
        for c in range(cols):
            x0, y0 = X + c * w, Y + r * h
            d = piece(x0, y0, x0 + w, y0 + h,
                      -hcut[r - 1][c] if r > 0 else 0, vcut[r][c] if c < cols - 1 else 0,
                      hcut[r][c] if r < rows - 1 else 0, -vcut[r][c - 1] if c > 0 else 0, lref=lref)
            if (r, c) == hole:
                hole_d = d
            else:
                out.append(f'<path d="{d}" fill="{fills[r][c]}" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>')
    cx, cy = X + (hole[1] + .5) * w, Y + (hole[0] + .5) * h
    out.append(f'<path d="{hole_d}" fill="#fff" stroke="#d93d8c" stroke-width=".7" stroke-dasharray="2.4 1.6" stroke-linejoin="round"/>')
    out.append(
        '<defs><linearGradient id="floatgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a3fb0"/>'
        '<stop offset="1" stop-color="#ef5a8c"/></linearGradient>'
        '<filter id="floatsh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.2" stdDeviation="1.6" flood-color="#1a0a20" flood-opacity=".42"/></filter></defs>'
        f'<g transform="translate({dx} {dy}) rotate({rot} {cx} {cy})" filter="url(#floatsh)">'
        f'<path d="{hole_d}" fill="url(#floatgrad)" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>'
        f'<text x="{cx}" y="{cy - 1}" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="6.6" fill="#fff">{labels[0]}</text>'
        f'<text x="{cx}" y="{cy + 5}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="4.6" fill="#ffe0ef">{labels[1]}</text></g>')
    return ''.join(out)


def _mix(c1, c2, t):
    a = [int(c1[i:i + 2], 16) for i in (1, 3, 5)]
    z = [int(c2[i:i + 2], 16) for i in (1, 3, 5)]
    return '#' + ''.join(f'{round(x + (y - x) * t):02x}' for x, y in zip(a, z))


def puzzle_page(W=210, H=297, rows=6, cols=4, lref=16, special=None, missing=(4, 3),
                float_dx=-9, float_dy=-17, float_rot=-9, labels=('IHR EXEMPLAR', 'bald erhältlich'), merged=None):
    """Full-bleed jigsaw: every piece the same size, all edges interlock. Gradient fills
    violet -> magenta, `special` {(r, c): fill} overrides, `missing` is a hole with a floating piece."""
    special = special or {}
    w, h = W / cols, H / rows
    hcut = [[(+1 if (r + c) % 2 == 0 else -1) for c in range(cols)] for r in range(rows - 1)]
    vcut = [[(-1 if (r + c) % 2 == 0 else +1) for c in range(cols - 1)] for r in range(rows)]
    stops = ['#3b1c7a', '#6a2fa6', '#a63fa8', '#d93d8c']
    out, hole = [], None
    merged = merged or {}          # {(row, c0, c1): fill} -> one wide piece spanning columns c0..c1
    covered = {(r, c) for (r, c0, c1) in merged for c in range(c0, c1 + 1)}
    for (r, c0, c1), fill in merged.items():
        y0, y1 = r * h, (r + 1) * h
        d = f'M{pt(c0 * w, y0)} '
        for c in range(c0, c1 + 1):
            d += edge((c * w, y0), ((c + 1) * w, y0), -hcut[r - 1][c] if r > 0 else 0, lref) + ' '
        d += edge(((c1 + 1) * w, y0), ((c1 + 1) * w, y1), vcut[r][c1] if c1 < cols - 1 else 0, lref) + ' '
        for c in range(c1, c0 - 1, -1):
            d += edge(((c + 1) * w, y1), (c * w, y1), hcut[r][c] if r < rows - 1 else 0, lref) + ' '
        d += edge((c0 * w, y1), (c0 * w, y0), -vcut[r][c0 - 1] if c0 > 0 else 0, lref) + ' Z'
        out.append(f'<path d="{d}" fill="{fill}" stroke="#ffffff" stroke-opacity=".28" stroke-width=".5" stroke-linejoin="round"/>')
    for r in range(rows):
        for c in range(cols):
            if (r, c) in covered:
                continue
            x0, y0 = c * w, r * h
            d = piece(x0, y0, x0 + w, y0 + h,
                      -hcut[r - 1][c] if r > 0 else 0, vcut[r][c] if c < cols - 1 else 0,
                      hcut[r][c] if r < rows - 1 else 0, -vcut[r][c - 1] if c > 0 else 0, lref=lref)
            if (r, c) == missing:
                hole = d
                continue
            t = min(1, max(0, .62 * r / (rows - 1) + .38 * c / (cols - 1)))
            seg = min(len(stops) - 2, int(t * (len(stops) - 1)))
            col = _mix(stops[seg], stops[seg + 1], t * (len(stops) - 1) - seg)
            col = _mix(col, '#ffffff' if (r + c) % 2 else '#000000', .05)
            fill = special.get((r, c), col)
            if fill.startswith('lighten:'):
                fill = _mix(col, '#ffffff', float(fill.split(':')[1]))
            out.append(f'<path d="{d}" fill="{fill}" stroke="#ffffff" stroke-opacity=".28" stroke-width=".5" stroke-linejoin="round"/>')
    if hole:
        r, c = missing
        cx, cy = (c + .5) * w, (r + .5) * h
        out.append(f'<path d="{hole}" fill="#1a0b2c"/>')
        out.append(f'<path d="{hole}" fill="none" stroke="#ff8cc0" stroke-width=".7" stroke-dasharray="2.4 1.6" stroke-linejoin="round"/>')
        out.append(
            '<defs><linearGradient id="pfg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff7fb6"/><stop offset="1" stop-color="#e2448f"/></linearGradient>'
            '<filter id="pfs" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="2.4" stdDeviation="1.8" flood-color="#14051f" flood-opacity=".55"/></filter></defs>'
            f'<g transform="translate({float_dx} {float_dy}) rotate({float_rot} {cx} {cy})" filter="url(#pfs)">'
            f'<path d="{hole}" fill="url(#pfg)" stroke="#fff" stroke-width="1" stroke-linejoin="round"/>'
            f'<text x="{cx}" y="{cy - .5}" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="7.4" fill="#fff">{labels[0]}</text>'
            f'<text x="{cx}" y="{cy + 6}" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="5" fill="#fff">{labels[1]}</text></g>')
    return ''.join(out)


def price_piece(x0=15, y0=218, x1=195, y1=268, knob_x=143.5, fill='#2b2a2b'):
    d = piece(x0, y0, x1, y1, top=+1, lref=30, pos=((knob_x - x0) / (x1 - x0), .5, .5, .5))
    return f'<path d="{d}" fill="{fill}"/>'


def gift_piece(x, y, w=80, h=26, rot=-4, fill='#8a3fb0'):
    d = piece(0, 0, w, h, top=-1, right=0, bottom=+1, left=+1, lref=19, pos=(.7, .5, .32, .5))
    return f'<g transform="translate({x} {y}) rotate({rot})"><path d="{d}" fill="{fill}"/></g>'


def loose_piece():
    """Purple 'enclosed piece' carrying the gift line + a small lilac piece."""
    big = piece(0, 0, 88, 27, top=-1, right=0, bottom=+1, left=+1, lref=21, pos=(.66, .5, .3, .5))
    small = piece(0, 0, 15, 15, top=0, right=+1, bottom=+1, left=-1, lref=10)
    return (f'<g transform="translate(106 49) rotate(-3)"><path d="{big}" fill="#8a3fb0"/></g>'
            f'<g transform="translate(150 24) rotate(-18 7.5 7.5)"><path d="{small}" fill="#efe3f7"/></g>')


def badge(r, ring, uid, center='', size=None, fill=('#8a3fb0', '#ef5a8c'), text_fill='#fff'):
    """Round sticker with running text around the edge (SVG, viewBox in mm around 0,0)."""
    size = size or r * 0.2
    rt = r * 0.71
    circ = 2 * math.pi * rt
    ring_path = f'M0 {-rt:.3f} a{rt:.3f} {rt:.3f} 0 1 1 0 {2 * rt:.3f} a{rt:.3f} {rt:.3f} 0 1 1 0 {-2 * rt:.3f}'
    if isinstance(fill, tuple):
        defs = (f'<defs><linearGradient id="bg{uid}" x1="0" y1="0" x2="1" y2="1">'
                f'<stop offset="0" stop-color="{fill[0]}"/><stop offset="1" stop-color="{fill[1]}"/></linearGradient></defs>')
        paint = f'url(#bg{uid})'
    else:
        defs, paint = '', fill
    return (f'<svg viewBox="{-r} {-r} {2 * r} {2 * r}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;overflow:visible">{defs}'
            f'<circle r="{r}" fill="{paint}"/>'
            f'<circle r="{r * 0.6:.3f}" fill="none" stroke="{text_fill}" stroke-opacity=".55" stroke-width="{r * 0.015:.3f}"/>'
            f'<path id="ring{uid}" d="{ring_path}" fill="none"/>'
            f'<text font-family="Barlow Condensed" font-weight="800" font-size="{size:.3f}" fill="{text_fill}" letter-spacing="{size * 0.08:.3f}">'
            f'<textPath href="#ring{uid}" textLength="{circ * 0.985:.3f}" lengthAdjust="spacing">{ring}</textPath></text>'
            f'{center}</svg>')


def tape(yc, angle, h, fill, text, text_fill='#fff', size=None, reps=14, shift=0):
    """Diagonal barrier tape across the page with running text (page viewBox in mm)."""
    size = size or h * 0.58
    run = (text + '   ') * reps
    return (f'<g transform="rotate({angle} 105 {yc})">'
            f'<rect x="-120" y="{yc - h / 2}" width="450" height="{h}" fill="{fill}"/>'
            f'<text x="{-120 + shift}" y="{yc + size * 0.36}" font-family="Barlow Condensed" font-weight="800" '
            f'font-size="{size}" letter-spacing="{size * 0.12}" fill="{text_fill}">{run}</text></g>')


def tape_words(yc, angle, h, fill, left, right, size=8.6, text_fill='#fff', gap=3.5, cover=(58, 150)):
    """Tape with whole words placed left and right of the cover (left text ends at the cover edge)."""
    ls = size * 0.1
    t = (f'font-family="Barlow Condensed" font-weight="800" font-size="{size}" letter-spacing="{ls}" fill="{text_fill}"')
    y = yc + size * 0.36
    return (f'<g transform="rotate({angle} 105 {yc})">'
            f'<rect x="-120" y="{yc - h / 2}" width="450" height="{h}" fill="{fill}"/>'
            f'<text x="{cover[0] - gap}" y="{y}" text-anchor="end" {t}>{left}</text>'
            f'<text x="{cover[1] + gap}" y="{y}" {t}>{right}</text></g>')


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
def main():
    common = {
        '/*FONTS*/': open(p('..', 'anzeigen', 'assets', 'fonts.css')).read(),
        '/*LOGO*/': b64(p('..', 'anzeigen', 'assets', 'chipa-logo.png')),
        '/*COVER*/': 'data:image/png;base64,' + b64(p('assets', 'cover.png')),
        '/*NOISE*/': 'data:image/png;base64,' + b64(p('assets', 'noise.png')),
        '/*COVER_HI*/': 'data:image/png;base64,' + b64(p('assets', 'cover_up.png')),
        '/*PUZZLE2x2*/': puzzle_grid(),
        '/*PRICEPIECE*/': price_piece(),
        '/*LOOSEPIECE*/': loose_piece(),
        '/*KIDS3*/': kids_scene(),
        '/*BUNTING*/': bunting(),
        '/*QRCODE*/': open(p('qr', 'qr_inline.svg')).read(),
        '/*PUZZLE_A*/': puzzle_rc(90, 130, 105, 100, 3, 2,
                                  [['#8a3fb0', '#d93d8c'], ['#efe3f7', '#232223'], ['#a63fa8', None]],
                                  missing=(2, 1), lref=22, stroke=1.6,
                                  hcut=[[+1, -1], [-1, -1]], vcut=[[-1], [+1], [-1]]),
        '/*PRICE_A*/': price_piece(15, 238, 195, 282, knob_x=168.75),
        '/*GIFT_A*/': gift_piece(109, 104, w=88),
        '/*BADGE_A*/': badge(15, 'BALD ERHÄLTLICH • BALD ERHÄLTLICH • ', 'a', size=3.3, center=(
            '<text y="1.2" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="7.2" fill="#fff">NEU</text>'
            '<text y="5.6" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="2.9" letter-spacing=".35" fill="#fff">2. AUFLAGE</text>')),
        '/*BADGE_D*/': badge(21, 'JETZT VORBESTELLEN • JETZT VORBESTELLEN • ', 'd', size=3.7, center=(
            '<text y="1.6" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="8.4" fill="#fff">34,99 €</text>'
            '<text y="5.9" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="2.6" letter-spacing=".3" fill="#fff">SUBSKRIPTION</text>')),
        '/*BADGE_E*/': badge(17, 'JETZT VORBESTELLEN • JETZT VORBESTELLEN • ', 'e', size=3.2, fill='#232223', center=(
            '<text y="1.3" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="7" fill="#fff">34,99 €</text>'
            '<text y="5.3" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="2.3" letter-spacing=".3" fill="#ff86bd">SUBSKRIPTION</text>')),
        '/*BADGE_F*/': badge(14, 'BALD ERHÄLTLICH • BALD ERHÄLTLICH • ', 'f', size=2.7, fill='#232223', center=(
            '<text y="1" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="6" fill="#fff">NEU</text>'
            '<text y="4.6" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="2.2" letter-spacing=".3" fill="#ff86bd">2. AUFLAGE</text>')),
        '/*CHECK*/': ('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#d93d8c"/>'
                      '<path d="M6.5 12.5l3.6 3.6 7.4-8" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'),
        '/*BAND_G*/': band_path(),
        '/*GRID_G*/': puzzle_float(fills=[['#8a3fb0', '#efe3f7', '#232223', None],
                                          ['#d93d8c', '#232223', '#8a3fb0', '#efe3f7']]),
        '/*BADGE_G*/': badge(18, 'BALD ERHÄLTLICH • BALD ERHÄLTLICH • ', 'g', size=3.4, center=(
            '<text y="1.2" text-anchor="middle" font-family="Barlow Condensed" font-weight="800" font-size="7.6" fill="#fff">NEU</text>'
            '<text y="5.8" text-anchor="middle" font-family="Barlow Condensed" font-weight="700" font-size="3" letter-spacing=".35" fill="#fff">2. AUFLAGE</text>')),
        '/*DECO_G*/': (f'<g transform="translate(150 84) rotate(-16 8 8)"><path d="{piece(0, 0, 16, 16, top=+1, right=-1, bottom=+1, left=0, lref=11)}" fill="#8a3fb0"/></g>'
                       f'<g transform="translate(136 66) rotate(22 5 5)"><path d="{piece(0, 0, 10, 10, top=0, right=+1, bottom=-1, left=+1, lref=7)}" fill="#efe3f7" fill-opacity=".9"/></g>'),
        '/*PUZZLE_FULL*/': puzzle_page(special={(2, 0): 'lighten:.22', (2, 1): 'lighten:.12', (3, 0): 'lighten:.12', (3, 1): 'lighten:.22'},
                                       merged={(4, 0, 2): '#2a1046', (5, 0, 2): '#a8286f'}),
        '/*TAPES_E*/': (tape_words(152, 10, 17, 'url(#tapegrad)', 'VORBESTELLEN •', '• CHIPA.DE/KISS', size=7.6, gap=2.5, cover=(60, 150)) +
                        tape_words(152, -12, 17, '#232223', 'BALD DA •', '• 2. AUFLAGE', size=7.6, gap=2.5, cover=(60, 152))),
    }
    for src, out in VARIANTS.items():
        s = open(p(src)).read()
        s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(p('assets', m.group(1))), s)
        for k, v in common.items():
            s = s.replace(k, v)
        open(p(out), 'w').write(s)
        print('built', out)


if __name__ == '__main__':
    main()
