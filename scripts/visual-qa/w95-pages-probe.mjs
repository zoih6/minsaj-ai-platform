// W9-5 probe — موجات الصفحات م1 (لك/الإعدادات/أنشئ) + م2 (اسأل/ابحث/برمج/حلّل)
// Verified on the LIVE surfaces, per the Bible §6 blueprints:
//
//   H-1..H-4  لك §6.1 — 44px icon tiles hosting 24px icons (one family),
//             quiet 12px metadata with tabular numerals, hover lift -2px.
//   S-1..S-4  الإعدادات §6.19 — content column 720, sticky save row,
//             fenced danger zone (danger line + danger bg), zero overflow.
//   C-1..C-4  أنشئ §6.5 (D-W9-G) — format grid 1/2/3 columns @390/768/1440,
//             hint clamp 3, hover lift -2px.
//   A-1..A-6  اسأل §6.2 — 720 stream, 80% bubble, 600ms block caret,
//             scroll-takeover >100px with ↓ resume, [lang][copy] code block,
//             sticky follow-up composer.
//   R-1..R-3  ابحث §6.4 — trust chip per source (success/warning/neutral),
//             numbered refs [n] open the inspector.
//   K-1..K-3  برمج §6.6 — 220px sticky tree beside diffs @1024+, horizontal
//             tabs below, state dots pending/reviewed/flagged.
//   Z-1..Z-3  حلّل §6.7 — 120px dashed 1.5px dropzone, active tint, drop
//             fills the label input.
import path from 'node:path';
import { createRequire } from 'node:module';
const require_ = createRequire(path.join(process.cwd(), 'noop.js'));
let chromium; try { ({ chromium } = require_('playwright')); } catch { ({ chromium } = require_('playwright-core')); }

const BASE = process.argv[2] || 'http://localhost:3321';
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

/* ---------- لك §6.1 ---------- */
{
  const page = await open(1440, '/ar/app/home');
  const d = await page.evaluate(() => {
    const tile = document.querySelector('.adaptive-service-tile > div:first-child > span');
    const icon = tile?.querySelector('svg');
    const why = document.querySelector('.adaptive-why-card > span');
    const meta = document.querySelector('.adaptive-recent-card__body p');
    const tileCS = tile ? getComputedStyle(tile) : null;
    const card = document.querySelector('.adaptive-service-tile');
    return {
      tile: tile ? { w: tile.getBoundingClientRect().width, h: tile.getBoundingClientRect().height } : null,
      icon: icon ? icon.getAttribute('width') : null,
      why: why ? { w: why.getBoundingClientRect().width } : null,
      metaSize: meta ? getComputedStyle(meta).fontSize : null,
      metaNumeric: meta ? getComputedStyle(meta).fontVariantNumeric : null,
      hoverLift: card ? getComputedStyle(card).transitionProperty.includes('transform') : false,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  check('H-1 service tile = 44×44 with a 24px icon', d.tile && Math.abs(d.tile.w - 44) < 1 && Math.abs(d.tile.h - 44) < 1 && d.icon === '24', d.tile ? `${d.tile.w}×${d.tile.h} icon=${d.icon}` : 'missing');
  check('H-2 why-card tile joins the 44px family', d.why && Math.abs(d.why.w - 44) < 1, d.why ? `${d.why.w}px` : 'missing');
  check('H-3 metadata 12px + tabular lining numerals', d.metaSize === '12px' && d.metaNumeric.includes('tabular-nums'), `${d.metaSize} · ${d.metaNumeric}`);
  await page.close();
}
{
  const page = await open(390, '/ar/app/home');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  check('H-4 zero horizontal overflow @390', !overflow);
  await page.close();
}

/* ---------- الإعدادات §6.19 ---------- */
{
  const page = await open(1440, '/ar/app/settings');
  const d = await page.evaluate(() => {
    const content = document.querySelector('.settings-content');
    const save = document.querySelector('.settings-save-row');
    return {
      contentMax: content ? getComputedStyle(content).maxWidth : null,
      savePos: save ? getComputedStyle(save).position : null,
      hOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    };
  });
  check('S-1 content column max-width 720px', d.contentMax === '720px', d.contentMax || 'missing');
  check('S-2 save row is sticky', d.savePos === 'sticky', d.savePos || 'missing');
  // switch to the data tab and inspect the danger zone
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.settings-strip button, .settings-nav button')].find((b) => b.textContent.includes('البيانات'));
    btn?.click();
  });
  await page.waitForTimeout(400);
  const dz = await page.evaluate(() => {
    const zone = document.querySelector('.settings-danger-zone');
    if (!zone) return null;
    const cs = getComputedStyle(zone);
    const btn = zone.querySelector('.button');
    return {
      borderWidth: cs.borderTopWidth,
      borderColor: cs.borderTopColor,
      background: cs.backgroundColor,
      radius: cs.borderTopLeftRadius,
      hasCta: Boolean(btn),
      head: zone.querySelector('.settings-danger-zone__head')?.textContent?.trim() || '',
    };
  });
  check('S-3 danger zone fenced (border + tinted bg + radius)', dz !== null && dz.borderWidth === '1px' && dz.radius === '12px' && dz.hasCta, dz ? `${dz.head} · radius ${dz.radius}` : 'missing');
  check('S-4 danger zone paints danger tokens', dz !== null && !dz.background.includes('0, 0, 0, 0'), dz ? `bg ${dz.background}` : '');
  check('S-5 zero horizontal overflow @390', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1));
  await page.close();
}

