import type { Locale } from "@nasaq/contracts";

export type Dictionary = {
  meta: { title: string; description: string };
  brand: { name: string; promise: string; demo: string };
  nav: Record<"home" | "chat" | "projects" | "agents" | "flows" | "knowledge" | "runs" | "models" | "tools" | "skills" | "usage" | "team" | "settings", string>;
  common: Record<"new" | "viewAll" | "continue" | "details" | "search" | "notifications" | "workspace" | "openMenu" | "collapse" | "expand" | "comingNext", string>;
  home: {
    eyebrow: string;
    greeting: string;
    intro: string;
    newChat: string;
    runAgent: string;
    createFlow: string;
    activeRuns: string;
    activeRunsHint: string;
    approvals: string;
    approvalsHint: string;
    recentProjects: string;
    recentProjectsHint: string;
    modelGuide: string;
    modelGuideHint: string;
    balance: string;
    balanceHint: string;
    used: string;
    conversations: string;
    runLabel: string;
    approvalAction: string;
  };
  marketing: {
    eyebrow: string;
    headlineA: string;
    headlineB: string;
    body: string;
    primary: string;
    secondary: string;
    proofTitle: string;
    chatTitle: string;
    chatBody: string;
    agentTitle: string;
    agentBody: string;
    flowTitle: string;
    flowBody: string;
    trust: string;
  };
  status: Record<"queued" | "planning" | "running" | "waiting_for_input" | "waiting_for_approval" | "completed" | "completed_with_warnings" | "failed_retryable" | "cancelled", string>;
};

const ar: Dictionary = {
  meta: {
    title: "نَسَق — تعلّم، ابحث، اصنع واكتشف",
    description: "منصة ذكاء اصطناعي عربية متكيفة للجميع: للتعلّم والبحث والكتابة والبرمجة والتحليل والاستكشاف.",
  },
  brand: {
    name: "نَسَق",
    promise: "كل ما تريد أن تتعلّمه، تصنعه، أو تكتشفه — في مساحة تتكيف معك.",
    demo: "تجربة تفاعلية",
  },
  nav: {
    home: "الرئيسية",
    chat: "المحادثة",
    projects: "المشاريع",
    agents: "الوكلاء",
    flows: "التدفقات",
    knowledge: "المعرفة",
    runs: "التشغيلات",
    models: "النماذج",
    tools: "الأدوات",
    skills: "المهارات",
    usage: "الاستخدام",
    team: "الفريق",
    settings: "الإعدادات",
  },
  common: {
    new: "جديد",
    viewAll: "عرض الكل",
    continue: "متابعة",
    details: "التفاصيل",
    search: "ابحث أو نفّذ أمرًا",
    notifications: "الإشعارات",
    workspace: "مساحة العمل",
    openMenu: "فتح القائمة",
    collapse: "طي الشريط الجانبي",
    expand: "توسيع الشريط الجانبي",
    comingNext: "هذه الوحدة ضمن موجة التنفيذ التالية",
  },
  home: {
    eyebrow: "مركز القيادة",
    greeting: "صباح العمل المنظّم، سارة",
    intro: "ابدئي من سؤال، أو تابعي تشغيلًا، أو حوّلي طريقة ناجحة إلى تدفق قابل للتكرار.",
    newChat: "محادثة جديدة",
    runAgent: "تشغيل وكيل",
    createFlow: "إنشاء تدفق",
    activeRuns: "التشغيلات النشطة",
    activeRunsHint: "ما يعمل الآن وما ينتظر تدخلك.",
    approvals: "تحتاج موافقتك",
    approvalsHint: "أفعال لن تُنفّذ قبل مراجعتك.",
    recentProjects: "المشاريع الأخيرة",
    recentProjectsHint: "السياق الذي يجمع محادثاتك وملفاتك وأدواتك.",
    modelGuide: "نماذج مناسبة الآن",
    modelGuideHint: "اقتراحات حسب السرعة والتكلفة ونوع المهمة — القرار لك.",
    balance: "الرصيد والاستخدام",
    balanceHint: "الرصيد المُدار مع استهلاك مفصول عن مفاتيحك الخاصة.",
    used: "مستخدم من ميزانية الشهر",
    conversations: "محادثة",
    runLabel: "فتح التشغيل",
    approvalAction: "راجع وقرّر",
  },
  marketing: {
    eyebrow: "مساحة عمل AI عربية أولًا",
    headlineA: "من سؤال واحد",
    headlineB: "إلى عملٍ له نَسَق.",
    body: "تحدث مع أفضل النماذج، فوّض المهام لوكلاء مضبوطين، ثم حوّل العمل المتكرر إلى تدفقات واضحة — مع سياق وتكلفة وموافقات في مكان واحد.",
    primary: "ابدأ مساحة العمل",
    secondary: "استكشف التجربة",
    proofTitle: "مسار واحد بدل ثلاث أدوات منفصلة",
    chatTitle: "اسأل وقارن",
    chatBody: "اختر نموذجًا أو قارن النتائج مع ظهور المزود ومصدر الدفع والتكلفة.",
    agentTitle: "فوّض مع بقاء السيطرة",
    agentBody: "خطة وخطوات وأدوات وحدود؛ وأي أثر مهم ينتظر موافقتك.",
    flowTitle: "حوّل النجاح إلى نظام",
    flowBody: "حوّل تشغيلًا ناجحًا إلى تدفق مرئي يمكن للفريق اختباره وتكراره.",
    trust: "BYOK + رصيد منصة · RTL أصلي · موافقات وإيصالات تنفيذ",
  },
  status: {
    queued: "في الانتظار",
    planning: "يخطط",
    running: "قيد التنفيذ",
    waiting_for_input: "ينتظر إجابتك",
    waiting_for_approval: "ينتظر موافقة",
    completed: "مكتمل",
    completed_with_warnings: "مكتمل مع تنبيه",
    failed_retryable: "تعذر مؤقتًا",
    cancelled: "أُلغي",
  },
};

