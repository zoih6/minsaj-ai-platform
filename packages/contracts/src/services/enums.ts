import { z } from "zod";

/**
 * U2 Service bounded context — enumerations.
 *
 * Names are deliberately service-scoped (`service*`). They must not be reused,
 * widened, or aliased as Agent/Flow runtime statuses. See
 * docs/05-agent-context/U2-PRODUCT-AGENT-BOUNDARY-ADDENDUM.md.
 */

export const serviceIds = ["learn", "research", "create", "code", "analyze", "explore"] as const;

export const serviceIdSchema = z.enum(serviceIds);
export type ServiceId = z.infer<typeof serviceIdSchema>;

/** Ask & Talk is the general gateway/router, never a seventh domain service. */
export const serviceGatewayIdSchema = z.literal("ask");
export type ServiceGatewayId = z.infer<typeof serviceGatewayIdSchema>;

/** Handoffs may originate from the gateway without a full service session. */
export const serviceHandoffSourceIdSchema = z.enum(["ask", ...serviceIds]);
export type ServiceHandoffSourceId = z.infer<typeof serviceHandoffSourceIdSchema>;

export const serviceModeSchema = z.enum(["guided", "fast"]);
export type ServiceMode = z.infer<typeof serviceModeSchema>;

export const serviceSessionStatuses = ["drafting", "configured", "active", "paused", "saved", "archived"] as const;

export const serviceSessionStatusSchema = z.enum(serviceSessionStatuses);
export type ServiceSessionStatus = z.infer<typeof serviceSessionStatusSchema>;

export const serviceRunStatuses = [
  "validating",
  "needs_input",
  "queued",
  "running",
  "review_ready",
  "completed",
  "completed_with_warnings",
  "failed_retryable",
  "failed_final",
  "cancel_requested",
  "cancelled",
] as const;

export const serviceRunStatusSchema = z.enum(serviceRunStatuses);
export type ServiceRunStatus = z.infer<typeof serviceRunStatusSchema>;

export const serviceStageStatusSchema = z.enum(["pending", "active", "completed", "blocked", "skipped"]);
export type ServiceStageStatus = z.infer<typeof serviceStageStatusSchema>;

/** Generic scenario pack required by the U2 contract, plus bounded service scenarios. */
export const serviceScenarioIdSchema = z.enum([
  "happy",
  "needs_input",
  "warning",
  "failed_retryable",
  "failed_final",
  "cancel_race",
  "empty",
  "dense",
  "rtl_stress",
  "storage_failure",
  "conflicting_evidence",
  "zero_sources",
]);
export type ServiceScenarioId = z.infer<typeof serviceScenarioIdSchema>;

export const genericServiceScenarioIds = [
  "happy",
  "needs_input",
  "warning",
  "failed_retryable",
  "failed_final",
  "cancel_race",
  "empty",
  "dense",
  "rtl_stress",
  "storage_failure",
] as const satisfies readonly ServiceScenarioId[];

export const serviceArtifactStatusSchema = z.enum(["draft", "ready_for_review", "editing", "saved", "superseded"]);
export type ServiceArtifactStatus = z.infer<typeof serviceArtifactStatusSchema>;

export const serviceArtifactKindSchema = z.enum([
  "learning_path",
  "research_report",
  "creative_document",
  "creative_deck",
  "visual_concept",
  "code_project",
  "analysis_report",
  "discovery_trail",
]);
export type ServiceArtifactKind = z.infer<typeof serviceArtifactKindSchema>;

export const serviceArtifactVersionAuthorSchema = z.enum(["user", "simulator", "local_transform"]);
export type ServiceArtifactVersionAuthor = z.infer<typeof serviceArtifactVersionAuthorSchema>;

export const serviceEvidenceOriginSchema = z.enum(["seeded_fixture", "user_provided_metadata"]);
export type ServiceEvidenceOrigin = z.infer<typeof serviceEvidenceOriginSchema>;

export const serviceEvidenceLocatorKindSchema = z.enum(["section", "paragraph", "page", "table_row", "url_fragment"]);
export type ServiceEvidenceLocatorKind = z.infer<typeof serviceEvidenceLocatorKindSchema>;

export const serviceEvidenceStanceSchema = z.enum(["supports", "contradicts", "context"]);
export type ServiceEvidenceStance = z.infer<typeof serviceEvidenceStanceSchema>;

export const serviceEvidenceAvailabilitySchema = z.enum(["available", "unavailable", "fixture_only"]);
export type ServiceEvidenceAvailability = z.infer<typeof serviceEvidenceAvailabilitySchema>;

export const serviceStorageModeSchema = z.enum(["memory", "session"]);
export type ServiceStorageMode = z.infer<typeof serviceStorageModeSchema>;

export const serviceReceiptStorageSchema = z.enum(["none", "session_storage"]);
export type ServiceReceiptStorage = z.infer<typeof serviceReceiptStorageSchema>;

export const serviceHandoffStatusSchema = z.enum(["preview", "confirmed", "cancelled", "consumed", "failed"]);
export type ServiceHandoffStatus = z.infer<typeof serviceHandoffStatusSchema>;

export const serviceEventNames = [
  "service.session.created",
  "service.session.updated",
  "service.run.created",
  "service.run.status_changed",
  "service.stage.started",
  "service.stage.completed",
  "service.input.requested",
  "service.warning.added",
  "service.evidence.added",
  "artifact.created",
  "artifact.version_created",
  "artifact.saved",
  "handoff.previewed",
  "handoff.confirmed",
  "simulation.receipt.created",
] as const;

export const serviceEventNameSchema = z.enum(serviceEventNames);
export type ServiceEventNameValue = z.infer<typeof serviceEventNameSchema>;
