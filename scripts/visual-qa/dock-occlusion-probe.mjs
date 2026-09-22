#!/usr/bin/env node
/* W-DS Phase 3 closure condition (§7.5) — Mobile-Dock occlusion probe.

   Owner condition, recorded §7.5 2026-09-22: "it must be verified that the
   Mobile Dock does not occlude the last interactive content — especially on
   Settings and the other phone pages — with the scroll test result recorded."

   Method per cell (route × viewport):
     1. Load the route in a phone context (isMobile + hasTouch).
     2. Scroll to the absolute document bottom IN STAGES (25/50/75/100%) so
        every scroll-reveal IntersectionObserver fires (ScrollFx), then let
        the reveal transitions (320ms + stagger) settle at full bottom.
     3. Measure the dock rect and every interactive element inside
        #main-content (a[href], button, input, select, textarea, [tabindex]).
     4. Occlusion test — an element is occluded iff its rect INTERSECTS the
        dock rect AND the hit test at the intersection's center does not
        return the element's own subtree (document.elementFromPoint).
     5. Record the bottom-most interactive element (the "last interactive
        content"), its clearance gap to the dock's top edge, and a verdict.

   Deep passes:
     --settings   every one of the 7 settings sections (profile … audit),
                  each scrolled to its own bottom (the sections swap by state)
     --edge       dark theme (colorScheme: dark) + en LTR on the routes the
                  owner called out (settings sections + chat + home)

   node scripts/visual-qa/dock-occlusion-probe.mjs --base http://localhost:3100 \
        --out <file.json> [--settings] [--edge] [--shots <dir>]
*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3100';
const OUT = flag('--out') || '/home/z/my-project/dock-occlusion/dock-occlusion-probe.json';
const DO_SETTINGS = args.includes('--settings');
const DO_EDGE = args.includes('--edge');
const SHOTS = flag('--shots');

/* Every /app/* route carries the dock (the marketing landing does not — it
   renders outside the app shell). 19 routes. */
const ROUTES = {
  home: '/ar/app/home', chat: '/ar/app/chat', learn: '/ar/app/learn',
  research: '/ar/app/research', create: '/ar/app/create', code: '/ar/app/code',
  analyze: '/ar/app/analyze', explore: '/ar/app/explore', library: '/ar/app/library',
  settings: '/ar/app/settings', projects: '/ar/app/projects', agents: '/ar/app/agents',
  flows: '/ar/app/flows', knowledge: '/ar/app/knowledge', models: '/ar/app/models',
  runs: '/ar/app/runs', usage: '/ar/app/usage', billing: '/ar/app/billing', team: '/ar/app/team',
};
const VPS = [
  { name: '390', width: 390, height: 844 },
  { name: '375', width: 375, height: 812 },
  { name: '360', width: 360, height: 800 },
];
/* Settings sections in nav order (settings-prototype.tsx). */
const SETTINGS_SECTIONS = ['profile', 'preferences', 'workspace', 'providers', 'integrations', 'data', 'audit'];

/* Staged scroll-to-bottom: fires every reveal observer on the way down,
   then parks at the absolute bottom and waits out the reveal transitions. */
const SCROLL_TO_BOTTOM = () => new Promise((resolve) => {
  const sh = document.documentElement.scrollHeight;
  const stages = [0.25, 0.5, 0.75].map((f) => Math.round(sh * f));
  let i = 0;
  const tick = () => {
    if (i < stages.length) { window.scrollTo(0, stages[i++]); setTimeout(tick, 200); return; }
    window.scrollTo(0, sh);
    setTimeout(resolve, 700);
  };
  tick();
});

/* The measurement — runs after the staged scroll. Every number carries its
   selector; occlusion = geometric intersection WITH a failed center hit test
   on the intersection zone (both must hold). */
