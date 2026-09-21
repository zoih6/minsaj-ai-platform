# DESIGN-PRINCIPLES.md — Minsaj Product Design Principles
## W-DS · Design-System Reconstruction · The non-negotiable contract behind every rule

> **Purpose.** These ten principles are the constitution of the Minsaj design system. Every token, component, pattern, and QA gate in this document set must trace to at least one principle. If a proposal cannot be traced, it does not ship. If a principle conflicts with a screen, the screen changes — not the principle.
>
> **Audience.** Human designers/engineers and AI agents implementing Minsaj screens. This file is written to be consumed verbatim by agents (see `USAGE.md` for read order).
>
> **Status.** Draft for owner approval. No code may change under W-DS before this file and its siblings are approved.

---

## 0. Context — why these principles exist

The engineering audit (W-3.5, 2026-09-21) proved the app passes its engineering gates: build, types, contrast, tap targets, no horizontal overflow. The forensic UI/UX audit (this phase, W-DS) proved why the product still does not read as *one designed system*: 186 raw padding values against a 10-token spacing scale, seven coexisting component dialects, five live radii and 22 live font sizes at one viewport, two header architectures, and 93% card-in-card nesting on domain workspaces (evidence: `UI-UX-AUDIT-MATRIX.csv`).

The principles below are chosen to make that class of drift **impossible to introduce silently**. Each principle lists: the statement, the evidence that forced it, the rules it generates (stable IDs `[R-*]` defined fully in `DESIGN-TOKENS.md` and sibling specs), and what it forbids.

---

## P1 — Arabic-first is a structural constraint, not a locale setting

**Statement.** Minsaj is composed right-to-left first. Arabic script rules — taller line-height, zero letter-spacing, connected-glyph integrity, bidi isolation for Latin/numeric runs — are system invariants, not per-page adjustments.

**Evidence.** `TYP-03` (confirmed bug): `.eyebrow`, `.page-eyebrow`, `.mj-data-list__head`, `.mj-section__label` apply tracking to Arabic; `.preview-hero h1` keeps `-0.018em` in Arabic. The zero-tracking law already existed in `design-system.md` §3 but was never enforced.

**Generates.** `[R-RTL-1]` zero tracking on Arabic everywhere; `[R-RTL-2]` body line-height ≥ 1.7, headings 1.3–1.42; `[R-RTL-3]` logical properties only; `[R-RTL-4]` Latin/numeric runs isolated via `.ltr-value` / `.mono` bidi isolation; `[R-RTL-5]` direction-mirrored affordances (arrows, chevrons) — never `left/right` literals.

**Forbids.** Letter-spacing on any element that can render Arabic; `text-align: left/right`; physical `margin-left/right`; asymmetric layouts that assume LTR reading order.

---

## P2 — Content owns the screen; chrome is a budget, not a feature

**Statement.** Navigation and utility chrome may never outbid the user's work. On a 390px viewport, fixed chrome is capped at 15% of viewport height, and the budget is declared in numbers, not aspirations.

**Evidence.** `NAV-02`: chrome consumes 21% (177px of 844px) on standard routes; `NAV-01`: two header architectures (107px two-row vs 65px single-row); `NAV-04`: two bottom-nav dialects; `NAV-05`: drawer weight undifferentiated.

**Generates.** `[R-NAV-1..5]` one header architecture, the 390px vertical budget table (see `NAVIGATION-ARCHITECTURE.md` §3), one dock grammar, tiered drawer weights.

**Forbids.** A second header row on mobile; new persistent bars/ribbons without a budget amendment; navigation styling that competes with content cards (shadow stacks, saturated fills on chrome).

---

## P3 — One system, two canvases, zero dialects

**Statement.** Minsaj has exactly one component vocabulary expressed on two declared canvases (Standard, Focus). Every screen is built from the same primitives; no route family may grow its own component dialect, its own header, or its own button system.

**Evidence.** `IMP-01`: seven coexisting dialects (`universal-shell-*`, `mj-*`, `u2-*` 262 classes, `service-*`, `adaptive-*`, `ops/settings/library` 480 classes in `globals.css`, `ms-*`/Tailwind marketing); `IMP-03`: `globals.css` is an unlayered 1220-selector parallel system; `VIS-03`: `--fc-*` is an undeclared third surface language.

**Generates.** `[R-IMP-1..3]` single primitive layer (`mj-*`), layer-file residency for every selector, declared-canvas registry; the migration table in `COMPONENT-INVENTORY.md`.

**Forbids.** New `*-card`, `*-panel`, `*-button` classes outside the primitive layer; CSS in `globals.css` beyond resets; a third canvas; marketing-only copies of app components.

---

## P4 — Surfaces are earned, not decorated

**Statement.** Elevation, borders, radii, and backgrounds are the *vocabulary of hierarchy*, spent from a closed set. A container earns a surface only by grouping one coherent record or providing one overlay moment. When everything is a card, nothing is.

**Evidence.** `SUR-01`: 93% of cards nested inside cards on domain workspaces (learn 14/15, research 13/14…), depth-3 nesting on home; `SUR-02`: five live radii at 390px; `SUR-03`: 71 distinct box-shadow values; `HIE-03`: record lists rendered as card stacks read as "disconnected boxes".

**Generates.** `[R-SURF-1..4]`: closed surface set (page → card → flat-group → overlay), anti-nesting law, radius-by-level map, elevation-by-level map.

**Forbids.** Card inside card (same or higher level); a border AND a shadow AND a tint on the same container unless it is an overlay; new radii; decorative shadows.

---

## P5 — Space is a scale, never a guess

