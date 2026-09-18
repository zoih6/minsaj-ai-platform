import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getOperationsData } from "@/lib/data/operations";
import { FlowsPrototype } from "@/components/domain/operations/flows-prototype";

export default async function FlowsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  return <FlowsPrototype locale={locale} flows={operations.flows} />;
}
