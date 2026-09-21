import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUp, Mic, Paperclip } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";
import { getUniversalService } from "@/lib/universal-content";
import { isForwardLeft, serviceIcons } from "./shared";

/* ------------------------------------------------------------------
   DemoMock — the Master Template's "Live simulation" MockUI.
   The mock is a preview simulation: it carries the platform's demo
   truth label (محاكاة / Simulated — truth-and-execution), and its
   interactive affordances are real links into the actual services
   (pills → service routes, example chips → the learn starters).
   The input + send stay non-interactive display chrome, exactly as
   the template draws them (cursor-not-allowed, opacity-80).
   ------------------------------------------------------------------ */

export function DemoMock({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  const isArabic = locale === "ar";
  const Forward = isForwardLeft(locale) ? ArrowLeft : ArrowRight;
  const learn = getUniversalService(locale, "learn");
  const LearnIcon = serviceIcons.learn;

  /* The template's one labeled pill (the active service) + five
     icon-only pills — real routes, real aria-labels. */
  const iconPills = (["research", "create", "code", "analyze", "explore"] as const).map((id) => {
    const service = getUniversalService(locale, id);
    return { id, service, Icon: serviceIcons[id] };
  });

  return (
    <section id="demo" className="ms-container scroll-mt-24 px-4 py-20 sm:px-6 lg:px-8">
      <div className="reveal-on-scroll mb-12 text-center">
        <h3 className={`mb-2 text-xs font-semibold text-brand-dark dark:text-brand-light font-display ${isArabic ? "" : "tracking-wider"}`}>
          {copy.demoLeadEyebrow}
        </h3>
        <h2 className="mb-4 font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
          {copy.demoLeadTitle}
        </h2>
        <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">{copy.demoLeadBody}</p>
      </div>

      {/* Mock UI box */}
      <div className="reveal-on-scroll group mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-slate-200 shadow-2xl glass-panel dark:border-darkbg-border">
        {/* Mock header — the platform's demo truth label lives here */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/50 px-5 py-4 dark:border-darkbg-border dark:bg-darkbg-card/40">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-brand-emerald shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className={`text-[10px] text-slate-500 dark:text-slate-400 font-display sm:text-xs ${isArabic ? "" : "tracking-widest"}`}>
              {copy.simulation}
            </span>
          </div>
          <span dir="ltr" className="ms-latin-track text-[10px] text-slate-500 dark:text-slate-400 font-display">
            {copy.mockBrand}
          </span>
        </div>

        {/* Mock body */}
        <div className="relative flex min-h-[350px] flex-col items-center bg-white/30 p-6 dark:bg-darkbg-card/20 sm:min-h-[400px] sm:p-12">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-2xl text-brand-dark shadow-glow transition-transform duration-500 hoverable:group-hover:-translate-y-2 dark:text-brand-light">
            {/* [AGENT_REPLACE: EDUCATION_ICON] → the platform's learn icon */}
            <LearnIcon size={24} aria-hidden="true" />
          </div>

          <h4 className="mb-8 text-center font-display text-xl font-bold text-slate-900 dark:text-white sm:text-2xl md:text-3xl">
            {copy.demoTitle}
          </h4>

          {/* Intent pills — real routes */}
          <div className="mb-10 flex w-full max-w-2xl flex-wrap justify-center gap-2 sm:gap-3">
            <Link
              href={`/${locale}/app/${learn.slug}`}
              className="flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-5 py-2 text-xs text-brand-dark dark:text-brand-light font-display sm:text-sm hoverable:hover:bg-brand/20 active:scale-[.98] transition"
            >
              <LearnIcon size={14} aria-hidden="true" />
              {learn.shortLabel}
            </Link>
            {iconPills.map(({ id, service, Icon }) => (
              <Link
                key={id}
                href={`/${locale}/app/${service.slug}`}
                aria-label={service.shortLabel}
                title={service.label}
                className="glass-panel flex items-center rounded-full px-4 py-2 text-xs text-slate-500 transition dark:text-slate-400 hoverable:hover:text-slate-900 dark:hoverable:hover:text-white hoverable:hover:border-slate-300 dark:hoverable:hover:border-slate-600 active:scale-[.98] sm:text-sm"
              >
                <Icon size={14} aria-hidden="true" />
              </Link>
            ))}
          </div>

          {/* Input box — display chrome of a simulation (non-interactive) */}
          <div className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-all dark:border-darkbg-border dark:bg-darkbg-main sm:p-3">
            <input
              type="text"
              disabled
              dir="auto"
              placeholder={learn.prompt}
              className="w-full border-none bg-transparent p-3 text-sm text-slate-900 outline-none placeholder-slate-500 dark:text-white dark:placeholder-slate-400 font-body sm:text-base"
            />
            <div className="mt-2 flex items-center justify-between px-2 pb-1">
              <div className="flex gap-2" aria-hidden="true">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 dark:text-slate-500">
                  <Paperclip size={16} />
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 dark:text-slate-500">
                  <Mic size={16} />
                </span>
              </div>
              <button
                type="button"
                disabled
                aria-hidden="true"
                tabIndex={-1}
                className="flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-xl bg-brand text-white opacity-80"
              >
                <ArrowUp size={18} />
              </button>
            </div>
          </div>

          {/* Example prompts — the learn starters, as real links */}
          <div className="mt-6 flex w-full max-w-2xl flex-col items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400 font-display sm:flex-row sm:text-sm">
            <Link
              href={`/${locale}/app/${learn.slug}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 transition hoverable:hover:text-brand dark:border-darkbg-border dark:bg-darkbg-card active:scale-[.98]"
            >
              {learn.starters[1]}
              <Forward size={12} aria-hidden="true" />
            </Link>
            <Link
              href={`/${locale}/app/${learn.slug}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 transition hoverable:hover:text-brand dark:border-darkbg-border dark:bg-darkbg-card active:scale-[.98]"
            >
              {learn.starters[0]}
              <Forward size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Concept context — the template's "01 · البذرة" block */}
      <div className="reveal-on-scroll mx-auto mt-16 max-w-lg text-center">
        <span className={`mb-2 text-xs font-bold text-brand-dark dark:text-brand-light font-display ${isArabic ? "" : "tracking-widest"}`}>
          {copy.conceptKicker}
        </span>
        <h3 className="mt-2 mb-3 font-display text-2xl font-bold text-slate-900 dark:text-white">{copy.conceptTitle}</h3>
        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{copy.conceptBody}</p>
      </div>
    </section>
  );
}
