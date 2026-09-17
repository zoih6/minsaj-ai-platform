"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BookOpen, CircleAlert, ExternalLink, FileSearch, Filter, Play, ShieldQuestion, Square } from "lucide-react";
import type { Locale, ResearchPlan } from "@nasaq/contracts/services";
import { formatServiceNumber, getServiceDictionary } from "@nasaq/i18n/services";
import {
  buildResearchEvidenceRefs,
  computeClaimVerdicts,
  filterResearchSources,
  getResearchTopic,
  summarizeResearchActivity,
  type ResearchTopicId,
} from "@nasaq/mock-api/services";
import { exclusionPreviewFor, type ResearchReducerState } from "../state/research-reducer";

/**
 * Research stage surfaces — U2.2.
 *
 * One function per stage, composed by the workspace. Every human-readable
 * string resolves through `services.research.*`, so no copy lives in JSX;
 * question groups are real `fieldset`/`legend`; the activity log is never a
 * live region (only the stage title and one result line are announced); and
 * the citation inspector is a dialog that returns focus to its trigger.
 */

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

type ResearchNode = Record<string, unknown>;

/** Resolves a full `services.research.*` key inside the nested dictionary. */
export function resolveResearchCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.research as unknown as ResearchNode;
  const path = key.startsWith("services.research.") ? key.slice("services.research.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as ResearchNode)[part];
  }
  return typeof current === "string" ? current : key;
}

export function topicLabel(locale: Locale, topicId: string): string {
  return resolveResearchCopy(locale, `services.research.topics.${topicId}`);
}

function sourceTitle(locale: Locale, sourceId: string): string {
  const direct = resolveResearchCopy(locale, `services.research.sources.${sourceId}.title`);
  if (!direct.startsWith("services.research.sources.")) {
    return direct;
  }
  // Dense fixture sources resolve through the numbered template instead.
  const match = /_dense_(\d{2})$/u.exec(sourceId);
  if (match !== null) {
    return template(resolveResearchCopy(locale, "services.research.ui.denseSourceTitle"), { index: String(Number(match[1]) + 1) });
  }
  return sourceId;
}

export function ResearchValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-research__error" role="alert" data-testid="u2-research-validation" data-validation={validationKey}>
      {resolveResearchCopy(locale, `services.research.ui.validation_${validationKey}`)}
    </p>
  );
}

