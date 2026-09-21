# Phase 1 Baseline — Foundations (Wave 1)

**Date:** 2026-09-22 · **Commits:** approval record `1370981` (§7.2) + Phase 1 implementation (this commit)
**Reference baseline:** `../phase0/` (frozen, never overwritten — owner constraint §7.2)

## What this folder holds

| File | Content |
|---|---|
| `capture-aggregate.json` | 100 cells (20 routes × 5 viewports), same measurement function as the audit and Phase 0 |
| `g7-baseline.json` | G-7 census at Phase 1 close, incl. the new `unpairedTracking` and `legacyTokenReferences` metrics |

## G-7 census — Phase 0 → Phase 1 (audit scope)

| Metric | Phase 0 | Phase 1 | Goal | Direction |
|---|---:|---:|---|---|
| raw padding, audit metric (distinct) | 155 | **141** | 0 | SPC-01 begins |
| padding values, audit parity | 196 | 195 | 0 | — |
| raw spacing incl. margin/gap (distinct) | 243 | **210** | 0 | §10 gap rebind + codemod |
| undeclared radius (distinct) | 15 | **12** | 5 tokens | R-SURF-2 map adoption |
| raw shadow (distinct) | 72 | 72 | 5 tokens | unchanged by design — rides Phase 2/3 surface rebuilds |
| raw font-size (distinct) | 29 | **26** | 11 levels | ramp adoption |
| **sub-10px text declarations** | 23 | **0** | 0 | **TYP-02 resolved** |
| letter-spacing candidates | 37 | 6 (legal) | legal only | — |
| **UNPAIRED letter-spacing** | — (37 unclassified) | **0** | 0 | **TYP-03 resolved** |
| legacy token var() refs (§10) | — | 1223 | 0 at wave end | migration surface tracked |
| globals.css selectors | 1766 | 1766 | 0 | unchanged by design — class deletion is Phase 2+ |
| component classes (non-mj) | 67 | 67 | frozen | no new names |

## Capture drift ledger — 238 field diffs, all classified

Phase 1 is an *implementation* phase: drift vs Phase 0 is expected and sanctioned.
Every diff maps to one of the approved change classes below; anything outside
these classes would have been a defect. Overflow stayed **0 × 100 cells**
(Gate A-2); `tapUnder44` and `bottomNavH` are unchanged on every cell (A-4, D-4).

