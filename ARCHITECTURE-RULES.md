# Minsaj AI — Architecture Rules

| | |
|---|---|
| **Status** | Active — binding on every change |
| **Audience** | Every AI agent and human contributor. Read BEFORE writing, moving, or refactoring any code. |
| **Relationship** | `AGENTS.md` is the entry point (process & gates). This file is the architecture law (structure & boundaries). `docs/04-FRONTEND-ARCHITECTURE.md` describes the system as-built; this file constrains how it may evolve. |
| **Companion** | `DESIGN-ENGINEERING-GOVERNANCE.md` (root) — the visual/layout counterpart of this law. |

---

## 0. Why this file exists

Minsaj's real risk is not the framework, and it is not "missing OOP". The delivery record proves it:

- **v8** — editors broke on phones because page roots lacked container contexts (a boundary between shell and page was violated).
- **v11** — dialogs were dead on phones because portaled elements escaped every container context (a rendering-context boundary was violated).
- **today** — 12 files (13 import statements) reach into `@minsaj/mock-api` directly (the data-source boundary is leaking; §4).

Every regression so far came from a **boundary violation**, not a technology choice. This file exists to make boundaries explicit, checkable, and expensive to break.

**Two laws, up front:**

1. **Functional-first hybrid architecture.** No mandatory OOP layer, ever. Classes only where an object genuinely earns it (§5).
2. **One direction of dependencies.** `UI → Features → Application → Provider interface → Infrastructure`. Never backwards. Never sideways. No exceptions without an ADR in `docs/08-AGENT-OPERATING-MODEL.md`.

---

## 1. The architecture decision (MADR)

**Context.** Minsaj is TypeScript + React + Next.js 16, a Bun-workspaces monorepo with good existing separation (`src/app → src/features → src/lib → packages/contracts + packages/mock-api`), contract-first data (zod schemas + inferred types), and a planned `ServiceProvider` seam. Adding a mandatory OOP layer on top would add boilerplate and hide the actual risk (responsibility creep) behind ceremony.

**Decision.** Adopt a **hybrid functional-first architecture**: React/functional style as the base; classes admitted only inside Domain and Infrastructure, only with a written justification (§5).

**Consequences.**

- *(positive)* No `class Button {}` / `class Sidebar {}` boilerplate; onboarding stays simple; React idioms stay idiomatic.
- *(positive)* Business rules remain pure, testable functions and schemas — mirroring how `@minsaj/contracts` already encodes state machines.
- *(negative)* Discipline must come from **rules, not the type system** — hence this file and its review checklist (§10).
- *(negative)* The `ServiceProvider` seam must actually be extracted (§4) or the mock/real swap becomes a rewrite.

---

## 2. Layer map — concept → where it lives in THIS repo

Minsaj does NOT need new folders. The five conceptual layers map onto the existing structure:

```
┌─────────────────────────────────────────────────────────────────┐
│ UI            React components: render + interact. Zero logic.  │
│               src/components/{universal,domain,app-shell}        │
│               + view components inside features                 │
├─────────────────────────────────────────────────────────────────┤
│ Features      Orchestration per service workspace.               │
│               src/features/{create,learn,research,               │
│               service-workbench,service-foundation}             │
├─────────────────────────────────────────────────────────────────┤
│ Application   Use cases, state transitions, data access.          │
│               feature state/ controllers · src/lib/data ·         │
│               src/hooks · src/lib/{viewports,surface-states,…}   │
├─────────────────────────────────────────────────────────────────┤
│ Domain        Business rules, entities, state machines.          │
│               packages/contracts (schemas, enums, transitions)   │
│               + domain helpers (some stranded in mock-api → §5) │
├─────────────────────────────────────────────────────────────────┤
│ Provider      THE SEAM. ServiceProvider interface (§4).          │
│ interface    Features depend on this — never on an implementation.│
├─────────────────────────────────────────────────────────────────┤
│ Infrastructure Implementations of the provider.                  │
│               packages/mock-api (today) → mock-provider +        │
│               http-provider (backend phase, SSE/REST)            │
└─────────────────────────────────────────────────────────────────┘
```

### Layer responsibility contracts (binding)

| Layer | MUST own | MUST NOT own |
|---|---|---|
| **UI (components)** | rendering, interaction affordances, accessibility semantics | business logic, data fetching, validation, cross-feature imports |
| **Features** | composing views + controllers for ONE service; wiring the shared workbench | direct mock/HTTP imports; rules that belong to contracts; another feature's internals |
| **Application** | use-case orchestration: state machines, transitions, retries, pagination | JSX beyond null-states; wire formats; direct provider implementations |
| **Domain (contracts)** | entity shapes, enums, invariants, pure business rules | I/O, React, fetch, environment access |
| **Provider interface** | the callable surface (`snapshot`, `startRun`, `stream`, …) | implementation details |
| **Infrastructure** | mock scenario playback, HTTP/SSE transport, persistence details | business decisions (e.g. "what counts as completed") |

