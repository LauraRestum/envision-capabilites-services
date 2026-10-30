// Rebuilds the State Department PDF guide from guide.html.
//   node sources/state-guide/build.js            -> state/Envision-State-Department-Ordering-Guide.pdf (points to /state)
//   node sources/state-guide/build.js standalone <out.pdf>  -> EnvisionXpress.com + phone, for emailing before /state is live
const path = require('path');
const { chromium } = require('playwright');

(async () => {
  const variant = process.argv[2] || 'state';
  const out = process.argv[3] || path.join(__dirname, '../../state/Envision-State-Department-Ordering-Guide.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, 'guide.html') + '?variant=' + variant, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: out, format: 'Letter', printBackground: true, tagged: true, preferCSSPageSize: true });
  await browser.close();
  console.log('wrote', out, '(' + variant + ')');
})();
