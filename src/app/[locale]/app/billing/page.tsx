import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { BillingPrototype } from "@/components/domain/admin/billing-routing-prototype";

export default async function BillingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <BillingPrototype locale={locale} />;
}
