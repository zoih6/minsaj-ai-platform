# Nasaq AI — Design Engineering Governance

| | |
|---|---|
| **Status** | Active — binding on every visual, layout, and styling change |
| **Audience** | Every AI agent and human contributor. Read BEFORE adding or changing any component, page, CSS rule, token, or icon. |
| **Relationship** | `AGENTS.md` = process entry point · `ARCHITECTURE-RULES.md` (root) = code boundaries · **this file = the visual system's law**. `docs/03-DESIGN-SYSTEM.md` describes the visual language; this file enforces it. |
| **Mission** | **Do not fix the screen. Fix the system that produced the problem.** |

---

## 0. The operating principle (read this twice)

Nasaq's visual history proves one thing: every "small fix" applied at the page level became a patch on a patch (v3: ~200 lines of per-element viewport patches; v10: ~100 un-tokenized colors; v11: dead mobile rules trapped in container queries). The result of patch-thinking is exactly what the owner rejected: **"random, annoying, catastrophic work."**

Therefore: Nasaq is treated as an ongoing **engineering and design rehabilitation program**, not a queue of unrelated bugs. When a defect appears anywhere, the response is a system response:

```
one symptom → find the class of defect → fix the shared primitive →
propagate to every affected surface → prove it can't come back
```

If a fix touches only one file and one screen, it is almost certainly wrong.

---

## 1. Design Philosophy

1. **System over screens.** Every element is an instance of a system (tokens, primitives, component classes). A screen is a composition of system parts — never a pile of one-off styles.
2. **Composition over decoration.** Hierarchy comes from spacing, typography, scale, contrast, and grouping — not from extra borders, glows, or ornamental containers.
3. **One visual language.** "Luminous Premium": violet primary (`--u-primary`), ink text, jewel-tone service accents, obsidian shell. Nothing outside this language ships.
4. **Arabic-first, RTL-native.** The design is authored RTL and mirrored to LTR — never the reverse. Logical properties are the only acceptable direction vocabulary.
5. **Intentional whitespace.** Empty space is a design decision (it groups, separates, and leads the eye), not leftover space to fill with a card.
6. **No generic SaaS.** Dashboard-card-grid layouts, me-too marketing gradients, and decorative hero blobs are rejects by default. Asymmetry is welcome only when it improves hierarchy.
7. **Honesty is visual too.** Truth badges (`Demo`/`Simulated`/`Not executed`), skeletons, and receipts are first-class visual elements — the interface never draws confidence it did not earn.

## 2. Visual Quality Bar

A surface is "done" when all of these hold — anything less is unfinished, regardless of how it feels:

| # | Criterion | How it's proven |
|---|---|---|
| 1 | **Zero horizontal overflow** at every width | `scrollWidth === innerWidth` in the sweep |
| 2 | **Both themes hold** (light + dark, WCAG AA) | contrast guard + sweep in both themes |
| 3 | **Clear primary action** per view — one visually dominant CTA | visual QA |
| 4 | **Consistent rhythm** — spacing from the scale (§4), nothing "vibed" | token audit |
| 5 | **Consistent geometry** — radius/shadow from tokens only | token audit |
| 6 | **Icons on the sanctioned scale** (§6) | icon audit |
| 7 | **RTL + LTR both correct** (mirrored geometry, no text overflow) | sweep both directions |
| 8 | **Touch targets ≥ 44×44** | sweep invariant |
| 9 | **Nothing below 10px**; captions ≥ 11.5px | type audit |
| 10 | **VLM review ≥ 9/10**, no overlap flags | visual QA protocol (§13) |

**The bar in one line:** the surface must look like it belongs to a shipped product, not a demo — the owner's words: interfaces that "work" are not the goal; interfaces that look like a real product are.

## 3. Layout & Container Rules

### 3.1 Page anatomy (every app page follows this shape)

```
page-root (declares container context)
└── content frame (max-width: --u-content-max; gutter: --u-page-gutter)
    ├── page header (nq-page-header: title + actions)
    ├── primary content (nq-split / nq-grid / nq-data-list …)
    │   ├── section
    │   │   └── …
    │   └── section
    └── secondary content (aside, meta, related)
```

- One content frame per page. **No nested containers "for looks"** — every wrapper must earn its place by a layout role (grouping, scrolling, splitting) stated in its class name.
- Fixed page-level widths are forbidden; widths flow from the frame and the primitives.

### 3.2 The layout vocabulary is `nq-*` (layout.css) — use it or extend it, never bypass it

