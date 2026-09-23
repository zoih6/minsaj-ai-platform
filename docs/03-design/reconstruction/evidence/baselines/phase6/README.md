# Phase 6 Baseline — QA Hardening

**Date:** 2026-09-24 · **Authorization:** owner message «القرار: PHASE 5 — APPROVED · يسمح ببدء Phase 6» (2026-09-24, session log) — recorded in DESIGN-SYSTEM-RECONSTRUCTION §7.7 and `docs/05-process/SIGN-OFF-LOG.md` (the sign-off ledger goes live this phase).
**Reference baselines:** `../phase5/` (frozen, never overwritten — owner constraint §7.2–§7.6).
**Scope executed (per §6):** G-7 → error mode · 980-coarse probe in CI (Gate G-6) · sign-off matrix live — **plus the prerequisite those guards demand: R-RES-1b/R-RES-1a implemented (matrix RES-01, P1)**, because a green CI probe on the 980-coarse band requires the pointer guard and the never-scale zoom to exist.

## What this folder holds

| File | Content |
|---|---|
| `coarse-980-before.json` | The G-6 probe against the Phase 5 build (`38f72c4`, port 3100): **3/3 routes FAIL at 980-coarse** exactly as RES-01 predicted — `data-sidebar=rail`, dock hidden, nav text 5.49px effective, body 5.91–6.76px, drawer does not open. The 390/430 cells and the 1024/1440 fine controls PASS (the bug was coarse-wide only). |
| `coarse-980-after.json` / `shell-probe.json` | The same probe against the Phase 6 build: **11/11 cells PASS.** |
| `capture-aggregate.json` | 100 cells (20 routes × 5 viewports), same measurement function as every phase — **0 field diffs vs `../phase5/` on all 100 cells** (fine-pointer bands untouched). |
| `g7-baseline.json` | G-7 census at Phase 6 close — **identical to Phase 5 on every axis** (raw spacing 192 · radius 12 · shadow 59 · font-size 26 · sub-10px 0 · unpaired tracking 0 · legacy refs 1097 · globals selectors 1615 · component classes 66). This file is the frozen ratchet reference candidates may compare against in error mode. |
| `screenshots/` | home/chat/settings @390 + the three routes @980-coarse (the touch shell on the wide canvas) · dark theme @980 · drawer open @980 · en LTR @980. |

