import { z } from "zod";
import {
  serviceArtifactIdSchema,
  serviceArtifactVersionIdSchema,
  serviceEvidenceIdSchema,
  serviceEventIdSchema,
  serviceHandoffIdSchema,
  serviceReceiptIdSchema,
  serviceRunIdSchema,
  serviceSessionIdSchema,
  serviceStageIdSchema,
  serviceStreamIdSchema,
  serviceTimestampSchema,
} from "./ids";
import {
  serviceArtifactKindSchema,
  serviceArtifactVersionAuthorSchema,
  serviceIdSchema,
  serviceRunStatusSchema,
  serviceScenarioIdSchema,
  serviceSessionStatusSchema,
} from "./enums";
import { localeSchema } from "../index";

/**
 * ServiceEvent — a typed, ordered event produced by the local deterministic
 * simulator to drive the interface. It is not an append-only security/audit
 * event and not a resumable server stream.
 */

const baseEnvelope = {
  eventId: serviceEventIdSchema,
  streamId: serviceStreamIdSchema,
  sequence: z.number().int().nonnegative(),
  occurredAt: serviceTimestampSchema,
};

export const serviceEventSchema = z.discriminatedUnion("name", [
  z.object({
    ...baseEnvelope,
    name: z.literal("service.session.created"),
    payload: z.object({
      sessionId: serviceSessionIdSchema,
      serviceId: serviceIdSchema,
      locale: localeSchema,
      mode: z.enum(["guided", "fast"]),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.session.updated"),
    payload: z.object({
      sessionId: serviceSessionIdSchema,
      status: serviceSessionStatusSchema,
      currentStageId: serviceStageIdSchema.nullable(),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.run.created"),
    payload: z.object({
      runId: serviceRunIdSchema,
      sessionId: serviceSessionIdSchema,
      serviceId: serviceIdSchema,
      scenarioId: serviceScenarioIdSchema,
      retryOf: serviceRunIdSchema.optional(),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.run.status_changed"),
    payload: z.object({
      runId: serviceRunIdSchema,
      status: serviceRunStatusSchema,
      reasonCode: z.string().min(3).max(60),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.stage.started"),
    payload: z.object({
      runId: serviceRunIdSchema,
      stageId: serviceStageIdSchema,
      index: z.number().int().nonnegative().max(24),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.stage.completed"),
    payload: z.object({
      runId: serviceRunIdSchema,
      stageId: serviceStageIdSchema,
      index: z.number().int().nonnegative().max(24),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.input.requested"),
    payload: z.object({
      runId: serviceRunIdSchema,
      fieldKey: z.string().min(3).max(60),
      reasonCode: z.string().min(3).max(60),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.warning.added"),
    payload: z.object({
      runId: serviceRunIdSchema,
      code: z.string().min(3).max(60),
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("service.evidence.added"),
    payload: z.object({
      runId: serviceRunIdSchema,
      evidenceId: serviceEvidenceIdSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("artifact.created"),
    payload: z.object({
      artifactId: serviceArtifactIdSchema,
      kind: serviceArtifactKindSchema,
      versionId: serviceArtifactVersionIdSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("artifact.version_created"),
    payload: z.object({
      artifactId: serviceArtifactIdSchema,
      versionId: serviceArtifactVersionIdSchema,
      versionNumber: z.number().int().positive().max(500),
      createdBy: serviceArtifactVersionAuthorSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("artifact.saved"),
    payload: z.object({
      artifactId: serviceArtifactIdSchema,
      versionId: serviceArtifactVersionIdSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("handoff.previewed"),
    payload: z.object({
      handoffId: serviceHandoffIdSchema,
      toServiceId: serviceIdSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("handoff.confirmed"),
    payload: z.object({
      handoffId: serviceHandoffIdSchema,
      toServiceId: serviceIdSchema,
    }),
  }),
  z.object({
    ...baseEnvelope,
    name: z.literal("simulation.receipt.created"),
    payload: z.object({
      receiptId: serviceReceiptIdSchema,
      runId: serviceRunIdSchema,
    }),
  }),
]);

export type ServiceEvent = z.infer<typeof serviceEventSchema>;
export type ServiceEventName = ServiceEvent["name"];
export type ServiceEventFor<Name extends ServiceEventName> = Extract<ServiceEvent, { name: Name }>;

/** Events that only make sense for one run and must be dropped when stale. */
export const runScopedEventNames = [
  "service.run.status_changed",
  "service.stage.started",
  "service.stage.completed",
  "service.input.requested",
  "service.warning.added",
  "service.evidence.added",
  "simulation.receipt.created",
] as const satisfies readonly ServiceEventName[];

export function isRunScopedEvent(event: ServiceEvent): event is Extract<ServiceEvent, { payload: { runId: string } }> {
  return (runScopedEventNames as readonly string[]).includes(event.name);
}

export function getEventRunId(event: ServiceEvent): string | undefined {
  if (event.name === "service.run.created") return event.payload.runId;
  return isRunScopedEvent(event) ? event.payload.runId : undefined;
}
