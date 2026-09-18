import type {
  LearnBrief,
  LearnLevel,
  LearnSessionState,
  LearnStageKey,
} from "@minsaj/contracts/services";
import { learnBriefSchema, learnSessionStateSchema } from "@minsaj/contracts/services";
import {
  appendLearnAttempt,
  buildLearnPath,
  completeLearnModule,
  computeLearnProgress,
  describeLearnFeedback,
  evaluateLearnCheck,
  getLearnHintKey,
  getLearnTopic,
  bestOutcomesFromAttempts,
  isPathComplete,
  nextLearnHintLevel,
  nextLearnModule,
  reorderLearnModule,
  restoreLearnModule,
  scoreLearnedLevel,
  skipLearnModule,
  type LearnCheckAnswer,
  type LearnHintLevel,
  type LearnTopicId,
} from "@minsaj/mock-api/services";

/**
 * Learn slice state machine — U2.1.
 *
 * Stages follow the blueprint in `@minsaj/contracts/services` section 11.3 and
 * every transition has a documented guard: a check cannot run before the lesson
 * was engaged, a feedback cannot exist without a recorded attempt, and a module
 * completes only after a correct outcome. Switching modes never deletes
 * answers, and resuming from storage always lands on the stage that matches the
 * recorded state instead of a guessed one.
 */

export const learnStageKeys: readonly LearnStageKey[] = [
  "lrn_brief",
  "lrn_diagnostic",
  "lrn_path_review",
  "lrn_lesson",
  "lrn_check",
  "lrn_feedback",
  "lrn_checkpoint",
  "lrn_complete",
];

export type { LearnStageKey };

export type LearnValidationKey =
  | "brief_incomplete"
  | "diagnostic_incomplete"
  | "path_missing"
  | "check_incomplete"
  | "lesson_not_engaged"
  | "skip_reason_required"
  | null;

export type LearnUiState = {
  stage: LearnStageKey;
  /** Index of the diagnostic question on screen; never auto-advances. */
  diagnosticIndex: number;
  draftMotivation: string;
  draftTopicId: string;
  draftMinutes: 5 | 15 | 30;
  draftLevel: LearnLevel;
  selectedChoiceId: string | null;
  answerText: string;
  hintLevel: LearnHintLevel;
  usedHint: boolean;
  validation: LearnValidationKey;
};

export type LearnReducerState = {
  ui: LearnUiState;
  session: LearnSessionState;
};

export function createLearnPreviewState(): LearnUiState {
  return {
    stage: "lrn_brief",
    diagnosticIndex: 0,
    draftMotivation: "",
    draftTopicId: "spaced_repetition",
    draftMinutes: 15,
    draftLevel: "beginner",
    selectedChoiceId: null,
    answerText: "",
    hintLevel: 0,
    usedHint: false,
    validation: null,
  };
}

export function createInitialLearnState(locale: "ar" | "en", restored?: LearnSessionState): LearnReducerState {
  const session = restored ?? emptyLearnSession(locale, "guided");
  return { ui: { ...createLearnPreviewState(), stage: stageForSession(session) }, session };
}

export function emptyLearnSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): LearnSessionState {
  return learnSessionStateSchema.parse({
    serviceId: "learn",
    stateVersion: 1,
    locale,
    mode,
    brief: null,
    diagnosticAnswers: [],
    diagnosticQuestionIds: [],
    path: null,
    currentModuleId: null,
    lessonEngaged: false,
    attempts: [],
    hints: [],
    feedback: null,
    progress: { completedModules: 0, totalModules: 0, confidence: "low", needsReview: false },
    selfAssessed: mode === "fast",
    resumeStageKey: null,
    updatedAt: at,
  });
}

/**
 * Resume mapping. It reads recorded state only; nothing depends on elapsed
 * time or on where the previous tab was scrolled.
 */
/**
 * Derives the stage purely from recorded state.
 *
 * `recordedStageFor` is the trust boundary: a stored stage is honoured only
 * when the recorded facts can support it, otherwise the derived stage wins.
 */
