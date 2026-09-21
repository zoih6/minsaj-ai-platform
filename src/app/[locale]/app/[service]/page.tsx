import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { UniversalLibrary } from "@/components/universal/universal-library";
import { parseScenarioParam } from "@/lib/surface-states";
import type { ServiceId } from "@minsaj/contracts/services";
import { getUniversalService } from "@/lib/universal-content";
import { getRegisteredServiceIds, getServiceRegistryEntry } from "@/features/service-workbench/service-registry";
import { renderServiceRoute } from "./service-route-renderers";

/**
 * Service route composition.
 *
 * Each registered service resolves through its registry entry: an implemented
 * slice mounts its domain workspace, and every other service keeps the existing
 * prototype workspace. The registry is the single place that records the flip,
 * so routes stay stable while slices land one at a time.
 */
const serviceMap = Object.fromEntries(getRegisteredServiceIds().map((serviceId) => [serviceId, serviceId])) as Record<string, ServiceId>;

export function generateStaticParams() {
  return [...Object.keys(serviceMap), "library"].map((service) => ({ service }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; service: string }> }): Promise<Metadata> {
  const { locale, service: slug } = await params;
  if (!isLocale(locale)) return {};
  if (slug === "library") return { title: locale === "ar" ? "مكتبتي — منسج" : "My library — Minsaj" };
  const serviceId = serviceMap[slug];
  if (!serviceId) return {};
  const service = getUniversalService(locale, serviceId);
  return { title: `${service.label} — ${locale === "ar" ? "منسج" : "Minsaj"}`, description: service.description };
}

export default async function UniversalServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; service: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, service: slug } = await params;
  if (!isLocale(locale)) notFound();
  if (slug === "library") {
    return <UniversalLibrary locale={locale} scenario={parseScenarioParam((await searchParams).state)} />;
  }
  const serviceId = serviceMap[slug];
  if (!serviceId) notFound();
  return renderServiceRoute(getServiceRegistryEntry(serviceId), locale);
}
