# VISUAL-QA-CHECKLIST.md — The Two-Gate Visual QA Protocol
## W-DS · Design-System Reconstruction · "It builds" is necessary, never sufficient

> **Purpose.** The binding acceptance protocol for every visual change in Minsaj. Two gates must both pass: **Gate A (engineering)** — the classic checks; **Gate B (visual product quality)** — the checks this reconstruction exists to add. A change that passes A and fails B does not ship. This is the operational answer to the owner's acceptance-criteria amendment (audit context §25) and to finding class "engineering green, perception red".

---

## 1. The capture protocol (how QA is performed)

| Step | Requirement |
|---|---|
| 1. Viewports | 390 × 844 · 430 × 932 · 768 × 1024 · 1024 × 768 · 1440 × 900 (+ 980 × 390 coarse-pointer probe for shell changes). |
| 2. Surfaces | Both themes (light/dark) × both directions (ar/en) for the changed route family. |
| 3. States | Default · loading (throttled) · empty (where reachable) · error (where reachable) · destructive-confirm open. |
| 4. Captures | Viewport screenshot + full-page screenshot per cell; mid-scroll capture at 390 (chrome-behavior check). |
| 5. Measurements | DOM metrics recorded with selectors — chrome heights, section gaps, h1 size, radius/shadow census, tap-target census, overflow — using the same method as the W-DS audit (`evidence/` tooling). |
| 6. Perceptual pass | Full-size review + 55% thumbnail review for hierarchy/rhythm/surface balance. Perceptual claims must cite a measurement. |

## 2. Gate A — Engineering gates (retain, never weaken)

- [ ] A-1 Production build succeeds; lint clean; no new type errors.
- [ ] A-2 No horizontal overflow at any of the five viewports (and the 980 probe).
- [ ] A-3 Contrast: text ≥ 4.5:1, UI boundaries ≥ 3:1, both themes (alpha-composited).
- [ ] A-4 Tap targets ≥ 44px on coarse-pointer surfaces; ≥ 24px absolute minimum anywhere (WCAG 2.2 2.5.8).
- [ ] A-5 `prefers-reduced-motion` honored; forced-colors/`prefers-contrast` guards intact.
- [ ] A-6 Keyboard: focus-visible on every interactive element; logical tab order; skip-link works; dialogs trap focus.
- [ ] A-7 Screen-reader smoke: headings order correct, aria-current/pressed on stateful controls, live regions announce saves/errors.

## 3. Gate B — Visual product quality gates (new, binding)

Each gate cites the rule it enforces and the metric that proves it:

- [ ] **B-1 Hierarchy** — the eye lands on h1 → primary action → content, in that order; exactly one h1 per route at `--mj-text-h1`; one filled primary CTA per view. *(Rules R-TYPE-1, R-PAT-2; metric: computed h1 = ramp value; filled buttons = 1.)*
- [ ] **B-2 Spacing rhythm** — inter-section gaps = `--mj-space-600` (±0px) on every route; zero-gap adjacencies: none; card padding = `--mj-pad-card`. *(R-SPACE-1..3; metric: section-gap census, raw-padding count = 0 new.)*
- [ ] **B-3 Typography** — every text node maps to a ramp level; no size below 10px; Arabic zero-tracking verified on any tracked class. *(R-TYPE-1..3, R-RTL-1; metric: computed-size census ⊆ ramp; tracking=0 under `[lang=ar]`.)*
- [ ] **B-4 Surface hierarchy** — card census shows no same/higher-level nesting; radius ⊆ {8,12,16,22,pill}; shadows ⊆ token set; list pages use rows not card-stacks. *(R-SURF-1..3, R-PAT-1; metric: nestingDepth ≤ 1 for cards; distinct radii ≤ 5 mapped.)*
- [ ] **B-5 Navigation clarity & budget** — chrome ratio ≤ 15.5% @390 / ≤ 14.5% @430; single header row; dock grammar single; page identity announced once. *(R-NAV-1..4; metric: `verticalBudget.chromeRatio`.)*
- [ ] **B-6 Responsive composition** — each band shows its declared composition (sidebar push ≥768 fine-pointer; touch composition on coarse pointer at any width); effective text ≥ 14px body at physical phone scale; `Split`/`Grid`/`DataList` reflow contracts hold. *(R-RES-1..2, R-GRD-1.)*
- [ ] **B-7 Brand & color coherence** — accents resolve to semantic roles; no new hues; service thread ≤10% area; one alert token; marketing colors bridge to app tokens. *(R-COL-1..3; metric: hex census diff = 0 new raw accents.)*
- [ ] **B-8 States coverage** — every async surface has skeleton; every collection has empty; every failure path has error; reserved space is explained. *(R-PAT-3; metric: state matrix per route.)*
- [ ] **B-9 Interaction consistency** — route transitions 240ms; one moving element per interaction; motion mirrors in RTL. *(R-MOT-1..3.)*
- [ ] **B-10 Perceived quality** — thumbnail review: "does this read as one designed product?" — reviewer must be able to answer *why* with at least one B-1..B-9 measurement. No answer ⇒ re-review.

## 4. Gate G — Continuous guards (CI, added with W-DS implementation)

- [ ] **G-7 Token lint** (stylelint + custom checks): no raw spacing values, no undeclared radii/shadows, no sub-10px text, letter-spacing without Arabic override, no new component classes outside the primitive layer, `globals.css` selector count trends to zero.
  - **Live since Phase 0 (2026-09-22), WARN MODE:** `.stylelintrc.json` + `scripts/token-lint.mjs` (`npm run lint:css` / `npm run lint:tokens`); frozen baseline `evidence/baselines/phase0/g7-baseline.json` (155 raw paddings · 15 undeclared radii · 72 raw shadows · 29 raw font sizes · 23 sub-10px declarations · 37 tracking candidates · 1766 globals selectors · 67 frozen component classes). CI: `.github/workflows/visual-qa-guards.yml` reports the delta vs baseline on every push — never red in Phase 0–5; **Phase 6 flips to error mode**.
- [ ] **G-6 Shell probe** (CI, weekly or on shell change): headless run of the 390/430/980-coarse probes asserting B-5/B-6 metrics. Tooling ready: `scripts/visual-qa/capture.mjs` (audit measurement function, `--compare` mode vs `evidence/baselines/phase0/capture-aggregate.json`).
- [ ] **G-5 Motion audit**: any new animation declares its token class + reduced-motion path in the same PR.

## 5. Sign-off

| Change class | Required gates | Approver |
|---|---|---|
| Token amendment | A + B (spot 390/1440) + G-7 | Owner |
| New/changed pattern | A + B full protocol | Owner |
| Route within existing patterns | A + B-1..B-5, B-8 | Reviewer |
| Copy-only / a11y fix | A | Reviewer |

A failing gate is a defect list, not a debate: each failure cites the rule ID and the measured value, and is fixed or explicitly waived by the owner in writing.
