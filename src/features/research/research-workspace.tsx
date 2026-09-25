"use client";

import { useEffect, useMemo, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import {
  buildResearchEvidenceRefs,
  createDeterministicMockServiceClient,
  createResearchStatePreset,
  createServiceIdFactory,
  type ResearchStatePreset,
  type ResearchTopicId,
} from "@minsaj/mock-api/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceProductShell } from "@/features/service-workbench/components/service-product-shell";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";
import {
  ResearchBriefSurface,
  ResearchClaimMatrixSurface,
  ResearchClarifySurface,
  ResearchCitationInspector,
  ResearchCompleteSurface,
  ResearchPlanReviewSurface,
  ResearchReportEditSurface,
  ResearchSourceActivitySurface,
  ResearchSourceReviewSurface,
  resolveResearchCopy,
  topicLabel,
} from "./components/research-surfaces";
import {
  createInitialResearchState,
  researchReducer,
  type ResearchAction,
  type ResearchReducerState,
} from "./state/research-reducer";

/**
 * Research workspace composition — U2.2.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Research
 * owns its stages and its domain state, persisted through the workbench's
 * versioned domain block. The activity auto-play is a small interval that only
 * dispatches reducer steps; every entry stays deterministic either way.
 */

export type ResearchWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  restoredResearchState?: ResearchStatePreset | null;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

/** Maps a scenario to a Research preset; used by tests and evidence capture. */
export function buildResearchInitialState(options: {
  locale: Locale;
  scenarioId: ServiceScenarioId;
  now: string;
}): { restored: ResearchStatePreset | null } {
  const presetByScenario: Partial<Record<ServiceScenarioId, ResearchStatePreset>> = {
    needs_input: "clarify_pending",
    warning: "conflicted_claims",
    conflicting_evidence: "conflicted_claims",
    zero_sources: "zero_sources",
    dense: "dense_sources",
    rtl_stress: "mixed_bidi",
    failed_retryable: "activity_cancelled",
    empty: "fresh",
  };
  const preset = presetByScenario[options.scenarioId] ?? null;
  return { restored: preset };
}

export function ResearchWorkspace(props: ResearchWorkspaceProps) {
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
      <ResearchWorkspaceInner {...props} />
    </ServiceWorkbenchProvider>
  );
}

