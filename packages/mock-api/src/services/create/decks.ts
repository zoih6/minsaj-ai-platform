import type { CreateBrief, CreateDeckDraft, CreateDeckSlide, CreateStructure } from "@minsaj/contracts/services";
import type { Locale } from "@minsaj/contracts/services";

/**
 * Deck structure and draft builders — deterministic and bilingual.
 *
 * The fixture always ships at least five slides; `dense` grows the rail towards
 * the bounded maximum so reordering and overflow stay testable, and `rtlStress`
 * injects a long Arabic slide title plus a mixed-direction brand bullet.
 */

const deckCopy = {
  ar: {
    title: "عرض: خطة تحسين تجربة الانتظار",
    slides: [
      { title: "العنوان والوعد", bullets: ["ثلاث نتائج في ست شرائح", "قرار واحد مطلوب في النهاية"] },
      { title: "السياق", bullets: ["زمن الانتظار 12 دقيقة في يوليو", "تركّز الشكاوى في الذروة الصباحية"] },
      { title: "ما تغيّر", bullets: ["متوسط جديد 9.8 دقيقة", "رضا العملاء +8 نقاط"] },
      { title: "الخيارات", bullets: ["موظف دعم إضافي", "جدولة موسعة", "خدمة موعد رقمية"] },
      { title: "المخاطر", bullets: ["توسع بلا قياس", "فروق بين الفروع"] },
      { title: "القرار المطلوب", bullets: ["تثبيت الجدولة ربعًا إضافيًا", "مراجعة شهرية للنتائج"] },
    ],
    reasons: [
      "الوعد أولًا حتى يعرف الجمهور لماذا يستمر.",
      "السياق قبل التغيير ليُفهم حجم الأثر.",
      "الأرقام في المنتصف لأنها قلب القصة.",
      "الخيارات قبل المخاطر لأنها تفسّرها.",
      "المخاطر قبل القرار حتى يُقرر بعين مفتوحة.",
      "القرار أخيرًا ليختم العرض.",
    ],
    brandBullet: "لوحات Minsaj Analytics تؤكد أرقام QueueSense لهذا الربع.",
    longTitle: "شريحة تفصيلية بأثر تحسين تجربة الانتظار على مؤشرات الرضا وسلوك العملاء خلال الربع الثالث",
  },
  en: {
    title: "Deck: waiting-time improvement plan",
    slides: [
      { title: "Title and promise", bullets: ["Three outcomes in six slides", "One decision at the end"] },
      { title: "Context", bullets: ["12-minute average wait in July", "Complaints cluster in morning peaks"] },
      { title: "What changed", bullets: ["New 9.8-minute average", "Satisfaction up 8 points"] },
      { title: "Options", bullets: ["Extra support staff", "Extended scheduling", "Digital appointments"] },
      { title: "Risks", bullets: ["Expanding without measurement", "Branch-to-branch variance"] },
      { title: "The decision", bullets: ["Keep scheduling for one more quarter", "Monthly results review"] },
    ],
    reasons: [
      "The promise first, so the audience knows why to stay.",
      "Context before change frames the size of the impact.",
      "Numbers sit in the middle because they are the story's core.",
      "Options precede risks because they explain them.",
      "Risks before the decision keep eyes open.",
      "The decision closes the deck.",
    ],
    brandBullet: "Minsaj Analytics dashboards confirm this quarter's QueueSense figures.",
    longTitle: "A detailed slide on how waiting-time improvements shaped satisfaction and behaviour across Q3",
  },
} as const;

function copy(locale: Locale) {
  return deckCopy[locale];
}

/** Deterministic deck structure proposal; short briefs keep the first five slides. */
export function buildCreateDeckStructure(locale: Locale, brief: CreateBrief): CreateStructure {
  const text = copy(locale);
  const count = brief.length === "short" ? 5 : 6;
  return {
    format: "deck",
    title: text.title,
    slides: text.slides.slice(0, count).map((slide, index) => ({
      id: `sld_${index + 1}`,
      labelKey: `services.create.decks.slides.s${index + 1}`,
      reasonKey: `services.create.decks.reasons.s${index + 1}`,
    })),
    rationaleKeys: [
      "services.create.ui.rationale_promise_first",
      "services.create.ui.rationale_decision_close",
    ],
  };
}

/**
 * Builds the editable deck draft. Speaker notes start empty on purpose: the
 * surface must never claim notes exist before the user writes them. The
 * `variant_data_first` variant swaps the "What changed" block ahead of
 * "Context" so the choice is visible in the rail order.
 */
export function buildCreateDeckDraft(options: {
  locale: Locale;
  length: CreateBrief["length"];
  variantId: string;
  dense?: boolean;
  rtlStress?: boolean;
}): CreateDeckDraft {
  const text = copy(options.locale);
  const base: CreateDeckSlide[] = text.slides.slice(0, options.length === "short" ? 5 : 6).map((slide, index) => ({
    id: `sld_${index + 1}`,
    title: slide.title,
    bullets: [...slide.bullets],
    notes: "",
  }));

  let slides = base;
  if (options.variantId === "variant_data_first" && slides.length >= 3) {
    const first = slides[0];
    const second = slides[1];
    const third = slides[2];
    if (first !== undefined && second !== undefined && third !== undefined) {
      slides = [first, third, second, ...slides.slice(3)];
    }
  }

  if (options.rtlStress) {
    slides = [
      ...slides,
      { id: `sld_${slides.length + 1}`, title: text.longTitle, bullets: [text.brandBullet], notes: "" },
    ];
  }

  if (options.dense) {
    let index = 0;
    while (slides.length < 16) {
      const source = text.slides[index % text.slides.length];
      if (source === undefined) {
        break;
      }
      slides = [
        ...slides,
        { id: `sld_${slides.length + 1}`, title: `${source.title} (${slides.length + 1})`, bullets: [...source.bullets], notes: "" },
      ];
      index += 1;
    }
  }

  return {
    format: "deck",
    title: text.title,
    slides: slides.slice(0, 16),
  };
}

/** Review suggestions over a deck draft, from documented local rules. */
export function deckReviewSuggestions(draft: CreateDeckDraft): string[] {
  const ids: string[] = [];
  if (draft.slides.length >= 12) {
    ids.push("suggestion_deck_long");
  }
  if (draft.slides.every((slide) => slide.notes.trim().length === 0)) {
    ids.push("suggestion_deck_notes_empty");
  }
  if (draft.slides.some((slide) => slide.title.length > 90)) {
    ids.push("suggestion_deck_title_long");
  }
  return ids;
}
