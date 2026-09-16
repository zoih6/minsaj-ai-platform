---
name: root-cause-fixing
description: Engineering discipline for fixing bugs at their systemic root instead of patching symptoms. Use whenever any bug, visual defect, error, or regression is reported — BEFORE writing any fix — and whenever a previous fix feels like a workaround.
---

# Root-Cause Fixing (No Patching)

## Purpose

The owner's explicit contract: no band-aids ("ترقيع"), no hallucinated fixes, no symptom-chasing.
Every fix must land at the correct architectural layer and leave a regression guard behind, so
the same class of bug cannot silently return.

## When to use

- Any user-reported bug (screenshots, descriptions, error messages).
- Any defect you discover yourself (console errors, layout breakage, hydration warnings).
- Any previous fix that "worked" but you suspect only masked the problem.

## Procedure

1. **Reproduce.** Get to the exact state (URL, viewport, locale, interaction) where the defect
   shows. A bug you cannot reproduce is a bug you cannot fix — ask for evidence, don't guess.

2. **Measure — never assume.** Collect direct evidence:
   - DOM measurement (bounding boxes, computed styles, `document.elementFromPoint`,
     scrollWidth vs innerWidth) at the failing viewport.
   - Computed z-index and stacking contexts for overlap bugs (which element paints on top?).
   - Raw byte checks for filesystem weirdness (terminal display can lie — see Gotchas in
     `AGENTS.md`).
   Write the measurements down: before/after numbers are the proof of the fix.

3. **Locate the systemic layer.** Ask "which layer OWNS this concern?" (see CSS layer order in
   `AGENTS.md`). The fix belongs there — not at the incident site.
   Real examples from this repo's history:
   - Toast covering the mobile tab bar → NOT a per-toast tweak; the shared shell now exposes
     `--nq-tabbar-reserve` on `:root` and all fixed elements honor it.
   - Editor pages squeezed on phones → NOT per-component media queries; the page roots lacked a
     container context, one line restored an entire responsive system.
   - Dialog painted under the tab bar → NOT a bump-this-z-index; a documented z-index ladder.

4. **Fix once, at that layer.** One surgical change at the owning layer beats ten local patches.

5. **Add/extend the regression guard.** The fix is incomplete until something would fail if the
   bug came back: extend `scripts/check-layout-guards.mjs`, the sweep matrix, or a sentinel check.
   Historical proof: the v8 catastrophic bug would have been caught by a guard written in v3.

6. **Verify before/after.** Re-run the same measurement from step 2 on the fixed build. Report
   the numbers (e.g. "overflow 874px → 0", "top element at dialog = dialog, not tab bar").

## Checklist

- [ ] Reproduced with exact state
- [ ] Evidence collected (measurements, not impressions)
- [ ] Fix landed at the owning architectural layer
- [ ] Regression guard added or extended
- [ ] Before/after numbers recorded
- [ ] Side-sweep: the same class checked on sibling pages/viewports

## Anti-patterns (each one actually shipped a bug here)

- ❌ Per-element media-query patches to hide a broken grid.
- ❌ Spot-fixing one z-index instead of respecting the ladder.
- ❌ Hiding an overflow instead of reflowing the layout.
- ❌ "Works on my machine" without artifact-level verification.
- ❌ Deleting the failing check to make the pipeline green.
