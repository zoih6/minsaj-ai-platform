"use client";

import type { Locale, ServiceScenarioId } from "@minsaj/contracts/services";
import { createDeterministicMockServiceClient } from "@minsaj/mock-api/services";
import { ExploreWorkspace } from "./explore-workspace";

/**
 * Explore route composition — U2.6.
 *
 * Keeps the route thin: build the deterministic session and stages for the
 * Explore service and hand them to the Explore workspace. Resume, storage, and
 * records belong to the workbench layer, not to the route.
 */

export type ExploreRouteProps = {
  locale: Locale;
  scenarioId?: ServiceScenarioId;
};

export function ExploreRoute({ locale, scenarioId = "happy" }: ExploreRouteProps) {
  // Deterministic and storage-free: the same input renders the same markup on
  // the server and on the client. Saved demo data is applied after mount, by
  // the workbench provider, so hydration can never disagree with the server.
  const client = createDeterministicMockServiceClient();
  const created = client.createSession({ serviceId: "explore", locale, scenarioId });

  return (
    <ExploreWorkspace
      locale={locale}
      scenarioId={scenarioId}
      session={created.session}
      stages={created.stages}
      resumeFromStorage
    />
  );
}
