import { z } from "zod";
import { localeSchema } from "../index";
import { serviceLabelSchema, serviceUserTextSchema } from "./text";

/**
 * Explore slice contracts — U2.6.
 *
 * These shapes describe one discovery session: a seed with a curiosity
 * question and a depth, a knowledge map with its equivalent list, node detail,
 * a trail of visits with branches, a checkpoint that reviews the trail, and a
 * completion record with handoffs into the other services. Everything is
 * seeded fixture data: no live retrieval, no search, and no external graph.
 *
 * Ownership rules stay identical to the foundation: `Service*`-scoped names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable seed, node, edge, or visit identity inside a fixture. */
export const exploreKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

export const exploreDepthSchema = z.enum(["short", "deep"]);
export type ExploreDepth = z.infer<typeof exploreDepthSchema>;

export const exploreSeedSchema = z.object({
  seed: serviceLabelSchema,
  curiosity: serviceUserTextSchema,
  depth: exploreDepthSchema,
});
export type ExploreSeed = z.infer<typeof exploreSeedSchema>;

export const exploreNodeSchema = z.object({
  id: exploreKeySchema,
  labelKey: serviceLabelSchema,
  summaryKey: serviceLabelSchema,
  /** Why this node sits where it sits — the map must stay explainable. */
  whyConnectedKey: serviceLabelSchema,
  visited: z.boolean(),
});
export type ExploreNode = z.infer<typeof exploreNodeSchema>;

export const exploreEdgeSchema = z.object({
  fromId: exploreKeySchema,
  toId: exploreKeySchema,
  relationKey: serviceLabelSchema,
});
export type ExploreEdge = z.infer<typeof exploreEdgeSchema>;

export const exploreMapSchema = z.object({
  seedNodeId: exploreKeySchema,
  nodes: z.array(exploreNodeSchema).min(2).max(8),
  edges: z.array(exploreEdgeSchema).min(1).max(12),
});
export type ExploreMap = z.infer<typeof exploreMapSchema>;

export const exploreVisitSchema = z.object({
  nodeId: exploreKeySchema,
  order: z.number().int().nonnegative().max(11),
  /** A visit marked pruned keeps its identity; pruning is reversible. */
  pruned: z.boolean(),
});
export type ExploreVisit = z.infer<typeof exploreVisitSchema>;

export const exploreTrailSchema = z.object({
  visits: z.array(exploreVisitSchema).min(1).max(12),
  /** Branch nodes saved for a later session instead of visited now. */
  savedForLaterIds: z.array(exploreKeySchema).max(6),
});
export type ExploreTrail = z.infer<typeof exploreTrailSchema>;

/** The six discovery stages; recorded so a resume lands where the explorer was. */
export const exploreStageKeySchema = z.enum([
  "exp_seed",
  "exp_map",
  "exp_node",
  "exp_trail",
  "exp_checkpoint",
  "exp_complete",
]);
export type ExploreStageKey = z.infer<typeof exploreStageKeySchema>;

export const exploreSessionStateSchema = z.object({
  serviceId: z.literal("explore"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  seed: exploreSeedSchema.nullable(),
  map: exploreMapSchema.nullable(),
  /** The node whose detail is open; null means the map list is the surface. */
  openNodeId: exploreKeySchema.nullable(),
  trail: exploreTrailSchema.nullable(),
  checkpointConfirmed: z.boolean(),
  /**
   * Where the explorer actually was. `null` means "derive it from recorded
   * state"; a stored value is trusted only when it is consistent with that
   * state, so a hand-edited snapshot cannot fake a stage.
   */
  resumeStageKey: exploreStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type ExploreSessionState = z.infer<typeof exploreSessionStateSchema>;

/** Guard used by the workbench store before it hands a block back to Explore. */
export function isExploreSessionState(value: unknown): value is ExploreSessionState {
  return exploreSessionStateSchema.safeParse(value).success;
}
