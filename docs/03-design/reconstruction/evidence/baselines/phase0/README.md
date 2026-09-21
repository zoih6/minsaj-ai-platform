# Phase 0 Baseline — Guardrails (2026-09-22)

> **What this is.** The frozen measurement record taken immediately after W-DS
> approval, on the code state that includes the Phase 0 alias layer (token
> namespace declared, zero consumers switched). Every later phase compares its
> captures against this record with the same tooling
> (`scripts/visual-qa/capture.mjs`), and every G-7 metric trends from these
> numbers toward its goal. Per the owner's approval: **no finding is
> "resolved" until Gate A + Gate B pass with new measurements recorded.**

## Contents

| File | What it holds |
|---|---|
| `capture-aggregate.json` | 100 measurement cells (20 routes × 5 viewports), exact format of the audit baseline — chrome geometry, vertical budget, surface census, typography census, tap targets, section rhythm, h1 size per cell. |
| `drawer-390.json` | Drawer IA probe at 390px (group/link census). |
| `g7-baseline.json` | G-7 token-lint census (warn mode): every raw-spacing / radius / shadow / font-size / sub-10px / tracking finding with file:line, plus the frozen component-class list. |

## Method

- Build: production (`next build` + `next start`), commit state `feat(design): W-DS Phase 0` (see git blame).
- Tool: `scripts/visual-qa/capture.mjs` — the audit's measurement function ported verbatim (every number carries a selector), bounded load strategy (domcontentloaded + 8s networkidle best-effort + fonts.ready + 1600ms settle).
- G-7: `scripts/token-lint.mjs` + `.stylelintrc.json` (stylelint half: 1456 warnings, 0 errors — warn mode by design).
- Re-run any time: `npm run qa:capture -- --base http://localhost:3000 --out qa-captures --shots lite --compare docs/03-design/reconstruction/evidence/baselines/phase0/capture-aggregate.json`

## Result 1 — Zero visual drift (alias layer proven safe)

Compare vs the W-DS audit baseline
(`evidence/measurements/aggregate.json`, captured at the pre-implementation
state):

> **100 cells compared · 0 field diffs · VERDICT: IDENTICAL** — topbarH,
> bottomNavH, chromeRatio, contentVisible, hOverflow, cards, nestedCards,
> distinctRadius, distinctFontSizes, titleSize, tapUnder44 identical on all
> cells; docHeight within ±4px tolerance everywhere.

The Phase 0 alias layer (new `--mj-space-*` / type-ramp / container /
control-height tokens, radius positional aliases, `--u-alert`,
`--u-shadow-none`, `--u-motion-duration-route`) therefore changed **zero
rendered pixels**, as designed: additive custom properties, no consumers.

## Result 2 — G-7 census (the numbers every phase must move)

Audit-scope = the 15 files of the forensic audit (14 universal layers +
`globals.css`). "Audit baseline" column = the numbers in
`UI-UX-AUDIT-MATRIX.csv` (counting-method notes below).

| G-7 metric | Phase 0 | Audit baseline | Goal | Matrix ref |
|---|---|---|---|---|
| Raw padding values (distinct) | **155** | 186 (all values incl. `var()`/`0`) | 0 | SPC-01 |
| Padding values, audit-parity method | **196** | 186 | 0 | SPC-01 |
| Raw spacing incl. margin/gap (distinct) | **243** | — | 0 | R-SPACE-1 |
| Undeclared radii (distinct) | **15** | 23 (all radius values) | 5 tokens | SUR-02 |
| Raw shadows (distinct) | **72** | 71 | 5 tokens | SUR-03 |
| Raw font sizes (distinct) | **29** | 23 | 11 levels | TYP-01 |
| Sub-10px text declarations | **23** | 8 selectors (7px/8px) | 0 | TYP-02 |
| Letter-spacing candidates needing Arabic override | **37** | — | 0 unpaired | TYP-03 |
| `globals.css` selectors | **1766** | 1220 (different counting method) | 0 | IMP-02 |
| Component classes outside primitive layer (frozen list) | **67** | — | no NEW names | G-7 |

Counting-method notes (why some rows differ from the audit numbers): the lint
counts raw literals only where the audit counted all values; it also parses
the `font:` shorthand (which is where the 7px/8px text hides — 23 declarations
found vs the audit's 8 cited selectors); and it counts comma-separated
selector groups including nested rules in `globals.css` (1766 vs the audit's
line-anchored 1220). **The Phase 0 column is the frozen reference for all
future deltas** — `--compare` always diffs against this file.

Spot-checks from the fresh captures (proving the audit's headline findings
reproduce on the current build):

- Chrome ratio @390: 15.5–21% across app routes (budget: ≤15.5%) — NAV-02.
- h1 sizes live at 390: 37.05 / 34 / 33.15 / 28 / 23 px (five sizes) — HIE-01.
- Zero horizontal overflow on all 100 cells — retained Gate A pass.

## Phase 0 status

- [x] G-7 token lint, warn mode (stylelint 1456 warnings / 0 errors + custom census) — wired as `npm run lint:css` / `npm run lint:tokens`, CI workflow `.github/workflows/visual-qa-guards.yml`
- [x] Baseline captures (this folder) — zero-drift proven vs audit
- [x] Alias layer (`DESIGN-TOKENS.md` §10 migration map declared; consumers switch in Phase 1)
- [x] Gate A spot check: build green · ESLint clean · zero overflow ×100 cells

Next: **Phase 1 — Foundations** (space scale + type ramp adoption, alert
token switch, radius map rename, Arabic tracking fixes, 7/8px text fixes).