Probe scripts (new this phase): `scripts/visual-qa/shell-probe.mjs` (Gate G-6: 390/430/980-coarse + 1024/1440 fine-pointer controls, exit 1 on any FAIL) and `scripts/visual-qa/phase6-evidence-shots.mjs` (this folder's supplementary shots).

## Target finding — measured resolution

### RES-01 (P1) — desktop-mode-on-phone rendered a shrunken desktop UI → the touch composition at physically-readable sizes

| Measurement (shell-probe, live DOM @980×2000 coarse, phone reference 414px → scale 0.4224) | Phase 5 build | Phase 6 build | Rule |
|---|---|---|---|
| composition | `data-sidebar=rail` · dock hidden · drawer trigger opens the rail overlay | **`data-sidebar=drawer` · dock visible · drawer opens (`data-mobile-open=true`, visibility visible)** | R-RES-1b |
| topbar height | 56px (unscaled single row) | **132.7px = 56 × 2.37** (the phone row at physical size) | R-RES-1a |
| chromeRatio | n/a (rail band) | **14.3% ≤ 15.5%** (ratios preserved under uniform zoom — the probe viewport is 980×2000 = the 390×844 phone × 2.37) | B-5 |
| nav link text | 15.36px CSS → 6.5px effective (audit) / 5.49px effective (probe, label-m 13px) | **30.81px CSS → 13.0px effective** (phone label parity) | R-RES-1a |
| dock label | — (dock hidden) | **27.26px CSS → 11.5px effective** (phone caption parity) | R-RES-1a |
| body text (max p) | 16px CSS → 6.76px effective | **37.9px CSS → 16.0px effective ≥ 14px floor** | R-RES-1a |
| mono/code (chat) | 12.5px → 5.91px effective | **29.6px → 12.5px effective ≥ 11px floor** | R-RES-1a |
| h1 | 29.4px (legacy `.page-title` raw clamp) → 12.42px effective | **ramp-bound in-band → ≥ 34px effective** (the legacy clamp is bound to `--mj-text-h1` inside the coarse-wide band only; fine pointer keeps the legacy value — zero drift) | B-1 |
| tap targets under 44px (settings) | 2 | **0** (the control ladder ×zoom lifts every tokenized target above 44 CSS = 44 physical) | A-4 |
| 390 / 430 cells | PASS | **PASS** (chrome 14.5% / 13.1%, budgets intact — the guard is a no-op below 768 where mobile already ruled) | B-5 |
| 1024 / 1440 fine controls | PASS (rail / expanded + dock hidden) | **PASS** — the coarse layer never fires on fine pointers (the `useViewportMode` guard and every CSS media gate are pointer-conditioned) | R-RES-1b |

**Implementation (4 files + 2 new tools):**
- `src/hooks/use-viewport-mode.ts` + `src/lib/viewports.ts` — the R-RES-1b pointer guard per the approved implementation note: `matchMedia('(pointer: coarse)')` forces the mobile mode at any width; SSR stays mobile-first; fine pointers keep the width bands.
- `src/app/styles/universal/shell.css` — tablet/desktop blocks gated `and (pointer: fine)`; dock/notifications/command-sheet/focus-reserve blocks fire on `(pointer: coarse)` too; a coarse-wide chrome block scales the chrome raws that live outside the ladders (topbar row, drawer width/proportions, tier rows, dock item height, avatar/brand/icon sizes) via `calc(base × --mj-coarse-zoom)` — heights/widths only, paddings ride the scaled space tokens.
- `src/app/styles/universal/responsive.css` — the never-scale engine: `@media (pointer: coarse) and (min-width: 768px)` redefines the space scale, the 11-level type ramp, the control ladder, gutters and the tabbar reserve as `calc(base × 2.37)` (414/980, the audit's phone reference). Container measures (R-GRD-1 ladder) and shape tokens deliberately do not zoom — the wide canvas serves multi-column reflow within the touch shell, and shape is style, not readability.
- `scripts/visual-qa/shell-probe.mjs` — Gate G-6 as a CI-grade tool (see above).

**Documented boundaries:** the command palette's inner geometry and the marketing site's own chrome (`ms-header`) are not separately asserted by G-6 (the palette's buttons ride `--mj-touch` and scale; the landing inherits the ramp/space zoom through the shared tokens); the `10.5px` nav-group label and other globals.css raws remain IMP-02's tracked debt — untouched here so the fine-pointer capture stays at zero drift.

## G-7 — error mode live (the ratchet)

- **stylelint half:** `npm run lint:css` = `stylelint --max-warnings 929` (the Phase 6 frozen count; Phase 5 carried the same 929 — this phase added zero warnings). Any increase fails the build; paying debt down ratchets the number lower, never up.
- **custom half:** `node scripts/token-lint.mjs --enforce --compare <baseline>` exits 1 on: sub-10px text > 0 · unpaired Arabic tracking > 0 · NEW component classes · any census metric (distinct or occurrences) rising · legacy refs / globals selectors rising · **per-file** occurrence increases for the four census families (debt may not migrate between files). Sanity-proven this session: an injected `font-size: 9px; padding: 17px` was caught on all five axes (sub-10, distinct, occurrences, and both per-file ratchets) before being reverted.
- **CI reference:** `evidence/baselines/phase5/g7-baseline.json` (frozen). A future wave may re-freeze on a lower baseline — never on a higher one.

## Sign-off matrix — live (§5)

`scripts/visual-qa/signoff.mjs` classifies every push's diff into the four §5 change classes (token amendment > pattern change > route-within-patterns > copy/a11y; new route files count as pattern changes), prints the required gates and approver, and `--check` **rejects Owner-class pushes that do not carry a dated `docs/05-process/SIGN-OFF-LOG.md` entry in the same push**. The ledger ships with this phase's entry (the owner's Phase 6 authorization); pre-Phase-6 approvals remain documented in DESIGN-SYSTEM-RECONSTRUCTION §7.1–§7.6.

## Gate summary

- **Gate A:** production build clean (66/66 pages) · ESLint clean · tsc 0 new errors · stylelint 929/929 within the ratchet · G-7 error-mode PASS vs phase5 · zero horizontal overflow ×100 capture cells + all probe cells.
- **Gate B:** **B-5/B-6 fully measured** on the coarse band (composition, budgets, never-scale floors, drawer behavior — the tables above) · B-1..B-4, B-8, B-9 unchanged by measurement (zero capture drift ×100) · B-10 perceptual spot: the screenshots above (topbar/dock/drawer render coherently; the dock's 92% translucency over content is the sanctioned D-4 floating grammar).
- **CI:** `visual-qa-guards.yml` now runs three jobs — G-7 (error mode), G-6 (build → start → probe, error mode), sign-off-matrix (live classification + owner-evidence enforcement). PRs carry the §5 checklist template.
