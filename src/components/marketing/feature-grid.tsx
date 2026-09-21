import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";
import { marketingServiceCards } from "@/lib/marketing-content";
import { cardAccents, isForwardLeft, serviceIcons } from "./shared";

/* ------------------------------------------------------------------
   FeatureGrid — the Master Template's "one platform · many doors"
   section: the audience tag cloud (all seven services as dots)
   + the six service cards. Cards are the platform's real service
   dictionary (eyebrow / label / description / first starter) and
   link into the real routes — the template's [FEATURE_CARDS]
   replacement markers, resolved with the platform's own icons.
   ------------------------------------------------------------------ */

/* Tag cloud dot colors — the template's exact per-tag hues. */
const TAG_DOTS = [
  "bg-brand",
  "bg-brand-cyan",
  "bg-brand-pink",
  "bg-brand-emerald",
  "bg-purple-500",
  "bg-blue-500",
  "bg-orange-500",
] as const;

export function FeatureGrid({ locale, copy }: { locale: Locale; copy: MarketingCopy }) {
  const isArabic = locale === "ar";
  const Forward = isForwardLeft(locale) ? ArrowLeft : ArrowRight;
  const cards = marketingServiceCards(locale);

  return (
    <section id="services" className="scroll-mt-24 border-t border-slate-200 bg-slate-100/50 py-24 dark:border-darkbg-border dark:bg-darkbg-main/50">
      <div className="ms-container px-4 sm:px-6 lg:px-8">
        <div className="reveal-on-scroll mb-16 text-center">
          <h2 className="mb-6 font-body text-lg font-medium text-slate-500 dark:text-slate-400 sm:text-xl">
            {copy.forEveryone}
          </h2>

          {/* Audience tag cloud */}
          <div className="mx-auto mb-10 flex max-w-3xl flex-wrap justify-center gap-2">
            {copy.audience.map((tag, index) => (
              <span
                key={tag}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs text-slate-700 shadow-sm font-display dark:border-darkbg-border dark:bg-darkbg-card dark:text-slate-300"
              >
                <span aria-hidden="true" className={`h-2 w-2 rounded-full ${TAG_DOTS[index % TAG_DOTS.length]}`} />
                {tag}
              </span>
            ))}
          </div>

          <div className={`mb-4 inline-flex items-center gap-2 text-xs font-medium text-brand-dark dark:text-brand-light font-display ${isArabic ? "" : "tracking-wider"}`}>
            {copy.servicesEyebrow}
          </div>
          <h2 className="mb-6 font-display text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl md:text-5xl">
            {copy.servicesTitle}
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-slate-600 dark:text-slate-400 sm:text-base md:text-lg">
            {copy.servicesBody}
          </p>
        </div>

        {/* Grid of service cards */}
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {cards.map((service) => {
            const accent = cardAccents[service.id];
            const Icon = serviceIcons[service.id];
            return (
              <Link
                key={service.id}
                href={`/${locale}/app/${service.slug}`}
                className={`reveal-on-scroll glass-panel group relative flex flex-col items-start rounded-3xl p-8 transition-all duration-300 hoverable:hover:-translate-y-2 active:scale-[.98] ${accent.border}`}
              >
                {/* Corner affordance arrow (inline-end corner) */}
                <Forward
                  size={16}
                  aria-hidden="true"
                  className={`absolute top-8 text-slate-300 end-8 transition-colors dark:text-slate-600 ${accent.arrow}`}
                />
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl transition-transform hoverable:group-hover:scale-110 ${accent.box}`}>
                  <Icon size={24} aria-hidden="true" />
                </div>
                <span className={`mb-2 text-xs font-bold font-display ${accent.kicker} ${isArabic ? "" : "tracking-wide"}`}>
                  {service.eyebrow}
                </span>
                <h3 className="mb-4 font-display text-2xl font-bold text-slate-900 dark:text-white">{service.label}</h3>
                <p className="mb-8 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{service.description}</p>
                <div className="mt-auto w-full rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500 shadow-sm font-display dark:border-darkbg-border dark:bg-darkbg-main dark:text-slate-400">
                  {service.starters[0]}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
