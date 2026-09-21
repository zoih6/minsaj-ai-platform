#!/usr/bin/env node
// ============================================================================
// W-DS visual-QA capture (Phase 0 · the baseline tool behind Gate B metrics)
// ----------------------------------------------------------------------------
// Ports the W-DS forensic-audit capture tooling into the repo so every phase
// can re-measure with the SAME method and compare against the recorded
// baselines (VISUAL-QA-CHECKLIST.md §1 capture protocol):
//
//   • 20 primary routes × 5 viewports (390/430/768/1024/1440), ar (RTL)
//     + drawer/command-palette probes @390 + en LTR references.
//   • DOM measurements with selectors for every number (chrome geometry,
//     vertical budget, section rhythm, surface census, typography census,
//     tap targets, accent census, overflow offenders).
//   • Aggregate built in the exact format of the audit baseline
//     (docs/03-design/reconstruction/evidence/measurements/aggregate.json)
//     so `--compare` yields a per-cell zero-drift report.
//
// Usage:
//   node scripts/visual-qa/capture.mjs [--base http://localhost:3000]
//        [--out <dir>] [--quick] [--shots none|lite|full] [--no-shots]
//        [--compare <previous-aggregate.json>] [--aggregate-only <dir>]
//
// Requires `playwright` (or `playwright-core`) resolvable from the repo —
// browsers via `npx playwright install chromium`. Measurements only need a
// running build (dev or prod server); prod (`next start`) is recommended so
// screenshots carry no dev overlay.
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');

// ---- CLI -------------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3000';
const OUT = path.resolve(ROOT, flag('--out') || 'qa-captures');
const QUICK = args.includes('--quick');
const COMPARE = flag('--compare');
const AGG_ONLY = flag('--aggregate-only');
const ROUTES_FILTER = flag('--routes') ? flag('--routes').split(',').map((s) => s.trim()) : null;
let SHOTS = 'full';
if (args.includes('--no-shots') || flag('--shots') === 'none') SHOTS = 'none';
else if (flag('--shots') === 'lite') SHOTS = 'lite';

// ---- Playwright resolution (playwright or playwright-core) ------------------
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium;
try {
  ({ chromium } = require_('playwright'));
} catch {
  try {
    ({ chromium } = require_('playwright-core'));
  } catch {
    console.error(
      '[capture] playwright is not resolvable. Install it (npm i -D playwright && npx playwright install chromium)\n' +
        'or run from an environment where playwright is available (global install works too).'
    );
    process.exit(1);
  }
}

const VIEWPORTS = [
  { name: '390', width: 390, height: 844 },
  { name: '430', width: 430, height: 932 },
  { name: '768', width: 768, height: 1024 },
  { name: '1024', width: 1024, height: 768 },
  { name: '1440', width: 1440, height: 900 },
];

const ROUTES = [
  { slug: 'landing', path: '/ar', kind: 'marketing' },
  { slug: 'home', path: '/ar/app/home' },
  { slug: 'chat', path: '/ar/app/chat' },
  { slug: 'learn', path: '/ar/app/learn' },
  { slug: 'research', path: '/ar/app/research' },
  { slug: 'create', path: '/ar/app/create' },
  { slug: 'code', path: '/ar/app/code' },
  { slug: 'analyze', path: '/ar/app/analyze' },
  { slug: 'explore', path: '/ar/app/explore' },
  { slug: 'library', path: '/ar/app/library' },
  { slug: 'settings', path: '/ar/app/settings' },
  { slug: 'projects', path: '/ar/app/projects' },
  { slug: 'agents', path: '/ar/app/agents' },
  { slug: 'flows', path: '/ar/app/flows' },
  { slug: 'knowledge', path: '/ar/app/knowledge' },
  { slug: 'models', path: '/ar/app/models' },
  { slug: 'runs', path: '/ar/app/runs' },
  { slug: 'usage', path: '/ar/app/usage' },
  { slug: 'billing', path: '/ar/app/billing' },
  { slug: 'team', path: '/ar/app/team' },
];

