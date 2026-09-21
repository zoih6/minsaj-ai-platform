import type {
  AnalyzeOperation,
  AnalyzeSessionState,
  AnalyzeStageKey,
} from "@minsaj/contracts/services";
import { analyzeSessionStateSchema } from "@minsaj/contracts/services";
import {
  buildAnalyzeComputeSteps,
  buildAnalyzePlan,
  buildAnalyzeProfile,
  buildAnalyzeResult,
  buildAnalyzeSummary,
  buildAnalyzeVerification,
  excludeAnalyzePlanStep,
  isAnalyzeDatasetId,
  reorderAnalyzePlanStep,
  restoreAnalyzePlanStep,
} from "@minsaj/mock-api/services";

/**
 * Analyze slice state machine — U2.5.
 *
 * Stages follow the blueprint in `@minsaj/contracts/services` and every
 * transition has a documented guard: a profile cannot exist without a source,
 * a plan cannot be approved with zero steps, the result cannot appear without
 * an approved plan, verification cannot confirm with unacknowledged checks, and
 * the summary is always derived from the plan and checks the analyst actually
 * confirmed. Fast mode skips the plan review round-trip, never the verification
 * review point, and switching modes never deletes the source or question.
 */

export const analyzeStageKeys: readonly AnalyzeStageKey[] = [
  "ana_source",
  "ana_profile",
  "ana_question",
  "ana_plan",
  "ana_compute",
  "ana_result",
  "ana_verify",
  "ana_complete",
];

export type { AnalyzeStageKey };

export type AnalyzeValidationKey =
  | "source_incomplete"
  | "question_incomplete"
  | "plan_empty"
  | "verify_incomplete"
  | "result_missing"
  | null;

export type AnalyzeUiState = {
  stage: AnalyzeStageKey;
  draftDatasetId: string;
  draftLocalFileName: string;
  draftQuestion: string;
  draftOperation: AnalyzeOperation;
  draftAssumptions: string[];
  assumptionDraft: string;
  computeIndex: number;
  computeDone: boolean;
  validation: AnalyzeValidationKey;
};

export type AnalyzeReducerState = {
  ui: AnalyzeUiState;
  session: AnalyzeSessionState;
};

export function createAnalyzePreviewState(): AnalyzeUiState {
  return {
    stage: "ana_source",
    draftDatasetId: "dset_sales_30",
    draftLocalFileName: "",
    draftQuestion: "",
    draftOperation: "trend",
    draftAssumptions: [],
    assumptionDraft: "",
    computeIndex: 0,
    computeDone: false,
    validation: null,
  };
}

export function createInitialAnalyzeState(locale: "ar" | "en", restored?: AnalyzeSessionState): AnalyzeReducerState {
  const session = restored ?? emptyAnalyzeSession(locale, "guided");
  return { ui: { ...createAnalyzePreviewState(), stage: stageForSession(session) }, session };
}

export function emptyAnalyzeSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): AnalyzeSessionState {
  return analyzeSessionStateSchema.parse({
    serviceId: "analyze",
    stateVersion: 1,
    locale,
    mode,
    source: null,
    profile: null,
    question: null,
    plan: null,
    computeSteps: null,
    result: null,
    verification: null,
    summary: null,
    resumeStageKey: null,
    updatedAt: at,
  });
}

/**
 * Derives the stage purely from recorded state.
 *
 * `stageForSession` is the trust boundary: a stored stage is honoured only
 * when the recorded facts can support it, otherwise the derived stage wins.
 */
export function derivedStageFor(session: AnalyzeSessionState): AnalyzeStageKey {
  if (session.source === null) {
    return "ana_source";
  }
  if (session.profile === null) {
    return "ana_profile";
  }
  if (session.question === null) {
    return "ana_question";
  }
  if (session.plan === null) {
    return "ana_question";
  }
  if (session.result === null) {
    return "ana_compute";
  }
  if (session.verification === null || !session.verification.confirmed) {
    return "ana_verify";
  }
  return "ana_complete";
}

const reachableStages: Record<AnalyzeStageKey, (session: AnalyzeSessionState) => boolean> = {
  ana_source: () => true,
  ana_profile: (session) => session.source !== null && session.profile === null,
  ana_question: (session) => session.profile !== null && session.question === null,
  ana_plan: (session) => session.question !== null && session.plan !== null && session.result === null,
  ana_compute: (session) => session.plan !== null && session.result === null,
  ana_result: (session) => session.result !== null && session.verification === null,
  ana_verify: (session) => session.result !== null && (session.verification === null || !session.verification.confirmed),
  ana_complete: (session) => session.verification?.confirmed === true,
};

