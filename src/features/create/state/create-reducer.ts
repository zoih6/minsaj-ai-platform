import type {
  CreateBrief,
  CreateDraft,
  CreateFormat,
  CreateLength,
  CreateSaveState,
  CreateSessionState,
  CreateStageKey,
  CreateTone,
  ServiceArtifact,
  ServiceSession,
} from "@minsaj/contracts/services";
import { createSessionStateSchema, serviceUserTextSchema } from "@minsaj/contracts/services";
import {
  buildCreateDocumentAlternative,
  buildCreateDocumentDraft,
  buildCreateDocumentStructure,
  buildCreateDeckDraft,
  buildCreateDeckStructure,
  buildCreateVisualDraft,
  buildCreateVisualStructure,
  buildCreateVariants,
  deckReviewSuggestions,
  documentReviewSuggestions,
  getServiceFixtureCopy,
  type ServiceIdFactory,
} from "@minsaj/mock-api/services";
import { buildCreateArtifactRecords, draftFromArtifactContent } from "@minsaj/mock-api/services";

/**
 * Create slice state machine — U2.3.
 *
 * Every transition comes from a known deterministic action; nothing advances
 * because a timeout elapsed. Stage guards: no structure before a complete
 * brief, no draft before a variant decision (or an explicit continue-without),
 * no review while an alternative is pending or a visual alt text is missing,
 * no completion before the review pass resolves, and no silent overwrite:
 * every save, restore, and duplicate goes through `buildCreateArtifactRecords`
 * so the version lineage is explicit and testable.
 */

export const createStageKeys: readonly CreateStageKey[] = [
  "crt_format",
  "crt_brief",
  "crt_structure",
  "crt_variants",
  "crt_edit",
  "crt_review",
  "crt_version",
  "crt_complete",
];

export type CreateValidationKey =
  | "brief_incomplete"
  | "goal_invalid"
  | "variant_required"
  | "alt_required"
  | "alt_pending"
  | "last_block"
  | "last_slide"
  | "bullets_max"
  | "review_open"
  | null;

export type CreatePendingAction =
  | { kind: "restart" }
  | { kind: "variant"; variantId: string }
  | null;

export type CreateUiState = {
  stage: CreateStageKey;
  draftGoal: string;
  draftAudience: string;
  draftTone: CreateTone;
  draftLength: CreateLength;
  draftConstraints: string;
  currentSlideIndex: number;
  /** Read-only document preview, separate from the edit state. */
  previewing: boolean;
  /** Destructive action awaiting an explicit confirm (dirty navigation). */
  pending: CreatePendingAction;
  validation: CreateValidationKey;
};

export type CreateReducerState = {
  ui: CreateUiState;
  session: CreateSessionState;
};

export function createPreviewUiState(): CreateUiState {
  return {
    stage: "crt_format",
    draftGoal: "",
    draftAudience: "",
    draftTone: "neutral",
    draftLength: "medium",
    draftConstraints: "",
    currentSlideIndex: 0,
    previewing: false,
    pending: null,
    validation: null,
  };
}

export function emptyCreateSession(locale: "ar" | "en", mode: "guided" | "fast", at = "1970-01-01T00:00:00.000Z"): CreateSessionState {
  return createSessionStateSchema.parse({
    serviceId: "create",
    stateVersion: 1,
    locale,
    mode,
    format: null,
    brief: null,
    structure: null,
    variants: [],
    selectedVariantId: null,
    draft: null,
    alternatives: [],
    suggestions: [],
    saveState: "clean",
    savedVersionNumber: null,
    savedAt: null,
    artifact: null,
    versions: [],
    recordSeq: 0,
    reviewRequested: false,
    reviewCompleted: false,
    parentArtifactId: null,
    restoredFromVersionId: null,
    resumeStageKey: null,
    updatedAt: at,
  });
}

export function createInitialCreateState(locale: "ar" | "en", restored?: CreateSessionState): CreateReducerState {
  // A snapshot written mid-save ("saving") means the write itself landed;
  // normalize so no restored surface hangs in a transient state.
  const session = restored === undefined
    ? emptyCreateSession(locale, "guided")
    : restored.saveState === "saving" && restored.versions.length > 0
      ? { ...restored, saveState: "saved" as const }
      : restored;
  return {
    ui: { ...createPreviewUiState(), stage: stageForSession(session) },
    session,
  };
}