export function ResearchModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  return (
    <div className="u2-research__modes" role="group" aria-label={ui("modeSwitchLabel")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-research-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {candidate === "guided" ? ui("modeGuided") : ui("modeFast")}
          <small>{candidate === "guided" ? ui("modeGuidedHint") : ui("modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function ResearchBriefSurface({
  locale,
  state,
  onQuestion,
  onDecision,
  onAudience,
  onScope,
  onTopic,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onQuestion: (value: string) => void;
  onDecision: (value: string) => void;
  onAudience: (audience: "self" | "team" | "public") => void;
  onScope: (scope: "recent" | "broad" | "academic") => void;
  onTopic: (topicId: ResearchTopicId) => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const topicIds: readonly ResearchTopicId[] = ["waiting_time_q3", "zero_match", "remote_onboarding"];

  return (
    <section className="u2-research__surface" data-testid="u2-research-brief" data-stage="rsh_brief">
      <h2>{ui("briefTitle")}</h2>
      <ResearchModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />
      {state.session.mode === "fast" ? <p className="u2-research__note" data-testid="u2-research-fast-note">{ui("selfPacedNote")}</p> : null}

      <fieldset className="u2-research__field">
        <legend>{ui("briefQuestion")}</legend>
        <textarea
          value={state.ui.draftQuestion}
          data-testid="u2-research-question"
          rows={2}
          maxLength={600}
          aria-label={ui("briefQuestion")}
          onChange={(event) => onQuestion(event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-research__field">
        <legend>{ui("briefDecision")}</legend>
        <textarea
          value={state.ui.draftDecision}
          data-testid="u2-research-decision"
          rows={2}
          maxLength={600}
          aria-label={ui("briefDecision")}
          onChange={(event) => onDecision(event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-research__field">
        <legend>{ui("briefAudience")}</legend>
        <div className="nq-control-bar__group nq-control-bar__group--wrap u2-research__chips">
          {(["self", "team", "public"] as const).map((audience) => (
            <button
              key={audience}
              type="button"
              className="nq-chip"
              aria-pressed={state.ui.draftAudience === audience}
              data-testid={`u2-research-audience-${audience}`}
              onClick={() => onAudience(audience)}
            >
              {ui(`audience${audience === "self" ? "Self" : audience === "team" ? "Team" : "Public"}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-research__field">
        <legend>{ui("briefScope")}</legend>
        <div className="nq-control-bar__group nq-control-bar__group--wrap u2-research__chips">
          {(["recent", "broad", "academic"] as const).map((scope) => (
            <button
              key={scope}
              type="button"
              className="nq-chip"
              aria-pressed={state.ui.draftScope === scope}
              data-testid={`u2-research-scope-${scope}`}
              onClick={() => onScope(scope)}
            >
              {ui(`scope${scope === "recent" ? "Recent" : scope === "broad" ? "Broad" : "Academic"}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-research__field">
        <legend>{ui("briefTopic")}</legend>
        <select
          value={state.ui.draftTopicId}
          data-testid="u2-research-topic"
          aria-label={ui("briefTopic")}
          onChange={(event) => onTopic(event.target.value as ResearchTopicId)}
        >
          {topicIds.map((topicId) => (
            <option value={topicId} key={topicId}>{topicLabel(locale, topicId)}</option>
          ))}
        </select>
        <p className="u2-research__summary">{resolveResearchCopy(locale, getResearchTopic(state.ui.draftTopicId).summaryKey)}</p>
      </fieldset>

      {state.ui.validation === "brief_incomplete" ? <ResearchValidationNote locale={locale} validationKey="brief_incomplete" /> : null}

      <button type="button" className="u2-research__primary" data-testid="u2-research-brief-submit" onClick={onSubmit}>
        {ui("briefSubmit")}
      </button>
    </section>
  );
}

export function ResearchClarifySurface({
  locale,
  state,
  onAnswer,
  onDefault,
  onNext,
  onBack,
  onFinish,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onAnswer: (questionId: string, choiceKey: string) => void;
  onDefault: (questionId: string) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const topicId = state.session.sources[0]?.topicId ?? "waiting_time_q3";
  const questions = getResearchTopic(topicId as ResearchTopicId).clarify;
  const question = questions[state.ui.clarifyIndex] ?? null;
  const answered = (questionId: string) => state.session.clarifyAnswers.find((answer) => answer.questionId === questionId);
  const isLast = state.ui.clarifyIndex >= questions.length - 1;

  if (question === null) {
    return (
      <section className="u2-research__surface" data-testid="u2-research-clarify" data-stage="rsh_clarify">
        <h2>{ui("clarifyTitle")}</h2>
        <p className="u2-research__note">{ui("validation_clarify_incomplete")}</p>
      </section>
    );
  }

  return (
    <section className="u2-research__surface" data-testid="u2-research-clarify" data-stage="rsh_clarify" data-question={question.id}>
      <h2>{ui("clarifyTitle")}</h2>
      <p className="u2-research__progress" data-testid="u2-research-clarify-progress">
        {template(ui("activityStep"), {
          current: formatServiceNumber(locale, state.ui.clarifyIndex + 1),
          total: formatServiceNumber(locale, questions.length),
        })}
      </p>
      <fieldset className="u2-research__field">
        <legend>{resolveResearchCopy(locale, question.promptKey)}</legend>
        {question.choiceKeys.map((choiceKey, index) => (
          <button
            key={choiceKey}
            type="button"
            aria-pressed={answered(question.id)?.choiceKey === choiceKey}
            data-testid={`u2-research-clarify-choice-${index + 1}`}
            onClick={() => onAnswer(question.id, choiceKey)}
          >
            {resolveResearchCopy(locale, choiceKey)}
            {index === question.defaultChoiceIndex ? <small>{ui("clarifyDefault")}</small> : null}
          </button>
        ))}
        <button
          type="button"
          data-testid="u2-research-clarify-default"
          aria-pressed={answered(question.id)?.usedDefault === true}
          onClick={() => onDefault(question.id)}
        >
          <ShieldQuestion size={16} aria-hidden="true" />
          {ui("clarifyUseDefault")}
        </button>
      </fieldset>
      <div className="u2-research__actions">
        <button type="button" data-testid="u2-research-clarify-back" onClick={onBack} disabled={state.ui.clarifyIndex === 0}>
          {ui("clarifyBack")}
        </button>
        <button type="button" data-testid="u2-research-clarify-next" onClick={onNext} disabled={isLast}>
          {ui("clarifyNext")}
        </button>
        <button type="button" className="u2-research__primary" data-testid="u2-research-clarify-finish" onClick={onFinish}>
          {ui("clarifyFinish")}
        </button>
      </div>
      {state.ui.validation === "clarify_incomplete" ? <ResearchValidationNote locale={locale} validationKey="clarify_incomplete" /> : null}
    </section>
  );
}

export function ResearchPlanReviewSurface({
  locale,
  state,
  onToggleAxis,
  onToggleType,
  onApprove,
  onRevise,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onToggleAxis: (axisId: string) => void;
  onToggleType: (sourceType: string) => void;
  onApprove: () => void;
  onRevise: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const session = state.session;
  const newest = session.planVersions.at(-1);
  const approved = session.planVersions.find((version) => version.version === session.approvedPlanVersion) ?? null;
  const plan: ResearchPlan | null = newest?.plan ?? null;

  if (plan === null) {
    return (
      <section className="u2-research__surface" data-testid="u2-research-plan" data-stage="rsh_plan_review">
        <h2>{ui("planTitle")}</h2>
        <p className="u2-research__error" role="alert">{ui("validation_plan_not_approved")}</p>
      </section>
    );
  }

  const allTypes = ["internal_report", "academic_paper", "news", "survey", "blog", "archived_page"] as const;

  return (
    <section
      className="u2-research__surface"
      data-testid="u2-research-plan"
      data-stage="rsh_plan_review"
      data-plan-version={plan.version}
      data-approved={newest?.status === "approved"}
    >
      <h2>{ui("planTitle")}</h2>
      <p className="u2-research__note" data-testid="u2-research-plan-note">{ui("planEditNote")}</p>
      {approved !== null && approved.version !== newest?.version ? (
        <p className="u2-research__note" data-testid="u2-research-plan-superseded">
          {template(ui("planSuperseded"), { version: formatServiceNumber(locale, approved.version) })}
        </p>
      ) : null}

      <fieldset className="u2-research__field">
        <legend>{ui("planAxes")}</legend>
        <ul className="u2-research__axes" data-testid="u2-research-plan-axes">
          {plan.axes.map((axis) => (
            <li key={axis.id} data-axis={axis.id} data-included={axis.included}>
              <div>
                <strong>{resolveResearchCopy(locale, axis.labelKey)}</strong>
                <p>{resolveResearchCopy(locale, axis.reasonKey)}</p>
              </div>
              <button
                type="button"
                data-testid={`u2-research-axis-${axis.id}`}
                aria-pressed={axis.included}
                aria-label={`${ui("planAxes")}: ${resolveResearchCopy(locale, axis.labelKey)}`}
                onClick={() => onToggleAxis(axis.id)}
              >
                {axis.included ? ui("sourcesFilterAll") : ui("sourcesExclude")}
              </button>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="u2-research__field">
        <legend>{ui("planSourceTypes")}</legend>
        <div className="nq-control-bar__group nq-control-bar__group--wrap u2-research__chips">
          {allTypes.map((type) => (
            <button
              key={type}
              type="button"
              className="nq-chip"
              aria-pressed={plan.sourceTypes.includes(type)}
              data-testid={`u2-research-type-${type}`}
              onClick={() => onToggleType(type)}
            >
              {resolveResearchCopy(locale, `services.research.sourceTypes.${type}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="u2-research__meta" data-testid="u2-research-plan-timebox">
        {ui("planTimebox")}: {formatServiceNumber(locale, plan.timeboxMinutes)}
      </p>

      <details className="u2-research__rationale" data-testid="u2-research-plan-rationale">
        <summary>{ui("planRationale")}</summary>
        <ul>
          {plan.rationaleKeys.map((key) => (
            <li key={key}>{resolveResearchCopy(locale, `services.research.planRules.${key}`)}</li>
          ))}
          {plan.includeHints.map((key) => (
            <li key={key}>{resolveResearchCopy(locale, `services.research.planHints.${key}`)}</li>
          ))}
        </ul>
      </details>

      <div className="u2-research__actions">
        {newest?.status === "draft" ? (
          <button type="button" className="u2-research__primary" data-testid="u2-research-plan-approve" onClick={onApprove}>
            <Play size={16} aria-hidden="true" />
            {ui("planApprove")}
          </button>
        ) : (
          <button type="button" data-testid="u2-research-plan-revise" onClick={onRevise}>
            {template(ui("planNewVersion"), { version: formatServiceNumber(locale, (newest?.version ?? 0) + 1) })}
          </button>
        )}
      </div>
      {approved !== null ? (
        <p className="u2-research__note" data-testid="u2-research-plan-approved">
          {template(ui("planApprovedNote"), { version: formatServiceNumber(locale, approved.version) })}
        </p>
      ) : null}
      {state.ui.validation === "plan_not_approved" ? <ResearchValidationNote locale={locale} validationKey="plan_not_approved" /> : null}
    </section>
  );
}

export function ResearchSourceActivitySurface({
  locale,
  state,
  onStep,
  onAutoPlay,
  onSteer,
  onCancel,
  onResume,
  onBackToPlan,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onStep: () => void;
  onAutoPlay: (enabled: boolean) => void;
  onSteer: (steer: "narrow_recent" | "widen_types") => void;
  onCancel: () => void;
  onResume: () => void;
  onBackToPlan: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const activity = state.session.activity;
  const summary = summarizeResearchActivity(activity.entries);
  const cancelled = activity.status === "cancelled";

  return (
    <section
      className="u2-research__surface"
      data-testid="u2-research-activity"
      data-stage="rsh_source_activity"
      data-activity-status={activity.status}
      data-entries={activity.entries.length}
    >
      <h2>{ui("activityTitle")}</h2>
      <p className="u2-research__note" data-testid="u2-research-activity-fixture">{ui("activityFixtureNote")}</p>
      {activity.entries.length > 0 ? (
        <p className="u2-research__progress" data-testid="u2-research-activity-progress" aria-live="polite">
          {template(ui("activityStep"), {
            current: formatServiceNumber(locale, activity.entries.length),
            total: formatServiceNumber(locale, Math.max(activity.entries.length + 1, activity.cursor + 1)),
          })}
        </p>
      ) : null}

      <ol className="u2-research__log" data-testid="u2-research-activity-log">
        {activity.entries.map((entry) => (
          <li key={`${entry.index}-${entry.kind}`} data-kind={entry.kind} data-source={entry.sourceId ?? ""}>
            <span>{resolveResearchCopy(locale, entry.labelKey)}</span>
            {entry.sourceId !== null ? <small>{sourceTitle(locale, entry.sourceId)}</small> : null}
          </li>
        ))}
      </ol>

      {cancelled ? (
        <p className="u2-research__error" role="alert" data-testid="u2-research-activity-cancelled">{ui("activityCancelledNote")}</p>
      ) : null}
      {activity.status === "done" ? (
        <p className="u2-research__result" aria-live="polite" data-testid="u2-research-activity-done">
          {template(ui("activityDoneNote"), {
            queries: formatServiceNumber(locale, summary.queries),
            scans: formatServiceNumber(locale, summary.scans),
            extracts: formatServiceNumber(locale, summary.extracts),
          })}
        </p>
      ) : null}

      <div className="u2-research__actions">
        {activity.status === "playing" ? (
          <>
            <button type="button" data-testid="u2-research-activity-next" onClick={onStep}>
              <Play size={16} aria-hidden="true" />
              {ui("activityNext")}
            </button>
            <button
              type="button"
              data-testid="u2-research-activity-autoplay"
              aria-pressed={state.ui.autoPlay}
              onClick={() => onAutoPlay(!state.ui.autoPlay)}
            >
              {state.ui.autoPlay ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
              {state.ui.autoPlay ? ui("activityPause") : ui("activityPlay")}
            </button>
            <button type="button" data-testid="u2-research-activity-steer-narrow" onClick={() => onSteer("narrow_recent")}>
              {ui("activitySteerNarrow")}
            </button>
            <button type="button" data-testid="u2-research-activity-steer-widen" onClick={() => onSteer("widen_types")}>
              {ui("activitySteerWiden")}
            </button>
            <button type="button" data-testid="u2-research-activity-cancel" onClick={onCancel}>
              {ui("activityCancel")}
            </button>
          </>
        ) : null}
        {cancelled ? (
          <>
            <button type="button" className="u2-research__primary" data-testid="u2-research-activity-resume" onClick={onResume}>
              {ui("activityResume")}
            </button>
            <button type="button" data-testid="u2-research-activity-back" onClick={onBackToPlan}>
              {ui("activityBackToPlan")}
            </button>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function ResearchSourceReviewSurface({
  locale,
  state,
  onFilter,
  onExcludePreview,
  onExcludeApply,
  onExcludeCancel,
  onRestore,
  onContinue,
  onBackToPlan,
  onOpenInspector,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onFilter: (filter: "all" | "relevant_only" | "unavailable" | "with_url") => void;
  onExcludePreview: (sourceId: string) => void;
  onExcludeApply: () => void;
  onExcludeCancel: () => void;
  onRestore: (sourceId: string) => void;
  onContinue: () => void;
  onBackToPlan: () => void;
  onOpenInspector: (evidenceId: string) => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const sources = filterResearchSources(state.session.sources, { kind: state.ui.sourceFilter });
  const relevantCount = state.session.sources.filter((source) => source.relevance >= 1 && !source.excluded).length;
  const preview = exclusionPreviewFor(state);
  const evidence = buildResearchEvidenceRefs(
    state.session.sources[0]?.topicId === "zero_match" || state.session.sources[0]?.topicId === "remote_onboarding"
      ? (state.session.sources[0]?.topicId as ResearchTopicId)
      : "waiting_time_q3",
    locale,
  );

  return (
    <section className="u2-research__surface" data-testid="u2-research-sources" data-stage="rsh_source_review" data-count={sources.length}>
      <h2>{ui("sourcesTitle")}</h2>
      <p className="u2-research__note" data-testid="u2-research-sources-provenance">{ui("sourcesProvenance")}</p>

      <fieldset className="u2-research__field">
        <legend>{ui("sourcesFilter")}</legend>
        <div className="nq-control-bar__group nq-control-bar__group--wrap u2-research__chips">
          {(["all", "relevant_only", "unavailable", "with_url"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              className="nq-chip"
              aria-pressed={state.ui.sourceFilter === filter}
              data-testid={`u2-research-filter-${filter}`}
              onClick={() => onFilter(filter)}
            >
              <Filter size={14} aria-hidden="true" />
              {ui(`sourcesFilter${filter === "all" ? "All" : filter === "relevant_only" ? "Relevant" : filter === "unavailable" ? "Unavailable" : "Url"}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <p className="u2-research__meta" data-testid="u2-research-sources-count">
        {template(ui("sourcesCount"), { count: formatServiceNumber(locale, sources.length) })}
      </p>

      {relevantCount === 0 ? <p className="u2-research__note" data-testid="u2-research-sources-zero">{ui("sourcesZeroNote")}</p> : null}

      <ul className="u2-research__sources" data-testid="u2-research-source-list">
        {sources.map((source) => {
          const evidenceForSource = evidence.filter((item) => item.sourceId === source.id);
          return (
            <li key={source.id} data-testid={`u2-research-source-${source.id}`} data-excluded={source.excluded} data-relevance={source.relevance} data-availability={source.availability}>
              <div>
                <h3>{sourceTitle(locale, source.id)}</h3>
                <p className="u2-research__source-meta">
                  {resolveResearchCopy(locale, `services.research.sourceTypes.${source.sourceType}`)}
                  {" · "}
                  {resolveResearchCopy(locale, `services.research.availability.${source.availability}`)}
                  {source.publishedAt !== null ? ` · ${source.publishedAt.slice(0, 10)}` : ""}
                  {" · "}
                  {ui("sourcesRelevance")}: {formatServiceNumber(locale, source.relevance)}
                </p>
                {source.excluded ? <p className="u2-research__note">{ui("sourcesExcludedNote")}</p> : null}
                <ul className="u2-research__citations">
                  {evidenceForSource.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        data-testid={`u2-research-citation-${item.id}`}
                        aria-label={`${ui("reportCitationOpens")}: ${item.sourceTitle} — ${item.locatorValue}`}
                        onClick={() => onOpenInspector(item.id)}
                      >
                        <BookOpen size={14} aria-hidden="true" />
                        {item.sourceTitle} — {item.locatorValue}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="u2-research__source-actions">
                {source.excluded ? (
                  <button type="button" data-testid={`u2-research-restore-${source.id}`} onClick={() => onRestore(source.id)}>
                    {ui("sourcesRestore")}
                  </button>
                ) : (
                  <button type="button" data-testid={`u2-research-exclude-${source.id}`} onClick={() => onExcludePreview(source.id)}>
                    {ui("sourcesExclude")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {preview !== null ? (
        <div className="u2-research__preview" data-testid="u2-research-exclude-preview" data-source={preview.sourceId} role="alert">
          <h3>{ui("sourcesExcludePreview")}</h3>
          <p>{template(ui("sourcesAffectedClaims"), { claims: preview.affectedClaimIds.join(", ") || "—" })}</p>
          <p>{template(ui("sourcesOrphaned"), { count: formatServiceNumber(locale, preview.orphanedEvidenceIds.length) })}</p>
          <div className="u2-research__actions">
            <button type="button" className="u2-research__primary" data-testid="u2-research-exclude-apply" onClick={onExcludeApply}>
              {ui("sourcesExcludeApply")}
            </button>
            <button type="button" data-testid="u2-research-exclude-cancel" onClick={onExcludeCancel}>
              {ui("sourcesExcludeCancel")}
            </button>
          </div>
        </div>
      ) : null}

      <div className="u2-research__actions">
        <button type="button" className="u2-research__primary" data-testid="u2-research-sources-continue" onClick={onContinue}>
          {ui("claimsNext")}
        </button>
        <button type="button" data-testid="u2-research-sources-back" onClick={onBackToPlan}>
          {ui("activityBackToPlan")}
        </button>
      </div>
      {state.ui.validation === "source_required" ? <ResearchValidationNote locale={locale} validationKey="source_required" /> : null}
    </section>
  );
}

export function ResearchClaimMatrixSurface({
  locale,
  state,
  onAcknowledge,
  onResolve,
  onContinue,
  onOpenInspector,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onAcknowledge: (claimId: string) => void;
  onResolve: (claimId: string) => void;
  onContinue: () => void;
  onOpenInspector: (evidenceId: string) => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const session = state.session;
  const topicId = session.sources[0]?.topicId === "zero_match" || session.sources[0]?.topicId === "remote_onboarding"
    ? (session.sources[0]?.topicId as ResearchTopicId)
    : "waiting_time_q3";
  const evidence = buildResearchEvidenceRefs(topicId, locale);
  const excluded = session.sources.filter((source) => source.excluded).map((source) => source.id);
  const verdicts = computeClaimVerdicts(session.claims, evidence, session.evidenceIds, excluded);

  return (
    <section className="u2-research__surface" data-testid="u2-research-claims" data-stage="rsh_claim_matrix">
      <h2>{ui("claimsTitle")}</h2>
      <table className="u2-research__matrix" data-testid="u2-research-matrix">
        <caption className="u2-research__matrix-caption">{ui("claimsTitle")}</caption>
        <thead>
          <tr>
            <th scope="col">{ui("claimsStatement")}</th>
            <th scope="col">{ui("claimsSupport")}</th>
            <th scope="col">{ui("claimsEvidence")}</th>
          </tr>
        </thead>
        <tbody>
          {verdicts.map((verdict) => {
            const claim = session.claims.find((candidate) => candidate.id === verdict.claimId);
            if (claim === undefined) return null;
            return (
              <tr key={verdict.claimId} data-testid={`u2-research-claim-${verdict.claimId}`} data-support={verdict.support} data-resolution={claim.resolution}>
                <th scope="row">
                  <p>{resolveResearchCopy(locale, claim.statementKey)}</p>
                  {verdict.support === "unsupported" ? <p className="u2-research__note">{ui("claimsUnsupportedNote")}</p> : null}
                  {verdict.support === "conflicted" ? <p className="u2-research__note" data-testid={`u2-research-conflict-${verdict.claimId}`}>{ui("claimsConflictedNote")}</p> : null}
                </th>
                <td>
                  <span className={`u2-research__support u2-research__support--${verdict.support}`} data-testid={`u2-research-support-${verdict.claimId}`}>
                    {resolveResearchCopy(locale, `services.research.support.${verdict.support}`)}
                  </span>
                  <small>
                    {template(ui("claimsEvidenceCounts"), {
                      supports: formatServiceNumber(locale, verdict.supportsCount),
                      contradicts: formatServiceNumber(locale, verdict.contradictsCount),
                      context: formatServiceNumber(locale, verdict.contextCount),
                    })}
                  </small>
                </td>
                <td>
                  <ul className="u2-research__spine">
                    {verdict.evidenceIds.map((id) => {
                      const item = evidence.find((candidate) => candidate.id === id);
                      if (item === undefined) return null;
                      return (
                        <li key={id} data-stance={item.stance} data-testid={`u2-research-evidence-${id}`}>
                          <button
                            type="button"
                            data-testid={`u2-research-evidence-open-${id}`}
                            aria-label={`${ui("reportCitationOpens")}: ${item.sourceTitle} — ${item.locatorValue}`}
                            onClick={() => onOpenInspector(id)}
                          >
                            <FileSearch size={14} aria-hidden="true" />
                            {item.sourceTitle}
                            <small>{resolveResearchCopy(locale, `services.research.stance.${item.stance}`)}</small>
                          </button>
                          {item.availability === "unavailable" ? <small className="u2-research__unverifiable">{ui("claimsUnverifiable")}</small> : null}
                        </li>
                      );
                    })}
                    {verdict.evidenceIds.length === 0 ? <li className="u2-research__note">{ui("reportNoCitations")}</li> : null}
                  </ul>
                  {verdict.support === "unsupported" || verdict.support === "conflicted" ? (
                    <div className="u2-research__actions">
                      <button type="button" data-testid={`u2-research-acknowledge-${verdict.claimId}`} onClick={() => onAcknowledge(verdict.claimId)}>
                        <CircleAlert size={14} aria-hidden="true" />
                        {ui("claimsAcknowledge")}
                      </button>
                      <button type="button" data-testid={`u2-research-resolve-${verdict.claimId}`} onClick={() => onResolve(verdict.claimId)}>
                        {ui("claimsResolve")}
                      </button>
                    </div>
                  ) : null}
                  {claim.resolution === "resolved_needs_evidence" ? (
                    <p className="u2-research__note" data-testid={`u2-research-resolved-note-${verdict.claimId}`}>{ui("claimsResolvedNote")}</p>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="u2-research__actions">
        <button type="button" className="u2-research__primary" data-testid="u2-research-claims-continue" onClick={onContinue}>
          {ui("claimsNext")}
        </button>
      </div>
      {state.ui.validation === "claim_unresolved" ? <ResearchValidationNote locale={locale} validationKey="claim_unresolved" /> : null}
    </section>
  );
}

export function ResearchReportEditSurface({
  locale,
  state,
  onEditSection,
  onReviewSection,
  onComplete,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onEditSection: (sectionId: string, body: string) => void;
  onReviewSection: (sectionId: string) => void;
  onComplete: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const report = state.session.report;

  if (report === null) {
    return (
      <section className="u2-research__surface" data-testid="u2-research-report" data-stage="rsh_report_edit">
        <h2>{ui("reportTitle")}</h2>
        <p className="u2-research__note">{ui("validation_report_incomplete")}</p>
      </section>
    );
  }

  const evidence = buildResearchEvidenceRefs(
    state.session.sources[0]?.topicId === "zero_match" || state.session.sources[0]?.topicId === "remote_onboarding"
      ? (state.session.sources[0]?.topicId as ResearchTopicId)
      : "waiting_time_q3",
    locale,
  );
  const reviewedCount = report.sections.filter((section) => section.reviewed).length;

  return (
    <section className="u2-research__surface" data-testid="u2-research-report" data-stage="rsh_report_edit" data-reviewed={reviewedCount} data-sections={report.sections.length}>
      <h2>{ui("reportTitle")}</h2>
      <p className="u2-research__meta" data-testid="u2-research-report-progress" aria-live="polite">
        {template(ui("activityStep"), {
          current: formatServiceNumber(locale, reviewedCount),
          total: formatServiceNumber(locale, report.sections.length),
        })}
      </p>

      {report.sections.map((section) => (
        <article key={section.id} className="u2-research__section" data-testid={`u2-research-section-${section.id}`} data-reviewed={section.reviewed}>
          <h3>{resolveResearchCopy(locale, section.headingKey)}</h3>
          <label className="u2-research__edit-label">
            <span>{resolveResearchCopy(locale, section.headingKey)}</span>
            <textarea
              value={section.body}
              data-testid={`u2-research-section-edit-${section.id}`}
              rows={3}
              maxLength={600}
              aria-label={resolveResearchCopy(locale, section.headingKey)}
              onChange={(event) => onEditSection(section.id, event.target.value)}
            />
          </label>
          <div className="u2-research__section-side">
            <p className="u2-research__citations-label">{ui("reportCitations")}</p>
            <ul className="u2-research__citations">
              {section.evidenceIds.length === 0 ? <li className="u2-research__note">{ui("reportNoCitations")}</li> : null}
              {section.evidenceIds.map((id) => {
                const item = evidence.find((candidate) => candidate.id === id);
                if (item === undefined) return null;
                return (
                  <li key={id}>
                    <span data-testid={`u2-research-report-citation-${id}`}>
                      {item.sourceTitle} — {item.locatorValue}
                    </span>
                  </li>
                );
              })}
            </ul>
            <label className="u2-research__review-toggle">
              <input
                type="checkbox"
                checked={section.reviewed}
                data-testid={`u2-research-section-review-${section.id}`}
                onChange={() => onReviewSection(section.id)}
              />
              {ui("reportSectionReviewed")}
            </label>
          </div>
        </article>
      ))}

      <div className="u2-research__limitations" data-testid="u2-research-limitations">
        <h3>{ui("reportLimitations")}</h3>
        <ul>
          {report.limitationKeys.map((key) => (
            <li key={key}>{resolveResearchCopy(locale, `services.research.limitations.${key}`)}</li>
          ))}
        </ul>
      </div>

      <div className="u2-research__actions">
        <button type="button" className="u2-research__primary" data-testid="u2-research-report-complete" onClick={onComplete}>
          {ui("reportComplete")}
        </button>
      </div>
      {state.ui.validation === "report_incomplete" ? <ResearchValidationNote locale={locale} validationKey="report_incomplete" /> : null}
    </section>
  );
}

export function ResearchCompleteSurface({
  locale,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  return (
    <section className="u2-research__surface" data-testid="u2-research-complete" data-stage="rsh_complete">
      <h2>{ui("completeTitle")}</h2>
      <p className="u2-research__note" data-testid="u2-research-artifact-name">{ui("completeArtifact")}</p>
      <div className="u2-research__actions">
        <button type="button" className="u2-research__primary" data-testid="u2-research-save" onClick={onSave}>
          {ui("completeSave")}
        </button>
        <button type="button" data-testid="u2-research-handoff" onClick={onHandoff}>
          {ui("completeHandoff")}
        </button>
      </div>
    </section>
  );
}

/** The citation inspector: a dialog that returns focus to its trigger. */
export function ResearchCitationInspector({
  locale,
  state,
  onClose,
}: {
  locale: Locale;
  state: ResearchReducerState;
  onClose: () => void;
}) {
  const ui = (key: string) => resolveResearchCopy(locale, `services.research.ui.${key}`);
  const evidenceId = state.ui.inspectorEvidenceId;
  const topicId = state.session.sources[0]?.topicId === "zero_match" || state.session.sources[0]?.topicId === "remote_onboarding"
    ? (state.session.sources[0]?.topicId as ResearchTopicId)
    : "waiting_time_q3";
  const evidence = buildResearchEvidenceRefs(topicId, locale);
  const item = evidenceId === null ? undefined : evidence.find((candidate) => candidate.id === evidenceId);
  const relatedClaims = item === undefined
    ? []
    : state.session.claims.filter((claim) => claim.evidenceIds.includes(item.id));

  return (
    <Dialog.Root open={item !== undefined} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="u2-overlay" />
        <Dialog.Content
          className="u2-overlay__content u2-overlay__content--wide"
          data-testid="u2-research-inspector"
        >
          <header className="u2-overlay__head">
            <div>
              <Dialog.Title>{ui("inspectorTitle")}</Dialog.Title>
              <Dialog.Description>{item?.sourceTitle ?? ""}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label={ui("inspectorClose")} data-testid="u2-research-inspector-close">
                <span aria-hidden="true">×</span>
              </button>
            </Dialog.Close>
          </header>
          <div className="u2-overlay__body">
            {item === undefined ? null : (
              <>
                <dl className="u2-research__inspector-meta">
                  <div><dt>{ui("inspectorSource")}</dt><dd data-testid="u2-research-inspector-source">{item.sourceTitle}</dd></div>
                  <div><dt>{ui("inspectorType")}</dt><dd>{item.provenanceLabel}</dd></div>
                  <div><dt>{ui("inspectorPublished")}</dt><dd>{item.publishedAt?.slice(0, 10) ?? "—"}</dd></div>
                  <div><dt>{ui("inspectorLocator")}</dt><dd data-testid="u2-research-inspector-locator">{item.locator}: {item.locatorValue}</dd></div>
                  <div><dt>{ui("inspectorStance")}</dt><dd>{resolveResearchCopy(locale, `services.research.stance.${item.stance}`)}</dd></div>
                </dl>
                <p className="u2-research__excerpt" data-testid="u2-research-inspector-excerpt">{item.excerpt}</p>
                <section className="u2-receipt__section">
                  <h3>{ui("inspectorClaims")}</h3>
                  {relatedClaims.length === 0 ? <p>{ui("reportNoCitations")}</p> : (
                    <ul>
                      {relatedClaims.map((claim) => (
                        <li key={claim.id} data-testid={`u2-research-inspector-claim-${claim.id}`}>
                          {resolveResearchCopy(locale, claim.statementKey)}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <p className="u2-research__note" data-testid="u2-research-inspector-not-retrieved">{ui("inspectorNotRetrieved")}</p>
                {item.url !== undefined ? (
                  <a
                    className="u2-research__external"
                    data-testid="u2-research-inspector-external"
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                  >
                    <ExternalLink size={14} aria-hidden="true" />
                    {ui("inspectorOpenExternal")}
                  </a>
                ) : null}
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export { sourceTitle };
