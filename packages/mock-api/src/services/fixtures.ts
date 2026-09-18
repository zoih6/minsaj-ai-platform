import type {
  Locale,
  ServiceArtifact,
  ServiceArtifactContent,
  ServiceArtifactKind,
  ServiceEvidenceRef,
  ServiceInput,
  ServiceRun,
  ServiceScenarioId,
  ServiceSession,
  ServiceSourceId,
  ServiceStage,
  SimulationReceipt,
} from "@minsaj/contracts/services";
import { createServiceStages, serviceIds, serviceUserTextSchema } from "@minsaj/contracts/services";
import { createServiceIdFactory, type ServiceIdFactory } from "./ids";
import { buildServiceScenarioPlan, serviceArtifactKinds } from "./plans";
import { toServiceTimestamp } from "./clock";

/**
 * Bilingual, Zod-validated fixtures for the U2 foundation.
 *
 * Every fixture is deterministic and provenance-labelled. Fixture sources are
 * seeded data: U2 never fetched them and the interface must say so.
 */

export const DEFAULT_FIXTURE_START = Date.parse("2026-09-12T00:00:00.000Z");

type FixtureCopy = {
  topic: string;
  motivation: string;
  question: string;
  decision: string;
  brief: string;
  audience: string;
  changeRequest: string;
  assumptions: readonly string[];
  seed: string;
  curiosity: string;
  artifactTitle: string;
  receiptLocal: string;
  receiptSimulated: string;
};

const arFixtureCopy: FixtureCopy = {
    topic: "أساسيات الإحصاء التطبيقي",
    motivation: "أريد قراءة تقارير الأرقام بثقة بدل الاعتماد على الحدس.",
    question: "ما أثر تقليل زمن الانتظار على رضا العملاء في الربع الثالث؟",
    decision: "هل نستثمر في فريق دعم إضافي هذا الربع؟",
    brief: "ملخص تنفيذي من صفحة واحدة يشرح الأثر ويقترح قرارًا واضحًا.",
    audience: "فريق القيادة",
    changeRequest: "أضف تحققًا من صحة المدخلات قبل الحفظ.",
    assumptions: ["البيانات التجريبية فقط", "لا تُقرأ أي ملفات محلية"],
    seed: "أنظمة التوصية",
    curiosity: "كيف تعمل التوصيات دون جمع بيانات شخصية؟",
    artifactTitle: "مخرج تجريبي جاهز للمراجعة",
    receiptLocal: "تجميع حتمي على بيانات الفقرة التجريبية",
    receiptSimulated: "استرجاع المصادر وصياغة المخرج",
};

const enFixtureCopy: FixtureCopy = {
  topic: "Applied statistics basics",
    motivation: "I want to read number-heavy reports with confidence instead of guessing.",
    question: "How did shorter waiting times affect customer satisfaction in Q3?",
    decision: "Should we invest in an extra support team this quarter?",
    brief: "A one-page executive summary that explains the impact and proposes a clear decision.",
    audience: "Leadership team",
    changeRequest: "Add input validation before saving.",
    assumptions: ["Fixture data only", "No local files are read"],
    seed: "Recommendation systems",
    curiosity: "How do recommendations work without collecting personal data?",
    artifactTitle: "Sample outcome ready for review",
    receiptLocal: "Deterministic aggregation over the bundled sample dataset",
  receiptSimulated: "Source discovery and outcome drafting",
};

export function getServiceFixtureCopy(locale: Locale): FixtureCopy {
  return locale === "ar" ? arFixtureCopy : enFixtureCopy;
}

const copy = { ar: arFixtureCopy, en: enFixtureCopy } as const satisfies Record<Locale, FixtureCopy>;

