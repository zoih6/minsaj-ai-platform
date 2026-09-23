import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";
import { isForwardLeft } from "./shared";

/* ------------------------------------------------------------------
   FinalCta — the Master Template's closing act: the ghost brand
   watermark ([AGENT_REPLACE: BACKGROUND_PATTERN] → the official
   ghost symbol), the gradient badge, and the primary exit CTA.
   ------------------------------------------------------------------ */

export function FinalCta({ locale, copy, appHref }: { locale: Locale; copy: MarketingCopy; appHref: string }) {
  const isForwardArrowLeft = isForwardLeft(locale);
  const Forward = isForwardArrowLeft ? ArrowLeft : ArrowRight;
  const slide = isForwardArrowLeft ? "hoverable:group-hover:-translate-x-2" : "hoverable:group-hover:translate-x-2";

  return (
    <section className="relative flex flex-col items-center justify-center overflow-hidden border-t border-slate-200 bg-slate-50 py-32 dark:border-darkbg-border dark:bg-darkbg-card">
      {/* Brand watermark (theme-aware ghost symbol) */}
      <div aria-hidden="true" className="ms-ghost-bg" />

      <div className="reveal-on-scroll relative z-10 mx-auto max-w-3xl px-4 text-center">
        {/* Gradient badge — the glyph mark on the platform spectrum
            (Phase 5: the purple tail rides --u-cyan; one palette) */}
        <div className="mx-auto mb-10 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand to-brand-cyan shadow-glow-lg transition-transform duration-500 hoverable:hover:rotate-12">
          <Layers3 size={46} className="text-white" aria-hidden="true" strokeWidth={1.6} />
        </div>

        <h2 className="mb-8 font-display text-4xl font-extrabold leading-[1.2] text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
          {copy.finalTitle}
        </h2>
        <p className="mb-12 mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-xl">
          {copy.finalBody}
        </p>

        <Link
          href={appHref}
          className="group mx-auto flex items-center justify-center gap-4 rounded-2xl bg-brand-dark px-10 py-5 font-display text-lg font-bold text-white shadow-glow transition-all hoverable:hover:-translate-y-1 hoverable:hover:brightness-110 sm:text-xl active:scale-[.98]"
        >
          <Forward size={20} aria-hidden="true" className={`transition-transform ${slide}`} />
          {copy.finalCta}
        </Link>
      </div>
    </section>
  );
}
