// W9-2 diagnostic: why is the strip not horizontal at 390?
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('PAGE-ERR:', String(e).slice(0, 300)));
await page.goto((process.argv[2] || 'http://localhost:3311') + '/ar/app/settings', { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);
const d = await page.evaluate(() => {
  const ops = document.querySelector('.ops-page');
  const nav = document.querySelector('.settings-nav nav');
  const strip = document.querySelector('.settings-strip');
  const aside = document.querySelector('.settings-nav');
  if (!ops || !nav || !aside) return { error: 'missing', hasOps: !!ops, hasNav: !!nav };
  const cs = getComputedStyle(nav);
  const opsCS = getComputedStyle(ops);
  const asideCS = getComputedStyle(aside);
  return {
    opsContainer: opsCS.containerType || opsCS.container,
    opsWidth: ops.getBoundingClientRect().width,
    gridCols: asideCS.gridTemplateColumns || getComputedStyle(document.querySelector('.settings-layout')).gridTemplateColumns,
    navFlex: cs.flexDirection,
    navOverflowX: cs.overflowX,
    scrollW: nav.scrollWidth, clientW: nav.clientWidth,
    stripExists: !!strip,
    btnCount: document.querySelectorAll('.settings-strip__btn').length,
  };
});
console.log(JSON.stringify(d, null, 2));
await browser.close();
