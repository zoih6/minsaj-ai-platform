# Minsaj AI — Roadmap & Execution Plan

| | |
|---|---|
| **Document ID** | MINSAJ-ROADMAP |
| **Version** | 1.0 — 2026-09 |
| **Status** | Active — step-by-step execution plan ("حبة حبة") |
| **Related** | `01-PRD.md` (§15 Releases) · all suite docs |

> This roadmap translates the PRD release bands into **concrete, verifiable engineering milestones**. Each milestone lists scope, exit criteria, and the docs it implements. A milestone is done only when its exit criteria pass the quality gates in `06-TESTING-STRATEGY.md`.

---

## Where We Are

**R0 — UI Foundation: COMPLETE (v5).** Full bilingual product surface: marketing, home, 7 workspaces, projects, library, runs, admin surfaces; responsive architecture (drawer/rail/expanded) verified 63/63; overlap/z-index defects fixed site-wide; premium design system unified.

---

## R1 — Interactive Prototype (current phase)

**Goal:** every core journey is experientiable end-to-end with state, outputs, save, versions, and truth receipts — still on mock data, indistinguishable in behavior from the real thing.

### M1 · UX State System (foundation for everything) — *in progress*
- Shared state components: `Skeleton`, `EmptyState`, `ErrorState`, `SuccessNotice`, `PartialBadge` (portaled-safe, tab-bar-aware).
- Applied to: Library, Projects, Project detail, Runs, all workspace stage surfaces.
- **Exit:** every mandatory surface demonstrates all states; states demoable via scenario flags; QA gate §4 green.

### M2 · Interaction & Motion Polish
- Micro-interactions pass: buttons (press/hover/focus), cards (lift), segmented controls, drawer/dialog/palette transitions.
- Motion tokens applied consistently (`--u-motion-duration-*`); reduced-motion audit clean.
- Route transitions with route-level skeletons (no white flashes).
- **Exit:** interaction suite §3 green; visual gate ≥ 9/10 on core pages.

### M3 · Performance Pass
- Font loading audit (weights/subsets/preload); dynamic imports for heavy editors/charts; client JS budget ≤ 250 KB gz per route.
- CSS layer audit: remove dead blocks; verify single-sheet determinism.
- **Exit:** budgets in `06-TESTING-STRATEGY.md` §6 met on 375/768/1440.

### M4 · Session Journey Depth (the PRD core)
- Home intent → workspace routing suggestion cards (why + context preview + confirm) — FR-ASK-003…007.
- Workspace stages: full state machines (preparing/running/waiting/review/completed + failed/cancelled/retry) driven by scenario runner.
- Outputs: save → Library entry (type/status/version) → resume → new version (never silent overwrite).
- Truth receipts on every workspace output (what ran / what didn't / warnings / limitations).
- **Exit:** AC-001…AC-008 demonstrably pass end-to-end in both locales; DoD #1-20 checked per feature.

### M5 · R1 Hardening
- Accessibility walk (QA §5) + fixes; full sweep re-run; v6+ packaging with delivery parity.

## R2 — Personal Alpha (backend kickoff)

1. **M6 · Provider extraction** — `ServiceProvider` interface into contracts; feature controllers depend on the seam, not on mock packages (the prerequisite from `05-BACKEND-INTEGRATION-READINESS.md` §3).
2. **M7 · Auth** — NextAuth credentials/OAuth; `/app` guarded; user isolation server-side.
3. **M8 · Persistence** — Prisma schema from contracts; append-only run events; outputs/versions/projects tables; soft deletes.
4. **M9 · Real snapshots over HTTP** — home/operations/admin read from API with TanStack Query; mock flag side-by-side.

## R3 — Real AI Services

1. **M10 · Model provider integration** (one provider, contract-shaped adapters; provider details never leak into UX copy).
2. **M11 · Live research channel** — real search + citations with evidence linking (FR-RES-005…008), conflicting-source surfacing.
3. **M12 · Truth receipts go real** — receipts switch from scenario data to execution metadata; demo badges flip to real states.
4. **M13 · Usage & cost** — estimated vs. actual, always labeled (TRUTH-008).

## R4 — Controlled Agents & Automation

Agent/flow definition surfaces (already prototyped in admin areas) get real runtimes: bounded tools, approval gates, cancel/retry, execution logs, observable flows. Safety rules FR-CODE-008…011 remain hard constraints.

---

## Cross-Cutting Track (runs continuously)

| Track | Cadence |
|---|---|
| Documentation sync (this suite) | Every milestone |
| i18n completeness audit | Every milestone |
| RTL/LTR geometry audit | Every milestone |
| Delivery packaging + verification | At each version tag |

## Decision Points Ahead (feed PRD Open Questions)

1. Bottom tab bar item set — usability check in M4.
2. Onboarding depth — decide before R2 auth.
3. Accessibility target (WCAG 2.1 AA assumed) — ratify in M5.
4. Dark mode timing — after R1, token architecture is ready.
5. SSE vs WebSocket — decide at M11 design.