export function buildServiceInput(serviceId: (typeof serviceIds)[number], locale: Locale, scenarioId: ServiceScenarioId): ServiceInput {
  const text = getServiceFixtureCopy(locale);
  const dense = scenarioId === "dense" || scenarioId === "rtl_stress";
  const longMotivation = dense ? `${text.motivation} ${text.motivation}` : text.motivation;

  switch (serviceId) {
    case "learn":
      return { serviceId: "learn", topic: text.topic, motivation: longMotivation, sessionMinutes: dense ? 30 : 15, selfLevel: "beginner" };
    case "research":
      return { serviceId: "research", question: text.question, decision: text.decision, audience: "team", scope: "recent" };
    case "create":
      return { serviceId: "create", format: scenarioId === "dense" ? "deck" : "document", brief: text.brief, audience: text.audience, tone: "neutral" };
    case "code":
      return { serviceId: "code", taskType: scenarioId === "failed_final" ? "build" : "fix", changeRequest: text.changeRequest, projectFixtureId: `cprj_${serviceId}_sample_${locale}` };
    case "analyze":
      return {
        serviceId: "analyze",
        datasetFixtureId: `dset_sales_${scenarioId}_${locale}`,
        question: text.question,
        assumptions: [...text.assumptions],
      };
    case "explore":
      return { serviceId: "explore", seed: text.seed, curiosity: text.curiosity, depth: scenarioId === "dense" ? "deep" : "short" };
  }
}

export function buildServiceArtifactContent(kind: ServiceArtifactKind, locale: Locale, serviceId: string): ServiceArtifactContent {
  const text = getServiceFixtureCopy(locale);
  const suffix = locale === "ar" ? "ar" : "en";

  switch (kind) {
    case "learning_path":
      return {
        kind: "learning_path",
        topic: text.topic,
        level: "beginner",
        steps: [
          { id: `step_${suffix}_1`, title: locale === "ar" ? "المفاهيم الأساسية" : "Core concepts", objective: locale === "ar" ? "فهم المتوسط والوسيط والانحراف." : "Understand mean, median, and deviation.", completed: true },
          { id: `step_${suffix}_2`, title: locale === "ar" ? "قراءة الجداول" : "Reading tables", objective: locale === "ar" ? "ربط الرقم بمصدره." : "Connect each number to its source.", completed: false },
          { id: `step_${suffix}_3`, title: locale === "ar" ? "تفسير بلا مبالغة" : "Calibrated wording", objective: locale === "ar" ? "وصف النتيجة بحدودها." : "Describe results within their limits.", completed: false },
        ],
      };
    case "research_report":
      return {
        kind: "research_report",
        question: text.question,
        sections: [
          { id: `sec_${suffix}_1`, heading: locale === "ar" ? "الملخص" : "Summary", body: text.brief, evidenceIds: [] },
          { id: `sec_${suffix}_2`, heading: locale === "ar" ? "الأدلة" : "Evidence", body: locale === "ar" ? "كل ادعاء مرتبط بمقتطف محدد." : "Each claim links to a specific excerpt.", evidenceIds: [] },
        ],
        limitations: [locale === "ar" ? "لا بحث ويب حي في هذه الموجة." : "No live web search in this wave."],
      };
    case "creative_document":
      return {
        kind: "creative_document",
        title: text.artifactTitle,
        outline: [
          { id: `out_${suffix}_1`, label: locale === "ar" ? "النتيجة" : "Outcome" },
          { id: `out_${suffix}_2`, label: locale === "ar" ? "التفاصيل" : "Details" },
        ],
        blocks: [
          { id: `blk_${suffix}_1`, type: "heading", text: locale === "ar" ? "النتيجة" : "Outcome" },
          { id: `blk_${suffix}_2`, type: "paragraph", text: text.brief },
        ],
      };
    case "creative_deck":
      return {
        kind: "creative_deck",
        title: text.artifactTitle,
        slides: [
          { id: `sld_${suffix}_1`, title: locale === "ar" ? "السياق" : "Context", bullets: [text.brief], notes: "" },
          { id: `sld_${suffix}_2`, title: locale === "ar" ? "الخطوة التالية" : "Next step", bullets: [text.changeRequest], notes: "" },
        ],
      };
    case "visual_concept":
      return {
        kind: "visual_concept",
        conceptId: `vis_${suffix}_1`,
        caption: text.artifactTitle,
        altText: locale === "ar" ? "تصور نموذجي بأشكال هندسية بسيطة." : "Sample concept made of simple geometric shapes.",
        palette: ["#554ce6", "#16bfea"],
        ratio: "ratio_16_9",
      };
    case "code_project":
      return {
        kind: "code_project",
        projectFixtureId: `cprj_${serviceId}_sample_${locale}`,
        files: [{ path: "src/validation.ts", change: "modified", additions: 12, deletions: 3 }],
        diffHunks: [
          {
            filePath: "src/validation.ts",
            header: "@@ -1,4 +1,9 @@",
            lines: [
              { type: "context", text: "export function save(input) {" },
              { type: "removed", text: "  return store(input);" },
              { type: "added", text: "  if (!input || typeof input !== \"object\") throw new Error(\"invalid\");" },
              { type: "added", text: "  return store(input);" },
            ],
          },
        ],
      };
    case "analysis_report":
      return {
        kind: "analysis_report",
        datasetFixtureId: `dset_sales_happy_${locale}`,
        question: text.question,
        operation: "average",
        columns: [locale === "ar" ? "الشهر" : "Month", locale === "ar" ? "المتوسط" : "Average"],
        rows: [["2026-07", 12.4], ["2026-08", 11.8], ["2026-09", 9.6]],
        reconciliation: { rowCount: 3, totalMatches: true, warnings: [] },
      };
    case "discovery_trail":
      return {
        kind: "discovery_trail",
        seed: text.seed,
        depth: "short",
        nodes: [
          { id: `kn_${suffix}_1`, label: text.seed, summary: text.curiosity, whyConnected: locale === "ar" ? "نقطة البداية المختارة." : "The selected starting point.", visited: true },
          { id: `kn_${suffix}_2`, label: locale === "ar" ? "الخصوصية أولًا" : "Privacy first", summary: text.assumptions[0] ?? text.brief, whyConnected: locale === "ar" ? "السبب وراء سؤال البذرة." : "The reason behind the seed question.", visited: false },
        ],
        edges: [{ from: `kn_${suffix}_1`, to: `kn_${suffix}_2`, relation: locale === "ar" ? "يفسر" : "explains" }],
      };
  }
}

