// W9-1 diagnostic: is the text-wrap rule loaded & applied?
import { createRequire } from 'node:module';
import path from 'node:path';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto((process.argv[2] || 'http://localhost:3311') + '/ar/app/learn', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const diag = await page.evaluate(() => {
  let found = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (rule.cssText && rule.cssText.includes('text-wrap')) found.push(rule.cssText.slice(0, 140));
      }
    } catch { /* cross-origin */ }
  }
  const h = document.createElement('h2'); document.body.appendChild(h);
  const synth = getComputedStyle(h).textWrapMode + ' / ' + getComputedStyle(h).textWrap;
  h.remove();
  const real = document.querySelector('h2');
  const realWrap = real ? getComputedStyle(real).textWrapMode : 'no-h2';
  return { ruleCount: found.length, sample: found.slice(0, 4), synth, realWrap, sheets: document.styleSheets.length };
});
console.log(JSON.stringify(diag, null, 2));
await browser.close();