function ResearchWorkspaceInner({ locale, restoredResearchState = null, initialRecords }: ResearchWorkspaceProps) {
  // Marks the moment the client tree owns the markup; tests wait for it
  // instead of guessing how long hydration takes.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const research = dictionary.services.research;

  const seeded = useMemo(() => {
    if (restoredResearchState === null) {
      return null;
    }
    const topicByPreset: Partial<Record<ResearchStatePreset, ResearchTopicId>> = {
      zero_sources: "zero_match",
      mixed_bidi: "remote_onboarding",
    };
    return createResearchStatePreset({
      locale,
      now: "2026-09-12T00:00:00.000Z",
      preset: restoredResearchState,
      ...(topicByPreset[restoredResearchState] === undefined ? {} : { topicId: topicByPreset[restoredResearchState] }),
      mode: "guided",
    });
  }, [locale, restoredResearchState]);

  const [researchState, dispatch] = useReducer(
    researchReducer,
    undefined,
    () => createInitialResearchState(locale, initialRecords?.domains?.find((block) => block.serviceId === "research")?.payload ?? seeded ?? undefined),
  );

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "research");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.resumeStageKey ?? ""}:${block.payload.activity?.status ?? ""}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === researchState.session.updatedAt && block.payload.resumeStageKey === researchState.session.resumeStageKey) {
      // Our own persistence, not a restore.
      return;
    }
    dispatch({ type: "session/restored", session: block.payload });
  }, [researchState.session.resumeStageKey, researchState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Research state changes; the workbench
  // stores it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${researchState.session.updatedAt}:${researchState.ui.stage}:${researchState.session.activity.status}:${researchState.session.evidenceIds.length}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "research", stateVersion: 1, payload: researchState.session };
    actions.setDomainBlock(block);
  }, [actions, researchState.session, researchState.ui.stage]);

  // The citation inspector returns focus to its trigger after it closes: the
  // effect runs once the dialog has finished unmounting, so the focus call
  // cannot race the portal teardown.
  const previousInspectorRef = useRef<string | null>(null);
  useEffect(() => {
    const current = researchState.ui.inspectorEvidenceId;
    const previous = previousInspectorRef.current;
    previousInspectorRef.current = current;
    if (current !== null || previous === null) {
      return;
    }
    const target = document.querySelector<HTMLElement>(`[data-testid="u2-research-evidence-open-${previous}"]`)
      ?? document.querySelector<HTMLElement>(`[data-testid="u2-research-citation-${previous}"]`);
    target?.focus();
  }, [researchState.ui.inspectorEvidenceId]);

  // Auto-play the activity with a small interval. Each tick is one
  // deterministic reducer step; reduced-motion users simply step manually.
  const autoPlay = researchState.ui.autoPlay;
  const playing = researchState.session.activity.status === "playing";
  useEffect(() => {
    if (!autoPlay || !playing) {
      return;
    }
    const timer = window.setInterval(() => {
      dispatch({ type: "activity/step" });
    }, 700);
    return () => window.clearInterval(timer);
  }, [autoPlay, playing]);

  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const handoffIds = useMemo(() => createServiceIdFactory("research_to_create"), []);
  const handoffBundle = useMemo(() => {
    const topicId = researchState.session.sources[0]?.topicId ?? "waiting_time_q3";
    const question = researchState.session.brief?.question ?? "research";
    return client.buildHandoff({
      id: handoffIds.next("hnd_"),
      fromServiceId: "research",
      toServiceId: "create",
      sourceSessionId: workbenchState.session.id,
      intentSummary: `${topicLabel(locale, topicId)} — ${question}`,
      selectedFields: [question.slice(0, 80), topicLabel(locale, topicId)],
    });
  }, [client, handoffIds, locale, researchState.session.brief?.question, researchState.session.sources, workbenchState.session.id]);

  const send = (action: ResearchAction) => dispatch(action);
  const now = () => "2026-09-12T00:00:00.000Z";

  const stage = researchState.ui.stage;
  const stageTitleKey = `services.research.stages.${stage}`;

  return (
    <ServiceProductShell
      locale={locale}
      eyebrow={research.eyebrow}
      title={research.label}
      description={research.description}
      {...(stage === "rsh_brief" ? { startDisabledReason: resolveResearchCopy(locale, "services.research.ui.briefTitle") } : {})}
    >
      <div
        className="u2-research"
        data-testid="u2-research-workspace"
        data-hydrated={hydrated ? "true" : "false"}
        data-stage={stage}
        data-mode={researchState.session.mode}
        data-topic={researchState.session.sources[0]?.topicId ?? researchState.ui.draftTopicId}
        data-plan-approved={researchState.session.approvedPlanVersion !== null}
      >
        {stage === "rsh_brief" ? (
          <ResearchBriefSurface
            locale={locale}
            state={researchState}
            onQuestion={(value) => send({ type: "draft/question", value })}
            onDecision={(value) => send({ type: "draft/decision", value })}
            onAudience={(audience) => send({ type: "draft/audience", audience })}
            onScope={(scope) => send({ type: "draft/scope", scope })}
            onTopic={(topicId) => send({ type: "draft/topic", topicId })}
            onSubmit={() => send({ type: "brief/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}
        {stage === "rsh_clarify" ? (
          <ResearchClarifySurface
            locale={locale}
            state={researchState}
            onAnswer={(questionId, choiceKey) => send({ type: "clarify/answer", questionId, choiceKey, at: now() })}
            onDefault={(questionId) => send({ type: "clarify/default", questionId, at: now() })}
            onNext={() => send({ type: "clarify/next" })}
            onBack={() => send({ type: "clarify/back" })}
            onFinish={() => send({ type: "plan/build", at: now() })}
          />
        ) : null}
        {stage === "rsh_plan_review" ? (
          <ResearchPlanReviewSurface
            locale={locale}
            state={researchState}
            onToggleAxis={(axisId) => send({ type: "plan/toggle-axis", axisId, at: now() })}
            onToggleType={(sourceType) => send({ type: "plan/toggle-type", sourceType, at: now() })}
            onApprove={() => send({ type: "plan/approve", at: now() })}
            onRevise={() => send({ type: "plan/revise", at: now() })}
          />
        ) : null}
        {stage === "rsh_source_activity" ? (
          <ResearchSourceActivitySurface
            locale={locale}
            state={researchState}
            onStep={() => send({ type: "activity/step" })}
            onAutoPlay={(enabled) => send({ type: "activity/autoplay", enabled })}
            onSteer={(steer) => send({ type: "activity/steer", steer, at: now() })}
            onCancel={() => send({ type: "activity/cancel", at: now() })}
            onResume={() => send({ type: "activity/resume", at: now() })}
            onBackToPlan={() => send({ type: "activity/back-to-plan" })}
          />
        ) : null}
        {stage === "rsh_source_review" ? (
          <ResearchSourceReviewSurface
            locale={locale}
            state={researchState}
            onFilter={(filter) => send({ type: "source/filter", filter })}
            onExcludePreview={(sourceId) => send({ type: "source/exclude-preview", sourceId })}
            onExcludeApply={() => send({ type: "source/exclude-apply", at: now() })}
            onExcludeCancel={() => send({ type: "source/exclude-cancel" })}
            onRestore={(sourceId) => send({ type: "source/restore", sourceId, at: now() })}
            onContinue={() => send({ type: "sources/continue", at: now() })}
            onBackToPlan={() => send({ type: "source/back-to-plan" })}
            onOpenInspector={(evidenceId) => send({ type: "inspector/open", evidenceId })}
          />
        ) : null}
        {stage === "rsh_claim_matrix" ? (
          <ResearchClaimMatrixSurface
            locale={locale}
            state={researchState}
            onAcknowledge={(claimId) => send({ type: "claim/acknowledge", claimId, at: now() })}
            onResolve={(claimId) => send({ type: "claim/resolve", claimId, at: now() })}
            onContinue={() => send({ type: "claims/continue", at: now() })}
            onOpenInspector={(evidenceId) => send({ type: "inspector/open", evidenceId })}
          />
        ) : null}
        {stage === "rsh_report_edit" ? (
          <ResearchReportEditSurface
            locale={locale}
            state={researchState}
            onEditSection={(sectionId, body) => send({ type: "report/edit-section", sectionId, body })}
            onReviewSection={(sectionId) => send({ type: "report/review-section", sectionId })}
            onComplete={() => send({ type: "report/complete", at: now() })}
          />
        ) : null}
        {stage === "rsh_complete" ? (
          <ResearchCompleteSurface
            locale={locale}
            onSave={() => {
              actions.saveDemo();
              send({ type: "report/save" });
            }}
            onHandoff={() => actions.previewHandoff(handoffBundle)}
          />
        ) : null}
      </div>

      <ResearchCitationInspector
        locale={locale}
        state={researchState}
        onClose={() => send({ type: "inspector/close" })}
      />
    </ServiceProductShell>
  );
}

export { buildResearchEvidenceRefs };
export type { ResearchReducerState };
