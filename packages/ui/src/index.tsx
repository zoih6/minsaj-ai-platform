import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export * as MinsajIcons from "./icons";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva("button", {
  variants: {
    variant: {
      primary: "button--primary",
      secondary: "button--secondary",
      quiet: "button--quiet",
      outline: "button--outline",
      danger: "button--danger",
    },
    size: {
      compact: "button--compact",
      default: "button--default",
      prominent: "button--prominent",
    },
  },
  defaultVariants: { variant: "primary", size: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "danger" | "brand";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return <span className={cn("badge", `badge--${tone}`, className)} {...props} />;
}

/* ------------------------------------------------------------------
   MinsajMark — the OFFICIAL master brand symbol (owner's Drive asset,
   identity freeze v2, 2026-09-18). Rendered from the owner's own
   artwork (background-keyed, never redrawn). Two theme variants are
   addressed via CSS (.minsaj-mark in foundations.css):
   - light surfaces  -> minsaj-symbol-color.webp  (navy→violet, as designed)
   - dark surfaces   -> minsaj-symbol-dark.webp   (luminance-lifted)
   - data-on-dark="" forces the dark variant on always-dark chrome
     (e.g. the obsidian app sidebar, regardless of theme).
   Brand ladder ONLY: 28 / 34 / 46 (enforced by scripts/check-icon-scale.mjs).
   `size` is the rendered WIDTH; the height always derives from the master's
   intrinsic h/w ratio so the artwork can never be stretched or squashed
   (background-size: 100% 100% fills the box exactly 1:1).
   ------------------------------------------------------------------ */
const MINSAJ_SYMBOL_H_PER_W = 396 / 534; /* intrinsic h/w of the 534×396 master */

export function MinsajMark({
  size = 34,
  title,
  onDark = false,
  className,
}: {
  size?: 28 | 34 | 46;
  title?: string;
  onDark?: boolean;
  className?: string;
}) {
  const w = size;
  const h = Math.round(size * MINSAJ_SYMBOL_H_PER_W * 100) / 100;
  return (
    <span
      className={cn("minsaj-mark", className)}
      data-on-dark={onDark ? "" : undefined}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ width: `${w}px`, height: `${h}px` }}
    />
  );
}

/* ------------------------------------------------------------------
   MinsajWordmark — the wordmark as REAL TEXT (never baked into
   images for UI chrome). Arabic leads, Latin follows in lockstep.
   ------------------------------------------------------------------ */
export function MinsajWordmark({
  locale = "ar",
  className,
}: {
  locale?: "ar" | "en";
  className?: string;
}) {
  return (
    <span className={cn("minsaj-wordmark", className)} dir={locale === "ar" ? "rtl" : "ltr"}>
      {locale === "ar" ? "منسج" : "Minsaj"}
    </span>
  );
}

/* ------------------------------------------------------------------
   MinsajLogo — the FULL official lockup (symbol + Minsaj + منسج)
   straight from the owner's master file. Use for brand moments
   (marketing footer, about surfaces) — never inside dense app chrome,
   where MinsajMark + real text is the horizontal form.
   Theme-aware via CSS (.minsaj-logo in foundations.css);
   data-on-dark forces the lifted art on always-dark surfaces.
   ------------------------------------------------------------------ */
export function MinsajLogo({
  height = 120,
  onDark = false,
  title,
  className,
}: {
  height?: number;
  onDark?: boolean;
  title?: string;
  className?: string;
}) {
  const w = Math.round(height * (1536 / 1024));
  return (
    <span
      className={cn("minsaj-logo", className)}
      data-on-dark={onDark ? "" : undefined}
      role="img"
      aria-label={title ?? "Minsaj — منسج"}
      style={{ width: `${w}px`, height: `${height}px` }}
    />
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow ? <p className="section-heading__eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="section-heading__action">{action}</div> : null}
    </div>
  );
}
