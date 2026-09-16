# Nasaq AI — Frontend Architecture

| | |
|---|---|
| **Document ID** | NASAQ-FE-ARCH |
| **Version** | 2.0 — 2026-09 |
| **Status** | Active — reflects the shipped codebase |
| **Related** | `01-PRD.md` · `03-DESIGN-SYSTEM.md` · `05-BACKEND-INTEGRATION-READINESS.md` |

---

## 1. Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack)** | Filesystem routing with `[locale]` segment |
| Language | **TypeScript 5 (strict)** | End-to-end, including workspace packages |
| UI primitives | **Radix UI** (via shadcn-style wrappers) + `@nasaq/ui` | Accessible behaviors, unstyled core |
| Styling | **Tailwind CSS 4 (CSS-first, no `tailwind.config`)** + custom CSS layers | Single ordered entrypoint, no CSS-in-JS |
| State | Local `useState`/context now; **Zustand** reserved for cross-route client state; **TanStack Query** reserved for server state (post-mock) | No premature global state |
| Forms | react-hook-form + zod resolvers | zod schemas shared with contracts |
| Data (current) | `@nasaq/mock-api` — deterministic, in-memory, contract-typed | Swap path defined in §7 |
| i18n | `@nasaq/i18n` dictionaries + `next-intl` conventions | AR-first |
| Icons | Lucide React | |
| Motion | CSS keyframes + IntersectionObserver (`ScrollFx`) | framer-motion available but not load-bearing |

Package manager: **bun** (workspaces). Node version: LTS 20+.

## 2. Repository Layout (monorepo)

```
nasaq-ai/
├─ src/                        # Next.js application
│  ├─ app/
│  │  ├─ [locale]/
│  │  │  ├─ (marketing)/page.tsx        # landing
│  │  │  ├─ app/…                       # authenticated shell routes (20+)
│  │  │  ├─ preview/…                   # design-system previews
│  │  │  └─ layout.tsx · not-found.tsx · loading.tsx
│  │  ├─ styles/universal/              # 10 ordered CSS layers (see §4)
│  │  ├─ universal.css                  # THE global entrypoint (import order matters)
│  │  └─ proxy.ts                       # edge middleware: locale guard (/ → /ar)
│  ├─ components/
│  │  ├─ app-shell/                     # shell chrome (state machine)
│  │  ├─ domain/                        # feature-specific composites
│  │  └─ universal/                     # cross-page surfaces (adaptive-home, library…)
│  ├─ features/                         # service workspaces (create/learn/research…)
│  ├─ hooks/  lib/                      # viewports, content, data access
├─ packages/
│  ├─ contracts/            # zod schemas + types — single truth for data shapes
│  ├─ i18n/                 # dictionaries AR/EN
│  ├─ mock-api/             # deterministic scenario playback (see §6)
│  └─ ui/                   # shared UI helpers
├─ docs/                    # THIS documentation suite
└─ prisma/ · db/            # prepared for R2 (unused in R0/R1)
```

**Dependency rule**: `app → features/components → lib → packages`. Packages never import from `src/`. `contracts` is imported by everything, imports nothing app-side.

## 3. Rendering & Routing

- All routes are server components by default; interactivity is isolated to leaf client components (`"use client"`) — the shell, workspace stages, forms.
- `proxy.ts` (Next.js 16 middleware convention) guards the locale segment: requests without a valid `/ar|/en` prefix redirect to `/ar`.
- `loading.tsx` provides route-level suspense fallback; workspace stages own their skeletons.
- Every `/app` route renders inside **one** application shell (`app-shell.tsx`), which owns viewport mode, sidebar state, drawer/overlay behavior, scroll-lock, and persistence (`localStorage`). Pages never manipulate global chrome.

## 4. Styling Architecture (10 ordered layers)

`src/app/universal.css` imports, in order:

```
foundations.css   # tokens ONLY (colors, type, radii, shadows, motion durations, shell metrics)
layout.css        # nq-* intrinsic primitives (grid/stack/cluster/split/data-list) + breakpoint bands
marketing.css     # landing art direction
shell.css         # app chrome: sidebar modes, topbar, tab bar, backdrop, z-ladder
home.css          # home surface
workspaces.css    # service landing + stage shells
library.css       # library/data surfaces
responsive.css    # marketing art-direction + accessibility contracts (thin)
motion.css        # keyframe library + scroll-reveal + ambient (marketing)
workbench.css     # workspace stage internals (rails, overlays, comparisons)
```

**Rules**:

