"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

/**
 * App-scope error boundary — the 5-part error contract (PRD §14.2):
 * what happened · why · user action · data-loss note · retry availability.
 * Server errors must never surface as a raw stack trace or a dead page.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface to console for diagnostics while keeping the UI human-language.
    console.error("[nasaq] route error boundary:", error);
  }, [error]);

  const isArabic = true; // locale segment guarantees ar|en; default copy stays bilingual below

  return (
    <div className="route-error">
      <div className="u-error-state" role="alert" aria-live="assertive">
        <div className="u-error-state__head">
          <span className="u-error-state__icon" aria-hidden="true">
            <AlertTriangle size={20} />
          </span>
          <h2 className="u-error-state__title">
            {isArabic ? "لم نتمكن من تحميل هذا الجزء" : "We couldn't load this part"}
          </h2>
        </div>
        <ul className="u-error-state__parts">
          <li>
            <AlertTriangle size={14} aria-hidden="true" />
            {isArabic
              ? "حدث خطأ غير متوقع أثناء تجهيز هذه الصفحة."
              : "An unexpected error occurred while preparing this page."}
          </li>
          <li>
            <AlertTriangle size={14} aria-hidden="true" />
            {isArabic
              ? "قد يكون السبب مؤقتًا في الاتصال أو في تهيئة مساحة العمل."
              : "The cause may be a temporary connection or workspace setup issue."}
          </li>
          <li
            style={{
              display: "flex",
              gap: 10,
              fontSize: "var(--u-text-sm)",
              color: "var(--u-muted)",
            }}
          >
            <RotateCcw size={14} aria-hidden="true" />
            {isArabic
              ? "لم يفقد عملك المحفوظ شيئًا — جميع المخرجات المحفوظة باقية في مكتبتك."
              : "Your saved work is safe — all saved outputs remain in your library."}
          </li>
        </ul>
        <div className="u-error-state__actions">
          <button type="button" className="button button--primary button--compact" onClick={reset}>
            <RotateCcw size={15} />
            {isArabic ? "إعادة المحاولة" : "Try again"}
          </button>
          <Link className="button button--outline button--compact" href="/ar/app/home">
            {isArabic ? "العودة إلى البداية" : "Back to home"}
          </Link>
        </div>
        {error.digest ? (
          <div
            style={{
              fontSize: "var(--u-text-xs)",
              color: "var(--u-faint)",
              direction: "ltr",
              textAlign: "left",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            ref: {error.digest}
          </div>
        ) : null}
      </div>
    </div>
  );
}