// Measurement function injected into the page — verbatim port of the W-DS
// forensic-audit MEASURE (every number carries a selector/DOM path).
const MEASURE = () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) };
  };
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const vh = window.innerHeight;

  // ---------- CHROME ----------
  const topbar = $('.universal-shell-topbar');
  const topbarCS = cs(topbar);
  const contextRow = $('.universal-shell-context');
  const searchBtn = $('.universal-shell-search');
  const bottomNav = $('.universal-shell-mobile-nav');
  const bottomNavCS = cs(bottomNav);
  const sidebar = $('.universal-shell-sidebar');
  const content = $('#main-content');
  const contentFrame = $('.universal-route-frame');

  const chrome = {
    topbar: null, contextRow: null, search: null, bottomNav: null, sidebar: null,
  };
  if (topbar) {
    chrome.topbar = {
      selector: '.universal-shell-topbar',
      rect: rect(topbar),
      position: topbarCS.position, zIndex: topbarCS.zIndex,
      background: topbarCS.backgroundColor,
      backdropFilter: topbarCS.backdropFilter,
      borderBottom: topbarCS.borderBottomColor,
    };
    chrome.contextRow = { selector: '.universal-shell-context', rect: rect(contextRow), title: contextRow?.querySelector('span')?.textContent?.trim() };
    chrome.search = { selector: '.universal-shell-search', rect: rect(searchBtn), display: searchBtn ? cs(searchBtn).display : 'absent' };
  }
  if (bottomNav) {
    const items = $$('.universal-shell-mobile-nav a');
    chrome.bottomNav = {
      selector: '.universal-shell-mobile-nav',
      rect: rect(bottomNav), display: bottomNavCS.display, position: bottomNavCS.position,
      background: bottomNavCS.backgroundColor, backdropFilter: bottomNavCS.backdropFilter,
      boxShadow: bottomNavCS.boxShadow, borderRadius: bottomNavCS.borderRadius,
      itemCount: items.length,
      itemRects: items.map((a) => ({ label: a.textContent.trim(), rect: rect(a) })),
    };
  }
  if (sidebar) chrome.sidebar = { selector: '.universal-shell-sidebar', rect: rect(sidebar), transform: cs(sidebar).transform, visibility: cs(sidebar).visibility };

  // Marketing header fallback
  const msHeader = $('.ms-header');
  if (msHeader) {
    chrome.topbar = { selector: '.ms-header', rect: rect(msHeader), position: cs(msHeader).position, zIndex: cs(msHeader).zIndex, background: cs(msHeader).backgroundColor };
  }

  // ---------- CONTENT GEOMETRY ----------
  const geom = { viewport: { w: window.innerWidth, h: vh }, docHeight: document.documentElement.scrollHeight };
  const firstChild = contentFrame?.firstElementChild;
  geom.firstContent = {
    selector: firstChild ? firstChild.tagName.toLowerCase() + (firstChild.className && typeof firstChild.className === 'string' ? '.' + firstChild.className.split(' ')[0] : '') : null,
    rect: rect(firstChild),
    offsetBelowTopbar: topbar && firstChild ? +(firstChild.getBoundingClientRect().top - topbar.getBoundingClientRect().bottom).toFixed(1) : null,
  };
  if (content) {
    const ccs = cs(content);
    geom.content = { selector: '#main-content', rect: rect(content), paddingTop: ccs.paddingTop, paddingBottom: ccs.paddingBottom, paddingInline: ccs.paddingInline };
  }
  if (bottomNav && contentFrame) {
    const kids = Array.from(contentFrame.children).filter((k) => k.getBoundingClientRect().height > 0);
    const last = kids[kids.length - 1];
    if (last) geom.lastContent = { selector: last.tagName.toLowerCase() + '.' + String(last.className).split(' ')[0], rect: rect(last), gapToBottomNav: +(bottomNav.getBoundingClientRect().top - last.getBoundingClientRect().bottom).toFixed(1) };
  }
  const topH = topbar?.getBoundingClientRect().height ?? msHeader?.getBoundingClientRect().height ?? 0;
  const botH = bottomNav && cs(bottomNav).display !== 'none' ? bottomNav.getBoundingClientRect().height : 0;
  geom.verticalBudget = {
    viewportH: vh, chromeTop: +topH.toFixed(1), chromeBottom: +botH.toFixed(1),
    contentVisible: +(vh - topH - botH).toFixed(1),
    chromeRatio: +(((topH + botH) / vh) * 100).toFixed(1),
  };

  // ---------- HORIZONTAL OVERFLOW ----------
  const de = document.documentElement;
  const hOverflow = { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, overflowing: de.scrollWidth > de.clientWidth + 1, offenders: [] };
  if (hOverflow.overflowing) {
    $$('.universal-app-shell *, .universal-site *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
        if (hOverflow.offenders.length < 8) hOverflow.offenders.push({ sel: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], right: +r.right.toFixed(1), left: +r.left.toFixed(1) });
      }
    });
  }
  geom.hOverflow = hOverflow;

  // ---------- PAGE TITLE / SEARCH BLOCKS ----------
  const h1 = $('main h1') || $('.mj-section__title');
  const titleCS = cs(h1);
  const titles = {};
  if (h1) {
    titles.h1 = { selector: 'main h1', text: h1.textContent.trim().slice(0, 60), rect: rect(h1), fontSize: titleCS.fontSize, fontWeight: titleCS.fontWeight, lineHeight: titleCS.lineHeight, letterSpacing: titleCS.letterSpacing, color: titleCS.color };
  }
  $$('main h2').slice(0, 3).forEach((h, i) => { const s = cs(h); titles['h2_' + i] = { text: h.textContent.trim().slice(0, 40), fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight }; });
  geom.titles = titles;

  const pageSearch = $$('main input[type="search"], main input[placeholder*="بحث"], main .mj-control-bar__group').length;
  geom.pageSearchControls = pageSearch;

  // ---------- SECTION RHYTHM ----------
  if (contentFrame) {
    const kids = Array.from(contentFrame.children).filter((k) => k.getBoundingClientRect().height > 4);
    const gapsof = (list) => { const g = []; for (let i = 1; i < list.length; i++) g.push(+(list[i].getBoundingClientRect().top - list[i - 1].getBoundingClientRect().bottom).toFixed(1)); return g; };
    const gaps = gapsof(kids);
    geom.sectionGaps = { count: gaps.length, values: gaps, min: Math.min(...gaps, 0), max: Math.max(...gaps, 0), median: gaps.length ? gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : 0 };
    geom.sectionCount = kids.length;
    geom.sectionHeights = kids.map((k) => +k.getBoundingClientRect().height.toFixed(0)).slice(0, 20);
    const pageRoot = kids[0];
    if (pageRoot) {
      const subs = Array.from(pageRoot.children).filter((k) => k.getBoundingClientRect().height > 4);
      const sgaps = gapsof(subs);
      geom.subSectionGaps = { rootSelector: pageRoot.tagName.toLowerCase() + '.' + String(pageRoot.className).split(' ')[0], count: sgaps.length, values: sgaps.slice(0, 24), min: Math.min(...sgaps, 0), max: Math.max(...sgaps, 0), median: sgaps.length ? sgaps.slice().sort((a, b) => a - b)[Math.floor(sgaps.length / 2)] : 0 };
      geom.subSectionCount = subs.length;
    }
  }

  // ---------- SURFACE CENSUS (card inflation) ----------
  const mainRoot = $('main') || document.body;
  const cardLike = [];
  const isCardLike = (el, s) => {
    const hasBorder = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
    const hasShadow = s.boxShadow !== 'none';
    const hasRadius = parseFloat(s.borderTopLeftRadius) > 4;
    const hasBg = s.backgroundColor !== 'rgba(0, 0, 0, 0)' || (s.backgroundImage && s.backgroundImage !== 'none');
    return (hasBorder || hasShadow) && hasRadius && el.getBoundingClientRect().height > 24 && el.getBoundingClientRect().width > 60;
  };
  $$('*', mainRoot).forEach((el) => {
    const s = getComputedStyle(el);
    if (isCardLike(el, s)) {
      let depth = 0; let p = el.parentElement;
      while (p && p !== document.body) { const ps = getComputedStyle(p); if (isCardLike(p, ps)) depth++; p = p.parentElement; }
      cardLike.push({
        sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''),
        radius: s.borderTopLeftRadius, shadow: s.boxShadow === 'none' ? 'none' : 'shadow',
        borderW: s.borderTopWidth, depth,
      });
    }
  });
  const radiusHist = {}; const shadowCount = { none: 0, shadow: 0 }; const depthHist = {};
  cardLike.forEach((c) => {
    radiusHist[c.radius] = (radiusHist[c.radius] || 0) + 1;
    shadowCount[c.shadow]++; depthHist['d' + c.depth] = (depthHist['d' + c.depth] || 0) + 1;
  });
  const surfaces = {
    cardLikeCount: cardLike.length,
    perViewportArea: cardLike.length,
    radiusHistogram: radiusHist,
    shadowUsage: shadowCount,
    nestingDepthHistogram: depthHist,
    nestedPairs: cardLike.filter((c) => c.depth >= 1).length,
    distinctRadiusValues: Object.keys(radiusHist).length,
    topSelectors: Object.entries(cardLike.reduce((a, c) => { a[c.sel] = (a[c.sel] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]).slice(0, 10),
  };

  // ---------- TYPOGRAPHY CENSUS ----------
  const typeCensus = {};
  const sample = (sel) => { const el = $(sel, mainRoot); if (!el) return; const s = getComputedStyle(el); typeCensus[sel] = { fontSize: s.fontSize, fontWeight: s.fontWeight, lineHeight: s.lineHeight, letterSpacing: s.letterSpacing, fontFamily: s.fontFamily.split(',')[0].replace(/"/g, ''), color: s.color }; };
  ['main h1', 'main h2', 'main h3', 'main p', 'main button', 'main small', 'main [class*="badge"]', 'main [class*="pill"]', 'main kbd', 'main [class*="caption"]'].forEach(sample);

  const fsHist = {};
  $$('main *', mainRoot).concat(mainRoot.tagName === 'MAIN' ? [mainRoot] : []).forEach((el) => {
    if (!el.childNodes.length) return;
    let hasText = false;
    el.childNodes.forEach((n) => { if (n.nodeType === 3 && n.textContent.trim()) hasText = true; });
    if (!hasText) return;
    const fs = getComputedStyle(el).fontSize;
    fsHist[fs] = (fsHist[fs] || 0) + 1;
  });
  const typography = { samples: typeCensus, fontSizeHistogram: fsHist, distinctFontSizes: Object.keys(fsHist).length };

  // ---------- TAP TARGETS ----------
  const targets = [];
  $$('main button, main a, main [role="button"], main input, main [tabindex]:not([tabindex="-1"])').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    targets.push({ sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : ''), w: +r.width.toFixed(0), h: +r.height.toFixed(0) });
  });
  const tapTargets = {
    count: targets.length,
    under24: targets.filter((t) => t.w < 24 || t.h < 24).length,
    under32: targets.filter((t) => t.w < 32 || t.h < 32).length,
    under44: targets.filter((t) => t.w < 44 || t.h < 44).length,
    minW: Math.min(...targets.map((t) => t.w), 9999), minH: Math.min(...targets.map((t) => t.h), 9999),
    smallest: targets.slice().sort((a, b) => a.w * a.h - b.w * b.h).slice(0, 5),
  };

  // ---------- ACCENT / COLOR CENSUS ----------
  const bgHist = {}; const btnStyles = [];
  $$('main button, main a[class*="button"], main [class*="cta"]').slice(0, 60).forEach((el) => {
    const s = getComputedStyle(el);
    if (s.backgroundColor !== 'rgba(0, 0, 0, 0)') bgHist[s.backgroundColor] = (bgHist[s.backgroundColor] || 0) + 1;
    if (btnStyles.length < 8 && el.textContent.trim()) btnStyles.push({ text: el.textContent.trim().slice(0, 24), bg: s.backgroundColor, color: s.color, radius: s.borderTopLeftRadius, h: +el.getBoundingClientRect().height.toFixed(0) });
  });
  const accents = { buttonBgHistogram: Object.fromEntries(Object.entries(bgHist).sort((a, b) => b[1] - a[1]).slice(0, 10)), sampledButtons: btnStyles };

  const svc = document.querySelector('[data-service]');
  const service = svc ? { attr: svc.getAttribute('data-service'), color: getComputedStyle(svc).getPropertyValue('--service').trim() } : null;

  return { chrome, geom, surfaces, typography, tapTargets, accents, service, capturedAt: new Date().toISOString() };
};

// Drawer + command palette measurement (mobile)
const MEASURE_DRAWER = () => {
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const groups = $$('.universal-shell-nav__group, .universal-shell-nav__utility');
  return {
    groups: groups.map((g) => {
      const label = g.querySelector('.universal-shell-nav__label')?.textContent.trim() ?? (g.classList.contains('universal-shell-nav__utility') ? '(utility: unlabelled)' : '(unlabelled)');
      const links = Array.from(g.querySelectorAll('.universal-shell-link')).map((l) => {
        const s = getComputedStyle(l);
        return { label: l.textContent.trim(), fontSize: s.fontSize, minHeight: s.minHeight, height: +l.getBoundingClientRect().height.toFixed(0) };
      });
      return { label, linkCount: links.length, links };
    }),
    totalLinks: $$('.universal-shell-link').length,
    drawerHeight: document.querySelector('.universal-shell-sidebar')?.getBoundingClientRect().height,
    scrollable: (() => { const n = document.querySelector('.universal-shell-nav'); return n ? n.scrollHeight > n.clientHeight : null; })(),
  };
};

async function settle(page) {
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  await page.waitForTimeout(1600);
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y <= h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 90)); }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
  });
}

