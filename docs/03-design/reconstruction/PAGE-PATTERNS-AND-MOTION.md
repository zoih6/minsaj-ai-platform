# PAGE-PATTERNS-AND-MOTION.md — Page Templates & Interaction Motion
## W-DS · Design-System Reconstruction · How a route is assembled without inventing anything

> **Purpose.** Define the page patterns every Minsaj route is built from, the progressive-disclosure law for work screens, and the motion contract. A developer (or agent) building a route starts here, composes primitives from `COMPONENT-INVENTORY.md` §5 with tokens from `DESIGN-TOKENS.md`, and never invents spacing, color, or choreography. Resolves `INT-01`, `INT-02`, `HIE-03`, `UNC-01`.

---

## 1. The page anatomy contract (every route)

```
page-root
└── content frame (L3, gutter tokens)
    └── Section(s)          -- spacing: --mj-space-600 between sections (R-SPACE-2)
        ├── SectionHead     -- label-s eyebrow (AR: zero tracking) + h2 + optional aside action
        └── body            -- Surface(card) | DataList | Grid | Stack of flat-groups
```

- The page title block (L2) sits above the first section: h1 (`--mj-text-h1`) + ≤1-line lede + one primary route action.
- Sections declare a container measure (`narrow | prose | wide | full`).
- Records-in-a-collection render as `DataList` rows — **not** card stacks (`HIE-03`, `R-PAT-1`). Cards are for summaries and single coherent records.

## 2. The eight patterns

### 2.1 List pattern (ops collections: projects, agents, flows, runs, knowledge, team…)

```
L2 title block (h1 + lede + primary action "new")
Section[stats]      → Grid of StatCards (max 4) or none
Section[collection] → ControlBar (scoped SearchField + filter Chips + count)
                      DataList (rows; each row: identity, meta, status Badge, actions)
StateBlock empty/error when applicable
```
- One surface owns the list; rows are divisions, not cards (`R-PAT-1`).
- Filters live in the collection's ControlBar, never in page chrome (`R-NAV-6`).

### 2.2 Detail pattern (run detail, project, model, collection)

```
L2 title block (identity + status Badge + contextual actions)
Section[summary]    → flat-group key/values (DataList 2-col or definition rows)
Section[timeline]   → DataList rows or stage strip
Section[related]    → Grid of link-cards (max 3)
```
- The summary is a *flat group inside one card* — no card-per-field.

### 2.3 Creation-flow pattern (the gateway: اسأل and all service entries) — composer-first

```
L2 title block (service eyebrow + h1 + one-line lede)   ← no more
Section[composer]   → Surface(card, narrow measure):
                        prompt textarea (grows), affordance pills row,
                        ONE primary CTA («نفّذ» / «التالي»)
Section[progressive]→ revealed on demand, in this order:
                        1. mode (موجّه/سريع) — segmented, defaults سريع
                        2. leading tool (المصفوفة الرباعية) — opens after first keystroke
                        3. guided questions (موجّه only) — one at a time
                        4. advanced (context, quality bar, files) — behind «خيارات متقدمة»
Section[recent]     → «من مكتبتك» strip (2 items) + starters as plain links
```

- **[R-PAT-2]** The composer + primary CTA are above the fold at 390px. Everything else is progressive disclosure. The current 9-section stack (`INT-01`) reduces to title + composer + on-demand sections.
- The four-step path (01–04) becomes a *thin* progress strip inside the composer card during execution — not a separate pre-execution section.
- Trust note (safe-simulation) collapses into the footer of the composer card as one caption line.

### 2.4 Settings pattern

```
L2 title block (h1 only)
Grid[nav | content]  → 238px section nav (Desktop) / Chips (Tablet) / stacked anchors (Mobile)
Section per group    → ONE Surface(card) per group: SectionHead + Field rows + save row
Destructive zone     → isolated Section, danger triad tokens, explicit confirmation
```
- Rebuilt on `mj-surface` (16px radius, xs shadow, `--mj-pad-card`) — ends the divergent skin (`HIE-02`).
- One save affordance per group; unsaved-changes state on the SectionHead.

