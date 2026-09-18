"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CircleAlert, Layers, FileText, Presentation, Shapes } from "lucide-react";
import type { Locale, ServiceArtifactVersion } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import type { CreateReducerState } from "../state/create-reducer";

/**
 * Create stage surfaces — U2.3.
 *
 * One component per stage, composed by the workspace. Every human-readable
 * string resolves through `services.create.*`, so no copy lives in JSX; brief
 * groups are real `fieldset`/`legend`; the dirty-navigation confirm is a
 * dialog; and the format choice produces genuinely different follow-up
 * surfaces, never a recoloured copy of one editor.
 */

type CreateNode = Record<string, unknown>;

/** Resolves a full `services.create.*` key inside the nested dictionary. */
export function resolveCreateCopy(locale: Locale, key: string | null): string {
  if (key === null) {
    return "";
  }
  const node = getServiceDictionary(locale).services.create as unknown as CreateNode;
  const path = key.startsWith("services.create.") ? key.slice("services.create.".length) : key;
  let current: unknown = node;
  for (const part of path.split(".")) {
    if (current === null || typeof current !== "object") {
      return key;
    }
    current = (current as CreateNode)[part];
  }
  return typeof current === "string" ? current : key;
}

export function template(copy: string, values: Record<string, string | number>) {
  return copy.replace(/\{(\w+)\}/gu, (_, key: string) => String(values[key] ?? key));
}

const ui = (locale: Locale, key: string) => resolveCreateCopy(locale, `services.create.ui.${key}`);

export function CreateValidationNote({ locale, validationKey }: { locale: Locale; validationKey: string }) {
  return (
    <p className="u2-create__error" role="alert" data-testid="u2-create-validation" data-validation={validationKey}>
      {ui(locale, `validation_${validationKey}`)}
    </p>
  );
}

export function CreateSimulationNote({ locale }: { locale: Locale }) {
  return (
    <p className="u2-create__note" data-testid="u2-create-simulation-note">{ui(locale, "simulationNote")}</p>
  );
}

export function CreateModeSwitch({
  locale,
  mode,
  onMode,
}: {
  locale: Locale;
  mode: "guided" | "fast";
  onMode: (mode: "guided" | "fast") => void;
}) {
  return (
    <div className="u2-create__modes" role="group" aria-label={ui(locale, "modeGuided")}>
      {(["guided", "fast"] as const).map((candidate) => (
        <button
          key={candidate}
          type="button"
          aria-pressed={mode === candidate}
          data-testid={`u2-create-mode-${candidate}`}
          onClick={() => onMode(candidate)}
        >
          {ui(locale, candidate === "guided" ? "modeGuided" : "modeFast")}
          <small>{ui(locale, candidate === "guided" ? "modeGuidedHint" : "modeFastHint")}</small>
        </button>
      ))}
    </div>
  );
}

