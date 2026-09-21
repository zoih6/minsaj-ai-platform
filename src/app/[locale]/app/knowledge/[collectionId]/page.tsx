import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { KnowledgeCollectionPrototype } from "@/components/domain/admin/knowledge-prototype";

export default async function CollectionPage({ params }: { params: Promise<{ locale: string; collectionId: string }> }) {
  const { locale, collectionId } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  const collection = data.collections.find((item) => item.id === collectionId);
  if (!collection) notFound();
  return <KnowledgeCollectionPrototype locale={locale} collection={collection} sources={data.sources.filter((source) => source.collectionId === collectionId)} />;
}