### 2.5 Empty state (R-PAT-3a)

`StateBlock variant="empty"`: 24px icon (`--u-faint`) · `body-s` explanation naming what's missing · one primary remedy action · optional secondary link. Never a blank container; never a bare illustration (`UNC-01` lesson: reserved space must declare itself).

### 2.6 Loading state (R-PAT-3b)

`StateBlock variant="loading"`: skeletons matching final geometry (`states.css` `.u-skeleton--*`, direction-aware sweep — retained). Every async collection binds skeletons by default; stats cards included.

### 2.7 Error state (R-PAT-3c)

`StateBlock variant="error"`: danger triad · one-sentence cause in `body-s` · retry action · escalation link. Route-level errors keep the existing `error.tsx` boundary.

### 2.8 Destructive action

Confirmation via `Dialog` (`mj-dialog` geometry; bottom sheet < 768): title names the object · consequence line · cancel (quiet) + confirm (danger, `--u-danger` fill — the only red fill in the product) · 10s confirm hold for irreversible operations. Destructive zones in settings isolate into their own section (§2.4).

## 3. Progressive-disclosure law (P8)

1. **Intent before configuration:** every work surface opens with input + one primary action.
2. **Configuration is sequential:** mode → tool → advanced; one concern visible at a time.
3. **Advanced is opt-in:** «خيارات متقدمة» never pre-expanded; defaults are opinionated and visible as one summary line («الأسلوب: سريع · الأداة: مساحة نص»).
4. **Complexity is earned:** a control appears only when the previous choice makes it meaningful (guided questions appear only in موجّه, etc.).

## 4. Motion contract

### 4.1 Duration classes (tokens — `DESIGN-TOKENS.md` §7)

| Class | Token | Applies to |
|---|---|---|
| Instant | 80ms | Color/border state feedback, hover tint. |
| Fast | 130ms | Chips, buttons, tabs, switches. |
| Route | **240ms** | Route-frame enter/exit (`INT-02` fix), drawer slide, dock hide. |
| Moderate | 200ms | Accordion, disclosure, dialog fade. |
| Slow | 300ms | Sheets, large dialogs, stage strips. |
| Expressive | 480ms | Milestones only: first-visit hero, run completion, save celebration. |

### 4.2 Easing & choreography

- Enter: `--u-motion-ease-enter` (overshoot ≤1.2); exit: `ease-exit`; standard: `--u-motion-ease-standard`. Spring reserved for tactile button press.
- **One moving thing at a time** per interaction; chrome never animates with content (NAVIGATION-ARCHITECTURE §7).
- Enter offsets: route frames 4px; disclosures 8px; nothing enters from >18px.
- Stagger only within lists ≤ 7 items, `--u-motion-delay-stagger` 50ms.
- RTL: every directional animation mirrors (skeleton sweep pattern is the reference — `R-RTL-7`).

### 4.3 Reduced motion (hard gate)

`prefers-reduced-motion: reduce` ⇒ all transitions ≤1ms, animations removed, no parallax/reveal. The existing global rule stays and is asserted in QA gate G-5.

### 4.4 Forbidden motion

- Loops on operational screens (the notification ping is the single sanctioned exception, itself reduced-motion-aware).
- Route transitions > 300ms; enter offsets > 18px; simultaneous multi-element choreography on wayfinding; motion that implies LTR in RTL.

## 5. Template → token quick map (for agents)

| Template need | Use | Never |
|---|---|---|
| Page title | `--mj-text-h1` + L2 block | per-family hero clamps |
| Section gap | `--mj-space-600` | raw margins |
| Card | `Surface` card: radius 16, shadow-xs, pad `--mj-pad-card` | nested cards, extra radii |
| List of records | `DataList` rows in one surface | card per record |
| Filter row | `ControlBar` + `Chip` + `SearchField scope="collection"` | page-chrome search |
| Primary action | `Button variant="primary"` ×1 | accent-colored alternatives |
| Status | `StatusBadge` triads | ad-hoc colored pills |
| Empty/Loading/Error | `StateBlock` variants | blank or improvised blocks |
| Destructive | danger triad + confirm dialog | inline destructive buttons |