**Existing hard dependency rule (unchanged, now reinforced):**
`app → features/components → lib → packages`. Packages never import from `src/`. `contracts` is imported by everything and imports nothing app-side.

---

## 3. Dependency rules — the allowed import graph

```
src/app ──────────► src/features ──► src/lib ──► packages/contracts
   │                     │              │                ▲
   ▼                     ▼              │                │
src/components ◄─────────┘              ▼                │
   │                              packages/mock-api      │
   │                                (Infrastructure)     │
   └──► packages/{ui,i18n} ─────────────────────────────┘
```

### Forbidden imports (fail the review, fail the PR)

| ❌ Forbidden | Real example in today's code (debt inventory §4) | Do this instead |
|---|---|---|
| Feature component → `@minsaj/mock-api` | `src/features/create/components/visual-editor.tsx` imports `createVisualVariants` | move the helper to a domain module (§5) or reach it through the workbench provider |
| Feature → another feature's internals | — (none today; keep it that way) | extract to `src/components/universal` or `src/lib` |
| Any package → `src/**` | — (none today) | invert: move the shared code into the package |
| `contracts` → anything app-side | — (none today) | contracts stays a leaf |
| New package that wraps two functions | — | don't. A module in `src/lib` is enough until ≥3 consumers |

**Cross-feature reuse rule:** the second feature to need a piece of another feature's code moves it to the shared layer (`src/components/universal` for views, `src/lib` for logic) — the third one is a refactor you owe the codebase.

---

## 4. The ServiceProvider seam (dependency inversion — the #1 backend-readiness preparation)

`docs/05-BACKEND-INTEGRATION-READINESS.md` §3 already declares this seam. This section makes it **law**.

**Scheduling (owner decision, 2026-09-17):** execution is **deferred to backend kickoff** — this
is a frontend-only refactor, but its value materializes only when a real backend exists. During
the frontend phase this section is a frozen plan plus one binding rule: **no new direct
`@minsaj/mock-api` imports**; new data access routes through the existing chokepoints (the
`service-workbench` provider, `src/lib/data`). The protocol below (§4.3) executes as step 1 of
the backend migration checklist (`docs/05` §9).

### 4.1 The target interface

```ts
// packages/contracts (or @minsaj/api-client) — the ONLY thing features may import for data
export interface ServiceProvider {
  snapshot(locale: Locale): Promise<Snapshot>;
  startRun(input: StartRunInput): Promise<ServiceRun>;
  stream(runId: string, onEvent: (e: ServiceEvent) => void): () => void; // returns unsubscribe
  cancel(runId: string): Promise<void>;
  retry(runId: string): Promise<ServiceRun>;
  save(input: SaveOutputInput): Promise<OutputRecord>;
}
```

The mock implementation (`createDeterministicMockServiceClient` + friends) and the future HTTP/SSE implementation both satisfy this interface. When the backend lands, **no feature file changes** — only the provider registration.

### 4.2 Current debt inventory (measured 2026-09-17, v12 — 12 files, 13 import statements; frozen per §4 scheduling)

**Category A — client construction (should resolve through provider registration):**

| File | Imports |
|---|---|
| `src/features/service-workbench/state/workbench-provider.tsx` | `createDeterministicMockServiceClient`, `createServiceIdFactory`, `createTimerServiceClock` |
| `src/features/service-foundation/foundation-harness.tsx` | `createDeterministicMockServiceClient` |
| `src/features/create/create-route.tsx` | `createDeterministicMockServiceClient` |
| `src/features/learn/learn-route.tsx` | `createDeterministicMockServiceClient` |
| `src/features/learn/learn-workspace.tsx` | client + `buildLearnPath` + presets (A + C) |

**Category B — snapshot reads (should resolve through `snapshot()`):**

| File | Imports |
|---|---|
| `src/lib/data/home.ts` | `getMockHomeSnapshot` |
| `src/lib/data/operations.ts` | operations snapshot readers |

**Category C — domain content stranded in the infrastructure package (should MOVE OUT of mock-api entirely):**

| File | Imports |
|---|---|
| `src/features/create/state/create-reducer.ts` | `buildCreateArtifactRecords`, `draftFromArtifactContent` (+ A) |
| `src/features/create/create-workspace.tsx` | `createCreateStatePreset`, `createScenarioPresets` |
| `src/features/create/components/visual-editor.tsx` | `createVisualVariants`, `getCreateVisualVariant` |
| `src/features/learn/state/learn-reducer.ts` | learn domain readers |
| `src/features/learn/components/learn-surfaces.tsx` | `getLearnTopic` |

