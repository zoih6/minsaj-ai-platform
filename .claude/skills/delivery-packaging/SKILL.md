---
name: delivery-packaging
description: Release packaging and artifact verification protocol. Use whenever producing a delivery zip, publishing to GitHub, or deploying — to guarantee the shipped artifact contains exactly what was verified and nothing else.
---

# Delivery Packaging & Artifact Verification

## Purpose

This repository learned the hard way (v3) that **"it works in dev" ≠ "it's in the box"**: a zip
once shipped without the `@import` line that activated an entire CSS architecture — every dev
test passed because they ran against the live `src/`, while the artifact silently lacked the
wiring. Verification must happen **inside the artifact**, not next to it.

## When to use

- Building any delivery zip / archive.
- Any push to `main` (auto-deploys to production via Vercel — no manual step to catch mistakes).
- Handing the repo to another agent or environment.

## Procedure

### 1. Pre-flight (triple gate — see `layout-regression-defense`)

- [ ] Layout guards green
- [ ] Sweep green (full 90/90 if layout touched)
- [ ] `lint` 0 errors · `tsc --noEmit` 0 errors · `build` success

### 2. Package

- Preferred: `git archive` from the clean repo commit (no `node_modules`/`.next` leakage,
  no workspace-symlink junk — proven in v7/v8).
- Include: `bun.lock`, `.gitignore`, `next-env.d.ts`, docs, skills, scripts, AGENTS.md/STATE.md.
- Exclude: `node_modules`, `.next`, `.vercel`, secrets, logs, local scratch files.

### 3. Verify INSIDE the artifact (mandatory)

- Unzip to a scratch dir; `grep` the actual file for the wiring you depend on
  (e.g. the `@import "./styles/universal/layout.css"` line — check compiled CSS contains the
  primitives: `mj-grid`, `mj-data-list`, `@container` rules).
- Fresh install + build from the extracted copy alone: `bun install && bun run build`
  (then smoke-test routes on a throwaway port).
- Diff the artifact tree vs the verified source — normalized diff, expecting zero surprises.

### 4. Publish

- Push the commit to `main` (tokenized URL if needed; **never persist tokens in the remote**).
- Confirm GitHub Actions: install → layout guards → lint → build all green.
- Confirm Vercel deployment reaches `READY` on the expected commit SHA.
- Verify live: key routes return 200 with expected signatures (e.g. `/ar` serves
  `dir="rtl"`, app routes carry the shell attributes).

### 5. Record & close

- Update `STATE.md` + `docs/CHANGELOG.md` (per `repo-state-maintenance`).
- In the sandbox workspace: refresh the browsable delivery copy (`download/minsaj-ai/`) so it is
  byte-identical to the repo (`diff -r` clean), rebuild the versioned zip, update
  `download/README.md`, remove superseded zips.

## Rules

- One artifact per version, verified once, recorded once — no orphan zips.
- The zip that the owner downloads must be the same bits CI verified.
- If production is broken, production is the priority: reproduce on live, root-cause, fix,
  re-run the full gate, redeploy — and document why the gate missed it, then extend the gate.

## Checklist

- [ ] Triple gate green BEFORE packaging
- [ ] Artifact built from clean commit (git archive)
- [ ] Artifact-internal verification passed (imports live, compiled CSS proves it)
- [ ] Fresh-install build from extracted artifact succeeded
- [ ] Pushed → CI green → Vercel READY on the right SHA
- [ ] Live spot-check passed (RTL signature, shell attributes)
- [ ] STATE.md / CHANGELOG / delivery README updated; old zips cleaned
