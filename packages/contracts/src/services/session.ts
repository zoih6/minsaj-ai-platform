import { z } from "zod";
import { localeSchema } from "../index";
import {
  serviceArtifactIdSchema,
  serviceHandoffIdSchema,
  serviceRunIdSchema,
  serviceSessionIdSchema,
  serviceStageIdSchema,
  serviceTimestampSchema,
} from "./ids";
import { serviceIdSchema, serviceModeSchema, serviceSessionStatusSchema, serviceStorageModeSchema } from "./enums";
import { serviceInputSchema } from "./inputs";

/**
 * ServiceSession — a local container for one user goal inside one service:
 * configuration, runs, artifacts, and handoffs. It is not an agent harness
 * session, conversation store, or durable memory.
 */
export const serviceSessionSchema = z.object({
  id: serviceSessionIdSchema,
  serviceId: serviceIdSchema,
  locale: localeSchema,
  mode: serviceModeSchema,
  status: serviceSessionStatusSchema,
  currentStageId: serviceStageIdSchema.nullable(),
  input: serviceInputSchema,
  runIds: z.array(serviceRunIdSchema).max(24),
  artifactIds: z.array(serviceArtifactIdSchema).max(24),
  handoffInId: serviceHandoffIdSchema.optional(),
  handoffOutIds: z.array(serviceHandoffIdSchema).max(12),
  storage: serviceStorageModeSchema,
  createdAt: serviceTimestampSchema,
  updatedAt: serviceTimestampSchema,
  version: z.number().int().positive().max(10_000),
}).superRefine((session, ctx) => {
  // A session can never point at another domain's input shape.
  if (session.serviceId !== session.input.serviceId) {
    ctx.addIssue({ code: "custom", message: "session_input_service_mismatch", path: ["input", "serviceId"] });
  }
});
export type ServiceSession = z.infer<typeof serviceSessionSchema>;

/** Cross-field guard: the session service must match its input domain. */
export function sessionMatchesInput(session: ServiceSession) {
  return session.serviceId === session.input.serviceId;
}
