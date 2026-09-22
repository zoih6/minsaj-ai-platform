"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Play, Plus } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type AgentSummary, type Locale } from "@minsaj/contracts";
import { DemoToast, LibraryEmpty, LibraryToolbar, OperationsStats } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function AgentsPrototype({ locale, agents }: { locale: Locale; agents: AgentSummary[] }) {
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
  const visibleAgents = agents.filter((agent) => {
    const matchesQuery = !normalized || `${localize(agent.name, locale)} ${localize(agent.description, locale)} ${agent.model}`.toLocaleLowerCase(locale).includes(normalized);
    return matchesQuery && (filter === "all" || agent.status === filter);
  });

  const published = agents.filter((agent) => agent.status === "published").length;
  return (
    <div className="ops-page agents-prototype">
      <ScrollFx />
      <header className="page-header ops-page-header">
        <div className="page-header__copy"><p className="page-eyebrow">{ar ? "تفويض موثوق" : "Trusted delegation"}</p><h1 className="page-title">{ar ? "الوكلاء" : "Agents"}</h1><p className="page-description">{ar ? "فوّض العمل المركب عبر خطة وأدوات وحدود وموافقة ظاهرة قبل التشغيل." : "Delegate complex work through a visible plan, tools, limits, and approval before execution."}</p></div>
        <Link className="button button--primary button--default" href={`/${locale}/app/agents/new`}><Plus size={16} />{ar ? "إنشاء وكيل" : "Create agent"}</Link>
      </header>

      <OperationsStats items={[
        { label: ar ? "منشور" : "Published", value: String(published), detail: ar ? "جاهز للتشغيل" : "Ready to run" },
        { label: ar ? "مسودات" : "Drafts", value: String(agents.length - published), detail: ar ? "تحتاج مراجعة" : "Need review" },
        { label: ar ? "التشغيلات" : "Runs", value: String(agents.reduce((sum, item) => sum + item.runCount, 0)), detail: ar ? "إجمالي تجريبي" : "Demo total" },
        { label: ar ? "موافقة مطلوبة" : "Approval required", value: "1", detail: ar ? "أثر خارجي" : "External impact", tone: "attention" },
      ]} />

      <LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visibleAgents.length} filters={[
        { id: "all", label: ar ? "الكل" : "All" },
        { id: "published", label: ar ? "منشور" : "Published" },
        { id: "draft", label: ar ? "مسودة" : "Draft" },
      ]} />

      {visibleAgents.length ? <div className="mj-data-list agents-data-list ops-data-list" role="table" aria-label={ar ? "مكتبة الوكلاء" : "Agent library"}><div className="mj-data-list__head" role="row"><span>{ar ? "الوكيل" : "Agent"}</span><span>{ar ? "النموذج" : "Model"}</span><span>{ar ? "التشغيلات" : "Runs"}</span><span>{ar ? "الحالة" : "Status"}</span><span>{ar ? "إجراءات" : "Actions"}</span></div>{visibleAgents.map((agent) => (
        <div className="mj-data-list__row" role="row" key={agent.id}>
          <span className="ops-cell-id" data-label={ar ? "الوكيل" : "Agent"}><i><Bot size={16} /></i><span><strong>{localize(agent.name, locale)}</strong><small>{localize(agent.description, locale)}</small></span></span>
          <span className="mono" data-label={ar ? "النموذج" : "Model"}>{agent.model}</span>
          <span className="mono" data-label={ar ? "التشغيلات" : "Runs"}>{agent.runCount}</span>
          <span data-label={ar ? "الحالة" : "Status"}><Badge tone={agent.status === "published" ? "success" : "warning"}>{agent.status === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</Badge></span>
          <span className="ops-cell-actions" data-label={ar ? "إجراءات" : "Actions"}><button className="button button--outline button--compact" type="button" onClick={() => setNotice(ar ? `جُهز تشغيل تجريبي للوكيل «${localize(agent.name, locale)}».` : `Demo run prepared for “${localize(agent.name, locale)}”.`)}><Play size={14} />{ar ? "تشغيل" : "Run"}</button><Link className="ops-row-link" href={`/${locale}/app/agents/${agent.id}/edit`}>{ar ? "المنشئ" : "Builder"}<DirectionArrow size={14} /></Link></span>
        </div>
      ))}</div> : <LibraryEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />}
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
