# Minsaj AI — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Minsaj AI — منسج AI |
| **Document ID** | MINSAJ-PRD |
| **Version** | 3.0 |
| **Status** | Active — Baseline for the frontend foundation phase |
| **Owner** | Product (Minsaj) |
| **Contributors** | Product, Design, Engineering |
| **Language** | English (working) · Product UI: Arabic-first, English second |
| **Format** | Follows modern PRD practice (Atlassian, Figma, Product School references) — *what* and *why*, not *how* |
| **Supersedes** | PRD v2.0 (Arabic draft, 2026) |
| **Related docs** | `00-PRODUCT-BRIEF.md` · `02-UX-SPECIFICATION.md` · `04-FRONTEND-ARCHITECTURE.md` · `07-ROADMAP.md` |

---

## 1. Executive Summary

Minsaj AI is an **Arabic-first unified AI workspace** that helps a user turn an idea, question, or task into an organized, usable result — instead of forcing them to jump between separate tools and disconnected conversations.

The experience starts from the **user's intent**, not from model or provider selection. The user describes what they want to accomplish; Minsaj helps them reach the right workspace — **Ask & Talk, Learn, Research, Create, Code, Analyze, or Explore** — where the work happens with proper context, steps, state, and a defined output. Outputs are saved, versioned, and resumable inside **Projects** and the **Library**.

Minsaj is not another chat interface. The core product value is converting AI interaction into **workflows that have context, state, a clear output, and the ability to save, resume, and evolve**.

**Core product principle:**

> "Start from your idea, work on it, get an understandable result, save it, then return to it and evolve it."

The product must always make the distinction clear between: what was actually executed · what was generated · what was computed · what was simulated · what was not executed · what requires an external source or connection · and what is uncertain.

### 1.1 Requirement Coverage at a Glance

| Area | IDs | Count |
|---|---|---|
| Workspaces | FR-ASK / FR-LEARN / FR-RES / FR-CREATE / FR-CODE / FR-ANL / FR-EXP | 49 |
| Projects & Library | FR-PROJ / FR-LIB | 19 |
| Sessions, state, outputs | FR-GEN / FR-STATE / FR-OUT | 19 |
| Accounts & future team | FR-ACC / FR-TEAM | 10 |
| UX & accessibility | UX-001…UX-011 | 11 |
| Truth & execution | TRUTH-001…TRUTH-009 | 9 |
| Non-functional | NFR-001…NFR-010 | 10 |
| Business rules | BR-001…BR-008 | 8 |

---

## 2. Problem & Opportunity

### 2.1 The Problem

Users of AI tools suffer from **fragmented workflows**: to complete one real task they must move between tools, chat windows, and platforms. The direct consequences are:

1. Loss of context — the task must be re-explained in every new tool.
2. Repeated effort — files are re-uploaded, prompts re-pasted.
3. Tool-choice anxiety — the user must know the tool *before* knowing the task.
4. No visibility into what actually happened — did the system really search? execute? compute?
5. Unstructured results — the "answer" dies inside a chat thread.
6. Lost outputs — previous work is unrecoverable or unreproducible.
7. Hard returns — resuming yesterday's work is practically impossible.
8. Real vs. simulated confusion — interfaces blur the line between what ran and what was staged.
9. Weak Arabic and RTL experiences in the majority of global tools.

### 2.2 The Functional Gap

Users do not always need an "answer". They need a **report, a plan, a learning path, an analysis, a document, a code review, a project — a saved, resumable workflow.** Therefore the product must move the experience from:

```
Question → Answer
```

to:

```
Intent → Workflow → Output → Continuation
```

### 2.3 Core Hypothesis (testable, not assumed)

> If Minsaj provides a simple entry point that starts from the task, then moves the user into a suitable workspace with clear context, appropriate steps, and a saveable output, then the user will accomplish real value faster and with higher confidence.

This hypothesis must be validated through usage, not assumed true.

---

## 3. Vision, Promise & Principles

