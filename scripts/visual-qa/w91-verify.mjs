// W9-1 verification probe: asserts the four Bible §2.2 rules are LIVE in the
// rendered app (not just authored in CSS):
//   R3 — UI digits are Latin (learn chips, analyze stats, usage money)
//   R3b — tabular-nums on .mono / .ltr-value
//   R5 — reading paragraphs cap at 65ch (assistant copy)
//   R6 — text-wrap balance (headings) / pretty (paragraphs)
import { createRequire } from 'node:module';
const require_ = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require_('playwright')); }
catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3311';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// --- R3: learn chips render Latin digits (minutes5 was "٥ دقائق")
await page.goto(`${BASE}/ar/app/learn`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(400);
const body = await page.evaluate(() => document.body.innerText);
const hasIndic = /[\u0660-\u0669]/.test(body);
check('R3 learn UI digits Latin', !hasIndic, hasIndic ? `found Indic digits on /learn` : '');
const chip5 = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="u2-learn-minutes-5"]');
    const el15 = document.querySelector('[data-testid="u2-learn-minutes-15"]');
    return { t5: el ? el.textContent.trim() : null, t15: el15 ? el15.textContent.trim() : null };
  });
check('R3 learn chips "5 دقائق"/"15 دقيقة"', chip5.t5 === '5 دقائق' && chip5.t15 === '15 دقيقة', JSON.stringify(chip5));

// --- R3b + R6: computed styles on universal classes
const styles = await page.evaluate(() => {
  const probe = document.createElement('span');
  probe.className = 'mono';
  document.body.appendChild(probe);
  const mono = getComputedStyle(probe).fontVariantNumeric;
  probe.className = 'ltr-value';
  const ltr = getComputedStyle(probe).fontVariantNumeric;
  probe.remove();
  const h2 = document.querySelector('h2');
  const p = document.querySelector('p');
  return {
    mono, ltr,
    h2wrap: h2 ? (getComputedStyle(h2).textWrapStyle || getComputedStyle(h2).textWrap) : 'n/a',
    pwrap: p ? (getComputedStyle(p).textWrapStyle || getComputedStyle(p).textWrap) : 'n/a',
  };
});
check('R3b .mono tabular-nums', /tabular/.test(styles.mono), styles.mono);
check('R3b .ltr-value tabular-nums', /tabular/.test(styles.ltr), styles.ltr);
check('R6 headings text-wrap balance', /balance/i.test(styles.h2wrap), styles.h2wrap);
check('R6 paragraphs text-wrap pretty', /pretty/i.test(styles.pwrap), styles.pwrap);

// --- R5: assistant reading measure = 65ch on /chat (submit a prompt first)
await page.goto(`${BASE}/ar/app/chat`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(600);
const measure = await page.evaluate(() => {
  const css = getComputedStyle(document.documentElement).getPropertyValue('--mj-measure-read').trim();
  // synthetic child of .assistant-copy proves the RULE applies where it matters
  const host = document.createElement('div'); host.className = 'assistant-copy';
  const p = document.createElement('p'); host.appendChild(p); document.body.appendChild(host);
  const mw = getComputedStyle(p).maxWidth; const w = p.getBoundingClientRect().width;
  host.remove();
  return { css, mw, w };
});
check('R5 token --mj-measure-read = 65ch', measure.css === '65ch', measure.css);
check('R5 assistant p read measure applied', /^\d+(\.\d+)?px$/.test(measure.mw || '') && measure.w < 780 && measure.w > 300, `max-width: ${measure.mw} · rendered width: ${measure.w}px (was 780px prose)`);

// --- R3: analyze numbers Latin + tabular (formatServiceNumber on stats)
await page.goto(`${BASE}/ar/app/analyze`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const analyzeTxt = await page.evaluate(() => document.body.innerText);
const analyzeIndic = /[\u0660-\u0669]/.test(analyzeTxt);
check('R3 analyze UI digits Latin', !analyzeIndic);

// --- R3: usage money Latin digits
await page.goto(`${BASE}/ar/app/usage`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(500);
const usageTxt = await page.evaluate(() => document.body.innerText);
const usageIndic = /[\u0660-\u0669]/.test(usageTxt);
check('R3 usage UI digits Latin', !usageIndic);

await browser.close();
const fails = results.filter((r) => !r.pass).length;
console.log(`\nW9-1 verification: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
