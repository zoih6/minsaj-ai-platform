import { z } from "zod";

/**
 * U2 Service identifiers. Prefixes are fixed by the U2 contract section 7.1 so
 * fixtures, receipts, and evidence remain traceable without a database.
 */

function prefixedServiceId(prefix: string) {
  return z.string().regex(new RegExp(`^${prefix}[a-z0-9][a-z0-9_]{0,63}$`));
}

export const serviceSessionIdSchema = prefixedServiceId("ssn_");
export type ServiceSessionId = z.infer<typeof serviceSessionIdSchema>;

export const serviceRunIdSchema = prefixedServiceId("run_");
export type ServiceRunId = z.infer<typeof serviceRunIdSchema>;

export const serviceStageIdSchema = prefixedServiceId("stg_");
export type ServiceStageId = z.infer<typeof serviceStageIdSchema>;

export const serviceArtifactIdSchema = prefixedServiceId("art_");
export type ServiceArtifactId = z.infer<typeof serviceArtifactIdSchema>;

export const serviceArtifactVersionIdSchema = prefixedServiceId("av_");
export type ServiceArtifactVersionId = z.infer<typeof serviceArtifactVersionIdSchema>;

export const serviceEvidenceIdSchema = prefixedServiceId("evd_");
export type ServiceEvidenceId = z.infer<typeof serviceEvidenceIdSchema>;

export const serviceReceiptIdSchema = prefixedServiceId("sim_");
export type ServiceReceiptId = z.infer<typeof serviceReceiptIdSchema>;

export const serviceHandoffIdSchema = prefixedServiceId("hnd_");
export type ServiceHandoffId = z.infer<typeof serviceHandoffIdSchema>;

export const serviceDatasetFixtureIdSchema = prefixedServiceId("dset_");
export type ServiceDatasetFixtureId = z.infer<typeof serviceDatasetFixtureIdSchema>;

export const serviceCodeProjectFixtureIdSchema = prefixedServiceId("cprj_");
export type ServiceCodeProjectFixtureId = z.infer<typeof serviceCodeProjectFixtureIdSchema>;

export const serviceKnowledgeNodeIdSchema = prefixedServiceId("kn_");
export type ServiceKnowledgeNodeId = z.infer<typeof serviceKnowledgeNodeIdSchema>;

export const serviceSourceIdSchema = prefixedServiceId("src_");
export type ServiceSourceId = z.infer<typeof serviceSourceIdSchema>;

export const serviceClaimIdSchema = prefixedServiceId("clm_");
export type ServiceClaimId = z.infer<typeof serviceClaimIdSchema>;

export const serviceEventIdSchema = prefixedServiceId("evt_");
export type ServiceEventId = z.infer<typeof serviceEventIdSchema>;

export const serviceStreamIdSchema = prefixedServiceId("str_");
export type ServiceStreamId = z.infer<typeof serviceStreamIdSchema>;

/** ISO-8601 UTC timestamp used by every U2 record. */
export const serviceTimestampSchema = z.iso.datetime();
export type ServiceTimestamp = z.infer<typeof serviceTimestampSchema>;
