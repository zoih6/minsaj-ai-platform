import type { ResearchClaimState, ResearchSessionState } from "@nasaq/contracts/services";
import { summarizeClaimCoverage } from "@nasaq/contracts/services";
import type { ServiceClaim, ServiceEvidenceRef } from "@nasaq/contracts/services";
import { buildResearchEvidenceRefs, getResearchTopic, type ResearchTopicId } from "./topics";

/**
 * Research claim-matrix rules — U2.2.
 *
 * The support verdict is always derived, never stored, so excluding a source
 * or discovering evidence recomputes the matrix deterministically:
 *
 * 1. a claim's resolvable evidence = its evidenceIds ∩ discovered evidence,
 *    minus evidence whose source is excluded;
 * 2. counts of `supports` / `contradicts` / `context` stances over that set:
 *    - no resolvable evidence → `unsupported`;
 *    - at least one `supports` and one `contradicts` → `conflicted`;
 *    - at least one `supports`, no `contradicts` → `supported`;
 *    - no `supports`, no `contradicts`, some `context` → `partially_supported`;
 * 3. evidence from an `unavailable` source stays usable but flagged: its
 *    locator cannot be verified in this session (the citation inspector says
 *    so explicitly);
 * 4. an unsupported or conflicted claim blocks report completion until the
 *    user acknowledges its limits or asks for more evidence (which the
 *    simulator answers from the same fixture, never from the web).
 */

export type ClaimSupport = "supported" | "partially_supported" | "conflicted" | "unsupported";

export type ResearchClaimVerdict = {
  readonly claimId: string;
  readonly support: ClaimSupport;
  readonly supportsCount: number;
  readonly contradictsCount: number;
  readonly contextCount: number;
  readonly evidenceIds: readonly string[];
  /** Evidence whose source is unavailable: usable but locator-unverifiable. */
  readonly unverifiableEvidenceIds: readonly string[];
};

export function computeClaimVerdicts(
  claims: readonly ResearchClaimState[],
  evidence: readonly ServiceEvidenceRef[],
  availableEvidenceIds: readonly string[],
  excludedSourceIds: readonly string[],
): ResearchClaimVerdict[] {
  const available = new Set(availableEvidenceIds);
  const excluded = new Set(excludedSourceIds);
  const byId = new Map(evidence.map((item) => [item.id, item]));
  const availabilityById = new Map(evidence.map((item) => [item.id, item.availability]));

  return claims.map((claim) => {
    const resolvable = claim.evidenceIds.filter((id) => {
      const item = byId.get(id);
      return item !== undefined && available.has(id) && !excluded.has(item.sourceId);
    });
    let supportsCount = 0;
    let contradictsCount = 0;
    let contextCount = 0;
    const unverifiableEvidenceIds: string[] = [];
    for (const id of resolvable) {
      const item = byId.get(id);
      if (item === undefined) continue;
      if (item.stance === "supports") supportsCount += 1;
      if (item.stance === "contradicts") contradictsCount += 1;
      if (item.stance === "context") contextCount += 1;
      if (availabilityById.get(id) === "unavailable") unverifiableEvidenceIds.push(id);
    }

    let support: ClaimSupport;
    if (resolvable.length === 0) {
      support = "unsupported";
    } else if (supportsCount > 0 && contradictsCount > 0) {
      support = "conflicted";
    } else if (supportsCount > 0) {
      support = "supported";
    } else if (contextCount > 0) {
      // Context-only: usable as background, never as a confirmed finding.
      support = "partially_supported";
    } else {
      // Contradiction-only: the claim as stated has no supporting evidence at
      // all, so calling it partially supported would overstate it.
      support = "unsupported";
    }

    return {
      claimId: claim.id,
      support,
      supportsCount,
      contradictsCount,
      contextCount,
      evidenceIds: resolvable,
      unverifiableEvidenceIds,
    };
  });
}

/**
 * Full matrix view for a session: verdicts + the locale-resolved evidence.
 * The matrix reflects the session's live exclusion state; the static fixture
 * invariant is checked separately by `verifyFixtureCoverage`.
 */
export function buildClaimMatrix(session: ResearchSessionState, locale: "ar" | "en") {
  const topicId = session.sources[0]?.topicId;
  const resolvedTopicId: ResearchTopicId = topicId !== undefined && isKnownTopic(topicId) ? topicId : "waiting_time_q3";
  const evidence = buildResearchEvidenceRefs(resolvedTopicId, locale);
  const verdicts = computeClaimVerdicts(
    session.claims,
    evidence,
    session.evidenceIds,
    session.sources.filter((source) => source.excluded).map((source) => source.id),
  );
  return { verdicts, evidence };
}

function isKnownTopic(value: string): value is ResearchTopicId {
  return value === "waiting_time_q3" || value === "zero_match" || value === "remote_onboarding";
}

/**
 * Static fixture invariant check used by UT-RSH-002: with the full pack and
 * nothing excluded, the fixture's own claim/evidence mapping must satisfy the
 * shared contract coverage rules (an unsupported claim holds no evidence, a
 * supported claim holds resolvable evidence, no orphan evidence refs).
 */
export function verifyFixtureCoverage(topicId: ResearchTopicId, locale: "ar" | "en") {
  const topic = getResearchTopic(topicId);
  const evidence = buildResearchEvidenceRefs(topicId, locale);
  const claims: ServiceClaim[] = topic.claims.map((claim) => {
    const resolvable = claim.evidenceIds.filter((id) => evidence.some((item) => item.id === id));
    let support: "supported" | "partially_supported" | "conflicted" | "unsupported" = "unsupported";
    const stances = claim.evidenceIds
      .map((id) => evidence.find((item) => item.id === id)?.stance)
      .filter((stance): stance is "supports" | "contradicts" | "context" => stance !== undefined);
    if (resolvable.length === 0) support = "unsupported";
    else if (stances.includes("supports") && stances.includes("contradicts")) support = "conflicted";
    else if (stances.includes("supports")) support = "supported";
    else support = "partially_supported";
    return { id: claim.id, statement: claim.statementKey, support, evidenceIds: [...claim.evidenceIds] };
  });
  return summarizeClaimCoverage(claims, evidence);
}

/** Static claim states copied from the topic fixture into session state. */
export function buildResearchTopicClaims(topicId: ResearchTopicId): ResearchClaimState[] {
  const topic = getResearchTopic(topicId);
  return topic.claims.map((claim) => ({
    id: claim.id,
    statementKey: claim.statementKey,
    evidenceIds: [...claim.evidenceIds],
    resolution: "open" as const,
  }));
}
