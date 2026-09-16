import type {
  HandoffBundle,
  Locale,
  ServiceArtifact,
  ServiceArtifactVersion,
  ServiceInput,
  ServiceRun,
  ServiceScenarioId,
  ServiceSession,
  ServiceStage,
  SimulationReceipt,
} from "@nasaq/contracts/services";
import { createServiceStages } from "@nasaq/contracts/services";
import { createServiceIdFactory, type ServiceIdFactory } from "./ids";
import { toServiceTimestamp, type ServiceClock } from "./clock";
import { buildServiceInput, buildServiceScenarioFixture, buildServiceArtifactContent } from "./fixtures";
import { artifactKindForService, serviceArtifactKinds } from "./plans";
import { createServiceSimulationRunner, type ServiceSimulationRunner } from "./runner";

/**
 * Typed service client interface and its only implementation for U2: a
 * deterministic local mock adapter.
 *
 * The interface exists so a later, separately approved milestone can replace the
 * adapter without rewriting the interface. It performs no network call, reads no
 * file, calls no model, and persists nothing.
 */

export type ServiceClientCapabilities = {
  readonly kind: "deterministic_mock";
  readonly mode: "explicit_simulation";
  readonly networkCalls: 0;
  readonly fileContentRead: false;
  readonly codeExecution: false;
  readonly productAgentRuntime: "not_implemented";
};

export type ServiceClient = {
  readonly capabilities: ServiceClientCapabilities;
  createSession(params: { serviceId: ServiceSession["serviceId"]; locale: Locale; scenarioId: ServiceScenarioId; input?: ServiceInput }): { session: ServiceSession; stages: ServiceStage[] };
  createRun(params: {
    session: ServiceSession;
    scenarioId: ServiceScenarioId;
    clock: ServiceClock;
    stepMs?: number;
    retryOf?: string;
    ids?: ServiceIdFactory;
    onEvent: Parameters<typeof createServiceSimulationRunner>[0]["onEvent"];
  }): ServiceSimulationRunner;
  buildArtifact(params: { session: ServiceSession; run: ServiceRun; locale: Locale; ids: ServiceIdFactory; at?: number }): { artifact: ServiceArtifact; version: ServiceArtifactVersion };
  buildReceipt(params: { session: ServiceSession; run: ServiceRun; scenarioId: ServiceScenarioId; locale: Locale; ids: ServiceIdFactory; storage: "none" | "session_storage" }): SimulationReceipt;
  buildHandoff(params: {
    id: string;
    fromServiceId: HandoffBundle["fromServiceId"];
    toServiceId: HandoffBundle["toServiceId"];
    sourceSessionId: string;
    intentSummary: string;
    selectedFields: readonly string[];
    selectedArtifactRefs?: readonly string[];
    at?: number;
  }): HandoffBundle;
};

export const deterministicMockCapabilities: ServiceClientCapabilities = {
  kind: "deterministic_mock",
  mode: "explicit_simulation",
  networkCalls: 0,
  fileContentRead: false,
  codeExecution: false,
  productAgentRuntime: "not_implemented",
};

