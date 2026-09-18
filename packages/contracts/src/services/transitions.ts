import type { ServiceArtifact, ServiceArtifactStatus } from "./artifacts";
import type {
  ServiceRunStatus,
  ServiceSessionStatus,
} from "./enums";
import type { ServiceArtifactVersionId } from "./ids";
import type { ServiceEvent } from "./events";
import { getEventRunId, isRunScopedEvent } from "./events";
import type { ServiceRun } from "./run";
import type { ServiceStage } from "./stages";

/**
 * Pure lifecycle guards for the U2 Service bounded context.
 *
 * Invariants enforced here (U2 contract section 4 and 8.2):
 * 1. A UI transition never happens because a timeout elapsed; it happens
 *    because a known event arrived.
 * 2. Terminal runs never become active again. A retry creates a new run that
 *    references its predecessor through `retryOf`.
 * 3. `cancel_requested` is not `cancelled`.
 * 4. Duplicate events are ignored, gaps raise recovery, and events addressed to
 *    another run cannot mutate the current run.
 */

export const terminalServiceRunStatuses = [
  "completed",
  "completed_with_warnings",
  "failed_retryable",
  "failed_final",
  "cancelled",
] as const satisfies readonly ServiceRunStatus[];

export function isTerminalServiceRunStatus(status: ServiceRunStatus) {
  return (terminalServiceRunStatuses as readonly ServiceRunStatus[]).includes(status);
}

const serviceRunTransitions = {
  validating: ["needs_input", "queued", "failed_retryable", "failed_final", "cancel_requested"],
  needs_input: ["validating", "failed_final", "cancel_requested"],
  queued: ["running", "failed_retryable", "failed_final", "cancel_requested"],
  running: ["review_ready", "failed_retryable", "failed_final", "cancel_requested"],
  review_ready: ["completed", "completed_with_warnings", "cancel_requested"],
  completed: [],
  completed_with_warnings: [],
  failed_retryable: [],
  failed_final: [],
  cancel_requested: ["cancelled"],
  cancelled: [],
} as const satisfies Record<ServiceRunStatus, readonly ServiceRunStatus[]>;

export function canTransitionServiceRun(from: ServiceRunStatus, to: ServiceRunStatus) {
  return (serviceRunTransitions[from] as readonly ServiceRunStatus[]).includes(to);
}

const serviceSessionTransitions = {
  drafting: ["configured", "archived"],
  configured: ["active", "drafting", "archived"],
  active: ["paused", "saved", "archived"],
  paused: ["active", "saved", "archived"],
  saved: ["active", "archived"],
  archived: [],
} as const satisfies Record<ServiceSessionStatus, readonly ServiceSessionStatus[]>;

export function canTransitionServiceSession(from: ServiceSessionStatus, to: ServiceSessionStatus) {
  return (serviceSessionTransitions[from] as readonly ServiceSessionStatus[]).includes(to);
}

const serviceArtifactTransitions = {
  draft: ["ready_for_review", "editing", "superseded"],
  ready_for_review: ["editing", "saved", "superseded"],
  editing: ["ready_for_review", "saved", "superseded"],
  saved: ["editing", "superseded"],
  superseded: [],
} as const satisfies Record<ServiceArtifactStatus, readonly ServiceArtifactStatus[]>;

export function canTransitionServiceArtifact(from: ServiceArtifactStatus, to: ServiceArtifactStatus) {
  return (serviceArtifactTransitions[from] as readonly ServiceArtifactStatus[]).includes(to);
}

export type ServiceRunTransitionResult =
  | { outcome: "applied"; run: ServiceRun }
  | { outcome: "rejected"; reason: string };

export function transitionServiceRun(
  run: ServiceRun,
  to: ServiceRunStatus,
  at: string,
  reasonCode: string,
): ServiceRunTransitionResult {
  if (isTerminalServiceRunStatus(run.status)) {
    return { outcome: "rejected", reason: `run_terminal:${run.status}` };
  }
  if (!canTransitionServiceRun(run.status, to)) {
    return { outcome: "rejected", reason: `invalid_transition:${run.status}->${to}` };
  }
  if (to === "cancelled" && run.status !== "cancel_requested") {
    return { outcome: "rejected", reason: "cancel_requires_request" };
  }

  const next: ServiceRun = { ...run, status: to, sequence: run.sequence + 1 };
  if (to === "running" && run.startedAt === undefined) next.startedAt = at;
  if (isTerminalServiceRunStatus(to)) next.completedAt = at;
  if (reasonCode.length === 0) return { outcome: "rejected", reason: "missing_reason_code" };
  return { outcome: "applied", run: next };
}

/**
 * Retry guard: a retry never reactivates a terminal run. It produces a new run
 * whose `retryOf` points back at the attempt that failed.
 */
