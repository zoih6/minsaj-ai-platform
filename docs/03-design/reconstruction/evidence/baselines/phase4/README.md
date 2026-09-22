# Phase 4 Baseline — Patterns

**Date:** 2026-09-22 · **Commits:** conditional exit-gate record `f0a24bb` (§7.5) + condition fulfillment `927d0aa` (dock non-occlusion, 98/98) + Phase 4 implementation (this commit)
**Authorization:** §7.5 — Phase 4 authorized once the dock non-occlusion test was documented (it was, same session, in `../phase3/`).
**Reference baseline:** `../phase3/` (frozen, never overwritten — owner constraint §7.2–§7.5)
**Scope executed:** composer-first gateway (INT-01, R-PAT-2 / PAGE-PATTERNS §2.3) · route-motion retiming with single ownership (INT-02, R-MOT-1 / §4.1–4.2).

## What this folder holds

| File | Content |
|---|---|
| `capture-aggregate.json` | 100 cells (20 routes × 5 viewports), same measurement function as every phase |
| `g7-baseline.json` | G-7 census at Phase 4 close |
| `patterns-probe-before.json` | the INT-01/INT-02 probe against the Phase 3 build (worktree `0862558`, port 3101) |
| `patterns-probe-after.json` | the same probe against the Phase 4 build |
| `dock-occlusion-probe.json` | the §7.5 condition re-run against the Phase 4 build (the gateway restructure touched the chat route) — 98/98 PASS again |
| `screenshots/` | the composer-first gateway: initial / tools disclosure / mode disclosure / executing (progress strip) / dark / 1440 / en LTR |

Probe script: `scripts/visual-qa/patterns-probe.mjs` (structure + cards + CTA fold + progressive disclosure + motion CSSOM) — plus `scripts/visual-qa/dock-occlusion-probe.mjs` re-run.

## Target findings — measured resolution

### INT-01 (P1) — configuration stacked before action → composer-first

| Measurement (patterns-probe @390, live) | Phase 3 build | Phase 4 build | Rule |
|---|---|---|---|
| top-level pre-execution sections (audit counted 9 concerns) | **8** (nav · welcome · toolbelt · mode · composer · path · trust · lower) | **3** (welcome · composer · lower) | §2.3 anatomy |
| card-like surfaces in main (frozen capture census) | **18** | **7** | R-PAT-2 |
| composer + ONE primary CTA position | **below the fold** (measured) | **above the fold** — CTA bottom 466px < dock top 762px | R-PAT-2 |
| configuration surface | 2 standalone sections always rendered | **one progressive disclosure inside the card** — mode → tool → advanced, closed initially | §3.2 sequential |
| leading tool reveal | always visible | **opens after the FIRST keystroke, exactly once** (latch verified: typing more after closing does not re-open) | §2.3 item 2 |
| default execution style | موجّه | **سريع** (موجّه stays one disclosure away) | §2.3 item 1 |
| four-step path | standalone pre-execution card | **thin strip INSIDE the composer card during execution** (4 steps, 01 current in clarify → 02 in working → all complete at ready) | §2.3 |
| trust note | standalone dashed pill | **one caption line in the card footer** | §2.3 |
| starters | 3 filled bordered 58px card-rows | **plain links** — transparent, borderless, 44px touch floor | §2.3 recent |
| width ladder (1440) | 8 sections, 15 cards | **3 sections, 6 cards** — re-flowed, not redesigned | responsive law |

Behavior preserved end-to-end (probe + interactive smoke): session state machine (idle → error → clarifying → working → ready → saved) · guided 3-question clarify + plan preview · fast direct run · attachments (file picker + voice recorder with live timer) · quality standard behind advanced (gated by tool affordances — data-driven; the ask toolkit currently affords none, so the disclosure stays latent exactly as §3.4 «complexity is earned» requires) · save-to-library with toast + strip entry · restart resets panels too.

### INT-02 (P3) — route motion → 240ms / 4px, with a corrected diagnosis

