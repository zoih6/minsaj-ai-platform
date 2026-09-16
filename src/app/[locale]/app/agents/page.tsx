import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getOperationsData } from "@/lib/data/operations";
import { AgentsPrototype } from "@/components/domain/operations/agents-prototype";

export default async function AgentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  return <AgentsPrototype locale={locale} agents={operations.agents} />;
}
