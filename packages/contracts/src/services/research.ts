import { z } from "zod";
import { localeSchema } from "../index";
import { serviceExternalUrlSchema, serviceLabelSchema, serviceUserTextSchema } from "./text";
import { serviceClaimIdSchema, serviceEvidenceIdSchema, serviceSourceIdSchema } from "./ids";

/**
 * Research slice contracts — U2.2.
 *
 * These shapes describe one research session: the brief, bounded
 * clarifications, the versioned and approvable plan, the deterministic source
 * activity log, source records with provenance, the claim/evidence matrix, and
 * the editable report. Everything is a seeded fixture: U2 performs no live web
 * search, every source carries `seeded_fixture` provenance and a "not retrieved
 * in this session" marker, and the receipt always records `networkCalls: 0`.
 *
 * Ownership rules stay identical to the foundation: `Service*` names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable axis, source-type, question, or topic identity inside a fixture. */
export const researchKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

/** The eight research stages; recorded so a resume lands where the user was. */
export const researchStageKeySchema = z.enum([
  "rsh_brief",
  "rsh_clarify",
  "rsh_plan_review",
  "rsh_source_activity",
  "rsh_source_review",
  "rsh_claim_matrix",
  "rsh_report_edit",
  "rsh_complete",
]);
export type ResearchStageKey = z.infer<typeof researchStageKeySchema>;

export const researchAudienceSchema = z.enum(["self", "team", "public"]);
export type ResearchAudience = z.infer<typeof researchAudienceSchema>;

export const researchScopeSchema = z.enum(["recent", "broad", "academic"]);
export type ResearchScope = z.infer<typeof researchScopeSchema>;

export const researchBriefSchema = z.object({
  question: serviceUserTextSchema,
  /** The decision the answer must support; keeps the research goal-directed. */
  decision: serviceUserTextSchema,
  audience: researchAudienceSchema,
  scope: researchScopeSchema,
});

/** One bounded clarification question with a visible default choice. */
export const researchClarifyQuestionSchema = z.object({
  id: researchKeySchema,
  promptKey: serviceLabelSchema,
  choiceKeys: z.array(serviceLabelSchema).min(2).max(3),
  /** Index of the default answer, shown so skipping is still an answer. */
  defaultChoiceIndex: z.number().int().min(0).max(2),
});

export const researchClarifyAnswerSchema = z.object({
  questionId: researchKeySchema,
  /** `null` means the user kept the visible default. */
  choiceKey: serviceLabelSchema.nullable(),
  usedDefault: z.boolean(),
  answeredAt: z.string().min(20).max(40),
});

/** A research axis (theme) proposed by the deterministic plan builder. */
export const researchPlanAxisSchema = z.object({
  id: researchKeySchema,
  labelKey: serviceLabelSchema,
  /** Why the plan proposes this axis; copy key, resolved through i18n. */
  reasonKey: serviceLabelSchema,
  included: z.boolean(),
});

export const researchSourceTypeSchema = z.enum(["internal_report", "academic_paper", "news", "survey", "blog", "archived_page"]);
export type ResearchSourceType = z.infer<typeof researchSourceTypeSchema>;

export const researchPlanSchema = z.object({
  version: z.number().int().positive().max(50),
  axes: z.array(researchPlanAxisSchema).min(1).max(6),
  sourceTypes: z.array(researchSourceTypeSchema).min(1).max(6),
  /** Include/exclude keyword hints the user can edit before approval. */
  includeHints: z.array(serviceLabelSchema).max(6),
  excludeHints: z.array(serviceLabelSchema).max(6),
  /** Bounded logical timebox in minutes; never a wall-clock promise. */
  timeboxMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  /** Keys of the documented rules that produced this plan. */
  rationaleKeys: z.array(serviceLabelSchema).min(1).max(6),
  revisedByUser: z.boolean(),
});
export type ResearchPlan = z.infer<typeof researchPlanSchema>;

/** A plan version entry: the plan is frozen at approval time. */
export const researchPlanVersionSchema = z.object({
  version: z.number().int().positive().max(50),
  plan: researchPlanSchema,
  status: z.enum(["draft", "approved", "superseded"]),
  approvedAt: z.string().min(20).max(40).nullable(),
  changeNoteKey: serviceLabelSchema,
});
export type ResearchPlanVersion = z.infer<typeof researchPlanVersionSchema>;

/**
 * A source record. `provenanceLabel` is copy; the structured truth is the
 * `origin` + `retrievedInSession: false` pair shared with evidence refs.
 */
