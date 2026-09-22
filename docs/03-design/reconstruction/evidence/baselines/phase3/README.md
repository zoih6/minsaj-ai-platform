# Phase 3 Baseline — Chrome

**Date:** 2026-09-22 · **Commits:** authorization record `d7b8c47` (§7.4) + Phase 3 implementation
**Exit-gate record:** conditional approval `§7.5` — the closure condition (dock non-occlusion) is executed and recorded below (`dock-occlusion-probe.json`, same session).
**Reference baseline:** `../phase2/` (frozen, never overwritten — owner constraint §7.2/§7.3/§7.4/§7.5)
**Scope executed:** single-row 56px header on every `/app/*` route (NAV-01/NAV-03) · one floating dock grammar (NAV-04) · drawer tiering T1–T4 (NAV-05) · vertical-budget enforcement (NAV-02).

## Closure condition (§7.5) — Mobile-Dock non-occlusion scroll test — EXECUTED 2026-09-22

The owner's condition: *"it must be verified that the Mobile Dock does not occlude the last interactive content — especially on Settings and the other phone pages — with the scroll test result recorded."*

**Method** (`scripts/visual-qa/dock-occlusion-probe.mjs`): every `/app/*` route (19) loads in a phone context, scrolls to the **absolute document bottom in stages** (25/50/75/100% — fires every scroll-reveal observer), then measures the dock rect against every interactive element inside `#main-content` (`a[href]`, `button`, `input`, `select`, `textarea`, `[tabindex]`). An element counts as occluded only if its rect **intersects** the dock **and** the center hit-test of the intersection zone (`document.elementFromPoint`) does not return the element's own subtree. The bottom-most interactive element and its clearance gap to the dock's top edge are recorded per cell.

| Pass | Cells | Result |
|---|---|---|
| All routes × 390/375/360 (light, ar RTL) | 18 × 3 = 54 | 54 PASS — 0 occluded, all at absolute bottom |
| **Settings — every one of the 7 sections** × 390/375/360 | 21 | 21 PASS — last interactive per section («حفظ التغييرات» / «حفظ التفضيلات» / «حفظ السياسة» / provider row actions / «مراجعة وتوصيل» / «مراجعة الأثر» / «عرض الحدث») clears the dock by 35–241px |
| Dark theme (colorScheme: dark) — settings 7 sections + settings/chat/home/library/models @390 | 12 | 12 PASS |
| en LTR — settings 7 sections + chat/home/library/models @390 | 11 | 11 PASS |
| **Total** | **98** | **98 PASS · 0 errors · 0 occluded elements · min clearance gap 21.9px (library@375)** |

**Evidence:** `dock-occlusion-probe.json` (full per-cell census: dock rect, scroll proof `scrollY === maxScroll`, interactive counts, occlusion checks, last-interactive identity + gap) + `screenshots/dock-occlusion/` (the 7 settings sections + home + chat parked at full bottom @390).

Two honest observations recorded (NOT occlusion failures — the dock never covers interactive content anywhere):

- `knowledge@{390,375,360}`: the last interactive element sits ~1215px above the document bottom (a long non-interactive tail below the collections list). Flagged for the owner under the still-open **D-3/UNC-01** context — no claim made here.
- `team@{390,375,360}`: same shape, ~472px non-interactive tail. Noted for Phase 4+ pattern work.

**Verdict: CONDITION MET — Phase 3 closed. Phase 4 (Patterns) authorized per §7.5.**


## What this folder holds

