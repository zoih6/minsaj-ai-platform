"use client";

import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { createDeterministicMockServiceClient } from "@minsaj/mock-api/services";
import { ResearchWorkspace } from "./research-workspace";

/**
 * Research route composition.
 *
 * Keeps the route thin: build the deterministic session and stages for the
 * Research service and hand them to the Research workspace. Resume, storage,
 * and records belong to the workbench layer, not to the route.
 */

export type ResearchRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function ResearchRoute({ locale, scenarioId = "happy" }: ResearchRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "research", locale, scenarioId });

  return (
    <ResearchWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
