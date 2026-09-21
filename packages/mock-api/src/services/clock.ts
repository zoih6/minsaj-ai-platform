/**
 * Injectable clocks for the U2 deterministic simulator.
 *
 * Production surfaces use the timer clock; tests use the manual clock so no
 * assertion depends on wall-clock time, `Math.random()`, or real waiting.
 */

export type ServiceClockTimer = { cancel(): void };

export type ServiceClock = {
  now(): number;
  schedule(delayMs: number, run: () => void): ServiceClockTimer;
};

export type ManualServiceClock = ServiceClock & {
  advance(ms: number): void;
  pendingCount(): number;
};

const DEFAULT_START = Date.parse("2026-09-12T00:00:00.000Z");

/** Deterministic clock: time only moves when a test calls `advance`. */
export function createManualServiceClock(startAt: number = DEFAULT_START): ManualServiceClock {
  let current = startAt;
  let nextHandle = 1;
  const timers = new Map<number, { at: number; run: () => void }>();

  return {
    now: () => current,
    schedule(delayMs, run) {
      const handle = nextHandle;
      nextHandle += 1;
      timers.set(handle, { at: current + Math.max(0, delayMs), run });
      return { cancel: () => { timers.delete(handle); } };
    },
    advance(ms) {
      const target = current + Math.max(0, ms);
      for (;;) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.at <= target)
          .sort((a, b) => (a[1].at === b[1].at ? a[0] - b[0] : a[1].at - b[1].at));
        const first = due[0];
        if (!first) break;
        timers.delete(first[0]);
        current = first[1].at;
        first[1].run();
      }
      current = target;
    },
    pendingCount: () => timers.size,
  };
}

/** Real timer clock used by interface surfaces. Same interface, real time. */
export function createTimerServiceClock(): ServiceClock {
  return {
    now: () => Date.now(),
    schedule(delayMs, run) {
      const handle = setTimeout(run, Math.max(0, delayMs));
      return { cancel: () => clearTimeout(handle) };
    },
  };
}

export function toServiceTimestamp(epochMs: number): string {
  return new Date(epochMs).toISOString();
}
