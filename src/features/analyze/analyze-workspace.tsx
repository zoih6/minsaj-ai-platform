"use client";

import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage, AnalyzeSessionState } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { createDeterministicMockServiceClient, createServiceIdFactory } from "@minsaj/mock-api/services";
import { analyzePresetForScenario, createAnalyzeStatePreset } from "@minsaj/mock-api/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceProductShell } from "@/features/service-workbench/components/service-product-shell";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";
import {
  AnalyzeCompleteSurface,
  AnalyzeComputeSurface,
  AnalyzePlanSurface,
  AnalyzeProfileSurface,
  AnalyzeQuestionSurface,
  AnalyzeResultSurface,
  AnalyzeSourceSurface,
  AnalyzeVerifySurface,
  analyzeHandoffSummary,
} from "./components/analyze-surfaces";
import {
  analyzeReducer,
  createInitialAnalyzeState,
  type AnalyzeAction,
  type AnalyzeReducerState,
} from "./state/analyze-reducer";

/**
 * Analyze workspace composition — U2.5.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Analyze owns
 * its stages and its domain state, which it persists through the workbench's
 * versioned domain block instead of reading the store directly.
 */

export type AnalyzeWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  restoredAnalyzeState?: AnalyzeSessionState | null;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

export function AnalyzeWorkspace(props: AnalyzeWorkspaceProps) {
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
      <AnalyzeWorkspaceInner {...props} />
    </ServiceWorkbenchProvider>
  );
}

function AnalyzeWorkspaceInner({ locale, scenarioId, restoredAnalyzeState = null, initialRecords }: AnalyzeWorkspaceProps) {
  // Marks the moment the client tree owns the markup (same contract as Learn).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const analyze = dictionary.services.analyze;

  const seeded = useMemo<AnalyzeSessionState | null>(() => {
    if (restoredAnalyzeState !== null) {
      return restoredAnalyzeState;
    }
    const presetId = analyzePresetForScenario(scenarioId);
    return presetId === null ? null : createAnalyzeStatePreset({ locale, now: "2026-09-12T00:00:00.000Z", preset: presetId });
  }, [locale, restoredAnalyzeState, scenarioId]);

  const [analyzeState, dispatch] = useReducer(
    analyzeReducer,
    undefined,
    () => createInitialAnalyzeState(locale, initialRecords?.domains?.find((block) => block.serviceId === "analyze")?.payload ?? seeded ?? undefined),
  );

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "analyze");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.resumeStageKey ?? ""}:${block.payload.result !== null}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === analyzeState.session.updatedAt && block.payload.resumeStageKey === analyzeState.session.resumeStageKey) {
      // Our own persistence, not a restore.
      return;
    }
    dispatch({ type: "session/restored", session: block.payload });
  }, [analyzeState.session.resumeStageKey, analyzeState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Analyze state changes; the workbench
  // stores it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${analyzeState.session.updatedAt}:${analyzeState.session.resumeStageKey ?? ""}:${analyzeState.ui.stage}:${analyzeState.ui.computeDone}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "analyze", stateVersion: 1, payload: analyzeState.session };
    actions.setDomainBlock(block);
  }, [actions, analyzeState.session, analyzeState.ui.stage, analyzeState.ui.computeDone]);

  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const handoffIds = useMemo(() => createServiceIdFactory("analyze_to_create"), []);
  const handoffBundle = useMemo(() => {
    const value = analyzeState.session.result?.headlineValue ?? 0;
    return client.buildHandoff({
      id: handoffIds.next("hnd_"),
      fromServiceId: "analyze",
      toServiceId: "create",
      sourceSessionId: workbenchState.session.id,
      intentSummary: analyzeHandoffSummary(locale, value),
      selectedFields: [
        `${analyze.ui.questionOperation}: ${analyzeState.session.question?.operation ?? ""}`,
        `${analyze.ui.completeRowsComputed}: ${analyzeState.session.summary?.rowsComputed ?? 0}`,
      ],
    });
  }, [analyze.ui.completeRowsComputed, analyze.ui.questionOperation, analyzeState.session.question?.operation, analyzeState.session.result?.headlineValue, analyzeState.session.summary?.rowsComputed, client, handoffIds, locale, workbenchState.session.id]);

  const send = (action: AnalyzeAction) => dispatch(action);
  const now = () => "2026-09-12T00:00:00.000Z";

  const stage = analyzeState.ui.stage;

  return (
    <ServiceProductShell
      locale={locale}
      eyebrow={analyze.eyebrow}
      title={analyze.label}
      description={analyze.description}
      {...(stage === "ana_source" ? { startDisabledReason: analyze.ui.sourceTitle } : {})}
    >
      <div className="u2-analyze" data-testid="u2-analyze-workspace" data-hydrated={hydrated ? "true" : "false"} data-stage={stage} data-mode={analyzeState.session.mode}>
        {stage === "ana_source" ? (
          <AnalyzeSourceSurface
            locale={locale}
            state={analyzeState}
            onDataset={(datasetId) => send({ type: "draft/dataset", datasetId })}
            onLocalFile={(value) => send({ type: "draft/localFileName", value })}
            onSubmit={() => send({ type: "source/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "ana_profile" ? (
          <AnalyzeProfileSurface
            locale={locale}
            state={analyzeState}
            onContinue={() => send({ type: "profile/continue" })}
          />
        ) : null}
        {stage === "ana_question" ? (
          <AnalyzeQuestionSurface
            locale={locale}
            state={analyzeState}
            onQuestion={(value) => send({ type: "draft/question", value })}
            onOperation={(operation) => send({ type: "draft/operation", operation })}
            onAssumptionDraft={(value) => send({ type: "draft/assumption", value })}
            onAssumptionAdd={() => send({ type: "draft/assumptionAdd" })}
            onAssumptionRemove={(index) => send({ type: "draft/assumptionRemove", index })}
            onSubmit={() => send({ type: "question/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "ana_plan" ? (
          <AnalyzePlanSurface
            locale={locale}
            state={analyzeState}
            onMove={(stepId, direction) => send({ type: "plan/move", stepId, direction, at: now() })}
            onExclude={(stepId, reasonKey) => send({ type: "plan/exclude", stepId, reasonKey, at: now() })}
            onRestore={(stepId) => send({ type: "plan/restore", stepId, at: now() })}
            onApprove={() => send({ type: "plan/approve", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "ana_compute" ? (
          <AnalyzeComputeSurface
            locale={locale}
            state={analyzeState}
            onStep={() => send({ type: "compute/step" })}
            onFinish={() => send({ type: "compute/finish", at: now() })}
          />
        ) : null}
        {stage === "ana_result" ? (
          <AnalyzeResultSurface
            locale={locale}
            state={analyzeState}
            onContinue={() => send({ type: "result/continue" })}
          />
        ) : null}
        {stage === "ana_verify" ? (
          <AnalyzeVerifySurface
            locale={locale}
            state={analyzeState}
            onAcknowledge={(checkId) => send({ type: "verify/acknowledge", checkId, at: now() })}
            onConfirm={() => send({ type: "verify/confirm", at: now() })}
          />
        ) : null}
        {stage === "ana_complete" ? (
          <AnalyzeCompleteSurface
            locale={locale}
            state={analyzeState}
            onSave={() => actions.saveDemo()}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
      </div>
    </ServiceProductShell>
  );
}

export type { AnalyzeReducerState };
