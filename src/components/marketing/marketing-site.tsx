import type { Locale } from "@minsaj/contracts";
import { marketingCopy } from "@/lib/marketing-content";
import { DemoMock } from "./demo-mock";
import { FeatureGrid } from "./feature-grid";
import { FinalCta } from "./final-cta";
import { RevealFx } from "./reveal-fx";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";
import { SiteHero } from "./site-hero";
import { TrustSection } from "./trust-section";
import { WorkflowSection } from "./workflow-section";

/* ------------------------------------------------------------------
   MarketingSite — the Master Template ported as a composition of
   reusable sections (Header · Hero · MockUI · FeatureCards ·
   Workflow · Trust · FinalCTA · Footer). Server-composed; only the
   header, hero film, and reveal orchestrator run on the client.
   Every section order, background rhythm, and breakpoint class
   follows the template 1:1 (theme + direction adapted).
   ------------------------------------------------------------------ */
export function MarketingSite({ locale }: { locale: Locale }) {
  const copy = marketingCopy[locale];
  const appHref = `/${locale}/app/home`;

  return (
    <div className="ms-site overflow-x-clip bg-slate-50 font-body text-slate-800 antialiased dark:bg-darkbg-main dark:text-slate-200">
      <a href="#main" className="skip-link">
        {copy.skipToContent}
      </a>
      <SiteHeader locale={locale} copy={copy} appHref={appHref} />
      <main id="main" className="relative z-10">
        <SiteHero locale={locale} copy={copy} appHref={appHref} />
        <DemoMock locale={locale} copy={copy} />
        <FeatureGrid locale={locale} copy={copy} />
        <WorkflowSection locale={locale} copy={copy} appHref={appHref} />
        <TrustSection locale={locale} copy={copy} />
        <FinalCta locale={locale} copy={copy} appHref={appHref} />
      </main>
      <SiteFooter locale={locale} copy={copy} />
      <RevealFx />
    </div>
  );
}
