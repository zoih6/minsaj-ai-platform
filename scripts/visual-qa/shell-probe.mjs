#!/usr/bin/env node
// ============================================================================
// W-DS Phase 6 — G-6 shell probe (VISUAL-QA-CHECKLIST.md §4, Gate G)
// ----------------------------------------------------------------------------
// The lean CI companion to scripts/visual-qa/capture.mjs. Where the capture
// tool freezes a 100-cell baseline per phase, THIS probe runs on every push
// (error mode since Phase 6) and asserts the B-5/B-6 invariants that must
// NEVER regress between baselines:
//
//   • 390 / 430 coarse  — touch composition, single-row topbar, chrome
//                         budget ≤ 15.5% / ≤ 14.5% (B-5), zero horizontal
//                         overflow (A-2), touch-target floor (A-4, frozen
//                         per-route caps from the Phase 5 baseline).
//   • 980 × 2000 coarse — desktop-site-on-phone (R-RES-1b, matrix RES-01):
//                         the TOUCH composition regardless of width, and the
//                         never-scale rule (R-RES-1a): effective text
//                         (CSS px × physical scale) ≥ 14px body / 11px mono
//                         at the 414px-phone reference scale 414/980.
//   • 1024 / 1440 fine  — regression control: the sidebar composition and
//                         pointer-blind invariance of the fine-pointer bands
//                         (the coarse layer must never leak into fine bands).
//
// Usage:
//   node scripts/visual-qa/shell-probe.mjs [--base http://localhost:3000]
//        [--out <report.json>] [--shots <dir>] [--route home,chat,settings]
//
// Exit code: 0 = all checks pass · 1 = any FAIL (CI error mode).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3000';
const OUT = flag('--out');
const SHOTS = flag('--shots');
const ROUTES_FILTER = flag('--route') ? flag('--route').split(',').map((s) => s.trim()) : null;

const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  try {
    ({ chromium } = require_('playwright-core'));
  } catch {
    console.error('[shell-probe] playwright is not resolvable (npm i -D playwright && npx playwright install chromium)');
    process.exit(1);
  }
}

// ---- The phone reference for the never-scale math (audit RES-01 evidence:
//      414px physical phone, 980 CSS px desktop-mode layout). --------------
const PHYSICAL_W = 414;
const DESKTOPMODE_W = 980;
const DESKTOPMODE_H = 2000; // 844 × (980/414) — preserves the phone aspect
const SCALE = PHYSICAL_W / DESKTOPMODE_W; // 0.4224

// ---- Probed routes + frozen touch-target caps (Phase 5 baseline @390/430).
//      tapUnder44 ≤ cap per route; the caps ratchet down as debt is paid. --
const ROUTES = [
  { slug: 'home', path: '/ar/app/home', tapUnder44Cap: 0 },
  { slug: 'chat', path: '/ar/app/chat', tapUnder44Cap: 1 },
  { slug: 'settings', path: '/ar/app/settings', tapUnder44Cap: 0 },
];

