"use client";

import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { createDeterministicMockServiceClient } from "@minsaj/mock-api/services";
import { CodeWorkspace } from "./code-workspace";

/**
 * Code route composition — U2.4.
 *
 * Keeps the route thin: build the deterministic session and stages for the Code
 * service and hand them to the Code workspace. Resume, storage, and records
 * belong to the workbench layer, not to the route.
 */

export type CodeRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function CodeRoute({ locale, scenarioId = "happy" }: CodeRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "code", locale, scenarioId });

  return (
    <CodeWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