const MEASURE = () => {
  const dock = document.querySelector('.universal-shell-mobile-nav');
  const main = document.getElementById('main-content');
  if (!dock || !main) return { error: 'missing dock or main-content' };
  const dockCS = getComputedStyle(dock);
  if (dockCS.display === 'none') return { error: 'dock hidden (not the phone band?)' };
  const dr = dock.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const maxScroll = document.documentElement.scrollHeight - vh;
  const scrollY = window.scrollY;
  const atBottom = scrollY >= maxScroll - 1;

  const SEL = 'a[href], button:not([disabled]), input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])';
  const interactive = [];
  let occludedByDock = 0;
  let inDockBand = 0;
  for (const el of main.querySelectorAll(SEL)) {
    if (el.closest('[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    /* intersection of the element with the dock */
    const ix1 = Math.max(r.left, dr.left), iy1 = Math.max(r.top, dr.top);
    const ix2 = Math.min(r.right, dr.right), iy2 = Math.min(r.bottom, dr.bottom);
    const intersects = ix2 - ix1 > 0.5 && iy2 - iy1 > 0.5;
    let hit = 'clear';
    if (intersects) {
      inDockBand += 1;
      const cx = (ix1 + ix2) / 2, cy = (iy1 + iy2) / 2;
      const top = document.elementFromPoint(cx, cy);
      const reachable = !!(top && (el.contains(top) || top.contains(el)));
      hit = reachable ? 'reachable-through' : `blocked-by:${(top && (top.tagName + (top.className ? '.' + String(top.className).split(' ')[0] : ''))) || 'nothing'}`;
      if (!reachable) occludedByDock += 1;
    }
    interactive.push({
      tag: el.tagName.toLowerCase(),
      label: (el.textContent || el.getAttribute('aria-label') || el.getAttribute('placeholder') || '').trim().replace(/\s+/g, ' ').slice(0, 36),
      bottom: +r.bottom.toFixed(1),
      intersectsDock: intersects,
      hit,
    });
  }

  /* the last interactive content = the visually bottom-most element */
  let last = null;
  for (const item of interactive) if (!last || item.bottom > last.bottom) last = item;
  const gapToDockTop = last ? +(dr.top - last.bottom).toFixed(1) : null;

  return {
    viewport: `${vw}x${vh}`,
    dock: { top: +dr.top.toFixed(1), bottom: +dr.bottom.toFixed(1), left: +dr.left.toFixed(1), right: +dr.right.toFixed(1), height: +dr.height.toFixed(1) },
    scroll: { scrollY: +scrollY.toFixed(1), maxScroll: +maxScroll.toFixed(1), docHeight: document.documentElement.scrollHeight, atBottom },
    interactiveCount: interactive.length,
    interactiveInDockBand: inDockBand,
    occludedByDock,
    lastInteractive: last,
    gapToDockTop,
    blocked: interactive.filter((i) => i.hit.startsWith('blocked-by')),
    pass: atBottom && occludedByDock === 0,
  };
};

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const result = { base: BASE, method: 'staged scroll to absolute bottom → dock∩interactive rect intersection + center hit test on the intersection; last interactive = max bottom', cells: {} };

/* One context per (viewport, colorScheme) — pages rotate inside it (context
   creation is the expensive part; every page starts clean via about:blank). */
const contextCache = new Map();
function contextFor(browser, vp, dark) {
  const key = `${vp.name}:${dark ? 'dark' : 'light'}`;
  if (!contextCache.has(key)) {
    contextCache.set(key, browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true, hasTouch: true,
      ...(dark ? { colorScheme: 'dark' } : {}),
    }));
  }
  return contextCache.get(key);
}