// The measurement payload injected per cell (same method as capture.mjs).
const MEASURE = () => {
  const $ = (s) => document.querySelector(s);
  const de = document.documentElement;
  const shell = $('.universal-app-shell');
  const topbar = $('.universal-shell-topbar');
  const dock = $('.universal-shell-mobile-nav');
  const sidebar = $('.universal-shell-sidebar');
  const navLink = $('.universal-shell-link > b');
  const dockLabel = $('.universal-shell-mobile-nav a span');
  const main = $('#main-content');

  const rect = (el) => (el ? el.getBoundingClientRect() : null);
  const px = (v) => (v == null ? null : +v.toFixed(1));

  const topbarH = topbar ? topbar.getBoundingClientRect().height : 0;
  const dockStyle = dock ? getComputedStyle(dock) : null;
  const dockVisible = !!dock && dockStyle.display !== 'none' && rect(dock).width > 0;
  const dockH = dockVisible ? rect(dock).height : 0;
  const vh = window.innerHeight;

  // Touch-target census inside main (capture.mjs parity).
  const targets = [];
  if (main) {
    main.querySelectorAll('button, a, [role="button"], input, [tabindex]:not([tabindex="-1"])').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      targets.push({ w: +r.width.toFixed(0), h: +r.height.toFixed(0) });
    });
  }

  // Type samples — the registers the never-scale rule binds.
  const fontSizeOf = (el) => (el ? getComputedStyle(el).fontSize : null);
  let bodyMax = 0;
  if (main) {
    main.querySelectorAll('p').forEach((p) => {
      const fs = parseFloat(getComputedStyle(p).fontSize);
      if (getComputedStyle(p).visibility !== 'hidden' && fs > bodyMax) bodyMax = fs;
    });
  }
  const codeEl = main ? main.querySelector('.mono, kbd, code, [class*="code"]') : null;

  const sidebarCS = sidebar ? getComputedStyle(sidebar) : null;
  return {
    dir: de.dir,
    dataSidebar: shell ? shell.getAttribute('data-sidebar') : null,
    dataMobileOpen: shell ? shell.getAttribute('data-mobile-open') : null,
    pointerCoarse: matchMedia('(pointer: coarse)').matches,
    topbarH: px(topbarH),
    dockVisible,
    dockH: px(dockH),
    chromeRatio: +(((topbarH + dockH) / vh) * 100).toFixed(1),
    viewport: { w: window.innerWidth, h: vh },
    hOverflow: de.scrollWidth > de.clientWidth + 1,
    sidebarHidden: sidebarCS ? sidebarCS.visibility === 'hidden' || /matrix\((?!.*[1-9])/.test(sidebarCS.transform) : null,
    sidebarTransform: sidebarCS ? sidebarCS.transform : null,
    navLinkPx: fontSizeOf(navLink),
    dockLabelPx: fontSizeOf(dockLabel),
    h1Px: fontSizeOf(main ? main.querySelector('h1') : null),
    bodyMaxPx: bodyMax ? +bodyMax.toFixed(1) : null,
    codePx: fontSizeOf(codeEl),
    tapCount: targets.length,
    tapUnder44: targets.filter((t) => t.w < 44 || t.h < 44).length,
    tapMinH: targets.length ? Math.min(...targets.map((t) => t.h)) : null,
  };
};

// ---- Check helpers -----------------------------------------------------------
const eff = (cssPx) => (cssPx == null ? null : +(cssPx * SCALE).toFixed(2));

async function settle(page) {
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(1400);
}

async function captureCell(browser, { name, route, width, height, coarse }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: coarse,
    hasTouch: coarse,
  });
  const page = await ctx.newPage();
  const checks = [];
  const add = (id, pass, value, expected) => checks.push({ id, pass: !!pass, value, expected });

  try {
    await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await settle(page);
    let m = await page.evaluate(MEASURE);

    // --- composition (B-6) ---
    const expectTouch = coarse;
    add('composition.touch-shell', expectTouch
      ? m.dataSidebar === 'drawer' && m.dockVisible
      : m.dataSidebar !== 'drawer' && !m.dockVisible,
      `data-sidebar=${m.dataSidebar} dock=${m.dockVisible}`,
      expectTouch ? 'drawer + dock' : 'sidebar composition, no dock');

    // --- overflow (A-2) ---
    add('overflow.none', !m.hOverflow, m.hOverflow, false);

    // --- chrome budget (B-5) ---
    if (name === '390') add('budget.chrome390', m.chromeRatio <= 15.5, m.chromeRatio, '≤ 15.5');
    if (name === '430') add('budget.chrome430', m.chromeRatio <= 14.5, m.chromeRatio, '≤ 14.5');
    if (name === '980-coarse') add('budget.chrome980', m.chromeRatio <= 15.5, m.chromeRatio, '≤ 15.5');

    // --- single-row topbar (B-5 / NAV-01) ---
    if (name === '390' || name === '430') add('topbar.single-row', m.topbarH <= 60, m.topbarH, '≤ 60px');
    if (name === '980-coarse') add('topbar.scaled-row', m.topbarH >= 100 && m.topbarH <= 175, m.topbarH, '100–175px (56 × zoom)');

    // --- touch targets (A-4) ---
    if (coarse) {
      const cap = route.tapUnder44Cap;
      add('targets.44px-floor', m.tapUnder44 <= cap, m.tapUnder44, `≤ ${cap} (frozen cap)`);
    }
    if (name === '1024' || name === '1440') {
      add('targets.24px-absolute', (m.tapMinH ?? 999) >= 24, m.tapMinH, '≥ 24px');
    }

    // --- never-scale (R-RES-1a) — 980-coarse only --------------------------
    if (name === '980-coarse') {
      const bodyEff = eff(m.bodyMaxPx);
      const navEff = eff(parseFloat(m.navLinkPx));
      const dockEff = eff(parseFloat(m.dockLabelPx));
      const h1Eff = eff(parseFloat(m.h1Px));
      add('neverscale.body', bodyEff != null && bodyEff >= 14, bodyEff, '≥ 14px effective');
      add('neverscale.nav', navEff != null && navEff >= 12, navEff, '≥ 12px effective (phone label parity)');
      add('neverscale.dock', dockEff != null && dockEff >= 10, dockEff, '≥ 10px effective (phone caption parity)');
      add('neverscale.h1', h1Eff == null || h1Eff >= 14, h1Eff, '≥ 14px effective');
      if (m.codePx) {
        const codeEff = eff(parseFloat(m.codePx));
        add('neverscale.mono', codeEff >= 11, codeEff, '≥ 11px effective');
      }
    }

    // --- drawer opens on the touch shell (B-6, home only) ------------------
    if (name === '980-coarse' && route.slug === 'home') {
      try {
        await page.click('.universal-shell-context > button');
        await page.waitForTimeout(600);
        const open = await page.evaluate(() => ({
          open: document.querySelector('.universal-app-shell')?.getAttribute('data-mobile-open'),
          vis: getComputedStyle(document.querySelector('.universal-shell-sidebar')).visibility,
        }));
        add('drawer.opens-wide', open.open === 'true' && open.vis === 'visible',
          `data-mobile-open=${open.open} visibility=${open.vis}`, 'drawer opens at 980 coarse');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } catch (e) {
        add('drawer.opens-wide', false, String(e).split('\n')[0], 'drawer opens at 980 coarse');
      }
    }

    if (SHOTS && ['980-coarse', '390'].includes(name)) {
      fs.mkdirSync(SHOTS, { recursive: true });
      await page.screenshot({ path: path.join(SHOTS, `${route.slug}-${name}.jpg`), type: 'jpeg', quality: 82 });
    }

    // Re-measure post-interaction state for the report record.
    m = await page.evaluate(MEASURE).catch(() => m);
    return { name, route: route.slug, pass: checks.every((c) => c.pass), checks, measured: m };
  } finally {
    await ctx.close().catch(() => {});
  }
}