export function derivedStageFor(session: LearnSessionState): LearnStageKey {
  if (session.brief === null) {
    return "lrn_brief";
  }
  if (session.mode === "guided" && session.diagnosticAnswers.length === 0) {
    return "lrn_diagnostic";
  }
  if (session.path === null) {
    return session.mode === "guided" ? "lrn_diagnostic" : "lrn_path_review";
  }
  if (isPathComplete(session.path)) {
    return "lrn_complete";
  }
  if (session.feedback !== null) {
    return "lrn_feedback";
  }
  if (session.lessonEngaged) {
    return "lrn_check";
  }
  return "lrn_lesson";
}

const reachableStages: Record<LearnStageKey, (session: LearnSessionState) => boolean> = {
  lrn_brief: () => true,
  lrn_diagnostic: (session) => session.brief !== null,
  lrn_path_review: (session) => session.path !== null,
  lrn_lesson: (session) => session.path !== null && !isPathComplete(session.path),
  lrn_check: (session) => session.path !== null && session.lessonEngaged,
  lrn_feedback: (session) => session.feedback !== null,
  lrn_checkpoint: (session) => session.path !== null && session.progress.completedModules > 0,
  lrn_complete: (session) => session.path !== null && isPathComplete(session.path),
};

export function stageForSession(session: LearnSessionState): LearnStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type LearnAction =
  | { type: "draft/topic"; topicId: string }
  | { type: "draft/motivation"; value: string }
  | { type: "draft/minutes"; minutes: 5 | 15 | 30 }
  | { type: "draft/level"; level: LearnLevel }
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "brief/submit"; at: string }
  | { type: "diagnostic/answer"; questionId: string; choiceId: string | null; skipped: boolean; at: string }
  | { type: "diagnostic/next" }
  | { type: "diagnostic/back" }
  | { type: "path/build"; at: string }
  | { type: "path/confirm"; at: string }
  | { type: "path/move"; moduleId: string; direction: "up" | "down"; at: string }
  | { type: "path/skip"; moduleId: string; reasonKey: string; at: string }
  | { type: "path/restore"; moduleId: string; at: string }
  | { type: "lesson/engage"; at: string }
  | { type: "lesson/continue"; at: string }
  | { type: "check/select"; choiceId: string }
  | { type: "check/text"; value: string }
  | { type: "check/hint" }
  | { type: "check/submit"; at: string }
  | { type: "check/skip"; at: string }
  | { type: "feedback/acknowledge"; at: string }
  | { type: "feedback/retry" }
  | { type: "checkpoint/continue" }
  | { type: "checkpoint/save" }
  | { type: "session/restored"; session: LearnSessionState };

function withValidation(state: LearnReducerState, validation: LearnValidationKey): LearnReducerState {
  return { ...state, ui: { ...state.ui, validation } };
}

function updateSession(state: LearnReducerState, session: LearnSessionState, at: string): LearnReducerState {
  return {
    ui: { ...state.ui, validation: null },
    session: { ...session, updatedAt: at },
  };
}

function currentModuleId(session: LearnSessionState): string | null {
  return session.path === null ? null : nextLearnModule(session.path)?.id ?? null;
}

export function learnReducer(state: LearnReducerState, action: LearnAction): LearnReducerState {
  const next = reduceLearn(state, action);
  if (next === state) {
    return state;
  }
  // Every transition records where the learner was, so a resume restores that
  // exact stage and never has to guess.
  return next.session.resumeStageKey === next.ui.stage
    ? next
    : { ...next, session: { ...next.session, resumeStageKey: next.ui.stage } };
}