| File | Content |
|---|---|
| `capture-aggregate.json` | 100 cells (20 routes × 5 viewports), same measurement function as the audit, Phase 0/1/2 |
| `g7-baseline.json` | G-7 census at Phase 3 close |
| `nav-probe-before.json` | the Phase 3 defect-class probe against the Phase 2 build (worktree @ `edc4c01`, port 3101) |
| `nav-probe-after.json` | the same probe against the Phase 3 build |
| `drawer-390.json` | the standard capture's drawer probe (frozen method) |
| `dock-occlusion-probe.json` | **§7.5 closure condition**: 98-cell dock non-occlusion scroll test (all routes × 390/375/360 + settings 7 sections × 3 viewports + dark + en LTR) — 98 PASS, 0 occluded, min gap 21.9px |
| `screenshots/dock-occlusion/` | full-bottom scroll shots: the 7 settings sections + home + chat @390 |
| `screenshots/` | after-shots of the unified chrome (home/chat/settings/agents @390 + drawer + home/settings @1440) |

Probe script: `scripts/visual-qa/nav-probe.mjs` (header architecture + budget + identity + dock dialect per route family) + `scripts/visual-qa/nav-edge-probe.mjs` (dark / LTR / 360 / 375 / fc-dark edge cases).

## Target findings — measured resolution

### NAV-01 (P1) — dual header architecture → one 56px row

| Measurement (nav-probe @390, 10 routes) | Phase 2 | Phase 3 | Rule |
|---|---|---|---|
| distinct topbar heights | **[109, 65]** (standard two-row vs focus-canvas) | **[56]** | R-NAV-1 |
| cells with a second (search) row | 6 of 10 | **0** | NAVIGATION-ARCHITECTURE §2 |
| topbar background alpha | 0.78 glass / 0.60 fc | **0.95 near-solid** (light+dark, computed) | R-NAV-7 / D-1 |
| topbarH across the 95 app cells (capture) | 61–109px by band/route | **56px everywhere** | B-5 |

### NAV-02 (P1) — vertical budget → ≤15.5% declared and enforced

| Measurement | Phase 2 | Phase 3 | Gate B-5 |
|---|---|---|---|
| chromeRatio @390 (95 app cells) | 15.5–21.2% (max on standard routes) | **14.5% uniform** | ≤ 15.5% ✓ |
| chromeRatio @430 | 14.1–19.0% | **13.1% uniform** | ≤ 14.5% ✓ |
| Chrome composition @390 | 109px topbar + 70px bar | **56px header + 66px dock** (incl. hairline) | ≤ 128px declared |

### NAV-03 (P2) — identity announced twice → mark only in L1

| Measurement | Phase 2 | Phase 3 | Rule |
|---|---|---|---|
| cells where header title === page h1 | 4 of 10 probed (all standard routes) | **0** | R-NAV-3 |
| header content | menu + active page label + adaptive chip + demo badge | **menu + workspace mark** (logomark <768, + wordmark ≥768) | L1 closed list |

### NAV-04 (P2) — two dock dialects → one floating dock

| Measurement | Phase 2 | Phase 3 | Rule |
|---|---|---|---|
| distinct dock grammars @390 | **2** (full-width bar: inset 0/radius 0/bottom 0 vs floating: inset 16/radius 16/bottom 16) | **1** (floating: inset 16 · radius 16 · bottom 16 · one shadow token + one hairline) | R-NAV-4 / D-4 |
| per-route fc overrides in shell.css | 14 rules (themed topbar + dock) | **0** (canvas + content reserve only) | one grammar |
| dock active language | pill+ring (standard) vs glow indicator (fc) vs legacy interaction.css hairline | **primary + soft pill + 3px indicator**, one owner (shell.css) | §5 |

### NAV-05 (P2) — weightless drawer → four weighted tiers

| Measurement (drawer probe @390, rendered `<b>` labels) | Phase 2 | Phase 3 | Spec (§4) |
|---|---|---|---|
| distinct link registers | **1** (`13.5px/550/44px` — all 19 links identical) | **2 weighted** — T1 `13px/600/48px` · T2/T3/T4 `13.5px/500/44px` | tier registers |
| T1 active | same as everything | primary pill + 3px inline indicator | ✓ |
| T2/T3/T4 active | same as everything | soft tint, no pill, no indicator | ✓ |
| utility group | unlabelled, inside the scroll | **labelled «مساحتي», pinned above the profile row, outside the scroll** | ✓ |
| operations tier | always expanded, identical weight | hairline separation + **folds behind its «التشغيل» disclosure on the phone band** (drawer exceeds 80vh), open+inert on sidebar bands | ✓ |
| total destinations | 19 | **19** (nothing lost) | ✓ |

