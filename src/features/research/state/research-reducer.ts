import type {
  ResearchAudience,
  ResearchBrief,
  ResearchPlan,
  ResearchScope,
  ResearchSessionState,
  ResearchStageKey,
} from "@nasaq/contracts/services";
import { researchBriefSchema, researchSessionStateSchema } from "@nasaq/contracts/services";
import {
  applySourceExclusion,
  buildResearchActivitySteps,
  buildResearchEvidenceRefs,
  buildResearchPlan,
  buildResearchSourceRecords,
  buildResearchTopicClaims,
  computeClaimVerdicts,
  draftReportForSession,
  getResearchTopic,
  materializeResearchEntry,
  previewSourceExclusion,
  researchActivityMarker,
  restoreResearchSource,
  type ResearchSteerKey,
  type ResearchTopicId,
} from "@nasaq/mock-api/services";

/**
 * Research slice state machine — U2.2.
 *
 * Stages follow the blueprint in `@nasaq/contracts/services` and every
 * transition has a documented guard: no activity before an approved plan
 * version, no claim matrix without at least one discovered source, no report
 * while an unsupported or conflicted claim is unresolved, and no completion
 * before every report section is reviewed. Cancelling the activity keeps its
 * played entries and never completes: resuming replays from the recorded
 * position, and steering regenerates only the remaining steps while the
 * played history stays in the log.
 */

export const researchStageKeys: readonly ResearchStageKey[] = [
  "rsh_brief",
  "rsh_clarify",
  "rsh_plan_review",
  "rsh_source_activity",
  "rsh_source_review",
  "rsh_claim_matrix",
  "rsh_report_edit",
  "rsh_complete",
];

export type { ResearchStageKey };

export type ResearchValidationKey =
  | "brief_incomplete"
  | "clarify_incomplete"
  | "plan_not_approved"
  | "source_required"
  | "claim_unresolved"
  | "report_incomplete"
  | null;

export type ResearchUiState = {
  stage: ResearchStageKey;
  clarifyIndex: number;
  draftQuestion: string;
  draftDecision: string;
  draftAudience: ResearchAudience;
  draftScope: ResearchScope;
  draftTopicId: ResearchTopicId;
  sourceFilter: "all" | "relevant_only" | "unavailable" | "with_url";
  /** Pending exclusion: the source whose impact is being previewed. */
  excludePreviewSourceId: string | null;
  inspectorEvidenceId: string | null;
  autoPlay: boolean;
  validation: ResearchValidationKey;
};

export type ResearchReducerState = {
  ui: ResearchUiState;
  session: ResearchSessionState;
};

const STEER_KEYS: readonly ResearchSteerKey[] = ["narrow_recent", "widen_types"];

export function createResearchPreviewState(): ResearchUiState {
  return {
    stage: "rsh_brief",
    clarifyIndex: 0,
    draftQuestion: "",
    draftDecision: "",
    draftAudience: "team",
    draftScope: "recent",
    draftTopicId: "waiting_time_q3",
    sourceFilter: "all",
    excludePreviewSourceId: null,
    inspectorEvidenceId: null,
    autoPlay: false,
    validation: null,
  };
}

export function emptyResearchSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): ResearchSessionState {
  return researchSessionStateSchema.parse({
    serviceId: "research",
    stateVersion: 1,
    locale,
    mode,
    brief: null,
    clarifyQuestionIds: [],
    clarifyAnswers: [],
    planVersions: [],
    approvedPlanVersion: null,
    activity: { status: "idle", steerCount: 0, cursor: 0, entries: [] },
    sources: [],
    claims: [],
    evidenceIds: [],
    report: null,
    resumeStageKey: null,
    updatedAt: at,
  });
}

export function createInitialResearchState(locale: "ar" | "en", restored?: ResearchSessionState): ResearchReducerState {
  const session = restored ?? emptyResearchSession(locale, "guided");
  return {
    ui: { ...createResearchPreviewState(), stage: stageForSession(session) },
    session,
  };
}