| Primitive | Role |
|---|---|
| `nq-flow` | vertical flow between siblings |
| `nq-page-header` | title/description/actions row (auto-stacks actions ≤640) |
| `nq-grid` + `--tight/--roomy/--stats` | auto-fill/minmax card grids (self-reflow) |
| `nq-stack` (+`--tight`) | vertical stack |
| `nq-cluster` (+`--between/--end/--stretch`) | inline row with wrap |
| `nq-split` (+`--aside-start`) | two-column with readable aside |
| `nq-data-list` | responsive records: table on wide, cards on narrow |
| `nq-scroll-x` | contained horizontal scroll |

**A new layout need means a new/extended primitive — not a bespoke grid on one page.** If two pages need the same novel arrangement, it becomes a primitive the day the second one appears.

### 3.3 Container contexts (the page-root contract)

Every page root declares one: `ops-page` · `service-space` · `builder-page` · `flow-editor-page` · `universal-library-page` · `adaptive-home`. In-flow components reflow via the four container bands (**1040 / 880 / 640 / 430**) keyed to *available* width. `scripts/check-layout-guards.mjs` fails CI if a page lacks its context — a page without a context is a page that will break on phones (v8, proven).

### 3.4 Forbidden in layout

- nested wrappers with no layout role · fixed widths on content (`width: 347px`) · `position: absolute` as a responsiveness mechanism · negative margins as alignment patches · magic numbers (any spacing/size value not from the scales in §4–§6) · per-page spacing systems · `height: 100vh` (use `100dvh` with fallback)

## 4. Spacing System

**Spacing is a closed scale. If the value you need is not here, the design is wrong — not the scale.**

| Token | Value (fluid) | Use |
|---|---|---|
| `--nq-gap-xs` | clamp(6px → 10px) | inside clusters, icon-to-label, chip gaps |
| `--nq-gap-sm` | clamp(10px → 16px) | between related items, grid gaps |
| `--nq-gap-md` | clamp(14px → 24px) | between sibling blocks, stack default |
| `--nq-gap-lg` | clamp(20px → 36px) | between sections of one surface |
| `--nq-pad-card` | clamp(14px → 24px) | card/panel padding |
| `--u-page-gutter` | clamp(14px → 32px) | page-frame inset |
| `--u-section-space` | clamp(56px → 112px) | marketing section rhythm |

**Rules**

1. `gap` in the layout primitive, never margins between siblings. Margins are for exceptions — and an exception repeated twice is a missing token.
2. Never write a raw spacing literal (`padding: 13px`, `margin: 17px`). If a genuinely new spacing need exists → add/extend the token in `layout.css`/`foundations.css` once, use it everywhere, and update Appendix A of this file.
3. Whitespace rhythm: content spacing ≥ 2× inner spacing (things inside a group sit closer than groups sit to each other). This single rule kills most "elements scattered randomly" reports.
4. When a surface's spacing is questioned, the audit question is *"which token is each gap?"* — every gap must answer.

## 5. Typography System

Two scales, both fluid (clamp), both tokenized — **no raw font-size values in any layer**:

**Content scale (`layout.css`)** — `--nq-text-hero` (32→58) · `h1` (26→40) · `h2` (20→27) · `h3` (16→19) · `body` (13.5→15) · `small` (12→13) · `caption` (11.5)

**UI scale (`foundations.css`)** — `--u-text-xs` (11.5→12.5) · `sm` (13→14) · `md` (15→16) · `lg` (17→19) · `xl` (21→24)

**Rules**

1. Weights are 400/500/600/700 (IBM Plex via `@fontsource`, `font-display: swap`). No other weights, no synthetic bold on Arabic.
2. **Nothing below 10px — ever. Captions ≥ 11.5px.** (A previous phase had to bump the entire codebase to enforce this; do not regress it.)
3. Hierarchy is job of the scale: one `h1`-class element per view; sections step down in order. Skipping steps (body → h1) is a hierarchy bug.
4. Line-length for reading: `--nq-measure-read` (72ch) / `--u-reading-max` (780px). Long-form Arabic never runs edge-to-edge of the content frame.
5. Line-height: 1.5+ for body Arabic; tighter only for display sizes. Arabic diacritics clip below 1.4 — that's a defect, not a style.

## 6. Iconography Rules

**Measured debt (2026-09-17): 12 distinct Lucide sizes in the codebase (11–22px)** — the exact cause of the owner's "icon up, icon down" complaint. This section closes that debt.

