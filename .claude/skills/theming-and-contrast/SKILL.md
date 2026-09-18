---
name: theming-and-contrast
description: Design and maintain the dual-theme (light/dark) system for Minsaj — token architecture in foundations.css, next-themes integration, and WCAG AA contrast discipline. Use when adding or changing ANY color, surface, border, or shadow; when building new components that must work in both themes; when a contrast or readability issue is reported; and when touching theme-provider, theme-toggle, or prefers-color-scheme behavior.
---

# Theming & Contrast

## The system in one paragraph

The site is dual-theme. `next-themes` (wrapped in `src/components/theme/theme-provider.tsx`)
writes `data-theme="light" | "dark"` on `<html>` (system-follow by default, 3-state toggle
`ThemeToggle` in app topbar + marketing nav). All visuals flow from CSS custom properties in
`src/app/styles/universal/foundations.css`: the light values live in `:root`, the dark values in
`:root[data-theme="dark"]`, and the legacy bridge tokens (`--bg`, `--surface`, `--teal`, …) are
re-defined inside both blocks so old components theme themselves. **Never hardcode a hex/rgba
light-mode color again** — an un-tokenized color is the #1 source of "white box in dark mode"
bugs (found by VLM review in Phase 10: demo-card, composer, panels).

## Token contract (semantic, not decorative)

| Token | Role | Light | Dark |
|---|---|---|---|
| `--u-bg` / `--u-bg-deep` | page background | #f5f6fb | #0c0e1d / #090b17 (never pure black — MD3) |
| `--u-surface` / `-solid` | cards, panels | #ffffff | #151830 / #171a33 |
| `--u-ink` / `-soft` / `--u-muted` / `--u-faint` | text ramp | ink→faint | off-white ramp (never pure white — Apple HIG) |
| `--u-line` / `--u-line-strong` | decorative borders | subtle | #3a3f6e / #5d6298 |
| `--u-control-line` | **interactive control borders** (inputs, selects, composers) | #8b90b5 (≥3:1) | #5d6298 (≥3:1) |
| `--u-glass` / `-strong` / `--u-glass-line` | translucent panels over content | white glass | dark glass |
| `--u-veil` / `--u-raise` | ghost-button fill / raised pill on inset surface | white | dark / white-10% |
| `--u-hover-veil` | neutral hover tint | ink-5% | white-7% |
| `--u-field` | input/composer background | #ffffff | #10132a (inset) |
| `--u-tint-1` | soft section band | #f6f6ff | #12152c |
| `--u-artboard` | artwork/scene frame | #f4f7fb | #101325 |
| `--u-primary` (+strong/deep/soft/glow) | brand violet | #5548e0 family | #8d80f8 family (brightened for AA) |
| `[data-service] --service*` | 7 service hues | saturated pastels | brightened + translucent softs (dark block in foundations.css) |

Rules:
1. **Text colors must pass 4.5:1** on `--u-bg` AND `--u-surface`; icon/accent colors 3:1
   (WCAG 1.4.11). `scripts/check-theme-contrast.mjs` enforces this in CI — run it after any
   token change (`node scripts/check-theme-contrast.mjs`).
2. Buttons with white labels: lightest gradient stop must hold ≥ 4.5:1 against white
   (the guard parses `.luma-button--primary` and `.button--primary` stops).
3. Intentionally-dark chrome (sidebar shell, preview rail) uses fixed literals, NOT ink tokens —
   otherwise it flips light in dark mode (Phase 10 bug: `.profile-photo`, `.preview-rail`).
4. `prefers-contrast: more` solidifies translucency (motion.css R2 block) — keep that block
   updated when adding new translucent tokens.

## Adding a color — the checklist

1. Name it by ROLE (`--u-warning-soft`), not by hue (`--u-orange`).
2. Add the light value in the FIRST `:root` block, the dark value in
   `:root[data-theme="dark"]` (or a `:root[data-theme="dark"] .component` override for
   one-off gradients/covers — see marketing.css / home.css for the pattern).
3. Composite-check contrast in BOTH themes (write a pair into the guard's `pairs` list if
   the color ever carries text).
4. Re-run `node scripts/check-theme-contrast.mjs` — it must stay green.
5. Visual check in BOTH themes: `agent-browser storage local set theme dark` → reload →
   screenshot; VLM review for "white box / light-mode leftover".

## Verification (minimum, per delivery)

- `node scripts/check-theme-contrast.mjs` — green in CI.
- `bash scripts/verify-sweep-v10.sh` — 30 routes × 3 viewports × BOTH themes (asserts
  `data-theme` actually applied + zero overflow + sidebar modes).
- Toggle interaction: light → dark → system cycle, persists across reload, follows
  `prefers-color-scheme` when set to system (agent-browser `set media dark` emulation).
- Zero hydration warnings (the toggle uses `useSyncExternalStore` mount detection —
  never reintroduce `useEffect(() => setMounted(true))`, ESLint `set-state-in-effect`
  blocks it).

## Gotchas learned the hard way

- **FOUC**: next-themes injects the pre-hydration script automatically; the root layout
  already carries `suppressHydrationWarning` on `<html>`. Don't move the provider out of
  the root layout.
- **`backgroundColor` vs gradients**: VLM flags "white box" — verify with
  `backgroundImage` too; gradients report `none` for backgroundColor.
- **rgba without spaces** (`rgba(255,255,255,.72)`) evaded the Phase-10 tokenizer regex —
  when grepping for leftovers, search BOTH spacing styles.
- **White knobs/switches** (`switch-visual span`) are intentional (iOS pattern) — don't
  tokenize them away.
- Dark `--u-primary-soft` must stay ≤ 0.12 alpha: text-on-tint drops below 4.5:1 at 0.16.
