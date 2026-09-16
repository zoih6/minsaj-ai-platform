# STATE.md — Living Project State (Agent Handoff Snapshot)

> **Protocol:** this file is the handoff contract between agents. The acting agent MUST update it
> at the end of every task (see `.claude/skills/repo-state-maintenance/SKILL.md`). It is read
> immediately after `AGENTS.md` at session start. Keep it a snapshot — history lives in
> `docs/CHANGELOG.md`, decisions in `docs/08-AGENT-OPERATING-MODEL.md`.

**Last updated:** 2026-09-17 — Phase 13 · **Current version:** v13.0 · **Branch:** `main`

## Current status

- **Live:** <https://nasaq-ai-platform.vercel.app> (auto-deploys on push to `main`)
- **Repo:** <https://github.com/zoih6/nasaq-ai-platform>
- 11 delivery phases complete. Phase 11: **portaled-dialog mobile fix + portal/container
  isolation architecture** — the "خصّص تجربتك" dialog (and 3 more dialog families) had dead
  mobile rules (trapped in `@container` while `<Dialog.Portal>` mounts outside every container);
  all portaled dialogs are now phone bottom sheets, a NEW CI gate blocks the pattern forever,
  and the sweep grew a dialog-geometry sentinel.
- **Phase 12 (docs-only, no app code touched): governance law pair** — `ARCHITECTURE-RULES.md`
  (layer/import/ServiceProvider/class rules, with the measured 12-file mock-import debt
  inventory + strangler extraction protocol) and `DESIGN-ENGINEERING-GOVERNANCE.md` (16
  sections: token scales, `nq-*` vocabulary, 18 anti-patterns, visual QA protocol, mandatory
  8-step agent workflow, owner's explicit orders). Both are BINDING (AGENTS.md hard rule 15).
  Decision: hybrid functional-first — NO mandatory OOP layer; classes only with 2+ of
  identity/state/lifecycle/invariants/interchangeability.
- Frontend-complete for current scope; backend not yet connected (mock API in place).

## Quality gates (last verified: Phase 13, 2026-09-17)

| Gate | Status |
|---|---|
| `bun run build` (production, Turbopack) | ✅ green (59/59 pages) |
| `bun run lint` (ESLint) | ✅ 0 errors |
| `npx tsc --noEmit` | ✅ 0 errors |
| Layout guards (`scripts/check-layout-guards.mjs`) | ✅ 24/24 (CI-enforced) |
| Portal/container isolation (`scripts/check-portal-container-isolation.py`) | ✅ PASS (CI-enforced) |
| Theme contrast guard (`scripts/check-theme-contrast.mjs`) | ✅ **46 pairs** AA both themes (now comment-stripping + 4 new inverse-surface pairs) |
| Dialog-aware sweep (`scripts/verify-sweep-v11.sh`) | ✅ 182/182 (+ en-locale run 182/182 during the audit = 364 total) |
| Live dark-mode spot checks (P0-1 fix) | ✅ models + projects pills now #262B52 + white (13.5:1) |
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

## Open items / next steps (priority order — from docs/AUDIT.md)

1. **B1 — color unification** (the big one, 3 batches): migrate 1150 legacy var
   usages → `--u-*` (1022 of them in globals.css); tokenize the 567 hardcoded
   colors; delete the 124-token legacy bridge; rebuild dark on value-swapping
   only (remove the 28 per-element `[data-theme=dark]` overrides). Baseline:
   `scripts/audit-scan.py` (re-run after each batch).
2. **B2 — responsiveness**: globals in-flow @media patches (~70 selectors at
   1120/840/820/680/620) → container bands; `100vh`→`100dvh` ×8; close the 7
   drift container bands (560/720/840/900/980/1080/1120); decision needed on
   marketing art-direction (container context or documented exception).
   NEVER touch shell 768/1024/1440 or portaled 640/430.
3. **B3 — icons**: normalize 22 sizes → sanctioned 12/14/16/18/20/24 (touch-a-
   surface-normalize rule, DEG §12.1).
4. **B4 — UI vocabulary**: unify bottom-nav active state (pill vs color-only),
   selection states, card gradient language; document an extended z-ladder.
5. **B5 — accessibility polish**: dark borders/elevation depth, home
   placeholder tone, research input/chips (VLM findings in AUDIT.md §4).
6. **M4 — session-journey depth** (FR-ASK-003..007; US-004..006) — runs in
   parallel; new data access via existing chokepoints only.
7. **DEFERRED → backend kickoff — ServiceProvider extraction** (owner decision
   2026-09-17): plan frozen in `ARCHITECTURE-RULES.md` §4.

## Recent handoff notes

- **Phase 13 (2026-09-17):** Comprehensive visual/design audit (docs/AUDIT.md — owner's
  spec: prioritized حاجز/مهم/تحسين with evidence). Measured: 1150 legacy var uses (89% in
  globals.css), 567 hardcoded colors in rules, 28 per-element dark overrides, 30 width
  thresholds (19 @media + 11 container), 100vh×8, 22 icon sizes. **Flagship verified defect
  (P0-1):** `--forest` bridge maps to `--u-ink` → white text on light pill in dark mode
  (1.15:1) on 10 interactive patterns — confirmed live on 2 pages, root-caused end-to-end.
  **Fixed same-day:** new `--u-inverse-surface`/`-hover`/`--u-on-inverse` tokens (correct
  role, both themes), 10 rules migrated, contrast guard extended to 46 pairs AND made
  comment-stripping (a `--token:` inside a CSS comment used to NaN the parser). Audit
  methodology note: VLM claims were each verified by DOM/pixels — one survived (the pill),
  one was rejected ("white bottom bar" = misread). Ops lesson: running `next build` while
  the dev server runs clobbers shared `.next` → restart dev before sweeping.
- **Phase 12 (2026-09-17):** Owner asked for permanent anti-mess governance after confirming the
  v11 dialog fix works. Wrote the binding law pair at repo root: `ARCHITECTURE-RULES.md`
  (hybrid functional-first MADR — explicitly NO mandatory OOP; layer map to as-built folders;
  one-way import law; ServiceProvider seam with the measured 12-file direct-import inventory
  split into A client-construction / B snapshots / C stranded domain helpers, strangler
  protocol, done-when criterion; class-justification checklist requiring 2+ of identity/state/
  lifecycle/invariants/interchangeability — Run yes, Button never) and
  `DESIGN-ENGINEERING-GOVERNANCE.md` (16 sections + token quick-reference + the owner's
  explicit 8 orders; philosophy "fix the system that produced the problem"; measured icon
  debt: 12 sizes; third-patch rule; forbidden workflow "see problem → patch CSS → next" banned).
  Wired into AGENTS.md (read order, repo map, hard rule 15, doc map) + docs/README. Review
  citations now use ARCH-§n / DEG-§n. Docs-only phase: zero app-code changes, gates untouched.
- **Phase 12.1 (2026-09-17, same day):** Owner scoped the frontend phase and decided the
  ServiceProvider extraction is **deferred to backend kickoff** (frontend-only code, but its
  value needs a real backend). Recorded in ARCH §4 (scheduling note + freeze), AGENTS rule 15
  (chokepoint routing for new data access), and this file. Also corrected a measurement slip
  found on re-verification: the debt is **12 files / 13 import statements** (one file has two
  imports), not 13 files.
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
  delivery zip in `download/nasaq-ai-frontend-v12.zip`, cumulative `worklog.md` at root,
  deploy tokens in `scripts/.deploy.env` (never committed). **Always push to GitHub before
  destructive workspace operations — it is the single source of truth.**

---

*Update this file before you end your session. The next agent depends on it.*
