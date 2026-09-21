import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { KnowledgePrototype } from "@/components/domain/admin/knowledge-prototype";

export default async function KnowledgePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <KnowledgePrototype locale={locale} initialCollections={data.collections} initialSources={data.sources} />;
}
