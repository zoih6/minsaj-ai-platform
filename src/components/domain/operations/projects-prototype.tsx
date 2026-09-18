"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { Activity, ArrowLeft, ArrowRight, FolderKanban, Grid2X2, List, MessageSquareText, Plus, X } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type Locale, type ProjectSummary } from "@minsaj/contracts";
import { DemoToast, LibraryToolbar, OperationsStats } from "./shared";
import { retrySurface, SearchEmpty, SkeletonGrid, UniversalEmpty, type SurfaceStateOverride } from "@/components/universal/states";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function ProjectsPrototype({ locale, initialProjects, scenario = null }: { locale: Locale; initialProjects: ProjectSummary[]; scenario?: SurfaceStateOverride }) {
  const ar = locale === "ar";
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("research");
  const [notice, setNotice] = useState("");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const normalized = query.trim().toLocaleLowerCase(locale);

  const visibleProjects = projects.filter((project) => {
    const matchesQuery = !normalized || `${localize(project.name, locale)} ${localize(project.description, locale)}`.toLocaleLowerCase(locale).includes(normalized);
    const matchesFilter = filter === "all" || (filter === "active" ? project.activeRuns > 0 : project.activeRuns === 0);
    return matchesQuery && matchesFilter;
  });

  function resetFilters() {
    setQuery("");
    setFilter("all");
  }

  function createProject() {
    const cleanName = name.trim();
    if (!cleanName) return;
    const project: ProjectSummary = {
      id: `prj_demo_${Date.now()}`,
      name: { ar: cleanName, en: cleanName },
      description: { ar: description.trim() || "مشروع تجريبي جديد", en: description.trim() || "New demo project" },
      activeRuns: 0,
      conversations: 0,
      updatedAt: new Date().toISOString(),
    };
    setProjects((items) => [project, ...items]);
    setCreateOpen(false);
    setName("");
    setDescription("");
    setTemplate("research");
    setNotice(ar ? "أُنشئ المشروع محليًا — لم تُرسل أي بيانات." : "Project created locally — no data was sent.");
  }

  return (
    <div className="ops-page projects-prototype">
      <ScrollFx />
      <header className="page-header ops-page-header">
        <div className="page-header__copy"><p className="page-eyebrow">{ar ? "السياق المشترك" : "Shared context"}</p><h1 className="page-title">{ar ? "المشاريع" : "Projects"}</h1><p className="page-description">{ar ? "كل مشروع يجمع المحادثات والمعرفة والوكلاء والتدفقات والتكلفة حول نتيجة واحدة." : "Each project keeps conversations, knowledge, agents, flows, and cost organized around one outcome."}</p></div>
        <Dialog.Root open={createOpen} onOpenChange={setCreateOpen}>
          <Dialog.Trigger asChild><button className="button button--primary button--default" type="button"><Plus size={16} />{ar ? "مشروع جديد" : "New project"}</button></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="command-overlay" />
            <Dialog.Content className="form-dialog" aria-describedby="new-project-description">
              <div className="form-dialog__header"><div><Dialog.Title>{ar ? "إنشاء مشروع" : "Create a project"}</Dialog.Title><Dialog.Description id="new-project-description">{ar ? "ابدأ باسم ونتيجة واضحة؛ يمكنك تغيير السياسات لاحقًا." : "Start with a clear name and outcome; policies can change later."}</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label={ar ? "إغلاق" : "Close"}><X size={18} /></button></Dialog.Close></div>
              <form onSubmit={(event) => { event.preventDefault(); createProject(); }}>
                <label className="field"><span>{ar ? "اسم المشروع" : "Project name"}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder={ar ? "مثال: إطلاق الخدمة في الإمارات" : "Example: UAE market launch"} required /></label>
                <label className="field"><span>{ar ? "النتيجة المطلوبة" : "Desired outcome"}</span><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={ar ? "صف النتيجة التي سيجمع المشروع العمل حولها…" : "Describe the outcome this project will organize work around…"} /></label>
                <fieldset className="template-options"><legend>{ar ? "نقطة البداية" : "Starting point"}</legend>{([
                  ["research", ar ? "بحث وقرار" : "Research and decision", ar ? "محادثة + وكيل باحث" : "Chat + research agent"],
                  ["content", ar ? "عمليات محتوى" : "Content operations", ar ? "تقويم + مراجعة بشرية" : "Calendar + human review"],
                  ["blank", ar ? "مشروع فارغ" : "Blank project", ar ? "سياق أساسي فقط" : "Core context only"],
                ] as const).map(([id, title, detail]) => <label key={id} className={template === id ? "is-selected" : ""}><input type="radio" name="template" value={id} checked={template === id} onChange={() => setTemplate(id)} /><span><strong>{title}</strong><small>{detail}</small></span></label>)}</fieldset>
                <div className="form-dialog__note"><span />{ar ? "محاكاة Frontend: يُحفظ المشروع في الذاكرة حتى تحديث الصفحة." : "Frontend simulation: the project stays in memory until refresh."}</div>
                <div className="form-dialog__actions"><Dialog.Close asChild><button className="button button--quiet button--default" type="button">{ar ? "إلغاء" : "Cancel"}</button></Dialog.Close><button className="button button--primary button--default" type="submit" disabled={!name.trim()}>{ar ? "إنشاء المشروع" : "Create project"}</button></div>
              </form>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <OperationsStats items={[
        { label: ar ? "المشاريع النشطة" : "Active projects", value: String(projects.filter((item) => item.activeRuns > 0).length), detail: ar ? "تعمل الآن" : "Working now" },
        { label: ar ? "التشغيلات" : "Active runs", value: String(projects.reduce((sum, item) => sum + item.activeRuns, 0)), detail: ar ? "عبر كل المشاريع" : "Across projects" },
        { label: ar ? "المحادثات" : "Conversations", value: String(projects.reduce((sum, item) => sum + item.conversations, 0)), detail: ar ? "بسياق محفوظ" : "With saved context" },
        { label: ar ? "الحالة" : "Workspace state", value: ar ? "مستقرة" : "Healthy", detail: ar ? "لا تعارضات" : "No conflicts" },
      ]} />

      <div className="library-toolbar-row">
        <LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visibleProjects.length} filters={[
          { id: "all", label: ar ? "الكل" : "All" },
          { id: "active", label: ar ? "نشط" : "Active" },
          { id: "idle", label: ar ? "هادئ" : "Idle" },
        ]} />
        <div className="view-switch" role="group" aria-label={ar ? "طريقة العرض" : "View mode"}><button type="button" className={view === "grid" ? "is-active" : ""} aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label={ar ? "شبكة" : "Grid"}><Grid2X2 size={16} /></button><button type="button" className={view === "list" ? "is-active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")} aria-label={ar ? "قائمة" : "List"}><List size={16} /></button></div>
      </div>

      {scenario === "loading" ? (
        <SkeletonGrid count={6} />
      ) : scenario === "empty" || (scenario !== "error" && !projects.length && !normalized && filter === "all") ? (
        <UniversalEmpty
          icon={FolderKanban}
          title={ar ? "لا مشاريع بعد" : "No projects yet"}
          body={ar ? "المشروع يجمع المحادثات والمخرجات والسياق حول نتيجة واحدة — ابدأ بأول نتيجة تريد تحقيقها." : "A project gathers conversations, outputs, and context around one outcome — start with the first outcome you want to reach."}
          action={
            <button className="button button--primary button--compact" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              {ar ? "إنشاء مشروع" : "Create a project"}
            </button>
          }
        />
      ) : scenario === "error" ? (
        <UniversalEmpty
          icon={X}
          tone="error"
          title={ar ? "تعذّر تحميل المشاريع" : "Couldn't load projects"}
          body={ar ? "حدث خطأ مؤقت أثناء قراءة قائمة المشاريع. لم يفقد أي عمل محفوظ، ويمكنك إعادة المحاولة." : "A temporary error occurred while reading the project list. No saved work was lost — you can retry."}
          action={<button type="button" className="button button--primary button--compact" onClick={retrySurface}>{ar ? "إعادة المحاولة" : "Try again"}</button>}
        />
      ) : visibleProjects.length ? <section className={`project-library is-${view}`} aria-label={ar ? "قائمة المشاريع" : "Project list"}>{visibleProjects.map((project) => (
        <article className="project-library-card" key={project.id}>
          <div className="project-library-card__top"><span className="project-library-card__icon"><FolderKanban size={18} /></span>{project.activeRuns ? <Badge tone="brand">{ar ? `${project.activeRuns} تشغيل نشط` : `${project.activeRuns} active runs`}</Badge> : <Badge>{ar ? "هادئ" : "Idle"}</Badge>}</div>
          <div className="project-library-card__copy"><h2>{localize(project.name, locale)}</h2><p>{localize(project.description, locale)}</p></div>
          <dl className="project-library-card__metrics"><div><dt><Activity size={14} />{ar ? "التشغيلات" : "Runs"}</dt><dd>{project.activeRuns}</dd></div><div><dt><MessageSquareText size={14} />{ar ? "المحادثات" : "Chats"}</dt><dd>{project.conversations}</dd></div></dl>
          <div className="context-coverage"><div><span>{ar ? "اكتمال السياق" : "Context coverage"}</span><b>{project.conversations ? "78%" : "12%"}</b></div><div role="progressbar" aria-label={ar ? "اكتمال سياق المشروع" : "Project context coverage"} aria-valuenow={project.conversations ? 78 : 12} aria-valuemin={0} aria-valuemax={100}><span style={{ width: project.conversations ? "78%" : "12%" }} /></div></div>
          <Link className="project-library-card__link" href={`/${locale}/app/projects/${project.id}`}><span>{ar ? "فتح المشروع" : "Open project"}</span><DirectionArrow size={16} /></Link>
        </article>
      ))}</section> : normalized || filter !== "all" ? (
        <SearchEmpty locale={locale} onReset={resetFilters} />
      ) : (
        <UniversalEmpty
          icon={FolderKanban}
          title={ar ? "لا مشاريع بعد" : "No projects yet"}
          body={ar ? "المشروع يجمع المحادثات والمخرجات والسياق حول نتيجة واحدة — ابدأ بأول نتيجة تريد تحقيقها." : "A project gathers conversations, outputs, and context around one outcome — start with the first outcome you want to reach."}
          action={
            <button className="button button--primary button--compact" type="button" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              {ar ? "إنشاء مشروع" : "Create a project"}
            </button>
          }
        />
      )}
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
