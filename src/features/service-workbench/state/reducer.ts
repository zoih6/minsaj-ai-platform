import type {
  HandoffBundle,
  ServiceArtifact,
  ServiceArtifactVersion,
  ServiceEvent,
  ServiceRun,
  ServiceSession,
  ServiceStage,
  SimulationReceipt,
} from "@minsaj/contracts/services";
import { applyServiceEvent, consumeHandoff, type ServiceEventApplication } from "@minsaj/contracts/services";
import type { ServiceDomainBlock, ServiceStoreStatus } from "../storage/store";

/**
 * Domain-neutral workbench reducer.
 *
 * It keeps the run/stage lifecycle honest: interface state only advances when a
 * known simulator event arrives, duplicates and gaps are surfaced instead of
 * ignored, and terminal runs never restart.
 */

export const serviceWorkbenchEventLogLimit = 40;

export type ServiceWorkbenchOverlays = {
  receipt: boolean;
  storage: boolean;
  handoff: string | null;
};

export type ServiceWorkbenchState = {
  session: ServiceSession;
  stages: ServiceStage[];
  run: ServiceRun | null;
  artifacts: ServiceArtifact[];
  artifactVersions: ServiceArtifactVersion[];
  receipts: SimulationReceipt[];
  handoffs: HandoffBundle[];
  /** Opaque, versioned domain state owned by each service slice. */
  domains: ServiceDomainBlock[];
  lastSequence: number;
  lastOutcome: ServiceEventApplication["outcome"] | null;
  eventLog: ServiceEvent[];
  storageStatus: ServiceStoreStatus;
  savedAt: string | null;
  noticeKey: string | null;
  validationKey: string | null;
  overlays: ServiceWorkbenchOverlays;
};

export type ServiceWorkbenchAction =
  | { type: "session/replaced"; session: ServiceSession; stages: ServiceStage[] }
  | { type: "run/started"; run: ServiceRun }
  | { type: "event/received"; event: ServiceEvent }
  | { type: "records/attached"; artifact?: ServiceArtifact; version?: ServiceArtifactVersion; receipt?: SimulationReceipt }
  | { type: "domain/replaced"; block: ServiceDomainBlock }
  | {
      type: "records/restored";
      session?: ServiceSession;
      artifacts?: readonly ServiceArtifact[];
      artifactVersions?: readonly ServiceArtifactVersion[];
      receipts?: readonly SimulationReceipt[];
      handoffs?: readonly HandoffBundle[];
      domains?: readonly ServiceDomainBlock[];
      savedAt: string;
      storageStatus?: ServiceStoreStatus;
    }
  | { type: "storage/status"; status: ServiceStoreStatus; savedAt?: string | null }
  | { type: "notice/set"; key: string | null }
  | { type: "validation/set"; key: string | null }
  | { type: "overlay/toggle"; overlay: keyof ServiceWorkbenchOverlays; value: boolean | string | null }
  | { type: "handoff/previewed"; bundle: HandoffBundle }
  | { type: "handoff/confirmed"; handoffId: string; at: string }
  | { type: "handoff/consumed"; handoffId: string; at: string };

export type ServiceWorkbenchSeed = {
  storageStatus?: ServiceStoreStatus;
  savedAt?: string | null;
  artifacts?: readonly ServiceArtifact[];
  artifactVersions?: readonly ServiceArtifactVersion[];
  receipts?: readonly SimulationReceipt[];
  handoffs?: readonly HandoffBundle[];
  domains?: readonly ServiceDomainBlock[];
};

export function createInitialWorkbenchState(
  session: ServiceSession,
  stages: ServiceStage[],
  options: ServiceWorkbenchSeed = {},
): ServiceWorkbenchState {
  return {
    session,
    stages,
    run: null,
    artifacts: [...(options.artifacts ?? [])],
    artifactVersions: [...(options.artifactVersions ?? [])],
    receipts: [...(options.receipts ?? [])],
    handoffs: [...(options.handoffs ?? [])],
    domains: [...(options.domains ?? [])],
    lastSequence: 0,
    lastOutcome: null,
    eventLog: [],
    storageStatus: options.storageStatus ?? session.storage,
    savedAt: options.savedAt ?? null,
    noticeKey: null,
    validationKey: null,
    overlays: { receipt: false, storage: false, handoff: null },
  };
}

