import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@minsaj/i18n";
import { SliceHarness } from "@/features/service-foundation/slice-harness";

/**
 * U2.6 Explore slice verification surface — W-3.
 *
 * It is intentionally outside `/app/*` so it is never mistaken for a product
 * service, and it is excluded from indexing. It mounts the same ExploreRoute
 * the registry flip points at, with scenario controls for evidence gathering.
 */
export const metadata: Metadata = {
  title: "U2.6 Explore slice verification — Minsaj",
  description: "Internal verification surface for the Explore domain slice: the knowledge-map workspace, its trail with branches, and its checkpoint.",
  robots: { index: false, follow: false },
};

export default async function ExploreSlicePreviewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <SliceHarness locale={locale} serviceId="explore" />;
}
