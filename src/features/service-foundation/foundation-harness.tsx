"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FlaskConical, Send } from "lucide-react";
import type { Locale, ServiceId, ServiceScenarioId } from "@nasaq/contracts/services";
import { genericServiceScenarioIds, serviceIds } from "@nasaq/contracts/services";
import { getServiceDictionary } from "@nasaq/i18n/services";
import { switchLocaleInPath } from "@nasaq/i18n";
import { createDeterministicMockServiceClient } from "@nasaq/mock-api/services";
import { useServiceWorkbench, ServiceWorkbenchProvider } from "@/features/service-workbench/state/workbench-provider";
import { ServiceWorkbenchShell } from "@/features/service-workbench/components/service-workbench-shell";
import {
  createBrowserServiceSessionStore,
  createMemoryStorageBackend,
  createServiceSessionStore,
  type ServiceSessionStore,
} from "@/features/service-workbench/storage/store";

/**
 * U2.0 foundation verification surface.
 *
 * This is NOT a product service. It exists so the shared workbench, the
 * deterministic simulator, the simulation receipt, and the demo store can be
 * exercised and evidenced before any service route is replaced. Product routes
 * continue to render the existing prototype workspace until their slice lands.
 */

type StorageMode = "session" | "memory" | "failing";

const harnessCopy = {
  ar: {
    title: "مساحة تحقق لأساس U2",
    eyebrow: "سطح تحقق — ليس خدمة منتج",
    description: "يشغّل هذا السطح محاكي الأحداث الحتمي وإيصال المحاكاة وأجزاء مساحة العمل المشتركة قبل استبدال أي مسار خدمة.",
    service: "الخدمة",
    scenario: "السيناريو",
    storage: "التخزين التجريبي",
    storageSession: "تخزين الجلسة",
    storageMemory: "الذاكرة فقط",
    storageFailing: "تخزين يفشل عمدًا",
    handoff: "معاينة نقل تجريبية",
    resumed: "استُؤنفت جلسة محفوظة محليًا في هذا التبويب.",
    localeSwitch: "التبديل إلى الإنجليزية",
    stageCountLabel: "عدد المراحل",
  },
  en: {
    title: "U2 foundation verification surface",
    eyebrow: "Verification surface — not a product service",
    description: "This surface runs the deterministic event simulator, the simulation receipt, and the shared workbench parts before any service route is replaced.",
    service: "Service",
    scenario: "Scenario",
    storage: "Demo storage",
    storageSession: "Session storage",
    storageMemory: "Memory only",
    storageFailing: "Deliberately failing store",
    handoff: "Preview a demo handoff",
    resumed: "A locally saved session was resumed in this tab.",
    localeSwitch: "Switch to Arabic",
    stageCountLabel: "Stage count",
  },
} as const;

function createHarnessStore(mode: StorageMode): ServiceSessionStore {
  if (mode === "memory") {
    return createServiceSessionStore({ backend: createMemoryStorageBackend(), kind: "memory" });
  }
  if (mode === "failing") {
    return createServiceSessionStore({
      backend: {
        getItem: () => null,
        setItem: () => {
          throw new Error("demo_storage_quota_exceeded");
        },
        removeItem: () => undefined,
      },
      kind: "session",
    });
  }
  return createBrowserServiceSessionStore();
}

