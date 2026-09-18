import type { Locale, ServiceId, ServiceRunStatus, ServiceScenarioId, ServiceSessionStatus } from "@minsaj/contracts/services";
import { serviceIds } from "@minsaj/contracts/services";

/**
 * Typed U2 service namespaces.
 *
 * Arabic is first-class and English is complete: both dictionaries have the same
 * shape, so a missing string is a type error rather than a silent fallback.
 * Service copy lives here, never inline in JSX.
 */

import type { LearnCopy } from "./learn-content";
import { learnContentAr, learnContentEn } from "./learn-content";
import type { ResearchCopy } from "./research-content";
import { researchContentAr, researchContentEn } from "./research-content";
import type { CreateCopy } from "./create-content";
import { createContentAr, createContentEn } from "./create-content";

export type ServiceEntry = {
  label: string;
  eyebrow: string;
  description: string;
  artifactKind: string;
  stages: Record<string, string>;
};

/**
 * Learn owns extra copy in U2.1: topics, diagnostic questions, path rationale,
 * feedback, edge states, and the UI strings of its stages. The foundation type
 * stays untouched for the other services.
 */
export type LearnServiceEntry = ServiceEntry & LearnCopy;

/**
 * Research owns extra copy in U2.2: topics, clarifications, plan rules,
 * sources, claims, activity, report, and the UI strings of its stages.
 */
export type ResearchServiceEntry = ServiceEntry & ResearchCopy;

/**
 * Create owns extra copy in U2.3: document sections, deck slides, visual
 * variant labels and differences, review suggestions, and stage UI strings.
 */
export type CreateServiceEntry = ServiceEntry & CreateCopy;

export type ServiceDictionary = {
  workbench: {
    sessionLabel: string;
    modeGuided: string;
    modeGuidedHint: string;
    modeFast: string;
    modeFastHint: string;
    simulationBadge: string;
    openReceipt: string;
    closeReceipt: string;
    stageNavigation: string;
    reviewPoint: string;
    stageStatus: Record<"pending" | "active" | "completed" | "blocked" | "skipped", string>;
    start: string;
    startBusy: string;
    cancel: string;
    cancelRequested: string;
    retry: string;
    retryOf: string;
    newSession: string;
    provideInput: string;
    saveDemo: string;
    savedLocally: string;
    clearDemoData: string;
    invalidInput: string;
    invalidInputBody: string;
    runFailedRetryable: string;
    runFailedFinal: string;
    runCompleted: string;
    runCompletedWithWarnings: string;
    runNeedsInput: string;
    noArtifactYet: string;
    openArtifact: string;
    version: string;
    noDeadControl: string;
    unavailableInPrototype: string;
    notices: Record<"duplicate" | "gap" | "staleRun", string>;
  };
  receipt: {
    title: string;
    description: string;
    mode: string;
    performedLocally: string;
    simulated: string;
    notPerformed: string;
    networkCalls: string;
    storage: string;
    userDataRead: string;
    warnings: string;
    boundary: string;
    none: string;
    boundaryStatement: string;
  };
  storage: {
    title: string;
    body: string;
    sessionOnly: string;
    memoryOnly: string;
    clear: string;
    cleared: string;
    corruptRecovered: string;
    quotaExceeded: string;
    unavailable: string;
  };
  handoff: {
    title: string;
    body: string;
    fieldsIncluded: string;
    fieldsExcluded: string;
    confirm: string;
    cancel: string;
    preview: string;
    consumed: string;
    askGateway: string;
  };
  runStatus: Record<ServiceRunStatus, string>;
  sessionStatus: Record<ServiceSessionStatus, string>;
  scenarios: Record<ServiceScenarioId, string>;
  services: Record<ServiceId, ServiceEntry> & { learn: LearnServiceEntry; research: ResearchServiceEntry; create: CreateServiceEntry };
};

