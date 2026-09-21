/**
 * Minsaj Responsive Layout Architecture — single source of truth.
 *
 * These values MUST stay in sync with the CSS side:
 *   src/app/styles/universal/layout.css  (@media boundaries + :root tokens)
 *
 * Semantic viewport bands:
 *   mobile  :            < 768px  → off-canvas drawer + bottom tab bar
 *   tablet  : 768px …   < 1024px → icon rail (auto), expandable overlay
 *   desktop : 1024px …  < 1440px → full sidebar
 *   wide    : 1440px+            → full sidebar, wider content max
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
} as const;