export type ServiceScenarioFixture = {
  fixtureId: string;
  serviceId: (typeof serviceIds)[number];
  scenarioId: ServiceScenarioId;
  locale: Locale;
  session: ServiceSession;
  run: ServiceRun | null;
  stages: ServiceStage[];
  artifact: ServiceArtifact | null;
  receipt: SimulationReceipt;
  evidence: ServiceEvidenceRef[];
  networkCalls: 0;
};

/**
 * Builds the full validated fixture bundle for one (service, scenario, locale).
 * The same inputs always yield the same ids, timestamps, and event list.
 */
export function buildServiceScenarioFixture(options: {
  serviceId: (typeof serviceIds)[number];
  scenarioId: ServiceScenarioId;
  locale: Locale;
  ids?: ServiceIdFactory;
  startAt?: number;
}): ServiceScenarioFixture {
  const { serviceId, scenarioId, locale } = options;
  const startAt = options.startAt ?? DEFAULT_FIXTURE_START;
  const ids = options.ids ?? createServiceIdFactory(`${serviceId}_${scenarioId}_${locale}`);
  const fixtureId = `fx_${serviceId}_${scenarioId}_${locale}`;
  const sessionId = ids.next("ssn_");
  const runId = ids.next("run_");
  const streamId = ids.next("str_");
  const stageList = createServiceStages(serviceId);
  const plan = buildServiceScenarioPlan({ serviceId, scenarioId, locale, sessionId, runId, streamId, ids, startAt });
  const input = buildServiceInput(serviceId, locale, scenarioId);
  const isPlanless = plan.expectedTerminalStatus === "none";

  const expectedTerminal = plan.expectedTerminalStatus;
  const run: ServiceRun | null = expectedTerminal === "none"
    ? null
    : {
        id: runId,
        sessionId,
        serviceId,
        status: expectedTerminal === "needs_input" ? "needs_input" : expectedTerminal,
        stageId: `stg_${stageList[stageList.length - 1]?.key ?? "stage"}`,
        scenarioId,
        sequence: 0,
        warningCodes: [],
        artifactIds: [],
        simulationReceiptId: ids.next("sim_"),
        createdAt: toServiceTimestamp(startAt),
      };

  const artifactKind = serviceArtifactKinds[serviceId];
  const artifactId = ids.next("art_");
  const versionId = ids.next("av_");
  const hasArtifact = expectedTerminal === "completed" || expectedTerminal === "completed_with_warnings";

  const artifact: ServiceArtifact | null = hasArtifact
    ? {
        id: artifactId,
        serviceId,
        sessionId,
        kind: artifactKind,
        title: `${getServiceFixtureCopy(locale).artifactTitle} — ${serviceId}`,
        status: "ready_for_review",
        currentVersionId: versionId,
        versionIds: [versionId],
        provenance: [locale === "ar" ? "مخرج تجريبي مُعد مسبقًا" : "Prebuilt sample outcome"],
        warningCodes: expectedTerminal === "completed_with_warnings" ? ["fixture_partial_coverage"] : [],
        createdAt: toServiceTimestamp(startAt),
        updatedAt: toServiceTimestamp(startAt),
      }
    : null;

  const receipt: SimulationReceipt = {
    id: ids.next("sim_"),
    runId,
    serviceId,
    mode: "explicit_simulation",
    fixtureIds: [fixtureId, ...plan.fixtureIds],
    performedLocally: [getServiceFixtureCopy(locale).receiptLocal],
    simulated: [getServiceFixtureCopy(locale).receiptSimulated],
    notPerformed: [
      locale === "ar" ? "الاتصال بالإنترنت أو أي مزود نموذج" : "Network access or any model provider",
      locale === "ar" ? "قراءة أو رفع ملفاتك" : "Reading or uploading your files",
    ],
    networkCalls: 0,
    persistentStorage: "session_storage",
    userDataRead: [],
    warnings: expectedTerminal === "completed_with_warnings" ? ["fixture_partial_coverage"] : [],
    productAgentRuntime: "not_implemented",
    createdAt: toServiceTimestamp(startAt),
  };

  const evidence: ServiceEvidenceRef[] = serviceId === "research" || serviceId === "explore"
    ? [
        {
          id: ids.next("evd_"),
          sourceId: `src_${serviceId}_seeded_${locale}` as ServiceSourceId,
          sourceTitle: locale === "ar" ? "ورقة تجريبية عن أثر الانتظار" : "Sample paper on waiting time impact",
          origin: "seeded_fixture",
          locator: "section",
          locatorValue: locale === "ar" ? "القسم 3" : "Section 3",
          excerpt: locale === "ar" ? "انخفض زمن الانتظار 18% خلال الربع." : "Waiting time dropped 18% during the quarter.",
          claimIds: [],
          stance: "supports",
          availability: "fixture_only",
          provenanceLabel: locale === "ar" ? "بيانات تجريبية غير مسترجعة حيًا" : "Seeded fixture, not retrieved live",
          retrievedInSession: false,
        },
      ]
    : [];

  const session: ServiceSession = {
    id: sessionId,
    serviceId,
    locale,
    mode: "guided",
    status: run === null ? "drafting" : "active",
    currentStageId: `stg_${stageList[0]?.key ?? "stage"}`,
    input,
    runIds: run === null ? [] : [runId],
    artifactIds: artifact ? [artifactId] : [],
    handoffOutIds: [],
    storage: "session",
    createdAt: toServiceTimestamp(startAt),
    updatedAt: toServiceTimestamp(startAt),
    version: 1,
  };

  return { fixtureId, serviceId, scenarioId, locale, session, run, stages: stageList, artifact, receipt, evidence, networkCalls: 0 };
}

/** Full fixture matrix used by `UT-FIX-001`. */
export function buildServiceFixtureMatrix(scenarios: readonly ServiceScenarioId[]): ServiceScenarioFixture[] {
  const fixtures: ServiceScenarioFixture[] = [];
  for (const serviceId of serviceIds) {
    for (const scenarioId of scenarios) {
      for (const locale of ["ar", "en"] as const) {
        fixtures.push(buildServiceScenarioFixture({ serviceId, scenarioId, locale }));
      }
    }
  }
  return fixtures;
}

/** Sample user text used to prove hostile-input rejection in tests. */
export const hostileFixtureInputs = {
  scriptTag: "<script>alert('x')</script>",
  javascriptUrl: "javascript:alert(1)",
  bidiOverride: "مرحبا \u202eecnalubma\u202c",
  controlCharacters: "line\u0000break",
  longText: "ط".repeat(2000),
} as const;

export function isAcceptedUserText(value: string) {
  return serviceUserTextSchema.safeParse(value).success;
}
