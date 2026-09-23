# Phase 5 Baseline — Brand & Grid

**Date:** 2026-09-23 · **Commits:** §7.6 approval record `75bb77b` (Phase 4 exit gate approved + Phase 5 authorized) + Phase 5 implementation (this commit)
**Authorization:** §7.6 — Phase 5 (Brand & Grid) authorized immediately after the Phase 4 exit-gate approval.
**Reference baseline:** `../phase4/` (frozen, never overwritten — owner constraint §7.2–§7.6)
**Scope executed:** marketing token bridge (VIS-01, R-COL-1 / DESIGN-TOKENS §9) · focus-canvas fold (VIS-03, R-SURF-4 / DESIGN-TOKENS §10) · container ladder collapse (GRD-01, R-GRD-1 / DESIGN-TOKENS §6.1).

## What this folder holds

| File | Content |
|---|---|
| `capture-aggregate.json` | 100 cells (21 routes × 5 viewports), same measurement function as every phase |
| `g7-baseline.json` | G-7 census at Phase 5 close — **identical to Phase 4 on every axis** |
| `brand-grid-probe-before.json` | the VIS-01/VIS-03/GRD-01 probe against the Phase 4 build (`1a54d25`, port 3101) |
| `brand-grid-probe-after.json` | the same probe against the Phase 5 build — all three verdicts PASS |
| `screenshots/` | landing light/dark · chat canvas light/dark · the 560 composer (1440 + 390) · home wide |

Probe scripts: `scripts/visual-qa/brand-grid-probe.mjs` (@theme CSSOM census + landing brand cells both themes + focus-canvas fold + declared-measure census via CSSOM with var() resolution) and `scripts/visual-qa/landing-contrast-probe.mjs` (Gate A-3 spot: every landing text node, alpha-composited, both themes).

## Target findings — measured resolution

### VIS-01 (P1) — two brand palettes → one bridged palette

