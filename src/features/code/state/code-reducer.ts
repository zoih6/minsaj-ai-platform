import type {
  CodeSessionState,
  CodeStageKey,
} from "@minsaj/contracts/services";
import { codeSessionStateSchema } from "@minsaj/contracts/services";
import {
  buildCodeChecks,
  buildCodeImpact,
  buildCodePlan,
  buildCodeProposal,
  excludeCodePlanStep,
  reorderCodePlanStep,
  restoreCodePlanStep,
  isCodeProjectId,
} from "@minsaj/mock-api/services";

/**
 * Code slice state machine — U2.4.
 *
 * Stages follow the blueprint in `@minsaj/contracts/services` and every
 * transition has a documented guard: a proposal cannot exist without an
 * approved plan, the diff review cannot pass with unreviewed files, checks run
 * only on an applied working copy, and the impact receipt is always derived
 * from the plan the user actually approved. Fast mode skips the plan review
 * round-trip, never the diff or checks review points, and switching modes never
 * deletes the scope.
 */

export const codeStageKeys: readonly CodeStageKey[] = [
  "cod_scope",
  "cod_plan",
  "cod_proposal",
  "cod_diff_review",
  "cod_working_copy",
  "cod_preview_checks",
  "cod_receipt",
];

export type { CodeStageKey };

export type CodeValidationKey =
  | "scope_incomplete"
  | "plan_empty"
  | "diff_incomplete"
  | "checks_missing"
  | "copy_not_applied"
  | null;

export type CodeUiState = {
  stage: CodeStageKey;
  draftProjectId: string;
  draftTaskType: "build" | "fix" | "review" | "learn";
  draftChangeRequest: string;
  exclusionReasonDraft: Record<string, string>;
  validation: CodeValidationKey;
};

export type CodeReducerState = {
  ui: CodeUiState;
  session: CodeSessionState;
};

export function createCodePreviewState(): CodeUiState {
  return {
    stage: "cod_scope",
    draftProjectId: "cprj_web_checkout",
    draftTaskType: "fix",
    draftChangeRequest: "",
    exclusionReasonDraft: {},
    validation: null,
  };
}

export function createInitialCodeState(locale: "ar" | "en", restored?: CodeSessionState): CodeReducerState {
  const session = restored ?? emptyCodeSession(locale, "guided");
  return { ui: { ...createCodePreviewState(), stage: stageForSession(session) }, session };
}

