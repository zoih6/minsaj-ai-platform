import type {
  ServiceArtifact,
  ServiceArtifactContent,
  ServiceArtifactVersion,
  ServiceSession,
} from "@nasaq/contracts/services";
import { serviceArtifactSchema, serviceArtifactVersionSchema } from "@nasaq/contracts/services";
import type { CreateDraft } from "@nasaq/contracts/services";
import type { ServiceIdFactory } from "../ids";
import { toServiceTimestamp } from "../clock";
import { buildCreateVisualDraft, createVisualVariants, getCreateVisualVariant } from "./visuals";

/**
 * Create version record builders — U2.3.
 *
 * Pure functions that turn a Create draft into the shared artifact/version
 * records. Every save, restore, and duplicate goes through them so no surface
 * can hand-build a version: parent links, version numbers, change summaries,
 * and provenance stay consistent and testable.
 */

/** Maps a Create draft to the persisted artifact content of its kind. */
export function buildCreateArtifactContent(draft: CreateDraft): ServiceArtifactContent {
  if (draft.format === "document") {
    return {
      kind: "creative_document",
      title: draft.title,
      outline: draft.outline.map((item) => ({ id: item.id, label: item.label })),
      blocks: draft.blocks.map((block) => ({ id: block.id, type: block.type, text: block.text })),
    };
  }
  if (draft.format === "deck") {
    return {
      kind: "creative_deck",
      title: draft.title,
      slides: draft.slides.map((slide) => ({ id: slide.id, title: slide.title, bullets: [...slide.bullets], notes: slide.notes })),
    };
  }
  return {
    kind: "visual_concept",
    conceptId: draft.variantId,
    caption: draft.caption,
    altText: draft.altText,
    palette: [...draft.palette],
    ratio: draft.ratio,
  };
}

export function createArtifactKindForFormat(format: "document" | "deck" | "visual") {
  return format === "document" ? "creative_document" : format === "deck" ? "creative_deck" : "visual_concept" as const;
}

const changeSummaries = {
  ar: {
    first: "الإصدار الأول من المسودة التجريبية",
    save: "حفظ بعد تعديلات المستخدم",
    restore: "نسخة جديدة مبنية على إصدار سابق",
    duplicate: "نسخة مكررة تحمل عنوان الأصل وعلاقته",
  },
  en: {
    first: "First version of the demo draft",
    save: "Saved after user edits",
    restore: "New version built from an earlier one",
    duplicate: "Duplicated copy carrying the original title and relation",
  },
} as const;

export function createChangeSummary(locale: "ar" | "en", reason: "first" | "save" | "restore" | "duplicate"): string {
  return changeSummaries[locale][reason];
}

export type CreateArtifactRecordInput = {
  session: ServiceSession;
  /** Only the draft and locale are read; callers pass the live slice state. */
  create: { draft: CreateDraft; locale: "ar" | "en" };
  ids: ServiceIdFactory;
  at: number;
  /**
   * Existing artifact to append a version to (save/restore path). Omitted on
   * the first save and on a duplicate, which starts a new artifact identity.
   */
  artifact?: ServiceArtifact;
  /** Source version id recorded as the parent on a duplicate/branch. */
  parentVersionId?: string;
  /** Source artifact id recorded in provenance on a duplicate/branch. */
  parentArtifactId?: string;
  reason: "first" | "save" | "restore" | "duplicate";
  createdBy: "user" | "simulator" | "local_transform";
};

/**
 * Builds one artifact + version pair.
 *
 * - Appending (`artifact` provided): the artifact keeps its identity, the
 *   version number continues the lineage, and the previous current version
 *   becomes the parent. History never shrinks.
 * - New (`artifact` omitted): a fresh artifact id; a duplicate still carries
 *   the source's title, its parent-version link, and a provenance line naming
 *   the parent artifact.
 */
