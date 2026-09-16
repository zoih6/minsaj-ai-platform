# Nasaq AI — Design System ("Luminous Premium")

| | |
|---|---|
| **Document ID** | NASAQ-DS |
| **Version** | 2.0 — 2026-09 |
| **Status** | Active — reflects shipped tokens in `src/app/styles/universal/foundations.css` |
| **Implementation** | CSS custom properties, single global entrypoint `src/app/universal.css` |
| **Related** | `02-UX-SPECIFICATION.md` (behavior) · `04-FRONTEND-ARCHITECTURE.md` (layering) |

---

## 1. Brand & Art Direction

**Name**: Nasaq (نَسَق) — "structure / composition / coherence".
**Direction**: *Luminous Premium* — a calm, bright, violet-led workspace with obsidian chrome (shell) and jewel-tone service accents. The brand reads as trustworthy, editorial, and Arabic-native: generous whitespace, refined shadows, restrained motion.

**Mood keywords**: وضوح · ثقة · رصانة · فخامة هادئة (clarity, trust, poise, calm luxury).

## 2. Color System

### 2.1 Core Neutrals

| Token | Value | Use |
|---|---|---|
| `--u-bg` | `#f5f6fb` | App background |
| `--u-bg-deep` | `#eef0f8` | Recessed background |
| `--u-surface` / `--u-surface-solid` | `#ffffff` | Cards, sheets |
| `--u-surface-glass` | `rgba(255,255,255,.86)` | Topbar glass |
| `--u-ink` | `#0f1225` | Primary text |
| `--u-ink-soft` | `#2a2d47` | Secondary text |
| `--u-muted` | `#5b5f7e` | Muted text |
| `--u-faint` | `#8387a2` | Hint text |
| `--u-line` / `--u-line-strong` | `#e5e7f2` / `#d0d3e6` | Hairlines |

### 2.2 Primary (Violet)

| Token | Value | Use |
|---|---|---|
| `--u-primary` | `#5548e0` | Primary actions, links, focus |
| `--u-primary-strong` | `#4539c9` | Hover |
| `--u-primary-deep` | `#372da8` | Active/pressed |
| `--u-primary-soft` | `#edeaff` | Tinted fills, badges |
| `--u-primary-glow` | `rgba(85,72,224,.24)` | Ambient glow, shadows |

### 2.3 Service Palette (jewel tones)

| Token | Value | Semantic home |
|---|---|---|
| `--u-cyan` | `#0ea8cf` | Research / Explore |
| `--u-mint` | `#0fae7c` | Learn / success accents |
| `--u-pink` | `#e2579a` | Create |
| `--u-amber` | `#d98a2b` | Analyze / warnings |
| `--u-danger` | `#d7373f` | Destructive / errors |

Each accent has a `-soft` tint for badges and fills. **Status is never color-only** — always icon + text.

### 2.4 Shell Chrome (obsidian)

The application sidebar uses a dark obsidian surface with violet luminance (defined in `shell.css`), distinct from the bright content canvas — the "dark frame, light canvas" composition.

## 3. Typography

| Role | Family | Notes |
|---|---|---|
| Arabic UI | **IBM Plex Sans Arabic** (`@fontsource`, weights 400/500/600/700) | Arabic-first metrics; line-height +0.1 vs Latin |
| Latin UI | **IBM Plex Sans** | Same optical family |
| Code / numeric | **IBM Plex Mono** | Code blocks, IDs, metrics |

**Fluid scale** (never below 11.5px):

| Token | Size |
|---|---|
| `--u-text-xs` | `clamp(11.5px, .75rem, 12.5px)` |
| `--u-text-sm` | `clamp(13px, .84rem, 14px)` |
| `--u-text-md` | `clamp(15px, .96rem, 16px)` |
| `--u-text-lg` | `clamp(17px, 1.12rem, 19px)` |
| `--u-text-xl` | `clamp(21px, 1.4rem, 24px)` |

Display sizes (marketing) go larger via section-local clamps. Line lengths respect `--u-reading-max: 780px`.

## 4. Geometry

