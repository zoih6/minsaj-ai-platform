"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Nasaq theme engine (next-themes — shadcn/ui standard).
 *
 * - attribute="data-theme"  → CSS token layers in foundations.css key off
 *   `:root[data-theme="dark"]`.
 * - defaultTheme="system"  → follows the device (prefers-color-scheme).
 * - enableSystem            → resolves system preference and re-resolves
 *   live when the OS switches (matchMedia change events).
 * - disableTransitionOnChange → prevents animated color cross-fade lag
 *   when flipping themes (recommended by next-themes to avoid muddy flashes).
 *
 * FOUC is prevented by next-themes' inline pre-hydration script; the root
 * layout already carries suppressHydrationWarning on <html>.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
