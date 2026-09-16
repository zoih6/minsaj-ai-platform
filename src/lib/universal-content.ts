import type { Locale } from "@nasaq/contracts";

export type UniversalServiceId = "ask" | "learn" | "research" | "create" | "code" | "analyze" | "explore";

export type UniversalService = {
  id: UniversalServiceId;
  slug: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  prompt: string;
  starters: readonly string[];
  outputTitle: string;
  outputBody: string;
};

const arServices: UniversalService[] = [
  {
    id: "ask",
    slug: "chat",
    label: "اسأل وتحدّث",
    shortLabel: "اسأل",
    eyebrow: "إجابة مرنة",
    description: "فكّر بصوت مرتفع، اسأل عن أي شيء، أو ابدأ مهمة بلا إعداد مسبق.",
    prompt: "اسأل، اكتب فكرة، أو صف ما تريد إنجازه…",
    starters: ["بسّط لي مفهومًا معقدًا", "ساعدني في اتخاذ قرار", "رتّب أفكاري المتناثرة"],
    outputTitle: "مساحة تفكير جاهزة",
    outputBody: "سيفهم نَسَق مقصدك أولًا، ثم يقترح أفضل طريقة للإجابة أو الإنجاز.",
  },
  {
    id: "learn",
    slug: "learn",
    label: "تعلّم بعمق",
    shortLabel: "تعلّم",
    eyebrow: "معلّم تفاعلي",
    description: "شرح متدرج، أمثلة وتمارين واختبارات قصيرة تتكيف مع مستواك.",
    prompt: "ما الموضوع الذي تريد أن تفهمه؟ وما مستواك الحالي؟",
    starters: ["علّمني الإحصاء من الصفر", "اختبر فهمي لهذا الفصل", "ضع لي خطة تعلم لمدة 30 يومًا"],
    outputTitle: "مسار تعلّم شخصي",
    outputBody: "سنبدأ من مستواك الحقيقي ونبني الفهم خطوة بخطوة بدل إعطائك إجابة للحفظ.",
  },
  {
    id: "research",
    slug: "research",
    label: "ابحث ووثّق",
    shortLabel: "ابحث",
    eyebrow: "بحث بمصادر",
    description: "استكشاف الويب والملفات، مقارنة الأدلة، وتقرير واضح مع مصادر قابلة للتحقق.",
    prompt: "اكتب سؤال البحث، النطاق، ونوع المصادر التي تفضلها…",
    starters: ["ابحث في الدراسات الحديثة", "قارن بين ثلاث وجهات نظر", "حوّل ملفاتي إلى تقرير موثّق"],
    outputTitle: "خطة بحث قابلة للتوجيه",
    outputBody: "سيعرض نَسَق نطاق البحث ومصادره وتقدمه، ويمكنك تعديل المسار في أي لحظة.",
  },
  {
    id: "create",
    slug: "create",
    label: "اكتب وصمّم",
    shortLabel: "أنشئ",
    eyebrow: "استوديو إبداعي",
    description: "نصوص، عروض، صور، أفكار وحملات تبدأ من مسودة وتتحول إلى مخرج مصقول.",
    prompt: "ماذا تريد أن تصنع؟ صف الفكرة والجمهور والأسلوب…",
    starters: ["اكتب عرضًا تقديميًا جذابًا", "حوّل فكرتي إلى قصة مصورة", "راجع النص وحسّن نبرته"],
    outputTitle: "لوحة إبداع مفتوحة",
    outputBody: "ستحصل على مسودة مرئية قابلة للتحرير مع بدائل للأسلوب والبنية، لا نتيجة مغلقة.",
  },
  {
    id: "code",
    slug: "code",
    label: "برمج وابنِ",
    shortLabel: "برمج",
    eyebrow: "شريك تطوير",
    description: "تعلّم البرمجة، اشرح خطأ، صمّم واجهة، أو ابنِ مشروعًا مع معاينة وخطوات واضحة.",
    prompt: "صف ما تريد بناءه، التقنية، أو ألصق الخطأ الذي تواجهه…",
    starters: ["اشرح لي هذا الخطأ", "ابنِ واجهة من هذه الفكرة", "راجع الكود واقترح تحسينات"],
    outputTitle: "بيئة بناء منظّمة",
    outputBody: "يحوّل نَسَق الهدف إلى خطة وملفات ومعاينة، ويشرح كل تغيير قبل اعتماده.",
  },
  {
    id: "analyze",
    slug: "analyze",
    label: "حلّل وافهم",
    shortLabel: "حلّل",
    eyebrow: "بيانات بوضوح",
    description: "ارفع جدولًا أو مستندًا، اكتشف الأنماط، واسأل عن الأرقام بلغة طبيعية.",
    prompt: "ارفع ملفًا أو صف البيانات والسؤال الذي تريد الإجابة عنه…",
    starters: ["استخرج أهم الأنماط", "أنشئ ملخصًا بصريًا", "تحقق من جودة هذه البيانات"],
    outputTitle: "تحليل يمكن تتبعه",
    outputBody: "سترى الافتراضات والخطوات والرسوم المقترحة، مع فصل ما هو مؤكد عما يحتاج تحققًا.",
  },
  {
    id: "explore",
    slug: "explore",
    label: "استكشف واكتشف",
    shortLabel: "استكشف",
    eyebrow: "فضول بلا حدود",
    description: "مواضيع وأفكار وتجارب جديدة منتقاة حسب فضولك، بعيدًا عن فقاعات التوصية المغلقة.",
    prompt: "ما المجال الذي يثير فضولك اليوم؟",
    starters: ["خذني في جولة داخل علم الفلك", "أرني فكرة لم أسمع بها", "اقترح تجربة نهاية الأسبوع"],
    outputTitle: "رحلة اكتشاف شخصية",
    outputBody: "سيربط نَسَق بين أفكار متباعدة ويمنحك مسارات قصيرة أو عميقة حسب وقتك.",
  },
];

