import type { ServiceId } from "@nasaq/contracts/services";
import { serviceIds } from "@nasaq/contracts/services";

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
};

export const serviceRegistry = {
  learn: { serviceId: "learn", route: "/app/learn", screenId: "U2-LRN-001", routeId: "R-U2-LRN-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  research: { serviceId: "research", route: "/app/research", screenId: "U2-RSH-001", routeId: "R-U2-RSH-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  create: { serviceId: "create", route: "/app/create", screenId: "U2-CRT-001", routeId: "R-U2-CRT-001", renderer: "domain_workspace", status: "implemented", foundationSurface: "/preview/service-foundation" },
  code: { serviceId: "code", route: "/app/code", screenId: "U2-COD-001", routeId: "R-U2-COD-001", renderer: "prototype_service_workspace", status: "foundation", foundationSurface: "/preview/service-foundation" },
  analyze: { serviceId: "analyze", route: "/app/analyze", screenId: "U2-ANA-001", routeId: "R-U2-ANA-001", renderer: "prototype_service_workspace", status: "foundation", foundationSurface: "/preview/service-foundation" },
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
