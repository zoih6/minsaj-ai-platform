#!/usr/bin/env node
// ============================================================================
// G-7 token lint — custom checks half (W-DS Phase 0 · WARN MODE)
// ----------------------------------------------------------------------------
// Companion to .stylelintrc.json (which enforces R-SPACE-1 / R-SURF-2/3 /
// R-TYPE-1 as stylelint warnings). This script owns the context-aware checks
// stylelint cannot express, and produces the metric baseline that VISUAL-QA
// gate G-7 tracks to zero across the W-DS phases:
//
//   1. raw-spacing        R-SPACE-1  · matrix SPC-01  — raw px/rem/em literals
//                                              in padding/margin/gap (census)
//   2. undeclared-radius  R-SURF-2   · matrix SUR-02  — border-radius outside
//                                              the 5-token map / 50% / 0 / 999px
//   3. raw-shadow         R-SURF-3   · matrix SUR-03  — box-shadow outside tokens
//   4. sub-10px-text      R-TYPE-2   · matrix TYP-02  — font-size literals < 10px
//      (+ raw font-size census        matrix TYP-01)
//   5. arabic-tracking    R-RTL-1    · matrix TYP-03  — letter-spacing ≠ 0
//                                              declarations and whether the file
//                                              carries an [lang="ar"] override
//   6. globals-selectors  IMP-02     — globals.css selector count (trend → 0)
//   7. component-classes  G-7        — census of *-card/*-panel/*-button-style
//                                              classes outside the mj-* primitive
//                                              layer; --compare flags NEW names
//
// Usage:
//   node scripts/token-lint.mjs [--out <file.json>] [--compare <file.json>]
//                               [--quiet]
//
// Exit code is always 0 in warn mode (Phase 0–5). Phase 6 flips to error mode.
// Headline "audit-scope" metrics are computed over the same 15 files as the
// W-DS forensic audit (src/app/styles/universal/*.css + src/app/globals.css)
// so the numbers are directly comparable with the audit baseline
// (186 distinct raw paddings · 71 shadows · 23 radii · 23 font sizes).
// ============================================================================

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DEFAULT = path.join(
  ROOT,
  'docs/03-design/reconstruction/evidence/baselines/phase0/g7-baseline.json'
);

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
};
const OUT = flag('--out') || OUT_DEFAULT;
const COMPARE = flag('--compare');
const QUIET = args.includes('--quiet');

// --------------------------------------------------------------------------
// File scope
// --------------------------------------------------------------------------
const AUDIT_FILES = [
  ...fs
    .readdirSync(path.join(ROOT, 'src/app/styles/universal'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => `src/app/styles/universal/${f}`),
  'src/app/globals.css',
];

function walkCss(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(p, acc);
    else if (entry.name.endsWith('.css')) acc.push(p);
  }
  return acc;
}

const allFiles = [
  ...walkCss(path.join(ROOT, 'src')),
  ...(fs.existsSync(path.join(ROOT, 'packages')) ? walkCss(path.join(ROOT, 'packages')) : []),
]
  .map((p) => path.relative(ROOT, p).split(path.sep).join('/'))
  .sort();

// --------------------------------------------------------------------------
// Parsing helpers (same method as the W-DS forensic audit)
// --------------------------------------------------------------------------
const stripComments = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '');

function lineOfIndex(text, idx) {
  let line = 1;
  for (let i = 0; i < idx; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

/** All `prop: value;` declarations with file/line. Skips custom properties. */
function declarations(file, text) {
  const out = [];
  const re = /([a-zA-Z-]+)\s*:\s*([^;{}]+);/g;
  let m;
  while ((m = re.exec(text))) {
    const prop = m[1];
    if (prop.startsWith('--')) continue; // token definitions are exempt
    out.push({ file, line: lineOfIndex(text, m.index), prop, value: m[2].trim() });
  }
  return out;
}

const RAW_LEN = /-?\d*\.?\d+(px|rem|em)\b/;
const PX_VAL = (v) => {
  const m = v.match(/^(-?\d*\.?\d+)px$/);
  return m ? parseFloat(m[1]) : null;
};
/** Extract the size from a `font:` shorthand value (the token carrying px
 *  before the line-height slash / family). Catches sub-10px text that hides
 *  from `font-size` scans (matrix TYP-02: `font: 500 8px/1 "IBM Plex Mono"`). */
const FONT_SHORTHAND_SIZE = (v) => {
  const m = v.match(/(?:^|\s)(\d*\.?\d+)(px|rem|em|pt)(?=\s*\/|\s|$)/);
  return m ? { num: parseFloat(m[1]), unit: m[2] } : null;
};

const RADIUS_OK =
  /^(var\(--u-radius|var\([^)]+\)(,\s*var\([^)]+\))*$|(var\([^)]+\)|50%|0|999px)(\s+(var\([^)]+\)|50%|0|999px))*$)/;
const SHADOW_OK = /^(var\(--u-shadow|var\([^)]+\)(,\s*var\([^)]+\))*$)/;
const FS_OK = /^(var\(--(mj|u)-text|var\([^)]+\)$)/;

