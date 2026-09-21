import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getFlowData } from "@/lib/data/operations";
import { FlowEditorPrototype } from "@/components/domain/operations/flow-editor-prototype";

export default async function NewFlowPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const base = await getFlowData("new");
  if (!base) notFound();
  const definition = { ...base, summary: { ...base.summary, id: "flw_new_demo", name: { ar: "تدفق جديد", en: "New flow" }, description: { ar: "اربط العقد لتكوين مسار قابل للتدقيق.", en: "Connect nodes into an auditable path." }, status: "draft" as const, version: 1 } };
  return <FlowEditorPrototype locale={locale} initialDefinition={definition} isNew />;
}
