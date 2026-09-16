import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { getWorkspaceAdminData } from "@/lib/data/operations";
import { RoutingPrototype } from "@/components/domain/admin/billing-routing-prototype";

export default async function RoutingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getWorkspaceAdminData();
  return <RoutingPrototype locale={locale} models={data.models} />;
}