export function serviceWorkbenchReducer(state: ServiceWorkbenchState, action: ServiceWorkbenchAction): ServiceWorkbenchState {
  switch (action.type) {
    case "session/replaced":
      return createInitialWorkbenchState(action.session, action.stages, {
        storageStatus: state.storageStatus,
        savedAt: state.savedAt,
        artifacts: state.artifacts,
        artifactVersions: state.artifactVersions,
        receipts: state.receipts,
        handoffs: state.handoffs,
      });

    case "run/started":
      return {
        ...state,
        run: action.run,
        lastSequence: 0,
        lastOutcome: null,
        validationKey: null,
        noticeKey: null,
      };

    case "event/received": {
      if (state.run === null) {
        return { ...state, lastOutcome: "ignored", eventLog: pushLog(state.eventLog, action.event) };
      }
      const application = applyServiceEvent({
        run: state.run,
        stages: state.stages,
        lastSequence: state.lastSequence,
        event: action.event,
      });

      const nextStageId = application.stages.find((stage) => stage.status === "active")?.id ?? state.session.currentStageId;

      return {
        ...state,
        run: application.run,
        stages: application.stages,
        lastSequence: Math.max(state.lastSequence, application.lastSequence),
        lastOutcome: application.outcome,
        eventLog: pushLog(state.eventLog, action.event),
        session: { ...state.session, currentStageId: nextStageId, status: application.run.status === "running" ? "active" : state.session.status },
        noticeKey: noticeKeyForOutcome(application.outcome) ?? state.noticeKey,
      };
    }

    case "records/attached": {
      const artifacts = action.artifact && !state.artifacts.some((item) => item.id === action.artifact?.id)
        ? [...state.artifacts, action.artifact]
        : state.artifacts;
      const artifactVersions = action.version ? [...state.artifactVersions, action.version] : state.artifactVersions;
      const receipts = action.receipt ? [...state.receipts, action.receipt] : state.receipts;
      const run = state.run && action.artifact
        ? { ...state.run, artifactIds: [...new Set([...state.run.artifactIds, action.artifact.id])] }
        : state.run;
      const session = action.artifact
        ? { ...state.session, artifactIds: [...new Set([...state.session.artifactIds, action.artifact.id])] }
        : state.session;
      return { ...state, artifacts, artifactVersions, receipts, run, session };
    }

    case "records/restored": {
      // A single, explicit restore so no surface re-derives saved data itself.
      return {
        ...state,
        session: action.session ?? state.session,
        artifacts: [...(action.artifacts ?? state.artifacts)],
        artifactVersions: [...(action.artifactVersions ?? state.artifactVersions)],
        receipts: [...(action.receipts ?? state.receipts)],
        handoffs: [...(action.handoffs ?? state.handoffs)],
        domains: [...(action.domains ?? state.domains)],
        savedAt: action.savedAt,
        storageStatus: action.storageStatus ?? state.storageStatus,
      };
    }

    case "domain/replaced": {
      const domains = [...state.domains.filter((block) => block.serviceId !== action.block.serviceId), action.block];
      return { ...state, domains };
    }
    case "storage/status":
      return { ...state, storageStatus: action.status, savedAt: action.savedAt === undefined ? state.savedAt : action.savedAt };

    case "notice/set":
      return { ...state, noticeKey: action.key };

    case "validation/set":
      return { ...state, validationKey: action.key };

    case "overlay/toggle": {
      const value = action.value;
      if (action.overlay === "handoff") {
        return { ...state, overlays: { ...state.overlays, handoff: typeof value === "string" ? value : null } };
      }
      return { ...state, overlays: { ...state.overlays, [action.overlay]: value === true } };
    }

    case "handoff/previewed":
      return { ...state, handoffs: [...state.handoffs.filter((item) => item.id !== action.bundle.id), action.bundle] };

    case "handoff/confirmed":
      return {
        ...state,
        handoffs: state.handoffs.map((bundle) =>
          bundle.id === action.handoffId && bundle.status === "preview"
            ? { ...bundle, status: "confirmed", confirmedAt: action.at }
            : bundle),
      };

    case "handoff/consumed":
      return {
        ...state,
        handoffs: state.handoffs.map((bundle) =>
          bundle.id === action.handoffId ? consumeHandoff(bundle, action.at) : bundle),
      };

    default:
      return state;
  }
}

function pushLog(log: readonly ServiceEvent[], event: ServiceEvent): ServiceEvent[] {
  const next = [...log, event];
  return next.length > serviceWorkbenchEventLogLimit ? next.slice(next.length - serviceWorkbenchEventLogLimit) : next;
}

/** Notice keys resolve through `dictionary.workbench.notices` in both languages. */
export type WorkbenchNoticeKey = "duplicate" | "gap" | "staleRun";

function noticeKeyForOutcome(outcome: ServiceEventApplication["outcome"]): string | null {
  if (outcome === "duplicate") return "duplicate";
  if (outcome === "gap") return "gap";
  if (outcome === "stale_run") return "staleRun";
  return null;
}

export function selectActiveStage(state: ServiceWorkbenchState): ServiceStage | undefined {
  return state.stages.find((stage) => stage.status === "active");
}

export function selectCurrentReceipt(state: ServiceWorkbenchState): SimulationReceipt | undefined {
  const run = state.run;
  if (run === null) return state.receipts[state.receipts.length - 1];
  return state.receipts.find((receipt) => receipt.runId === run.id) ?? state.receipts[state.receipts.length - 1];
}

export function selectPrimaryArtifact(state: ServiceWorkbenchState): ServiceArtifact | undefined {
  return state.artifacts[state.artifacts.length - 1];
}

export function selectPendingHandoff(state: ServiceWorkbenchState): HandoffBundle | undefined {
  return state.handoffs.find((bundle) => bundle.id === state.overlays.handoff);
}
