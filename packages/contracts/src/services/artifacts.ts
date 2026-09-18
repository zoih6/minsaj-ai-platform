import { z } from "zod";
import {
  serviceArtifactIdSchema,
  serviceArtifactVersionIdSchema,
  serviceCodeProjectFixtureIdSchema,
  serviceDatasetFixtureIdSchema,
  serviceKnowledgeNodeIdSchema,
  serviceSessionIdSchema,
  serviceTimestampSchema,
} from "./ids";
import type { ServiceArtifactStatus } from "./enums";
import {
  serviceArtifactKindSchema,
  serviceArtifactStatusSchema,
  serviceArtifactVersionAuthorSchema,
  serviceIdSchema,
} from "./enums";
import { serviceLabelSchema, serviceProseSchema } from "./text";

/**
 * Artifact content union. Each kind exposes the minimum structure its service
 * needs to be reviewable, editable, and versioned. Service slices complete
 * their own editors; the foundation fixes identity, versioning, and provenance.
 */

const learningStepSchema = z.object({
  id: z.string().min(3).max(40),
  title: serviceLabelSchema,
  objective: serviceProseSchema,
  completed: z.boolean(),
});

export const learningPathContentSchema = z.object({
  kind: z.literal("learning_path"),
  topic: serviceLabelSchema,
  level: z.enum(["beginner", "intermediate", "advanced"]),
  steps: z.array(learningStepSchema).min(1).max(12),
});

/**
 * Create content kinds (U2.3) carry the full editable draft so a restored
 * version reproduces the working state exactly. New fields default so
 * foundation-era fixtures and snapshots keep parsing.
 */
export const createOutlineEntrySchema = z.object({
  id: z.string().min(3).max(40),
  label: serviceLabelSchema,
});
export type CreateOutlineEntry = z.infer<typeof createOutlineEntrySchema>;

export const creativeDocumentContentSchema = z.object({
  kind: z.literal("creative_document"),
  title: serviceLabelSchema,
  /** Editable outline recorded with the version; mirrors the draft's outline. */
  outline: z.array(createOutlineEntrySchema).max(12).default([]),
  blocks: z.array(z.object({
    id: z.string().min(3).max(40),
    type: z.enum(["heading", "paragraph", "list"]),
    text: serviceProseSchema,
  })).min(1).max(24),
});

export const creativeDeckSlideContentSchema = z.object({
  id: z.string().min(3).max(40),
  title: serviceLabelSchema,
  bullets: z.array(serviceProseSchema).max(6),
  /** Speaker notes; empty until the user writes them. */
  notes: z.string().max(4000).default(""),
});
export type CreateDeckSlideContent = z.infer<typeof creativeDeckSlideContentSchema>;

export const creativeDeckContentSchema = z.object({
  kind: z.literal("creative_deck"),
  title: serviceLabelSchema,
  slides: z.array(creativeDeckSlideContentSchema).min(1).max(16),
});

export const visualConceptRatioSchema = z.enum(["ratio_1_1", "ratio_4_3", "ratio_16_9"]);

