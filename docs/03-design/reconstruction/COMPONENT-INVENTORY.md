# COMPONENT-INVENTORY.md — Current Components, Duplicates, and Target Primitives
## W-DS · Design-System Reconstruction · What exists, what repeats, what replaces it

> **Purpose.** A complete census of the UI vocabulary as implemented today, the duplication map across dialects, and the consolidated primitive set every route must build from after W-DS. This is the migration contract referenced by `DESIGN-PRINCIPLES.md` P3 and `IMP-01`.

---

## 1. Method

Census sources: selector/class analysis of the 14 `src/app/styles/universal/*` layers (568 unique classes) + `src/app/globals.css` (480 classes / 1220 selectors) + `@theme` marketing utilities + component source greps. Live usage verified against the 100-capture measurement set (`evidence/`). Counts are CSS-declared classes confirmed rendering on audited routes.

## 2. The seven dialects (the core problem)

| # | Dialect | Where it lives | Scale (classes / selectors) | Renders on |
|---|---|---|---|---|
| D1 | `universal-shell-*`, `universal-*` | `shell.css`, `motion.css` | 34 / 173 | App chrome: sidebar, topbar, dock, notifications, command palette |
| D2 | `mj-*` primitives (v20 "owner order") | `layout.css` (+ `states.css`) | 39 / 47 | Sections, surfaces, grids, chips, data lists — **partial coverage** |
| D3 | `u2-*` workbench | `workbench.css` + `interaction.css` | 262 / 629 | The 6 domain workspaces (learn/research/create/code/analyze/explore) |
| D4 | `service-*` gateway | `workspaces.css` | 76 / 175 | The shared gateway (اسأل `/app/chat`) |
| D5 | `adaptive-*` home | `home.css` + `radiance.css` | 43+ / 104 | «لك» home |
| D6 | `ops-* / settings-* / library-* / form-* / preview-* / flow-* / run-* / test-* …` | `globals.css` | 480 / 1220 | All ops + admin + settings + library + detail routes |
| D7 | `ms-*` + Tailwind utilities | `marketing.css` + `@theme` | 17 + utility classes | Marketing landing |

**Findings.** `IMP-01` (P0): seven vocabularies for one product. `IMP-03` (P1): D6 lives outside the declared layer architecture in an unlayered `globals.css`. D3 is the single largest dialect (262 classes) — the workbench interior never adopted the D2 primitives that postdate it.

## 3. Element-type inventory (as required by the audit contract)

| Element type | Implementations found (file paths) | Dialects | Count of distinct visual treatments |
|---|---|---|---|
| **Header (app)** | `src/components/app-shell/app-shell.tsx` → `shell.css` `.universal-shell-topbar` | D1 | 2 architectures (standard 2-row / focus 1-row) — `NAV-01` |
| **Header (marketing)** | `src/components/marketing/site-header.tsx` (`.ms-header` + Tailwind) | D7 | 1 |
| **Sidebar / Drawer** | `app-shell.tsx` → `shell.css` (drawer/rail/expanded modes) | D1 | 1 (3 modes) |
| **Bottom navigation** | `app-shell.tsx` → `shell.css` `.universal-shell-mobile-nav` | D1 | 2 dialects (bar vs floating dock) — `NAV-04` |
| **Search (global)** | command palette `Dialog` in `app-shell.tsx` (`.universal-command*`) | D1 | 1 |
| **Search (contextual)** | `shared.tsx` `.library-search`/`.library-toolbar`; workbench quick-search events | D6/D3 | 2+ — `NAV-06` |
| **Buttons** | `.button--{primary,outline,quiet,secondary,danger,compact,default,prominent}` (globals.css) · `.mj-chip` · `.service-start-button` · u2 action buttons · `.ms-menu-cta` + Tailwind CTAs | D6/D2/D4/D3/D7 | **5 systems** |
| **Icon buttons** | `.icon-button` (globals), `.universal-theme-toggle`, topbar action buttons, `.universal-shell-close` | D6/D1 | 3 treatments |
| **Inputs** | `.field` (globals), composer `.workspace-composer` (workspaces.css), u2 inputs, `.secret-input`, `.source-dialog` fields | D6/D4/D3 | 4 treatments |
| **Cards / surfaces** | `.mj-surface{,--flat,--raised}` · `.adaptive-service-tile` · `.adaptive-recent-card` · `.service-tool`, `.service-starters` cards · `u2-*__surface` · `.ops-stats`, `.ops-card`, `.settings-section`, `.provider-safety-card`, `.provider-logo` | D2/D5/D4/D3/D6 | **6+ card species** — `SUR-01` |
| **Tabs** | `.source-type-tabs`, catalog tabs (models/skills/tools), output tabs, `.universal-shell-nav__*` | D6 | 3 treatments |
| **Segmented controls** | mode switch `.service-mode-switch`, guided/quick cards (role=group) | D4 | 1 |
| **Badges / pills** | `Badge` (`@minsaj/ui`, tones) · `.afford-pill` · status `Badge` with B1 triads · `.universal-shell-context > small` · u2 pills | D2/D4/D1/D3 | 4 species (tones consistent, shapes vary) |
| **Status indicators** | `CollectionStatus`/`SourceStatus` (knowledge), run states, `--u-*-ink` triads | D6 | 1 semantic system (good) |
| **Empty states** | `LibraryEmpty` (shared.tsx), `states.css` `.u-empty`, workbench "no output yet" | D6/D2/D3 | 3 treatments |
| **Loading states** | `states.css` `.u-skeleton--{text,title,line,avatar,…}` (direction-aware) | D2 | 1 (good; under-used — `UNC-01`) |
| **Error states** | `states.css` `.u-error*`, gateway `error` machine state | D2/D4 | 2 |
| **Modals / dialogs** | Radix `Dialog` + `.form-dialog`, `.mj-dialog-sheet/wide`, command palette, `.source-dialog` | D6/D2/D1 | 3 geometries |
| **Toasts** | `DemoToast` (globals), feedback toasts (motion.css `.mj-feedback`) | D6/D2 | 2 |
| **Data lists** | `.mj-data-list` (+ responsive label collapse), ops tables | D2/D6 | 2 — target: 1 |