1. **Lucide React is the only icon set.** No mixed icon fonts, no hand-rolled SVGs where a Lucide icon exists (custom brand/service glyphs are the exception, as SVG components in the owning feature).
2. **Sanctioned icon scale (closed):**

| Size | Use |
|---|---|
| 12 | dense data rows, inline status |
| 14 | inline with body text, list bullets (current most-common) |
| 16 | default standalone icon (buttons, tabs) |
| 18 | emphasis (active tab, primary button) |
| 20 | section headers, empty-state companions |
| 24 | empty-state art, feature illustrations |

3. Any `size={N}` outside the scale is a reject. When touching a surface that uses off-scale sizes, **normalize it in the same PR** (rehabilitation rule, §12).
4. Icons + labels: interactive icon-only elements need an accessible name (`aria-label`) and a 44px hit area; never a bare icon with no name.
5. Icon color inherits text color. Icons never get their own hardcoded colors.

## 7. Component Architecture

1. **Shared primitive first.** Before creating any component, check `src/components/universal`, `states.tsx`, and the `nq-*` set. If a shared part *can* be fixed to serve the new need, fixing it is the work — a new sibling component is debt.
2. **Class naming is layer-bound**: `nq-*` = layout primitives · `u-*` = component classes per layer (`u2-*` workbench, etc.). A new prefix needs a reason written down.
3. **A card is a container with a job** (elevation + grouping of ONE coherent record). Never add a card to "visually collect" things — that's grouping, which is `nq-stack` + spacing, or a section header. The default answer to "this looks empty/unorganized" is spacing and hierarchy, not more chrome.
4. Components own their states: loading (skeleton), empty (CTA), error (5-part contract), success. A component without its four states is a prototype and is flagged as such (scenario flags `?state=`).
5. Composition over configuration: variant props ≤ 4; past that, split the component.
6. Portal discipline (AGENTS.md rule 5): everything portaled to `document.body` is styled via `@media`, and the unified bottom-sheet phone pattern applies (§8). The z-index ladder in `shell.css` is the only source of stacking truth — inventing a new z value outside it is a defect (past failures: tab bar painting over dialogs).

## 8. Responsive Rules

**Re-compose for the available space; never shrink until it fits.**

1. In-flow content: container queries via the page-root context and the four bands (1040/880/640/430). Per-element viewport media queries for in-flow content are forbidden (AGENTS.md rule 4).
2. Portaled content: viewport `@media` only (AGENTS.md rule 5, CI-enforced). Phone dialogs are **bottom sheets**: full width, top-only radius, safe-area padding, sticky actions, contained scroll.
3. Shell adapts by breakpoint (768/1024/1440, source `src/lib/viewports.ts`): `<768` drawer + bottom tab bar · 768–1023 rail (expand = overlay) · ≥1024 expanded. Pages never fight the shell.
4. Dense data (`nq-data-list`): wide = columns, narrow = stacked cards with `data-label`s. Tables never overflow horizontally; they re-compose.
5. Element adaptation ladder: reflow (grid/flex) → re-group (cluster/stack) → re-prioritize (hide secondary at narrow bands — `data-*` attributes, never `display:none` sprinkled) → re-platform (drawer/bottom sheet for portaled). Resize is the LAST resort, not the first.
6. **A responsive fix that repairs one viewport and breaks another is a failed fix.** Verification is the sweep: 30 routes × 3 viewports (375/768/1440) × 2 themes — plus a phone-size check at 390 for anything portaled.
7. Fixed portaled elements (toasts, stop button) respect `--nq-tabbar-reserve` (on `:root`, so portals can reach it) — never park interactive elements on top of the tab bar (v5 lesson).

## 9. Accessibility

1. Contrast: WCAG AA minimum for every text/surface pair, in BOTH themes — `scripts/check-theme-contrast.mjs` in CI; new tokens that carry text extend its pair list the same day.
2. Touch targets ≥ 44×44 (`--u-touch`) — the sweep asserts it.
3. Focus is always visible (focus-ring tokens); never `outline: none` without a replacement ring.
4. Motion is opt-in: every animation lives under `prefers-reduced-motion: no-preference` (CI-checkable by review).
5. Screen-reader text for icon-only controls; raw IDs stay SR-only.
6. RTL/LTR: logical properties only (`inline-start/end`, `padding-inline`…) — zero physical `left`/`right` in CSS.
7. Dialogs: focus trap + Escape + labeled by their title (Radix gives this — do not bypass the primitives).
8. Language: Arabic AND English ship together (AGENTS.md rule 7) — an untranslated key in either locale is a release blocker.

