import type { Locale } from "@minsaj/contracts";

export type UniversalServiceId = "ask" | "learn" | "research" | "create" | "code" | "analyze" | "explore";

/** Logical composer inputs a tool may open (interaction-logic §2, row 4). */
export type ServiceToolAffordance = "file" | "voice" | "quality";

/** Icon keys are data, not components — the gateway maps them to lucide icons. */
export type ServiceToolIconKey =
  | "text"
  | "mic"
  | "brain"
  | "lightbulb"
  | "list"
  | "route"
  | "network"
  | "check"
  | "code"
  | "eye"
  | "sparkles"
  | "terminal"
  | "bug"
  | "table"
  | "chart"
  | "shield"
  | "compass";

/**
 * Work-mode tool — the interaction-logic §2 four-commitment matrix as data:
 * choosing a tool must update (1) the composer hint, (2) the expected output
 * shape, (3) the quick starts, (4) the composer affordances. All four live
 * here so the gateway consumes data, not hard-coded arrays (architecture A-5).
 */
export type UniversalServiceTool = {
  id: string;
  label: string;
  iconKey: ServiceToolIconKey;
  /** Commitment 1 — composer placeholder for this tool. */
  hint: string;
  /** Commitment 2 — expected output shape, shown on the ready artifact. */
  outputTitle: string;
  /** Commitment 3 — three tool-specific quick starts. */
  starters: readonly [string, string, string];
  /** Commitment 4 — logical inputs this tool opens (empty = text only). */
  affordances: readonly ServiceToolAffordance[];
};

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
  /** Work-mode toolkit (three tools per service — interaction-logic §2). */
  tools: readonly [UniversalServiceTool, UniversalServiceTool, UniversalServiceTool];
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
    outputBody: "سيفهم منسج مقصدك أولًا، ثم يقترح أفضل طريقة للإجابة أو الإنجاز.",
    tools: [
      { id: "files", label: "ملفات", iconKey: "text", hint: "ارفع ملفًا أو اسأل عن أي شيء فيه…", outputTitle: "إجابة مبنية على ملفاتك", starters: ["لخّص هذا المستند", "استخرج الأرقام المهمة", "قارن بين هذين الملفين"], affordances: ["file"] },
      { id: "voice", label: "صوت", iconKey: "mic", hint: "اكتب سؤالك أو اضغط زر الصوت وتحدّث…", outputTitle: "إجابة سريعة على سؤالك", starters: ["بسّط لي مفهومًا معقدًا", "ساعدني في اتخاذ قرار", "رتّب أفكاري المتناثرة"], affordances: ["voice"] },
      { id: "context", label: "سياق ذكي", iconKey: "brain", hint: "اسأل بصوت مرتفع — منسج يربط سؤالك بجلساتك السابقة…", outputTitle: "إجابة موصولة بسياقك", starters: ["أكمل نقاشنا السابق", "ما رأيك بخطتي؟", "ذكّرني بما قررناه"], affordances: [] },
    ],
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
    tools: [
      { id: "explain", label: "شرح تفاعلي", iconKey: "lightbulb", hint: "ما الموضوع الذي تريد فهمه؟ وما مستواك الحالي؟", outputTitle: "شرح متدرج مع أمثلة", starters: ["علّمني الإحصاء من الصفر", "اشرح لي التفاضل ببساطة", "ما الفرق بين المفهومين؟"], affordances: [] },
      { id: "checks", label: "اختبار فهم", iconKey: "list", hint: "حدد الموضوع وسأقيس فهمك بأسئلة قصيرة…", outputTitle: "تقييم فهم مع توجيه", starters: ["اختبر فهمي لهذا الفصل", "أسئلة سريعة على الدرس", "أين أخطأت في هذا المفهوم؟"], affordances: [] },
      { id: "path", label: "خطة تقدّم", iconKey: "route", hint: "حدد هدفك التعليمي والمدة المتاحة…", outputTitle: "خطة تعلم مجدولة", starters: ["ضع لي خطة تعلم لمدة 30 يومًا", "خطة مكثفة لأسبوع واحد", "أتعلم بالتوازي مع عملي"], affordances: [] },
    ],
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
    outputBody: "سيعرض منسج نطاق البحث ومصادره وتقدمه، ويمكنك تعديل المسار في أي لحظة.",
    tools: [
      { id: "web", label: "بحث الويب", iconKey: "network", hint: "اكتب سؤال البحث والنطاق المطلوب…", outputTitle: "تقرير بمصادر قابلة للتحقق", starters: ["ابحث في الدراسات الحديثة", "ما الجديد في هذا المجال؟", "اجمع أدلة الطرفين"], affordances: [] },
      { id: "academic", label: "مصادر أكاديمية", iconKey: "text", hint: "صف موضوعك وسأقصر البحث على المصادر المحكّمة…", outputTitle: "قائمة مصادر محكّمة موثقة", starters: ["دراسات محكّمة عن الموضوع", "أطروحات حديثة في هذا المجال", "قارن المنهجيات المستخدمة"], affordances: ["file"] },
      { id: "citations", label: "توثيق", iconKey: "check", hint: "ألصق نصك وسأفحص ادعاءاته ومصادره…", outputTitle: "توثيق ادعاءات مع درجات الثقة", starters: ["وثّق هذا التقرير", "تحقق من هذه الأرقام", "أين يحتاج نصي مصادر؟"], affordances: ["file"] },
    ],
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
    tools: [
      { id: "document", label: "مستند", iconKey: "code", hint: "ماذا تريد أن تكتب؟ صف الفكرة والجمهور والأسلوب…", outputTitle: "مسودة قابلة للتحرير", starters: ["اكتب عرضًا تقديميًا جذابًا", "صغ لي رسالة احترافية", "حوّل نقاطي إلى مقال"], affordances: [] },
      { id: "images", label: "صور", iconKey: "eye", hint: "صف الصورة المطلوبة بأكبر قدر من التفصيل…", outputTitle: "لوحة مرئيات قابلة للتعديل", starters: ["اقترح صورًا لمقالتي", "صمّم غلافًا للموضوع", "أكمل الهوية البصرية"], affordances: ["file"] },
      { id: "canvas", label: "لوحة إبداع", iconKey: "sparkles", hint: "ابدأ من فكرة خام وسنبنيها معًا على لوحة…", outputTitle: "لوحة إبداع مفتوحة", starters: ["حوّل فكرتي إلى قصة مصورة", "اجمع الأفكار في لوحة واحدة", "جرّب اتجاهين بصريين"], affordances: [] },
    ],
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
    outputBody: "يحوّل منسج الهدف إلى خطة وملفات ومعاينة، ويشرح كل تغيير قبل اعتماده.",
    tools: [
      { id: "editor", label: "محرر كود", iconKey: "terminal", hint: "صف ما تريد بناءه أو ألصق الكود…", outputTitle: "بيئة بناء بملفات ومعاينة", starters: ["ابنِ واجهة من هذه الفكرة", "حوّل فكرتي إلى مشروع", "حسّن هيكل مشروعي"], affordances: ["file"] },
      { id: "preview", label: "معاينة", iconKey: "eye", hint: "صف النتيجة المطلوبة وسأجهّز معاينة حية…", outputTitle: "معاينة حية قبل الاعتماد", starters: ["جرّب هذا المكوّن تفاعليًا", "أرني النتيجة على الهاتف", "اختبر الاستجابة للأحجام"], affordances: [] },
      { id: "debug", label: "فحص أخطاء", iconKey: "bug", hint: "ألصق الخطأ أو الكود الذي يسبب المشكلة…", outputTitle: "تشخيص خطوة بخطوة", starters: ["اشرح لي هذا الخطأ", "راجع الكود واقترح تحسينات", "لماذا يفشل هذا الاختبار؟"], affordances: ["file"] },
    ],
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
    tools: [
      { id: "tables", label: "جداول", iconKey: "table", hint: "صف بياناتك وسأنظّمها في جدول قابل للفرز", outputTitle: "جدول منسّق جاهز للنسخ", starters: ["حوّل هذا السجل إلى جدول", "نظّم بياناتي في أعمدة", "قارن هذه القوائم جدوليًا"], affordances: ["file"] },
      { id: "charts", label: "رسوم", iconKey: "chart", hint: "أعطني الأرقام وسأقترح الرسم الأنسب", outputTitle: "ملخص بصري قابل للتنزيل", starters: ["ارسم اتجاه المبيعات", "أرني المقارنة كمخطط", "حوّل الجدول إلى رسم"], affordances: ["file"] },
      { id: "quality", label: "تحقق بيانات", iconKey: "shield", hint: "الصق البيانات وسأفحص الاتساق والفجوات", outputTitle: "تقرير تحقق قابل للتتبّع", starters: ["افحص جودة هذا التقرير", "هل بياناتي متسقة؟", "ابحث عن القيم المفقودة"], affordances: ["quality"] },
    ],
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
    outputBody: "سيربط منسج بين أفكار متباعدة ويمنحك مسارات قصيرة أو عميقة حسب وقتك.",
    tools: [
      { id: "topics", label: "مواضيع منتقاة", iconKey: "compass", hint: "ما المجال الذي يثير فضولك اليوم؟", outputTitle: "جولة منتقاة في المجال", starters: ["خذني في جولة داخل علم الفلك", "أرني فكرة لم أسمع بها", "اقترح تجربة نهاية الأسبوع"], affordances: [] },
      { id: "map", label: "خريطة أفكار", iconKey: "network", hint: "اذكر فكرة وسأرسم ما حولها من أفكار…", outputTitle: "خريطة مفاهيم قابلة للتوسيع", starters: ["ارسم خريطة حول الذكاء الاصطناعي", "صِل بين هذه المفاهيم", "وسّع فكرتي شبكيًا"], affordances: [] },
      { id: "trails", label: "رحلات معرفية", iconKey: "route", hint: "اختر نقطة بداية وسأبني رحلة معرفية متصلة…", outputTitle: "رحلة معرفية متسلسلة", starters: ["ابنِ لي رحلة في التاريخ", "رحلة قصيرة قبل النوم", "سلسلة من الفيزياء إلى الفلسفة"], affordances: [] },
    ],
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
    outputBody: "Minsaj understands your intent first, then suggests the clearest way to answer or create.",
    tools: [
      { id: "files", label: "Files", iconKey: "text", hint: "Upload a file or ask anything about it…", outputTitle: "An answer grounded in your files", starters: ["Summarize this document", "Extract the key numbers", "Compare these two files"], affordances: ["file"] },
      { id: "voice", label: "Voice", iconKey: "mic", hint: "Type your question or press the voice button and talk…", outputTitle: "A quick answer to your question", starters: ["Make a complex idea simple", "Help me make a decision", "Organize my scattered thoughts"], affordances: ["voice"] },
      { id: "context", label: "Smart context", iconKey: "brain", hint: "Think out loud — Minsaj connects your question to your past sessions…", outputTitle: "An answer connected to your context", starters: ["Continue our earlier discussion", "What do you think of my plan?", "Remind me what we decided"], affordances: [] },
    ],
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
    tools: [
      { id: "explain", label: "Interactive explanation", iconKey: "lightbulb", hint: "What do you want to understand, and where are you starting from?", outputTitle: "A layered explanation with examples", starters: ["Teach me statistics from scratch", "Explain calculus simply", "What is the difference between the two?"], affordances: [] },
      { id: "checks", label: "Knowledge checks", iconKey: "list", hint: "Name the topic and I will measure your grasp with short questions…", outputTitle: "An understanding check with guidance", starters: ["Check my understanding of this chapter", "Quick questions on this lesson", "Where did I get this concept wrong?"], affordances: [] },
      { id: "path", label: "Progress path", iconKey: "route", hint: "Set your learning goal and the time you can give it…", outputTitle: "A scheduled learning plan", starters: ["Build a 30-day learning path", "An intensive one-week plan", "Learn alongside my job"], affordances: [] },
    ],
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
    outputBody: "Minsaj makes scope, sources, and progress visible, and lets you redirect the work at any point.",
    tools: [
      { id: "web", label: "Web research", iconKey: "network", hint: "Enter your research question and the scope you need…", outputTitle: "A report with verifiable sources", starters: ["Find the latest studies", "What is new in this field?", "Gather evidence from both sides"], affordances: [] },
      { id: "academic", label: "Academic sources", iconKey: "text", hint: "Describe your topic and I will limit the search to peer-reviewed sources…", outputTitle: "A documented list of peer-reviewed sources", starters: ["Peer-reviewed studies on this topic", "Recent theses in this field", "Compare the methodologies used"], affordances: ["file"] },
      { id: "citations", label: "Citations", iconKey: "check", hint: "Paste your text and I will examine its claims and sources…", outputTitle: "Claim citations with confidence levels", starters: ["Cite this report", "Verify these numbers", "Where does my text need sources?"], affordances: ["file"] },
    ],
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
    tools: [
      { id: "document", label: "Document", iconKey: "code", hint: "What would you like to write? Describe the idea, audience, and tone…", outputTitle: "An editable draft", starters: ["Draft a compelling presentation", "Write me a professional message", "Turn my bullet points into an article"], affordances: [] },
      { id: "images", label: "Images", iconKey: "eye", hint: "Describe the image you need in as much detail as you can…", outputTitle: "An editable visual board", starters: ["Suggest images for my article", "Design a cover for this topic", "Complete the visual identity"], affordances: ["file"] },
      { id: "canvas", label: "Creative canvas", iconKey: "sparkles", hint: "Start from a rough idea and we will build it together on a canvas…", outputTitle: "An open creative canvas", starters: ["Turn my idea into a visual story", "Gather the ideas on one board", "Try two visual directions"], affordances: [] },
    ],
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
    outputBody: "Minsaj turns your goal into a plan, files, and preview, explaining each proposed change before it lands.",
    tools: [
      { id: "editor", label: "Code editor", iconKey: "terminal", hint: "Describe what you want to build or paste the code…", outputTitle: "A build space with files and preview", starters: ["Build an interface from this idea", "Turn my idea into a project", "Improve my project structure"], affordances: ["file"] },
      { id: "preview", label: "Preview", iconKey: "eye", hint: "Describe the result you need and I will prepare a live preview…", outputTitle: "A live preview before you commit", starters: ["Try this component interactively", "Show me the result on a phone", "Test the responsive behavior"], affordances: [] },
      { id: "debug", label: "Error checks", iconKey: "bug", hint: "Paste the error or the code causing the problem…", outputTitle: "A step-by-step diagnosis", starters: ["Explain this error", "Review and improve my code", "Why does this test fail?"], affordances: ["file"] },
    ],
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
    tools: [
      { id: "tables", label: "Tables", iconKey: "table", hint: "Describe your data and I will organize it into a sortable table", outputTitle: "A formatted table ready to copy", starters: ["Turn this log into a table", "Organize my data into columns", "Compare these lists side by side"], affordances: ["file"] },
      { id: "charts", label: "Charts", iconKey: "chart", hint: "Give me the numbers and I will suggest the right chart", outputTitle: "A downloadable visual summary", starters: ["Chart the sales trend", "Show the comparison as a plot", "Turn the table into a chart"], affordances: ["file"] },
      { id: "quality", label: "Data checks", iconKey: "shield", hint: "Paste the data and I will examine consistency and gaps", outputTitle: "A traceable verification report", starters: ["Check the quality of this report", "Is my data consistent?", "Look for missing values"], affordances: ["quality"] },
    ],
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
    outputBody: "Minsaj connects distant ideas and offers a quick trail or a deep dive depending on your time.",
    tools: [
      { id: "topics", label: "Curated topics", iconKey: "compass", hint: "What sparks your curiosity today?", outputTitle: "A curated tour of the field", starters: ["Take me on a tour of astronomy", "Show me an idea I have never met", "Suggest a weekend experiment"], affordances: [] },
      { id: "map", label: "Idea map", iconKey: "network", hint: "Name an idea and I will map what surrounds it…", outputTitle: "An expandable concept map", starters: ["Map the ideas around AI", "Connect these concepts", "Expand my idea as a web"], affordances: [] },
      { id: "trails", label: "Knowledge trails", iconKey: "route", hint: "Pick a starting point and I will build a connected trail…", outputTitle: "A connected knowledge trail", starters: ["Build me a journey through history", "A short trail before bed", "A series from physics to philosophy"], affordances: [] },
    ],
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
    personalize: "خصّص منسج",
    newTask: "ابدأ شيئًا جديدًا",
    search: "ابحث في كل شيء…",
    demo: "تجربة تفاعلية",
  },
  en: {
    home: "For you",
    library: "My library",
    recent: "Recent",
    advanced: "Advanced tools",
    personalize: "Personalize Minsaj",
    newTask: "Start something new",
    search: "Search everything…",
    demo: "Interactive preview",
  },
};
