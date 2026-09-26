"use client";

import { AlertTriangle, Check, Circle, CircleDot, Info, LoaderCircle, Play, RotateCcw, ShieldAlert, X } from "lucide-react";
import type { ServiceRunStatus, ServiceStage } from "@minsaj/contracts/services";
import { isTerminalServiceRunStatus } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import type { Locale } from "@minsaj/contracts/services";

/**
 * Domain-neutral workbench primitives.
 *
 * They own stage semantics, run status, live-region behaviour, and disabled
 * reasons. They never own a domain layout: services compose them.
 */

export function ServiceSimulationBadge({
  locale,
  onOpen,
}: {
  locale: Locale;
  onOpen: () => void;
}) {
  const dictionary = getServiceDictionary(locale);
  return (
    <button type="button" className="u2-badge" onClick={onOpen} data-testid="u2-simulation-badge">
      <ShieldAlert size={16} aria-hidden="true" />
      <span>{dictionary.workbench.simulationBadge}</span>
    </button>
  );
}

const stageIcons = {
  pending: Circle,
  active: CircleDot,
  completed: Check,
  blocked: AlertTriangle,
  skipped: X,
} as const;

export function ServiceStageNavigation({
  locale,
  stages,
  onSelect,
}: {
  locale: Locale;
  stages: readonly ServiceStage[];
  onSelect?: (stageId: string) => void;
}) {
  const dictionary = getServiceDictionary(locale);
  return (
    <nav className="u2-stages" aria-label={dictionary.workbench.stageNavigation} data-testid="u2-stage-navigation">
      {/* At narrow widths the stage strip scrolls horizontally. Disabled stage
          buttons are not focusable, so the scroll region itself takes the
          keyboard focus (axe: scrollable-region-focusable). When stages become
          selectable the buttons carry the focus instead. */}
      <ol
        tabIndex={onSelect === undefined ? 0 : undefined}
        aria-label={onSelect === undefined ? dictionary.workbench.stageNavigation : undefined}
        data-scrollable={onSelect === undefined}
      >
        {stages.map((stage) => {
          const Icon = stageIcons[stage.status];
          const title = resolveStageTitle(locale, stage.titleKey);
          return (
            <li key={stage.id} data-status={stage.status} aria-current={stage.status === "active" ? "step" : undefined}>
              <button type="button" onClick={() => onSelect?.(stage.id)} disabled={onSelect === undefined} aria-describedby={onSelect === undefined ? `${stage.id}-reason` : undefined}>
                <Icon size={14} aria-hidden="true" />
                <span>{title}</span>
                <small>{dictionary.workbench.stageStatus[stage.status]}</small>
                {stage.reviewPoint ? <em>{dictionary.workbench.reviewPoint}</em> : null}
              </button>
              {onSelect === undefined ? <span id={`${stage.id}-reason`} className="u2-visually-hidden">{dictionary.workbench.unavailableInPrototype}</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

const runStatusIcons = {
  validating: LoaderCircle,
  needs_input: Info,
  queued: Circle,
  running: LoaderCircle,
  review_ready: CircleDot,
  completed: Check,
  completed_with_warnings: AlertTriangle,
  failed_retryable: RotateCcw,
  failed_final: X,
  cancel_requested: LoaderCircle,
  cancelled: X,
} as const;

export function ServiceRunStatusBar({
  locale,
  status,
  isActive,
  canCancel,
  canRetry,
  canProvideInput,
  onCancel,
  onRetry,
  onProvideInput,
  noticeKey,
  validationKey,
}: {
  locale: Locale;
  status: ServiceRunStatus | null;
  isActive: boolean;
  canCancel: boolean;
  canRetry: boolean;
  canProvideInput: boolean;
  onCancel: () => void;
  onRetry: () => void;
  onProvideInput: () => void;
  noticeKey?: string | null;
  validationKey?: string | null;
}) {
  const dictionary = getServiceDictionary(locale);
  const Icon = status === null ? Info : runStatusIcons[status];
  const notice = resolveNotice(locale, noticeKey);

  return (
    <div className="u2-run" data-testid="u2-run-status" data-status={status ?? "idle"}>
      <p role="status" aria-live="polite" aria-atomic="true" aria-busy={isActive} className="u2-run__status">
        <Icon size={16} aria-hidden="true" />
        <span>{status === null ? dictionary.workbench.noArtifactYet : dictionary.runStatus[status]}</span>
      </p>
      <div className="u2-run__actions">
        {canProvideInput ? <button type="button" onClick={onProvideInput} data-testid="u2-provide-input">{dictionary.workbench.provideInput}</button> : null}
        {canCancel ? <button type="button" onClick={onCancel} data-testid="u2-cancel">{dictionary.workbench.cancel}</button> : null}
        {canRetry ? <button type="button" onClick={onRetry} data-testid="u2-retry"><RotateCcw size={14} aria-hidden="true" />{dictionary.workbench.retry}</button> : null}
        {notice === null ? null : <small className="u2-run__notice" data-testid="u2-run-notice">{notice}</small>}
        {validationKey === "retry" ? <small className="u2-run__notice" data-testid="u2-retry-blocked">{dictionary.workbench.noDeadControl}</small> : null}
      </div>
    </div>
  );
}

/**
 * W9-4 (Bible §5.2-3) — the SURFACE stage strip: compact pills with the four
 * visual states (pending neutral · active service+spinner · completed mint+check
 * · blocked/skipped danger) joined by connector lines, shown on the product
 * surface only while a run exists. The contract carries five stage states; the
 * two failure flavours (blocked, skipped) share the danger tint on purpose —
 * the Bible specifies four VISUAL states.
 */
export function ServiceLiveStageStrip({
  locale,
  stages,
}: {
  locale: Locale;
  stages: readonly ServiceStage[];
}) {
  const dictionary = getServiceDictionary(locale);
  return (
    <nav className="u2-live-strip" aria-label={dictionary.workbench.stageNavigation} data-testid="u2-live-stages">
      <ol>
        {stages.map((stage) => {
          const title = resolveStageTitle(locale, stage.titleKey);
          const failed = stage.status === "blocked" || stage.status === "skipped";
          const visual = stage.status === "completed" ? "done" : failed ? "error" : stage.status;
          return (
            <li key={stage.id} data-status={visual} aria-current={stage.status === "active" ? "step" : undefined}>
              <span className="u2-live-strip__pill">
                {stage.status === "active" ? <LoaderCircle size={14} className="u2-live-strip__spin" aria-hidden="true" /> : null}
                {stage.status === "completed" ? <Check size={14} aria-hidden="true" /> : null}
                {failed ? <AlertTriangle size={14} aria-hidden="true" /> : null}
                {stage.status === "pending" ? <Circle size={14} aria-hidden="true" /> : null}
                <span>{title}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * W9-4 (Bible §5.2-6) — the SURFACE status bar: a 40px sticky bottom strip
 * that lives on the product surface while a run exists (the full control bar
 * stays behind the demo door). Pulsing status dot + status text + stage
 * counter + run id in mono + the honest simulation disclosure (0 network
 * calls). Rides above the mobile tabbar reserve exactly like the legacy
 * stop-button did.
 */
export function ServiceLiveStatusBar({
  locale,
  status,
  stages,
  runId,
}: {
  locale: Locale;
  status: ServiceRunStatus | null;
  stages: readonly ServiceStage[];
  runId: string;
}) {
  const dictionary = getServiceDictionary(locale);
  const done = stages.filter((s) => s.status === "completed").length;
  const stageWord = locale === "ar" ? "المرحلة" : "Stage";
  const label = status === null ? dictionary.workbench.noArtifactYet : dictionary.runStatus[status];
  return (
    <aside className="u2-live-bar" data-testid="u2-live-status" data-status={status ?? "idle"} data-active={status !== null && !isTerminalServiceRunStatus(status)}>
      <p role="status" aria-live="polite">
        <i className="u2-live-bar__dot" aria-hidden="true" />
        <span className="u2-live-bar__label">{label}</span>
        <span className="u2-live-bar__meta">
          {stageWord} {done}/{stages.length}
        </span>
        <span className="u2-live-bar__meta mono" dir="ltr">{runId}</span>
        <span className="u2-live-bar__meta u2-live-bar__disclosure">{locale === "ar" ? "محاكاة محلية · 0 نداء شبكة" : "local simulation · 0 network calls"}</span>
      </p>
    </aside>
  );
}

export function ServiceStartButton({
  locale,
  isActive,
  isDisabled,
  disabledReason,
  onStart,
}: {
  locale: Locale;
  isActive: boolean;
  isDisabled: boolean;
  disabledReason?: string;
  onStart: () => void;
}) {
  const dictionary = getServiceDictionary(locale);
  return (
    <div className="u2-start">
      <button
        type="button"
        className="u2-start__button"
        onClick={onStart}
        disabled={isDisabled || isActive}
        data-testid="u2-start"
        {...(isDisabled && disabledReason && !isActive ? { "aria-describedby": "u2-start-reason" } : {})}
      >
        {isActive ? <LoaderCircle size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        <span>{isActive ? dictionary.workbench.startBusy : dictionary.workbench.start}</span>
      </button>
      {isDisabled && disabledReason && !isActive ? <small id="u2-start-reason">{disabledReason}</small> : null}
    </div>
  );
}

export function ServiceUnavailableControl({ locale, label }: { locale: Locale; label: string }) {
  const dictionary = getServiceDictionary(locale);
  return (
    <span className="u2-unavailable">
      <button type="button" disabled aria-describedby="u2-unavailable-reason">{label}</button>
      <small id="u2-unavailable-reason">{dictionary.workbench.unavailableInPrototype}</small>
    </span>
  );
}

export function resolveStageTitle(locale: Locale, titleKey: string): string {
  const dictionary = getServiceDictionary(locale);
  const parts = titleKey.split(".");
  const serviceId = parts[1];
  const stageKey = parts[3];
  if (serviceId === undefined || stageKey === undefined) return titleKey;
  const entry = dictionary.services[serviceId as keyof typeof dictionary.services];
  return entry?.stages[stageKey] ?? titleKey;
}

export function resolveNotice(locale: Locale, noticeKey: string | null | undefined): string | null {
  if (!noticeKey) return null;
  const dictionary = getServiceDictionary(locale);
  const notices = dictionary.workbench.notices;
  if (noticeKey === "duplicate" || noticeKey === "gap" || noticeKey === "staleRun") return notices[noticeKey];
  if (noticeKey === "saved") return dictionary.workbench.savedLocally;
  if (noticeKey === "cleared") return dictionary.storage.cleared;
  if (noticeKey === "quota") return dictionary.storage.quotaExceeded;
  if (noticeKey === "unavailable") return dictionary.storage.unavailable;
  return null;
}
