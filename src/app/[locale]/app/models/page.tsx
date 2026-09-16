import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { ModelsPrototype } from "@/components/domain/admin/catalog-prototype";

export default async function ModelsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <ModelsPrototype locale={locale} models={data.models} />;
}
