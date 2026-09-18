---
name: web-research-first
description: Mandatory research gate requiring web search before implementing unfamiliar features, choosing libraries, or debugging unknown errors. Use BEFORE writing any non-trivial code, whenever uncertain about an API, version, or best practice, and for every task that mentions research or standards.
---

# Web Research First

## Purpose (this is a standing order from the owner)

Agents on this repository MUST use search tools to speed up production and solve problems.
Guessed APIs, stale training-data versions, and reinvented solutions are the #1 source of
hallucinated work and rework. Research-first is not optional overhead — it is the fastest path
to a correct implementation.

## When you MUST search (non-exhaustive)

- Adding or upgrading any dependency (check current version + breaking changes).
- Any error message you cannot immediately root-cause from the code in front of you.
- Framework-specific behavior (Next.js 16 conventions, React 19 semantics, Tailwind v4
  CSS-first rules) — these changed recently; memory of older versions is a hazard.
- Anything involving standards/formats (AGENTS.md, Agent Skills, WAI-ARIA, i18n, RTL).
- Security-relevant decisions (auth, headers, sanitization).
- "Is there an established pattern for X?" — before inventing your own.

## Procedure

1. **Formulate 2–3 precise queries** (specific > broad; include the tech + version + symptom).
2. **Search** using the available search tooling (e.g. `z-ai function -n web_search`, or your
   environment's web search). Use `page_reader` / web reader on the most promising results.
3. **Prefer primary sources, in this order:**
   1. Official documentation / specification pages.
   2. Vendor engineering blogs (e.g. Anthropic engineering, Next.js blog).
   3. GitHub issues with maintainer answers.
   4. Everything else — treat as a lead, never as proof.
4. **Record the decision trail:** cite the source URL(s) wherever the research shaped a choice:
   - Commit message body, or
   - Decision record in `docs/08-AGENT-OPERATING-MODEL.md` § Decision log (if architectural), or
   - `docs/REFERENCES.md` (if it establishes a durable practice for this repo).
5. **Time-box:** ~10–15 minutes. If inconclusive: state assumptions explicitly to the owner and
   mark the decision as reversible.

## Output contract

Research that shaped a change is cited in the same change. A claim without a source stays a
hypothesis, not a fact.

## Anti-patterns

- ❌ Writing an API call from memory and "fixing it if it errors" — that is debugging your own
  hallucination on the owner's time.
- ❌ Trusting a random blog over official docs when they conflict.
- ❌ Researching AFTER implementing, to justify what was already built.
- ❌ Searching forever: know when to decide with stated assumptions.