// ---- Aggregate (exact format of the audit baseline aggregate.json) ----------
function buildAggregate(dir) {
  const rows = [];
  for (const route of ROUTES) {
    for (const vp of VIEWPORTS) {
      const f = path.join(dir, route.slug, `${vp.name}.json`);
      if (!fs.existsSync(f)) continue;
      const d = JSON.parse(fs.readFileSync(f, 'utf8'));
      if ('error' in d) continue;
      const g = d.geom || {};
      const s = d.surfaces || {};
      const t = d.typography || {};
      const tt = d.tapTargets || {};
      const sub = g.subSectionGaps || {};
      const vb = g.verticalBudget || {};
      rows.push({
        route: route.slug, vp: vp.name,
        topbarH: vb.chromeTop, bottomNavH: vb.chromeBottom,
        chromeRatio: vb.chromeRatio,
        contentVisible: vb.contentVisible,
        firstContentOffset: (g.firstContent || {}).offsetBelowTopbar,
        hOverflow: (g.hOverflow || {}).overflowing,
        docHeight: g.docHeight,
        cards: s.cardLikeCount,
        nestedCards: s.nestedPairs,
        maxDepth: Math.max(0, ...Object.keys(s.nestingDepthHistogram || {}).map((k) => parseInt(k.slice(1)) || 0)),
        distinctRadius: s.distinctRadiusValues,
        radiusHist: s.radiusHistogram,
        shadowedCards: (s.shadowUsage || {}).shadow,
        distinctFontSizes: t.distinctFontSizes,
        fsHist: t.fontSizeHistogram,
        tapCount: tt.count, tapUnder32: tt.under32, tapUnder44: tt.under44,
        secCount: g.subSectionCount, secGapsMedian: sub.median,
        secGapsMin: sub.min, secGapsMax: sub.max,
        secGapValues: sub.values,
        titleSize: ((g.titles || {}).h1 || {}).fontSize || null,
      });
    }
  }
  return rows;
}

