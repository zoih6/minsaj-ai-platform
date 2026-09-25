"use client";

import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { buildLearnPath, createDeterministicMockServiceClient, createLearnStatePreset, createServiceIdFactory, getLearnTopic, type LearnStatePreset, type LearnTopicId } from "@minsaj/mock-api/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceProductShell } from "@/features/service-workbench/components/service-product-shell";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";
import {
  LearnBriefSurface,
  LearnCheckSurface,
  LearnCheckpointSurface,
  LearnCompleteSurface,
  LearnDiagnosticSurface,
  LearnFeedbackSurface,
  LearnLessonSurface,
  LearnPathReviewSurface,
  resolveLearnCopy,
  topicLabel,
} from "./components/learn-surfaces";
import {
  createInitialLearnState,
  learnReducer,
  type LearnAction,
  type LearnReducerState,
} from "./state/learn-reducer";

/**
 * Learn workspace composition — U2.1.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Learn owns
 * its stages and its domain state, which it persists through the workbench's
 * versioned domain block instead of reading the store directly.
 */

export type LearnWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  restoredLearnState?: LearnStatePreset | null;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

/** Builds the Learn domain state for a scenario preset; used by tests and the route. */
export function buildLearnInitialState(options: {
  locale: Locale;
  scenarioId: ServiceScenarioId;
  now: string;
}): { restored: LearnStatePreset | null } {
  const presetByScenario: Partial<Record<ServiceScenarioId, LearnStatePreset>> = {
    empty: "no_progress",
    dense: "dense_path",
    warning: "needs_review",
    needs_input: "unit_complete",
    failed_retryable: "path_complete",
  };
  const preset = presetByScenario[options.scenarioId] ?? null;
  return { restored: preset };
}

export function LearnWorkspace(props: LearnWorkspaceProps) {
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
      <LearnWorkspaceInner {...props} />
    </ServiceWorkbenchProvider>
  );
}