## Capture drift ledger — 401 field diffs vs `../phase2/`, all classified

| Field | Cells | Classification |
|---|---:|---|
| `topbarH` | 95 | **The Phase 3 change itself** — every app cell moves to the single 56px row (61–109 → 56 by band) |
| `chromeRatio` / `contentVisible` | 95 + 95 | follows: content gains the freed chrome height on every route |
| `bottomNavH` | 30 | phone-band cells: full-width bar (70px) → floating dock (66px incl. hairline) |
| `docHeight` (±4px) | 86 | derived — shorter chrome shifts document height; no layout signal |
| `hOverflow` | **0 of 100** | no horizontal scroll anywhere (incl. 360px guard probe and 980-coarse) |
| `tapUnder44` | **0** | zero regressions — touch floors hold (pre-existing counts unchanged) |
| `titleSize` / `cards` / `nestedCards` / `distinctRadius` / `distinctFontSizes` | **0** | Phase 2's surface wins hold untouched; page h1 ramp (HIE-01) stays for its phase |

Edge-case probes (`nav-edge-probe.mjs`): light/dark × ar/en × 390/375/360 — topbar 56px + 0.95 near-solid in both themes, dock inside the frame at every width, locale link folds only below 370px (documented guard), fc-route chrome identical to standard routes in both themes. 980-coarse probe: no overflow, dock hidden (sidebar band).

## G-7 census — Phase 2 → Phase 3 (audit scope)

| Metric | Phase 2 | Phase 3 | Direction |
|---|---:|---:|---|
| raw spacing (distinct) | 198 | **192** | ↓ (dock/header on-scale: space-100/200 replace raw 6/8/9px) |
| raw shadow (distinct) | 63 | **59** | ↓ (bar shadow + fc dock glow die; `--u-shadow-md` token in) |
| undeclared radius (distinct) | 12 | 12 | flat |
| raw font-size (distinct) | 26 | 26 | flat |
| sub-10px text | 0 | **0** | holds |
| UNPAIRED letter-spacing | 0 | **0** | holds |
| legacy token var() refs | 1113 | **1102** | ↓ (`--u-text-sm` left the nav link register) |
| globals.css selectors | 1615 | 1615 | flat |
| component classes (non-mj) | 67 | 67 | frozen — tier registers ride `data-tier` attributes, not new classes |

## Gates

- **Gate A:** production build green · ESLint clean · tsc 0 errors · stylelint 0 errors (952 warnings, warn mode per G-7) · **0 hOverflow ×100 cells** (+360/375/980-coarse probes) · tap floors hold.
- **Gate B (Phase-3 scope):** **B-5 fully measured** — chromeRatio 14.5% @390 / 13.1% @430 on all cells, single header row (56px ×95 cells), dock grammar single (1 signature ×10 routes), page identity announced once (0 duplicated cells). B-1/B-3/B-4 hold with zero diffs (title/cards/nesting untouched); B-9 partial (header/dock never animate on route change — retiming itself stays in Phase 4's bracket).

## Not in Phase 3 (no claims)

- **Route-transition retiming** (240ms, 4px enter offset — INT-02/UNC-02) — Phase 4 per §6, recorded in §7.4.
- **NAV-06 collection-scope half** — the global trigger is now the single icon/inline field (delivered with NAV-01); per-page search-field cleanup stays open.
- **HIE-01** (five h1 sizes) and **VIS-01** (marketing bridge) — later phases; `titleSize` diffs = 0 proves non-interference.
- **The fc canvas fold** (retiring `--fc-*` entirely) — Phase 5; Phase 3 removed only the *chrome* dialects, the workbench canvas and its content-side reserve remain by design.