**Why C matters:** these helpers are **business logic** (what a learn path is, what an artifact record looks like) that happen to live inside the mock package. If the backend arrives and we only swap transport, these rules stay hostage in a package named "mock". They must move to `packages/contracts` (pure rules) or a `src/features/*/domain` module (feature-local rules).

### 4.3 Extraction protocol (strangler, not big-bang)

1. Extract the `ServiceProvider` interface into `packages/contracts` (single file, no React).
2. Adapt the existing mock client to `satisfy ServiceProvider` — zero behavior change.
3. Register the provider ONCE (`src/lib/provider.ts` — reads `NEXT_PUBLIC_API_MODE=mock|http`, defaults `mock`).
4. Migrate consumers **one file per commit**, gates green each time. Order: B (snapshots, easiest) → A (client construction) → C (move domain helpers out).
5. Update this file's debt table to zero. Then delete this section and celebrate.

**Done-when:** `rg "@minsaj/mock-api" src/` returns **only** `src/lib/provider.ts` (one line, the registration).

### 4.4 What features may never know

Transport (fetch/SSE/WebSocket), endpoints, status codes, retry headers, auth headers, error envelopes, environment variables. All of that is Infrastructure. If a feature needs to branch on "is this the mock?", the seam is wrong — branch on data (contract fields), not on source.

---

## 5. The class rule (when OOP is admitted)

> **Functions by default. A class is admitted only when an object has identity, mutable state, lifecycle, invariants, or interchangeable behavior — and at least TWO of these at once.**

### 5.1 Justification checklist (write it in the PR/commit before writing the class)

| Property | Meaning | Example in Minsaj |
|---|---|---|
| Identity | two instances with same data are still distinct | two concurrent `Run`s |
| Mutable state | changes over time in-place | run status transitions |
| Lifecycle | birth → states → death, with rules per state | `queued → planning → running → waiting_for_approval → completed` |
| Invariants | rules that must hold between calls, not just during one | "no `start()` after `cancel()`" |
| Interchangeable behavior | multiple implementations behind one contract | mock vs HTTP provider |

**1/5 or 0/5 → write a function.** **2+/5 → a class is justified — put it in the right layer (below).**

### 5.2 Where classes may live

| Layer | Class allowed? | Candidates |
|---|---|---|
| `packages/contracts` | ✅ (pure, no I/O) | `Run`, `Execution`, domain entities with transition rules |
| `packages/mock-api` / future `http-provider` | ✅ | `AgentRuntime`, `EventStream`, provider implementations |
| `src/features/*/state` | ⚠️ rarely — only if the reducer isn't enough | long-lived session objects |
| `src/components`, `src/app` | ❌ never | React owns composition here |

### 5.3 Worked examples (Minsaj-specific)

**Class earned** — when `Run` grows real transitions (queued → running → waiting_for_approval → completed, with cancel/retry rules and invariant checks):

```ts
// packages/contracts/run.ts — pure domain object
export class Run {
  constructor(
    public readonly id: string,
    private status: RunStatus,
  ) {}

  start(): void {
    if (this.status !== "queued") throw new InvalidTransition("start", this.status);
    this.status = "planning";
  }

  cancel(): void {
    if (isTerminalServiceRunStatus(this.status)) throw new InvalidTransition("cancel", this.status);
    this.status = "cancelled";
  }

  retry(): Run { /* returns a NEW run — identity rule */ }
}
```

**No class needed** — these stay functions (they have no identity/state/lifecycle):

```ts
formatModelName(model)          // pure formatting
calculateUsage(usage)            // pure math
validateInput(input)             // pure validation (zod)
buildRunSummary(run)             // pure projection
snapshotTimestamp()              // pure clock read
```

**Never classes:** `Button`, `UserCard`, `Sidebar`, `Input`, `Page` — "OOP for the sake of OOP" is a rejection reason, not a style preference.

---

## 6. Placement decision table — "I need to add X, where does it go?"

| You are adding… | It goes to… | Never to… |
|---|---|---|
| A new route/screen | `src/app/[locale]/app/…` + declare its container context (AGENTS.md rule 3) | rendering logic in `proxy.ts` |
| A cross-page visual composite | `src/components/universal` | a feature folder |
| A one-feature visual composite | `src/features/<feature>/components` | `src/components/domain` (that dir is for cross-feature domain surfaces) |
| A data shape / entity / enum / state machine | `packages/contracts` | feature-local duplicate types |
| A use-case / transition / orchestration | feature `state/` controller or `src/lib/data` | inside a view component |
| A pure domain rule | `packages/contracts` (shared) or `src/features/<feature>/domain` | `packages/mock-api` |
| A mock behavior / scenario / fixture | `packages/mock-api` | inline in features |
| A shared hook | `src/hooks` | a component file |
| A design token | `foundations.css` (light + dark blocks in sync) | a literal hex/px in a component layer |
| New CSS | the existing layer that owns it (11-layer order, AGENTS.md) | a new stylesheet / a second entrypoint |
| A verification script | `scripts/` + wire it into CI | run-once-then-forget |