| Measurement (CSSOM, live cascade) | Phase 3 build | Phase 4 build | Rule |
|---|---|---|---|
| route-frame animation owner | **motion.css `u-route-in`** (200ms, opacity-only 0.35→1, NO offset) — the audit's cited 480ms shell.css rule was **cascade-dead** | motion.css `u-route-in` — the single owner | one owner per surface |
| durationMs | 200 | **240** (`--u-motion-duration-route`) | R-MOT-1 |
| enter offset | none | **4px** (`--u-motion-distance-sm`) | §4.2 |
| duplicate rules | 2 (shell.css loser deleted in Phase 4) | **1** | §4.1 |
| forbidden band (>300ms) | under | under | §4.4 |

**Audit correction recorded:** the forensic audit's INT-02 measured the cascade-losing shell.css rule (480ms expressive) instead of the live winner (motion.css, 200ms). The live transition was never 480ms — but it was also not the spec (200ms, no offset, two owners). Phase 4 delivers the spec values with one owner, and the correction is recorded here per the repo's diagnosis-integrity rule (KI-2 lineage).

## Capture drift ledger — 20 field diffs vs `../phase3/`, all on the chat route

| Field | Cells | Classification |
|---|---:|---|
| `cards` | 5 (chat @ all 5 viewports) | **The Phase 4 change itself** — 18 → 7 per the frozen census (the pre-execution stack dies) |
| `distinctRadius` / `distinctFontSizes` | 5 + 5 (chat) | follows: fewer distinct radii (4→3) and font sizes (6→5) on the gateway — simplification |
| `docHeight` | 5 (chat) | follows: 2214 → 1182 @390 — the page halves as configuration collapses |
| **all other fields × 95 cells** | **0** | hOverflow 0 · tapUnder44 0 diffs · topbarH 0 · chromeRatio 0 · titleSize 0 · nestedCards 0 — **zero regressions anywhere** |

## §7.5 condition — holds on the Phase 4 build

`dock-occlusion-probe.json` (re-run after the gateway restructure): **98/98 cells PASS · 0 occluded elements · min clearance 21.9px** — same verdict as the pre-Phase-4 run frozen in `../phase3/`. The composer-first page keeps the last interactive content clear of the dock on every phone page, settings sections included.

## G-7 census — Phase 3 → Phase 4 (audit scope)

| Metric | Phase 3 | Phase 4 | Direction |
|---|---:|---:|---|
| raw spacing (distinct) | 192 | **192** | flat — new rules are 100% on-scale (space-25…600) |
| undeclared radius (distinct) | 12 | **12** | flat — new radii ride --u-radius-pill/card/field |
| raw shadow (distinct) | 59 | **59** | flat |
| raw font-size (distinct) | 26 | **26** | flat — new text rides --mj-text-caption / --u-text-* |
| sub-10px text | 0 | **0** | holds |
| UNPAIRED letter-spacing | 0 | **0** | holds |
| legacy token var() refs | 1102 | **1097** | ↓ (deleted rules carried legacy refs) |
| globals.css selectors | 1615 | **1615** | flat |
| component classes (non-mj) | 67 | **66** | ↓ — `service-path-card` dies with its section; the new config/progress classes carry no card/panel/button name parts |

## Gates

- **Gate A:** production build green · ESLint clean · tsc 0 errors · stylelint 0 errors · **0 hOverflow ×100 cells** · tap floors hold (chat tapUnder44 stays at its pre-existing 1: the 22px attachment-remove button — no new under-44 targets; the 3 new config chips ride the 44px floor).
- **Gate B (Phase-4 scope):** **INT-01 fully measured** (before/after on two builds — sections 8→3, cards 18→7, CTA below→above fold, disclosure mechanics verified including the first-keystroke latch) · **INT-02 fully measured** (200→240ms, offset none→4px, one owner) · the §7.5 dock condition re-verified post-change (98/98). B-9 now fully holds: route transitions run 240ms — inside the ≤300ms forbidden band.

## Not in Phase 4 (no claims)

- **UNC-01** — stays `unconfirmed-pending-owner` (D-3 open); the dock probe's observation (a ~1215px non-interactive tail below the knowledge collections, and ~472px on team) is flagged to the owner under that finding, unresolved by design.
- **INT-03** (typing feedback timing) and the remaining interaction findings — later brackets, untouched.
- **HIE-01** (h1 ramp) and **VIS-01/03, GRD-01** — Phase 5 (Brand & grid).
- The gateway's advanced disclosure is implemented but currently latent on ask (no ask tool affords the quality bar) — data-driven per §3.4, not a defect.
