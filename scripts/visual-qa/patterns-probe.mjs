#!/usr/bin/env node
/* W-DS Phase 4 · Patterns supplementary probe (INT-01 + INT-02).

   INT-01 (gateway composer-first, R-PAT-2 / PAGE-PATTERNS §2.3):
     · pre-execution section stack   → top-level children of .service-space
     · card-like surfaces @390       → the audit's census method on main
     · composer + ONE primary CTA    → above the fold, clear of the dock
     · progressive disclosure        → panels closed initially; the tools
                                       disclosure opens after the FIRST
                                       keystroke (exactly once); mode and
                                       advanced ride the same mechanism
     · trust note                    → one caption line inside the card
     · four-step path                → thin strip INSIDE the card during
                                       execution, never a standalone section
     · starters                      → plain links (no container chrome)

   INT-02 (route motion, R-MOT-1 / §4.1):
     · route-frame enter duration    → 240ms (--u-motion-duration-route)
     · route-frame enter offset      → 4px (keyframes minsaj-route-in)
     · forbidden band                → no route transition above 300ms

   node scripts/visual-qa/patterns-probe.mjs --base http://localhost:3100 \
        --out <file.json> [--before]      # --before: skip keystroke/execution
                                          # steps (pre-refactor builds have no
                                          # config strip; geometry still reads)
*/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const BASE = flag('--base') || 'http://localhost:3100';
const OUT = flag('--out') || '/home/z/my-project/patterns-probe.json';
const BEFORE = args.includes('--before');

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

/* ---------- INT-02: route motion (any app route) -------------------------- */
async function motionProbe() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/ar/app/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => {
    const frame = document.querySelector('.universal-route-frame');
    const cs = frame ? getComputedStyle(frame) : null;
    /* read the keyframe offset straight from the CSSOM; var() distances are
       resolved against the live cascade (tokens are the architecture) */
    let keyframeOffset = null;
    let keyframeName = cs ? cs.animationName : null;
    if (keyframeName) {
      const resolveDist = (value) => {
        const lit = /translateY\(([\d.]+)px\)/.exec(value);
        if (lit) return +lit[1];
        const tok = /translateY\(var\((--[a-z0-9-]+)\)\)/.exec(value);
        if (tok) {
          const raw = getComputedStyle(document.documentElement).getPropertyValue(tok[1]).trim();
          const px = /^([\d.]+)px$/.exec(raw);
          return px ? +px[1] : null;
        }
        return null;
      };
      outer: for (const sheet of document.styleSheets) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of rules) {
          if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === keyframeName) {
            for (const kf of rule.cssRules) {
              const isFrom = kf.keyText === 'from' || kf.keyText === '0%' || kf.keyText === '0 %';
              if (isFrom) {
                const offset = resolveDist(kf.style.transform || kf.cssText);
                if (offset !== null) { keyframeOffset = offset; break outer; }
              }
            }
          }
        }
      }
    }
    return {
      frameFound: !!frame,
      animationName: keyframeName,
      durationMs: cs && cs.animationDuration ? Math.round(parseFloat(cs.animationDuration) * 1000) : null,
      enterOffsetPx: keyframeOffset,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });
  await ctx.close();
  return {
    ...data,
    rule240: data.durationMs === 240,
    offset4: data.enterOffsetPx === 4,
    underForbidden300: data.durationMs !== null && data.durationMs <= 300,
  };
}

/* ---------- INT-01: gateway structure (chat @390 ar; en reference) -------- */
const GATEWAY_READ = () => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const rect = (el) => (el ? { top: +el.getBoundingClientRect().top.toFixed(1), bottom: +el.getBoundingClientRect().bottom.toFixed(1) } : null);

  const space = $('.service-space');
  const sections = space ? [...space.children].filter((el) => !el.classList.contains('service-space__veil')).map((el) => el.className.split(' ')[0]) : [];
  const dock = $('.universal-shell-mobile-nav');
  const cta = $('.service-start-button');
  const shell = $('.service-prompt-shell');

  /* audit card census method: bordered+rounded+filled elements in main */
  const cardLike = $$('main *').filter((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (cs.borderStyle !== 'solid' && cs.borderTopWidth !== '0px') return false;
    const r = el.getBoundingClientRect();
    return r.width >= 40 && r.height >= 24
      && parseFloat(cs.borderTopWidth) > 0
      && cs.borderTopLeftRadius !== '0px'
      && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
  }).length;

  return {
    sections,
    sectionCount: sections.length,
    cardLike,
    composerTop: rect(shell)?.top,
    ctaBottom: rect(cta)?.bottom,
    dockTop: dock ? +dock.getBoundingClientRect().top.toFixed(1) : null,
    ctaAboveFold: !!(cta && dock && cta.getBoundingClientRect().bottom < dock.getBoundingClientRect().top),
    configChips: $$('.service-config__chip').map((c) => c.textContent.trim().replace(/\s+/g, ' ')),
    openPanels: $$('.service-config__body').length,
    trustInsideCard: !!$('.service-prompt-shell .service-trust'),
    standaloneTrust: !!$('.service-space > .service-trust'),
    standalonePath: !!$('.service-space > .service-path-card'),
    startersPlain: $$('.service-starters button').map((b) => {
      const cs = getComputedStyle(b);
      return { bg: cs.backgroundColor, border: cs.borderTopWidth, h: +b.getBoundingClientRect().height.toFixed(0) };
    }),
    welcomeChildren: $('.service-welcome') ? [...$('.service-welcome').children].map((c) => c.className.split(' ')[0]) : [],
  };
};

