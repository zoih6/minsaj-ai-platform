import type { CreateSessionState, CreateStructure, CreateVariant, CreateBrief, CreateDraft, ServiceArtifact, ServiceArtifactVersion, ServiceSession } from "@minsaj/contracts/services";
import { createSessionStateSchema } from "@minsaj/contracts/services";
import { buildServiceScenarioFixture } from "../fixtures";
import { createServiceIdFactory, type ServiceIdFactory } from "../ids";
import { buildCreateDocumentStructure, buildCreateDocumentDraft, buildCreateDocumentAlternative, documentReviewSuggestions } from "./documents";
import { buildCreateDeckStructure, buildCreateDeckDraft } from "./decks";
import { buildCreateVisualStructure, buildCreateVisualDraft } from "./visuals";
import { buildCreateVariants } from "./variants";
import { buildCreateArtifactRecords } from "./versions";

/**
 * Create state presets — U2.3.
 *
 * Presets are built from the same pure rules as the live surface, so a test or
 * an evidence capture can never observe a state the real flow cannot reach.
 * Each preset lands on the stage its recorded facts can support.
 */

export const createStatePresets = [
  "fresh",
  "format_chosen",
  "blank_brief",
  "conflicting_constraints",
  "structure_review",
  "no_variant",
  "document_draft",
  "deck_draft",
  "visual_missing_alt",
  "dense_document",
  "dense_deck",
  "rtl_stress",
  "document_reviewed",
  "version_saved",
  "restored_version",
  "storage_failed",
] as const;
export type CreateStatePreset = (typeof createStatePresets)[number];

export type CreatePresetInput = {
  readonly locale: "ar" | "en";
  readonly now: string;
  readonly preset: CreateStatePreset;
  readonly mode?: "guided" | "fast";
};

const presetBrief = (locale: "ar" | "en", overrides: Partial<CreateBrief> = {}): CreateBrief => ({
  goal: locale === "ar" ? "أقنع فريق القيادة بتثبيت جدولة الذروة ربعًا إضافيًا." : "Convince leadership to keep peak scheduling for one more quarter.",
  audience: locale === "ar" ? "فريق القيادة" : "Leadership team",
  tone: "formal",
  length: "medium",
  constraints: null,
  ...overrides,
});

const structureFor = (format: "document" | "deck" | "visual", locale: "ar" | "en", brief: CreateBrief): CreateStructure => {
  if (format === "document") return buildCreateDocumentStructure(locale, brief);
  if (format === "deck") return buildCreateDeckStructure(locale, brief);
  return buildCreateVisualStructure(locale);
};

const draftFor = (format: "document" | "deck" | "visual", locale: "ar" | "en", brief: CreateBrief, variantId: string, options: { dense?: boolean; rtlStress?: boolean; missingAlt?: boolean } = {}): CreateDraft => {
  if (format === "document") return buildCreateDocumentDraft({ locale, length: brief.length, variantId, ...(options.dense ? { dense: true } : {}), ...(options.rtlStress ? { rtlStress: true } : {}) });
  if (format === "deck") return buildCreateDeckDraft({ locale, length: brief.length, variantId, ...(options.dense ? { dense: true } : {}), ...(options.rtlStress ? { rtlStress: true } : {}) });
  return buildCreateVisualDraft({ locale, variantId, ...(options.missingAlt ? { missingAlt: true } : {}) });
};

