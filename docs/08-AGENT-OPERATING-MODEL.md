# 08 — Agent Operating Model

> **Explanation document** (Diátaxis): the *why* and *how* of how AI coding agents are directed on
> this repository — the operating system behind `AGENTS.md`, `.claude/skills/`, and `STATE.md`.
> Written after web research into the prevailing standards (sources in `docs/REFERENCES.md`).

---

## 1. Why this system exists

Before this system, project knowledge lived in conversation history: every new session required the
owner to re-explain intent, re-warn about past mistakes, and re-audit the agent's output for
hallucinations and patchwork fixes. Bugs of the same class shipped repeatedly because lessons were
remembered by people, not stored by the repository.

The transition this system makes — from *ad-hoc prompting* to *engineered agent direction* — is
the difference between telling a contractor what to build each morning, versus handing them the
building code, the blueprints, the punch-list protocol, and the keys to the site.

The owner's requirements, distilled:

| Requirement | Where it lives |
|---|---|
| Any new coding agent self-onboards and works immediately | `AGENTS.md` + `agent-onboarding` skill |
| No repeated re-explanation of design decisions | Hard rules + decision log + docs suite |
| No hallucinations | `web-research-first` (search before building) + evidence-based fixing |
| No patchwork fixes | `root-cause-fixing` (measure → systemic layer → guard) |
| Every change updates the repo's own records | `repo-state-maintenance` + `STATE.md` |
| Agent-to-agent handoff with flexibility | Handoff protocol in `AGENTS.md` §Workflows-D |
| GitHub as the shared workspace | Everything above is versioned in-repo |

## 2. The architecture of agent direction

Five layers, each answering one question. The structure follows the AGENTS.md open standard's
philosophy (one predictable entry point), Anthropic's Agent Skills format for capabilities, and
context-engineering practice for progressive disclosure — load the minimum needed, escalate depth
only when the task demands it.

```text
┌────────────────────────────────────────────────────────────────────┐
│ L1  AGENTS.md          "What must I know before anything?"          │
│     Single entry point; commands first; hard rules; workflows.       │
├────────────────────────────────────────────────────────────────────┤
│ L2  STATE.md           "Where does the project stand right now?"    │
│     Living snapshot: gates, open items, handoff notes.              │
├────────────────────────────────────────────────────────────────────┤
│ L3  .claude/skills/    "How do I execute this class of work?"       │
│     7 SKILL.md files, loaded on trigger (progressive disclosure).   │
├────────────────────────────────────────────────────────────────────┤
│ L4  docs/ 00–08        "What is the deep reference?"                │
│     PRD, design system, architecture, testing — classified Diátaxis.│
├────────────────────────────────────────────────────────────────────┤
│ L5  CI guards          "What is enforced even if I forget?"         │
│     Layout guards + lint + build on every push (GitHub Actions).    │
└────────────────────────────────────────────────────────────────────┘
```

**Design principles applied (with sources):**

- **Commands before prose.** The AGENTS.md ecosystem's measured best practice: lead with setup,
  testing, deployment, debugging — agents act on commands most reliably (source: AGENTS.md spec;
  community best-practice guides in `docs/REFERENCES.md`).
- **Progressive disclosure.** Only skill `name` + `description` are always visible; bodies load on
  demand — this keeps per-task context small, per the Agent Skills specification and Anthropic's
  context-engineering guidance (write/select/compress/isolate).
- **Single source of truth, pointers elsewhere.** `CLAUDE.md` points to `AGENTS.md`; rules live
  in one place; duplication is context poison (LangChain/Anthropic context engineering).
