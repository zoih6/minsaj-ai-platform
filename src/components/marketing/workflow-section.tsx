import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers3, ShieldCheck } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";
import { isForwardLeft } from "./shared";

/* ------------------------------------------------------------------
   WorkflowSection — the Master Template's adaptive narrative:
   text column (start side) + the workflow visual panel with the
   01/02/03 timeline and the control note. The timeline spine uses
   logical insets so the dots and the line flip with the direction.
   ------------------------------------------------------------------ */

export function WorkflowSection({ locale, copy, appHref }: { locale: Locale; copy: MarketingCopy; appHref: string }) {
  const isArabic = locale === "ar";
  const Forward = isForwardLeft(locale) ? ArrowLeft : ArrowRight;
  const slide = isForwardLeft(locale) ? "hoverable:group-hover:-translate-x-2" : "hoverable:group-hover:translate-x-2";

  /* Timeline circle states — the template's emphasis decay (brand →
     brand/40 → quiet) is preserved with AA-safe inks. */
  const circleClasses = [
    "border-2 border-brand text-brand",
    "border-2 border-brand/40 dark:border-brand/50 text-brand",
    "border-2 border-slate-200 dark:border-darkbg-border text-slate-500 dark:text-slate-400",
  ] as const;

  return (
    <section id="adaptive" className="relative scroll-mt-24 py-24">
      <div className="ms-container px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-16 lg:flex-row lg:gap-24">
          {/* Text column */}
          <div className="reveal-on-scroll flex-1 text-start">
            <div className={`mb-6 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-bold text-brand-dark dark:text-brand-light font-display ${isArabic ? "" : "tracking-widest"}`}>
              <Layers3 size={12} aria-hidden="true" />
              {copy.adaptiveEyebrow}
            </div>
            <h2 className="mb-6 font-display text-3xl font-bold leading-[1.3] text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
              {copy.adaptiveTitle}
            </h2>
            <p className="mb-10 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg">
              {copy.adaptiveBody}
            </p>
            <Link
              href={appHref}
              className="group inline-flex items-center gap-3 font-display text-lg font-bold text-brand-dark transition-colors hoverable:hover:text-brand dark:text-brand-light dark:hoverable:hover:text-brand-light"
            >
              {copy.startFree}
              <Forward size={14} aria-hidden="true" className={`transition-transform ${slide}`} />
            </Link>
          </div>

          {/* Workflow visual panel */}
          <div className="reveal-on-scroll delay-100 w-full max-w-lg flex-1 lg:max-w-none">
            <div className="glass-panel relative rounded-[2rem] border border-slate-200 bg-white/50 p-8 shadow-2xl dark:border-darkbg-border dark:bg-darkbg-card/50">
              {/* Top info */}
              <div className="mb-10 flex items-center justify-between border-b border-slate-200 pb-6 dark:border-darkbg-border">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-dark font-display text-lg font-bold text-white shadow-glow">
                    {isArabic ? "ن" : "M"}
                  </div>
                  <div>
                    <div className={`mb-1 text-[10px] text-slate-500 dark:text-slate-400 font-display ${isArabic ? "" : "tracking-widest"}`}>
                      {copy.yourDay}
                    </div>
                    <div className="font-display text-base font-bold text-slate-900 dark:text-white">{copy.dayMix}</div>
                  </div>
                </div>
              </div>

              {/* Steps timeline */}
              <div className="relative space-y-8 before:absolute before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 before:start-6 dark:before:bg-darkbg-border">
                {copy.steps.map(([title, body], index) => (
                  <div key={title} className="relative z-10 flex items-start gap-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white font-display text-sm font-bold shadow-sm dark:bg-darkbg-main ${circleClasses[index]}`}>
                      {`0${index + 1}`}
                    </div>
                    <div className="pt-2">
                      <h4 className="mb-2 font-display text-base font-bold text-slate-900 dark:text-white">{title}</h4>
                      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{body}</p>
                      {index === 0 ? (
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-brand bg-brand/10 px-4 py-1.5 text-xs font-medium text-brand-dark dark:text-brand-light font-display">
                            {copy.stepChips[0]}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs text-slate-600 dark:border-darkbg-border dark:bg-darkbg-main dark:text-slate-400 font-display">
                            {copy.stepChips[1]}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs text-slate-600 dark:border-darkbg-border dark:bg-darkbg-main dark:text-slate-400 font-display">
                            {copy.stepChips[2]}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-3 rounded-xl border-t border-slate-200 bg-brand-emerald/5 p-4 pt-6 text-xs font-medium text-brand-emerald-ink font-display dark:border-darkbg-border">
                <ShieldCheck size={18} aria-hidden="true" />
                {copy.controlNote}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
