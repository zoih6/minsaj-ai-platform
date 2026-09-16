import { z } from "zod";
import {
  serviceArtifactIdSchema,
  serviceReceiptIdSchema,
  serviceRunIdSchema,
  serviceSessionIdSchema,
  serviceStageIdSchema,
  serviceTimestampSchema,
} from "./ids";
import { serviceIdSchema, serviceRunStatusSchema, serviceScenarioIdSchema } from "./enums";

/**
 * ServiceRun — a single deterministic simulation attempt of a service.
 *
 * It is not a server-side agent run, flow run, or durable job. It carries no
 * durability guarantees. Terminal states never return to an active state; a
 * retry always creates a new run that points at its predecessor.
 */
export const serviceRunSchema = z.object({
  id: serviceRunIdSchema,
  sessionId: serviceSessionIdSchema,
  serviceId: serviceIdSchema,
  status: serviceRunStatusSchema,
  stageId: serviceStageIdSchema,
  scenarioId: serviceScenarioIdSchema,
  retryOf: serviceRunIdSchema.optional(),
  sequence: z.number().int().nonnegative(),
  warningCodes: z.array(z.string().min(3).max(60)).max(12),
  artifactIds: z.array(serviceArtifactIdSchema).max(12),
  simulationReceiptId: serviceReceiptIdSchema,
  createdAt: serviceTimestampSchema,
  startedAt: serviceTimestampSchema.optional(),
  completedAt: serviceTimestampSchema.optional(),
});
export type ServiceRun = z.infer<typeof serviceRunSchema>;

export const serviceRunResourceSchema = z.object({
  run: serviceRunSchema,
  stages: z.array(z.object({
    id: serviceStageIdSchema,
    serviceId: serviceIdSchema,
    key: z.string().min(3).max(40),
    index: z.number().int().nonnegative().max(24),
    status: z.enum(["pending", "active", "completed", "blocked", "skipped"]),
    titleKey: z.string().min(3).max(120),
    reviewPoint: z.boolean(),
  })).min(1).max(24),
});
export type ServiceRunResource = z.infer<typeof serviceRunResourceSchema>;
