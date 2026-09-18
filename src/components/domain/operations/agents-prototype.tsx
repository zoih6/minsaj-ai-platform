"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Boxes, Play, Plus, ShieldCheck, Wrench } from "lucide-react";
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

      {visibleAgents.length ? <section className="agent-library" aria-label={ar ? "مكتبة الوكلاء" : "Agent library"}>{visibleAgents.map((agent) => (
        <article className="agent-card" key={agent.id}>
          <div className="agent-card__head"><span className="agent-avatar"><Bot size={18} /></span><Badge tone={agent.status === "published" ? "success" : "warning"}>{agent.status === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</Badge></div>
          <div className="agent-card__copy"><span className="mono">V{agent.version}</span><h2>{localize(agent.name, locale)}</h2><p>{localize(agent.description, locale)}</p></div>
          <dl className="agent-card__facts"><div><dt><Boxes size={14} />{ar ? "النموذج" : "Model"}</dt><dd>{agent.model}</dd></div><div><dt><Wrench size={14} />{ar ? "الأدوات" : "Tools"}</dt><dd>{agent.toolCount}</dd></div><div><dt><Play size={14} />{ar ? "التشغيلات" : "Runs"}</dt><dd>{agent.runCount}</dd></div></dl>
          <div className="agent-card__policy"><ShieldCheck size={14} /><span>{ar ? "أي أثر خارجي ينتظر موافقة" : "External effects always await approval"}</span></div>
          <div className="agent-card__actions"><button className="button button--outline button--compact" type="button" onClick={() => setNotice(ar ? `جُهز تشغيل تجريبي للوكيل «${localize(agent.name, locale)}».` : `Demo run prepared for “${localize(agent.name, locale)}”.`)}><Play size={14} />{ar ? "تشغيل تجريبي" : "Demo run"}</button><Link href={`/${locale}/app/agents/${agent.id}/edit`}>{ar ? "فتح المنشئ" : "Open builder"}<DirectionArrow size={14} /></Link></div>
        </article>
      ))}</section> : <LibraryEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />}
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