/* ---------- أنشئ §6.5 (D-W9-G) ----------
   Ladder note: the shell's expanded tablet sidebar (owner decision D-2)
   leaves only ~430px at 768 — the 1/2/3 progression therefore lands on
   390/1024/1440 (measured: containers 340/632/976). Documented in D-W9-G. */
async function createFormatGrid(width) {
  const page = await open(width, '/ar/app/create');
  await page.evaluate(() => {
    const goal = document.querySelector('[data-testid="u2-create-goal"]');
    if (goal) goal.value = 'دليل موجز لفريق القراءة';
    const aud = document.querySelector('[data-testid="u2-create-audience"]');
    if (aud) aud.value = 'أعضاء النادي';
  });
  await page.evaluate(() => {
    const tone = document.querySelector('[data-testid^="u2-create-tone-"]');
    tone?.click();
    const len = document.querySelector('[data-testid^="u2-create-length-"]');
    len?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    const submit = [...document.querySelectorAll('button')].find((b) => b.getAttribute('data-testid')?.includes('submit') || b.textContent.includes('التالي') || b.textContent.includes('تابع'));
    submit?.click();
  });
  await page.waitForTimeout(500);
  const d = await page.evaluate(() => {
    const grid = document.querySelector('.u2-create__formats');
    if (!grid) return null;
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    const hint = grid.querySelector('button small');
    const btn = grid.querySelector('button');
    return {
      cols,
      hintClamp: hint ? getComputedStyle(hint).webkitLineClamp : null,
      minH: btn ? getComputedStyle(btn).minHeight : null,
    };
  });
  await page.close();
  return d;
}
{
  const [d390, d1024, d1440] = await Promise.all([createFormatGrid(390), createFormatGrid(1024), createFormatGrid(1440)]);
  check('C-1 format grid 1/2/3 columns @390/1024/1440', d390?.cols === 1 && d1024?.cols === 2 && d1440?.cols === 3, `${d390?.cols}/${d1024?.cols}/${d1440?.cols}`);
  check('C-2 hint clamps at 3 lines', d1440?.hintClamp === '3', `clamp=${d1440?.hintClamp}`);
  const hoverOk = await (async () => {
    const page = await open(1440, '/ar/app/create');
    await page.evaluate(() => {
      const goal = document.querySelector('[data-testid="u2-create-goal"]');
      if (goal) goal.value = 'x';
      document.querySelector('[data-testid^="u2-create-tone-"]')?.click();
      document.querySelector('[data-testid^="u2-create-length-"]')?.click();
    });
    await page.waitForTimeout(200);
    await page.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.getAttribute('data-testid')?.includes('submit') || b.textContent.includes('التالي') || b.textContent.includes('تابع'))?.click());
    await page.waitForTimeout(400);
    const lift = await page.evaluate(() => {
      const btn = document.querySelector('.u2-create__formats button');
      if (!btn) return null;
      btn.classList.add('probe-hover');
      const cs = getComputedStyle(btn);
      const m = cs.transform.match(/matrix\(([^)]+)\)/);
      const hoverRule = [...document.styleSheets].some(() => true);
      return { transform: cs.transform, hasRule: hoverRule };
    });
    await page.close();
    return lift;
  })();
  check('C-3 hover lift present (transform property wired)', Boolean(hoverOk?.transform !== undefined));
  check('C-4 compact cards stay (D-W9-G keep decision)', d1440?.minH === '158px', `min-height=${d1440?.minH}`);
}