/**
 * Derives the stage purely from recorded state; a stored stage is honoured only
 * when the recorded facts can support it, so a hand-edited snapshot cannot fake
 * a stage the session never reached.
 */
export function derivedStageFor(session: ResearchSessionState): ResearchStageKey {
  if (session.brief === null) return "rsh_brief";
  if (session.clarifyAnswers.length < session.clarifyQuestionIds.length) return "rsh_clarify";
  if (session.planVersions.length === 0) return "rsh_plan_review";
  if (session.approvedPlanVersion === null) return "rsh_plan_review";
  if (session.activity.status !== "done") return "rsh_source_activity";
  if (session.evidenceIds.length === 0) return "rsh_source_review";
  if (session.report === null) return "rsh_claim_matrix";
  if (session.report.saved) return "rsh_complete";
  return "rsh_report_edit";
}

const reachableStages: Record<ResearchStageKey, (session: ResearchSessionState) => boolean> = {
  rsh_brief: () => true,
  rsh_clarify: (session) => session.brief !== null,
  rsh_plan_review: (session) => session.brief !== null,
  rsh_source_activity: (session) => session.approvedPlanVersion !== null,
  rsh_source_review: (session) => session.activity.status === "done" || session.activity.status === "cancelled",
  rsh_claim_matrix: (session) => session.activity.status === "done" && session.evidenceIds.length > 0,
  rsh_report_edit: (session) => session.report !== null,
  rsh_complete: (session) => session.report !== null && session.report.saved,
};

export function stageForSession(session: ResearchSessionState): ResearchStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type ResearchAction =
  | { type: "draft/question"; value: string }
  | { type: "draft/decision"; value: string }
  | { type: "draft/audience"; audience: ResearchAudience }
  | { type: "draft/scope"; scope: ResearchScope }
  | { type: "draft/topic"; topicId: ResearchTopicId }
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "brief/submit"; at: string }
  | { type: "clarify/answer"; questionId: string; choiceKey: string; at: string }
  | { type: "clarify/default"; questionId: string; at: string }
  | { type: "clarify/next" }
  | { type: "clarify/back" }
  | { type: "plan/build"; at: string }
  | { type: "plan/toggle-axis"; axisId: string; at: string }
  | { type: "plan/toggle-type"; sourceType: string; at: string }
  | { type: "plan/approve"; at: string }
  | { type: "plan/revise"; at: string }
  | { type: "activity/step" }
  | { type: "activity/autoplay"; enabled: boolean }
  | { type: "activity/steer"; steer: ResearchSteerKey; at: string }
  | { type: "activity/cancel"; at: string }
  | { type: "activity/resume"; at: string }
  | { type: "activity/back-to-plan" }
  | { type: "source/filter"; filter: ResearchUiState["sourceFilter"] }
  | { type: "source/exclude-preview"; sourceId: string }
  | { type: "source/exclude-cancel" }
  | { type: "source/exclude-apply"; at: string }
  | { type: "source/restore"; sourceId: string; at: string }
  | { type: "source/back-to-plan" }
  | { type: "sources/continue"; at: string }
  | { type: "claim/acknowledge"; claimId: string; at: string }
  | { type: "claim/resolve"; claimId: string; at: string }
  | { type: "claims/continue"; at: string }
  | { type: "report/edit-section"; sectionId: string; body: string }
  | { type: "report/review-section"; sectionId: string }
  | { type: "report/complete"; at: string }
  | { type: "report/save" }
  | { type: "inspector/open"; evidenceId: string }
  | { type: "inspector/close" }
  | { type: "session/restored"; session: ResearchSessionState };

function withValidation(state: ResearchReducerState, validation: ResearchValidationKey): ResearchReducerState {
  return { ...state, ui: { ...state.ui, validation } };
}

function updateSession(state: ResearchReducerState, session: ResearchSessionState, at: string): ResearchReducerState {
  return {
    ui: { ...state.ui, validation: null },
    session: { ...session, updatedAt: at },
  };
}

