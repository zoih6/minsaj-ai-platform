import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { AdaptiveHome } from "@/components/universal/adaptive-home";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: locale === "ar" ? "لك — نَسَق" : "For you — Nasaq",
    description: locale === "ar" ? "مساحتك المتكيفة للتعلّم والبحث والصناعة والبرمجة والاستكشاف." : "Your adaptive space for learning, research, creation, coding, and discovery.",
  };
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <AdaptiveHome locale={locale} />;
}