| Token | Value |
|---|---|
| `--u-radius-xs/sm` | 8 / 12 px |
| `--u-radius` | 16 px (default card) |
| `--u-radius-lg / xl` | 22 / 30 px (hero, dialogs) |
| `--u-touch` | **44 px** (hard floor for interactive height/width) |

**Spacing**: 4 px base grid; section rhythm `--u-section-space: clamp(56px, 7vw, 112px)`; page gutter `--u-page-gutter: clamp(14px, 1.1vw + 10px, 32px)`.

## 5. Elevation

| Token | Character |
|---|---|
| `--u-shadow-xs` | Hairline lift (chips) |
| `--u-shadow-sm` | Resting cards |
| `--u-shadow-md` | Hover lift, popovers |
| `--u-shadow-lg` | Dialogs, drawers |
| `--u-shadow-xl` | Command palette, hero panels |

Shadows carry a violet tint (`rgba(70,64,160,…)`), reinforcing brand temperature. Hover lift pairs `--u-shadow-sm → md` with a `translateY(-2px)`.

## 6. Layout Primitives (`layout.css`)

| Primitive | Purpose |
|---|---|
| `.nq-grid` | Intrinsic auto-fill `minmax()` grids; variants `--tight` (200px), default (240px), `--roomy` (300px), `--stats` (150px) |
| `.nq-stack` | Vertical rhythm (variants `--tight`) |
| `.nq-cluster` | Wrapping inline row (start/between/end/stretch) |
| `.nq-split` | Two-pane responsive split (collapses by content min-width) |
| `.nq-data-list` | Table → stacked-card demotion under intrinsic width |
| `.nq-scroll-x` | Bounded horizontal scroll with edge fade |
| `.nq-page-header` | Title + actions cluster with guaranteed copy min-width |
| `.nq-flow` | Step-flow stacks (workspace stages) |

These primitives are the **only sanctioned** layout mechanisms — page-specific fixed-column grids are forbidden (see Architecture §conventions).

## 7. Breakpoints & Viewport Bands

Single source of truth: `src/lib/viewports.ts` (mirrored in CSS):

| Band | Range | Sidebar | Content max |
|---|---|---|---|
| Mobile | < 768 | Drawer + bottom tab bar | full-bleed |
| Tablet | 768–1023 | Icon rail (overlay expand) | `--u-content-max` |
| Desktop | 1024–1439 | Expanded sidebar | 1520 px max |
| Wide | ≥ 1440 | Expanded sidebar | wider content max |

Container queries (4 bands: 1040/880/640/430) drive **component-level** reflow by available width — components behave identically regardless of which page hosts them.

## 8. Components

### 8.1 Inventory (shared surfaces)

- **App shell**: sidebar (3 modes), topbar (glass), bottom tab bar (mobile), backdrop, command palette, notifications panel.
- **Buttons** — primary (violet fill), secondary (line), ghost, danger; 3 sizes; press = scale(0.98) + deep color.
- **Cards** — service cards (jewel gradients on hover), stat cards, entity cards (project/run/output).
- **Badges** — status (soft tint + icon), truth labels (`Demo`, `Simulated`, `Not executed`).
- **Fields** — text/select/checkbox/radio; 40 px desktop / 44 px touch; focus ring `--u-primary-glow`.
- **Dialogs & sheets** — centered desktop / bottom-sheet mobile; `100dvh` bounded.
- **Toasts** — `u-feedback-toast` + `DemoToast`; portaled; tab-bar-aware.
- **Data tables** — `nq-data-list` demotion pattern; sticky header on wide.
- **Progress** — determinate bars (`u-progress-grow`), status spinners, step rails (workbench).

### 8.2 States Styling

Every interactive component implements: rest · hover (lift/tint) · focus-visible (2px ring, 2px offset, `--u-primary`) · active/press · disabled (48% ink + no shadow) · loading (inline spinner, label persists). Skeletons use a 1.4% violet shimmer on `--u-line` blocks.

## 9. Motion

### 9.1 Duration Tokens

