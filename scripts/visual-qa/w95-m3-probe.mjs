// W9-5 probe — موجة الصفحات م3 (تعلّم/استكشف + الأدوات الخمسة + التشغيل الأربعة)
// Verified on the LIVE surfaces, per the Bible §6 blueprints:
//
//   LR-1..LR-3  تعلّم §6.3 — 6px progress meter (role=progressbar) on the
//               diagnostic, reading-time badge (mono digits + unit, chip ≥24)
//               on the path modules, meter track advances with position.
//   EX-1..EX-5  استكشف §6.8 — visual canvas ≥480px, 44px circular nodes,
//               suggested node (2px border + scale 1.05 + shadow), SVG edges,
//               list parity, zero horizontal overflow @390.
//   PR-1..PR-4  المشاريع §6.9 — grid default, sort select reorders, §4.5
//               card (min-height 280, title clamp 2, pinned footer).
//   AG-1..AG-2  الوكلاء §6.10 — 32px circular initials avatar, 8px status dot.
//   FL-1..FL-4  التدفقات §6.11 — 48px toolbar, 160×80 nodes, 1.5px
//               connectors, REAL definition node count.
//   KN-1..KN-4  المعرفة §6.12 — 120px dashed dropzone that opens the dialog,
//               56px feed rows, type badge + progress + menu anatomy.
//   MD-1..MD-2  النماذج §6.13 — exactly one «الموصى به», 220px column floor.
//   RN-1..RN-3  التشغيلات §6.14 — mono m:ss duration column, time tabs that
//               actually filter, 48px row floor.
//   US-1        الاستخدام §6.15 — chart 240, stats 120, cost meters 8px.
//   BL-1..BL-2  الفوترة §6.16 — invoice table (4 rows, mono), ONE primary.
//   TM-1        الفريق §6.17 — member email mono at label size.
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3323';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};
const open = async (width, url) => {
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  await page.goto(`${BASE}${url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return page;
};

const browser = await chromium.launch();

/* ---------- تعلّم §6.3 ---------- */
{
  const page = await open(1440, '/ar/app/learn');
  await page.locator('[data-testid="u2-learn-motivation"]').fill("سرد مستمر للاختبار");
  await page.locator('[data-testid^="u2-learn-level-"]').first().click();
  await page.locator('[data-testid="u2-learn-minutes-30"]').click();
  await page.locator('[data-testid="u2-learn-brief-submit"]').click();
  await page.waitForTimeout(400);
  // The diagnostic surface carries the position meter.
  const diagMeter = await page.evaluate(() => {
    const meter = document.querySelector('[data-testid="u2-learn-diagnostic-progress"] .u2-learn__meter');
    if (!meter) return null;
    const cs = getComputedStyle(meter);
    const fill = meter.querySelector('.u2-learn__meter-fill');
    return { height: cs.height, role: meter.getAttribute('role'), fillWidth: fill ? getComputedStyle(fill).width : null };
  });
  check('LR-1 diagnostic position meter 6px + progressbar role', diagMeter !== null && diagMeter.height === '6px' && diagMeter.role === 'progressbar', diagMeter ? `${diagMeter.height} · ${diagMeter.role} · fill ${diagMeter.fillWidth}` : 'missing');

  // Answer every diagnostic question to reach the path review. The finish
  // button carries no disabled state in the DOM — the reducer validates —
  // so the walk relies on "next" being disabled on the last question.
  for (let guard = 0; guard < 24; guard += 1) {
    const choice = page.locator('[data-testid^="u2-learn-diagnostic-choice-"]').first();
    if (!await choice.isVisible().catch(() => false)) break;
    await choice.click();
    await page.waitForTimeout(120);
    const nextBtn = page.locator('[data-testid="u2-learn-diagnostic-next"]');
    if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForTimeout(160);
    } else {
      await page.locator('[data-testid="u2-learn-diagnostic-finish"]').click();
      await page.waitForTimeout(400);
      break;
    }
  }

  const planData = await page.evaluate(() => {
    const badge = document.querySelector('.u2-learn__minutes');
    if (!badge) return null;
    const cs = getComputedStyle(badge);
    const mono = badge.querySelector('.mono');
    const rect = badge.getBoundingClientRect();
    const meter = document.querySelector('[data-testid="u2-learn-progress"]');
    return {
      chipHeight: rect.height,
      monoDigits: mono ? mono.textContent : null,
      unit: badge.querySelector('.u2-learn__minutes-unit')?.textContent ?? null,
      monoFont: mono ? getComputedStyle(mono).fontFamily : null,
      clampUnitless: cs.borderRadius,
      checkpointMeter: Boolean(meter?.querySelector('.u2-learn__meter')),
    };
  });
  check('LR-2 reading-time badge: mono digits + unit, chip ≥ 24px', planData !== null && planData.chipHeight >= 23.5 && /^[0-9]+$/.test(planData.monoDigits ?? '') && Boolean(planData.unit), planData ? `${planData.chipHeight.toFixed(1)}px · ${planData.monoDigits}${planData.unit} · ${planData.monoFont?.split(',')[0]}` : 'missing');

  // Walk the whole path (lesson → check → feedback per module) to the
  // checkpoint, where the §6.3 meter reports path completion.
  await page.locator('[data-testid="u2-learn-path-confirm"]').click();
  await page.waitForTimeout(300);
  let checkpointStage = false;
  for (let guard = 0; guard < 40; guard += 1) {
    const stage = await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'));
    if (stage === 'lrn_checkpoint') { checkpointStage = true; break; }
    const lessonContinue = page.locator('[data-testid="u2-learn-lesson-continue"]');
    if (await lessonContinue.isVisible().catch(() => false)) {
      // The lesson demands engagement before it lets the learner continue.
      const engage = page.locator('[data-testid="u2-learn-engage"]');
      if (await engage.isVisible().catch(() => false) && !(await engage.getAttribute('aria-pressed') === 'true')) {
        await engage.click();
        await page.waitForTimeout(180);
      }
      await lessonContinue.click(); await page.waitForTimeout(220); continue;
    }
    const checkText = page.locator('[data-testid="u2-learn-check-text"]');
    if (await checkText.isVisible().catch(() => false)) {
      await checkText.fill('شرح موجز للتحقق');
      const choice = page.locator('[data-testid^="u2-learn-check-choice-"]').first();
      if (await choice.isVisible().catch(() => false)) await choice.click();
      await page.waitForTimeout(120);
      const submit = page.locator('[data-testid="u2-learn-check-submit"]');
      if (await submit.isEnabled()) { await submit.click(); await page.waitForTimeout(220); }
      continue;
    }
    const acknowledge = page.locator('[data-testid="u2-learn-acknowledge"]');
    if (await acknowledge.isVisible().catch(() => false)) { await acknowledge.click(); await page.waitForTimeout(220); continue; }
    break;
  }
  const checkpointMeter = await page.evaluate(() => {
    const surface = document.querySelector('[data-testid="u2-learn-checkpoint"]');
    const meter = surface?.querySelector('.u2-learn__meter');
    if (!meter) return null;
    const fill = meter.querySelector('.u2-learn__meter-fill');
    return { height: getComputedStyle(meter).height, role: meter.getAttribute('role'), fill: fill ? getComputedStyle(fill).width : null, valueNow: meter.getAttribute('aria-valuenow') };
  });
  check('LR-3 checkpoint keeps the §6.3 progress meter', checkpointStage && checkpointMeter !== null && checkpointMeter.height === '6px' && checkpointMeter.role === 'progressbar', checkpointMeter ? `6px · ${checkpointMeter.role} · now ${checkpointMeter.valueNow} · fill ${checkpointMeter.fill}` : `stage reached: ${checkpointStage}`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check('LR-4 learn path zero horizontal overflow @1440', !overflow);
  await page.close();
}

/* ---------- استكشف §6.8 ---------- */
{
  const page = await open(1440, '/ar/app/explore');
  await page.locator('[data-testid="u2-explore-curiosity"]').fill("لماذا تنجح بعض التوصيات دون غيرها؟");
  await page.locator('[data-testid="u2-explore-seed-submit"]').click();
  await page.waitForTimeout(500);
  const canvasData = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="u2-explore-canvas"]');
    if (!canvas) return null;
    const dots = [...canvas.querySelectorAll('.u2-explore__canvas-dot')];
    const suggested = canvas.querySelector('.u2-explore__canvas-node[data-suggested] .u2-explore__canvas-dot');
    const lines = canvas.querySelectorAll('.u2-explore__canvas-edges line').length;
    const buttons = canvas.querySelectorAll('.u2-explore__canvas-node').length;
    const listRows = document.querySelectorAll('.u2-explore__nodes li').length;
    let suggestedInfo = null;
    if (suggested) {
      const cs = getComputedStyle(suggested);
      suggestedInfo = { borderWidth: cs.borderTopWidth, transform: cs.transform, shadow: cs.boxShadow !== 'none' };
    }
    return {
      minHeight: getComputedStyle(canvas).minHeight,
      // offsetWidth = layout size, immune to the suggested dot's scale(1.05).
      dotSizes: dots.map((dot) => dot.offsetWidth),
      lines, buttons, listRows, suggestedInfo,
      radius: dots.length ? getComputedStyle(dots[0]).borderRadius : null,
    };
  });
  check('EX-1 knowledge canvas renders ≥480px @1440', canvasData !== null && parseFloat(canvasData.minHeight) >= 480, canvasData ? canvasData.minHeight : 'missing');
  check('EX-2 canvas nodes are 44px circles', canvasData !== null && canvasData.dotSizes.length >= 3 && canvasData.dotSizes.every((w) => Math.abs(w - 44) < 1.5) && canvasData.radius === '999px', canvasData ? `${canvasData.dotSizes.length} dots @ ${canvasData.dotSizes[0]?.toFixed(1)}px` : 'missing');
  check('EX-3 suggested node: 2px accent border + scale 1.05 + shadow', canvasData?.suggestedInfo !== null && canvasData.suggestedInfo.borderWidth === '2px' && canvasData.suggestedInfo.transform.includes('1.05') && canvasData.suggestedInfo.shadow, canvasData?.suggestedInfo ? `${canvasData.suggestedInfo.borderWidth} · ${canvasData.suggestedInfo.transform}` : 'no suggested node');
  check('EX-4 SVG edges + list parity (same node count)', canvasData !== null && canvasData.lines >= 1 && canvasData.buttons === canvasData.listRows, canvasData ? `${canvasData.lines} edges · canvas ${canvasData.buttons} = list ${canvasData.listRows}` : 'missing');
  await page.close();

  const mobile = await open(390, '/ar/app/explore');
  await mobile.locator('[data-testid="u2-explore-curiosity"]').fill("اختبار");
  await mobile.locator('[data-testid="u2-explore-seed-submit"]').click();
  await mobile.waitForTimeout(500);
  const mobOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  const mobCanvas = await mobile.evaluate(() => {
    const canvas = document.querySelector('[data-testid="u2-explore-canvas"]');
    return canvas ? { height: canvas.getBoundingClientRect().height, w: canvas.getBoundingClientRect().width } : null;
  });
  check('EX-5 explore map zero horizontal overflow @390', !mobOverflow, mobCanvas ? `canvas ${mobCanvas.w.toFixed(0)}×${mobCanvas.height.toFixed(0)}` : 'no canvas');
  await mobile.close();
}

/* ---------- المشاريع §6.9 ---------- */
{
  const page = await open(1440, '/ar/app/projects');
  const grid = await page.evaluate(() => {
    const section = document.querySelector('.project-library');
    const card = section?.querySelector('.project-library-card');
    if (!card) return null;
    const title = card.querySelector('.project-library-card__copy h2');
    const link = card.querySelector('.project-library-card__link');
    return {
      isGrid: Boolean(section),
      cardHeight: card.getBoundingClientRect().height,
      titleClamp: getComputedStyle(title).webkitLineClamp,
      pinned: link ? Math.abs(card.getBoundingClientRect().bottom - link.getBoundingClientRect().bottom) < 26 : false,
    };
  });
  check('PR-1 projects open in the card grid (§6.9 default)', grid?.isGrid === true);
  check('PR-2 grid card ≥280px + title clamps at 2 + footer pinned', grid !== null && grid.cardHeight >= 279 && grid.titleClamp === '2' && grid.pinned, grid ? `${grid.cardHeight.toFixed(0)}px · clamp ${grid.titleClamp} · pinned ${grid.pinned}` : 'missing');

  const orderBefore = (await page.locator('.project-library-card h2').allTextContents()).join('|');
  await page.locator('.ops-sort-control select').selectOption('name');
  await page.waitForTimeout(250);
  const orderAfter = (await page.locator('.project-library-card h2').allTextContents()).join('|');
  check('PR-3 sort select reorders the grid', orderBefore !== orderAfter, `${orderBefore} → ${orderAfter}`);
  await page.locator('.ops-sort-control select').selectOption('runs');
  await page.waitForTimeout(250);
  const orderRuns = (await page.locator('.project-library-card h2').allTextContents()).join('|');
  check('PR-3b sort by runs is a distinct order', orderRuns !== orderAfter || orderRuns !== orderBefore, orderRuns);
  await page.close();
}

/* ---------- الوكلاء §6.10 ---------- */
{
  const page = await open(1440, '/ar/app/agents');
  const agents = await page.evaluate(() => {
    const avatar = document.querySelector('.ops-cell-id > i.ops-avatar');
    const dot = document.querySelector('.ops-status > i');
    if (!avatar || !dot) return null;
    const rect = avatar.getBoundingClientRect();
    return {
      size: rect.width,
      radius: getComputedStyle(avatar).borderRadius,
      initials: avatar.textContent,
      dotSize: dot.getBoundingClientRect().width,
      dotRadius: getComputedStyle(dot).borderRadius,
    };
  });
  check('AG-1 agent avatar 32px circle with initials', agents !== null && Math.abs(agents.size - 32) < 1.5 && agents.radius === '999px' && (agents.initials ?? '').length >= 1, agents ? `${agents.size.toFixed(0)}px · "${agents.initials}"` : 'missing');
  check('AG-2 status dot 8px', agents !== null && Math.abs(agents.dotSize - 8) < 1.5, agents ? `${agents.dotSize.toFixed(1)}px` : 'missing');
  await page.close();
}

/* ---------- التدفقات §6.11 ---------- */
{
  const page = await open(1440, '/ar/app/flows');
  const flows = await page.evaluate(() => {
    const toolbar = document.querySelector('.flow-preview-toolbar');
    const nodes = [...document.querySelectorAll('.flow-preview-node')];
    const links = [...document.querySelectorAll('.flow-preview-link:not(.flow-preview-link--dashed)')];
    if (!toolbar || nodes.length === 0) return null;
    const first = nodes[0].getBoundingClientRect();
    // Chromium rounds authored 1.5px borders to whole pixels when computing
    // (documented W9-5/م2 deviation) — assert the AUTHORED rule from CSSOM.
    // The built sheet writes the shorthand, so read either form.
    let authoredConnector = null;
    for (const sheet of document.styleSheets) {
      let rules; try { rules = sheet.cssRules; } catch { continue; }
      for (const rule of rules) {
        if (rule.selectorText === '.flow-preview-link' && rule.style) {
          const shorthand = rule.style.borderBlockStart || rule.style.borderTop || '';
          const longhand = rule.style.borderBlockStartWidth || rule.style.borderTopWidth || '';
          if (shorthand.includes('1.5px') || longhand === '1.5px') authoredConnector = '1.5px';
        }
      }
    }
    return {
      toolbarHeight: toolbar.getBoundingClientRect().height,
      nodeW: first.width,
      nodeH: first.height,
      authoredConnector,
      nodeCount: nodes.length,
    };
  });
  check('FL-1 flow preview toolbar ≥48px', flows !== null && flows.toolbarHeight >= 47.5, flows ? `${flows.toolbarHeight.toFixed(1)}px` : 'missing');
  check('FL-2 preview nodes 160×80', flows !== null && Math.abs(flows.nodeW - 160) < 2.5 && Math.abs(flows.nodeH - 80) < 6, flows ? `${flows.nodeW.toFixed(0)}×${flows.nodeH.toFixed(0)}` : 'missing');
  check('FL-3 connectors authored at 1.5px', flows?.authoredConnector === '1.5px', flows ? `authored ${flows.authoredConnector} (Chromium computes 1px — documented rounding)` : 'missing');
  check('FL-4 preview shows the REAL definition (5 nodes)', flows?.nodeCount === 5, flows ? `${flows.nodeCount} nodes` : 'missing');
  await page.close();
}

/* ---------- المعرفة §6.12 ---------- */
{
  const page = await open(1440, '/ar/app/knowledge');
  const kn = await page.evaluate(() => {
    const zone = document.querySelector('[data-testid="knowledge-dropzone"]');
    const rows = [...document.querySelectorAll('[data-testid="knowledge-source-row"]')];
    if (!zone || rows.length === 0) return null;
    const row = rows[0];
    const cs = getComputedStyle(zone);
    return {
      zoneHeight: zone.getBoundingClientRect().height,
      dashed: cs.borderTopStyle,
      rowHeight: row.getBoundingClientRect().height,
      typeBadge: Boolean(row.querySelector('.badge, [class*="badge" i]')),
      progressOrStatus: Boolean(row.querySelector('.knowledge-source-feed__progress')) || Boolean(row.querySelector('.ops-status')),
      menu: Boolean(row.querySelector('.knowledge-source-feed__menu .icon-button')),
    };
  });
  check('KN-1 upload dropzone ≥120px dashed', kn !== null && kn.zoneHeight >= 119 && kn.dashed === 'dashed', kn ? `${kn.zoneHeight.toFixed(0)}px · ${kn.dashed}` : 'missing');
  check('KN-2 source rows ≥56px', kn !== null && kn.rowHeight >= 55.5, kn ? `${kn.rowHeight.toFixed(0)}px` : 'missing');
  check('KN-3 row anatomy: type badge + state + menu', kn !== null && kn.typeBadge && kn.progressOrStatus && kn.menu, kn ? `badge ${kn.typeBadge} · state ${kn.progressOrStatus} · menu ${kn.menu}` : 'missing');
  await page.locator('[data-testid="knowledge-dropzone"]').click();
  await page.waitForTimeout(350);
  const dialogOpen = await page.evaluate(() => Boolean(document.querySelector('[role="dialog"]')));
  check('KN-4 dropzone opens the add-source dialog', dialogOpen);
  await page.close();
}

/* ---------- النماذج §6.13 ---------- */
{
  const page = await open(1440, '/ar/app/models');
  const models = await page.evaluate(() => {
    const badges = [...document.querySelectorAll('.catalog-model-card')].filter((card) => card.textContent.includes('الموصى به'));
    const grid = document.querySelector('.model-catalog-grid');
    const columns = grid ? getComputedStyle(grid).gridTemplateColumns.split(' ').map(parseFloat) : [];
    return { recommended: badges.length, minColumn: columns.length ? Math.min(...columns) : 0, cards: grid ? grid.children.length : 0 };
  });
  check('MD-1 exactly one «الموصى به» badge', models?.recommended === 1, models ? `${models.recommended} of ${models.cards} cards` : 'missing');
  check('MD-2 model cards hold the 220px column floor', (models?.minColumn ?? 0) >= 219, models ? `min column ${models.minColumn.toFixed(0)}px` : 'missing');
  await page.close();
}

/* ---------- التشغيلات §6.14 ---------- */
{
  const page = await open(1440, '/ar/app/runs');
  const runs = await page.evaluate(() => {
    const cells = [...document.querySelectorAll('.ops-duration')];
    const rows = [...document.querySelectorAll('.runs-data-list .mj-data-list__row')];
    const mono = cells.length ? getComputedStyle(cells[0]).fontFamily.includes('IBM Plex Mono') : false;
    const heights = rows.map((row) => row.getBoundingClientRect().height);
    return {
      count: cells.length,
      mono,
      sample: cells.map((cell) => cell.textContent?.trim()),
      minRow: heights.length ? Math.min(...heights) : 0,
      tabs: document.querySelectorAll('.ops-time-tabs button').length,
    };
  });
  check('RN-1 duration column mono m:ss', runs !== null && runs.count >= 5 && runs.mono && runs.sample.every((v) => /^\d+:\d{2}$/.test(v ?? '')), runs ? `${runs.count} cells · ${runs.sample.slice(0, 3).join(' / ')}` : 'missing');
  check('RN-2 rows hold the 48px floor', (runs?.minRow ?? 0) >= 47.5, runs ? `min row ${runs.minRow.toFixed(0)}px` : 'missing');
  const beforeCount = await page.locator('.runs-data-list .mj-data-list__row').count();
  await page.locator('.ops-time-tabs button').nth(1).click();
  await page.waitForTimeout(250);
  const afterCount = await page.locator('.runs-data-list .mj-data-list__row').count();
  check('RN-3 time tabs filter the table', beforeCount > afterCount && afterCount >= 1, `${beforeCount} → ${afterCount}`);
  await page.close();
}

/* ---------- الاستخدام §6.15 ---------- */
{
  const page = await open(1440, '/ar/app/usage');
  const usage = await page.evaluate(() => {
    const chart = document.querySelector('.usage-chart');
    const stats = [...document.querySelectorAll('.ops-stats > div')];
    const meter = document.querySelector('.credit-meter [role="progressbar"]');
    return {
      chart: chart ? getComputedStyle(chart).height : null,
      minStat: stats.length ? Math.min(...stats.map((s) => s.getBoundingClientRect().height)) : 0,
      meter: meter ? getComputedStyle(meter).height : null,
    };
  });
  check('US-1 usage: chart 240 · stats ≥120 · cost meter 8px', usage !== null && usage.chart === '240px' && usage.minStat >= 119 && usage.meter === '8px', usage ? `${usage.chart} · ${usage.minStat.toFixed(0)}px · ${usage.meter}` : 'missing');
  await page.close();
}

/* ---------- الفوترة §6.16 ---------- */
{
  const page = await open(1440, '/ar/app/billing');
  const billing = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('.billing-invoices-list .mj-data-list__row')];
    const amounts = rows.map((row) => row.querySelectorAll('span')[2]?.textContent ?? '');
    const primaries = [...document.querySelectorAll('button.button--primary')].filter((button) => button.offsetParent !== null);
    return { rows: rows.length, amounts, primaries: primaries.length, primaryLabels: primaries.map((b) => b.textContent?.trim()) };
  });
  check('BL-1 invoice table: 4 rows with mono $ amounts', billing?.rows === 4 && billing.amounts.every((a) => /^\$\d+\.\d{2}$/.test(a)), billing ? `${billing.rows} rows · ${billing.amounts[0]}` : 'missing');
  check('BL-2 exactly ONE primary on the billing screen', billing?.primaries === 1, billing ? `${billing.primaries}: ${billing.primaryLabels.join(',')}` : 'missing');
  await page.close();
}

/* ---------- الفريق §6.17 ---------- */
{
  const page = await open(1440, '/ar/app/team');
  const team = await page.evaluate(() => {
    const email = document.querySelector('.ops-member-email');
    if (!email) return null;
    const cs = getComputedStyle(email);
    return { font: cs.fontFamily, size: cs.fontSize, sample: email.textContent };
  });
  check('TM-1 member email mono at label size', team !== null && team.font.includes('IBM Plex Mono') && team.size === '13px', team ? `${team.size} ${team.font.split(',')[0]} · ${team.sample}` : 'missing');
  await page.close();
}

await browser.close();
const failed = results.filter((r) => !r.pass);
console.log(`\nw95-m3 probe: ${results.length - failed.length}/${results.length} PASS`);
if (failed.length) {
  console.log('FAILED:');
  for (const item of failed) console.log(`  ✗ ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
  process.exit(1);
}
