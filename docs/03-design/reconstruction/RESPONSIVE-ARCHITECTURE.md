# RESPONSIVE-ARCHITECTURE.md — Composition per Breakpoint
## W-DS · Design-System Reconstruction · Reflow is structural change, not scaling

> **Purpose.** Define what structurally changes at each viewport band, the rules that keep wide-viewport-on-phone usable, and the Arabic/RTL requirements that bind every band. Resolves `RES-01`, `RES-02`, `GRD-01`; implements P2 and P1 across bands.

---

## 1. Principle: composition, not compression

Responsive behavior is expressed as **structural decisions per band** — number of columns, navigation type, panel behavior — never as a single desktop layout scaled down. A layout that becomes unreadable when compressed is the wrong layout, not a CSS tuning problem.

**The never-scale rule [R-RES-1a].** No breakpoint band may render a composition whose *effective* text size (CSS px × physical scale) falls below 14px body / 11px mono. Verified against `RES-01`: at 980 CSS px on a 414px phone (scale 0.422), today's rail layout renders nav text at ~6.5px effective — unreadable and forbidden.

**Pointer guard [R-RES-1b].** The shell's composition choice is `(width, pointer)`:
- `(pointer: coarse)` → touch composition regardless of width (drawer + dock; sidebar rail hidden). Phones requesting "desktop site" receive the touch composition at a wide canvas — content reflows into multi-column *within the touch shell*.
- `(pointer: fine)` + width ≥ 768 → sidebar composition (rail/expanded per band).

Implementation: extend `useViewportMode` with `matchMedia('(pointer: coarse)')`; SSR-safe default remains mobile-first.

## 2. Band compositions

| Band | Width | Navigation | Columns & panels | Type & spacing behavior |
|---|---|---|---|---|
| **Mobile** | < 768 (any pointer) | Drawer + floating dock (L1/L4 per NAVIGATION-ARCHITECTURE) | Single column. `Split` collapses; `DataList` rows become labelled cards (`layout.css` rule retained); `Grid` = 1 column (min 250px track) or 2 for chips/stats only. | Ramp floors apply; section rhythm `--mj-space-600` clamps to 24px; chrome budget ≤15%. |
| **Tablet** | 768–1023 (fine pointer) | **Expanded labeled sidebar (push)** — default; owner decision pending (`RES-02`), rail remains the collapsed user choice | 2 columns where the container affords (`Grid` auto-fill); `Split` active from ~880 container width; overlays push, not cover, except dialogs. | Ramps unclamp; dock hidden (sidebar owns navigation); header search expands inline. |
| **Desktop** | 1024–1439 | Expanded sidebar (264px) or user-collapsed rail (76px) | Workspace surfaces: `wide` 1040px measure; two-panel layouts (list + inspector) allowed via `Split` | Full ramp; section rhythm to 40px; content centered at `full` measure. |
| **Wide** | ≥ 1440 | Same as desktop | Content capped at `--mj-container-full` 1440px; surplus becomes margins, never wider text | Display sizes reach ramp max; no additional columns beyond `wide` rules. |

**Container rules [R-GRD-1].** Four measures only — `narrow 560 / prose 780 / wide 1040 / full 1440` (§6.1 DESIGN-TOKENS.md). Every section declares its measure; the 11-width ladder (480/560/640/720/840/880/900/1040/1080/1240/1520) collapses to these four.

> **Phase 5 implementation record (2026-09-23).** The collapse is LIVE and
> measured (`evidence/baselines/phase5/` — CSSOM declared-measure census,
> var()-resolved): every page container rides `--mj-container-full` (was
> 1240/1320/1520/1536 mixed), every reading measure rides
> `--mj-container-prose` (was 600–830 per family), the composer rides
> `--mj-container-narrow` (was 840), work surfaces ride
> `--mj-container-wide` (was 920/980). The legacy `--mj-content-max`,
> `--u-content-max` and `--u-reading-max` tokens are deleted. **Boundary:**
> CQ reflow ladders (ops-page 1040/880/640/430 · service-space 900/560/480 ·
> mj-flow · adaptive-home · library · marketing) are composition triggers,
> not measures — they keep their own canonical table in responsive.css;
> overlay/sheet widths (580/600/660/720/760) are the portaled-overlay
> ladder, out of the measure system's scope.

