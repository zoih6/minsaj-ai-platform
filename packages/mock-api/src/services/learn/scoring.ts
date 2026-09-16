import type { LearnDiagnosticAnswer, LearnLevel, LearnPath, LearnPathModule } from "@nasaq/contracts/services";
import { getDenseTopicModules, getLearnTopic, type LearnDiagnosticQuestion, type LearnTopicId, type LearnTopicModule } from "./topics";

/**
 * Deterministic Learn scoring and path rules.
 *
 * The whole model is here, in one file, with no randomness, no clock, and no
 * model call:
 *
 * 1. each diagnostic choice carries a documented weight (0, 1, 2, or -1 for
 *    "I don't know", which counts as 0 and is recorded as unknown);
 * 2. the score is the sum of the selected weights;
 * 3. thresholds: 0–2 beginner, 3–5 intermediate, 6+ advanced;
 * 4. the path keeps topic order, drops modules above the level unless the
 *    budget is 30 minutes, and always keeps at least one module;
 * 5. skipping or not knowing a diagnostic question forces a foundation-first
 *    path instead of guessing upward.
 */

export const learnScoreThresholds = { intermediate: 3, advanced: 6 } as const;

export type LearnDiagnosticScore = {
  readonly score: number;
  readonly level: LearnLevel;
  readonly answered: number;
  readonly skipped: number;
  readonly unknown: number;
  readonly rationaleKeys: readonly string[];
};

export function scoreLearnedLevel(
  answers: readonly LearnDiagnosticAnswer[],
  questions: readonly LearnDiagnosticQuestion[],
): LearnDiagnosticScore {
  const questionById = new Map(questions.map((question) => [question.id, question]));
  let score = 0;
  let answered = 0;
  let skipped = 0;
  let unknown = 0;

  // Sorted by question order so the same answers always produce the same score.
  const ordered = [...answers].sort((left, right) => left.questionId.localeCompare(right.questionId, "en"));

  for (const answer of ordered) {
    const question = questionById.get(answer.questionId);
    if (question === undefined) {
      continue;
    }
    if (answer.skipped) {
      skipped += 1;
      continue;
    }
    const choice = question.choices.find((candidate) => candidate.id === answer.choiceId) ?? null;
    if (choice === null || choice.weight < 0) {
      unknown += 1;
      continue;
    }
    score += choice.weight;
    answered += 1;
  }

  const level: LearnLevel = score >= learnScoreThresholds.advanced
    ? "advanced"
    : score >= learnScoreThresholds.intermediate
      ? "intermediate"
      : "beginner";

  const rationaleKeys: string[] = [`services.learn.rationale.level_${level}`];
  if (skipped > 0) {
    rationaleKeys.push("services.learn.rationale.skipped_questions");
  }
  if (unknown > 0) {
    rationaleKeys.push("services.learn.rationale.unknown_questions");
  }
  if (answered === questions.length && questions.length > 0) {
    rationaleKeys.push("services.learn.rationale.complete_diagnostic");
  }

  return { score, level, answered, skipped, unknown, rationaleKeys };
}

export type LearnPathRequest = {
  readonly topicId: LearnTopicId;
  readonly level: LearnLevel;
  readonly minutes: 5 | 15 | 30;
  /** True when the diagnostic was skipped or answered with "I don't know". */
  readonly foundationFirst: boolean;
  /** Fast mode self-declares a level and says so in the rationale. */
  readonly selfAssessed: boolean;
  /** Dense edge fixture: the bounded 12-module topic variant. */
  readonly dense?: boolean;
};

function toPathModule(source: LearnTopicModule, order: number): LearnPathModule {
  return {
    id: source.id,
    order,
    titleKey: source.titleKey,
    objectiveKey: source.objectiveKey,
    reasonKey: source.reasonKey,
    estimatedMinutes: source.minutes,
    skipped: false,
    skipReasonKey: null,
    completed: false,
  };
}

const levelRank: Record<LearnLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

/** Minutes the wide (30-minute) branch may exceed the nominal budget by. */
export const wideBudgetGraceMinutes = 10;

