import { z } from "zod";
import { serviceCodeProjectFixtureIdSchema, serviceDatasetFixtureIdSchema } from "./ids";
import { serviceLabelSchema, serviceUserTextSchema } from "./text";

/**
 * Per-service input union. A service is defined by its inputs, sequence,
 * work surface, review points, and output — not by colour or label — so the
 * foundation gives every domain a genuinely different input shape.
 */

export const learnInputSchema = z.object({
  serviceId: z.literal("learn"),
  topic: serviceLabelSchema,
  motivation: serviceUserTextSchema,
  sessionMinutes: z.union([z.literal(5), z.literal(15), z.literal(30)]),
  selfLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

export const researchInputSchema = z.object({
  serviceId: z.literal("research"),
  question: serviceUserTextSchema,
  decision: serviceUserTextSchema,
  audience: z.enum(["self", "team", "public"]),
  scope: z.enum(["recent", "broad", "academic"]),
});

export const createInputSchema = z.object({
  serviceId: z.literal("create"),
  format: z.enum(["document", "deck", "visual"]),
  brief: serviceUserTextSchema,
  audience: serviceLabelSchema,
  tone: z.enum(["neutral", "warm", "formal", "playful"]),
});

export const codeInputSchema = z.object({
  serviceId: z.literal("code"),
  taskType: z.enum(["build", "fix", "learn", "review"]),
  changeRequest: serviceUserTextSchema,
  projectFixtureId: serviceCodeProjectFixtureIdSchema,
});

export const analyzeInputSchema = z.object({
  serviceId: z.literal("analyze"),
  datasetFixtureId: serviceDatasetFixtureIdSchema,
  question: serviceUserTextSchema,
  assumptions: z.array(serviceLabelSchema).max(6),
  /** Metadata-only local file label; U2 never reads file content. */
  localFileName: serviceLabelSchema.optional(),
});

export const exploreInputSchema = z.object({
  serviceId: z.literal("explore"),
  seed: serviceLabelSchema,
  curiosity: serviceUserTextSchema,
  depth: z.enum(["short", "deep"]),
});

export const serviceInputSchema = z.discriminatedUnion("serviceId", [
  learnInputSchema,
  researchInputSchema,
  createInputSchema,
  codeInputSchema,
  analyzeInputSchema,
  exploreInputSchema,
]);

export type ServiceInput = z.infer<typeof serviceInputSchema>;
export type LearnInput = z.infer<typeof learnInputSchema>;
export type ResearchInput = z.infer<typeof researchInputSchema>;
export type CreateInput = z.infer<typeof createInputSchema>;
export type CodeInput = z.infer<typeof codeInputSchema>;
export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;
export type ExploreInput = z.infer<typeof exploreInputSchema>;
