#!/usr/bin/env node
// Phase 6 evidence shots — 980-coarse: dark theme, drawer open, en LTR.
import { chromium } from 'playwright';

const BASE = 'http://localhost:3100';
const OUT = 'docs/03-design/reconstruction/evidence/baselines/phase6/screenshots';
import fs from 'node:fs';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
const ctx = async () => browser.newContext({
  viewport: { width: 980, height: 2000 },
  deviceScaleFactor: 1, isMobile: true, hasTouch: true,
});

// 1 — dark theme, ar
{
  const p = await (await ctx()).newPage();
  await p.goto(BASE + '/ar/app/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.evaluate(() => document.fonts.ready).catch(() => {});
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/home-980-coarse-dark.jpg`, type: 'jpeg', quality: 82 });
  await p.close();
}

// 2 — drawer open at 980 coarse (ar, light)
{
  const p = await (await ctx()).newPage();
  await p.goto(BASE + '/ar/app/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready).catch(() => {});
  await p.waitForTimeout(1400);
  await p.click('.universal-shell-context > button');
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/home-980-coarse-drawer-open.jpg`, type: 'jpeg', quality: 82 });
  await p.close();
}

// 3 — en LTR at 980 coarse
{
  const p = await (await ctx()).newPage();
  await p.goto(BASE + '/en/app/home', { waitUntil: 'domcontentloaded', timeout: 45000 });
  await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready).catch(() => {});
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/en-home-980-coarse.jpg`, type: 'jpeg', quality: 82 });
  await p.close();
}

await browser.close();
console.log('evidence shots saved to', OUT);
