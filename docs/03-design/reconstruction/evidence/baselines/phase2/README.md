# Phase 2 Baseline — Surfaces

**Date:** 2026-09-22 · **Commits:** authorization record `3ad70b5` (§7.3) + Phase 2 implementation (this commit)
**Reference baseline:** `../phase1/` (frozen, never overwritten — owner constraint §7.2/§7.3)
**Scope executed:** settings + ops pages rebuilt on `mj-surface`/`mj-section` (HIE-02) · anti-nesting refactor of the u2-workbench interiors + home composer chain (SUR-01) · `mj-data-list` for the six record collections (HIE-03).

## What this folder holds

| File | Content |
|---|---|
| `capture-aggregate.json` | 100 cells (20 routes × 5 viewports), same measurement function as the audit, Phase 0 and Phase 1 |
| `g7-baseline.json` | G-7 census at Phase 2 close |
| `sur01-probe-before.json` | supplementary SUR-01 probe against the Phase 1 build (worktree @ `147f752`, port 3101) |
| `sur01-probe-after.json` | the same probe against the Phase 2 build — the SUR-01 defect-class measurement |
| `screenshots/` | after-shots of the rebuilt surfaces (settings/agents/knowledge/home/learn @390 + settings @1440) |

Probe script: `scripts/visual-qa/sur01-probe.mjs` (counts card-like **containers** nested inside card-like elements — the real card-in-card class — separating controls-inside-their-surface, which the sanctioned tree `surface > flat-group > controls` allows).

## Target findings — measured resolution

### SUR-01 (P0) — surface inflation → flat-group tree

| Measurement | Phase 1 | Phase 2 | Rule |
|---|---:|---:|---|
| `maxDepth` > 1 cells (B-4 hard metric, 100 cells) | 10 (home @390–1440) | **0** | B-4: nestingDepth ≤ 1 |
| home `maxDepth` | **3** (hero > task-card > composer > submit) | **1** | R-SURF-1 |
| container-in-container pairs / viewport (8 SUR routes, probe) | 10 | **0 card-grade** | R-SURF-1 |
| interior container rules carrying card chrome inside the workbench | 47 | **0** (flat groups: no border, no shadow, `--u-surface-subtle`, `--u-radius-field`) | R-SURF-1 |

The two remaining probe hits are **field-grade, depth-1, by design** (not surfaces):
- `home: .adaptive-task-composer` — the composer field shell inside the hero (field border + `--u-radius-field`; the purposeless glass `task-card` wrapper around it was removed). Composer placement itself is the Phase 4 gateway reorder (INT-01).
- `create: .u2-create__note` — a text-only callout (border + tint, no shadow — legal per P4) inside the workbench.

Depth-1 controls inside their surface (chips, selects, inputs, badges — e.g. learn `controlsInSurface=13`) are the sanctioned tree terminus per the audit's own prescription ("cap the tree at surface > flat-group > controls"); the census's coarse `isCardLike` counts them, B-4 does not forbid them.

### HIE-02 (P1) — settings as a second product → the one system

| Measurement | Phase 1 | Phase 2 | Rule |
|---|---:|---:|---|
| settings radius histogram @390 | `{12px: 5}` (single 12px, off-system) | **2 distinct: 16px card + 12px field** | R-SURF-2 radius-by-level |
| settings shadowless cards | 4 of 5 | **0** (`mj-surface` = border + `--u-shadow-xs`) | R-SURF-3 |
| settings section padding | 19px raw | **`--mj-pad-card`** (16→24 fluid) | R-SPACE-1 |
| parallel `settings-*` classes in globals.css | 44 declarations | **0** (rebuilt on `mj-section`/`mj-surface`/`mj-data-list`; dialog fields kept) | IMP-03 dissolve begins |
| dashed upload box / utility aesthetic | present | **removed** (flat group) | P4 |

### HIE-03 (P2) — record stacks → one container, divided rows