### 3.1 Vision

To be the **clearest and most trustworthy Arabic workspace** for getting real work done with AI.

### 3.2 Promise

> "From a simple idea to a result you can understand, edit, save, and return to."

### 3.3 Product Principles

| ID | Principle | Meaning |
|---|---|---|
| P-01 | **Task before technology** | The user starts from what they want to accomplish — not from a list of models, providers, or technical settings. |
| P-02 | **Clarity before dazzle** | The user must always understand what happened and what did not. |
| P-03 | **Output over conversation** | When the task calls for an output, the conversation itself is not the deliverable. |
| P-04 | **Specialization when needed** | Not every kind of work should be forced into one chat experience. |
| P-05 | **Arabic as a foundation** | Arabic and RTL are part of the product's structure — not a later translation layer. |
| P-06 | **User in control** | No impactful or external actions without appropriate clarity and consent. |
| P-07 | **Progressive disclosure** | Start simple; advanced capabilities appear when needed. |
| P-08 | **Truth before claims** | The UI must never imply that an action occurred if it did not. |
| P-09 | **Continuity** | Work must be saveable, resumable, and evolvable. |

---

## 4. Target Users, Personas & Jobs-to-be-Done

### 4.1 Personas

#### PA-1 · Independent Professional
Writers, researchers, marketers, consultants, product managers, designers, founders.
**Needs:** research, summarization, idea organization, content creation, information analysis, converting knowledge into deliverables, saving and resuming work.

#### PA-2 · Content Creator
**Needs:** idea → brief, structure development, content drafting, alternatives, review, versioning, reuse of previous outputs.

#### PA-3 · Developer
**Needs:** understanding technical problems, code analysis, change review, implementation planning, diff review, risk awareness, result verification.
*Phase-1 boundary:* no actual code execution or system commands without a separate security/permissions/approval layer.

#### PA-4 · Learner
**Needs:** topic explanation, level placement, learning paths, gradual study, comprehension checks, hints, progress saving, resuming from a previous point.

#### PA-5 · Small Team *(post-R2, gradual)*
**Needs:** shared projects, shared context, saved outputs, roles and permissions, activity history, sharing.
Not launch-critical for the first releases.

### 4.2 Jobs-to-be-Done

| ID | When… | I want… | So that… |
|---|---|---|---|
| JTBD-01 | I have a task and don't know the right tool | to describe what I want to accomplish | the system helps me start the right path |
| JTBD-02 | I'm working on a complex topic | a dedicated workspace | I don't have to re-organize the conversation manually |
| JTBD-03 | I get a result | to convert it into a structured output | I can use it outside the chat |
| JTBD-04 | I pause my work | to save it | I can return without losing context |
| JTBD-05 | I edit a previous result | to know what changed | I don't lose the earlier version unintentionally |
| JTBD-06 | the system performs an action | to know what actually ran | I can trust the result |

---

## 5. Product Scope

### 5.1 In Scope — First Releases

- Landing/marketing site (AR/EN).
- Home entry point ("What do you want to accomplish today?").
- Workspaces: **Ask & Talk, Learn, Research, Create, Code, Analyze, Explore**.
- **Projects** (grouping sessions, outputs, and working context).
- **Library** (unified saved outputs with search and filters).
- Arabic + English, full **RTL/LTR**.
- Core working states: **loading, empty, error, success, disabled, partial**.
- Save & resume, versions.
- Explicit separation of **simulated vs. real** execution.

### 5.2 Out of Scope — All First Releases

- Arbitrary command execution; untrusted code execution on the server.
- An agent with unrestricted device access.
- A public agent marketplace.
- Dozens of AI providers in the first release.
- Native mobile applications.
- Enterprise SSO/SCIM.
- Autonomous financial, legal, or medical automation.
- Automatic publishing, sending, or purchasing without consent.
- Formal compliance claims before specialized review.

---

## 6. System Mental Model

The product is composed of functional layers:

