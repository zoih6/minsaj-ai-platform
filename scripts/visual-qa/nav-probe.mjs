#!/usr/bin/env node
/* W-DS Phase 3 · NAV chrome supplementary probe.
   Measures the Phase 3 defect classes directly (before/after):

   NAV-01 dual header architecture  → topbar height + second-row detection
   NAV-02 vertical budget           → chromeRatio = (topbar+bottomNav)/vh
   NAV-03 identity announced twice  → header title text vs page h1
   NAV-04 dual dock dialects        → distinct bottomNav geometry signatures
   NAV-05 weightless drawer tiers   → link register census per group (drawer)

   node scripts/visual-qa/nav-probe.mjs --base http://localhost:3100 \
        --out <file.json> [--drawer] */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3100';
const OUT = flag('--out') || '/home/z/my-project/phase3-evidence/nav-probe.json';
const DO_DRAWER = args.includes('--drawer');

// Standard (non-focus-canvas) + focus-canvas families, both represented.
const ROUTES = {
  home: '/ar/app/home', settings: '/ar/app/settings', agents: '/ar/app/agents',
  knowledge: '/ar/app/knowledge', runs: '/ar/app/runs', usage: '/ar/app/usage',
  chat: '/ar/app/chat', code: '/ar/app/code', analyze: '/ar/app/analyze', explore: '/ar/app/explore',
};
const VPS = [{ name: '390', width: 390, height: 844 }, { name: '430', width: 430, height: 932 }];

const MEASURE = () => {
  const $ = (s) => document.querySelector(s);
  const rect = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: +r.top.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), width: +r.width.toFixed(1), height: +r.height.toFixed(1) }; };
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const vh = window.innerHeight;

  const topbar = $('.universal-shell-topbar');
  const context = $('.universal-shell-context');
  const search = $('.universal-shell-search');
  const bottomNav = $('.universal-shell-mobile-nav');
  const h1 = $('main h1') || $('.mj-section__title');

  const topbarCS = cs(topbar);
  const searchCS = cs(search);
  const navCS = cs(bottomNav);

  // NAV-01: second row = the search affordance sits on its own row below the
  // context row (topbar grid "search search" area), or is hidden (fc routes).
  const contextRect = rect(context);
  const searchRect = rect(search);
  const searchOnSecondRow = !!(searchRect && contextRect && searchCS.display !== 'none' && (searchRect.top - contextRect.top) > 10);

  // NAV-03: page identity in the header (context label span).
  const headerTitle = context ? (context.querySelector('span')?.textContent?.trim() || null) : null;

  // NAV-04: dock grammar signature.
  const navRect = rect(bottomNav);
  const dockGrammar = navCS && navCS.display !== 'none' && navRect
    ? [`insetL=${navRect.left.toFixed(0)}`, `insetR=${(+((window.innerWidth - navRect.right)).toFixed(0))}`, `radius=${navCS.borderTopLeftRadius}`, `shadow=${navCS.boxShadow === 'none' ? 'none' : 'shadow'}`, `bottomAnchor=${navCS.bottom}`].join(' ')
    : 'none';

  // NAV-02: vertical budget.
  const topH = topbar ? +topbar.getBoundingClientRect().height.toFixed(1) : 0;
  const botH = bottomNav && navCS.display !== 'none' ? +bottomNav.getBoundingClientRect().height.toFixed(1) : 0;

  return {
    topbarH: topH,
    topbarBg: topbarCS ? topbarCS.backgroundColor : null,
    searchDisplay: searchCS ? searchCS.display : 'absent',
    searchOnSecondRow,
    headerTitle,
    pageH1: h1 ? (h1.textContent || '').trim().slice(0, 40) : null,
    identityDuplicated: !!(headerTitle && h1 && headerTitle === (h1.textContent || '').trim()),
    bottomNavH: botH,
    dockGrammar,
    chromePx: +(topH + botH).toFixed(1),
    chromeRatio: +(((topH + botH) / vh) * 100).toFixed(1),
    itemCount: bottomNav ? bottomNav.querySelectorAll('a').length : 0,
  };
};

