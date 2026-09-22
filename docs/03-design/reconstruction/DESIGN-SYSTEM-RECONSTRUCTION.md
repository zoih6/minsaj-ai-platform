# DESIGN-SYSTEM-RECONSTRUCTION.md — Master Document
## W-DS · Rebuilding Minsaj as one designed product
### Status: **APPROVED** — owner approval recorded 2026-09-22 (§7.1). **Phase 0 complete** (commit `3508d48`). **Phase 1 (Foundations) implemented + measured 2026-09-22 (§7.2): TYP-02 and TYP-03 resolved through Gate A + Gate B with new measurements (evidence/baselines/phase1/); SPC-01 begun. Phase 1 exit gate approved 2026-09-22; Phase 2 (Surfaces) authorized (§7.3) and implemented + measured the same day: HIE-02, SUR-01 and HIE-03 resolved through Gate A + Gate B with new measurements (evidence/baselines/phase2/). Phase 2 exit gate approved 2026-09-22 (§7.4); **Phase 3 (Chrome) authorized to start now.** No finding may be marked resolved before Gate A + Gate B pass with new measurements. W-4 remains blocked until W-DS exit criteria are met.

> **Note on naming.** The owner's review refers to the product as **"Nasaq"**; this repository and its brand assets name it **Minsaj (منسج)**. Both names refer to the same product. This document set uses the repository name.
>
> **Language.** This set is written in English by the owner's explicit instruction (consumed by AI agents and developers). It is the documented exception to the repo's Arabic-documents rule.

---

## 1. What this phase is, and is not

W-DS is a **documents-only phase**. It converts the owner's verdict — *"the app works, but does not look designed as one platform"* — into an implementable system, and it proves with measurements where the interface violates that system today. The prior engineering audit (W-3.5) stands untouched: its conclusions (build/lint/types/contrast/touch/overflow all green; 9/12 VLM claims were hallucinations; P-1 real and fixed) are inputs here, not targets. This audit answers the question the engineering audit never asked: **does the product read as one deliberately designed system?** Measured answer today: **no** — and this document set specifies exactly how it becomes yes.

**The deliverable set (this folder):**

| File | Role |
|---|---|
| `DESIGN-SYSTEM-RECONSTRUCTION.md` | This master: diagnosis, system map, references, implementation order, approval protocol |
| `DESIGN-PRINCIPLES.md` | The ten non-negotiable principles (P1–P10) behind every rule |
| `DESIGN-TOKENS.md` | The executable token contract (A1/A2/B-slot layers, six-question admission, rejected list) |
| `COMPONENT-INVENTORY.md` | Census of the 7 dialects, duplication map, target primitives, migration table |
| `NAVIGATION-ARCHITECTURE.md` | Layer model, 390px vertical budget, weighted drawer IA, search scopes |
| `RESPONSIVE-ARCHITECTURE.md` | Composition per band, never-scale rule + pointer guard, Arabic/RTL requirements |
| `PAGE-PATTERNS-AND-MOTION.md` | The 8 page templates, progressive-disclosure law, motion contract |
| `VISUAL-QA-CHECKLIST.md` | The two-gate protocol (engineering + visual quality) at 5 viewports |
| `UI-UX-AUDIT-MATRIX.csv` | 37 evidence-backed findings, classified and prioritized |
| `USAGE.md` | Agent-facing read order (OpenDesign-style router) |
| `evidence/` | Measurements (JSON with selectors), screenshots, perceptual pass records |

## 2. Methodology — how the diagnosis was produced

1. **Inventory.** All 37 routes enumerated from `information-architecture.md` §3 (never guessed); 20 primary routes audited; every element type catalogued with file paths (`COMPONENT-INVENTORY.md` §3).
2. **Measurement pass.** 100 captures (20 routes × 5 viewports: 390/430/768/1024/1440) + supplementary probes (drawer, command palette, desktop-mode-on-phone at 980px coarse, header comparison, knowledge stats card). Every number carries a selector/DOM path (`evidence/measurements`).
3. **CSS forensics.** Selector/value census across the 14 universal layers + `globals.css`: 186 distinct raw paddings, 71 shadows, 23 radii, 23 font sizes, 364 hex colors, 7 dialects.
4. **Perceptual pass.** Designer-eye review (VLM) of full-size and 55%-thumbnail captures, judging hierarchy/rhythm/surfaces/chrome weight — **perceptual claims only**, each tied to a measurement; never used for technical assertions, and DOM never used to *deny* a perceived quality problem.
5. **Classification.** Every owner observation treated as a hypothesis: verified, measured, classified (`confirmed-bug / design-system-inconsistency / ux-problem / subjective-refinement / unconfirmed-pending-owner`) — never deleted, never promoted without evidence.