```
Entry Layer            → where the user describes intent
  ↓
Intent Understanding   → classify, suggest workspace, explain why
  ↓
Workspace Layer        → specialized experience per task type
  ↓
Task Execution         → steps, tools, state
  ↓
Output Layer           → the structured, usable result
  ↓
Persistence Layer      → save, version, resume
  ↓
Projects / Library     → grouping, retrieval, continuation
```

### 6.1 Entry Layer
The home surface provides one clear entry point close to: *"What do you want to accomplish today?"*. The user may write a question, describe a task, or pick a starting point ("I want to learn / research / create / work on code / understand data / explore a topic").

### 6.2 Routing (Intent → Workspace)
When a request fits a specialized workspace:
1. The system identifies the suggested workspace.
2. It explains **why** it is suggested.
3. It shows **what context will carry over**.
4. The user confirms.
5. The workspace opens.

Transitions must never be ambiguous, and context must never be lost without the user's knowledge.

### 6.3 Workspace Contract
Every workspace defines: goal · context · inputs · steps · state · available tools · expected output · review options · save behavior · execution limits.

### 6.4 Output Contract
A task is **not complete** merely because a text reply appeared, whenever the task type calls for an output (learning path, research report, document, presentation, code review, analysis, exploration journey).

---

## 7. Functional Requirements

Priority notation (MoSCoW): **M** = Must (P0) · **S** = Should (P1) · **C** = Could (P2).

### 7.1 Ask & Talk

| ID | Priority | Requirement |
|---|---|---|
| FR-ASK-001 | M | The user can enter a question or task description. |
| FR-ASK-002 | M | The system can answer directly when general conversation suffices. |
| FR-ASK-003 | M | The system can suggest a specialized workspace when it fits the task better. |
| FR-ASK-004 | M | The system explains the reason for the suggestion. |
| FR-ASK-005 | M | The user can preview the context that will carry over. |
| FR-ASK-006 | M | The user confirms before a specialized workspace opens. |
| FR-ASK-007 | M | Only the context the user selected is carried over. |

*Out of scope:* unlimited agents; automatic external actions; claims of live search without a real connection.

### 7.2 Learn

| ID | Priority | Requirement |
|---|---|---|
| FR-LEARN-001 | M | The user selects the learning topic. |
| FR-LEARN-002 | M | The user sets a level or takes a placement diagnostic. |
| FR-LEARN-003 | M | The system proposes a learning path. |
| FR-LEARN-004 | M | The user reviews the path before adopting it. |
| FR-LEARN-005 | M | The system displays the current lesson. |
| FR-LEARN-006 | M | The system provides a comprehension check. |
| FR-LEARN-007 | M | The system provides feedback, hints, or retry. |
| FR-LEARN-008 | M | Progress is saved. |
| FR-LEARN-009 | M | The user can resume the path. |

**Output:** a saved learning path containing topic, level, lessons, completed lessons, progress percentage/status, notes, and review checkpoints.

### 7.3 Research

| ID | Priority | Requirement |
|---|---|---|
| FR-RES-001 | M | The user defines the research question. |
| FR-RES-002 | M | Scope is defined when needed. |
| FR-RES-003 | M | The desired result format is defined. |
| FR-RES-004 | M | The system produces a reviewable research plan. |
| FR-RES-005 | M | Available sources are separated from unavailable ones. |
| FR-RES-006 | M | Claims are linked to evidence when evidence exists. |
| FR-RES-007 | M | Conflicting sources are surfaced. |
| FR-RES-008 | M | Insufficient evidence is surfaced when present. |
| FR-RES-009 | M | The system produces a structured report. |
| FR-RES-010 | M | The report is saved. |

**Truth rule:** live search, sources, citations, and web-browsing results must never be presented as having happened unless the connection was actually made and the operation actually executed.

### 7.4 Create

