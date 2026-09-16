import { redirect } from "next/navigation";
import { isLocale } from "@nasaq/i18n";

export default async function PreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${isLocale(locale) ? locale : "ar"}/app/home`);
}