// --------------------------------------------------------------------------
// Census
// --------------------------------------------------------------------------
const records = {
  rawSpacing: [], undeclaredRadius: [], rawShadow: [],
  sub10Text: [], rawFontSize: [], tracking: [],
};
const perFile = {};
const fileTexts = {};

for (const rel of allFiles) {
  const raw = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const text = stripComments(raw);
  fileTexts[rel] = text;
  const decls = declarations(rel, text);
  perFile[rel] = { declarations: decls.length };

  for (const d of decls) {
    if (/^(padding|margin|gap)/.test(d.prop) && RAW_LEN.test(d.value)) records.rawSpacing.push(d);
    if (d.prop === 'border-radius' && !RADIUS_OK.test(d.value)) records.undeclaredRadius.push(d);
    if (d.prop === 'box-shadow' && !SHADOW_OK.test(d.value) && d.value !== 'none' && d.value !== 'inherit')
      records.rawShadow.push(d);
    if (d.prop === 'font-size') {
      if (!FS_OK.test(d.value) && !['0', 'inherit', 'larger', 'smaller'].includes(d.value)) {
        records.rawFontSize.push(d);
        const px = PX_VAL(d.value);
        if (px !== null && px < 10) records.sub10Text.push(d);
      }
    }
    if (d.prop === 'font') {
      // `font:` shorthand — the size token hides from font-size scans
      const size = FONT_SHORTHAND_SIZE(d.value);
      if (size) {
        records.rawFontSize.push({ ...d, prop: 'font(size)', value: `${size.num}${size.unit}` });
        if (size.num < 10 && (size.unit === 'px' || size.unit === 'pt'))
          records.sub10Text.push({ ...d, prop: 'font(size)', value: `${size.num}${size.unit}` });
      }
    }
    if (d.prop === 'letter-spacing' && d.value !== '0' && d.value !== 'normal')
      records.tracking.push({
        ...d,
        arOverrideInFile: /\[lang\s*=\s*["']?ar["']?\]|:lang\(\s*ar\s*\)/.test(text),
      });
  }
}

// globals.css selector count (same intent as the audit census: rule blocks
// whose prelude is a selector — at-rule preludes (@media/@keyframes/…) and
// empty preludes are excluded)
const globalsText = fileTexts['src/app/globals.css'] || '';
let globalsSelectors = 0;
for (const m of globalsText.matchAll(/([^{};]+)\{/g)) {
  const prelude = m[1].replace(/\s+/g, ' ').trim();
  if (!prelude || prelude.startsWith('@')) continue;
  globalsSelectors += prelude.split(',').length; // comma groups = selectors
}

// component-class census (card/panel/button families outside mj-* primitives)
const compClasses = new Set();
const classRe = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
for (const rel of allFiles) {
  const text = fileTexts[rel];
  let m;
  while ((m = classRe.exec(text))) {
    const c = m[1];
    if (c.startsWith('mj-')) continue;
    const parts = c.split('-');
    if (parts.some((p) => p === 'card' || p === 'panel' || p === 'button')) compClasses.add(c);
  }
}

// audit-parity metric: global distinct padding values per scope, summed —
// reproduces the audit census method (91 global-distinct in universal + 95 in globals = 186)
const padValsUniversal = new Set();
const padValsGlobals = new Set();
for (const rel of allFiles) {
  for (const d of declarations(rel, fileTexts[rel])) {
    if (!/^padding/.test(d.prop)) continue;
    (rel === 'src/app/globals.css' ? padValsGlobals : padValsUniversal).add(d.value);
  }
}
const paddingAllDistinctPerFileSum = padValsUniversal.size + padValsGlobals.size;

// audit-scope headline metrics (comparable with the W-DS audit numbers)
const inScope = (d) => AUDIT_FILES.includes(d.file);
const distinct = (arr) => new Set(arr.map((d) => d.value)).size;
const scopeRawSpacing = records.rawSpacing.filter(inScope);
const scopeRadius = records.undeclaredRadius.filter(inScope);
const scopeShadow = records.rawShadow.filter(inScope);
const scopeFontSize = records.rawFontSize.filter(inScope);
// audit-comparable padding-only metric (SPC-01: 91 universal + 95 globals = 186)
const scopeRawPadding = scopeRawSpacing.filter((d) => /^padding/.test(d.prop));
const headline = {
  files: AUDIT_FILES,
  rawSpacing: { occurrences: scopeRawSpacing.length, distinct: distinct(scopeRawSpacing) },
  rawPaddingOnly: { occurrences: scopeRawPadding.length, distinct: distinct(scopeRawPadding) },
  // audit-parity: same counting method as the audit census (global distinct per scope, summed)
  paddingAllDistinctPerFileSum,
  undeclaredRadius: { occurrences: scopeRadius.length, distinct: distinct(scopeRadius) },
  rawShadow: { occurrences: scopeShadow.length, distinct: distinct(scopeShadow) },
  rawFontSize: { occurrences: scopeFontSize.length, distinct: distinct(scopeFontSize) },
  sub10Text: records.sub10Text.filter(inScope).length,
  trackingCandidates: records.tracking.filter(inScope).length,
  globalsSelectors,
  componentClasses: [...compClasses].sort(),
};

// --------------------------------------------------------------------------
// Report
// --------------------------------------------------------------------------
const report = {
  _meta: {
    tool: 'scripts/token-lint.mjs (G-7 custom checks · WARN MODE)',
    spec: 'docs/03-design/reconstruction/VISUAL-QA-CHECKLIST.md §4 · DESIGN-TOKENS.md',
    generatedAt: new Date().toISOString(),
    filesScanned: allFiles.length,
    auditBaseline: {
      distinctRawPaddings: 186,
      distinctShadows: 71,
      distinctRadii: 23,
      distinctFontSizes: 23,
      globalsSelectors: 1220,
    },
  },
  headline,
  totals: {
    rawSpacing: records.rawSpacing.length,
    undeclaredRadius: records.undeclaredRadius.length,
    rawShadow: records.rawShadow.length,
    sub10Text: records.sub10Text.length,
    rawFontSize: records.rawFontSize.length,
    trackingCandidates: records.tracking.length,
    componentClasses: compClasses.size,
  },
  perFile,
  findings: records,
};

// --------------------------------------------------------------------------
// Compare mode (delta vs a previous baseline JSON)
// --------------------------------------------------------------------------
function compare(prev) {
  const lines = [];
  const h = report.headline;
  const p = prev.headline || {};
  const row = (label, now, before) =>
    lines.push(`${label.padEnd(30)} ${String(before ?? '?').padStart(6)} → ${String(now ?? '?').padStart(6)}`);
  lines.push('G-7 delta vs previous baseline (audit-scope):');
  row('raw spacing (distinct)', h.rawSpacing?.distinct, p.rawSpacing?.distinct);
  row('undeclared radius (distinct)', h.undeclaredRadius?.distinct, p.undeclaredRadius?.distinct);
  row('raw shadow (distinct)', h.rawShadow?.distinct, p.rawShadow?.distinct);
  row('raw font-size (distinct)', h.rawFontSize?.distinct, p.rawFontSize?.distinct);
  row('sub-10px text', h.sub10Text, p.sub10Text);
  row('tracking candidates', h.trackingCandidates, p.trackingCandidates);
  row('globals.css selectors', h.globalsSelectors, p.globalsSelectors);
  const prevClasses = new Set(p.componentClasses || []);
  const newClasses = (h.componentClasses || []).filter((c) => !prevClasses.has(c));
  if (newClasses.length) lines.push(`NEW component classes (G-7 risk): ${newClasses.join(', ')}`);
  else lines.push('No new component classes outside the primitive layer.');
  return lines.join('\n');
}

// --------------------------------------------------------------------------
// Output
// --------------------------------------------------------------------------
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(report, null, 1));

if (!QUIET) {
  const b = report._meta.auditBaseline;
  const h = report.headline;
  console.log(`
G-7 token lint — WARN MODE (Phase 0 baseline)
scope: ${report._meta.filesScanned} CSS files (audit scope = ${AUDIT_FILES.length})

  audit-scope census                     now      audit baseline      goal
  raw padding, audit metric        ${String(h.rawPaddingOnly.distinct).padStart(6)}                        0
  padding values, audit parity     ${String(h.paddingAllDistinctPerFileSum).padStart(6)}   /  ${String(b.distinctRawPaddings).padStart(6)}           0
  raw spacing incl. margin/gap     ${String(h.rawSpacing.distinct).padStart(6)}                        0
  undeclared radius (distinct)    ${String(h.undeclaredRadius.distinct).padStart(6)}   /  ${String(b.distinctRadii).padStart(6)}           5 tokens
  raw shadow (distinct)           ${String(h.rawShadow.distinct).padStart(6)}   /  ${String(b.distinctShadows).padStart(6)}           5 tokens
  raw font-size (distinct)        ${String(h.rawFontSize.distinct).padStart(6)}   /  ${String(b.distinctFontSizes).padStart(6)}          11 levels
  sub-10px text declarations      ${String(h.sub10Text).padStart(6)}                        0
  letter-spacing candidates      ${String(h.trackingCandidates).padStart(6)}                        0 unpaired
  globals.css selectors          ${String(h.globalsSelectors).padStart(6)}   /  ${String(b.globalsSelectors).padStart(6)}          0
  component classes (non-mj)     ${String(h.componentClasses.length).padStart(6)}                        frozen

  full-repo occurrences: spacing=${report.totals.rawSpacing} radius=${report.totals.undeclaredRadius} shadow=${report.totals.rawShadow} sub10=${report.totals.sub10Text}

report → ${path.relative(ROOT, OUT)}
`);
  if (COMPARE) {
    const prev = JSON.parse(fs.readFileSync(COMPARE, 'utf8'));
    console.log(compare(prev));
  }
}