export function createCreateStatePreset(input: CreatePresetInput): CreateSessionState {
  const locale = input.locale;
  const mode = input.mode ?? "guided";
  const brief = presetBrief(locale);

  const base = {
    serviceId: "create" as const,
    stateVersion: 1 as const,
    locale,
    mode,
    format: null,
    brief: null,
    structure: null,
    variants: [] as CreateVariant[],
    selectedVariantId: null,
    draft: null,
    alternatives: [],
    suggestions: [],
    saveState: "clean" as const,
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
    updatedAt: input.now,
  };

  if (input.preset === "fresh") {
    return createSessionStateSchema.parse(base);
  }

  if (input.preset === "format_chosen") {
    return createSessionStateSchema.parse({ ...base, format: "document", updatedAt: input.now });
  }

  if (input.preset === "blank_brief") {
    return createSessionStateSchema.parse({ ...base, format: "document", updatedAt: input.now });
  }

  if (input.preset === "conflicting_constraints") {
    // Formal tone plus a playful constraint: a declared, visible conflict.
    const conflicting = presetBrief(locale, {
      tone: "formal",
      constraints: locale === "ar" ? "نبرة مرحّة وغير رسمية" : "a playful, informal tone",
    });
    return createSessionStateSchema.parse({ ...base, format: "document", brief: conflicting, updatedAt: input.now });
  }

  const format: "document" | "deck" | "visual" =
    input.preset === "deck_draft" || input.preset === "dense_deck" ? "deck"
    : input.preset === "visual_missing_alt" ? "visual"
    : "document";

  if (input.preset === "structure_review") {
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      updatedAt: input.now,
    });
  }

  if (input.preset === "no_variant") {
    // The variant fixture is unavailable for this request: the shortlist is
    // empty and the surface must say so instead of inventing a default.
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      variants: [],
      selectedVariantId: null,
      updatedAt: input.now,
    });
  }

  const dense = input.preset === "dense_document" || input.preset === "dense_deck";
  const rtlStress = input.preset === "rtl_stress";
  const missingAlt = input.preset === "visual_missing_alt";
  const variantId = format === "visual" ? "vis_orbit" : format === "deck" ? "variant_narrative" : "variant_standard";
  const draft = draftFor(format, locale, brief, variantId, { dense, rtlStress, missingAlt });

  const variants = buildCreateVariants(format);
  const alternatives = format === "document" ? [buildCreateDocumentAlternative(locale, draft as Extract<CreateDraft, { format: "document" }>)] : [];

  if (input.preset === "document_draft" || input.preset === "deck_draft" || input.preset === "visual_missing_alt" || input.preset === "dense_document" || input.preset === "dense_deck" || input.preset === "rtl_stress") {
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      variants,
      selectedVariantId: variantId,
      draft,
      alternatives,
      saveState: "dirty",
      resumeStageKey: "crt_edit",
      updatedAt: input.now,
    });
  }

  if (input.preset === "document_reviewed") {
    const suggestions = documentReviewSuggestions(locale, draft as Extract<CreateDraft, { format: "document" }>)
      .map((id) => ({ id, suggestionKey: `services.create.review.${id}`, ruleKey: "services.create.review.rule_local", status: "open" as const }));
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      variants,
      selectedVariantId: variantId,
      draft,
      alternatives,
      suggestions,
      saveState: "dirty",
      reviewRequested: true,
      resumeStageKey: "crt_review",
      updatedAt: input.now,
    });
  }

  if (input.preset === "version_saved") {
    const { artifact, version } = presetSaveRecords(locale, draft, input.now, "save");
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      variants,
      selectedVariantId: variantId,
      draft,
      alternatives: [],
      saveState: "saved",
      savedVersionNumber: 1,
      savedAt: input.now,
      artifact,
      versions: [version],
      recordSeq: 2,
      reviewRequested: true,
      reviewCompleted: true,
      resumeStageKey: "crt_version",
      updatedAt: input.now,
    });
  }

  if (input.preset === "restored_version") {
    // Two saves: the first user save, then a restore-based new version. Both
    // records come from the same rules the live surface uses, so the lineage
    // (parent link, growing history) is exactly what a real session produces.
    const ids = createServiceIdFactory(`create_preset_${locale}`);
    const first = presetSaveRecords(locale, draft, input.now, "save", undefined, ids);
    const second = presetSaveRecords(locale, draft, input.now, "restore", first.artifact, ids);
    return createSessionStateSchema.parse({
      ...base,
      format,
      brief,
      structure: structureFor(format, locale, brief),
      variants,
      selectedVariantId: variantId,
      draft,
      alternatives: [],
      saveState: "restored",
      savedVersionNumber: 2,
      savedAt: input.now,
      artifact: second.artifact,
      versions: [first.version, second.version],
      restoredFromVersionId: first.version.id,
      recordSeq: 4,
      reviewRequested: true,
      reviewCompleted: true,
      resumeStageKey: "crt_version",
      updatedAt: input.now,
    });
  }

  // storage_failed: the write was attempted and rejected; retry stays visible.
  return createSessionStateSchema.parse({
    ...base,
    format,
    brief,
    structure: structureFor(format, locale, brief),
    variants,
    selectedVariantId: variantId,
    draft,
    alternatives: [],
    saveState: "storage_failed",
    savedVersionNumber: null,
    savedAt: null,
    reviewRequested: true,
    reviewCompleted: true,
    resumeStageKey: "crt_version",
    updatedAt: input.now,
  });
}

/** Scenario → preset mapping used by tests and evidence capture. */
export const createScenarioPresets: Partial<Record<string, CreateStatePreset>> = {
  happy: "fresh",
  needs_input: "blank_brief",
  warning: "conflicting_constraints",
  dense: "dense_document",
  rtl_stress: "rtl_stress",
  empty: "fresh",
  storage_failure: "storage_failed",
  failed_final: "no_variant",
};

/**
 * Builds one preset save record pair through the live save rules. A shared
 * `ids` factory keeps ids unique when a preset records more than one version.
 */
function presetSaveRecords(
  locale: "ar" | "en",
  draft: CreateDraft,
  now: string,
  reason: "save" | "restore",
  existing?: ServiceArtifact,
  ids?: ServiceIdFactory,
): { artifact: ServiceArtifact; version: ServiceArtifactVersion } {
  const session = buildServiceScenarioFixture({ serviceId: "create", scenarioId: "happy", locale }).session;
  const factory = ids ?? createServiceIdFactory(`create_preset_${locale}`);
  return buildCreateArtifactRecords({
    session,
    create: { draft, locale },
    ids: factory,
    at: Date.parse(now),
    ...(existing === undefined ? {} : { artifact: existing }),
    reason: existing === undefined ? "first" : reason,
    createdBy: reason === "restore" ? "local_transform" : "user",
  });
}