## 3. Visual diagnosis

### 3.1 The equation, restated with numbers

The owner's formulation — *correct components + many functions + attractive colors + partial responsiveness − strict design system − hierarchy − spacing discipline − visual IA − responsive composition − surface hierarchy* — is measurably accurate:

| Layer | Passes (engineering) | Fails (system coherence) — matrix ref |
|---|---|---|
| Navigation | 19 destinations all reachable; ⌘K works | Two header architectures (107px vs 65px @390); chrome 21% of viewport; two dock dialects; drawer tiers weightless — `NAV-01..05` |
| Hierarchy | Every route has an h1 | Five h1 sizes @390 (37/34/33/28/23px); settings renders a second skin — `HIE-01/02` |
| Spacing | No overflow | 186 raw paddings vs 10 tokens; section rhythm 14→41px across families — `SPC-01..03` |
| Typography | Contrast AA clean | Two ramps + 22 live sizes @390; 7–8px text in product; Arabic tracking violations — `TYP-01..04` |
| Color | Contrast AA clean | 26 accent values without positional roles; two brand palettes (marketing ≠ app) — `VIS-01/02` |
| Surfaces | — | 93% card-in-card on domain workspaces; 5 live radii; 71 shadows — `SUR-01..03` |
| Components | All functional | 7 coexisting dialects; `globals.css` parallel system — `IMP-01..03` |
| Responsive | 0 overflow ×100 captures | Desktop-mode-on-phone renders 6.5px effective text; tablet rail ambiguity — `RES-01/02` |
| Interaction | States wired (W-1/W-3) | 9 configuration sections before first action on the gateway; 480ms route transitions — `INT-01/02` |

**Root causes (three, and only three):**
1. **R1 — Tokens exist, discipline doesn't.** Foundations v4.0 is a good token file; 186 raw paddings, 71 shadows and 23 radii bypass it, with zero lint enforcement (`SPC-01`, `SUR-02/03`, `IMP-02`).
2. **R2 — Vocabulary fragmentation.** Seven dialects evolved per workstream; the v20 `mj-*` primitives cover a fraction of rendered UI (`IMP-01/03`).
3. **R3 — Undeclared budgets.** The mobile chrome budget, the surface-inflation law's enforcement, the h1 ramp, and the responsive composition contract were never written as numbers — so every screen negotiated its own (`NAV-02`, `HIE-01`, `SUR-01`, `RES-01`).

### 3.2 What the owner saw, verified (traceability of all 16 review points)

Owner review points 1–16 map to matrix IDs as follows (full text in `UI-UX-AUDIT-MATRIX.csv`):

| Owner point | Finding IDs | Verdict |
|---|---|---|
| 1 Header eats the phone; content under it | NAV-01/02, NAV-07, UNC-02 | Confirmed (architecture + budget); "behind header" = glass-by-design, owner decision |
| 2 Navigation density / global vs contextual | NAV-03, NAV-06 | Confirmed — layer model defined |
| 3 Bottom nav oversized/competing | NAV-04, UNC-03 | Confirmed (two dialects); weight cap set |
| 4 Everything is a Card | SUR-01 | Confirmed — 93% nesting measured |
| 5 Spacing rhythm uneven | SPC-01..03 | Confirmed — 3× family spread |
| 6 Typography system missing | TYP-01, HIE-01 | Confirmed — ramp defined |
| 7 Accents unregulated | VIS-02, INT-03 | Confirmed — semantic roles defined |
| 8 Landing ≠ product brand | VIS-01 | Confirmed — token bridge defined |
| 9 Knowledge stats empty area | UNC-01 | Unconfirmed (not reproducible in current state) — kept open for owner |
| 10 Settings = different product | HIE-02 | Confirmed — measured skin divergence |
| 11 Drawer hierarchy | NAV-05 | Confirmed — tiers defined |
| 12 Config before action | INT-01 | Confirmed — composer-first template |
| 13 Desktop-mode squeezed on phone | RES-01 | Confirmed bug — 6.5px effective text |
| 14 QA at 5 viewports | VISUAL-QA-CHECKLIST.md | Adopted as protocol |
| 15 Foundations-first order | §6 implementation order | Adopted |
| 16 W-4 blocked until W-DS done | Roadmap amendment | Adopted |

