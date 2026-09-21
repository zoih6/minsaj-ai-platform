import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { SkillsPrototype } from "@/components/domain/admin/catalog-prototype";

export default async function SkillsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <SkillsPrototype locale={locale} skills={data.skills} />;
}
