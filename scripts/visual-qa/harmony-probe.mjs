#!/usr/bin/env node
// ============================================================================
// W-6 page-harmony probe (HIE-01 / SPC-02 / SPC-03 / ACC-02 / INT-03 / RES-02)
// ----------------------------------------------------------------------------
// The W-6 wave's before/after instrument. Where capture.mjs freezes the
// 100-cell baseline and shell-probe.mjs guards the chrome invariants, THIS
// probe measures the cross-route HARMONY metrics the audit flagged:
//
//   • HIE-01 — the page-h1 census: distinct computed h1 sizes across the 19
//     app routes @390 (audit measured 5: 37.05/34/33.15/28/23). One ramp
//     level (--mj-text-h1) = 1 distinct value.
//   • SPC-02/03 — the section-rhythm census: per-family medians of the gaps
//     between top-level page sections (children of .universal-route-frame)
//     plus the in-page sub-section gaps, with min (SPC-03 zero-gap floor).
//   • ACC-02 — the focus-ring census: computed :focus-visible outline width
//     /color/offset on real keyboard focus (audit: 2.5px vs 3px split) and
//     the header kbd hint size (audit: 11px under the 12.5px code level).
//   • INT-03 — the alert-dot token: computed background of the notification
//     dot on the standard chrome (must be --u-alert #ef4444).
//   • RES-02/D-2 — the tablet composition @768 fine pointer: labeled
//     expanded sidebar that PUSHES content (owner-accepted default), labels
//     visible; rail stays the user-collapsed choice.
//   • A-2 guard — zero horizontal overflow @390 on every probed route.
//
// Usage:
//   node scripts/visual-qa/harmony-probe.mjs [--base http://localhost:3000]
//        [--out <report.json>] [--routes home,chat,settings]
//
// Exit code: 0 = report written (this is a measuring probe, not a gate —
// the W-6 acceptance verdicts live in the phase baseline README).
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
const ROUTES_FILTER = flag('--routes') ? flag('--routes').split(',').map((s) => s.trim()) : null;

const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  try {
    ({ chromium } = require_('playwright-core'));
  } catch {
    console.error('[harmony-probe] playwright is not resolvable (npm i -D playwright && npx playwright install chromium)');
    process.exit(1);
  }
}

// The 19 app routes with their audit family classification (SPC-02 medians
// were measured per family: domain 14px · home 22px · ops 30.1px ·
// usage/billing 41.1px — the harmony target is ONE shared rhythm).
const ROUTES = [
  { slug: 'home', path: '/ar/app/home', family: 'home' },
  { slug: 'chat', path: '/ar/app/chat', family: 'gateway' },
  { slug: 'learn', path: '/ar/app/learn', family: 'domain' },
  { slug: 'research', path: '/ar/app/research', family: 'domain' },
  { slug: 'create', path: '/ar/app/create', family: 'domain' },
  { slug: 'code', path: '/ar/app/code', family: 'domain' },
  { slug: 'analyze', path: '/ar/app/analyze', family: 'domain' },
  { slug: 'explore', path: '/ar/app/explore', family: 'domain' },
  { slug: 'library', path: '/ar/app/library', family: 'library' },
  { slug: 'settings', path: '/ar/app/settings', family: 'ops' },
  { slug: 'projects', path: '/ar/app/projects', family: 'ops' },
  { slug: 'agents', path: '/ar/app/agents', family: 'ops' },
  { slug: 'flows', path: '/ar/app/flows', family: 'ops' },
  { slug: 'knowledge', path: '/ar/app/knowledge', family: 'ops' },
  { slug: 'models', path: '/ar/app/models', family: 'ops' },
  { slug: 'runs', path: '/ar/app/runs', family: 'ops' },
  { slug: 'team', path: '/ar/app/team', family: 'ops' },
  { slug: 'usage', path: '/ar/app/usage', family: 'usage' },
  { slug: 'billing', path: '/ar/app/billing', family: 'usage' },
].filter((r) => !ROUTES_FILTER || ROUTES_FILTER.includes(r.slug));