| ID | Priority | Requirement |
|---|---|---|
| FR-CREATE-001 | M | The system accepts a brief or structured input. |
| FR-CREATE-002 | M | A draft structure is built before the final output when appropriate. |
| FR-CREATE-003 | M | The user can edit content. |
| FR-CREATE-004 | S | The system proposes alternatives. |
| FR-CREATE-005 | M | Sections can be added, removed, and reordered. |
| FR-CREATE-006 | M | Versions are saved. |
| FR-CREATE-007 | M | The output clearly states whether it is real or simulated. |

### 7.5 Code

| ID | Priority | Requirement |
|---|---|---|
| FR-CODE-001 | S | The user defines the project or problem scope. |
| FR-CODE-002 | S | The system presents the change plan. |
| FR-CODE-003 | S | Related files/segments are shown when available. |
| FR-CODE-004 | S | A reviewable diff is displayed. |
| FR-CODE-005 | S | The user can accept or reject parts of the change. |
| FR-CODE-006 | S | Available check results are displayed. |
| FR-CODE-007 | S | A review receipt lists: what was checked, what was changed, what was not executed, what was not verified. |

**Safety boundaries (hard):** FR-CODE-008 no arbitrary shell commands · FR-CODE-009 no user code execution on the server without a secure isolated runtime · FR-CODE-010 no auto-publish/merge in the first phase · FR-CODE-011 no access to real projects/files before explicit permissions and security exist.

### 7.6 Analyze

| ID | Priority | Requirement |
|---|---|---|
| FR-ANL-001 | S | The dataset/data source is identified. |
| FR-ANL-002 | S | A data profile is shown when appropriate. |
| FR-ANL-003 | S | The analytical question is defined. |
| FR-ANL-004 | S | The system proposes an analysis plan. |
| FR-ANL-005 | S | Permitted calculations are executed. |
| FR-ANL-006 | S | Suitable tables or charts are shown. |
| FR-ANL-007 | S | Computation is separated from interpretation. |
| FR-ANL-008 | S | Missing values and warnings are surfaced. |
| FR-ANL-009 | S | The analysis is saved. |

**Output contains:** data used, transformations, calculations, charts, assumptions, warnings, interpretation.

### 7.7 Explore

| ID | Priority | Requirement |
|---|---|---|
| FR-EXP-001 | S | The starting topic is defined. |
| FR-EXP-002 | S | Related concepts/relations are displayed. |
| FR-EXP-003 | S | The reason a relation appears is explained when needed. |
| FR-EXP-004 | S | A navigable path with backtracking is provided. |
| FR-EXP-005 | S | Alternative branches are offered. |
| FR-EXP-006 | S | A point or journey can be saved. |

### 7.8 Projects

| ID | Priority | Requirement |
|---|---|---|
| FR-PROJ-001 | M | Projects can be created. |
| FR-PROJ-002 | M | A project name is set. |
| FR-PROJ-003 | M | An optional description is supported. |
| FR-PROJ-004 | M | Sessions link to projects. |
| FR-PROJ-005 | M | Outputs link to projects. |
| FR-PROJ-006 | S | File support when the capability arrives. |
| FR-PROJ-007 | C | Project members when collaboration ships. |
| FR-PROJ-008 | C | Activity log when collaboration ships. |

### 7.9 Library

| ID | Priority | Requirement |
|---|---|---|
| FR-LIB-001 | M | Outputs the user can access are listed. |
| FR-LIB-002 | M | Output type is displayed. |
| FR-LIB-003 | M | Status is displayed. |
| FR-LIB-004 | M | Created/updated dates are displayed. |
| FR-LIB-005 | M | Version is displayed. |
| FR-LIB-006 | M | Search is provided. |
| FR-LIB-007 | M | Appropriate filtering is provided. |
| FR-LIB-008 | M | An output can be opened and resumed. |
| FR-LIB-009 | M | A saved version is never silently overwritten. |
| FR-LIB-010 | M | Editing a saved output creates unsaved-changes state or a new version. |
| FR-LIB-011 | M | Deletion is explicit and clear. |

### 7.10 Team & Workspace *(future, post-R2)*