// ---- Zero-drift compare vs a previous aggregate -----------------------------
function compareAggregates(prevRows, nextRows) {
  const key = (r) => `${r.route}@${r.vp}`;
  const prev = new Map(prevRows.map((r) => [key(r), r]));
  const fields = ['topbarH', 'bottomNavH', 'chromeRatio', 'contentVisible', 'hOverflow', 'cards', 'nestedCards', 'distinctRadius', 'distinctFontSizes', 'titleSize', 'tapUnder44'];
  const diffs = [];
  let compared = 0;
  for (const n of nextRows) {
    const p = prev.get(key(n));
    if (!p) { diffs.push({ cell: key(n), note: 'no previous cell' }); continue; }
    compared++;
    for (const f of fields) {
      if (JSON.stringify(p[f]) !== JSON.stringify(n[f]))
        diffs.push({ cell: key(n), field: f, before: p[f], after: n[f] });
    }
    // docHeight tolerated ±4px (image/font load jitter — not a layout signal)
    if (p.docHeight != null && n.docHeight != null && Math.abs(p.docHeight - n.docHeight) > 4)
      diffs.push({ cell: key(n), field: 'docHeight', before: p.docHeight, after: n.docHeight, note: 'beyond ±4px tolerance' });
  }
  return { compared, diffs };
}