export function emptyCodeSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): CodeSessionState {
  return codeSessionStateSchema.parse({
    serviceId: "code",
    stateVersion: 1,
    locale,
    mode,
    scope: null,
    plan: null,
    proposal: null,
    diffReview: null,
    workingCopyApplied: false,
    checks: null,
    impact: null,
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
export function derivedStageFor(session: CodeSessionState): CodeStageKey {
  if (session.scope === null) {
    return "cod_scope";
  }
  if (session.plan === null) {
    return "cod_scope";
  }
  if (session.mode === "guided" && session.proposal === null) {
    return "cod_plan";
  }
  if (session.proposal === null) {
    return "cod_plan";
  }
  if (session.diffReview === null || !session.diffReview.acknowledged) {
    return "cod_diff_review";
  }
  if (!session.workingCopyApplied) {
    return "cod_working_copy";
  }
  if (session.checks === null || !session.checks.acknowledged) {
    return "cod_preview_checks";
  }
  return "cod_receipt";
}

const reachableStages: Record<CodeStageKey, (session: CodeSessionState) => boolean> = {
  cod_scope: () => true,
  cod_plan: (session) => session.scope !== null && session.plan !== null && session.proposal === null,
  cod_proposal: (session) => session.proposal !== null && session.diffReview === null,
  cod_diff_review: (session) => session.proposal !== null && (session.diffReview === null || !session.diffReview.acknowledged),
  cod_working_copy: (session) => session.diffReview?.acknowledged === true && !session.workingCopyApplied,
  cod_preview_checks: (session) => session.workingCopyApplied && (session.checks === null || !session.checks.acknowledged),
  cod_receipt: (session) => session.checks?.acknowledged === true,
};

export function stageForSession(session: CodeSessionState): CodeStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type CodeAction =
  | { type: "draft/project"; projectId: string }
  | { type: "draft/taskType"; taskType: "build" | "fix" | "review" | "learn" }
  | { type: "draft/changeRequest"; value: string }
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "scope/submit"; at: string }
  | { type: "plan/move"; stepId: string; direction: "up" | "down"; at: string }
  | { type: "plan/exclude"; stepId: string; reasonKey: string; at: string }
  | { type: "plan/restore"; stepId: string; at: string }
  | { type: "plan/approve"; at: string }
  | { type: "proposal/continue" }
  | { type: "diff/markReviewed"; path: string; at: string }
  | { type: "diff/flag"; path: string; noteKey: string; at: string }
  | { type: "diff/acknowledge"; at: string }
  | { type: "copy/apply"; at: string }
  | { type: "checks/acknowledge"; at: string }
  | { type: "session/restored"; session: CodeSessionState };

function withValidation(state: CodeReducerState, validation: CodeValidationKey): CodeReducerState {
  return { ...state, ui: { ...state.ui, validation } };
}

function updateSession(state: CodeReducerState, session: CodeSessionState, at: string): CodeReducerState {
  return {
    ui: { ...state.ui, validation: null },
    session: { ...session, updatedAt: at },
  };
}

export function codeReducer(state: CodeReducerState, action: CodeAction): CodeReducerState {
  const next = reduceCode(state, action);
  if (next === state) {
    return state;
  }
  // Every transition records where the reviewer was, so a resume restores that
  // exact stage and never has to guess.
  return next.session.resumeStageKey === next.ui.stage
    ? next
    : { ...next, session: { ...next.session, resumeStageKey: next.ui.stage } };
}

function reduceCode(state: CodeReducerState, action: CodeAction): CodeReducerState {
  switch (action.type) {
    case "draft/project":
      return { ...state, ui: { ...state.ui, draftProjectId: action.projectId } };
    case "draft/taskType":
      return { ...state, ui: { ...state.ui, draftTaskType: action.taskType } };
    case "draft/changeRequest":
      return { ...state, ui: { ...state.ui, draftChangeRequest: action.value } };

    case "mode/set": {
      // Switching modes keeps the scope; only the plan review round-trip changes.
      const session: CodeSessionState = {
        ...state.session,
        mode: action.mode,
        updatedAt: action.at,
      };
      return { ui: { ...state.ui, stage: derivedStageFor(session), validation: null }, session };
    }

    case "scope/submit": {
      const request = state.ui.draftChangeRequest.trim();
      if (request.length === 0 || !isCodeProjectId(state.ui.draftProjectId)) {
        return withValidation(state, "scope_incomplete");
      }
      const plan = buildCodePlan(state.ui.draftProjectId, state.ui.draftTaskType);
      const session: CodeSessionState = {
        ...state.session,
        scope: {
          projectFixtureId: state.ui.draftProjectId,
          taskType: state.ui.draftTaskType,
          changeRequest: request,
        },
        plan,
        updatedAt: action.at,
      };
      if (state.session.mode === "fast") {
        // Fast mode adopts the plan as-is and shows it whole in the proposal;
        // the diff and checks review points stay mandatory.
        return {
          ui: { ...state.ui, stage: "cod_proposal", validation: null },
          session: { ...session, proposal: buildCodeProposal(plan), updatedAt: action.at },
        };
      }
      return { ui: { ...state.ui, stage: "cod_plan", validation: null }, session };
    }

    case "plan/move": {
      if (state.session.plan === null) {
        return withValidation(state, "scope_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: reorderCodePlanStep(state.session.plan, action.stepId, action.direction) },
        action.at,
      );
    }

    case "plan/exclude": {
      if (state.session.plan === null) {
        return withValidation(state, "scope_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: excludeCodePlanStep(state.session.plan, action.stepId, action.reasonKey) },
        action.at,
      );
    }

    case "plan/restore": {
      if (state.session.plan === null) {
        return withValidation(state, "scope_incomplete");
      }
      return updateSession(
        state,
        { ...state.session, plan: restoreCodePlanStep(state.session.plan, action.stepId) },
        action.at,
      );
    }

    case "plan/approve": {
      const plan = state.session.plan;
      if (plan === null) {
        return withValidation(state, "scope_incomplete");
      }
      if (plan.steps.every((step) => !step.included)) {
        return withValidation(state, "plan_empty");
      }
      return {
        ui: { ...state.ui, stage: "cod_proposal", validation: null },
        session: { ...state.session, proposal: buildCodeProposal(plan), updatedAt: action.at },
      };
    }

    case "proposal/continue": {
      if (state.session.proposal === null) {
        return withValidation(state, "scope_incomplete");
      }
      return {
        ui: { ...state.ui, stage: "cod_diff_review", validation: null },
        session: { ...state.session, diffReview: { reviewedPaths: [], flaggedPaths: [], acknowledged: false }, updatedAt: state.session.updatedAt },
      };
    }

    case "diff/markReviewed": {
      const review = state.session.diffReview;
      if (review === null) {
        return withValidation(state, "scope_incomplete");
      }
      const reviewedPaths = review.reviewedPaths.includes(action.path)
        ? review.reviewedPaths
        : [...review.reviewedPaths, action.path];
      return updateSession(
        state,
        { ...state.session, diffReview: { ...review, reviewedPaths } },
        action.at,
      );
    }

    case "diff/flag": {
      const review = state.session.diffReview;
      if (review === null) {
        return withValidation(state, "scope_incomplete");
      }
      const flagged = review.flaggedPaths.some((entry) => entry.path === action.path)
        ? review.flaggedPaths.map((entry) => (entry.path === action.path ? { path: action.path, noteKey: action.noteKey } : entry))
        : [...review.flaggedPaths, { path: action.path, noteKey: action.noteKey }];
      return updateSession(
        state,
        { ...state.session, diffReview: { ...review, flaggedPaths: flagged } },
        action.at,
      );
    }

    case "diff/acknowledge": {
      const review = state.session.diffReview;
      const proposal = state.session.proposal;
      if (review === null || proposal === null) {
        return withValidation(state, "scope_incomplete");
      }
      const allReviewed = proposal.fileChanges.every((change) => review.reviewedPaths.includes(change.path));
      if (!allReviewed) {
        return withValidation(state, "diff_incomplete");
      }
      return {
        ui: { ...state.ui, stage: "cod_working_copy", validation: null },
        session: { ...state.session, diffReview: { ...review, acknowledged: true }, workingCopyApplied: false, updatedAt: action.at },
      };
    }

    case "copy/apply": {
      if (state.session.diffReview?.acknowledged !== true) {
        return withValidation(state, "copy_not_applied");
      }
      const plan = state.session.plan;
      if (plan === null) {
        return withValidation(state, "scope_incomplete");
      }
      return {
        ui: { ...state.ui, stage: "cod_preview_checks", validation: null },
        session: {
          ...state.session,
          workingCopyApplied: true,
          checks: buildCodeChecks(plan),
          updatedAt: action.at,
        },
      };
    }

    case "checks/acknowledge": {
      const checks = state.session.checks;
      const plan = state.session.plan;
      if (checks === null || plan === null || !state.session.workingCopyApplied) {
        return withValidation(state, "checks_missing");
      }
      const acknowledged: typeof checks = { ...checks, acknowledged: true };
      return {
        ui: { ...state.ui, stage: "cod_receipt", validation: null },
        session: {
          ...state.session,
          checks: acknowledged,
          impact: buildCodeImpact(plan, acknowledged),
          updatedAt: action.at,
        },
      };
    }

    case "session/restored": {
      return { ui: { ...createCodePreviewState(), stage: stageForSession(action.session) }, session: action.session };
    }

    default:
      return state;
  }
}
