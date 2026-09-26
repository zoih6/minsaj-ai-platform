// W9-5 probe — مكتبتي (the forgotten page) upgraded to the Bible §4.5
// media-card anatomy. Verifies on the LIVE grid:
//   M-1 all cards in one grid row share the same height (§4.5 row math)
//   M-2 the unified min-height (320px) holds for the shortest card
//   M-3 title clamps at 2 lines · description at 3 (was: 1-line ellipsis)
//   M-4 the footer is pinned to the card bottom (same baseline in a row)
//   M-5 list view stays compact (exempt from the grid min-height)
//   M-6 zero horizontal overflow @390
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3321';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();

async function measure(width) {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto(`${BASE}/ar/app/library`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => {
    const grid = document.querySelector('.universal-library-grid');
    const cards = [...grid.querySelectorAll('.universal-library-item')];
    const rows = new Map();
    for (const c of cards) {
      const y = Math.round(c.getBoundingClientRect().top);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push(c.getBoundingClientRect().height);
    }
    const first = cards[0];
    const h2 = first.querySelector('h2');
    const p = first.querySelector('p');
    const footer = first.querySelector('.universal-library-item__body > div');
    const cardRect = first.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();
    const bodyCS = getComputedStyle(first.querySelector('.universal-library-item__body'));
    return {
      cardCount: cards.length,
      rowHeights: [...rows.values()].map((hs) => ({ n: hs.length, equal: hs.every((h) => Math.abs(h - hs[0]) < 1), h: +hs[0].toFixed(1) })),
      minHeight: Math.min(...cards.map((c) => c.getBoundingClientRect().height)),
      h2Clamp: getComputedStyle(h2).webkitLineClamp,
      pClamp: getComputedStyle(p).webkitLineClamp,
      h2Lines: Math.round(h2.getBoundingClientRect().height / (parseFloat(getComputedStyle(h2).lineHeight) || 1)),
      footerPinned: Math.abs((cardRect.bottom - parseFloat(bodyCS.paddingBottom)) - footerRect.bottom) < 2,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  await page.close();
  return data;
}

const d1440 = await measure(1440);
check('M-1 grid rows share one height @1440', d1440.rowHeights.every((r) => r.equal), JSON.stringify(d1440.rowHeights));
check('M-2 unified min-height ≥ 320px', d1440.minHeight >= 319, `shortest card: ${d1440.minHeight.toFixed(1)}px`);
check('M-3 title line-clamp=2 · description=3', d1440.h2Clamp === '2' && d1440.pClamp === '3', `title=${d1440.h2Clamp} desc=${d1440.pClamp}`);
check('M-4 footer pinned to the card bottom', d1440.footerPinned);

const d390 = await measure(390);
check('M-6 zero horizontal overflow @390', !d390.hOverflow, d390.hOverflow ? `scrollWidth ${document.documentElement.scrollWidth}` : '');

// list view stays compact
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(`${BASE}/ar/app/library`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
await page.evaluate(() => { document.querySelector('.universal-library-view button:not(.is-active)')?.click(); });
await page.waitForTimeout(400);
const listH = await page.evaluate(() => {
  const cards = [...document.querySelectorAll('.universal-library-grid.is-list .universal-library-item')];
  return cards.length ? cards[0].getBoundingClientRect().height : null;
});
check('M-5 list view compact (min-height exempt)', listH !== null && listH < 300, `row height: ${listH ? listH.toFixed(0) + 'px' : 'n/a'}`);
await page.close();

await browser.close();
const fails = results.filter((r) => !r.pass).length;
console.log(`\nW9-5 library probe: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
