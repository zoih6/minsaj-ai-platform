"use client";

import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { createDeterministicMockServiceClient, createServiceIdFactory } from "@minsaj/mock-api/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceProductShell } from "@/features/service-workbench/components/service-product-shell";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";
import {
  CodeChecksSurface,
  CodeDiffReviewSurface,
  CodePlanSurface,
  CodeProposalSurface,
  CodeReceiptSurface,
  CodeScopeSurface,
  CodeWorkingCopySurface,
  codeHandoffSummary,
} from "./components/code-surfaces";
import {
  createInitialCodeState,
  codeReducer,
  type CodeAction,
  type CodeReducerState,
} from "./state/code-reducer";
import type { CodeSessionState } from "@minsaj/contracts/services";
import { codePresetForScenario, createCodeStatePreset } from "@minsaj/mock-api/services";

/**
 * Code workspace composition — U2.4.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Code owns
 * its stages and its domain state, which it persists through the workbench's
 * versioned domain block instead of reading the store directly.
 */

export type CodeWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  restoredCodeState?: CodeSessionState | null;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

export function CodeWorkspace(props: CodeWorkspaceProps) {
  return (
    <ServiceWorkbenchProvider
      locale={props.locale}
      scenarioId={props.scenarioId}
      session={props.session}
      stages={props.stages}
      {...(props.stepMs === undefined ? {} : { stepMs: props.stepMs })}
      {...(props.storageStatus === undefined ? {} : { initialStorageStatus: props.storageStatus })}
      {...(props.initialRecords === undefined ? {} : { initialRecords: props.initialRecords })}
      {...(props.resumeFromStorage === undefined ? {} : { resumeFromStorage: props.resumeFromStorage })}
    >
      <CodeWorkspaceInner {...props} />
    </ServiceWorkbenchProvider>
  );
}

function CodeWorkspaceInner({ locale, scenarioId, restoredCodeState = null, initialRecords }: CodeWorkspaceProps) {
  // Marks the moment the client tree owns the markup (same contract as Learn).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const code = dictionary.services.code;

  const seeded = useMemo<CodeSessionState | null>(() => {
    if (restoredCodeState !== null) {
      return restoredCodeState;
    }
    const presetId = codePresetForScenario(scenarioId);
    return presetId === null ? null : createCodeStatePreset({ locale, now: "2026-09-12T00:00:00.000Z", preset: presetId });
  }, [locale, restoredCodeState, scenarioId]);

  const [codeState, dispatch] = useReducer(
    codeReducer,
    undefined,
    () => createInitialCodeState(locale, initialRecords?.domains?.find((block) => block.serviceId === "code")?.payload ?? seeded ?? undefined),
  );

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "code");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.resumeStageKey ?? ""}:${block.payload.workingCopyApplied}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === codeState.session.updatedAt && block.payload.resumeStageKey === codeState.session.resumeStageKey) {
      // Our own persistence, not a restore.
      return;
    }
    dispatch({ type: "session/restored", session: block.payload });
  }, [codeState.session.resumeStageKey, codeState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Code state changes; the workbench stores
  // it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${codeState.session.updatedAt}:${codeState.session.resumeStageKey ?? ""}:${codeState.session.workingCopyApplied}:${codeState.ui.stage}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "code", stateVersion: 1, payload: codeState.session };
    actions.setDomainBlock(block);
  }, [actions, codeState.session, codeState.ui.stage]);

  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const handoffIds = useMemo(() => createServiceIdFactory("code_to_analyze"), []);
  const handoffBundle = useMemo(() => {
    const files = codeState.session.impact?.filesChanged ?? 0;
    return client.buildHandoff({
      id: handoffIds.next("hnd_"),
      fromServiceId: "code",
      toServiceId: "analyze",
      sourceSessionId: workbenchState.session.id,
      intentSummary: codeHandoffSummary(locale, files),
      selectedFields: [
        `${code.ui.scopeProject}: ${codeState.session.scope?.projectFixtureId ?? ""}`,
        `${code.ui.receiptFilesChanged}: ${files}`,
      ],
    });
  }, [client, code.ui.receiptFilesChanged, code.ui.scopeProject, codeState.session.impact?.filesChanged, codeState.session.scope?.projectFixtureId, handoffIds, locale, workbenchState.session.id]);

  const send = (action: CodeAction) => dispatch(action);
  const now = () => "2026-09-12T00:00:00.000Z";

  const stage = codeState.ui.stage;

  return (
    <ServiceProductShell
      locale={locale}
      eyebrow={code.eyebrow}
      title={code.label}
      description={code.description}
      {...(stage === "cod_scope" ? { startDisabledReason: code.ui.scopeTitle } : {})}
    >
      <div className="u2-code" data-testid="u2-code-workspace" data-hydrated={hydrated ? "true" : "false"} data-stage={stage} data-mode={codeState.session.mode}>
        {stage === "cod_scope" ? (
          <CodeScopeSurface
            locale={locale}
            state={codeState}
            onProject={(projectId) => send({ type: "draft/project", projectId })}
            onTaskType={(taskType) => send({ type: "draft/taskType", taskType })}
            onRequest={(value) => send({ type: "draft/changeRequest", value })}
            onSubmit={() => send({ type: "scope/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "cod_plan" ? (
          <CodePlanSurface
            locale={locale}
            state={codeState}
            onMove={(stepId, direction) => send({ type: "plan/move", stepId, direction, at: now() })}
            onExclude={(stepId, reasonKey) => send({ type: "plan/exclude", stepId, reasonKey, at: now() })}
            onRestore={(stepId) => send({ type: "plan/restore", stepId, at: now() })}
            onApprove={() => send({ type: "plan/approve", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "cod_proposal" ? (
          <CodeProposalSurface
            locale={locale}
            state={codeState}
            onContinue={() => send({ type: "proposal/continue" })}
          />
        ) : null}
        {stage === "cod_diff_review" ? (
          <CodeDiffReviewSurface
            locale={locale}
            state={codeState}
            onMarkReviewed={(path) => send({ type: "diff/markReviewed", path, at: now() })}
            onFlag={(path) => send({ type: "diff/flag", path, noteKey: "services.code.risks.risk_wide_route", at: now() })}
            onAcknowledge={() => send({ type: "diff/acknowledge", at: now() })}
          />
        ) : null}
        {stage === "cod_working_copy" ? (
          <CodeWorkingCopySurface
            locale={locale}
            state={codeState}
            onApply={() => send({ type: "copy/apply", at: now() })}
          />
        ) : null}
        {stage === "cod_preview_checks" ? (
          <CodeChecksSurface
            locale={locale}
            state={codeState}
            onAcknowledge={() => send({ type: "checks/acknowledge", at: now() })}
          />
        ) : null}
        {stage === "cod_receipt" ? (
          <CodeReceiptSurface
            locale={locale}
            state={codeState}
            onSave={() => actions.saveDemo()}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
      </div>
    </ServiceProductShell>
  );
}

export type { CodeReducerState };
