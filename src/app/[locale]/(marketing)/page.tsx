import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import type { Locale } from "@minsaj/contracts";
import { MarketingSite } from "@/components/marketing/marketing-site";

/* [AGENT_REPLACE: TITLE_AND_FAVICON] — the template's page title on
   the marketing route (the app icon at src/app/icon.png carries the
   favicon; OG image comes from the locale layout metadata). */
const TITLES: Record<Locale, string> = {
  ar: "منسج — أفكارك خيوط ونحن ننسجها واقعاً",
  en: "Minsaj — Your ideas are threads. We weave them into reality.",
};

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return {};
  return { title: TITLES[rawLocale] };
}

export default async function MarketingHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <MarketingSite locale={locale} />;
}