async function gatewayProbe(locale) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const out = {};
  await page.goto(BASE + `/${locale}/app/chat`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(800);
  out.initial = await page.evaluate(GATEWAY_READ);

  if (!BEFORE) {
    /* first keystroke → the tools disclosure opens (exactly once) */
    await page.fill('#service-request', 'طلب تجريبي');
    await page.waitForTimeout(450);
    out.afterKeystroke = await page.evaluate(() => ({
      openPanels: document.querySelectorAll('.service-config__body').length,
      openPanelKind: document.querySelector('.service-config__body')?.dataset.panel ?? null,
      openChips: document.querySelectorAll('.service-config__chip.is-open').length,
    }));
    /* closing it and typing more must NOT re-open (the latch) */
    await page.click('.service-config__chip.is-open');
    await page.waitForTimeout(300);
    await page.fill('#service-request', 'طلب تجريبي أطول بكتابة إضافية');
    await page.waitForTimeout(350);
    out.latch = await page.evaluate(() => ({
      openPanels: document.querySelectorAll('.service-config__body').length,
    }));
    /* execution: fast default → working → ready; strip inside the card */
    await page.click('.service-start-button');
    await page.waitForTimeout(1200);
    out.execution = await page.evaluate(() => ({
      output: !!document.querySelector('.service-output'),
      stripInsideCard: !!document.querySelector('.service-prompt-shell .service-progress'),
      stripSteps: [...document.querySelectorAll('.service-progress li')].map((li) => li.className || 'plain'),
    }));
    /* the composer + CTA stay reachable at ready (dock clearance) */
    out.dockClearAtReady = await page.evaluate(() => {
      const dock = document.querySelector('.universal-shell-mobile-nav').getBoundingClientRect();
      const cta = document.querySelector('.service-start-button').getBoundingClientRect();
      return { ctaBottom: +cta.bottom.toFixed(1), dockTop: +dock.top.toFixed(1) };
    });
  }
  await ctx.close();
  return out;
}

/* wide-canvas reference (1440): the same composition, re-flowed not redesigned */
async function gatewayWide() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/ar/app/chat', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(800);
  const data = await page.evaluate(GATEWAY_READ);
  await ctx.close();
  return data;
}

const result = { base: BASE, mode: BEFORE ? 'before (Phase 3 build)' : 'after (Phase 4 build)' };
result.int02Motion = await motionProbe();
result.int01Gateway = await gatewayProbe('ar');
result.int01GatewayEn = await gatewayProbe('en');
result.int01Wide1440 = await gatewayWide();

/* verdicts */
const g = result.int01Gateway;
result.verdict = {
  int01: {
    sectionStack: { before: 9, after: g.initial.sectionCount, pass: !BEFORE && g.initial.sectionCount === 3 },
    cards390: { before: 18, after: g.initial.cardLike, pass: !BEFORE && g.initial.cardLike <= 8 },
    ctaAboveFold: { after: g.initial.ctaAboveFold, pass: !BEFORE ? g.initial.ctaAboveFold : null },
    panelsClosedInitially: { after: g.initial.openPanels === 0, pass: !BEFORE ? g.initial.openPanels === 0 : null },
    toolsOpenAfterFirstKeystroke: !BEFORE ? { after: g.afterKeystroke?.openPanelKind === 'tools', pass: g.afterKeystroke?.openPanelKind === 'tools' } : null,
    latchHolds: !BEFORE ? { after: g.latch?.openPanels === 0, pass: g.latch?.openPanels === 0 } : null,
    trustInsideCard: { after: g.initial.trustInsideCard, pass: !BEFORE ? g.initial.trustInsideCard && !g.initial.standaloneTrust : null },
    stripInsideCardDuringExecution: !BEFORE ? { after: g.execution?.stripInsideCard, pass: g.execution?.stripInsideCard && !g.initial.standalonePath } : null,
    startersPlain: { after: g.initial.startersPlain.every((s) => s.bg === 'rgba(0, 0, 0, 0)' && s.border === '0px'), pass: !BEFORE ? g.initial.startersPlain.every((s) => s.bg === 'rgba(0, 0, 0, 0)' && s.border === '0px') && g.initial.startersPlain.every((s) => s.h >= 44) : null },
  },
  int02: {
    duration: { before: 480, after: result.int02Motion.durationMs, pass: !BEFORE && result.int02Motion.durationMs === 240 },
    offset: { before: 10, after: result.int02Motion.enterOffsetPx, pass: !BEFORE && result.int02Motion.enterOffsetPx === 4 },
    underForbidden300: result.int02Motion.underForbidden300,
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(result, null, 1));
console.log('MOTION:', JSON.stringify(result.int02Motion));
console.log('GATEWAY initial:', JSON.stringify({ sections: g.initial.sections, sectionCount: g.initial.sectionCount, cardLike: g.initial.cardLike, ctaAboveFold: g.initial.ctaAboveFold, chips: g.initial.configChips, trustInsideCard: g.initial.trustInsideCard, startersPlain: g.initial.startersPlain }));
if (g.afterKeystroke) console.log('KEYSTROKE:', JSON.stringify(g.afterKeystroke), 'LATCH:', JSON.stringify(g.latch), 'EXECUTION:', JSON.stringify(g.execution));
console.log('WIDE1440:', JSON.stringify({ sections: result.int01Wide1440.sections, cards: result.int01Wide1440.cardLike }));
console.log('VERDICT:', JSON.stringify(result.verdict, null, 1));
await browser.close();