export function buildCreateArtifactRecords(input: CreateArtifactRecordInput): { artifact: ServiceArtifact; version: ServiceArtifactVersion } {
  const draft = input.create.draft;
  const kind = createArtifactKindForFormat(draft.format);
  const versionId = input.ids.next("av_");
  const ts = toServiceTimestamp(input.at);
  const locale = input.create.locale;

  if (input.artifact === undefined) {
    const artifactId = input.ids.next("art_");
    const artifact = serviceArtifactSchema.parse({
      id: artifactId,
      serviceId: "create",
      sessionId: input.session.id,
      kind,
      title: draft.title,
      status: "saved",
      currentVersionId: versionId,
      versionIds: [versionId],
      provenance: [
        locale === "ar" ? "مخرج تجريبي محلي قابل للتحرير" : "Local editable demo outcome",
        ...(input.parentArtifactId === undefined ? [] : [
          locale === "ar" ? `نسخة مكررة من ${input.parentArtifactId}` : `Duplicated from ${input.parentArtifactId}`,
        ]),
      ],
      warningCodes: [],
      createdAt: ts,
      updatedAt: ts,
    });
    const version = serviceArtifactVersionSchema.parse({
      id: versionId,
      artifactId,
      versionNumber: 1,
      ...(input.parentVersionId === undefined ? {} : { parentVersionId: input.parentVersionId }),
      createdBy: input.reason === "duplicate" ? "user" : input.createdBy,
      content: buildCreateArtifactContent(draft),
      changeSummary: createChangeSummary(locale, input.reason),
      createdAt: ts,
    });
    return { artifact, version };
  }

  const existing = input.artifact;
  const versionNumber = Math.min(existing.versionIds.length + 1, 500);
  const artifact = serviceArtifactSchema.parse({
    ...existing,
    kind,
    title: draft.title,
    status: "saved",
    currentVersionId: versionId,
    // The bounded list keeps the newest 24 ids; the full lineage stays in the
    // workbench's `artifactVersions` records, so restore never loses history.
    versionIds: [...existing.versionIds, versionId].slice(-24),
    updatedAt: ts,
  });
  const version = serviceArtifactVersionSchema.parse({
    id: versionId,
    artifactId: existing.id,
    versionNumber,
    // An explicit parent (a restore or a branch) wins over the default
    // continuation from the current version.
    parentVersionId: input.parentVersionId ?? existing.currentVersionId,
    createdBy: input.createdBy,
    content: buildCreateArtifactContent(draft),
    changeSummary: createChangeSummary(locale, input.reason),
    createdAt: ts,
  });
  return { artifact, version };
}

/** Rebuilds an editable draft from a saved version's content (restore path). */
export function draftFromArtifactContent(content: ServiceArtifactContent, locale: "ar" | "en"): CreateDraft {
  if (content.kind === "creative_document") {
    return {
      format: "document",
      title: content.title,
      outline: content.outline.map((item) => ({ id: item.id, label: item.label })),
      blocks: content.blocks.map((block) => ({ id: block.id, type: block.type, text: block.text })),
    };
  }
  if (content.kind === "creative_deck") {
    return {
      format: "deck",
      title: content.title,
      slides: content.slides.map((slide) => ({ id: slide.id, title: slide.title, bullets: [...slide.bullets], notes: slide.notes })),
    };
  }
  if (content.kind !== "visual_concept") {
    throw new Error("draftFromArtifactContent only rebuilds Create drafts");
  }
  // The visual title is fixture-derived (not user-editable in U2.3); the
  // user-editable caption and alt text come from the saved version itself.
  const variant = getCreateVisualVariant(content.conceptId) ?? createVisualVariants[0];
  if (variant === undefined) {
    throw new Error("create visual variants fixture is empty");
  }
  return {
    format: "visual",
    title: buildCreateVisualDraft({ locale, variantId: variant.id }).title,
    variantId: variant.id,
    ratio: content.ratio,
    palette: [...content.palette],
    caption: content.caption,
    altText: content.altText,
  };
}