1. Tokens are declared once in `foundations.css`; other layers consume.
2. No physical `left/right` properties — logical properties only (RTL-native).
3. Layout must use `nq-*` primitives; page-specific fixed grids are forbidden.
4. Component reflow uses **container queries** (4 bands: 1040/880/640/430) keyed to available width — not viewport media queries.
5. Every interactive element satisfies the 44 px touch invariant.
6. New CSS joins the layer that owns it; no new global entrypoints.

## 5. Responsive Architecture (summary — full contract in UX Spec §2.2/§9)

- `src/lib/viewports.ts` + `src/hooks/use-viewport-mode.ts`: SSR-safe single source of truth (768/1024/1440).
- Shell modes: `data-sidebar = drawer | rail | expanded`, `data-mobile-open`, `data-overlay` on `.universal-app-shell`.
- Deterministic layout: no scroll jank, no per-page media-query patches (~200 legacy patch lines were removed in the rebuild).

## 6. Data Layer (current — mock)

`@nasaq/mock-api` provides:

- **Deterministic scenario playback** (`services/runner.ts`): each workspace run is a pre-authored event plan; the runner emits sequenced events on a manual clock; **success is never derived from elapsed time** (PRD FR-STATE-001 by construction), nothing is random, replays are reproducible.
- Snapshot fixtures (home, operations, admin) typed by `@nasaq/contracts` zod schemas.
- Service domains: `create` (documents, decks, variants, versions, presets, visuals), `research` (sources, presets), `learn`, and shared `plans/ids/clock/runner`.
- Retry (`retryOf`), cancellation steps, and artifact kinds are first-class — mirroring the PRD state machines.

Consumption pattern: feature components subscribe to scenario events through the workspace stage controllers (`src/features/*`); nothing reads fixtures directly.

## 7. Real-API Swap Path (preview — full plan in `05-BACKEND-INTEGRATION-READINESS.md`)

1. `@nasaq/contracts` remains the wire truth; backend implements it.
2. Introduce a client interface (snapshot/stream) with two implementations: mock (today) and HTTP/SSE (R2+).
3. Feature controllers switch via provider registration — no component changes.
4. Server state moves to TanStack Query at that moment (keys per contract schema).

## 8. Performance Strategy

| Concern | Approach |
|---|---|
| Fonts | `@fontsource` self-hosted IBM Plex families; weights limited to 400/500/600/700; `font-display: swap`; preloaded critical subsets |
| JS | Server-first pages; client JS confined to leaf interactives; heavy editors/charts behind dynamic import |
| CSS | Single ordered sheet (403 KB compiled, uncompressed dev) — route-level splitting is a build-time decision; token dedup enforced |
| Images/SVG | Inline system SVG; `sharp` available for raster pipelines |
| Route transitions | Streaming + `loading.tsx` skeletons; zero blocking fonts |
| Budgets | Defined in `06-TESTING-STRATEGY.md` §performance |

## 9. Conventions

- **Naming**: components PascalCase files; hooks `use-*`; CSS blocks kebab with `nq-`/`u-` prefixes per layer.
- **i18n**: no hardcoded strings; dictionary keys namespaced by surface (`home.*`, `research.*`).
- **IDs**: entity IDs keep contract prefixes (`run_`, `prj_`, `mdl_`, `ws_`); display IDs never surface raw (SR-only).
- **Errors**: user-facing errors follow the 5-part contract; never raw exceptions.
- **Commits/PRs**: conventional commits; feature work references PRD IDs (`FR-…`, `UX-…`, `TRUTH-…`) in the description.

## 10. Testing & Verification Hooks

- `bun run lint` — ESLint (Next.js + TS rules), zero-error gate.
- Viewport sweeps: automated browser checks (21 routes × 3 viewports — 63/63 green) asserting `scrollWidth === innerWidth` and expected sidebar mode.
- Interaction checks: drawer open/close, rail↔overlay, collapse persistence, dialog layering (z-ladder).
- Visual QA: VLM-assisted review on core pages (9+/10 gate) — see `06-TESTING-STRATEGY.md`.

## 11. Known Technical Debt / Deferred

1. `tailwind.config.ts` exists as dead v3 legacy — scheduled for deletion (Tailwind v4 is CSS-first).
2. `use-mobile.ts` / `use-toast.ts` leftovers unused — deletion pending.
3. Dark mode tokens unexercised (roadmap question).
4. `packages/config` is an empty scaffold — remove or define.
5. TanStack Query/Zustand installed but idle — deliberate until real data.