## 10. Motion & Interaction

| Token | Value | Use |
|---|---|---|
| `--u-motion-duration-instant` | 80ms | color/opacity micro-feedback |
| `--u-motion-duration-fast` | 130ms | hovers, focus rings |
| `--u-motion-duration-moderate` | 200ms | small panels, tooltips, default |
| `--u-motion-duration-slow` | 300ms | drawers, dialogs |
| `--u-motion-duration-expressive` | 480ms | page-level entrances |
| easings | standard/enter/exit/emphasized/spring | enter ≠ exit; spring for playful only |
| `--u-motion-delay-stagger` | 50ms | list/grid entrance stagger |

1. Easing/duration literals (`transition: all .3s ease`) are forbidden — cite tokens. `all` is forbidden; transition the properties you mean.
2. Motion communicates state change, nothing else. Ambient loops (breathing glow, shimmer) are marketing-only and never distract from interactive surfaces.
3. Scroll-reveal (`ScrollFx`) mounts inside page-root components — never in layouts (hydration race, v6 lesson).
4. Every entrance has an exit plan: elements leave the way they came, faster (exit easing).
5. Reduced motion removes movement, not information — state changes still show instantly.

## 11. Anti-Pattern Catalog

Every entry is a real defect class with its fix. **Meeting one of these in code you are touching = fix it in the same PR (rehabilitation, §12); introducing a new one = reject.**

| # | Anti-pattern | Example (real or representative) | The fix |
|---|---|---|---|
| 1 | **Magic spacing** | `padding: 13px; margin: 17px; width: 347px` | token from §4 scale |
| 2 | **Off-scale radius** | `border-radius: 11px` | `--u-radius-{xs:8, sm:12, (base):16, lg:22, xl:30}` |
| 3 | **Icon size drift** | 12 distinct sizes 11–22px (measured) | §6 sanctioned scale |
| 4 | **Un-tokenized color** | any literal hex in a component layer | semantic token in `foundations.css`, light+dark blocks in sync |
| 5 | **Per-element viewport patches** | `@media (max-width: 843px) { .my-card { … } }` | container band on the page context, or primitive |
| 6 | **Container query on portaled content** | `.dialog { … }` inside `@container` (v11 bug) | viewport `@media` + bottom sheet pattern — CI-blocked |
| 7 | **Card soup** | wrapping everything in cards to "organize" | spacing + grouping (`nq-stack`, section headers) |
| 8 | **Generic SaaS grid** | dashboard-card-grid as default layout | content-driven hierarchy; asymmetry when it helps |
| 9 | **Decorative noise** | gradient blobs/borders with no semantic role | remove; let whitespace and typography do the work |
| 10 | **Z-index invention** | `z-index: 999` | the ladder at the top of `shell.css` |
| 11 | **Negative-margin alignment** | pulling a card over a grid gap to "line it up" | fix the grid / split definition |
| 12 | **Absolute-position responsiveness** | `position: absolute` to force-fit on phones | re-compose (§8 ladder) |
| 13 | **Fixed heights/widths on content** | `height: 340px` on text containers | min-height + intrinsic flow |
| 14 | **Transition soup** | `transition: all .3s ease` | named properties + motion tokens |
| 15 | **One-locale strings** | Arabic-only hardcoded copy | i18n keys, AR+EN together |
| 16 | **Physical direction properties** | `left`/`right` in CSS | logical properties (RTL-native) |
| 17 | **Second design system** | re-introducing an old green-era token or a new "temp" palette | `foundations.css` is the only palette; legacy bridge stays bridged |
| 18 | **Patch on a patch** | third consecutive override on the same selector | stop; refactor the shared primitive (§0) |

## 12. Refactoring Rules (design debt paydown)