export function FoundationHarness({ locale, initialServiceId }: { locale: Locale; initialServiceId: ServiceId }) {
  const copy = harnessCopy[locale];
  const dictionary = getServiceDictionary(locale);
  const client = useMemo(() => createDeterministicMockServiceClient(), []);
  const [serviceId, setServiceId] = useState<ServiceId>(initialServiceId);
  const [scenarioId, setScenarioId] = useState<ServiceScenarioId>("happy");
  const [storageMode, setStorageMode] = useState<StorageMode>("session");
  const store = useMemo(() => createHarnessStore(storageMode), [storageMode]);

  const bundle = useMemo(() => {
    const created = client.createSession({ serviceId, locale, scenarioId });
    const stored = store.kind === "session" ? store.read() : null;
    // Resume only the primary path: a resume must never silently change the
    // scenario a reviewer asked for. A locale switch keeps the session
    // (U2-XSV-006), so the match is by service, not by locale.
    const sessions = stored?.snapshot?.sessions ?? [];
    const storedSession = scenarioId === "happy"
      ? sessions.filter((item) => item.serviceId === serviceId).at(-1)
      : undefined;

    if (storedSession === undefined) {
      return { session: created.session, stages: created.stages, artifacts: [], receipts: [], handoffs: [], resumed: false, status: stored?.status ?? store.kind };
    }

    return {
      session: storedSession,
      stages: created.stages.map((stage) =>
        stage.id === storedSession.currentStageId ? { ...stage, status: "active" as const } : stage),
      artifacts: stored?.snapshot?.artifacts.filter((artifact) => artifact.serviceId === serviceId) ?? [],
      receipts: stored?.snapshot?.receipts.filter((receipt) => receipt.serviceId === serviceId) ?? [],
      handoffs: stored?.snapshot?.handoffs.filter((handoff) => handoff.toServiceId === serviceId) ?? [],
      resumed: true,
      status: stored?.status ?? store.kind,
    };
  }, [client, locale, scenarioId, serviceId, store]);

  const entry = dictionary.services[serviceId];

  return (
    <div className="u2-harness" data-testid="u2-harness" data-service={serviceId} data-scenario={scenarioId}>
      <header className="u2-harness__head">
        <div>
          <span className="u2-harness__eyebrow"><FlaskConical size={16} aria-hidden="true" />{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <Link href={switchLocaleInPath(`/${locale}/preview/service-foundation`, locale === "ar" ? "en" : "ar")} data-testid="u2-locale-switch" prefetch={false}>
          {copy.localeSwitch}
        </Link>
      </header>

      <div className="u2-harness__controls">
        <label>
          <span>{copy.service}</span>
          <select
            value={serviceId}
            data-testid="u2-service-select"
            onChange={(event) => setServiceId(event.target.value as ServiceId)}
          >
            {serviceIds.map((id) => <option value={id} key={id}>{dictionary.services[id].label}</option>)}
          </select>
        </label>
        <label>
          <span>{copy.scenario}</span>
          <select
            value={scenarioId}
            data-testid="u2-scenario-select"
            onChange={(event) => setScenarioId(event.target.value as ServiceScenarioId)}
          >
            {genericServiceScenarioIds.map((id) => <option value={id} key={id}>{dictionary.scenarios[id]}</option>)}
          </select>
        </label>
        <label>
          <span>{copy.storage}</span>
          <select
            value={storageMode}
            data-testid="u2-storage-select"
            onChange={(event) => setStorageMode(event.target.value as StorageMode)}
          >
            <option value="session">{copy.storageSession}</option>
            <option value="memory">{copy.storageMemory}</option>
            <option value="failing">{copy.storageFailing}</option>
          </select>
        </label>
      </div>

      {bundle.resumed ? <p className="u2-harness__resumed" data-testid="u2-resumed">{copy.resumed}</p> : null}

      <ServiceWorkbenchProvider
        key={`${serviceId}-${scenarioId}-${storageMode}`}
        locale={locale}
        scenarioId={scenarioId}
        session={bundle.session}
        stages={bundle.stages}
        store={store}
        initialStorageStatus={bundle.status}
        initialRecords={{ artifacts: bundle.artifacts, receipts: bundle.receipts, handoffs: bundle.handoffs }}
      >
        <ServiceWorkbenchShell
          locale={locale}
          title={entry.label}
          eyebrow={entry.eyebrow}
          description={entry.description}
        >
          <HarnessBody locale={locale} sessionId={bundle.session.id} stageCount={bundle.stages.length} />
        </ServiceWorkbenchShell>
      </ServiceWorkbenchProvider>
    </div>
  );
}

/**
 * Body controls that need provider actions (handoff preview). Keeping them in a
 * child component means the harness exposes only the public workbench API.
 */
function HarnessBody({ locale, sessionId, stageCount }: { locale: Locale; sessionId: string; stageCount: number }) {
  const { actions, state } = useServiceWorkbench();
  const copy = harnessCopy[locale];
  const client = useMemo(() => createDeterministicMockServiceClient(), []);

  return (
    <div className="u2-harness__body">
      <p data-testid="u2-harness-stage-count" data-stage-count={stageCount}>
        {copy.stageCountLabel}: <strong>{stageCount}</strong>
      </p>
      <button
        type="button"
        data-testid="u2-handoff-preview"
        onClick={() => {
          actions.previewHandoff(client.buildHandoff({
            id: "hnd_foundation_1",
            fromServiceId: "ask",
            toServiceId: state.session.serviceId === "learn" ? "research" : "learn",
            sourceSessionId: sessionId,
            intentSummary: locale === "ar" ? "حزمة تجريبية لمراجعة النقل قبل التأكيد" : "Sample bundle to review the handoff before confirming",
            selectedFields: ["topic", "goal"],
          }));
        }}
      >
        <Send size={16} aria-hidden="true" />
        {copy.handoff}
      </button>
    </div>
  );
}
