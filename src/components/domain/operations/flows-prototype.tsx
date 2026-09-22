"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Play, Plus, Workflow } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type FlowSummary, type Locale } from "@minsaj/contracts";
import { DemoToast, LibraryEmpty, LibraryToolbar, OperationsStats } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function FlowsPrototype({ locale, flows }: { locale: Locale; flows: FlowSummary[] }) {
  const ar = locale === "ar";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const normalized = query.trim().toLocaleLowerCase(locale);
  const visibleFlows = flows.filter((flow) => {
    const matchesQuery = !normalized || `${localize(flow.name, locale)} ${localize(flow.description, locale)}`.toLocaleLowerCase(locale).includes(normalized);
    return matchesQuery && (filter === "all" || flow.status === filter);
  });

  return (
    <div className="ops-page flows-prototype">
      <ScrollFx />
      <header className="page-header ops-page-header">
        <div className="page-header__copy"><p className="page-eyebrow">{ar ? "منطق قابل للتدقيق" : "Auditable logic"}</p><h1 className="page-title">{ar ? "التدفقات" : "Flows"}</h1><p className="page-description">{ar ? "اربط المحفّز بالوكيل والأدوات والموافقة في مسار مرئي يمكن اختباره قبل النشر." : "Connect triggers, agents, tools, and approval in a visible path you can test before publishing."}</p></div>
        <Link className="button button--primary button--default" href={`/${locale}/app/flows/new`}><Plus size={16} />{ar ? "تدفق جديد" : "New flow"}</Link>
      </header>

      <OperationsStats items={[
        { label: ar ? "تدفقات نشطة" : "Active flows", value: String(flows.filter((flow) => flow.status === "published").length), detail: ar ? "تنفذ حسب السياسة" : "Policy governed" },
        { label: ar ? "العقد" : "Nodes", value: String(flows.reduce((sum, flow) => sum + flow.nodeCount, 0)), detail: ar ? "منطق مرئي" : "Visible logic" },
        { label: ar ? "التشغيلات" : "Runs", value: String(flows.reduce((sum, flow) => sum + flow.runCount, 0)), detail: ar ? "إجمالي تجريبي" : "Demo total" },
        { label: ar ? "بوابات موافقة" : "Approval gates", value: "1", detail: ar ? "قبل الإرسال" : "Before sending", tone: "attention" },
      ]} />

      <LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visibleFlows.length} filters={[
        { id: "all", label: ar ? "الكل" : "All" },
        { id: "published", label: ar ? "منشور" : "Published" },
        { id: "draft", label: ar ? "مسودة" : "Draft" },
        { id: "archived", label: ar ? "مؤرشف" : "Archived" },
      ]} />

      {visibleFlows.length ? <div className="mj-data-list flows-data-list ops-data-list" role="table" aria-label={ar ? "مكتبة التدفقات" : "Flow library"}><div className="mj-data-list__head" role="row"><span>{ar ? "التدفق" : "Flow"}</span><span>{ar ? "العقد" : "Nodes"}</span><span>{ar ? "التشغيلات" : "Runs"}</span><span>{ar ? "الحالة" : "Status"}</span><span>{ar ? "إجراءات" : "Actions"}</span></div>{visibleFlows.map((flow) => (
        <div className="mj-data-list__row" role="row" key={flow.id}>
          <span className="ops-cell-id" data-label={ar ? "التدفق" : "Flow"}><i><Workflow size={16} /></i><span><strong>{localize(flow.name, locale)}</strong><small>{localize(flow.description, locale)}</small></span></span>
          <span className="mono" data-label={ar ? "العقد" : "Nodes"}>{flow.nodeCount}</span>
          <span className="mono" data-label={ar ? "التشغيلات" : "Runs"}>{flow.runCount}</span>
          <span data-label={ar ? "الحالة" : "Status"}><Badge tone={flow.status === "published" ? "success" : flow.status === "draft" ? "warning" : "neutral"}>{flow.status === "published" ? (ar ? "نشط" : "Active") : flow.status === "draft" ? (ar ? "مسودة" : "Draft") : (ar ? "مؤرشف" : "Archived")}</Badge></span>
          <span className="ops-cell-actions" data-label={ar ? "إجراءات" : "Actions"}><button className="button button--outline button--compact" type="button" onClick={() => setNotice(ar ? `بدأ اختبار آمن للتدفق «${localize(flow.name, locale)}» دون آثار خارجية.` : `Safe test started for “${localize(flow.name, locale)}” with no external effects.`)}><Play size={14} />{ar ? "اختبار" : "Test"}</button><Link className="ops-row-link" href={`/${locale}/app/flows/${flow.id}/edit`}>{ar ? "المحرر" : "Editor"}<DirectionArrow size={14} /></Link></span>
        </div>
      ))}</div> : <LibraryEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />}
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