(async () => {
  const routes = ROUTES_FILTER ? ROUTES.filter((r) => ROUTES_FILTER.includes(r.slug)) : ROUTES;
  const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
  const cells = [];

  const CELLS = [
    { name: '390', width: 390, height: 844, coarse: true },
    { name: '430', width: 430, height: 932, coarse: true },
    { name: '980-coarse', width: DESKTOPMODE_W, height: DESKTOPMODE_H, coarse: true },
  ];
  for (const vp of CELLS) {
    for (const route of routes) {
      const cell = await captureCell(browser, { ...vp, route });
      cells.push(cell);
      const verdict = cell.pass ? 'PASS' : 'FAIL';
      console.log(`[${verdict}] ${cell.name} · ${route.slug}`);
      cell.checks.filter((c) => !c.pass).forEach((c) =>
        console.log(`    ✗ ${c.id}: ${JSON.stringify(c.value)} (expected ${c.expected})`));
    }
  }
  // Fine-pointer regression controls (home only).
  for (const vp of [
    { name: '1024', width: 1024, height: 768 },
    { name: '1440', width: 1440, height: 900 },
  ]) {
    const cell = await captureCell(browser, { ...vp, coarse: false, route: ROUTES[0] });
    cells.push(cell);
    const verdict = cell.pass ? 'PASS' : 'FAIL';
    console.log(`[${verdict}] ${cell.name} · home (fine-pointer control)`);
    cell.checks.filter((c) => !c.pass).forEach((c) =>
      console.log(`    ✗ ${c.id}: ${JSON.stringify(c.value)} (expected ${c.expected})`));
  }

  await browser.close().catch(() => {});
  const failed = cells.filter((c) => !c.pass).length;
  const report = {
    _meta: {
      tool: 'scripts/visual-qa/shell-probe.mjs (W-DS Phase 6 · Gate G-6, error mode)',
      spec: 'VISUAL-QA-CHECKLIST.md §3 B-5/B-6 · RESPONSIVE-ARCHITECTURE.md §1 R-RES-1a/1b',
      generatedAt: new Date().toISOString(),
      base: BASE,
      phoneReference: { physicalWidth: PHYSICAL_W, layoutWidth: DESKTOPMODE_W, scale: +SCALE.toFixed(4) },
      routes: routes.map((r) => r.slug),
    },
    summary: { cells: cells.length, passed: cells.length - failed, failed },
    cells,
  };
  if (OUT) {
    fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
    fs.writeFileSync(path.resolve(OUT), JSON.stringify(report, null, 1));
    console.log(`report → ${path.resolve(OUT)}`);
  }
  console.log(`\nG-6 shell probe: ${cells.length - failed}/${cells.length} cells PASS${failed ? ` · ${failed} FAIL` : ''}`);
  process.exit(failed ? 1 : 0);
})();