/** Derives the stage purely from recorded state. */
export function derivedStageFor(session: CreateSessionState): CreateStageKey {
  if (session.format === null) return "crt_format";
  if (session.brief === null) return "crt_brief";
  if (session.structure === null) return "crt_structure";
  if (session.draft === null) return "crt_variants";
  if (!session.reviewRequested) return "crt_edit";
  if (!session.reviewCompleted) return "crt_review";
  if (session.savedVersionNumber === null) return "crt_version";
  if (session.saveState === "saved" || session.saveState === "restored") return "crt_complete";
  return "crt_version";
}

const reachableStages: Record<CreateStageKey, (session: CreateSessionState) => boolean> = {
  crt_format: () => true,
  crt_brief: (session) => session.format !== null,
  crt_structure: (session) => session.brief !== null,
  crt_variants: (session) => session.structure !== null,
  crt_edit: (session) => session.draft !== null,
  crt_review: (session) => session.draft !== null && session.reviewRequested,
  crt_version: (session) => session.draft !== null && session.reviewCompleted,
  crt_complete: (session) =>
    session.draft !== null && session.reviewCompleted && session.savedVersionNumber !== null
    && (session.saveState === "saved" || session.saveState === "restored"),
};

export function stageForSession(session: CreateSessionState): CreateStageKey {
  const recorded = session.resumeStageKey;
  if (recorded !== null && reachableStages[recorded](session)) {
    return recorded;
  }
  return derivedStageFor(session);
}

export type CreateAction =
  | { type: "mode/set"; mode: "guided" | "fast"; at: string }
  | { type: "format/select"; format: CreateFormat }
  | { type: "format/back" }
  | { type: "brief/draft"; field: "goal" | "audience" | "constraints"; value: string }
  | { type: "brief/tone"; tone: CreateTone }
  | { type: "brief/length"; length: CreateLength }
  | { type: "brief/submit"; at: string }
  | { type: "structure/confirm"; at: string }
  | { type: "structure/back" }
  | { type: "variant/select"; variantId: string }
  | { type: "variants/confirm"; at: string }
  | { type: "variants/continue-without"; at: string }
  | { type: "variants/back" }
  | { type: "edit/variants" }
  | { type: "edit/title"; value: string }
  | { type: "outline/label"; id: string; label: string }
  | { type: "outline/add"; label: string }
  | { type: "outline/remove"; id: string }
  | { type: "block/add"; blockType: "heading" | "paragraph" | "list" }
  | { type: "block/text"; id: string; text: string }
  | { type: "block/delete"; id: string }
  | { type: "block/move"; id: string; direction: "up" | "down" }
  | { type: "alternative/accept"; id: string; at: string }
  | { type: "alternative/reject"; id: string }
  | { type: "slide/select"; index: number }
  | { type: "slide/add" }
  | { type: "slide/duplicate"; id: string }
  | { type: "slide/delete"; id: string }
  | { type: "slide/move"; id: string; direction: "up" | "down" }
  | { type: "slide/title"; id: string; value: string }
  | { type: "slide/body"; id: string; value: string }
  | { type: "slide/notes"; id: string; value: string }
  | { type: "visual/caption"; value: string }
  | { type: "visual/alt"; value: string }
  | { type: "review/request"; at: string }
  | { type: "suggestion/accept"; id: string }
  | { type: "suggestion/reject"; id: string }
  | { type: "review/complete"; at: string }
  | { type: "review/back" }
  | { type: "complete/enter" }
  | { type: "save/begin"; at: string; workbenchSession: ServiceSession }
  | { type: "save/succeeded"; at: string }
  | { type: "save/failed" }
  | { type: "save/retry"; at: string; workbenchSession: ServiceSession }
  | { type: "restore/apply"; versionId: string; at: string }
  | { type: "duplicate/apply"; at: string; workbenchSession: ServiceSession }
  | { type: "restart/request" }
  | { type: "variant/change-request"; variantId: string }
  | { type: "pending/confirm"; at: string; workbenchSession: ServiceSession }
  | { type: "pending/cancel" }
  | { type: "preview/toggle" }
  | { type: "validation/set"; key: CreateValidationKey }
  | { type: "session/restored"; session: CreateSessionState };

