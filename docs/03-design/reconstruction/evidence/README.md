# evidence/ — Audit Evidence Pack
## W-DS · The measured backbone of UI-UX-AUDIT-MATRIX.csv

> Every finding in the matrix cites files in this folder. Every number in these files was produced by DOM measurement of the running application (`npm run dev`, commit `b4ed7a0`) with the selector recorded alongside. The perceptual records (VLM designer-eye pass) are kept strictly separate from measurements — a perceptual judgment never substitutes for a number, and a number never dismisses a perception.

## How it was captured

- **Tooling:** headless Chromium (Playwright 1.63) over `http://localhost:3000`; one capture per route × viewport: 390×844, 430×932, 768×1024, 1024×768, 1440×900 (+ the 980×390 coarse-pointer desktop-mode probe). Script: `scripts` outside this repo (session tooling); the method is fully specified below so it can be re-run.
- **Method:** after `networkidle` + font-ready + 1.6s settle (route animation complete, sidebar state hydrated), the page is measured via `getComputedStyle`/`getBoundingClientRect` walks. Full-page captures follow a scroll-through pass so reveal-on-scroll sections are in their revealed state.
- **Measurement fields** (per `{route}-{viewport}.json`):
  - `chrome` — header/topbar, context row, search trigger, bottom nav, sidebar (rect + background/backdrop/position/z-index, with the selector).
  - `geom` — viewport, doc height, first-content offset below the header, content paddings, last-content gap to the bottom nav, `verticalBudget` (chrome ratio), horizontal-overflow scan with offenders, page titles (size/weight/line-height), section rhythm (`sectionGaps` = children of the route frame; `subSectionGaps` = children of the page root).
  - `surfaces` — census of card-like containers (border-or-shadow + radius + size filter): count, radius histogram, shadow usage, **nesting depth histogram**, top selectors.
  - `typography` — computed samples for h1/h2/h3/p/button/small/badge/kbd + a font-size histogram of all text-bearing elements.
  - `tapTargets` — every interactive element's box; counts under 24/32/44px.
  - `accents` — button background histogram + sampled buttons.
  - `service` — active `[data-service]` thread color, when present.
- **Supplementary probes:** `drawer-390.json` (drawer link inventory: 19 links, group labels, computed sizes), `header-comparison-390.json` (standard vs focus-canvas header/dock), `knowledge-targeted.json` (stats-card fill + dead-space scan), `desktopmode-*-980.json` (rail layout + effective text size on a 414px phone at 980 CSS px).
- **`aggregate.json`** — the cross-route comparison table (the source of the diagnosis tables in `DESIGN-SYSTEM-RECONSTRUCTION.md` §3).

## Files

- `measurements/` — 20 routes × (390 + 1440) JSONs + aggregate + supplementary probes.
- `screenshots/` — `{route}-390.jpg` and `{route}-1440.jpg` viewport captures per route, `{route}-390-full.jpg` full-page captures, interactive states (drawer, command palette), scrolled-state captures (chrome-behavior), desktop-mode probes, English (LTR) references.
- `perceptual/` — the designer-eye pass records (structured judgments: first impression, hierarchy, rhythm, surfaces, chrome weight, coherence, dead areas, fix-first). Perceptual-only by contract.

## Reproducing

Run the app, then re-apply the same measurement contract (fields above) at the five viewports and diff against `aggregate.json`. Regressions in `verticalBudget.chromeRatio`, nesting depth, radius/font-size histograms, or raw-padding counts are the actionable signals.
