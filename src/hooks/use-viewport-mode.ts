"use client";

import { useEffect, useState } from "react";
import { MEDIA, viewportModeFor, type ViewportMode } from "@/lib/viewports";

/**
 * SSR-safe viewport mode hook.
 * Returns `null` before hydration so the first client render matches the
 * server render (no layout flash / hydration mismatch); after mount it
 * tracks the three semantic bands via matchMedia, staying in sync with
 * the CSS breakpoints in layout.css.
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
    return () => {
      tablet.removeEventListener("change", read);
      desktop.removeEventListener("change", read);
      wide.removeEventListener("change", read);
    };
  }, []);

  return mode;
}
