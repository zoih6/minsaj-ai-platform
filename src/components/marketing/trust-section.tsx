import { FileSearch, ShieldCheck, SlidersHorizontal } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";

/* ------------------------------------------------------------------
   TrustSection — the Master Template's clarity cards: privacy,
   verifiable sources, editable suggestions. Accents follow the
   template (indigo / cyan / pink) with AA-safe light steps.
   ------------------------------------------------------------------ */

const TRUST_CARDS = [
  { Icon: ShieldCheck, box: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", border: "hoverable:hover:border-brand/30" },
  { Icon: FileSearch, box: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400", border: "hoverable:hover:border-brand-cyan/30" },
  { Icon: SlidersHorizontal, box: "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400", border: "hoverable:hover:border-brand-pink/30" },
] as const;

export function TrustSection({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  const isArabic = locale === "ar";

  return (
    <section
      id="trust"
      className="relative scroll-mt-24 border-t border-slate-200 bg-white py-24 transition-colors dark:border-darkbg-border dark:bg-darkbg-main"
    >
      <div className="ms-container px-4 sm:px-6 lg:px-8">
        <div className="reveal-on-scroll mb-16 text-center">
          <div className={`mb-4 text-xs font-bold tracking-widest text-brand-dark dark:text-brand-light font-display ${isArabic ? "" : ""}`}>
            {copy.trustEyebrow}
          </div>
          <h2 className="mb-6 font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            {copy.trustTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-600 dark:text-slate-400 sm:text-lg">
            {copy.trustBody}
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {copy.trustCards.map((card, index) => {
            const { Icon, box, border } = TRUST_CARDS[index]!;
            return (
              <div
                key={card.title}
                className={`glass-panel group reveal-on-scroll flex flex-col items-center rounded-3xl p-8 text-center transition-all hoverable:hover:-translate-y-2 ${border} ${index === 1 ? "delay-100" : index === 2 ? "delay-200" : ""}`}
              >
                <div className={`mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl transition-transform hoverable:group-hover:scale-110 ${box}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <h4 className="mb-3 font-display text-lg font-bold text-slate-900 dark:text-white">{card.title}</h4>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{card.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
