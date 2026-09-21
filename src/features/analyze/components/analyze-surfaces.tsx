"use client";

import { useEffect } from "react";
import type { Locale, AnalyzeOperation } from "@minsaj/contracts/services";
import { formatServiceNumber, getServiceDictionary } from "@minsaj/i18n/services";
import { analyzeDatasetIds, isAnalyzeDatasetId } from "@minsaj/mock-api/services";
import { ArrowDown, ArrowUp, BarChart3, Check, CircleAlert, Plus, Undo2, X } from "lucide-react";
import type { AnalyzeReducerState } from "../state/analyze-reducer";

/**
 * Analyze stage surfaces — U2.5.
 *
 * One component per stage, composed by the workspace. Every human-readable
 * string resolves through `services.analyze.*`, so no copy lives in JSX; single
 * selects are real `fieldset`/`legend`; the compute log plays back step-by-step
 * and never auto-advances; validation is announced once through `role="alert"`.
 */

type AnalyzeNode = Record<string, unknown>;

/** Resolves a full `services.analyze.*` key inside the nested dictionary. */
export function resolveAnalyzeCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.analyze as unknown as AnalyzeNode;
  const path = key.startsWith("services.analyze.") ? key.slice("services.analyze.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as AnalyzeNode)[part];
  }
  return typeof current === "string" ? current : key;
}

export function datasetLabel(locale: Locale, datasetId: string): string {
  return resolveAnalyzeCopy(locale, `services.analyze.datasets.${datasetId}`);
}

export function operationLabel(locale: Locale, operation: AnalyzeOperation): string {
  const key = operation === "trend" ? "operationTrend" : operation === "average" ? "operationAverage" : "operationCompare";
  return resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
}

export function checkStatusLabel(locale: Locale, status: "pass" | "warn"): string {
  return resolveAnalyzeCopy(locale, `services.analyze.ui.${status === "pass" ? "verifyStatusPass" : "verifyStatusWarn"}`);
}

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

