# DESIGN-TOKENS.md — Minsaj Token Specification
## W-DS · Design-System Reconstruction · The executable contract between design and code

> **Purpose.** Define every token of the Minsaj design system: its name, value, layer, usage rule, and the problem it solves. Tokens are the only sanctioned source of visual values. If a value is not expressible through these tokens, the correct fix is a token amendment — never a raw value in a component.
>
> **Source of truth in code (target state).** `src/app/styles/universal/foundations.css` (identity, color, elevation, shape, motion) and `src/app/styles/universal/layout.css` (space, type, layout). The marketing `@theme` block bridges to these values instead of declaring its own (see §9).
>
> **Layer discipline** (adapted from the OpenDesign token schema and Ant Design's token model): every token belongs to exactly one layer —
>
> | Layer | Who decides | If omitted | Minsaj examples |
> |---|---|---|---|
> | **A1-identity** | the brand | build fails | `--u-primary`, `--u-ink`, `--mj-font-body` |
> | **A1-structure** | the brand (per-product decision) | build fails | type ramp steps, space scale, container ladder |
> | **A2** | brand, with a system default | guard fills the default | `--u-success`, `--u-radius-card`, `--u-motion-fast` |
> | **B-slot** | optional richer tier; aliases to a sibling | aliases automatically | `--u-ink-soft → --u-ink`, `--u-surface-subtle → --u-surface` |
> | **C-extension** | named allowlist per surface family | review required | `--service` thread, `--fc-*` (to be folded) |
>
> A new C-extension earns promotion to B-slot only when ≥2 surface families need it; to A2 when a cross-screen default exists. **When NOT to add a token:** component-internal values, one-off layouts, speculative tiers, anything already expressible as `color-mix()`/existing steps (OpenDesign `_schema/AGENTS.md` rules, adopted verbatim).

---

## 1. Color — semantic roles and positions

### 1.1 Neutral canvas (A1-identity — existing, confirmed)

| Token | Light | Dark | Role / allowed positions |
|---|---|---|---|
| `--u-bg` | `#f9fafb` | `#0b0e1b` | Page canvas. The only full-screen background. |
| `--u-bg-deep` | `#f2f3f8` | `#080a14` | Alternating page band (rare; marketing/sections). |
| `--u-surface` | `#ffffff` | `#141831` | Card surface (L1). |
| `--u-surface-subtle` | `#f3f4f9` | `#1b1f3d` | Flat inline group inside a card. |
| `--u-ink` | `#0b0f1a` | `#eceef8` | Primary text. Headings and body defaults. |
| `--u-ink-soft` *(B-slot)* | `#232842` | `#cdd0e4` | Secondary emphasis text. |
| `--u-muted` | `#565b7e` | `#9ba0bf` | Secondary text: descriptions, meta. |
| `--u-faint` | `#5d6280` | `#9096b6` | Tertiary text: labels, captions, inactive chrome. |
| `--u-line` | `#e5e7eb` | `#424873` | Hairline: card borders, dividers. |
| `--u-line-strong` | `#8290b0` | `#5d6298` | Functional frames: outline buttons, inputs, menus (WCAG 1.4.11 ≥3:1). |

### 1.2 Interaction — the one accent (A1-identity)

| Token | Light | Dark | Role / allowed positions |
|---|---|---|---|
| `--u-primary` | `#4f46e5` | `#818cf8` | Interactive accent. Primary CTA fill, links, active nav, focus. **The only button-accent on product screens.** |
| `--u-primary-strong` / `--u-primary-deep` | `#4338ca` / `#3730a3` | `#8e9bfb` / `#6366f1` | Hover / pressed steps. |
| `--u-primary-soft` | `#eef2ff` | `rgba(129,140,248,.13)` | Tint fills: active tab pill, selection halo, quiet badges. Never a large-area fill. |
| `--u-primary-soft-line` | `#d8ddfb` | `rgba(129,140,248,.38)` | Border of soft-tint surfaces. |

**Rule [R-COL-2a].** `--u-primary` appears at most: one filled CTA per view, active navigation state, inline links, focus rings. Large-area indigo fills are forbidden on product screens.

### 1.3 Status tones (A2 — the B1 triad, formalized)

Each status family is a closed triad: `*-ink` (text), `*-soft` (tint surface), `*-soft-line` (tint border). All three exist per theme (already implemented; now contractual).

| Family | Meaning (and only this) | Light ink / soft | Positions |
|---|---|---|---|
| `--u-success` / `--u-mint-ink` / `--u-mint-soft` | Completed, ready, healthy | `#0d9f70` / `#235c4b` / `#e4f6ef` | Status badges, validation confirmations, progress completion. |
| `--u-warning` / `--u-amber-ink` / `--u-amber-soft` | Attention, stale, approaching limits | `#c07317` / `#6d4d10` / `#fbf1e2` | Status badges, quota warnings. |
| `--u-danger` / `--u-danger-ink` / `--u-danger-soft` | Failure, destructive, irreversible | `#d7373f` / `#8d2f2f` / `#fdecec` | Error states, destructive buttons, failure badges. |
| `--u-info` (`--u-cyan`) / `--u-cyan-ink` / `--u-cyan-soft` | Neutral informational, indexing/in-progress | `#0b8cab` / `#0d5c72` / `#e4f6fc` | Info badges, "in progress" states. |

### 1.4 Attention (A2 — new, resolves INT-03)

| Token | Value | Role |
|---|---|---|
| `--u-alert` | `#ef4444` (both themes) | The single notification/attention dot. Replaces `--u-shell-alert` pink on standard chrome. |

### 1.5 Service identity thread (C-extension, one family)

`--service`, `--service-soft`, `--service-deep` bound by `[data-service]` (7 services, jewel tones, existing values unchanged). **Rule [R-COL-2b]:** the service thread appears only as: service badge, composer gradient ring, path/border accents, small icon chips — **≤10% of screen area** (existing law, now enforced by review). It never fills buttons, cards, or backgrounds.

### 1.6 What dies

- `--u-shell-alert` (replaced by `--u-alert`).
- All raw hex accents in component rules (364 found in layers; migration waves in §11).
- Marketing's divergent duplicates (`--color-brand-cyan #06b6d4` etc.) — see §9 bridge.

---

## 2. Typography — the closed ramp (A1-structure)

Two legacy ramps (`--u-text-*`, `--mj-text-*`) collapse into one 11-level ramp. Legacy names become **deprecated aliases** (mapped in §10) for one migration wave, then are deleted.

Arabic = Tajawal (body) / Alexandria (display). Latin = Inter. Technical/numeric = IBM Plex Mono. **Zero letter-spacing on Arabic at every level** (`[R-RTL-1]`); tracking values below apply to Latin strings only.

| Level token | Size (fluid) | Weight | Line-height (AR) | Tracking (Latin) | Color role | Usage |
|---|---|---|---|---|---|---|
| `--mj-text-display` | `clamp(34px, 5vw + 14px, 58px)` | 700 | 1.25 | −0.02em | ink | Marketing hero only. Never in /app. |
| `--mj-text-h1` | `clamp(26px, 1.6vw + 20px, 34px)` | 700 | 1.35 | −0.01em | ink | One per route: the page title block. |
| `--mj-text-h2` | `clamp(19px, 0.8vw + 16px, 24px)` | 700 | 1.35 | 0 | ink | Section titles (`mj-section__title`). |
| `--mj-text-h3` | `clamp(16px, 0.4vw + 14px, 19px)` | 600 | 1.42 | 0 | ink | Card titles, panel heads. |
| `--mj-text-body-l` | `17px` | 400 | 1.7 | 0 | ink-soft | Lede paragraphs, welcome copy. |
| `--mj-text-body-m` | `clamp(15px, 0.2vw + 14.4px, 16px)` | 400 | 1.7 | 0 | ink | Default body. |
| `--mj-text-body-s` | `clamp(13.5px, 0.15vw + 12.9px, 14px)` | 400 | 1.6 | 0 | muted | Supporting text, descriptions. |
| `--mj-text-label-m` | `13px` | 600 | 1.45 | 0 | ink-soft | Field labels, nav items, tab labels. |
| `--mj-text-label-s` | `12px` | 600 | 1.45 | 0 | faint | Group labels, table headers (zero tracking in Arabic). |
| `--mj-text-caption` | `11.5px` | 500 | 1.45 | 0 | faint | Timestamps, helper text, metadata. |
| `--mj-text-code` | `12.5px` | 400 | 1.55 | 0 | ink-soft | Mono: run IDs, costs, file names (`--mj-font-mono`). |

**Rules.**
- **[R-TYPE-1]** Every text node uses a ramp level; no other `font-size` may be declared in component CSS (lint `G-7`). Route h1 = `--mj-text-h1` everywhere — kills the 37/34/33/28/23px spread (`HIE-01`).
- **[R-TYPE-2]** Minimum text size is 10px, and only for mono technical labels (preferred 11px). The measured 7–8px labels are raised (`TYP-02`).
- **[R-TYPE-3]** 12px (`label-s`) is metadata-only; content strings never render below `body-s` (`TYP-04`).
- **[R-RTL-2]** Line-heights above are Arabic-calibrated floors; Latin may tighten display/heading to 1.15/1.25 via `html[lang="en"]` scope only.

---

## 3. Spacing — the numeric scale (A1-structure)

Base-4 numeric scale replaces the semantic gap soup. All gaps, paddings, and offsets resolve to these steps.

| Token | Value | Use |
|---|---|---|
| `--mj-space-25` | `2px` | Hairline nudges, icon optical alignment. |
| `--mj-space-50` | `4px` | Inside dense data cells only (was `--mj-gap-2xs`). |
| `--mj-space-100` | `8px` | Inside controls; between icon and label. |
| `--mj-space-150` | `12px` | Intra-card group gap. |
| `--mj-space-200` | `16px` | Card padding floor (mobile); control-row gap. |
| `--mj-space-300` | `24px` | Card padding (desktop); **minimum inter-section gap**. |
| `--mj-space-400` | `32px` | Generous group separation inside a page. |
| `--mj-space-600` | `48px` | **Section rhythm** between page sections (the one `--mj-gap-block` token, clamped 24→48px mobile→wide). |
| `--mj-space-800` | `64px` | Marketing section breathing. |

**Rules.**
- **[R-SPACE-1]** No raw px paddings/margins/gaps in any component or layer CSS (186 raw values today — `SPC-01`). Everything maps to a step; the scale's neighbors replace "optical" values.
- **[R-SPACE-2]** Inter-section rhythm = `--mj-space-600` (fluid `clamp(24px, 2.6vw + 16px, 48px)`) on **every** route — kills the 14/22/30/41px family spread (`SPC-02`).
- **[R-SPACE-3]** Adjacent page sections never touch: floor `--mj-space-300` (`SPC-03`). Intra-group gaps are 100–200; group→surface padding 200–300.
- Card padding is a single token `--mj-pad-card = clamp(16px, 1vw + 10px, 24px)` (= space-200→300) — one value per surface, as the current design-system.md already demands.

---

## 4. Radius — by surface level (A2)

| Token | Value | Level allowed on |
|---|---|---|
| `--u-radius-control` | `8px` | Buttons, inputs, chips' inner elements, segmented controls. |
| `--u-radius-field` | `12px` | Inputs, flat inline groups, dock items. |
| `--u-radius-card` | `16px` | Cards and every L1 surface. |
| `--u-radius-overlay` | `22px` | Dialogs, command palette, sheets (bottom sheets keep top-only radii). |
| `--u-radius-pill` | `999px` | Chips, badges, status pills — a shape, not a roundness degree. |

**Rules.**
- **[R-SURF-2]** Radius is a function of surface level (control 8 / field-flat 12 / card 16 / overlay 22 / pill). The five live values at 390px and 23 declared values collapse to this map; asymmetric quirks (`7px 7px 2px 7px`) are removed.
- Circles (`50%`) are for avatars/dots only.

---

## 5. Elevation — by surface level (A2)

Keep the existing five-step scale, bind usage:

| Token | Value (light) | Level |
|---|---|---|
| `--u-shadow-none` | `none` | Page canvas, flat groups, chrome. |
| `--u-shadow-xs` | existing `--u-shadow-xs` | Cards (L1). |
| `--u-shadow-sm` | existing | Hover lift of actionable cards. |
| `--u-shadow-md` | existing | Floating dock, popovers. |
| `--u-shadow-lg` / `--u-shadow-xl` | existing | Overlays, command palette, toasts. |

**Rules.**
- **[R-SURF-3]** Shadows come only from these tokens (71 raw values today). One elevation step per surface level: card=xs, hover=sm, dock=md, overlay=lg/xl.
- **[R-SURF-1]** A surface never contains a surface of the same or higher level; grouping inside a card = `mj-stack` + spacing or a `--flat` group (anti-nesting law; 93% nesting today).
- Elevation never stacks with a strong border on the same edge: card = border **or** shadow per level map (L1: hairline + xs; overlay: shadow only).

---

## 6. Grid, containers, control heights, icons

### 6.1 Container ladder (A1-structure) — `[R-GRD-1]`

Four measures replace the 11 active widths:

| Token | Width | For |
|---|---|---|
| `--mj-container-narrow` | `560px` | Composer, single-column forms, toolbelts. |
| `--mj-container-prose` | `780px` | Reading text, gateway narrative sections. |
| `--mj-container-wide` | `1040px` | Workbench surfaces, data lists, card grids. |
| `--mj-container-full` | `1440px` | Page content max (was 1520/1240 mixed). |

Every `mj-section` declares one measure; prose text never exceeds `prose`; grids may extend to `wide`.

### 6.2 Control heights (A2) — the height ladder

| Token | Value | Use |
|---|---|---|
| `--mj-control-dense` | `32px` | In-table/inline toolbars (pointer-only contexts). |
| `--mj-control-compact` | `40px` | Secondary buttons in tight clusters. |
| `--mj-touch` | `44px` | **Touch floor — every interactive target on coarse-pointer surfaces.** |
| `--mj-control-prominent` | `52px` | Primary CTA, composer submit. |

### 6.3 Icon sizes (A2)

`16` inline with text · `18` navigation items · `20` section/card head · `24` feature/empty-state. No other lucide sizes render (current mix 12–34).

---

## 7. Motion (A2 — existing contract, one correction)

Keep the existing duration/easing tokens (`--u-motion-duration-*` 80–760ms; easings standard/enter/exit/emphasized/spring). One binding change:

- **[R-MOT-1]** Route transitions use `--u-motion-duration-fast`+`70ms` = **240ms** (new `--u-motion-duration-route`), not the 480ms expressive token (`INT-02`).
- **[R-MOT-2]** Expressive (480ms) is reserved for milestone moments: first-visit hero, save celebration, run completion.
- **[R-MOT-3]** `prefers-reduced-motion` kills decorative motion system-wide (already implemented — keep as gate).

---

## 8. Breakpoints & pointer bands (A1-structure)

Viewport bands (unchanged): `mobile <768 · tablet 768–1023 · desktop 1024–1439 · wide ≥1440`.

New rule **[R-RES-1]**: the shell chooses its composition by **pointer capability as well as width** — `(pointer: coarse)` with viewport ≥768 (a phone requesting the desktop site) still receives the touch composition (drawer + dock, ≥14px effective text). The rail/sidebar composition requires a fine pointer. (Fixes `RES-01`: 6.5px effective nav text at 980px desktop-mode.)

---

## 9. Brand bridge — marketing ↔ product (A2)

Marketing keeps Tailwind utilities but consumes the same values:

```css
@theme {
  --color-brand: var(--u-primary);            /* #4f46e5 — one indigo everywhere */
  --color-brand-light: var(--u-primary-strong);
  --color-brand-dark: var(--u-primary-deep);
  --color-brand-cyan: var(--u-cyan);          /* was #06b6d4 vs app #0b8cab */
  --color-brand-emerald: var(--u-success);
  --color-brand-pink: var(--u-pink);
}
```

**Rule [R-COL-1].** `@theme` color values must be `var(--u-*)` references. Independent marketing hexes are deleted. The marketing surface may keep its cinematic dark canvas (`--darkbg-*` neutrals) — those are canvas tokens, not accents.

---

## 10. Migration aliases (one wave, then deletion)

| Legacy | Maps to |
|---|---|
| `--u-text-xs/sm/md/lg/xl` | `caption / body-s / body-m / body-l / h3` |
| `--mj-text-hero/small` + per-page clamps | `display / body-s` |
| `--mj-gap-2xs/xs/sm/md/lg/block` | `space-50/100/150/200/300/600` |
| `--u-radius-xs/sm/(base)/lg` | `control / field / card / overlay` |
| `--u-shell-alert` | `--u-alert` |
| `--fc-*` (15 tokens) | folded: chrome tokens rebind under `[data-canvas="focus"]`; the `--fc-` namespace is deleted (declares the second canvas — resolves `VIS-03`) |

## 11. Adoption order (per foundation)

1. **Wave 1 (pure wins, zero visual risk):** space scale + type ramp aliases; alert token; radius map rename; kill 7/8px text; Arabic tracking overrides. CI lint `G-7` switches on with warnings.
2. **Wave 2 (surfaces):** settings/ops pages rebuilt on `mj-surface` (kills the divergent skin); anti-nesting refactor of workbench/gateway interiors.
3. **Wave 3 (chrome):** unified single-row header + dock; drawer tiering; vertical budget enforcement.
4. **Wave 4 (brand):** marketing bridge; focus-canvas fold; container ladder collapse.

## 12. The six-question admission test (mandatory for every new token)

A token is admitted only if all six answers are **yes**:

1. Does it solve a problem actually observed in Minsaj (matrix finding)?
2. Does it serve Minsaj's identity (loom metaphor, Arabic-first, calm surfaces)?
3. Does it improve consistency between screens?
4. Does it work on mobile **and** desktop (both canvases, both themes, both directions)?
5. Can it be expressed as an executable rule (lintable/checkable)?
6. Does it reduce one-off per-element decisions?

## 13. Rejected tokens (considered and refused, with reasons)

| Proposal | Why rejected |
|---|---|
| `--u-radius-xl` (30px, currently defined) | Zero live usage in evidence (Q1 fails). Oversized radii read as consumer-playful, not workbench. Deprecated. |
| A 16-step T-shirt spacing scale (`space-1…16`) | The 9-step numeric scale covers all 186 measured raw values; more steps = more drift, not more discipline (Q6 fails). |
| Dual alert tokens (pink for shell, red for canvas) | Two attention colors is the bug `INT-03`, not a feature (Q3 fails). One `--u-alert`. |
| Per-service primary buttons (`--service` as CTA fill) | Breaks the "one interaction accent" law; service threads are identity, not action (Q2/Q3 fail). |
| A `--mj-desktop-mode` breakpoint token | The fix is a pointer-capability guard (`R-RES-1`), not a new width (Q5 fails). |
| Arabic letter-spacing tokens (e.g. `--tracking-ar`) | Arabic tracking is always zero — a ban, not a value (Q1: the problem is violations, not a missing token). |
| Per-page hero title clamps (keep current family values) | The exact defect `HIE-01` (five h1 sizes). One ramp level instead (Q3 fails for the proposal). |
| `--u-shadow-2xs` and intermediate elevation steps | 71 raw shadows collapse to 5 tokens; adding finer steps reopens drift (Q6 fails). |
