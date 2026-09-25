"use client";

import { useEffect, useReducer, useRef, useSyncExternalStore } from "react";
import type { Locale, ServiceScenarioId, ServiceSession, ServiceStage, CreateSessionState } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { ServiceWorkbenchProvider, useServiceWorkbench } from "@/features/service-workbench/state/workbench-provider";
import { ServiceProductShell } from "@/features/service-workbench/components/service-product-shell";
import {
  CreateBriefSurface,
  CreateCompleteSurface,
  CreateDirtyDialog,
  CreateFormatSurface,
  CreateReviewSurface,
  CreateStructureSurface,
  CreateValidationNote,
  CreateVariantsSurface,
  CreateVersionSurface,
  saveStateKey,
} from "./components/create-surfaces";
import { DocumentEditor } from "./components/document-editor";
import { DeckEditor } from "./components/deck-editor";
import { VisualEditor } from "./components/visual-editor";
import {
  createInitialCreateState,
  createReducer,
  type CreateAction,
} from "./state/create-reducer";
import { createCreateStatePreset, createScenarioPresets } from "@minsaj/mock-api/services";
import type { ServiceDomainBlock, ServiceStoreStatus } from "@/features/service-workbench/storage/store";
import type { ServiceWorkbenchSeed } from "@/features/service-workbench/state/reducer";

/**
 * Create workspace composition — U2.3.
 *
 * The workbench owns session, run, receipts, storage, and handoffs; Create owns
 * its stages, its three editors, and its version lineage, persisted through the
 * workbench's versioned domain block. Saving goes through the shared adapter
 * and the outcome decides `saved` vs `storage_failed` — a failed write never
 * claims success and always offers retry.
 */

const LOGICAL_CLOCK_START = Date.parse("2026-09-12T00:00:00.000Z");

export type CreateWorkspaceProps = {
  locale: Locale;
  session: ServiceSession;
  stages: ServiceStage[];
  scenarioId: ServiceScenarioId;
  storageStatus?: ServiceStoreStatus;
  /** Records restored from the tab-scoped demo store (resume path). */
  initialRecords?: ServiceWorkbenchSeed;
  stepMs?: number;
  /** Let the workbench apply one saved snapshot after mount. */
  resumeFromStorage?: boolean;
};

export function CreateWorkspace(props: CreateWorkspaceProps) {
  return (
    <ServiceWorkbenchProvider
      locale={props.locale}
      scenarioId={props.scenarioId}
      session={props.session}
      stages={props.stages}
      {...(props.stepMs === undefined ? {} : { stepMs: props.stepMs })}
      {...(props.storageStatus === undefined ? {} : { initialStorageStatus: props.storageStatus })}
      {...(props.initialRecords === undefined ? {} : { initialRecords: props.initialRecords })}
      {...(props.resumeFromStorage === undefined ? {} : { resumeFromStorage: props.resumeFromStorage })}
    >
      <CreateWorkspaceInner locale={props.locale} {...(props.initialRecords === undefined ? {} : { initialRecords: props.initialRecords })} />
    </ServiceWorkbenchProvider>
  );
}

