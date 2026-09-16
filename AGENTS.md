# AGENTS.md — Nasaq AI Platform

> This file follows the open **[AGENTS.md standard](https://agents.md)** — a "README for agents".
> It is the **single entry point** for ANY AI coding agent (Codex, Claude Code, Cursor, Gemini CLI,
> Copilot, Devin, Jules, Amp, Windsurf…) working on this repository. Read it fully before touching any code.

**Read order (mandatory):** `AGENTS.md` (this file) → `STATE.md` (current snapshot & handoff notes) →
`ARCHITECTURE-RULES.md` + `DESIGN-ENGINEERING-GOVERNANCE.md` (the binding law: code boundaries &
the visual system) → `docs/` (deep reference, as needed) → `.claude/skills/*/SKILL.md` (load on
demand, by trigger).

**Owner language: Arabic (RTL).** Always talk to the owner in Arabic. Repository documentation is English.

---

## Setup commands

```bash
bun install            # ~994 packages (reads bun.lock; frozen-lockfile in CI)
bun run dev            # dev server → http://localhost:3000 → redirects to /ar
bun run build          # production build (next build — Turbopack)
bun run start          # production server (next start)
bun run lint           # ESLint — MUST exit with 0 errors
npx tsc --noEmit       # TypeScript check — dev server does NOT typecheck; run before delivering
```

**Runtime:** Bun workspaces monorepo · Node ≥ 20. No `.env` needed (zero `process.env` in code).

## Testing / verification commands

```bash
node scripts/check-layout-guards.mjs     # ARCHITECTURAL GUARD (runs in CI, no browser):
                                          # every page.tsx must render inside a container-query
                                          # context — fails the build if a page lacks one
node scripts/check-theme-contrast.mjs     # THEME GUARD (runs in CI): WCAG AA contrast for every
                                          # critical token pair in LIGHT + DARK — fails the build
bash scripts/verify-sweep-v10.sh           # FULL theme-aware responsive sweep (dev server + browser):
                                          # 30 routes × 3 viewports × 2 themes = 180 checks,
                                          # zero overflow + data-theme actually applied
bash scripts/verify-editor-interactions.sh  # editor interactions on mobile (step nav, canvas, toasts)
```

New route added? **Add it to the `ROUTES` matrix in `scripts/verify-sweep-v10.sh` the same day** — an
unswept route is an undelivered route (this exact blind spot shipped broken editors in v8).
New token or color added? **Extend the pair list in `scripts/check-theme-contrast.mjs`** if it
 ever carries text, and keep both theme blocks in `foundations.css` in sync.

## Project snapshot

- **What:** Nasaq AI (نَسَق) — Arabic-first (RTL) AI business platform frontend: research, learn,
  create workspaces + operations (projects, runs, agents, flows, knowledge, models, team, billing…).
- **Stack:** Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 (CSS-first, no
  tailwind.config) · Bun · next-intl (`/ar` default, `/en` secondary).
- **Live:** <https://nasaq-ai-platform.vercel.app> — **every push to `main` auto-deploys.**
- **Repo:** <https://github.com/zoih6/nasaq-ai-platform> (private).
- **Data:** local mock API (`@nasaq/mock-api`); backend integration seam documented in
  `docs/05-BACKEND-INTEGRATION-READINESS.md`, contracts in `packages/contracts`.

### Repository map

```text
src/app/[locale]/            # routes: (marketing)/ · app/ (the platform shell) · preview/
src/app/styles/universal/    # 11 ordered CSS layers — import order is SACRED (see below)
src/app/universal.css         # entry point: the @import chain (do not break)
src/components/app-shell/    # app-shell.tsx — sidebar state machine (drawer/rail/expanded)
src/components/{universal,domain}/
src/features/                # research · learn · create · service-workbench
src/lib/viewports.ts         # single source of truth for breakpoints (768 / 1024 / 1440)
packages/{contracts,i18n,mock-api,ui}/   # monorepo packages
docs/                        # professional doc suite (00-08) — see docs/README.md
scripts/                     # verification & guard scripts (CI depends on them)
.claude/skills/              # Agent Skills (SKILL.md format) — indexed below
ARCHITECTURE-RULES.md        # code boundaries law (layers, ServiceProvider seam, class rule)
DESIGN-ENGINEERING-GOVERNANCE.md  # visual system law (tokens, layout, QA workflow)
STATE.md                     # living handoff snapshot — update EVERY task
```

---

## Hard rules (non-negotiable)

1. **Research before you build (MANDATORY).** Before implementing anything non-trivial — a new
   library, an unfamiliar API, an error you cannot immediately root-cause, a version-specific
   behavior — **search the web first** and prefer primary sources. Never write an API from memory.
   Cite sources in the commit / decision record. → Skill: `web-research-first`.
2. **No patching — root causes only.** Reproduce → measure (DOM/CSS evidence) → fix at the
   architecture layer → add a regression guard → re-verify. A fix that only hides a symptom is a
   bug that ships later. → Skill: `root-cause-fixing`.
3. **Every page root declares a container context** (`ops-page`, `service-space`, `builder-page`,
   `flow-editor-page`, `universal-library-page`, `adaptive-home`). No container context ⇒ all
   container-query rules are dead on that page ⇒ desktop layout on phones. `scripts/check-layout-guards.mjs`
   enforces this in CI — it must stay green.
4. **Components reflow via container queries, not media queries — EXCEPT portaled content.**
   Use the primitives in `layout.css` (`nq-grid`, `nq-split`, `nq-cluster`, `nq-data-list`,
   `nq-scroll-x`) or the four container bands (1040/880/640/430). **Never** add per-element
   viewport media-query patches for in-flow content.
5. **Portaled dialogs/overlays style via `@media`, NEVER `@container`.** Anything rendered
   through `<Dialog.Portal>` (or `createPortal`) mounts into `document.body` — **outside every
   `@container` context**, so container-query rules can never match it (the v11 "خصّص تجربتك"
   bug: mobile rules existed but were dead for days). Responsive rules for `.adaptive-dialog`,
   `.form-dialog`, `.approval-dialog`, `.compare-dialog`, `.usage-event-dialog`,
   `.u2-overlay__content`, `.universal-command` live in viewport `@media` blocks.
   `scripts/check-portal-container-isolation.py` blocks regressions in CI — it must stay green.
   Phone pattern: bottom sheet (`inset: auto 0 0; transform: none; width: 100%`), safe-area
   padding, and the consolidated phone layer in `globals.css` is deliberately LAST (after the
   premium enhancement layer) with `[role="dialog"]` specificity so nothing overrides the sheet
   geometry.
6. **RTL-first: logical CSS properties only** (`inline-start/end`, `padding-inline`,
   `margin-block`…). Zero physical `left`/`right` declarations in CSS.
7. **Bilingual content ships complete:** any user-visible string lands in Arabic AND English
   (i18n keys in `packages/i18n` or localized copy objects). Never ship one locale only.
8. **Motion is opt-in:** every animation lives under
   `@media (prefers-reduced-motion: no-preference)`.
9. **Touch targets ≥ 44×44px** (`--u-touch`).
10. **No new dependency without proof of use** (this repo deleted 45 dead deps once — never again).
11. **Portaled fixed elements** (toasts, floating buttons) mount to `document.body` via
    `createPortal` and respect `--nq-tabbar-reserve` (defined on `:root` so portals can reach it).
    Respect the unified z-index ladder documented at the top of `shell.css`.
12. **ScrollFx mounts inside page-root components, never in layouts** (hydration race — React
    hydrates lazy boundaries after layout effects).
13. **No hardcoded colors — semantic tokens only.** Every color flows from `foundations.css`
    tokens (light in `:root`, dark in `:root[data-theme="dark"]`, legacy bridge re-defined in
    both). An un-tokenized light-mode hex is a guaranteed "white box in dark mode" bug.
    `node scripts/check-theme-contrast.mjs` must stay green. → Skill: `theming-and-contrast`.
14. **Never commit secrets.** `.env*` is gitignored — keep it that way. Tokens live outside the repo.
15. **The governance pair is binding law.** `ARCHITECTURE-RULES.md` (layering, import direction,
    ServiceProvider seam, class justification) and `DESIGN-ENGINEERING-GOVERNANCE.md` (tokens,
    spacing/type/icon scales, layout vocabulary, QA workflow) govern EVERY change. Review
    violations by rule ID (`ARCH-§n` / `DEG-§n`). Any visual/layout task follows the 8-step
    workflow in DEG §15 (AUDIT → … → REGRESSION CHECK) — the forbidden workflow "see problem →
    patch CSS on that screen → next" is what this repo exists to prevent. No new direct
    `@nasaq/mock-api` imports outside the provider registration (ARCH §4).

### CSS layer order (sacred — `src/app/universal.css`)

```text
1 foundations → 2 layout → 3 states → 4 marketing → 5 shell → 6 home → 7 workspaces
→ 8 library → 9 responsive → 10 motion → 11 workbench
```

Breakpoints (source of truth `src/lib/viewports.ts`): **768** mobile→tablet, **1024** tablet→desktop,
**1440** wide. Sidebar modes: `<768` drawer (with backdrop) · `768–1023` icon rail (expand = overlay,
not push) · `≥1024` expanded (collapse → rail, persisted in localStorage).

---

## Workflows

### A. Task lifecycle (feature or fix)

1. **Understand & restate** the request before executing (the owner explicitly values correct
   interpretation over literal execution).
2. **Research** if anything is unfamiliar (Rule 1).
3. **Implement** at the correct architectural layer (Rules 2–11).
4. **Verify:** `bun run lint` + `npx tsc --noEmit` + `bun run build` + layout guards + responsive
   sweep for anything visual (375/768/1440).
5. **Deliver** per the delivery gate (below).
6. **Document** per the maintenance protocol (below).

### B. Delivery gate (before every push)

- [ ] Layout guards green (`node scripts/check-layout-guards.mjs`)
- [ ] Theme contrast guard green (`node scripts/check-theme-contrast.mjs`)
- [ ] Theme-aware sweep green if visuals changed (`bash scripts/verify-sweep-v10.sh` — both themes)
- [ ] Responsive sweep green if layout/visual changed (add new routes to the matrix first)
- [ ] `bun run lint` → 0 errors · `npx tsc --noEmit` → 0 errors · `bun run build` → success
- [ ] Verified **inside the artifact** (unzip / compiled CSS), not just in the dev server —
      dev tolerates what production rejects (v3 and v7 lessons). → Skill: `delivery-packaging`

### C. Documentation maintenance (after EVERY change — the owner's standing order)

- [ ] `STATE.md` — update snapshot, gates status, open items, handoff notes
- [ ] `docs/CHANGELOG.md` — append a phase entry (Arabic)
- [ ] Architectural decision? Add a MADR-style record (Context / Decision / Consequences) to
      `docs/08-AGENT-OPERATING-MODEL.md` § Decision log
- [ ] Rules/commands changed? Update `AGENTS.md` itself (keep it accurate, keep it lean)
- [ ] New page/route? Extend the sweep matrix + repository map

### D. Session handoff (end of every session)

This repo is handed from agent to agent. Close the loop so the next agent starts in minutes:
1. Update `STATE.md` (status, what changed, what's next, environment notes).
2. Commit with a conventional message (`feat:`, `fix:`, `docs:`, `chore:` + scope).
3. Push to `main` → confirm CI green + Vercel deployment `READY`.
4. Report live URL + verification evidence to the owner (Arabic).

---

## Skills index (`.claude/skills/` — Agent Skills format)

Load the matching SKILL.md **before** the work it covers:

| Skill | Load when |
|---|---|
| `agent-onboarding` | At the START of a new session — first-time or returning agent initialization ritual |
| `web-research-first` | BEFORE implementing anything non-trivial, choosing libraries, or debugging unknown errors |
| `root-cause-fixing` | Whenever any bug or visual defect is reported — before writing any fix |
| `layout-regression-defense` | Before every delivery, after CSS/layout changes, when adding pages/routes |
| `rtl-responsive-qa` | When adding or modifying any visual component, page, or interaction |
| `theming-and-contrast` | When adding or changing ANY color/surface/border/shadow, building components that must work in both themes, or touching theme-provider / theme-toggle / contrast issues |
| `repo-state-maintenance` | At the END of every task, before every commit |
| `delivery-packaging` | Whenever producing a zip, publishing to GitHub, or deploying |

Skills are plain Markdown (`SKILL.md` + YAML frontmatter, per the Agent Skills spec) — any agent
can read them, Claude Code auto-discovers them natively.

## Documentation map (`docs/`)

| Doc | Mode* | Content |
|---|---|---|
| `00-PRODUCT-BRIEF` | Reference | Product identity, promise, audience |
| `01-PRD` | Reference | Requirements (MoSCoW), state machines, DoD, traceability |
| `02-UX-SPECIFICATION` | Reference | Flows, states, interaction contracts |
| `03-DESIGN-SYSTEM` | Reference | Luminous Premium tokens, palette, geometry, motion |
| `04-FRONTEND-ARCHITECTURE` | Reference | 10-layer CSS architecture, shell, routing, state |
| `05-BACKEND-INTEGRATION-READINESS` | How-to | ServiceProvider seam, API sketch, migration checklist |
| `06-TESTING-STRATEGY` | How-to | Gates, matrices, budgets |
| `07-ROADMAP` | Reference | M1–M13 milestones |
| `08-AGENT-OPERATING-MODEL` | Explanation | How agents are directed on this repo + decision log |
| `CHANGELOG` | Reference | Phase history (Arabic) |

**Plus two root-level law documents standing beside this file (binding on every change):**
[`ARCHITECTURE-RULES.md`](./ARCHITECTURE-RULES.md) — structure law: layer map, import direction,
ServiceProvider seam + debt inventory, class-justification policy, anti-bloat catalog.
[`DESIGN-ENGINEERING-GOVERNANCE.md`](./DESIGN-ENGINEERING-GOVERNANCE.md) — visual system law:
token scales (spacing/type/icon/radius/motion), `nq-*` layout vocabulary, responsive rules,
anti-pattern catalog, visual QA protocol, 8-step agent workflow, definition of done.

*Classified per the Diátaxis framework.

## Gotchas (read before diagnosing)

Full list with history in `docs/08-AGENT-OPERATING-MODEL.md`. The four that bite hardest:

1. **Dev ≠ production:** Turbopack dev doesn't typecheck and Lightning CSS tolerates malformed
   declarations that PostCSS rejects. Always run `tsc --noEmit` + `next build` before delivering.
2. **Terminal display can swallow `[m`/`[h`** sequences (folder `[modelId]` may *display* as
   `odelId]`). Judge filenames by raw bytes, never by terminal echo.
3. **Vacuous sentinels:** a DOM check that targets a nonexistent selector always "passes".
   Prove the selector matches a real element before trusting any check built on it.
4. **Sweep coverage is part of done:** unswept dynamic sub-routes (`[id]/edit`) shipped broken
   once. New route ⇒ new matrix entry the same day.

## Deployment

- **Vercel** project `nasaq-ai-platform` is linked to the repo via GitHub App: push to `main` ⇒
  auto production deploy. No env vars required.
- **CI** (`.github/workflows/ci.yml`): on every push/PR → `bun install --frozen-lockfile` →
  layout guards → lint → build. All four must be green.

## Ownership & security constraints

- 🚫 The OLD repo `zoih6/nasaq-ai` is **strictly off-limits** — do not open, modify, delete, or
  merge it. All work happens on `zoih6/nasaq-ai-platform` only. (Owner's explicit order.)
- 🔑 No tokens/secrets in the repo, ever.
- 🔒 The repo stays **private** unless the owner says otherwise.

## Keeping this file accurate

`AGENTS.md` is a living contract. If a rule, command, or workflow becomes stale, fixing the code
without fixing this file is an incomplete change. Keep it lean: push detail into skills and `docs/`,
keep this file the concise, high-signal entry point.

---

*Built following the AGENTS.md open standard, the Anthropic Agent Skills specification, and
context-engineering practices — sources and rationale: `docs/08-AGENT-OPERATING-MODEL.md`.*