export const researchSourceRecordSchema = z.object({
  id: serviceSourceIdSchema,
  topicId: researchKeySchema,
  titleKey: serviceLabelSchema,
  sourceType: researchSourceTypeSchema,
  /** Known publication date of the fixture, if any. */
  publishedAt: z.string().min(20).max(40).nullable(),
  origin: z.literal("seeded_fixture"),
  availability: z.enum(["available", "unavailable", "fixture_only"]),
  /** Deterministic relevance rule output in 0..3; 0 means not relevant. */
  relevance: z.number().int().min(0).max(3),
  /** Display-only external reference; never fetched by U2. */
  url: serviceExternalUrlSchema.nullable(),
  excluded: z.boolean(),
  excludedAt: z.string().min(20).max(40).nullable(),
});
export type ResearchSourceRecord = z.infer<typeof researchSourceRecordSchema>;

/** One deterministic activity-log entry played back during source activity. */
export const researchActivityEntrySchema = z.object({
  index: z.number().int().nonnegative().max(200),
  kind: z.enum(["query", "scan", "extract", "steer", "cancelled", "resumed"]),
  /** Copy key describing the step; fixture data, never "searched the web now". */
  labelKey: serviceLabelSchema,
  sourceId: serviceSourceIdSchema.nullable(),
  axisId: researchKeySchema.nullable(),
  /** Logical timestamp: derived from the entry index, never wall clock. */
  at: z.string().min(20).max(40),
});
export type ResearchActivityEntry = z.infer<typeof researchActivityEntrySchema>;

export const researchActivityStateSchema = z.object({
  status: z.enum(["idle", "playing", "steered", "cancelled", "done"]),
  steerCount: z.number().int().min(0).max(6),
  /** Index of the next pending plan step; entries before it are played. */
  cursor: z.number().int().nonnegative().max(200),
  entries: z.array(researchActivityEntrySchema).max(200),
});
export type ResearchActivityState = z.infer<typeof researchActivityStateSchema>;

/** A claim in the matrix. Support is recomputed from non-excluded evidence. */
export const researchClaimStateSchema = z.object({
  id: serviceClaimIdSchema,
  statementKey: serviceLabelSchema,
  evidenceIds: z.array(serviceEvidenceIdSchema).max(12),
  /** User resolution of an unsupported/conflicted claim. */
  resolution: z.enum(["open", "acknowledged", "resolved_needs_evidence"]),
});
export type ResearchClaimState = z.infer<typeof researchClaimStateSchema>;

export const researchReportSectionStateSchema = z.object({
  id: z.string().min(3).max(40),
  headingKey: serviceLabelSchema,
  /** User-edited body; starts from the deterministic fixture draft. */
  body: serviceUserTextSchema,
  evidenceIds: z.array(serviceEvidenceIdSchema).max(12),
  reviewed: z.boolean(),
});
export type ResearchReportSectionState = z.infer<typeof researchReportSectionStateSchema>;

export const researchReportStateSchema = z.object({
  sections: z.array(researchReportSectionStateSchema).min(1).max(16),
  /** Copy keys of the declared limitations; always non-empty. */
  limitationKeys: z.array(serviceLabelSchema).min(1).max(8),
  /** Copy key of the activity receipt summary shown inside the report. */
  receiptSummaryKey: serviceLabelSchema,
  saved: z.boolean(),
});
export type ResearchReportState = z.infer<typeof researchReportStateSchema>;

export const researchSessionStateSchema = z.object({
  serviceId: z.literal("research"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  brief: researchBriefSchema.nullable(),
  clarifyQuestionIds: z.array(researchKeySchema).max(3),
  clarifyAnswers: z.array(researchClarifyAnswerSchema).max(3),
  planVersions: z.array(researchPlanVersionSchema).min(0).max(12),
  /** Version approved by the user; a run can only start when this is set. */
  approvedPlanVersion: z.number().int().positive().max(50).nullable(),
  activity: researchActivityStateSchema,
  sources: z.array(researchSourceRecordSchema).max(50),
  claims: z.array(researchClaimStateSchema).max(24),
  /** Fixture evidence refs filtered only by source exclusion at read time. */
  evidenceIds: z.array(serviceEvidenceIdSchema).max(60),
  report: researchReportStateSchema.nullable(),
  resumeStageKey: researchStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type ResearchSessionState = z.infer<typeof researchSessionStateSchema>;
export type ResearchBrief = z.infer<typeof researchBriefSchema>;
export type ResearchClarifyQuestion = z.infer<typeof researchClarifyQuestionSchema>;
export type ResearchClarifyAnswer = z.infer<typeof researchClarifyAnswerSchema>;
export type ResearchPlanAxis = z.infer<typeof researchPlanAxisSchema>;

/** Guard used by the workbench store before it hands a block back to Research. */
export function isResearchSessionState(value: unknown): value is ResearchSessionState {
  return researchSessionStateSchema.safeParse(value).success;
}
