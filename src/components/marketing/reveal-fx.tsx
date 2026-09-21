"use client";

import { useEffect } from "react";

/* ------------------------------------------------------------------
   RevealFx — the Master Template's reveal-on-scroll script, ported
   to the framework (replaces the template's DOMContentLoaded
   IntersectionObserver block).

   Contract (same discipline as ScrollFx):
   - CSS (marketing.css) owns every visual property; this component
     only flips the .is-visible state — progressive enhancement.
   - Hydration safety: defer tagging until window load + 2 rAF so
     streamed RSC boundaries finish hydrating before we mutate the
     DOM (no server/client attribute mismatch).
   - prefers-reduced-motion: reveal everything immediately (CSS
     then pins opacity 1 / transform none).
   - One-shot: unobserve after reveal; full cleanup on unmount.
   ------------------------------------------------------------------ */
export function RevealFx() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ms-site");
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frameA = 0;
    let frameB = 0;
    let observer: IntersectionObserver | null = null;
    let tagged: HTMLElement[] = [];
    let onLoad: (() => void) | null = null;

    const run = () => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>(".reveal-on-scroll"));
      if (!targets.length) return;

      if (reduced) {
        targets.forEach((el) => el.classList.add("is-visible"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer?.unobserve(entry.target);
            }
          }
        },
        /* P-1 (W-3.5): reveal BEFORE the element fully enters the viewport
           (+15% bottom margin, any-pixel threshold) — the template's -8%
           margin made content pop in visibly late ("content chasing the
           scroll"), which reads as a laggy, broken page. */
        { threshold: 0, rootMargin: "0px 0px 15% 0px" },
      );

      tagged = targets;
      targets.forEach((el) => observer?.observe(el));
    };

    if (document.readyState === "complete") {
      frameA = window.requestAnimationFrame(() => {
        frameB = window.requestAnimationFrame(run);
      });
    } else {
      onLoad = () => {
        frameA = window.requestAnimationFrame(() => {
          frameB = window.requestAnimationFrame(run);
        });
      };
      window.addEventListener("load", onLoad, { once: true });
    }

    return () => {
      window.cancelAnimationFrame(frameA);
      window.cancelAnimationFrame(frameB);
      if (onLoad) window.removeEventListener("load", onLoad);
      observer?.disconnect();
      tagged.forEach((el) => el.classList.remove("is-visible"));
    };
  }, []);

  return null;
}