1. **Touch a surface, audit its siblings.** Any file you edit gets a 60-second scan against §11 — off-scale icons/spacing/colors you saw get normalized in the same PR. This is how measured debt (icon sizes, literal spacings) actually dies.
2. **Fix the primitive, propagate the fix.** When a defect exists in ≥2 places, the fix lands in the shared layer and the surfaces get updated to consume it — never fixed per-surface (that produces the v3 patch-mountain again).
3. **The third patch rule.** If you are about to write the third override/patch against the same selector or component — stop. The primitive is wrong. Refactor it (this rule would have caught the v11 premium-layer radius conflict before it shipped).
4. **Delete on departure.** CSS that no longer matches any markup is removed in the same PR — dead rules are how anti-pattern #17 hides.
5. **Keep the import chain sacred.** The 11-layer order in `universal.css` is architecture, not preference: `foundations → layout → states → marketing → shell → home → workspaces → library → responsive → motion → workbench`. New CSS joins the owning layer; no new entrypoints; the consolidated phone-dialog layer stays LAST in `globals.css` with `[role="dialog"]` specificity (v11 lesson).
6. **Token changes are system changes.** Adding/altering a token = update both theme blocks + the contrast pair list + Appendix A of this file + `docs/03`.
7. **Never refactor silently.** Visual refactors ship with before/after screenshots at 375/768/1440 in both themes (the sweep produces them).

## 13. Visual QA Protocol

**No visual change is "done" until this protocol passes — in order:**

1. **Guard scripts** (fast, no browser): `check-layout-guards` → `check-theme-contrast` → `check-portal-container-isolation`.
2. **Type + lint + build**: `bun run lint` · `npx tsc --noEmit` · `bun run build` (dev tolerates what production rejects — v7 lesson).
3. **The sweep** (`scripts/verify-sweep-v11.sh`, or newest): 30 routes × 375/768/1440 × 2 themes = 182 checks, asserting zero overflow, correct sidebar mode, `data-theme` applied, and the dialog-geometry sentinels (a real dialog opened at phone size must render as a bottom sheet: full width, 0 inset, top-only radius, no horizontal overflow).
4. **Interaction QA**: drawer/rail/expanded cycle, dialog open/close (Escape + backdrop), command palette, toasts clear of the tab bar — `verify-editor-interactions.sh` where relevant.
5. **VLM visual review** on screenshots of the changed surfaces: ≥ 9/10, checklist = §2 bar (hierarchy, rhythm, icon scale, no overlaps, RTL correctness). Fail → back to step 1 with the finding.
6. **Artifact verification**: for deliveries, verify inside the built artifact (compiled CSS contains the new rules), not just the dev server (v3/v4 lesson).
7. **New route?** It enters the sweep matrix the same day — an unswept route is an undelivered route (v8 lesson, shipped broken editors once).

## 14. Regression Prevention

| Guard | Prevents | Status |
|---|---|---|
| `check-layout-guards.mjs` | pages without container contexts (desktop-squeezed-onto-phones, v8) | ✅ CI |
| `check-portal-container-isolation.py` | portaled elements styled inside `@container` (dead mobile rules, v11) | ✅ CI |
| `check-theme-contrast.mjs` | AA contrast failures in either theme (v10) | ✅ CI |
| sweep + dialog sentinels | overflow, shell modes, sheet geometry regressions | ✅ pre-push |
| this document's checklists | every anti-pattern without an automatable guard | ⚠️ review-time |
| `STATE.md` + `docs/CHANGELOG.md` | knowledge decay between agents | ✅ protocol |

**Standing orders that keep the guards honest:**

- New route → sweep matrix entry same day. New token carrying text → contrast pair same day. New portaled class → it lives in `@media` from birth.
- A guard that passes vacuously (selector matches nothing) is a broken guard — prove sentinels match real elements before trusting a run (AGENTS.md gotcha 3).
- Every Phase appends its lesson to `docs/CHANGELOG.md` — future agents inherit the scar tissue.

## 15. Agent Workflow (mandatory sequence for any visual/layout task)

```
   AUDIT
     ↓
   IDENTIFY ROOT CAUSES          (measure, don't guess)
     ↓
   DEFINE DESIGN SYSTEM RULE     (which token/primitive/law was missing?)
     ↓
   FIX SHARED PRIMITIVE          (the system layer, not the screen)
     ↓
   PROPAGATE TO FEATURES         (every affected surface, same PR)
     ↓
   RESPONSIVE QA                 (§13 steps 1–4: both themes, all bands)
     ↓
   VISUAL QA                     (§13 steps 5–6: VLM bar + artifact check)
     ↓
   REGRESSION CHECK             (add/strengthen the guard that would have caught it)
```

**What each step demands:**

