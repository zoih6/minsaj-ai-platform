# CLAUDE.md

**Read [`AGENTS.md`](./AGENTS.md) first — it is the single source of truth** for how to work on
this repository (setup, hard rules, workflows, delivery gates, handoff protocol). It follows the
open AGENTS.md standard, so the same instructions serve every coding agent.

- Current project snapshot & handoff state: [`STATE.md`](./STATE.md)
- Project-level skills live in `.claude/skills/*/SKILL.md` (Agent Skills format) — Claude Code
  auto-discovers them; their trigger descriptions say when to load each one.
- Deep reference: `docs/` (see `docs/README.md` index) · Decision log & operating model:
  `docs/08-AGENT-OPERATING-MODEL.md`

When rules and code disagree, fix both in the same change.
