import type { CreateStructure, CreateVisualDraft } from "@nasaq/contracts/services";
import type { Locale } from "@nasaq/contracts/services";

/**
 * Visual concept demo variants — U2.3.
 *
 * Exactly four local demo variants. Each is structured data (palette, ratio,
 * composition) that the web feature renders as inline SVG. No image
 * generation, no rendering engine, no crop, no export: the labels say "demo
 * asset" in both languages and the receipt repeats it.
 */

export const createVisualCompositionKinds = ["orbit", "grid", "waves", "arch"] as const;
export type CreateVisualCompositionKind = (typeof createVisualCompositionKinds)[number];

export type CreateVisualVariantFixture = {
  id: string;
  /** Which demo composition the variant uses. */
  composition: CreateVisualCompositionKind;
  ratio: "ratio_1_1" | "ratio_4_3" | "ratio_16_9";
  palette: readonly string[];
};

export const createVisualVariants: readonly CreateVisualVariantFixture[] = [
  { id: "vis_orbit", composition: "orbit", ratio: "ratio_1_1", palette: ["#554ce6", "#16bfea", "#f3f1ff"] },
  { id: "vis_grid", composition: "grid", ratio: "ratio_4_3", palette: ["#20bf8f", "#0e7a63", "#eaf8f3"] },
  { id: "vis_waves", composition: "waves", ratio: "ratio_16_9", palette: ["#d69e2e", "#8a5a12", "#fdf7e6"] },
  { id: "vis_arch", composition: "arch", ratio: "ratio_16_9", palette: ["#c54a4a", "#7a2f2f", "#fdf1f1"] },
];

export function getCreateVisualVariant(variantId: string): CreateVisualVariantFixture | undefined {
  return createVisualVariants.find((variant) => variant.id === variantId);
}

const visualCopy = {
  ar: {
    title: "تصور بصري: هوية تجربة الانتظار",
    conceptKeys: ["المركزية المدارية", "الشبكة المتوازنة", "الموجة الحيوية", "القوس الرحب"],
    caption: "تصور تجريبي لهوية الحملة بأشكال هندسية محلية.",
    altText: "تصور تجريبي: أشكال هندسية بسيطة بألوان محددة، بدون توليد صورة.",
  },
  en: {
    title: "Visual concept: waiting-time identity",
    conceptKeys: ["Orbiting centre", "Balanced grid", "Living wave", "Generous arch"],
    caption: "Demo concept for the campaign identity built from local geometric shapes.",
    altText: "Demo concept: simple geometric shapes in fixed colours; no image generation.",
  },
} as const;

/** Deterministic visual structure proposal: one ratio plus four concept directions. */
export function buildCreateVisualStructure(locale: Locale): CreateStructure {
  return {
    format: "visual",
    title: visualCopy[locale].title,
    attributes: {
      ratio: "ratio_1_1",
      conceptKeys: visualCopy[locale].conceptKeys.map((_, index) => `services.create.visuals.concepts.c${index + 1}`),
    },
    rationaleKeys: [
      "services.create.visuals.rationales.demo_assets",
      "services.create.visuals.rationales.ratio_palette_labels",
    ],
  };
}

/**
 * Builds the editable visual draft for one variant. `missingAlt` starts the
 * alt text empty so the required-alt gate before `ready` is reachable through
 * normal interaction; the caption is editable the same way.
 */
export function buildCreateVisualDraft(options: {
  locale: Locale;
  variantId: string;
  missingAlt?: boolean;
}): CreateVisualDraft {
  const fallback = createVisualVariants[0];
  const variant = getCreateVisualVariant(options.variantId) ?? fallback;
  if (variant === undefined) {
    throw new Error("create visual variants fixture is empty");
  }
  const text = visualCopy[options.locale];
  return {
    format: "visual",
    title: text.title,
    variantId: variant.id,
    ratio: variant.ratio,
    palette: [...variant.palette],
    caption: text.caption,
    altText: options.missingAlt ? "" : text.altText,
  };
}

/**
 * Structural comparison copy for the variant list. Differences are described
 * beyond the thumbnail: composition, ratio, and palette direction.
 */
export function visualVariantComparisonKeys(): string[] {
  return [
    "services.create.visuals.differences.vis_orbit",
    "services.create.visuals.differences.vis_grid",
    "services.create.visuals.differences.vis_waves",
    "services.create.visuals.differences.vis_arch",
  ];
}