**Grid rules.** `Grid` tracks never shrink below 250px (auto-fill decides column count — retained from `layout.css`). Horizontal scroll (`mj-scroll-x`) is reserved for genuinely wide artifacts (flow canvases, comparison tables) — never for card grids or text.

## 3. Band-crossing invariants (true at every width)

1. Touch floor 44px on coarse-pointer surfaces; 32px dense minimum on fine-pointer contexts only.
2. No horizontal page overflow (engineering gate — currently 100/100 clean; keep).
3. One primary CTA per view at any width.
4. Fixed chrome follows the layer model (L1/L4) at every band; nothing new becomes sticky without a budget amendment.
5. Reduced-motion honored (gate, not suggestion).

## 4. Arabic-first & RTL requirements (all bands)

| ID | Requirement |
|---|---|
| R-RTL-1 | **Zero letter-spacing on Arabic.** Every tracking declaration must ship an `[lang="ar"]`/`[dir="rtl"]` zero override (or be scoped to `html[lang="en"]` / `.ltr-value`). Fixes `TYP-03` (.eyebrow 0.08em, .mj-data-list__head 0.02em, .preview-hero −0.018em on Arabic). |
| R-RTL-2 | **Line-heights are Arabic-calibrated floors**: body ≥1.7, headings 1.3–1.42, display 1.25 (ramp values; Latin may tighten via lang scope). |
| R-RTL-3 | **Logical properties only**: `inline-start/end`, `block-start/end`, `margin-inline`… Physical `left/right` banned outside documented assets (existing repo law, restated as lint-checked). |
| R-RTL-4 | **Bidi isolation for embedded Latin/numbers**: technical strings wrap in `.mono` / `.ltr-value` (`direction: ltr; unicode-bidi: isolate` — already provided; usage now mandatory for run IDs, costs, filenames inside Arabic sentences). |
| R-RTL-5 | **Mirrored affordances**: directional icons (arrows/chevrons/back) mirror under `[dir="rtl"]`; the existing `.lucide-arrow-left` rotation rule generalizes to a `data-directional` icon convention. |
| R-RTL-6 | **Numerals**: technical/metric contexts use Western digits in IBM Plex Mono (`--mj-text-code`); prose may use Arabic-Indic digits per content style — never mixed within one metric. |
| R-RTL-7 | **RTL shimmer/animation directions**: direction-aware keyframes (`.u-skeleton` RTL sweep pattern) are the standard for every new motion — motion must not imply LTR reading. |

## 5. Reflow contracts for shared components

| Component | < 768 | 768–1023 | ≥ 1024 |
|---|---|---|---|
| `DataList` | Header hidden; rows = labelled 2-col cards (existing) | Full table grid | Full table grid, sticky header row inside surface |
| `Split` | Single column stack | Single column until 880 container | Two columns |
| `ControlBar` | Label + tail row, chips scroll horizontally (existing) | same | single row wrap allowed |
| `SectionHead` | Stacks vertically; aside full-width (existing) | inline | inline |
| Dialogs | Bottom sheets (`mj-dialog` phone geometry) | centered | centered; `wide` 760px for destructive/complex |
| Dock | Present (L4) | Hidden (fine pointer) | Hidden |

## 6. QA binding

Every responsive rule above is checked by the five-viewport protocol (390/430/768/1024/1440) plus the desktop-mode probe (980 × coarse pointer) in `VISUAL-QA-CHECKLIST.md` gates B-6 and G-6.
