import type { AnalyzeSessionState } from "@minsaj/contracts/services";
import { analyzeSessionStateSchema } from "@minsaj/contracts/services";
import {
  buildAnalyzeComputeSteps,
  buildAnalyzePlan,
  buildAnalyzeProfile,
  buildAnalyzeResult,
  buildAnalyzeSummary,
  buildAnalyzeVerification,
} from "./datasets";

/**
 * Analyze state presets — U2.5.
 *
 * Presets are built from the same pure rules as the live surface, so a test or
 * a verification surface can never observe a state the real flow cannot reach.
 */

export const analyzeStatePresets = [
  "fresh",
  "question_ready",
  "plan_ready",
  "compute_done",
  "verify_pending",
  "summary_complete",
] as const;
export type AnalyzeStatePreset = (typeof analyzeStatePresets)[number];

export type AnalyzePresetInput = {
  readonly locale: "ar" | "en";
  readonly now: string;
  readonly preset: AnalyzeStatePreset;
  readonly datasetId?: string;
  readonly mode?: "guided" | "fast";
};

export function createAnalyzeStatePreset(input: AnalyzePresetInput): AnalyzeSessionState {
  const mode = input.mode ?? "guided";
  const datasetId = input.datasetId ?? "dset_sales_30";
  const questionText = input.locale === "ar"
    ? "ما اتجاه الإيراد خلال الأشهر الستة الماضية؟"
    : "What is the revenue trend over the last six months?";
  const assumptions = input.locale === "ar" ? ["البيانات التجريبية فقط"] : ["Fixture data only"];

  const base = {
    serviceId: "analyze" as const,
    stateVersion: 1 as const,
    locale: input.locale,
    mode,
    source: null,
    profile: null,
    question: null,
    plan: null,
    computeSteps: null,
    result: null,
    verification: null,
    summary: null,
    updatedAt: input.now,
  };

  if (input.preset === "fresh") {
    return analyzeSessionStateSchema.parse({ ...base, resumeStageKey: "ana_source" });
  }

  const source = { datasetFixtureId: datasetId, localFileName: null };
  const profile = buildAnalyzeProfile(datasetId);

  if (input.preset === "question_ready") {
    return analyzeSessionStateSchema.parse({
      ...base,
      source,
      profile,
      resumeStageKey: "ana_question",
    });
  }

  const question = { question: questionText, operation: "trend" as const, assumptions };
  const plan = buildAnalyzePlan("trend");

  if (input.preset === "plan_ready") {
    return analyzeSessionStateSchema.parse({
      ...base,
      source,
      profile,
      question,
      plan,
      resumeStageKey: "ana_plan",
    });
  }

  const computeSteps = buildAnalyzeComputeSteps(plan);
  const result = buildAnalyzeResult(datasetId, "trend", plan, assumptions.length);

  if (input.preset === "compute_done") {
    return analyzeSessionStateSchema.parse({
      ...base,
      source,
      profile,
      question,
      plan,
      computeSteps,
      result,
      resumeStageKey: "ana_compute",
    });
  }

  const verification = buildAnalyzeVerification(datasetId, plan, assumptions.length);

  if (input.preset === "verify_pending") {
    return analyzeSessionStateSchema.parse({
      ...base,
      source,
      profile,
      question,
      plan,
      computeSteps,
      result,
      verification,
      resumeStageKey: "ana_verify",
    });
  }

  // summary_complete: every check acknowledged and confirmed.
  const acknowledged = {
    ...verification,
    acknowledgedIds: verification.checks.map((check) => check.id),
    confirmed: true,
  };
  return analyzeSessionStateSchema.parse({
    ...base,
    source,
    profile,
    question,
    plan,
    computeSteps,
    result,
    verification: acknowledged,
    summary: buildAnalyzeSummary(result, acknowledged, assumptions.length),
    resumeStageKey: "ana_complete",
  });
}

/** Maps a scenario id to the preset the route seeds for edge-state reviews. */
export function analyzePresetForScenario(scenarioId: string): AnalyzeStatePreset | null {
  if (scenarioId === "empty") return "fresh";
  if (scenarioId === "needs_input") return "question_ready";
  if (scenarioId === "warning") return "verify_pending";
  return null;
}
