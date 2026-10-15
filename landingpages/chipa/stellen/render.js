// Render every *.html in this folder to a 2160 x 2700 PNG (1080 x 1350 @2x) and report overflow.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
  for (const f of fs.readdirSync(__dirname).filter(f => f.endsWith('.html')).sort()) {
    await p.goto('file://' + path.join(__dirname, f));
    await p.evaluate(() => document.fonts.ready);
    const over = await p.evaluate(() => [...document.querySelectorAll('.a')].filter(e => { const r = e.getBoundingClientRect(); return r.bottom > 1352 && !e.classList.contains('arc2') && !e.classList.contains('blob2'); }).map(e => e.className));
    await p.screenshot({ path: path.join(__dirname, f.replace('.html', '.png')), clip: { x: 0, y: 0, width: 1080, height: 1350 } });
    console.log(f, over.length ? 'OVERFLOW ' + over.join(',') : 'ok');
  }
  await b.close();
})();
