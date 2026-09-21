import {
  ChartNoAxesCombined,
  Code2,
  Compass,
  GraduationCap,
  MessageCircle,
  Palette,
  SearchCheck,
} from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import type { UniversalServiceId } from "@/lib/universal-content";

/* ------------------------------------------------------------------
   Marketing shared primitives — the Master Template's icon and
   accent language, mapped to the platform's own service icons
   (the same map the app surfaces use) and the template's per-card
   color identities (indigo/purple/cyan/pink/emerald/yellow).
   ------------------------------------------------------------------ */

export const serviceIcons = {
  ask: MessageCircle,
  learn: GraduationCap,
  research: SearchCheck,
  create: Palette,
  code: Code2,
  analyze: ChartNoAxesCombined,
  explore: Compass,
} satisfies Record<UniversalServiceId, typeof MessageCircle>;

/* Per-service card accents — the template's exact per-card hues.
   Light-mode text steps are lifted one shade where 600 fails AA
   (cyan-700 5.2:1 · emerald-700 4.7:1 on white); dark keeps the
   template's 400s (all ≥ 7:1 on #090D14). */
export const cardAccents: Record<
  Exclude<UniversalServiceId, "explore">,
  { box: string; kicker: string; border: string; arrow: string; dot: string }
> = {
  ask: {
    box: "bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    kicker: "text-indigo-600 dark:text-indigo-400",
    border: "hoverable:hover:border-indigo-500/50",
    arrow: "hoverable:group-hover:text-indigo-500",
    dot: "bg-indigo-500",
  },
  learn: {
    box: "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
    kicker: "text-purple-600 dark:text-purple-400",
    border: "hoverable:hover:border-purple-500/50",
    arrow: "hoverable:group-hover:text-purple-500",
    dot: "bg-purple-500",
  },
  research: {
    box: "bg-cyan-100 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
    kicker: "text-cyan-700 dark:text-cyan-400",
    border: "hoverable:hover:border-cyan-500/50",
    arrow: "hoverable:group-hover:text-cyan-500",
    dot: "bg-cyan-500",
  },
  create: {
    box: "bg-pink-100 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400",
    kicker: "text-pink-600 dark:text-pink-400",
    border: "hoverable:hover:border-pink-500/50",
    arrow: "hoverable:group-hover:text-pink-500",
    dot: "bg-pink-500",
  },
  code: {
    box: "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    kicker: "text-emerald-700 dark:text-emerald-400",
    border: "hoverable:hover:border-emerald-500/50",
    arrow: "hoverable:group-hover:text-emerald-500",
    dot: "bg-emerald-500",
  },
  analyze: {
    box: "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    kicker: "text-yellow-800 dark:text-yellow-400",
    border: "hoverable:hover:border-yellow-500/50",
    arrow: "hoverable:group-hover:text-yellow-700 dark:hoverable:group-hover:text-yellow-400",
    dot: "bg-yellow-500",
  },
};

/* Forward direction helpers (rtl-discipline §5): Arabic forward
   reads to the left, English to the right. `isForwardLeft` picks
   the glyph; `forwardDisplacement` mirrors the hover slide. */
export function isForwardLeft(locale: Locale) {
  return locale === "ar";
}
