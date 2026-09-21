import type { ServiceId } from "@minsaj/contracts/services";
import { serviceIds } from "@minsaj/contracts/services";

/**
 * Explicit service route registry.
 *
 * It exists so each service route resolves through one declared composition
 * instead of a conditional monolith. A service reports `status: "implemented"`
 * only when its slice landed and its receipt lists fresh evidence; every other
 * entry stays on `foundation` and keeps the prototype workspace on its route.
 */
export type ServiceWorkspaceStatus = "foundation" | "implemented";

export type ServiceRegistryEntry = {
  serviceId: ServiceId;
  /** Path under `/{locale}`. */
  route: string;
  screenId: string;
  routeId: string;
  /** Which composition the route renders today. */
  renderer: "prototype_service_workspace" | "domain_workspace";
  status: ServiceWorkspaceStatus;
  /** Foundation verification surface used while the slice is pending. */
  foundationSurface: string;
  /** Slice landing receipt: where the implemented slice is verified live. */
  sliceVerificationSurface?: string;
  /** Fresh evidence lines recorded when the slice landed (registry pattern). */
  sliceReceipt?: readonly string[];
};

export const serviceRegistry = {
  learn: { serviceId: "learn", route: "/app/learn", screenId: "U2-LRN-001", routeId: "R-U2-LRN-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  research: { serviceId: "research", route: "/app/research", screenId: "U2-RSH-001", routeId: "R-U2-RSH-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  create: { serviceId: "create", route: "/app/create", screenId: "U2-CRT-001", routeId: "R-U2-CRT-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  code: {
    serviceId: "code",
    route: "/app/code",
    screenId: "U2-COD-001",
    routeId: "R-U2-COD-001",
    renderer: "domain_workspace",
    status: "implemented",
    foundationSurface: "/preview/service-foundation",
    sliceVerificationSurface: "/preview/service-code",
    sliceReceipt: [
      "W-3 2026-09-21: contracts/services/code.ts + i18n code-content (ar/en parity) + mock-api code rules",
      "Verified: full guided path scope→plan→proposal→diff→copy→checks→receipt, fast path, diff guard (no continue with unreviewed files), warn on test-less plans",
      "Gates: build clean, lint clean, tsc no new errors, 390px no horizontal scroll (ar/en × light/dark)",
    ],
  },
  analyze: {
    serviceId: "analyze",
    route: "/app/analyze",
    screenId: "U2-ANA-001",
    routeId: "R-U2-ANA-001",
    renderer: "domain_workspace",
    status: "implemented",
    foundationSurface: "/preview/service-foundation",
    sliceVerificationSurface: "/preview/service-analyze",
    sliceReceipt: [
      "W-3 2026-09-21: contracts/services/analyze.ts + i18n analyze-content (ar/en parity) + mock-api analyze rules",
      "Verified: guided path source→profile→question→plan→compute→result→verify→complete, fast path, verify guard (no confirm with unacknowledged checks), warn on cleaned rows and empty assumptions",
      "Gates: build clean, lint clean, tsc no new errors, 390px no horizontal scroll (ar/en × light/dark)",
    ],
  },
  explore: { serviceId: "explore", route: "/app/explore", screenId: "U2-EXP-001", routeId: "R-U2-EXP-001", renderer: "prototype_service_workspace", status: "foundation", foundationSurface: "/preview/service-foundation" },
} as const satisfies Record<ServiceId, ServiceRegistryEntry>;

export function getServiceRegistryEntry(serviceId: ServiceId): ServiceRegistryEntry {
  return serviceRegistry[serviceId];
}

export function getRegisteredServiceIds(): readonly ServiceId[] {
  return serviceIds;
}

export function isServiceSliceImplemented(serviceId: ServiceId): boolean {
  const entry: ServiceRegistryEntry = serviceRegistry[serviceId];
  return entry.status === "implemented";
}

/** Ask & Talk stays the shared gateway: it is not registered as a domain service. */
export const serviceGatewayRoute = "/app/chat";
