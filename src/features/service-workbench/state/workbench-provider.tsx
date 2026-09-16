"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import type {
  HandoffBundle,
  Locale,
  ServiceEvent,
  ServiceRun,
  ServiceScenarioId,
  ServiceSession,
  ServiceStage,
} from "@nasaq/contracts/services";
import { createServiceRetryRun, isTerminalServiceRunStatus } from "@nasaq/contracts/services";
import {
  createDeterministicMockServiceClient,
  createServiceIdFactory,
  createTimerServiceClock,
  type ServiceSimulationRunner,
} from "@nasaq/mock-api/services";
import { createLocalAnalytics } from "../analytics";
import {
  buildDemoSnapshot,
  type DemoStoreSnapshot,
  type ServiceDomainBlock,
  createBrowserServiceSessionStore,
  snapshotTimestamp,
  type ServiceSessionStore,
  type ServiceStoreStatus,
} from "../storage/store";
import {
  createInitialWorkbenchState,
  selectActiveStage,
  serviceWorkbenchReducer,
  type ServiceWorkbenchAction,
  type ServiceWorkbenchSeed,
  type ServiceWorkbenchState,
} from "./reducer";

/**
 * Shared Service Workbench provider.
 *
 * It exposes `state`, `actions`, `meta`, and `adapter` — never the storage
 * mechanism itself. Domain workspaces compose their own surfaces on top of this
 * provider; the provider knows nothing about Learn, Research, Create, Code,
 * Analyze, or Explore specifics.
 */

export type ServiceWorkbenchActions = {
  start(): void;
  cancel(): void;
  retry(): void;
  provideInput(): void;
  saveDemo(): void;
  clearDemo(): void;
  /** Stores one service slice's versioned state; the workbench never reads it. */
  setDomainBlock(block: ServiceDomainBlock): void;
  /** Applies one saved snapshot. The workbench does not interpret domain blocks. */
  restoreSnapshot(snapshot: DemoStoreSnapshot, status: ServiceStoreStatus): void;
  openReceipt(open: boolean): void;
  openStorage(open: boolean): void;
  closeHandoff(): void;
  previewHandoff(bundle: HandoffBundle): void;
  confirmHandoff(handoffId: string): void;
  consumeHandoff(handoffId: string): void;
};

export type ServiceWorkbenchMeta = {
  locale: Locale;
  stepMs: number;
  productsSimulatedLocally: boolean;
  networkCalls: 0;
  fileContentRead: false;
  codeExecution: false;
  productAgentRuntime: "not_implemented";
};

export type ServiceWorkbenchAdapter = {
  kind: "memory" | "session";
  save(snapshotSessions: readonly ServiceSession[]): { ok: boolean; status: ServiceStoreStatus };
  clear(): void;
  status(): ServiceStoreStatus;
};

export type ServiceWorkbenchContextValue = {
  state: ServiceWorkbenchState;
  actions: ServiceWorkbenchActions;
  meta: ServiceWorkbenchMeta;
  adapter: ServiceWorkbenchAdapter;
};

const ServiceWorkbenchContext = createContext<ServiceWorkbenchContextValue | null>(null);

export function useServiceWorkbench(): ServiceWorkbenchContextValue {
  const value = useContext(ServiceWorkbenchContext);
  if (value === null) {
    throw new Error("useServiceWorkbench must be used inside ServiceWorkbenchProvider");
  }
  return value;
}

export type ServiceWorkbenchProviderProps = {
  locale: Locale;
  scenarioId: ServiceScenarioId;
  session: ServiceSession;
  stages: ServiceStage[];
  stepMs?: number;
  store?: ServiceSessionStore;
  /** Storage status already observed by the host surface (single read). */
  initialStorageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  /**
   * Read the tab-scoped demo store once, after mount.
   *
   * Storage is never read during render: the server has no storage, so reading
   * it while rendering would produce markup the client cannot reproduce
   * (hydration mismatch). Resuming after mount keeps SSR and the first client
   * render identical.
   */
  resumeFromStorage?: boolean;
  children: ReactNode;
};