FR-TEAM-001 member invitations · FR-TEAM-002 basic roles (Owner/Editor/Viewer) · FR-TEAM-003 project sharing · FR-TEAM-004 output sharing · FR-TEAM-005 activity log · FR-TEAM-006 workspace policies.

### 7.11 Models & Usage *(future, advanced users)*

Model capability display, comparison, status/availability, usage source, consumption limits, cost estimation, actual cost when data exists. **Never display a provider, model, or cost as actually used unless it was.**

---

## 8. Session, State & Output Requirements

### 8.1 Task State Machine

```
Idle → Preparing → Running → Waiting → Review → Completed
Running → Failed → Retry
Running → Cancelled
```

| ID | Requirement |
|---|---|
| FR-STATE-001 | A task never transitions to Success merely because a UI timer ended. |
| FR-STATE-002 | Current state is clearly displayed. |
| FR-STATE-003 | Cancel is available when the operation is cancellable. |
| FR-STATE-004 | Retry is available when it makes sense. |
| FR-STATE-005 | Saved state survives page refresh. |

### 8.2 Output Record

Every saved output carries at minimum:

`Output ID · Output Type · Title · Status · Created At · Updated At · Version · Owner · Source/Context · Execution State · Warnings · Limitations`

**Output statuses:** `Draft · In Progress · Ready for Review · Completed · Failed · Archived`.

### 8.3 General Functional Requirements

| ID | Area | Requirement |
|---|---|---|
| FR-ACC-001 | Accounts | Account creation is supported in Alpha. |
| FR-ACC-002 | Accounts | Login is supported. |
| FR-ACC-003 | Accounts | User data is isolated. |
| FR-ACC-004 | Accounts | Language and direction preferences persist. |
| FR-GEN-001 | Projects | More than one project is supported. |
| FR-GEN-002 | Sessions | Every session has a state. |
| FR-GEN-003 | Sessions | Saved state is never silently lost. |
| FR-GEN-004 | Sessions | Cancellation is supported when possible. |
| FR-GEN-005 | Sessions | Retry is supported when possible. |
| FR-GEN-006 | Outputs | Every saved output has a type. |
| FR-GEN-007 | Outputs | Every output has a title. |
| FR-GEN-008 | Outputs | Every output has a status. |
| FR-GEN-009 | Outputs | Every output has a version. |
| FR-GEN-010 | Outputs | Source/context is recorded when relevant. |
| FR-GEN-011 | Outputs | What was and was not executed is clarified. |

---

## 9. UX Requirements

| ID | Requirement |
|---|---|
| UX-001 | Core functions are understandable without technical knowledge. |
| UX-002 | The main path is clear from start to output. |
| UX-003 | Designed states: Loading, Empty, Error, Success, Disabled, Partial, Offline/unavailable (where applicable). |
| UX-004 | Arabic and English are supported natively. |
| UX-005 | Font sizes, spacing, and line heights suit Arabic text. |
| UX-006 | Core actions work on phones without zooming or unnecessary horizontal scrolling. |
| UX-007 | The interface must not be designed desktop-first then squeezed onto phones — responsive/adaptive layout is a first-class requirement. |
| UX-008 | Sidebars transform into an appropriate small-screen experience. |
| UX-009 | Motion is functional and restrained. |
| UX-010 | Reduced-motion preference is respected. |
| UX-011 | Arabic, English, code, links, numbers, and mixed text coexist without breaking direction or alignment. |

---

## 10. Truth & Execution Requirements

These are product-level, non-negotiable requirements:

| ID | Requirement |
|---|---|
| TRUTH-001 | The system never uses wording implying an action executed when it did not. |
| TRUTH-002 | "Searched" appears only after a real search was performed. |
| TRUTH-003 | "Code executed" appears only after real execution in a suitable environment. |
| TRUTH-004 | Selecting a file does not imply its content was read. |
| TRUTH-005 | Previewing code does not imply executing code. |
| TRUTH-006 | Analyses clarify what was actually computed. |
| TRUTH-007 | Saving clarifies where the data is saved when relevant. |
| TRUTH-008 | Actual cost is shown only when based on actual data. |
| TRUTH-009 | Simulations are clearly labeled as simulations. |

