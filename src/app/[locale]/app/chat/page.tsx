import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { ServiceWorkspace } from "@/components/universal/service-workspace";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: locale === "ar" ? "اسأل وتحدّث — نَسَق" : "Ask & talk — Nasaq" };
}

export default async function ChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <ServiceWorkspace locale={locale} serviceId="ask" />;
}
