import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getAgentData, getOperationsData } from "@/lib/data/operations";
import { AgentBuilderPrototype } from "@/components/domain/operations/agent-builder-prototype";

export default async function AgentEditPage({ params }: { params: Promise<{ locale: string; agentId: string }> }) {
  const { locale, agentId } = await params;
  if (!isLocale(locale)) notFound();
  const [specific, base, operations] = await Promise.all([getAgentData(agentId), getAgentData("agt_market_researcher"), getOperationsData()]);
  if (!base) notFound();
  const summary = operations.agents.find((item) => item.id === agentId);
  const definition = specific ?? (summary ? { ...base, summary, modelPolicy: { ...base.modelPolicy, primary: summary.model } } : null);
  if (!definition) notFound();
  return <AgentBuilderPrototype locale={locale} initialDefinition={definition} />;
}