const en: Dictionary = {
  meta: {
    title: "Nasaq — Learn, research, create, and discover",
    description: "An adaptive AI platform for everyone: learning, research, writing, coding, analysis, and exploration.",
  },
  brand: {
    name: "Nasaq",
    promise: "Everything you want to learn, create, or discover — in a space that adapts to you.",
    demo: "Interactive preview",
  },
  nav: {
    home: "Home",
    chat: "Chat",
    projects: "Projects",
    agents: "Agents",
    flows: "Flows",
    knowledge: "Knowledge",
    runs: "Runs",
    models: "Models",
    tools: "Tools",
    skills: "Skills",
    usage: "Usage",
    team: "Team",
    settings: "Settings",
  },
  common: {
    new: "New",
    viewAll: "View all",
    continue: "Continue",
    details: "Details",
    search: "Search or run a command",
    notifications: "Notifications",
    workspace: "Workspace",
    openMenu: "Open menu",
    collapse: "Collapse sidebar",
    expand: "Expand sidebar",
    comingNext: "This module is part of the next delivery wave",
  },
  home: {
    eyebrow: "Command center",
    greeting: "Good morning, Sarah",
    intro: "Start with a question, resume a run, or turn a proven process into a reusable flow.",
    newChat: "New chat",
    runAgent: "Run an agent",
    createFlow: "Create a flow",
    activeRuns: "Active runs",
    activeRunsHint: "What is running now and what needs you.",
    approvals: "Needs your approval",
    approvalsHint: "Actions that will not execute before your review.",
    recentProjects: "Recent projects",
    recentProjectsHint: "Shared context for conversations, files, and tools.",
    modelGuide: "Models that fit right now",
    modelGuideHint: "Suggestions by speed, cost, and task — you stay in control.",
    balance: "Balance and usage",
    balanceHint: "Managed balance, clearly separated from your own provider keys.",
    used: "used from this month’s budget",
    conversations: "conversations",
    runLabel: "Open run",
    approvalAction: "Review and decide",
  },
  marketing: {
    eyebrow: "An Arabic-first AI workspace",
    headlineA: "From one question",
    headlineB: "to work with a system.",
    body: "Talk to leading models, delegate work to controlled agents, then turn repeatable tasks into transparent flows — with context, cost, and approvals in one place.",
    primary: "Open the workspace",
    secondary: "Explore the experience",
    proofTitle: "One path instead of three disconnected tools",
    chatTitle: "Ask and compare",
    chatBody: "Choose a model or compare results with provider, payer, and cost kept visible.",
    agentTitle: "Delegate without losing control",
    agentBody: "Plans, steps, tools, and limits — consequential actions wait for your approval.",
    flowTitle: "Turn success into a system",
    flowBody: "Convert a successful run into a visual flow your team can test and repeat.",
    trust: "BYOK + managed credits · Native RTL · Approvals and execution receipts",
  },
  status: {
    queued: "Queued",
    planning: "Planning",
    running: "Running",
    waiting_for_input: "Waiting for your input",
    waiting_for_approval: "Waiting for approval",
    completed: "Completed",
    completed_with_warnings: "Completed with a warning",
    failed_retryable: "Temporarily failed",
    cancelled: "Cancelled",
  },
};

const dictionaries: Record<Locale, Dictionary> = { ar, en };

export const locales = ["ar", "en"] as const;

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function withLocale(locale: Locale, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

export function switchLocaleInPath(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (segments[1] === "ar" || segments[1] === "en") segments[1] = locale;
  else segments.splice(1, 0, locale);
  return segments.join("/") || `/${locale}`;
}
