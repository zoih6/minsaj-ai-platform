# STATE.md — Living Project State (Agent Handoff Snapshot)

> **Protocol:** this file is the handoff contract between agents. The acting agent MUST update it
> at the end of every task (see `.claude/skills/repo-state-maintenance/SKILL.md`). It is read
> immediately after `AGENTS.md` at session start. Keep it a snapshot — history lives in
> `docs/CHANGELOG.md`, decisions in `docs/08-AGENT-OPERATING-MODEL.md`.

**Last updated:** 2026-09-19 — Phase 19 · **Current version:** v19 · **Branch:** `main` (mobile header collapse contract restored post-v18)

## Current status

- **Live:** <https://minsaj-ai-platform.vercel.app> (auto-deploys on push to `main`)
- **Repo:** <https://github.com/zoih6/minsaj-ai-platform> (renamed from `nasaq-ai-platform` in v15 — old URL redirects)
- **Phase 19: home-page top bar fixed on phones — the header-collapse contract dropped in the
  v18 rewrite is restored at the owning layer.** Owner report: «البار العلوي في صفحة الهوم في
  وضع الهاتف ملخبط». At 375px the five inline nav links rendered in one nowrap row spilling
  off-screen (x=-50/-108), «كيف تتكيف؟» wrapped to two lines inflating the pill to 77px, the EN
  toggle was pushed off-screen (x=-176), and the hamburger stayed `display:none` while its sheet
  menu worked fine in the markup. Root cause: v18 moved the marketing viewport ladder from
  responsive.css into marketing.css but silently dropped the three collapse rules
  (`.universal-nav__links{display:none}` · `.universal-menu-button{display:grid}` ·
  `grid-template-columns:1fr 1fr`). Fix: rules restored inside the canonical ≤1180px band in
  marketing.css; the missing `#trust` link was added to the mobile sheet menu (desktop/mobile
  parity). Guard: sweep v12.2 grows 194 → **206 checks** (`marketing_header_check` — collapse/
  expand contract at ar+en @375/768 + ar@1440, touch size ≥44px, nav ≤70px, chrome on-screen,
  and a menu-parity probe), negative-tested against broken production (5/6 fail) and
  positive-tested locally (6/6 pass).
- **Phase 18: «Cinematic Dark» — the marketing site redesigned onto the owner's approved
  concept (dark premium, 3D materiality, orbital motion).** The whole marketing page is now
  DARK-LOCKED: the verified dark token set is scoped to `.universal-site` in marketing.css,
  so the page renders cinematic-dark regardless of the theme toggle (which stays in the app
  shell only). Hero with the generated 3D crystal render framed by orbital rings + particles
  + parallax; weaving-voice headline; scroll-spy nav; demo in its own `#demo` section; glass
  service cards; obsidian-mountain experience render + spec pills; film-grain overlay. KEPT:
  official owner logo, RTL-native header, identity film, no WebGL. responsive.css thinned
  (marketing ladder moved into marketing.css — the migration that dropped the collapse rules
  fixed in Phase 19).
- **Phase 17: logo distortion root-caused and fixed — the mark now renders at the master's
  exact intrinsic ratio everywhere.** Owner report: the header symbol looked stretched/squashed
  vs the original artwork. Root cause: v16's `MinsajMark` flipped the aspect constant's meaning
  (`534/396` w/h) while keeping v15's `h = size × constant` formula (v15's constant was h/w
  `375.9/512`) — the box rendered 34×45.85 (portrait) for a 534×396 landscape master, and
  `background-size: 100% 100%` stretched the art by ratio² ≈ 1.82×, at every breakpoint/theme/
  locale; it also overflowed the 36×36 wrapper vertically. Fix (one line): height now derives
  from the intrinsic h/w (`396/534`) — `size` stays the rendered width (v15 semantics), so the
  box is 34×25.21 at `size={34}`, pixel-identical to the artwork (measured MAE 3.5–4.3/255 vs
  the scaled original across desktop/mobile/light/dark; VLM confirms geometric identity + the
  old rendering was visibly stretched). Header untouched: nav height stable 62px, all controls
  in place, 0 horizontal overflow, RTL/LTR identical. Sweep grew to **v12.1 (194 checks)** with
  a logo sentinel: every `.minsaj-mark` on the marketing header + app sidebar, phone + desktop,
  both themes, must render within ±2% of 534/396 and fit its wrapper.