- **Evidence over vibes.** Fixes require measurements; checks must be proven non-vacuous;
  artifacts verified from inside (this repo's own scar tissue, formalized).
- **Docs-as-code.** Documentation updates ship in the same commit as the change (Write the Docs),
  reviewed by CI where mechanically checkable.
- **Decisions are records, not memories.** MADR-style entries below capture *why* — so no future
  agent "cleans up" an intentional constraint into a regression.

## 3. The standards this system follows

| Standard | Role here |
|---|---|
| **AGENTS.md open standard** (agents.md; adopted by OpenAI Codex, Cursor, Google Jules, Devin, Gemini CLI, GitHub Copilot, Amp, Windsurf, Junie and 60k+ repos) | `AGENTS.md` at repo root is the entry point; nested files allowed for monorepos (not needed at current scale). |
| **Anthropic Agent Skills** (spec at agentskills.io; Claude Code project skills at `.claude/skills/`) | Each capability is a directory with `SKILL.md`: YAML frontmatter (`name` 1–64 chars lowercase/hyphens matching the directory; `description` = what + when, ≤1024 chars) + Markdown body. Optional `scripts/`, `references/`, `assets/` directories. Claude Code auto-discovers them; every other agent reads them as plain files via the skills index in `AGENTS.md`. |
| **CLAUDE.md memory convention** (Claude Code docs) | `CLAUDE.md` kept as a thin pointer so Claude Code and AGENTS.md consumers share one source of truth. |
| **Context engineering** (Anthropic engineering; LangChain; Martin Fowler) | Minimum effective context per task; pointers over duplication; structured evidence (hypothesis → measurement → conclusion) in work records. |
| **MADR — Markdown Any Decision Records** (adr.github.io) | Decision log format: Status / Context / Decision / Consequences. |
| **Diátaxis** (diataxis.fr) | Documentation classified into how-to / reference / explanation; each `docs/` file labeled in the docs map. |
| **Docs as Code** (Write the Docs) | Docs versioned, reviewed, and CI-gated with the code. |
| **Conventional Commits** | `feat:`/`fix:`/`docs:`/`chore:` messages with evidence in the body. |

## 4. Operating principles (the professional direction contract)

1. **Understand before executing.** Restate ambiguous requests; the owner explicitly values
   interpreted intent over literal compliance.
2. **Research before building.** Web search on anything unfamiliar; primary sources first;
   cited in the change (skill: `web-research-first`).
3. **Measure before fixing.** No fix without a reproduced symptom and collected evidence
   (skill: `root-cause-fixing`).
4. **Fix at the owning layer.** Architecture absorbs the fix; incident sites stay clean.
5. **Guard after fixing.** Every fix leaves a tripwire that fails if the bug returns.
6. **Verify inside the artifact.** Dev-server truth is not artifact truth (skill: `delivery-packaging`).
7. **Document within the change.** STATE/CHANGELOG/ADR updates are part of the diff
   (skill: `repo-state-maintenance`).
8. **Hand off cleanly.** The session ends when the next agent could start cold — and shouldn't
   need to.

## 5. Reflection: the tools this project actually used

Requested by the owner: *"in your own work, what skills and tools did you use?"* — recorded so
future agents know the proven toolkit for this environment (and so the capability choices below
are grounded in practice, not theory).

| Capability | Tool (as used in phases 1–9) | Typical use on this repo |
|---|---|---|
| Web search | `z-ai` CLI / SDK `web_search` function | Doc taxonomy + PRD standards (ph. 6), agent-direction standards + specs (ph. 9) — saved to `research/*.json` |
| Web reading | `page_reader` function | Pulling the AGENTS.md spec and Agent Skills spec verbatim before writing this system |
| Visual verification | VLM (vision model) on screenshots | Every layout fix: mobile/tablet/desktop QA scoring, before/after comparisons |
| Browser automation | agent-browser (headless CLI) | DOM measurement, interaction tests (drawer, palette, editors), viewport sweeps |
| Image analysis | pixel analysis of bug screenshots | Locating red-circle annotations in owner bug reports (ph. 5, 8) |
| File surgery | Python raw-byte ops | The `[modelId]` dentry quirk; bulk transforms (`transform_globals.py`, `mount-scrollfx.py`) |
| Packaging & ops | bash + git + zip + GitHub CLI/API + Vercel API | Commits, CI, deployments, artifact verification |
| Verification scripts | bash/node scripts in `scripts/` | Sweeps, guards, editor interactions — the same scripts CI now enforces |

**The meta-lesson:** the highest-leverage moments were never "writing more code" — they were
*measuring* (DOM evidence), *searching* (primary-source specs before building), and *guarding*
(turning one painful bug into a permanent CI check). This operating system encodes exactly those
three habits.

## 6. Decision log (MADR-style)

Seeded from real project history so the reasoning survives the humans. Append new records via
the `repo-state-maintenance` skill — never delete or edit accepted records.

### ADR-001: Single premium design system with legacy token bridge — phase 1
- **Status:** accepted
- **Context:** Two conflicting design systems (green "forest" vs purple "luma") produced
  inconsistent components across 20+ pages.
- **Decision:** Rebuild foundations once ("Luminous Premium", violet `#5548E0` on obsidian) and
  bridge legacy tokens to it, so all components inherit the new theme without a big-bang rewrite.
- **Consequences:** One source of visual truth; legacy classes remain load-bearing until fully
  migrated — do not delete the bridge without a full component audit.

### ADR-002: Container queries instead of viewport media queries — phase 3
- **Status:** accepted
- **Context:** Viewport media queries broke constantly (fixed multi-column grids, min-width
  elements, patchwork breakpoints at 1220/1040/840/680/430) because components could not know the
  width actually available after the sidebar.
- **Decision:** Components reflow by *available container width* (bands 1040/880/640/430) via
  `@container ops-page`; intrinsic primitives (`nq-grid` etc.) in `layout.css`; sidebar modes
  keyed to viewport breakpoints (768/1024) from `src/lib/viewports.ts`.
- **Consequences:** Per-element media-query patches are forbidden; every page root must declare a
  container context (CI-enforced since phase 8).

### ADR-003: ScrollFx mounts in page roots, never layouts — phase 6
- **Status:** accepted
- **Context:** Layout-level ScrollFx mutated DOM of lazily-hydrated boundaries → hydration
  mismatches on all app pages; double-rAF and load-event deferrals empirically failed.
- **Decision:** Mount ScrollFx inside each page-root component (React guarantees effects run
  after own subtree hydration).
- **Consequences:** New pages that want scroll effects must include it in their root.

### ADR-004: Anti-regression triple gate — phase 8
- **Status:** accepted
- **Context:** Four editor routes lacked a container context since phase 3 and shipped broken on
  phones because sweeps covered only list pages; a toast sentinel targeted a nonexistent class
  and passed vacuously.
- **Decision:** Static layout guard in CI (`check-layout-guards.mjs`) + full-coverage runtime
  sweep (30 routes × 3 viewports) + editor interaction tests; sentinels must be proven
  non-vacuous; new routes join the matrix the same day.
- **Consequences:** Red gate = layer violation, never "update the check to pass".

### ADR-005: AGENTS.md as the single entry point; agent.md retired to a pointer — phase 9
- **Status:** accepted
- **Context:** The Arabic `agent.md` continuity file was effective but non-standard, monolithic,
  and duplicated content now owned by better-shaped artifacts.
- **Decision:** Adopt the AGENTS.md open standard (root entry), Agent Skills for capabilities,
  `STATE.md` for handoff, MADR log for decisions; `agent.md` becomes a redirect for old links.
- **Consequences:** One source of truth; old sessions' references still resolve; content is
  English (repo standard) while the owner conversation stays Arabic.

### ADR-006: Verify inside the artifact — phases 4–8 (practice, formalized in 9)
- **Status:** accepted
- **Context:** v3 zip shipped without the `@import` wiring for `layout.css` while every dev test
  passed against live `src/`.
- **Decision:** Delivery gate requires artifact-internal verification (grep the wiring, fresh
  install + build from the extracted copy, compiled-CSS proof) — encoded in the
  `delivery-packaging` skill.
- **Consequences:** Dev-server results alone never justify a release.

## 7. Maintenance

This document changes through the `repo-state-maintenance` skill: new principles require a
decision record; new standards require a reference entry in `docs/REFERENCES.md`. Keep it an
*explanation* — operational detail belongs in `AGENTS.md` or the skills.
