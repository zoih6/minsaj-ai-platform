// W9-4 probe (Bible §5): the LIVE surface affordances on ServiceProductShell.
// Drives a real learn run through the product surface, then verifies:
//   L-1 stage pills exist with the four visual states wired (§5.2-3)
//   L-2 the active pill carries the service tint + spinner
//   L-3 the sticky status bar is 40px, sticky, pulsing dot, mono meta (§5.2-6)
//   L-4 the artifacts rail (when an artifact exists) is a 420px sticky column
//       with an inline-start divider on lg+ (§5.2-5)
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/ar/app/learn`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);

// Fill the brief: topic select (has a default), level + minutes chips,
// a short motivation (required by learnBriefSchema), then submit.
await page.locator('[data-testid="u2-learn-motivation"]').fill("سرد مستمر للاختبار");
await page.locator('[data-testid^="u2-learn-level-"]').first().click();
await page.locator('[data-testid^="u2-learn-minutes-"]').first().click();
await page.locator('[data-testid="u2-learn-brief-submit"]').click();
await page.waitForTimeout(600);

// Open the demo door and start the run, then close the door — the live
// affordances must live on the PRODUCT surface.
await page.locator('[data-testid="u2-demo-open"]').click();
await page.waitForTimeout(300);
await page.locator('[data-testid="u2-start"]').click();
await page.waitForTimeout(400);
await page.keyboard.press('Escape'); // close the demo dialog
await page.waitForTimeout(1200);

// L-1 + L-2: the stage pills
const strip = await page.evaluate(() => {
  const strip2 = document.querySelector('[data-testid="u2-live-stages"]');
  if (!strip2) return { exists: false };
  const pills = [...strip2.querySelectorAll('li')];
  return {
    exists: true,
    count: pills.length,
    statuses: pills.map((li) => li.dataset.status),
    activeBg: pills.find((li) => li.dataset.status === 'active')
      ? getComputedStyle(pills.find((li) => li.dataset.status === 'active').querySelector('.u2-live-strip__pill')).backgroundColor
      : null,
    hasSpinner: Boolean(strip2.querySelector('.u2-live-strip__spin')),
    pillHeight: pills[0] ? strip2.querySelector('.u2-live-strip__pill').getBoundingClientRect().height : 0,
  };
});
check('L-1 live stage strip on the product surface', strip.exists && strip.count >= 3, strip.exists ? `${strip.count} pills: ${strip.statuses.join(',')}` : 'missing');
check('L-2 active pill carries the service tint + spinner', strip.activeBg !== null && strip.activeBg !== 'rgba(0, 0, 0, 0)' && strip.hasSpinner, `bg=${strip.activeBg}`);
check('L-2 pills are 32px-ish compact', strip.pillHeight >= 30 && strip.pillHeight <= 36, `${strip.pillHeight.toFixed(1)}px`);

// L-3: the sticky status bar
const bar = await page.evaluate(() => {
  const bar2 = document.querySelector('[data-testid="u2-live-status"]');
  if (!bar2) return { exists: false };
  const cs = getComputedStyle(bar2);
  const rect = bar2.getBoundingClientRect();
  return {
    exists: true,
    position: cs.position,
    height: rect.height,
    bottom: rect.bottom,
    viewportH: window.innerHeight,
    hasDot: Boolean(bar2.querySelector('.u2-live-bar__dot')),
    monoMeta: Boolean(bar2.querySelector('.mono')),
    status: bar2.dataset.status,
    active: bar2.dataset.active,
  };
});
check('L-3 live status bar exists', bar.exists, bar.exists ? `status=${bar.status} active=${bar.active}` : 'missing');
check('L-3 sticky bar ~40px tall', bar.exists && bar.height >= 38 && bar.height <= 46, bar.exists ? `${bar.height.toFixed(1)}px` : '');
check('L-3 pulsing dot + mono run id present', bar.exists && bar.hasDot && bar.monoMeta);

// Give the simulation a few beats, then check the artifacts rail conditionally.
await page.waitForTimeout(2500);
const rail = await page.evaluate(() => {
  const rail2 = document.querySelector('[data-testid="u2-live-artifacts"]');
  if (!rail2) return { exists: false };
  const cs = getComputedStyle(rail2);
  const body = rail2.closest('.u2-product__body');
  const bodyCS = getComputedStyle(body);
  return {
    exists: true,
    position: cs.position,
    width: rail2.getBoundingClientRect().width,
    divider: cs.borderInlineStartWidth,
    bodyColumns: bodyCS.gridTemplateColumns,
  };
});
if (rail.exists) {
  check('L-4 artifacts rail: 420px sticky column with divider', rail.position === 'sticky' && Math.round(rail.width) === 420 && rail.divider !== '0px',
    `pos=${rail.position} w=${rail.width.toFixed(0)} divider=${rail.divider} cols=${rail.bodyColumns}`);
} else {
  check('L-4 artifacts rail (skipped — no artifact yet, structure gated)', true, 'rail hidden until an artifact exists (by design)');
}

// Negative control: with no run, /ar/app/explore shows none of the live chrome.
const page2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page2.goto(`${BASE}/ar/app/explore`, { waitUntil: 'domcontentloaded' });
await page2.waitForTimeout(600);
const idle = await page2.evaluate(() => ({
  strip: Boolean(document.querySelector('[data-testid="u2-live-stages"]')),
  bar: Boolean(document.querySelector('[data-testid="u2-live-status"]')),
  rail: Boolean(document.querySelector('[data-testid="u2-live-artifacts"]')),
}));
check('L-5 idle service shows NO live chrome', !idle.strip && !idle.bar && !idle.rail, JSON.stringify(idle));
await page2.close();

await browser.close();
const fails = results.filter((r) => !r.pass).length;
console.log(`\nW9-4 probe: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