- **Phase 16: the owner's OFFICIAL logo + identity motion film + backgrounds.** The hand-traced
  symbol is retired — every brand surface now renders the owner's own artwork from the Drive
  master (background-keyed, never redrawn): MinsajMark v2 (CSS-background, theme-aware,
  `data-on-dark` for the obsidian sidebar), new MinsajLogo full-lockup component (footer),
  `src/app/icon.png` + `apple-icon.png` favicons, og-image 1200×630 in metadata. NEW
  `src/components/universal/brand-motion.tsx`: the owner's 8s identity film scroll-scrubbed
  Apple-style (250vh track + sticky 100dvh stage + white brand canvas card + rAF-lerped
  currentTime + every-frame keyframes (-g 1) + iOS play/pause unlock + IO-gated loop +
  pointer parallax + 3 bilingual chapters + RTL progress rail + reduced-motion still).
  Four z-ai-generated backgrounds (hero aurora light/dark, luminous world, digital loom)
  replaced the old jpg; two were regenerated after a first VLM review rejected them.
  QA: VLM 10 panels PASS, DOM-measured scrub (7.93s/8s), no 375px overflow, sweep 186/186.
- **Phase 15: THE BIG REBRAND — «نسق» is now «منسج / Minsaj»** (owner: the old name is not
  exclusive). System-layer rename via protected, ordered rules: `@nasaq/*` → `@minsaj/*`,
  `Nasaq/NASAQ/nasaq` → `Minsaj/MINSAJ/minsaj`, diacritized «نَسَق» then bare «نسق» → «منسج»
  (guarded: «منسّق» coordinator word untouched — 2 legit occurrences remain), CSS vocabulary
  `nq-` → `mj-`, keyframes `nasaq-*` → `mj-*`. New brand asset package built as clean traced
  SVG from the owner's official logo: symbols (5 variants), lockups (3), app icons + favicon
  (light/dark), patterns (weave/grid/ghost × 2 themes) in `public/brand/` — old `nasaq-*`
  assets (23 SVG + jpg) and `upload/design-package/` zips (23MB) deleted. Fonts: IBM Plex
  Sans Arabic → **Tajawal**, IBM Plex Sans → **Inter**. Meta: «منسج — تعلّم، ابحث، اصنع واكتشف» /
  "Minsaj — Learn, research, create, and discover". Repo + Vercel project renamed to
  `minsaj-ai-platform`; live links updated in README/AGENTS/STATE/CHANGELOG; archive references
  to the off-limits old repo `zoih6/nasaq-ai` intentionally preserved.
- 11 delivery phases complete. Phase 11: **portaled-dialog mobile fix + portal/container
  isolation architecture** — the "خصّص تجربتك" dialog (and 3 more dialog families) had dead
  mobile rules (trapped in `@container` while `<Dialog.Portal>` mounts outside every container);
  all portaled dialogs are now phone bottom sheets, a NEW CI gate blocks the pattern forever,
  and the sweep grew a dialog-geometry sentinel.