export const visualConceptContentSchema = z.object({
  kind: z.literal("visual_concept"),
  /** Identifies the selected demo variant; never a generated image. */
  conceptId: z.string().min(3).max(40),
  caption: serviceLabelSchema,
  altText: z.string().max(600).default(""),
  palette: z.array(z.string().regex(/^#[0-9a-f]{6}$/u)).min(2).max(6),
  /** Recorded so restore reproduces the chosen framing; demo data. */
  ratio: visualConceptRatioSchema.default("ratio_16_9"),
});

export const codeProjectContentSchema = z.object({
  kind: z.literal("code_project"),
  projectFixtureId: serviceCodeProjectFixtureIdSchema,
  files: z.array(z.object({
    path: z.string().min(3).max(120),
    change: z.enum(["added", "modified", "deleted"]),
    additions: z.number().int().nonnegative().max(5000),
    deletions: z.number().int().nonnegative().max(5000),
  })).min(1).max(24),
  /** Fixture diff hunks; user text is never evaluated or injected. */
  diffHunks: z.array(z.object({
    filePath: z.string().min(3).max(120),
    header: serviceLabelSchema,
    lines: z.array(z.object({
      type: z.enum(["context", "added", "removed"]),
      text: serviceProseSchema,
    })).min(1).max(80),
  })).max(24),
});

export const analysisReportContentSchema = z.object({
  kind: z.literal("analysis_report"),
  datasetFixtureId: serviceDatasetFixtureIdSchema,
  question: serviceProseSchema,
  operation: z.enum(["count", "sum", "average", "min", "max", "group", "trend"]),
  columns: z.array(serviceLabelSchema).min(1).max(8),
  rows: z.array(z.array(z.union([z.string().max(60), z.number()]))).max(60),
  reconciliation: z.object({
    rowCount: z.number().int().nonnegative(),
    totalMatches: z.boolean(),
    warnings: z.array(z.string().min(3).max(60)).max(8),
  }),
});

export const discoveryTrailContentSchema = z.object({
  kind: z.literal("discovery_trail"),
  seed: serviceLabelSchema,
  depth: z.enum(["short", "deep"]),
  nodes: z.array(z.object({
    id: serviceKnowledgeNodeIdSchema,
    label: serviceLabelSchema,
    summary: serviceProseSchema,
    whyConnected: serviceProseSchema,
    visited: z.boolean(),
  })).min(1).max(12),
  edges: z.array(z.object({
    from: serviceKnowledgeNodeIdSchema,
    to: serviceKnowledgeNodeIdSchema,
    relation: serviceLabelSchema,
  })).max(24),
});

export const researchReportContentSchema = z.object({
  kind: z.literal("research_report"),
  question: serviceProseSchema,
  sections: z.array(z.object({
    id: z.string().min(3).max(40),
    heading: serviceLabelSchema,
    body: serviceProseSchema,
    evidenceIds: z.array(z.string().min(4).max(64)).max(12),
  })).min(1).max(16),
  limitations: z.array(serviceProseSchema).min(1).max(8),
});

export const serviceArtifactContentSchema = z.discriminatedUnion("kind", [
  learningPathContentSchema,
  researchReportContentSchema,
  creativeDocumentContentSchema,
  creativeDeckContentSchema,
  visualConceptContentSchema,
  codeProjectContentSchema,
  analysisReportContentSchema,
  discoveryTrailContentSchema,
]);
export type ServiceArtifactContent = z.infer<typeof serviceArtifactContentSchema>;

const artifactKindToService = {
  learning_path: "learn",
  research_report: "research",
  creative_document: "create",
  creative_deck: "create",
  visual_concept: "create",
  code_project: "code",
  analysis_report: "analyze",
  discovery_trail: "explore",
} as const satisfies Record<z.infer<typeof serviceArtifactKindSchema>, z.infer<typeof serviceIdSchema>>;

export function serviceForArtifactKind(kind: ServiceArtifactKindValue) {
  return artifactKindToService[kind];
}

export const serviceArtifactVersionSchema = z.object({
  id: serviceArtifactVersionIdSchema,
  artifactId: serviceArtifactIdSchema,
  versionNumber: z.number().int().positive().max(500),
  parentVersionId: serviceArtifactVersionIdSchema.optional(),
  createdBy: serviceArtifactVersionAuthorSchema,
  content: serviceArtifactContentSchema,
  changeSummary: serviceProseSchema,
  createdAt: serviceTimestampSchema,
});
export type ServiceArtifactVersion = z.infer<typeof serviceArtifactVersionSchema>;

export const serviceArtifactSchema = z.object({
  id: serviceArtifactIdSchema,
  serviceId: serviceIdSchema,
  sessionId: serviceSessionIdSchema,
  kind: serviceArtifactKindSchema,
  title: serviceLabelSchema,
  status: serviceArtifactStatusSchema,
  currentVersionId: serviceArtifactVersionIdSchema,
  versionIds: z.array(serviceArtifactVersionIdSchema).min(1).max(24),
  provenance: z.array(serviceLabelSchema).min(1).max(8),
  warningCodes: z.array(z.string().min(3).max(60)).max(12),
  createdAt: serviceTimestampSchema,
  updatedAt: serviceTimestampSchema,
});
export type ServiceArtifact = z.infer<typeof serviceArtifactSchema>;

export type ServiceArtifactKindValue = z.infer<typeof serviceArtifactKindSchema>;
export type { ServiceArtifactStatus };

/** Guard: artifact kind must belong to the service that produced it. */
export function artifactBelongsToService(artifact: ServiceArtifact, serviceId: z.infer<typeof serviceIdSchema>) {
  return artifact.serviceId === serviceId && serviceForArtifactKind(artifact.kind) === serviceId;
}
