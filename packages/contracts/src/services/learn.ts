import { z } from "zod";
import { localeSchema } from "../index";
import { serviceLabelSchema, serviceUserTextSchema } from "./text";

/**
 * Learn slice contracts — U2.1.
 *
 * These shapes describe one learning session: brief, diagnostic answers, the
 * reviewable path, lesson interaction, check attempts, feedback, and progress.
 * They are deterministic simulation data, not an adaptive or assessed model:
 * every score here comes from a documented local rule in
 * `@nasaq/mock-api/services` and nothing is sent anywhere.
 *
 * Ownership rules stay identical to the foundation: `Service*` names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable question, module, option, or topic identity inside a fixture. */
export const learnKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

/** Learning level used by the path builder. */
export const learnLevelSchema = z.enum(["beginner", "intermediate", "advanced"]);

export const learnDiagnosticChoiceSchema = z.object({
  id: learnKeySchema,
  /** i18n key under `services.learn.diagnostic.choices.*`. */
  labelKey: serviceLabelSchema,
  /** Documented weight used by the local scorer; -1 is "not yet". */
  weight: z.number().int().min(-1).max(2),
});

export const learnDiagnosticQuestionSchema = z.object({
  id: learnKeySchema,
  promptKey: serviceLabelSchema,
  choices: z.array(learnDiagnosticChoiceSchema).min(2).max(4),
});

export const learnDiagnosticAnswerSchema = z.object({
  questionId: learnKeySchema,
  /** `null` when the person answered "I don't know", which is not wrong. */
  choiceId: learnKeySchema.nullable(),
  /** Explicit skip is recorded so the path can say why it is short. */
  skipped: z.boolean(),
  answeredAt: z.string().min(20).max(40),
});

export const learnBriefSchema = z.object({
  topicId: learnKeySchema,
  motivation: serviceUserTextSchema,
  minutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  /** Self-declared level; Guided prefers the diagnostic, Fast trusts this. */
  selfLevel: learnLevelSchema,
});

export const learnPathModuleSchema = z.object({
  id: learnKeySchema,
  order: z.number().int().nonnegative().max(11),
  titleKey: serviceLabelSchema,
  objectiveKey: serviceLabelSchema,
  /** Why this module sits here, so the order is explainable. */
  reasonKey: serviceLabelSchema,
  estimatedMinutes: z.number().int().positive().max(30),
  /** Skipped modules keep their identity and reason; they are never lost. */
  skipped: z.boolean(),
  skipReasonKey: serviceLabelSchema.nullable(),
  completed: z.boolean(),
});

export const learnPathSchema = z.object({
  topicId: learnKeySchema,
  level: learnLevelSchema,
  modules: z.array(learnPathModuleSchema).min(1).max(12),
  /** Keys of the documented rules that produced level and order. */
  rationaleKeys: z.array(serviceLabelSchema).min(1).max(6),
  revisedByUser: z.boolean(),
});

export const learnCheckOutcomeSchema = z.enum(["correct", "partially_correct", "wrong", "skipped"]);

export const learnCheckAttemptSchema = z.object({
  attempt: z.number().int().positive().max(10),
  /** Which module this attempt belongs to, so progress is derivable. */
  moduleId: learnKeySchema,
  outcome: learnCheckOutcomeSchema,
  /** Recorded so the receipt can show what the check actually compared. */
  chosenChoiceId: learnKeySchema.nullable(),
  usedHint: z.boolean(),
  at: z.string().min(20).max(40),
});

export const learnFeedbackSchema = z.object({
  moduleId: learnKeySchema,
  outcome: learnCheckOutcomeSchema,
  explanationKey: serviceLabelSchema,
  counterExampleKey: serviceLabelSchema,
  nextStepKey: serviceLabelSchema,
  retryAllowed: z.boolean(),
});

export const learnProgressSchema = z.object({
  completedModules: z.number().int().nonnegative().max(12),
  /**
   * Planned module count. `0` is meaningful and honest: it means no path has
   * been built yet (fresh brief, unsupported topic), so the surface must not
   * render a percentage instead of claiming progress it cannot support.
   */
  totalModules: z.number().int().nonnegative().max(12),
  /** Local rule output, never an "AI score". */
  confidence: z.enum(["low", "medium", "high"]),
  needsReview: z.boolean(),
});

export const learnHintStateSchema = z.object({
  moduleId: learnKeySchema,
  /** 0 = none used, 1 = orientation, 2 = narrowing; never the answer. */
  level: z.number().int().min(0).max(2),
});

/** The eight guided stages; recorded so a resume lands where the learner was. */
export const learnStageKeySchema = z.enum([
  "lrn_brief",
  "lrn_diagnostic",
  "lrn_path_review",
  "lrn_lesson",
  "lrn_check",
  "lrn_feedback",
  "lrn_checkpoint",
  "lrn_complete",
]);
export type LearnStageKey = z.infer<typeof learnStageKeySchema>;

export const learnSessionStateSchema = z.object({
  serviceId: z.literal("learn"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  brief: learnBriefSchema.nullable(),
  diagnosticAnswers: z.array(learnDiagnosticAnswerSchema).max(5),
  /** Questions the fixture holds for this topic, so resume can re-render. */
  diagnosticQuestionIds: z.array(learnKeySchema).max(5),
  path: learnPathSchema.nullable(),
  currentModuleId: learnKeySchema.nullable(),
  lessonEngaged: z.boolean(),
  attempts: z.array(learnCheckAttemptSchema).max(10),
  hints: z.array(learnHintStateSchema).max(12),
  feedback: learnFeedbackSchema.nullable(),
  progress: learnProgressSchema,
  /** Fast mode states its own limitation instead of implying diagnosis. */
  selfAssessed: z.boolean(),
  /**
   * Where the learner actually was. `null` means "derive it from recorded
   * state"; a stored value is trusted only when it is consistent with that
   * state, so a hand-edited snapshot cannot fake a stage.
   */
  resumeStageKey: learnStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type LearnSessionState = z.infer<typeof learnSessionStateSchema>;
export type LearnBrief = z.infer<typeof learnBriefSchema>;
export type LearnPath = z.infer<typeof learnPathSchema>;
export type LearnPathModule = z.infer<typeof learnPathModuleSchema>;
export type LearnDiagnosticAnswer = z.infer<typeof learnDiagnosticAnswerSchema>;
export type LearnCheckAttempt = z.infer<typeof learnCheckAttemptSchema>;
export type LearnCheckOutcome = z.infer<typeof learnCheckOutcomeSchema>;
export type LearnFeedback = z.infer<typeof learnFeedbackSchema>;
export type LearnProgress = z.infer<typeof learnProgressSchema>;
export type LearnLevel = z.infer<typeof learnLevelSchema>;
export type LearnMode = z.infer<typeof learnSessionStateSchema>["mode"];

/** Guard used by the workbench store before it hands a block back to Learn. */
export function isLearnSessionState(value: unknown): value is LearnSessionState {
  return learnSessionStateSchema.safeParse(value).success;
}
