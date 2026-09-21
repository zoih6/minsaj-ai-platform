"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { MinsajMark, MinsajWordmark } from "@minsaj/ui";
import type { Locale } from "@minsaj/contracts";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import type { MarketingCopy } from "@/lib/marketing-content";

/* ------------------------------------------------------------------
   SiteHeader — the Master Template's fixed header, ported.
   - Template DOM order kept 1:1 (controls cluster, then the logo).
   - The template's three controls (menu / theme / language) stay
     visible at EVERY breakpoint — the mobile language-toggle gap
     is fixed by construction, not by a breakpoint exception.
   - Theme = the platform engine (next-themes, 3-state cycle) —
     the template's hand-rolled localStorage toggle is retired.
   - Language = the platform's [locale] routing (link swap).
   - Scroll > 20px turns the header into the template's glass panel
     (the template's JS scroll listener, as React state).
   - The bars button opens the anchor sheet (the template had a
     dead button; this is the sanctioned "develop and wire" step).
   ------------------------------------------------------------------ */

const ANCHORS = ["demo", "services", "adaptive", "trust"] as const;

export function SiteHeader({ locale, copy, appHref }: { locale: Locale; copy: MarketingCopy; appHref: string }) {
  const isArabic = locale === "ar";
  const otherLocale = isArabic ? "en" : "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  /* Template JS block 2: glass after 20px of scroll. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Sheet contract: Escape closes; a click outside the header closes. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (event.target instanceof Element && !event.target.closest(".ms-header")) setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [menuOpen]);

  const navLabels: Record<(typeof ANCHORS)[number], string> = {
    demo: copy.nav.demo,
    services: copy.nav.services,
    adaptive: copy.nav.adaptive,
    trust: copy.nav.trust,
  };

  return (
    <header className="ms-header fixed top-0 z-50 w-full transition-all duration-300" data-scrolled={scrolled ? "" : undefined}>
      <div className="ms-container flex h-16 items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        {/* Controls cluster (template order: menu · theme · language) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-controls="ms-menu-sheet"
            aria-label={menuOpen ? copy.menuClose : copy.menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300/50 bg-slate-200/50 text-slate-600 transition active:scale-[.98] hoverable:hover:bg-slate-300 dark:border-darkbg-border dark:bg-darkbg-card/80 dark:text-slate-300 dark:hoverable:hover:bg-slate-800"
          >
            {menuOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>

          <ThemeToggle
            locale={locale}
            className="ms-theme-toggle flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300/50 bg-slate-200/50 text-slate-600 transition active:scale-[.98] hoverable:hover:bg-slate-300 dark:border-darkbg-border dark:bg-darkbg-card/80 dark:text-slate-300 dark:hoverable:hover:bg-slate-800"
          />

          <Link
            href={`/${otherLocale}`}
            prefetch={false}
            aria-label={copy.languageLabel}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-2 text-xs font-medium text-slate-500 transition hoverable:hover:text-slate-800 dark:text-slate-400 dark:hoverable:hover:text-white"
          >
            {copy.languageLabel}
          </Link>
        </div>

        {/* Logo — [AGENT_REPLACE: LOGO_IMAGE] → the official brand mark
            + real-text wordmark (the platform's horizontal lockup form). */}
        <Link href={`/${locale}`} aria-label={isArabic ? "منسج الرئيسية" : "Minsaj home"} className="group flex items-center gap-2">
          <MinsajWordmark locale={locale} className="font-display text-xl font-bold text-slate-900 transition-colors hoverable:group-hover:text-brand dark:text-white" />
          <MinsajMark size={34} className="transition-transform hoverable:group-hover:scale-105" />
        </Link>
      </div>

      {/* Anchor sheet (the template's bars button, wired) */}
      <div
        id="ms-menu-sheet"
        className="ms-menu-sheet"
        data-open={menuOpen ? "" : undefined}
        aria-hidden={!menuOpen}
      >
        <nav className="ms-menu-sheet__panel" aria-label={isArabic ? "قائمة التنقل" : "Site navigation"}>
          {ANCHORS.map((id) => (
            <a key={id} href={`#${id}`} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>
              {navLabels[id]}
            </a>
          ))}
          <Link href={appHref} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} className="ms-menu-cta">
            {copy.open}
          </Link>
        </nav>
      </div>
    </header>
  );
}