// NAV-05: drawer tier census — open the drawer, read every group's register.
// The register reads the RENDERED text (the <b> label) + row geometry (the
// link) + the icon chip — the audit measured the link element alone, which
// hides the label typography the tier system actually changes.
const MEASURE_DRAWER = () => {
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const groups = $$('.universal-shell-nav__group, .universal-shell-nav__utility, .universal-shell-pinned');
  const register = (l) => {
    const s = getComputedStyle(l);
    const b = l.querySelector(':scope > b');
    const bs = b ? getComputedStyle(b) : null;
    const chip = l.querySelector(':scope > span');
    const chipS = chip ? getComputedStyle(chip) : null;
    return {
      label: l.textContent.trim().slice(0, 24),
      rowMinHeight: s.minHeight,
      rowHeight: +l.getBoundingClientRect().height.toFixed(0),
      labelFontSize: bs ? bs.fontSize : null,
      labelFontWeight: bs ? bs.fontWeight : null,
      labelColor: bs ? bs.color : null,
      iconChipW: chipS ? chipS.width : null,
      iconChipBg: chipS ? chipS.backgroundColor : null,
    };
  };
  return {
    groups: groups.map((g) => {
      const label = g.querySelector('.universal-shell-nav__label')?.textContent.trim()
        ?? (g.classList.contains('universal-shell-nav__utility') ? '(utility: unlabelled)' : '(unlabelled)');
      const links = Array.from(g.querySelectorAll('.universal-shell-link')).map(register);
      const registers = [...new Set(links.map((l) => `${l.labelFontSize}/${l.labelFontWeight}/${l.rowMinHeight}`))];
      return { label, linkCount: links.length, registers, links: links.slice(0, 2) };
    }),
    totalLinks: $$('.universal-shell-link').length,
    distinctRegisters: [...new Set($$('.universal-shell-link').map((l) => {
      const b = l.querySelector(':scope > b'); const s = getComputedStyle(l);
      const bs = b ? getComputedStyle(b) : null;
      return `${bs ? bs.fontSize : '-'}/${bs ? bs.fontWeight : '-'}/${s.minHeight}`;
    }))],
    drawerHeight: document.querySelector('.universal-shell-sidebar')?.getBoundingClientRect().height,
    navScrollable: (() => { const n = document.querySelector('.universal-shell-nav'); return n ? n.scrollHeight > n.clientHeight : null; })(),
    operationsFolded: (() => { const d = document.querySelector('details[data-tier="operations"]'); return d ? !d.open : null; })(),
  };
};

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const result = { base: BASE, cells: {} };
for (const vp of VPS) {
  for (const [slug, route] of Object.entries(ROUTES)) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(900);
      const data = await page.evaluate(MEASURE);
      result.cells[`${slug}@${vp.name}`] = data;
      console.log(`${slug}@${vp.name}: topbar=${data.topbarH} chrome=${data.chromePx}px (${data.chromeRatio}%) row2=${data.searchOnSecondRow} title=${data.headerTitle ? 'yes' : 'no'} dock="${data.dockGrammar}"`);
    } catch (e) {
      result.cells[`${slug}@${vp.name}`] = { error: String(e) };
      console.log(`${slug}@${vp.name}: FAILED ${String(e).split('\n')[0]}`);
    }
    await ctx.close();
  }
}

if (DO_DRAWER) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/ar/app/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.click('.universal-shell-context > button');
    await page.waitForTimeout(700);
    result.drawer = await page.evaluate(MEASURE_DRAWER);
    console.log(`drawer: groups=${result.drawer.groups.map((g) => `${g.label}(${g.linkCount})`).join(' | ')}`);
    console.log(`drawer registers: ${result.drawer.distinctRegisters.join(' | ')}`);
  } catch (e) {
    result.drawer = { error: String(e) };
    console.log(`drawer: FAILED ${String(e).split('\n')[0]}`);
  }
  await ctx.close();
}
await browser.close();

// ---- aggregate verdicts ----
const cells390 = Object.entries(result.cells).filter(([k]) => k.endsWith('@390') && !result.cells[k].error).map(([, v]) => v);
const sig = (v) => v.dockGrammar;
result.verdict = {
  headerHeights390: [...new Set(cells390.map((v) => v.topbarH))],
  dualHeaderArchitecture: [...new Set(cells390.map((v) => v.topbarH))].length > 1,
  secondRowCells: cells390.filter((v) => v.searchOnSecondRow).length,
  identityDuplicatedCells: cells390.filter((v) => v.identityDuplicated).length,
  dockGrammars390: [...new Set(cells390.map(sig))],
  dockDialects: [...new Set(cells390.map(sig))].length,
  chromeRatio390: { min: Math.min(...cells390.map((v) => v.chromeRatio)), max: Math.max(...cells390.map((v) => v.chromeRatio)) },
  budget155: cells390.every((v) => v.chromeRatio <= 15.5),
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('\nVERDICT @390:', JSON.stringify(result.verdict, null, 1));
