import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getFlowData, getOperationsData } from "@/lib/data/operations";
import { FlowEditorPrototype } from "@/components/domain/operations/flow-editor-prototype";

export default async function FlowEditPage({ params }: { params: Promise<{ locale: string; flowId: string }> }) {
  const { locale, flowId } = await params;
  if (!isLocale(locale)) notFound();
  const [specific, base, operations] = await Promise.all([getFlowData(flowId), getFlowData("flw_weekly_watch"), getOperationsData()]);
  if (!base) notFound();
  const summary = operations.flows.find((item) => item.id === flowId);
  const definition = specific ?? (summary ? { ...base, summary } : null);
  if (!definition) notFound();
  return <FlowEditorPrototype locale={locale} initialDefinition={definition} />;
}