function touch(session: CreateSessionState, at: string, saveState?: CreateSaveState): CreateSessionState {
  return {
    ...session,
    ...(saveState === undefined ? {} : { saveState }),
    updatedAt: at,
  };
}

/** Any edit after a save/restored state marks the draft dirty. */
function editSession(session: CreateSessionState, at: string, patch: Partial<CreateSessionState>): CreateSessionState {
  const next: CreateSessionState = { ...session, ...patch, updatedAt: at };
  if (session.saveState === "clean" || session.saveState === "saved" || session.saveState === "restored") {
    next.saveState = "dirty";
  }
  return next;
}

function buildDraftFor(format: CreateFormat, locale: "ar" | "en", brief: CreateBrief, variantId: string): CreateDraft {
  if (format === "document") {
    return buildCreateDocumentDraft({ locale, length: brief.length, variantId });
  }
  if (format === "deck") {
    return buildCreateDeckDraft({ locale, length: brief.length, variantId });
  }
  return buildCreateVisualDraft({ locale, variantId });
}

function structureFor(format: CreateFormat, locale: "ar" | "en", brief: CreateBrief): CreateSessionState["structure"] {
  if (format === "document") return buildCreateDocumentStructure(locale, brief);
  if (format === "deck") return buildCreateDeckStructure(locale, brief);
  return buildCreateVisualStructure(locale);
}

function defaultVariantFor(format: CreateFormat): string {
  if (format === "deck") return "variant_narrative";
  if (format === "visual") return "vis_orbit";
  return "variant_standard";
}

/** Deterministic ids for records built inside the reducer. */
function reducerIdFactory(locale: "ar" | "en", start: number): ServiceIdFactory {
  let counter = start;
  return {
    next: (prefix: string) => `${prefix}create_${locale}_${(counter += 1)}`,
    reset: () => {
      counter = 0;
    },
    count: () => counter,
  };
}

function buildSaveRecords(state: CreateReducerState, workbenchSession: ServiceSession, at: string, reason: "first" | "save" | "restore", parentVersionId?: string): { session: CreateSessionState; artifact: ServiceArtifact } {
  const { session } = state;
  if (session.draft === null) {
    throw new Error("save requires a draft");
  }
  const ids = reducerIdFactory(session.locale, session.recordSeq);
  const { artifact, version } = buildCreateArtifactRecords({
    session: workbenchSession,
    create: { draft: session.draft, locale: session.locale },
    ids,
    at: Date.parse(at),
    ...(session.artifact === null ? {} : { artifact: session.artifact }),
    ...(parentVersionId === undefined ? {} : { parentVersionId }),
    reason,
    createdBy: reason === "restore" ? "local_transform" : "user",
  });
  const next: CreateSessionState = {
    ...session,
    artifact,
    versions: [...session.versions, version].slice(-24),
    recordSeq: Math.min(session.recordSeq + 2, 500),
    saveState: "saving",
    updatedAt: at,
  };
  return { session: next, artifact };
}

