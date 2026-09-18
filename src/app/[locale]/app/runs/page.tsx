import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getOperationsData } from "@/lib/data/operations";
import { RunsPrototype } from "@/components/domain/operations/runs-prototype";
import { parseScenarioParam } from "@/lib/surface-states";

export default async function RunsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  return <RunsPrototype locale={locale} runs={operations.runs} scenario={parseScenarioParam((await searchParams).state)} />;
}
