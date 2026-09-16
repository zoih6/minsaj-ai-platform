import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { ToolsPrototype } from "@/components/domain/admin/catalog-prototype";

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <ToolsPrototype locale={locale} tools={data.tools} />;
}