export function ServiceWorkbenchProvider({
  locale,
  scenarioId,
  session,
  stages,
  stepMs = 120,
  store,
  initialStorageStatus,
  initialRecords,
  resumeFromStorage = false,
  children,
}: ServiceWorkbenchProviderProps) {
  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const analytics = useMemo(() => createLocalAnalytics(), []);
  const resolvedStore = useMemo(() => store ?? createBrowserServiceSessionStore(), [store]);
  const clock = useMemo(() => createTimerServiceClock(), []);
  const ids = useMemo(() => createServiceIdFactory(`${session.serviceId}_${scenarioId}_${locale}`), [session.serviceId, scenarioId, locale]);

  const baseSession = session;
  const [state, dispatch] = useReducer(
    serviceWorkbenchReducer,
    createInitialWorkbenchState(session, stages, {
      storageStatus: initialStorageStatus ?? resolvedStore.kind,
      artifacts: initialRecords?.artifacts ?? [],
      receipts: initialRecords?.receipts ?? [],
      handoffs: initialRecords?.handoffs ?? [],
      domains: initialRecords?.domains ?? [],
    }),
  );

  const runnerRef = useRef<ServiceSimulationRunner | null>(null);
  const runCounterRef = useRef(0);

  const dispatchSafely = useCallback((action: ServiceWorkbenchAction) => dispatch(action), []);

  useEffect(() => () => {
    runnerRef.current?.dispose();
    runnerRef.current = null;
  }, []);

  const attachRecords = useCallback((run: ServiceRun, terminal: boolean) => {
    if (!terminal) {
      const { artifact, version } = client.buildArtifact({ session, run, locale, ids });
      dispatchSafely({ type: "records/attached", artifact, version });
      return;
    }
    const receipt = client.buildReceipt({
      session,
      run,
      scenarioId,
      locale,
      ids,
      storage: resolvedStore.kind === "session" ? "session_storage" : "none",
    });
    dispatchSafely({ type: "records/attached", receipt });
  }, [client, ids, locale, resolvedStore.kind, scenarioId, session, dispatchSafely]);

  const handleEvent = useCallback((event: ServiceEvent) => {
    dispatchSafely({ type: "event/received", event });
    if (event.name !== "service.run.status_changed") return;
    const run = runnerRef.current;
    if (run === null) return;
    const status = event.payload.status;
    if (status === "review_ready") {
      attachRecords(stateRunSnapshot(run.runId, session, status), false);
    }
    if (isTerminalServiceRunStatus(status)) {
      attachRecords(stateRunSnapshot(run.runId, session, status, event.occurredAt), true);
    }
  }, [attachRecords, dispatchSafely, session]);

  const startRunner = useCallback((options: { retryOf?: string } = {}) => {
    runCounterRef.current += 1;
    const runner = client.createRun({
      session,
      scenarioId,
      clock,
      stepMs,
      ids,
      ...(options.retryOf === undefined ? {} : { retryOf: options.retryOf }),
      onEvent: handleEvent,
    });
    runnerRef.current = runner;
    return runner;
  }, [client, clock, handleEvent, ids, scenarioId, session, stepMs]);

  const actions = useMemo<ServiceWorkbenchActions>(() => ({
    start() {
      if (runnerRef.current?.isActive()) return;
      if (state.run !== null && !isTerminalServiceRunStatus(state.run.status)) return;
      const runner = startRunner();
      const record: ServiceRun = {
        id: runner.runId,
        sessionId: session.id,
        serviceId: session.serviceId,
        status: "validating",
        stageId: stages[0]?.id ?? "stg_brief",
        scenarioId,
        sequence: 0,
        warningCodes: [],
        artifactIds: [],
        simulationReceiptId: `sim_${session.serviceId}_${scenarioId}_pending`,
        createdAt: snapshotTimestamp(clock.now()),
      };
      dispatchSafely({ type: "run/started", run: record });
      analytics.track("u2.run.started", { serviceId: session.serviceId, scenarioId, locale });
      runner.start();
    },
    cancel() {
      const runner = runnerRef.current;
      if (runner === null || !runner.isActive()) return;
      runner.cancel("user_cancelled");
      analytics.track("u2.run.cancelled", { serviceId: session.serviceId, scenarioId });
    },
    retry() {
      const previous = state.run;
      if (previous === null || !isTerminalServiceRunStatus(previous.status)) {
        dispatchSafely({ type: "validation/set", key: "retry" });
        return;
      }
      if (previous.status === "completed" || previous.status === "completed_with_warnings") return;
      const nextId = `run_${session.serviceId}_retry_${runCounterRef.current + 1}`;
      const next = createServiceRetryRun(previous, nextId, scenarioId, snapshotTimestamp(clock.now()));
      const runner = startRunner({ retryOf: previous.id });
      dispatchSafely({ type: "run/started", run: { ...next, id: runner.runId, simulationReceiptId: previous.simulationReceiptId } });
      analytics.track("u2.run.retried", { serviceId: session.serviceId, scenarioId, status: previous.status });
      runner.start();
    },
    provideInput() {
      const runner = runnerRef.current;
      if (runner === null) return;
      runner.provideInput();
    },
    saveDemo() {
      const savedAt = snapshotTimestamp(clock.now());
      const result = resolvedStore.write(buildDemoSnapshot({
        savedAt,
        sessions: [state.session],
        artifacts: state.artifacts,
        receipts: state.receipts,
        handoffs: state.handoffs,
        domains: state.domains,
      }));
      if (result.ok) {
        dispatchSafely({ type: "storage/status", status: resolvedStore.kind, savedAt });
        dispatchSafely({ type: "notice/set", key: "saved" });
        analytics.track("u2.artifact.saved", { serviceId: session.serviceId, storageMode: resolvedStore.kind });
      } else {
        dispatchSafely({ type: "storage/status", status: result.status });
        dispatchSafely({ type: "notice/set", key: result.status === "quota_exceeded" ? "quota" : "unavailable" });
      }
    },
    clearDemo() {
      resolvedStore.clear();
      dispatchSafely({ type: "storage/status", status: resolvedStore.kind, savedAt: null });
      dispatchSafely({ type: "notice/set", key: "cleared" });
      analytics.track("u2.storage.cleared", { serviceId: session.serviceId });
    },
    setDomainBlock(block) {
      dispatchSafely({ type: "domain/replaced", block });
    },
    restoreSnapshot(snapshot: DemoStoreSnapshot, status: ServiceStoreStatus) {
      const session = snapshot.sessions.find((candidate) => candidate.serviceId === baseSession.serviceId);
      dispatchSafely({
        type: "records/restored",
        ...(session === undefined ? {} : { session }),
        artifacts: snapshot.artifacts,
        receipts: snapshot.receipts,
        handoffs: snapshot.handoffs,
        domains: snapshot.domains ?? [],
        savedAt: snapshot.savedAt,
        storageStatus: status,
      });
    },
    openReceipt(open) {
      dispatchSafely({ type: "overlay/toggle", overlay: "receipt", value: open });
      if (open) analytics.track("u2.receipt.opened", { serviceId: session.serviceId, scenarioId });
    },
    openStorage(open) {
      dispatchSafely({ type: "overlay/toggle", overlay: "storage", value: open });
    },
    closeHandoff() {
      dispatchSafely({ type: "overlay/toggle", overlay: "handoff", value: null });
    },
    previewHandoff(bundle) {
      dispatchSafely({ type: "handoff/previewed", bundle });
      dispatchSafely({ type: "overlay/toggle", overlay: "handoff", value: bundle.id });
      analytics.track("u2.handoff.previewed", { serviceId: session.serviceId, status: bundle.toServiceId });
    },
    confirmHandoff(handoffId) {
      dispatchSafely({ type: "handoff/confirmed", handoffId, at: snapshotTimestamp(clock.now()) });
      analytics.track("u2.handoff.confirmed", { serviceId: session.serviceId });
    },
    consumeHandoff(handoffId) {
      dispatchSafely({ type: "handoff/consumed", handoffId, at: snapshotTimestamp(clock.now()) });
    },
  }), [analytics, baseSession.serviceId, clock, dispatchSafely, locale, resolvedStore, scenarioId, session, startRunner, state.artifacts, state.domains, state.handoffs, state.receipts, state.run, state.session, stages]);

  // Mount-only resume: one read, one explicit restore, no render-time storage.
  const resumedRef = useRef(false);
  useEffect(() => {
    if (!resumeFromStorage || resumedRef.current) {
      return;
    }
    resumedRef.current = true;
    const read = resolvedStore.read();
    if (read.snapshot === null) {
      return;
    }
    const stored = read.snapshot;
    const storedSession = stored.sessions.find((candidate) => candidate.serviceId === baseSession.serviceId);
    dispatchSafely({
      type: "records/restored",
      ...(storedSession === undefined ? {} : { session: storedSession }),
      artifacts: stored.artifacts,
      receipts: stored.receipts,
      handoffs: stored.handoffs,
      domains: stored.domains ?? [],
      savedAt: stored.savedAt,
      storageStatus: read.status,
    });
  }, [baseSession.serviceId, dispatchSafely, resolvedStore, resumeFromStorage]);

  const meta: ServiceWorkbenchMeta = useMemo(() => ({
    locale,
    stepMs,
    productsSimulatedLocally: true,
    networkCalls: 0,
    fileContentRead: false,
    codeExecution: false,
    productAgentRuntime: "not_implemented",
  }), [locale, stepMs]);

  const adapter: ServiceWorkbenchAdapter = useMemo(() => ({
    kind: resolvedStore.kind === "session" ? "session" : "memory",
    save: (snapshotSessions) => {
      const result = resolvedStore.write(buildDemoSnapshot({
        savedAt: snapshotTimestamp(clock.now()),
        sessions: snapshotSessions,
        artifacts: state.artifacts,
        receipts: state.receipts,
        handoffs: state.handoffs,
        domains: state.domains,
      }));
      return result.ok ? { ok: true, status: resolvedStore.kind } : { ok: false, status: result.status };
    },
    clear: () => resolvedStore.clear(),
    status: () => resolvedStore.kind,
  }), [clock, resolvedStore, state.artifacts, state.domains, state.handoffs, state.receipts]);

  const value = useMemo<ServiceWorkbenchContextValue>(() => ({ state, actions, meta, adapter }), [state, actions, meta, adapter]);

  return <ServiceWorkbenchContext.Provider value={value}>{children}</ServiceWorkbenchContext.Provider>;
}

function stateRunSnapshot(runId: string, session: ServiceSession, status: ServiceRun["status"], completedAt?: string): ServiceRun {
  return {
    id: runId,
    sessionId: session.id,
    serviceId: session.serviceId,
    status,
    stageId: session.currentStageId ?? "stg_brief",
    scenarioId: "happy",
    sequence: 0,
    warningCodes: [],
    artifactIds: [],
    simulationReceiptId: `sim_${runId}`,
    createdAt: snapshotTimestamp(Date.now()),
    ...(completedAt === undefined ? {} : { completedAt }),
  };
}

export { selectActiveStage };
