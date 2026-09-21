import { z } from "zod";
import { localeSchema } from "../index";
import { serviceLabelSchema, serviceUserTextSchema } from "./text";

/**
 * Analyze slice contracts — U2.5.
 *
 * These shapes describe one deterministic local-analysis session: a sample
 * dataset source with an optional metadata-only file label, its computed
 * profile, a question with assumptions and an operation, an editable compute
 * plan, the local compute outcome (table + chart series), a reconciliation
 * verification, and a summary. Nothing here reads a file, executes code, or
 * calls a model: every number is a documented local rule in
 * `@minsaj/mock-api/services`, and the local file label is metadata only.
 *
 * Ownership rules stay identical to the foundation: `Service*`-scoped names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable dataset, column, plan step, or check identity inside a fixture. */
export const analyzeKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

export const analyzeOperationSchema = z.enum(["trend", "average", "compare"]);
export type AnalyzeOperation = z.infer<typeof analyzeOperationSchema>;

export const analyzeSourceSchema = z.object({
  datasetFixtureId: z.string().regex(/^dset_[a-z0-9][a-z0-9_]{0,63}$/u),
  /** Metadata-only local file label; U2 never reads file content. */
  localFileName: serviceLabelSchema.nullable(),
});
export type AnalyzeSource = z.infer<typeof analyzeSourceSchema>;

export const analyzeColumnTypeSchema = z.enum(["date", "number", "text"]);
export type AnalyzeColumnType = z.infer<typeof analyzeColumnTypeSchema>;

export const analyzeProfileColumnSchema = z.object({
  id: analyzeKeySchema,
  labelKey: serviceLabelSchema,
  type: analyzeColumnTypeSchema,
  /** Missing values in this column, so completeness is a fact, not a vibe. */
  missing: z.number().int().nonnegative().max(400),
});
export type AnalyzeProfileColumn = z.infer<typeof analyzeProfileColumnSchema>;

export const analyzeProfileSchema = z.object({
  rows: z.number().int().nonnegative().max(400),
  columns: z.array(analyzeProfileColumnSchema).min(1).max(6),
  /** Keys of the documented quality warnings (may be empty). */
  qualityWarningKeys: z.array(serviceLabelSchema).max(3),
});
export type AnalyzeProfile = z.infer<typeof analyzeProfileSchema>;

export const analyzeQuestionSchema = z.object({
  question: serviceUserTextSchema,
  operation: analyzeOperationSchema,
  assumptions: z.array(serviceLabelSchema).max(6),
});
export type AnalyzeQuestion = z.infer<typeof analyzeQuestionSchema>;

export const analyzePlanStepSchema = z.object({
  id: analyzeKeySchema,
  detailKey: serviceLabelSchema,
  rationaleKey: serviceLabelSchema,
  included: z.boolean(),
  exclusionReasonKey: serviceLabelSchema.nullable(),
});
export type AnalyzePlanStep = z.infer<typeof analyzePlanStepSchema>;

export const analyzePlanSchema = z.object({
  steps: z.array(analyzePlanStepSchema).min(1).max(6),
  rationaleKeys: z.array(serviceLabelSchema).min(1).max(3),
  revisedByUser: z.boolean(),
});
export type AnalyzePlan = z.infer<typeof analyzePlanSchema>;

export const analyzeComputeStepSchema = z.object({
  id: analyzeKeySchema,
  labelKey: serviceLabelSchema,
  /** Logical duration in ms; the surface plays them back deterministically. */
  durationMs: z.number().int().nonnegative().max(900),
});
export type AnalyzeComputeStep = z.infer<typeof analyzeComputeStepSchema>;

export const analyzeResultCellSchema = z.union([z.string().max(40), z.number()]);
export type AnalyzeResultCell = z.infer<typeof analyzeResultCellSchema>;

export const analyzeResultSchema = z.object({
  columns: z.array(serviceLabelSchema).min(1).max(4),
  rows: z.array(z.array(analyzeResultCellSchema).min(1).max(4)).min(1).max(12),
  /** Computed headline number, so the surface never re-derives it. */
  headlineValue: z.number(),
  headlineUnitKey: serviceLabelSchema,
  deltaPercent: z.number().min(-100).max(100),
  notes: z.array(serviceLabelSchema).max(3),
});
export type AnalyzeResult = z.infer<typeof analyzeResultSchema>;

export const analyzeCheckStatusSchema = z.enum(["pass", "warn"]);
export type AnalyzeCheckStatus = z.infer<typeof analyzeCheckStatusSchema>;

export const analyzeCheckResultSchema = z.object({
  id: analyzeKeySchema,
  nameKey: serviceLabelSchema,
  status: analyzeCheckStatusSchema,
  detailKey: serviceLabelSchema,
});
export type AnalyzeCheckResult = z.infer<typeof analyzeCheckResultSchema>;

export const analyzeVerificationSchema = z.object({
  checks: z.array(analyzeCheckResultSchema).min(2).max(5),
  /** Each check must be individually acknowledged, not blanket-accepted. */
  acknowledgedIds: z.array(analyzeKeySchema).max(5),
  confirmed: z.boolean(),
});
export type AnalyzeVerification = z.infer<typeof analyzeVerificationSchema>;

export const analyzeSummarySchema = z.object({
  rowsComputed: z.number().int().nonnegative().max(12),
  checksPassed: z.number().int().nonnegative().max(5),
  checksWarned: z.number().int().nonnegative().max(5),
  assumptionsListed: z.number().int().nonnegative().max(6),
});
export type AnalyzeSummary = z.infer<typeof analyzeSummarySchema>;

/** The eight analysis stages; recorded so a resume lands where the analyst was. */
export const analyzeStageKeySchema = z.enum([
  "ana_source",
  "ana_profile",
  "ana_question",
  "ana_plan",
  "ana_compute",
  "ana_result",
  "ana_verify",
  "ana_complete",
]);
export type AnalyzeStageKey = z.infer<typeof analyzeStageKeySchema>;

export const analyzeSessionStateSchema = z.object({
  serviceId: z.literal("analyze"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  source: analyzeSourceSchema.nullable(),
  profile: analyzeProfileSchema.nullable(),
  question: analyzeQuestionSchema.nullable(),
  plan: analyzePlanSchema.nullable(),
  /** The compute log is deterministic; storing it keeps a resume honest. */
  computeSteps: z.array(analyzeComputeStepSchema).max(6).nullable(),
  result: analyzeResultSchema.nullable(),
  verification: analyzeVerificationSchema.nullable(),
  summary: analyzeSummarySchema.nullable(),
  /**
   * Where the analyst actually was. `null` means "derive it from recorded
   * state"; a stored value is trusted only when it is consistent with that
   * state, so a hand-edited snapshot cannot fake a stage.
   */
  resumeStageKey: analyzeStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type AnalyzeSessionState = z.infer<typeof analyzeSessionStateSchema>;

/** Guard used by the workbench store before it hands a block back to Analyze. */
export function isAnalyzeSessionState(value: unknown): value is AnalyzeSessionState {
  return analyzeSessionStateSchema.safeParse(value).success;
}
