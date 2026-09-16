import type { ServiceId } from "@nasaq/contracts/services";
import type { Locale } from "@nasaq/contracts/services";
import { LearnRoute } from "@/features/learn/learn-route";
import { ResearchRoute } from "@/features/research/research-route";
import { CreateRoute } from "@/features/create/create-route";
import type { ServiceRegistryEntry } from "@/features/service-workbench/service-registry";
import { ServiceWorkspace } from "@/components/universal/service-workspace";
import { getUniversalService, type UniversalServiceId } from "@/lib/universal-content";

/**
 * Route composition — which declared renderer a service route mounts.
 *
 * This is the only place that maps a registry entry to a component. It lives in
 * `app/` because section 6.2 of the U2 contract keeps route composition here;
 * the registry itself holds data, and no domain workspace is reachable except
 * through the registry entry that names its renderer.
 */

export function renderDomainWorkspace(serviceId: ServiceId, locale: Locale) {
  if (serviceId === "learn") {
    return <LearnRoute locale={locale} />;
  }
  if (serviceId === "research") {
    return <ResearchRoute locale={locale} />;
  }
  if (serviceId === "create") {
    return <CreateRoute locale={locale} />;
  }
  return null;
}

/** Narrowing lives here: registry entries are `ServiceId`, route slugs are wider. */
function isServiceId(value: string): value is ServiceId {
  return value === "learn" || value === "research" || value === "create" || value === "code" || value === "analyze" || value === "explore";
}

export function renderServiceRoute(entry: ServiceRegistryEntry, locale: Locale) {
  if (entry.renderer === "domain_workspace") {
    const domain = renderDomainWorkspace(entry.serviceId, locale);
    if (domain !== null) {
      return domain;
    }
  }
  return <ServiceWorkspace locale={locale} serviceId={entry.serviceId as UniversalServiceId} />;
}

export function getServiceLabel(locale: Locale, serviceId: string) {
  return isServiceId(serviceId) ? getUniversalService(locale, serviceId as UniversalServiceId) : null;
}

export { isServiceId };
