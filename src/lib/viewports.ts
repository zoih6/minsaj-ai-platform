/**
 * Minsaj Responsive Layout Architecture — single source of truth.
 *
 * These values MUST stay in sync with the CSS side:
 *   src/app/styles/universal/layout.css  (@media boundaries + :root tokens)
 *
 * Semantic viewport bands:
 *   mobile  :            < 768px  → off-canvas drawer + bottom tab bar
 *   tablet  : 768px …   < 1024px  → labeled expanded sidebar (push)
 *   desktop : 1024px …  < 1440px  → full sidebar
 *   wide    : 1440px+             → full sidebar, wider content max
 *
 * W-7 (W7-2 · owner decision D-6, §7.9): composition is chosen by WIDTH
 * alone — a phone requesting the desktop site receives the desktop
 * composition, exactly as standard websites behave. The Phase 6
 * coarse-pointer guard (R-RES-1b) and the never-scale zoom (R-RES-1a)
 * are retired; the 44px touch floor continues to apply at true phone
 * widths (≤767.98px, enforced in CSS).
 */

export const BREAKPOINTS = {
  /** below this = mobile layout (drawer navigation) */
  tablet: 768,
  /** below this = tablet layout (icon rail) */
  desktop: 1024,
  /** below this = standard desktop, above = wide desktop */
  wide: 1440,
} as const;

export type ViewportMode = "mobile" | "tablet" | "desktop" | "wide";

export function viewportModeFor(width: number): ViewportMode {
  if (width < BREAKPOINTS.tablet) return "mobile";
  if (width < BREAKPOINTS.desktop) return "tablet";
  if (width < BREAKPOINTS.wide) return "desktop";
  return "wide";
}

/** Sidebar rendering strategy derived from the viewport mode. */
export type SidebarMode = "drawer" | "rail" | "expanded";

export function sidebarModeFor(mode: ViewportMode): SidebarMode {
  switch (mode) {
    case "mobile":
      return "drawer";
    case "tablet":
      return "rail";
    default:
      return "expanded";
  }
}

export const MEDIA = {
  tabletUp: `(min-width: ${BREAKPOINTS.tablet}px)`,
  desktopUp: `(min-width: ${BREAKPOINTS.desktop}px)`,
  wideUp: `(min-width: ${BREAKPOINTS.wide}px)`,
  /** R-RES-1b: coarse pointer → touch composition regardless of width */
  coarsePointer: "(pointer: coarse)",
} as const;
