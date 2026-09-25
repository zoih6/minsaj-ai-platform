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
 * W-7 (W7-2 · owner decision D-6, §7.9): composition is chosen by WIDTH
 * alone. The Phase 6 coarse-pointer guard (R-RES-1b) is retired — a phone
 * requesting the desktop site must receive the desktop composition, exactly
 * as standard websites behave. The never-scale zoom (R-RES-1a) is retired
 * with it; the 44px touch floor continues to apply at true phone widths
 * (≤767.98px, enforced in CSS).
 */
export function useViewportMode(): ViewportMode | null {
  const [mode, setMode] = useState<ViewportMode | null>(null);

  useEffect(() => {
    const tablet = window.matchMedia(MEDIA.tabletUp);
    const desktop = window.matchMedia(MEDIA.desktopUp);
    const wide = window.matchMedia(MEDIA.wideUp);

    function read() {
      setMode(viewportModeFor(window.innerWidth));
    }

    read();
    tablet.addEventListener("change", read);
    desktop.addEventListener("change", read);
    wide.addEventListener("change", read);
    window.addEventListener("resize", read);
    return () => {
      tablet.removeEventListener("change", read);
      desktop.removeEventListener("change", read);
      wide.removeEventListener("change", read);
      window.removeEventListener("resize", read);
    };
  }, []);

  return mode;
}
