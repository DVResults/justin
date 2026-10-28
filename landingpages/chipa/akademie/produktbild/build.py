#!/usr/bin/env python3
"""Inline fonts, logo and cover into the product image HTML."""
import base64, os, re
here = os.path.dirname(os.path.abspath(__file__))
kiss = os.path.join(here, '..', '..', 'kiss')
b64 = lambda f: base64.b64encode(open(f, 'rb').read()).decode()
s = open(os.path.join(here, '_kiss_trainer.src.html')).read()
s = s.replace('/*FONTS*/', open(os.path.join(here, '..', '..', 'anzeigen', 'assets', 'fonts.css')).read())
s = s.replace('/*LOGO*/', b64(os.path.join(here, '..', '..', 'anzeigen', 'assets', 'chipa-logo.png')))
s = s.replace('/*COVER_HI*/', 'data:image/png;base64,' + b64(os.path.join(kiss, 'assets', 'cover_up.png')))
s = re.sub(r'/\*FONT:([^*]+)\*/', lambda m: b64(os.path.join(kiss, 'assets', m.group(1))), s)
open(os.path.join(here, 'KISS_Trainer_Ausbildung_Produktbild.html'), 'w').write(s)
print('built')