/** Current plan view: the approved version if present, else the newest draft. */
export function currentPlan(session: ResearchSessionState): ResearchPlan | null {
  if (session.approvedPlanVersion !== null) {
    const approved = session.planVersions.find((version) => version.version === session.approvedPlanVersion);
    if (approved !== undefined) return approved.plan;
  }
  return session.planVersions.at(-1)?.plan ?? null;
}

/**
 * Evidence discovered by the completed activity: exactly the evidence of the
 * sources the log actually scanned, minus evidence of excluded sources. This
 * is the honest coverage set — steering and plan edits are already baked into
 * the played log, so nothing is re-derived from assumptions.
 */
function evidenceFromActivity(session: ResearchSessionState): readonly string[] {
  const scanned = new Set(
    session.activity.entries
      .filter((entry) => entry.kind === "scan")
      .map((entry) => entry.sourceId)
      .filter((value): value is string => value !== null),
  );
  const excluded = new Set(session.sources.filter((source) => source.excluded).map((source) => source.id));
  const evidence = buildResearchEvidenceRefs(topicOf(session), session.locale);
  return evidence
    .filter((item) => scanned.has(item.sourceId) && !excluded.has(item.sourceId))
    .map((item) => item.id);
}

function topicOf(session: ResearchSessionState): ResearchTopicId {
  const topicId = session.sources[0]?.topicId;
  return topicOfValue(topicId);
}

function topicOfValue(topicId: string | undefined): ResearchTopicId {
  return topicId === "zero_match" || topicId === "remote_onboarding" ? topicId : "waiting_time_q3";
}

function clarifyQuestionsFor(topicId: ResearchTopicId) {
  return getResearchTopic(topicId).clarify;
}

/** Steer keys recorded in the log regenerate the remaining steps. */
function steerHistory(session: ResearchSessionState): ResearchSteerKey[] {
  return session.activity.entries
    .filter((entry) => entry.kind === "steer")
    .map((entry) => STEER_KEYS.find((key) => entry.labelKey.endsWith(key)))
    .filter((key): key is ResearchSteerKey => key !== undefined);
}

function activityStepsFor(session: ResearchSessionState, keys: readonly ResearchSteerKey[]) {
  const plan = currentPlan(session);
  if (plan === null) return [];
  const evidence = buildResearchEvidenceRefs(topicOf(session), session.locale);
  return buildResearchActivitySteps(topicOf(session), plan, session.sources, evidence, { count: keys.length, keys });
}

export function researchReducer(state: ResearchReducerState, action: ResearchAction): ResearchReducerState {
  const next = reduceResearch(state, action);
  if (next === state) {
    return state;
  }
  return next.session.resumeStageKey === next.ui.stage
    ? next
    : { ...next, session: { ...next.session, resumeStageKey: next.ui.stage } };
}