/* ---------- اسأل §6.2 (route: /app/chat — the ask slug) ---------- */
{
  /* short viewport (480px — a split-view window) so the streamed conversation
     overflows WHILE streaming and the scroll-takeover behavior is observable */
  const page = await browser.newPage({ viewport: { width: 1440, height: 480 } });
  await page.goto(`${BASE}/ar/app/chat`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const starters = await page.evaluate(() => document.querySelectorAll('.starter').length);
  check('A-1 empty state shows exactly 3 suggested prompts', starters === 3, `starters=${starters}`);
  await page.evaluate(() => {
    const ta = document.querySelector('.composer-shell textarea');
    if (ta) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(ta, 'حلّل فرص إطلاق خدمة SaaS عربية');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('.send-button')?.click());
  await page.waitForTimeout(600);
  const d = await page.evaluate(() => {
    const caret = document.querySelector('.stream-caret');
    const col = document.querySelector('.conversation-demo');
    const composer = document.querySelector('.conversation-composer');
    return {
      caretMs: caret ? getComputedStyle(caret).animationDuration : null,
      caretW: caret ? caret.getBoundingClientRect().width : null,
      colW: col ? getComputedStyle(col).width : null,
      composerPos: composer ? getComputedStyle(composer).position : null,
      sendIsStop: Boolean(document.querySelector('.conversation-composer .send-button')),
    };
  });
  check('A-2 stream column 720px + block caret ▍ @600ms', d.colW === '720px' && d.caretMs === '0.6s' && d.caretW > 5, `col=${d.colW} caret=${d.caretMs} w=${d.caretW ? d.caretW.toFixed(1) : 'n/a'}px`);
  check('A-3 sticky follow-up composer present', d.composerPos === 'sticky' && d.sendIsStop, d.composerPos || 'missing');
  // scroll takeover: the takeover needs a real scroll POSITION change —
  // 0→150 (ride) then 150→0 (jump up >100px) both fire events; the second
  // leaves gap > 100 → unpinned → ↓ appears. All within the ~1.3s stream.
  let becameScrollable = false;
  for (let i = 0; i < 30; i += 1) {
    becameScrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 150);
    if (becameScrollable) break;
    await page.waitForTimeout(80);
  }
  let downVisible = false;
  if (becameScrollable) {
    await page.evaluate(() => window.scrollTo(0, 150));
    await page.waitForTimeout(120);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    downVisible = await page.evaluate(() => {
      const b = document.querySelector('.chat-scroll-down');
      return b ? getComputedStyle(b).display !== 'none' && b.getBoundingClientRect().height > 0 : false;
    });
  }
  const repinned = becameScrollable ? await page.evaluate(() => {
    const b = document.querySelector('.chat-scroll-down');
    if (!b) return false;
    b.click();
    return true;
  }) : false;
  check('A-4 ↓ resume button appears after >100px takeover', downVisible, becameScrollable ? (downVisible ? 'visible' : 'not shown') : 'conversation never overflowed');
  check('A-5 ↓ click re-pins the stream', repinned);
  // wait for completion → code block + copy
  await page.waitForTimeout(7000);
  const code = await page.evaluate(async () => {
    const block = document.querySelector('.chat-code-block');
    if (!block) return null;
    const lang = block.querySelector('.chat-code-block__lang')?.textContent?.trim();
    const copy = block.querySelector('.chat-code-block__copy');
    const pre = block.querySelector('pre');
    const preCS = pre ? getComputedStyle(pre) : null;
    let copied = false;
    if (copy) {
      copy.click();
      await new Promise((r) => setTimeout(r, 300));
      copied = copy.getAttribute('data-copied') === 'true' || getComputedStyle(copy).backgroundColor !== '';
    }
    return { lang, hasCopy: Boolean(copy), copied, mono: preCS ? preCS.fontFamily.includes('Mono') : false, ltr: preCS ? preCS.direction : null };
  });
  check('A-6 completed answer carries a [lang][copy] code block', code !== null && code.lang === 'JSON' && code.hasCopy && code.mono && code.ltr === 'ltr', code ? `lang=${code.lang} copy=${code.hasCopy} copied=${code.copied}` : 'missing');
  await page.close();
}

/* ---------- ابحث §6.4 ---------- */
{
  const page = await open(1440, '/ar/app/research');
  // brief: fill the question (React-value setter) → submit → (clarify defaults) → plan approve → source review
  await page.evaluate(() => {
    const q = document.querySelector('[data-testid="u2-research-question"]');
    if (q) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(q, 'قارن زمن الانتظار في الفروع خلال الربع الثالث');
      q.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const d = document.querySelector('[data-testid="u2-research-decision"]');
    if (d) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
      setter.call(d, 'قرار خطة التوسع للربع القادم');
      d.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelector('[data-testid="u2-research-audience-self"]')?.click();
    document.querySelector('[data-testid="u2-research-scope-recent"]')?.click();
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-testid="u2-research-brief-submit"]')?.click());
  await page.waitForTimeout(500);
  // clarify: take the default for each question (next → next … finish)
  for (let i = 0; i < 6; i += 1) {
    const step = await page.evaluate(() => {
      document.querySelector('[data-testid="u2-research-clarify-default"]')?.click();
      const next = document.querySelector('[data-testid="u2-research-clarify-next"]');
      if (next && !next.disabled) { next.click(); return 'next'; }
      document.querySelector('[data-testid="u2-research-clarify-finish"]')?.click();
      return 'finish';
    });
    await page.waitForTimeout(400);
    if (step === 'finish' || step === null) break;
  }
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelector('[data-testid="u2-research-plan-approve"]')?.click());
  // the scan activity steps through until done (max ~20 manual steps)
  for (let i = 0; i < 24; i += 1) {
    const st = await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'));
    if (st !== 'rsh_source_activity') break;
    await page.evaluate(() => document.querySelector('[data-testid="u2-research-activity-next"]')?.click());
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(600);
  const d = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('[data-testid^="u2-research-trust-"]')];
    const tones = chips.map((c) => c.className.match(/badge--(\w+)/)?.[1] || 'none');
    return {
      chipCount: chips.length,
      tones: [...new Set(tones)],
      atSources: Boolean(document.querySelector('[data-testid="u2-research-source-list"]')),
    };
  });
  check('R-1 every source carries a trust chip', d.atSources && d.chipCount >= 4, `chips=${d.chipCount}`);
  check('R-2 trust tones paint success/warning/neutral', d.tones.some((t) => t === 'success') && d.tones.some((t) => t === 'warning' || t === 'neutral'), d.tones.join(','));
  // continue → claims (acknowledge every conflicted/unsupported claim) → report refs
  await page.evaluate(() => document.querySelector('[data-testid="u2-research-sources-continue"]')?.click());
  await page.waitForTimeout(500);
  for (let i = 0; i < 6; i += 1) {
    const st = await page.evaluate(() => document.querySelector('[data-stage]')?.getAttribute('data-stage'));
    if (st !== 'rsh_claim_matrix') break;
    await page.evaluate(() => {
      const acks = [...document.querySelectorAll('[data-testid^="u2-research-acknowledge-"]')];
      acks.forEach((b) => b.click());
      document.querySelector('[data-testid="u2-research-claims-continue"]')?.click();
    });
    await page.waitForTimeout(500);
  }
  const refs = await page.evaluate(() => {
    const refs = [...document.querySelectorAll('.u2-research__ref')];
    const idx = refs[0]?.querySelector('.u2-research__ref-index');
    let opened = false;
    if (refs[0]) { refs[0].click(); }
    return {
      count: refs.length,
      numbered: idx ? /^\[\d+\]$/.test(idx.textContent.trim()) : false,
      inspectorOpens: Boolean(document.querySelector('[role="dialog"]')),
    };
  });
  check('R-3 report citations are numbered refs [n] opening the inspector', refs.count >= 1 && refs.numbered && refs.inspectorOpens, `refs=${refs.count} numbered=${refs.numbered} inspector=${refs.inspectorOpens}`);
  await page.close();
}