export function buildLearnPath(request: LearnPathRequest): LearnPath {
  const topic = getLearnTopic(request.topicId);
  const source = request.dense === true ? getDenseTopicModules(request.topicId) : topic.modules;
  const maxRank = levelRank[request.level];
  const rationaleKeys: string[] = [`services.learn.rationale.level_${request.level}`];

  let candidates = source.filter((candidate) => levelRank[candidate.difficulty] <= maxRank);

  if (request.foundationFirst) {
    const foundation = source.filter((candidate) => candidate.difficulty === "beginner");
    if (foundation.length > 0) {
      candidates = foundation;
      rationaleKeys.push("services.learn.rationale.foundation_first");
    }
  }

  // A 30-minute budget is the only case that reaches the advanced tail. The
  // wide budget carries a documented grace so the dense inventory (the shorter
  // 3-minute modules appended after the standard ones) actually fits: without
  // it the branch would expand the candidate list and then trim the tail it was
  // meant to reach.
  let budget = request.minutes;
  if (request.minutes >= 30 && request.level !== "beginner") {
    candidates = [...source];
    budget = request.minutes + wideBudgetGraceMinutes;
    rationaleKeys.push("services.learn.rationale.wide_budget");
  }

  if (candidates.length === 0) {
    candidates = source.slice(0, 1);
    rationaleKeys.push("services.learn.rationale.minimum_path");
  }

  // Minutes budget: keep order, stop before exceeding the budget, always keep one.
  const budgeted: typeof candidates = [];
  let spent = 0;
  for (const candidate of candidates) {
    if (budgeted.length > 0 && spent + candidate.minutes > budget) {
      continue;
    }
    budgeted.push(candidate);
    spent += candidate.minutes;
  }
  if (budgeted.length < candidates.length) {
    rationaleKeys.push("services.learn.rationale.trimmed_to_budget");
  }
  if (request.selfAssessed) {
    rationaleKeys.push("services.learn.rationale.self_assessed");
  }

  return {
    topicId: request.topicId,
    level: request.level,
    modules: budgeted.map((candidate, order) => toPathModule(candidate, order)),
    rationaleKeys,
    revisedByUser: false,
  };
}

/** Pure reorder; answers, attempts, and completion flags are untouched. */
export function reorderLearnModule(path: LearnPath, moduleId: string, direction: "up" | "down"): LearnPath {
  const index = path.modules.findIndex((candidate) => candidate.id === moduleId);
  if (index < 0) {
    return path;
  }
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= path.modules.length) {
    return path;
  }
  const next = [...path.modules];
  const current = next[index];
  const swap = next[target];
  if (current === undefined || swap === undefined) {
    return path;
  }
  next[index] = swap;
  next[target] = current;
  return {
    ...path,
    modules: next.map((candidate, order) => ({ ...candidate, order })),
    revisedByUser: true,
    rationaleKeys: appendUnique(path.rationaleKeys, "services.learn.rationale.reordered_by_user"),
  };
}

export function skipLearnModule(path: LearnPath, moduleId: string, reasonKey: string): LearnPath {
  return {
    ...path,
    modules: path.modules.map((candidate) =>
      candidate.id === moduleId ? { ...candidate, skipped: true, skipReasonKey: reasonKey } : candidate,
    ),
    revisedByUser: true,
    rationaleKeys: appendUnique(path.rationaleKeys, "services.learn.rationale.skipped_by_user"),
  };
}

export function restoreLearnModule(path: LearnPath, moduleId: string): LearnPath {
  return {
    ...path,
    modules: path.modules.map((candidate) =>
      candidate.id === moduleId ? { ...candidate, skipped: false, skipReasonKey: null } : candidate,
    ),
    revisedByUser: true,
  };
}

export function completeLearnModule(path: LearnPath, moduleId: string): LearnPath {
  return {
    ...path,
    modules: path.modules.map((candidate) =>
      candidate.id === moduleId ? { ...candidate, completed: true } : candidate,
    ),
  };
}

/** First module that is neither completed nor skipped, in path order. */
export function nextLearnModule(path: LearnPath): LearnPathModule | null {
  const ordered = [...path.modules].sort((left, right) => left.order - right.order);
  return ordered.find((candidate) => !candidate.completed && !candidate.skipped) ?? null;
}

export function appendUnique(keys: readonly string[], key: string): string[] {
  return keys.includes(key) ? [...keys] : [...keys, key];
}

export function isPathComplete(path: LearnPath): boolean {
  return path.modules.every((candidate) => candidate.completed || candidate.skipped);
}

export function pathMinutes(path: LearnPath): number {
  return path.modules.reduce((total, candidate) => total + (candidate.skipped ? 0 : candidate.estimatedMinutes), 0);
}
