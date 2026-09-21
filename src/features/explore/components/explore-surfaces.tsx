"use client";

import type { Locale, ExploreNode } from "@minsaj/contracts/services";
import { formatServiceNumber, getServiceDictionary } from "@minsaj/i18n/services";
import { exploreTopicIds } from "@minsaj/mock-api/services";
import { ArrowRight, BookmarkPlus, CircleDot, Compass, MapPin, Undo2 } from "lucide-react";
import type { ExploreReducerState } from "../state/explore-reducer";

/**
 * Explore stage surfaces — U2.6.
 *
 * One component per stage, composed by the workspace. Every human-readable
 * string resolves through `services.explore.*`, so no copy lives in JSX; the
 * map always renders its equivalent list (accessibility parity is structural,
 * not optional); nothing auto-advances; validation is announced through
 * `role="alert"`.
 */

type ExploreNodeDict = Record<string, unknown>;

/** Resolves a full `services.explore.*` key inside the nested dictionary. */
export function resolveExploreCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.explore as unknown as ExploreNodeDict;
  const path = key.startsWith("services.explore.") ? key.slice("services.explore.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as ExploreNodeDict)[part];
  }
  return typeof current === "string" ? current : key;
}

export function topicLabel(locale: Locale, topicId: string): string {
  return resolveExploreCopy(locale, `services.explore.topics.${topicId}`);
}

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

