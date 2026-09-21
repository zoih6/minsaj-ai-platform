import type { Locale } from "@minsaj/contracts";
import { universalServices, universalLabels } from "@/lib/universal-content";

/* ------------------------------------------------------------------
   Marketing copy — the Master Template's text, bilingual.
   Source of truth order (craft: components-content):
   1. The approved master template (its AR copy is the design).
   2. The existing marketing dictionary (universal-marketing.tsx v18).
   3. The service dictionary (universal-content.ts) for cards/mock.
   Nothing invented: every string is template copy, existing copy,
   or a direct EN sibling of template copy.
   ------------------------------------------------------------------ */

export type MarketingCopy = {
  nav: { demo: string; services: string; adaptive: string; trust: string };
  open: string;
  menuOpen: string;
  menuClose: string;
  languageLabel: string;
  skipToContent: string;
  eyebrow: string;
  headlineA: string;
  headlineB: string;
  body: string;
  primary: string;
  secondary: string;
  noCard: string;
  noSetup: string;
  bilingual: string;
  aiBadge: string;
  demoLeadEyebrow: string;
  demoLeadTitle: string;
  demoLeadBody: string;
  demoTitle: string;
  simulation: string;
  mockBrand: string;
  send: string;
  conceptKicker: string;
  conceptTitle: string;
  conceptBody: string;
  forEveryone: string;
  audience: readonly string[];
  servicesEyebrow: string;
  servicesTitle: string;
  servicesBody: string;
  adaptiveEyebrow: string;
  adaptiveTitle: string;
  adaptiveBody: string;
  startFree: string;
  yourDay: string;
  dayMix: string;
  steps: readonly [string, string][];
  stepChips: readonly string[];
  controlNote: string;
  trustEyebrow: string;
  trustTitle: string;
  trustBody: string;
  trustCards: readonly { title: string; body: string }[];
  finalTitle: string;
  finalBody: string;
  finalCta: string;
  copyright: string;
  prototype: string;
};

const ar: MarketingCopy = {
  nav: { demo: "جرّبها", services: "الخدمات", adaptive: "كيف تتكيف؟", trust: "الثقة" },
  open: "ابدأ الآن",
  menuOpen: "فتح القائمة",
  menuClose: "إغلاق القائمة",
  languageLabel: "English",
  skipToContent: "تخطَّ إلى المحتوى",
  eyebrow: "منصة الذكاء الاصطناعي التي تُنسَج حولك",
  headlineA: "أفكارك خيوط،",
  headlineB: "ونحن ننسجها واقعًا.",
  body: "منسج تأخذ هدفك كأول خيط، تنسج حوله المعرفة والأدوات والمصادر، وتمنحك مخرجًا تستطيع استخدامه — سواء كنت تتعلم، تبحث، تكتب، تبرمج، تحلّل أو تستكشف.",
  primary: "ابدأ مجانًا",
  secondary: "شاهد العرض",
  noCard: "ابدأ بلا بطاقة",
  noSetup: "لا إعداد معقد",
  bilingual: "عربي وإنجليزي من الأصل",
  aiBadge: "مدعوم بالذكاء الاصطناعي",
  demoLeadEyebrow: "محاكاة حية",
  demoLeadTitle: "جرّبها الآن — قبل أن تبدأ",
  demoLeadBody: "اكتب ما تريد إنجازه، وشاهد كيف يهيّئ منسج المسار الأنسب لهدفك خطوة بخطوة.",
  demoTitle: "ماذا تريد أن تنجز اليوم؟",
  simulation: universalLabels.ar.demo,
  mockBrand: "MINSAJ / ADAPTIVE",
  send: "ابدأ",
  conceptKicker: "01 . البذرة",
  conceptTitle: "يبدأ كل شيء بخيط واحد",
  conceptBody: "هدفك أنت هو أول خيط – سؤال، فكرة، أو مشروع تريد إنجازه.",
  forEveryone: "لا تحتاج أن تكون خبيراً لتستفيد من الذكاء الاصطناعي.",
  audience: ["أتعلم", "أبحث", "أكتب", "أبرمج", "أحلّل", "أصنع", "أستكشف"],
  servicesEyebrow: "منصة واحدة · أبواب متعددة",
  servicesTitle: "ابدأ من هدف، لا من قائمة أدوات.",
  servicesBody: "كل خدمة لها تجربة مصممة لطبيعة المهمة، بينما يحافظ منسج على سياقك وملفاتك وتفضيلاتك في الخلفية.",
  adaptiveEyebrow: "تخصيص بلا قوالب",
  adaptiveTitle: "تتغير المنصة مع ما تريد إنجازه — لا مع مسماك الوظيفي.",
  adaptiveBody: "اختر أهدافك اليوم، عدّلها غدًا، أو ادخل مباشرة. تتقدم الأدوات المناسبة إلى الواجهة وتبقى الإمكانات المتخصصة قريبة دون أن تزحم الشاشة.",
  startFree: "ابدأ مجاناً",
  yourDay: "تجربتك اليوم",
  dayMix: "تعلّم + بحث + استكشاف",
  steps: [
    ["اختر مقصدك", "تعلّم، بحث، صناعة، برمجة أو مجرد فضول."],
    ["اضبط المسار", "منسج يسأل فقط عما يؤثر فعلًا في النتيجة."],
    ["اعمل بطريقتك", "محادثة، لوحة، مستند، كود أو تقرير بمصادر."],
  ],
  stepChips: ["تعلّم", "بحث", "فضول"],
  controlNote: "أنت تتحكم في الأهداف والذاكرة والتوصيات.",
  trustEyebrow: "الوضوح جزء من التجربة",
  trustTitle: "أنت تعرف دائمًا ماذا يحدث ولماذا.",
  trustBody: "المصادر، استخدام الأدوات، التكلفة، والذاكرة تظهر بوضوح. ويمكنك إيقاف التخصيص أو تغيير المسار في أي وقت.",
  trustCards: [
    { title: "خصوصية مفهومة", body: "ذاكرة قابلة للرؤية والإيقاف، وليست صندوقاً غامضاً." },
    { title: "مصادر للتحقق", body: "افتح المصدر واعرف أين تنتهي الحقيقة ويبدأ الاستنتاج." },
    { title: "اقتراحات للتعديل", body: "كل تخصيص يفسر نفسه ويمكن تغييره فوراً." },
  ],
  finalTitle: "مكان واحد يتسع لفضولك كله.",
  finalBody: "ابدأ بسؤال بسيط. دع منسج يفتح لك المسار المناسب.",
  finalCta: "استكشف منسج الآن",
  copyright: "منصة منسج للذكاء الاصطناعي © 2026",
  prototype: "نسخة تجريبية تفاعلية · لا تنفّذ خدمات خارجية بعد",
};