// Per-cell measurement payload (same DOM method as capture.mjs §section-rhythm).
const MEASURE = () => {
  const $ = (s) => document.querySelector(s);
  const de = document.documentElement;
  const frame = $('.universal-route-frame');
  const h1 = $('main h1') || $('.mj-section__title');
  const px = (v) => (v == null ? null : +v.toFixed(1));

  const out = {
    hOverflow: de.scrollWidth > de.clientWidth + 1,
  };

  if (h1) {
    const s = getComputedStyle(h1);
    out.h1 = { fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, text: h1.textContent.trim().slice(0, 40) };
  }

  const gapsOf = (list) => {
    const g = [];
    // Flow sections only: absolutely-positioned/fixed veils and overlays do
    // not participate in the rhythm (their rects are meaningless for gaps).
    const flow = list.filter((k) => { const p = getComputedStyle(k).position; return p !== 'absolute' && p !== 'fixed'; });
    for (let i = 1; i < flow.length; i++) g.push(+(flow[i].getBoundingClientRect().top - flow[i - 1].getBoundingClientRect().bottom).toFixed(1));
    return g;
  };
  const stat = (g) => (g.length ? { count: g.length, min: Math.min(...g), median: g.slice().sort((a, b) => a - b)[Math.floor(g.length / 2)], max: Math.max(...g), values: g.slice(0, 24) } : { count: 0, min: null, median: null, max: null, values: [] });

  if (frame) {
    const kids = Array.from(frame.children).filter((k) => k.getBoundingClientRect().height > 4);
    out.sectionGaps = stat(gapsOf(kids));
    const root = kids[0];
    if (root) {
      const subs = Array.from(root.children).filter((k) => k.getBoundingClientRect().height > 4);
      out.subSectionGaps = { root: root.tagName.toLowerCase() + '.' + String(root.className).split(' ')[0], ...stat(gapsOf(subs)) };
    }
  }
  return out;
};

// The shell-level measurements (run on one route — global chrome facts).
const SHELL_MEASURE = () => {
  const $ = (s) => document.querySelector(s);
  const px = (v) => (v == null ? null : +v.toFixed(1));
  const out = {};

  // INT-03: the notification dot must carry the single --u-alert token.
  const dot = $('.universal-shell-actions > button > i');
  if (dot) out.alertDot = getComputedStyle(dot).backgroundColor;

  // ACC-02: the header kbd hint rides the code level (audit: 11px raw).
  const kbd = $('.universal-shell-search kbd');
  if (kbd) out.kbd = { fontSize: getComputedStyle(kbd).fontSize, text: kbd.textContent.trim() };

  // RES-02/D-2 @768 fine: labeled expanded sidebar that PUSHES content.
  const sidebar = $('.universal-shell-sidebar');
  const main = $('#main-content');
  const label = $('.universal-shell-link > b');
  if (sidebar && main) {
    const sr = sidebar.getBoundingClientRect();
    const mr = main.getBoundingClientRect();
    const s = getComputedStyle(main);
    out.tablet = {
      sidebarWidth: px(sr.width),
      sidebarVisible: getComputedStyle(sidebar).visibility === 'visible' && sr.width > 0,
      mainInlineStartMargin: s.marginInlineStart,
      mainPushed: document.documentElement.dir === 'rtl' ? px(window.innerWidth - mr.right) : px(mr.left),
      labelVisible: label ? getComputedStyle(label).display !== 'none' && label.getBoundingClientRect().width > 0 : null,
      dataSidebar: $('.universal-app-shell')?.getAttribute('data-sidebar'),
    };
  }
  return out;
};

// ACC-02: real keyboard focus (:focus-visible) — Tab until the active
// element lands inside main, then read the computed outline.
const FOCUS_STEPS = 14;
const FOCUS_MEASURE = () => {
  const el = document.activeElement;
  if (!el) return null;
  const s = getComputedStyle(el);
  return {
    selector: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''),
    matchesFocusVisible: el.matches(':focus-visible'),
    outlineWidth: s.outlineWidth,
    outlineStyle: s.outlineStyle,
    outlineColor: s.outlineColor,
    outlineOffset: s.outlineOffset,
  };
};

