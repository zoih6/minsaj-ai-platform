import type {
  ExploreDepth,
  ExploreMap,
  ExploreSessionState,
} from "@minsaj/contracts/services";
import { exploreSessionStateSchema } from "@minsaj/contracts/services";

/**
 * Explore knowledge-graph fixtures and rules — U2.6.
 *
 * Structure lives here; every human-readable string is an i18n key resolved by
 * `@minsaj/i18n/services`. Every rule below is deterministic and documented:
 *
 * 1. a topic fixture declares its seed node, its related nodes, and its edges
 *    with named relations — the map is never invented at runtime;
 * 2. deep depth adds the topic's deep-only nodes (bounded at the contract max);
 * 3. guided opens the map node-by-node; fast shows it whole at once — the
 *    checkpoint review point stays mandatory in both modes;
 * 4. a visit can be pruned, never deleted (its identity stays in the record);
 *    a branch node is saved for a later session instead of being lost.
 */

export type ExploreTopicNode = {
  readonly id: string;
  readonly labelKey: string;
  readonly summaryKey: string;
  readonly whyConnectedKey: string;
};

export type ExploreTopicEdge = {
  readonly fromId: string;
  readonly toId: string;
  readonly relationKey: string;
};

export type ExploreTopic = {
  readonly id: string;
  readonly seedNodeId: string;
  readonly nodes: readonly ExploreTopicNode[];
  /** Extra nodes used by the deep fixture only. */
  readonly deepOnlyNodes: readonly ExploreTopicNode[];
  readonly edges: readonly ExploreTopicEdge[];
};

function node(id: string, summaryKey: string, whyKey: string): ExploreTopicNode {
  return {
    id,
    labelKey: `services.explore.nodes.${id}`,
    summaryKey: `services.explore.nodes.${id}`,
    whyConnectedKey: whyKey,
  };
}

const recsysTopic: ExploreTopic = {
  id: "recommendation_systems",
  seedNodeId: "kn_recsys_privacy",
  nodes: [
    node("kn_recsys_privacy", "nodes.kn_recsys_privacy", "why.seed"),
    node("kn_recsys_collab", "nodes.kn_recsys_collab", "why.collab"),
    node("kn_recsys_content", "nodes.kn_recsys_content", "why.content"),
  ],
  deepOnlyNodes: [
    node("kn_recsys_cold_start", "nodes.kn_recsys_cold_start", "why.cold_start"),
    node("kn_recsys_feedback", "nodes.kn_recsys_feedback", "why.feedback"),
  ],
  edges: [
    { fromId: "kn_recsys_privacy", toId: "kn_recsys_collab", relationKey: "services.explore.relations.rel_limits" },
    { fromId: "kn_recsys_privacy", toId: "kn_recsys_content", relationKey: "services.explore.relations.rel_limits" },
    { fromId: "kn_recsys_collab", toId: "kn_recsys_cold_start", relationKey: "services.explore.relations.rel_explains" },
    { fromId: "kn_recsys_content", toId: "kn_recsys_feedback", relationKey: "services.explore.relations.rel_extends" },
  ],
};

const typographyTopic: ExploreTopic = {
  id: "arabic_typography",
  seedNodeId: "kn_typo_direction",
  nodes: [
    node("kn_typo_direction", "nodes.kn_typo_direction", "why.seed"),
    node("kn_typo_mixed", "nodes.kn_typo_mixed", "why.mixed"),
    node("kn_typo_fonts", "nodes.kn_typo_fonts", "why.fonts"),
  ],
  deepOnlyNodes: [
    node("kn_typo_numbers", "nodes.kn_typo_numbers", "why.numbers"),
  ],
  edges: [
    { fromId: "kn_typo_direction", toId: "kn_typo_mixed", relationKey: "services.explore.relations.rel_explains" },
    { fromId: "kn_typo_direction", toId: "kn_typo_numbers", relationKey: "services.explore.relations.rel_limits" },
    { fromId: "kn_typo_mixed", toId: "kn_typo_fonts", relationKey: "services.explore.relations.rel_extends" },
  ],
};

export const exploreTopics = {
  recommendation_systems: recsysTopic,
  arabic_typography: typographyTopic,
} as const satisfies Record<string, ExploreTopic>;

export const exploreTopicIds = ["recommendation_systems", "arabic_typography"] as const;
export type ExploreTopicId = (typeof exploreTopicIds)[number];

export function isExploreTopicId(value: string): value is ExploreTopicId {
  return (exploreTopicIds as readonly string[]).includes(value);
}

export function getExploreTopic(topicId: ExploreTopicId): ExploreTopic {
  return exploreTopics[topicId];
}

