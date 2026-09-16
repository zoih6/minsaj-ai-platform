import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { ModelDetailPrototype } from "@/components/domain/admin/catalog-prototype";

export default async function ModelDetailPage({ params }: { params: Promise<{ locale: string; modelId: string }> }) {
  const { locale, modelId } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  const model = data.models.find((item) => item.id === modelId);
  if (!model) notFound();
  return <ModelDetailPrototype locale={locale} model={model} />;
}
