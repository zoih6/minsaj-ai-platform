"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Info, LoaderCircle, X } from "lucide-react";

export type ActivityFeedbackState = "working" | "success" | "error" | "info";

type ActivityFeedbackProps = {
  state: ActivityFeedbackState;
  label: string;
  title: string;
  description?: string;
  progressLabel?: string;
  action?: ReactNode;
  className?: string;
  id?: string;
};

const feedbackIcons = {
  working: LoaderCircle,
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

export function ActivityFeedback({
  state,
  label,
  title,
  description,
  progressLabel,
  action,
  className = "",
  id,
}: ActivityFeedbackProps) {
  const Icon = feedbackIcons[state];
  const role = state === "error" ? "alert" : "status";

  return (
    <div
      id={id}
      className={`u-feedback${className ? ` ${className}` : ""}`}
      data-feedback-state={state}
      role={role}
      aria-live={state === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      aria-busy={state === "working"}
    >
      <span className="u-feedback__icon" aria-hidden="true"><Icon size={18} /></span>
      <div className="u-feedback__body">
        <small>{label}</small>
        <strong>{title}</strong>
        {description ? <p>{description}</p> : null}
        {state === "working" ? (
          <span className="u-feedback__progress" role="progressbar" aria-label={progressLabel ?? title}>
            <i />
          </span>
        ) : null}
      </div>
      {action ? <div className="u-feedback__action">{action}</div> : null}
    </div>
  );
}

type FeedbackToastProps = {
  message: string;
  closeLabel: string;
  onDismiss: () => void;
  tone?: "success" | "info";
};

export function FeedbackToast({ message, closeLabel, onDismiss, tone = "success" }: FeedbackToastProps) {
  const Icon = tone === "success" ? Check : Info;

  /* Portal to body: keeps viewport-fixed positioning working inside
     container-query containers (containment would otherwise trap it). */
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="u-feedback-toast" data-tone={tone} role="status" aria-live="polite" aria-atomic="true">
      <span aria-hidden="true"><Icon size={18} /></span>
      <p>{message}</p>
      <button type="button" onClick={onDismiss} aria-label={closeLabel}><X size={18} /></button>
    </div>,
    document.body,
  );
}