export function CreateFormatSurface({
  locale,
  state,
  onFormat,
  onMode,
}: {
  locale: Locale;
  state: CreateReducerState;
  onFormat: (format: "document" | "deck" | "visual") => void;
  onMode: (mode: "guided" | "fast") => void;
}) {
  const formats = [
    { id: "document", icon: FileText, label: ui(locale, "formatDocument"), hint: ui(locale, "formatDocumentHint") },
    { id: "deck", icon: Presentation, label: ui(locale, "formatDeck"), hint: ui(locale, "formatDeckHint") },
    { id: "visual", icon: Shapes, label: ui(locale, "formatVisual"), hint: ui(locale, "formatVisualHint") },
  ] as const;

  return (
    <section className="u2-create__surface" data-testid="u2-create-format" data-stage="crt_format">
      <h2>{ui(locale, "formatTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "formatIntro")}</p>
      <CreateSimulationNote locale={locale} />
      <CreateModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />
      {state.session.mode === "fast" ? <p className="u2-create__note" data-testid="u2-create-fast-note">{ui(locale, "fastNote")}</p> : null}
      <ul className="u2-create__formats">
        {formats.map((format) => (
          <li key={format.id}>
            <button type="button" data-testid={`u2-create-format-${format.id}`} onClick={() => onFormat(format.id)}>
              <format.icon size={18} aria-hidden="true" />
              <span>{format.label}</span>
              <small>{format.hint}</small>
            </button>
          </li>
        ))}
      </ul>
      {state.ui.validation !== null ? <CreateValidationNote locale={locale} validationKey={state.ui.validation} /> : null}
    </section>
  );
}

export function CreateBriefSurface({
  locale,
  state,
  onDraft,
  onTone,
  onLength,
  onSubmit,
  onMode,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onDraft: (field: "goal" | "audience" | "constraints", value: string) => void;
  onTone: (tone: "neutral" | "warm" | "formal" | "playful") => void;
  onLength: (length: "short" | "medium" | "long") => void;
  onSubmit: () => void;
  onMode: (mode: "guided" | "fast") => void;
  onBack: () => void;
}) {
  const tones = ["neutral", "warm", "formal", "playful"] as const;
  const lengths = ["short", "medium", "long"] as const;

  return (
    <section className="u2-create__surface" data-testid="u2-create-brief" data-stage="crt_brief">
      <h2>{ui(locale, "briefTitle")}</h2>
      <CreateModeSwitch locale={locale} mode={state.session.mode} onMode={onMode} />
      {state.session.mode === "fast" ? <p className="u2-create__note" data-testid="u2-create-fast-note">{ui(locale, "fastNote")}</p> : null}

      <fieldset className="u2-create__field">
        <legend>{ui(locale, "briefGoal")}</legend>
        <textarea
          value={state.ui.draftGoal}
          data-testid="u2-create-goal"
          rows={2}
          maxLength={600}
          aria-label={ui(locale, "briefGoal")}
          placeholder={ui(locale, "briefGoalPlaceholder")}
          onChange={(event) => onDraft("goal", event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-create__field">
        <legend>{ui(locale, "briefAudience")}</legend>
        <input
          type="text"
          value={state.ui.draftAudience}
          data-testid="u2-create-audience"
          maxLength={120}
          aria-label={ui(locale, "briefAudience")}
          placeholder={ui(locale, "briefAudiencePlaceholder")}
          onChange={(event) => onDraft("audience", event.target.value)}
        />
      </fieldset>

      <fieldset className="u2-create__field" data-testid="u2-create-tone-field">
        <legend>{ui(locale, "briefTone")}</legend>
        <div className="mj-control-bar__group mj-control-bar__group--wrap u2-create__chips" role="group" aria-label={ui(locale, "briefTone")}>
          {tones.map((tone) => (
            <button key={tone} type="button" className="mj-chip" aria-pressed={state.ui.draftTone === tone} data-testid={`u2-create-tone-${tone}`} onClick={() => onTone(tone)}>
              {ui(locale, `tone${tone.charAt(0).toUpperCase()}${tone.slice(1)}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-create__field" data-testid="u2-create-length-field">
        <legend>{ui(locale, "briefLength")}</legend>
        <div className="mj-control-bar__group mj-control-bar__group--wrap u2-create__chips" role="group" aria-label={ui(locale, "briefLength")}>
          {lengths.map((length) => (
            <button key={length} type="button" className="mj-chip" aria-pressed={state.ui.draftLength === length} data-testid={`u2-create-length-${length}`} onClick={() => onLength(length)}>
              {ui(locale, `length${length.charAt(0).toUpperCase()}${length.slice(1)}`)}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="u2-create__field">
        <legend>{ui(locale, "briefConstraints")}</legend>
        <textarea
          value={state.ui.draftConstraints}
          data-testid="u2-create-constraints"
          rows={2}
          maxLength={600}
          aria-label={ui(locale, "briefConstraints")}
          placeholder={ui(locale, "briefConstraintsPlaceholder")}
          onChange={(event) => onDraft("constraints", event.target.value)}
        />
      </fieldset>

      {state.ui.validation !== null ? <CreateValidationNote locale={locale} validationKey={state.ui.validation} /> : null}
      {/* The conflict is declared, not hidden: it surfaces again in review. */}
      {state.ui.draftTone === "formal" && /مرح|playful/ui.test(state.ui.draftConstraints) ? (
        <p className="u2-create__warning" data-testid="u2-create-conflict" role="status">{ui(locale, "conflictWarning")}</p>
      ) : null}

      <div className="u2-create__actions">
        <button type="button" className="u2-create__primary" data-testid="u2-create-brief-submit" onClick={onSubmit}>{ui(locale, "briefSubmit")}</button>
        <button type="button" data-testid="u2-create-brief-back" onClick={onBack}>{ui(locale, "backLabel")}</button>
      </div>
    </section>
  );
}

export function CreateStructureSurface({
  locale,
  state,
  onConfirm,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const structure = state.session.structure;
  if (structure === null) return null;

  const items = structure.format === "document"
    ? structure.outline.map((item) => ({ id: item.id, labelKey: item.labelKey, reasonKey: item.reasonKey }))
    : structure.format === "deck"
      ? structure.slides.map((item) => ({ id: item.id, labelKey: item.labelKey, reasonKey: item.reasonKey }))
      : [];

  return (
    <section className="u2-create__surface" data-testid="u2-create-structure" data-stage="crt_structure">
      <h2>{ui(locale, "structureTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "structureIntro")}</p>
      <CreateSimulationNote locale={locale} />
      <p className="u2-create__meta" data-testid="u2-create-structure-title">{structure.title}</p>

      {structure.format === "visual" ? (
        <ul className="u2-create__structure-list" data-testid="u2-create-structure-attributes">
          <li>{ui(locale, "visualRatioTitle")}: {resolveCreateCopy(locale, "services.create.visuals.ratios.ratio_1_1")}</li>
          {structure.attributes.conceptKeys.map((key) => (
            <li key={key}>{resolveCreateCopy(locale, key)}</li>
          ))}
        </ul>
      ) : (
        <ol className="u2-create__structure-list" data-testid="u2-create-structure-list">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{resolveCreateCopy(locale, item.labelKey)}</strong>
              <small>{resolveCreateCopy(locale, item.reasonKey)}</small>
            </li>
          ))}
        </ol>
      )}

      <details className="u2-create__rationale" data-testid="u2-create-structure-rationale">
        <summary>{ui(locale, "structureRationale")}</summary>
        <ul>
          {structure.rationaleKeys.map((key) => (
            <li key={key}>{resolveCreateCopy(locale, key)}</li>
          ))}
        </ul>
      </details>

      <div className="u2-create__actions">
        <button type="button" className="u2-create__primary" data-testid="u2-create-structure-confirm" onClick={onConfirm}>{ui(locale, "structureConfirm")}</button>
        <button type="button" data-testid="u2-create-structure-back" onClick={onBack}>{ui(locale, "backLabel")}</button>
      </div>
    </section>
  );
}

export function CreateVariantsSurface({
  locale,
  state,
  onSelect,
  onConfirm,
  onContinueWithout,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onSelect: (variantId: string) => void;
  onConfirm: () => void;
  onContinueWithout: () => void;
  onBack: () => void;
}) {
  const variants = state.session.variants;
  const selected = state.session.selectedVariantId;
  // With a live draft, choosing a different variant arms the explicit confirm;
  // the confirm/continue buttons no longer apply and are not rendered.
  const hasDraft = state.session.draft !== null;

  return (
    <section className="u2-create__surface" data-testid="u2-create-variants" data-stage="crt_variants">
      <h2>{ui(locale, "variantsTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "variantsIntro")}</p>
      <CreateSimulationNote locale={locale} />

      {variants.length === 0 ? (
        <div className="u2-create__empty" data-testid="u2-create-no-variants">
          <h3>{ui(locale, "noVariantTitle")}</h3>
          <p>{ui(locale, "noVariantBody")}</p>
        </div>
      ) : (
        <ul className="u2-create__variants" data-testid="u2-create-variant-list">
          {variants.map((variant) => (
            <li key={variant.id} data-variant={variant.id} data-selected={variant.id === selected}>
              <div className="u2-create__variant-head">
                <strong>{resolveCreateCopy(locale, variant.labelKey)}</strong>
                {variant.id === selected ? <span className="u2-create__tag">{ui(locale, "variantsSelected")}</span> : null}
              </div>
              <p>{resolveCreateCopy(locale, variant.differenceKey)}</p>
              <button
                type="button"
                data-testid={`u2-create-variant-${variant.id}`}
                onClick={() => onSelect(variant.id)}
                {...(hasDraft && variant.id !== selected ? { "aria-describedby": "u2-create-variant-replace-note" } : {})}
              >
                {variant.id === selected && hasDraft ? ui(locale, "variantsSelected") : ui(locale, "variantSelect")}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasDraft ? (
        <p className="u2-create__warning" id="u2-create-variant-replace-note" data-testid="u2-create-variant-replace-note" role="note">
          {ui(locale, "variantsIntro")}
        </p>
      ) : null}

      {state.ui.validation !== null ? <CreateValidationNote locale={locale} validationKey={state.ui.validation} /> : null}

      <div className="u2-create__actions">
        {hasDraft ? null : (
          <button
            type="button"
            className="u2-create__primary"
            data-testid="u2-create-variants-confirm"
            onClick={onConfirm}
            disabled={variants.length > 0 && selected === null && state.session.format === "visual"}
          >
            {ui(locale, "structureConfirm")}
          </button>
        )}
        {hasDraft || state.session.format === "visual" ? null : (
          <button type="button" data-testid="u2-create-variants-continue" onClick={onContinueWithout}>{ui(locale, "variantsContinueWithout")}</button>
        )}
        <button type="button" data-testid="u2-create-variants-back" onClick={onBack}>{hasDraft ? ui(locale, "editLabel") : ui(locale, "backLabel")}</button>
      </div>
    </section>
  );
}

export function CreateReviewSurface({
  locale,
  state,
  onAccept,
  onReject,
  onComplete,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const suggestions = state.session.suggestions;
  const pendingAlternative = state.session.alternatives.some((alternative) => alternative.status === "proposed");

  return (
    <section className="u2-create__surface" data-testid="u2-create-review" data-stage="crt_review">
      <h2>{ui(locale, "reviewTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "reviewIntro")}</p>

      {suggestions.length === 0 ? (
        <p className="u2-create__note" data-testid="u2-create-review-empty">{ui(locale, "reviewNoSuggestions")}</p>
      ) : (
        <ul className="u2-create__suggestions" data-testid="u2-create-suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id} data-suggestion={suggestion.id} data-status={suggestion.status}>
              <div>
                <strong>{resolveCreateCopy(locale, suggestion.suggestionKey)}</strong>
                <small>{resolveCreateCopy(locale, suggestion.ruleKey)}</small>
              </div>
              {suggestion.status === "open" ? (
                <div className="u2-create__suggestion-actions">
                  <button type="button" data-testid={`u2-create-accept-${suggestion.id}`} onClick={() => onAccept(suggestion.id)}>{ui(locale, "reviewAccept")}</button>
                  <button type="button" data-testid={`u2-create-reject-${suggestion.id}`} onClick={() => onReject(suggestion.id)}>{ui(locale, "reviewReject")}</button>
                </div>
              ) : (
                <span className="u2-create__tag" data-testid={`u2-create-resolved-${suggestion.id}`}>
                  {ui(locale, "reviewResolved")} · {suggestion.status === "accepted" ? ui(locale, "reviewAccept") : ui(locale, "reviewReject")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {state.ui.validation !== null ? <CreateValidationNote locale={locale} validationKey={state.ui.validation} /> : null}

      <div className="u2-create__actions">
        <button type="button" className="u2-create__primary" data-testid="u2-create-review-complete" onClick={onComplete} disabled={pendingAlternative}>
          {ui(locale, "reviewContinue")}
        </button>
        <button type="button" data-testid="u2-create-review-back" onClick={onBack}>{ui(locale, "editLabel")}</button>
      </div>
      {pendingAlternative ? <p className="u2-create__warning" role="status">{ui(locale, "reviewAltPending")}</p> : null}
    </section>
  );
}

export function CreateVersionSurface({
  locale,
  state,
  onSave,
  onRetry,
  onRestore,
  onDuplicate,
  onFinish,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onSave: () => void;
  onRetry: () => void;
  onRestore: (versionId: string) => void;
  onDuplicate: () => void;
  onFinish: () => void;
  onBack: () => void;
}) {
  const { session } = state;
  const versions = session.versions;
  const currentVersionId = session.artifact?.currentVersionId ?? null;
  const nextNumber = versions.length + 1;
  const canFinish = session.reviewCompleted && session.savedVersionNumber !== null
    && (session.saveState === "saved" || session.saveState === "restored");

  return (
    <section className="u2-create__surface" data-testid="u2-create-version" data-stage="crt_version">
      <h2>{ui(locale, "versionTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "versionIntro")}</p>

      <div className="u2-create__save-state" data-testid="u2-create-save-state" data-state={session.saveState}>
        <CircleAlert size={16} aria-hidden="true" />
        <span>{ui(locale, saveStateKey(session.saveState))}</span>
        {session.saveState === "dirty" || session.saveState === "clean" ? (
          <small>{template(ui(locale, "versionNewOnSave"), { number: nextNumber })}</small>
        ) : null}
      </div>

      {session.saveState === "storage_failed" ? (
        <div className="u2-create__error-block" role="alert" data-testid="u2-create-storage-failed">
          <h3>{ui(locale, "saveFailedTitle")}</h3>
          <p>{ui(locale, "saveFailedBody")}</p>
          <button type="button" data-testid="u2-create-save-retry" onClick={onRetry}>{ui(locale, "retrySave")}</button>
        </div>
      ) : (
        <div className="u2-create__actions">
          <button
            type="button"
            className="u2-create__primary"
            data-testid="u2-create-save"
            onClick={onSave}
            disabled={session.saveState === "saving" || session.saveState === "saved"}
          >
            {session.saveState === "saving" ? ui(locale, "savingLabel") : ui(locale, "saveDraft")}
          </button>
        </div>
      )}

      <h3>{ui(locale, "versionHistoryTitle")}</h3>
      {versions.length === 0 ? (
        <p className="u2-create__note">{ui(locale, "versionIntro")}</p>
      ) : (
        <ol className="u2-create__versions" data-testid="u2-create-versions">
          {versions.map((version) => (
            <li key={version.id} data-version={version.id} data-current={version.id === currentVersionId}>
              <div>
                <strong>{template(ui(locale, "versionNumberLabel"), { number: version.versionNumber })}</strong>
                {version.id === currentVersionId ? <span className="u2-create__tag">{ui(locale, "versionCurrent")}</span> : null}
                <small>{version.changeSummary}</small>
                {version.parentVersionId !== undefined ? <small>{`← ${version.parentVersionId}`}</small> : null}
              </div>
              <button type="button" data-testid={`u2-create-restore-${version.id}`} onClick={() => onRestore(version.id)}>
                {ui(locale, "versionRestore")}
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="u2-create__note">{ui(locale, "versionRestoreNote")}</p>

      {session.artifact !== null ? (
        <div className="u2-create__actions">
          <button type="button" data-testid="u2-create-duplicate" onClick={onDuplicate}>{ui(locale, "versionDuplicate")}</button>
        </div>
      ) : null}
      {session.parentArtifactId !== null ? (
        <p className="u2-create__note" data-testid="u2-create-parent-note">
          {template(ui(locale, "versionParentNote"), { artifactId: session.parentArtifactId })}
        </p>
      ) : null}

      <div className="u2-create__export" data-testid="u2-create-export">
        <Layers size={16} aria-hidden="true" />
        <div>
          <strong>{ui(locale, "versionExportPreview")}</strong>
          <p>{ui(locale, "versionExportNote")}</p>
        </div>
      </div>

      <div className="u2-create__actions">
        {canFinish ? (
          <button type="button" className="u2-create__primary" data-testid="u2-create-finish" onClick={onFinish}>
            {ui(locale, "finishLabel")}
          </button>
        ) : null}
        <button type="button" data-testid="u2-create-version-back" onClick={onBack}>{ui(locale, "editLabel")}</button>
      </div>
    </section>
  );
}

export function saveStateKey(saveState: string) {
  if (saveState === "saving") return "savingLabel";
  if (saveState === "saved") return "savedLabel";
  if (saveState === "storage_failed") return "storageFailedLabel";
  if (saveState === "restored") return "restoredLabel";
  return "dirtyNote";
}

export function CreateCompleteSurface({
  locale,
  state,
  onBack,
}: {
  locale: Locale;
  state: CreateReducerState;
  onBack: () => void;
}) {
  const { session } = state;
  return (
    <section className="u2-create__surface" data-testid="u2-create-complete" data-stage="crt_complete">
      <h2>{ui(locale, "completeTitle")}</h2>
      <p className="u2-create__intro">{ui(locale, "completeBody")}</p>
      {session.savedAt !== null ? (
        <p className="u2-create__note" data-testid="u2-create-complete-saved">
          {template(ui(locale, "completeSavedNote"), { at: session.savedAt })}
        </p>
      ) : null}
      <p className="u2-create__note">{ui(locale, "completeReceiptNote")}</p>
      <p className="u2-create__note">{ui(locale, "completeLibraryNote")}</p>
      <div className="u2-create__actions">
        <button type="button" data-testid="u2-create-complete-back" onClick={onBack}>{ui(locale, "editLabel")}</button>
      </div>
    </section>
  );
}

/** Explicit confirm for destructive navigation with a dirty draft. */
export function CreateDirtyDialog({
  locale,
  state,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  state: CreateReducerState;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const pending = state.ui.pending;
  if (pending === null) return null;
  return (
    <Dialog.Root open onOpenChange={(open) => { if (!open) onCancel(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="u2-overlay" />
        <Dialog.Content className="u2-overlay__content" data-testid="u2-create-dirty-dialog">
          <header className="u2-overlay__head">
            <div>
              <Dialog.Title>{ui(locale, "dirtyTitle")}</Dialog.Title>
              <Dialog.Description>{ui(locale, "dirtyBody")}</Dialog.Description>
            </div>
          </header>
          <div className="u2-overlay__body">
            <div className="u2-create__actions">
              <button type="button" data-testid="u2-create-dirty-confirm" onClick={onConfirm}>{ui(locale, "dirtyDiscard")}</button>
              <button type="button" className="u2-create__primary" data-testid="u2-create-dirty-cancel" onClick={onCancel}>{ui(locale, "dirtyKeep")}</button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function versionLabel(locale: Locale, version: ServiceArtifactVersion): string {
  return template(ui(locale, "versionNumberLabel"), { number: version.versionNumber });
}