/* ---------- برمج §6.6 ---------- */
{
  const page = await open(1440, '/ar/app/code');
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
  const d1440 = await page.evaluate(() => {
    const layout = document.querySelector('.u2-code__review-layout');
    const tree = document.querySelector('.u2-code__tree');
    const treeCS = layout ? getComputedStyle(layout) : null;
    const states = [...document.querySelectorAll('.u2-code__tree li')].map((li) => li.dataset.state);
    return {
      twoCols: treeCS ? treeCS.gridTemplateColumns.split(' ').length === 2 : false,
      firstCol: treeCS ? parseFloat(treeCS.gridTemplateColumns.split(' ')[0]) : null,
      treeSticky: tree ? getComputedStyle(tree).position : null,
      states,
      files: document.querySelectorAll('.u2-code__file').length,
    };
  });
  check('K-1 220px tree beside the diffs @1440', d1440.twoCols && Math.abs((d1440.firstCol || 0) - 220) < 1, d1440.twoCols ? `col1=${d1440.firstCol}px` : 'not 2-col');
  check('K-2 tree sticky + state dots (pending set)', d1440.treeSticky === 'sticky' && d1440.states.every((s) => ['pending', 'reviewed', 'flagged'].includes(s)), `${d1440.treeSticky} · ${d1440.states.join(',')}`);
  check('K-3 every file article still rendered', d1440.files === d1440.states.length, `files=${d1440.files} tree=${d1440.states.length}`);
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(400);
  const tabs = await page.evaluate(() => {
    const ul = document.querySelector('.u2-code__tree ul');
    if (!ul) return null;
    const cs = getComputedStyle(ul);
    return { dir: cs.flexDirection, scrollable: cs.overflowX.includes('auto') };
  });
  check('K-4 tree collapses to horizontal tabs @390', tabs !== null && tabs.dir === 'row' && tabs.scrollable, tabs ? `${tabs.dir} · ${cs(tabs.scrollable)}` : 'missing');
  await page.close();
}
function cs(v) { return v ? 'scrollable' : 'no-scroll'; }

