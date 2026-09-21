"use client";

import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { createDeterministicMockServiceClient } from "@minsaj/mock-api/services";
import { AnalyzeWorkspace } from "./analyze-workspace";

/**
 * Analyze route composition — U2.5.
 *
 * Keeps the route thin: build the deterministic session and stages for the
 * Analyze service and hand them to the Analyze workspace. Resume, storage, and
 * records belong to the workbench layer, not to the route.
 */

export type AnalyzeRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function AnalyzeRoute({ locale, scenarioId = "happy" }: AnalyzeRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "analyze", locale, scenarioId });

  return (
    <AnalyzeWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
