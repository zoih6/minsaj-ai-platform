# REFERENCES — Research Sources & Standards

> Sources consulted when building this repository's agent operating system (phase 9, 2026-09-16)
> and its professional documentation suite (phase 6). Primary sources are linked so future
> agents can re-verify rather than trust memory.

## Standards followed in this repository

| Standard / practice | Primary source |
|---|---|
| AGENTS.md open standard ("README for agents"; adopted by OpenAI Codex, Cursor, Google Jules, Devin, Gemini CLI, GitHub Copilot, Amp, Windsurf, Junie; 60k+ repos; nested files for monorepos) | <https://agents.md> |
| Anthropic Agent Skills — SKILL.md format spec (YAML frontmatter: `name` 1–64 chars lowercase/hyphens matching directory; `description` ≤1024 chars stating what + when; optional `scripts/`, `references/`, `assets/`; progressive disclosure) | <https://agentskills.io/specification> · <https://www.anthropic.com/news/skills> · <https://github.com/anthropics/skills> |
| Claude Code project memory (`CLAUDE.md`) and project skills (`.claude/skills/`) | <https://code.claude.com/docs/en/memory> |
| Context engineering for agents (minimum effective context; write/select/compress/isolate) | <https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents> · <https://blog.langchain.com/context-engineering> · <https://martinfowler.com/articles/context-engineering-for-coding-agents.html> |
| MADR — Markdown Any Decision Records (Status/Context/Decision/Consequences) | <https://adr.github.io/madr/> |
| Diátaxis documentation framework (tutorials / how-to / reference / explanation) | <https://diataxis.fr> |
| Docs as Code (docs versioned, reviewed, CI-gated with code) | <https://www.writethedocs.org/guide/docs-as-code/> |
| OpenAI prompt-engineering best practices (clear instructions, examples, decomposition) | <https://help.openai.com/articles/prompt-engineering-best-practices> |
| Cursor rules guidance (focused, actionable, scoped rules) | <https://cursor.com/docs/context/rules> |

## Phase-9 research notes (raw search results)

12 topic searches + verbatim spec fetches, archived at
`/home/z/my-project/research/agent-os/*.json` (sandbox workspace). Topics covered: AGENTS.md
spec & practice, CLAUDE.md conventions, Agent Skills spec, context engineering, Cursor rules,
agent onboarding, ADR formats, Diátaxis, prompting practices, handoff patterns, docs-as-code.

## Phase-6 research notes (documentation suite)

5 searches archived at `/home/z/my-project/research/*.json`: document taxonomy
(BRD/MRD/PRD/FRD/SRS), PRD best practices (Atlassian/Figma/Product School/Lenny's),
UX-spec structure, API contract-first design (Evil Martians), and documentation models.

---

*Maintained by the `web-research-first` and `repo-state-maintenance` skills: new standards or
decision-shaping sources get added here in the same change that relied on them.*

### Phase 10 — Dynamic theming & contrast engineering (2026-09-16)
- next-themes (dark-mode library, shadcn/ui standard): <https://github.com/pacocoursey/next-themes>
- Material Design 3 — Dark theme: <https://m3.material.io/styles/color/system/overview>
- Apple HIG — Dark Mode: <https://developer.apple.com/design/human-interface-guidelines/dark-mode>
- WCAG contrast requirements: <https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html>
- Three-option theme chooser UX: <https://clagnut.com/blog/2025/three-option/> ·
  Tri-state discussion: <https://lea.verou.me/blog/2026/theme-ternary/>
- Flash-of-inaccurate-color-theme (FOUC/FART): <https://css-tricks.com/flash-of-inaccurate-color-theme/>
- prefers-color-scheme live sync (MDN): <https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme>
- Sun/moon animated toggle (web.dev): <https://web.dev/articles/building/a-theme-switch-component>
- Anthropic Agent Skills catalog (skill authoring reference): <https://github.com/anthropics/skills>
