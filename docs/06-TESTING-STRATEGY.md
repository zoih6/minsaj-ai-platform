# Nasaq AI — Testing & Quality Strategy

| | |
|---|---|
| **Document ID** | NASAQ-QA |
| **Version** | 1.0 — 2026-09 |
| **Status** | Active |
| **Related** | `01-PRD.md` (DoD §16) · `02-UX-SPECIFICATION.md` · `07-ROADMAP.md` |

---

## 1. Quality Gates

Every change must pass, in order:

1. **Lint gate** — `bun run lint` with zero errors.
2. **Render gate** — no console errors / page errors on touched routes (dev log + browser console).
3. **Responsive gate** — the sweep in §2 shows zero horizontal overflow and correct sidebar modes.
4. **Interaction gate** — shell journeys (§3) still pass on touched surfaces.
5. **Visual gate** — VLM-assisted review of touched pages ≥ 9/10 with no overlap/occlusion findings.
6. **Truth gate** — no new wording that implies execution without execution (spot check on changed copy).

## 2. Responsive Verification Matrix

Automated browser-driven checks (the standard that caught and closed the v4/v5 defect classes):

| Dimension | Values |
|---|---|
| Viewports | **375** (mobile) · **768** (tablet) · **1440** (desktop) — extended set 320/430/834/1024/1536/1920 on demand |
| Routes | All 21 app routes + marketing (ar & en) |
| Assertions per route × viewport | ① `document.scrollWidth === window.innerWidth` (no horizontal overflow) ② expected `data-sidebar` mode ③ no element overlaps in primary content region (`getBoundingClientRect` intersections on key pairs: nav/profile, dialogs/tab-bar, toasts/tab-bar) ④ touch targets ≥ 44 px on interactive elements in core paths |

**Release bar: 100% of checks green** (current baseline: 63/63).

## 3. Interaction Test Suite (shell journeys)

1. **Drawer (mobile)**: open → backdrop tap closes · `Escape` closes · route change closes · scroll-locked body.
2. **Rail (tablet)**: expand → overlay mode (main not pushed) · backdrop closes · collapse returns to rail.
3. **Desktop toggle**: brand-row collapse `expanded ↔ rail` · persists across reloads (localStorage) · icon mirrors in RTL.
4. **Advanced groups (drawer)**: expanding "advanced tools" scrolls into view; profile footer stays visible (regression test for the v5 overlap fix).
5. **Command palette**: `⌘K` opens · bilingual search · `Escape` closes · focus returns to trigger.
6. **Dialog layering**: workspace dialogs sit above tab bar (z-ladder assertions).
7. **Toasts**: render above the mobile tab bar (`--nq-tabbar-reserve` offset) and never cover tab icons.

## 4. State Coverage (UX-003 / DoD #2-5)

For each mandatory surface (Library, Projects, Project detail, workspace stages, Runs) verify the existence and quality of: loading skeleton · empty state with actionable CTA · error state (5-part contract) · success confirmation · partial badge behavior. Currently exercised via demo scenarios; move to scripted checks per surface in R1 (see Roadmap).

## 5. Accessibility Checks (per release, core paths)

- Keyboard-only walk of: home → workspace stage → save → library → resume.
- Focus visible on all interactives (visual pass + `:focus-visible` presence).
- Screen-reader smoke: landmarks, aria-labels on icon-only controls, live regions announce save/error.
- 200% zoom on 3 core pages — no overflow, no overlap.
- `prefers-reduced-motion` — reveals/ambient disabled.
- Formal standard (WCAG level) — pending Open Question #13; run against AA assumptions meanwhile.

## 6. Performance Budgets (frontend phase)

| Metric | Budget (mobile, throttled) | Notes |
|---|---|---|
| First render of route shell | ≤ 1.5 s | Turbopack dev target; production budgets tighten at build phase |
| Route transition to interactive | ≤ 300 ms | in-app navigation |
| Font blocking | **0** | self-hosted, swap, preloaded subsets |
| Client JS per route | ≤ 250 KB gz (goal) | enforced via dynamic imports for heavy editors/charts |
| Layout shift (CLS) on load | ≈ 0 | skeletons match final geometry |

Measured via browser timings during the verification sweep; regressions > 20% block release.

## 7. Truth & Simulation Audits

- Grep-level audit: no new user-visible "executed/searched/saved" wording outside i18n truth vocabulary.
- Demo scenarios must emit receipts (what ran / what didn't) — spot-check per workspace.
- Cost/usage displays stay "estimated/demo" until real billing data (TRUTH-008).

## 8. Test Pyramid (current phase)

| Level | Status | Tooling |
|---|---|---|
| Static types | ✅ enforced | TS strict + zod contracts |
| Lint | ✅ enforced | ESLint (Next + TS rules) |
| Browser interaction | ✅ per release | agent-browser scripted journeys |
| Visual QA | ✅ per release | VLM-assisted screenshot review |
| Unit (pure logic: plans/ids/clock) | ◻ R1 | bun test on `@nasaq/mock-api` |
| Component tests | ◻ R1 (key components only) | selectively, where logic is non-trivial |
| E2E golden replays | ◻ backend kickoff | scenario plans as fixtures |

**Philosophy**: heavy automated UI testing is deferred until journeys stabilize in R1; contract schemas and deterministic scenario plans are the test substrate that carries forward to the backend phase.

## 9. Release Checklist

1. All gates §1 green · 2. CHANGELOG updated (Arabic, phase-numbered) · 3. Docs updated where behavior changed · 4. Zip packaged with in-zip import verification (the v4 lesson) · 5. Delivery folder byte-identical to source · 6. Preview server smoke on port 3000 · 7. Worklog appended.
