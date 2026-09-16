# STATE.md — Living Project State (Agent Handoff Snapshot)

> **Protocol:** this file is the handoff contract between agents. The acting agent MUST update it
> at the end of every task (see `.claude/skills/repo-state-maintenance/SKILL.md`). It is read
> immediately after `AGENTS.md` at session start. Keep it a snapshot — history lives in
> `docs/CHANGELOG.md`, decisions in `docs/08-AGENT-OPERATING-MODEL.md`.

**Last updated:** 2026-09-17 — Phase 11 · **Current version:** v11.0 · **Branch:** `main` (`5741b8f`)

## Current status

- **Live:** <https://nasaq-ai-platform.vercel.app> (auto-deploys on push to `main`)
- **Repo:** <https://github.com/zoih6/nasaq-ai-platform>
- 11 delivery phases complete. Phase 11: **portaled-dialog mobile fix + portal/container
  isolation architecture** — the "خصّص تجربتك" dialog (and 3 more dialog families) had dead
  mobile rules (trapped in `@container` while `<Dialog.Portal>` mounts outside every container);
  all portaled dialogs are now phone bottom sheets, a NEW CI gate blocks the pattern forever,
  and the sweep grew a dialog-geometry sentinel.
- Frontend-complete for current scope; backend not yet connected (mock API in place).

## Quality gates (last verified: Phase 11, 2026-09-17)

| Gate | Status |
|---|---|
| `bun run build` (production, Turbopack) | ✅ green (59/59 pages) |
| `bun run lint` (ESLint) | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| Layout guards (`scripts/check-layout-guards.mjs`) | ✅ 24/24 (CI-enforced) |
| **Portal/container isolation** (`scripts/check-portal-container-isolation.py`) | ✅ PASS (CI-enforced, NEW in Phase 11) |
| Theme contrast guard (`scripts/check-theme-contrast.mjs`) | ✅ all pairs AA (CI-enforced) |
| **Dialog-aware sweep** (`scripts/verify-sweep-v11.sh`) | ✅ 182/182 (30 routes × 3 viewports × 2 themes + 2 dialog sentinels) |
| Live production dialog check (Vercel, 390px) | ✅ bottom sheet verified on `main` deployment |
| CI (GitHub Actions) | ✅ green on `main` (`5741b8f`) |

## Portal/container isolation (NEW — Phase 11 architecture)

- **The rule (AGENTS.md hard rule 5):** anything rendered through `<Dialog.Portal>` /
  `createPortal` mounts into `document.body` — OUTSIDE every `@container` context — so its
  responsive rules MUST live in viewport `@media` blocks, never inside `@container`.
- **Affected classes (all fixed in v11):** `.adaptive-dialog` (home), `.form-dialog`,
  `.approval-dialog`, `.compare-dialog`, `.usage-event-dialog` + their child selectors.
- **Phone pattern (unified):** bottom sheet — `inset: auto 0 0; transform: none; width: 100%`,
  `max-height: calc(100dvh - 12px)`, safe-area padding, sticky action rows, top-only radius.
- **Guard:** `scripts/check-portal-container-isolation.py` in CI (comment-stripping aware —
  don't mention `@container` in CSS comments unless you strip them; the script already does).
- **Layering gotcha (v11 lesson):** the "premium enhancement layer" late in `globals.css`
  re-sets `border-radius: 20px` on dialogs — the consolidated V11 phone layer is deliberately
  the LAST block in `globals.css` and uses `[role="dialog"]` specificity so it always wins.
  Keep it last.

## Open items / next steps (priority order)

1. **M4 — Session-journey depth** (`docs/07-ROADMAP.md`): intent routing from home
   (FR-ASK-003..007); save-to-library → resume flow (US-004..006).
2. **Backend integration** per `docs/05-BACKEND-INTEGRATION-READINESS.md` (ServiceProvider seam;
   contracts ready in `packages/contracts`).
3. **Dependency cleanup opportunity:** `prisma`, `next-auth`, `framer-motion`, `zustand`,
   `@tanstack/*`, `z-ai-web-dev-sdk` remain installed with zero imports (kept deliberately for
   bun.lock stability). Remove only after independent verification. `next-themes` is USED (theme system).
4. Rotate GitHub/Vercel tokens if not yet done (owner action; tokens never lived in this repo).
5. Sandbox-only note: `skills/` (platform artifacts, untracked) is now in `tsconfig` exclude —
   local builds match CI again.

## Recent handoff notes

- **Phase 11 (2026-09-17):** Root-caused the "خصّص تجربتك not built for mobile" report to the
  portal/container mismatch — a SYSTEMIC pattern (4 dialog families affected), not one dialog.
  Fixed all of them as unified bottom sheets; found & killed a second latent bug (premium layer
  overriding sheet radius) during verification; added CI isolation gate + v11 sweep sentinel;
  verified live on production Vercel at phone size. **Sandbox incident:** an over-aggressive
  workspace→GitHub sync deleted an unpushed local v11 working copy (the owner had seen
  `download/nasaq-ai-frontend-v11.zip`); it was fully rebuilt from the v10 remote + the completed
  diagnosis. Lesson absorbed: push to GitHub (source of truth) BEFORE any destructive local
  operation.
- **Phase 10 (2026-09-16):** Dual-theme system — tokenized ~100 hardcoded colors; CI contrast
  guard (fixed 8 real AA failures); VLM dark QA; interaction polish.
- **Phase 9 (2026-09-16):** Agent operating system — `AGENTS.md`, 8 Agent Skills, `STATE.md`.
- **Phase 8 (2026-09-16):** Root-caused the editors-squeezed-on-mobile bug (missing container
  contexts); anti-regression triple gate.

## Environment notes

- Bun runtime; `bun install` then `bun run dev` on `:3000` (redirects to `/ar`).
- Sandbox workspace (if working in the original environment): live source in `src/` + `packages/`,
  delivery zip in `download/nasaq-ai-frontend-v11.zip`, cumulative `worklog.md` at root,
  deploy tokens in `scripts/.deploy.env` (never committed). **Always push to GitHub before
  destructive workspace operations — it is the single source of truth.**

---

*Update this file before you end your session. The next agent depends on it.*