function LearnWorkspaceInner({ locale, restoredLearnState = null, initialRecords }: LearnWorkspaceProps) {
  // Marks the moment the client tree owns the markup. Tests (and any future
  // progressive-enhancement script) can wait for it instead of guessing how
  // long hydration takes: the server snapshot is false and the client snapshot
  // is true, so no state is set during an effect.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const learn = dictionary.services.learn;



  const seeded = useMemo(() => {
    if (restoredLearnState === null) {
      return null;
    }
    const topicId: LearnTopicId = restoredLearnState === "rtl_mixed" ? "rtl_typography" : "spaced_repetition";
    return createLearnStatePreset({
      locale,
      now: "2026-09-12T00:00:00.000Z",
      preset: restoredLearnState,
      topicId,
      mode: "guided",
      minutes: 15,
    });
  }, [locale, restoredLearnState]);

  const [learnState, dispatch] = useReducer(
    learnReducer,
    undefined,
    () => createInitialLearnState(locale, initialRecords?.domains?.find((block) => block.serviceId === "learn")?.payload ?? seeded ?? undefined),
  );

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "learn");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.resumeStageKey ?? ""}:${block.payload.progress.completedModules}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === learnState.session.updatedAt && block.payload.resumeStageKey === learnState.session.resumeStageKey) {
      // Our own persistence, not a restore.
      return;
    }
    dispatch({ type: "session/restored", session: block.payload });
  }, [learnState.session.resumeStageKey, learnState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Learn state changes; the workbench stores
  // it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${learnState.session.updatedAt}:${learnState.session.progress.completedModules}:${learnState.session.currentModuleId ?? ""}:${learnState.session.path?.modules.length ?? 0}:${learnState.ui.stage}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "learn", stateVersion: 1, payload: learnState.session };
    actions.setDomainBlock(block);
  }, [actions, learnState.session, learnState.ui.stage]);

  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const handoffIds = useMemo(() => createServiceIdFactory("learn_to_research"), []);
  const handoffBundle = useMemo(() => {
    const topicId = learnState.session.brief?.topicId ?? "spaced_repetition";
    const moduleId = learnState.session.currentModuleId ?? learnState.session.path?.modules[0]?.id ?? "sr_why_gaps";
    const moduleTitle = resolveLearnCopy(locale, `services.learn.content.${moduleId}.title`);
    return client.buildHandoff({
      id: handoffIds.next("hnd_"),
      fromServiceId: "learn",
      toServiceId: "research",
      sourceSessionId: workbenchState.session.id,
      intentSummary: `${topicLabel(locale, topicId)} — ${moduleTitle}`,
      selectedFields: [
        `${learn.ui.briefTopic}: ${topicLabel(locale, topicId)}`,
        `${learn.ui.handoffTitle}: ${resolveLearnCopy(locale, `services.learn.content.${moduleId}.objective`)}`,
      ],
    });
  }, [client, handoffIds, learn.ui.briefTopic, learn.ui.handoffTitle, learnState.session.brief?.topicId, learnState.session.currentModuleId, learnState.session.path, locale, workbenchState.session.id]);

  const send = (action: LearnAction) => dispatch(action);
  const now = () => "2026-09-12T00:00:00.000Z";

  const stage = learnState.ui.stage;
  const stageTitleKey = `services.learn.stages.${stage}`;

  return (
    <ServiceProductShell
      locale={locale}
      eyebrow={learn.eyebrow}
      title={learn.label}
      description={learn.description}
      {...(stage === "lrn_brief" ? { startDisabledReason: resolveLearnCopy(locale, "services.learn.ui.briefTitle") } : {})}
    >
      <div className="u2-learn" data-testid="u2-learn-workspace" data-hydrated={hydrated ? "true" : "false"} data-stage={stage} data-mode={learnState.session.mode} data-topic={learnState.session.brief?.topicId ?? ""}>
        {stage === "lrn_brief" ? (
          <LearnBriefSurface
            locale={locale}
            state={learnState}
            onTopic={(topicId) => send({ type: "draft/topic", topicId })}
            onMotivation={(value) => send({ type: "draft/motivation", value })}
            onMinutes={(minutes) => send({ type: "draft/minutes", minutes })}
            onLevel={(level) => send({ type: "draft/level", level })}
            onSubmit={() => send({ type: "brief/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "lrn_diagnostic" ? (
          <LearnDiagnosticSurface
            locale={locale}
            state={learnState}
            onAnswer={(questionId, choiceId) => send({ type: "diagnostic/answer", questionId, choiceId, skipped: false, at: now() })}
            onNext={() => send({ type: "diagnostic/next" })}
            onBack={() => send({ type: "diagnostic/back" })}
            onFinish={() => send({ type: "path/build", at: now() })}
          />
        ) : null}
        {stage === "lrn_path_review" ? (
          <LearnPathReviewSurface
            locale={locale}
            state={learnState}
            onMove={(moduleId, direction) => send({ type: "path/move", moduleId, direction, at: now() })}
            onSkip={(moduleId, reasonKey) => send({ type: "path/skip", moduleId, reasonKey, at: now() })}
            onRestore={(moduleId) => send({ type: "path/restore", moduleId, at: now() })}
            onConfirm={() => send({ type: "path/confirm", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "lrn_lesson" ? (
          <LearnLessonSurface
            locale={locale}
            state={learnState}
            onEngage={() => send({ type: "lesson/engage", at: now() })}
            onContinue={() => send({ type: "lesson/continue", at: now() })}
          />
        ) : null}
        {stage === "lrn_check" ? (
          <LearnCheckSurface
            locale={locale}
            state={learnState}
            onSelect={(choiceId) => send({ type: "check/select", choiceId })}
            onText={(value) => send({ type: "check/text", value })}
            onHint={() => send({ type: "check/hint" })}
            onSubmit={() => send({ type: "check/submit", at: now() })}
            onSkip={() => send({ type: "check/skip", at: now() })}
          />
        ) : null}
        {stage === "lrn_feedback" ? (
          <LearnFeedbackSurface
            locale={locale}
            state={learnState}
            onRetry={() => send({ type: "feedback/retry" })}
            onAcknowledge={() => send({ type: "feedback/acknowledge", at: now() })}
          />
        ) : null}
        {stage === "lrn_checkpoint" ? (
          <LearnCheckpointSurface
            locale={locale}
            state={learnState}
            onContinue={() => send({ type: "checkpoint/continue" })}
            onSave={() => {
              actions.saveDemo();
              send({ type: "checkpoint/save" });
            }}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
        {stage === "lrn_complete" ? (
          <LearnCompleteSurface
            locale={locale}
            state={learnState}
            onSave={() => actions.saveDemo()}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
      </div>
    </ServiceProductShell>
  );
}

export { buildLearnPath, getLearnTopic };
export type { LearnReducerState };
