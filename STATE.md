# STATE.md — Living Project State (Agent Handoff Snapshot)

> **Protocol:** this file is the handoff contract between agents. The acting agent MUST update it
> at the end of every task (see `.claude/skills/repo-state-maintenance/SKILL.md`). It is read
> immediately after `AGENTS.md` at session start. Keep it a snapshot — history lives in
> `docs/CHANGELOG.md`, decisions in `docs/08-AGENT-OPERATING-MODEL.md`.

**Last updated:** 2026-09-16 — Phase 9 · **Current version:** v8.1 · **Branch:** `main`

## Current status

- **Live:** <https://nasaq-ai-platform.vercel.app> (auto-deploys on push to `main`)
- **Repo:** <https://github.com/zoih6/nasaq-ai-platform>
- 8 delivery phases complete (full redesign → responsive architecture → bug-fix sprints →
  professional docs → GitHub/Vercel launch → editor mobile fix + anti-regression system).
- Frontend-complete for current scope; backend not yet connected (mock API in place).

## Quality gates (last verified: Phase 9, 2026-09-16)

| Gate | Status |
|---|---|
| `bun run build` (production, Turbopack) | ✅ green |
| `bun run lint` (ESLint) | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| Layout guards (`scripts/check-layout-guards.mjs`) | ✅ 24/24 pages in container context (CI-enforced) |
| Responsive sweep (`scripts/verify-sweep-v8.sh`) | ✅ 90/90 (30 routes × 375/768/1440, zero horizontal overflow) |
| Editor interactions (mobile) | ✅ pass |
| Hydration / console errors | ✅ zero |
| CI (GitHub Actions) | ✅ green on `main` |

## Open items / next steps (priority order)

1. **M4 — Session-journey depth** (`docs/07-ROADMAP.md`): intent routing from home
   (FR-ASK-003..007); save-to-library → resume flow (US-004..006).
2. **Backend integration** per `docs/05-BACKEND-INTEGRATION-READINESS.md` (ServiceProvider seam;
   contracts ready in `packages/contracts`).
3. **Dependency cleanup opportunity:** `prisma`, `next-auth`, `framer-motion`, `zustand`,
   `@tanstack/*`, `z-ai-web-dev-sdk` remain installed with zero imports (kept deliberately for
   bun.lock stability). Remove only after independent verification.
4. Rotate GitHub/Vercel tokens if not yet done (owner action; tokens never lived in this repo).

## Recent handoff notes

- **Phase 9 (2026-09-16):** Installed this agent operating system — `AGENTS.md` (standard entry
  point), 7 Agent Skills in `.claude/skills/`, this `STATE.md`, `docs/08-AGENT-OPERATING-MODEL.md`.
  `agent.md` is now a redirect pointer; AGENTS.md is the single source of truth. `.gitignore`
  fixed so `.claude/skills/` is tracked.
- **Phase 8 (2026-09-16):** Root-caused the "editors squeezed on mobile" catastrophic bug
  (4 editor routes had no container-query context since v3) — one-line fix in `globals.css`;
  added anti-regression triple gate (CI layout guard + 90-check sweep + editor interaction tests).
- **Phase 7 (2026-09-16):** Production-readiness fixes (build script, PostCSS-strict CSS, TS
  errors), first repo push, Vercel live.

## Environment notes

- Bun runtime; `bun install` then `bun run dev` on `:3000` (redirects to `/ar`).
- Sandbox workspace (if working in the original environment): live source in `src/` + `packages/`,
  byte-identical delivery copy in `download/nasaq-ai/`, cumulative `worklog.md` at root,
  deploy tokens in `scripts/.deploy.env` (never committed). Keep copies synced with `diff -r`.

---

*Update this file before you end your session. The next agent depends on it.*
