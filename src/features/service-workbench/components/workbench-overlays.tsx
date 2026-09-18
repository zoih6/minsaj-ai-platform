"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { HandoffBundle, Locale, SimulationReceipt } from "@minsaj/contracts/services";
import { describeSimulationReceipt } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import type { ServiceStoreStatus } from "../storage/store";

/**
 * Workbench overlays: simulation receipt, demo-storage disclosure, and handoff
 * preview. All three are keyboard-reachable dialogs that restore focus to their
 * trigger, and none of them performs an action on the user's behalf.
 */

function DialogFrame({
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  className,
  testId,
  returnFocusTestId,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  closeLabel: string;
  className: string;
  testId: string;
  /** Control that must receive focus again when the dialog closes. */
  returnFocusTestId: string;
  children: React.ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="u2-overlay" />
        <Dialog.Content
          className={className}
          data-testid={testId}
          onCloseAutoFocus={(event) => {
            const target = document.querySelector<HTMLElement>(`[data-testid="${returnFocusTestId}"]`);
            if (target === null) return;
            event.preventDefault();
            target.focus();
          }}
        >
          <header className="u2-overlay__head">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label={closeLabel}><X size={18} aria-hidden="true" /></button>
            </Dialog.Close>
          </header>
          <div className="u2-overlay__body">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function ReceiptList({ label, items, emptyLabel }: { label: string; items: readonly string[]; emptyLabel: string }) {
  return (
    <section className="u2-receipt__section">
      <h3>{label}</h3>
      {items.length === 0 ? <p>{emptyLabel}</p> : <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>}
    </section>
  );
}

export function ServiceSimulationReceiptPanel({
  locale,
  receipt,
  open,
  onOpenChange,
}: {
  locale: Locale;
  receipt: SimulationReceipt | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const dictionary = getServiceDictionary(locale);
  const described = receipt ? describeSimulationReceipt(receipt, locale) : null;

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title={dictionary.receipt.title}
      description={dictionary.receipt.description}
      closeLabel={dictionary.workbench.closeReceipt}
      className="u2-overlay__content u2-overlay__content--wide"
      testId="u2-receipt-panel"
      returnFocusTestId="u2-simulation-badge"
    >
      {receipt === undefined || described === null ? (
        <p>{dictionary.workbench.noArtifactYet}</p>
      ) : (
        <>
          <p className="u2-receipt__mode" data-testid="u2-receipt-mode">{described.mode}</p>
          <dl className="u2-receipt__meta">
            <div><dt>{dictionary.workbench.sessionLabel}</dt><dd>{receipt.serviceId}</dd></div>
            <div><dt>{dictionary.receipt.networkCalls}</dt><dd data-testid="u2-receipt-network">{receipt.networkCalls}</dd></div>
            <div><dt>{dictionary.receipt.storage}</dt><dd>{receipt.persistentStorage === "none" ? dictionary.receipt.none : dictionary.storage.sessionOnly}</dd></div>
          </dl>
          <ReceiptList label={dictionary.receipt.performedLocally} items={receipt.performedLocally} emptyLabel={dictionary.receipt.none} />
          <ReceiptList label={dictionary.receipt.simulated} items={receipt.simulated} emptyLabel={dictionary.receipt.none} />
          <ReceiptList label={dictionary.receipt.notPerformed} items={receipt.notPerformed} emptyLabel={dictionary.receipt.none} />
          <ReceiptList label={dictionary.receipt.userDataRead} items={receipt.userDataRead} emptyLabel={dictionary.receipt.none} />
          {receipt.warnings.length > 0 ? <ReceiptList label={dictionary.receipt.warnings} items={receipt.warnings} emptyLabel={dictionary.receipt.none} /> : null}
          <section className="u2-receipt__section u2-receipt__section--boundary" data-testid="u2-receipt-boundary">
            <h3>{dictionary.receipt.boundary}</h3>
            <p>{dictionary.receipt.boundaryStatement}</p>
          </section>
        </>
      )}
    </DialogFrame>
  );
}

export function ServiceStorageDisclosure({
  locale,
  open,
  onOpenChange,
  status,
  savedAt,
  onClear,
}: {
  locale: Locale;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: ServiceStoreStatus;
  savedAt: string | null;
  onClear: () => void;
}) {
  const dictionary = getServiceDictionary(locale);
  const statusText = status === "session"
    ? dictionary.storage.sessionOnly
    : status === "corrupt_recovered"
      ? dictionary.storage.corruptRecovered
      : status === "quota_exceeded"
        ? dictionary.storage.quotaExceeded
        : status === "unavailable"
          ? dictionary.storage.unavailable
          : dictionary.storage.memoryOnly;

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title={dictionary.storage.title}
      description={dictionary.storage.body}
      closeLabel={dictionary.workbench.closeReceipt}
      className="u2-overlay__content"
      testId="u2-storage-panel"
      returnFocusTestId="u2-storage-open"
    >
      <p data-testid="u2-storage-status">{statusText}</p>
      {savedAt === null ? null : <p className="u2-overlay__meta" data-testid="u2-storage-saved-at">{savedAt}</p>}
      <button type="button" className="u2-overlay__action" onClick={onClear} data-testid="u2-storage-clear">
        {dictionary.storage.clear}
      </button>
    </DialogFrame>
  );
}

export function ServiceHandoffPreview({
  locale,
  bundle,
  open,
  onOpenChange,
  onConfirm,
}: {
  locale: Locale;
  bundle: HandoffBundle | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  const dictionary = getServiceDictionary(locale);

  return (
    <DialogFrame
      open={open}
      onOpenChange={onOpenChange}
      title={dictionary.handoff.title}
      description={dictionary.handoff.body}
      closeLabel={dictionary.handoff.cancel}
      className="u2-overlay__content"
      testId="u2-handoff-panel"
      returnFocusTestId="u2-handoff-preview"
    >
      {bundle === undefined ? (
        <p>{dictionary.workbench.noArtifactYet}</p>
      ) : (
        <>
          <p className="u2-overlay__meta" data-testid="u2-handoff-summary">{bundle.intentSummary}</p>
          <ReceiptList label={dictionary.handoff.fieldsIncluded} items={[...bundle.selectedFields]} emptyLabel={dictionary.receipt.none} />
          <ReceiptList label={dictionary.handoff.fieldsExcluded} items={[...bundle.excludedFields]} emptyLabel={dictionary.receipt.none} />
          <p className="u2-overlay__meta" data-testid="u2-handoff-status">{bundle.status === "preview" ? dictionary.handoff.preview : bundle.status === "consumed" ? dictionary.handoff.consumed : dictionary.handoff.confirm}</p>
          <button
            type="button"
            className="u2-overlay__action"
            onClick={onConfirm}
            disabled={bundle.status !== "preview" || bundle.selectedFields.length === 0}
            data-testid="u2-handoff-confirm"
          >
            {dictionary.handoff.confirm}
          </button>
        </>
      )}
    </DialogFrame>
  );
}
