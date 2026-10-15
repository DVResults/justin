#!/usr/bin/env python3
"""Generate the print QR code for https://chipa.de/kiss (SVG + PNG, several colours) and verify it decodes.
Needs: pip install qrcode pillow opencv-python-headless"""
import os
import cv2, numpy as np, qrcode
from PIL import Image

URL = 'https://chipa.de/kiss'
here = os.path.dirname(os.path.abspath(__file__))
COLOURS = {'schwarz': '#000000', 'anthrazit': '#2b2a2b', 'lila': '#6c3aa8'}

qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, border=4)
qr.add_data(URL)
qr.make(fit=True)
m = qr.get_matrix()                      # includes the 4-module quiet zone
n = len(m)
# one rectangle per horizontal run of dark modules
runs = []
for y, row in enumerate(m):
    x = 0
    while x < n:
        if row[x]:
            s = x
            while x < n and row[x]:
                x += 1
            runs.append(f'M{s} {y}h{x - s}v1h-{x - s}z')
        else:
            x += 1
path = ''.join(runs)

def svg(colour):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n} {n}" shape-rendering="crispEdges">'
            f'<rect width="{n}" height="{n}" fill="#fff"/><path fill="{colour}" d="{path}"/></svg>')

for name, colour in COLOURS.items():
    open(os.path.join(here, f'KISS_QR_chipa-de-kiss_{name}.svg'), 'w').write(svg(colour))
    scale = 2000 // n
    img = Image.new('RGB', (n, n), 'white')
    rgb = tuple(int(colour[i:i + 2], 16) for i in (1, 3, 5))
    px = img.load()
    for y in range(n):
        for x in range(n):
            if m[y][x]:
                px[x, y] = rgb
    big = img.resize((n * scale, n * scale), Image.NEAREST)
    png = os.path.join(here, f'KISS_QR_chipa-de-kiss_{name}.png')
    big.save(png, dpi=(600, 600))
    data, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(np.array(big), cv2.COLOR_RGB2BGR))
    # also test a small, blurred version (like a phone photo of a 25 mm print)
    small = cv2.GaussianBlur(cv2.resize(np.array(big), (220, 220), interpolation=cv2.INTER_AREA), (3, 3), 0)
    data2, _, _ = cv2.QRCodeDetector().detectAndDecode(cv2.cvtColor(small, cv2.COLOR_RGB2BGR))
    print(f'{name}: {n}x{n} modules (version {qr.version}), decode={data!r}, small={data2!r}')
    assert data == URL and data2 == URL

# inline snippet for the one-pager (anthrazit, no background rect)
open(os.path.join(here, 'qr_inline.svg'), 'w').write(
    f'<svg viewBox="4 4 {n - 8} {n - 8}" shape-rendering="crispEdges"><path fill="#2b2a2b" d="{path}"/></svg>')