const enServices: UniversalService[] = [
  {
    id: "ask",
    slug: "chat",
    label: "Ask & talk",
    shortLabel: "Ask",
    eyebrow: "Flexible answers",
    description: "Think out loud, ask anything, or begin a task without setting anything up.",
    prompt: "Ask a question, share an idea, or describe what you want to accomplish…",
    starters: ["Make a complex idea simple", "Help me make a decision", "Organize my scattered thoughts"],
    outputTitle: "A thinking space is ready",
    outputBody: "Nasaq understands your intent first, then suggests the clearest way to answer or create.",
  },
  {
    id: "learn",
    slug: "learn",
    label: "Learn deeply",
    shortLabel: "Learn",
    eyebrow: "Interactive tutor",
    description: "Layered explanations, examples, practice, and quick checks that adapt to your level.",
    prompt: "What do you want to understand, and where are you starting from?",
    starters: ["Teach me statistics from scratch", "Check my understanding of this chapter", "Build a 30-day learning path"],
    outputTitle: "Your learning path",
    outputBody: "We begin at your real level and build understanding step by step instead of handing you an answer to copy.",
  },
  {
    id: "research",
    slug: "research",
    label: "Research & verify",
    shortLabel: "Research",
    eyebrow: "Source-backed research",
    description: "Explore the web and your files, compare evidence, and produce a report with verifiable sources.",
    prompt: "Enter your research question, scope, and preferred source types…",
    starters: ["Find the latest studies", "Compare three perspectives", "Turn my files into a cited report"],
    outputTitle: "A steerable research plan",
    outputBody: "Nasaq makes scope, sources, and progress visible, and lets you redirect the work at any point.",
  },
  {
    id: "create",
    slug: "create",
    label: "Write & create",
    shortLabel: "Create",
    eyebrow: "Creative studio",
    description: "Writing, decks, visuals, ideas, and campaigns that move from rough thought to polished output.",
    prompt: "What would you like to create? Describe the idea, audience, and tone…",
    starters: ["Draft a compelling presentation", "Turn my idea into a visual story", "Polish this text and its voice"],
    outputTitle: "An open creative canvas",
    outputBody: "Start with an editable visual draft and explore alternatives for tone and structure—not a locked result.",
  },
  {
    id: "code",
    slug: "code",
    label: "Code & build",
    shortLabel: "Code",
    eyebrow: "Development partner",
    description: "Learn code, understand an error, design an interface, or build with previews and clear steps.",
    prompt: "Describe what you want to build, your stack, or paste the error you are facing…",
    starters: ["Explain this error", "Build an interface from this idea", "Review and improve my code"],
    outputTitle: "A structured build space",
    outputBody: "Nasaq turns your goal into a plan, files, and preview, explaining each proposed change before it lands.",
  },
  {
    id: "analyze",
    slug: "analyze",
    label: "Analyze & understand",
    shortLabel: "Analyze",
    eyebrow: "Data made clear",
    description: "Upload a sheet or document, uncover patterns, and ask questions about numbers in plain language.",
    prompt: "Upload a file or describe the data and the question you want answered…",
    starters: ["Find the key patterns", "Create a visual summary", "Check the quality of this dataset"],
    outputTitle: "Traceable analysis",
    outputBody: "See assumptions, steps, and suggested charts, with confirmed findings separated from what needs review.",
  },
  {
    id: "explore",
    slug: "explore",
    label: "Explore & discover",
    shortLabel: "Explore",
    eyebrow: "Boundless curiosity",
    description: "Topics, ideas, and experiences tuned to your curiosity—not a closed recommendation bubble.",
    prompt: "What sparks your curiosity today?",
    starters: ["Take me on a tour of astronomy", "Show me an idea I have never met", "Suggest a weekend experiment"],
    outputTitle: "A personal discovery trail",
    outputBody: "Nasaq connects distant ideas and offers a quick trail or a deep dive depending on your time.",
  },
];

export const universalServices: Record<Locale, UniversalService[]> = {
  ar: arServices,
  en: enServices,
};

export function getUniversalService(locale: Locale, id: UniversalServiceId): UniversalService {
  const service = universalServices[locale].find((item) => item.id === id);
  if (!service) throw new Error(`Unknown service: ${id}`);
  return service;
}

export const universalLabels: Record<Locale, {
  home: string;
  library: string;
  recent: string;
  advanced: string;
  personalize: string;
  newTask: string;
  search: string;
  demo: string;
}> = {
  ar: {
    home: "لك",
    library: "مكتبتي",
    recent: "الأخيرة",
    advanced: "أدوات متقدمة",
    personalize: "خصّص نَسَق",
    newTask: "ابدأ شيئًا جديدًا",
    search: "ابحث في كل شيء…",
    demo: "تجربة تفاعلية",
  },
  en: {
    home: "For you",
    library: "My library",
    recent: "Recent",
    advanced: "Advanced tools",
    personalize: "Personalize Nasaq",
    newTask: "Start something new",
    search: "Search everything…",
    demo: "Interactive preview",
  },
};