export function createReducer(state: CreateReducerState, action: CreateAction): CreateReducerState {
  const { ui, session } = state;

  switch (action.type) {
    case "mode/set": {
      const fixture = getServiceFixtureCopy(session.locale);
      const fast = action.mode === "fast";
      return {
        ui: {
          ...ui,
          draftGoal: fast && ui.draftGoal === "" ? fixture.brief : ui.draftGoal,
          draftAudience: fast && ui.draftAudience === "" ? fixture.audience : ui.draftAudience,
          validation: null,
        },
        session: touch({ ...session, mode: action.mode }, action.at),
      };
    }

    case "format/select": {
      if (session.draft !== null) {
        // A draft exists: switching format destroys work, so it needs an
        // explicit confirm. Nothing is discarded silently.
        return { ui: { ...ui, pending: { kind: "restart" } }, session };
      }
      return {
        ui: { ...ui, stage: "crt_brief", validation: null },
        session: touch({ ...session, format: action.format }, "1970-01-01T00:00:00.001Z"),
      };
    }

    case "format/back": {
      if (session.draft !== null) return state;
      return { ui: { ...ui, stage: "crt_format", validation: null }, session };
    }

    case "brief/draft": {
      const patch = action.field === "goal"
        ? { draftGoal: action.value }
        : action.field === "audience"
          ? { draftAudience: action.value }
          : { draftConstraints: action.value };
      return { ui: { ...ui, ...patch, validation: null }, session };
    }

    case "brief/tone":
      return { ui: { ...ui, draftTone: action.tone, validation: null }, session };

    case "brief/length":
      return { ui: { ...ui, draftLength: action.length, validation: null }, session };

    case "brief/submit": {
      const goal = ui.draftGoal.trim();
      const audience = ui.draftAudience.trim();
      if (goal === "" || audience === "") {
        return { ui: { ...ui, validation: "brief_incomplete" }, session };
      }
      if (!serviceUserTextSchema.safeParse(goal).success || !serviceUserTextSchema.safeParse(audience).success) {
        return { ui: { ...ui, validation: "goal_invalid" }, session };
      }
      const constraintsRaw = ui.draftConstraints.trim();
      const brief: CreateBrief = {
        goal,
        audience,
        tone: ui.draftTone,
        length: ui.draftLength,
        constraints: constraintsRaw === "" ? null : constraintsRaw,
      };
      const next: CreateSessionState = {
        ...session,
        brief,
        structure: structureFor(session.format ?? "document", session.locale, brief),
        updatedAt: action.at,
      };
      // Fast mode preselects the default variant so one confirm reaches the draft.
      const preselected = session.mode === "fast" ? defaultVariantFor(session.format ?? "document") : null;
      return {
        ui: { ...ui, stage: "crt_structure", validation: null },
        session: preselected === null ? next : { ...next, selectedVariantId: preselected },
      };
    }

    case "structure/confirm": {
      if (session.structure === null) return state;
      const format = session.format ?? "document";
      const variants = buildCreateVariants(format);
      const next: CreateSessionState = {
        ...session,
        variants,
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_variants", validation: null }, session: next };
    }

    case "structure/back": {
      if (session.brief === null) return state;
      return {
        ui: {
          ...ui,
          stage: "crt_brief",
          draftGoal: session.brief.goal,
          draftAudience: session.brief.audience,
          draftTone: session.brief.tone,
          draftLength: session.brief.length,
          draftConstraints: session.brief.constraints ?? "",
          validation: null,
        },
        session,
      };
    }

    case "variant/select": {
      // With a live draft, choosing a different variant is destructive: it
      // arms the explicit confirm instead of silently rebuilding the draft.
      if (session.draft !== null && action.variantId !== session.selectedVariantId) {
        return { ui: { ...ui, pending: { kind: "variant", variantId: action.variantId } }, session };
      }
      return { ui: { ...ui, validation: null }, session: { ...session, selectedVariantId: action.variantId } };
    }

    case "edit/variants": {
      // Back to the variants stage from a live draft: selection there arms the
      // confirm dialog rather than replacing content.
      if (session.draft === null) return state;
      return { ui: { ...ui, stage: "crt_variants", validation: null }, session };
    }

    case "variants/confirm": {
      if (session.structure === null || session.brief === null || session.format === null) return state;
      if (session.draft !== null) return state;
      const format = session.format;
      const variantId = session.selectedVariantId ?? (format === "visual" ? null : defaultVariantFor(format));
      if (variantId === null) {
        return { ui: { ...ui, validation: "variant_required" }, session };
      }
      const draft = buildDraftFor(format, session.locale, session.brief, variantId);
      const alternatives = format === "document"
        ? [buildCreateDocumentAlternative(session.locale, draft as Extract<CreateDraft, { format: "document" }>)]
        : [];
      const next: CreateSessionState = {
        ...session,
        selectedVariantId: variantId,
        draft,
        alternatives,
        suggestions: [],
        saveState: "dirty",
        reviewRequested: false,
        reviewCompleted: false,
        resumeStageKey: "crt_edit",
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_edit", currentSlideIndex: 0, validation: null }, session: next };
    }

    case "variants/continue-without": {
      if (session.structure === null || session.brief === null || session.format === null) return state;
      if (session.format === "visual") {
        return { ui: { ...ui, validation: "variant_required" }, session };
      }
      const draft = buildDraftFor(session.format, session.locale, session.brief, defaultVariantFor(session.format));
      const alternatives = session.format === "document"
        ? [buildCreateDocumentAlternative(session.locale, draft as Extract<CreateDraft, { format: "document" }>)]
        : [];
      const next: CreateSessionState = {
        ...session,
        selectedVariantId: null,
        draft,
        alternatives,
        suggestions: [],
        saveState: "dirty",
        reviewRequested: false,
        reviewCompleted: false,
        resumeStageKey: "crt_edit",
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_edit", currentSlideIndex: 0, validation: null }, session: next };
    }

    case "variants/back":
      return { ui: { ...ui, stage: "crt_structure", validation: null }, session };

    case "edit/title": {
      if (session.draft === null || session.draft.format === "visual") return state;
      const draft = { ...session.draft, title: action.value };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "outline/label": {
      if (session.draft === null || session.draft.format !== "document") return state;
      const draft = {
        ...session.draft,
        outline: session.draft.outline.map((item) => (item.id === action.id ? { ...item, label: action.label } : item)),
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "outline/add": {
      if (session.draft === null || session.draft.format !== "document") return state;
      const label = action.label.trim();
      if (label === "" || session.draft.outline.length >= 12) return state;
      const draft = {
        ...session.draft,
        outline: [...session.draft.outline, { id: `out_u_${session.draft.outline.length + 1}`, label }],
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "outline/remove": {
      if (session.draft === null || session.draft.format !== "document") return state;
      if (session.draft.outline.length <= 1) return state;
      const draft = { ...session.draft, outline: session.draft.outline.filter((item) => item.id !== action.id) };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "block/add": {
      if (session.draft === null || session.draft.format !== "document") return state;
      if (session.draft.blocks.length >= 24) return state;
      const text = session.locale === "ar" ? "نص جديد" : "New text";
      const draft = {
        ...session.draft,
        blocks: [
          ...session.draft.blocks,
          { id: `blk_u_${session.draft.blocks.length + 1}`, type: action.blockType, text },
        ],
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "block/text": {
      if (session.draft === null || session.draft.format !== "document") return state;
      const draft = {
        ...session.draft,
        blocks: session.draft.blocks.map((block) => (block.id === action.id ? { ...block, text: action.text } : block)),
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "block/delete": {
      if (session.draft === null || session.draft.format !== "document") return state;
      if (session.draft.blocks.length <= 1) {
        return { ui: { ...ui, validation: "last_block" }, session };
      }
      const draft = { ...session.draft, blocks: session.draft.blocks.filter((block) => block.id !== action.id) };
      return { ui: { ...ui, validation: null }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "block/move": {
      if (session.draft === null || session.draft.format !== "document") return state;
      const index = session.draft.blocks.findIndex((block) => block.id === action.id);
      if (index === -1) return state;
      const target = action.direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= session.draft.blocks.length) return state;
      const blocks = [...session.draft.blocks];
      const [moved] = blocks.splice(index, 1);
      if (moved === undefined) return state;
      blocks.splice(target, 0, moved);
      const draft = { ...session.draft, blocks };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "alternative/accept": {
      if (session.draft === null || session.draft.format !== "document") return state;
      const alternative = session.alternatives.find((candidate) => candidate.id === action.id);
      if (alternative === undefined || alternative.status !== "proposed") return state;
      const draft = {
        ...session.draft,
        blocks: session.draft.blocks.map((block) =>
          block.id === alternative.blockId ? { ...block, text: alternative.proposedText } : block),
      };
      const alternatives = session.alternatives.map((candidate) =>
        candidate.id === action.id ? { ...candidate, status: "accepted" as const } : candidate);
      return { ui, session: editSession(session, action.at, { draft, alternatives }) };
    }

    case "alternative/reject": {
      const alternatives = session.alternatives.map((candidate) =>
        candidate.id === action.id ? { ...candidate, status: "rejected" as const } : candidate);
      if (alternatives.every((candidate, index) => candidate === session.alternatives[index])) return state;
      return { ui, session: editSession(session, session.updatedAt, { alternatives }) };
    }

    case "slide/select": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      if (action.index < 0 || action.index >= session.draft.slides.length) return state;
      return { ui: { ...ui, currentSlideIndex: action.index, validation: null }, session };
    }

    case "slide/add": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      if (session.draft.slides.length >= 16) return state;
      const title = session.locale === "ar" ? "شريحة جديدة" : "New slide";
      const bullet = session.locale === "ar" ? "نقطة أولى" : "First point";
      const draft = {
        ...session.draft,
        slides: [...session.draft.slides, { id: `sld_u_${session.draft.slides.length + 1}`, title, bullets: [bullet], notes: "" }],
      };
      return { ui: { ...ui, currentSlideIndex: draft.slides.length - 1 }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/duplicate": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      if (session.draft.slides.length >= 16) return state;
      const index = session.draft.slides.findIndex((slide) => slide.id === action.id);
      if (index === -1) return state;
      const source = session.draft.slides[index];
      if (source === undefined) return state;
      const slides = [...session.draft.slides];
      slides.splice(index + 1, 0, { ...source, id: `sld_u_${session.draft.slides.length + 1}` });
      const draft = { ...session.draft, slides };
      return { ui: { ...ui, currentSlideIndex: index + 1 }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/delete": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      // Guard: the final slide can never be deleted.
      if (session.draft.slides.length <= 1) {
        return { ui: { ...ui, validation: "last_slide" }, session };
      }
      const index = session.draft.slides.findIndex((slide) => slide.id === action.id);
      if (index === -1) return state;
      const draft = { ...session.draft, slides: session.draft.slides.filter((slide) => slide.id !== action.id) };
      const nextIndex = Math.min(ui.currentSlideIndex, draft.slides.length - 1);
      return { ui: { ...ui, currentSlideIndex: Math.max(0, nextIndex), validation: null }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/move": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      const index = session.draft.slides.findIndex((slide) => slide.id === action.id);
      if (index === -1) return state;
      const target = action.direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= session.draft.slides.length) return state;
      const slides = [...session.draft.slides];
      const [moved] = slides.splice(index, 1);
      if (moved === undefined) return state;
      slides.splice(target, 0, moved);
      const draft = { ...session.draft, slides };
      return { ui: { ...ui, currentSlideIndex: target }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/title": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      const draft = {
        ...session.draft,
        slides: session.draft.slides.map((slide) => (slide.id === action.id ? { ...slide, title: action.value } : slide)),
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/body": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      const lines = action.value.split("\n").map((line) => line.trim()).filter((line) => line !== "").slice(0, 6);
      if (lines.length === 0) return state;
      const draft = {
        ...session.draft,
        slides: session.draft.slides.map((slide) => (slide.id === action.id ? { ...slide, bullets: lines } : slide)),
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "slide/notes": {
      if (session.draft === null || session.draft.format !== "deck") return state;
      const draft = {
        ...session.draft,
        slides: session.draft.slides.map((slide) => (slide.id === action.id ? { ...slide, notes: action.value } : slide)),
      };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "visual/caption": {
      if (session.draft === null || session.draft.format !== "visual") return state;
      const draft = { ...session.draft, caption: action.value };
      return { ui, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "visual/alt": {
      if (session.draft === null || session.draft.format !== "visual") return state;
      const draft = { ...session.draft, altText: action.value };
      return { ui: { ...ui, validation: null }, session: editSession(session, session.updatedAt, { draft }) };
    }

    case "review/request": {
      if (session.draft === null) return state;
      if (session.draft.format === "visual" && session.draft.altText.trim() === "") {
        return { ui: { ...ui, validation: "alt_required" }, session };
      }
      if (session.alternatives.some((alternative) => alternative.status === "proposed")) {
        return { ui: { ...ui, validation: "alt_pending" }, session };
      }
      const ids = session.draft.format === "document"
        ? documentReviewSuggestions(session.locale, session.draft as Extract<CreateDraft, { format: "document" }>)
        : session.draft.format === "deck"
          ? deckReviewSuggestions(session.draft)
          : [];
      const suggestions = ids.map((id) => ({
        id,
        suggestionKey: `services.create.review.${id}`,
        ruleKey: "services.create.review.rule_local",
        status: "open" as const,
      }));
      const next: CreateSessionState = {
        ...session,
        suggestions,
        reviewRequested: true,
        resumeStageKey: "crt_review",
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_review", validation: null }, session: next };
    }

    case "suggestion/accept":
    case "suggestion/reject": {
      const status = action.type === "suggestion/accept" ? "accepted" as const : "rejected" as const;
      const suggestions = session.suggestions.map((suggestion) =>
        suggestion.id === action.id ? { ...suggestion, status } : suggestion);
      if (suggestions.every((suggestion, index) => suggestion === session.suggestions[index])) return state;
      return { ui, session: { ...session, suggestions, updatedAt: session.updatedAt } };
    }

    case "review/complete": {
      if (session.suggestions.some((suggestion) => suggestion.status === "open")) {
        return { ui: { ...ui, validation: "review_open" }, session };
      }
      if (session.alternatives.some((alternative) => alternative.status === "proposed")) {
        return { ui: { ...ui, validation: "alt_pending" }, session };
      }
      const next: CreateSessionState = {
        ...session,
        reviewCompleted: true,
        resumeStageKey: "crt_version",
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_version", validation: null }, session: next };
    }

    case "review/back":
      return { ui: { ...ui, stage: "crt_edit", validation: null }, session };

    case "save/begin": {
      if (session.draft === null || session.saveState === "saving") return state;
      // A save after a restore builds the new version on the restored one;
      // every other save continues the lineage from the current version.
      const restoreSave = session.saveState === "restored" && session.restoredFromVersionId !== null;
      const reason = session.artifact === null ? "first" : restoreSave ? "restore" : "save";
      const parentVersionId = restoreSave ? session.restoredFromVersionId ?? undefined : undefined;
      const { session: next } = buildSaveRecords(state, action.workbenchSession, action.at, reason, parentVersionId);
      return { ui: { ...ui, validation: null }, session: next };
    }

    case "save/succeeded": {
      if (session.saveState !== "saving" || session.versions.length === 0) return state;
      const version = session.versions[session.versions.length - 1];
      if (version === undefined) return state;
      const next: CreateSessionState = {
        ...session,
        saveState: "saved",
        savedVersionNumber: version.versionNumber,
        savedAt: action.at,
        restoredFromVersionId: null,
        resumeStageKey: "crt_version",
        updatedAt: action.at,
      };
      // The save keeps the user on their current stage: completion is a
      // deliberate step from the version surface, never an automatic jump.
      return { ui: { ...ui, validation: null }, session: next };
    }

    case "complete/enter": {
      if (!session.reviewCompleted || session.savedVersionNumber === null) return state;
      if (session.saveState !== "saved" && session.saveState !== "restored") return state;
      const next: CreateSessionState = { ...session, resumeStageKey: "crt_complete", updatedAt: session.updatedAt };
      return { ui: { ...ui, stage: "crt_complete", validation: null }, session: next };
    }

    case "save/failed": {
      if (session.saveState !== "saving") return state;
      // The write was rejected: nothing claims "saved" and retry stays visible.
      return { ui, session: { ...session, saveState: "storage_failed", updatedAt: session.updatedAt } };
    }

    case "save/retry": {
      if (session.saveState !== "storage_failed" || session.draft === null) return state;
      // Retry re-attempts the write of the already-built pending version.
      return { ui: { ...ui, validation: null }, session: { ...session, saveState: "saving" } };
    }

    case "restore/apply": {
      if (session.versions.length === 0) return state;
      const version = session.versions.find((candidate) => candidate.id === action.versionId);
      if (version === undefined) return state;
      if (session.artifact?.currentVersionId === version.id && session.saveState === "saved") {
        // Restoring the current saved version is a no-op with an honest note.
        return { ui, session: { ...session, saveState: "restored", updatedAt: action.at } };
      }
      const draft = draftFromArtifactContent(version.content, session.locale);
      const next: CreateSessionState = {
        ...session,
        draft,
        suggestions: [],
        reviewRequested: false,
        reviewCompleted: false,
        saveState: "restored",
        restoredFromVersionId: version.id,
        resumeStageKey: "crt_edit",
        updatedAt: action.at,
      };
      return { ui: { ...ui, stage: "crt_edit", currentSlideIndex: 0, previewing: false, validation: null }, session: next };
    }

    case "duplicate/apply": {
      if (session.draft === null || session.artifact === null) return state;
      const ids = reducerIdFactory(session.locale, session.recordSeq);
      const { artifact, version } = buildCreateArtifactRecords({
        session: action.workbenchSession,
        create: { draft: session.draft, locale: session.locale },
        ids,
        at: Date.parse(action.at),
        parentVersionId: session.artifact.currentVersionId,
        parentArtifactId: session.artifact.id,
        reason: "duplicate",
        createdBy: "user",
      });
      const next: CreateSessionState = {
        ...session,
        parentArtifactId: session.artifact.id,
        artifact,
        versions: [version],
        recordSeq: Math.min(session.recordSeq + 2, 500),
        saveState: "saved",
        savedVersionNumber: version.versionNumber,
        savedAt: action.at,
        updatedAt: action.at,
      };
      return { ui: { ...ui, validation: null }, session: next };
    }

    case "restart/request": {
      if (session.draft === null) return state;
      return { ui: { ...ui, pending: { kind: "restart" } }, session };
    }

    case "variant/change-request": {
      if (session.draft === null || session.brief === null || session.format === null) return state;
      if (action.variantId === session.selectedVariantId) return state;
      return { ui: { ...ui, pending: { kind: "variant", variantId: action.variantId } }, session };
    }

    case "pending/confirm": {
      const pending = ui.pending;
      if (pending === null) return state;
      if (pending.kind === "restart") {
        const fresh = emptyCreateSession(session.locale, session.mode, action.at);
        return { ui: { ...createPreviewUiState(), stage: "crt_format" }, session: fresh };
      }
      // Variant change: rebuild the draft from the newly chosen variant. The
      // old draft's unsaved edits are lost only because the user just
      // confirmed; the saved version history stays untouched.
      if (session.brief === null || session.format === null) return state;
      const draft = buildDraftFor(session.format, session.locale, session.brief, pending.variantId);
      const alternatives = session.format === "document"
        ? [buildCreateDocumentAlternative(session.locale, draft as Extract<CreateDraft, { format: "document" }>)]
        : [];
      const next: CreateSessionState = {
        ...session,
        selectedVariantId: pending.variantId,
        draft,
        alternatives,
        suggestions: [],
        saveState: "dirty",
        reviewRequested: false,
        reviewCompleted: false,
        resumeStageKey: "crt_edit",
        updatedAt: action.at,
      };
      return { ui: { ...ui, pending: null, stage: "crt_edit", currentSlideIndex: 0, validation: null }, session: next };
    }

    case "pending/cancel":
      return { ui: { ...ui, pending: null }, session };

    case "preview/toggle":
      return { ui: { ...ui, previewing: !ui.previewing }, session };

    case "validation/set":
      return { ui: { ...ui, validation: action.key }, session };

    case "session/restored": {
      const restored = action.session;
      // A snapshot written mid-save ("saving") means the write itself landed;
      // normalize to saved so the surface never hangs in a transient state.
      const normalized: CreateSessionState = restored.saveState === "saving" && restored.versions.length > 0
        ? { ...restored, saveState: "saved" }
        : restored;
      return { ui: { ...createPreviewUiState(), stage: stageForSession(normalized) }, session: normalized };
    }

    default:
      return state;
  }
}

/** True when the draft has changes that no successful save has recorded yet. */
export function isDraftDirty(session: CreateSessionState): boolean {
  return session.saveState === "dirty" || session.saveState === "storage_failed" || (session.saveState === "clean" && session.draft !== null);
}