const ar: ServiceDictionary = {
  workbench: {
    sessionLabel: "جلسة تجريبية محلية",
    modeGuided: "موجّه",
    modeGuidedHint: "خطوات قصيرة مع نقاط مراجعة.",
    modeFast: "سريع",
    modeFastHint: "أقل عدد من الخطوات، مع مراجعة صريحة قبل النتيجة.",
    simulationBadge: "محاكاة معلنة",
    openReceipt: "افتح إيصال المحاكاة",
    closeReceipt: "أغلق الإيصال",
    stageNavigation: "مراحل هذه الجلسة",
    reviewPoint: "نقطة مراجعة",
    stageStatus: { pending: "لم تبدأ", active: "جارية", completed: "مكتملة", blocked: "متوقفة", skipped: "تم تخطيها" },
    start: "ابدأ المحاكاة",
    startBusy: "جارٍ تشغيل المحاكي",
    cancel: "إلغاء",
    cancelRequested: "تم طلب الإلغاء",
    retry: "إعادة المحاولة",
    retryOf: "إعادة للمحاولة السابقة",
    newSession: "جلسة جديدة",
    provideInput: "أكمل المدخل المطلوب",
    saveDemo: "احفظ تجريبيًا في هذا التبويب",
    savedLocally: "محفوظ محليًا لهذه الجلسة فقط، بلا حساب أو مزامنة.",
    clearDemoData: "امسح بيانات التجربة",
    invalidInput: "المدخل غير صالح",
    invalidInputBody: "أضف نصًا قصيرًا صالحًا ثم أعد المحاولة.",
    runFailedRetryable: "فشل مؤقت في المحاكي، ويمكن إعادة المحاولة بمحاولة جديدة.",
    runFailedFinal: "هذا الطلب خارج نطاق النموذج التجريبي.",
    runCompleted: "انتهت المحاكاة",
    runCompletedWithWarnings: "انتهت المحاكاة مع قيود معلنة",
    runNeedsInput: "المحاكي ينتظر مدخلًا منك",
    noArtifactYet: "لا يوجد مخرج بعد",
    openArtifact: "افتح المخرج",
    version: "إصدار",
    noDeadControl: "هذا الإجراء غير متاح في هذا النموذج",
    unavailableInPrototype: "غير متاح في هذا النموذج",
    notices: {
      duplicate: "تم تجاهل حدث مكرر من المحاكي.",
      gap: "فُقد ترتيب أحداث المحاكي؛ استُعيد العرض من آخر حالة صحيحة.",
      staleRun: "وصل حدث يخص محاولة سابقة وتم تجاهله.",
    },
  },
  receipt: {
    title: "إيصال المحاكاة",
    description: "ملخص لما حدث فعلًا في هذه الجلسة وما لم يحدث.",
    mode: "الوضع: محاكاة صريحة",
    performedLocally: "ما حُسب أو نُفّذ محليًا",
    simulated: "ما كان محاكاة معلنة",
    notPerformed: "ما لم يُنفذ",
    networkCalls: "طلبات الشبكة",
    storage: "التخزين التجريبي",
    userDataRead: "بيانات المستخدم المقروءة",
    warnings: "تنبيهات",
    boundary: "حدود تشغيل الوكلاء",
    none: "لا شيء",
    boundaryStatement: "تشغيل وكلاء المنتج (Backend/Runtime) غير منفّذ في هذه الموجة.",
  },
  storage: {
    title: "تخزين تجريبي محلي",
    body: "تُحفظ الجلسات والمخرجات في هذا التبويب فقط لأغراض العرض التجريبي.",
    sessionOnly: "تخزين الجلسة الحالية (التبويب)",
    memoryOnly: "ذاكرة مؤقتة داخل الصفحة فقط",
    clear: "امسح البيانات المحلية",
    cleared: "تم مسح بيانات التجربة.",
    corruptRecovered: "عُثر على بيانات تجريبية غير صالحة وتم مسحها مع استمرار العمل.",
    quotaExceeded: "لم يمكن الحفظ: مساحة التخزين المحلية ممتلئة.",
    unavailable: "الحفظ المحلي غير متاح في هذا المتصفح؛ ستستمر الجلسة في الذاكرة فقط.",
  },
  handoff: {
    title: "معاينة النقل إلى خدمة أخرى",
    body: "لا ينتقل أي شيء قبل تحديده وتأكيده منك.",
    fieldsIncluded: "حقول ستنقل",
    fieldsExcluded: "حقول لن تنقل",
    confirm: "أكّد النقل",
    cancel: "ألغِ",
    preview: "معاينة",
    consumed: "استُخدم هذا النقل مرة واحدة.",
    askGateway: "اسأل وتحدّث (بوابة عامة)",
  },
  runStatus: {
    validating: "تحقق من المدخل",
    needs_input: "ينتظر مدخلًا",
    queued: "في الانتظار",
    running: "جارٍ التشغيل المحلي",
    review_ready: "جاهز للمراجعة",
    completed: "مكتمل",
    completed_with_warnings: "مكتمل مع تنبيه",
    failed_retryable: "فشل مؤقت",
    failed_final: "فشل نهائي",
    cancel_requested: "طُلب الإلغاء",
    cancelled: "ملغى",
  },
  sessionStatus: {
    drafting: "قيد الإعداد",
    configured: "مهيأة",
    active: "نشطة",
    paused: "موقوفة مؤقتًا",
    saved: "محفوظة",
    archived: "مؤرشفة",
  },
  scenarios: {
    happy: "المسار الكامل",
    needs_input: "نقص مدخل",
    warning: "نتيجة مع تنبيه",
    failed_retryable: "فشل قابل للإعادة",
    failed_final: "فشل نهائي",
    cancel_race: "تسابق الإلغاء",
    empty: "لا نتائج بعد",
    dense: "بيانات كثيفة",
    rtl_stress: "نص عربي مختلط",
    storage_failure: "فشل تخزين تجريبي",
    conflicting_evidence: "أدلة متعارضة",
    zero_sources: "لا مصادر",
  },
  services: {
    learn: {
      label: "تعلّم بعمق",
      eyebrow: "معلّم تفاعلي",
      description: "تشخيص قصير، مسار قابل للتعديل، ثم درس وتحقق وتغذية راجعة.",
      artifactKind: "مسار تعلم",
      stages: {
        lrn_brief: "الهدف والوقت",
        lrn_diagnostic: "التشخيص",
        lrn_path_review: "مراجعة المسار",
        lrn_lesson: "الدرس",
        lrn_check: "التحقق",
        lrn_feedback: "التغذية الراجعة",
        lrn_checkpoint: "نقطة تقدّم",
        lrn_complete: "نهاية الوحدة",
      },
      ...learnContentAr,
    },
    research: {
      label: "ابحث ووثّق",
      eyebrow: "بحث بمصادر",
      description: "خطة قابلة للموافقة، ثم نشاط مصادر نموذجي ومصفوفة ادعاءات وتقرير بحدوده.",
      artifactKind: "تقرير موثق",
      stages: {
        rsh_brief: "سؤال البحث",
        rsh_clarify: "توضيح",
        rsh_plan_review: "مراجعة الخطة",
        rsh_source_activity: "نشاط المصادر",
        rsh_source_review: "مراجعة المصادر",
        rsh_claim_matrix: "الادعاءات والأدلة",
        rsh_report_edit: "التقرير",
        rsh_complete: "الإيصال والحفظ",
      },
      ...researchContentAr,
    },
    create: {
      label: "اكتب وصمّم",
      eyebrow: "استوديو إبداعي",
      description: "من النوع والbrief إلى بنية وبدائل ثم مخرج قابل للتحرير والإصدار.",
      artifactKind: "مستند أو عرض",
      stages: {
        crt_format: "نوع المخرج",
        crt_brief: "الموجز",
        crt_structure: "البنية",
        crt_variants: "البدائل",
        crt_edit: "التحرير",
        crt_review: "المراجعة",
        crt_version: "الإصدار",
        crt_complete: "الحفظ والإيصال",
      },
      ...createContentAr,
    },
    code: {
      label: "برمج وابنِ",
      eyebrow: "مراجعة تغيير مقترح",
      description: "نطاق وخطة، ثم شجرة ملفات وdiff ونسخة عمل وفحوص ثابتة وإيصال أثر.",
      artifactKind: "مشروع تجريبي",
      stages: {
        cod_scope: "النطاق",
        cod_plan: "الخطة",
        cod_proposal: "اقتراح التغيير",
        cod_diff_review: "مراجعة الفرق",
        cod_working_copy: "نسخة العمل",
        cod_preview_checks: "المعاينة والفحوص",
        cod_receipt: "إيصال المراجعة",
      },
    },
    analyze: {
      label: "حلّل وافهم",
      eyebrow: "حساب محلي حتمي",
      description: "بيانات نموذجية وملف تعريفي، ثم سؤال وخطة وحساب محلي وجدول ورسم وتحقق.",
      artifactKind: "تقرير تحليلي",
      stages: {
        ana_source: "المصدر",
        ana_profile: "الملف التعريفي",
        ana_question: "السؤال",
        ana_plan: "خطة الحساب",
        ana_compute: "حساب محلي",
        ana_result: "النتيجة",
        ana_verify: "التحقق",
        ana_complete: "الحفظ والإيصال",
      },
    },
    explore: {
      label: "استكشف واكتشف",
      eyebrow: "خريطة معرفة",
      description: "بذرة، ثم خريطة وقائمة مكافئة، وتفاصيل العقد، ورحلة مع تفرعات ونقاط توقف.",
      artifactKind: "رحلة معرفية",
      stages: {
        exp_seed: "البذرة",
        exp_map: "الخريطة والقائمة",
        exp_node: "تفاصيل العقدة",
        exp_trail: "الرحلة",
        exp_checkpoint: "نقطة توقف",
        exp_complete: "الحفظ والتحويل",
      },
    },
  },
};