const run = async () => {
  const browser = await chromium.launch();
  const report = { base: BASE, generatedAt: new Date().toISOString(), cells: [], shell: null, focus: null };

  // --- Pass 1: 390 (h1 + rhythm + overflow) and 1440 (ramp ceiling) -------
  // Measurements run under emulated prefers-reduced-motion: ScrollFx reveals
  // everything immediately and the route-enter animation is disabled, so
  // every rect is the SETTLED layout (no mid-flight reveal transforms).
  for (const vp of [{ name: '390', width: 390, height: 844 }, { name: '1440', width: 1440, height: 900 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.name === '390', hasTouch: vp.name === '390', reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      await page.goto(BASE + route.path, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // The domain workspaces hydrate client-side — wait for the page h1 to
      // actually mount before measuring (deterministic, no fixed-time race).
      await page.waitForSelector('main h1, .mj-section__title', { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(350);
      const cell = await page.evaluate(MEASURE);
      report.cells.push({ route: route.slug, family: route.family, vp: vp.name, ...cell });
    }
    await ctx.close();
  }

  // --- Pass 2: the shell facts @768 fine (D-2 tablet) and @1024 (kbd) -----
  for (const vp of [{ name: '768', width: 768, height: 1024 }, { name: '1024', width: 1024, height: 768 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/ar/app/home', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(250);
    const shell = await page.evaluate(SHELL_MEASURE);
    report.shell = report.shell || {};
    report.shell[vp.name] = shell;

    // Focus census on home + settings (layered universal vs ops prototype).
    if (vp.name === '1024') {
      report.focus = { home: null, settings: null };
      for (const slug of ['home', 'settings']) {
        await page.goto(`${BASE}/ar/app/${slug}`, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(250);
        for (let i = 0; i < FOCUS_STEPS; i++) {
          await page.keyboard.press('Tab');
          const inside = await page.evaluate(() => {
            const el = document.activeElement;
            return !!el && !!el.closest('main') && el.matches(':focus-visible');
          });
          if (inside) break;
        }
        report.focus[slug] = await page.evaluate(FOCUS_MEASURE);
      }
    }
    await ctx.close();
  }

  await browser.close();

  // ---- Summary -------------------------------------------------------------
  const at = (vp) => report.cells.filter((c) => c.vp === vp);
  const h1Sizes = (vp) => [...new Set(at(vp).map((c) => c.h1?.fontSize).filter(Boolean))].sort();
  const familyRhythm = (vp) => {
    const fams = {};
    for (const c of at(vp)) {
      if (!fams[c.family]) fams[c.family] = [];
      const med = c.subSectionGaps?.count ? c.subSectionGaps.median : c.sectionGaps?.median;
      if (med != null) fams[c.family].push(med);
    }
    const out = {};
    for (const [f, vals] of Object.entries(fams)) out[f] = { routes: vals.length, median: vals.slice().sort((a, b) => a - b)[Math.floor(vals.length / 2)] };
    return out;
  };
  const minGap = (vp) => {
    const mins = at(vp).map((c) => (c.subSectionGaps?.count ? c.subSectionGaps.min : c.sectionGaps?.min)).filter((v) => v != null);
    return mins.length ? Math.min(...mins) : null;
  };
  report.summary = {
    h1: {
      distinct390: h1Sizes('390'),
      distinct390Count: h1Sizes('390').length,
      distinct1440: h1Sizes('1440'),
      distinct1440Count: h1Sizes('1440').length,
    },
    rhythm: {
      families390: familyRhythm('390'),
      families1440: familyRhythm('1440'),
      minGap390: minGap('390'),
    },
    overflow390: at('390').filter((c) => c.hOverflow).map((c) => c.route),
    shell: report.shell,
    focus: report.focus,
  };

  const json = JSON.stringify(report, null, 2);
  if (OUT) {
    const outPath = path.resolve(ROOT, OUT);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, json);
    console.log(`[harmony-probe] report → ${OUT}`);
  }
  const s = report.summary;
  console.log(`
W-6 harmony probe — ${ROUTES.length} routes
  HIE-01  h1 distinct @390 : ${s.h1.distinct390Count} (${(s.h1.distinct390 || []).join(' · ') || '—'})
          h1 distinct @1440: ${s.h1.distinct1440Count} (${(s.h1.distinct1440 || []).join(' · ') || '—'})
  SPC-02  family medians @390: ${Object.entries(s.rhythm.families390).map(([f, v]) => `${f}=${v.median}`).join(' · ')}
          min inter-section gap @390: ${s.rhythm.minGap390}
  A-2     hOverflow @390: ${s.overflow390.length ? s.overflow390.join(',') : 'none'}
  D-2     tablet @768: ${JSON.stringify(report.shell?.['768']?.tablet || null)}
  ACC-02  kbd @1024: ${JSON.stringify(report.shell?.['1024']?.kbd || null)}
          focus home: ${JSON.stringify(report.focus?.home || null)}
          focus settings: ${JSON.stringify(report.focus?.settings || null)}
  INT-03  alert dot @768: ${report.shell?.['768']?.alertDot || '—'} @1024: ${report.shell?.['1024']?.alertDot || '—'}
`);
};

run().catch((e) => { console.error('[harmony-probe] failed:', e); process.exit(1); });
