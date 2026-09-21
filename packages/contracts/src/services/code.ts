import { z } from "zod";
import { localeSchema } from "../index";
import { serviceLabelSchema, serviceUserTextSchema } from "./text";

/**
 * Code slice contracts — U2.4.
 *
 * These shapes describe one proposed-change review session: a scope, an
 * editable plan, a proposal with its file tree, an explicit diff review, a
 * working copy, deterministic static checks, and an impact summary. They are
 * simulation data, not a build system: no shell, no package manager, and no
 * file is ever read or written. Every "check" here is a documented local rule in
 * `@minsaj/mock-api/services`, and nothing is sent anywhere.
 *
 * Ownership rules stay identical to the foundation: `Service*`-scoped names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable project, file, step, or check identity inside a fixture. */
export const codeKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

export const codeTaskTypeSchema = z.enum(["build", "fix", "review", "learn"]);
export type CodeTaskType = z.infer<typeof codeTaskTypeSchema>;

export const codeScopeSchema = z.object({
  projectFixtureId: z.string().regex(/^cprj_[a-z0-9][a-z0-9_]{0,63}$/u),
  taskType: codeTaskTypeSchema,
  changeRequest: serviceUserTextSchema,
});
export type CodeScope = z.infer<typeof codeScopeSchema>;

export const codePlanActionSchema = z.enum(["create", "modify", "delete"]);
export type CodePlanAction = z.infer<typeof codePlanActionSchema>;

export const codePlanStepSchema = z.object({
  id: codeKeySchema,
  filePath: serviceLabelSchema,
  action: codePlanActionSchema,
  detailKey: serviceLabelSchema,
  rationaleKey: serviceLabelSchema,
  included: z.boolean(),
  exclusionReasonKey: serviceLabelSchema.nullable(),
});
export type CodePlanStep = z.infer<typeof codePlanStepSchema>;

export const codePlanSchema = z.object({
  steps: z.array(codePlanStepSchema).min(1).max(8),
  /** Keys of the documented rules that produced this plan from the scope. */
  rationaleKeys: z.array(serviceLabelSchema).min(1).max(4),
  revisedByUser: z.boolean(),
});
export type CodePlan = z.infer<typeof codePlanSchema>;

export const codeFileChangeSchema = z.object({
  path: serviceLabelSchema,
  change: z.enum(["added", "modified", "deleted"]),
  additions: z.number().int().nonnegative().max(400),
  deletions: z.number().int().nonnegative().max(400),
});
export type CodeFileChange = z.infer<typeof codeFileChangeSchema>;

export const codeDiffLineSchema = z.object({
  type: z.enum(["context", "added", "removed"]),
  text: z.string().min(1).max(200),
});
export type CodeDiffLine = z.infer<typeof codeDiffLineSchema>;

export const codeDiffHunkSchema = z.object({
  filePath: serviceLabelSchema,
  header: z.string().min(3).max(60),
  lines: z.array(codeDiffLineSchema).min(2).max(14),
});
export type CodeDiffHunk = z.infer<typeof codeDiffHunkSchema>;

export const codeProposalSchema = z.object({
  fileChanges: z.array(codeFileChangeSchema).min(1).max(8),
  diffHunks: z.array(codeDiffHunkSchema).min(1).max(8),
  riskNoteKeys: z.array(serviceLabelSchema).max(3),
});
export type CodeProposal = z.infer<typeof codeProposalSchema>;

export const codeDiffReviewSchema = z.object({
  reviewedPaths: z.array(serviceLabelSchema).max(8),
  /** A flagged file keeps its identity and a note; it is never silently lost. */
  flaggedPaths: z.array(z.object({ path: serviceLabelSchema, noteKey: serviceLabelSchema })).max(4),
  acknowledged: z.boolean(),
});
export type CodeDiffReview = z.infer<typeof codeDiffReviewSchema>;

export const codeCheckStatusSchema = z.enum(["pass", "warn", "fail"]);
export type CodeCheckStatus = z.infer<typeof codeCheckStatusSchema>;

export const codeCheckResultSchema = z.object({
  id: codeKeySchema,
  nameKey: serviceLabelSchema,
  status: codeCheckStatusSchema,
  detailKey: serviceLabelSchema,
  /** Local rule output, never a real tool run. */
  durationMs: z.number().int().nonnegative().max(2000),
});
export type CodeCheckResult = z.infer<typeof codeCheckResultSchema>;

export const codeChecksSchema = z.object({
  results: z.array(codeCheckResultSchema).min(2).max(6),
  acknowledged: z.boolean(),
});
export type CodeChecks = z.infer<typeof codeChecksSchema>;

export const codeImpactSchema = z.object({
  filesChanged: z.number().int().nonnegative().max(8),
  additions: z.number().int().nonnegative().max(1200),
  deletions: z.number().int().nonnegative().max(1200),
  checksPassed: z.number().int().nonnegative().max(6),
  checksWarned: z.number().int().nonnegative().max(6),
  checksFailed: z.number().int().nonnegative().max(6),
});
export type CodeImpact = z.infer<typeof codeImpactSchema>;

/** The seven review stages; recorded so a resume lands where the reviewer was. */
export const codeStageKeySchema = z.enum([
  "cod_scope",
  "cod_plan",
  "cod_proposal",
  "cod_diff_review",
  "cod_working_copy",
  "cod_preview_checks",
  "cod_receipt",
]);
export type CodeStageKey = z.infer<typeof codeStageKeySchema>;

export const codeSessionStateSchema = z.object({
  serviceId: z.literal("code"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  scope: codeScopeSchema.nullable(),
  plan: codePlanSchema.nullable(),
  proposal: codeProposalSchema.nullable(),
  diffReview: codeDiffReviewSchema.nullable(),
  workingCopyApplied: z.boolean(),
  checks: codeChecksSchema.nullable(),
  impact: codeImpactSchema.nullable(),
  /**
   * Where the reviewer actually was. `null` means "derive it from recorded
   * state"; a stored value is trusted only when it is consistent with that
   * state, so a hand-edited snapshot cannot fake a stage.
   */
  resumeStageKey: codeStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type CodeSessionState = z.infer<typeof codeSessionStateSchema>;

/** Guard used by the workbench store before it hands a block back to Code. */
export function isCodeSessionState(value: unknown): value is CodeSessionState {
  return codeSessionStateSchema.safeParse(value).success;
}
