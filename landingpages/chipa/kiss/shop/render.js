// Render shop/*.html (built by build_shop.py) to exact 1500 x 2000 px PNGs.
const { chromium } = require('playwright');
const path = require('path');
const pages = ['01_produktfoto', '02_neu', '03_module', '04_zielgruppe'];
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 2000 }, deviceScaleFactor: 1 });
  for (const name of pages) {
    await page.goto('file://' + path.join(__dirname, name + '.html'));
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(__dirname, 'KISS_2Auflage_' + name + '.png'), clip: { x: 0, y: 0, width: 1500, height: 2000 } });
    console.log('rendered', name);
  }
  await browser.close();
})();
