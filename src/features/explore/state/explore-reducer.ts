import type {
  ExploreSessionState,
  ExploreStageKey,
} from "@minsaj/contracts/services";
import { exploreSessionStateSchema } from "@minsaj/contracts/services";
import {
  buildExploreMap,
  isExploreTopicId,
  visitAllExploreNodes,
} from "@minsaj/mock-api/services";

/**
 * Explore slice state machine — U2.6.
 *
 * Stages follow the blueprint in `@minsaj/contracts/services` and every
 * transition has a documented guard: a map cannot exist without a seed, a node
 * detail can only open a node on the map, a trail visit must reference a map
 * node, and the checkpoint cannot confirm with an empty trail. Fast mode shows
 * the map whole (every node marked visited) instead of opening it node-by-node;
 * the checkpoint review point stays mandatory in both modes.
 */

export const exploreStageKeys: readonly ExploreStageKey[] = [
  "exp_seed",
  "exp_map",
  "exp_node",
  "exp_trail",
  "exp_checkpoint",
  "exp_complete",
];

export type { ExploreStageKey };

export type ExploreValidationKey =
  | "seed_incomplete"
  | "map_missing"
  | "trail_empty"
  | null;

export type ExploreUiState = {
  stage: ExploreStageKey;
  draftSeed: string;
  draftCuriosity: string;
  draftDepth: "short" | "deep";
  validation: ExploreValidationKey;
};

export type ExploreReducerState = {
  ui: ExploreUiState;
  session: ExploreSessionState;
};

export function createExplorePreviewState(): ExploreUiState {
  return {
    stage: "exp_seed",
    draftSeed: "recommendation_systems",
    draftCuriosity: "",
    draftDepth: "short",
    validation: null,
  };
}

export function createInitialExploreState(locale: "ar" | "en", restored?: ExploreSessionState): ExploreReducerState {
  const session = restored ?? emptyExploreSession(locale, "guided");
  return { ui: { ...createExplorePreviewState(), stage: stageForSession(session) }, session };
}

export function emptyExploreSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): ExploreSessionState {
  return exploreSessionStateSchema.parse({
    serviceId: "explore",
    stateVersion: 1,
    locale,
    mode,
    seed: null,
    map: null,
    openNodeId: null,
    trail: null,
    checkpointConfirmed: false,
    resumeStageKey: null,
    updatedAt: at,
  });
}

/**
 * Derives the stage purely from recorded state.
 *
 * `stageForSession` is the trust boundary: a stored stage is honoured only
 * when the recorded facts can support it, otherwise the derived stage wins.
 */
export function derivedStageFor(session: ExploreSessionState): ExploreStageKey {
  if (session.seed === null) {
    return "exp_seed";
  }
  if (session.map === null) {
    return "exp_seed";
  }
  if (session.trail === null) {
    return session.mode === "fast" ? "exp_map" : "exp_node";
  }
  if (!session.checkpointConfirmed) {
    return "exp_checkpoint";
  }
  return "exp_complete";
}

const reachableStages: Record<ExploreStageKey, (session: ExploreSessionState) => boolean> = {
  exp_seed: () => true,
  exp_map: (session) => session.map !== null,
  exp_node: (session) => session.map !== null,
  exp_trail: (session) => session.trail !== null && session.trail.visits.length > 0,
  exp_checkpoint: (session) => session.trail !== null && session.trail.visits.some((visit) => !visit.pruned),
  exp_complete: (session) => session.checkpointConfirmed,
};

export function stageForSession(session: ExploreSessionState): ExploreStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type ExploreAction =
  | { type: "draft/seed"; value: string }
  | { type: "draft/curiosity"; value: string }
  | { type: "draft/depth"; depth: "short" | "deep" }
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "seed/submit"; at: string }
  | { type: "node/open"; nodeId: string; at: string }
  | { type: "node/visit"; nodeId: string; at: string }
  | { type: "node/saveLater"; nodeId: string; at: string }
  | { type: "node/back" }
  | { type: "trail/prune"; nodeId: string; at: string }
  | { type: "trail/restore"; nodeId: string; at: string }
  | { type: "trail/continue" }
  | { type: "checkpoint/confirm"; at: string }
  | { type: "session/restored"; session: ExploreSessionState };

function withValidation(state: ExploreReducerState, validation: ExploreValidationKey): ExploreReducerState {
  return { ...state, ui: { ...state.ui, validation } };
}

function updateSession(state: ExploreReducerState, session: ExploreSessionState, at: string): ExploreReducerState {
  return {
    ui: { ...state.ui, validation: null },
    session: { ...session, updatedAt: at },
  };
}

export function exploreReducer(state: ExploreReducerState, action: ExploreAction): ExploreReducerState {
  const next = reduceExplore(state, action);
  if (next === state) {
    return state;
  }
  // Every transition records where the explorer was, so a resume restores that
  // exact stage and never has to guess.
  return next.session.resumeStageKey === next.ui.stage
    ? next
    : { ...next, session: { ...next.session, resumeStageKey: next.ui.stage } };
}

