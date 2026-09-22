// W-DS Phase 3 — edge-case chrome verification (dark, LTR, 360/375 widths).
import { chromium } from 'playwright';

const BASE = 'http://localhost:3100';
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });

async function check(name, { width, height = 844, url = '/ar/app/home', dark = false, en = false }) {
  const ctx = await browser.newContext({ viewport: { width, height }, isMobile: width < 768, hasTouch: width < 768, colorScheme: dark ? 'dark' : 'light' });
  const page = await ctx.newPage();
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 6000 }).catch(() => {});
  if (dark) await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
  await page.waitForTimeout(700);
  const data = await page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const de = document.documentElement;
    const tb = $('.universal-shell-topbar');
    const dock = $('.universal-shell-mobile-nav');
    const lang = $('.universal-shell-actions > a:not(.universal-top-avatar)');
    const mark = $('.universal-shell-mark');
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    return {
      overflow: de.scrollWidth > de.clientWidth + 1,
      topbarH: +(r(tb).height).toFixed(1),
      topbarBg: getComputedStyle(tb).backgroundColor,
      dockRect: r(dock) ? { l: +r(dock).left.toFixed(0), r: +r(dock).right.toFixed(0), h: +r(dock).height.toFixed(0) } : null,
      dockInView: r(dock) ? r(dock).right <= de.clientWidth : null,
      langVisible: lang ? getComputedStyle(lang).display !== 'none' : null,
      markW: mark ? +r(mark).width.toFixed(0) : null,
      wordmarkVisible: mark?.querySelector('b') ? getComputedStyle(mark.querySelector('b')).display !== 'none' : null,
      dir: document.documentElement.dir,
    };
  });
  console.log(name, JSON.stringify(data));
  await ctx.close();
}

await check('ar-light-390', { width: 390 });
await check('ar-dark-390', { width: 390, dark: true });
await check('en-light-390', { width: 390, url: '/en/app/home', en: true });
await check('ar-375', { width: 375 });
await check('ar-360', { width: 360 });
await check('ar-dark-chat-390', { width: 390, url: '/ar/app/chat', dark: true });
await browser.close();
console.log('DONE');
