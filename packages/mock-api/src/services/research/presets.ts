import type { ResearchSessionState } from "@minsaj/contracts/services";
import { researchSessionStateSchema } from "@minsaj/contracts/services";
import { buildResearchEvidenceRefs, getResearchTopic, type ResearchTopicId } from "./topics";
import { buildResearchPlan } from "./plan";
import { buildResearchSourceRecords, discoveredEvidenceIds } from "./sources";
import { buildResearchTopicClaims, computeClaimVerdicts } from "./claims";
import { buildResearchActivitySteps, materializeResearchEntries } from "./activity";
import { draftReportForSession } from "./report";

/**
 * Research state presets — U2.2.
 *
 * Presets are built from the same pure rules as the live surface, so a test or
 * a scenario fixture can never observe a state the real flow cannot reach.
 * Each preset lands on the stage its recorded facts can support.
 */

export const researchStatePresets = [
  "fresh",
  "clarify_pending",
  "plan_review",
  "activity_cancelled",
  "sources_ready",
  "conflicted_claims",
  "report_partial",
  "zero_sources",
  "dense_sources",
  "mixed_bidi",
] as const;
export type ResearchStatePreset = (typeof researchStatePresets)[number];

export type ResearchPresetInput = {
  readonly locale: "ar" | "en";
  readonly now: string;
  readonly preset: ResearchStatePreset;
  readonly topicId?: ResearchTopicId;
  readonly mode?: "guided" | "fast";
};

const presetTopic: Record<ResearchStatePreset, ResearchTopicId> = {
  fresh: "waiting_time_q3",
  clarify_pending: "waiting_time_q3",
  plan_review: "waiting_time_q3",
  activity_cancelled: "waiting_time_q3",
  sources_ready: "waiting_time_q3",
  conflicted_claims: "waiting_time_q3",
  report_partial: "waiting_time_q3",
  zero_sources: "zero_match",
  dense_sources: "waiting_time_q3",
  mixed_bidi: "remote_onboarding",
};