function CreateWorkspaceInner({ locale, initialRecords }: { locale: Locale; initialRecords?: ServiceWorkbenchSeed }) {
  // Marks the moment the client tree owns the markup; tests wait for it
  // instead of guessing how long hydration takes.
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { state: workbenchState, actions, adapter } = useServiceWorkbench();
  const dictionary = getServiceDictionary(locale);
  const create = dictionary.services.create;

  const [createState, dispatch] = useReducer(
    createReducer,
    undefined,
    () => createInitialCreateState(locale, initialRecords?.domains?.find((block) => block.serviceId === "create")?.payload ?? undefined),
  );

  // Deterministic logical clock: one second per decision, never wall-clock.
  const clockRef = useRef(LOGICAL_CLOCK_START);
  const now = () => {
    clockRef.current += 1000;
    return new Date(clockRef.current).toISOString();
  };

  const send = (action: CreateAction) => dispatch(action);

  // A restored domain block is applied once, after the workbench has read
  // storage. Local changes after that are never overwritten by a stale block.
  const restoredRef = useRef<string | null>(null);
  useEffect(() => {
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "create");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.saveState}:${block.payload.versions.length}`;
    if (restoredRef.current === stamp) {
      return;
    }
    const isFirstObservation = restoredRef.current === null;
    restoredRef.current = stamp;
    if (!isFirstObservation && block.payload.updatedAt === createState.session.updatedAt && block.payload.saveState === createState.session.saveState) {
      // Our own persistence, not a restore.
      return;
    }
    send({ type: "session/restored", session: block.payload });
  }, [createState.session.saveState, createState.session.updatedAt, workbenchState.domains]);

  // Persist the domain block whenever Create state changes; the workbench
  // stores it verbatim and never reads it.
  const lastPersisted = useRef<string>("");
  useEffect(() => {
    const serialized = `${createState.session.updatedAt}:${createState.session.saveState}:${createState.session.versions.length}`;
    if (serialized === lastPersisted.current) {
      return;
    }
    lastPersisted.current = serialized;
    const block: ServiceDomainBlock = { serviceId: "create", stateVersion: 1, payload: createState.session };
    actions.setDomainBlock(block);
  }, [actions, createState.session]);

  // The storage write runs once the freshly built version has landed in the
  // workbench's domain list; the adapter's result decides the outcome.
  useEffect(() => {
    const session = createState.session;
    if (session.saveState !== "saving") {
      return;
    }
    const block = workbenchState.domains.find((candidate: ServiceDomainBlock) => candidate.serviceId === "create");
    if (block === undefined) {
      return;
    }
    const stamp = `${block.payload.updatedAt}:${block.payload.saveState}:${block.payload.versions.length}`;
    const expected = `${session.updatedAt}:${session.saveState}:${session.versions.length}`;
    if (stamp !== expected) {
      // The persistence effect will land the fresh block; wait for it.
      return;
    }
    const result = adapter.save([workbenchState.session]);
    if (result.ok) {
      send({ type: "save/succeeded", at: now() });
    } else {
      send({ type: "save/failed" });
    }
  }, [createState.session.saveState, createState.session.updatedAt, createState.session.versions.length, workbenchState.domains, workbenchState.session, adapter]);

  const onSave = () => {
    send({ type: "save/begin", at: now(), workbenchSession: workbenchState.session });
  };

  const onSaveRetry = () => {
    send({ type: "save/retry", at: now(), workbenchSession: workbenchState.session });
  };

  const stage = createState.ui.stage;
  const stageTitle = create.stages[stage];

  const editorFooter = (
    <div className="u2-create__savebar" data-testid="u2-create-savebar">
      <p
        className="u2-create__save-state"
        role="status"
        data-testid="u2-create-save-state"
        data-state={createState.session.saveState}
      >
        {create.ui[saveStateKey(createState.session.saveState)]}
      </p>
      {createState.session.saveState === "dirty" || createState.session.saveState === "clean" ? (
        <p className="u2-create__note">{create.ui.dirtyNote}</p>
      ) : null}
      {createState.session.saveState === "storage_failed" ? (
        <div className="u2-create__error-block" role="alert" data-testid="u2-create-storage-failed">
          <p>{create.ui.saveFailedBody}</p>
          <button type="button" data-testid="u2-create-save-retry" onClick={onSaveRetry}>{create.ui.retrySave}</button>
        </div>
      ) : (
        <button
          type="button"
          className="u2-create__primary"
          data-testid="u2-create-save"
          onClick={onSave}
          disabled={createState.session.saveState === "saving"}
        >
          {createState.session.saveState === "saving" ? create.ui.savingLabel : create.ui.saveDraft}
        </button>
      )}
      <button
        type="button"
        data-testid="u2-create-review-request"
        onClick={() => send({ type: "review/request", at: now() })}
      >
        {create.ui.requestReview}
      </button>
      <button
        type="button"
        data-testid="u2-create-restart"
        onClick={() => send({ type: "restart/request" })}
      >
        {create.ui.restartLabel}
      </button>
      <button
        type="button"
        data-testid="u2-create-change-variant"
        onClick={() => send({ type: "edit/variants" })}
      >
        {create.ui.changeVariantLabel}
      </button>
      {createState.ui.validation !== null ? (
        <CreateValidationNote locale={locale} validationKey={createState.ui.validation} />
      ) : null}
    </div>
  );

  return (
    <ServiceProductShell
      locale={locale}
      eyebrow={create.eyebrow}
      title={create.label}
      description={create.description}
      {...(stage === "crt_format" || stage === "crt_brief" ? { startDisabledReason: stageTitle } : {})}
    >
      <div
        className="u2-create"
        data-testid="u2-create-workspace"
        data-hydrated={hydrated ? "true" : "false"}
        data-stage={stage}
        data-format={createState.session.format ?? "unselected"}
        data-mode={createState.session.mode}
        data-save-state={createState.session.saveState}
        data-versions={createState.session.versions.length}
      >

        {stage === "crt_format" ? (
          <CreateFormatSurface
            locale={locale}
            state={createState}
            onFormat={(format) => send({ type: "format/select", format })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
          />
        ) : null}

        {stage === "crt_brief" ? (
          <CreateBriefSurface
            locale={locale}
            state={createState}
            onDraft={(field, value) => send({ type: "brief/draft", field, value })}
            onTone={(tone) => send({ type: "brief/tone", tone })}
            onLength={(length) => send({ type: "brief/length", length })}
            onSubmit={() => send({ type: "brief/submit", at: now() })}
            onMode={(mode) => send({ type: "mode/set", mode, at: now() })}
            onBack={() => send({ type: "format/back" })}
          />
        ) : null}

        {stage === "crt_structure" ? (
          <CreateStructureSurface
            locale={locale}
            state={createState}
            onConfirm={() => send({ type: "structure/confirm", at: now() })}
            onBack={() => send({ type: "structure/back" })}
          />
        ) : null}

        {stage === "crt_variants" ? (
          <CreateVariantsSurface
            locale={locale}
            state={createState}
            onSelect={(variantId) => send({ type: "variant/select", variantId })}
            onConfirm={() => send({ type: "variants/confirm", at: now() })}
            onContinueWithout={() => send({ type: "variants/continue-without", at: now() })}
            onBack={() => send({ type: "variants/back" })}
          />
        ) : null}

        {stage === "crt_edit" ? (
          <>
            {createState.session.draft?.format === "document" ? (
              <DocumentEditor
                locale={locale}
                state={createState}
                onTitle={(value) => send({ type: "edit/title", value })}
                onOutlineLabel={(id, label) => send({ type: "outline/label", id, label })}
                onOutlineAdd={(label) => send({ type: "outline/add", label })}
                onOutlineRemove={(id) => send({ type: "outline/remove", id })}
                onBlockAdd={(blockType) => send({ type: "block/add", blockType })}
                onBlockText={(id, text) => send({ type: "block/text", id, text })}
                onBlockDelete={(id) => send({ type: "block/delete", id })}
                onBlockMove={(id, direction) => send({ type: "block/move", id, direction })}
                onAlternativeAccept={(id) => send({ type: "alternative/accept", id, at: now() })}
                onAlternativeReject={(id) => send({ type: "alternative/reject", id })}
                onPreviewToggle={() => send({ type: "preview/toggle" })}
              />
            ) : null}
            {createState.session.draft?.format === "deck" ? (
              <DeckEditor
                locale={locale}
                state={createState}
                onTitle={(value) => send({ type: "edit/title", value })}
                onSlideSelect={(index) => send({ type: "slide/select", index })}
                onSlideAdd={() => send({ type: "slide/add" })}
                onSlideDuplicate={(id) => send({ type: "slide/duplicate", id })}
                onSlideDelete={(id) => send({ type: "slide/delete", id })}
                onSlideMove={(id, direction) => send({ type: "slide/move", id, direction })}
                onSlideTitle={(id, value) => send({ type: "slide/title", id, value })}
                onSlideBody={(id, value) => send({ type: "slide/body", id, value })}
                onSlideNotes={(id, value) => send({ type: "slide/notes", id, value })}
              />
            ) : null}
            {createState.session.draft?.format === "visual" ? (
              <VisualEditor
                locale={locale}
                state={createState}
                onCaption={(value) => send({ type: "visual/caption", value })}
                onAlt={(value) => send({ type: "visual/alt", value })}
              />
            ) : null}
            {editorFooter}
          </>
        ) : null}

        {stage === "crt_review" ? (
          <CreateReviewSurface
            locale={locale}
            state={createState}
            onAccept={(id) => send({ type: "suggestion/accept", id })}
            onReject={(id) => send({ type: "suggestion/reject", id })}
            onComplete={() => send({ type: "review/complete", at: now() })}
            onBack={() => send({ type: "review/back" })}
          />
        ) : null}

        {stage === "crt_version" ? (
          <CreateVersionSurface
            locale={locale}
            state={createState}
            onSave={onSave}
            onRetry={onSaveRetry}
            onRestore={(versionId) => send({ type: "restore/apply", versionId, at: now() })}
            onDuplicate={() => send({ type: "duplicate/apply", at: now(), workbenchSession: workbenchState.session })}
            onFinish={() => send({ type: "complete/enter" })}
            onBack={() => send({ type: "review/back" })}
          />
        ) : null}

        {stage === "crt_complete" ? (
          <CreateCompleteSurface
            locale={locale}
            state={createState}
            onBack={() => send({ type: "review/back" })}
          />
        ) : null}

        <CreateDirtyDialog
          locale={locale}
          state={createState}
          onConfirm={() => send({ type: "pending/confirm", at: now(), workbenchSession: workbenchState.session })}
          onCancel={() => send({ type: "pending/cancel" })}
        />
      </div>
    </ServiceProductShell>
  );
}

/** Maps a scenario to a Create preset seed; used by tests and evidence capture. */
export function buildCreateInitialState(options: {
  locale: Locale;
  scenarioId: ServiceScenarioId;
}): { restored: CreateSessionState | null } {
  const preset = createScenarioPresets[options.scenarioId] ?? null;
  if (preset === null) {
    return { restored: null };
  }
  return {
    restored: createCreateStatePreset({ locale: options.locale, now: "2026-09-12T00:00:00.000Z", preset }),
  };
}
