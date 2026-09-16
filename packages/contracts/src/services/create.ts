import { z } from "zod";
import { localeSchema } from "../index";
import { serviceArtifactSchema, serviceArtifactVersionSchema } from "./artifacts";
import { serviceLabelSchema, serviceProseSchema, serviceUserTextSchema } from "./text";

/**
 * Create slice contracts — U2.3.
 *
 * These shapes describe one creative session: the chosen output format, the
 * brief, the deterministic structure proposal, the variant shortlist, the
 * editable draft for that format, review suggestions, and the save/version
 * lifecycle. Everything is a local deterministic fixture or a user edit on top
 * of one: U2 performs no model call, no image generation, no real export, and
 * the receipt must always say so (`networkCalls: 0`).
 *
 * Ownership rules stay identical to the foundation: `Service*` names, no
 * widening of shared enums, and no promotion into a canonical Backend model.
 */

/** A stable block, slide, variant, or axis identity inside a fixture. */
export const createKeySchema = z.string().regex(/^[a-z0-9_]{3,40}$/u);

/** The three Create compositions; each owns a different draft shape. */
export const createFormatSchema = z.enum(["document", "deck", "visual"]);
export type CreateFormat = z.infer<typeof createFormatSchema>;

/**
 * The eight Create stages recorded on the foundation blueprint. `crt_format` is
 * the entry: choosing document/deck/visual is itself a stage, and the packet's
 * brief → structure → variants → edit → review → version → complete journey
 * follows it.
 */
export const createStageKeySchema = z.enum([
  "crt_format",
  "crt_brief",
  "crt_structure",
  "crt_variants",
  "crt_edit",
  "crt_review",
  "crt_version",
  "crt_complete",
]);
export type CreateStageKey = z.infer<typeof createStageKeySchema>;

export const createToneSchema = z.enum(["neutral", "warm", "formal", "playful"]);
export type CreateTone = z.infer<typeof createToneSchema>;

export const createLengthSchema = z.enum(["short", "medium", "long"]);
export type CreateLength = z.infer<typeof createLengthSchema>;

export const createBriefSchema = z.object({
  /** What the outcome must achieve; the goal of the piece. */
  goal: serviceUserTextSchema,
  audience: serviceLabelSchema,
  tone: createToneSchema,
  length: createLengthSchema,
  /** Optional extra constraints the user wrote. */
  constraints: serviceUserTextSchema.nullable(),
});
export type CreateBrief = z.infer<typeof createBriefSchema>;

/** One outline item for a document structure proposal. */
export const createOutlineItemSchema = z.object({
  id: createKeySchema,
  labelKey: serviceLabelSchema,
  /** Why the structure proposes this section; copy key. */
  reasonKey: serviceLabelSchema,
});
export type CreateOutlineItem = z.infer<typeof createOutlineItemSchema>;

/** One slide skeleton in a deck structure proposal. */
export const createSlideOutlineItemSchema = z.object({
  id: createKeySchema,
  labelKey: serviceLabelSchema,
  reasonKey: serviceLabelSchema,
});

export const createRatioSchema = z.enum(["ratio_1_1", "ratio_4_3", "ratio_16_9"]);
export type CreateRatio = z.infer<typeof createRatioSchema>;

/** One visual concept attribute in the structure proposal. */
export const createConceptAttributesSchema = z.object({
  ratio: createRatioSchema,
  /** Concept direction keys proposed for the variants stage. */
  conceptKeys: z.array(serviceLabelSchema).min(1).max(4),
});
export type CreateConceptAttributes = z.infer<typeof createConceptAttributesSchema>;

/** The deterministic structure proposal shown for user confirmation. */
export const createStructureSchema = z.discriminatedUnion("format", [
  z.object({
    format: z.literal("document"),
    title: serviceLabelSchema,
    outline: z.array(createOutlineItemSchema).min(1).max(12),
    rationaleKeys: z.array(serviceLabelSchema).min(1).max(6),
  }),
  z.object({
    format: z.literal("deck"),
    title: serviceLabelSchema,
    slides: z.array(createSlideOutlineItemSchema).min(1).max(16),
    rationaleKeys: z.array(serviceLabelSchema).min(1).max(6),
  }),
  z.object({
    format: z.literal("visual"),
    title: serviceLabelSchema,
    attributes: createConceptAttributesSchema,
    rationaleKeys: z.array(serviceLabelSchema).min(1).max(6),
  }),
]);
export type CreateStructure = z.infer<typeof createStructureSchema>;

/** A deterministic variant proposal. Document/deck variants re-order or trim; visual variants are demo assets. */
export const createVariantSchema = z.object({
  id: createKeySchema,
  /** Copy key describing the approach in one line. */
  labelKey: serviceLabelSchema,
  /** Copy key describing why this variant differs from the others. */
  differenceKey: serviceLabelSchema,
  /** Variant provenance: always a local deterministic proposal. */
  origin: z.literal("seeded_fixture"),
});
export type CreateVariant = z.infer<typeof createVariantSchema>;

/** Editable document draft blocks. */
export const createDocumentBlockSchema = z.object({
  id: z.string().min(3).max(40),
  type: z.enum(["heading", "paragraph", "list"]),
  text: serviceProseSchema,
});
export type CreateDocumentBlock = z.infer<typeof createDocumentBlockSchema>;

export const createDocumentDraftSchema = z.object({
  format: z.literal("document"),
  title: serviceLabelSchema,
  /** Editable outline; mirrors the block order intent and is user-editable. */
  outline: z.array(z.object({
    id: z.string().min(3).max(40),
    label: serviceLabelSchema,
  })).min(1).max(12),
  blocks: z.array(createDocumentBlockSchema).min(1).max(24),
});
export type CreateDocumentDraft = z.infer<typeof createDocumentDraftSchema>;

