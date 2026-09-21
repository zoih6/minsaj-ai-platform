/**
 * Local analytics boundary for U2.
 *
 * There is no external telemetry in this prototype: the default sink discards
 * every event. The interface exists so a later milestone can add an approved
 * exporter without changing call sites, and the allowlist guarantees that no
 * prompt, source excerpt, code, file name, or user text can ever travel with an
 * event.
 */

export const analyticsEventAllowlist = [
  "u2.session.started",
  "u2.session.mode_changed",
  "u2.run.started",
  "u2.run.cancelled",
  "u2.run.retried",
  "u2.run.rejected",
  "u2.artifact.saved",
  "u2.receipt.opened",
  "u2.storage.cleared",
  "u2.handoff.previewed",
  "u2.handoff.confirmed",
] as const;

export type AnalyticsEventName = (typeof analyticsEventAllowlist)[number];

export const analyticsPropertyAllowlist = ["serviceId", "scenarioId", "locale", "status", "stageKey", "storageMode"] as const;

export type AnalyticsPropertyKey = (typeof analyticsPropertyAllowlist)[number];
export type AnalyticsProperties = Partial<Record<AnalyticsPropertyKey, string>>;

export type AnalyticsRecord = {
  name: AnalyticsEventName;
  properties: AnalyticsProperties;
  recordedAt: string;
};

export type LocalAnalytics = {
  track(name: string, properties: Record<string, unknown>): { accepted: boolean; rejectedKeys: readonly string[] };
  records(): readonly AnalyticsRecord[];
  clear(): void;
};

const SAFE_VALUE = /^[a-z0-9_\-.]{1,40}$/u;

export function createLocalAnalytics(options: { now?: () => number } = {}): LocalAnalytics {
  const now = options.now ?? (() => Date.now());
  const log: AnalyticsRecord[] = [];

  return {
    track(name, properties) {
      const rejectedKeys: string[] = [];
      const accepted = (analyticsEventAllowlist as readonly string[]).includes(name);
      const safe: AnalyticsProperties = {};

      for (const [key, value] of Object.entries(properties)) {
        if (!(analyticsPropertyAllowlist as readonly string[]).includes(key)) {
          rejectedKeys.push(key);
          continue;
        }
        if (typeof value !== "string" || !SAFE_VALUE.test(value)) {
          // Anything that looks like free text, a URL, or content is dropped.
          rejectedKeys.push(key);
          continue;
        }
        safe[key as AnalyticsPropertyKey] = value;
      }

      if (accepted) {
        log.push({ name: name as AnalyticsEventName, properties: safe, recordedAt: new Date(now()).toISOString() });
      }
      return { accepted, rejectedKeys };
    },
    records: () => [...log],
    clear() {
      log.length = 0;
    },
  };
}

/** Default sink: records nothing outside the current page session. */
export const noopAnalyticsSink = {
  send: () => {
    // Intentional no-op. U2 sends no analytics to any external service.
  },
};