export function ExploreModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  return (
    <div className="u2-explore__modes" role="group" aria-label={ui("modeSwitchLabel")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-explore-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {candidate === "guided" ? ui("modeGuided") : ui("modeFast")}
          <small>{candidate === "guided" ? ui("modeGuidedHint") : ui("modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function ExploreValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-explore__error" role="alert" data-testid="u2-explore-validation" data-validation={validationKey}>
      {resolveExploreCopy(locale, `services.explore.ui.validation_${validationKey}`)}
    </p>
  );
}

export function ExploreSeedSurface({
  locale,
  state,
  onSeed,
  onCuriosity,
  onDepth,
  onSubmit,
  onMode,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onSeed: (value: string) => void;
  onCuriosity: (value: string) => void;
  onDepth: (depth: "short" | "deep") => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-seed" data-stage="exp_seed">
      <h2>{ui("seedTitle")}</h2>
      <p>{ui("seedIntro")}</p>
      <ExploreModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />

      <fieldset className="u2-explore__field">
        <legend>{ui("seedTopic")}</legend>
        <select
          value={state.ui.draftSeed}
          data-testid="u2-explore-topic"
          aria-label={ui("seedTopic")}
          onChange={(event) => onSeed(event.target.value)}
        >
          {exploreTopicIds.map((topicId) => (
            <option value={topicId} key={topicId}>{topicLabel(locale, topicId)}</option>
          ))}
        </select>
        <p className="u2-explore__summary">{resolveExploreCopy(locale, `services.explore.topics.${state.ui.draftSeed}_summary`)}</p>
      </fieldset>

      <fieldset className="u2-explore__field">
        <legend>{ui("seedCuriosity")}</legend>
        <textarea
          value={state.ui.draftCuriosity}
          data-testid="u2-explore-curiosity"
          rows={2}
          maxLength={600}
          aria-label={ui("seedCuriosity")}
          onChange={(event) => onCuriosity(event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-explore__field">
        <legend>{ui("seedDepth")}</legend>
        <div className="mj-control-bar__group mj-control-bar__group--wrap u2-explore__chips">
          {(["short", "deep"] as const).map((depth) => (
            <button
              key={depth}
              type="button"
              className="mj-chip"
              aria-pressed={state.ui.draftDepth === depth}
              data-testid={`u2-explore-depth-${depth}`}
              onClick={() => onDepth(depth)}
            >
              {ui(depth === "short" ? "depthShort" : "depthDeep")}
            </button>
          ))}
        </div>
      </fieldset>

      {state.session.mode === "fast" ? (
        <p className="u2-explore__note" data-testid="u2-explore-fast-note">{resolveExploreCopy(locale, "services.explore.fast.intro")}</p>
      ) : null}

      {state.ui.validation === "seed_incomplete" ? <ExploreValidationNote locale={locale} validationKey="seed_incomplete" /> : null}

      <button type="button" className="u2-explore__primary" data-testid="u2-explore-seed-submit" onClick={onSubmit}>
        {state.session.mode === "fast" ? ui("seedSubmitFast") : ui("seedSubmit")}
      </button>
    </section>
  );
}

function NodeRow({ locale, node, onOpen }: { locale: Locale; node: ExploreNode; onOpen: (nodeId: string) => void }) {
  return (
    <li data-testid={`u2-explore-node-${node.id}`} data-visited={node.visited}>
      <button type="button" onClick={() => onOpen(node.id)}>
        <span className="u2-explore__node-label">
          {node.visited ? <CircleDot size={14} aria-hidden="true" /> : <Compass size={14} aria-hidden="true" />}
          {resolveExploreCopy(locale, node.labelKey)}
        </span>
        <span className="u2-explore__node-summary">{resolveExploreCopy(locale, node.summaryKey)}</span>
      </button>
    </li>
  );
}

export function ExploreMapSurface({
  locale,
  state,
  onOpenNode,
  onContinue,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onOpenNode: (nodeId: string) => void;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  const map = state.session.map;

  if (map === null) {
    return (
      <section className="u2-explore__surface" data-testid="u2-explore-map" data-stage="exp_map">
        <h2>{ui("mapTitle")}</h2>
        <p className="u2-explore__error" role="alert">{ui("unsupportedTopicNote")}</p>
      </section>
    );
  }

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-map" data-stage="exp_map" data-nodes={map.nodes.length}>
      <h2>{ui("mapTitle")}</h2>
      <p>{ui("mapIntro")}</p>
      <p className="u2-explore__legend">{ui("mapLegend")}</p>

      {/* The list IS the map's accessibility parity — both render always. */}
      <ol className="u2-explore__nodes">
        {map.nodes.map((node) => (
          <NodeRow key={node.id} locale={locale} node={node} onOpen={onOpenNode} />
        ))}
      </ol>

      <ul className="u2-explore__edges" aria-label={ui("mapLegend")}>
        {map.edges.map((edge, index) => (
          <li key={index}>
            <span>{resolveExploreCopy(locale, `services.explore.nodes.${edge.fromId}`)}</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span className="u2-explore__edge-relation">{resolveExploreCopy(locale, edge.relationKey)}</span>
            <ArrowRight size={14} aria-hidden="true" />
            <span>{resolveExploreCopy(locale, `services.explore.nodes.${edge.toId}`)}</span>
          </li>
        ))}
      </ul>

      {state.session.trail !== null ? (
        <button type="button" className="u2-explore__primary" data-testid="u2-explore-map-continue" onClick={onContinue}>
          {ui("trailContinue")}
        </button>
      ) : null}

      {state.ui.validation === "map_missing" ? <ExploreValidationNote locale={locale} validationKey="map_missing" /> : null}
    </section>
  );
}

export function ExploreNodeSurface({
  locale,
  state,
  onVisit,
  onSaveLater,
  onBack,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onVisit: (nodeId: string) => void;
  onSaveLater: (nodeId: string) => void;
  onBack: () => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  const map = state.session.map;
  const openNodeId = state.session.openNodeId ?? map?.seedNodeId ?? null;
  const node = map?.nodes.find((candidate) => candidate.id === openNodeId) ?? null;

  if (map === null || node === null) {
    return (
      <section className="u2-explore__surface" data-testid="u2-explore-node" data-stage="exp_node">
        <h2>{ui("nodeTitle")}</h2>
        <p className="u2-explore__error" role="alert">{ui("mapLegend")}</p>
      </section>
    );
  }

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-node" data-stage="exp_node" data-node={node.id}>
      <h2>{ui("nodeTitle")}</h2>

      <article className="u2-explore__detail" data-testid={`u2-explore-detail-${node.id}`}>
        <h3>{resolveExploreCopy(locale, node.labelKey)}</h3>
        <p>{resolveExploreCopy(locale, node.summaryKey)}</p>
        <p className="u2-explore__why">
          <MapPin size={14} aria-hidden="true" />
          {ui("nodeWhy")} {resolveExploreCopy(locale, node.whyConnectedKey)}
        </p>
        <div className="u2-explore__actions">
          <button type="button" data-testid={`u2-explore-visit-${node.id}`} onClick={() => onVisit(node.id)}>
            <CircleDot size={14} aria-hidden="true" />
            {ui("nodeVisit")}
          </button>
          <button type="button" data-testid={`u2-explore-save-later-${node.id}`} onClick={() => onSaveLater(node.id)}>
            <BookmarkPlus size={14} aria-hidden="true" />
            {ui("nodeSaveLater")}
          </button>
          <button type="button" data-testid="u2-explore-node-back" onClick={onBack}>
            <ArrowRight size={14} aria-hidden="true" />
            {ui("nodeBack")}
          </button>
        </div>
      </article>

      {state.ui.validation === "map_missing" ? <ExploreValidationNote locale={locale} validationKey="map_missing" /> : null}
    </section>
  );
}

export function ExploreTrailSurface({
  locale,
  state,
  onPrune,
  onRestore,
  onContinue,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onPrune: (nodeId: string) => void;
  onRestore: (nodeId: string) => void;
  onContinue: () => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  const trail = state.session.trail;
  const map = state.session.map;

  if (trail === null || map === null) {
    return (
      <section className="u2-explore__surface" data-testid="u2-explore-trail" data-stage="exp_trail">
        <h2>{ui("trailTitle")}</h2>
        <p className="u2-explore__error" role="alert">{ui("validation_map_missing")}</p>
      </section>
    );
  }

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-trail" data-stage="exp_trail" data-visits={trail.visits.length}>
      <h2>{ui("trailTitle")}</h2>
      <p>{ui("trailIntro")}</p>

      <ol className="u2-explore__visits">
        {trail.visits.map((visit, index) => (
          <li key={visit.nodeId} data-pruned={visit.pruned} data-testid={`u2-explore-visit-${visit.nodeId}`}>
            <span className="u2-explore__visit-index">{formatServiceNumber(locale, index + 1)}</span>
            <span className="u2-explore__visit-label">{resolveExploreCopy(locale, `services.explore.nodes.${visit.nodeId}`)}</span>
            {visit.pruned ? (
              <button type="button" data-testid={`u2-explore-restore-${visit.nodeId}`} onClick={() => onRestore(visit.nodeId)}>
                <Undo2 size={14} aria-hidden="true" />
                {ui("trailRestore")}
              </button>
            ) : (
              <button type="button" data-testid={`u2-explore-prune-${visit.nodeId}`} onClick={() => onPrune(visit.nodeId)}>
                {ui("trailPrune")}
              </button>
            )}
            {visit.pruned ? <span className="u2-explore__visit-badge">{ui("trailPruned")}</span> : null}
          </li>
        ))}
      </ol>

      {trail.savedForLaterIds.length > 0 ? (
        <p className="u2-explore__note">
          {ui("trailSavedLater")}: {trail.savedForLaterIds.map((id) => resolveExploreCopy(locale, `services.explore.nodes.${id}`)).join(" · ")}
        </p>
      ) : null}

      {state.ui.validation === "trail_empty" ? <ExploreValidationNote locale={locale} validationKey="trail_empty" /> : null}

      <button type="button" className="u2-explore__primary" data-testid="u2-explore-trail-continue" onClick={onContinue}>
        {ui("trailContinue")}
      </button>
    </section>
  );
}

export function ExploreCheckpointSurface({
  locale,
  state,
  onConfirm,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onConfirm: () => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  const trail = state.session.trail;

  if (trail === null) {
    return (
      <section className="u2-explore__surface" data-testid="u2-explore-checkpoint" data-stage="exp_checkpoint">
        <h2>{ui("checkpointTitle")}</h2>
        <p className="u2-explore__error" role="alert">{ui("validation_trail_empty")}</p>
      </section>
    );
  }

  const actual = trail.visits.filter((visit) => !visit.pruned).length;
  const pruned = trail.visits.length - actual;

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-checkpoint" data-stage="exp_checkpoint">
      <h2>{ui("checkpointTitle")}</h2>
      <p>{ui("checkpointIntro")}</p>

      <dl className="u2-explore__summary">
        <div><dt>{ui("checkpointVisits")}</dt><dd>{formatServiceNumber(locale, actual)}</dd></div>
        <div><dt>{ui("checkpointPruned")}</dt><dd>{formatServiceNumber(locale, pruned)}</dd></div>
        <div><dt>{ui("checkpointSaved")}</dt><dd>{formatServiceNumber(locale, trail.savedForLaterIds.length)}</dd></div>
      </dl>

      {state.ui.validation === "trail_empty" ? <ExploreValidationNote locale={locale} validationKey="trail_empty" /> : null}

      <button type="button" className="u2-explore__primary" data-testid="u2-explore-checkpoint-confirm" disabled={actual === 0} onClick={onConfirm}>
        {ui("checkpointConfirm")}
      </button>
    </section>
  );
}

export function ExploreCompleteSurface({
  locale,
  state,
  onSave,
  onHandoff,
}: {
  locale: Locale;
  state: ExploreReducerState;
  onSave: () => void;
  onHandoff: () => void;
}) {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  const trail = state.session.trail;

  if (trail === null) {
    return (
      <section className="u2-explore__surface" data-testid="u2-explore-complete" data-stage="exp_complete">
        <h2>{ui("completeTitle")}</h2>
        <p className="u2-explore__error" role="alert">{ui("validation_trail_empty")}</p>
      </section>
    );
  }

  return (
    <section className="u2-explore__surface" data-testid="u2-explore-complete" data-stage="exp_complete">
      <h2>{ui("completeTitle")}</h2>
      <p>{ui("completeIntro")}</p>
      <p className="u2-explore__note">{ui("completeBoundary")}</p>

      <div className="u2-explore__actions">
        <button type="button" data-testid="u2-explore-save" onClick={onSave}>{ui("completeSave")}</button>
        <button type="button" data-testid="u2-explore-handoff" onClick={onHandoff}>{ui("completeHandoff")}</button>
      </div>
    </section>
  );
}

/** Exported for the workspace's handoff bundle. */
export function exploreHandoffSummary(locale: Locale, nodes: number): string {
  const ui = (key: string) => resolveExploreCopy(locale, `services.explore.ui.${key}`);
  return template(ui("completeHandoffSummary"), { nodes: formatServiceNumber(locale, nodes) });
}
