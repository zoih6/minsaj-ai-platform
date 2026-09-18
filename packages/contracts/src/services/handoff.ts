import { z } from "zod";
import { serviceArtifactIdSchema, serviceHandoffIdSchema, serviceSessionIdSchema, serviceTimestampSchema } from "./ids";
import { serviceHandoffSourceIdSchema, serviceHandoffStatusSchema, serviceIdSchema } from "./enums";
import { serviceLabelSchema, serviceProseSchema } from "./text";

/**
 * HandoffBundle — data the user selects and previews before opening another
 * service. It is not an agent-to-agent delegation envelope, a permission grant,
 * or hidden memory: nothing crosses the boundary unless the user reviewed it.
 */
export const handoffBundleSchema = z.object({
  id: serviceHandoffIdSchema,
  fromServiceId: serviceHandoffSourceIdSchema,
  toServiceId: serviceIdSchema,
  sourceSessionId: serviceSessionIdSchema.optional(),
  selectedArtifactRefs: z.array(serviceArtifactIdSchema).max(6).default([]),
  intentSummary: serviceProseSchema,
  selectedFields: z.array(serviceLabelSchema).min(1).max(12),
  excludedFields: z.array(serviceLabelSchema).max(12).default([]),
  status: serviceHandoffStatusSchema,
  createdAt: serviceTimestampSchema,
  confirmedAt: serviceTimestampSchema.optional(),
});
export type HandoffBundle = z.infer<typeof handoffBundleSchema>;

/** Fields a bundle may carry. Anything outside this allowlist cannot be sent. */
export const handoffFieldAllowlist = [
  "topic",
  "goal",
  "question",
  "brief",
  "audience",
  "selectedExcerpt",
  "claims",
  "assumptions",
  "selectedNodes",
  "changeSummary",
] as const;

export const handoffFieldSchema = z.enum(handoffFieldAllowlist);
export type HandoffField = z.infer<typeof handoffFieldSchema>;

/** A bundle is only confirmable when the user selected at least one field. */
export function canConfirmHandoff(bundle: HandoffBundle) {
  if (bundle.status !== "preview") return false;
  return bundle.selectedFields.length > 0;
}

/**
 * One-time consumption guard. A confirmed bundle becomes `consumed` once the
 * target service accepts it; a consumed bundle can never be consumed again.
 */
export function consumeHandoff(bundle: HandoffBundle, at: string): HandoffBundle {
  if (bundle.status === "consumed") {
    throw new Error(`handoff_already_consumed:${bundle.id}`);
  }
  if (bundle.status !== "confirmed") {
    throw new Error(`handoff_not_confirmed:${bundle.id}`);
  }
  return { ...bundle, status: "consumed", confirmedAt: bundle.confirmedAt ?? at };
}
