"use client";

import { useEffect, useState } from "react";
import { MEDIA, viewportModeFor, type ViewportMode } from "@/lib/viewports";

/**
 * SSR-safe viewport mode hook.
 * Returns `null` before hydration so the first client render matches the
 * server render (no layout flash / hydration mismatch); after mount it
 * tracks the three semantic bands via matchMedia, staying in sync with the
 * CSS breakpoints in layout.css.
 *
 * W-DS Phase 6 · R-RES-1b pointer guard (RESPONSIVE-ARCHITECTURE §1,
 * matrix RES-01): the composition choice is (width, pointer) — a coarse
 * pointer serves the TOUCH composition regardless of width. A phone
 * requesting the desktop site (~980 CSS px) receives the touch shell on
 * the wide canvas (drawer + dock, rail hidden), never a shrunken desktop
 * UI; the coarse-wide token zoom (responsive.css) keeps every size
 * physically readable (never-scale rule R-RES-1a). Fine pointers keep the
 * width bands unchanged.
 */
export function useViewportMode(): ViewportMode | null {
  const [mode, setMode] = useState<ViewportMode | null>(null);

  useEffect(() => {
    const tablet = window.matchMedia(MEDIA.tabletUp);
    const desktop = window.matchMedia(MEDIA.desktopUp);
    const wide = window.matchMedia(MEDIA.wideUp);
    const coarse = window.matchMedia(MEDIA.coarsePointer);

    function read() {
      setMode(coarse.matches ? "mobile" : viewportModeFor(window.innerWidth));
    }

    read();
    tablet.addEventListener("change", read);
    desktop.addEventListener("change", read);
    wide.addEventListener("change", read);
    coarse.addEventListener("change", read);
    return () => {
      tablet.removeEventListener("change", read);
      desktop.removeEventListener("change", read);
      wide.removeEventListener("change", read);
      coarse.removeEventListener("change", read);
    };
  }, []);

  return mode;
}
