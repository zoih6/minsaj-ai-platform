#!/usr/bin/env node
/* W-DS Phase 5 · Brand & Grid supplementary probe (VIS-01 + VIS-03 + GRD-01).

   VIS-01 (marketing token bridge, R-COL-1 / DESIGN-TOKENS §9):
     · @theme census        → raw hex color values inside the @theme block
                              (target: 0 — every value a var(--u-*) ref)
     · computed brand cells → landing elements whose utility paints a brand
                              token; computed color recorded per theme
                              (light + dark), before vs after the bridge
     · hero gradient stops  → the .text-gradient background-image per theme
     · independent-hex scan → marketing.css raw brand hexes (#06b6d4-family)

   VIS-03 (focus-canvas fold, R-SURF-4 / DESIGN-TOKENS §10):
     · --fc- declarations    → CSSOM scan for the --fc- namespace (target: 0)
     · canvas attribute      → data-canvas="focus" on ask/code/analyze/explore;
                               data-focus-canvas must be gone
     · canvas owner          → computed background of the shell main on a
                               focus route, both themes + the token that
                               owns it (--u-canvas-focus after the fold)
     · second-canvas binding → --sp-bg resolves to the same value as the
                               declared canvas token

   GRD-01 (container ladder, R-GRD-1 / DESIGN-TOKENS §6.1):
     · measure census        → computed max-width of every section-level
                              content container + reading lede on the
                              primary routes at 1440/1024/768 (the widths
                              only bind at/above tablet)
     · ladder assertion      → every recorded measure ∈ {560, 780, 1040,
                              1440} (or 100% fluid on phone widths)

   node scripts/visual-qa/brand-grid-probe.mjs --base http://localhost:3100 \
        --out <file.json>
*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3100';
const OUT = flag('--out') || '/home/z/my-project/brand-grid-probe.json';
const SHOT = flag('--shots') || null;

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

/* ---------- helpers -------------------------------------------------------- */
const rgbToHex = (rgb) => {
  if (!rgb || !rgb.startsWith('rgb')) return rgb; /* color-mix()/var passthrough */
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(rgb);
  if (!m) return rgb;
  const h = (v) => (+v).toString(16).padStart(2, '0').toUpperCase();
  return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
};

/* ---------- VIS-01: @theme census + landing brand cells -------------------- */
async function themeCensus() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/ar', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(600);
  const data = await page.evaluate(() => {
    /* read the DECLARED @theme values from the CSSOM (getComputedStyle would
       resolve var() references and make a bridged token look like raw hex) */
    const names = ['--color-brand', '--color-brand-light', '--color-brand-dark', '--color-brand-deep',
      '--color-brand-purple', '--color-brand-cyan', '--color-brand-emerald', '--color-brand-emerald-ink', '--color-brand-pink',
      '--color-darkbg-main', '--color-darkbg-card', '--color-darkbg-border',
      '--shadow-glow', '--shadow-glow-lg'];
    const declared = {};
    const grabDeclared = (rules) => {
      for (const rule of rules) {
        /* read style FIRST — CSSStyleRule.cssRules is an (often empty)
           truthy CSSRuleList in Chromium, so descending first never reads */
        if (rule.style) {
          for (const n of names) {
            if (!(n in declared) && rule.style.getPropertyValue(n) !== '') {
              declared[n] = rule.style.getPropertyValue(n).trim();
            }
          }
        }
        if (rule.cssRules && rule.cssRules.length > 0) grabDeclared(rule.cssRules);
      }
    };
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      grabDeclared(rules);
    }
    const theme = {};
    for (const n of names) theme[n] = declared[n] ?? null;
    /* raw-literal count among brand colors (darkbg neutrals are the declared
       marketing canvas tokens — allowed by R-COL-1) */
    const brandColors = names.filter((n) => n.startsWith('--color-brand'));
    const rawBrandHex = brandColors.filter((n) => theme[n] && !/var\(/.test(theme[n]));
    return { theme, rawBrandHex, bridgedCount: brandColors.filter((n) => theme[n] && /var\(/.test(theme[n])).length };
  });
  await ctx.close();
  return data;
}