1. **AUDIT** — survey the *class* of the problem across all surfaces before touching anything (v11: one dialog complaint → audited 16 portal files → 4 broken families). If the audit finds one instance only, prove it.
2. **IDENTIFY ROOT CAUSES** — reproduce with evidence (DOM geometry, screenshots, computed styles). "It looks off" is not a root cause. Cite the failing rule/token/primitive.
3. **DEFINE THE RULE** — state what system rule was missing or broken (e.g. "portaled elements need viewport media"). If no rule exists, this step writes it — here or in AGENTS.md.
4. **FIX THE SHARED PRIMITIVE** — the fix lands at the deepest layer that can hold it (token → primitive → component class → page). A page-level fix for a primitive-level problem is a reject.
5. **PROPAGATE** — apply the fix everywhere the audit found the pattern. No "just this screen for now."
6. **RESPONSIVE QA** — §13 protocol, both themes, phone/tablet/desktop, portaled elements opened for real.
7. **VISUAL QA** — VLM review against the §2 bar + verify inside the artifact.
8. **REGRESSION CHECK** — strengthen or add the automated guard (the v11 isolation gate is the model: the bug class is now unshippable). Update `STATE.md`, `CHANGELOG`, and — if a rule was born — this file.

**The forbidden workflow** (explicitly banned): *see problem → edit CSS on that screen → move to next problem.* This is the exact behavior that produced patch-mountains and the owner's "random and catastrophic" verdict. An agent that works this way is working against this document.

## 16. Definition of Done (visual/layout)

A visual change is done when ALL hold — the delivery gate in `AGENTS.md` §B plus:

- [ ] Layout expressed in `nq-*` primitives or a justified extension of them
- [ ] Every spacing value answers to a §4 token; every radius to `--u-radius-*`; every color to a semantic token (light+dark in sync)
- [ ] Every icon on the §6 scale; type on the §5 scales; motion on the §10 tokens, reduced-motion safe
- [ ] In-flow reflow via container bands; portaled elements via `@media` + sheet pattern; zero new z values
- [ ] Sweep green (182 checks) + interaction QA + VLM ≥ 9/10 + artifact-verified
- [ ] RTL + LTR verified; AR + EN strings shipped together; AA contrast in both themes
- [ ] Anti-pattern scan of every touched file: nothing from §11 introduced, encountered debt normalized
- [ ] If a rule changed/was born: this file + `AGENTS.md` + `STATE.md` + `CHANGELOG.md` updated in the same push

---

## Appendix A — Token quick reference (single lookup, keep in sync with `foundations.css` + `layout.css`)

| Family | Tokens |
|---|---|
| **Radius** | `--u-radius-xs` 8 · `sm` 12 · `(base)` 16 · `lg` 22 · `xl` 30 |
| **Spacing/gaps** | `--nq-gap-xs/sm/md/lg` · `--nq-pad-card` · `--u-page-gutter` · `--u-section-space` |
| **Measures** | `--u-content-max` 1520 · `--u-reading-max` 780 · `--nq-measure-read` 72ch |
| **Type (UI)** | `--u-text-xs/sm/md/lg/xl` |
| **Type (content)** | `--nq-text-hero/h1/h2/h3/body/small/caption` |
| **Icon scale** | 12 · 14 · 16 · 18 · 20 · 24 (§6) |
| **Motion** | duration instant 80 / fast 130 / moderate 200 / slow 300 / expressive 480 · stagger 50ms · easings standard/enter/exit/emphasized/spring |
| **Elevation** | `--u-shadow-xs/sm/md/lg/xl` |
| **Touch** | `--u-touch` 44 |
| **Bands (container)** | 1040 / 880 / 640 / 430 |
| **Breakpoints (viewport)** | 768 / 1024 / 1440 |
| **Color** | semantic `--u-*` only (primary family, ink, muted, line, danger) + jewel accents (cyan/mint/pink/amber) + shell family + **inverse emphasis** (`--u-inverse-surface`/`-hover` for pills carrying `--u-on-inverse` text — background role ONLY, never map to `--u-ink`, which flips light in dark mode) — see `foundations.css`; never literals |

## Appendix B — The explicit orders (verbatim intent from the owner, binding)

1. **Do not create a new component** if a shared primitive can be fixed instead.
2. **Do not add page-specific CSS** to solve a problem born in a shared primitive.
3. **Do not use a spacing value** before checking it against the token scales.
4. **Do not call `desktop` done** before `mobile` and `tablet` are tested.
5. **Do not call a responsive fix successful** if it fixed one viewport and broke another.
6. **Do not add a card/container** merely to visually group elements — grouping is spacing + headers.
7. **When you detect a repeated visual or layout pattern, fix the shared system** — never duplicate the fix per surface.
8. **Treat every defect as a rehabilitation opportunity** — the project is a continuing engineering & design rehabilitation, not a bug queue.