export function AnalyzeModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  return (
    <div className="u2-analyze__modes" role="group" aria-label={ui("modeSwitchLabel")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-analyze-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {candidate === "guided" ? ui("modeGuided") : ui("modeFast")}
          <small>{candidate === "guided" ? ui("modeGuidedHint") : ui("modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function AnalyzeValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-analyze__error" role="alert" data-testid="u2-analyze-validation" data-validation={validationKey}>
      {resolveAnalyzeCopy(locale, `services.analyze.ui.validation_${validationKey}`)}
    </p>
  );
}

export function AnalyzeSourceSurface({
  locale,
  state,
  onDataset,
  onLocalFile,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onDataset: (datasetId: string) => void;
  onLocalFile: (value: string) => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-source" data-stage="ana_source">
      <h2>{ui("sourceTitle")}</h2>
      <p>{ui("sourceIntro")}</p>
      <AnalyzeModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <fieldset className="u2-analyze__field">
        <legend>{ui("sourceDataset")}</legend>
        <select
          value={state.ui.draftDatasetId}
          data-testid="u2-analyze-dataset"
          aria-label={ui("sourceDataset")}
          onChange={(event) => onDataset(event.target.value)}
        >
          {analyzeDatasetIds.map((datasetId) => (
            <option value={datasetId} key={datasetId}>{datasetLabel(locale, datasetId)}</option>
          ))}
        </select>
        <p className="u2-analyze__summary">{resolveAnalyzeCopy(locale, `services.analyze.datasets.${state.ui.draftDatasetId}_summary`)}</p>
      </fieldset>

      <fieldset className="u2-analyze__field">
        <legend>{ui("sourceLocalFile")}</legend>
        <input
          type="text"
          value={state.ui.draftLocalFileName}
          data-testid="u2-analyze-local-file"
          maxLength={80}
          aria-label={ui("sourceLocalFile")}
          onChange={(event) => onLocalFile(event.target.value)}
        />
      </fieldset>

      {state.session.mode === "fast" ? (
        <p className="u2-analyze__note" data-testid="u2-analyze-fast-note">{resolveAnalyzeCopy(locale, "services.analyze.fast.intro")}</p>
      ) : null}

      {state.ui.validation === "source_incomplete" ? <AnalyzeValidationNote locale={locale} validationKey="source_incomplete" /> : null}

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-source-submit" onClick={onSubmit}>
        {ui("sourceSubmit")}
      </button>
    </section>
  );
}

export function AnalyzeProfileSurface({
  locale,
  state,
  onContinue,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const profile = state.session.profile;

  if (profile === null) {
    return (
      <section className="u2-analyze__surface" data-testid="u2-analyze-profile" data-stage="ana_profile">
        <h2>{ui("profileTitle")}</h2>
        <p className="u2-analyze__error" role="alert">{ui("unsupportedDatasetNote")}</p>
      </section>
    );
  }

  const typeLabel = (type: "date" | "number" | "text") =>
    resolveAnalyzeCopy(locale, `services.analyze.ui.${type === "date" ? "profileColumnTypeDate" : type === "number" ? "profileColumnTypeNumber" : "profileColumnTypeText"}`);

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-profile" data-stage="ana_profile" data-rows={profile.rows}>
      <h2>{ui("profileTitle")}</h2>
      <p>{ui("profileIntro")}</p>

      <p className="u2-analyze__progress" data-testid="u2-analyze-profile-rows">
        {ui("profileRows")}: <strong>{formatServiceNumber(locale, profile.rows)}</strong>
      </p>

      <h3>{ui("profileColumns")}</h3>
      <ul className="u2-analyze__columns">
        {profile.columns.map((column) => (
          <li key={column.id} data-testid={`u2-analyze-column-${column.id}`}>
            <strong>{resolveAnalyzeCopy(locale, column.labelKey)}</strong>
            <span className="u2-analyze__column-type">{typeLabel(column.type)}</span>
            {column.missing > 0 ? (
              <span className="u2-analyze__column-missing">
                {ui("profileMissing")}: {formatServiceNumber(locale, column.missing)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <h3>{ui("profileWarnings")}</h3>
      <ul className="u2-analyze__warnings">
        {profile.qualityWarningKeys.map((key) => (
          <li key={key}>
            <CircleAlert size={14} aria-hidden="true" />
            {resolveAnalyzeCopy(locale, key)}
          </li>
        ))}
      </ul>

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-profile-continue" onClick={onContinue}>
        {ui("profileContinue")}
      </button>
    </section>
  );
}

export function AnalyzeQuestionSurface({
  locale,
  state,
  onQuestion,
  onOperation,
  onAssumptionDraft,
  onAssumptionAdd,
  onAssumptionRemove,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onQuestion: (value: string) => void;
  onOperation: (operation: AnalyzeOperation) => void;
  onAssumptionDraft: (value: string) => void;
  onAssumptionAdd: () => void;
  onAssumptionRemove: (index: number) => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const operations: readonly AnalyzeOperation[] = ["trend", "average", "compare"];

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-question" data-stage="ana_question">
      <h2>{ui("questionTitle")}</h2>
      <p>{ui("questionIntro")}</p>
      <AnalyzeModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <fieldset className="u2-analyze__field">
        <legend>{ui("questionText")}</legend>
        <textarea
          value={state.ui.draftQuestion}
          data-testid="u2-analyze-question-input"
          rows={2}
          maxLength={600}
          aria-label={ui("questionText")}
          onChange={(event) => onQuestion(event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-analyze__field">
        <legend>{ui("questionOperation")}</legend>
        <div className="mj-control-bar__group mj-control-bar__group--wrap u2-analyze__chips">
          {operations.map((operation) => (
            <button
              key={operation}
              type="button"
              className="mj-chip"
              aria-pressed={state.ui.draftOperation === operation}
              data-testid={`u2-analyze-operation-${operation}`}
              onClick={() => onOperation(operation)}
            >
              {operationLabel(locale, operation)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-analyze__field">
        <legend>{ui("questionAssumptions")}</legend>
        <ul className="u2-analyze__assumptions">
          {state.ui.draftAssumptions.map((assumption, index) => (
            <li key={`${assumption}-${index}`} data-testid={`u2-analyze-assumption-${index}`}>
              <span>{assumption}</span>
              <button
                type="button"
                aria-label={ui("questionAssumptionRemove")}
                data-testid={`u2-analyze-assumption-remove-${index}`}
                onClick={() => onAssumptionRemove(index)}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="u2-analyze__assumption-input">
          <input
            type="text"
            value={state.ui.assumptionDraft}
            data-testid="u2-analyze-assumption-input"
            maxLength={80}
            aria-label={ui("questionAssumptionAdd")}
            onChange={(event) => onAssumptionDraft(event.target.value)}
          />
          <button
            type="button"
            data-testid="u2-analyze-assumption-add"
            disabled={state.ui.assumptionDraft.trim().length === 0 || state.ui.draftAssumptions.length >= 6}
            onClick={onAssumptionAdd}
          >
            <Plus size={14} aria-hidden="true" />
            {ui("questionAssumptionAdd")}
          </button>
        </div>
      </fieldset>

      {state.ui.validation === "question_incomplete" ? <AnalyzeValidationNote locale={locale} validationKey="question_incomplete" /> : null}

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-question-submit" onClick={onSubmit}>
        {state.session.mode === "fast" ? ui("questionSubmitFast") : ui("questionSubmit")}
      </button>
    </section>
  );
}

export function AnalyzePlanSurface({
  locale,
  state,
  onMove,
  onExclude,
  onRestore,
  onApprove,
  onMode,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onMove: (stepId: string, direction: "up" | "down") => void;
  onExclude: (stepId: string, reasonKey: string) => void;
  onRestore: (stepId: string) => void;
  onApprove: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const plan = state.session.plan;
  const exclusionReasonKeys = ["out_of_scope", "defer_to_next", "not_needed"] as const;

  if (plan === null) {
    return (
      <section className="u2-analyze__surface" data-testid="u2-analyze-plan" data-stage="ana_plan">
        <h2>{ui("planTitle")}</h2>
        <p className="u2-analyze__error" role="alert">{ui("unsupportedDatasetNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-plan" data-stage="ana_plan" data-steps={plan.steps.length}>
      <h2>{ui("planTitle")}</h2>
      <p>{ui("planIntro")}</p>
      <AnalyzeModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <ol className="u2-analyze__steps">
        {plan.steps.map((step, index) => (
          <li key={step.id} data-included={step.included} data-testid={`u2-analyze-step-${step.id}`}>
            <p className="u2-analyze__step-detail">{resolveAnalyzeCopy(locale, step.detailKey)}</p>
            <p className="u2-analyze__step-rationale">{resolveAnalyzeCopy(locale, step.rationaleKey)}</p>
            {step.included ? (
              <div className="u2-analyze__step-actions">
                <span className="u2-analyze__step-index">{index + 1} / {plan.steps.length}</span>
                <button type="button" data-testid={`u2-analyze-move-up-${step.id}`} aria-label={ui("planMoveUp")} disabled={index === 0} onClick={() => onMove(step.id, "up")}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" data-testid={`u2-analyze-move-down-${step.id}`} aria-label={ui("planMoveDown")} disabled={index === plan.steps.length - 1} onClick={() => onMove(step.id, "down")}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <label className="u2-analyze__exclude">
                  <span>{ui("planExclude")}</span>
                  <select
                    aria-label={ui("planExcludeReason")}
                    data-testid={`u2-analyze-exclude-${step.id}`}
                    value=""
                    onChange={(event) => {
                      if (event.target.value !== "") {
                        onExclude(step.id, event.target.value);
                      }
                    }}
                  >
                    <option value="">—</option>
                    {exclusionReasonKeys.map((reasonKey) => (
                      <option value={`services.analyze.exclusions.${reasonKey}`} key={reasonKey}>
                        {resolveAnalyzeCopy(locale, `services.analyze.exclusions.${reasonKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="u2-analyze__step-actions">
                <span className="u2-analyze__excluded-note">
                  {step.exclusionReasonKey === null ? "" : resolveAnalyzeCopy(locale, step.exclusionReasonKey)}
                </span>
                <button type="button" data-testid={`u2-analyze-restore-${step.id}`} onClick={() => onRestore(step.id)}>
                  <Undo2 size={14} aria-hidden="true" />
                  {ui("planRestore")}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      <details className="u2-analyze__rationale">
        <summary>{ui("planRationale")}</summary>
        <ul>
          {plan.rationaleKeys.map((key) => (
            <li key={key}>{resolveAnalyzeCopy(locale, key)}</li>
          ))}
        </ul>
      </details>

      {state.ui.validation === "plan_empty" ? <AnalyzeValidationNote locale={locale} validationKey="plan_empty" /> : null}

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-plan-approve" onClick={onApprove}>
        {ui("planApprove")}
      </button>
    </section>
  );
}

export function AnalyzeComputeSurface({
  locale,
  state,
  onStep,
  onFinish,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onStep: () => void;
  onFinish: () => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const steps = state.session.computeSteps ?? [];

  // The compute log advances one step at a time, driven by the analyst's own
  // click; nothing runs by itself. A timer would violate determinism.
  useEffect(() => {
    void onStep;
    void onFinish;
  }, [onStep, onFinish]);

  const played = state.ui.computeIndex;

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-compute" data-stage="ana_compute" data-steps={steps.length} data-played={played}>
      <h2>{ui("computeTitle")}</h2>
      <p>{ui("computeIntro")}</p>

      <ol className="u2-analyze__log">
        {steps.map((step, index) => (
          <li key={step.id} data-played={index < played} data-current={index === played ? "true" : "false"}>
            <span className="u2-analyze__log-label">{resolveAnalyzeCopy(locale, step.labelKey)}</span>
            {index < played ? <Check size={14} aria-hidden="true" /> : null}
          </li>
        ))}
      </ol>

      {state.ui.computeDone ? (
        <p className="u2-analyze__result" data-testid="u2-analyze-compute-done">{ui("computeDone")}</p>
      ) : null}

      <div className="u2-analyze__actions">
        <button
          type="button"
          data-testid="u2-analyze-compute-step"
          disabled={state.ui.computeDone || steps.length === 0}
          onClick={onStep}
        >
          {steps.length === 0 ? ui("computeDone") : resolveAnalyzeCopy(locale, steps[Math.min(played, steps.length - 1)]?.labelKey ?? "")}
        </button>
        <button
          type="button"
          className="u2-analyze__primary"
          data-testid="u2-analyze-compute-finish"
          disabled={!state.ui.computeDone}
          onClick={onFinish}
        >
          {ui("computeContinue")}
        </button>
      </div>

      {state.ui.validation === "result_missing" ? <AnalyzeValidationNote locale={locale} validationKey="result_missing" /> : null}
    </section>
  );
}

export function AnalyzeResultSurface({
  locale,
  state,
  onContinue,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const result = state.session.result;

  if (result === null) {
    return (
      <section className="u2-analyze__surface" data-testid="u2-analyze-result" data-stage="ana_result">
        <h2>{ui("resultTitle")}</h2>
        <p className="u2-analyze__error" role="alert">{ui("validation_result_missing")}</p>
      </section>
    );
  }

  const maxValue = Math.max(...result.rows.map((row) => (typeof row[1] === "number" ? row[1] : 0)), 1);

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-result" data-stage="ana_result">
      <h2>{ui("resultTitle")}</h2>
      <p>{ui("resultIntro")}</p>

      <dl className="u2-analyze__headline">
        <div>
          <dt>{ui("resultHeadline")}</dt>
          <dd>{formatServiceNumber(locale, result.headlineValue)}</dd>
        </div>
        <div>
          <dt>{ui("resultDelta")}</dt>
          <dd data-direction={result.deltaPercent >= 0 ? "up" : "down"}>
            {result.deltaPercent >= 0 ? "+" : "−"}{formatServiceNumber(locale, Math.abs(result.deltaPercent))}{resolveAnalyzeCopy(locale, "services.analyze.results.unit_percent")}
          </dd>
        </div>
      </dl>

      <h3>{ui("resultChart")}</h3>
      <p className="u2-analyze__chart-caption">{ui("resultChartLabel")}</p>
      <ul className="u2-analyze__chart" data-testid="u2-analyze-chart" role="img" aria-label={ui("resultChartLabel")}>
        {result.rows.map((row, index) => {
          const value = typeof row[1] === "number" ? row[1] : 0;
          const height = Math.max((value / maxValue) * 100, 4);
          return (
            <li key={index} style={{ "--u2-bar": `${height}%` } as React.CSSProperties}>
              <span className="u2-analyze__bar-value">{formatServiceNumber(locale, value)}</span>
              <span className="u2-analyze__bar" />
              <span className="u2-analyze__bar-label">{String(row[0])}</span>
            </li>
          );
        })}
      </ul>

      <table className="u2-analyze__table" data-testid="u2-analyze-table">
        <caption className="u2-analyze__chart-caption">{ui("resultTitle")}</caption>
        <thead>
          <tr>
            {result.columns.map((column, index) => (
              <th key={index} scope="col">{resolveAnalyzeCopy(locale, column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{typeof cell === "number" ? formatServiceNumber(locale, cell) : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="u2-analyze__notes">
        {result.notes.map((key) => (
          <li key={key}>{resolveAnalyzeCopy(locale, key)}</li>
        ))}
      </ul>

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-result-continue" onClick={onContinue}>
        {ui("resultContinue")}
      </button>
    </section>
  );
}

export function AnalyzeVerifySurface({
  locale,
  state,
  onAcknowledge,
  onConfirm,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onAcknowledge: (checkId: string) => void;
  onConfirm: () => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const verification = state.session.verification;

  if (verification === null) {
    return (
      <section className="u2-analyze__surface" data-testid="u2-analyze-verify" data-stage="ana_verify">
        <h2>{ui("verifyTitle")}</h2>
        <p className="u2-analyze__error" role="alert">{ui("validation_result_missing")}</p>
      </section>
    );
  }

  const remaining = verification.checks.filter((check) => !verification.acknowledgedIds.includes(check.id)).length;

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-verify" data-stage="ana_verify" data-remaining={remaining}>
      <h2>{ui("verifyTitle")}</h2>
      <p>{ui("verifyIntro")}</p>
      <p className="u2-analyze__progress" data-testid="u2-analyze-verify-remaining">
        {template(ui("verifyRemaining"), { count: formatServiceNumber(locale, remaining) })}
      </p>

      <ul className="u2-analyze__checks">
        {verification.checks.map((check) => {
          const acknowledged = verification.acknowledgedIds.includes(check.id);
          return (
            <li key={check.id} data-status={check.status} data-acknowledged={acknowledged} data-testid={`u2-analyze-check-${check.id}`}>
              <header>
                <strong>{resolveAnalyzeCopy(locale, check.nameKey)}</strong>
                <span className="u2-analyze__check-status">{checkStatusLabel(locale, check.status)}</span>
              </header>
              <p>{resolveAnalyzeCopy(locale, check.detailKey)}</p>
              <button
                type="button"
                data-testid={`u2-analyze-acknowledge-${check.id}`}
                aria-pressed={acknowledged}
                onClick={() => onAcknowledge(check.id)}
              >
                <Check size={14} aria-hidden="true" />
                {acknowledged ? ui("verifyConfirmed") : ui("verifyAcknowledge")}
              </button>
            </li>
          );
        })}
      </ul>

      {state.ui.validation === "verify_incomplete" ? <AnalyzeValidationNote locale={locale} validationKey="verify_incomplete" /> : null}

      <button type="button" className="u2-analyze__primary" data-testid="u2-analyze-verify-confirm" disabled={remaining > 0} onClick={onConfirm}>
        {ui("verifyConfirm")}
      </button>
    </section>
  );
}

export function AnalyzeCompleteSurface({
  locale,
  state,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  state: AnalyzeReducerState;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  const summary = state.session.summary;

  if (summary === null) {
    return (
      <section className="u2-analyze__surface" data-testid="u2-analyze-complete" data-stage="ana_complete">
        <h2>{ui("completeTitle")}</h2>
        <p className="u2-analyze__error" role="alert">{ui("validation_result_missing")}</p>
      </section>
    );
  }

  return (
    <section className="u2-analyze__surface" data-testid="u2-analyze-complete" data-stage="ana_complete">
      <h2>{ui("completeTitle")}</h2>
      <p>{ui("completeIntro")}</p>

      <dl className="u2-analyze__summary">
        <div><dt>{ui("completeRowsComputed")}</dt><dd>{formatServiceNumber(locale, summary.rowsComputed)}</dd></div>
        <div><dt>{ui("completeAssumptionsListed")}</dt><dd>{formatServiceNumber(locale, summary.assumptionsListed)}</dd></div>
      </dl>

      <p className="u2-analyze__checks-summary">
        {template(ui("completeChecksSummary"), {
          passed: formatServiceNumber(locale, summary.checksPassed),
          warned: formatServiceNumber(locale, summary.checksWarned),
        })}
      </p>

      <p className="u2-analyze__note">{ui("completeBoundary")}</p>

      <div className="u2-analyze__actions">
        <button type="button" data-testid="u2-analyze-save" onClick={onSave}>{ui("completeSave")}</button>
        <button type="button" data-testid="u2-analyze-handoff" onClick={onHandoff}>{ui("completeHandoff")}</button>
      </div>
    </section>
  );
}

/** Exported for the workspace's handoff bundle. */
export function analyzeHandoffSummary(locale: Locale, value: number): string {
  const ui = (key: string) => resolveAnalyzeCopy(locale, `services.analyze.ui.${key}`);
  return template(ui("completeHandoffSummary"), { value: formatServiceNumber(locale, value) });
}

/** Used by the source surface when a restored session holds an unknown dataset. */
export function isKnownDataset(datasetId: string): boolean {
  return isAnalyzeDatasetId(datasetId) && (analyzeDatasetIds as readonly string[]).includes(datasetId);
}

/** Icon re-export keeps the workspace free of lucide imports. */
export { BarChart3 as AnalyzeChartIcon };
