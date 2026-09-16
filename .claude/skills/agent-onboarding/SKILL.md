---
name: agent-onboarding
description: First-session initialization ritual for any AI coding agent receiving this repository. Use at the START of every new session, before touching any code, to load context, verify the environment, and prove readiness with green gates.
---

# Agent Onboarding

## Purpose

Turn a cold start into a verified, evidence-backed working state in under 15 minutes — so the
owner never has to re-explain the project, and no agent ever works from stale assumptions.

## When to use

- At the start of ANY new session on this repository (new agent, new conversation, resumed work).
- After a long gap since the last session (verify nothing drifted).

## Procedure

1. **Load context (5 min):**
   - Read `AGENTS.md` fully (entry point: hard rules, workflows, skills index).
   - Read `STATE.md` (current version, gate status, open items, handoff notes).
   - Skim `docs/CHANGELOG.md` tail (latest phase entries) if context is needed.
   - Load further docs lazily — only what the current task touches (progressive disclosure:
     do not flood your context with the entire doc suite).

2. **Verify environment (5 min):**
   ```bash
   bun install                 # should succeed against bun.lock
   bun run dev &               # :3000 → should redirect to /ar
   node scripts/check-layout-guards.mjs   # must pass (it's also in CI)
   bun run lint                # must be 0 errors
   ```
   If any of these fails BEFORE you changed anything, stop and report — the repo arrived broken,
   do not silently absorb it into your change set.

3. **Confirm live state:**
   - Production: `https://nasaq-ai-platform.vercel.app` reachable.
   - `git log --oneline -3` matches the commits recorded in `STATE.md` handoff notes.

4. **Report readiness to the owner (in Arabic):**
   - One short block: gates green/red, current version, what you understand the next task to be.
   - If the next task is ambiguous, restate your understanding and ask ONE consolidated
     clarification round — never drip questions.

## Checklist (all must be true before starting feature work)

- [ ] Read AGENTS.md + STATE.md end-to-end
- [ ] `bun install` clean
- [ ] Layout guards green · lint 0 errors
- [ ] Dev server serves `/ar`
- [ ] Ready-report sent (Arabic)

## Anti-patterns

- ❌ Skipping verification "because CI was green" — your local clone is what you'll edit.
- ❌ Reading every doc in `docs/` upfront — load on demand instead.
- ❌ Assuming commands from memory of other projects — this repo defines its own in `AGENTS.md`.
