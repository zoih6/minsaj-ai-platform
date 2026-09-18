#!/usr/bin/env node
/* B3 guard: icon size ladder (DEG §12.1 + brand scale).
   UI icons: 12/14/16/18/20/24 · Brand marks: 28/34/46
   Fails on any other numeric size prop in src TSX files. */
const { readdirSync, statSync, readFileSync } = await import("node:fs");
const { join } = await import("node:path");

const LADDER = new Set([12, 14, 16, 18, 20, 24, 28, 34, 46]);
const ROOT = join(process.cwd(), "src");
const bad = [];
let scanned = 0;

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(tsx|ts)$/.test(name)) {
      scanned++;
      const text = readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const m of text.matchAll(/size=\{(\d+)\}/g)) {
        const n = Number(m[1]);
        if (!LADDER.has(n)) bad.push(`${p.replace(process.cwd() + "/", "")}: size={${n}}`);
      }
    }
  }
}
walk(ROOT);

if (bad.length) {
  console.error(`✗ ICON SCALE — FAIL (${bad.length} off-ladder):`);
  for (const b of bad.slice(0, 20)) console.error("  " + b);
  process.exit(1);
}
console.log(`✓ ICON SCALE — PASS (${scanned} files scanned, ladder 12/14/16/18/20/24 + brand 28/34/46)`);