## 4. Duplication map (same job, several implementations)

| Job | Variants in production | Consolidates to |
|---|---|---|
| Primary action | `.button--primary` · `.service-start-button` · u2 run buttons · Tailwind `bg-brand-dark` CTA · `.ms-menu-cta` | **`Button variant="primary"`** on the height ladder (`§6.2 DESIGN-TOKENS.md`) |
| Secondary action | `.button--outline` / `.button--quiet` / `.button--secondary` / ghost buttons | **`Button variant="outline" | "quiet"`** |
| Selectable card | `.adaptive-service-tile` · `.service-tool` · mode cards · u2 option cards | **`SelectableCard`** (mj-surface--action + `aria-pressed`) |
| Container card | `.mj-surface` · `.ops-card` · `.settings-section` · u2 surfaces · `.adaptive-*` cards | **`Surface level="card" | "flat" | "overlay"`** |
| Filter chip | `.mj-chip` · `.afford-pill` · u2 topic chips · `.library-toolbar` filters | **`Chip`** (+ `ControlBar` shell) |
| In-page search | `.library-search` · workbench quick-search · dialog inputs | **`SearchField scope="collection"`** + global `⌘K` trigger (`NAV-06`) |
| Section header | `.mj-section__head` · `.ops-page` toolbar · `.settings-section__head` · u2 heads | **`SectionHead`** |
| Empty / loading / error | three treatments each (see §3) | **`StateBlock variant="empty | loading | error"`** on `states.css` |

## 5. Target primitive set (the closed vocabulary)

**Primitives (D2 closure — everything else composes these):**
`Surface` (card/flat/overlay) · `Section` + `SectionHead` · `Stack` · `Cluster` · `Grid` (auto-fill) · `Split` · `DataList` · `ControlBar` + `Chip` · `Button` (primary/outline/quiet/danger × dense/compact/touch/prominent) · `IconButton` · `SearchField` · `Input`/`Field` · `Tabs` · `SegmentedControl` · `Badge`/`StatusBadge` (B1 triads) · `Avatar` · `EmptyState`/`Skeleton`/`ErrorState` (StateBlock) · `NavigationItem` (tiered) · `Dialog`/`Sheet` (mj-dialog geometry) · `Toast`.

**Composition rule [R-IMP-1].** A route may not introduce a new container/control class; it composes primitives + tokens. New needs ⇒ extend the primitive layer with a documented amendment (six-question test).

## 6. Migration table (per dialect)

| Dialect | Fate | Wave | Notes |
|---|---|---|---|
| D1 shell | Stays (chrome owner); unify header to 1 architecture + 1 dock | W-DS W3 | `NAV-01/04` |
| D2 mj-* | **Becomes the only component layer**; gains StateBlock/SearchField/NavigationItem | W1–W2 | aliases per DESIGN-TOKENS §10 |
| D3 u2-* | Interiors refactored onto D2 primitives (Surface/flat groups); shell of workbench keeps its stage-nav pattern as a *composite* | W2 | anti-nesting `SUR-01` |
| D4 service-* | Gateway sections become composites of D2; composer keeps gradient ring as token-bound flourish | W2 | `INT-01` reorder in same wave |
| D5 adaptive-* | Home tiles/recent cards → `SelectableCard`/`DataList` composites | W2 | |
| D6 globals.css | **Dissolved**: buttons → D2 Button; settings/ops/library pages rebuilt on Surface/Section/DataList; file reduced to resets | W2 (ops) → W3 (settings) | `HIE-02`, `IMP-03` |
| D7 marketing | Keeps Tailwind; colors/token bridge per DESIGN-TOKENS §9; component classes stay marketing-scoped | W4 | `VIS-01` |

## 7. New-component admission checklist

1. Maps to a real screen need (matrix or owner request).
2. Composed from §5 primitives; no new geometry.
3. All values from tokens (six-question test for any new token).
4. States defined: default / hover / active / focus-visible / disabled / loading / empty / error.
5. RTL + Arabic rules verified (P1); reduced-motion path defined.
6. QA'd at 390/430/768/1024/1440 before merge (VISUAL-QA-CHECKLIST.md).
