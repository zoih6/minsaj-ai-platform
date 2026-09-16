import type { CreateBrief, CreateDocumentAlternative, CreateDocumentDraft, CreateStructure } from "@nasaq/contracts/services";
import type { Locale } from "@nasaq/contracts/services";

/**
 * Document structure and draft builders — deterministic and bilingual.
 *
 * The same (locale, length, variant) always yields the same outline, blocks,
 * and section alternative. The alternative is a seeded proposal with its own
 * reason; accepting it is the user's explicit decision, never a silent
 * overwrite.
 */

const documentCopy = {
  ar: {
    title: "موجز تنفيذي: أثر تجربة الانتظار",
    outlineLabels: ["الخلاصة التنفيذية", "السياق والمشكلة", "الخيارات المقترحة", "التوصية والخطوات"],
    outlineReasons: [
      "يبدأ الموجز بالقرار لأن الجمهور التنفيذي يقرأ أول فقرة فقط غالبًا.",
      "السياق قبل الخيارات حتى يُفهم سبب المقارنة.",
      "الخيارات الثلاثة تجعل المقارنة قابلة للفحص.",
      "التوصية أخيرة لتجمع ما سبق في قرار واحد.",
    ],
    rationales: ["البنية تبدأ بالقرار ثم الدليل", "كل قسم قابل للتحرير والحذف", "الطول يتبع اختيار الموجز"],
    paragraphs: [
      "انخفض متوسط زمن الانتظار من 12 إلى 9.8 دقيقة بين يوليو وسبتمبر، مع تحسّن ملحوظ في ساعات الذروة.",
      "يربط الاستبيان الداخلي هذا الانخفاض بارتفاع رضا العملاء بمقدار 8 نقاط على مقياس مئة.",
      "التوصية: تثبيت جدولة الذروة الحالية لربع إضافي قبل التوسع في فروع جديدة.",
    ],
    listItems: "خيار أول: إضافة موظف دعم في الذروة · خيار ثانٍ: جدولة موسعة · خيار ثالث: خدمة موعد رقمية",
    alternativeText: "التوصية: إبقاء الجدولة الحالية موضع مراجعة شهرية، مع قياس أثرها على الرضا قبل أي توسع.",
    alternativeIntent: "بديل أكثر حذرًا في الصياغة يربط التوصية بمراجعة شهرية قابلة للقياس.",
    brandParagraph: "تستخدم قياسات هذا الربع نظام QueueSense الداخلي، وتتوافق نتائجه مع لوحات Nasaq Analytics.",
    longHeading: "تقرير تفصيلي شامل حول أثر تحسين تجربة الانتظار على مؤشرات رضا العملاء وسلوكهم خلال الربع الثالث من العام",
  },
  en: {
    title: "Executive brief: waiting-time impact",
    outlineLabels: ["Executive summary", "Context and problem", "Options considered", "Recommendation and steps"],
    outlineReasons: [
      "The brief leads with the decision because executive readers often stop after one paragraph.",
      "Context precedes options so the comparison makes sense.",
      "Three options keep the comparison reviewable.",
      "The recommendation closes by collapsing the above into one decision.",
    ],
    rationales: ["Decision-first, then evidence", "Every section is editable and removable", "Length follows the brief choice"],
    paragraphs: [
      "Average waiting time dropped from 12 to 9.8 minutes between July and September, with the clearest gains at peak hours.",
      "The internal survey links that drop to an 8-point rise in customer satisfaction on a 100-point scale.",
      "Recommendation: keep the current peak scheduling for one more quarter before expanding to new branches.",
    ],
    listItems: "Option one: add peak-hour support staff · Option two: extended scheduling · Option three: digital appointment service",
    alternativeText: "Recommendation: keep the current scheduling under monthly review, measuring its satisfaction impact before any expansion.",
    alternativeIntent: "A more cautious phrasing that ties the recommendation to a measurable monthly review.",
    brandParagraph: "This quarter's measurements use the internal QueueSense system, and its results match the Nasaq Analytics dashboards.",
    longHeading: "A detailed report on how waiting-time improvements shaped customer satisfaction and behaviour across the third quarter",
  },
} as const;

function copy(locale: Locale) {
  return documentCopy[locale];
}

/** Block ids are stable so alternatives, tests, and versions address them. */
const blockId = (index: number) => `blk_doc_${index}`;

/**
 * Deterministic document structure proposal. `length` trims or extends the
 * outline: short keeps 3 sections, long keeps all 4, medium keeps 4.
 */
export function buildCreateDocumentStructure(locale: Locale, brief: CreateBrief): CreateStructure {
  const keep = brief.length === "short" ? 3 : 4;
  const outline = Array.from({ length: keep }, (_, index) => ({
    id: `sec_${index + 1}`,
    labelKey: `services.create.documents.sections.s${index + 1}`,
    reasonKey: `services.create.documents.reasons.s${index + 1}`,
  }));
  return {
    format: "document",
    title: copy(locale).title,
    outline,
    rationaleKeys: [
      "services.create.ui.rationale_decision_first",
      "services.create.ui.rationale_editable_sections",
      brief.length === "short"
        ? "services.create.ui.rationale_short_length"
        : "services.create.ui.rationale_full_length",
    ],
  };
}