**Statement.** Every vertical and horizontal gap resolves to the spacing scale. Rhythm between sections is one token, everywhere. "It looked right with 19px" is not an engineering input.

**Evidence.** `SPC-01`: 186 distinct raw padding values vs a 10-token scale; `SPC-02`: section rhythm varies 14px → 30px → 41px between route families (≈3×); `SPC-03`: zero-gap adjacencies inside pages.

**Generates.** `[R-SPACE-1..3]`: the numeric space scale, one section-rhythm token, section floors; lint gate `G-7`.

**Forbids.** Raw px paddings/margins/gaps in component CSS; per-family block gaps; optical nudges outside the scale (use the scale's neighbors).

---

## P6 — Type is a closed ramp

**Statement.** Eleven named levels — `display, heading-xl, heading-l, heading-m, body-l, body-m, body-s, label-m, label-s, caption, code` — with fixed size, weight, line-height, tracking (zero for Arabic) and color role per level. A screen's hierarchy is expressed *only* by choosing levels from this ramp.

**Evidence.** `TYP-01`: two parallel ramps (`--u-text-*`, `--mj-text-*`) plus per-page clamps; 22 live sizes at 390px; `HIE-01`: five different h1 sizes across routes (37/34/33/28/23px); `TYP-04`: 12px is the most frequent size (511 instances), i.e. labels dominate content.

**Generates.** `[R-TYPE-1..3]`: the ramp table, the 10px floor (mono labels 10–11px), usage rules binding sizes to roles.

**Forbids.** Per-family heading clamps; a second ramp namespace; text below 10px; tracking on Arabic (see P1).

---

## P7 — Color is semantic and positional; an accent never changes meaning

**Statement.** Every color on screen is a role, not a decoration: interaction is indigo; service identity is a single jewel thread ≤10% of screen area; status tones mean only their status; attention is one token. The same hue may never carry different meanings on different screens.

**Evidence.** `VIS-02`: 26 accent-family values in active use without positional rules; `INT-03`: two alert reds; `VIS-01`: marketing Tailwind palette diverges from app tokens (cyan `#06b6d4` vs `#0b8cab`).

**Generates.** `[R-COL-1..3]`: the semantic role table with allowed positions, the marketing↔product token bridge, the single alert token.

**Forbids.** New hues; reusing a status color decoratively; accent-colored large fills; "this button looked nicer in green."

---

## P8 — Action first; configuration on demand

**Statement.** A work screen leads with intent and one primary action. Configuration (tools, modes, advanced inputs) reveals progressively — never as a wall of settings before the first keystroke.

**Evidence.** `INT-01`: the shared gateway renders 9 sections and 18 card-like surfaces before first execution; perceptual pass: "too airy between headline and inputs… card-in-card active state".

**Generates.** `[R-PAT-2]` composer-first creation template; progressive-disclosure rules per pattern in `PAGE-PATTERNS-AND-MOTION.md`.

**Forbids.** Stacked configuration cards above the composer; settings-like gateway pages; more than one primary CTA per view.

---

## P9 — Motion explains, never performs

**Statement.** Motion exists to explain state and spatial relationships. Wayfinding transitions are quick and quiet (≈240ms); expressive motion is reserved for milestones. Nothing animates without a reduced-motion path.

**Evidence.** `INT-02`: route transitions at 480ms "expressive" on every navigation; existing motion contract (`--u-motion-*`) is good but misapplied to wayfinding.

**Generates.** `[R-MOT-1..3]`: duration/easing classes per interaction type; 240ms route transitions; `prefers-reduced-motion` as a hard gate.

**Forbids.** Decorative loops on operational screens; transitions > 300ms for wayfinding; motion without a reduced-motion fallback.

---

## P10 — Perceived quality is a gate, alongside engineering

**Statement.** "It builds, lints, and passes contrast" is necessary, not sufficient. A change ships only when it also passes the visual-quality gates: hierarchy, rhythm, surface, typography, navigation clarity, state coverage, brand coherence — checked at 390, 430, 768, 1024, and 1440.

**Evidence.** The entire W-DS audit: engineering gates held (100/100 captures, zero overflow, 44px targets) while the owner's perceived quality was correct in substance (see matrix) — both facts were simultaneously true.

**Generates.** The two-gate QA protocol (engineering gates + visual gates) and the checklist in `VISUAL-QA-CHECKLIST.md`; lint gate `G-7` for token enforcement.

**Forbids.** Merging visual changes on green CI alone; QA at one viewport; "visual polish" as a later phase.

---

## Appendix — Principle → Rule → Owner-complaint traceability

| Principle | Rules | Matrix findings resolved |
|---|---|---|
| P1 Arabic-first | R-RTL-1..5 | TYP-03, TYP-02 |
| P2 Chrome budget | R-NAV-1..5 | NAV-01..07, UNC-02, UNC-03 |
| P3 One system | R-IMP-1..3, R-SURF-4 | IMP-01..03, VIS-03, HIE-02 |
| P4 Earned surfaces | R-SURF-1..3 | SUR-01..03, HIE-03 |
| P5 Space scale | R-SPACE-1..3 | SPC-01..03 |
| P6 Closed type ramp | R-TYPE-1..3 | TYP-01, TYP-04, HIE-01 |
| P7 Semantic color | R-COL-1..3 | VIS-01, VIS-02, INT-03 |
| P8 Action first | R-PAT-1..3 | INT-01, HIE-03 |
| P9 Explanatory motion | R-MOT-1..3 | INT-02 |
| P10 Perception gate | QA gates A+B, G-7 | all |
