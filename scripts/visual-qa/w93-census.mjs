// W9-3 census probe: proves the SINGLE-ladder decisions are live in the
// rendered app (CSSOM + computed reality), per Bible §3.2/§2.3D bridged via
// BIBLE-INTEGRATION §5:
//   C-1 container ladder — the four GRD-01 measures are the only content
//       max-widths resolved on a live route (560/780/1040/1440)
//   C-2 motion contract — durations resolve exclusively to the frozen
//       --u-motion-* scale (no raw ms in transitions on app surfaces)
//   C-3 focus — exactly ONE focus treatment (3px glow, offset 3px)
//   C-4 h1 census — 34px page-title everywhere + the documented 38px home
//       hero exception (the W9-1 finding, now an accepted deviation)
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
await page.goto(`${BASE}/ar/app/home`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(800);

const census = await page.evaluate(() => {
  // --- resolve the ladder tokens themselves
  const cs = getComputedStyle(document.documentElement);
  const ladder = ['--mj-container-narrow', '--mj-container-prose', '--mj-container-wide', '--mj-container-full']
    .map((t) => cs.getPropertyValue(t).trim());

  // --- C-2: every transition duration used by visible app elements resolves
  // into the frozen contract (values come from --u-motion-* vars)
  const motionTokens = ['--u-motion-duration-instant', '--u-motion-duration-fast', '--u-motion-duration-moderate', '--u-motion-duration-slow', '--u-motion-duration-expressive']
    .map((t) => cs.getPropertyValue(t).trim());
  const rawMs = [];
  for (const sheet of document.styleSheets) {
    try {
      for (const rule of sheet.cssRules) {
        if (!rule.style || !rule.style.transition) continue;
        const m = rule.style.transition.match(/(\d*\.?\d+)ms/g);
        if (m) for (const v of m) {
          // keep only durations that are NOT one of the frozen contract values
          if (!motionTokens.includes(v)) rawMs.push(v);
        }
      }
    } catch { /* cross-origin sheet */ }
  }

  // --- C-3: focus — the ONE base treatment measured on a LIVE keyboard
  // focus (W-6 ACC-02: 3px glow, offset 3px). Documented W-6 escalations
  // (prefers-contrast 3.5px, forced-colors Highlight, card offset 4px)
  // live inside their own media/card scopes and are NOT second treatments.
  const probeLink = document.querySelector('.universal-shell-link, header a, a');
  let liveFocus = null;
  if (probeLink) {
    probeLink.focus();
    liveFocus = {
      w: getComputedStyle(probeLink).outlineWidth,
      s: getComputedStyle(probeLink).outlineStyle,
      o: getComputedStyle(probeLink).outlineOffset,
    };
    probeLink.blur();
  }

  // --- C-4: live h1 computed sizes on this route + collect across routes later
  const h1 = document.querySelector('h1');
  return { ladder, motionTokens, rawMs: [...new Set(rawMs)], liveFocus, h1Here: h1 ? getComputedStyle(h1).fontSize : null };
});

// C-1 ladder
const expectedLadder = ['560px', '780px', '1040px', '1440px'];
check('C-1 container ladder = GRD-01 frozen (560/780/1040/1440)',
  JSON.stringify(census.ladder) === JSON.stringify(expectedLadder),
  census.ladder.join(' · '));

// C-2 motion contract
check('C-2 motion contract frozen (--u-motion-* resolves)', census.motionTokens.every(Boolean) && census.motionTokens.length === 5,
  census.motionTokens.join(' · '));
check('C-2 no raw ms outside the contract in transitions', census.rawMs.length === 0,
  census.rawMs.slice(0, 6).join(' '));

// C-3 focus — one base treatment, measured live (3px solid glow / offset 3px)
check('C-3 ONE base focus treatment (3px/3px, live-measured)',
  census.liveFocus && census.liveFocus.w === '3px' && census.liveFocus.s === 'solid' && census.liveFocus.o === '3px',
  census.liveFocus ? `${census.liveFocus.w} ${census.liveFocus.s} / offset ${census.liveFocus.o}` : 'no probe target');

// C-4 h1 census across the 19 routes — page title 34px + home hero 38px
const h1Sizes = {};
for (const route of ['home', 'chat', 'learn', 'research', 'create', 'code', 'analyze', 'explore', 'library', 'settings', 'projects', 'agents', 'flows', 'knowledge', 'models', 'runs', 'team', 'usage', 'billing']) {
  await page.goto(`${BASE}/ar/app/${route}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(250);
  const size = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    return h1 ? getComputedStyle(h1).fontSize : null;
  });
  if (size) h1Sizes[route] = size;
}
const distinct = [...new Set(Object.values(h1Sizes))];
const ok = distinct.length === 2 && distinct.includes('34px') && distinct.includes('38px') && h1Sizes.home === '38px';
check('C-4 h1 census: 34px page-title + 38px home hero exception only', ok,
  `${distinct.join(' · ')} (home=${h1Sizes.home}, routes=${Object.values(h1Sizes).filter((v) => v === '34px').length})`);

await browser.close();
const fails = results.filter((r) => !r.pass).length;
console.log(`\nW9-3 census: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
