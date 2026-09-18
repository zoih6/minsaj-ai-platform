import type { LearnCheckOutcome, LearnSessionState } from "@minsaj/contracts/services";
import { learnSessionStateSchema } from "@minsaj/contracts/services";

import { getLearnTopic, type LearnTopicId } from "./topics";
import { buildLearnPath, completeLearnModule, isPathComplete, scoreLearnedLevel, type LearnPathRequest } from "./scoring";
import { appendLearnAttempt, computeLearnProgress, describeLearnFeedback } from "./checks";

/**
 * Learn state presets used by the test adapter and the edge-case fixtures of
 * section 11.5. Presets are built from the same pure rules as the live surface,
 * so a test can never observe a state the real flow cannot reach.
 */

export const learnStatePresets = [
  "fresh",
  "no_progress",
  "unit_complete",
  "path_complete",
  "needs_review",
  "dense_path",
  "rtl_mixed",
  "unsupported_topic",
] as const;
export type LearnStatePreset = (typeof learnStatePresets)[number];

export type LearnPresetInput = {
  readonly locale: "ar" | "en";
  readonly now: string;
  readonly preset: LearnStatePreset;
  readonly topicId?: LearnTopicId;
  readonly mode?: "guided" | "fast";
  readonly minutes?: 5 | 15 | 30;
};

const presetTopic: Record<LearnStatePreset, LearnTopicId> = {
  fresh: "spaced_repetition",
  no_progress: "spaced_repetition",
  unit_complete: "spaced_repetition",
  path_complete: "spaced_repetition",
  needs_review: "spaced_repetition",
  dense_path: "spaced_repetition",
  rtl_mixed: "rtl_typography",
  unsupported_topic: "http_caching",
};

const presetLevel: Record<LearnStatePreset, "beginner" | "intermediate" | "advanced"> = {
  fresh: "beginner",
  no_progress: "beginner",
  unit_complete: "intermediate",
  path_complete: "advanced",
  needs_review: "intermediate",
  dense_path: "advanced",
  rtl_mixed: "beginner",
  unsupported_topic: "beginner",
};

function withStage(state: LearnSessionState): LearnSessionState {
  return { ...state, resumeStageKey: presetStage(state) };
}

/** Derived stage for a preset; keeps the fixture and the live mapping aligned. */
function presetStage(state: Omit<LearnSessionState, "resumeStageKey">): LearnSessionState["resumeStageKey"] {
  if (state.brief === null) return "lrn_brief";
  if (state.mode === "guided" && state.diagnosticAnswers.length === 0) return "lrn_diagnostic";
  if (state.path === null) return state.mode === "guided" ? "lrn_diagnostic" : "lrn_path_review";
  if (state.path.modules.every((module) => module.completed || module.skipped)) return "lrn_complete";
  if (state.feedback !== null) return "lrn_feedback";
  if (state.lessonEngaged) return "lrn_check";
  return "lrn_lesson";
}

