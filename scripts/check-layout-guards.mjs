#!/usr/bin/env node
/**
 * check-layout-guards.mjs — architectural guard: every app page must render
 * inside a container-query context.
 *
 * WHY THIS EXISTS (v8 incident, 2026-09-16):
 *   The whole responsive system is built on container queries
 *   (@container ops-page / service-space / ...). Pages whose root element is
 *   NOT a container silently keep their desktop multi-column grid on phones
 *   (agent-builder + flow-editor shipped 3 columns of 874px inside 375px).
 *   A browser sweep only catches it AFTER the fact; this guard catches the
 *   CLASS of bug statically, at commit time, with zero browser.
 *
 * HOW:
 *   1. Scan every CSS file in src/ and collect every class that declares
 *      a container context (container-type / container shorthand).
 *   2. Walk every page.tsx under src/app/[locale]/app/, resolve the rendered
 *      root component, read its root className.
 *   3. Fail if the page root class list contains no known container class.
 *
 * Adding a new page? Give its root one of the container classes
 * (ops-page / service-space / universal-library-page / adaptive-home /
 * builder-page / flow-editor-page) or extend this guard deliberately.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

/* ---------- helpers ---------- */
function walk(dir, predicate, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const entry of entries) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, predicate, out);
    else if (predicate(full)) out.push(full);
  }
  return out;
}
const cssFiles = walk(SRC, (f) => f.endsWith(".css"));
const pageFiles = walk(join(SRC, "app"), (f) => /page\.tsx$/.test(f))
  .filter((f) => f.includes(join("app", "[locale]", "app"))); // app-shell pages only

/* ---------- 1. container classes from CSS ---------- */
const containerClasses = new Set();
for (const file of cssFiles) {
  const css = readFileSync(file, "utf8");
  // Match rule blocks; capture selector + body (flat, non-nested is enough —
  // our container declarations are always top-level single-line rules).
  for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const [, selector, body] = match;
    if (!/container(-type|-name)?\s*:/.test(body)) continue;
    for (const cls of selector.matchAll(/\.([a-zA-Z][\w-]*)/g)) {
      containerClasses.add(cls[1]);
    }
  }
}
console.log(`[guard] container classes (${containerClasses.size}):`);
console.log("        " + [...containerClasses].sort().join(", "));

/* ---------- 2. page → root component resolution ---------- */
const componentIndex = new Map(); // PascalCase name → file path
for (const file of walk(SRC, (f) => f.endsWith(".tsx"))) {
  const source = readFileSync(file, "utf8");
  for (const m of source.matchAll(/export\s+function\s+([A-Z]\w+)/g)) {
    componentIndex.set(m[1], file);
  }
}
function kebab(name) { return name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase(); }

const knownRootClasses = {
  // wrapper components whose own root class is the container
  ServiceWorkspace: "service-space",
  UniversalLibrary: "universal-library-page",
  AdaptiveHome: "adaptive-home",
};

function rootClassOfComponent(name, depth = 0) {
  if (depth > 3) return null;
  if (name in knownRootClasses) return knownRootClasses[name];
  const file = componentIndex.get(name)
    ?? walk(SRC, (f) => f.endsWith(`/${kebab(name)}.tsx`))[0];
  if (!file) return null;
  const source = readFileSync(file, "utf8");
  // scope the search to the exported component's own body — helpers declared
  // earlier in the file must not be mistaken for the page root
  const fnAt = source.search(new RegExp(`export function ${name}\\b`));
  const scoped = fnAt >= 0 ? source.slice(fnAt) : source;
  const m = scoped.match(/className="([^"]+)"/);
  if (m) {
    const classes = m[1].split(/\s+/);
    const hit = classes.find((c) => containerClasses.has(c));
    if (hit) return hit;
  }
  // root may wrap another component (fragments/route wrappers) — follow first
  // capitalized JSX tag inside the same function body
  const inner = scoped.match(/<([A-Z]\w+)[\s/>]/);
  if (inner && inner[1] !== name) {
    const nested = rootClassOfComponent(inner[1], depth + 1);
    if (nested) return nested;
  }
  return null;
}

/* ---------- 3. assert every page has a container root ---------- */
let pass = 0; let fail = 0; const failures = [];
for (const page of pageFiles) {
  const source = readFileSync(page, "utf8");
  if (/redirect\(/.test(source)) continue; // index redirect — no DOM
  const rel = page.slice(page.indexOf(join("[locale]")) + "[locale]".length + 1, -"/page.tsx".length + 1).replace(/\\/g, "/");
  const label = rel || "(app index)";
  const rendered = source.match(/return\s*\(?\s*<([A-Z]\w+)/);
  if (!rendered) { fail += 1; failures.push(`${label}: no rendered root component found`); continue; }
  const rootClass = rootClassOfComponent(rendered[1]);
  if (rootClass) {
    pass += 1;
    console.log(`  PASS ${label} → <${rendered[1]}> root container ".${rootClass}"`);
  } else {
    fail += 1;
    failures.push(`${label} → <${rendered[1]}> root has NO container-query context`);
  }
}

console.log("\n[guard] page coverage:");
for (const f of failures) console.log("  ✗ " + f);
console.log(`\n[guard] ${pass} pass / ${fail} fail — every app page root must declare a container class`);
process.exit(fail === 0 ? 0 : 1);