### 3.3 What is *not* wrong (and stays)

Engineering gates hold (ACC-01: 44px targets, zero overflow ×100, skip link, aria). The mock layer's state machines, the B1 status triads, the skeleton system, the motion tokens, the container-query approach, the RTL logical-properties discipline, and the v20 `mj-*` primitive layer are **good bones** — the reconstruction consolidates onto them rather than replacing them.

## 4. The system at a glance (summaries; details live in the owning documents)

- **Principles (10)** — Arabic-first structural; content owns the screen; one system/two canvases; earned surfaces; space-as-scale; closed type ramp; semantic color; action-first; explanatory motion; perception-as-gate. → `DESIGN-PRINCIPLES.md`
- **Tokens** — two namespaces, one system: `--u-*` (identity/color/elevation/shape/motion) + `--mj-*` (space/type/layout), layered A1/A2/B-slot, admitted only through the six-question test; 9-step space scale; 11-level type ramp; 5 radii by level; 5 elevations by level; 4 container measures; 4 control heights; marketing token bridge; `--fc-*` folded into a declared second canvas. → `DESIGN-TOKENS.md`
- **Components** — the closed primitive set (Surface/Section/Stack/Cluster/Grid/Split/DataList/ControlBar/Chip/Button/IconButton/SearchField/Field/Tabs/Segmented/Badge/StatusBadge/Avatar/StateBlock/NavigationItem/Dialog/Sheet/Toast) replacing 7 dialects via the migration table. → `COMPONENT-INVENTORY.md`
- **Navigation** — five layers (L0 browser / L1 header / L2 title / L3 content / L4 dock); single 56px header row; ≤15% chrome budget @390 (declared table); tiered drawer (Core/Workspace/Operations/Personal); scoped search (global ⌘K vs collection field). → `NAVIGATION-ARCHITECTURE.md`
- **Responsive** — composition per band (drawer+dock / labeled sidebar / expanded / capped 1440); never-scale rule + coarse-pointer guard; 7 RTL requirements (zero Arabic tracking, line-height floors, bidi isolation, mirrored motion…). → `RESPONSIVE-ARCHITECTURE.md`
- **Patterns & motion** — 8 templates (list/detail/creation/settings/empty/loading/error/destructive); composer-first gateway; progressive-disclosure law; duration classes 80→480ms with 240ms routes; reduced-motion as hard gate. → `PAGE-PATTERNS-AND-MOTION.md`
- **QA** — two-gate protocol: Gate A (engineering, retained) + Gate B (10 visual-quality gates, new) + continuous token lint; sign-off matrix. → `VISUAL-QA-CHECKLIST.md`

## 5. Reference analysis (methodology only — nothing copied)

| System | What was studied | What Minsaj adopts | What it rejects |
|---|---|---|---|
| **Ant Design** (primary structural reference — incl. its DESIGN.md pattern of turning principles into executable specs) | DESIGN.md structure: principles → tokens → components → guidance; token naming (seed/map/alias); density control for data-heavy SaaS | The document architecture (principles→tokens→components→patterns→guidance); token layering; density as a first-class concern | Ant's default look; 10px body sizes; its neutral-gray identity |
| **Atlassian Design System** | Tokens as a discipline: spacing ladder 2→80px with per-level usage; foundations-first structure | The "spacing is a ladder, not a feeling" law (R-SPACE-*); foundations → components → patterns ordering | Its corporate blue identity; its documentation language |
| **IBM Carbon** | Grid rigor (16-col, fixed steps); spacing/type tokens; responsive composition rules | The container-ladder discipline (R-GRD-1); "composition changes per band, not scales" (R-RES-*) | Carbon's 2x grid rigidity for Arabic prose; its flat-gray aesthetic |
| **Material Design 3 (Material Web)** | Color roles (primary/secondary-container…); elevation as tonal surfaces in dark; motion tokens; theming docs structure | Semantic color role table shape (R-COL-*); dark elevation via luminance not shadow | MD3 expressive rounding; FAB patterns; its color-algorithm rigidity |
| **Apple HIG** | Layout/navigation/search guidance; hierarchy through spacing & weight; adaptive layouts | "Content owns the screen" (P2); chrome-budget thinking; near-solid header chrome (NAV-07 default) | iOS-specific navigation metaphors; blur-heavy glass chrome |
| **OpenDesign corpus** (6 systems, as provided) | The *package contract* (manifest/DESIGN.md/tokens.css/USAGE.md); token layers A1/A2/B-slot + promotion rules; "when NOT to add a token"; DESIGN.md sectioning; agent-consumable authoring | USAGE.md router (this set ships one); the six-question admission test (§12 DESIGN-TOKENS.md); the rejected-tokens register; layer discipline for tokens | Any visual values from Claude/OpenAI/Cursor/Linear/Vercel/Raycast — zero tokens, colors, radii, or layouts copied |

