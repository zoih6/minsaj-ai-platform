import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { SliceHarness } from "@/features/service-foundation/slice-harness";

/**
 * U2.5 Analyze slice verification surface — W-3.
 *
 * It is intentionally outside `/app/*` so it is never mistaken for a product
 * service, and it is excluded from indexing. It mounts the same AnalyzeRoute
 * the registry flip points at, with scenario controls for evidence gathering.
 */
export const metadata: Metadata = {
  title: "U2.5 Analyze slice verification — Minsaj",
  description: "Internal verification surface for the Analyze domain slice: the deterministic local-compute workspace, its reconciliation checks, and its summary.",
  robots: { index: false, follow: false },
};

export default async function AnalyzeSlicePreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SliceHarness locale={locale} serviceId="analyze" />;
}
