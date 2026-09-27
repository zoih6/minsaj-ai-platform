// W9-5/م3 evidence shots — freezes the eleven touched surfaces after the
// wave, mirroring the w8-shot discipline (scroll first, then capture).
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }
import fs from 'node:fs';

const BASE = process.argv[2] || 'http://localhost:3324';
const OUT = 'docs/03-design/reconstruction/evidence/baselines/w9-5/m3/screenshots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot(name, url, { width = 1440, walk } = {}) {
  const page = await browser.newPage({ viewport: { width, height: width >= 1440 ? 1000 : 900 } });
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  if (walk) await walk(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  await page.close();
  console.log(`shot ${name}.png`);
}

/* تعلّم — path review (reading-time badges) reached by the probe walk. */
await shot('learn-path-1440', '/ar/app/learn', {
  walk: async (page) => {
    await page.locator('[data-testid="u2-learn-motivation"]').fill("سرد مستمر للاختبار");
    await page.locator('[data-testid^="u2-learn-level-"]').first().click();
    await page.locator('[data-testid="u2-learn-minutes-30"]').click();
    await page.locator('[data-testid="u2-learn-brief-submit"]').click();
    await page.waitForTimeout(400);
    for (let guard = 0; guard < 24; guard += 1) {
      const choice = page.locator('[data-testid^="u2-learn-diagnostic-choice-"]').first();
      if (!await choice.isVisible().catch(() => false)) break;
      await choice.click(); await page.waitForTimeout(100);
      const nextBtn = page.locator('[data-testid="u2-learn-diagnostic-next"]');
      if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled()) { await nextBtn.click(); await page.waitForTimeout(150); }
      else { await page.locator('[data-testid="u2-learn-diagnostic-finish"]').click(); await page.waitForTimeout(350); break; }
    }
    await page.locator('[data-testid="u2-learn-path-confirm"]').click();
    await page.waitForTimeout(400);
  },
});

/* استكشف — the §6.8 canvas on the map stage. */
await shot('explore-canvas-1440', '/ar/app/explore', {
  walk: async (page) => {
    await page.locator('[data-testid="u2-explore-curiosity"]').fill("لماذا تنجح بعض التوصيات دون غيرها؟");
    await page.locator('[data-testid="u2-explore-seed-submit"]').click();
    await page.waitForTimeout(500);
  },
});
await shot('explore-canvas-390', '/ar/app/explore', {
  width: 390,
  walk: async (page) => {
    await page.locator('[data-testid="u2-explore-curiosity"]').fill("اختبار");
    await page.locator('[data-testid="u2-explore-seed-submit"]').click();
    await page.waitForTimeout(500);
  },
});

/* الأدوات الخمسة */
await shot('projects-grid-1440', '/ar/app/projects');
await shot('agents-avatars-1440', '/ar/app/agents');
await shot('flows-preview-1440', '/ar/app/flows');
await shot('knowledge-dropzone-1440', '/ar/app/knowledge');
await shot('models-recommended-1440', '/ar/app/models');

/* التشغيل الأربعة */
await shot('runs-duration-1440', '/ar/app/runs');
await shot('usage-meters-1440', '/ar/app/usage');
await shot('billing-invoices-1440', '/ar/app/billing');
await shot('team-email-1440', '/ar/app/team');

await browser.close();
console.log(`\n${fs.readdirSync(OUT).length} screenshots → ${OUT}`);
