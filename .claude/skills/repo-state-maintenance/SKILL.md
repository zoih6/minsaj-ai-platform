---
name: repo-state-maintenance
description: Documentation update protocol that keeps the repository a self-describing, agent-to-agent handoff artifact. Use at the END of every task and before every commit to update STATE.md, CHANGELOG, decision records, and AGENTS.md.
---

# Repo State Maintenance (Docs Are Part of the Delivery)

## Purpose (standing order from the owner)

Every work or modification on this repository MUST update its files and reports — the repo is
the shared workspace between agents, and the next agent starts from what this one recorded.
An undocumented change is an incomplete change. This is docs-as-code: documentation travels in
the same commit as the code it describes.

## When to use

- End of every task (feature, fix, refactor, docs).
- Before every commit/push.
- Whenever you learn something a future agent would need.

## Update protocol (in order)

### 1. `STATE.md` (always)

- Refresh: current version, date, branch.
- Quality gates table → actual results from this task (green/red with numbers).
- Open items / next steps → re-prioritized, completed items removed.
- Handoff notes → prepend 2–6 lines: what changed, key decisions, where the next agent should
  look. Keep the list short — history belongs to the CHANGELOG.

### 2. `docs/CHANGELOG.md` (always)

- Append a phase entry in Arabic (established convention), structured:
  what was requested → what was done (with measurements) → verification results.
- Match the existing phase format (`# سجل التغييرات — المرحلة N (date)`).

### 3. Decision record (if the change is architectural)

Append a MADR-style entry to `docs/08-AGENT-OPERATING-MODEL.md` § Decision log:

```markdown
### ADR-0XX: <title> — <date>
- **Status:** accepted
- **Context:** what forced the decision (with evidence/measurements)
- **Decision:** what was chosen and where it landed (files/layers)
- **Consequences:** what this enables, what it forbids, follow-ups
```

Trigger: new layer/pattern, dependency add/remove, naming/architecture shift, gate/threshold
changes, anything a future agent might "helpfully undo" without knowing why it exists.

### 4. `AGENTS.md` (if rules changed)

- New hard rule, new command, changed workflow, new route family, moved files → update the
  entry point in the same commit. If AGENTS.md contradicts the code, both are wrong.

### 5. Sweep matrix & maps (if routes/pages changed)

- New route → `ROUTES` in `scripts/verify-sweep-v8.sh` (same day).
- Repository map / docs map drifted → fix the map.

### 6. Worklog (original sandbox workspace only)

- Append a section to `/home/z/my-project/worklog.md` using the established
  `Task ID / Agent / Task / Work Log / Stage Summary` format.

## Commit conventions

- Conventional Commits: `feat:` / `fix:` / `docs:` / `chore:` / `refactor:` (+ scope when useful),
  imperative mood, one logical change per commit.
- Body: what + why + evidence (measurements, gate results). Cite research sources if any
  (per `web-research-first`).
- Never commit secrets (`.env*` stays ignored). Tokens live outside the repo, always.

## Checklist (before you commit)

- [ ] STATE.md updated (gates + handoff notes)
- [ ] CHANGELOG phase appended (Arabic)
- [ ] Decision record added if architectural
- [ ] AGENTS.md still accurate (updated if not)
- [ ] Sweep matrix covers any new route
- [ ] Commit message conventional + evidence in body