async function captureCell(key, route, vp, { dark = false, sectionIndex = null } = {}) {
  const ctx = await contextFor(browser, vp, dark);
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(600);
    /* Settings sections swap through the mobile chip-scroller nav (≤ 880px
       container: overflow-x auto + scroll-snap). A finger swipes the row
       horizontally; Playwright's auto-scroll does not, so the probe scrolls
       the chip into horizontal view and clicks it — same user path. */
    if (sectionIndex !== null) {
      await page.evaluate((index) => {
        const btn = document.querySelectorAll('.settings-nav nav button')[index];
        btn.scrollIntoView({ block: 'nearest', inline: 'center' });
        btn.click();
      }, sectionIndex);
      await page.waitForTimeout(350);
    }
    await page.evaluate(SCROLL_TO_BOTTOM);
    const data = await page.evaluate(MEASURE);
    result.cells[key] = data;
    const last = data.lastInteractive ? `${data.lastInteractive.tag}«${data.lastInteractive.label}» b=${data.lastInteractive.bottom}` : 'none';
    console.log(`${key}: ${data.error ? 'ERROR ' + data.error : `atBottom=${data.scroll.atBottom} interactive=${data.interactiveCount} inBand=${data.interactiveInDockBand} occluded=${data.occludedByDock} gap=${data.gapToDockTop}px last=${last} → ${data.pass ? 'PASS' : 'FAIL'}`}`);
    /* Evidence shots: selective — every settings section + two reference
       routes, at the primary 390 band (light + dark). */
    const slug0 = key.split('@')[0];
    const wantShot = key.endsWith('@390') && (key.startsWith('settings') || slug0 === 'home' || slug0 === 'chat');
    if (SHOTS && !data.error && wantShot) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `${key.replace(/[/@]/g, '_')}.jpg`), type: 'jpeg', quality: 72 });
    }
  } catch (e) {
    result.cells[key] = { error: String(e) };
    console.log(`${key}: FAILED ${String(e).split('\n')[0]}`);
  }
  await page.close().catch(() => {});
}

for (const [key, ctxPromise] of contextCache) { await ctxPromise; }

/* ---- main pass: every app route × phone viewports (light, ar RTL) ---- */
for (const vp of VPS) {
  for (const [slug, route] of Object.entries(ROUTES)) {
    if (slug === 'settings') continue; // deep pass below
    await captureCell(`${slug}@${vp.name}`, route, vp);
  }
}

/* ---- settings deep pass: every section × every viewport ---- */
if (DO_SETTINGS) {
  for (const vp of VPS) {
    for (let i = 0; i < SETTINGS_SECTIONS.length; i++) {
      await captureCell(`settings-${SETTINGS_SECTIONS[i]}@${vp.name}`, '/ar/app/settings', vp, { sectionIndex: i });
    }
  }
}

/* ---- edge pass: dark theme + en LTR on the owner-called-out routes ---- */
if (DO_EDGE) {
  const vp390 = VPS[0];
  for (let i = 0; i < SETTINGS_SECTIONS.length; i++) {
    await captureCell(`settings-${SETTINGS_SECTIONS[i]}@390-dark`, '/ar/app/settings', vp390, { dark: true, sectionIndex: i });
  }
  for (const slug of ['settings', 'chat', 'home', 'library', 'models']) {
    await captureCell(`${slug}@390-dark`, ROUTES[slug], vp390, { dark: true });
  }
  for (let i = 0; i < SETTINGS_SECTIONS.length; i++) {
    await captureCell(`en-settings-${SETTINGS_SECTIONS[i]}@390`, '/en/app/settings', vp390, { sectionIndex: i });
  }
  for (const slug of ['chat', 'home', 'library', 'models']) {
    await captureCell(`en-${slug}@390`, ROUTES[slug].replace('/ar/', '/en/'), vp390);
  }
}

await browser.close();

/* ---- aggregate verdict ---- */
const cells = Object.entries(result.cells);
const ok = cells.filter(([, v]) => !v.error);
result.verdict = {
  cells: cells.length,
  errors: cells.length - ok.length,
  cellsAtBottom: ok.filter(([, v]) => v.scroll.atBottom).length,
  cellsWithOcclusion: ok.filter(([, v]) => v.occludedByDock > 0).length,
  totalOccludedElements: ok.reduce((a, [, v]) => a + v.occludedByDock, 0),
  minGapToDockTop: ok.length ? Math.min(...ok.map(([, v]) => (v.gapToDockTop ?? Infinity))) : null,
  passCells: ok.filter(([, v]) => v.pass).length,
  failCells: cells.filter(([k, v]) => !v.error && !v.pass).map(([k]) => k),
  allPass: ok.length > 0 && ok.every(([, v]) => v.pass),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('\nVERDICT:', JSON.stringify(result.verdict, null, 1));
