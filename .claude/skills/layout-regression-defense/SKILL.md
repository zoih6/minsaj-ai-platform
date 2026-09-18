---
name: layout-regression-defense
description: Anti-regression verification system protecting the responsive layout architecture. Use before every delivery, after any CSS or layout change, and whenever adding new pages or routes to keep all three gates green.
---

# Layout Regression Defense

## Purpose

This repository was burned once: four editor routes lived outside the container-query system
across five delivery phases because sweeps only covered list pages. The triple gate below exists
so that class of failure can never ship again — treat it as part of the definition of done.

## The three gates

### Gate 1 — Architectural guard (static, CI-enforced, no browser)

```bash
node scripts/check-layout-guards.mjs
```

Scans CSS for container classes, walks every `page.tsx` to its rendered root, and fails if any
page lacks a container-query context. Runs in GitHub Actions before lint/build — **a red guard
blocks the push**. Current baseline: 24/24 pages.

### Gate 2 — Responsive sweep (runtime, needs dev server + browser)

```bash
bash scripts/verify-sweep-v8.sh
```

30 routes (including all 8 dynamic sub-pages: builders, editors, detail views) × 3 viewports
(375 / 768 / 1440) = **90 checks**: zero horizontal overflow, correct sidebar mode per viewport,
no portaled-element overlaps, no squeezed desktop grids. Warm up the viewport before measuring
(cold-start gave false failures once — fixed in the script).

### Gate 3 — Editor interactions (runtime, mobile)

```bash
bash scripts/verify-editor-interactions.sh
```

Step navigation, node add/select, canvas panning, toast-above-tab-bar geometry on mobile.

## Extension rules (mandatory)

- **New route ⇒ new matrix entry the same day.** Add it to the `ROUTES` array in
  `scripts/verify-sweep-v8.sh`. An unswept route is an undelivered route.
- **New page root ⇒ declare its container context** in the owning CSS layer
  (`container-type: inline-size; container-name: ops-page;` or the appropriate name) — then
  Gate 1 will keep it honest forever.
- **New fixed/portaled element ⇒ add an overlap sentinel** proving it does not cover the mobile
  tab bar or dialogs (see the z-index ladder at the top of `shell.css`).
- **Suspicious check?** Prove its selector matches a real element (vacuous sentinels pass
  silently — a toast check once targeted a nonexistent class and passed with zero value).

## When something red appears

1. Do not weaken the check to green (that is deleting the alarm).
2. Run `root-cause-fixing` — red gate = layer violation somewhere.
3. If the architecture legitimately changed, update the guard to the new contract and document
   the decision in `docs/08-AGENT-OPERATING-MODEL.md` § Decision log.

## Checklist (delivery mode)

- [ ] Gate 1 green locally (and it will re-run in CI)
- [ ] Gate 2 green on the routes touched — and full 90/90 if layout architecture changed
- [ ] Gate 3 green if editors/builders touched
- [ ] New routes present in the matrix
- [ ] Results recorded in STATE.md gates table
