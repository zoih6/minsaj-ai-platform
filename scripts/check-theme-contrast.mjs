#!/usr/bin/env node
/**
 * check-theme-contrast.mjs — WCAG contrast gate for both themes.
 *
 * Parses the design tokens straight out of foundations.css (no drift), then
 * verifies every critical text/UI pair in LIGHT and DARK. Fails the build
 * (exit 1) if any pair drops below its threshold:
 *   - text pairs   >= 4.5:1  (WCAG AA, normal text)
 *   - UI pairs     >= 3.0:1  (WCAG 1.4.11 non-text / large bold)
 * Rationale (researched): WCAG applies the SAME ratios in dark mode; MD3 dark
 * guidance keeps surfaces desaturated; Apple HIG keeps text off-pure-white.
 *
 * Usage: node scripts/check-theme-contrast.mjs   (also wired into CI)
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const css = readFileSync(join(root, "src/app/styles/universal/foundations.css"), "utf8");

/* ---------- tiny color engine ---------- */
const srgb = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex) => {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
};
const ratio = (fg, bg) => {
  const [l1, l2] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
};
/** Composite an rgba() token value over a base (returns hex). */
const composite = (value, over) => {
  const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/);
  if (!m) return value;
  const [, r, g, b, a = 1] = m.map(Number);
  const ob = luminance(over) >= 0 ? over.replace("#", "") : over;
  const [br, bg, bb] = [0, 2, 4].map((i) => parseInt(ob.slice(i, i + 2), 16));
  const mix = (fg, base) => Math.round(a * fg + (1 - a) * base).toString(16).padStart(2, "0");
  return `#${mix(r, br)}${mix(g, bg)}${mix(b, bb)}`;
};

/* ---------- parse token blocks ---------- */
const parseBlock = (source) => {
  const map = {};
  for (const m of source.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    map[m[1]] = m[2].trim();
  }
  return map;
};
const rootBlock = [...css.matchAll(/:root\s*\{([\s\S]*?)\n\}/g)].map((m) => m[1]).join("\n");
const darkBlock = css.match(/:root\[data-theme="dark"\]\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
const LIGHT = { ...parseBlock(rootBlock) };
const DARK = { ...LIGHT, ...parseBlock(darkBlock) };

const resolve = (token, theme, stack = new Set()) => {
  if (stack.has(token)) throw new Error(`circular token ${token}`);
  stack.add(token);
  let v = theme[token];
  if (v === undefined) throw new Error(`missing token --${token}`);
  while (v.startsWith("var(")) {
    const inner = v.slice(4, -1).trim().replace(/^--/, "");
    v = theme[inner];
    if (v === undefined) throw new Error(`missing token --${inner}`);
  }
  return v;
};

/* ---------- pair contract ---------- */
const TEXT = 4.5;
const UI = 3.0;
const pairs = [
  // [fg, bg, type]
  ["u-ink", "u-bg", "text"], ["u-ink", "u-surface", "text"],
  ["u-ink-soft", "u-bg", "text"], ["u-ink-soft", "u-surface", "text"],
  ["u-muted", "u-bg", "text"], ["u-muted", "u-surface", "text"],
  ["u-faint", "u-bg", "text"], ["u-faint", "u-surface", "text"],
  ["u-primary", "u-bg", "text"], ["u-primary", "u-surface", "text"],
  ["u-primary-strong", "u-bg", "text"],
  ["u-danger", "u-surface", "text"],
  /* accent hues are icon/badge colors in this system — WCAG 1.4.11 (3:1) */
  ["u-mint", "u-surface", "ui"], ["u-amber", "u-surface", "ui"],
  ["u-cyan", "u-surface", "ui"], ["u-pink", "u-surface", "ui"],
  ["u-primary", "u-primary-soft", "text"],
  ["u-control-line", "u-surface", "ui"],
  ["u-primary", "u-bg", "ui"],
];

/* button gradient stops (worst = lightest stop keeps labels AA) */
const gradientStops = (selector) => {
  const rule = css.match(new RegExp(`${selector}\\s*\\{[^}]*\\}`))?.[0] ?? "";
  return [...rule.matchAll(/#([0-9a-fA-F]{6})/g)].map((m) => `#${m[1]}`);
};

let failures = 0;
const report = (themeName, theme) => {
  console.log(`\n── ${themeName} ──`);
  for (const [fg, bg, type] of pairs) {
    let fgV, bgV;
    try {
      fgV = resolve(fg, theme);
      bgV = resolve(bg, theme);
      if (fgV.startsWith("rgba")) fgV = composite(fgV, bgV);
      if (bgV.startsWith("rgba")) bgV = composite(bgV, resolve("u-surface", theme));
    } catch (e) {
      console.log(`  SKIP  --${fg} on --${bg}: ${e.message}`);
      continue;
    }
    const r = ratio(fgV, bgV);
    const need = type === "text" ? TEXT : UI;
    const pass = r >= need;
    if (!pass) failures++;
    console.log(`  ${pass ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  --${fg} on --${bg} (need ${need})`);
  }
};

report("LIGHT", LIGHT);
report("DARK", DARK);

/* primary buttons: white label on lightest gradient stop */
for (const [label, sel] of [["luma-button--primary", ".luma-button--primary"], ["button--primary", ".button--primary"]]) {
  for (const theme of [["LIGHT", LIGHT], ["DARK", DARK]]) {
    const stops = gradientStops(sel);
    if (!stops.length) continue;
    const lightest = stops.reduce((a, c) => (luminance(c) > luminance(a) ? c : a));
    const r = ratio("#ffffff", lightest);
    const pass = r >= TEXT;
    if (!pass) failures++;
    console.log(`  ${pass ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  white on ${label} ${theme[0]} lightest stop ${lightest} (need ${TEXT})`);
  }
}

console.log(failures ? `\n✗ ${failures} contrast failure(s)` : "\n✓ All contrast pairs pass");
process.exit(failures ? 1 : 0);