/** Builds the map for a (topic, depth): deep adds the bounded deep-only nodes. */
export function buildExploreMap(topicId: string, depth: ExploreDepth): ExploreMap {
  const topic = exploreTopics[topicId as ExploreTopicId] ?? recsysTopic;
  const source = depth === "deep" ? [...topic.nodes, ...topic.deepOnlyNodes] : [...topic.nodes];
  const ids = new Set(source.map((entry) => entry.id));
  return {
    seedNodeId: topic.seedNodeId,
    nodes: source.map((entry) => ({
      id: entry.id,
      labelKey: entry.labelKey,
      summaryKey: entry.summaryKey,
      whyConnectedKey: `services.explore.${entry.whyConnectedKey}`,
      visited: entry.id === topic.seedNodeId,
    })),
    edges: topic.edges.filter((edge) => ids.has(edge.fromId) && ids.has(edge.toId)),
  };
}

/** Fast mode visits every node on the map at once — visibly and on record. */
export function visitAllExploreNodes(map: ExploreMap): void {
  for (const item of map.nodes) {
    item.visited = true;
  }
}

export function exploreSeedNodeId(topicId: string): string {
  const topic = exploreTopics[topicId as ExploreTopicId] ?? recsysTopic;
  return topic.seedNodeId;
}

export function exploreTopicIdForSeed(seed: string): ExploreTopicId | null {
  const normalized = seed.trim().toLowerCase();
  if (normalized.includes("توصي") || normalized.includes("recommend")) {
    return "recommendation_systems";
  }
  if (normalized.includes("طباع") || normalized.includes("typograph") || normalized.includes("عرب")) {
    return "arabic_typography";
  }
  return null;
}

/**
 * Explore state presets — used by the route's scenario seeds so a verification
 * surface can land directly on an interesting state.
 */
export const exploreStatePresets = [
  "fresh",
  "map_ready",
  "trail_started",
  "checkpoint_ready",
] as const;
export type ExploreStatePreset = (typeof exploreStatePresets)[number];

export function createExploreStatePreset(input: {
  locale: "ar" | "en";
  now: string;
  preset: ExploreStatePreset;
  mode?: "guided" | "fast";
  depth?: ExploreDepth;
}): ExploreSessionState {
  const mode = input.mode ?? "guided";
  const depth = input.depth ?? "short";
  const seed = {
    seed: input.locale === "ar" ? "أنظمة التوصية" : "Recommendation systems",
    curiosity: input.locale === "ar"
      ? "كيف تعمل التوصيات دون جمع بيانات شخصية؟"
      : "How do recommendations work without collecting personal data?",
    depth,
  };
  const base = {
    serviceId: "explore" as const,
    stateVersion: 1 as const,
    locale: input.locale,
    mode,
    seed: null,
    map: null,
    openNodeId: null,
    trail: null,
    checkpointConfirmed: false,
    updatedAt: input.now,
  };

  if (input.preset === "fresh") {
    return exploreSessionStateSchema.parse({ ...base, resumeStageKey: "exp_seed" });
  }

  const map = buildExploreMap("recommendation_systems", depth);
  if (input.preset === "map_ready") {
    return exploreSessionStateSchema.parse({
      ...base,
      seed,
      map,
      resumeStageKey: "exp_map",
    });
  }

  if (input.preset === "trail_started") {
    return exploreSessionStateSchema.parse({
      ...base,
      seed,
      map,
      openNodeId: map.nodes[1]?.id ?? null,
      trail: { visits: [{ nodeId: map.seedNodeId, order: 0, pruned: false }], savedForLaterIds: [] },
      resumeStageKey: "exp_node",
    });
  }

  // checkpoint_ready: a visit plus a pruned one and a saved-for-later branch.
  const secondNode = map.nodes[1]?.id ?? map.nodes[0]?.id ?? "kn_recsys_collab";
  const thirdNode = map.nodes[2]?.id ?? secondNode;
  return exploreSessionStateSchema.parse({
    ...base,
    seed,
    map: { ...map, nodes: map.nodes.map((item) => (item.id === secondNode ? { ...item, visited: true } : item)) },
    trail: {
      visits: [
        { nodeId: map.seedNodeId, order: 0, pruned: false },
        { nodeId: secondNode, order: 1, pruned: false },
        { nodeId: thirdNode, order: 2, pruned: true },
      ],
      savedForLaterIds: [thirdNode],
    },
    resumeStageKey: "exp_checkpoint",
  });
}

/** Maps a scenario id to the preset the route seeds for edge-state reviews. */
export function explorePresetForScenario(scenarioId: string): ExploreStatePreset | null {
  if (scenarioId === "empty") return "fresh";
  if (scenarioId === "needs_input") return "map_ready";
  if (scenarioId === "warning") return "checkpoint_ready";
  return null;
}