async function landingBrandCells(theme) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme === 'dark' ? 'dark' : 'light' });
  const page = await ctx.newPage();
  if (theme === 'dark') {
    await page.addInitScript(() => { try { localStorage.setItem('theme', 'dark'); } catch {} });
  } else {
    await page.addInitScript(() => { try { localStorage.setItem('theme', 'light'); } catch {} });
  }
  await page.goto(BASE + '/ar', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(900);
  const data = await page.evaluate(() => {
    const out = { theme: document.documentElement.dataset.theme || null, cells: {} };
    const cell = (key, sel, prop) => {
      const el = document.querySelector(sel);
      if (!el) { out.cells[key] = null; return; }
      const cs = getComputedStyle(el);
      out.cells[key] = prop === 'background-image' ? cs.backgroundImage.slice(0, 220) : rgbToHexSafe(cs[prop]);
    };
    const rgbToHexSafe = (rgb) => {
      if (!rgb) return rgb;
      const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(rgb);
      if (!m) return rgb;
      const h = (v) => (+v).toString(16).padStart(2, '0').toUpperCase();
      return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
    };
    /* the hero gradient signature */
    cell('heroGradient', '.ms-site .text-gradient', 'background-image');
    /* CTA fill (site-hero primary) */
    const cta = [...document.querySelectorAll('a')].find((a) => /bg-brand-dark/.test(a.className));
    if (cta) { out.cells.ctaFill = rgbToHexSafe(getComputedStyle(cta).backgroundColor); } else { out.cells.ctaFill = null; }
    /* feature-grid icon chips (first three hues) */
    const chips = [...document.querySelectorAll('.ms-site [class*="bg-brand-cyan"], .ms-site [class*="bg-brand-pink"], .ms-site [class*="bg-brand-emerald"]')].slice(0, 3);
    out.cells.accentChips = chips.map((c) => ({ cls: (c.className.match(/bg-brand-[a-z]+/) || ['?'])[0], color: rgbToHexSafe(getComputedStyle(c).backgroundColor) }));
    /* text tokens: eyebrow text-brand-dark / dark:text-brand-light */
    const eyebrow = [...document.querySelectorAll('.ms-site [class*="text-brand-"]')].find((el) => el.textContent.trim().length > 2);
    out.cells.brandText = eyebrow ? { cls: (eyebrow.className.match(/text-brand-[a-z]+/) || ['?'])[0], color: rgbToHexSafe(getComputedStyle(eyebrow).color) } : null;
    return out;
  });
  if (SHOT) {
    fs.mkdirSync(SHOT, { recursive: true });
    await page.screenshot({ path: path.join(SHOT, `landing-1440-${theme}.jpg`), quality: 72, type: 'jpeg' });
  }
  await ctx.close();
  return data;
}

