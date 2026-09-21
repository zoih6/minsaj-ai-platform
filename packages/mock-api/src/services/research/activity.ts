import type { ResearchActivityEntry, ResearchPlan } from "@minsaj/contracts/services";
import { getResearchTopic, type ResearchTopicId } from "./topics";
import type { ResearchSourceRecord } from "@minsaj/contracts/services";

/**
 * Deterministic source-activity plan — U2.2.
 *
 * The activity log is a played-back fixture, never a live search. The plan is
 * a pure ordered list of steps derived from the approved plan and the source
 * pack:
 *
 * 1. one `query` entry per included axis (the query string is a copy key that
 *    names the axis, not a web-search phrase);
 * 2. one `scan` entry per eligible, relevant, non-excluded source, attached
 *    to the axis that found it (round-robin over included axes);
 * 3. one `extract` entry per evidence ref of the scanned sources;
 * 4. steering inserts a `steer` entry and regenerates the remaining steps:
 *    `narrow_recent` keeps sources published in 2026 only, `widen` adds the
 *    excluded-from-plan source types back as candidate scans;
 * 5. timestamps are logical: base + index × 1s, so replays are identical.
 *
 * Cancellation keeps the played entries, records a `cancelled` entry, and
 * never emits a completion: resuming replays from the recorded cursor.
 */

export type ResearchSteerKey = "narrow_recent" | "widen_types";

const ACTIVITY_BASE_MS = Date.parse("2026-09-12T00:00:00.000Z");

function logicalAt(index: number): string {
  return new Date(ACTIVITY_BASE_MS + index * 1000).toISOString();
}

export type ResearchActivityStep = {
  readonly kind: "query" | "scan" | "extract";
  readonly labelKey: string;
  readonly sourceId: string | null;
  readonly axisId: string | null;
};

export function buildResearchActivitySteps(
  topicId: ResearchTopicId,
  plan: ResearchPlan,
  sources: readonly ResearchSourceRecord[],
  evidence: readonly { id: string; sourceId: string }[],
  steer: { count: number; keys: readonly ResearchSteerKey[] },
): readonly ResearchActivityStep[] {
  const topic = getResearchTopic(topicId);
  const includedAxes = plan.axes.filter((axis) => axis.included);
  const narrowed = steer.keys.includes("narrow_recent");
  const widened = steer.keys.includes("widen_types");

  let eligible = sources.filter(
    (source) => !source.excluded && source.relevance >= 1 && plan.sourceTypes.includes(source.sourceType),
  );
  if (widened) {
    const extraTypes = topic.sources
      .map((source) => source.sourceType)
      .filter((type) => !plan.sourceTypes.includes(type));
    eligible = sources.filter(
      (source) => !source.excluded && source.relevance >= 1 && (plan.sourceTypes.includes(source.sourceType) || extraTypes.includes(source.sourceType)),
    );
  }
  if (narrowed) {
    eligible = eligible.filter((source) => source.publishedAt !== null && source.publishedAt.startsWith("2026"));
  }

  const steps: ResearchActivityStep[] = [];
  const axisCycle = includedAxes.length > 0 ? includedAxes : [{ id: topic.axes[0]?.id ?? "axis_trend" }];

  for (const axis of includedAxes.length > 0 ? includedAxes : axisCycle) {
    steps.push({ kind: "query", labelKey: `services.research.activity.query_${axis.id}`, sourceId: null, axisId: axis.id });
  }
  if (steer.count > 0) {
    steps.push({ kind: "query", labelKey: "services.research.activity.query_revised", sourceId: null, axisId: null });
  }

  eligible.forEach((source, index) => {
    const axis = axisCycle[index % axisCycle.length];
    steps.push({ kind: "scan", labelKey: "services.research.activity.scan_source", sourceId: source.id, axisId: axis?.id ?? null });
  });

  const scannedIds = new Set(eligible.map((source) => source.id));
  for (const item of evidence) {
    if (!scannedIds.has(item.sourceId)) continue;
    steps.push({ kind: "extract", labelKey: "services.research.activity.extract_evidence", sourceId: item.sourceId, axisId: null });
  }

  return steps.slice(0, 120);
}

/** Materializes played entries with logical timestamps. */
export function materializeResearchEntries(
  steps: readonly ResearchActivityStep[],
  played: number,
): readonly ResearchActivityEntry[] {
  return steps.slice(0, played).map((step, index) => ({
    index,
    kind: step.kind,
    labelKey: step.labelKey,
    sourceId: step.sourceId,
    axisId: step.axisId,
    at: logicalAt(index),
  }));
}

export function researchActivityTotal(steps: readonly ResearchActivityStep[]): number {
  return steps.length;
}

/**
 * The receipt summary of one activity run: counts only, no claims about the
 * web. The surface renders this next to the report's limitations.
 */
export function summarizeResearchActivity(entries: readonly ResearchActivityEntry[]) {
  return {
    queries: entries.filter((entry) => entry.kind === "query").length,
    scans: entries.filter((entry) => entry.kind === "scan").length,
    extracts: entries.filter((entry) => entry.kind === "extract").length,
    total: entries.length,
  };
}

/** Materializes one entry at a given log position (logical timestamp). */
export function materializeResearchEntry(step: ResearchActivityStep, logIndex: number): ResearchActivityEntry {
  return {
    index: logIndex,
    kind: step.kind,
    labelKey: step.labelKey,
    sourceId: step.sourceId,
    axisId: step.axisId,
    at: logicalAt(logIndex),
  };
}

/** Builds a marker entry (steer/cancel/resume) at a log position. */
export function researchActivityMarker(kind: "steer" | "cancelled" | "resumed", labelKey: string, logIndex: number): ResearchActivityEntry {
  return {
    index: logIndex,
    kind,
    labelKey,
    sourceId: null,
    axisId: null,
    at: logicalAt(logIndex),
  };
}
