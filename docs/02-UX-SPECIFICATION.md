# Nasaq AI — UX Specification

| | |
|---|---|
| **Document ID** | NASAQ-UX-SPEC |
| **Version** | 1.0 — 2026-09 |
| **Status** | Active — reflects the shipped UI Foundation (R0) + R1 direction |
| **Inputs** | `01-PRD.md` (UX-001…UX-011), `03-DESIGN-SYSTEM.md` (tokens) |
| **Audience** | Design, engineering, QA |
| **Scope** | Interaction & behavior, information architecture, states, RTL/i18n, accessibility, motion |

> This document specifies **what the experience must do**. Visual tokens and component anatomy live in `03-DESIGN-SYSTEM.md`. Technical implementation lives in `04-FRONTEND-ARCHITECTURE.md`.

---

## 1. UX Principles

1. **Start from the task** — every screen answers "what do you want to accomplish?" before any tooling question.
2. **The output is the destination** — screens push the user toward a structured, saveable result.
3. **Truthful by default** — the UI states what happened, what is simulated, and what did not happen (PRD TRUTH-001…009).
4. **Arabic is the design baseline** — English (LTR) must never degrade the Arabic (RTL) experience or vice-versa.
5. **One hand, one thumb** — all core actions are reachable and sized for one-handed phone use (44 px touch invariant).
6. **Calm motion** — motion communicates state change; it never decorates or delays.

## 2. Information Architecture

### 2.1 Top-Level Map

```
/ (marketing)                     landing: promise, services, pricing, auth entry
└─ /[locale]
   ├─ (marketing)                ar | en landing with locale-aware direction
   ├─ /app
   │   ├─ home                   intent entry: "What do you want to accomplish?"
   │   ├─ [service]              7 workspaces: learn · research · create · code · analyze · explore · ask&talk
   │   ├─ projects, projects/[id]
   │   ├─ library                saved outputs (search + filters)
   │   ├─ runs, runs/[runId]     execution monitoring
   │   ├─ agents, flows, skills, tools, knowledge   (progressive-disclosure surfaces)
   │   ├─ models, models/[modelId], models/routing
   │   ├─ usage, billing, team, settings
   └─ preview                    design-system / foundation previews
```

### 2.2 Navigation Model

The application shell (`.universal-app-shell`) is the single chrome for every `/app` route. It exposes three navigation strategies driven by the viewport bands (`src/lib/viewports.ts`):

| Band | Width | Sidebar strategy | Behavior |
|---|---|---|---|
| **Mobile** | < 768 px | `drawer` (off-canvas) + bottom tab bar | Drawer opens over a backdrop; scroll-locked; closes on backdrop tap, `Escape`, or route change. Advanced groups ("advanced tools") expand **within** the scrollable nav region and scroll into view; the profile footer stays visible. |
| **Tablet** | 768–1023 px | `rail` (icon rail) | Expand button switches to **overlay mode** (main content is never pushed); backdrop closes. |
| **Desktop / Wide** | ≥ 1024 px | `expanded` sidebar | Collapse toggle sits in the **brand row** (top of sidebar): `expanded ↔ rail`. Choice persists via `localStorage`. |

**State machine (app-shell):**

```
viewport change → sidebarMode re-derives → drawer closes · rail/expanded persists
route change    → drawer closes · overlay collapses
user toggle     → expanded ↔ rail (persisted) · tablet rail ↔ overlay (not persisted)
```

### 2.3 Command & Utility Layer

- **Command palette** (`⌘K` / `Ctrl-K`): searchable across destinations and workspaces; fully bilingual; opens as a centered overlay above the shell.
- **Notifications**: bell → panel; toasts (`u-feedback-toast`, `DemoToast`) render **portaled to `document.body`**, offset above the mobile tab bar by `--nq-tabbar-reserve`.
- **Z-index ladder (documented in `shell.css`)**: backdrop < shell chrome < tab bar (50) < domain dialogs (80/100/101) < command overlay (100) < workbench overlays (120/121). Toasts/stop buttons (95) reserve tab-bar space. Never introduce a z-index outside this ladder.

## 3. Core User Flows

### 3.1 Intent → Workspace (JTBD-01/02)

```
home hero ─ describe task (or pick start point)
   → route suggestion card: WHY this workspace + WHAT context carries
   → user confirms → workspace stage opens with carried context
```

Rules: suggestion is never an auto-navigation (BR-002); the reason is always visible (AC-002); carried context is previewed before confirmation (FR-ASK-005/006).

### 3.2 Workspace Contract (all 7)

Every workspace stage presents: **goal header → input/brief panel → plan review → stepwise execution (state visible) → output preview → save CTA**. Steps may be linear (Learn) or plan-driven (Research, Analyze). Cancel and retry are available during execution; the stage never implies completion on timer expiry (FR-STATE-001).

### 3.3 Output → Save → Resume (JTBD-03/04)

```
output preview → Save (title, project optional) → Library entry (type, status, version)
Library → open output → resume session | create new version (never silent overwrite)
```

### 3.4 Project Flow

Projects list → project detail: sessions, outputs, context. Creating a session inside a project pre-links outputs (FR-PROJ-004/005).

## 4. Interaction State Matrix (UX-003)

