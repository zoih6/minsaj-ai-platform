import type { Locale, ServiceEvent, ServiceId, ServiceRunStatus, ServiceScenarioId } from "@minsaj/contracts/services";
import { getServiceStageBlueprints } from "@minsaj/contracts/services";
import type { ServiceArtifactKind } from "@minsaj/contracts/services";
import type { ServiceIdFactory } from "./ids";
import { toServiceTimestamp } from "./clock";

/**
 * Deterministic scenario plans.
 *
 * A plan is a pure, ordered list of typed events with logical delays. The same
 * (service, scenario, locale, ids, start time) always produces the same event
 * list, so tests assert on events and the interface only plays them back.
 */

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ServiceEventDraft = DistributiveOmit<ServiceEvent, "eventId" | "streamId" | "sequence" | "occurredAt">;

export type ServiceScenarioPlanOptions = {
  serviceId: ServiceId;
  scenarioId: ServiceScenarioId;
  locale: Locale;
  sessionId: string;
  runId: string;
  streamId: string;
  ids: ServiceIdFactory;
  startAt: number;
  /** Logical delay between two plan events. */
  stepMs?: number;
  retryOf?: string;
};

export type ServiceScenarioTerminal = ServiceRunStatus | "needs_input" | "none";

export type ServiceScenarioPlan = {
  serviceId: ServiceId;
  scenarioId: ServiceScenarioId;
  locale: Locale;
  events: readonly ServiceEvent[];
  expectedTerminalStatus: ServiceScenarioTerminal;
  artifactKind: ServiceArtifactKind;
  /** Scenario identifiers a reviewer can grep for in fixtures and evidence. */
  fixtureIds: readonly string[];
};

export const serviceArtifactKinds = {
  learn: "learning_path",
  research: "research_report",
  create: "creative_document",
  code: "code_project",
  analyze: "analysis_report",
  explore: "discovery_trail",
} as const satisfies Record<ServiceId, ServiceArtifactKind>;

/** Scenarios that never start a run because the session itself is the state. */
export const planlessScenarios = ["empty", "storage_failure"] as const satisfies readonly ServiceScenarioId[];

function statusEvent(runId: string, status: ServiceRunStatus, reasonCode: string): ServiceEventDraft {
  return { name: "service.run.status_changed", payload: { runId, status, reasonCode } };
}

function stageEvents(stageKeys: readonly string[], runId: string, stageOf: (key: string) => string): ServiceEventDraft[] {
  const drafts: ServiceEventDraft[] = [];
  stageKeys.forEach((key, index) => {
    drafts.push({ name: "service.stage.started", payload: { runId, stageId: stageOf(key), index } });
    if (index < stageKeys.length - 1) {
      drafts.push({ name: "service.stage.completed", payload: { runId, stageId: stageOf(key), index } });
    }
  });
  return drafts;
}

/**
 * Builds the deterministic event list for one scenario. U2 runs are addressed by
 * a single `streamId`; gaps and duplicates are therefore testable by injecting
 * events into the same stream.
 */
