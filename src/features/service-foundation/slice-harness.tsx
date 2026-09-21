"use client";

import { useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { genericServiceScenarioIds } from "@minsaj/contracts/services";
import { getServiceDictionary } from "@minsaj/i18n/services";
import { switchLocaleInPath } from "@minsaj/i18n";
import type { ServiceId } from "@minsaj/contracts/services";
import { CodeRoute } from "@/features/code/code-route";

/**
 * Domain slice verification surface — shared by the W-3 slice preview pages.
 *
 * This is NOT a product service. It mounts the real domain route (the exact
 * composition the registry flip points at) with scenario and locale controls, so
 * a reviewer can verify each landed slice against its evidence before and after
 * the registry flip. It lives under `/preview` and never enters navigation.
 *
 * The route mapping lives here, client-side, because a Server Component page
 * cannot pass a render function across the boundary; the page stays a thin,
 * data-only composition (`locale` + `serviceId`).
 */

const implementedSliceRoutes: Partial<Record<ServiceId, (locale: Locale, scenarioId: ServiceScenarioId) => React.ReactNode>> = {
  code: (locale, scenarioId) => <CodeRoute locale={locale} scenarioId={scenarioId} />,
};

const sliceHarnessCopy = {
  ar: {
    eyebrow: "سطح تحقق شريحة — ليس خدمة منتج",
    description: "يُركّب هذا السطح مسار الخدمة النطاقي الفعلي نفسه الذي يشير إليه السجل، مع مفاتيح السيناريو واللغة للتحقق من الأدلة.",
    scenario: "السيناريو",
    localeSwitch: "التبديل إلى الإنجليزية",
    registryNote: "المسار الإنتاجي لهذه الخدمة يعرض الآن المساحة النطاقية عبر السجل.",
  },
  en: {
    eyebrow: "Slice verification surface — not a product service",
    description: "This surface mounts the exact domain route the registry points at, with scenario and locale controls, to verify the slice evidence.",
    scenario: "Scenario",
    localeSwitch: "Switch to Arabic",
    registryNote: "This service's product route now renders the domain workspace through the registry.",
  },
} as const;

export type SliceHarnessProps = {
  locale: Locale;
  /** The service this verification surface exercises. */
  serviceId: ServiceId;
};

export function SliceHarness({ locale, serviceId }: SliceHarnessProps) {
  const copy = sliceHarnessCopy[locale];
  const dictionary = getServiceDictionary(locale);
  const entry = dictionary.services[serviceId];
  const [scenarioId, setScenarioId] = useState<ServiceScenarioId>("happy");
  const basePath = `/${locale}/preview/service-${serviceId}`;
  const renderRoute = implementedSliceRoutes[serviceId];

  return (
    <div className="u2-harness" data-testid="u2-slice-harness" data-service={serviceId} data-scenario={scenarioId}>
      <header className="u2-harness__head">
        <div>
          <span className="u2-harness__eyebrow"><FlaskConical size={16} aria-hidden="true" />{copy.eyebrow}</span>
          <h1>{entry.label}</h1>
          <p>{copy.description}</p>
          <p className="u2-harness__resumed">{copy.registryNote}</p>
        </div>
        <Link href={switchLocaleInPath(basePath, locale === "ar" ? "en" : "ar")} data-testid="u2-slice-locale-switch" prefetch={false}>
          {copy.localeSwitch}
        </Link>
      </header>

      <div className="u2-harness__controls">
        <label>
          <span>{copy.scenario}</span>
          <select
            value={scenarioId}
            data-testid="u2-slice-scenario-select"
            onChange={(event) => setScenarioId(event.target.value as ServiceScenarioId)}
          >
            {genericServiceScenarioIds.map((id) => <option value={id} key={id}>{dictionary.scenarios[id]}</option>)}
          </select>
        </label>
      </div>

      {renderRoute === undefined ? null : renderRoute(locale, scenarioId)}
    </div>
  );
}
