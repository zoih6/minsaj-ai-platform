#!/usr/bin/env node
/* W-DS Phase 2 · SUR-01 supplementary probe.
   Counts card-like CONTAINERS (non-control elements) that sit inside another
   card-like element — the real "card inside card" defect class. Controls
   (buttons/selects/inputs/links/chips) inside their surface are the sanctioned
   tree (surface > flat-group > controls) and are counted separately.

   node scripts/visual-qa/sur01-probe.mjs --base http://localhost:3100 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3100';
const OUT = flag('--out') || '/home/z/my-project/phase2-evidence/sur01-probe.json';

const ROUTES = ['home', 'chat', 'learn', 'research', 'create', 'code', 'analyze', 'explore'];
const VPS = [{ name: '390', width: 390, height: 844 }, { name: '768', width: 768, height: 900 }, { name: '1440', width: 1440, height: 1000 }];
const PATHS = { home: '/ar/app/home', chat: '/ar/app/chat', learn: '/ar/app/learn', research: '/ar/app/research', create: '/ar/app/create', code: '/ar/app/code', analyze: '/ar/app/analyze', explore: '/ar/app/explore' };

const MEASURE = () => {
  const mainRoot = document.querySelector('main') || document.body;
  const CONTROL_TAGS = new Set(['BUTTON', 'SELECT', 'INPUT', 'TEXTAREA', 'A', 'KBD', 'CODE', 'SVG', 'LABEL']);
  const isCardLike = (el, s) => {
    const hasBorder = parseFloat(s.borderTopWidth) > 0 || parseFloat(s.borderLeftWidth) > 0;
    const hasShadow = s.boxShadow !== 'none';
    const hasRadius = parseFloat(s.borderTopLeftRadius) > 4;
    const r = el.getBoundingClientRect();
    return (hasBorder || hasShadow) && hasRadius && r.height > 24 && r.width > 60;
  };
  const containers = []; let controlsNested = 0; const depth2plus = [];
  for (const el of mainRoot.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    if (!isCardLike(el, s)) continue;
    let depth = 0; let p = el.parentElement;
    while (p && p !== document.body) { if (isCardLike(p, getComputedStyle(p))) depth++; p = p.parentElement; }
    const rec = { sel: el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0], depth };
    if (CONTROL_TAGS.has(el.tagName)) { if (depth >= 1) controlsNested++; continue; }
    containers.push(rec);
    if (depth >= 1) depth2plus.push(rec);
  }
  return {
    containerCards: containers.length,
    containersAtDepth0: containers.filter((c) => c.depth === 0).length,
    containerInContainer: depth2plus.length,           // the SUR-01 defect class — must be 0
    containerInContainerSelectors: depth2plus.map((c) => c.sel + ':d' + c.depth),
    controlsInsideSurfaces: controlsNested,            // sanctioned tree terminus
  };
};

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const result = {};
for (const vp of VPS) {
  for (const slug of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.width < 768, hasTouch: vp.width < 768 });
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + PATHS[slug], { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
      await page.evaluate(() => document.fonts.ready).catch(() => {});
      await page.waitForTimeout(1200);
      const data = await page.evaluate(MEASURE);
      result[`${slug}@${vp.name}`] = data;
      console.log(`${slug}@${vp.name}: containerInContainer=${data.containerInContainer} containers=${data.containerCards} controlsInSurface=${data.controlsInsideSurfaces}`);
    } catch (e) {
      result[`${slug}@${vp.name}`] = { error: String(e) };
      console.log(`${slug}@${vp.name}: FAILED ${String(e).split('\n')[0]}`);
    }
    await ctx.close();
  }
}
await browser.close();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
const bad = Object.entries(result).filter(([, v]) => (v.containerInContainer || 0) > 0);
console.log(`\nVERDICT: container-in-container pairs = ${bad.length === 0 ? 0 : bad.map(([k, v]) => `${k}=${v.containerInContainer}`).join(', ')} across ${Object.keys(result).length} cells`);
