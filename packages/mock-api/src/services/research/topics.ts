import type { Locale, ServiceEvidenceRef, ServiceSourceId } from "@nasaq/contracts/services";
import type { ResearchSourceType } from "@nasaq/contracts/services";

/**
 * Research topic fixtures — U2.2.
 *
 * Structure and deterministic rules live here; stage/UI copy resolves through
 * `@nasaq/i18n/services` (`services.research.*`). Evidence excerpts, source
 * titles shown inside evidence refs, and locator values are locale literals —
 * the same bilingual-fixture pattern the U2.0 foundation uses — because they
 * are artifact data, not interface chrome. Nothing is fetched: every source is
 * `seeded_fixture`, `retrievedInSession` is always false, and URLs are
 * display-only.
 */

export type ResearchClaimFixture = {
  readonly id: string;
  /** i18n key under `services.research.claims.<id>`. */
  readonly statementKey: string;
  readonly evidenceIds: readonly string[];
};

export type ResearchEvidenceFixture = {
  readonly id: string;
  readonly sourceId: string;
  readonly locator: "section" | "paragraph" | "page" | "table_row" | "url_fragment";
  readonly stance: "supports" | "contradicts" | "context";
  readonly claimIds: readonly string[];
  readonly title: Record<Locale, string>;
  readonly locatorValue: Record<Locale, string>;
  readonly excerpt: Record<Locale, string>;
  readonly provenanceLabel: Record<Locale, string>;
};

export type ResearchSourceFixture = {
  readonly id: string;
  readonly sourceType: ResearchSourceType;
  readonly publishedAt: string | null;
  readonly availability: "available" | "unavailable" | "fixture_only";
  /** 0..3; the documented relevance rule output for this pack. */
  readonly relevance: number;
  readonly url: string | null;
};

export type ResearchTopic = {
  readonly id: string;
  readonly labelKey: string;
  readonly summaryKey: string;
  readonly defaultQuestion: Record<Locale, string>;
  readonly defaultDecision: Record<Locale, string>;
  readonly axes: readonly { readonly id: string; readonly labelKey: string; readonly reasonKey: string }[];
  readonly clarify: readonly {
    readonly id: string;
    readonly promptKey: string;
    readonly choiceKeys: readonly string[];
    readonly defaultChoiceIndex: number;
  }[];
  readonly sources: readonly ResearchSourceFixture[];
  readonly evidence: readonly ResearchEvidenceFixture[];
  readonly claims: readonly ResearchClaimFixture[];
  /** Copy keys of limitations always attached to reports from this topic. */
  readonly limitationKeys: readonly string[];
};

const arAvailable = "بيانات تجريبية مزروعة، لم تُسترجع في هذه الجلسة";
const enAvailable = "Seeded fixture data, not retrieved in this session";
const provenance = { ar: arAvailable, en: enAvailable } as const;

const waitSources: readonly ResearchSourceFixture[] = [
  { id: "src_report_q3", sourceType: "internal_report", publishedAt: "2026-07-15T00:00:00.000Z", availability: "available", relevance: 3, url: null },
  { id: "src_paper_queue", sourceType: "academic_paper", publishedAt: "2025-11-02T00:00:00.000Z", availability: "fixture_only", relevance: 3, url: "https://example.org/queue-behavior-study" },
  { id: "src_news_support", sourceType: "news", publishedAt: "2026-08-30T00:00:00.000Z", availability: "available", relevance: 2, url: null },
  { id: "src_survey_csat", sourceType: "survey", publishedAt: "2026-09-01T00:00:00.000Z", availability: "available", relevance: 3, url: null },
  { id: "src_archive_unavailable", sourceType: "archived_page", publishedAt: "2024-03-12T00:00:00.000Z", availability: "unavailable", relevance: 1, url: "https://example.org/archive/wait-q1-legacy" },
  { id: "src_consulting_contrary", sourceType: "blog", publishedAt: "2026-06-20T00:00:00.000Z", availability: "fixture_only", relevance: 2, url: null },
  { id: "src_blog_context", sourceType: "blog", publishedAt: "2026-05-05T00:00:00.000Z", availability: "available", relevance: 1, url: null },
  { id: "src_mixed_bidi", sourceType: "news", publishedAt: "2026-09-05T00:00:00.000Z", availability: "fixture_only", relevance: 2, url: "https://example.org/2026/waiting-csat" },
];