export function stageForSession(session: AnalyzeSessionState): AnalyzeStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type AnalyzeAction =
  | { type: "draft/dataset"; datasetId: string }
  | { type: "draft/localFileName"; value: string }
  | { type: "draft/question"; value: string }
  | { type: "draft/operation"; operation: AnalyzeOperation }
  | { type: "draft/assumption"; value: string }
  | { type: "draft/assumptionAdd" }
  | { type: "draft/assumptionRemove"; index: number }
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "source/submit"; at: string }
  | { type: "profile/continue" }
  | { type: "question/submit"; at: string }
  | { type: "plan/move"; stepId: string; direction: "up" | "down"; at: string }
  | { type: "plan/exclude"; stepId: string; reasonKey: string; at: string }
  | { type: "plan/restore"; stepId: string; at: string }
  | { type: "plan/approve"; at: string }
  | { type: "compute/step" }
  | { type: "compute/finish"; at: string }
  | { type: "result/continue" }
  | { type: "verify/acknowledge"; checkId: string; at: string }
  | { type: "verify/confirm"; at: string }
  | { type: "session/restored"; session: AnalyzeSessionState };

function withValidation(state: AnalyzeReducerState, validation: AnalyzeValidationKey): AnalyzeReducerState {
  return { ...state, ui: { ...state.ui, validation } };
}

function updateSession(state: AnalyzeReducerState, session: AnalyzeSessionState, at: string): AnalyzeReducerState {
  return {
    ui: { ...state.ui, validation: null },
    session: { ...session, updatedAt: at },
  };
}

export function analyzeReducer(state: AnalyzeReducerState, action: AnalyzeAction): AnalyzeReducerState {
  const next = reduceAnalyze(state, action);
  if (next === state) {
    return state;
  }
  // Every transition records where the analyst was, so a resume restores that
  // exact stage and never has to guess.
  return next.session.resumeStageKey === next.ui.stage
    ? next
    : { ...next, session: { ...next.session, resumeStageKey: next.ui.stage } };
}