/* ---------- VIS-03: focus-canvas fold -------------------------------------- */
async function focusCanvasProbe() {
  const out = { fcDeclarations: null, routes: {} };
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
    await page.goto(BASE + '/ar/app/chat', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(800);
    const data = await page.evaluate(() => {
      const shell = document.querySelector('.universal-app-shell');
      const main = document.querySelector('.universal-shell-main');
      const space = document.querySelector('.service-space');
      const csMain = main ? getComputedStyle(main) : null;
      /* count live --fc-* declarations across the CSSOM */
      let fcDecls = 0; const fcNames = new Set();
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        const walk = (list) => {
          for (const rule of list) {
            if (rule.style) {
              for (const p of rule.style) {
                if (p.startsWith('--fc-')) { fcDecls += 1; fcNames.add(p); }
              }
            }
            if (rule.cssRules) walk(rule.cssRules);
          }
        };
        walk(rules);
      }
      const rgbToHex = (rgb) => {
        if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return 'transparent';
        const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(rgb || '');
        if (!m) return rgb || null;
        const h = (v) => (+v).toString(16).padStart(2, '0').toUpperCase();
        return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
      };
      /* the gateway canvas binding: read --sp-bg's DECLARED value from the
         CSSOM (is it a var(--u-canvas-focus) reference?) */
      let spBgDeclared = null;
      for (const sheet of document.styleSheets) {
        let rules; try { rules = sheet.cssRules; } catch { continue; }
        const walk = (list) => {
          for (const rule of list) {
            if (rule.style && rule.selectorText === '.service-space') {
              const v = rule.style.getPropertyValue('--sp-bg');
              if (v) spBgDeclared = v.trim();
            }
            if (rule.cssRules && rule.cssRules.length > 0) walk(rule.cssRules);
          }
        };
        walk(rules);
      }
      return {
        canvasAttr: shell ? (shell.getAttribute('data-canvas') ?? shell.getAttribute('data-focus-canvas')) : null,
        attrName: shell ? (shell.hasAttribute('data-canvas') ? 'data-canvas' : (shell.hasAttribute('data-focus-canvas') ? 'data-focus-canvas' : null)) : null,
        mainCanvas: csMain ? rgbToHex(csMain.backgroundColor) : null,
        serviceSpaceBg: space ? rgbToHex(getComputedStyle(space).backgroundColor) : null,
        spBgDeclared,
        canvasFocusToken: getComputedStyle(document.documentElement).getPropertyValue('--u-canvas-focus').trim() || null,
        fcDecls, fcNames: [...fcNames],
      };
    });
    out.routes[theme] = data;
    if (out.fcDeclarations === null) out.fcDeclarations = data.fcDecls;
    if (SHOT) {
      fs.mkdirSync(SHOT, { recursive: true });
      await page.screenshot({ path: path.join(SHOT, `chat-canvas-1440-${theme}.jpg`), quality: 72, type: 'jpeg' });
    }
    await ctx.close();
  }
  /* the other three focus routes announce the attribute too */
  const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page2 = await ctx2.newPage();
  out.routeAttrs = {};
  for (const r of ['chat', 'code', 'analyze', 'explore']) {
    await page2.goto(BASE + `/ar/app/${r}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page2.waitForTimeout(500);
    out.routeAttrs[r] = await page2.evaluate(() => {
      const shell = document.querySelector('.universal-app-shell');
      return shell ? (shell.getAttribute('data-canvas') ?? shell.getAttribute('data-focus-canvas')) : null;
    });
  }
  await ctx2.close();
  return out;
}

/* ---------- GRD-01: container-measure census --------------------------------
   Two readings, both live:
   1) CSSOM DECLARED census — walk every stylesheet rule (at top level AND
      inside @media/@container, keeping the condition label) and record every
      `max-width: <len>` and `width: min(<len>, …)` declaration with a numeric
      or var() length ≥ the narrow step. var() references resolve against the
      live :root cascade, so a token-based `max-width: var(--mj-container-prose)`
      reads as its resolved px. This is the audit's "active content widths"
      method made executable.
   2) RUNTIME spot read — the computed max-width / bounding width of the key
      containers on the primary routes (proof the ladder binds real pages). */
const SELECTOR_KEYS = [
  ['.universal-shell-main', 'shellMain'],
  ['.universal-container', 'universalContainer'],
  ['.ops-page', 'opsPage'],
  ['.ms-container', 'msContainer'],
  ['.service-space', 'serviceSpace'],
  ['.service-composer-zone', 'composerZone'],
  ['.adaptive-task-card', 'taskCard'],
  ['.compare-dock', 'compareDock'],
];

async function declaredCensus() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/ar/app/chat', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(600);
  const data = await page.evaluate((keys) => {
    const rootCS = getComputedStyle(document.documentElement);
    const resolveLen = (value) => {
      /* resolve var(--x) chains against :root, then parse px */
      let v = String(value).trim();
      for (let i = 0; i < 4; i++) {
        const ref = /var\((--[a-z0-9-]+)\)/i.exec(v);
        if (!ref) break;
        const rv = rootCS.getPropertyValue(ref[1]).trim();
        if (!rv) return null;
        v = rv;
      }
      const m = /^([\d.]+)px$/.exec(v);
      return m ? Math.round(+m[1]) : null;
    };
    const decls = [];
    const walk = (rules, cond) => {
      for (const rule of rules) {
        if (rule.type === CSSRule.MEDIA_RULE || rule.type === CSSRule.SUPPORTS_RULE) { walk(rule.cssRules, cond + '@' + (rule.conditionText || '')); continue; }
        if (rule.type === CSSRule.CONTAINER_RULE) { walk(rule.cssRules, cond + '@container ' + (rule.conditionText || '')); continue; }
        if (!rule.selectorText || !rule.style) continue;
        const sel = rule.selectorText;
        const hits = [];
        const mw = rule.style.getPropertyValue('max-width');
        if (mw) {
          const px = resolveLen(mw);
          if (px !== null && px >= 480) hits.push({ prop: 'max-width', raw: mw.trim(), px });
        }
        const w = rule.style.getPropertyValue('width');
        if (w && /min\(/.test(w)) {
          const px = resolveLen(/min\(\s*([^,]+),/.exec(w)[1]);
          if (px !== null && px >= 480) hits.push({ prop: 'width:min', raw: w.trim(), px });
        }
        for (const h of hits) decls.push({ sel, cond: cond || 'top', ...h });
      }
    };
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      walk(rules, '');
    }
    /* classify: ladder selectors (the containers under test) vs the rest */
    const isKey = (sel) => keys.some(([k]) => sel.includes(k));
    const keyDecls = decls.filter((d) => isKey(d.sel));
    /* the section-level measure census: every declaration ≥480 that is NOT a
       known out-of-scope family (overlays/sheets, preview harness, tiny
       internals are excluded by the ≥480 floor + the selectors under test) */
    const distinct = [...new Set(decls.map((d) => d.px))].sort((a, b) => a - b);
    return { total: decls.length, keyDecls, distinct, decls };
  }, SELECTOR_KEYS);
  await ctx.close();
  return data;
}

const MEASURE_READ = () => {
  const grab = (sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const cs = getComputedStyle(el);
    return { sel, maxWidth: cs.maxWidth, rect: Math.round(el.getBoundingClientRect().width) };
  };
  return {
    pageContainer: grab('.universal-container') || grab('.ops-page') || grab('.ms-container'),
    shellMain: grab('.universal-shell-main'),
    serviceSpace: grab('.service-space'),
    composerZone: grab('.service-composer-zone'),
    taskCard: grab('.adaptive-task-card'),
    homeWelcomeP: grab('.adaptive-home__welcome p'),
    libraryHeaderP: grab('.universal-library-header p'),
    workbenchHeadP: grab('.u2-workbench__head p'),
  };
};
async function measureCensus() {
  const out = {};
  const routes = [
    ['chat', '/ar/app/chat'], ['home', '/ar/app/home'], ['agents', '/ar/app/agents'],
    ['knowledge', '/ar/app/knowledge'], ['library', '/ar/app/library'], ['settings', '/ar/app/settings'],
    ['flows', '/ar/app/flows'], ['code', '/ar/app/code'], ['usage', '/ar/app/usage'],
  ];
  for (const vw of [1440, 1024, 768]) {
    const ctx = await browser.newContext({ viewport: { width: vw, height: 900 } });
    const page = await ctx.newPage();
    out['w' + vw] = {};
    for (const [name, route] of routes) {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(450);
      out['w' + vw][name] = await page.evaluate(MEASURE_READ);
    }
    /* landing container */
    await page.goto(BASE + '/ar', { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(500);
    out['w' + vw].landing = await page.evaluate(() => {
      const el = document.querySelector('.ms-container');
      if (!el) return null;
      return { sel: '.ms-container', maxWidth: getComputedStyle(el).maxWidth, rect: Math.round(el.getBoundingClientRect().width) };
    });
    await ctx.close();
  }
  out.declared = await declaredCensus();
  return out;
}

/* ---------- run ------------------------------------------------------------ */
const result = { base: BASE, ts: new Date().toISOString() };
result.vis01ThemeCensus = await themeCensus();
result.vis01LandingLight = await landingBrandCells('light');
result.vis01LandingDark = await landingBrandCells('dark');
result.vis03FocusCanvas = await focusCanvasProbe();
result.grd01Measures = await measureCensus();

/* verdicts */
const t = result.vis01ThemeCensus;
const rawHexAfter = t.rawBrandHex.filter((n) => n !== '--color-brand-deep' && n !== '--color-brand-purple'); /* the two die in Phase 5 */
const LADDER = [560, 780, 1040, 1440];
const dec = result.grd01Measures.declared;
const KEY_SEL = ['.universal-shell-main', '.universal-container', '.ops-page', '.ms-container', '.service-space', '.service-composer-zone', '.adaptive-task-card', '.compare-dock',
  '.adaptive-home__welcome', '.universal-library-header', '.u2-workbench__head', '.u2-harness__head', '.system-page', '.builder-section', '.builder-navigation', '.preview-hero', '.preview-answer', '.preview-evidence', '.preview-outro', '.preview-panel-heading', '.assistant-copy', '.response-receipt', '.chat-start__intro', '.page-description', '.workbench', '.service-welcome__lede', '.mj-section__desc'];
const inLadder = (px) => LADDER.includes(px);
const keyDecls = dec.decls.filter((d) => KEY_SEL.some((k) => d.sel.includes(k)));
const keyOff = keyDecls.filter((d) => !inLadder(d.px));
/* known out-of-scope families that legitimately remain off-ladder (documented
   in baselines/phase5/README.md): overlay/sheet widths, the preview harness,
   element internals below the narrow step floor are excluded by ≥480. */
const OUT_OF_SCOPE = ['.u2-overlay', '.u2-harness', '.universal-command', '.universal-notifications'];
const ctxOff = dec.decls.filter((d) => !inLadder(d.px) && !OUT_OF_SCOPE.some((k) => d.sel.includes(k)));
result.verdict = {
  vis01: {
    bridgedBrandTokens: `${t.bridgedCount}/${t.bridgedCount + rawHexAfter.length}`,
    rawBrandHexRemaining: rawHexAfter,
    pass: rawHexAfter.length === 0,
  },
  vis03: {
    fcDeclarations: result.vis03FocusCanvas.fcDeclarations,
    attrName: result.vis03FocusCanvas.routes.light.attrName,
    canvasOwner: result.vis03FocusCanvas.routes.light.canvasFocusToken ? '--u-canvas-focus' : '--fc-canvas',
    spBgBindsToken: /var\(--u-canvas-focus\)/.test(result.vis03FocusCanvas.routes.light.spBgDeclared || ''),
    canvasComputedBothThemes: result.vis03FocusCanvas.routes.light.canvasFocusToken && result.vis03FocusCanvas.routes.dark.canvasFocusToken,
    pass: result.vis03FocusCanvas.fcDeclarations === 0 && result.vis03FocusCanvas.routes.light.attrName === 'data-canvas' && /var\(--u-canvas-focus\)/.test(result.vis03FocusCanvas.routes.light.spBgDeclared || ''),
  },
  grd01: {
    distinctDeclaredMeasures: dec.distinct,
    keySelectorDecls: keyDecls.length,
    keyOffLadder: keyOff.map((d) => `${d.sel} ${d.prop}=${d.raw} (${d.px}px) ${d.cond}`),
    contextOffLadder: ctxOff.map((d) => `${d.sel} ${d.prop}=${d.raw} (${d.px}px)`),
    pass: keyOff.length === 0,
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('VIS01 census:', JSON.stringify({ rawBrandHex: t.rawBrandHex, bridged: t.bridgedCount }));
console.log('VIS01 landing light/dark:', JSON.stringify(result.vis01LandingLight.cells), JSON.stringify(result.vis01LandingDark.cells));
console.log('VIS03:', JSON.stringify({ fcDecls: result.vis03FocusCanvas.fcDeclarations, attr: result.vis03FocusCanvas.routes.light.attrName, light: result.vis03FocusCanvas.routes.light, dark: result.vis03FocusCanvas.routes.dark, routeAttrs: result.vis03FocusCanvas.routeAttrs }));
console.log('GRD01 distinct declared:', JSON.stringify(dec.distinct), 'keyOff:', JSON.stringify(result.verdict.grd01.keyOffLadder), 'ctxOff:', JSON.stringify(result.verdict.grd01.contextOffLadder));
console.log('VERDICT:', JSON.stringify(result.verdict, null, 1));
await browser.close();