| Route | Phase 1 cards @390 | Phase 2 cards @390 | Pattern |
|---|---:|---:|---|
| knowledge (collections) | 9 | **6** | `mj-data-list` rows + stats band (cards = summaries only) |
| agents | 10 | **8** | `mj-data-list` rows |
| flows | 10 | **8** | `mj-data-list` rows |
| team | 6 | 11 (5 role `select`s now counted — controls at depth 1) | `mj-data-list` rows |
| projects | 7 | **5** | rows are the **default** view; card grid stays as the user toggle |
| runs | 5 (real `<table>`) | 5 | one row pattern app-wide — `mj-data-list`; whole row is the link |

Row grammar: hairline `border-block-end` dividers (not card-like), `data-label` cells collapse to labelled cards at container ≤ 640px (layout.css §8). Runs desktop tap-targets improved as a side effect (7→2 under-44 @1024/1440).

## G-7 census — Phase 1 → Phase 2 (audit scope)

| Metric | Phase 1 | Phase 2 | Direction |
|---|---:|---:|---|
| raw spacing (distinct) | 210 | **198** | ↓ |
| raw shadow (distinct) | 72 | **63** | ↓ (composer glow, task-card, submit, personalize raws removed) |
| undeclared radius (distinct) | 12 | 12 | flat — no new radii (workbench 22px overlay-grade → 16px card token) |
| raw font-size (distinct) | 26 | 26 | flat |
| sub-10px text | 0 | **0** | holds |
| UNPAIRED letter-spacing | 0 | **0** | holds |
| legacy token var() refs | 1223 | **1113** | ↓ |
| globals.css selectors | 1766 | **1615** | ↓ (settings/list deletions exceed additions) |
| component classes (non-mj) | 67 | 67 | frozen — **no new component classes outside the primitive layer** |

## Capture drift ledger — 198 field diffs vs `../phase1/`, all classified

| Field | Cells | Classification |
|---|---:|---|
| `cards` | 67 | HIE-02/HIE-03 rebuilds + SUR-01 flattening (interior groups left the census) — approved scope |
| `nestedCards` | 47 | same — remaining depth-1 entries are controls-in-surface (sanctioned tree) |
| `distinctFontSizes` | 35 | only the 7 rebuilt routes — new cells use ramp tokens (`--mj-text-body-s/-label-m/-label-s/-code`) |
| `docHeight` (±4px) | 30 | only the 7 rebuilt routes — row layouts are denser than card stacks by design |
| `distinctRadius` | 14 | home 4→3, create 3→2, runs 3→2 (radius consolidation); settings 1→2 (the off-system single-radius look dies; 16/12 = the level map) |
| `tapUnder44` | 5 | **zero regressions — all improvements**: knowledge 5→1 @390/430/768, runs 7→2 @1024/1440 (row links/selects floored at `--u-touch`; layout.css §11 row floor 40→44 on the phone band) |
| `topbarH`/`bottomNavH`/`chromeRatio`/`contentVisible`/`titleSize` | **0** | chrome untouched — Phase 3 scope |
| `hOverflow` | **0 of 100 cells** | no horizontal scroll anywhere |

## Gates

- **Gate A:** production build green · ESLint clean · stylelint **0 errors** (warn mode per G-7) · **0 hOverflow ×100** · tap floors hold (no regressions; the §11 row floor raised 40→44 = the `--u-touch` invariant).
- **Gate B (Phase-2 scope):** **B-4 fully measured** — `nestingDepth ≤ 1` on all 100 cells (was 10 violations), radius ⊆ level map (settings now 16/12; no new radii), list pages use rows not card-stacks (6/6 collections). B-2 partial (spacing 210→198, padding on-token on every rebuilt surface), B-6 partial (DataList reflow contract verified at 390/430/768 — labelled-card collapse), B-8 partial (rows keep the empty/loading/error states of the previous lists). B-1/B-3 hold (title/chrome untouched; sub-10px = 0).

## Not in Phase 2 (no claims)

- SPC-02/03 (section rhythm unification) — Phase 5 grid wave; the rebuilt routes use `--mj-space-600` section rhythm (`settings-content`) but the cross-route audit lands with the container ladder.
- NAV-01..05 (chrome), INT-01/02 (gateway reorder, motion), VIS-01 (marketing bridge) — later phases per §6.
- The library route (`مكتبتي`) keeps its composite cards until its Phase 3/4 wave (not in HIE-03's route list).