function reduceAnalyze(state: AnalyzeReducerState, action: AnalyzeAction): AnalyzeReducerState {
  switch (action.type) {
    case "draft/dataset":
      return { ...state, ui: { ...state.ui, draftDatasetId: action.datasetId } };
    case "draft/localFileName":
      return { ...state, ui: { ...state.ui, draftLocalFileName: action.value } };
    case "draft/question":
      return { ...state, ui: { ...state.ui, draftQuestion: action.value } };
    case "draft/operation":
      return { ...state, ui: { ...state.ui, draftOperation: action.operation } };
    case "draft/assumption":
      return { ...state, ui: { ...state.ui, assumptionDraft: action.value } };
    case "draft/assumptionAdd": {
      const value = state.ui.assumptionDraft.trim();
      if (value.length === 0 || state.ui.draftAssumptions.length >= 6) {
        return state;
      }
      return { ...state, ui: { ...state.ui, draftAssumptions: [...state.ui.draftAssumptions, value], assumptionDraft: "" } };
    }
    case "draft/assumptionRemove": {
      const next = state.ui.draftAssumptions.filter((_, index) => index !== action.index);
      return { ...state, ui: { ...state.ui, draftAssumptions: next } };
    }

    case "mode/set": {
      // Switching modes keeps the source, profile, and question.
      const session: AnalyzeSessionState = {
        ...state.session,
        mode: action.mode,
        updatedAt: action.at,
      };
      return { ui: { ...state.ui, stage: derivedStageFor(session), validation: null }, session };
    }

    case "source/submit": {
      if (!isAnalyzeDatasetId(state.ui.draftDatasetId)) {
        return withValidation(state, "source_incomplete");
      }
      const localFileName = state.ui.draftLocalFileName.trim();
      const session: AnalyzeSessionState = {
        ...state.session,
        source: {
          datasetFixtureId: state.ui.draftDatasetId,
          localFileName: localFileName.length === 0 ? null : localFileName,
        },
        profile: buildAnalyzeProfile(state.ui.draftDatasetId),
        updatedAt: action.at,
      };
      return { ui: { ...state.ui, stage: "ana_profile", validation: null }, session };
    }

    case "profile/continue": {
      if (state.session.profile === null) {
        return withValidation(state, "source_incomplete");
      }
      return { ...state, ui: { ...state.ui, stage: "ana_question", validation: null } };
    }

    case "question/submit": {
      const question = state.ui.draftQuestion.trim();
      if (question.length === 0) {
        return withValidation(state, "question_incomplete");
      }
      const plan = buildAnalyzePlan(state.ui.draftOperation);
      const session: AnalyzeSessionState = {
        ...state.session,
        question: {
          question,
          operation: state.ui.draftOperation,
          assumptions: [...state.ui.draftAssumptions],
        },
        plan,
        updatedAt: action.at,
      };
      if (state.session.mode === "fast") {
        // Fast mode adopts the plan as-is and runs the compute directly; the
        // verification review point stays mandatory.
        return {
          ui: { ...state.ui, stage: "ana_compute", computeIndex: 0, computeDone: false, validation: null },
          session: { ...session, computeSteps: buildAnalyzeComputeSteps(plan), updatedAt: action.at },
        };
      }
      return { ui: { ...state.ui, stage: "ana_plan", validation: null }, session };
    }

    case "plan/move": {
      if (state.session.plan === null) {
        return withValidation(state, "question_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: reorderAnalyzePlanStep(state.session.plan, action.stepId, action.direction) },
        action.at,
      );
    }

    case "plan/exclude": {
      if (state.session.plan === null) {
        return withValidation(state, "question_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: excludeAnalyzePlanStep(state.session.plan, action.stepId, action.reasonKey) },
        action.at,
      );
    }

    case "plan/restore": {
      if (state.session.plan === null) {
        return withValidation(state, "question_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: restoreAnalyzePlanStep(state.session.plan, action.stepId) },
        action.at,
      );
    }

    case "plan/approve": {
      const plan = state.session.plan;
      if (plan === null) {
        return withValidation(state, "question_incomplete");
      }
      if (plan.steps.every((step) => !step.included)) {
        return withValidation(state, "plan_empty");
      }
      return {
        ui: { ...state.ui, stage: "ana_compute", computeIndex: 0, computeDone: false, validation: null },
        session: { ...state.session, computeSteps: buildAnalyzeComputeSteps(plan), updatedAt: action.at },
      };
    }

    case "compute/step": {
      const steps = state.session.computeSteps ?? [];
      const nextIndex = Math.min(state.ui.computeIndex + 1, steps.length);
      const done = nextIndex >= steps.length && steps.length > 0;
      if (done === state.ui.computeDone && nextIndex === state.ui.computeIndex) {
        return state;
      }
      return { ...state, ui: { ...state.ui, computeIndex: nextIndex, computeDone: done } };
    }

    case "compute/finish": {
      const { source, question, plan } = state.session;
      if (source === null || question === null || plan === null || state.session.computeSteps === null) {
        return withValidation(state, "result_missing");
      }
      return {
        ui: { ...state.ui, stage: "ana_result", validation: null },
        session: {
          ...state.session,
          result: buildAnalyzeResult(source.datasetFixtureId, question.operation, plan, question.assumptions.length),
          updatedAt: action.at,
        },
      };
    }

    case "result/continue": {
      if (state.session.result === null) {
        return withValidation(state, "result_missing");
      }
      const { source, question, plan } = state.session;
      const verification = source !== null && question !== null && plan !== null
        ? buildAnalyzeVerification(source.datasetFixtureId, plan, question.assumptions.length)
        : null;
      if (verification === null) {
        return withValidation(state, "result_missing");
      }
      return {
        ui: { ...state.ui, stage: "ana_verify", validation: null },
        session: { ...state.session, verification, updatedAt: state.session.updatedAt },
      };
    }

    case "verify/acknowledge": {
      const verification = state.session.verification;
      if (verification === null) {
        return withValidation(state, "result_missing");
      }
      const acknowledgedIds = verification.acknowledgedIds.includes(action.checkId)
        ? verification.acknowledgedIds.filter((id) => id !== action.checkId)
        : [...verification.acknowledgedIds, action.checkId];
      return updateSession(
        state,
        { ...state.session, verification: { ...verification, acknowledgedIds } },
        action.at,
      );
    }

    case "verify/confirm": {
      const verification = state.session.verification;
      const result = state.session.result;
      const question = state.session.question;
      if (verification === null || result === null || question === null) {
        return withValidation(state, "result_missing");
      }
      const allAcknowledged = verification.checks.every((check) => verification.acknowledgedIds.includes(check.id));
      if (!allAcknowledged) {
        return withValidation(state, "verify_incomplete");
      }
      const confirmed = { ...verification, confirmed: true };
      return {
        ui: { ...state.ui, stage: "ana_complete", validation: null },
        session: {
          ...state.session,
          verification: confirmed,
          summary: buildAnalyzeSummary(result, confirmed, question.assumptions.length),
          updatedAt: action.at,
        },
      };
    }

    case "session/restored": {
      return { ui: { ...createAnalyzePreviewState(), stage: stageForSession(action.session) }, session: action.session };
    }

    default:
      return state;
  }
}
