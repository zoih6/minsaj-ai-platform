# STATE.md — Living Project State (Agent Handoff Snapshot)

> **Protocol:** this file is the handoff contract between agents. The acting agent MUST update it
> at the end of every task (see `.claude/skills/repo-state-maintenance/SKILL.md`). It is read
> immediately after `AGENTS.md` at session start. Keep it a snapshot — history lives in
> `docs/CHANGELOG.md`, decisions in `docs/08-AGENT-OPERATING-MODEL.md`.

**Last updated:** 2026-09-16 — Phase 10 · **Current version:** v10.0 · **Branch:** `main`

## Current status

- **Live:** <https://nasaq-ai-platform.vercel.app> (auto-deploys on push to `main`)
- **Repo:** <https://github.com/zoih6/nasaq-ai-platform>
- 10 delivery phases complete. Phase 10: **dual-theme system (light/dark)** — device-follow
  (`prefers-color-scheme`) + 3-state manual toggle (light → dark → system), full token
  architecture, WCAG AA contrast guard in CI, site-wide UI polish, zero hardcoded light colors.
- Frontend-complete for current scope; backend not yet connected (mock API in place).

## Quality gates (last verified: Phase 10, 2026-09-16)

| Gate | Status |
|---|---|
| `bun run build` (production, Turbopack) | ✅ green |
| `bun run lint` (ESLint) | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| Layout guards (`scripts/check-layout-guards.mjs`) | ✅ 24/24 pages in container context (CI-enforced) |
| **Theme contrast guard** (`scripts/check-theme-contrast.mjs`) | ✅ all pairs AA in light + dark (CI-enforced, NEW in Phase 10) |
| **Theme-aware sweep** (`scripts/verify-sweep-v10.sh`) | ✅ 180/180 (30 routes × 3 viewports × 2 themes, `data-theme` verified) |
| Editor interactions (mobile) | ✅ pass (unchanged by theming) |
| Hydration / console errors | ✅ zero |
| CI (GitHub Actions) | ✅ green on `main` |

## Theme system (NEW — Phase 10 architecture)

- **Engine:** `next-themes` via `src/components/theme/theme-provider.tsx` —
  `attribute="data-theme"`, `defaultTheme="system"`, `disableTransitionOnChange` (FOUC-safe).
- **Toggle:** `src/components/theme/theme-toggle.tsx` — 3-state cycle (light → dark → system),
  mounted in app topbar + marketing nav, localized AR/EN aria-labels, hydration-safe via
  `useSyncExternalStore` (never `setState`-in-effect).
- **Tokens:** `foundations.css` — light in `:root`, dark in `:root[data-theme="dark"]`
  (+ dark service hues + `:root[data-theme="dark"] .component` one-off overrides in
  marketing/home/library/globals). Semantic surface tokens: `--u-glass/-strong/-line`,
  `--u-veil`, `--u-raise`, `--u-hover-veil`, `--u-field`, `--u-tint-1`, `--u-artboard`,
  `--u-control-line`. **Rule 12 in AGENTS.md: no hardcoded colors, ever.**
- **Skill:** `.claude/skills/theming-and-contrast/SKILL.md` (load before touching any color).

## Open items / next steps (priority order)

1. **M4 — Session-journey depth** (`docs/07-ROADMAP.md`): intent routing from home
   (FR-ASK-003..007); save-to-library → resume flow (US-004..006).
2. **Backend integration** per `docs/05-BACKEND-INTEGRATION-READINESS.md` (ServiceProvider seam;
   contracts ready in `packages/contracts`).
3. **Dependency cleanup opportunity:** `prisma`, `next-auth`, `framer-motion`, `zustand`,
   `@tanstack/*`, `z-ai-web-dev-sdk` remain installed with zero imports (kept deliberately for
   bun.lock stability). Remove only after independent verification. `next-themes` is USED (theme system).
4. Rotate GitHub/Vercel tokens if not yet done (owner action; tokens never lived in this repo).

## Recent handoff notes

- **Phase 10 (2026-09-16):** Dual-theme system — 14-query web research (next-themes standard,
  MD3/Apple HIG dark guidance, WCAG, FOUC, 3-state toggle UX, design tokens); tokenized ~100
  hardcoded light colors across all 11 CSS layers; NEW CI contrast guard (caught & fixed 8 real
  AA failures incl. pre-existing light-theme ones: faint, mint/amber/cyan, primary buttons);
  VLM-driven dark QA (8-10/10, fixed white-pill CTA + profile avatar); R2 interaction polish
  (theme icon animation, radius-following focus rings, `prefers-contrast: more` support).
- **Phase 9 (2026-09-16):** Installed this agent operating system — `AGENTS.md` (standard entry
  point), Agent Skills in `.claude/skills/` (now 8), this `STATE.md`, `docs/08-AGENT-OPERATING-MODEL.md`.
- **Phase 8 (2026-09-16):** Root-caused the "editors squeezed on mobile" catastrophic bug
  (4 editor routes had no container-query context since v3) — one-line fix in `globals.css`;
  added anti-regression triple gate (CI layout guard + sweep + editor interaction tests).

## Environment notes

- Bun runtime; `bun install` then `bun run dev` on `:3000` (redirects to `/ar`).
- Sandbox workspace (if working in the original environment): live source in `src/` + `packages/`,
  byte-identical delivery copy in `download/nasaq-ai/`, cumulative `worklog.md` at root,
  deploy tokens in `scripts/.deploy.env` (never committed). Keep copies synced with `diff -r`.

---

*Update this file before you end your session. The next agent depends on it.*