| Token | Value |
|---|---|
| `--u-motion-duration-instant` | 80 ms |
| `--u-motion-duration-fast` | 130 ms |
| `--u-motion-duration-moderate` | 200 ms |
| `--u-motion-duration-slow` | 300 ms |
| `--u-motion-duration-expressive` | 480 ms |
| `--u-motion-duration-progress` | 760 ms |

### 9.2 Keyframe Library (`motion.css`)

`u-enter-soft` · `u-route-in` · `u-live-settle` · `u-scene-card-in` (entrances) — `u-overlay-in/out` (scrims) — `u-dialog-in/out` · `u-command-in/out` · `u-sheet-in/out` (surfaces) — `u-feedback-in` · `u-toast-in` (notifications) — `u-status-spin` · `u-progress-grow` (activity) — `u-gradient-drift` · `u-glow-breathe` · `u-float-drift` (ambient, marketing only).

### 9.3 Rules

1. Motion is CSS-only (JS toggles classes/attributes) — no JS-driven tweening on core paths.
2. `prefers-reduced-motion: reduce` disables transforms, ambient loops, and scroll-reveal; opacity-only transitions remain.
3. Ambient motion (glow breathing, gradient drift) is restricted to marketing surfaces — never inside work areas.
4. Z-index ladder is documented once in `shell.css` and must not be extended ad hoc.

## 10. Iconography & Illustration

- Icon set: **Lucide** (React) — 1.5px stroke, currentColor.
- Icon sizing: 16/20/24 px aligned to the type scale.
- Illustration: line-art with violet/jewel accents, geometric (no mascots), same weight as UI strokes.

## 11. Voice & Truth Labels

Wording for truth labels, statuses, and error contracts is **dictionary-owned** (`@nasaq/i18n`), not per-page copy. Fixed vocabulary:

| Concept | AR | EN |
|---|---|---|
| Demo mode | عرض تجريبي | Demo |
| Simulated | محاكاة | Simulated |
| Not executed | لم يُنفَّذ | Not executed |
| Saved to Library | حُفظ في المكتبة | Saved to Library |
| Partial output | مخرج جزئي | Partial output |

## 12. Dark Mode — «Luminous Premium Dark» (shipped in Phase 10)

Dual-theme is LIVE: `next-themes` writes `data-theme` on `<html>` (system-follow default,
3-state cycle toggle: light → dark → system). Architecture:

- **Token split:** light values in `:root`, dark values in `:root[data-theme="dark"]`
  (foundations.css); the legacy bridge tokens are re-defined inside both blocks, so every
  legacy component themes itself with zero per-component work.
- **Dark palette principles** (researched — MD3 + Apple HIG + WCAG):
  - Surfaces are deep desaturated ink (`--u-bg #0c0e1d`, `--u-surface #151830`), **never pure
    black**; elevation reads through lighter surfaces + violet glow.
  - Text is off-white (`--u-ink #eceef8`), **never pure white**; text ramp brightens, never
    darkens.
  - Brand/service hues brighten ~10% for AA on dark; soft tints become translucent
    (`rgba(service, .12–.16)`).
- **Semantic surface tokens** (both themes): `--u-glass/-strong/-line`, `--u-veil`,
  `--u-raise`, `--u-hover-veil`, `--u-field`, `--u-tint-1`, `--u-artboard`,
  `--u-control-line` (interactive control borders, ≥3:1).
- **Enforcement:** `scripts/check-theme-contrast.mjs` (CI) — text ≥4.5:1, icons/UI ≥3:1 in
  BOTH themes; `scripts/verify-sweep-v10.sh` sweeps 30 routes × 3 viewports × 2 themes.
  Full contract in `.claude/skills/theming-and-contrast/SKILL.md`.

## 13. Governance

- Tokens are defined **once** in `foundations.css`; per-layer files may consume, never redefine.
- A new component must reuse primitives (`nq-*`) and existing buttons/badges before anything new is proposed.
- Visual QA (VLM-assisted) runs on the 6 core pages × 3 viewports before any release; regressions block the release (see `06-TESTING-STRATEGY.md`).
