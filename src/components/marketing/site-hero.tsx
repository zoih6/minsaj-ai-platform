"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { MarketingCopy } from "@/lib/marketing-content";
import { isForwardLeft } from "./shared";

/* ------------------------------------------------------------------
   SiteHero — the Master Template's first act.
   [AGENT_REPLACE: HERO_VIDEO_OR_GRAPHIC] → the owner's official
   identity film (public/brand/motion) loops inside the template's
   rounded stage with the bottom fade + AI badge. Reduced motion
   pauses the loop (the poster carries the still frame).
   ------------------------------------------------------------------ */

const VIDEO_SRC = "/brand/motion/minsaj-motion-720.mp4";
const POSTER_SRC = "/brand/motion/minsaj-motion-poster.webp";

export function SiteHero({ locale, copy, appHref }: { locale: Locale; copy: MarketingCopy; appHref: string }) {
  const isArabic = locale === "ar";
  const Forward = isForwardLeft(locale) ? ArrowLeft : ArrowRight;
  const OutIcon = isForwardLeft(locale) ? ArrowUpLeft : ArrowUpRight;
  const videoRef = useRef<HTMLVideoElement | null>(null);

  /* Ambient loop honor: prefers-reduced-motion pauses the film. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (reduceQuery.matches) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };
    apply();
    reduceQuery.addEventListener("change", apply);
    return () => reduceQuery.removeEventListener("change", apply);
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8">
      {/* Backdrop bloom — the template's dark-only glow */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/4 hidden h-[400px] w-full max-w-3xl -translate-x-1/2 rounded-full bg-brand-dark/20 blur-[120px] dark:block dark:bg-brand-dark/30" />

      <div className="reveal-on-scroll mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-2 text-xs font-medium text-brand-dark dark:text-brand-light sm:text-sm font-display">
        <Sparkles size={14} aria-hidden="true" />
        {copy.eyebrow}
      </div>

      <h1
        className={`reveal-on-scroll mb-6 mx-auto max-w-5xl font-display text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl md:text-6xl lg:text-7xl ${isArabic ? "leading-[1.4]" : "leading-[1.3]"}`}
      >
        {copy.headlineA}
        <br className="block sm:hidden" />{" "}
        <span className="text-gradient">{copy.headlineB}</span>
      </h1>

      <p className="reveal-on-scroll mb-10 mx-auto max-w-3xl font-body text-sm leading-relaxed text-slate-600 dark:text-slate-400 sm:text-lg lg:text-xl">
        {copy.body}
      </p>

      <div className="reveal-on-scroll mb-12 flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
        <Link
          href={appHref}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-dark px-8 py-3.5 font-display font-semibold text-white shadow-glow transition-all hoverable:hover:-translate-y-1 hoverable:hover:bg-brand-deep sm:w-auto active:scale-[.98]"
        >
          <Forward size={16} aria-hidden="true" />
          {copy.primary}
        </Link>
        <Link
          href="#demo"
          className="glass-panel group flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-display font-medium text-slate-800 transition-all dark:text-white hoverable:hover:bg-slate-200 dark:hoverable:hover:bg-slate-800 sm:w-auto active:scale-[.98]"
        >
          <OutIcon size={16} className="text-slate-500 transition dark:text-slate-400 hoverable:group-hover:text-brand" aria-hidden="true" />
          {copy.secondary}
        </Link>
      </div>

      <div className="reveal-on-scroll flex flex-col items-center justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 sm:flex-row sm:gap-8 sm:text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-brand-emerald" aria-hidden="true" />
          {copy.noCard}
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-brand-emerald" aria-hidden="true" />
          {copy.noSetup}
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={14} className="text-brand-emerald" aria-hidden="true" />
          {copy.bilingual}
        </div>
      </div>

      {/* Visual stage — the template frame, now carrying the identity film */}
      <div className="reveal-on-scroll group relative mx-auto mt-16 flex aspect-video w-full max-w-4xl items-center justify-center overflow-hidden rounded-3xl sm:aspect-auto sm:h-[400px]">
        <video
          ref={videoRef}
          className="ms-hero-video transition-transform duration-500 hoverable:group-hover:scale-105"
          src={VIDEO_SRC}
          poster={POSTER_SRC}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden="true"
          disablePictureInPicture
          tabIndex={-1}
        />
        {/* Template fade: blends the film into the page canvas */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-transparent to-slate-50 dark:to-darkbg-main" />
        <div className="glass-panel absolute top-4 z-20 flex items-center gap-2 rounded-full px-4 py-2 text-[10px] shadow-lg start-4 font-display sm:top-10 sm:text-xs sm:start-10">
          <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-brand-emerald" />
          {copy.aiBadge}
        </div>
      </div>
    </section>
  );
}