**Identity check.** Minsaj's own identity — the loom metaphor («النول»), calm surfaces with jewel service threads, Arabic-first rhythm, the Obsidian shell — is preserved and *strengthened* by consolidation; every adopted methodology was filtered through the six questions (observed problem / Minsaj identity / cross-screen consistency / mobile+desktop / executable rule / fewer one-off decisions).

## 6. Implementation order (after approval — never before)

```
Phase 0  Guardrails      G-7 token lint (warn mode), baseline captures, alias layer   [DONE 3508d48]
Phase 1  Foundations     DESIGN-TOKENS wave 1: space scale + type ramp aliases,    [DONE 147f752 —
                         alert token, radius/elevation maps, Arabic tracking fixes,   exit gate approved
                         7/8px text fixes                              [fixes TYP-02/03, SPC-01 begins]  §7.3]
Phase 2  Surfaces        settings + ops pages rebuilt on mj-surface;               [IMPLEMENTED + MEASURED
                         anti-nesting refactor (workbench + gateway);                2026-09-22 — awaiting
                         DataList for record collections               [fixes HIE-02/03, SUR-01] owner exit-gate approval]
Phase 3  Chrome          single-row header + single dock; drawer tiering;
                         vertical budget enforcement                    [fixes NAV-01..05]
Phase 4  Patterns        composer-first gateway; state coverage; motion retiming [fixes INT-01/02, UNC-01]
Phase 5  Brand & grid    marketing token bridge; focus-canvas fold; container ladder [fixes VIS-01/03, GRD-01]
Phase 6  QA hardening    G-7 error mode; 980 coarse probe in CI; sign-off matrix live
```

Each phase exits through the two-gate protocol on its touched routes; phases do not overlap with W-4.

## 7. Approval protocol

1. Owner reviews this set (suggested order: this file → matrix CSV → DESIGN-TOKENS → NAVIGATION-ARCHITECTURE → the rest).
2. Owner decisions required (recorded here on approval): **D-1** header glass level (NAV-07 default: 0.95 near-solid); **D-2** tablet default nav (RES-02 default: labeled expanded sidebar); **D-3** UNC-01 knowledge stats reproduction context; **D-4** dock weight preference (UNC-03); **D-5** confirmation of the implementation order.
3. On approval: roadmap W-DS marked approved → phases scheduled → this header changes from DRAFT to APPROVED with date; any later amendment follows the token-admission protocol (six questions + owner sign-off).

### 7.1 Approval record — 2026-09-22

Owner approval received and recorded verbatim in the session log; substance:

- The package correctly describes the current product state and diagnoses the visual-coherence and UX problems.
- The audit results are accepted as measurement-, screenshot-, and evidence-backed, with a clear separation between objective measurement and visual impression.
- The proposed system is **the approved specification**; all subsequent implementation must conform to it.
- Implementation is approved to begin under the phases, constraints, and acceptance criteria of this document set.
- Approval ≠ problems solved: no finding may be considered resolved before passing **Gate A and Gate B** and recording the new measurements.
- **W-4 stays blocked** until the W-DS exit criteria defined here are met.
- **Phase 0 is authorized to start immediately after this record is committed.**

Owner decisions D-1..D-5, as left by this approval (defaults stand where the owner did not override):

| Decision | Disposition after approval |
|---|---|
| **D-1** header glass level | **Default accepted** — NAV-07: near-solid 0.95 opacity on standard chrome (no override stated). |
| **D-2** tablet default nav | **Default accepted** — RES-02: labeled expanded sidebar at 768–1023 fine-pointer. |
| **D-3** UNC-01 knowledge-stats context | **Still open** — owner supplied no reproduction context; finding remains `unconfirmed-pending-owner` and is never deleted. Owner reconfirmed 2026-09-22 (§7.2): open until a reproducible context is provided; does not block Phase 1. |
| **D-4** dock weight (UNC-03) | **Still open as a preference** — working rule until overridden: NAVIGATION-ARCHITECTURE §5 weight cap (exactly one shadow token + one hairline; dock never reads as a card). Owner reconfirmed 2026-09-22 (§7.2): floating dock, one shadow, light border, no per-route variations; does not block Phase 1. |
| **D-5** implementation order | **Confirmed** — the §6 order (Phase 0 → 6) stands as approved. |

