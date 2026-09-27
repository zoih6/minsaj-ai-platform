import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getFlowData, getOperationsData } from "@/lib/data/operations";
import { FlowsPrototype } from "@/components/domain/operations/flows-prototype";

export default async function FlowsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const operations = await getOperationsData();
  // Bible §6.11: the list page previews the lead flow's REAL definition —
  // the same fixtures the editor reads, so the preview never invents structure.
  const previewId = operations.flows.find((flow) => flow.status === "published")?.id ?? operations.flows[0]?.id ?? null;
  const preview = previewId === null ? null : await getFlowData(previewId);
  return <FlowsPrototype locale={locale} flows={operations.flows} preview={preview} />;
}
