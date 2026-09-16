import type {
  LearnCheckAttempt,
  LearnCheckOutcome,
  LearnFeedback,
  LearnPath,
  LearnProgress,
} from "@nasaq/contracts/services";

import type { LearnTopicModule } from "./topics";

/**
 * Deterministic Learn checks, hints, feedback, and progress.
 *
 * Everything is a documented local rule:
 * - an exact choice match on `correctChoiceId` is correct; a match on one of the
 *   documented `partialChoiceIds` is partially correct; anything else is wrong;
 * - a written answer is accepted when its normalized form equals a listed
 *   accepted answer, and is partially correct when at least half of its tokens
 *   appear in one accepted answer;
 * - the hint ladder has exactly two levels and never returns the answer;
 * - retrying appends an attempt instead of replacing it, so the count is kept;
 * - progress and confidence derive from recorded outcomes only.
 */

export type LearnCheckAnswer =
  | { readonly kind: "choice"; readonly choiceId: string }
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "skipped" };

export const learnMaxAttempts = 3;

export function normalizeLearnText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u064B-\u0652\u0640]/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function evaluateLearnCheck(check: LearnTopicModule["check"], answer: LearnCheckAnswer): LearnCheckOutcome {
  if (answer.kind === "skipped") {
    return "skipped";
  }
  if (answer.kind === "choice") {
    if (answer.choiceId === check.correctChoiceId) {
      return "correct";
    }
    return check.partialChoiceIds.includes(answer.choiceId) ? "partially_correct" : "wrong";
  }

  const normalized = normalizeLearnText(answer.value);
  if (normalized.length === 0) {
    return "skipped";
  }
  const accepted = check.acceptedTextAnswers.map(normalizeLearnText);
  if (accepted.includes(normalized)) {
    return "correct";
  }
  const ok = accepted.some((candidate) => {
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length === 0) {
      return false;
    }
    const hits = tokens.filter((token) => candidate.includes(token)).length;
    return hits / tokens.length >= 0.5;
  });
  return ok ? "partially_correct" : "wrong";
}

export type LearnHintLevel = 0 | 1 | 2;

export function nextLearnHintLevel(current: LearnHintLevel): LearnHintLevel {
  return current >= 2 ? 2 : ((current + 1) as LearnHintLevel);
}

/**
 * Hint text key for a level. Levels 1 and 2 are orientation and narrowing; the
 * answer itself is never returned, which the unit test asserts structurally.
 */
export function getLearnHintKey(check: LearnTopicModule["check"], level: LearnHintLevel): string | null {
  if (level <= 0) {
    return null;
  }
  const hintKey = level === 1 ? check.hintKeys[0] : check.hintKeys[1];
  const answerLabelKey = check.choices.find((choice) => choice.id === check.correctChoiceId)?.labelKey ?? null;
  if (answerLabelKey !== null && hintKey === answerLabelKey) {
    return null;
  }
  return hintKey;
}

export function appendLearnAttempt(
  attempts: readonly LearnCheckAttempt[],
  input: { moduleId: string; outcome: LearnCheckOutcome; chosenChoiceId: string | null; usedHint: boolean; at: string },
): LearnCheckAttempt[] {
  const attempt: LearnCheckAttempt = {
    attempt: attempts.length + 1,
    moduleId: input.moduleId,
    outcome: input.outcome,
    chosenChoiceId: input.chosenChoiceId,
    usedHint: input.usedHint,
    at: input.at,
  };
  return [...attempts, attempt];
}

export function describeLearnFeedback(input: {
  moduleId: string;
  outcome: LearnCheckOutcome;
  check: LearnTopicModule["check"];
  attempts: readonly LearnCheckAttempt[];
}): LearnFeedback {
  const { moduleId, outcome, check, attempts } = input;
  const explanationKey = outcome === "correct" ? check.explanationKey : `${check.explanationKey}`;
  const nextStepKey = outcome === "correct"
    ? "services.learn.feedback.next_continue"
    : outcome === "skipped"
      ? "services.learn.feedback.next_resume_later"
      : "services.learn.feedback.next_retry";
  return {
    moduleId,
    outcome,
    explanationKey,
    counterExampleKey: check.counterExampleKey,
    nextStepKey,
    retryAllowed: outcome !== "correct" && attempts.length < learnMaxAttempts,
  };
}

export function computeLearnProgress(path: LearnPath, outcomesByModule: Readonly<Record<string, LearnCheckOutcome>>): LearnProgress {
  const modules = path.modules.filter((candidate) => !candidate.skipped);
  const completedModules = modules.filter((candidate) => candidate.completed).length;
  const outcomes = modules
    .map((candidate) => outcomesByModule[candidate.id])
    .filter((outcome): outcome is LearnCheckOutcome => outcome !== undefined);

  const wrong = outcomes.filter((outcome) => outcome === "wrong").length;
  const skippedChecks = outcomes.filter((outcome) => outcome === "skipped").length;
  const partial = outcomes.filter((outcome) => outcome === "partially_correct").length;
  const skippedModules = path.modules.filter((candidate) => candidate.skipped).length;

  const confidence: LearnProgress["confidence"] = wrong + skippedChecks === 0 && partial === 0
    ? "high"
    : wrong > 0 || skippedChecks > 0 || skippedModules > 0
      ? "low"
      : "medium";

  // A skipped check is not progress: the learner asked to move on, so the path
  // stays honest and flags the module for review.
  const needsReview = skippedModules > 0 || wrong > 0 || skippedChecks > 0;

  return {
    completedModules,
    totalModules: path.modules.length,
    confidence,
    needsReview,
  };
}

export function describeLearnProgressText(progress: LearnProgress): { completed: number; total: number } {
  return { completed: progress.completedModules, total: progress.totalModules };
}

/** Latest recorded outcome per module, derived from the attempt log only. */
export function outcomesFromAttempts(attempts: readonly LearnCheckAttempt[]): Record<string, LearnCheckOutcome> {
  const map: Record<string, LearnCheckOutcome> = {};
  for (const attempt of attempts) {
    map[attempt.moduleId] = attempt.outcome;
  }
  return map;
}

/** Best outcome per module, used when a retry later succeeds. */
export function bestOutcomesFromAttempts(attempts: readonly LearnCheckAttempt[]): Record<string, LearnCheckOutcome> {
  const rank: Record<LearnCheckOutcome, number> = { correct: 0, partially_correct: 1, wrong: 2, skipped: 3 };
  const map: Record<string, LearnCheckOutcome> = {};
  for (const attempt of attempts) {
    const current = map[attempt.moduleId];
    if (current === undefined || rank[attempt.outcome] < rank[current]) {
      map[attempt.moduleId] = attempt.outcome;
    }
  }
  return map;
}