export function createDeterministicMockServiceClient(): ServiceClient {
  return {
    capabilities: deterministicMockCapabilities,

    createSession({ serviceId, locale, scenarioId, input }) {
      const ids = createServiceIdFactory(`${serviceId}_${scenarioId}_${locale}`);
      const fixture = buildServiceScenarioFixture({ serviceId, scenarioId, locale, ids });
      const stages = fixture.stages;
      const session: ServiceSession = {
        ...fixture.session,
        ...(input === undefined ? {} : { input }),
      };
      return { session, stages: stages.map((stage) => ({ ...stage })) };
    },

    createRun({ session, scenarioId, clock, stepMs, retryOf, ids, onEvent }) {
      const factory = ids ?? createServiceIdFactory(`${session.serviceId}_${scenarioId}_${session.locale}`);
      return createServiceSimulationRunner({
        serviceId: session.serviceId,
        scenarioId,
        locale: session.locale,
        clock,
        ids: factory,
        sessionId: session.id,
        ...(stepMs === undefined ? {} : { stepMs }),
        ...(retryOf === undefined ? {} : { retryOf }),
        onEvent,
      });
    },

    buildArtifact({ session, run, locale, ids, at }) {
      const ts = toServiceTimestamp(at ?? Date.now());
      const artifactId = ids.next("art_");
      const versionId = ids.next("av_");
      const kind = serviceArtifactKinds[session.serviceId];
      const artifact: ServiceArtifact = {
        id: artifactId,
        serviceId: session.serviceId,
        sessionId: session.id,
        kind,
        title: `${session.input.serviceId} — ${kind}`,
        status: "ready_for_review",
        currentVersionId: versionId,
        versionIds: [versionId],
        provenance: [locale === "ar" ? "مخرج تجريبي مُعد مسبقًا" : "Prebuilt sample outcome"],
        warningCodes: [...run.warningCodes],
        createdAt: ts,
        updatedAt: ts,
      };
      const version: ServiceArtifactVersion = {
        id: versionId,
        artifactId,
        versionNumber: 1,
        createdBy: "simulator",
        content: buildServiceArtifactContent(artifactKindForService(session.serviceId), locale, session.serviceId),
        changeSummary: locale === "ar" ? "الإصدار الأول من المحاكي" : "First simulator version",
        createdAt: ts,
      };
      return { artifact, version };
    },

    buildReceipt({ session, run, scenarioId, locale, ids, storage }) {
      const at = toServiceTimestamp(Date.now());
      // Create's disclosure names its own simulation surface: structure and
      // variant proposals and demo drafts — never image generation or export.
      const isCreate = session.serviceId === "create";
      return {
        id: ids.next("sim_"),
        runId: run.id,
        serviceId: session.serviceId,
        mode: "explicit_simulation",
        fixtureIds: [`fx_${session.serviceId}_${scenarioId}_${locale}`],
        performedLocally: [
          locale === "ar" ? "تشغيل محاكي الأحداث الحتمي محليًا" : "Deterministic event simulator run locally",
          ...(isCreate
            ? [locale === "ar" ? "بناء البنية والبدائل ومسودات التحرير من بيانات محلية" : "Structure, variants, and editable drafts built from local data"]
            : []),
        ],
        simulated: [
          isCreate
            ? (locale === "ar" ? "اقتراح البنية والبدائل وصياغة مسودة تجريبية" : "Structure and variant proposals plus a demo draft")
            : (locale === "ar" ? "استرجاع المصادر وصياغة المخرج" : "Source discovery and outcome drafting"),
        ],
        notPerformed: [
          locale === "ar" ? "الاتصال بالإنترنت أو أي مزود نموذج" : "Network access or any model provider",
          locale === "ar" ? "قراءة أو رفع ملفاتك" : "Reading or uploading your files",
          locale === "ar" ? "تنفيذ أي كود أو أمر" : "Executing any code or command",
          ...(isCreate
            ? [
                locale === "ar" ? "توليد الصور أو معالجتها" : "Image generation or processing",
                locale === "ar" ? "تصدير PDF أو PPTX أو صور" : "PDF, PPTX, or image export",
              ]
            : []),
        ],
        networkCalls: 0,
        persistentStorage: storage,
        userDataRead: [],
        warnings: [...run.warningCodes],
        productAgentRuntime: "not_implemented",
        createdAt: at,
      };
    },

    buildHandoff({ id, fromServiceId, toServiceId, sourceSessionId, intentSummary, selectedFields, selectedArtifactRefs, at }) {
      return {
        id,
        fromServiceId,
        toServiceId,
        sourceSessionId,
        selectedArtifactRefs: [...(selectedArtifactRefs ?? [])],
        intentSummary,
        selectedFields: [...selectedFields],
        excludedFields: [],
        status: "preview",
        createdAt: toServiceTimestamp(at ?? Date.now()),
      };
    },
  };
}

export function createServiceStagesFor(serviceId: ServiceSession["serviceId"]): ServiceStage[] {
  return createServiceStages(serviceId);
}

export { buildServiceInput };