- **Phase 12 (docs-only, no app code touched): governance law pair** — `ARCHITECTURE-RULES.md`
  (layer/import/ServiceProvider/class rules, with the measured 12-file mock-import debt
  inventory + strangler extraction protocol) and `DESIGN-ENGINEERING-GOVERNANCE.md` (16
  sections: token scales, `mj-*` vocabulary, 18 anti-patterns, visual QA protocol, mandatory
  8-step agent workflow, owner's explicit orders). Both are BINDING (AGENTS.md hard rule 15).
  Decision: hybrid functional-first — NO mandatory OOP layer; classes only with 2+ of
  identity/state/lifecycle/invariants/interchangeability.
- **Phase 14: control-group bars unified on ONE shared primitive — the owner's site-wide
  "التنسيق والتوزيع" report root-caused and fixed at the system layer.** New `mj-control-bar`
  (label/group/tail — labels & tails are NEVER wrapping flex-siblings of chips) + `mj-chip`
  (44px pill, token gaps/type) + `--u-radius-pill` token, in layout.css §12–13. Measured before:
  goals bar 3 stranded rows (126px) on phones, ops toolbars 3 rows of 36/65/18px, filter icon
  floating 18px off-line, gaps 2–9px / radii 0–999px / heights 29–43px off-token, 30/34px touch
  violations. After: 2 composed rows (96px) / one scrollable chip row everywhere, all chips 44px.
  Propagated same-push: adaptive home · ops LibraryToolbar (7 pages) · universal library ·
  u2 chips (learn/research/create) · task-modes · view-switch · catalog/source-type tabs. Sweep
  grew to **v12 (186 checks)** with a controlbar sentinel (single-row groups, ≤100px bars,
  ≥44px chips — non-vacuous). Desktop VLM misread ("tail on second line") disproven by DOM
  measurement — single 46px row, all centers y=302.
- Frontend-complete for current scope; backend not yet connected (mock API in place).

## Quality gates (last verified: Phase 19, 2026-09-19)

| Gate | Status |
|---|---|
| `bun run build` (production, Turbopack) | ✅ green (post-v19) |
| `bun run lint` (ESLint) | ✅ 0 errors (post-v19) |
| `npx tsc --noEmit` | ✅ 0 errors (post-v19) |
| Layout guards (`scripts/check-layout-guards.mjs`) | ✅ 24/24 (CI-enforced) |
| Portal/container isolation (`scripts/check-portal-container-isolation.py`) | ✅ PASS (CI-enforced) |
| Theme contrast guard (`scripts/check-theme-contrast.mjs`) | ✅ **46 pairs** AA both themes |
| Dialog-aware sweep (`scripts/verify-sweep-v12.sh`) | ✅ **206/206** (v12.2: NEW marketing-header collapse/parity sentinel — negative-tested vs broken prod 5/6 fail, local 6/6 pass) |
| Live dark-mode spot checks (P0-1 fix) | ✅ models + projects pills now #262B52 + white (13.5:1) |
| Icon scale guard (`scripts/check-icon-scale.mjs`) | ✅ PASS (94 files, ladder 12/14/16/18/20/24 + brand 28/34/46) |
| CI (GitHub Actions) | ✅ green on `main` |

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

0. **Deferred minor (from Phase 14 audit):** flow-canvas-toolbar buttons are 29px tall
   (below the 44px touch floor) — editor utility bar, height change affects canvas
   layout; normalize in a focused editor pass. `.universal-library-new` still carries
   gap 7px/radius 11px literals (adjacent to, but not part of, the control-bar family).

1. ~~B1–B3 (color unification · responsiveness · icons)~~ — **EXECUTED in v13.1** (see Current
   status); kept here only as pointer. Remaining follow-ups live in item 0 above.
2. **M4 — session-journey depth** (FR-ASK-003..007; US-004..006) — runs in
   parallel; new data access via existing chokepoints only.
3. **DEFERRED → backend kickoff — ServiceProvider extraction** (owner decision
   2026-09-17): plan frozen in `ARCHITECTURE-RULES.md` §4.

## Recent handoff notes

- **Phase 15 (2026-09-18):** The big rebrand. Rename was executed by an ordered, protected
  substitution script (`big-rename.py`, kept outside the repo) with assertions — remaining
  brand tokens outside guarded historical references: ZERO. `node_modules/@nasaq` stale
  symlinks removed and everything re-verified: guards 4/4, lint 0, tsc 0, build green, sweep
  v12 186/186. Repo + Vercel project renamed `nasaq-ai-platform` → `minsaj-ai-platform`
  (GitHub redirects the old URL; Vercel default domain now `minsaj-ai-platform.vercel.app`).
  Historical archive pointers (`zoih6/nasaq-ai` old repo — strictly off-limits; delivery zip
  names) intentionally NOT rewritten: they are facts about the past, not live config.

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