---

## 7. Anti-bloat catalog (each item is a real failure mode)

1. **The God Workspace.** A feature component that fetches + validates + transitions state + formats + handles errors + renders. Reference shape of the violation (user's own words, kept as the canonical example):

   ```
   ResearchWorkspace
     ├── API calls
     ├── business logic
     ├── state transitions
     ├── validation
     ├── formatting
     ├── error handling
     └── UI                      ← all seven in one file = reject
   ```

   Required shape: `ResearchWorkspace (UI) → controller (Application) → ServiceProvider → provider`. The `service-workbench` already models this correctly for learn/research/create — extend it, don't fork it.

2. **Direct data-source reach-ins.** Any new `from "@minsaj/mock-api"` outside `src/lib/provider.ts` after the extraction (§4.3) is a rejected PR. CI guard is planned (`check-provider-seam`); until then, the review checklist catches it (§10).

3. **Premature abstraction.** `ManagerServiceFactory` around two functions; an interface with one implementation and no second planned; a wrapper package re-exporting one module. Functions first; abstract at the third consumer.

4. **Responsibility smuggling via props.** Passing a whole provider/store down five levels "because it was faster". Pass data + callbacks; context belongs to the workbench provider.

5. **Duplicated domain rules.** Re-implementing "what is a completed run" in a component when `contracts/services/transitions.ts` already owns it. Business vocabulary lives in contracts — cite it, don't rewrite it.

6. **Cross-feature imports.** `features/learn` importing from `features/create`. Extract to the shared layer (§3 rule).

---

## 8. Refactoring rules (paying debt safely)

1. **Strangler, never big-bang.** One seam per commit; the app ships green after every step. (The §4.3 extraction is the template.)
2. **Gates stay green throughout.** `lint` + `tsc --noEmit` + `build` + the three CI guards after every refactor commit — a refactor that breaks a gate is not a refactor.
3. **Behavior-preserving only.** A refactor that changes behavior is two PRs: the refactor, then the change. Never both.
4. **Move code DOWN (toward contracts/shared) when ≥2 consumers need it; never UP.** Code only moves toward `src/` when it was infrastructure or domain logic stranded in the wrong layer.
5. **Delete ruthlessly.** Dead code is debt with interest (45 dead deps and ~200 dead CSS lines were removed in earlier phases). If nothing imports it, it goes.
6. **Update the map.** Any refactor that moves a boundary updates `AGENTS.md` + `docs/04` + this file in the same PR. Code that moved without its documentation is half-done.

---

## 9. Architectural Definition of Done

A change is architecturally done when ALL hold:

- [ ] New code sits in the layer that owns its responsibility (§2, §6) — no exceptions granted.
- [ ] No new direct `@minsaj/mock-api` import outside the provider registration (§4.4).
- [ ] Data shapes flow through `packages/contracts` — no local re-declarations of wire entities.
- [ ] Any new class passes the §5.1 checklist with the justification written in the commit.
- [ ] Cross-feature reuse resolved through the shared layer, not imports (§3).
- [ ] All gates green: `bun run lint` · `npx tsc --noEmit` · `bun run build` · layout guards · portal isolation · contrast guard.
- [ ] If boundaries moved: `AGENTS.md`, `docs/04`, `STATE.md`, and this file updated in the same push.
- [ ] Commit references the PRD IDs it implements (`FR-…`, `UX-…`) — traceability is architectural too.

---

## 10. Enforcement

| Mechanism | Covers | Status |
|---|---|---|
| `scripts/check-layout-guards.mjs` | page roots must declare container contexts | ✅ in CI |
| `scripts/check-portal-container-isolation.py` | portaled elements never styled inside `@container` | ✅ in CI |
| `scripts/check-theme-contrast.mjs` | token contrast, light + dark | ✅ in CI |
| `bun run lint` / `tsc --noEmit` / `build` | syntax, types, compilability | ✅ in CI |
| **Review checklist (this file)** | layer placement, import direction, class justification, seam discipline | ⚠️ agent/human review — quote the violated rule ID in the review |
| `check-provider-seam` (planned) | no `@minsaj/mock-api` imports outside `src/lib/provider.ts` | ⏳ build when §4.3 lands |

**Rule IDs for reviews:** cite as `ARCH-§<section>` (e.g. `ARCH-§4.4` for a feature that learned an endpoint). The citation matters — it turns taste arguments into contract arguments.

**Changing this law:** rules change through a MADR entry in `docs/08-AGENT-OPERATING-MODEL.md` § Decision log (Context / Decision / Consequences) + a PR that updates this file. Silent divergence is how the v8/v11 class of bugs happened; it does not get to happen again.
