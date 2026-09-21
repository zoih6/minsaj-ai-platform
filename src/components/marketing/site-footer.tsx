import { MinsajMark, MinsajWordmark } from "@minsaj/ui";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";

/* ------------------------------------------------------------------
   SiteFooter — the Master Template's centered footer.
   [AGENT_REPLACE: FOOTER_LOGO] → the official brand mark + real-text
   wordmark. The template's agent-template note pill is replaced by
   the platform's honest prototype label (truth-and-execution).
   ------------------------------------------------------------------ */

export function SiteFooter({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  return (
    <footer className="relative z-10 border-t border-slate-200 bg-white py-12 text-center transition-colors dark:border-darkbg-border dark:bg-darkbg-main">
      <div className="ms-container px-4">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="mb-2 flex items-center gap-2 text-slate-800 opacity-80 transition-opacity hoverable:hover:opacity-100 dark:text-white">
            <MinsajMark size={28} />
            <MinsajWordmark locale={locale} className="font-display text-xl font-bold" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-display">{copy.copyright}</p>
          <p className="mt-2 inline-block rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-600 dark:bg-darkbg-card dark:text-slate-400">
            {copy.prototype}
          </p>
        </div>
      </div>
    </footer>
  );
}
