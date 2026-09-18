import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
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
