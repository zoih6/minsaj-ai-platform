// W9-2 probe (Bible §4.4 + Errata E-1): the settings section strip is now a
// full ScrollableTabs. Mandatory acceptance from the Bible:
//   "اختبار إلزامي عند 390/768/1440: كل الخيارات السبعة تصل scrollIntoView"
// Plus the E-1 regression the Bible demands we never ship:
//   RTL scrollLeft starts at 0 and goes NEGATIVE — buttons must still appear
//   and step() must move toward the END (not the mirrored direction).
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3311';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();

async function probeViewport(locale, width, label) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`${BASE}/${locale}/app/settings`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const nav = page.locator('.settings-nav nav');
  const navEl = await nav.evaluateHandle((el) => el);
  const info = await page.evaluate((el) => {
    const cs = getComputedStyle(el);
    const strip = el.closest('.settings-strip');
    const btnPrev = strip?.querySelector('.settings-strip__btn--prev');
    const btnNext = strip?.querySelector('.settings-strip__btn--next');
    const underline = el.querySelector('.settings-strip__underline');
    const buttons = [...el.querySelectorAll('button')];
    return {
      direction: cs.direction,
      horizontalScroll: el.scrollWidth > el.clientWidth + 2,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      scrollLeft: el.scrollLeft,
      miStart: el.style.getPropertyValue('--mi-start'),
      miEnd: el.style.getPropertyValue('--mi-end'),
      btnPrevVisible: btnPrev ? btnPrev.dataset.visible === 'true' : null,
      btnNextVisible: btnNext ? btnNext.dataset.visible === 'true' : null,
      underlineVisible: underline ? getComputedStyle(underline).display !== 'none' && underline.style.opacity === '1' : false,
      underlineWidth: underline ? underline.style.width : '',
      buttonCount: buttons.length,
    };
  }, navEl);

  const horizontal = info.horizontalScroll;

  if (label === '1440') {
    // wide composition: vertical nav — no strip affordances at all
    check(`[${locale} @1440] vertical nav, no strip affordances`, !horizontal && info.btnPrevVisible === false && info.btnNextVisible === false && !info.underlineVisible,
      `buttons=${info.buttonCount} horizontal=${horizontal}`);
    check(`[${locale} @1440] all 7 sections present`, info.buttonCount === 7);
  } else {
    check(`[${locale} @${label}] 7 sections in the strip`, info.buttonCount === 7, `got ${info.buttonCount}`);
    if (horizontal) {
      // at load (start): next button visible, start mask 0, end mask 18
      check(`[${locale} @${label}] at start: next button visible`, info.btnNextVisible === true, JSON.stringify({ prev: info.btnPrevVisible, next: info.btnNextVisible }));
      check(`[${locale} @${label}] at start: fade only on the end edge`, info.miStart === '0px' && info.miEnd === '18px', `--mi-start=${info.miStart} --mi-end=${info.miEnd}`);
      check(`[${locale} @${label}] underline live under the active tab`, info.underlineVisible && parseInt(info.underlineWidth || '0') > 0, `width=${info.underlineWidth}`);

      // E-1: RTL initial scrollLeft must be 0 (not mirrored), step(next) must move toward END
      const rtl = info.direction === 'rtl';
      if (rtl) {
        check(`[${locale} @${label}] E-1: RTL starts at scrollLeft 0`, Math.abs(info.scrollLeft) <= 2, `scrollLeft=${info.scrollLeft}`);
      }
      // click next button → position advances toward end (|scrollLeft| grows in RTL)
      const afterNext = await page.evaluate(() => {
        const strip = document.querySelector('.settings-strip');
        const nav2 = strip.querySelector('nav');
        const before = Math.abs(nav2.scrollLeft);
        strip.querySelector('.settings-strip__btn--next').click();
        return new Promise((resolve) => setTimeout(() => resolve({ before, after: Math.abs(nav2.scrollLeft) }), 450));
      });
      check(`[${locale} @${label}] E-1: next button advances toward the end`, afterNext.after > afterNext.before, `|scrollLeft| ${afterNext.before} → ${afterNext.after}`);

      // MANDATORY: every one of the seven options reaches scrollIntoView
      const reach = await page.evaluate(() => {
        const nav2 = document.querySelector('.settings-nav nav');
        const btns = [...nav2.querySelectorAll('button')];
        const out = [];
        for (const b of btns) {
          b.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          const r = b.getBoundingClientRect();
          const nr = nav2.getBoundingClientRect();
          out.push({ label: b.textContent.trim().slice(0, 18), inside: r.left >= nr.left - 1 && r.right <= nr.right + 1 });
        }
        return out;
      });
      const unreachable = reach.filter((r) => !r.inside);
      check(`[${locale} @${label}] all 7 options reach scrollIntoView`, unreachable.length === 0, unreachable.map((r) => r.label).join(' | '));

      // after jumping to the last option: prev button must be visible (start has hidden content)
      const atEnd = await page.evaluate(() => {
        const strip = document.querySelector('.settings-strip');
        const nav2 = strip.querySelector('nav');
        nav2.scrollTo({ left: nav2.scrollWidth * (getComputedStyle(nav2).direction === 'rtl' ? -1 : 1) });
        return new Promise((resolve) => setTimeout(() => resolve({
          prev: strip.querySelector('.settings-strip__btn--prev').dataset.visible,
          miStart: nav2.style.getPropertyValue('--mi-start'),
          miEnd: nav2.style.getPropertyValue('--mi-end'),
        }), 350));
      });
      check(`[${locale} @${label}] at end: prev button visible + fade flips to the start edge`, atEnd.prev === 'true' && atEnd.miStart === '18px' && atEnd.miEnd === '0px', JSON.stringify(atEnd));
    } else {
      check(`[${locale} @${label}] strip fits — no buttons, no fade`, info.btnPrevVisible === false && info.btnNextVisible === false && info.miStart === '0px', 'container wide enough');
    }
  }
  await page.close();
}

for (const locale of ['ar', 'en']) {
  await probeViewport(locale, 390, '390');
  await probeViewport(locale, 768, '768');
  await probeViewport(locale, 1440, '1440');
}

await browser.close();
const fails = results.filter((r) => !r.pass).length;
console.log(`\nW9-2 probe: ${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
