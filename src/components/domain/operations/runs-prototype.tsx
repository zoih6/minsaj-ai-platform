"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Play, ShieldAlert } from "lucide-react";
import { localize, type Locale, type RunSummary } from "@minsaj/contracts";
import { CostValue, LibraryToolbar, OperationsStats, RunStatusBadge } from "./shared";
import { retrySurface, SearchEmpty, SkeletonGrid, UniversalEmpty, type SurfaceStateOverride } from "@/components/universal/states";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function RunsPrototype({ locale, runs, scenario = null }: { locale: Locale; runs: RunSummary[]; scenario?: SurfaceStateOverride }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;

  const normalized = query.trim().toLocaleLowerCase(locale);
  const visibleRuns = runs.filter((run) => {
    const matchesQuery = !normalized || `${localize(run.title, locale)} ${run.kind} ${run.id}`.toLocaleLowerCase(locale).includes(normalized);
    return matchesQuery && (filter === "all" || run.status === filter);
  });
  const spend = runs.reduce((sum, run) => sum + run.cost.amountMinor / 100, 0);

  return (
    <div className="ops-page runs-prototype">
      <ScrollFx />
      <header className="page-header ops-page-header">
        <div className="page-header__copy"><p className="page-eyebrow">{ar ? "المراقبة والتدقيق" : "Observe and audit"}</p><h1 className="page-title">{ar ? "التشغيلات" : "Runs"}</h1><p className="page-description">{ar ? "تابع الخطة والخطوات والتكلفة وبوابات الموافقة من سجل واحد غير مبهم." : "Follow plans, steps, cost, and approval gates from one unambiguous record."}</p></div>
        <Link className="button button--outline button--default" href={`/${locale}/app/flows`}><Play size={14} />{ar ? "تشغيل تدفق" : "Run a flow"}</Link>
      </header>

      <OperationsStats items={[
        { label: ar ? "قيد الموافقة" : "Awaiting approval", value: String(runs.filter((run) => run.status === "waiting_for_approval").length), detail: ar ? "متوقفة بأمان" : "Stopped safely", tone: "attention" },
        { label: ar ? "مكتملة" : "Completed", value: String(runs.filter((run) => run.status === "completed" || run.status === "completed_with_warnings").length), detail: ar ? "في هذه العينة" : "In this sample" },
        { label: ar ? "إجمالي التكلفة" : "Total cost", value: `$${spend.toFixed(2)}`, detail: ar ? "تكلفة فعلية تجريبية" : "Demo actual spend" },
        { label: ar ? "قيد العمل" : "In progress", value: String(runs.filter((run) => ["planning", "running"].includes(run.status)).length), detail: ar ? "تحديث مباشر" : "Live update" },
      ]} />

      <LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visibleRuns.length} filters={[
        { id: "all", label: ar ? "الكل" : "All" },
        { id: "waiting_for_approval", label: ar ? "ينتظر موافقة" : "Awaiting approval" },
        { id: "running", label: ar ? "يعمل" : "Running" },
        { id: "completed", label: ar ? "مكتمل" : "Completed" },
        { id: "completed_with_warnings", label: ar ? "بتحذير" : "With warning" },
      ]} />

      {scenario === "loading" ? (
        <SkeletonGrid count={5} kind="rows" />
      ) : scenario === "empty" ? (
        <UniversalEmpty
          icon={Play}
          title={ar ? "لا توجد تشغيلات بعد" : "No runs yet"}
          body={ar ? "عندما تبدأ وكيلًا أو تدفقًا سيظهر هنا سجل خطواته وحالته وتكلفته لحظة بلحظة." : "When you start an agent or a flow, its step-by-step record, status, and cost will appear here in real time."}
          action={<Link className="button button--primary button--compact" href={`/${locale}/app/flows`}><Play size={14} />{ar ? "شغّل تدفقًا الآن" : "Run a flow now"}</Link>}
        />
      ) : scenario === "error" ? (
        <UniversalEmpty
          icon={ShieldAlert}
          tone="error"
          title={ar ? "تعذّر تحميل سجل التشغيلات" : "Couldn't load the run history"}
          body={ar ? "حدث خطأ مؤقت أثناء قراءة السجل. الحفاظ على حالتك الحالية مضمون، ويمكنك إعادة المحاولة." : "A temporary error occurred while reading the history. Your current state is preserved — you can retry."}
          action={<button type="button" className="button button--primary button--compact" onClick={retrySurface}>{ar ? "إعادة المحاولة" : "Try again"}</button>}
        />
      ) : visibleRuns.length ? <div className="mj-data-list runs-data-list ops-data-list" role="table" aria-label={ar ? "سجل التشغيلات" : "Run history"}><div className="mj-data-list__head" role="row"><span>{ar ? "التشغيل" : "Run"}</span><span>{ar ? "الحالة" : "Status"}</span><span>{ar ? "النوع" : "Kind"}</span><span>{ar ? "آخر تحديث" : "Updated"}</span><span>{ar ? "التكلفة" : "Cost"}</span><span /></div>{visibleRuns.map((run) => (
        <Link className="mj-data-list__row" role="row" key={run.id} href={`/${locale}/app/runs/${run.id}`}>
          <span className="ops-cell-id" data-label={ar ? "التشغيل" : "Run"}><i>{run.status === "waiting_for_approval" ? <ShieldAlert size={16} /> : <Play size={16} />}</i><span><strong>{localize(run.title, locale)}</strong><small className="mono">{run.id}</small></span></span>
          <span data-label={ar ? "الحالة" : "Status"}><RunStatusBadge locale={locale} status={run.status} /></span>
          <span data-label={ar ? "النوع" : "Kind"}>{run.kind === "flow" ? (ar ? "تدفق" : "Flow") : (ar ? "وكيل" : "Agent")}</span>
          <span data-label={ar ? "آخر تحديث" : "Updated"}>{ar ? "منذ دقائق" : "Minutes ago"}</span>
          <span className="mono" data-label={ar ? "التكلفة" : "Cost"}><CostValue value={run.cost.amountMinor / 100} locale={locale} /></span>
          <span aria-hidden="true"><DirectionArrow size={16} /></span>
        </Link>
      ))}</div> : normalized || filter !== "all" ? (
        <SearchEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />
      ) : (
        <UniversalEmpty
          icon={Play}
          title={ar ? "لا توجد تشغيلات بعد" : "No runs yet"}
          body={ar ? "عندما تبدأ وكيلًا أو تدفقًا سيظهر هنا سجل خطواته وحالته وتكلفته لحظة بلحظة." : "When you start an agent or a flow, its step-by-step record, status, and cost will appear here in real time."}
          action={<Link className="button button--primary button--compact" href={`/${locale}/app/flows`}><Play size={14} />{ar ? "شغّل تدفقًا الآن" : "Run a flow now"}</Link>}
        />
      )}
    </div>
  );
}