const en: ServiceDictionary = {
  workbench: {
    sessionLabel: "Local simulation session",
    modeGuided: "Guided",
    modeGuidedHint: "Short steps with explicit review points.",
    modeFast: "Fast",
    modeFastHint: "Fewest steps, with an explicit review before the outcome.",
    simulationBadge: "Explicit simulation",
    openReceipt: "Open the simulation receipt",
    closeReceipt: "Close the receipt",
    stageNavigation: "Stages in this session",
    reviewPoint: "Review point",
    stageStatus: { pending: "Not started", active: "In progress", completed: "Completed", blocked: "Blocked", skipped: "Skipped" },
    start: "Start the simulation",
    startBusy: "Running the simulator",
    cancel: "Cancel",
    cancelRequested: "Cancellation requested",
    retry: "Retry",
    retryOf: "Retry of the previous attempt",
    newSession: "New session",
    provideInput: "Provide the missing input",
    saveDemo: "Save demo data in this tab",
    savedLocally: "Saved locally for this session only, with no account or sync.",
    clearDemoData: "Clear demo data",
    invalidInput: "The input is not valid",
    invalidInputBody: "Add a short, valid value and try again.",
    runFailedRetryable: "The simulator failed temporarily; retry starts a new attempt.",
    runFailedFinal: "This request is outside the sample simulator's range.",
    runCompleted: "The simulation finished",
    runCompletedWithWarnings: "Finished with declared limitations",
    runNeedsInput: "The simulator is waiting for your input",
    noArtifactYet: "No outcome yet",
    openArtifact: "Open the outcome",
    version: "Version",
    noDeadControl: "This action is unavailable in this prototype",
    unavailableInPrototype: "Unavailable in this prototype",
    notices: {
      duplicate: "A duplicate simulator event was ignored.",
      gap: "The simulator event order lost a step; the view recovered from the last valid state.",
      staleRun: "An event for an earlier attempt arrived and was ignored.",
    },
  },
  receipt: {
    title: "Simulation receipt",
    description: "A summary of what happened in this session and what did not.",
    mode: "Mode: explicit simulation",
    performedLocally: "Computed or performed locally",
    simulated: "Declared simulation",
    notPerformed: "Not performed",
    networkCalls: "Network calls",
    storage: "Demo storage",
    userDataRead: "User data read",
    warnings: "Warnings",
    boundary: "Agent runtime boundary",
    none: "None",
    boundaryStatement: "Product Agent Backend/Runtime is not implemented in this wave.",
  },
  storage: {
    title: "Local demo storage",
    body: "Sessions and outcomes are kept in this tab only, for prototype demonstration.",
    sessionOnly: "Current session storage (this tab)",
    memoryOnly: "In-page memory only",
    clear: "Clear local demo data",
    cleared: "Demo data cleared.",
    corruptRecovered: "Invalid demo data was found, cleared, and the session continued.",
    quotaExceeded: "Could not save: local demo storage is full.",
    unavailable: "Local saving is unavailable in this browser; the session continues in memory only.",
  },
  handoff: {
    title: "Handoff preview",
    body: "Nothing moves until you select it and confirm.",
    fieldsIncluded: "Fields to include",
    fieldsExcluded: "Fields excluded",
    confirm: "Confirm handoff",
    cancel: "Cancel",
    preview: "Preview",
    consumed: "This handoff was already consumed once.",
    askGateway: "Ask & Talk (general gateway)",
  },
  runStatus: {
    validating: "Validating input",
    needs_input: "Waiting for input",
    queued: "Queued",
    running: "Running locally",
    review_ready: "Ready for review",
    completed: "Completed",
    completed_with_warnings: "Completed with warnings",
    failed_retryable: "Temporary failure",
    failed_final: "Final failure",
    cancel_requested: "Cancellation requested",
    cancelled: "Cancelled",
  },
  sessionStatus: {
    drafting: "Drafting",
    configured: "Configured",
    active: "Active",
    paused: "Paused",
    saved: "Saved",
    archived: "Archived",
  },
  scenarios: {
    happy: "Full path",
    needs_input: "Missing input",
    warning: "Outcome with a warning",
    failed_retryable: "Retryable failure",
    failed_final: "Final failure",
    cancel_race: "Cancel race",
    empty: "Nothing yet",
    dense: "Dense data",
    rtl_stress: "Mixed Arabic text",
    storage_failure: "Demo storage failure",
    conflicting_evidence: "Conflicting evidence",
    zero_sources: "No sources",
  },
  services: {
    learn: {
      label: "Learn deeply",
      eyebrow: "Interactive tutor",
      description: "A short diagnostic, an editable path, then a lesson, a check, and feedback.",
      artifactKind: "Learning path",
      stages: {
        lrn_brief: "Goal and time",
        lrn_diagnostic: "Diagnostic",
        lrn_path_review: "Path review",
        lrn_lesson: "Lesson",
        lrn_check: "Check",
        lrn_feedback: "Feedback",
        lrn_checkpoint: "Checkpoint",
        lrn_complete: "Unit complete",
      },
      ...learnContentEn,
    },
    research: {
      label: "Research and document",
      eyebrow: "Sourced research",
      description: "An approvable plan, then sample source activity, a claim matrix, and a report with limits.",
      artifactKind: "Documented report",
      stages: {
        rsh_brief: "Research question",
        rsh_clarify: "Clarification",
        rsh_plan_review: "Plan review",
        rsh_source_activity: "Source activity",
        rsh_source_review: "Source review",
        rsh_claim_matrix: "Claims and evidence",
        rsh_report_edit: "Report",
        rsh_complete: "Receipt and save",
      },
      ...researchContentEn,
    },
    create: {
      label: "Write and design",
      eyebrow: "Creative studio",
      description: "From format and brief to structure, alternatives, then an editable, versioned outcome.",
      artifactKind: "Document or deck",
      stages: {
        crt_format: "Outcome format",
        crt_brief: "Brief",
        crt_structure: "Structure",
        crt_variants: "Alternatives",
        crt_edit: "Edit",
        crt_review: "Review",
        crt_version: "Version",
        crt_complete: "Save and hand off",
      },
      ...createContentEn,
    },
    code: {
      label: "Code and build",
      eyebrow: "Proposed-change review",
      description: "Scope and plan, then a file tree, a diff, a working copy, static checks, and an impact receipt.",
      artifactKind: "Sample project",
      stages: {
        cod_scope: "Scope",
        cod_plan: "Plan",
        cod_proposal: "Change proposal",
        cod_diff_review: "Diff review",
        cod_working_copy: "Working copy",
        cod_preview_checks: "Preview and checks",
        cod_receipt: "Review receipt",
      },
    },
    analyze: {
      label: "Analyze and understand",
      eyebrow: "Deterministic local compute",
      description: "A sample dataset and profile, then a question, plan, local compute, table, chart, and verification.",
      artifactKind: "Analysis report",
      stages: {
        ana_source: "Source",
        ana_profile: "Profile",
        ana_question: "Question",
        ana_plan: "Compute plan",
        ana_compute: "Local compute",
        ana_result: "Result",
        ana_verify: "Verify",
        ana_complete: "Save and hand off",
      },
    },
    explore: {
      label: "Explore and discover",
      eyebrow: "Knowledge map",
      description: "A seed, then a map with an equivalent list, node detail, and a trail with branches and checkpoints.",
      artifactKind: "Discovery trail",
      stages: {
        exp_seed: "Seed",
        exp_map: "Map and list",
        exp_node: "Node detail",
        exp_trail: "Trail",
        exp_checkpoint: "Checkpoint",
        exp_complete: "Save and convert",
      },
    },
  },
};

