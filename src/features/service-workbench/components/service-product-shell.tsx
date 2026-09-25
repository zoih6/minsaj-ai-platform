"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, type ReactNode } from "react";
import { FlaskConical, ShieldAlert, X } from "lucide-react";
import type { Locale } from "@minsaj/contracts/services";
import { isTerminalServiceRunStatus } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { useServiceWorkbench } from "../state/workbench-provider";
import { selectPrimaryArtifact, selectCurrentReceipt, selectPendingHandoff } from "../state/reducer";
import { ServiceRunStatusBar, ServiceStartButton, ServiceStageNavigation } from "./workbench-primitives";
import { ServiceHandoffPreview, ServiceSimulationReceiptPanel, ServiceStorageDisclosure } from "./workbench-overlays";

/**
 * W-7 (W7-3, §7.9) — the PRODUCT shell for domain workspaces.
 *
 * The six domain services (learn/research/create/code/analyze/explore) are
 * product pages, not QA harnesses. Their product surface is the gateway
 * grammar the owner approved — service-welcome header (eyebrow + h1 + lede,
 * identity announced exactly once, no badges) + the domain stage surfaces.
 *
 * The simulation affordances (stage strip, run controls, save/clear demo,
 * artifact summary, receipt/storage entry points) live behind ONE discreet
 * «demo mode» chip that opens this panel — fully preserved for QA, invisible
 * on the product surface. The shell rides `.service-space` for the canvas
 * tokens (--sp-*), the prose measure and the ONE section rhythm, so the page
 * is literally the same designed object as the pages the owner likes.
 */
export function ServiceProductShell({
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
  const [demoOpen, setDemoOpen] = useState(false);
  const status = state.run?.status ?? null;
  const isActive = status !== null && !isTerminalServiceRunStatus(status) && status !== "needs_input";
  const artifact = selectPrimaryArtifact(state);
  const receipt = selectCurrentReceipt(state);
  const handoff = selectPendingHandoff(state);

  const ar = locale === "ar";
  const demoLabel = ar ? "وضع التجربة" : "Demo mode";
  const demoPanelTitle = ar ? "عدّة التجربة" : "Simulation controls";
  const demoPanelDesc = ar
    ? "مراحل التشغيل والتحكم والإيصالات وحفظ النموذج — أدوات المحاكاة كاملة خلف هذا الباب."
    : "Stages, run controls, receipts and demo storage — the full simulation affordance behind one door.";
  const closeLabel = ar ? "إغلاق" : "Close";
  const runningLabel = ar ? "قيد التنفيذ" : "Running";

  return (
    <section
      className="service-space u2-product"
      data-service={state.session.serviceId}
      data-run-status={status ?? "idle"}
      data-run-id={state.run?.id ?? ""}
      data-run-retry-of={state.run?.retryOf ?? ""}
      data-testid="u2-workbench"
    >
      {/* L2 product header — the gateway grammar: identity announced once,
          no chrome, no badges (§2.3; the page the owner liked). */}
      <section className="service-welcome">
        <span className="service-welcome__eyebrow">{eyebrow}</span>
        <h1 className="service-welcome__title">{title}</h1>
        <p className="service-welcome__lede">{description}</p>
        <button type="button" className="u2-product__demo-chip" onClick={() => setDemoOpen(true)} data-testid="u2-demo-open" aria-haspopup="dialog">
          <FlaskConical size={13} aria-hidden="true" />
          <span>{demoLabel}</span>
          <i data-status={status ?? "idle"} aria-hidden="true" />
        </button>
      </section>

      {/* The product surface: the domain stage surfaces own the screen.
          Kept for test/badge parity with the retired harness shell. */}
      <p className="u2-visually-hidden" data-testid="u2-session-id" data-session-id={state.session.id}>
        {dictionary.workbench.sessionLabel}
        <span aria-hidden="true"> · </span>
        <code>{state.session.id}</code>
      </p>

      <div className="u2-product__body">{children}</div>

      {/* Demo panel — the entire simulation affordance behind ONE door. */}
      <Dialog.Root open={demoOpen} onOpenChange={setDemoOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="u2-overlay" />
          <Dialog.Content className="u2-overlay__content u2-product__panel" aria-describedby="u2-demo-desc">
            <Dialog.Title className="u2-product__panel-title">{demoPanelTitle}</Dialog.Title>
            <p id="u2-demo-desc" className="u2-product__panel-desc">{demoPanelDesc}</p>
            <Dialog.Close asChild>
              <button type="button" className="u2-product__panel-close" aria-label={closeLabel}><X size={16} /></button>
            </Dialog.Close>

            <ServiceStageNavigation locale={locale} stages={state.stages} />

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

            <div className="u2-product__panel-row">
              <button type="button" className="u2-product__panel-action" onClick={() => { actions.openReceipt(true); setDemoOpen(false); }} data-testid="u2-receipt-open">
                {ar ? "عرض الإيصال" : "View receipt"}
              </button>
              <button type="button" className="u2-product__panel-action" onClick={() => { actions.openStorage(true); setDemoOpen(false); }} data-testid="u2-storage-open">
                {dictionary.storage.title}
              </button>
              <button type="button" className="u2-product__panel-action" onClick={() => actions.saveDemo()} data-testid="u2-save-demo">{dictionary.workbench.saveDemo}</button>
              <button type="button" className="u2-product__panel-action" onClick={() => actions.clearDemo()} data-testid="u2-clear-demo">{dictionary.workbench.clearDemoData}</button>
            </div>

            <aside className="u2-product__artifact" data-testid="u2-artifact-region" data-has-artifact={artifact !== undefined}>
              <header>
                <ShieldAlert size={16} aria-hidden="true" />
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
            {isActive ? <p className="u2-product__panel-hint">{runningLabel}</p> : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

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
