"use client";

import type { LearnLevel, LearnPathModule } from "@nasaq/contracts/services";
import type { Locale } from "@nasaq/contracts/services";
import { formatServiceNumber, getServiceDictionary } from "@nasaq/i18n/services";
import { getLearnTopic, type LearnTopicId } from "@nasaq/mock-api/services";
import { Check, CircleAlert, Lightbulb, ListOrdered, SkipForward, Sparkles } from "lucide-react";
import { learnHintKeyFor, type LearnReducerState } from "../state/learn-reducer";

/**
 * Learn stage surfaces — U2.1.
 *
 * One function per stage, composed by the workspace. Every human-readable
 * string resolves through `services.learn.*`, so no copy lives in JSX; question
 * groups are real `fieldset`/`legend`; nothing auto-advances; feedback is
 * announced once through `aria-live="polite"`.
 */

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

type LearnNode = Record<string, unknown>;

/** Resolves a full `services.learn.*` key inside the nested dictionary. */
export function resolveLearnCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.learn as unknown as LearnNode;
  const path = key.startsWith("services.learn.") ? key.slice("services.learn.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as LearnNode)[part];
  }
  return typeof current === "string" ? current : key;
}

export function topicLabel(locale: Locale, topicId: string): string {
  return resolveLearnCopy(locale, `services.learn.topics.${topicId}`);
}

export function levelLabel(locale: Locale, level: LearnLevel): string {
  const key = level === "advanced" ? "levelAdvanced" : level === "intermediate" ? "levelIntermediate" : "levelBeginner";
  return resolveLearnCopy(locale, `services.learn.ui.${key}`);
}

export function outcomeLabel(locale: Locale, outcome: string): string {
  const key = outcome === "correct"
    ? "feedbackCorrect"
    : outcome === "partially_correct"
      ? "feedbackPartial"
      : outcome === "skipped"
        ? "feedbackSkipped"
        : "feedbackWrong";
  return resolveLearnCopy(locale, `services.learn.ui.${key}`);
}

export function LearnProgressBar({ locale, completed, total }: { locale: Locale; completed: number; total: number }) {
  // No plan yet ⇒ no progress claim.
  if (total <= 0) {
    return null;
  }
  return (
    <p className="u2-learn__progress" data-testid="u2-learn-progress" data-completed={completed} data-total={total}>
      <span className="u2-learn__progress-label">{resolveLearnCopy(locale, "services.learn.ui.progressLabel")}</span>
      <span className="u2-learn__progress-value">
        {template(resolveLearnCopy(locale, "services.learn.ui.progressText"), {
          completed: formatServiceNumber(locale, completed),
          total: formatServiceNumber(locale, total),
        })}
      </span>
    </p>
  );
}

export function LearnValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-learn__error" role="alert" data-testid="u2-learn-validation" data-validation={validationKey}>
      {resolveLearnCopy(locale, `services.learn.ui.${validationKey}`)}
    </p>
  );
}

/**
 * Mode switch, shared by the brief and the plan review.
 *
 * Switching is always available on a stage that already holds answers, and the
 * reducer keeps every recorded answer, so the learner can re-decide late
 * without losing work (U2-LRN-002).
 */