export function createLearnStatePreset(input: LearnPresetInput): LearnSessionState {
  const topicId = input.topicId ?? presetTopic[input.preset];
  const mode = input.mode ?? "guided";
  const minutes = input.minutes ?? 15;
  const topic = getLearnTopic(topicId);

  if (input.preset === "fresh") {
    return withStage(learnSessionStateSchema.parse({
      serviceId: "learn",
      stateVersion: 1,
      locale: input.locale,
      mode,
      brief: null,
      diagnosticAnswers: [],
      diagnosticQuestionIds: topic.diagnostic.map((question) => question.id),
      path: null,
      currentModuleId: null,
      lessonEngaged: false,
      attempts: [],
      hints: [],
      feedback: null,
      progress: { completedModules: 0, totalModules: 0, confidence: "low", needsReview: false },
      selfAssessed: mode === "fast",
      updatedAt: input.now,
    }));
  }

  if (input.preset === "unsupported_topic") {
    // An unsupported topic is a first-class empty state, not a crash: the brief
    // exists, the path does not, and the surface offers the starter topics.
    return withStage(learnSessionStateSchema.parse({
      serviceId: "learn",
      stateVersion: 1,
      locale: input.locale,
      mode,
      brief: { topicId: "unsupported", motivation: "services.learn.fixtures.unsupported_motivation", minutes, selfLevel: "beginner" },
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
      updatedAt: input.now,
    }));
  }

  const level = presetLevel[input.preset];
  const foundationFirst = input.preset === "needs_review";
  const request: LearnPathRequest = {
    topicId,
    level,
    minutes,
    foundationFirst,
    selfAssessed: mode === "fast",
    ...(input.preset === "dense_path" ? { dense: true } : {}),
  };
  let path = buildLearnPath(request);

  const diagnosticAnswers = foundationFirst
    ? [
        { questionId: topic.diagnostic[0]?.id ?? "sr_q1", choiceId: null, skipped: false, answeredAt: input.now },
        { questionId: topic.diagnostic[1]?.id ?? "sr_q2", choiceId: null, skipped: true, answeredAt: input.now },
      ]
    : topic.diagnostic.slice(0, 2).map((question, index) => ({
        questionId: question.id,
        choiceId: question.choices[level === "advanced" ? 2 : level === "intermediate" ? 1 : 0]?.id ?? null,
        skipped: false,
        answeredAt: input.now,
      }));

  const scored = scoreLearnedLevel(diagnosticAnswers, topic.diagnostic);
  const outcomesByModule: Record<string, LearnCheckOutcome> = {};
  const attempts: ReturnType<typeof appendLearnAttempt> = [];

  const completedCount = input.preset === "unit_complete"
    ? 1
    : input.preset === "path_complete" || input.preset === "dense_path"
      ? path.modules.length
      : 0;

  path.modules.forEach((candidate, index) => {
    if (index < completedCount) {
      path = completeLearnModule(path, candidate.id);
      const outcome: LearnCheckOutcome = input.preset === "needs_review" && index === 0 ? "wrong" : "correct";
      outcomesByModule[candidate.id] = outcome;
    }
  });

  if (input.preset === "needs_review") {
    path = completeLearnModule(path, path.modules[1]?.id ?? path.modules[0]?.id ?? "sr_first_interval");
    if (path.modules[1] !== undefined) {
      outcomesByModule[path.modules[1].id] = "skipped";
    }
    if (path.modules[2] !== undefined) {
      outcomesByModule[path.modules[2].id] = "partially_correct";
    }
  }

  const firstModule = path.modules[0];
  if (firstModule !== undefined) {
    attempts.push(...appendLearnAttempt([], {
      moduleId: firstModule.id,
      outcome: outcomesByModule[firstModule.id] ?? "correct",
      chosenChoiceId: getLearnTopic(topicId).modules[0]?.check.correctChoiceId ?? null,
      usedHint: input.preset === "needs_review",
      at: input.now,
    }));
  }

  const progress = computeLearnProgress(path, outcomesByModule);
  const currentModuleId = input.preset === "path_complete" || input.preset === "dense_path"
    ? null
    : path.modules.find((candidate) => !candidate.completed)?.id ?? null;

  const feedback = input.preset === "needs_review" && firstModule !== undefined
    ? describeLearnFeedback({
        moduleId: firstModule.id,
        outcome: "wrong",
        check: getLearnTopic(topicId).modules[0]?.check ?? {
          promptKey: "x", choices: [], correctChoiceId: "x", partialChoiceIds: [], acceptedTextAnswers: [],
          hintKeys: ["x", "y"], explanationKey: "x", counterExampleKey: "x",
        },
        attempts,
      })
    : null;

  return withStage(learnSessionStateSchema.parse({
    serviceId: "learn",
    stateVersion: 1,
    locale: input.locale,
    mode,
    brief: { topicId, motivation: "services.learn.fixtures.default_motivation", minutes, selfLevel: level },
    diagnosticAnswers,
    diagnosticQuestionIds: topic.diagnostic.map((question) => question.id),
    path,
    currentModuleId,
    lessonEngaged: completedCount > 0 || input.preset === "no_progress",
    attempts,
    hints: firstModule === undefined ? [] : [{ moduleId: firstModule.id, level: input.preset === "needs_review" ? 1 : 0 }],
    feedback,
    progress,
    selfAssessed: mode === "fast",
    updatedAt: input.now,
    ...(scored.level === level ? {} : {}),
  }));
}

export function isPresetPathComplete(preset: LearnStatePreset, state: LearnSessionState): boolean {
  if (state.path === null) {
    return false;
  }
  if (preset === "path_complete" || preset === "dense_path") {
    return isPathComplete(state.path);
  }
  return false;
}
