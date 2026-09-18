import type { LearnLevel, LearnCheckOutcome } from "@minsaj/contracts/services";

/**
 * Learn topic fixtures — U2.1.
 *
 * Structure and numeric weights live here; every human-readable string is an
 * i18n key resolved by `@minsaj/i18n/services`. Nothing is fetched, generated, or
 * scored by a model: the weights below are the whole scoring model and they are
 * documented in `docs/04-delivery/U2-1-LEARN-VERIFICATION.md`.
 */

export type LearnTopicModule = {
  readonly id: string;
  readonly titleKey: string;
  readonly objectiveKey: string;
  readonly reasonKey: string;
  readonly difficulty: LearnLevel;
  readonly minutes: number;
  /** Lesson surface for this module. */
  readonly lesson: {
    readonly sectionKeys: readonly string[];
    readonly exampleKey: string;
    readonly activePromptKey: string;
    readonly sourceKey: string;
  };
  /** One check per module with a documented hint ladder. */
  readonly check: {
    readonly promptKey: string;
    readonly choices: readonly { readonly id: string; readonly labelKey: string }[];
    readonly correctChoiceId: string;
    readonly partialChoiceIds: readonly string[];
    readonly acceptedTextAnswers: readonly string[];
    readonly hintKeys: readonly [string, string];
    readonly explanationKey: string;
    readonly counterExampleKey: string;
  };
};

export type LearnDiagnosticQuestion = {
  readonly id: string;
  readonly promptKey: string;
  readonly choices: readonly { readonly id: string; readonly labelKey: string; readonly weight: number }[];
};

export type LearnTopic = {
  readonly id: string;
  readonly labelKey: string;
  readonly summaryKey: string;
  /** Modules in the order the topic authors consider foundational. */
  readonly modules: readonly LearnTopicModule[];
  /** Two extra modules used to reach the bounded 12-module dense fixture. */
  readonly denseOnlyModules: readonly LearnTopicModule[];
  readonly diagnostic: readonly LearnDiagnosticQuestion[];
  /** Copy keys for the Fast-mode short explanation. */
  readonly fastIntroKey: string;
  readonly fastQuickCheckModuleId: string;
};

function module(
  id: string,
  difficulty: LearnLevel,
  minutes: number,
  correctIndex = 0,
  partialIndexes: readonly number[] = [1],
): LearnTopicModule {
  const base = `services.learn.content.${id}`;
  const choices = [
    { id: `${id}_a`, labelKey: `${base}.c_a` },
    { id: `${id}_b`, labelKey: `${base}.c_b` },
    { id: `${id}_c`, labelKey: `${base}.c_c` },
  ];
  const correct = choices[correctIndex] ?? choices[0];
  return {
    id,
    titleKey: `${base}.title`,
    objectiveKey: `${base}.objective`,
    reasonKey: `${base}.reason`,
    difficulty,
    minutes,
    lesson: {
      sectionKeys: [`${base}.s1`, `${base}.s2`],
      exampleKey: `${base}.example`,
      activePromptKey: `${base}.active`,
      sourceKey: `${base}.source`,
    },
    check: {
      promptKey: `${base}.check`,
      choices,
      correctChoiceId: correct?.id ?? `${id}_a`,
      partialChoiceIds: partialIndexes.map((index) => choices[index]?.id ?? "").filter(Boolean),
      acceptedTextAnswers: [id.replace(/_/gu, " ")],
      hintKeys: [`${base}.hint1`, `${base}.hint2`],
      explanationKey: `${base}.explain`,
      counterExampleKey: `${base}.counter`,
    },
  };
}

const m1 = module("sr_why_gaps", "beginner", 5);
const m2 = module("sr_first_interval", "beginner", 5);
const m3 = module("sr_recall_vs_review", "intermediate", 5, 0, [1]);
const m4 = module("sr_lapses", "intermediate", 5);
const m5 = module("sr_planning", "advanced", 5);
const m6 = module("sr_measure", "advanced", 5);

const d1 = module("sr_tooling", "intermediate", 3);
const d2 = module("sr_sleep", "advanced", 3);

const http1 = module("hc_cache_control", "beginner", 5);
const http2 = module("hc_validators", "intermediate", 5);
const http3 = module("hc_stale_while_revalidate", "advanced", 5);

const rtl1 = module("rtl_direction_source", "beginner", 5);
const rtl2 = module("rtl_mixed_tokens", "intermediate", 5);
const rtl3 = module("rtl_numbers", "advanced", 5);

function question(id: string, weights: readonly number[]): LearnDiagnosticQuestion {
  const base = `services.learn.diagnostic.${id}`;
  return {
    id,
    promptKey: `${base}.prompt`,
    choices: weights.map((weight, index) => ({
      id: `${id}_${index + 1}`,
      labelKey: `${base}.c${index + 1}`,
      weight,
    })),
  };
}

export const learnTopics = {
  spaced_repetition: {
    id: "spaced_repetition",
    labelKey: "services.learn.topics.spaced_repetition",
    summaryKey: "services.learn.topics.spaced_repetition_summary",
    modules: [m1, m2, m3, m4, m5, m6],
    denseOnlyModules: [d1, d2],
    diagnostic: [
      question("sr_q1", [0, 1, 2]),
      question("sr_q2", [0, 1, 2]),
      question("sr_q3", [-1, 1, 2]),
      question("sr_q4", [0, 1, 2]),
    ],
    fastIntroKey: "services.learn.fast.spaced_repetition",
    fastQuickCheckModuleId: "sr_why_gaps",
  },
  http_caching: {
    id: "http_caching",
    labelKey: "services.learn.topics.http_caching",
    summaryKey: "services.learn.topics.http_caching_summary",
    modules: [http1, http2, http3],
    denseOnlyModules: [],
    diagnostic: [question("hc_q1", [0, 1, 2]), question("hc_q2", [0, 1, 2])],
    fastIntroKey: "services.learn.fast.http_caching",
    fastQuickCheckModuleId: "hc_cache_control",
  },
  rtl_typography: {
    id: "rtl_typography",
    labelKey: "services.learn.topics.rtl_typography",
    summaryKey: "services.learn.topics.rtl_typography_summary",
    modules: [rtl1, rtl2, rtl3],
    denseOnlyModules: [],
    diagnostic: [question("rtl_q1", [0, 1, 2]), question("rtl_q2", [0, 1, 2])],
    fastIntroKey: "services.learn.fast.rtl_typography",
    fastQuickCheckModuleId: "rtl_direction_source",
  },
} as const satisfies Record<string, LearnTopic>;

export const learnTopicIds = ["spaced_repetition", "http_caching", "rtl_typography"] as const;
export type LearnTopicId = (typeof learnTopicIds)[number];

export function isLearnTopicId(value: string): value is LearnTopicId {
  return (learnTopicIds as readonly string[]).includes(value);
}

export function getLearnTopic(topicId: LearnTopicId): LearnTopic {
  return learnTopics[topicId];
}

/** Dense fixture: bounded at the contract maximum of 12 modules. */
export function getDenseTopicModules(topicId: LearnTopicId): readonly LearnTopicModule[] {
  const topic = learnTopics[topicId];
  return [...topic.modules, ...topic.denseOnlyModules].slice(0, 12);
}

/** Documented outcome vocabulary shared by checks, feedback, and progress. */
export const learnOutcomeOrder: Record<LearnCheckOutcome, number> = {
  correct: 0,
  partially_correct: 1,
  wrong: 2,
  skipped: 3,
};
