// W9-2 evidence shots: the upgraded settings strip at the three acceptance
// viewports, RTL start/end states and the wide vertical composition.
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3321';
const OUT = 'docs/03-design/reconstruction/evidence/baselines/w9-2/screenshots';
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, width, scroll) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/ar/app/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  if (scroll === 'end') {
    await page.evaluate(() => {
      const nav = document.querySelector('.settings-nav nav');
      nav.scrollTo({ left: -(nav.scrollWidth - nav.clientWidth) });
    });
    await page.waitForTimeout(500);
  }
  if (scroll === 'next') {
    await page.evaluate(() => document.querySelector('.settings-strip__btn--next').click());
    await page.waitForTimeout(600);
  }
  const card = page.locator('.settings-nav').first();
  await card.screenshot({ path: `${OUT}/${name}.png` });
  await page.close();
  console.log('shot', name);
}

await shot('strip-390-start', 390, null);
await shot('strip-390-scrolled-next', 390, 'next');
await shot('strip-390-end', 390, 'end');
await shot('strip-768-start', 768, null);
await shot('nav-1440-vertical', 1440, null);

await browser.close();
console.log('done →', OUT);
