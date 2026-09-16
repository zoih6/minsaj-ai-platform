import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@nasaq/i18n";
import { FoundationHarness } from "@/features/service-foundation/foundation-harness";

/**
 * U2.0 foundation verification surface.
 *
 * It is intentionally outside `/app/*` so it is never mistaken for a product
 * service, and it is excluded from indexing.
 */
export const metadata: Metadata = {
  title: "U2 foundation verification surface — Nasaq",
  description: "Internal verification surface for the U2 service foundation: deterministic simulator, simulation receipt, and shared workbench parts.",
  robots: { index: false, follow: false },
};

export default async function ServiceFoundationPreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <FoundationHarness locale={locale} initialServiceId="learn" />;
}
