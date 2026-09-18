"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, CheckCircle2, FileText, FolderKanban, MessageSquareText, Play, Plus, ShieldCheck, Sparkles, Users, Workflow } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type AgentSummary, type FlowSummary, type Locale, type ProjectSummary, type RunSummary } from "@minsaj/contracts";
import { CostValue, RunStatusBadge } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function ProjectDetailPrototype({ locale, project, agents, flows, runs }: { locale: Locale; project: ProjectSummary; agents: AgentSummary[]; flows: FlowSummary[]; runs: RunSummary[] }) {
  const ar = locale === "ar";
  const [tab, setTab] = useState("overview");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  const projectAgents = agents.filter((agent) => agent.projectIds.includes(project.id));
  const projectFlows = flows.filter((flow) => flow.projectId === project.id);
  const projectRuns = runs.slice(0, project.activeRuns ? 3 : 1);
  const successCriteria = ar ? ["تحديد فرص السوق بالأدلة لا الافتراض", "توثيق القرار ومصادره", "عدم تنفيذ أي أثر خارجي دون موافقة"] : ["Identify market opportunities from evidence, not assumptions", "Document the decision and its sources", "No external effect without approval"];

  return (
    <div className="ops-page project-detail-page">
      <ScrollFx />
      <Link className="back-link" href={`/${locale}/app/projects`}><DirectionArrow size={14} />{ar ? "كل المشاريع" : "All projects"}</Link>
      <header className="project-detail-hero">
        <div className="project-detail-hero__identity"><span className="project-detail-hero__icon"><FolderKanban size={20} /></span><div><div className="project-detail-hero__meta"><Badge tone="success">{ar ? "نشط" : "Active"}</Badge><span className="mono">{project.id}</span></div><h1>{localize(project.name, locale)}</h1><p>{localize(project.description, locale)}</p></div></div>
        <div className="project-detail-hero__actions"><Link className="button button--quiet button--default" href={`/${locale}/app/chat?project=${project.id}`}><MessageSquareText size={16} />{ar ? "محادثة ضمن المشروع" : "Chat in project"}</Link><Link className="button button--primary button--default" href={`/${locale}/app/agents/new?project=${project.id}`}><Plus size={16} />{ar ? "إضافة وكيل" : "Add agent"}</Link></div>
      </header>

      <nav className="detail-tabs" aria-label={ar ? "أقسام المشروع" : "Project sections"}>{([
        ["overview", ar ? "نظرة عامة" : "Overview"],
        ["context", ar ? "السياق والمعرفة" : "Context and knowledge"],
        ["access", ar ? "الفريق والوصول" : "Team and access"],
      ] as const).map(([id, label]) => <button type="button" key={id} className={tab === id ? "is-active" : ""} aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{label}</button>)}</nav>

      <div className="project-detail-layout">
        <main>
          {tab === "overview" ? <div className="project-overview-stack">
            <section className="project-brief-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "ميثاق المشروع" : "Project charter"}</p><h2>{ar ? "تعريف واضح للنجاح قبل التفويض" : "Define success before delegating"}</h2></div><Badge tone="brand">{ar ? "سياق مشترك" : "Shared context"}</Badge></div><p className="project-brief-card__body">{localize(project.description, locale)}</p><div className="success-criteria"><h3>{ar ? "معايير النجاح" : "Success criteria"}</h3>{successCriteria.map((criterion) => <div key={criterion}><CheckCircle2 size={16} /><span>{criterion}</span></div>)}</div></section>

            <section className="linked-section"><div className="section-heading"><div><p className="section-kicker">{ar ? "قدرات المشروع" : "Project capabilities"}</p><h2>{ar ? "الوكلاء المرتبطون" : "Linked agents"}</h2></div><Link href={`/${locale}/app/agents`}>{ar ? "عرض المكتبة" : "View library"}<DirectionArrow size={14} /></Link></div><div className="linked-grid">{projectAgents.map((agent) => <Link className="linked-entity" href={`/${locale}/app/agents/${agent.id}/edit`} key={agent.id}><span className="linked-entity__icon"><Bot size={18} /></span><span><strong>{localize(agent.name, locale)}</strong><small>{agent.model} · {agent.toolCount} {ar ? "أدوات" : "tools"}</small></span><DirectionArrow size={14} /></Link>)}</div></section>

            <section className="linked-section"><div className="section-heading"><div><p className="section-kicker">{ar ? "الأتمتة" : "Automation"}</p><h2>{ar ? "التدفقات المرتبطة" : "Linked flows"}</h2></div><Link href={`/${locale}/app/flows`}>{ar ? "كل التدفقات" : "All flows"}<DirectionArrow size={14} /></Link></div><div className="linked-grid">{projectFlows.map((flow) => <Link className="linked-entity" href={`/${locale}/app/flows/${flow.id}/edit`} key={flow.id}><span className="linked-entity__icon"><Workflow size={18} /></span><span><strong>{localize(flow.name, locale)}</strong><small>{flow.nodeCount} {ar ? "عقد" : "nodes"} · {flow.status === "published" ? (ar ? "نشط" : "Active") : (ar ? "مسودة" : "Draft")}</small></span><DirectionArrow size={14} /></Link>)}</div></section>

            <section className="project-runs-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "آخر نشاط" : "Latest activity"}</p><h2>{ar ? "التشغيلات الأخيرة" : "Recent runs"}</h2></div><Link href={`/${locale}/app/runs`}>{ar ? "السجل الكامل" : "Full history"}<DirectionArrow size={14} /></Link></div><div className="compact-run-list">{projectRuns.map((run) => <Link href={`/${locale}/app/runs/${run.id}`} key={run.id}><span className="compact-run-list__icon"><Play size={14} /></span><span><strong>{localize(run.title, locale)}</strong><small className="mono">{run.id}</small></span><RunStatusBadge status={run.status} locale={locale} /><CostValue value={run.cost.amountMinor / 100} locale={locale} /></Link>)}</div></section>
          </div> : null}

          {tab === "context" ? <section className="context-library"><div className="section-heading"><div><p className="section-kicker">{ar ? "مصادر مؤرشفة" : "Governed sources"}</p><h2>{ar ? "السياق الذي يراه الوكلاء" : "Context visible to agents"}</h2></div><button className="button button--outline button--compact" type="button"><Plus size={14} />{ar ? "إضافة مصدر" : "Add source"}</button></div><div className="context-callout"><ShieldCheck size={16} /><p>{ar ? "لا يصل أي وكيل إلى هذه المصادر إلا إذا منحته سياسته حق القراءة." : "No agent can access these sources unless its policy grants read access."}</p></div><div className="context-source-list">{[
            ["launch-brief.pdf", ar ? "موجز الإطلاق" : "Launch brief", "PDF · 14 pages"],
            ["policy-library", ar ? "مكتبة السياسات" : "Policy library", ar ? "٨ مستندات" : "8 documents"],
            ["decision-log", ar ? "سجل القرارات" : "Decision log", ar ? "محدّث اليوم" : "Updated today"],
          ].map(([id, name, meta]) => <article key={id}><span><FileText size={16} /></span><div><strong>{name}</strong><small>{meta}</small></div><Badge tone="success">{ar ? "مفهرس" : "Indexed"}</Badge></article>)}</div></section> : null}

          {tab === "access" ? <section className="access-panel"><div className="section-heading"><div><p className="section-kicker">{ar ? "الوصول" : "Access"}</p><h2>{ar ? "الفريق والصلاحيات" : "Team and permissions"}</h2></div><button className="button button--outline button--compact" type="button"><Plus size={14} />{ar ? "دعوة عضو" : "Invite member"}</button></div><div className="member-list">{[
            ["SM", ar ? "سارة منصور" : "Sarah Mansour", ar ? "مالكة المشروع" : "Project owner"],
            ["YK", ar ? "يوسف خالد" : "Yousef Khaled", ar ? "مراجع وموافق" : "Reviewer and approver"],
          ].map(([initials, name, role]) => <div key={initials}><span className="member-avatar">{initials}</span><span><strong>{name}</strong><small>{role}</small></span><Badge>{ar ? "وصول كامل" : "Full access"}</Badge></div>)}</div><div className="access-policy"><Users size={18} /><div><strong>{ar ? "مبدأ أقل صلاحية" : "Least-privilege access"}</strong><p>{ar ? "الأعضاء الجدد يبدؤون بعرض فقط؛ التفويضات المالية والموافقات تُمنح صراحة." : "New members start with view-only access; financial and approval authority is granted explicitly."}</p></div></div></section> : null}
        </main>

        <aside className="project-inspector">
          <section><p className="section-kicker">{ar ? "ملخص التشغيل" : "Operations summary"}</p><h2>{ar ? "حدود المشروع" : "Project limits"}</h2><dl><div><dt>{ar ? "الجهة الدافعة" : "Billing source"}</dt><dd>{ar ? "رصيد المنصة" : "Platform credits"}</dd></div><div><dt>{ar ? "ميزانية التشغيل" : "Run budget"}</dt><dd><CostValue value={24} locale={locale} /></dd></div><div><dt>{ar ? "موافقة خارجية" : "External approval"}</dt><dd>{ar ? "مطلوبة" : "Required"}</dd></div></dl><div className="budget-meter"><div><span>{ar ? "الاستهلاك هذا الشهر" : "Used this month"}</span><b>$8.42 / $24</b></div><div role="progressbar" aria-label={ar ? "استهلاك ميزانية المشروع" : "Project budget usage"} aria-valuenow={35} aria-valuemin={0} aria-valuemax={100}><span /></div></div></section>
          <section className="project-inspector__tip"><Sparkles size={18} /><div><strong>{ar ? "السياق يقلل التكرار" : "Context reduces repetition"}</strong><p>{ar ? "الوكلاء والتدفقات المرتبطة تستخدم هذا الميثاق بدل طلب التوجيه من جديد." : "Linked agents and flows use this charter instead of asking for the same direction again."}</p></div></section>
        </aside>
      </div>
    </div>
  );
}
