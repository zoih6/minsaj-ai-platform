import type { CreateFormat, CreateVariant } from "@nasaq/contracts/services";

/**
 * Variant shortlists per format — U2.3.
 *
 * Two to three structural variants for document/deck (re-order or trim) and
 * the four visual demo variants. Every variant carries a one-line label and a
 * difference description key so the comparison surface can explain itself
 * without relying on thumbnails alone.
 */

export const createDocumentVariantIds = ["variant_standard", "variant_audience_first", "variant_compact"] as const;
export type CreateDocumentVariantId = (typeof createDocumentVariantIds)[number];

export const createDeckVariantIds = ["variant_narrative", "variant_data_first"] as const;
export type CreateDeckVariantId = (typeof createDeckVariantIds)[number];

export function buildCreateVariants(format: CreateFormat): CreateVariant[] {
  if (format === "document") {
    return createDocumentVariantIds.map((id) => ({
      id,
      labelKey: `services.create.variants.document.${id}`,
      differenceKey: `services.create.variants.document.${id}_diff`,
      origin: "seeded_fixture" as const,
    }));
  }
  if (format === "deck") {
    return createDeckVariantIds.map((id) => ({
      id,
      labelKey: `services.create.variants.deck.${id}`,
      differenceKey: `services.create.variants.deck.${id}_diff`,
      origin: "seeded_fixture" as const,
    }));
  }
  return [
    { id: "vis_orbit", labelKey: "services.create.visuals.concepts.c1", differenceKey: "services.create.visuals.differences.vis_orbit", origin: "seeded_fixture" as const },
    { id: "vis_grid", labelKey: "services.create.visuals.concepts.c2", differenceKey: "services.create.visuals.differences.vis_grid", origin: "seeded_fixture" as const },
    { id: "vis_waves", labelKey: "services.create.visuals.concepts.c3", differenceKey: "services.create.visuals.differences.vis_waves", origin: "seeded_fixture" as const },
    { id: "vis_arch", labelKey: "services.create.visuals.concepts.c4", differenceKey: "services.create.visuals.differences.vis_arch", origin: "seeded_fixture" as const },
  ];
}
