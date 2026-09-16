import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getAgentData } from "@/lib/data/operations";
import { AgentBuilderPrototype } from "@/components/domain/operations/agent-builder-prototype";

export default async function NewAgentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const base = await getAgentData("new");
  if (!base) notFound();
  const definition = { ...base, summary: { ...base.summary, id: "agt_new_demo", name: { ar: "وكيل جديد", en: "New agent" }, description: { ar: "عرّف النتيجة التي سيتولاها هذا الوكيل.", en: "Define the outcome this agent will own." }, status: "draft" as const, version: 1 } };
  return <AgentBuilderPrototype locale={locale} initialDefinition={definition} isNew />;
}
