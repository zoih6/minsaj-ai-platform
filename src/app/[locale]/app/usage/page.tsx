import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { UsagePrototype } from "@/components/domain/admin/usage-prototype";

export default async function UsagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <UsagePrototype locale={locale} events={data.usageEvents} />;
}
