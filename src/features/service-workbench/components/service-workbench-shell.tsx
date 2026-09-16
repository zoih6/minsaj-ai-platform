"use client";

import type { ReactNode } from "react";
import { Database, ShieldAlert } from "lucide-react";
import type { Locale } from "@nasaq/contracts/services";
import { isTerminalServiceRunStatus } from "@nasaq/contracts/services";
import { getServiceDictionary } from "@nasaq/i18n/services";
import { useServiceWorkbench } from "../state/workbench-provider";
import { selectPrimaryArtifact, selectCurrentReceipt, selectPendingHandoff } from "../state/reducer";
import { ServiceRunStatusBar, ServiceSimulationBadge, ServiceStartButton, ServiceStageNavigation } from "./workbench-primitives";
import { ServiceHandoffPreview, ServiceSimulationReceiptPanel, ServiceStorageDisclosure } from "./workbench-overlays";

/**
 * Shared workbench composition.
 *
 * Everything shared lives here: identity, stage navigation, run controls,
 * receipt, storage disclosure, and handoff preview. Domain surfaces render as
 * children and own their own layout.
 */

export function ServiceWorkbenchShell({
  locale,
  title,
  eyebrow,
  description,
  startDisabledReason,
  showStart = true,
  children,
}: {
  locale: Locale;
  title: string;
  eyebrow: string;
  description: string;
  startDisabledReason?: string;
  showStart?: boolean;
  children: ReactNode;
}) {
  const { state, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const status = state.run?.status ?? null;
  const isActive = status !== null && !isTerminalServiceRunStatus(status) && status !== "needs_input";
  const artifact = selectPrimaryArtifact(state);
  const receipt = selectCurrentReceipt(state);
  const handoff = selectPendingHandoff(state);

  return (
    <section
      className="u2-workbench"
      data-service={state.session.serviceId}
      data-run-status={status ?? "idle"}
      data-run-id={state.run?.id ?? ""}
      data-run-retry-of={state.run?.retryOf ?? ""}
      data-testid="u2-workbench"
    >
      <header className="u2-workbench__head">
        <div>
          <span className="u2-workbench__eyebrow" data-testid="u2-service-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <p className="u2-workbench__session u2-visually-hidden" data-testid="u2-session-id" data-session-id={state.session.id}>
            {dictionary.workbench.sessionLabel}
            <span aria-hidden="true"> · </span>
            <code>{state.session.id}</code>
          </p>
        </div>
        <div className="u2-workbench__badges">
          <ServiceSimulationBadge locale={locale} onOpen={() => actions.openReceipt(true)} />
          <button type="button" className="u2-badge u2-badge--ghost" onClick={() => actions.openStorage(true)} data-testid="u2-storage-open">
            <Database size={15} aria-hidden="true" />
            <span>{dictionary.storage.title}</span>
          </button>
        </div>
      </header>

      <ServiceStageNavigation locale={locale} stages={state.stages} />

      <div className="u2-workbench__controls">
        {showStart ? (
          <ServiceStartButton
            locale={locale}
            isActive={isActive}
            isDisabled={startDisabledReason !== undefined}
            {...(startDisabledReason === undefined ? {} : { disabledReason: startDisabledReason })}
            onStart={() => actions.start()}
          />
        ) : null}
        <ServiceRunStatusBar
          locale={locale}
          status={status}
          isActive={isActive}
          canCancel={isActive}
          canRetry={status !== null && isTerminalServiceRunStatus(status) && status !== "completed" && status !== "completed_with_warnings" && status !== "cancelled"}
          canProvideInput={status === "needs_input"}
          onCancel={() => actions.cancel()}
          onRetry={() => actions.retry()}
          onProvideInput={() => actions.provideInput()}
          noticeKey={state.noticeKey}
          validationKey={state.validationKey}
        />
        <div className="u2-workbench__utility">
          <button type="button" onClick={() => actions.saveDemo()} data-testid="u2-save-demo">{dictionary.workbench.saveDemo}</button>
          <button type="button" onClick={() => actions.clearDemo()} data-testid="u2-clear-demo">{dictionary.workbench.clearDemoData}</button>
        </div>
      </div>

      <div className="u2-workbench__body">{children}</div>

      <aside className="u2-workbench__artifact" data-testid="u2-artifact-region" data-has-artifact={artifact !== undefined}>
        <header>
          <ShieldAlert size={15} aria-hidden="true" />
          <h2>{artifact === undefined ? dictionary.workbench.noArtifactYet : artifact.title}</h2>
        </header>
        {artifact === undefined ? null : (
          <ul>
            <li>{dictionary.workbench.version} {artifact.versionIds.length}</li>
            <li>{getServiceDictionary(locale).services[artifact.serviceId].artifactKind}</li>
            {artifact.warningCodes.map((code) => <li key={code}>{code}</li>)}
          </ul>
        )}
      </aside>

      <ServiceSimulationReceiptPanel
        locale={locale}
        receipt={receipt}
        open={state.overlays.receipt}
        onOpenChange={(open) => actions.openReceipt(open)}
      />
      <ServiceStorageDisclosure
        locale={locale}
        open={state.overlays.storage}
        onOpenChange={(open) => actions.openStorage(open)}
        status={state.storageStatus}
        savedAt={state.savedAt}
        onClear={() => actions.clearDemo()}
      />
      <ServiceHandoffPreview
        locale={locale}
        bundle={handoff}
        open={state.overlays.handoff !== null}
        onOpenChange={(open) => { if (!open) actions.closeHandoff(); }}
        onConfirm={() => { if (handoff) actions.confirmHandoff(handoff.id); }}
      />
    </section>
  );
}
