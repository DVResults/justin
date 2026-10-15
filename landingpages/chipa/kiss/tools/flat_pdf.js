// Print-safe PDF: everything except elements with class "vec" is flattened into a 300 dpi
// JPEG background; ".vec" elements (small text, QR code) stay sharp vectors on top.
// usage: node flat_pdf.js page.html out.pdf [preview.png]
const { chromium } = require('playwright');
(async () => {
  const [,, html, pdf, png] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 1200 }, deviceScaleFactor: 300 / 96 });
  await p.goto('file://' + html);
  await p.evaluate(() => document.fonts.ready);
  const box = await p.evaluate(() => { const r = document.querySelector('.sheet').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  if (png) await p.locator('.sheet').screenshot({ path: png, scale: 'css' });
  // pass 1: background raster without vector elements
  const hide = await p.addStyleTag({ content: '.vec{visibility:hidden!important}' });
  const jpg = await p.locator('.sheet').screenshot({ type: 'jpeg', quality: 93 });
  await hide.evaluate(n => n.remove());
  // pass 2: raster as sheet background, only .vec visible
  const url = 'data:image/jpeg;base64,' + jpg.toString('base64');
  await p.addStyleTag({ content: `.sheet{background:url(${url}) 0 0/100% 100% no-repeat!important}
    .sheet *{visibility:hidden!important}.sheet .vec,.sheet .vec *{visibility:visible!important}` });
  await p.pdf({ path: pdf, width: (box.w / 96 * 25.4).toFixed(2) + 'mm', height: (box.h / 96 * 25.4).toFixed(2) + 'mm', printBackground: true, pageRanges: '1' });
  console.log('ok', pdf);
  await b.close();
})();
