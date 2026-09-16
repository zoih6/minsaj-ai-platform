import { z } from "zod";
import { serviceClaimIdSchema, serviceEvidenceIdSchema, serviceSourceIdSchema, serviceTimestampSchema } from "./ids";
import {
  serviceEvidenceAvailabilitySchema,
  serviceEvidenceLocatorKindSchema,
  serviceEvidenceOriginSchema,
  serviceEvidenceStanceSchema,
} from "./enums";
import { serviceExternalUrlSchema, serviceLabelSchema, serviceProseSchema } from "./text";

/**
 * EvidenceRef — an inspectable relation between a fixture source, a locator,
 * and the claims it supports or contradicts.
 *
 * A seeded fixture URL is display-only. U2 never retrieves it, and provenance
 * copy must say the source was not fetched in this session.
 */
export const serviceEvidenceRefSchema = z.object({
  id: serviceEvidenceIdSchema,
  sourceId: serviceSourceIdSchema,
  sourceTitle: serviceLabelSchema,
  origin: serviceEvidenceOriginSchema,
  locator: serviceEvidenceLocatorKindSchema,
  locatorValue: serviceLabelSchema,
  excerpt: serviceProseSchema,
  claimIds: z.array(serviceClaimIdSchema).max(12),
  stance: serviceEvidenceStanceSchema,
  availability: serviceEvidenceAvailabilitySchema,
  provenanceLabel: serviceLabelSchema,
  url: serviceExternalUrlSchema.optional(),
  retrievedInSession: z.literal(false),
  publishedAt: serviceTimestampSchema.optional(),
});
export type ServiceEvidenceRef = z.infer<typeof serviceEvidenceRefSchema>;

export const serviceClaimSchema = z.object({
  id: serviceClaimIdSchema,
  statement: serviceProseSchema,
  support: z.enum(["supported", "partially_supported", "conflicted", "unsupported"]),
  evidenceIds: z.array(serviceEvidenceIdSchema).max(12),
});
export type ServiceClaim = z.infer<typeof serviceClaimSchema>;

/**
 * Deterministic coverage check used by tests and by the Research slice:
 * an unsupported claim must have no supporting evidence, and any claim that
 * lists evidence must resolve to existing evidence records.
 */
export function summarizeClaimCoverage(claims: readonly ServiceClaim[], evidence: readonly ServiceEvidenceRef[]) {
  const knownEvidence = new Set(evidence.map((item) => item.id));
  let unsupportedClaims = 0;
  let orphanEvidenceRefs = 0;

  for (const claim of claims) {
    const resolvable = claim.evidenceIds.filter((id) => knownEvidence.has(id));
    if (claim.support === "unsupported" && resolvable.length > 0) {
      throw new Error(`unsupported_claim_has_evidence:${claim.id}`);
    }
    if (claim.support !== "unsupported" && resolvable.length === 0) {
      throw new Error(`claim_without_resolvable_evidence:${claim.id}`);
    }
    if (claim.support === "unsupported") unsupportedClaims += 1;
  }

  for (const item of evidence) {
    if (!claims.some((claim) => claim.evidenceIds.includes(item.id))) orphanEvidenceRefs += 1;
  }

  return { unsupportedClaims, orphanEvidenceRefs, evidenceCount: evidence.length, claimCount: claims.length };
}