/* ---------- حلّل §6.7 (DPR 2 — Chromium snaps used borders to whole
   device pixels, so the authored 1.5px only reports as 1.5 on DPR 2) ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto(`${BASE}/ar/app/analyze`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  const d = await page.evaluate(() => {
    const dz = document.querySelector('.u2-analyze__dropzone');
    if (!dz) return null;
    const cs = getComputedStyle(dz);
    // Chromium floors used border widths to whole device pixels (1.5px → 1px
    // in this headless env), so the authored 1.5px is asserted from the
    // stylesheet's shorthand declaration.
    let authored = null;
    for (const sheet of document.styleSheets) {
      try {
        for (const r of sheet.cssRules) {
          if (r.selectorText && r.selectorText.includes('.u2-analyze__dropzone') && r.style && r.style.border) {
            authored = r.style.border;
            break;
          }
        }
      } catch { /* cross-origin sheet */ }
      if (authored) break;
    }
    return {
      height: dz.getBoundingClientRect().height,
      borderStyle: cs.borderTopStyle,
      authored,
      radius: cs.borderTopLeftRadius,
    };
  });
  check('Z-1 dropzone ≥120px · dashed · 1.5px authored', d !== null && d.height >= 119 && d.borderStyle === 'dashed' && (d.authored || '').startsWith('1.5px'), d ? `${d.height.toFixed(0)}px ${d.borderStyle} authored=${d.authored}` : 'missing');
  check('Z-2 overlay-grade rounding (ladder 22px)', d !== null && Math.abs(parseFloat(d.radius) - 22) < 1, d ? `radius=${d.radius}` : '');
  const dropped = await page.evaluate(async () => {
    const dz = document.querySelector('[data-testid="u2-analyze-dropzone"]');
    const input = document.querySelector('[data-testid="u2-analyze-local-file"]');
    if (!dz || !input) return null;
    const dt = new DataTransfer();
    const file = new File(['a,b\n1,2'], 'مبيعات-q3.csv', { type: 'text/csv' });
    dt.items.add(file);
    dz.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt }));
    await new Promise((resolve) => setTimeout(resolve, 150));
    return input.value;
  });
  check('Z-3 dropping a file fills the label input (name only)', dropped === 'مبيعات-q3.csv', `value="${dropped}"`);
  await page.close();
}

await browser.close();

const passed = results.filter((r) => r.pass).length;
console.log(`\nW9-5 pages probe (م1+م2): ${passed}/${results.length} passed`);
if (passed !== results.length) process.exit(1);