export function LearnModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  return (
    <div className="u2-learn__modes" role="group" aria-label={ui("modeSwitchLabel")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-learn-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {candidate === "guided" ? ui("modeGuided") : ui("modeFast")}
          <small>{candidate === "guided" ? ui("modeGuidedHint") : ui("modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function LearnBriefSurface({
  locale,
  state,
  onTopic,
  onMotivation,
  onMinutes,
  onLevel,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: LearnReducerState;
  onTopic: (topicId: LearnTopicId) => void;
  onMotivation: (value: string) => void;
  onMinutes: (minutes: 5 | 15 | 30) => void;
  onLevel: (level: LearnLevel) => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const topicIds: readonly LearnTopicId[] = ["spaced_repetition", "http_caching", "rtl_typography"];
  const minuteOptions: ReadonlyArray<5 | 15 | 30> = [5, 15, 30];
  const minutesKey: Record<5 | 15 | 30, string> = { 5: "minutes5", 15: "minutes15", 30: "minutes30" };

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-brief" data-stage="lrn_brief">
      <h2>{ui("briefTitle")}</h2>
      <LearnModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />
      {state.session.mode === "fast" ? (
        <p className="u2-learn__note" data-testid="u2-learn-self-assessed">{ui("selfAssessedNote")}</p>
      ) : null}

      <fieldset className="u2-learn__field">
        <legend>{ui("briefTopic")}</legend>
        <select
          value={state.ui.draftTopicId}
          data-testid="u2-learn-topic"
          aria-label={ui("briefTopic")}
          onChange={(event) => onTopic(event.target.value as LearnTopicId)}
        >
          {topicIds.map((topicId) => (
            <option value={topicId} key={topicId}>{topicLabel(locale, topicId)}</option>
          ))}
        </select>
        <p className="u2-learn__summary">{resolveLearnCopy(locale, `services.learn.topics.${state.ui.draftTopicId}_summary`)}</p>
      </fieldset>

      <fieldset className="u2-learn__field">
        <legend>{ui("briefMotivation")}</legend>
        <textarea
          value={state.ui.draftMotivation}
          data-testid="u2-learn-motivation"
          rows={2}
          maxLength={600}
          aria-label={ui("briefMotivation")}
          onChange={(event) => onMotivation(event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-learn__field">
        <legend>{ui("briefMinutes")}</legend>
        <div className="u2-learn__chips">
          {minuteOptions.map((minutes) => (
            <button
              key={minutes}
              type="button"
              aria-pressed={state.ui.draftMinutes === minutes}
              data-testid={`u2-learn-minutes-${minutes}`}
              onClick={() => onMinutes(minutes)}
            >
              {ui(minutesKey[minutes])}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-learn__field">
        <legend>{ui("briefLevel")}</legend>
        <div className="u2-learn__chips">
          {(["beginner", "intermediate", "advanced"] as const).map((level) => (
            <button
              key={level}
              type="button"
              aria-pressed={state.ui.draftLevel === level}
              data-testid={`u2-learn-level-${level}`}
              onClick={() => onLevel(level)}
            >
              {levelLabel(locale, level)}
            </button>
          ))}
        </div>
      </fieldset>

      {state.ui.validation === "brief_incomplete" ? (
        <LearnValidationNote locale={locale} validationKey="brief_incomplete" />
      ) : null}

      <button type="button" className="u2-learn__primary" data-testid="u2-learn-brief-submit" onClick={onSubmit}>
        {state.session.mode === "fast" ? ui("briefStartFast") : ui("briefSubmit")}
      </button>
    </section>
  );
}

export function LearnDiagnosticSurface({
  locale,
  state,
  onAnswer,
  onNext,
  onBack,
  onFinish,
}: {
  locale: Locale;
  state: LearnReducerState;
  onAnswer: (questionId: string, choiceId: string | null) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const topicId = state.session.brief?.topicId;
  const topic = topicId !== undefined && isTopicId(topicId) ? getLearnTopic(topicId) : null;
  const question = topic?.diagnostic[state.ui.diagnosticIndex] ?? null;
  const answers = state.session.diagnosticAnswers;
  const answered = question !== null && answers.some((answer) => answer.questionId === question.id);
  const isLast = topic !== null && state.ui.diagnosticIndex >= topic.diagnostic.length - 1;

  if (question === null || topic === null) {
    return (
      <section className="u2-learn__surface" data-testid="u2-learn-diagnostic" data-stage="lrn_diagnostic">
        <h2>{ui("diagnosticTitle")}</h2>
        <p className="u2-learn__note">{ui("unsupportedTopicNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-diagnostic" data-stage="lrn_diagnostic" data-question={question.id}>
      <h2>{ui("diagnosticTitle")}</h2>
      <p className="u2-learn__progress" data-testid="u2-learn-diagnostic-progress">
        {template(ui("diagnosticProgress"), {
          current: formatServiceNumber(locale, state.ui.diagnosticIndex + 1),
          total: formatServiceNumber(locale, topic.diagnostic.length),
        })}
      </p>
      <fieldset className="u2-learn__field">
        <legend>{resolveLearnCopy(locale, question.promptKey)}</legend>
        {question.choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            aria-pressed={answers.some((answer) => answer.questionId === question.id && answer.choiceId === choice.id)}
            data-testid={`u2-learn-diagnostic-choice-${choice.id}`}
            onClick={() => onAnswer(question.id, choice.id)}
          >
            {resolveLearnCopy(locale, choice.labelKey)}
          </button>
        ))}
        <button
          type="button"
          data-testid="u2-learn-diagnostic-unknown"
          aria-pressed={answers.some((answer) => answer.questionId === question.id && answer.choiceId === null && !answer.skipped)}
          onClick={() => onAnswer(question.id, null)}
        >
          {ui("diagnosticDontKnow")}
        </button>
      </fieldset>
      <div className="u2-learn__actions">
        <button type="button" data-testid="u2-learn-diagnostic-back" onClick={onBack} disabled={state.ui.diagnosticIndex === 0}>
          {ui("diagnosticBack")}
        </button>
        <button type="button" data-testid="u2-learn-diagnostic-next" onClick={onNext} disabled={!answered || isLast}>
          {ui("diagnosticNext")}
        </button>
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-diagnostic-finish" onClick={onFinish}>
          {ui("diagnosticFinish")}
        </button>
      </div>
      {state.ui.validation === "diagnostic_incomplete" ? <LearnValidationNote locale={locale} validationKey="diagnostic_incomplete" /> : null}
    </section>
  );
}

export function LearnPathReviewSurface({
  locale,
  state,
  onMove,
  onSkip,
  onRestore,
  onConfirm,
  onMode,
}: {
  locale: Locale;
  state: LearnReducerState;
  onMove: (moduleId: string, direction: "up" | "down") => void;
  onSkip: (moduleId: string, reasonKey: string) => void;
  onRestore: (moduleId: string) => void;
  onConfirm: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const path = state.session.path;
  const skipReasonKeys = ["out_of_time", "already_know", "not_relevant"] as const;

  if (path === null) {
    return (
      <section className="u2-learn__surface" data-testid="u2-learn-path" data-stage="lrn_path_review">
        <h2>{ui("pathTitle")}</h2>
        <p className="u2-learn__error" role="alert">{ui("unsupportedTopicNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-path" data-stage="lrn_path_review" data-modules={path.modules.length}>
      <h2>{ui("pathTitle")}</h2>
      <LearnModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />
      {state.session.mode === "fast" ? <p className="u2-learn__note" data-testid="u2-learn-self-assessed">{ui("selfAssessedNote")}</p> : null}
      {path.revisedByUser ? <p className="u2-learn__note" data-testid="u2-learn-path-edited">{ui("pathEdited")}</p> : null}
      {path.modules.length >= 8 ? (
        <p className="u2-learn__note" data-testid="u2-learn-path-dense">
          {template(ui("denseNote"), { count: formatServiceNumber(locale, path.modules.length) })}
        </p>
      ) : null}
      <ol className="u2-learn__modules" data-testid="u2-learn-modules">
        {path.modules.map((module: LearnPathModule) => (
          <li key={module.id} data-testid={`u2-learn-module-${module.id}`} data-skipped={module.skipped} data-completed={module.completed}>
            <div>
              <h3>{resolveLearnCopy(locale, `services.learn.content.${module.id}.title`)}</h3>
              <p>{resolveLearnCopy(locale, `services.learn.content.${module.id}.objective`)}</p>
              <p className="u2-learn__reason">
                {module.skipped
                  ? `${ui("pathSkip")}: ${resolveLearnCopy(locale, `services.learn.skipReasons.${module.skipReasonKey ?? ""}`)}`
                  : resolveLearnCopy(locale, module.reasonKey)}
              </p>
              <p className="u2-learn__minutes">{formatServiceNumber(locale, module.estimatedMinutes)}</p>
            </div>
            <div className="u2-learn__module-actions">
              <button
                type="button"
                data-testid={`u2-learn-up-${module.id}`}
                aria-label={`${ui("pathMoveUp")}: ${resolveLearnCopy(locale, `services.learn.content.${module.id}.title`)}`}
                onClick={() => onMove(module.id, "up")}
              >
                ↑
              </button>
              <button
                type="button"
                data-testid={`u2-learn-down-${module.id}`}
                aria-label={`${ui("pathMoveDown")}: ${resolveLearnCopy(locale, `services.learn.content.${module.id}.title`)}`}
                onClick={() => onMove(module.id, "down")}
              >
                ↓
              </button>
              {module.skipped ? (
                <button type="button" data-testid={`u2-learn-restore-${module.id}`} onClick={() => onRestore(module.id)}>
                  {ui("pathRestore")}
                </button>
              ) : (
                <label className="u2-learn__skip">
                  <span>{ui("pathSkip")}</span>
                  <select
                    data-testid={`u2-learn-skip-${module.id}`}
                    defaultValue=""
                    onChange={(event) => {
                      if (event.target.value.length > 0) {
                        onSkip(module.id, event.target.value);
                      }
                    }}
                  >
                    <option value="">{ui("pathSkipReason")}</option>
                    {skipReasonKeys.map((reasonKey) => (
                      <option value={reasonKey} key={reasonKey}>
                        {resolveLearnCopy(locale, `services.learn.skipReasons.${reasonKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </li>
        ))}
      </ol>
      <details className="u2-learn__rationale" data-testid="u2-learn-rationale">
        <summary>{ui("pathRationale")}</summary>
        <ul>
          {path.rationaleKeys.map((key) => (
            <li key={key}>{resolveLearnCopy(locale, key)}</li>
          ))}
        </ul>
      </details>
      <button type="button" className="u2-learn__primary" data-testid="u2-learn-path-confirm" onClick={onConfirm}>
        {ui("pathConfirm")}
      </button>
    </section>
  );
}

export function LearnLessonSurface({
  locale,
  state,
  onEngage,
  onContinue,
}: {
  locale: Locale;
  state: LearnReducerState;
  onEngage: () => void;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const moduleId = state.session.currentModuleId;
  const title = moduleId === null ? "" : resolveLearnCopy(locale, `services.learn.content.${moduleId}.title`);

  if (moduleId === null) {
    return (
      <section className="u2-learn__surface" data-testid="u2-learn-lesson" data-stage="lrn_lesson">
        <h2>{ui("lessonTitle")}</h2>
        <p className="u2-learn__note">{ui("emptyUnsupportedHint")}</p>
      </section>
    );
  }

  const engaged = state.session.lessonEngaged;

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-lesson" data-stage="lrn_lesson" data-module={moduleId}>
      <h2>{title}</h2>
      <p className="u2-learn__objective">
        <strong>{ui("lessonObjective")}:</strong> {resolveLearnCopy(locale, `services.learn.content.${moduleId}.objective`)}
      </p>
      <p>{resolveLearnCopy(locale, `services.learn.content.${moduleId}.s1`)}</p>
      <p>{resolveLearnCopy(locale, `services.learn.content.${moduleId}.s2`)}</p>
      <p className="u2-learn__example">
        <strong>{ui("lessonExample")}:</strong> {resolveLearnCopy(locale, `services.learn.content.${moduleId}.example`)}
      </p>
      <p className="u2-learn__active">
        <strong>{ui("lessonActive")}:</strong> {resolveLearnCopy(locale, `services.learn.content.${moduleId}.active`)}
      </p>
      <p className="u2-learn__source">
        {ui("lessonSource")}: {resolveLearnCopy(locale, `services.learn.content.${moduleId}.source`)}
      </p>
      {engaged ? <p className="u2-learn__note" data-testid="u2-learn-engaged">{ui("lessonEngaged")}</p> : null}
      <div className="u2-learn__actions">
        <button type="button" data-testid="u2-learn-engage" onClick={onEngage} aria-pressed={engaged}>
          <Sparkles size={16} aria-hidden="true" />
          {ui("lessonActive")}
        </button>
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-lesson-continue" onClick={onContinue}>
          {ui("lessonContinue")}
        </button>
      </div>
      {state.ui.validation === "lesson_not_engaged" ? <LearnValidationNote locale={locale} validationKey="lesson_not_engaged" /> : null}
    </section>
  );
}

export function LearnCheckSurface({
  locale,
  state,
  onSelect,
  onText,
  onHint,
  onSubmit,
  onSkip,
}: {
  locale: Locale;
  state: LearnReducerState;
  onSelect: (choiceId: string) => void;
  onText: (value: string) => void;
  onHint: () => void;
  onSubmit: () => void;
  onSkip: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const moduleId = state.session.currentModuleId;
  const topicId = state.session.brief?.topicId;
  const topic = topicId !== undefined && isTopicId(topicId) ? getLearnTopic(topicId) : null;
  const topicModule = moduleId === null
    ? null
    : topic?.modules.find((candidate) => candidate.id === moduleId)
      ?? topic?.denseOnlyModules.find((candidate) => candidate.id === moduleId)
      ?? null;
  const hintKey = moduleId === null ? null : learnHintKeyFor(state.session, moduleId, state.ui.hintLevel);
  const attempts = state.session.attempts.filter((attempt) => attempt.moduleId === moduleId).length;
  const choiceSuffix: Record<string, string> = { a: "c_a", b: "c_b", c: "c_c" };

  if (moduleId === null || topicModule === null) {
    return (
      <section className="u2-learn__surface" data-testid="u2-learn-check" data-stage="lrn_check">
        <h2>{ui("checkTitle")}</h2>
        <p className="u2-learn__note">{ui("emptyUnsupportedHint")}</p>
      </section>
    );
  }

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-check" data-stage="lrn_check" data-module={moduleId}>
      <h2>{ui("checkTitle")}</h2>
      <p className="u2-learn__attempts" data-testid="u2-learn-attempts" data-attempts={attempts}>
        {template(ui("checkAttempts"), { count: formatServiceNumber(locale, attempts + 1) })}
      </p>
      <fieldset className="u2-learn__field">
        <legend>{resolveLearnCopy(locale, `services.learn.content.${moduleId}.check`)}</legend>
        {topicModule.check.choices.map((choice) => {
          const suffix = choice.id.slice(-1);
          const relative = choiceSuffix[suffix] ?? "c_a";
          return (
            <button
              key={choice.id}
              type="button"
              aria-pressed={state.ui.selectedChoiceId === choice.id}
              data-testid={`u2-learn-check-choice-${suffix}`}
              onClick={() => onSelect(choice.id)}
            >
              {resolveLearnCopy(locale, `services.learn.content.${moduleId}.${relative}`)}
            </button>
          );
        })}
      </fieldset>
      <fieldset className="u2-learn__field">
        <legend>{ui("checkTextLabel")}</legend>
        <input
          type="text"
          value={state.ui.answerText}
          data-testid="u2-learn-check-text"
          maxLength={600}
          aria-label={ui("checkTextLabel")}
          onChange={(event) => onText(event.target.value)}
        />
      </fieldset>
      {hintKey !== null ? (
        <p className="u2-learn__hint" data-testid="u2-learn-hint" data-hint-level={state.ui.hintLevel}>
          <Lightbulb size={16} aria-hidden="true" />
          <span>
            {template(ui("checkHintLevel"), { level: formatServiceNumber(locale, state.ui.hintLevel) })}
            {": "}
            {resolveLearnCopy(locale, hintKey)}
          </span>
        </p>
      ) : null}
      <div className="u2-learn__actions">
        <button type="button" data-testid="u2-learn-hint-button" onClick={onHint} disabled={state.ui.hintLevel >= 2}>
          <Lightbulb size={16} aria-hidden="true" />
          {ui("checkHint")}
        </button>
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-check-submit" onClick={onSubmit}>
          <Check size={16} aria-hidden="true" />
          {ui("checkSubmit")}
        </button>
        <button type="button" data-testid="u2-learn-check-skip" onClick={onSkip}>
          <SkipForward size={16} aria-hidden="true" />
          {ui("checkSkip")}
        </button>
      </div>
      {state.ui.validation === "check_incomplete" ? <LearnValidationNote locale={locale} validationKey="check_incomplete" /> : null}
    </section>
  );
}

export function LearnFeedbackSurface({
  locale,
  state,
  onRetry,
  onAcknowledge,
}: {
  locale: Locale;
  state: LearnReducerState;
  onRetry: () => void;
  onAcknowledge: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const feedback = state.session.feedback;

  if (feedback === null) {
    return (
      <section className="u2-learn__surface" data-testid="u2-learn-feedback" data-stage="lrn_feedback">
        <h2>{ui("feedbackTitle")}</h2>
        <p className="u2-learn__note">{ui("checkSkip")}</p>
      </section>
    );
  }

  return (
    <section
      className="u2-learn__surface"
      data-testid="u2-learn-feedback"
      data-stage="lrn_feedback"
      data-outcome={feedback.outcome}
      aria-live="polite"
    >
      <h2>{ui("feedbackTitle")}</h2>
      <p className={`u2-learn__outcome u2-learn__outcome--${feedback.outcome}`} data-testid="u2-learn-outcome">
        {feedback.outcome === "correct" ? <Check size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
        <span>{outcomeLabel(locale, feedback.outcome)}</span>
      </p>
      <p data-testid="u2-learn-explanation">{resolveLearnCopy(locale, `services.learn.content.${feedback.moduleId}.explain`)}</p>
      <p className="u2-learn__counter">
        <strong>{ui("feedbackCounter")}:</strong> {resolveLearnCopy(locale, `services.learn.content.${feedback.moduleId}.counter`)}
      </p>
      <p className="u2-learn__next">{resolveLearnCopy(locale, feedback.nextStepKey)}</p>
      <div className="u2-learn__actions">
        {feedback.retryAllowed ? (
          <button type="button" data-testid="u2-learn-retry" onClick={onRetry}>{ui("feedbackRetry")}</button>
        ) : null}
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-acknowledge" onClick={onAcknowledge}>
          {ui("feedbackAcknowledge")}
        </button>
      </div>
    </section>
  );
}

export function LearnCheckpointSurface({
  locale,
  state,
  onContinue,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  state: LearnReducerState;
  onContinue: () => void;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const progress = state.session.progress;
  const confidence = progress.confidence === "high" ? ui("confidenceHigh") : progress.confidence === "medium" ? ui("confidenceMedium") : ui("confidenceLow");

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-checkpoint" data-stage="lrn_checkpoint" data-confidence={progress.confidence}>
      <h2>{ui("checkpointTitle")}</h2>
      <LearnProgressBar locale={locale} completed={progress.completedModules} total={progress.totalModules} />
      <p data-testid="u2-learn-confidence">
        <strong>{ui("checkpointConfidence")}:</strong> {confidence}
      </p>
      {progress.needsReview ? (
        <p className="u2-learn__note" data-testid="u2-learn-needs-review">{ui("checkpointNeedsReview")}</p>
      ) : null}
      <div className="u2-learn__actions">
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-checkpoint-continue" onClick={onContinue}>
          {ui("checkpointContinue")}
        </button>
        <button type="button" data-testid="u2-learn-checkpoint-save" onClick={onSave}>{ui("checkpointSave")}</button>
        <button type="button" data-testid="u2-learn-handoff" onClick={onHandoff}>
          <ListOrdered size={16} aria-hidden="true" />
          {ui("completeSearch")}
        </button>
      </div>
    </section>
  );
}

export function LearnCompleteSurface({
  locale,
  state,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  state: LearnReducerState;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveLearnCopy(locale, `services.learn.ui.${key}`);
  const progress = state.session.progress;
  const topicId = state.session.brief?.topicId ?? "";

  return (
    <section className="u2-learn__surface" data-testid="u2-learn-complete" data-stage="lrn_complete">
      <h2>{ui("completeTitle")}</h2>
      <p className="u2-learn__note" data-testid="u2-learn-artifact-name">{ui("completeArtifact")}</p>
      <LearnProgressBar locale={locale} completed={progress.completedModules} total={progress.totalModules} />
      <p data-testid="u2-learn-complete-topic">{topicLabel(locale, topicId)}</p>
      <p data-testid="u2-learn-complete-level">{levelLabel(locale, state.session.path?.level ?? "beginner")}</p>
      <div className="u2-learn__actions">
        <button type="button" className="u2-learn__primary" data-testid="u2-learn-save" onClick={onSave}>{ui("checkpointSave")}</button>
        <button type="button" data-testid="u2-learn-handoff-complete" onClick={onHandoff}>{ui("completeSearch")}</button>
      </div>
    </section>
  );
}

function isTopicId(value: string): value is LearnTopicId {
  return value === "spaced_repetition" || value === "http_caching" || value === "rtl_typography";
}