function reduceLearn(state: LearnReducerState, action: LearnAction): LearnReducerState {
  switch (action.type) {
    case "draft/topic":
      return { ...state, ui: { ...state.ui, draftTopicId: action.topicId } };
    case "draft/motivation":
      return { ...state, ui: { ...state.ui, draftMotivation: action.value } };
    case "draft/minutes":
      return { ...state, ui: { ...state.ui, draftMinutes: action.minutes } };
    case "draft/level":
      return { ...state, ui: { ...state.ui, draftLevel: action.level } };

    case "mode/set": {
      // Switching modes keeps every recorded answer and path. Switching back to
      // guided re-arms the diagnostic question list, so the flow cannot be
      // confirmed with zero answers.
      const topicId = state.session.brief?.topicId;
      const topic = topicId !== undefined && isSupportedTopic(topicId) ? getLearnTopic(topicId as LearnTopicId) : null;
      const session: LearnSessionState = {
        ...state.session,
        mode: action.mode,
        selfAssessed: action.mode === "fast",
        diagnosticQuestionIds: action.mode === "guided" && topic !== null
          ? topic.diagnostic.map((question) => question.id)
          : state.session.diagnosticQuestionIds,
        updatedAt: action.at,
      };
      // A mode switch re-derives the stage instead of trusting the recorded one.
      const stage = derivedStageFor(session);
      return { ui: { ...state.ui, stage, validation: null, diagnosticIndex: 0 }, session };
    }

    case "brief/submit": {
      const candidate: LearnBrief = {
        topicId: state.ui.draftTopicId,
        motivation: state.ui.draftMotivation.trim(),
        minutes: state.ui.draftMinutes,
        selfLevel: state.ui.draftLevel,
      };
      const parsed = learnBriefSchema.safeParse(candidate);
      if (!parsed.success || !isSupportedTopic(parsed.data.topicId)) {
        return withValidation(state, "brief_incomplete");
      }
      const topic = getLearnTopic(parsed.data.topicId as LearnTopicId);
      const session: LearnSessionState = {
        ...state.session,
        brief: parsed.data,
        selfAssessed: state.session.mode === "fast",
        diagnosticQuestionIds: state.session.mode === "guided" ? topic.diagnostic.map((question) => question.id) : [],
        diagnosticAnswers: [],
        updatedAt: action.at,
      };
      if (state.session.mode === "fast") {
        // Fast mode skips the diagnostic and builds a self-assessed path, still
        // shown for review before any lesson starts.
        const path = buildLearnPath({
          topicId: parsed.data.topicId as LearnTopicId,
          level: parsed.data.selfLevel,
          minutes: parsed.data.minutes,
          foundationFirst: false,
          selfAssessed: true,
        });
        // Fast mode lands straight on the path review; the quick check still
        // runs after the lesson, so nothing is skipped silently.
        return {
          ui: { ...state.ui, stage: "lrn_path_review", validation: null },
          session: {
            ...session,
            path,
            currentModuleId: nextLearnModule(path)?.id ?? null,
            progress: computeLearnProgress(path, {}),
            updatedAt: action.at,
          },
        };
      }
      return { ui: { ...state.ui, stage: "lrn_diagnostic", diagnosticIndex: 0, validation: null }, session };
    }

    case "diagnostic/answer": {
      const answers = [
        ...state.session.diagnosticAnswers.filter((answer) => answer.questionId !== action.questionId),
        { questionId: action.questionId, choiceId: action.choiceId, skipped: action.skipped, answeredAt: action.at },
      ];
      return updateSession(state, { ...state.session, diagnosticAnswers: answers }, action.at);
    }

    case "diagnostic/next": {
      const total = state.session.diagnosticQuestionIds.length;
      const next = Math.min(state.ui.diagnosticIndex + 1, Math.max(total - 1, 0));
      return { ...state, ui: { ...state.ui, diagnosticIndex: next } };
    }

    case "diagnostic/back":
      return { ...state, ui: { ...state.ui, diagnosticIndex: Math.max(state.ui.diagnosticIndex - 1, 0) } };

    case "path/build": {
      const topicId = state.session.brief?.topicId;
      if (topicId === undefined || !isSupportedTopic(topicId)) {
        return withValidation(state, "path_missing");
      }
      const covered = new Set(state.session.diagnosticAnswers.map((answer) => answer.questionId));
      if (state.session.mode === "guided" && state.session.diagnosticQuestionIds.length === 0) {
        return withValidation(state, "diagnostic_incomplete");
      }
      if (state.session.mode === "guided" && covered.size < state.session.diagnosticQuestionIds.length) {
        return withValidation(state, "diagnostic_incomplete");
      }
      const topic = getLearnTopic(topicId as LearnTopicId);
      const scored = scoreLearnedLevel(state.session.diagnosticAnswers, topic.diagnostic);
      const foundationFirst = scored.skipped > 0 || scored.unknown > 0;
      const path = buildLearnPath({
        topicId: topicId as LearnTopicId,
        level: scored.level,
        minutes: state.session.brief?.minutes ?? 15,
        foundationFirst,
        selfAssessed: state.session.mode === "fast",
      });
      // The plan is shown for review before any lesson starts (U2-LRN-004).
      return {
        ui: { ...state.ui, stage: "lrn_path_review", validation: null },
        session: {
          ...state.session,
          path,
          currentModuleId: nextLearnModule(path)?.id ?? null,
          lessonEngaged: false,
          feedback: null,
          progress: computeLearnProgress(path, {}),
          updatedAt: action.at,
        },
      };
    }

    case "path/confirm": {
      const path = state.session.path;
      if (path === null) {
        return withValidation(state, "path_missing");
      }
      return {
        ui: { ...state.ui, stage: "lrn_lesson", validation: null },
        session: {
          ...state.session,
          currentModuleId: nextLearnModule(path)?.id ?? null,
          lessonEngaged: false,
          feedback: null,
          updatedAt: action.at,
        },
      };
    }

    case "path/move":
    case "path/skip":
    case "path/restore": {
      const path = state.session.path;
      if (path === null) {
        return withValidation(state, "path_missing");
      }
      const next = action.type === "path/move"
        ? reorderLearnModule(path, action.moduleId, action.direction)
        : action.type === "path/skip"
          ? skipLearnModule(path, action.moduleId, action.reasonKey)
          : restoreLearnModule(path, action.moduleId);
      return updateSession(
        state,
        { ...state.session, path: next, currentModuleId: currentModuleId({ ...state.session, path: next }) },
        action.at,
      );
    }

    case "lesson/engage":
      return updateSession(
        state,
        { ...state.session, lessonEngaged: true, currentModuleId: currentModuleId(state.session) },
        action.at,
      );

    case "lesson/continue": {
      // The check opens only after a real lesson interaction; a passive scroll
      // is not engagement.
      if (!state.session.lessonEngaged) {
        return withValidation(state, "lesson_not_engaged");
      }
      return {
        ui: { ...state.ui, stage: "lrn_check", selectedChoiceId: null, answerText: "", hintLevel: 0, usedHint: false, validation: null },
        session: { ...state.session, updatedAt: action.at },
      };
    }

    case "check/select":
      return { ...state, ui: { ...state.ui, selectedChoiceId: action.choiceId, answerText: "", validation: null } };
    case "check/text":
      return { ...state, ui: { ...state.ui, answerText: action.value, selectedChoiceId: null, validation: null } };
    case "check/hint": {
      const nextLevel = nextLearnHintLevel(state.ui.hintLevel);
      return { ...state, ui: { ...state.ui, hintLevel: nextLevel, usedHint: true } };
    }

    case "check/submit":
    case "check/skip": {
      const session = state.session;
      const path = session.path;
      const moduleId = session.currentModuleId ?? currentModuleId(session);
      if (path === null || moduleId === null) {
        return withValidation(state, "path_missing");
      }
      if (!session.lessonEngaged) {
        return withValidation(state, "lesson_not_engaged");
      }
      const pathModule = path.modules.find((candidate) => candidate.id === moduleId);
      if (pathModule === undefined) {
        return withValidation(state, "path_missing");
      }
      const topicId = session.brief?.topicId;
      const topic = topicId !== undefined && isSupportedTopic(topicId) ? getLearnTopic(topicId as LearnTopicId) : null;
      // The check itself is the source of truth for the module's answer key.
      const source = topic?.modules.find((candidate) => candidate.id === moduleId)
        ?? topic?.denseOnlyModules.find((candidate) => candidate.id === moduleId)
        ?? null;
      if (source === null) {
        return withValidation(state, "path_missing");
      }

      const answer: LearnCheckAnswer = action.type === "check/skip"
        ? { kind: "skipped" }
        : state.ui.selectedChoiceId !== null
          ? { kind: "choice", choiceId: state.ui.selectedChoiceId }
          : state.ui.answerText.trim().length > 0
            ? { kind: "text", value: state.ui.answerText }
            : { kind: "skipped" };

      if (action.type === "check/submit" && answer.kind === "skipped") {
        return withValidation(state, "check_incomplete");
      }

      const outcome = evaluateLearnCheck(source.check, answer);
      const attempts = appendLearnAttempt(session.attempts, {
        moduleId,
        outcome,
        chosenChoiceId: action.type === "check/skip" ? null : state.ui.selectedChoiceId,
        usedHint: state.ui.usedHint,
        at: action.at,
      });
      const feedback = describeLearnFeedback({ moduleId, outcome, check: source.check, attempts });
      const hints = session.hints.some((hint) => hint.moduleId === moduleId)
        ? session.hints.map((hint) => (hint.moduleId === moduleId ? { ...hint, level: state.ui.hintLevel } : hint))
        : [...session.hints, { moduleId, level: state.ui.hintLevel }];

      return {
        ui: { ...state.ui, stage: "lrn_feedback", validation: null },
        session: {
          ...session,
          attempts,
          hints,
          feedback,
          progress: computeLearnProgress(path, { ...bestOutcomesFromAttempts(attempts) }),
          updatedAt: action.at,
        },
      };
    }

    case "feedback/retry": {
      // Retrying keeps the attempt count and the recorded hint level.
      const current = state.session.feedback;
      if (current === null || !current.retryAllowed) {
        return state;
      }
      return {
        ui: { ...state.ui, stage: "lrn_check", selectedChoiceId: null, answerText: "", validation: null },
        session: { ...state.session, feedback: null },
      };
    }

    case "feedback/acknowledge": {
      const session = state.session;
      const path = session.path;
      const feedback = session.feedback;
      if (path === null || feedback === null) {
        return withValidation(state, "path_missing");
      }
      const completedPath = feedback.outcome === "correct" || feedback.outcome === "partially_correct"
        ? completeLearnModule(path, feedback.moduleId)
        : path;
      const progress = computeLearnProgress(completedPath, bestOutcomesFromAttempts(session.attempts));
      const next = nextLearnModule(completedPath);
      const done = isPathComplete(completedPath);
      return {
        ui: {
          ...state.ui,
          stage: done ? "lrn_complete" : "lrn_checkpoint",
          selectedChoiceId: null,
          answerText: "",
          hintLevel: 0,
          usedHint: false,
          validation: null,
        },
        session: {
          ...session,
          path: completedPath,
          progress,
          currentModuleId: next?.id ?? null,
          lessonEngaged: false,
          feedback: null,
          updatedAt: session.updatedAt,
        },
      };
    }

    case "checkpoint/continue": {
      const next = state.session.path === null ? null : nextLearnModule(state.session.path);
      if (next === null) {
        return { ...state, ui: { ...state.ui, stage: "lrn_complete" } };
      }
      return {
        ui: { ...state.ui, stage: "lrn_lesson", selectedChoiceId: null, answerText: "", hintLevel: 0, usedHint: false },
        session: { ...state.session, currentModuleId: next.id, lessonEngaged: false, feedback: null },
      };
    }

    case "checkpoint/save":
    case "session/restored": {
      if (action.type === "session/restored") {
        return { ui: { ...createLearnPreviewState(), stage: stageForSession(action.session) }, session: action.session };
      }
      return state;
    }

    default:
      return state;
  }
}

const supportedTopics = ["spaced_repetition", "http_caching", "rtl_typography"] as const;

export function isSupportedTopic(topicId: string): boolean {
  return (supportedTopics as readonly string[]).includes(topicId);
}

export function learnHintKeyFor(session: LearnSessionState, moduleId: string, level: LearnHintLevel): string | null {
  const topicId = session.brief?.topicId;
  if (topicId === undefined || !isSupportedTopic(topicId)) {
    return null;
  }
  const topic = getLearnTopic(topicId as LearnTopicId);
  const source = topic.modules.find((candidate) => candidate.id === moduleId)
    ?? topic.denseOnlyModules.find((candidate) => candidate.id === moduleId)
    ?? null;
  return source === null ? null : getLearnHintKey(source.check, level);
}