export function createResearchStatePreset(input: ResearchPresetInput): ResearchSessionState {
  const topicId = input.topicId ?? presetTopic[input.preset];
  const mode = input.mode ?? "guided";
  const dense = input.preset === "dense_sources";
  const topic = getResearchTopic(topicId);
  const evidence = buildResearchEvidenceRefs(topicId, input.locale, dense ? { dense: true } : undefined);

  const base = {
    serviceId: "research" as const,
    stateVersion: 1 as const,
    locale: input.locale,
    mode,
    brief: null,
    clarifyQuestionIds: topic.clarify.map((question) => question.id),
    clarifyAnswers: [],
    planVersions: [],
    approvedPlanVersion: null,
    activity: { status: "idle" as const, steerCount: 0, cursor: 0, entries: [] },
    sources: buildResearchSourceRecords(topicId, dense ? { dense: true } : undefined),
    claims: buildResearchTopicClaims(topicId),
    evidenceIds: [],
    report: null,
    resumeStageKey: null,
    updatedAt: input.now,
  };

  if (input.preset === "fresh") {
    return researchSessionStateSchema.parse(base);
  }

  const brief = {
    question: topic.defaultQuestion[input.locale],
    decision: topic.defaultDecision[input.locale],
    audience: "team" as const,
    scope: "recent" as const,
  };

  if (input.preset === "clarify_pending") {
    return researchSessionStateSchema.parse({ ...base, brief, updatedAt: input.now });
  }

  const clarifyAnswers = topic.clarify.map((question) => ({
    questionId: question.id,
    choiceKey: question.choiceKeys[question.defaultChoiceIndex] ?? null,
    usedDefault: true,
    answeredAt: input.now,
  }));

  const plan = buildResearchPlan({
    topicId,
    scope: brief.scope,
    audience: brief.audience,
    clarifyAnswers,
    version: 1,
  });

  if (input.preset === "plan_review") {
    return researchSessionStateSchema.parse({
      ...base,
      brief,
      clarifyAnswers,
      planVersions: [{ version: 1, plan, status: "draft", approvedAt: null, changeNoteKey: "services.research.plan.initial_draft" }],
      updatedAt: input.now,
    });
  }

  const approvedPlanVersions = [
    { version: 1, plan, status: "approved" as const, approvedAt: input.now, changeNoteKey: "services.research.plan.initial_draft" },
  ];

  const steps = buildResearchActivitySteps(topicId, plan, base.sources, evidence, { count: 0, keys: [] });

  if (input.preset === "activity_cancelled") {
    // Half the steps played, then cancelled: no completion, resumable.
    const played = Math.max(1, Math.floor(steps.length / 2));
    const entries = [
      ...materializeResearchEntries(steps, played),
      { index: played, kind: "cancelled" as const, labelKey: "services.research.activity.cancelled", sourceId: null, axisId: null, at: input.now },
    ];
    return researchSessionStateSchema.parse({
      ...base,
      brief,
      clarifyAnswers,
      planVersions: approvedPlanVersions,
      approvedPlanVersion: 1,
      activity: { status: "cancelled", steerCount: 0, cursor: played, entries: entries.slice(0, 200) },
      updatedAt: input.now,
    });
  }

  // Sources ready: the activity finished, evidence discovered.
  const evidenceIds = discoveredEvidenceIds(base.sources, plan, evidence);
  const entries = materializeResearchEntries(steps, steps.length);
  const activityDone = { status: "done" as const, steerCount: 0, cursor: steps.length, entries: entries.slice(0, 200) };

  if (input.preset === "sources_ready" || input.preset === "zero_sources" || input.preset === "dense_sources" || input.preset === "mixed_bidi") {
    return researchSessionStateSchema.parse({
      ...base,
      brief,
      clarifyAnswers,
      planVersions: approvedPlanVersions,
      approvedPlanVersion: 1,
      activity: activityDone,
      evidenceIds: [...evidenceIds],
      updatedAt: input.now,
    });
  }

  if (input.preset === "conflicted_claims") {
    return researchSessionStateSchema.parse({
      ...base,
      brief,
      clarifyAnswers,
      planVersions: approvedPlanVersions,
      approvedPlanVersion: 1,
      activity: activityDone,
      evidenceIds: [...evidenceIds],
      updatedAt: input.now,
    });
  }

  // report_partial: matrix exists, claims acknowledged where needed, report drafted but unreviewed.
  const verdicts = computeClaimVerdicts(base.claims, evidence, evidenceIds, []);
  const claims = base.claims.map((claim) => {
    const verdict = verdicts.find((candidate) => candidate.claimId === claim.id);
    const needsAttention = verdict?.support === "unsupported" || verdict?.support === "conflicted";
    return needsAttention ? { ...claim, resolution: "acknowledged" as const } : claim;
  });

  const session = researchSessionStateSchema.parse({
    ...base,
    brief,
    clarifyAnswers,
    planVersions: approvedPlanVersions,
    approvedPlanVersion: 1,
    activity: activityDone,
    evidenceIds: [...evidenceIds],
    claims,
    report: null,
    updatedAt: input.now,
  });
  const report = draftReportForSession(session, input.locale, evidence);
  return researchSessionStateSchema.parse({ ...session, report, updatedAt: input.now });
}

/** Scenario → preset mapping used by tests and route seeding. */
export const researchScenarioPresets: Partial<Record<string, ResearchStatePreset>> = {
  happy: "fresh",
  needs_input: "clarify_pending",
  warning: "conflicted_claims",
  conflicting_evidence: "conflicted_claims",
  zero_sources: "zero_sources",
  dense: "dense_sources",
  rtl_stress: "mixed_bidi",
  failed_retryable: "activity_cancelled",
  empty: "fresh",
};
