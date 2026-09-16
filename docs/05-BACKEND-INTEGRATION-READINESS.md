# Nasaq AI — Backend Integration Readiness

| | |
|---|---|
| **Document ID** | NASAQ-BE-READY |
| **Version** | 1.0 — 2026-09 |
| **Status** | Active — contract-first preparation for the backend phase |
| **Purpose** | Define everything the backend phase needs from the frontend so the mock layer can be swapped without touching UI code |
| **Related** | `01-PRD.md` (FRs, state machines) · `04-FRONTEND-ARCHITECTURE.md` (§6-7) |

> The current phase is frontend-only. **No backend is built yet.** This document exists so that when backend work starts, integration is a plug-in operation, not a rewrite.

---

## 1. Contract-First Principle

The monorepo already follows **contract-first** practice (as recommended by API-first methodology): `@nasaq/contracts` holds zod schemas + inferred TypeScript types for **every** data shape the UI consumes. The mock API is fully typed against these contracts. Consequences:

1. The wire format is decided **before** endpoints exist.
2. Backend validation and frontend parsing share one schema source.
3. Breaking changes surface as type errors at build time, not as runtime bugs.

**Backend kickoff rule**: implement `@nasaq/contracts` (or generate OpenAPI from it); the frontend must not change shapes to accommodate the backend — extensions go through the contracts package with a versioned migration.

## 2. Current Contract Surface (`packages/contracts/src`)

| Module | Contents |
|---|---|
| `index.ts` | Core entities: `locale`, `runStatus` (9 states), `localizedText`, `money`, `modelSummary`, `runSummary`, `projectSummary`, home/operations/admin snapshots, agent & flow definitions |
| `services/` | Workspace-level contracts: `enums` (serviceIds, run statuses, scenarios), `events` (discriminated union — the event stream), `run`, `session`, `stages`, `transitions`, `artifacts`, `inputs`, `receipt`, `evidence`, `handoff`, `ids`, `text`, `create`, `learn`, `research` |
| ID discipline | Prefixed IDs (`run_`, `prj_`, `mdl_`, `ws_`, `out_` …) validated by schema |

Key state enums (PRD §8 aligned):

```
runStatus: queued · planning · running · waiting_for_input · waiting_for_approval ·
           completed · completed_with_warnings · failed_retryable · cancelled
```

## 3. Data Access Boundary (the swap seam)

Today, feature controllers consume `@nasaq/mock-api` (deterministic scenario runner emitting sequenced `ServiceEvent`s on a manual clock). The backend phase replaces the provider, not the consumers:

```
                       ┌────────────────────────────┐
feature controllers →  │ ServiceProvider interface  │
                       │  · snapshot(locale)        │
                       │  · startRun(input)         │
                       │  · stream(runId, onEvent)  │
                       │  · cancel(runId)           │
                       │  · retry(runId)            │
                       │  · save(output)            │
                       └───────┬──────────────┬─────┘
                               │              │
                        mock-provider     http-provider (R2/R3)
                        (current)         HTTP + SSE/WebSocket
```

**Mandatory step (R1)**: extract the `ServiceProvider` interface into `@nasaq/contracts` (or a new `@nasaq/api-client`) and refactor feature controllers to depend on it — currently some controllers import mock services directly. This is the single most important preparation task and is scheduled in the roadmap before any backend work.

## 4. API Surface Sketch (design targets, not commitments)

Resource-oriented REST over JSON, locale-aware (`Accept-Language` or `/api/v1` + `?locale=`), session-scoped:

| Resource | Suggested endpoints | Contracts consumed |
|---|---|---|
| Session | `POST /sessions` · `GET /sessions/:id` | `session.ts` |
| Runs | `POST /runs` · `GET /runs` · `GET /runs/:id` · `POST /runs/:id/cancel` · `POST /runs/:id/retry` | `run.ts`, `runSummary` |
| Run events | `GET /runs/:id/events` (SSE stream) | `events.ts` union — **already event-sourced** |
| Outputs / Library | `GET /outputs` · `GET /outputs/:id` · `POST /outputs` · `POST /outputs/:id/versions` · `DELETE /outputs/:id` | `artifacts.ts`, output record (PRD §8.2) |
| Projects | `GET/POST /projects` · `GET/PATCH /projects/:id` | `projectSummary` |
| Services metadata | `GET /services/:id/scenarios` | `enums`, `stages.ts` |
| Models | `GET /models` · `GET /models/:id` | `modelSummary` |
| Home / ops snapshots | `GET /snapshots/home` · `GET /snapshots/operations` | snapshot schemas |

Rules: pagination by cursor; every mutation returns the updated contract entity; errors use a normalized error envelope `{ code, message, localizedText?, retryable }` mapping the UX 5-part error contract.

## 5. Real-Time Channel

- Run execution is **event-stream-native** already (`ServiceEvent` discriminated union with sequence numbers, duplicate/gap detection).
- Transport recommendation: **SSE first** (simpler, HTTP/2 friendly, auto-reconnect), graduating to WebSocket for multi-user presence in the Team release.
- Events must be idempotent by `eventId`; consumers dedupe by `sequence` (the mock runner already models this).

## 6. Auth & Security Model (R2 targets)

- NextAuth.js (installed) — credentials + OAuth providers; JWT session cookies.
- All `/app` routes behind auth; locale guard stays in `proxy.ts`.
- Row-level user isolation: every query scoped by `userId` (FR-ACC-003).
- Client never sees other users' entities — enforced server-side by query scoping, not UI filtering.
- CSRF: same-site cookies + origin checks on mutations.

## 7. Persistence (R2 targets)

- Prisma (installed, `prisma/` prepared) + SQLite in dev; PostgreSQL for production.
- Core tables mirror contracts 1:1: `users`, `sessions`, `runs`, `run_events` (append-only), `outputs`, `output_versions`, `projects`, `project_links`, `models` (catalog cache), `usage_ledger`.
- Append-only event log preserves auditability (activity history, FR-TEAM-005 later).
- Soft-delete for outputs (Library undelete window) — never silent hard deletes (BR-004).

## 8. Simulation → Reality Tracing (TRUTH compliance)

The mock layer is the **reference implementation of honesty**:

- Deterministic plans; success never from timers; cancel/retry modeled as real steps.
- Every artifact carries `executionState` + `warnings`/`limitations` (receipt contract).
- When real services arrive (R3), the same receipts must be produced from **actual** execution metadata; the UI truth badges (`Demo`/`Simulated`/`Not executed`) must flip to real states with no copy changes — wording lives in i18n dictionaries exactly for this reason.

## 9. Migration Checklist (backend kickoff order)

1. Extract `ServiceProvider` interface; refactor direct mock imports (frontend task, R1).
2. Generate OpenAPI 3.1 spec from `@nasaq/contracts` (zod → OpenAPI tooling).
3. Implement auth + user isolation.
4. Implement snapshot endpoints first (read-only, fastest value), then run lifecycle, then event stream.
5. Ship side-by-side: `NEXT_PUBLIC_API_MODE=mock|http` feature flag during transition.
6. Golden-file replay: mock scenario plans double as integration test fixtures for the backend (same event sequences must be reproducible).

## 10. Environment & Config Discipline

- Frontend reads only `NEXT_PUBLIC_*` variables; secrets never reach the client.
- Provider endpoints configured per environment (dev/staging/prod); mock mode is a first-class environment, not a hack.
- `z-ai-web-dev-sdk` (used for in-sandbox tooling) is server-only and must not leak into client bundles.
