"use client";

import type { Locale, CodeDiffHunk, CodePlanStep, CodeTaskType } from "@minsaj/contracts/services";
import { formatServiceNumber, getServiceDictionary } from "@minsaj/i18n/services";
import { isCodeProjectId, codeProjectIds } from "@minsaj/mock-api/services";
import { AlertTriangle, ArrowDown, ArrowUp, Check, CircleAlert, FileCode2, FilePlus2, RotateCcw, ShieldCheck, Undo2 } from "lucide-react";
import type { CodeReducerState } from "../state/code-reducer";

/**
 * Code stage surfaces — U2.4.
 *
 * One component per stage, composed by the workspace. Every human-readable
 * string resolves through `services.code.*`, so no copy lives in JSX; single
 * selects are real `fieldset`/`legend`; nothing auto-advances; validation is
 * announced once through `role="alert"`.
 */

type CodeNode = Record<string, unknown>;

/** Resolves a full `services.code.*` key inside the nested dictionary. */
export function resolveCodeCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.code as unknown as CodeNode;
  const path = key.startsWith("services.code.") ? key.slice("services.code.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as CodeNode)[part];
  }
  return typeof current === "string" ? current : key;
}

export function projectLabel(locale: Locale, projectId: string): string {
  return resolveCodeCopy(locale, `services.code.projects.${projectId}`);
}

export function taskLabel(locale: Locale, taskType: CodeTaskType): string {
  const key = taskType === "build" ? "taskBuild" : taskType === "fix" ? "taskFix" : taskType === "review" ? "taskReview" : "taskLearn";
  return resolveCodeCopy(locale, `services.code.ui.${key}`);
}

export function checkStatusLabel(locale: Locale, status: "pass" | "warn" | "fail"): string {
  const key = status === "pass" ? "checksStatusPass" : status === "warn" ? "checksStatusWarn" : "checksStatusFail";
  return resolveCodeCopy(locale, `services.code.ui.${key}`);
}

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

