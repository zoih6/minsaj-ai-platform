import type { ResearchPlan, ResearchSourceRecord } from "@nasaq/contracts/services";
import type { ServiceEvidenceRef } from "@nasaq/contracts/services";
import { getDenseResearchSources, getResearchTopic, type ResearchTopicId } from "./topics";

/**
 * Research source records and coverage rules — U2.2.
 *
 * Source records are fixture-derived state: built once from the topic pack,
 * then mutated only by the user's exclude/restore acts. Every rule below is
 * deterministic and documented:
 *
 * 1. a source is built from the topic fixture with its type, known date,
 *    availability, relevance, and display-only URL;
 * 2. the plan's source types decide eligibility; relevance ≥ 1 decides
 *    relevance for the research, so "zero relevant sources" is derivable;
 * 3. excluding a source never deletes it: the record stays with `excluded`
 *    and an `excludedAt` stamp, so the act is reversible and auditable;
 * 4. excluding a source removes its evidence from every claim's resolvable
 *    set and from every report section's citations — an orphaned citation is
 *    impossible because the removal is computed, not left to the UI.
 */

export function buildResearchSourceRecords(topicId: ResearchTopicId, options?: { dense?: boolean }): ResearchSourceRecord[] {
  const pack = options?.dense ? getDenseResearchSources(topicId) : getResearchTopic(topicId).sources;
  return pack.map((source) => ({
    id: source.id,
    topicId,
    titleKey: `services.research.sources.${source.id}.title`,
    sourceType: source.sourceType,
    publishedAt: source.publishedAt,
    origin: "seeded_fixture" as const,
    availability: source.availability,
    relevance: source.relevance,
    url: source.url,
    excluded: false,
    excludedAt: null,
  }));
}

/** Plan-eligible, relevant, non-excluded sources — the active coverage set. */
export function activeResearchSources(sources: readonly ResearchSourceRecord[], plan: ResearchPlan): readonly ResearchSourceRecord[] {
  return sources.filter(
    (source) => !source.excluded && source.relevance >= 1 && plan.sourceTypes.includes(source.sourceType),
  );
}

export type ResearchExclusionImpact = {
  readonly sourceId: string;
  /** Claims whose resolvable evidence changes when the exclusion applies. */
  readonly affectedClaimIds: readonly string[];
  /** Evidence refs that would stop being citable (no orphans may remain). */
  readonly orphanedEvidenceIds: readonly string[];
};

/**
 * Computes what a source exclusion would change, before anything is adopted.
 * The surface shows this list to the user first (U2-RSH-008: affected claims
 * are visible before the change is applied).
 */
export function previewSourceExclusion(
  sourceId: string,
  claims: readonly { id: string; evidenceIds: readonly string[] }[],
  evidence: readonly ServiceEvidenceRef[],
  availableEvidenceIds: readonly string[],
): ResearchExclusionImpact {
  const evidenceOfSource = evidence.filter((item) => item.sourceId === sourceId);
  const evidenceIds = new Set(evidenceOfSource.map((item) => item.id));
  const affectedClaimIds = claims
    .filter((claim) => claim.evidenceIds.some((id) => evidenceIds.has(id)))
    .map((claim) => claim.id);
  const available = new Set(availableEvidenceIds);
  const orphanedEvidenceIds = evidenceOfSource
    .filter((item) => available.has(item.id))
    .map((item) => item.id);
  return { sourceId, affectedClaimIds, orphanedEvidenceIds };
}

/** Applies an exclusion: records it and returns updated sources. */
export function applySourceExclusion(
  sources: readonly ResearchSourceRecord[],
  sourceId: string,
  at: string,
): ResearchSourceRecord[] {
  return sources.map((source) =>
    source.id === sourceId && !source.excluded
      ? { ...source, excluded: true, excludedAt: at }
      : source,
  );
}

export function restoreResearchSource(sources: readonly ResearchSourceRecord[], sourceId: string): ResearchSourceRecord[] {
  return sources.map((source) =>
    source.id === sourceId && source.excluded
      ? { ...source, excluded: false, excludedAt: null }
      : source,
  );
}

/**
 * Filters a dense source list for display. Deterministic and bounded: the
 * filters compose as predicates over record fields, never over wall clock.
 */
export type ResearchSourceFilter = {
  readonly kind: "all" | "relevant_only" | "unavailable" | "with_url";
};

export function filterResearchSources(
  sources: readonly ResearchSourceRecord[],
  filter: ResearchSourceFilter,
): readonly ResearchSourceRecord[] {
  switch (filter.kind) {
    case "relevant_only":
      return sources.filter((source) => source.relevance >= 1 && !source.excluded);
    case "unavailable":
      return sources.filter((source) => source.availability === "unavailable");
    case "with_url":
      return sources.filter((source) => source.url !== null);
    case "all":
    default:
      return sources;
  }
}

/** Evidence IDs discovered by the completed activity: eligible + relevant. */
export function discoveredEvidenceIds(
  sources: readonly ResearchSourceRecord[],
  plan: ResearchPlan,
  evidence: readonly ServiceEvidenceRef[],
): readonly string[] {
  const active = new Set(activeResearchSources(sources, plan).map((source) => source.id));
  return evidence.filter((item) => active.has(item.sourceId)).map((item) => item.id);
}