Amendments after this record follow the token-admission protocol (six questions + owner sign-off).

### 7.2 Phase 1 authorization record — 2026-09-22

Owner message received after the Phase 0 completion report (original in Arabic, session log); substance:

- **D-3 (UNC-01 knowledge-stats context)** — remains open until the owner supplies a reproducible context for the Knowledge-Sources stats-card observation. The finding stays `unconfirmed-pending-owner` and is never deleted. **Does not block Phase 1.**
- **D-4 (dock weight, UNC-03)** — remains open as a visual preference. Working rule until overridden: **floating dock with exactly one shadow and a light border, and no per-route dock variations** (NAVIGATION-ARCHITECTURE §5 weight cap). **Does not block Phase 1.**
- **Phase 1 — Foundations is approved to start now.** Phase 0 is complete (commit `3508d48`: G-7 token lint live in warn mode, baseline frozen, zero-drift proven on 100 cells), so Phase 1 proceeds under these binding constraints, restated from the owner's message:
  1. The **Phase 0 baseline is maintained** as the comparison reference — never overwritten; new measurements are recorded as new baselines.
  2. **No problem is declared solved** before passing Gate A and Gate B and recording new measurements.
  3. **Phase 2 may not start before the Phase 1 exit gate is approved.**
  4. **W-4 remains blocked** until the W-DS exit criteria are met.

### 7.3 Phase 1 exit gate approval + Phase 2 authorization record — 2026-09-22

Owner message received after the Phase 1 completion report (original in Arabic — «نعم ابدأ phase 2»; session log); substance:

- **The Phase 1 exit gate is approved.** The Phase 1 evidence package (frozen baseline `evidence/baselines/phase1/`, 238 field diffs all classified into approved categories, Gate A clean, Gate B within Phase-1 scope, TYP-02/TYP-03 resolved by measurement) is accepted as satisfying the Phase 1 exit criteria.
- **Phase 2 — Surfaces is authorized to start now**: settings + ops pages rebuilt on `mj-surface`; anti-nesting refactor (workbench + gateway); DataList for record collections. Target findings: **HIE-02 (P1), SUR-01 (P0), HIE-03 (P2)**.
- The standing constraints carry over unchanged: Phase 0/Phase 1 baselines are maintained (never overwritten); **no finding is declared resolved before Gate A + Gate B pass with new measurements**; Phase 3 does not start before the Phase 2 exit gate is approved; **W-4 remains blocked**.
- D-3 and D-4 remain open (§7.1/§7.2 dispositions stand) and do not block Phase 2.

### 7.4 Phase 2 exit gate approval + Phase 3 authorization record — 2026-09-22

Owner message received after the Phase 2 completion report (original in Arabic — «اعتمد Phase 2 وابدأ Phase 3»; session log); substance:

- **The Phase 2 exit gate is approved.** The Phase 2 evidence package (frozen baseline `evidence/baselines/phase2/`: 100-cell capture with 198 field diffs all classified, G-7 census, SUR-01 before/after probes at card-grade 10→0 per viewport, Gate A clean, Gate B within Phase-2 scope with B-4 fully measured) is accepted as satisfying the Phase 2 exit criteria.
- **Phase 3 — Chrome is authorized to start now:** single-row 56px header on every `/app/*` route (near-solid ≥ 0.92 per the D-1 default) · one floating dock grammar (16px inline inset, one shadow token + one hairline per the D-4 working rule) · drawer tiering T1–T4 (Core/Workspace/Operations/Personal, utility group labelled «مساحتي») · vertical-budget enforcement `chromeRatio ≤ 15.5% @390 / ≤ 14.5% @430`. Target findings: **NAV-01 (P1), NAV-02 (P1), NAV-03 (P2), NAV-04 (P2), NAV-05 (P2)**.
- The standing constraints carry over unchanged: Phase 0/1/2 baselines are maintained (never overwritten); **no finding is declared resolved before Gate A + Gate B pass with new measurements**; Phase 4 does not start before the Phase 3 exit gate is approved; **W-4 remains blocked**.
- D-3 and D-4 remain open (§7.1/§7.2 dispositions stand) and do not block Phase 3. Route-transition retiming (240ms, 4px enter offset) stays in Phase 4's bracket per §6 — Phase 3 claims nothing outside NAV-01..05.