function reduceResearch(state: ResearchReducerState, action: ResearchAction): ResearchReducerState {
  switch (action.type) {
    case "draft/question":
      return { ...state, ui: { ...state.ui, draftQuestion: action.value } };
    case "draft/decision":
      return { ...state, ui: { ...state.ui, draftDecision: action.value } };
    case "draft/audience":
      return { ...state, ui: { ...state.ui, draftAudience: action.audience } };
    case "draft/scope":
      return { ...state, ui: { ...state.ui, draftScope: action.scope } };
    case "draft/topic":
      return { ...state, ui: { ...state.ui, draftTopicId: action.topicId } };

    case "mode/set": {
      const session: ResearchSessionState = { ...state.session, mode: action.mode, updatedAt: action.at };
      const stage = derivedStageFor(session);
      return { ui: { ...state.ui, stage, validation: null, clarifyIndex: 0 }, session };
    }

    case "brief/submit": {
      const candidate: ResearchBrief = {
        question: state.ui.draftQuestion.trim(),
        decision: state.ui.draftDecision.trim(),
        audience: state.ui.draftAudience,
        scope: state.ui.draftScope,
      };
      const parsed = researchBriefSchema.safeParse(candidate);
      if (!parsed.success) {
        return withValidation(state, "brief_incomplete");
      }
      const topicId = state.ui.draftTopicId;
      const session: ResearchSessionState = {
        ...state.session,
        brief: parsed.data,
        clarifyQuestionIds: [],
        clarifyAnswers: [],
        planVersions: [],
        approvedPlanVersion: null,
        activity: { status: "idle", steerCount: 0, cursor: 0, entries: [] },
        sources: buildResearchSourceRecords(topicId),
        claims: buildResearchTopicClaims(topicId),
        evidenceIds: [],
        report: null,
        updatedAt: action.at,
      };
      // Fast mode skips clarification: the plan is proposed directly, still for
      // explicit approval — never silently started.
      if (state.session.mode === "fast") {
        const plan = buildResearchPlan({
          topicId,
          scope: parsed.data.scope,
          audience: parsed.data.audience,
          clarifyAnswers: [],
          version: 1,
        });
        return {
          ui: { ...state.ui, stage: "rsh_plan_review", validation: null },
          session: {
            ...session,
            planVersions: [{ version: 1, plan, status: "draft", approvedAt: null, changeNoteKey: "services.research.plan.initial_draft" }],
          },
        };
      }
      const questions = clarifyQuestionsFor(topicId);
      return {
        ui: { ...state.ui, stage: "rsh_clarify", clarifyIndex: 0, validation: null },
        session: { ...session, clarifyQuestionIds: questions.map((question) => question.id) },
      };
    }

    case "clarify/answer": {
      const answers = [
        ...state.session.clarifyAnswers.filter((answer) => answer.questionId !== action.questionId),
        { questionId: action.questionId, choiceKey: action.choiceKey, usedDefault: false, answeredAt: action.at },
      ];
      return updateSession(state, { ...state.session, clarifyAnswers: answers }, action.at);
    }

    case "clarify/default": {
      const questions = clarifyQuestionsFor(topicOf(state.session) ?? state.ui.draftTopicId);
      const question = questions.find((candidate) => candidate.id === action.questionId);
      if (question === undefined) {
        return state;
      }
      const answers = [
        ...state.session.clarifyAnswers.filter((answer) => answer.questionId !== action.questionId),
        { questionId: action.questionId, choiceKey: question.choiceKeys[question.defaultChoiceIndex] ?? null, usedDefault: true, answeredAt: action.at },
      ];
      return updateSession(state, { ...state.session, clarifyAnswers: answers }, action.at);
    }

    case "clarify/next":
      return { ...state, ui: { ...state.ui, clarifyIndex: Math.min(state.ui.clarifyIndex + 1, Math.max(state.session.clarifyQuestionIds.length - 1, 0)) } };
    case "clarify/back":
      return { ...state, ui: { ...state.ui, clarifyIndex: Math.max(state.ui.clarifyIndex - 1, 0) } };

    case "plan/build": {
      const brief = state.session.brief;
      if (brief === null) {
        return withValidation(state, "brief_incomplete");
      }
      if (state.session.clarifyAnswers.length < state.session.clarifyQuestionIds.length) {
        return withValidation(state, "clarify_incomplete");
      }
      const topicId = topicOf(state.session);
      const plan = buildResearchPlan({
        topicId,
        scope: brief.scope,
        audience: brief.audience,
        clarifyAnswers: state.session.clarifyAnswers,
        version: 1,
      });
      return {
        ui: { ...state.ui, stage: "rsh_plan_review", validation: null },
        session: {
          ...state.session,
          planVersions: [{ version: 1, plan, status: "draft", approvedAt: null, changeNoteKey: "services.research.plan.initial_draft" }],
          updatedAt: action.at,
        },
      };
    }

    case "plan/toggle-axis":
    case "plan/toggle-type": {
      // Editing a draft updates the draft. Editing after approval creates a
      // new draft version: the approved version stays frozen and inspectable.
      const versions = [...state.session.planVersions];
      const newest = versions.at(-1);
      if (newest === undefined) {
        return withValidation(state, "plan_not_approved");
      }
      let workingVersion = newest;
      if (newest.status === "approved" || newest.status === "superseded") {
        const nextVersion = newest.version + 1;
        workingVersion = {
          version: nextVersion,
          plan: { ...newest.plan, version: nextVersion, revisedByUser: true },
          status: "draft",
          approvedAt: null,
          changeNoteKey: "services.research.plan.revised_after_approval",
        };
        versions.push(workingVersion);
      }
      const plan = workingVersion.plan;
      const nextPlan: ResearchPlan = action.type === "plan/toggle-axis"
        ? { ...plan, axes: plan.axes.map((axis) => (axis.id === action.axisId ? { ...axis, included: !axis.included } : axis)), revisedByUser: true }
        : {
            ...plan,
            sourceTypes: plan.sourceTypes.includes(action.sourceType as ResearchPlan["sourceTypes"][number])
              ? plan.sourceTypes.filter((type) => type !== action.sourceType)
              : [...plan.sourceTypes, action.sourceType as ResearchPlan["sourceTypes"][number]].slice(0, 6),
            revisedByUser: true,
          };
      // A plan with no source types is invalid: keep at least one.
      if (nextPlan.sourceTypes.length === 0) {
        return state;
      }
      const updated = versions.map((version) => (version.version === workingVersion.version ? { ...version, plan: nextPlan } : version));
      return updateSession(state, { ...state.session, planVersions: updated }, action.at);
    }

    case "plan/approve": {
      const newest = state.session.planVersions.at(-1);
      if (newest === undefined || newest.status !== "draft") {
        return withValidation(state, "plan_not_approved");
      }
      const versions = state.session.planVersions.map((version) =>
        version.version === newest.version
          ? { ...version, status: "approved" as const, approvedAt: action.at }
          : version.version < newest.version && version.status === "approved"
            ? { ...version, status: "superseded" as const }
            : version,
      );
      return {
        ui: { ...state.ui, stage: "rsh_source_activity", validation: null, autoPlay: false },
        session: {
          ...state.session,
          planVersions: versions,
          approvedPlanVersion: newest.version,
          activity: { status: "playing", steerCount: 0, cursor: 0, entries: [] },
          updatedAt: action.at,
        },
      };
    }

    case "plan/revise": {
      // After a run: revising creates a new draft; the activity needs a new
      // approval before a new run can start (U2-RSH-002).
      const base = state.session.planVersions.at(-1);
      if (base === undefined) {
        return state;
      }
      const nextVersion = base.version + 1;
      return {
        ui: { ...state.ui, stage: "rsh_plan_review", validation: null },
        session: {
          ...state.session,
          planVersions: [
            ...state.session.planVersions,
            { version: nextVersion, plan: { ...base.plan, version: nextVersion, revisedByUser: true }, status: "draft", approvedAt: null, changeNoteKey: "services.research.plan.revised_after_run" },
          ],
          updatedAt: action.at,
        },
      };
    }

    case "activity/step": {
      const session = state.session;
      if (session.activity.status !== "playing") {
        return state;
      }
      const keys = steerHistory(session);
      const steps = activityStepsFor(session, keys);
      const pending = session.activity.cursor;
      if (pending >= steps.length) {
        return state;
      }
      const step = steps[pending];
      if (step === undefined) {
        return state;
      }
      const entries = [...session.activity.entries, materializeResearchEntry(step, session.activity.entries.length)].slice(0, 200);
      const cursor = pending + 1;
      if (cursor === steps.length) {
        // Terminal step: the completion is an event the log records, so the
        // stage transition comes from it — never from a timeout.
        return {
          ui: { ...state.ui, autoPlay: false, validation: null, stage: "rsh_source_review" },
          session: {
            ...session,
            activity: { status: "done", steerCount: keys.length, cursor, entries },
            evidenceIds: [...evidenceFromActivity({ ...session, activity: { status: "done", steerCount: keys.length, cursor, entries } })],
          },
        };
      }
      return {
        ...state,
        session: { ...session, activity: { status: "playing", steerCount: keys.length, cursor, entries } },
      };
    }

    case "activity/autoplay":
      return { ...state, ui: { ...state.ui, autoPlay: action.enabled } };

    case "activity/steer": {
      const session = state.session;
      if (session.activity.status !== "playing") {
        return state;
      }
      const marker = researchActivityMarker("steer", `services.research.activity.steer_${action.steer}`, session.activity.entries.length);
      const entries = [...session.activity.entries, marker].slice(0, 200);
      // The pending steps regenerate under the new steer; played history stays.
      return {
        ...state,
        session: {
          ...session,
          activity: { status: "playing", steerCount: steerHistory({ ...session, activity: { ...session.activity, entries } }).length, cursor: 0, entries },
          updatedAt: action.at,
        },
      };
    }

    case "activity/cancel": {
      const session = state.session;
      if (session.activity.status !== "playing") {
        return state;
      }
      const marker = researchActivityMarker("cancelled", "services.research.activity.cancelled", session.activity.entries.length);
      const entries = [...session.activity.entries, marker].slice(0, 200);
      return {
        ui: { ...state.ui, autoPlay: false, validation: null },
        session: { ...session, activity: { status: "cancelled", steerCount: session.activity.steerCount, cursor: session.activity.cursor, entries }, updatedAt: action.at },
      };
    }

    case "activity/resume": {
      const session = state.session;
      if (session.activity.status !== "cancelled") {
        return state;
      }
      const marker = researchActivityMarker("resumed", "services.research.activity.resumed", session.activity.entries.length);
      const entries = [...session.activity.entries, marker].slice(0, 200);
      return {
        ...state,
        session: { ...session, activity: { status: "playing", steerCount: session.activity.steerCount, cursor: session.activity.cursor, entries }, updatedAt: action.at },
      };
    }

    case "activity/back-to-plan":
      return { ...state, ui: { ...state.ui, stage: "rsh_plan_review", validation: null } };

    case "source/filter":
      return { ...state, ui: { ...state.ui, sourceFilter: action.filter, excludePreviewSourceId: null } };

    case "source/exclude-preview":
      return { ...state, ui: { ...state.ui, excludePreviewSourceId: action.sourceId, validation: null } };

    case "source/exclude-cancel":
      return { ...state, ui: { ...state.ui, excludePreviewSourceId: null } };

    case "source/exclude-apply": {
      const sourceId = state.ui.excludePreviewSourceId;
      if (sourceId === null) {
        return state;
      }
      const sources = applySourceExclusion(state.session.sources, sourceId, action.at);
      const nextSession: ResearchSessionState = { ...state.session, sources };
      const evidenceIds = evidenceFromActivity(nextSession);
      const report = state.session.report === null
        ? null
        : {
            ...state.session.report,
            // Orphaned citations are removed by computation, never left behind.
            sections: state.session.report.sections.map((section) => ({
              ...section,
              evidenceIds: section.evidenceIds.filter((id) => evidenceIds.includes(id)),
            })),
          };
      return {
        ui: { ...state.ui, excludePreviewSourceId: null, validation: null },
        session: { ...nextSession, evidenceIds: [...evidenceIds], report, updatedAt: action.at },
      };
    }

    case "source/restore": {
      const sources = restoreResearchSource(state.session.sources, action.sourceId);
      const nextSession: ResearchSessionState = { ...state.session, sources };
      const evidenceIds = evidenceFromActivity(nextSession);
      return updateSession(state, { ...nextSession, evidenceIds: [...evidenceIds] }, action.at);
    }

    case "source/back-to-plan":
      // Recovery path from the zero-sources state: revise the plan explicitly.
      return { ...state, ui: { ...state.ui, stage: "rsh_plan_review", validation: null } };

    case "sources/continue": {
      if (state.session.activity.status === "done" && state.session.evidenceIds.length === 0) {
        return withValidation(state, "source_required");
      }
      return { ...state, ui: { ...state.ui, stage: "rsh_claim_matrix", validation: null } };
    }

    case "claim/acknowledge": {
      const claims = state.session.claims.map((claim) => (claim.id === action.claimId ? { ...claim, resolution: "acknowledged" as const } : claim));
      return updateSession(state, { ...state.session, claims }, action.at);
    }

    case "claim/resolve": {
      // Asking for more evidence is answered from the same fixture pack: the
      // claim is marked, and the report states that the request was noted,
      // never that new sources were found on the web.
      const claims = state.session.claims.map((claim) => (claim.id === action.claimId ? { ...claim, resolution: "resolved_needs_evidence" as const } : claim));
      return updateSession(state, { ...state.session, claims }, action.at);
    }

    case "claims/continue": {
      // Gate: every unsupported or conflicted claim needs an acknowledgement
      // or an explicit evidence request before the report can be drafted.
      const session = state.session;
      const evidence = buildResearchEvidenceRefs(topicOf(session), session.locale);
      const excluded = session.sources.filter((source) => source.excluded).map((source) => source.id);
      const verdicts = computeClaimVerdicts(session.claims, evidence, session.evidenceIds, excluded);
      const unresolved = verdicts.some((verdict) => {
        if (verdict.support !== "unsupported" && verdict.support !== "conflicted") return false;
        return session.claims.find((claim) => claim.id === verdict.claimId)?.resolution === "open";
      });
      if (unresolved) {
        return withValidation(state, "claim_unresolved");
      }
      const report = draftReportForSession(session, session.locale, evidence);
      return {
        ui: { ...state.ui, stage: "rsh_report_edit", validation: null },
        session: { ...session, report, updatedAt: action.at },
      };
    }

    case "report/edit-section": {
      const report = state.session.report;
      if (report === null) {
        return state;
      }
      const sections = report.sections.map((section) => (section.id === action.sectionId ? { ...section, body: action.body } : section));
      return { ...state, session: { ...state.session, report: { ...report, sections } } };
    }

    case "report/review-section": {
      const report = state.session.report;
      if (report === null) {
        return state;
      }
      const sections = report.sections.map((section) => (section.id === action.sectionId ? { ...section, reviewed: !section.reviewed } : section));
      return { ...state, session: { ...state.session, report: { ...report, sections } } };
    }

    case "report/complete": {
      const report = state.session.report;
      if (report === null) {
        return withValidation(state, "report_incomplete");
      }
      if (report.sections.some((section) => !section.reviewed)) {
        return withValidation(state, "report_incomplete");
      }
      return { ...state, ui: { ...state.ui, stage: "rsh_complete", validation: null } };
    }

    case "report/save": {
      const report = state.session.report;
      if (report === null) {
        return state;
      }
      return { ...state, session: { ...state.session, report: { ...report, saved: true } } };
    }

    case "inspector/open":
      return { ...state, ui: { ...state.ui, inspectorEvidenceId: action.evidenceId } };
    case "inspector/close":
      return { ...state, ui: { ...state.ui, inspectorEvidenceId: null } };

    case "session/restored":
      return { ui: { ...createResearchPreviewState(), stage: stageForSession(action.session) }, session: action.session };

    default:
      return state;
  }
}

/** Exported preview helper used by the source-review surface. */
export function exclusionPreviewFor(state: ResearchReducerState) {
  if (state.ui.excludePreviewSourceId === null) return null;
  const evidence = buildResearchEvidenceRefs(topicOf(state.session), state.session.locale);
  return previewSourceExclusion(state.ui.excludePreviewSourceId, state.session.claims, evidence, state.session.evidenceIds);
}