const en: MarketingCopy = {
  nav: { demo: "Try it", services: "Services", adaptive: "How it adapts", trust: "Trust" },
  open: "Get started",
  menuOpen: "Open menu",
  menuClose: "Close menu",
  languageLabel: "عربي",
  skipToContent: "Skip to content",
  eyebrow: "The AI platform woven around you",
  headlineA: "Your ideas are threads —",
  headlineB: "we weave them into reality.",
  body: "Minsaj takes your goal as the first thread, weaves knowledge, tools, and sources around it, and hands you an output you can actually use — whether you are learning, researching, writing, coding, analyzing, or exploring.",
  primary: "Start free",
  secondary: "See it work",
  noCard: "Start without a card",
  noSetup: "No complex setup",
  bilingual: "Arabic and English by design",
  aiBadge: "Powered by AI",
  demoLeadEyebrow: "Live simulation",
  demoLeadTitle: "Try it now — before you begin",
  demoLeadBody: "Type what you want to accomplish and watch Minsaj prepare the right path for your goal, step by step.",
  demoTitle: "What do you want to accomplish today?",
  simulation: universalLabels.en.demo,
  mockBrand: "MINSAJ / ADAPTIVE",
  send: "Start",
  conceptKicker: "01 · The seed",
  conceptTitle: "It all starts with one thread",
  conceptBody: "Your goal is the first thread — a question, an idea, or a project you want done.",
  forEveryone: "You should not need to be an expert to benefit from AI.",
  audience: ["I learn", "I research", "I write", "I code", "I analyze", "I create", "I explore"],
  servicesEyebrow: "One platform · many doors",
  servicesTitle: "Start with a goal, not a tool list.",
  servicesBody: "Each service is shaped for its kind of work while Minsaj keeps context, files, and preferences connected behind the scenes.",
  adaptiveEyebrow: "Personal, never boxed in",
  adaptiveTitle: "The platform changes with your goal — not your job title.",
  adaptiveBody: "Pick today’s goals, change them tomorrow, or jump straight in. Relevant tools move forward while specialist power stays nearby without crowding the screen.",
  startFree: "Start free",
  yourDay: "Your day",
  dayMix: "Learn + Research + Explore",
  steps: [
    ["Choose your intent", "Learn, research, create, code, or simply follow your curiosity."],
    ["Shape the path", "Minsaj asks only what can meaningfully improve the outcome."],
    ["Work your way", "Conversation, canvas, document, code, or a source-backed report."],
  ],
  stepChips: ["Learn", "Research", "Curiosity"],
  controlNote: "You control goals, memory, and recommendations.",
  trustEyebrow: "Clarity is part of the experience",
  trustTitle: "Always know what is happening and why.",
  trustBody: "Sources, tool use, cost, and memory remain visible. Turn personalization off or change direction whenever you want.",
  trustCards: [
    { title: "Understandable privacy", body: "Memory you can view and pause — not a black box." },
    { title: "Sources to verify", body: "Open the source and see where fact ends and inference begins." },
    { title: "Suggestions you can change", body: "Every personalization explains itself and can be changed instantly." },
  ],
  finalTitle: "One place for all of your curiosity.",
  finalBody: "Begin with a simple question. Let Minsaj open the right path.",
  finalCta: "Explore Minsaj now",
  copyright: "Minsaj AI Platform © 2026",
  prototype: "Interactive prototype · no external services execute yet",
};

export const marketingCopy: Record<Locale, MarketingCopy> = { ar, en };

/* The template's six service cards (the seventh service — explore —
   lives in the tag cloud, the mock pills, and the workflow chips). */
export function marketingServiceCards(locale: Locale) {
  return universalServices[locale].filter((service) => service.id !== "explore");
}
