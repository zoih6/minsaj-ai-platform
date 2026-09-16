"use client";

import type { Locale, ServiceScenarioId } from "@nasaq/contracts/services";
import { createDeterministicMockServiceClient } from "@nasaq/mock-api/services";
import { LearnWorkspace } from "./learn-workspace";

/**
 * Learn route composition.
 *
 * Keeps the route thin: build the deterministic session and stages for the
 * Learn service and hand them to the Learn workspace. Resume, storage, and
 * records belong to the workbench layer, not to the route.
 */

export type LearnRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function LearnRoute({ locale, scenarioId = "happy" }: LearnRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "learn", locale, scenarioId });

  return (
    <LearnWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