---

## 11. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Performance | Core paths respond within budgets defined in the technical spec (numeric targets pending — see Open Questions). |
| NFR-002 | Reliability | User data and task state are never silently lost. |
| NFR-003 | Resumability | Users can return to saved work. |
| NFR-004 | Security | User data is isolated; unauthorized access is prevented. |
| NFR-005 | Privacy | Data/file usage is clarified before real services activate. |
| NFR-006 | Scalability | The architecture must not assume a permanently small user/output base. |
| NFR-007 | Compatibility | Core paths are tested on phone, tablet, and desktop. |
| NFR-008 | Language | Adding English must not break Arabic or RTL. |
| NFR-009 | Accessibility | Keyboard navigation, focus visibility, non-color-only signals, clear control labels, understandable errors, semantic structure, text zoom, reduced motion — on core paths. Target standard to be decided (Open Question #13). |
| NFR-010 | Maintainability | A single design system and a single layout architecture serve the entire product surface. |

---

## 12. Business Rules

| ID | Rule |
|---|---|
| BR-001 | The user defines the task's final goal. |
| BR-002 | Suggesting a workspace never means auto-navigating to it. |
| BR-003 | An output is not successful merely because the technical process finished. |
| BR-004 | Saved outputs are never silently replaced. |
| BR-005 | Any impactful external action requires appropriate consent. |
| BR-006 | Unverified information is visually distinguished. |
| BR-007 | Simulations are always distinguishable. |
| BR-008 | The product never claims to have used a service it did not use. |

---

## 13. User Stories & Acceptance Criteria

### 13.1 User Stories

| ID | As a… | I want… | So that… |
|---|---|---|---|
| US-001 | user | to describe what I want to accomplish from the home page | I can start without knowing which tool I need |
| US-002 | user | the system to suggest a suitable workspace | I don't need to memorize the product structure |
| US-003 | user | to know why a workspace was suggested | I can make an informed decision |
| US-004 | user | my task to become a structured output | I can use the result |
| US-005 | user | to save the output | I can return to it later |
| US-006 | user | to resume previous work | I don't have to rebuild context |
| US-007 | user | to know what was executed | I can trust the result |
| US-008 | user | to edit an output without losing the prior version | I can compare changes and roll back |

### 13.2 Acceptance Criteria

| ID | Given / When / Then |
|---|---|
| AC-001 | **Given** the user opens the home page **When** they begin using the product **Then** they can understand the starting point without technical knowledge. |
| AC-002 | **Given** the user describes a task that fits a specialized workspace **When** the system suggests it **Then** the reason is explained. |
| AC-003 | **Given** the user moves into a workspace **When** work starts **Then** no agreed context is lost. |
| AC-004 | **Given** the task finished **When** there is no successful output **Then** the task must not be shown as successful. |
| AC-005 | **Given** the user saved an output **When** they return to the Library **Then** they find it. |
| AC-006 | **Given** the user edits a saved output **When** unsaved changes exist **Then** the state is clear and the saved version is not silently replaced. |
| AC-007 | **Given** live search is not connected **When** the user requests research **Then** the system must not claim a live search happened. |
| AC-008 | **Given** the user is on a phone **When** using the core path **Then** all core actions are usable without unnecessary horizontal overflow. |

---

## 14. Edge Cases & State Design

### 14.1 Edge Cases the Product Must Handle

Empty submissions · ambiguous requests · requests with no clear workspace · provider failure · connectivity loss · timeouts · save failure · version conflicts · access expiry · invalid file · large file · unsupported content · long-running operations · cancel mid-execution · retry · partial outputs · unavailable source · insufficient data · unavailable model · unknown cost · zero results.

### 14.2 Error & Empty State Contract

Every error state contains, whenever possible:

1. What happened.
2. Why it happened.
3. What the user can do.
4. Whether any data was lost.
5. Whether retry is possible.

**Reference copy pattern:**

> "We couldn't complete the operation. Your saved work was not lost. You can retry, or return to the last saved version."

Technical, non-actionable messages are forbidden in user-facing errors.

---

## 15. Prioritization & Release Plan

### 15.1 Priority Bands

**P0 — Must Have (first releases):** Home · Ask & Talk · Learn · Research · Create · Outputs · Save · Resume · Arabic · English · RTL/LTR · Responsive · Loading/Empty/Error/Success states · Simulation-vs-execution clarity · No silent state loss.

**P1 — Should Have:** Advanced Code · Analyze · Explore · Advanced Projects/Library · Versions · Authentication · Persistent storage · Real search · Real files · Usage & cost.

**P2 — Could Have:** Team · Collaboration · Agents · Flows · Automation · BYOK · External integrations · Marketplace · Native mobile apps.

### 15.2 Releases

| Release | Name | Goal | Scope highlights |
|---|---|---|---|
| **R0** | UI Foundation *(done)* | Prove product structure & UX | Home, navigation, workspaces, Library, Projects, clear mock data, AR/EN, RTL/LTR, responsive |
| **R1** | Interactive Prototype | Core journeys are experientiable end-to-end | Session states, progress, cancel, retry, outputs, editing, save, versions, truth & limits receipts, responsive tests, accessibility tests |
| **R2** | Personal Alpha | Connect the product to real user data | Auth, database, projects, permanent library, files within safe limits, account permissions, activity log |
| **R3** | Real AI Services | Replace simulation with real services gradually | One or more model providers, live search, clear sources, real file analysis, real outputs, usage management, cost management, quality evaluation in AR & EN |
| **R4** | Controlled Agents & Automation | Multi-step execution with explicit limits | Agent definition, tools, skills, run plans, approvals, cancellation, resumption, execution log, observable flows |

---

## 16. Definition of Done (Feature Level)

A feature is complete only when **all** of the following hold:

1. The core journey is executable.
2. Loading state exists. 3. Empty state exists. 4. Error state exists. 5. Success state exists. 6. A proper failure state exists.
7. Cancellation works where needed. 8. Retry works where needed.
9. The output is clear. 10. Saving works when saving is part of the requirement.
11. Arabic and English both work. 12. RTL/LTR works.
13. Works on phone and desktop. 14. Keyboard works on core paths.
15. No dead buttons. 16. No misleading actions. 17. No fake execution claims.
18. No broken links in the path. 19. No critical errors. 20. Risk scenarios were tested.

---

## 17. Assumptions, Constraints & Dependencies

### 17.1 Assumptions (to be validated)

| ID | Assumption |
|---|---|
| A-001 | Users want a task-based entry point instead of choosing a model/tool first. |
| A-002 | Specialized workspaces deliver more value than one general chat for all work types. |
| A-003 | Users care about returning to outputs and evolving them. |
| A-004 | Clarity about what executed increases trust. |
| A-005 | Native Arabic support is real value for the target audience. |
| A-006 | A useful prototype can ship before real services are connected. |

### 17.2 Constraints

| ID | Constraint |
|---|---|
| C-001 | Arabic is the primary language. |
| C-002 | RTL/LTR must be supported. |
| C-003 | No unsupervised execution of high-impact actions. |
| C-004 | Real services arrive gradually. |
| C-005 | Non-existent capabilities must never be presented as real. |
| C-006 | A clear separation between prototype, simulation, and actual services must be maintained. |

### 17.3 Dependencies

Model providers · search service · file service · database · auth service · storage · secure code-execution runtime (when introduced) · measurement & monitoring systems. Each dependency's source and criticality must be defined in the technical documentation before implementation.

---

## 18. Risks & Mitigations

| ID | Risk | Mitigation |
|---|---|---|
| R-001 | **Scope inflation** — too many workspaces before the core value is proven. | Launch workspaces gradually; tie each to a clear outcome. |
| R-002 | **Becoming a chat wrapper** — workspaces degrade into different skins of the same chat. | Each workspace must genuinely differ in inputs, context, workflow, tools, output, and success criteria. |
| R-003 | **Trust loss** — showing non-executed operations as executed. | Enforce Truth & Execution requirements product-wide. |
| R-004 | **Early complexity** — surfacing models, providers, cost, and settings too early. | Progressive disclosure; advanced details appear on demand. |
| R-005 | **Weak phone experience** — designing desktop-first then squeezing. | Treat the phone as a primary platform from the first design decision. |
| R-006 | **Context loss** — losing task state on transitions or refresh. | A clear model for state, saving, and resumption. |
| R-007 | **Single-provider lock-in.** | Separate product experience from provider details; the technical architecture defines the mechanism. |

---

## 19. Open Questions

Answers must not be assumed during implementation:

1. Business model? 2. Pricing mechanism? 3. First target geography? 4. Prototype success criteria? 5. Target KPI values? 6. Initial model providers? 7. BYOK in Alpha or later? 8. Supported file types? 9. File size limits? 10. Data retention policy? 11. Account deletion policy? 12. Collaboration level in the first Team release? 13. Target accessibility standard (e.g., WCAG 2.1 AA)? 14. Officially supported browsers? 15. Officially supported devices? 16. Code execution boundaries? 17. External services used by Research? 18. Agent capability boundaries? 19. Approval flows required for external operations? 20. Future compliance requirements?

---

## 20. Product Decisions (current)

| ID | Decision |
|---|---|
| DEC-001 | The product is Arabic-first. |
| DEC-002 | RTL is a native part of the design. |
| DEC-003 | The task is the starting point — not the model. |
| DEC-004 | The output outweighs the conversation whenever the task calls for an output. |
| DEC-005 | Saving and resumption are core product value. |
| DEC-006 | Simulation is always clearly marked. |
| DEC-007 | No execution claims without actual execution. |
| DEC-008 | Agents and advanced automation come after the foundation. |
| DEC-009 | Enterprise collaboration is not the first-launch priority. |
| DEC-010 | The frontend ships against a typed mock layer (`@minsaj/mock-api`) with contracts designed for a clean swap to real services (`05-BACKEND-INTEGRATION-READINESS.md`). |

---

## 21. Traceability Chain

Every significant product element follows:

```
Product Goal → User Need → Capability → Requirement → User Story →
Acceptance Criteria → Test → Release
```

**Reference example:**

| Level | Value |
|---|---|
| Goal | Enable the user to return to their work. |
| User need | "I don't want to lose my work." |
| Capability | Persistence & Resume |
| Requirement | FR-LIB-008 |
| User story | US-006 |
| Acceptance | AC-005 / AC-006 |
| Test | Verify save → reload → resume |
| Release | R1 — Interactive Prototype |

---

## 22. Document Standards & References

This PRD follows modern product documentation practice, focused on problem/outcome, users and needs, scope, functional requirements, success criteria, acceptance criteria, assumptions, constraints, risks, dependencies, releases, open questions, and the separation of PRD ("what & why") from technical specifications ("how"). Reference practices: Atlassian PRD guidance, Figma's PRD template guide, Product School's PRD template, Lenny's Newsletter PRD examples, and the BRD/MRD/PRD/SRS taxonomy as covered by Modern Requirements and ClickHelp.

This document is a **living document** — it is updated as information and decisions change, not written once and abandoned.

## 23. Document History

| Version | Date | Change |
|---|---|---|
| 2.0 | 2026 (draft) | Arabic draft — content base, marked "weak/cluttered as PRD" by the author. |
| 3.0 | 2026-09 | Professional rewrite in English: restructured to industry-standard PRD format; MoSCoW priorities added to all FRs; state machines and output contracts consolidated; traceability and DoD formalized; frontend-phase decisions (DEC-010) added. |