// ---- Main -------------------------------------------------------------------
(async () => {
  if (AGG_ONLY) {
    const rows = buildAggregate(AGG_ONLY === true ? OUT : path.resolve(AGG_ONLY));
    fs.writeFileSync(path.join(path.resolve(AGG_ONLY), 'aggregate.json'), JSON.stringify(rows, null, 1));
    console.log(`aggregate: ${rows.length} cells → ${path.join(AGG_ONLY, 'aggregate.json')}`);
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const index = [];
  const routes = ROUTES_FILTER ? ROUTES.filter((r) => ROUTES_FILTER.includes(r.slug)) : QUICK ? ROUTES.slice(0, 4) : ROUTES;
  const viewports = QUICK ? VIEWPORTS.slice(0, 2) : VIEWPORTS;
  const takeShots = SHOTS !== 'none';

  // --disable-dev-shm-usage: containers ship a 64MB /dev/shm that crashes
  // Chromium on real content; force /tmp-backed shared memory instead.
  const launch = () => chromium.launch({ args: ['--disable-dev-shm-usage'] });
  let browser = await launch();
  const newCtx = (b, vp) =>
    b.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.width < 768,
      hasTouch: vp.width < 768,
    });
  const isDead = (e) => /closed|Target|Crash|Navigation failed/i.test(String(e));

  // One capture cell: goto + settle + shots + measurements (+ home probes).
  async function captureCell(page, route, vp) {
    const url = BASE + route.path;
    // Bounded load strategy: domcontentloaded fires fast; networkidle is
    // best-effort (8s cap) because mock-api polling can keep the network
    // busy forever. The settle() step (fonts + 1600ms) does the real
    // stabilization — same as the audit method.
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await settle(page);

    const dir = path.join(OUT, route.slug);
    fs.mkdirSync(dir, { recursive: true });
    const shot = async (name, opts = {}) =>
      page.screenshot({ path: path.join(dir, `${vp.name}-${name}.jpg`), type: 'jpeg', quality: 82, ...opts });
    if (takeShots && (SHOTS === 'full' || ['390', '1440'].includes(vp.name))) await shot('viewport');
    if (takeShots && SHOTS === 'full' && ['390', '1440'].includes(vp.name)) {
      await scrollThrough(page);
      await shot('full', { fullPage: true });
    }
    if (takeShots && SHOTS === 'full' && vp.name === '390' && route.slug !== 'landing') {
      await page.evaluate(() => window.scrollTo(0, 600));
      await page.waitForTimeout(400);
      await shot('scrolled600');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
    }
    const data = await page.evaluate(MEASURE).catch((e) => ({ error: String(e) }));
    data.route = route.slug; data.path = route.path; data.viewportName = vp.name;
    fs.writeFileSync(path.join(dir, `${vp.name}.json`), JSON.stringify(data, null, 1));
    index.push({ route: route.slug, viewport: vp.name, json: `${route.slug}/${vp.name}.json`, chromeRatio: data.geom?.verticalBudget?.chromeRatio ?? null, hOverflow: data.geom?.hOverflow?.overflowing ?? null, cards: data.surfaces?.cardLikeCount ?? null, titleSize: data.geom?.titles?.h1?.fontSize ?? null });

    // interactive probes at 390 (home only) — audit parity
    if (vp.name === '390' && route.slug === 'home') {
      try {
        await page.click('.universal-shell-context > button');
        await page.waitForTimeout(600);
        if (takeShots) await shot('drawer-open');
        const drawer = await page.evaluate(MEASURE_DRAWER);
        fs.writeFileSync(path.join(OUT, 'drawer-390.json'), JSON.stringify(drawer, null, 1));
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      } catch (e) { fs.writeFileSync(path.join(OUT, 'drawer-390.json'), JSON.stringify({ error: String(e) })); }
      try {
        await page.keyboard.press('Control+k');
        await page.waitForTimeout(700);
        if (takeShots) await shot('command-palette');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      } catch {}
    }
  }

  // Resilient sweep: sandboxed Chromium dies intermittently under memory
  // pressure; a dead browser must relaunch and the cell retry, never abort
  // the run (baseline completeness is a Gate B requirement).
  for (const vp of viewports) {
    let ctx = await newCtx(browser, vp);
    let page = await ctx.newPage();
    for (const route of routes) {
      let done = false;
      for (let attempt = 1; attempt <= 3 && !done; attempt++) {
        try {
          await captureCell(page, route, vp);
          console.log(`captured ${route.slug} @ ${vp.name}`);
          done = true;
        } catch (e) {
          console.log(`  [retry ${attempt}] ${route.slug}@${vp.name}: ${String(e).split('\n')[0]}`);
          if (isDead(e)) {
            try { await browser.close(); } catch {}
            browser = await launch();
          }
          try { await ctx.close(); } catch {}
          ctx = await newCtx(browser, vp);
          page = await ctx.newPage();
        }
      }
      if (!done) console.log(`  [FAILED] ${route.slug}@${vp.name} after 3 attempts — cell left as-is`);
    }
    try { await ctx.close(); } catch {}
  }

  // English LTR references at 390 (audit parity)
  if (!QUICK) {
    for (const p of ['/en', '/en/app/home']) {
      const slug = p === '/en' ? 'en-landing' : 'en-home';
      try {
        const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        await page.goto(BASE + p, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
        await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
        await settle(page);
        fs.mkdirSync(path.join(OUT, slug), { recursive: true });
        if (takeShots) await page.screenshot({ path: path.join(OUT, slug, '390-viewport.jpg'), type: 'jpeg', quality: 82 });
        await ctx.close();
        console.log(`captured ${slug}`);
      } catch (e) {
        console.log(`  [FAILED] ${slug}: ${String(e).split('\n')[0]}`);
        try { await browser.close(); } catch {}
        browser = await launch();
      }
    }
  }

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 1));
  const rows = buildAggregate(OUT);
  fs.writeFileSync(path.join(OUT, 'aggregate.json'), JSON.stringify(rows, null, 1));
  console.log(`DONE. Captures: ${index.length} · aggregate cells: ${rows.length} → ${path.join(OUT, 'aggregate.json')}`);

  if (COMPARE) {
    const prevRows = JSON.parse(fs.readFileSync(path.resolve(COMPARE), 'utf8'));
    const { compared, diffs } = compareAggregates(prevRows, rows);
    console.log(`\nzero-drift compare vs ${COMPARE}: ${compared} cells compared, ${diffs.length} field diffs`);
    if (diffs.length === 0) console.log('VERDICT: IDENTICAL on all compared metrics — zero visual drift.');
    else {
      const byField = {};
      diffs.forEach((d) => { byField[d.field || d.note] = (byField[d.field || d.note] || 0) + 1; });
      console.log('diff counts by field:', byField);
      diffs.slice(0, 30).forEach((d) => console.log(`  ${d.cell} ${d.field || ''}: ${JSON.stringify(d.before)} → ${JSON.stringify(d.after)} ${d.note || ''}`));
    }
  }

  try { await browser.close(); } catch {}
})();
