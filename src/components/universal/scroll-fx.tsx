"use client";

import { useEffect } from "react";

/**
 * ScrollFx — global scroll-reveal orchestrator.
 *
 * Non-invasive: observes top-level section blocks inside the page and tags
 * them with `is-revealed` when they enter the viewport. The CSS layer
 * (motion.css) owns every visual property; this component only flips state.
 * Honors prefers-reduced-motion by revealing everything immediately.
 *
 * Timing contract (hydration safety):
 *   With streaming SSR + progressive hydration (React 19), this layout-level
 *   effect can fire BEFORE inner route boundaries hydrate. Mutating those
 *   DOM nodes early would trigger hydration mismatch warnings. We therefore
 *   defer all tagging by two animation frames — every already-streamed
 *   boundary finishes hydrating in the tasks queued before the second rAF
 *   paints. No server-rendered attribute is ever out of sync with the vdom.
 */
export function ScrollFx() {
  useEffect(() => {
    const root = document.body;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frameA = 0;
    let frameB = 0;
    let observer: IntersectionObserver | null = null;
    let tagged: HTMLElement[] = [];
    let onLoad: (() => void) | null = null;

    const run = () => {
      const targets = Array.from(
        root.querySelectorAll<HTMLElement>(
          [
            ".universal-site main > section",
            ".adaptive-section",
            ".universal-section",
            ".adaptive-service-grid",
            ".adaptive-recent-grid",
            ".service-space",
            ".universal-library-page",
            ".u2-workbench",
            ".page-header",
            ".library-toolbar-row",
            ".ops-stats",
          ].join(","),
        ),
      ).filter((el) => !el.closest("[data-static]"));

      if (!targets.length) return;

      if (reduced) {
        targets.forEach((el) => el.classList.add("is-revealed"));
        return;
      }

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              observer?.unobserve(entry.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
      );

      tagged = targets;
      targets.forEach((el) => {
        el.classList.add("will-reveal");
        observer?.observe(el);
      });
    };

    // Hydration-safe deferral (see timing contract above): the window `load`
    // event guarantees every streamed RSC boundary has delivered its content,
    // and two animation frames let React flush the boundary hydration tasks
    // queued before paint — so we never mutate DOM that React will hydrate.
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
      // Remove the classes we added so remounts (Fast Refresh, StrictMode)
      // start from a clean, hydration-consistent DOM.
      tagged.forEach((el) => {
        el.classList.remove("will-reveal");
        el.classList.remove("is-revealed");
      });
    };
  }, []);

  return null;
}
