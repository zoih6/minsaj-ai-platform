import { Search, SlidersHorizontal } from "lucide-react";
import { createPortal } from "react-dom";
import { Badge } from "@nasaq/ui";
import type { Locale, RunStatus } from "@nasaq/contracts";

export function formatMoney(amountMinor: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-SA" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);
}

export function CostValue({ value, locale }: { value: number; locale: Locale }) {
  return <>{formatMoney(Math.round(value * 100), "USD", locale)}</>;
}

export function RunStatusBadge({ status, locale }: { status: RunStatus; locale: Locale }) {
  const labels: Record<RunStatus, { ar: string; en: string; tone: "neutral" | "info" | "success" | "warning" | "danger" | "brand" }> = {
    queued: { ar: "في الطابور", en: "Queued", tone: "neutral" },
    planning: { ar: "يخطط", en: "Planning", tone: "info" },
    running: { ar: "قيد التنفيذ", en: "Running", tone: "brand" },
    waiting_for_input: { ar: "ينتظر إدخالًا", en: "Needs input", tone: "warning" },
    waiting_for_approval: { ar: "ينتظر موافقة", en: "Needs approval", tone: "warning" },
    completed: { ar: "مكتمل", en: "Completed", tone: "success" },
    completed_with_warnings: { ar: "اكتمل بتحذير", en: "Completed with warning", tone: "warning" },
    failed_retryable: { ar: "فشل قابل للإعادة", en: "Retryable failure", tone: "danger" },
    cancelled: { ar: "ملغي", en: "Cancelled", tone: "neutral" },
  };
  const value = labels[status];
  return <Badge tone={value.tone}>{value[locale]}</Badge>;
}

export function OperationsStats({ items }: { items: Array<{ label: string; value: string; detail: string; tone?: "default" | "attention" }> }) {
  return (
    <dl className="ops-stats">
      {items.map((item) => <div key={item.label} className={item.tone === "attention" ? "is-attention" : ""}><dt>{item.label}</dt><dd>{item.value}</dd><dd className="ops-stat-detail">{item.detail}</dd></div>)}
    </dl>
  );
}

export function LibraryToolbar({ locale, query, onQueryChange, filters, activeFilter, onFilterChange, resultCount }: {
  locale: Locale;
  query: string;
  onQueryChange: (value: string) => void;
  filters: Array<{ id: string; label: string }>;
  activeFilter: string;
  onFilterChange: (value: string) => void;
  resultCount: number;
}) {
  const searchLabel = locale === "ar" ? "ابحث في هذه المكتبة" : "Search this library";
  return (
    <div className="library-toolbar">
      <label className="library-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{searchLabel}</span><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder={searchLabel} /></label>
      <div className="nq-control-bar library-toolbar__bar">
        <div className="nq-control-bar__group library-filters" role="group" aria-label={locale === "ar" ? "تصفية النتائج" : "Filter results"}>
          <SlidersHorizontal size={14} aria-hidden="true" />
          {filters.map((filter) => <button key={filter.id} type="button" aria-pressed={activeFilter === filter.id} className={`nq-chip library-filters__chip${activeFilter === filter.id ? " is-active" : ""}`} onClick={() => onFilterChange(filter.id)}>{filter.label}</button>)}
        </div>
        <span className="nq-control-bar__tail library-count" role="status" aria-live="polite">{locale === "ar" ? `${resultCount} نتيجة` : `${resultCount} results`}</span>
      </div>
    </div>
  );
}

export function LibraryEmpty({ locale, onReset }: { locale: Locale; onReset: () => void }) {
  return (
    <div className="library-empty">
      <Search size={20} aria-hidden="true" />
      <strong>{locale === "ar" ? "لا توجد نتائج مطابقة" : "No matching results"}</strong>
      <p>{locale === "ar" ? "غيّر كلمات البحث أو أعد ضبط الفلتر." : "Try another search term or reset the filter."}</p>
      <button className="button button--outline button--compact" type="button" onClick={onReset}>{locale === "ar" ? "إعادة الضبط" : "Reset"}</button>
    </div>
  );
}

export function DemoToast({ message }: { message: string }) {
  /* Portal to body: keeps viewport-fixed positioning working inside
     container-query containers (containment would otherwise trap it). */
  if (typeof document === "undefined") return null;
  return createPortal(<div className="demo-toast" role="status"><span aria-hidden="true" />{message}</div>, document.body);
}