export const createDeckSlideSchema = z.object({
  id: z.string().min(3).max(40),
  title: serviceLabelSchema,
  /** Slide body as bullets. */
  bullets: z.array(serviceProseSchema).min(1).max(6),
  /** Speaker notes; editable and empty until the user writes them. */
  notes: z.string().max(4000),
});
export type CreateDeckSlide = z.infer<typeof createDeckSlideSchema>;

export const createDeckDraftSchema = z.object({
  format: z.literal("deck"),
  title: serviceLabelSchema,
  slides: z.array(createDeckSlideSchema).min(1).max(16),
});
export type CreateDeckDraft = z.infer<typeof createDeckDraftSchema>;

export const createVisualDraftSchema = z.object({
  format: z.literal("visual"),
  title: serviceLabelSchema,
  /** The selected demo variant; selection is explicit, never silent. */
  variantId: createKeySchema,
  ratio: createRatioSchema,
  /** Demo palette shipped with the selected variant; fixture data, not a picker. */
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/u)).min(2).max(6),
  caption: serviceLabelSchema,
  /** Alt text is required before the draft can be marked ready. */
  altText: z.string().max(600),
});
export type CreateVisualDraft = z.infer<typeof createVisualDraftSchema>;

export const createDraftSchema = z.discriminatedUnion("format", [
  createDocumentDraftSchema,
  createDeckDraftSchema,
  createVisualDraftSchema,
]);
export type CreateDraft = z.infer<typeof createDraftSchema>;

/** A proposed alternative for one document section, with an explicit decision. */
export const createDocumentAlternativeSchema = z.object({
  id: createKeySchema,
  /** The block this alternative proposes to replace. */
  blockId: z.string().min(3).max(40),
  /** Copy key for the intent behind the alternative. */
  intentKey: serviceLabelSchema,
  proposedText: serviceProseSchema,
  status: z.enum(["proposed", "accepted", "rejected"]),
});
export type CreateDocumentAlternative = z.infer<typeof createDocumentAlternativeSchema>;

/** A review suggestion over the draft, with an explicit resolution. */
export const createReviewSuggestionSchema = z.object({
  id: createKeySchema,
  /** Copy key for the suggestion itself. */
  suggestionKey: serviceLabelSchema,
  /** Copy key for the deterministic rule that produced it. */
  ruleKey: serviceLabelSchema,
  status: z.enum(["open", "accepted", "rejected"]),
});
export type CreateReviewSuggestion = z.infer<typeof createReviewSuggestionSchema>;

/**
 * Artifact save lifecycle inside Create. `saving` is a real, event-driven
 * transient state: the storage adapter's write result decides `saved` or
 * `storage_failed`; a failure never claims `saved` and always offers retry.
 */
export const createSaveStateSchema = z.enum(["clean", "dirty", "saving", "saved", "storage_failed", "restored"]);
export type CreateSaveState = z.infer<typeof createSaveStateSchema>;

export const createSessionStateSchema = z.object({
  serviceId: z.literal("create"),
  stateVersion: z.literal(1),
  locale: localeSchema,
  mode: z.enum(["guided", "fast"]),
  format: createFormatSchema.nullable(),
  brief: createBriefSchema.nullable(),
  /** Structure shown for confirmation; null until the brief is complete. */
  structure: createStructureSchema.nullable(),
  /** Variant shortlist (2–4) and the selected variant; null before the variants stage. */
  variants: z.array(createVariantSchema).max(4),
  selectedVariantId: createKeySchema.nullable(),
  draft: createDraftSchema.nullable(),
  /** Document section alternatives pending an explicit decision. */
  alternatives: z.array(createDocumentAlternativeSchema).max(4),
  /** Review suggestions pending an explicit resolution. */
  suggestions: z.array(createReviewSuggestionSchema).max(6),
  saveState: createSaveStateSchema,
  /** Version of the draft the last successful save produced; null before it. */
  savedVersionNumber: z.number().int().nonnegative().max(500).nullable(),
  /** Logical timestamp of the last save/restore decision. */
  savedAt: z.string().min(20).max(40).nullable(),
  /**
   * The create-owned artifact record. Its identity is stable across saves (the
   * same id gains versions); a duplicate/branch gets a new record while
   * keeping the parent relation below. Null until the first save.
   */
  artifact: serviceArtifactSchema.nullable(),
  /** Full version lineage owned by the Create slice; it only ever grows. */
  versions: z.array(serviceArtifactVersionSchema).max(24),
  /** Monotonic per-session counter used for deterministic record ids. */
  recordSeq: z.number().int().nonnegative().max(500),
  /** True once the user requested the review pass; false until then. */
  reviewRequested: z.boolean(),
  /** True once every suggestion and alternative was resolved. */
  reviewCompleted: z.boolean(),
  /** Parent artifact id when this draft started as a branch/duplicate. */
  parentArtifactId: z.string().min(4).max(64).nullable(),
  /** Version id the current draft was restored from; the next save builds a new version on it. */
  restoredFromVersionId: z.string().min(4).max(64).nullable(),
  /**
   * Where the user actually was. A stored value is honoured only when the
   * recorded facts support it, so a hand-edited snapshot cannot fake a stage.
   */
  resumeStageKey: createStageKeySchema.nullable().default(null),
  updatedAt: z.string().min(20).max(40),
});
export type CreateSessionState = z.infer<typeof createSessionStateSchema>;

/** Guard used by the workbench store before it hands a block back to Create. */
export function isCreateSessionState(value: unknown): value is CreateSessionState {
  return createSessionStateSchema.safeParse(value).success;
}
