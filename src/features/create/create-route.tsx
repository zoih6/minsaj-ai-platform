"use client";

import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { createDeterministicMockServiceClient } from "@minsaj/mock-api/services";
import { CreateWorkspace } from "./create-workspace";

/**
 * Create route composition.
 *
 * Keeps the route thin: build the deterministic session and stages for the
 * Create service and hand them to the Create workspace. Resume, storage, and
 * records belong to the workbench layer, not to the route.
 */

export type CreateRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function CreateRoute({ locale, scenarioId = "happy" }: CreateRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "create", locale, scenarioId });

  return (
    <CreateWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