const waitEvidence: readonly ResearchEvidenceFixture[] = [
  {
    id: "evd_report_wait_drop",
    sourceId: "src_report_q3",
    locator: "section",
    stance: "supports",
    claimIds: ["clm_wait_drop"],
    title: { ar: "تقرير قياس الانتظار — الربع الثالث", en: "Waiting-time measurement report — Q3" },
    locatorValue: { ar: "القسم ٣ — جدول زمن الانتظار", en: "Section 3 — waiting-time table" },
    excerpt: {
      ar: "انخفض متوسط زمن الانتظار من ١٢٫٤ إلى ١٠٫٢ دقيقة خلال الربع الثالث، أي انخفاض ١٨٪.",
      en: "Average waiting time fell from 12.4 to 10.2 minutes in Q3, an 18% drop.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_news_wait_drop",
    sourceId: "src_news_support",
    locator: "paragraph",
    stance: "supports",
    claimIds: ["clm_wait_drop"],
    title: { ar: "تغطية: تحسّن أوقات الانتظار في الفروع", en: "Coverage: branch waiting times improve" },
    locatorValue: { ar: "الفقرة الثانية", en: "Paragraph 2" },
    excerpt: {
      ar: "أفادت إدارة الفروع بانخفاض ملحوظ في زمن الانتظار بدءًا من يوليو.",
      en: "The branch network reported a marked fall in waiting times starting in July.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_paper_csat",
    sourceId: "src_paper_queue",
    locator: "paragraph",
    stance: "supports",
    claimIds: ["clm_csat_up"],
    title: { ar: "ورقة: سلوك الطوابير ورضا العملاء", en: "Paper: queue behavior and customer satisfaction" },
    locatorValue: { ar: "الفقرة ٤ — النتائج", en: "Paragraph 4 — results" },
    excerpt: {
      ar: "ارتبط تقصير زمن الانتظار المدرك بارتفاع قابل للقياس في رضا العملاء عبر ثلاث دراسات ميدانية.",
      en: "Shorter perceived waiting time correlated with a measurable rise in satisfaction across three field studies.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_survey_csat",
    sourceId: "src_survey_csat",
    locator: "table_row",
    stance: "supports",
    claimIds: ["clm_csat_up"],
    title: { ar: "استبيان رضا العملاء — الربع الثالث", en: "Customer satisfaction survey — Q3" },
    locatorValue: { ar: "الصف ٧ — التقييم العام", en: "Row 7 — overall rating" },
    excerpt: {
      ar: "ارتفع التقييم العام من ٣٫٩ إلى ٤٫٣ من ٥ مع تحسّن زمن الاستجابة.",
      en: "The overall rating rose from 3.9 to 4.3 out of 5 as response time improved.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_consulting_flat",
    sourceId: "src_consulting_contrary",
    locator: "paragraph",
    stance: "contradicts",
    claimIds: ["clm_csat_up"],
    title: { ar: "مقال: رضا العملاء لا يتحرك", en: "Post: customer satisfaction is flat" },
    locatorValue: { ar: "الفقرة الأولى", en: "Paragraph 1" },
    excerpt: {
      ar: "لا يظهر أي ارتباط ذي دلالة بين زمن الانتظار والتقييم العام في بيانات المقارنة.",
      en: "Comparison data shows no significant link between waiting time and overall rating.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_survey_peak",
    sourceId: "src_survey_csat",
    locator: "table_row",
    stance: "supports",
    claimIds: ["clm_peak_hours"],
    title: { ar: "استبيان رضا العملاء — الربع الثالث", en: "Customer satisfaction survey — Q3" },
    locatorValue: { ar: "الصف ١٢ — توزيع الشكاوى", en: "Row 12 — complaint distribution" },
    excerpt: {
      ar: "٦١٪ من الشكاوى المسجلة وقعت بين العاشرة والثانية عشرة صباحًا.",
      en: "61% of logged complaints occurred between 10:00 and 12:00.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_archive_room",
    sourceId: "src_archive_unavailable",
    locator: "page",
    stance: "context",
    claimIds: ["clm_waiting_room_context"],
    title: { ar: "أرشيف: تجربة غرفة الانتظار (٢٠٢٤)", en: "Archive: the waiting-room experience (2024)" },
    locatorValue: { ar: "الصفحة ٤٢ (غير قابلة للتحقق)", en: "Page 42 (unverifiable)" },
    excerpt: {
      ar: "ذكرت تجربة سابقة أن أجواء غرفة الانتظار تؤثر في إدراك الانتظار أكثر من مدته الفعلية.",
      en: "An earlier account noted the waiting-room atmosphere shapes perceived waiting more than its duration.",
    },
    provenanceLabel: { ar: "أرشيف تجريبي غير متاح؛ الموقع غير قابل للتحقق في هذه الجلسة", en: "Archived fixture, unavailable; locator unverifiable in this session" },
  },
  {
    id: "evd_blog_room",
    sourceId: "src_blog_context",
    locator: "paragraph",
    stance: "context",
    claimIds: ["clm_waiting_room_context"],
    title: { ar: "مقال: انتظار أطول، إدراك أفضل؟", en: "Post: longer wait, better perception?" },
    locatorValue: { ar: "الفقرة الثالثة", en: "Paragraph 3" },
    excerpt: {
      ar: "البيئة الهادئة والمقاعد المريحة تخفض التوتر المرتبط بالانتظار دون تغيير مدته.",
      en: "A calm environment and comfortable seating lower waiting stress without changing its length.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_mixed_bidi",
    sourceId: "src_mixed_bidi",
    locator: "url_fragment",
    stance: "context",
    claimIds: ["clm_peak_hours"],
    title: { ar: "تقرير Peak-Hours وبيانات CSAT المختلطة", en: "Arabic report on peak hours and CSAT data" },
    locatorValue: { ar: "الجزء #peak-csat من العنوان", en: "Fragment #peak-csat" },
    excerpt: {
      ar: "تُظهر بيانات الجزء أن ذروة الضغط تتزامن مع انخفاض تقييم CSAT.",
      en: "The fragment data shows the pressure peak coincides with a lower CSAT rating.",
    },
    provenanceLabel: provenance,
  },
];

const waitClaims: readonly ResearchClaimFixture[] = [
  { id: "clm_wait_drop", statementKey: "services.research.claims.clm_wait_drop", evidenceIds: ["evd_report_wait_drop", "evd_news_wait_drop"] },
  { id: "clm_csat_up", statementKey: "services.research.claims.clm_csat_up", evidenceIds: ["evd_paper_csat", "evd_survey_csat", "evd_consulting_flat"] },
  { id: "clm_peak_hours", statementKey: "services.research.claims.clm_peak_hours", evidenceIds: ["evd_survey_peak", "evd_mixed_bidi"] },
  { id: "clm_waiting_room_context", statementKey: "services.research.claims.clm_waiting_room_context", evidenceIds: ["evd_archive_room", "evd_blog_room"] },
  { id: "clm_retention_link", statementKey: "services.research.claims.clm_retention_link", evidenceIds: [] },
];

const zeroSources: readonly ResearchSourceFixture[] = [
  { id: "src_zero_irrelevant_a", sourceType: "blog", publishedAt: "2026-01-10T00:00:00.000Z", availability: "fixture_only", relevance: 0, url: null },
  { id: "src_zero_irrelevant_b", sourceType: "news", publishedAt: "2026-02-14T00:00:00.000Z", availability: "fixture_only", relevance: 0, url: null },
];

const zeroClaims: readonly ResearchClaimFixture[] = [
  { id: "clm_zero_open", statementKey: "services.research.claims.clm_zero_open", evidenceIds: [] },
];

const onboardingSources: readonly ResearchSourceFixture[] = [
  { id: "src_onb_handbook", sourceType: "internal_report", publishedAt: "2026-04-02T00:00:00.000Z", availability: "available", relevance: 3, url: null },
  { id: "src_onb_paper", sourceType: "academic_paper", publishedAt: "2025-09-18T00:00:00.000Z", availability: "fixture_only", relevance: 2, url: "https://example.org/remote-onboarding-meta" },
  { id: "src_onb_news", sourceType: "news", publishedAt: "2026-08-11T00:00:00.000Z", availability: "available", relevance: 2, url: null },
  { id: "src_onb_survey", sourceType: "survey", publishedAt: "2026-07-07T00:00:00.000Z", availability: "available", relevance: 3, url: null },
  { id: "src_onb_blog", sourceType: "blog", publishedAt: "2026-03-25T00:00:00.000Z", availability: "fixture_only", relevance: 1, url: null },
  { id: "src_onb_mixed", sourceType: "news", publishedAt: "2026-09-02T00:00:00.000Z", availability: "fixture_only", relevance: 2, url: "https://example.org/2026/onboarding-RTL-LTR" },
];

const onboardingEvidence: readonly ResearchEvidenceFixture[] = [
  {
    id: "evd_onb_handbook_time",
    sourceId: "src_onb_handbook",
    locator: "section",
    stance: "supports",
    claimIds: ["clm_onb_time_to_productive"],
    title: { ar: "دليل التهيئة عن بُعد — الإصدار الثالث", en: "Remote onboarding handbook — 3rd edition" },
    locatorValue: { ar: "القسم ٢ — زمن الجاهزية", en: "Section 2 — time to readiness" },
    excerpt: {
      ar: "بلغ متوسط زمن الوصول إلى الإنتاجية ٢١ يومًا في الفوج الأخير مقابل ٣٤ يومًا سابقًا.",
      en: "Median time to productivity reached 21 days in the latest cohort, down from 34.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_onb_paper_meta",
    sourceId: "src_onb_paper",
    locator: "paragraph",
    stance: "supports",
    claimIds: ["clm_onb_time_to_productive"],
    title: { ar: "ورقة مراجعة: تهيئة الفرق عن بُعد", en: "Review paper: remote team onboarding" },
    locatorValue: { ar: "الفقرة ٢ — منهجية المراجعة", en: "Paragraph 2 — review method" },
    excerpt: {
      ar: "خلصت مراجعة ١٨ دراسة إلى أن برامج التهيئة المنظمة تقصّر زمن الجاهزية بفارق واضح.",
      en: "A review of 18 studies found structured onboarding shortens readiness time by a clear margin.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_onb_survey_manager",
    sourceId: "src_onb_survey",
    locator: "table_row",
    stance: "supports",
    claimIds: ["clm_onb_manager_checkins"],
    title: { ar: "استبيان الموظفين الجدد — النصف الأول", en: "New-hire survey — H1" },
    locatorValue: { ar: "الصف ٣ — اللقاءات الأسبوعية", en: "Row 3 — weekly check-ins" },
    excerpt: {
      ar: "٩٢٪ من الجدد الذين أجرينا لقاءً أسبوعيًا أكدوا وضوح الأولويات منذ الأسبوع الأول.",
      en: "92% of new hires with weekly check-ins reported clear priorities from week one.",
    },
    provenanceLabel: provenance,
  },
  {
    id: "evd_onb_mixed_bidi",
    sourceId: "src_onb_mixed",
    locator: "url_fragment",
    stance: "context",
    claimIds: ["clm_onb_manager_checkins"],
    title: { ar: "تقرير Onboarding مختلط الاتجاه مع روابط GitHub وAPIs", en: "Mixed-direction onboarding report with Arabic annotations" },
    locatorValue: { ar: "الجزء #tools-apis", en: "Fragment #tools-apis" },
    excerpt: {
      ar: "تذكر المصدر أدوات مثل GitHub Projects وREST APIs ضمن قائمة التهيئة دون قياس أثرها.",
      en: "The source lists tools such as GitHub Projects and REST APIs in the onboarding checklist without measuring impact.",
    },
    provenanceLabel: provenance,
  },
];

const onboardingClaims: readonly ResearchClaimFixture[] = [
  { id: "clm_onb_time_to_productive", statementKey: "services.research.claims.clm_onb_time_to_productive", evidenceIds: ["evd_onb_handbook_time", "evd_onb_paper_meta"] },
  { id: "clm_onb_manager_checkins", statementKey: "services.research.claims.clm_onb_manager_checkins", evidenceIds: ["evd_onb_survey_manager", "evd_onb_mixed_bidi"] },
];

export const researchTopics = {
  waiting_time_q3: {
    id: "waiting_time_q3",
    labelKey: "services.research.topics.waiting_time_q3",
    summaryKey: "services.research.topics.waiting_time_q3_summary",
    defaultQuestion: {
      ar: "ما أثر تقليل زمن الانتظار على رضا العملاء في الربع الثالث؟",
      en: "How did shorter waiting times affect customer satisfaction in Q3?",
    },
    defaultDecision: {
      ar: "هل نستثمر في فريق دعم إضافي هذا الربع؟",
      en: "Should we invest in an extra support team this quarter?",
    },
    axes: [
      { id: "axis_trend", labelKey: "services.research.axes.axis_trend", reasonKey: "services.research.axes.axis_trend_reason" },
      { id: "axis_satisfaction", labelKey: "services.research.axes.axis_satisfaction", reasonKey: "services.research.axes.axis_satisfaction_reason" },
      { id: "axis_history", labelKey: "services.research.axes.axis_history", reasonKey: "services.research.axes.axis_history_reason" },
      { id: "axis_methods", labelKey: "services.research.axes.axis_methods", reasonKey: "services.research.axes.axis_methods_reason" },
    ],
    clarify: [
      {
        id: "rsh_clarify_window",
        promptKey: "services.research.clarify.rsh_clarify_window.prompt",
        choiceKeys: [
          "services.research.clarify.rsh_clarify_window.c1",
          "services.research.clarify.rsh_clarify_window.c2",
          "services.research.clarify.rsh_clarify_window.c3",
        ],
        defaultChoiceIndex: 0,
      },
      {
        id: "rsh_clarify_depth",
        promptKey: "services.research.clarify.rsh_clarify_depth.prompt",
        choiceKeys: [
          "services.research.clarify.rsh_clarify_depth.c1",
          "services.research.clarify.rsh_clarify_depth.c2",
          "services.research.clarify.rsh_clarify_depth.c3",
        ],
        defaultChoiceIndex: 1,
      },
      {
        id: "rsh_clarify_outcome",
        promptKey: "services.research.clarify.rsh_clarify_outcome.prompt",
        choiceKeys: [
          "services.research.clarify.rsh_clarify_outcome.c1",
          "services.research.clarify.rsh_clarify_outcome.c2",
          "services.research.clarify.rsh_clarify_outcome.c3",
        ],
        defaultChoiceIndex: 0,
      },
    ],
    sources: waitSources,
    evidence: waitEvidence,
    claims: waitClaims,
    limitationKeys: ["fixture_sources_only", "no_live_search", "bounded_pack"],
  },
  zero_match: {
    id: "zero_match",
    labelKey: "services.research.topics.zero_match",
    summaryKey: "services.research.topics.zero_match_summary",
    defaultQuestion: {
      ar: "ما توقعات سوق الأجهزة الطبية المنزلية لعام ٢٠٣١؟",
      en: "What are the 2031 forecasts for the home medical device market?",
    },
    defaultDecision: {
      ar: "هل نضمّن هذا القطاع إلى خطة التوسع؟",
      en: "Should we add this segment to the expansion plan?",
    },
    axes: [
      { id: "axis_forecast", labelKey: "services.research.axes.axis_forecast", reasonKey: "services.research.axes.axis_forecast_reason" },
    ],
    clarify: [
      {
        id: "rsh_clarify_window",
        promptKey: "services.research.clarify.rsh_clarify_window.prompt",
        choiceKeys: [
          "services.research.clarify.rsh_clarify_window.c1",
          "services.research.clarify.rsh_clarify_window.c2",
          "services.research.clarify.rsh_clarify_window.c3",
        ],
        defaultChoiceIndex: 0,
      },
    ],
    sources: zeroSources,
    evidence: [],
    claims: zeroClaims,
    limitationKeys: ["fixture_sources_only", "no_live_search", "zero_relevant_sources"],
  },
  remote_onboarding: {
    id: "remote_onboarding",
    labelKey: "services.research.topics.remote_onboarding",
    summaryKey: "services.research.topics.remote_onboarding_summary",
    defaultQuestion: {
      ar: "ما الممارسات التي تقصّر زمن جاهزية الموظفين الجدد في الفرق عن بُعد؟",
      en: "Which practices shorten new-hire readiness in remote teams?",
    },
    defaultDecision: {
      ar: "أي تحسينات نطبّق في برنامج التهيئة القادم؟",
      en: "Which improvements should the next onboarding program apply?",
    },
    axes: [
      { id: "axis_trend", labelKey: "services.research.axes.axis_trend", reasonKey: "services.research.axes.axis_trend_reason" },
      { id: "axis_methods", labelKey: "services.research.axes.axis_methods", reasonKey: "services.research.axes.axis_methods_reason" },
    ],
    clarify: [
      {
        id: "rsh_clarify_depth",
        promptKey: "services.research.clarify.rsh_clarify_depth.prompt",
        choiceKeys: [
          "services.research.clarify.rsh_clarify_depth.c1",
          "services.research.clarify.rsh_clarify_depth.c2",
          "services.research.clarify.rsh_clarify_depth.c3",
        ],
        defaultChoiceIndex: 1,
      },
    ],
    sources: onboardingSources,
    evidence: onboardingEvidence,
    claims: onboardingClaims,
    limitationKeys: ["fixture_sources_only", "no_live_search", "bounded_pack", "mixed_bidi_fixture"],
  },
} as const satisfies Record<string, ResearchTopic>;

export const researchTopicIds = ["waiting_time_q3", "zero_match", "remote_onboarding"] as const;
export type ResearchTopicId = (typeof researchTopicIds)[number];

export function isResearchTopicId(value: string): value is ResearchTopicId {
  return (researchTopicIds as readonly string[]).includes(value);
}

export function getResearchTopic(topicId: ResearchTopicId): ResearchTopic {
  return researchTopics[topicId];
}

/** Dense fixture: bounded at the contract maximum of 50 sources. */
export function getDenseResearchSources(topicId: ResearchTopicId): readonly ResearchSourceFixture[] {
  const base = researchTopics[topicId].sources;
  const types: readonly ResearchSourceType[] = ["news", "blog", "survey", "internal_report", "academic_paper", "archived_page"];
  const extras: ResearchSourceFixture[] = [];
  for (let index = 0; base.length + extras.length < 50; index += 1) {
    const type = types[index % types.length] ?? "blog";
    // Deterministic pseudo-relevance from the index: no randomness anywhere.
    const relevance = index % 4 === 0 ? 0 : index % 4 === 3 ? 3 : index % 4 === 2 ? 2 : 1;
    const availability = type === "archived_page" ? "unavailable" : index % 5 === 0 ? "fixture_only" : "available";
    const padded = String(index).padStart(2, "0");
    extras.push({
      id: `src_${topicId}_dense_${padded}`,
      sourceType: type,
      publishedAt: `2026-${String((index % 8) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}T00:00:00.000Z`,
      availability,
      relevance,
      url: index % 7 === 0 ? `https://example.org/dense/${topicId}/${padded}` : null,
    });
  }
  return [...base, ...extras].slice(0, 50);
}

/**
 * Builds the locale-resolved evidence refs for a topic. Pure: the same topic,
 * locale, and source pack always produce the same evidence list. The dense pack
 * shares the base evidence because generated sources carry no claims.
 */
export function buildResearchEvidenceRefs(topicId: ResearchTopicId, locale: Locale, options?: { dense?: boolean }): ServiceEvidenceRef[] {
  const topic = researchTopics[topicId];
  const pack = options?.dense ? getDenseResearchSources(topicId) : topic.sources;
  const sourceIds = new Set(pack.map((source) => source.id));
  return topic.evidence
    .filter((item) => sourceIds.has(item.sourceId))
    .map((item) => {
      const source = pack.find((candidate) => candidate.id === item.sourceId);
      return {
        id: item.id,
        sourceId: item.sourceId as ServiceSourceId,
        sourceTitle: item.title[locale],
        origin: "seeded_fixture" as const,
        locator: item.locator,
        locatorValue: item.locatorValue[locale],
        excerpt: item.excerpt[locale],
        claimIds: [...item.claimIds],
        stance: item.stance,
        availability: source?.availability ?? "fixture_only",
        provenanceLabel: item.provenanceLabel[locale],
        ...(source?.url !== null && source?.url !== undefined ? { url: source.url } : {}),
        retrievedInSession: false as const,
        ...(source?.publishedAt !== null && source?.publishedAt !== undefined ? { publishedAt: source.publishedAt } : {}),
      };
    });
}