| Measurement (brand-grid-probe, live CSSOM + computed) | Phase 4 build | Phase 5 build | Rule |
|---|---|---|---|
| `@theme` brand colors declared as raw hex | **8 / 8** (`--color-brand #6366f1` · light `#818cf8` · dark `#4f46e5` · deep `#4338ca` · purple `#a855f7` · cyan `#06b6d4` · emerald `#047857` · pink `#ec4899`) | **0 / 7** — every survivor is a `var(--u-*)` reference: brand→`--u-primary` · light→`--u-primary-strong` · dark→`--u-primary-deep` · cyan→`--u-cyan` · emerald→`--u-mint` · emerald-ink→`--u-mint-ink` · pink→`--u-pink` | R-COL-1 |
| tokens with no app equivalent | `--color-brand-deep`, `--color-brand-purple` (independent steps) | **deleted** — primary fills hover through the platform's own brightness step (`hoverable:hover:brightness-110`, the gateway CTA's mechanism); the final-cta gradient tail rides `--u-cyan` | R-COL-1 |
| landing hero gradient stops (light) | `#4f46e5, #9333ea, #0e7490` (raw) | **`--u-primary` → `color-mix(oklab, primary 55%, pink)` → `--u-cyan`** = `rgb(79,70,229) → violet → rgb(11,140,171)` — the spectrum signature on platform accents, zero independent hexes | R-COL-1 |
| landing hero gradient stops (dark) | `#818cf8, #a855f7, #06b6d4` (raw) | `rgb(129,140,248) → mix → rgb(76,196,224)` — auto-theming through the token cascade | R-COL-1 |
| CTA fill (bg-brand-dark + white) | `#4F46E5` fixed both themes | light **`#3730A3`** (= `--u-primary-deep`, 10.4:1) · dark **`#6366F1`** (4.47:1 — the platform's own dark-fill floor, identical to the gateway CTA) | one ladder |
| accent chips (emerald/cyan) | light `#047857`/`#06B6D4` · dark `#10B981` (manual rebind)/`#06B6D4` | light **`#0D9F70`/`#0B8CAB`** · dark **`#3ECB9A`/`#4CC4E0`** — the app's mint/cyan both themes; **the dark emerald re-bind rule is deleted** (the bridge themes itself) | R-COL-1 |
| brand text (`text-brand-dark dark:text-brand-light`) | light `#4F46E5` · dark `#818CF8` | light **`#3730A3`** (9.6:1) · dark **`#8E9BFB`** (8.6:1) | one ladder |
| brand glows (`--shadow-glow/-lg`) | raw `rgba(99,102,241,.3)` / `rgba(168,85,247,.2)` | `color-mix(in srgb, var(--u-primary) 30%/20%, transparent)` — computed live as `color(srgb … / 0.3)` on the same indigo | R-COL-1 |
| marketing `--darkbg-*` neutrals | raw hex | **kept** — declared canvas tokens, not accents (R-COL-1 letter) | R-COL-1 |

**Gate A-3 spot (landing, both themes, alpha-composited):** after the bridge, zero real text failures. The 12px emerald control note initially fell to 3.24:1 (the old marketing emerald was deliberately darker than the app mint) — fixed in-phase by bridging a text-grade step `--color-brand-emerald-ink → var(--u-mint-ink)` (the app's own status-ink pattern; light #235c4b / dark #8fd8b8). Two documented non-failures remain: the hero gradient text (probe cannot see `background-clip: text`; its stops are verified ≥3:1 by value) and the 18px-bold "ن" step dot at 4.47:1 in dark — the platform's own documented dark-fill floor for white-on-`#6366f1` (unchanged by Phase 5; light improved 4.47→10.4).

### VIS-03 (P3) — the third surface language → the declared second canvas

| Measurement (live) | Phase 4 build | Phase 5 build | Rule |
|---|---|---|---|
| `--fc-*` declarations in the live cascade | **32** (16 names × 2 themes) | **0** — the namespace is deleted | R-SURF-4 |
| shell canvas attribute | `data-focus-canvas="true"` | **`data-canvas="focus"`** (standard on every other route) on ask/code/analyze/explore — verified per route | R-SURF-4 |
| canvas owner | `--fc-canvas` (parallel dialect) | **`--u-canvas-focus`** — a declared A2 token in foundations.css with its own light/dark pair (#f4f5fc / #030712, the exact same values the dialect held) | R-SURF-4 |
| gateway canvas binding | `--sp-bg: #F4F5FC` (own hex) + dark re-declaration `#030712` | **`--sp-bg: var(--u-canvas-focus)`** — one declaration, both themes, one owner (the dark re-declaration is deleted) | one owner |
| computed canvas on focus routes | `#F4F5FC` / `#030712` | **`#F4F5FC` / `#030712`** — pixel-identical rendering, now through the declared token | no visual drift |

The remaining `--sp-*` interior names (glass/line/ink/accent of the gateway family) stay as the service-space family's scoped C-extension set — their consolidation is not Phase 5's claim (documented boundary).

### GRD-01 (P2) — 11+ content widths → the four-step measure ladder

Declared-measure census (CSSOM, var()-resolved, every `max-width`/`width: min()` ≥480px):

| Measurement | Phase 4 build | Phase 5 build | Rule |
|---|---|---|---|
| distinct declared content measures (key selectors) | **21 distinct values app-wide** — 520 · 560 · 580 · 600 · 650 · 660 · 680 · 720 · 740 · 760 · 770 · 780 · 830 · 840 · 920 · 980 · 1040 · 1240 · 1320 · 1360 · 1536 | **the ladder only: 560 · 780 · 1040 · 1440** — `keyOffLadder: []` across all 30 key-selector declarations | R-GRD-1 |
| page content max | three values: `--mj-content-max` 1520 · `.universal-container`/`.ops-page` 1240 · `.ms-container` 1536 (+ home/library/harness 1320, preview 1240/1360) | **one: `--mj-container-full` (1440)** on every page container; the legacy `--mj-content-max`, `--u-content-max` and `--u-reading-max` tokens are deleted (zero consumers) | §6.1 |
| reading measures | 600 · 650 · 680 · 720 · 740 · 760 · 770 · 830 (per-family ledes/intros/copy) | **`--mj-container-prose` (780)** everywhere — the "reading measure differs per family" spread dies | §6.1 |
| the composer | 840 (IA's old ladder) | **`--mj-container-narrow` (560)** — DESIGN-TOKENS §6.1 assigns the composer to narrow; measured live: composer zone renders 560px at 1024/1440 (was 840/675) | §6.1 |
| work surfaces / strips | task card 980 · compare dock 920 | **`--mj-container-wide` (1040)** | §6.1 |
| gateway linear canvas | `min(720px, 100%)` | **`min(var(--mj-container-prose), 100%)`** (wide step at ≥1024 unchanged as the token) | §6.1 |

**Out of scope by design (documented boundary):** overlay/sheet widths (580/600/660/720/760 — the portaled-overlay ladder), CQ reflow triggers (ops-page 1040/880/640/430 · service-space 900/560/480 · mj-flow 880/640 · adaptive-home 1080/640 · library 640 · marketing's ladder — composition triggers, not measures), and element internals below the narrow step (message bubbles with % rhythm caps, grid track minimums, control widths). `chat-prototype.tsx` and its globals rules (`.conversation-demo`/`.chat-start`/`.assistant-copy`/`.response-receipt`) are dead code (zero importers since the gateway replaced /app/chat) — their measures were rebound to ladder tokens so the source contract stays total; the file itself awaits an owner deletion decision (AGENT §9).

## Capture drift ledger — **0 field diffs × 100 cells** vs `../phase4/`

All 17 captured fields identical on every cell (hOverflow 0 everywhere, tapUnder44 unchanged, chromeRatio unchanged, docHeight unchanged, cards unchanged). Phase 5 changes colors (not captured fields) and widths whose effects bind above the captured geometry: the page max (1240/1320/1520→1440) only engages beyond the 1440 capture viewport, and the composer's 840→560 narrows the card without changing the captured counts or page height (the gateway's sections are height-stable). The width/color changes themselves are proven by the brand-grid probe above — before vs after on the same selectors.

## G-7 census — zero drift vs Phase 4

raw spacing 192 · undeclared radius 12 · raw shadow 59 · raw font-size 26 · sub-10px **0** · unpaired tracking **0** · legacy refs 1097 · globals selectors 1615 · component classes **66 (frozen)** — every Phase 5 rule is a token reference; no new raw values entered any layer.

## Gate summary

- **Gate A:** production build clean (~37 routes) · ESLint clean · tsc 0 errors · stylelint 0 errors (warn mode per G-7) · zero horizontal overflow ×100 cells · landing contrast (A-3) clean after the in-phase emerald-ink fix.
- **Gate B (Phase 5 scope):** **B-7 fully measured** (the bridge census above + zero new raw accents) · B-6 grid part fully measured (the measure census: ladder-only on key selectors) · B-1..B-5, B-8, B-9 unchanged by measurement (zero capture drift) · B-10 perceptual spot: landing light/dark + gateway 560 composer + home wide screenshots in `screenshots/`.
- **Honest boundaries recorded:** VIS-02 (semantic accent-role audit) explicitly outside the Phase 5 bracket · D-3 (UNC-01) still open · the `--sp-*` interior dialect and dead `chat-prototype.tsx` flagged for their owners.
