import type { Locale, ServiceEvent, ServiceId, ServiceRunStatus, ServiceScenarioId } from "@minsaj/contracts/services";
import { getServiceStageBlueprints, isTerminalServiceRunStatus } from "@minsaj/contracts/services";
import { createServiceIdFactory, type ServiceIdFactory } from "./ids";
import { createManualServiceClock, toServiceTimestamp, type ServiceClock } from "./clock";
import { buildServiceScenarioPlan, type ServiceEventDraft, type ServiceScenarioPlan } from "./plans";

/**
 * Deterministic playback of a scenario plan.
 *
 * The runner only ever emits events that exist in the plan, plus the two
 * declared cancel steps. Every emitted event carries a continuous sequence, so
 * a consumer can detect duplicates and gaps. Success is never derived from
 * elapsed time, and nothing here is random.
 */

export type ServiceSimulationRunnerOptions = {
  serviceId: ServiceId;
  scenarioId: ServiceScenarioId;
  locale: Locale;
  clock?: ServiceClock;
  ids?: ServiceIdFactory;
  sessionId?: string;
  runId?: string;
  streamId?: string;
  startAt?: number;
  stepMs?: number;
  /** Set when the runner replays a retry attempt of a previous run. */
  retryOf?: string;
  onEvent: (event: ServiceEvent) => void;
};

export type ServiceSimulationRunner = {
  readonly plan: ServiceScenarioPlan;
  readonly streamId: string;
  readonly runId: string;
  readonly sessionId: string;
  start(): void;
  cancel(reasonCode?: string): void;
  provideInput(): void;
  isActive(): boolean;
  isCancelRequested(): boolean;
  terminalStatus(): ServiceRunStatus | "needs_input" | "cancelled" | null;
  lastSequence(): number;
  dispose(): void;
};

export function createServiceSimulationRunner(options: ServiceSimulationRunnerOptions): ServiceSimulationRunner {
  const clock = options.clock ?? createManualServiceClock(options.startAt);
  const ids = options.ids ?? createServiceIdFactory(`${options.serviceId}_${options.scenarioId}_${options.locale}`);
  const startAt = options.startAt ?? clock.now();
  const stepMs = options.stepMs ?? 120;
  const sessionId = options.sessionId ?? ids.next("ssn_");
  const runId = options.runId ?? ids.next("run_");
  const streamId = options.streamId ?? ids.next("str_");

  const plan = buildServiceScenarioPlan({
    serviceId: options.serviceId,
    scenarioId: options.scenarioId,
    locale: options.locale,
    sessionId,
    runId,
    streamId,
    ids,
    startAt,
    stepMs,
    ...(options.retryOf === undefined ? {} : { retryOf: options.retryOf }),
  });

  let sequence = 0;
  let timer: { cancel(): void } | null = null;
  let disposed = false;
  let active = false;
  let cancelFlag = false;
  let terminal: ServiceRunStatus | "needs_input" | "cancelled" | null = null;
  let cursor = 0;

  function statusDraft(status: ServiceRunStatus, reasonCode: string): ServiceEventDraft {
    return { name: "service.run.status_changed", payload: { runId, status, reasonCode } };
  }

  function stageDraft(stageId: string, index: number): ServiceEventDraft {
    return { name: "service.stage.started", payload: { runId, stageId, index } };
  }

  function emit(draft: ServiceEventDraft) {
    if (disposed) return;
    sequence += 1;
    const event = {
      ...draft,
      eventId: ids.next("evt_"),
      streamId,
      sequence,
      occurredAt: toServiceTimestamp(clock.now()),
    } as ServiceEvent;
    options.onEvent(event);
  }

  function stopTimer() {
    timer?.cancel();
    timer = null;
  }

  function scheduleNext(delayMs: number, run: () => void) {
    stopTimer();
    timer = clock.schedule(delayMs, () => {
      timer = null;
      run();
    });
  }

  function finish() {
    stopTimer();
    active = false;
  }

  function playNext() {
    if (disposed || !active) return;
    const event = plan.events[cursor];
    if (event === undefined) {
      terminal = terminal ?? "completed";
      finish();
      return;
    }
    cursor += 1;
    emit(event as ServiceEventDraft);

    // A cancel requested from inside this event's handler must win the race: the
    // queued playback stops here and the declared cancel step remains scheduled.
    if (cancelFlag) return;

    if (event.name === "service.run.status_changed") {
      if (event.payload.status === "needs_input") {
        // The run waits for the user; nothing advances on a timer.
        finish();
        terminal = "needs_input";
        return;
      }
      if (isTerminalServiceRunStatus(event.payload.status)) {
        finish();
        terminal = event.payload.status;
        return;
      }
    }
    scheduleNext(stepMs, playNext);
  }

  return {
    plan,
    streamId,
    runId,
    sessionId,
    start() {
      if (disposed || active || terminal !== null) return;
      active = true;
      cursor = 0;
      cancelFlag = false;
      playNext();
    },
    cancel(reasonCode = "user_cancelled") {
      if (disposed || cancelFlag || terminal !== null) return;
      if (plan.expectedTerminalStatus === "none" || plan.expectedTerminalStatus === "needs_input") return;
      cancelFlag = true;
      stopTimer();
      active = false;

      // Step 1: the request. This is not cancellation.
      emit(statusDraft("cancel_requested", reasonCode));
      // Step 2: the declared terminal step. Any completion still queued in the
      // plan is dropped, so the race resolves to exactly one terminal state.
      cursor = plan.events.length;
      active = true;
      scheduleNext(stepMs, () => {
        emit(statusDraft("cancelled", "cancel_confirmed"));
        finish();
        terminal = "cancelled";
      });
    },
    provideInput() {
      if (disposed || terminal !== "needs_input") return;
      const stageKeys = getServiceStageBlueprints(options.serviceId).map((stage) => stage.key);
      emit(statusDraft("validating", "input_provided"));
      emit(statusDraft("queued", "input_provided"));
      emit(statusDraft("running", "input_provided"));
      stageKeys.forEach((key, index) => {
        emit(stageDraft(`stg_${key}`, index));
      });
      emit(statusDraft("review_ready", "review_ready"));
      emit(statusDraft("completed", "completed"));
      finish();
      terminal = "completed";
    },
    isActive: () => active,
    isCancelRequested: () => cancelFlag,
    terminalStatus: () => terminal,
    lastSequence: () => sequence,
    dispose() {
      disposed = true;
      stopTimer();
      active = false;
    },
  };
}
