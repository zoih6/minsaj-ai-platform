import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { UniversalMarketing } from "@/components/universal/universal-marketing";
import { ScrollFx } from "@/components/universal/scroll-fx";

export default async function MarketingHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <>
      <UniversalMarketing locale={locale} />
      <ScrollFx />
    </>
  );
}