| # | Field (cells) | Change | Sanctioned cause |
|---|---|---|---|
| 1 | `docHeight` (83) | 25 taller / 58 shorter; extremes `create@390 +40px`, `flows@1024 −83px` | §10 gap rebind (fluid 14–24 → fixed 16 on `--mj-gap-md` etc.) tightens desktop rhythm; TYP-02 raises and R-RTL-2 line-height floors (body 1.65→1.7, small 1.55→1.6) grow text blocks |
| 2 | `distinctFontSizes` (42) | down in 37 cells (6→5 ×25, 7→5 ×5, 12→11, 9→8, 8→7); up in 5 (`projects` cells 5→6) | Ramp consolidation (u-text rebinds + sub-10px raises). The `projects` count reflects fractional *computed* values of the fluid ramp at exact widths (13.44→13.5, 15.36→15.18…), not new ad-hoc sizes |
| 3 | `topbarH` (30) | 107/107.1 → 109 @390/430 (15 routes) | Context row renders `--mj-text-body` → now `body-m` (13.78→15.18px @390 per §10 default-body mapping); +2px header height. Chrome budget itself is NAV-02 / Phase 3 |
| 4 | `chromeRatio` + `contentVisible` (30+30) | 21→21.2 / 19→19.2 @390/430 | Derived from `topbarH` (same cause as #3) |
| 5 | `titleSize` (4) | `home@768` 55.5→52.4; `library` 36→32.3 / 40→34 | `--mj-text-hero`→`display` and h1 re-valued to spec clamps (§10 / R-TYPE-1; HIE-01 direction) |
| 6 | `distinctRadius` (3) | `home@1440` 5→4 (28.8px hero clamp died → 16px card); `explore@390/430` 2→3 (threshold effect, see #7) | R-SURF-2 radius map: hero radius `clamp(22–30px)` → `--u-radius-card` |
| 7 | `cards` + `nestedCards` (8+8) | `research` 14→16 (+2), `explore` 9→10, `code` 13→12, `billing` 11→10 | Card census is *visual-threshold* based (border/shadow + radius>4 + h>24px); text raises push small elements across the 24px threshold. Nesting *proportions* unchanged (research 93%→94%, code 92%→92%, billing 55%→50%) — SUR-01 remains Phase 2 work, not claimed here |

## Value-shift register (§10 adoption — the approved consolidation)

| Token | Before | After | Consumers |
|---|---|---|---|
| `--mj-text-h1` | clamp(26, 2.6vw+16, 40) | clamp(26, 1.6vw+20, **34**) | 1 (library h1) + ramp |
| `--mj-text-h2` | clamp(20, 1.4vw+15, 27) | clamp(19, 0.8vw+16, **24**) | 2 + `.mj-section__title` |
| `--mj-text-hero` | clamp(32, 5.4vw+14, 58) | alias → `display` clamp(34, 5vw+14, 58) | 1 (home welcome) |
| `--mj-text-body` | clamp(13.5, 0.2vw+13, 15) | alias → `body-m` clamp(15, 0.2vw+14.4, 16) | 10 |
| `--u-text-xs` | clamp(11.5, 12.5) | alias → `caption` 11.5 | 416 |
| `--u-text-sm` | clamp(13, 14) | alias → `body-s` clamp(13.5, 14) | 200 |
| `--u-text-md` | clamp(15, 16) | alias → `body-m` | 44 |
| `--u-text-lg` | clamp(17, 19) | alias → `body-l` 17 | 14 |
| `--u-text-xl` | clamp(21, 24) | alias → `h3` clamp(16, 19) — §10 mapping | 7 |
| `--mj-gap-2xs/xs/sm/md/lg/block` | 3 / 6–10 / 10–16 / 14–24 / 20–36 / 28–48 | → space-50/100/150/200/300/600 | ~290 |
| `--u-radius-xs/sm/(base)/lg` | 8/12/16/22 (legacy names held values) | canonical `control/field/card/overlay` hold values; legacy = aliases | ~270 |
| `--u-radius-xl` | 30px | **deleted** (rejected list §13; 1 consumer → `--u-radius-card`) | 0 |
| `--u-shell-alert` | #e75f9d pink | **deleted** → `--u-alert` #ef4444 (INT-03) | 0 |
| leadings hero/h1/h2/body/small | 1.18/1.28/1.34/1.65/1.55 | 1.25/1.35/1.35/1.7/1.6 (R-RTL-2 Arabic floors) | ~18 |

## Gates at Phase 1 close

- **Gate A:** build green · ESLint clean · stylelint 0 errors (1060 warnings, warn mode) · **hOverflow 0 × 100** · `tapUnder44` unchanged ×100 · no DOM/JS/a11y-wiring changes (CSS-value-only set + 2 token deletions with zero TSX refs).
- **Gate B (Phase 1 scope):** B-3 typography — sub-10px 0, unpaired tracking 0, ramp adoption measured · B-4 partial — radius map measured (`home@1440` histogram ⊆ {12, 16, 22, 999}px) · B-7 — single alert token, no new hues · B-2 partial — raw paddings 141↓ (0 new), primitives emit space tokens.
- **Not claimed by Phase 1** (bracket discipline per master doc §6): SPC-02/03 section-rhythm enforcement, SUR-01 anti-nesting, NAV-01..05 chrome, HIE-01 full h1 migration, TYP-01 completion, RES-01, INT-01/02.

Phase 1 exit requires owner approval of this ledger (§7.2 constraint 3: Phase 2
may not start before the Phase 1 exit gate is approved).