function reduceExplore(state: ExploreReducerState, action: ExploreAction): ExploreReducerState {
  switch (action.type) {
    case "draft/seed":
      return { ...state, ui: { ...state.ui, draftSeed: action.value } };
    case "draft/curiosity":
      return { ...state, ui: { ...state.ui, draftCuriosity: action.value } };
    case "draft/depth":
      return { ...state, ui: { ...state.ui, draftDepth: action.depth } };

    case "mode/set": {
      const session: ExploreSessionState = {
        ...state.session,
        mode: action.mode,
        updatedAt: action.at,
      };
      return { ui: { ...state.ui, stage: derivedStageFor(session), validation: null }, session };
    }

    case "seed/submit": {
      const curiosity = state.ui.draftCuriosity.trim();
      const seed = state.ui.draftSeed;
      if (curiosity.length === 0 || !isExploreTopicId(seed)) {
        return withValidation(state, "seed_incomplete");
      }
      const map = buildExploreMap(seed, state.ui.draftDepth);
      if (state.session.mode === "fast") {
        // Fast mode shows the map whole: every node is marked visited on
        // record, and the trail starts from the seed. The checkpoint stays.
        visitAllExploreNodes(map);
        return {
          ui: { ...state.ui, stage: "exp_map", validation: null },
          session: {
            ...state.session,
            seed: { seed, curiosity, depth: state.ui.draftDepth },
            map,
            trail: { visits: [{ nodeId: map.seedNodeId, order: 0, pruned: false }], savedForLaterIds: [] },
            updatedAt: action.at,
          },
        };
      }
      return {
        ui: { ...state.ui, stage: "exp_map", validation: null },
        session: {
          ...state.session,
          seed: { seed, curiosity, depth: state.ui.draftDepth },
          map,
          trail: null,
          updatedAt: action.at,
        },
      };
    }

    case "node/open": {
      const map = state.session.map;
      if (map === null || !map.nodes.some((node) => node.id === action.nodeId)) {
        return withValidation(state, "map_missing");
      }
      return {
        ui: { ...state.ui, stage: "exp_node", validation: null },
        session: { ...state.session, openNodeId: action.nodeId, updatedAt: action.at },
      };
    }

    case "node/visit": {
      const map = state.session.map;
      if (map === null || !map.nodes.some((node) => node.id === action.nodeId)) {
        return withValidation(state, "map_missing");
      }
      const marked = { ...map, nodes: map.nodes.map((node) => (node.id === action.nodeId ? { ...node, visited: true } : node)) };
      const existing = state.session.trail;
      const order = existing?.visits.length ?? 0;
      const visits = existing !== null && existing.visits.some((visit) => visit.nodeId === action.nodeId)
        ? existing.visits
        : [...(existing?.visits ?? []), { nodeId: action.nodeId, order, pruned: false }];
      return {
        ui: { ...state.ui, stage: "exp_trail", validation: null },
        session: {
          ...state.session,
          map: marked,
          trail: { visits, savedForLaterIds: existing?.savedForLaterIds ?? [] },
          openNodeId: null,
          updatedAt: action.at,
        },
      };
    }

    case "node/saveLater": {
      const existing = state.session.trail;
      if (existing === null) {
        return withValidation(state, "map_missing");
      }
      const savedForLaterIds = existing.savedForLaterIds.includes(action.nodeId)
        ? existing.savedForLaterIds
        : [...existing.savedForLaterIds, action.nodeId];
      return updateSession(
        state,
        { ...state.session, trail: { ...existing, savedForLaterIds } },
        action.at,
      );
    }

    case "node/back": {
      return {
        ui: { ...state.ui, stage: state.session.trail !== null ? "exp_trail" : "exp_map", validation: null },
        session: { ...state.session, openNodeId: null },
      };
    }

    case "trail/prune": {
      const trail = state.session.trail;
      if (trail === null) {
        return withValidation(state, "map_missing");
      }
      const visits = trail.visits.map((visit) =>
        visit.nodeId === action.nodeId ? { ...visit, pruned: true } : visit,
      );
      return updateSession(state, { ...state.session, trail: { ...trail, visits } }, action.at);
    }

    case "trail/restore": {
      const trail = state.session.trail;
      if (trail === null) {
        return withValidation(state, "map_missing");
      }
      const visits = trail.visits.map((visit) =>
        visit.nodeId === action.nodeId ? { ...visit, pruned: false } : visit,
      );
      return updateSession(state, { ...state.session, trail: { ...trail, visits } }, action.at);
    }

    case "trail/continue": {
      const trail = state.session.trail;
      if (trail === null || trail.visits.every((visit) => visit.pruned)) {
        return withValidation(state, "trail_empty");
      }
      return { ...state, ui: { ...state.ui, stage: "exp_checkpoint", validation: null } };
    }

    case "checkpoint/confirm": {
      const trail = state.session.trail;
      if (trail === null || trail.visits.every((visit) => visit.pruned)) {
        return withValidation(state, "trail_empty");
      }
      return {
        ui: { ...state.ui, stage: "exp_complete", validation: null },
        session: { ...state.session, checkpointConfirmed: true, updatedAt: action.at },
      };
    }

    case "session/restored": {
      return { ui: { ...createExplorePreviewState(), stage: stageForSession(action.session) }, session: action.session };
    }

    default:
      return state;
  }
}
