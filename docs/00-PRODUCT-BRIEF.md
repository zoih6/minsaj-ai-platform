# Nasaq AI — Product Brief

| | |
|---|---|
| **Product** | Nasaq AI — نَسَق AI |
| **Type** | Unified AI workspace (web application) |
| **Document** | Product Brief (One-Pager) |
| **Version** | 1.0 — 2026-09 |
| **Status** | Approved baseline for the frontend foundation phase |
| **Audience** | Founders, product, design, engineering |
| **Related** | `01-PRD.md` (full requirements), `07-ROADMAP.md` (execution plan) |

---

## 1. One-Sentence Definition

**Nasaq AI is an Arabic-first unified AI workspace that turns a user's intent into a specialized, stateful workflow — and ends every task with a structured, saveable, resumable output.**

## 2. Problem

Arabic-speaking professionals currently jump between disconnected AI tools, chat windows, and platforms to finish a single task. The consequences are measurable and repeated daily:

- **Context loss** — every tool switch resets the working context; users re-explain their task repeatedly.
- **Tool confusion** — users must know which model or product to pick *before* knowing what they want to accomplish.
- **Unorganized results** — answers live and die inside chat threads; there is no durable, structured output artifact.
- **No continuation** — returning to yesterday's work means scrolling chat history or starting over.
- **Truth ambiguity** — interfaces routinely imply that search, execution, or retrieval happened when it did not.
- **Weak Arabic/RTL** — global products treat Arabic as a translation layer, not a native design foundation.

## 3. Solution

A single product organized around **workspaces**, not models:

```
Intent → Workspace → Context → Execution → Structured Output → Save → Resume/Evolve
```

1. The user starts from **what they want to accomplish** — not from a model picker.
2. The system routes the intent to the right specialized workspace (Learn, Research, Create, Code, Analyze, Explore — or plain Ask & Talk).
3. Each workspace is a real workflow: inputs, steps, state, and a **defined output** (learning path, research report, document, code review, analysis, exploration journey).
4. Outputs are saved to the **Library** with versions, status, and provenance.
5. Work is **resumable**: users return to saved outputs and evolve them instead of restarting.

## 4. Product Promise

> "From a simple idea to a result you can understand, edit, save, and return to."
> «من فكرة بسيطة إلى نتيجة يمكنك فهمها وتعديلها وحفظها والعودة إليها.»

## 5. Why Now / Why Us

- **Arabic-first gap**: No leading AI workspace treats Arabic, RTL, and mixed-direction text as native product foundations rather than afterthoughts.
- **Workflow-over-chat gap**: The market is saturated with chat wrappers; durable, output-oriented workflows remain rare.
- **Trust gap**: Nasaq's hard *Truth & Execution* rules (never imply an action that did not happen) directly answer the growing user distrust of AI products.

## 6. Target Users (summary)

| Persona | Core need |
|---|---|
| Independent professional | Research, summarize, draft, deliver client-ready outputs |
| Content creator | Idea → brief → structured content with versions |
| Developer | Understand, plan, and review code changes safely |
| Learner | Guided learning paths with progress and resumption |
| Small team *(later)* | Shared projects, roles, activity history |

## 7. Non-Goals (for the current phase)

- Not a general-purpose search engine.
- Not a bare chat app.
- Not an autonomous agent with unrestricted device/system access.
- Not a full enterprise automation platform, IDE replacement, or BI suite.
- No real backend services in this phase — the frontend foundation ships against a typed mock layer (`@nasaq/mock-api`) designed for later replacement.

## 8. Phase Strategy

| Release | Name | Goal |
|---|---|---|
| **R0** (current) | UI Foundation | Full bilingual, RTL-native, responsive prototype of the entire product surface with mock data |
| **R1** | Interactive Prototype | Stateful journeys end-to-end: progress, cancel, retry, outputs, versions, truth receipts |
| **R2** | Personal Alpha | Auth + persistence: real accounts, projects, permanent library |
| **R3** | Real AI Services | Replace simulation with real model providers, live search, citations |
| **R4** | Controlled Automation | Bounded agents, skills, flows with explicit approvals |

## 9. Success Signals (to be quantified in the PRD open questions)

- Users understand the entry point without training.
- Time-to-first-useful-output decreases with usage.
- Save rate and resume rate of outputs grow.
- Zero trust incidents (interface implying actions that never happened).

## 10. Current Status

The UI Foundation (R0) is complete and verified: 20+ app routes, 7 workspaces, bilingual AR/EN with full RTL/LTR, three-tier responsive architecture (mobile drawer / tablet rail / desktop expanded), and a unified premium design system — all validated across 63 automated viewport checks. The next step is the R1 experience sprint: interaction states, motion system, and performance (see `07-ROADMAP.md`).
