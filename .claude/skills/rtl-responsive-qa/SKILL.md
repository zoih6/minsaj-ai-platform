---
name: rtl-responsive-qa
description: Arabic-first RTL and responsive quality protocol for every visual change. Use when adding or modifying any component, page, style, or interaction to guarantee logical properties, bilingual content, accessibility contracts, and 375/768/1440 correctness.
---

# RTL-First Responsive QA

## Purpose

The product is Arabic-first RTL with a secondary English LTR locale. A component is not "done"
when it looks right in one language at one width — it is done when geometry, motion, and content
hold across both directions and all container bands.

## The QA contract

### 1. Logical properties only (hard rule)

- Use `inline-start`/`inline-end`, `padding-inline`, `margin-block`, `inset-inline`…
- **Zero physical `left`/`right` in CSS.** Direction flips automatically with `[dir]`.
- Direction-dependent visual effects (e.g. inset shadows on list rows) use `[dir="rtl"]` /
  `[dir="ltr"]` selectors — never a hardcoded side.
- Verify: search the changed CSS for `\bleft\b|\bright\b` before delivering.

### 2. Viewport verification

- Checkpoints: **375** (mobile, drawer + bottom tab bar), **768** (tablet, icon rail,
  expand = overlay), **1440** (desktop, expanded).
- Components reflow by **available container width** (container queries, bands 1040/880/640/430),
  not by viewport media queries.
- Zero horizontal overflow at every checkpoint (`scrollWidth === innerWidth` exactly).

### 3. Fixed/portaled elements

- Anything `position: fixed` mounts via `createPortal` to `document.body` (never inside
  `contain: layout` containers).
- Respects `--nq-tabbar-reserve` (declared on `:root`) so it never covers the mobile tab bar.
- Respects the z-index ladder (top of `shell.css`): tab bar 50 → dialogs 80–101 →
  workbench overlays 120–121 → toasts 95 + reserve.

### 4. Interaction invariants

- Touch targets ≥ 44×44px (`--u-touch`).
- Sidebar drawer: backdrop click + Escape + route change all close it; scroll locks while open.
- Desktop collapse persists via localStorage; tablet expansion is overlay (main not pushed).

### 5. Motion & accessibility

- Every animation under `@media (prefers-reduced-motion: no-preference)`.
- Interactive elements keyboard-reachable with visible focus.
- Screen-reader text where visual content is abbreviated (e.g. session IDs are `sr-only`).

### 6. Bilingual completeness (hard rule)

- Any new user-visible string ships **Arabic + English together** — i18n keys in
  `packages/i18n` or localized copy objects. Run the page in both `/ar` and `/en` before
  delivering; key leaks (raw keys rendered) and mixed-direction text are defects.

### 7. UX states (for data surfaces)

- Every data surface has loading (skeletons, RTL-aware shimmer), empty (with CTA), and error
  (retry contract) states — see `states.css` / `states.tsx`; scenario previews via
  `?state=loading|empty|error`.

## Verification quick-pass

```text
For each change: view /ar at 375 + 1440, view /en at 768.
Confirm: no overflow · no overlap · both locales complete · motion off-safe · targets ≥44px.
```

For full delivery, run the sweep gates (`layout-regression-defense` skill) — this skill is the
authoring-time contract, that skill is the delivery-time proof.