Every data surface must implement the following states. Shared components live under `src/components/universal/`.

| State | Presentation | Rules |
|---|---|---|
| **Loading** | Skeleton blocks matching final layout (cards/rows/text lines) — never bare spinners for structured content; inline spinners only for button-level awaits. | Skeletons appear < 300 ms after navigation or show nothing (avoid flash). |
| **Empty** | Illustration/icon + one-line explanation + **primary CTA that starts the fix** (e.g., "Create your first project"). | Never a dead end; explain why it's empty. |
| **Error** | What happened · why · user action · data-loss note · retry availability (PRD §14.2). | Human language only; retry where the operation is retryable. |
| **Success** | Output preview + explicit confirmation ("Saved to Library — v2"). | Success states state *where* the artifact lives (TRUTH-007). |
| **Disabled** | Visible but inert with a short reason (tooltip/sr-only). | Never hide the affordance; explain the gating. |
| **Partial** | Delivered-so-far chunk + explicit "partial" badge + continuation CTA. | Never present partial as complete (AC-004). |
| **Offline/Unavailable** | Banner in the surface header. | Required on surfaces depending on external services (R3+). |

**Mandatory coverage** (R1 acceptance): Library, Projects, Project detail, all workspace stages, Runs.

## 5. RTL & Bilingual Behavior (UX-004, UX-011)

1. Direction is derived from the locale segment (`/ar` → `dir="rtl"`, `/en` → `dir="ltr"`) at the document level; **no physical `left/right` CSS properties** anywhere in the codebase — logical properties only (`inset-inline-*`, `margin-inline-*`, `padding-inline-*`).
2. Mixed-direction text (Arabic copy containing English words, numbers, code, links) must not break alignment; numerals follow the active locale's convention.
3. The sidebar flips sides with direction; collapse-toggle icons mirror (`scale-x` flip or swapped glyphs).
4. Progress/meter indicators fill from the reading origin.
5. Every user-visible string comes from `@nasaq/i18n` dictionaries — hardcoded copy is a bug (exceptions: code samples, brand names).
6. Language switcher swaps locale segment and preserves the current route.

## 6. Accessibility Contract (NFR-009)

- **Keyboard**: full tab reachability on core paths; skip-to-content link; `Escape` closes drawer/dialog/palette; focus returns to the trigger on close.
- **Focus**: visible focus ring (design-system token) on all interactive elements; never `outline: none` without replacement.
- **Semantics**: `header/nav/main/section/article` landmarks; icon-only controls carry `aria-label`; live regions announce async state changes (save, errors).
- **Non-color signals**: status is icon + text, never color alone.
- **Text zoom**: layouts survive 200% browser zoom (fluid `clamp()` type scale).
- **Reduced motion**: `prefers-reduced-motion` disables reveals, ambient animations, and parallax; opacity-only transitions remain (UX-010).

## 7. Motion Principles (UX-009/UX-010)

| Purpose | Pattern | Budget |
|---|---|---|
| **Entrance** | Scroll-reveal (IntersectionObserver, `ScrollFx`), staggered ≤ 60 ms per item | ≤ 300 ms |
| **State change** | Cross-fade / height auto-transition | ≤ 200 ms |
| **Overlay** | Backdrop fade + panel rise (drawer, palette, dialogs) | ≤ 250 ms |
| **Ambient** | Glow breathing / gradient shimmer — marketing only, never inside work surfaces | ≥ 4 s cycles, subtle |
| **Feedback** | Button press scale (0.98), toast slide+fade | ≤ 120 ms |

Easings and tokens are defined in `03-DESIGN-SYSTEM.md §Motion`. All motion is CSS-first; JS only toggles classes/data-attributes.

## 8. Copy & Tone

- Arabic copy uses clear MSA (فصحى مبسطة), second person, and active voice; technical Latin terms remain Latin when Arabic equivalents are uncommon.
- Errors follow the 5-part contract (§4); never expose stack traces or raw codes.
- Empty states are encouraging, not apologetic walls of text.
- Truth labels ("Demo", "Simulated", "Not executed") are badges with fixed wording from the i18n dictionary.

## 9. Responsive Behavior Summary (UX-006/007/008)

- Content reflows by **available container width** (container queries), not viewport width — identical post-sidebar behavior across pages.
- Tables demote to stacked cards (`nq-data-list`) below their intrinsic comfort width; horizontal scroll (`nq-scroll-x`) only for truly tabular data.
- Touch targets ≥ 44 px; the mobile tab bar reserves space for portaled toasts/buttons via `--nq-tabbar-reserve`.
- No horizontal overflow is ever acceptable on any route at any width 320 px → 1920 px (verified by 63-check sweep; enforced in `06-TESTING-STRATEGY.md`).

## 10. Open UX Questions

1. Should the home intent box support free-text routing to *multiple* workspace candidates (ranked), or single suggestion + manual switch? *(current: single suggestion)*
2. Bottom tab bar items: 5 fixed (Home, Projects, Library, Runs, More) — validate with usability tests in R1.
3. Onboarding depth for first visit (none today) — decide before R2 auth.
4. Dark mode: token architecture supports it; timing to be decided (see Roadmap Q4).