export function buildServiceScenarioPlan(options: ServiceScenarioPlanOptions): ServiceScenarioPlan {
  const stepMs = options.stepMs ?? 120;
  const { serviceId, scenarioId, locale, sessionId, runId, streamId, ids, startAt } = options;
  const stageKeys = getServiceStageBlueprints(serviceId).map((stage) => stage.key);
  const stageOf = (key: string) => `stg_${key}`;
  const artifactKind = serviceArtifactKinds[serviceId];
  const drafts: ServiceEventDraft[] = [];

  drafts.push({
    name: "service.session.created",
    payload: { sessionId, serviceId, locale, mode: "guided" },
  });
  const isPlanless = (planlessScenarios as readonly ServiceScenarioId[]).includes(scenarioId);
  if (!isPlanless) {
    drafts.push({
      name: "service.run.created",
      payload: {
        runId,
        sessionId,
        serviceId,
        scenarioId,
        ...(options.retryOf === undefined ? {} : { retryOf: options.retryOf }),
      },
    });
  }

  let expectedTerminalStatus: ServiceScenarioTerminal = "completed";
  let fixtureIds: string[] = [];

  const sessionUpdated: ServiceEventDraft = {
    name: "service.session.updated",
    payload: { sessionId, status: "saved", currentStageId: stageOf(stageKeys[stageKeys.length - 1] ?? "stage") },
  };

  if ((planlessScenarios as readonly ServiceScenarioId[]).includes(scenarioId)) {
    // `empty` and `storage_failure` never start a run: the session state itself
    // (no artifacts yet, or a rejected demo-store write) is the scenario.
    drafts.push(sessionUpdated);
    expectedTerminalStatus = "none";
    fixtureIds = [`fx_${serviceId}_${scenarioId}_${locale}`];
  } else if (scenarioId === "needs_input") {
    // The run state machine reaches needs_input straight from validating
    // (validating → needs_input → validating); it never passes through queued.
    drafts.push({ name: "service.input.requested", payload: { runId, fieldKey: `${serviceId}_missing_field`, reasonCode: "missing_required_input" } });
    drafts.push(statusEvent(runId, "needs_input", "awaiting_user_input"));
    expectedTerminalStatus = "needs_input";
    fixtureIds = [`fx_${serviceId}_needs_input_${locale}`];
  } else if (scenarioId === "failed_final") {
    drafts.push(statusEvent(runId, "queued", "scenario_queued"));
    drafts.push(statusEvent(runId, "failed_final", "unsupported_request"));
    expectedTerminalStatus = "failed_final";
    fixtureIds = [`fx_${serviceId}_failed_final_${locale}`];
  } else if (scenarioId === "failed_retryable" && options.retryOf === undefined) {
    drafts.push(statusEvent(runId, "queued", "scenario_queued"));
    drafts.push(statusEvent(runId, "running", "scenario_running"));
    drafts.push(statusEvent(runId, "failed_retryable", "simulator_busy"));
    expectedTerminalStatus = "failed_retryable";
    fixtureIds = [`fx_${serviceId}_failed_retryable_${locale}`];
  } else {
    drafts.push(statusEvent(runId, "queued", "scenario_queued"));
    drafts.push(statusEvent(runId, "running", "scenario_running"));
    drafts.push(...stageEvents(stageKeys, runId, stageOf));

    if (scenarioId === "warning") {
      drafts.push({ name: "service.warning.added", payload: { runId, code: "fixture_partial_coverage" } });
      drafts.push(statusEvent(runId, "review_ready", "review_ready"));
      expectedTerminalStatus = "completed_with_warnings";
    } else if (scenarioId === "cancel_race") {
      // The race is resolved by the runner: a cancel requested before the
      // declared terminal step suppresses the completion, so exactly one
      // terminal state is reached. The completion candidate stays in the plan.
      drafts.push(statusEvent(runId, "review_ready", "review_ready"));
      expectedTerminalStatus = "completed";
    } else if (scenarioId === "dense") {
      drafts.push({ name: "service.warning.added", payload: { runId, code: "fixture_dense_input" } });
      drafts.push(statusEvent(runId, "review_ready", "review_ready"));
      expectedTerminalStatus = "completed_with_warnings";
    } else {
      drafts.push(statusEvent(runId, "review_ready", "review_ready"));
      expectedTerminalStatus = "completed";
    }

    // The outcome records are created before the terminal status so a consumer
    // that stops at the terminal event still has the artifact and the receipt.
    const artifactId = ids.next("art_");
    const versionId = ids.next("av_");
    drafts.push({ name: "artifact.created", payload: { artifactId, kind: artifactKind, versionId } });
    drafts.push({
      name: "artifact.version_created",
      payload: { artifactId, versionId, versionNumber: 1, createdBy: "simulator" },
    });
    drafts.push({ name: "artifact.saved", payload: { artifactId, versionId } });
    drafts.push({ name: "simulation.receipt.created", payload: { receiptId: ids.next("sim_"), runId } });

    // The run status is the final event: nothing follows a terminal state, and a
    // consumer that stops there still has every record it needs.
    drafts.push(sessionUpdated);
    if (scenarioId === "warning" || scenarioId === "dense") {
      drafts.push(statusEvent(runId, "completed_with_warnings", "completed_with_warning"));
    } else {
      drafts.push(statusEvent(runId, "completed", "completed"));
    }

    fixtureIds = [`fx_${serviceId}_${scenarioId}_${locale}`, `dset_${serviceId}_${scenarioId}_${locale}`];
    if (serviceId === "research") fixtureIds = [...fixtureIds, `src_${serviceId}_${scenarioId}_${locale}`];
  }

  let sequence = 0;
  const events: ServiceEvent[] = drafts.map((draft, index) => {
    sequence += 1;
    return {
      ...draft,
      eventId: ids.next("evt_"),
      streamId,
      sequence,
      occurredAt: toServiceTimestamp(startAt + index * stepMs),
    } as ServiceEvent;
  });

  return {
    serviceId,
    scenarioId,
    locale,
    events,
    expectedTerminalStatus,
    artifactKind,
    fixtureIds,
  };
}

/** Returns the artifact kind a service produces, used by fixtures and receipts. */
export function artifactKindForService(serviceId: ServiceId): ServiceArtifactKind {
  return serviceArtifactKinds[serviceId];
}