/**
 * Builds the editable document draft. The variant reorders or trims blocks so
 * choosing one is visible in the draft itself; `dense` fills the bounded
 * maximum so overflow and scroll behaviour are testable; `rtlStress` injects a
 * long Arabic heading and a mixed-direction brand paragraph.
 */
export function buildCreateDocumentDraft(options: {
  locale: Locale;
  length: CreateBrief["length"];
  variantId: string;
  dense?: boolean;
  rtlStress?: boolean;
}): CreateDocumentDraft {
  const text = copy(options.locale);
  const compact = options.variantId === "variant_compact";
  const audienceFirst = options.variantId === "variant_audience_first";

  const paragraphs = compact ? text.paragraphs.slice(0, 2) : text.paragraphs;
  const blocks: CreateDocumentDraft["blocks"] = [];
  const outline: CreateDocumentDraft["outline"] = [];

  const sections = text.outlineLabels.slice(0, options.length === "short" ? 3 : 4);
  const ordered = audienceFirst ? [...sections.slice(0, 2).reverse(), ...sections.slice(2)] : sections;
  const firstParagraph = paragraphs[0] ?? text.paragraphs[0];

  ordered.forEach((section, index) => {
    outline.push({ id: `out_${index + 1}`, label: section });
    blocks.push({ id: blockId(blocks.length + 1), type: "heading", text: section });
    if (index === 0) {
      blocks.push({ id: blockId(blocks.length + 1), type: "paragraph", text: firstParagraph });
    } else if (index === 1) {
      blocks.push({ id: blockId(blocks.length + 1), type: "paragraph", text: paragraphs[1] ?? firstParagraph });
    } else if (index === 2) {
      blocks.push({ id: blockId(blocks.length + 1), type: "list", text: text.listItems });
    } else if (index === 3) {
      blocks.push({ id: blockId(blocks.length + 1), type: "paragraph", text: paragraphs[2] ?? firstParagraph });
    }
  });

  if (options.rtlStress) {
    outline.push({ id: `out_${outline.length + 1}`, label: text.brandParagraph });
    blocks.push({ id: blockId(blocks.length + 1), type: "heading", text: text.longHeading });
    blocks.push({ id: blockId(blocks.length + 1), type: "paragraph", text: text.brandParagraph });
  }

  if (options.dense) {
    // Fill towards the bounded maximum with deterministic repetitions.
    let index = 0;
    while (blocks.length < 24) {
      const source = text.paragraphs[index % text.paragraphs.length];
      blocks.push({ id: blockId(blocks.length + 1), type: "paragraph", text: `${source} (${index + 1})` });
      index += 1;
    }
  }

  return {
    format: "document",
    title: text.title,
    outline: outline.slice(0, 12),
    blocks: blocks.slice(0, 24),
  };
}

/**
 * The seeded alternative for one section. It targets the recommendation block
 * deterministically; the reducer only records the user's accept/reject.
 */
export function buildCreateDocumentAlternative(locale: Locale, draft: CreateDocumentDraft): CreateDocumentAlternative {
  const text = copy(locale);
  const lastHeadingIndex = [...draft.blocks].reverse().findIndex((block) => block.type === "heading");
  const targetIndex = lastHeadingIndex === -1 ? draft.blocks.length - 1 : draft.blocks.length - 1 - lastHeadingIndex;
  const target = draft.blocks[targetIndex] ?? draft.blocks[0];
  if (target === undefined) {
    throw new Error("document draft has no blocks to propose an alternative for");
  }
  return {
    id: "alt_recommendation",
    blockId: target.id,
    intentKey: "services.create.documents.alternative_intent",
    proposedText: text.alternativeText,
    status: "proposed",
  };
}

/** Review suggestions over a document draft, from documented local rules. */
export function documentReviewSuggestions(locale: Locale, draft: CreateDocumentDraft): string[] {
  const text = copy(locale);
  const ids: string[] = [];
  if (draft.blocks.length >= 16) {
    ids.push("suggestion_doc_long");
  }
  if (draft.blocks.every((block) => block.text.length < 40)) {
    ids.push("suggestion_doc_thin");
  }
  if (!draft.blocks.some((block) => block.text.includes(locale === "ar" ? "التوصية" : "Recommendation"))) {
    ids.push("suggestion_doc_no_recommendation");
  }
  if (draft.blocks.some((block) => block.text === text.brandParagraph)) {
    ids.push("suggestion_doc_brand_check");
  }
  if (draft.blocks.some((block) => block.type === "list")) {
    ids.push("suggestion_doc_list_block");
  }
  return ids;
}