export function createServiceRetryRun(previous: ServiceRun, newRunId: string, scenarioId: ServiceRun["scenarioId"], at: string): ServiceRun {
  if (!isTerminalServiceRunStatus(previous.status)) {
    throw new Error(`retry_requires_terminal_run:${previous.id}`);
  }
  if (previous.status === "completed" || previous.status === "completed_with_warnings") {
    throw new Error(`retry_after_success_not_allowed:${previous.id}`);
  }
  return {
    id: newRunId,
    sessionId: previous.sessionId,
    serviceId: previous.serviceId,
    status: "queued",
    stageId: previous.stageId,
    scenarioId,
    retryOf: previous.id,
    sequence: 0,
    warningCodes: [],
    artifactIds: [],
    simulationReceiptId: previous.simulationReceiptId,
    createdAt: at,
  };
}

export type ServiceEventApplication =
  | { outcome: "applied"; run: ServiceRun; stages: ServiceStage[]; lastSequence: number }
  | { outcome: "duplicate" | "gap" | "stale_run" | "ignored"; run: ServiceRun; stages: ServiceStage[]; lastSequence: number };

export type ServiceEventApplicationInput = {
  run: ServiceRun;
  stages: readonly ServiceStage[];
  lastSequence: number;
  event: ServiceEvent;
};

/**
 * Applies one simulator event to a run view without side effects.
 * - duplicate/gap/stale events return the previous state unchanged;
 * - stage events move stage status deterministically;
 * - status events go through `transitionServiceRun`.
 */
export function applyServiceEvent(input: ServiceEventApplicationInput): ServiceEventApplication {
  const { run, stages, lastSequence, event } = input;

  if (event.sequence <= lastSequence) {
    return { outcome: "duplicate", run, stages: [...stages], lastSequence };
  }

  const eventRunId = getEventRunId(event);
  if (eventRunId !== undefined && eventRunId !== run.id) {
    return { outcome: "stale_run", run, stages: [...stages], lastSequence };
  }

  if (event.sequence > lastSequence + 1) {
    return { outcome: "gap", run, stages: [...stages], lastSequence };
  }

  if (event.name === "service.stage.started" || event.name === "service.stage.completed") {
    const index = event.payload.index;
    const nextStages = stages.map((stage, position) => {
      if (event.name === "service.stage.started") {
        if (position < index) return stage.status === "completed" ? stage : { ...stage, status: "completed" as const };
        if (position === index) return { ...stage, status: "active" as const };
        return { ...stage, status: "pending" as const };
      }
      if (position === index) return { ...stage, status: "completed" as const };
      if (position === index + 1 && stage.status === "pending") return { ...stage, status: "active" as const };
      return stage;
    });
    return {
      outcome: "applied",
      run: { ...run, sequence: run.sequence + 1 },
      stages: nextStages,
      lastSequence: event.sequence,
    };
  }

  if (event.name === "service.run.status_changed") {
    const result = transitionServiceRun(run, event.payload.status, event.occurredAt, event.payload.reasonCode);
    if (result.outcome === "rejected") {
      return { outcome: "ignored", run, stages: [...stages], lastSequence: event.sequence };
    }
    return { outcome: "applied", run: result.run, stages: [...stages], lastSequence: event.sequence };
  }

  if (event.name === "service.warning.added") {
    const warningCodes = run.warningCodes.includes(event.payload.code)
      ? run.warningCodes
      : [...run.warningCodes, event.payload.code];
    return {
      outcome: "applied",
      run: { ...run, warningCodes, sequence: run.sequence + 1 },
      stages: [...stages],
      lastSequence: event.sequence,
    };
  }

  if (event.name === "service.input.requested" || event.name === "service.evidence.added") {
    return {
      outcome: "applied",
      run: { ...run, sequence: run.sequence + 1 },
      stages: [...stages],
      lastSequence: event.sequence,
    };
  }

  if (isRunScopedEvent(event)) {
    return { outcome: "ignored", run, stages: [...stages], lastSequence: event.sequence };
  }

  return { outcome: "ignored", run, stages: [...stages], lastSequence: event.sequence };
}

/** Artifact guard: a saved artifact is never overwritten silently. */
export function transitionServiceArtifact(
  artifact: ServiceArtifact,
  to: ServiceArtifactStatus,
  currentVersionId: ServiceArtifactVersionId,
  at: string,
): ServiceArtifact {
  if (!canTransitionServiceArtifact(artifact.status, to)) {
    throw new Error(`invalid_artifact_transition:${artifact.status}->${to}`);
  }
  if (to === "editing" && artifact.status === "saved" && currentVersionId === artifact.currentVersionId) {
    throw new Error(`saved_artifact_requires_new_version:${artifact.id}`);
  }
  const isNewVersion = currentVersionId !== artifact.currentVersionId;
  return {
    ...artifact,
    status: to,
    currentVersionId,
    versionIds: isNewVersion ? [...artifact.versionIds, currentVersionId] : artifact.versionIds,
    updatedAt: at,
  };
}
