import type { CodeSessionState } from "@minsaj/contracts/services";
import { codeSessionStateSchema } from "@minsaj/contracts/services";
import { buildCodePlan, buildCodeProposal, buildCodeChecks, buildCodeImpact } from "./plan";

/**
 * Code state presets — U2.4.
 *
 * Presets are built from the same pure rules as the live surface, so a test or
 * a verification surface can never observe a state the real flow cannot reach.
 */

export const codeStatePresets = [
  "fresh",
  "plan_ready",
  "proposal_ready",
  "diff_incomplete",
  "checks_warned",
  "impact_complete",
] as const;
export type CodeStatePreset = (typeof codeStatePresets)[number];

export type CodePresetInput = {
  readonly locale: "ar" | "en";
  readonly now: string;
  readonly preset: CodeStatePreset;
  readonly projectId?: string;
  readonly mode?: "guided" | "fast";
};

export function createCodeStatePreset(input: CodePresetInput): CodeSessionState {
  const mode = input.mode ?? "guided";
  const projectId = input.projectId ?? "cprj_web_checkout";
  const scope = {
    projectFixtureId: projectId,
    taskType: "fix" as const,
    changeRequest: input.locale === "ar" ? "أضف تحققًا من صحة المدخلات قبل الحفظ." : "Add input validation before saving.",
  };

  const base = {
    serviceId: "code" as const,
    stateVersion: 1 as const,
    locale: input.locale,
    mode,
    scope: null,
    plan: null,
    proposal: null,
    diffReview: null,
    workingCopyApplied: false,
    checks: null,
    impact: null,
    updatedAt: input.now,
  };

  if (input.preset === "fresh") {
    return codeSessionStateSchema.parse({ ...base, resumeStageKey: "cod_scope" });
  }

  const plan = buildCodePlan(projectId, "fix");

  if (input.preset === "plan_ready") {
    return codeSessionStateSchema.parse({
      ...base,
      scope,
      plan,
      resumeStageKey: "cod_plan",
    });
  }

  const proposal = buildCodeProposal(plan);

  if (input.preset === "proposal_ready") {
    return codeSessionStateSchema.parse({
      ...base,
      scope,
      plan,
      proposal,
      resumeStageKey: "cod_proposal",
    });
  }

  if (input.preset === "diff_incomplete") {
    // One file reviewed, one left: the review point stays open on purpose.
    return codeSessionStateSchema.parse({
      ...base,
      scope,
      plan,
      proposal,
      diffReview: { reviewedPaths: [proposal.fileChanges[0]?.path ?? "src/validation.ts"], flaggedPaths: [], acknowledged: false },
      resumeStageKey: "cod_diff_review",
    });
  }

  const reviewedAll = {
    reviewedPaths: proposal.fileChanges.map((change) => change.path),
    flaggedPaths: [],
    acknowledged: true,
  };

  if (input.preset === "checks_warned") {
    // A build plan without a test step: the smoke check must warn, not pass.
    const warnPlan = buildCodePlan(projectId, "review");
    const warnProposal = buildCodeProposal(warnPlan);
    return codeSessionStateSchema.parse({
      ...base,
      scope: { ...scope, taskType: "review" as const },
      plan: warnPlan,
      proposal: warnProposal,
      diffReview: {
        reviewedPaths: warnProposal.fileChanges.map((change) => change.path),
        flaggedPaths: [],
        acknowledged: true,
      },
      workingCopyApplied: true,
      checks: buildCodeChecks(warnPlan),
      resumeStageKey: "cod_preview_checks",
    });
  }

  // impact_complete: the full guided path with everything accepted.
  const checks = buildCodeChecks(plan);
  return codeSessionStateSchema.parse({
    ...base,
    scope,
    plan,
    proposal,
    diffReview: reviewedAll,
    workingCopyApplied: true,
    checks: { ...checks, acknowledged: true },
    impact: buildCodeImpact(plan, { ...checks, acknowledged: true }),
    resumeStageKey: "cod_receipt",
  });
}

/** Maps a scenario id to the preset the route seeds for edge-state reviews. */
export function codePresetForScenario(scenarioId: string): CodeStatePreset | null {
  if (scenarioId === "empty") return "fresh";
  if (scenarioId === "needs_input") return "plan_ready";
  if (scenarioId === "warning") return "checks_warned";
  return null;
}
