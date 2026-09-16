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
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect width="40" height="40" rx="9" fill="currentColor" />
      <path d="M8.5 25.5c5.6 0 6.2-8.5 11.3-8.5 5.3 0 5.5-7 11.7-7" fill="none" stroke="var(--mark-line-one, #A7DBC8)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M8.5 14.5c5.7 0 6.1 8.4 11.5 8.4 5.1 0 5.6 7.1 11.5 7.1" fill="none" stroke="var(--mark-line-two, #D58B43)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="20" cy="20" r="3.4" fill="#FFFDF8" stroke="currentColor" strokeWidth="1.6" />
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
