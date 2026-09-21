"use client";

import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage, ExploreSessionState } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { createDeterministicMockServiceClient, createServiceIdFactory, explorePresetForScenario, createExploreStatePreset } from "@minsaj/mock-api/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceWorkbenchShell } from "@/features/service-workbench/components/service-workbench-shell";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";
import {
  ExploreCheckpointSurface,
  ExploreCompleteSurface,
  ExploreMapSurface,
  ExploreNodeSurface,
  ExploreSeedSurface,
  ExploreTrailSurface,
  exploreHandoffSummary,
  topicLabel,
} from "./components/explore-surfaces";
import {
  createInitialExploreState,
  exploreReducer,
  type ExploreAction,
  type ExploreReducerState,
} from "./state/explore-reducer";

/**
 * Explore workspace composition — U2.6.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Explore owns
 * its stages and its domain state, which it persists through the workbench's
 * versioned domain block instead of reading the store directly.
 */

export type ExploreWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  restoredExploreState?: ExploreSessionState | null;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

export function ExploreWorkspace(props: ExploreWorkspaceProps) {
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
      <ExploreWorkspaceInner {...props} />
    </ServiceWorkbenchProvider>
  );
}

function ExploreWorkspaceInner({ locale, scenarioId, restoredExploreState = null, initialRecords }: ExploreWorkspaceProps) {
  // Marks the moment the client tree owns the markup (same contract as Learn).
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const explore = dictionary.services.explore;

  const seeded = useMemo<ExploreSessionState | null>(() => {
    if (restoredExploreState !== null) {
      return restoredExploreState;
    }
    const presetId = explorePresetForScenario(scenarioId);
    return presetId === null ? null : createExploreStatePreset({ locale, now: "2026-09-12T00:00:00.000Z", preset: presetId });
  }, [locale, restoredExploreState, scenarioId]);

  const [exploreState, dispatch] = useReducer(
    exploreReducer,
    undefined,
    () => createInitialExploreState(locale, initialRecords?.domains?.find((block) => block.serviceId === "explore")?.payload ?? seeded ?? undefined),
  );

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "explore");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.resumeStageKey ?? ""}:${block.payload.checkpointConfirmed}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === exploreState.session.updatedAt && block.payload.resumeStageKey === exploreState.session.resumeStageKey) {
      // Our own persistence, not a restore.
      return;
    }
    dispatch({ type: "session/restored", session: block.payload });
  }, [exploreState.session.resumeStageKey, exploreState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Explore state changes; the workbench
  // stores it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${exploreState.session.updatedAt}:${exploreState.session.resumeStageKey ?? ""}:${exploreState.ui.stage}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "explore", stateVersion: 1, payload: exploreState.session };
    actions.setDomainBlock(block);
  }, [actions, exploreState.session, exploreState.ui.stage]);

  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const handoffIds = useMemo(() => createServiceIdFactory("explore_to_learn"), []);
  const handoffBundle = useMemo(() => {
    const nodes = exploreState.session.trail?.visits.filter((visit) => !visit.pruned).length ?? 0;
    return client.buildHandoff({
      id: handoffIds.next("hnd_"),
      fromServiceId: "explore",
      toServiceId: "learn",
      sourceSessionId: workbenchState.session.id,
      intentSummary: exploreHandoffSummary(locale, nodes),
      selectedFields: [
        `${explore.ui.seedTopic}: ${topicLabel(locale, exploreState.session.seed?.seed ?? "")}`,
        `${explore.ui.checkpointVisits}: ${nodes}`,
      ],
    });
  }, [client, explore.ui.checkpointVisits, explore.ui.seedTopic, exploreState.session.seed?.seed, exploreState.session.trail, handoffIds, locale, workbenchState.session.id]);

  const send = (action: ExploreAction) => dispatch(action);
  const now = () => "2026-09-12T00:00:00.000Z";

  const stage = exploreState.ui.stage;

  return (
    <ServiceWorkbenchShell
      locale={locale}
      eyebrow={explore.eyebrow}
      title={explore.label}
      description={explore.description}
      {...(stage === "exp_seed" ? { startDisabledReason: explore.ui.seedTitle } : {})}
    >
      <div className="u2-explore" data-testid="u2-explore-workspace" data-hydrated={hydrated ? "true" : "false"} data-stage={stage} data-mode={exploreState.session.mode}>
        {stage === "exp_seed" ? (
          <ExploreSeedSurface
            locale={locale}
            state={exploreState}
            onSeed={(value) => send({ type: "draft/seed", value })}
            onCuriosity={(value) => send({ type: "draft/curiosity", value })}
            onDepth={(depth) => send({ type: "draft/depth", depth })}
            onSubmit={() => send({ type: "seed/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "exp_map" ? (
          <ExploreMapSurface
            locale={locale}
            state={exploreState}
            onOpenNode={(nodeId) => send({ type: "node/open", nodeId, at: now() })}
            onContinue={() => send({ type: "trail/continue" })}
          />
        ) : null}
        {stage === "exp_node" && exploreState.session.openNodeId !== null ? (
          <ExploreNodeSurface
            locale={locale}
            state={exploreState}
            onVisit={(nodeId) => send({ type: "node/visit", nodeId, at: now() })}
            onSaveLater={(nodeId) => send({ type: "node/saveLater", nodeId, at: now() })}
            onBack={() => send({ type: "node/back" })}
          />
        ) : null}
        {stage === "exp_trail" ? (
          <ExploreTrailSurface
            locale={locale}
            state={exploreState}
            onPrune={(nodeId) => send({ type: "trail/prune", nodeId, at: now() })}
            onRestore={(nodeId) => send({ type: "trail/restore", nodeId, at: now() })}
            onContinue={() => send({ type: "trail/continue" })}
          />
        ) : null}
        {stage === "exp_checkpoint" ? (
          <ExploreCheckpointSurface
            locale={locale}
            state={exploreState}
            onConfirm={() => send({ type: "checkpoint/confirm", at: now() })}
          />
        ) : null}
        {stage === "exp_complete" ? (
          <ExploreCompleteSurface
            locale={locale}
            state={exploreState}
            onSave={() => actions.saveDemo()}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
      </div>
    </ServiceWorkbenchShell>
  );
}


export type { ExploreReducerState };
