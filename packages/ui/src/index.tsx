import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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

export function NasaqMark({ size = 34, title }: { size?: number; title?: string }) {
  /* Official brand symbol (identity package v25): folded-ribbon mark on a
     rounded app-icon tile. Tile = currentColor (context tints it); ribbon
     reads in white + soft white by default; CSS may override via the
     --mark-line-one / --mark-line-two hooks (kept from the previous mark). */
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="9" fill="currentColor" />
      <g transform="translate(1.4,-0.1) scale(0.0375)">
        <path d="M 737 384 L 647 368 L 420 467 L 577 559 L 710 492 L 780 496 L 434 724 L 420 756 L 420 896 L 727 721 L 768 680 L 780 460 Z" fill="var(--mark-line-one, #ffffff)" />
        <path d="M 556 176 L 278 340 L 243 375 L 212 652 L 244 705 L 322 709 L 483 619 L 422 606 L 327 556 L 220 544 L 539 335 L 556 299 Z" fill="var(--mark-line-two, rgba(255,255,255,0.55))" />
      </g>
    </svg>
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
