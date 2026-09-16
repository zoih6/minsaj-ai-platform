import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { SettingsPrototype } from "@/components/domain/admin/settings-prototype";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SettingsPrototype locale={locale} />;
}
