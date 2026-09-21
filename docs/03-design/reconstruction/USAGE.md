# USAGE.md — Agent & Developer Read Order
## W-DS · Design-System Reconstruction · How to consume this package

> This is the agent-facing router for the Minsaj design-system package (modeled on the OpenDesign `USAGE.md` contract: Read Order / Design Highlights / Do / Avoid). If you are an AI agent or a developer about to build, review, or modify any Minsaj screen, read this file first.

## Read Order

| If you are about to… | Read, in this order |
|---|---|
| Any visual change at all | `DESIGN-PRINCIPLES.md` → `DESIGN-TOKENS.md` → `USAGE.md` (this file) |
| Building a new route / screen | + `PAGE-PATTERNS-AND-MOTION.md` → `COMPONENT-INVENTORY.md` §5 (primitives) → `NAVIGATION-ARCHITECTURE.md` §1 (layers) |
| Touching the app shell (header/drawer/dock/palette) | + `NAVIGATION-ARCHITECTURE.md` (all) → `RESPONSIVE-ARCHITECTURE.md` §1–2 |
| Fixing a UI defect | `UI-UX-AUDIT-MATRIX.csv` (find the ID) → the rule it cites → `VISUAL-QA-CHECKLIST.md` gates |
| Adding/altering a token | `DESIGN-TOKENS.md` §12 (six-question test) → §13 (rejected list) → owner sign-off |
| Reviewing/QA-ing a change | `VISUAL-QA-CHECKLIST.md` (both gates) with the 5-viewport capture protocol |
| Understanding *why* a rule exists | `UI-UX-AUDIT-MATRIX.csv` (evidence) → `DESIGN-SYSTEM-RECONSTRUCTION.md` §3 (diagnosis) |

## Design Highlights

1. **Two namespaces, one system**: `--u-*` (look: color/elevation/shape/motion) + `--mj-*` (measure: space/type/layout). Nothing visual is authored outside them.
2. **Arabic-first invariants**: zero letter-spacing on Arabic, body line-height ≥ 1.7, logical properties only, bidi-isolated Latin/numeric runs, mirrored motion.
3. **Closed sets**: 11 type levels, 9 space steps, 5 radii by surface level, 5 elevations, 4 container measures, 4 control heights, 2 canvases. If a value isn't in a set, the set gets amended — not the component.
4. **Surfaces are earned**: page → card → flat-group → overlay; a card never contains a card.
5. **Chrome is a budget**: ≤15% of a 390px viewport; one 56px header row; one dock grammar; page identity announced once.
6. **Action first**: composer + one primary CTA above the fold; everything else progressive.
7. **Motion explains**: 240ms routes, 480ms milestones only, reduced-motion is a hard gate.

## Do

- Compose routes from the primitive layer (`COMPONENT-INVENTORY.md` §5) with tokens from `DESIGN-TOKENS.md`.
- Use `StateBlock` variants (empty/loading/error) for every async surface.
- Express records-in-collections as `DataList` rows, not card stacks.
- Put collection filtering in the collection's `ControlBar`; leave global search to ⌘K.
- Verify every change at 390/430/768/1024/1440 through `VISUAL-QA-CHECKLIST.md` Gate B, and cite a measurement for every perceptual judgment.
- Keep Arabic labels verbatim (with English gloss) in docs, code, and QA notes.

## Avoid

- Raw px spacing, undeclared radii/shadows, hex accents, sub-10px text, letter-spacing on Arabic.
- New `*-card`/`*-panel`/`*-button` classes; CSS in `globals.css`; a third canvas; per-route header/nav variants.
- Card-inside-card; shadow+border+ tint on one container; more than one filled CTA per view.
- Route transitions > 300ms; decorative animation loops; motion without a reduced-motion path.
- Serving sidebar/rail composition to coarse-pointer wide viewports (desktop-mode phones).
- Declaring a visual problem "fixed" because build/lint pass — Gate B exists precisely for what Gate A cannot see.
