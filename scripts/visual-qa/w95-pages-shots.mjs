import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3321';
const OUT = 'docs/03-design/reconstruction/evidence/baselines/w9-5/pages';
const browser = await chromium.launch();

async function shot(name, width, height, url, actions) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  if (actions) await actions(page);
  await page.screenshot({ path: path.join(OUT, name), fullPage: false });
  await page.close();
  console.log('shot', name);
}

// م1 — لك: the 44px icon-tile family + quiet metadata
await shot('home-1440.png', 1440, 1000, '/ar/app/home');

// م1 — الإعدادات: content 720 + sticky save (profile) + fenced danger zone (data tab)
await shot('settings-save-1440.png', 1440, 1000, '/ar/app/settings');
await shot('settings-danger-1440.png', 1440, 1000, '/ar/app/settings', async (page) => {
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.settings-strip button, .settings-nav button')].find((b) => b.textContent.includes('البيانات'));
    btn?.click();
  });
  await page.waitForTimeout(400);
});

// م1 — أنشئ: format cards 3-up at 1440 (D-W9-G keep-compact decision)
await shot('create-formats-1440.png', 1440, 1000, '/ar/app/create', async (page) => {
  await page.evaluate(() => {
    const goal = document.querySelector('[data-testid="u2-create-goal"]');
    if (goal) goal.value = 'دليل موجز لفريق القراءة';
    document.querySelector('[data-testid^="u2-create-tone-"]')?.click();
    document.querySelector('[data-testid^="u2-create-length-"]')?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('التالي') || b.textContent.includes('تابع'))?.click());
  await page.waitForTimeout(500);
});

// م2 — اسأل: the live conversation (720 stream, bubble, caret, sticky composer, code block)
await shot('chat-conversation-1440.png', 1440, 760, '/ar/app/chat', async (page) => {
  await page.evaluate(() => {
    const ta = document.querySelector('.composer-shell textarea');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    setter.call(ta, 'حلّل فرص إطلاق خدمة SaaS عربية في السوق السعودي');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.send-button')?.click());
  await page.waitForTimeout(6500);
});

// م2 — ابحث: trust chips on the source review stage
await shot('research-trust-1440.png', 1440, 1000, '/ar/app/research', async (page) => {
  await page.evaluate(() => {
    const set = (sel, val) => {
      const el = document.querySelector(sel);
      if (!el) return;
      const proto = el.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
      el.dispatchEvent(new Event('input', { bubbles: true }));
    };
    set('[data-testid="u2-research-question"]', 'قارن زمن الانتظار في الفروع خلال الربع الثالث');
    set('[data-testid="u2-research-decision"]', 'قرار خطة التوسع للربع القادم');
    document.querySelector('[data-testid="u2-research-audience-self"]')?.click();
    document.querySelector('[data-testid="u2-research-scope-recent"]')?.click();
  });
  await page.waitForTimeout(250);
  await page.evaluate(() => document.querySelector('[data-testid="u2-research-brief-submit"]')?.click());
  await page.waitForTimeout(500);
  for (let i = 0; i < 6; i += 1) {
    const step = await page.evaluate(() => {
      document.querySelector('[data-testid="u2-research-clarify-default"]')?.click();
      const next = document.querySelector('[data-testid="u2-research-clarify-next"]');
      if (next && !next.disabled) { next.click(); return 'next'; }
      document.querySelector('[data-testid="u2-research-clarify-finish"]')?.click();
      return 'finish';
    });
    await page.waitForTimeout(400);
    if (step === 'finish') break;
  }
  await page.waitForTimeout(400);
  await page.evaluate(() => document.querySelector('[data-testid="u2-research-plan-approve"]')?.click());
  for (let i = 0; i < 24; i += 1) {
    const st = await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'));
    if (st !== 'rsh_source_activity') break;
    await page.evaluate(() => document.querySelector('[data-testid="u2-research-activity-next"]')?.click());
    await page.waitForTimeout(100);
  }
  await page.waitForTimeout(500);
});

// م2 — برمج: the 220px sticky file tree beside the diffs
await shot('code-tree-1440.png', 1440, 1000, '/ar/app/code', async (page) => {
  await page.evaluate(() => {
    const req = document.querySelector('[data-testid="u2-code-request"]');
    if (req) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(req, 'أضف صفحة إعدادات');
      req.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelector('[data-testid^="u2-code-task-"]')?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-testid="u2-code-scope-submit"]')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-testid="u2-code-plan-approve"]')?.click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-testid="u2-code-proposal-continue"]')?.click());
  await page.waitForTimeout(600);
});

// م2 — حلّل: the dashed dropzone on the source stage
await shot('analyze-dropzone-1440.png', 1440, 1000, '/ar/app/analyze');

await browser.close();
console.log('done →', OUT);
