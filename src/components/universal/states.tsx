"use client";

import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Info,
  MinusCircle,
  SearchX,
} from "lucide-react";
import type { Locale } from "@nasaq/contracts";

/** Lucide-compatible icon component (accepts size / className / aria-hidden). */
type IconComponent = ComponentType<{
  size?: number | string;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

/* ==========================================================================
   Nasaq UX State System — shared state components (PRD UX-003 / DoD #2-5).

   Contract (docs/02-UX-SPECIFICATION.md §4):
   - Loading  → skeletons matching final layout (never bare spinners)
   - Empty    → icon + explanation + actionable CTA (never a dead end)
   - Error    → 5 parts: what · why · user action · data-loss note · retry
   - Success  → explicit confirmation + destination
   - Partial  → partial badge + continuation CTA (never shown as complete)
   - Truth    → fixed vocabulary badges (TRUTH-001…009)
   ========================================================================== */

/* --------------------------------------------------------------------------
   1) Skeletons
   -------------------------------------------------------------------------- */

type SkeletonVariant =
  | "text"
  | "title"
  | "line"
  | "avatar"
  | "chip";

const skeletonWidths: Record<string, string> = {
  "w-70": "70%",
  "w-55": "55%",
  "w-40": "40%",
  "w-25": "25%",
};

export function Skeleton({
  variant = "line",
  width,
  className = "",
  style,
}: {
  variant?: SkeletonVariant;
  /** Tailwind-free width override, e.g. "140px" or "60%". */
  width?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const classes = ["u-skeleton", `u-skeleton--${variant}`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      aria-hidden="true"
      className={classes}
      style={{ ...(width || skeletonWidths[className] ? { inlineSize: width ?? skeletonWidths[className] } : {}), ...style }}
    />
  );
}

/** Card skeleton matching universal-library-item / ops card geometry. */
export function SkeletonCard() {
  return (
    <div className="u-skeleton-card" aria-hidden="true">
      <div className="u-skeleton-card__cover" />
      <Skeleton variant="chip" width="72px" />
      <Skeleton variant="title" />
      <Skeleton variant="line" className="w-70" />
      <Skeleton variant="line" className="w-40" />
    </div>
  );
}

/** Row skeleton matching nq-data-list rows. */
export function SkeletonRow({ withAvatar = true }: { withAvatar?: boolean }) {
  return (
    <div className="u-skeleton-row" aria-hidden="true">
      {withAvatar ? <Skeleton variant="avatar" /> : null}
      <div className="u-skeleton-row__lines">
        <Skeleton variant="text" width="46%" />
        <Skeleton variant="line" className="w-55" />
      </div>
      <Skeleton variant="chip" width="88px" />
    </div>
  );
}

/** Grid of card skeletons — drop-in for nq-grid surfaces. */
export function SkeletonGrid({ count = 6, kind = "cards" }: { count?: number; kind?: "cards" | "rows" }) {
  return (
    <div
      className={kind === "rows" ? "nq-stack" : "u-skeleton-grid"}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="u-sr-busy">Loading…</span>
      {Array.from({ length: count }, (_, index) =>
        kind === "rows" ? <SkeletonRow key={index} /> : <SkeletonCard key={index} />,
      )}
    </div>
  );
}

/** Page-level loading surface: header lines + body grid. */
export function SkeletonPage({ label }: { label: string }) {
  return (
    <div className="u-surface-loading" role="status" aria-busy="true" aria-live="polite">
      <span className="u-sr-busy">{label}</span>
      <div className="route-skeleton__header">
        <Skeleton variant="chip" width="110px" />
        <Skeleton variant="title" />
        <Skeleton variant="line" className="w-55" />
      </div>
      <SkeletonGrid count={6} />
    </div>
  );
}

/* --------------------------------------------------------------------------
   2) Empty states
   -------------------------------------------------------------------------- */

export function UniversalEmpty({
  icon: Icon,
  title,
  body,
  action,
  tone = "neutral",
}: {
  icon: IconComponent;
  title: string;
  body: string;
  action?: ReactNode;
  tone?: "neutral" | "search" | "error";
}) {
  return (
    <div className="u-empty" data-tone={tone} role="status" aria-live="polite">
      <span className="u-empty__icon" aria-hidden="true">
        <Icon size={24} />
      </span>
      <h2 className="u-empty__title">{title}</h2>
      <p className="u-empty__body">{body}</p>
      {action ? <div className="u-empty__action">{action}</div> : null}
    </div>
  );
}

/** Search-filtered-to-zero variant (library/projects/runs toolbars). */
export function SearchEmpty({
  locale,
  onReset,
}: {
  locale: Locale;
  onReset: () => void;
}) {
  const ar = locale === "ar";
  return (
    <UniversalEmpty
      icon={SearchX}
      tone="search"
      title={ar ? "لا توجد نتائج مطابقة" : "No matching results"}
      body={
        ar
          ? "جرّب كلمات مختلفة أو أعد ضبط عوامل التصفية لعرض كل العناصر."
          : "Try different keywords or reset the filters to see everything."
      }
      action={
        <button type="button" className="button button--outline button--compact" onClick={onReset}>
          {ar ? "إعادة ضبط البحث والتصفية" : "Reset search and filters"}
        </button>
      }
    />
  );
}

/* --------------------------------------------------------------------------
   3) Error state — the 5-part contract (PRD §14.2)
   -------------------------------------------------------------------------- */

export function UniversalErrorState({
  title,
  what,
  why,
  actionLabel,
  onAction,
  retryable = true,
  dataSafe = true,
  alternative,
  secondaryAction,
}: {
  title: string;
  what: string;
  why: string;
  actionLabel: string;
  onAction: () => void;
  retryable?: boolean;
  dataSafe?: boolean;
  alternative?: ReactNode;
  secondaryAction?: ReactNode;
}) {
  return (
    <div className="u-error-state" role="alert" aria-live="assertive">
      <div className="u-error-state__head">
        <span className="u-error-state__icon" aria-hidden="true">
          <AlertTriangle size={20} />
        </span>
        <h2 className="u-error-state__title">{title}</h2>
      </div>
      <ul className="u-error-state__parts">
        <li><Info size={14} />{what}</li>
        <li><Info size={14} />{why}</li>
        <li>
          <CheckCircle2 size={14} aria-hidden="true" style={{ color: "var(--u-mint)" }} />
          {dataSafe
            ? "لم يفقد عملك المحفوظ شيئًا · Your saved work is safe"
            : "قد تحتاج لمراجعة آخر نسخة محفوظة · You may need the last saved version"}
        </li>
      </ul>
      <div className="u-error-state__actions">
        <button type="button" className="button button--primary button--compact" onClick={onAction}>
          {actionLabel}
        </button>
        {secondaryAction}
      </div>
      {alternative ? <div style={{ fontSize: "var(--u-text-xs)", color: "var(--u-faint)" }}>{alternative}</div> : null}
      {!retryable ? <span style={{ display: "none" }} /> : null}
    </div>
  );
}

/* --------------------------------------------------------------------------
   4) Truth badges — fixed vocabulary (TRUTH-001…009)
   -------------------------------------------------------------------------- */

export type TruthKind = "demo" | "simulated" | "notExecuted" | "partial";

const truthCopy: Record<TruthKind, { ar: string; en: string }> = {
  demo: { ar: "عرض تجريبي", en: "Demo" },
  simulated: { ar: "محاكاة", en: "Simulated" },
  notExecuted: { ar: "لم يُنفَّذ", en: "Not executed" },
  partial: { ar: "مخرج جزئي", en: "Partial output" },
};

const truthIcons: Record<TruthKind, IconComponent> = {
  demo: FlaskConical,
  simulated: FlaskConical,
  notExecuted: MinusCircle,
  partial: AlertTriangle,
};

export function TruthBadge({
  kind,
  locale,
  withIcon = true,
}: {
  kind: TruthKind;
  locale: Locale;
  withIcon?: boolean;
}) {
  const Icon = truthIcons[kind];
  return (
    <span className="u-truth-badge" data-kind={kind}>
      {withIcon ? <Icon size={12} aria-hidden="true" /> : null}
      {truthCopy[kind][locale]}
    </span>
  );
}

/* --------------------------------------------------------------------------
   5) Surface scenario override — QA/demo flags (?state=loading|empty|error)
   Parsed server-side (see @/lib/surface-states) and passed as props.
   -------------------------------------------------------------------------- */

export type { SurfaceStateOverride } from "@/lib/surface-states";

/** Retry from a scenario/error surface — full reload of the clean route. */
export function retrySurface() {
  if (typeof window !== "undefined") {
    window.location.assign(window.location.pathname);
  }
}
