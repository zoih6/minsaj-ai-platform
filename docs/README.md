# Nasaq AI — Documentation Suite

> Single source of truth for product, design, and engineering documentation. English is the working language of these documents; the product UI is Arabic-first with full English support.

## Suite Contents

| # | Document | Purpose | Primary audience |
|---|---|---|---|
| 00 | [Product Brief](./00-PRODUCT-BRIEF.md) | One-pager: problem, solution, promise, phase strategy | Everyone (start here) |
| 01 | [PRD](./01-PRD.md) | **What** to build and **why** — requirements, acceptance criteria, releases | Product, design, engineering |
| 02 | [UX Specification](./02-UX-SPECIFICATION.md) | How the experience behaves: IA, flows, states, RTL, accessibility, motion | Design, engineering, QA |
| 03 | [Design System](./03-DESIGN-SYSTEM.md) | Visual language: tokens, components, motion — the "Luminous Premium" reference | Design, engineering |
| 04 | [Frontend Architecture](./04-FRONTEND-ARCHITECTURE.md) | How the frontend is built: stack, structure, layers, conventions | Engineering |
| 05 | [Backend Integration Readiness](./05-BACKEND-INTEGRATION-READINESS.md) | The seam to the future backend: contracts, provider interface, API sketch, migration checklist | Engineering (frontend + future backend) |
| 06 | [Testing & Quality Strategy](./06-TESTING-STRATEGY.md) | Quality gates, verification matrices, budgets, release checklist | Engineering, QA |
| 07 | [Roadmap](./07-ROADMAP.md) | Step-by-step execution plan (R0 → R4 with milestones M1-M13) | Everyone |
| — | [Changelog](./CHANGELOG.md) | Phase-by-phase delivery record (Arabic) | Everyone |

## How to Use This Suite

- **New to the project?** Read 00 → 01 → 07.
- **Building a feature?** 01 (requirements + AC) → 02 (behavior) → 03 (look) → 04 (where it lives).
- **Preparing the backend?** 05 is the contract; 01 §8 state machines are the behavioral spec.
- **Releasing?** 06 §9 checklist.
- **Updating docs:** docs are living artifacts; any behavioral change ships with a doc update (enforced in the release checklist).

---

## Appendix — Software Documentation Taxonomy

Industry-standard documents (validated against current practice — Atlassian, Productboard/Figma templates, Modern Requirements, ClickHelp) and how Nasaq uses them:

| Abbr | Full name | Answers | In Nasaq? |
|---|---|---|---|
| **Brief / One-pager** | Product Brief | What is this and why does it matter? | ✅ `00` |
| **MRD** | Market Requirements Document | What does the market need? Competition, positioning, segmentation | ◻ folded into `00`/`01` (market work is light pre-launch) |
| **BRD** | Business Requirements Document | What are the business goals, stakeholders, ROI? | ◻ partially in `01` (goals, risks, dependencies) |
| **PRD** | Product Requirements Document | **What** must the product do and **why** — features, requirements, AC | ✅ `01` (authoritative) |
| **FRD** | Functional Requirements Document | Detailed functional behavior (often merged with PRD today) | ✅ merged into `01` |
| **SRS** | Software Requirements Specification (IEEE 830 lineage) | Exhaustive system requirements incl. non-functional (heavier, engineering-led) | ✅ lightweight version in `01` (FR/UX/NFR/TRUTH/BR tables) |
| **UX Spec** | UX Specification | Flows, states, behavior, accessibility | ✅ `02` |
| **DS / SG** | Design System / Style Guide | Tokens, components, patterns | ✅ `03` |
| **TDD / TRD** | Technical (Requirements) Design Document | **How** the system is built | ✅ `04` (frontend scope) |
| **HLD/LLD** | High/Low-Level Design | Architecture vs detailed module design | ◻ `04` covers HLD; LLD lives with code |
| **API Spec** | API Specification (OpenAPI/Swagger) | Endpoints, schemas, contracts | ◻ sketch in `05`; formal spec generated from contracts at backend kickoff |
| **DM/ERD** | Data Model / Entity-Relationship Diagram | Entities and relations | ◻ table-level sketch in `05` §7 |
| **ADR** | Architecture Decision Records | Why specific technical decisions were made | ◻ embedded as "Decisions" in `01`/`04`; standalone ADRs when the repo migrates to git |
| **Test Plan** | Test Plan / Strategy | What is tested, how, exit criteria | ✅ `06` |
| **Roadmap** | Product Roadmap | Sequencing of releases | ✅ `07` |
| **DoD** | Definition of Done | Feature completeness bar | ✅ `01` §16 |
| **JTBD** | Jobs-to-be-Done (framework, not a doc) | User intents | ✅ in `01` §4.2 |
| **KPI/HEART** | Metrics framework | How success is measured | ◻ deferred — targets are open questions (`01` §19) |
| **Runbook** | Operations Runbook | Incident response, ops procedures | ◻ backend phase |

**Chosen posture:** a compact, modern suite (PRD-led) instead of the heavyweight enterprise stack (BRD→MRD→FRD→SRS chain). Heavy documents are deferred until the phase that needs them (OpenAPI + ERD + Runbook at backend kickoff; KPI framework after the prototype success criteria are set).
| `08-AGENT-OPERATING-MODEL.md` | Explanation | How agents are directed on this repo: system architecture, standards followed, decision log (ADR) |
| `REFERENCES.md` | Reference | Research sources & standards with primary links |

