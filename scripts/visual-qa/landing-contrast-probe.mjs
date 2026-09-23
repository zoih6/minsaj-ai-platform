#!/usr/bin/env node
/* W-DS Phase 5 · Gate A-3 spot probe — landing contrast after the brand
   bridge (VIS-01): every visible TEXT node on /ar checked with
   alpha-composited effective backgrounds, both themes. Large-text (>=24px
   or >=18.66px bold) needs 3:1; normal text 4.5:1. */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

function parseColor(str) {
  if (!str) return null;
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(str);
  if (!m) return null;
  return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
}
function blend(fg, bg) { /* over-composite fg onto bg */ return { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 }; }
function lum({ r, g, b }) {
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); }

const READ = () => {
  const parseColor = (str) => {
    if (!str) return null;
    const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(str);
    if (!m) return null;
    return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] };
  };
  const blend = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = ({ r, g, b }) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const results = [];
  const els = [...document.querySelectorAll('body *')];
  for (const el of els) {
    if (results.length > 400) break;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
    /* direct text nodes only (no descendants sum) */
    let text = '';
    for (const n of el.childNodes) if (n.nodeType === 3) text += n.textContent;
    text = text.trim();
    if (!text) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    /* effective background: walk up until opaque */
    let bgEl = el, bg = null, guard = 0;
    while (bgEl && guard++ < 12) {
      const bcs = getComputedStyle(bgEl);
      const c = parseColor(bcs.backgroundColor);
      if (c && c.a >= 1) { bg = c; break; }
      if (c && c.a > 0) { bg = bg ? blend(c, bg) : c; }
      bgEl = bgEl.parentElement;
    }
    if (!bg) bg = { r: 255, g: 255, b: 255, a: 1 };
    let fg = parseColor(cs.color);
    if (!fg) continue;
    if (fg.a < 1) fg = blend(fg, bg);
    const size = parseFloat(cs.fontSize);
    const weight = +cs.fontWeight || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const rr = +ratio(fg, bg).toFixed(2);
    const need = large ? 3 : 4.5;
    if (rr < need) results.push({ text: text.slice(0, 40), cls: (el.className + '').slice(0, 60), size, weight, ratio: rr, need, fg: `${Math.round(fg.r)},${Math.round(fg.g)},${Math.round(fg.b)}`, bg: `${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}` });
  }
  return { theme: document.documentElement.dataset.theme || 'light?', failures: results, checked: results.length };
};

for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
  await page.goto(BASE + '/ar', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(1200);
  const res = await page.evaluate(READ);
  console.log(`\n=== LANDING ${theme.toUpperCase()} — text-contrast failures: ${res.failures.length} ===`);
  for (const f of res.failures.slice(0, 12)) console.log(JSON.stringify(f));
  await ctx.close();
}
await browser.close();