export function CodeModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  return (
    <div className="u2-code__modes" role="group" aria-label={ui("modeSwitchLabel")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-code-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {candidate === "guided" ? ui("modeGuided") : ui("modeFast")}
          <small>{candidate === "guided" ? ui("modeGuidedHint") : ui("modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function CodeValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-code__error" role="alert" data-testid="u2-code-validation" data-validation={validationKey}>
      {resolveCodeCopy(locale, `services.code.ui.validation_${validationKey}`)}
    </p>
  );
}

export function CodeScopeSurface({
  locale,
  state,
  onProject,
  onTaskType,
  onRequest,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: CodeReducerState;
  onProject: (projectId: string) => void;
  onTaskType: (taskType: CodeTaskType) => void;
  onRequest: (value: string) => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const taskTypes: readonly CodeTaskType[] = ["build", "fix", "review", "learn"];

  return (
    <section className="u2-code__surface" data-testid="u2-code-scope" data-stage="cod_scope">
      <h2>{ui("scopeTitle")}</h2>
      <p>{ui("scopeIntro")}</p>
      <CodeModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <fieldset className="u2-code__field">
        <legend>{ui("scopeProject")}</legend>
        <select
          value={state.ui.draftProjectId}
          data-testid="u2-code-project"
          aria-label={ui("scopeProject")}
          onChange={(event) => onProject(event.target.value)}
        >
          {codeProjectIds.map((projectId) => (
            <option value={projectId} key={projectId}>{projectLabel(locale, projectId)}</option>
          ))}
        </select>
        <p className="u2-code__summary">{resolveCodeCopy(locale, `services.code.projects.${state.ui.draftProjectId}_summary`)}</p>
      </fieldset>

      <fieldset className="u2-code__field">
        <legend>{ui("scopeTask")}</legend>
        <div className="mj-control-bar__group mj-control-bar__group--wrap u2-code__chips">
          {taskTypes.map((taskType) => (
            <button
              key={taskType}
              type="button"
              className="mj-chip"
              aria-pressed={state.ui.draftTaskType === taskType}
              data-testid={`u2-code-task-${taskType}`}
              onClick={() => onTaskType(taskType)}
            >
              {taskLabel(locale, taskType)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-code__field">
        <legend>{ui("scopeRequest")}</legend>
        <textarea
          value={state.ui.draftChangeRequest}
          data-testid="u2-code-request"
          rows={2}
          maxLength={600}
          aria-label={ui("scopeRequest")}
          onChange={(event) => onRequest(event.target.value)}
        />
      </fieldset>

      {state.session.mode === "fast" ? (
        <p className="u2-code__note" data-testid="u2-code-fast-note">{resolveCodeCopy(locale, "services.code.fast.intro")}</p>
      ) : null}

      {state.ui.validation === "scope_incomplete" ? <CodeValidationNote locale={locale} validationKey="scope_incomplete" /> : null}

      <button type="button" className="u2-code__primary" data-testid="u2-code-scope-submit" onClick={onSubmit}>
        {state.session.mode === "fast" ? ui("scopeSubmitFast") : ui("scopeSubmit")}
      </button>
    </section>
  );
}

export function CodePlanSurface({
  locale,
  state,
  onMove,
  onExclude,
  onRestore,
  onApprove,
  onMode,
}: {
  locale: Locale;
  state: CodeReducerState;
  onMove: (stepId: string, direction: "up" | "down") => void;
  onExclude: (stepId: string, reasonKey: string) => void;
  onRestore: (stepId: string) => void;
  onApprove: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const plan = state.session.plan;
  const exclusionReasonKeys = ["out_of_scope", "defer_to_next", "not_needed"] as const;

  if (plan === null) {
    return (
      <section className="u2-code__surface" data-testid="u2-code-plan" data-stage="cod_plan">
        <h2>{ui("planTitle")}</h2>
        <p className="u2-code__error" role="alert">{ui("unsupportedProjectNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-code__surface" data-testid="u2-code-plan" data-stage="cod_plan" data-steps={plan.steps.length}>
      <h2>{ui("planTitle")}</h2>
      <p>{ui("planIntro")}</p>
      <CodeModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <ol className="u2-code__steps">
        {plan.steps.map((step, index) => (
          <li key={step.id} data-included={step.included} data-testid={`u2-code-step-${step.id}`}>
            <div className="u2-code__step-head">
              <code className="u2-code__path">{step.filePath}</code>
              <span className="u2-code__action" data-action={step.action}>{step.action}</span>
            </div>
            <p className="u2-code__step-detail">{resolveCodeCopy(locale, step.detailKey)}</p>
            <p className="u2-code__step-rationale">{resolveCodeCopy(locale, step.rationaleKey)}</p>
            {step.included ? (
              <div className="u2-code__step-actions">
                <span className="u2-code__step-index">{template(ui("planStepOf"), { current: formatServiceNumber(locale, index + 1), total: formatServiceNumber(locale, plan.steps.length) })}</span>
                <button type="button" data-testid={`u2-code-move-up-${step.id}`} aria-label={ui("planMoveUp")} disabled={index === 0} onClick={() => onMove(step.id, "up")}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" data-testid={`u2-code-move-down-${step.id}`} aria-label={ui("planMoveDown")} disabled={index === plan.steps.length - 1} onClick={() => onMove(step.id, "down")}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <label className="u2-code__exclude">
                  <span>{ui("planExclude")}</span>
                  <select
                    aria-label={ui("planExcludeReason")}
                    data-testid={`u2-code-exclude-${step.id}`}
                    value=""
                    onChange={(event) => {
                      if (event.target.value !== "") {
                        onExclude(step.id, event.target.value);
                      }
                    }}
                  >
                    <option value="">—</option>
                    {exclusionReasonKeys.map((reasonKey) => (
                      <option value={`services.code.exclusions.${reasonKey}`} key={reasonKey}>
                        {resolveCodeCopy(locale, `services.code.exclusions.${reasonKey}`)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ) : (
              <div className="u2-code__step-actions">
                <span className="u2-code__excluded-note">
                  {step.exclusionReasonKey === null ? "" : resolveCodeCopy(locale, step.exclusionReasonKey)}
                </span>
                <button type="button" data-testid={`u2-code-restore-${step.id}`} onClick={() => onRestore(step.id)}>
                  <Undo2 size={14} aria-hidden="true" />
                  {ui("planRestore")}
                </button>
              </div>
            )}
          </li>
        ))}
      </ol>

      <details className="u2-code__rationale">
        <summary>{ui("planRationale")}</summary>
        <ul>
          {plan.rationaleKeys.map((key) => (
            <li key={key}>{resolveCodeCopy(locale, key)}</li>
          ))}
        </ul>
      </details>

      {state.ui.validation === "plan_empty" ? <CodeValidationNote locale={locale} validationKey="plan_empty" /> : null}

      <button type="button" className="u2-code__primary" data-testid="u2-code-plan-approve" onClick={onApprove}>
        {ui("planApprove")}
      </button>
    </section>
  );
}

export function CodeProposalSurface({
  locale,
  state,
  onContinue,
}: {
  locale: Locale;
  state: CodeReducerState;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const proposal = state.session.proposal;
  const changeIcon = (change: string) =>
    change === "added" ? <FilePlus2 size={14} aria-hidden="true" /> : change === "deleted" ? <CircleAlert size={14} aria-hidden="true" /> : <FileCode2 size={14} aria-hidden="true" />;

  if (proposal === null) {
    return (
      <section className="u2-code__surface" data-testid="u2-code-proposal" data-stage="cod_proposal">
        <h2>{ui("proposalTitle")}</h2>
        <p className="u2-code__error" role="alert">{ui("unsupportedProjectNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-code__surface" data-testid="u2-code-proposal" data-stage="cod_proposal" data-files={proposal.fileChanges.length}>
      <h2>{ui("proposalTitle")}</h2>
      <p>{ui("proposalIntro")}</p>

      <h3>{ui("proposalFiles")}</h3>
      <ul className="u2-code__files">
        {proposal.fileChanges.map((change) => (
          <li key={change.path} data-change={change.change} data-testid={`u2-code-file-${change.path}`}>
            {changeIcon(change.change)}
            <code className="u2-code__path">{change.path}</code>
            <span className="u2-code__counts">
              <span className="u2-code__additions">+{formatServiceNumber(locale, change.additions)}</span>
              <span className="u2-code__deletions">−{formatServiceNumber(locale, change.deletions)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="u2-code__totals">
        <span>{ui("proposalAdditions")}: <strong>{formatServiceNumber(locale, proposal.fileChanges.reduce((sum, change) => sum + change.additions, 0))}</strong></span>
        <span>{ui("proposalDeletions")}: <strong>{formatServiceNumber(locale, proposal.fileChanges.reduce((sum, change) => sum + change.deletions, 0))}</strong></span>
      </div>

      <h3>{ui("proposalRisks")}</h3>
      <ul className="u2-code__risks">
        {proposal.riskNoteKeys.map((key) => (
          <li key={key} data-testid="u2-code-risk">
            <AlertTriangle size={14} aria-hidden="true" />
            {resolveCodeCopy(locale, key)}
          </li>
        ))}
      </ul>

      {state.session.mode === "fast" ? (
        <p className="u2-code__note">{ui("planFastNote")}</p>
      ) : null}

      <button type="button" className="u2-code__primary" data-testid="u2-code-proposal-continue" onClick={onContinue}>
        {ui("proposalContinue")}
      </button>
    </section>
  );
}

function DiffHunkView({ locale, hunk }: { locale: Locale; hunk: CodeDiffHunk }) {
  void locale;
  return (
    <pre className="u2-code__diff" data-testid="u2-code-diff-hunk">
      <code>
        {hunk.lines.map((line, index) => (
          <span key={index} className="u2-code__diff-line" data-type={line.type} dir="ltr">{line.text}</span>
        ))}
      </code>
    </pre>
  );
}

export function CodeDiffReviewSurface({
  locale,
  state,
  onMarkReviewed,
  onFlag,
  onAcknowledge,
}: {
  locale: Locale;
  state: CodeReducerState;
  onMarkReviewed: (path: string) => void;
  onFlag: (path: string) => void;
  onAcknowledge: () => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const proposal = state.session.proposal;
  const review = state.session.diffReview;
  const noteKey = "services.code.risks.risk_wide_route";

  if (proposal === null || review === null) {
    return (
      <section className="u2-code__surface" data-testid="u2-code-diff" data-stage="cod_diff_review">
        <h2>{ui("diffTitle")}</h2>
        <p className="u2-code__error" role="alert">{ui("unsupportedProjectNote")}</p>
      </section>
    );
  }

  const remaining = proposal.fileChanges.filter((change) => !review.reviewedPaths.includes(change.path)).length;

  return (
    <section className="u2-code__surface" data-testid="u2-code-diff" data-stage="cod_diff_review" data-remaining={remaining}>
      <h2>{ui("diffTitle")}</h2>
      <p>{ui("diffIntro")}</p>
      <p className="u2-code__progress" data-testid="u2-code-diff-remaining">
        {template(ui("diffRemaining"), { count: formatServiceNumber(locale, remaining) })}
      </p>

      {proposal.fileChanges.map((change) => {
        const reviewed = review.reviewedPaths.includes(change.path);
        const flagged = review.flaggedPaths.some((entry) => entry.path === change.path);
        return (
          <article key={change.path} className="u2-code__file" data-reviewed={reviewed} data-flagged={flagged} data-testid={`u2-code-diff-file-${change.path}`}>
            <header className="u2-code__file-head">
              <code className="u2-code__path">{change.path}</code>
              <div className="u2-code__file-actions">
                {flagged ? <span className="u2-code__flag-badge">{ui("diffFlagged")}</span> : null}
                <button
                  type="button"
                  data-testid={`u2-code-review-${change.path}`}
                  aria-pressed={reviewed}
                  onClick={() => onMarkReviewed(change.path)}
                >
                  <Check size={14} aria-hidden="true" />
                  {reviewed ? ui("diffReviewed") : ui("diffMarkReviewed")}
                </button>
                <button
                  type="button"
                  data-testid={`u2-code-flag-${change.path}`}
                  aria-pressed={flagged}
                  onClick={() => onFlag(change.path)}
                >
                  <AlertTriangle size={14} aria-hidden="true" />
                  {ui("diffFlag")}
                </button>
              </div>
            </header>
            {proposal.diffHunks
              .filter((hunk) => hunk.filePath === change.path)
              .map((hunk, index) => <DiffHunkView key={`${change.path}-${index}`} locale={locale} hunk={hunk} />)}
            {flagged ? <p className="u2-code__flag-note">{resolveCodeCopy(locale, noteKey)}</p> : null}
          </article>
        );
      })}

      {state.ui.validation === "diff_incomplete" ? <CodeValidationNote locale={locale} validationKey="diff_incomplete" /> : null}

      <button type="button" className="u2-code__primary" data-testid="u2-code-diff-acknowledge" onClick={onAcknowledge}>
        {ui("diffAcknowledge")}
      </button>
    </section>
  );
}

export function CodeWorkingCopySurface({
  locale,
  state,
  onApply,
}: {
  locale: Locale;
  state: CodeReducerState;
  onApply: () => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const applied = state.session.workingCopyApplied;

  return (
    <section className="u2-code__surface" data-testid="u2-code-copy" data-stage="cod_working_copy" data-applied={applied}>
      <h2>{ui("copyTitle")}</h2>
      <p>{ui("copyIntro")}</p>

      <p className="u2-code__note" data-testid="u2-code-copy-status">
        <ShieldCheck size={16} aria-hidden="true" />
        {applied ? ui("copyApplied") : ui("copyApply")}
      </p>

      <button type="button" className="u2-code__primary" data-testid="u2-code-copy-apply" disabled={applied} onClick={onApply}>
        <RotateCcw size={16} aria-hidden="true" />
        {ui("copyApply")}
      </button>

      {state.ui.validation === "copy_not_applied" ? <CodeValidationNote locale={locale} validationKey="copy_not_applied" /> : null}
    </section>
  );
}

export function CodeChecksSurface({
  locale,
  state,
  onAcknowledge,
}: {
  locale: Locale;
  state: CodeReducerState;
  onAcknowledge: () => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const checks = state.session.checks;

  if (checks === null) {
    return (
      <section className="u2-code__surface" data-testid="u2-code-checks" data-stage="cod_preview_checks">
        <h2>{ui("checksTitle")}</h2>
        <p className="u2-code__error" role="alert">{ui("validation_checks_missing")}</p>
      </section>
    );
  }

  return (
    <section className="u2-code__surface" data-testid="u2-code-checks" data-stage="cod_preview_checks">
      <h2>{ui("checksTitle")}</h2>
      <p>{ui("checksIntro")}</p>

      <ul className="u2-code__checks">
        {checks.results.map((result) => (
          <li key={result.id} data-status={result.status} data-testid={`u2-code-check-${result.id}`}>
            <header>
              <strong>{resolveCodeCopy(locale, result.nameKey)}</strong>
              <span className="u2-code__check-status">{checkStatusLabel(locale, result.status)}</span>
            </header>
            <p>{resolveCodeCopy(locale, result.detailKey)}</p>
            <small className="u2-code__check-meta">{formatServiceNumber(locale, result.durationMs)} ms</small>
          </li>
        ))}
      </ul>

      {state.ui.validation === "checks_missing" ? <CodeValidationNote locale={locale} validationKey="checks_missing" /> : null}

      <button type="button" className="u2-code__primary" data-testid="u2-code-checks-acknowledge" onClick={onAcknowledge}>
        {ui("checksAcknowledge")}
      </button>
    </section>
  );
}

export function CodeReceiptSurface({
  locale,
  state,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  state: CodeReducerState;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  const impact = state.session.impact;

  if (impact === null) {
    return (
      <section className="u2-code__surface" data-testid="u2-code-receipt" data-stage="cod_receipt">
        <h2>{ui("receiptTitle")}</h2>
        <p className="u2-code__error" role="alert">{ui("validation_checks_missing")}</p>
      </section>
    );
  }

  return (
    <section className="u2-code__surface" data-testid="u2-code-receipt" data-stage="cod_receipt">
      <h2>{ui("receiptTitle")}</h2>
      <p>{ui("receiptIntro")}</p>

      <dl className="u2-code__impact">
        <div><dt>{ui("receiptFilesChanged")}</dt><dd>{formatServiceNumber(locale, impact.filesChanged)}</dd></div>
        <div><dt>{ui("receiptAdditions")}</dt><dd>{formatServiceNumber(locale, impact.additions)}</dd></div>
        <div><dt>{ui("receiptDeletions")}</dt><dd>{formatServiceNumber(locale, impact.deletions)}</dd></div>
      </dl>

      <p className="u2-code__checks-summary">
        {template(ui("receiptChecksSummary"), {
          passed: formatServiceNumber(locale, impact.checksPassed),
          warned: formatServiceNumber(locale, impact.checksWarned),
          failed: formatServiceNumber(locale, impact.checksFailed),
        })}
      </p>

      <p className="u2-code__note">{ui("receiptBoundary")}</p>

      <div className="u2-code__actions">
        <button type="button" data-testid="u2-code-save" onClick={onSave}>{ui("receiptSave")}</button>
        <button type="button" data-testid="u2-code-handoff" onClick={onHandoff}>{ui("receiptHandoff")}</button>
      </div>
    </section>
  );
}

/** Exported for the workspace's handoff bundle. */
export function codeHandoffSummary(locale: Locale, filesChanged: number): string {
  const ui = (key: string) => resolveCodeCopy(locale, `services.code.ui.${key}`);
  return template(ui("receiptHandoffSummary"), { files: formatServiceNumber(locale, filesChanged) });
}

export function stepDetail(locale: Locale, step: CodePlanStep): string {
  return resolveCodeCopy(locale, step.detailKey);
}

/** Used by the scope surface when a restored session holds an unknown project. */
export function isKnownProject(projectId: string): boolean {
  return isCodeProjectId(projectId) && (codeProjectIds as readonly string[]).includes(projectId);
}