export const serviceDictionaries: Record<Locale, ServiceDictionary> = { ar, en };

export function getServiceDictionary(locale: Locale): ServiceDictionary {
  return serviceDictionaries[locale];
}

/** The key list is derived from the same literal keys as the entry type. */
export function getServiceEntryKeys(): readonly ServiceId[] {
  return serviceIds;
}

/**
 * Resolves a stage `titleKey` such as `services.learn.stages.lrn_brief`.
 * Unknown keys return null so the interface can fail loudly in development
 * instead of rendering an empty label.
 */
export function getServiceStageTitle(locale: Locale, titleKey: string): string | null {
  const parts = titleKey.split(".");
  if (parts.length !== 4 || parts[0] !== "services" || parts[2] !== "stages") return null;
  const serviceId = parts[1] as ServiceId;
  const stageKey = parts[3] as string;
  const entry = serviceDictionaries[locale].services[serviceId];
  if (!entry) return null;
  return entry.stages[stageKey] ?? null;
}

export type ServiceNumberOptions = { maximumFractionDigits?: number; minimumFractionDigits?: number; style?: "decimal" | "percent"; unit?: string };

/** Locale-aware number formatting used by Analyze and by progress text. */
export function formatServiceNumber(locale: Locale, value: number, options: ServiceNumberOptions = {}): string {
  const usesLatinDigits = locale === "en";
  return new Intl.NumberFormat(usesLatinDigits ? "en-US" : "ar", {
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
    ...(options.minimumFractionDigits === undefined ? {} : { minimumFractionDigits: options.minimumFractionDigits }),
    ...(options.style === undefined ? {} : { style: options.style }),
    ...(options.unit === undefined ? {} : { unit: options.unit, style: "unit" }),
  }).format(value);
}

export function formatServiceDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en-GB", { dateStyle: "medium" }).format(new Date(iso));
}
