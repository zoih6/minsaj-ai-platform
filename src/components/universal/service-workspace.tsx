"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  Brain,
  Bug,
  ChartNoAxesCombined,
  Check,
  Clock,
  Code2,
  Compass,
  Eye,
  FileCode,
  FileText,
  FlaskConical,
  GraduationCap,
  Info,
  LayoutGrid,
  Library,
  Lightbulb,
  ListTree,
  LoaderCircle,
  Mic,
  Network,
  Paperclip,
  Plus,
  Route,
  Scale,
  ShieldCheck,
  Sparkles,
  Table,
  Telescope,
  Terminal,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import { ActivityFeedback } from "@/components/universal/activity-feedback";
import { getUniversalService, type UniversalServiceId } from "@/lib/universal-content";

const serviceIcons = {
  ask: Brain,
  learn: GraduationCap,
  research: Compass,
  create: FileText,
  code: Code2,
  analyze: ChartNoAxesCombined,
  explore: Compass,
} satisfies Record<UniversalServiceId, typeof Brain>;

/* Work-mode toolkit — each tool gets its own affordance icon (the old
   prototype squashed these into three anonymous composer dots; the
   structured page restores them as first-class, selectable work modes). */
const toolIcons: Record<UniversalServiceId, readonly LucideIcon[]> = {
  ask: [FileText, Mic, Brain],
  learn: [Lightbulb, ListTree, Route],
  research: [Network, FileText, Check],
  create: [FileCode, Eye, Sparkles],
  code: [Terminal, Eye, Bug],
  analyze: [Table, ChartNoAxesCombined, ShieldCheck],
  explore: [Compass, Network, Route],
};

const serviceTools: Record<UniversalServiceId, readonly string[]> = {
  ask: ["ملفات", "صوت", "سياق ذكي"],
  learn: ["شرح تفاعلي", "اختبار فهم", "خطة تقدّم"],
  research: ["بحث الويب", "مصادر أكاديمية", "توثيق"],
  create: ["مستند", "صور", "لوحة إبداع"],
  code: ["محرر كود", "معاينة", "فحص أخطاء"],
  analyze: ["جداول", "رسوم", "تحقق بيانات"],
  explore: ["مواضيع منتقاة", "خريطة أفكار", "رحلات معرفية"],
};

const serviceToolsEn: Record<UniversalServiceId, readonly string[]> = {
  ask: ["Files", "Voice", "Smart context"],
  learn: ["Interactive explanation", "Knowledge checks", "Progress path"],
  research: ["Web research", "Academic sources", "Citations"],
  create: ["Document", "Images", "Creative canvas"],
  code: ["Code editor", "Preview", "Error checks"],
  analyze: ["Tables", "Charts", "Data checks"],
  explore: ["Curated topics", "Idea map", "Knowledge trails"],
};

const starterIcons: Record<UniversalServiceId, readonly LucideIcon[]> = {
  ask: [Lightbulb, Scale, ListTree],
  learn: [Lightbulb, Check, Route],
  research: [Network, Scale, FileText],
  create: [FileCode, LayoutGrid, Sparkles],
  code: [Bug, LayoutGrid, FileCode],
  analyze: [BarChart3, FileText, ShieldCheck],
  explore: [Telescope, Sparkles, FlaskConical],
};

export function ServiceWorkspace({ locale, serviceId }: { locale: Locale; serviceId: UniversalServiceId }) {
  const service = getUniversalService(locale, serviceId);
  const Icon = serviceIcons[serviceId];
  const isArabic = locale === "ar";
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"guided" | "fast">("guided");
  const [activeTools, setActiveTools] = useState<readonly string[]>([serviceTools[serviceId][0]]);
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const tools = (isArabic ? serviceTools[serviceId] : serviceToolsEn[serviceId]).map((label, index) => ({
    label,
    icon: toolIcons[serviceId][index] ?? Sparkles,
  }));

  const copy = isArabic
    ? {
        navLearn: "تعلّم",
        navLibrary: "المكتبة",
        navBack: "العودة إلى مساحتي",
        navLabel: "تنقل المساحة",
        interactive: "مساحة تفاعلية",
        guided: "موجّه",
        fast: "سريع",
        guidedHint: "يسألك منسج أسئلة قصيرة لتحسين النتيجة.",
        fastHint: "ابدأ فورًا بأقل عدد من الخطوات.",
        newSession: "جلسة جديدة",
        toolsTitle: "اختيار نمط العمل",
        toolsHint: "تتغير الأدوات حسب طلبك",
        modeTitle: "اختيار أسلوب التنفيذ",
        title: "ابدأ من مقصدك",
        attach: "أضف ملفًا أو صورة",
        voice: "إدخال صوتي",
        start: "ابدأ الآن",
        working: "منسج يجهّز المساحة المناسبة…",
        workingShort: "جارٍ التهيئة",
        simulation: "محاكاة واضحة",
        progress: "تهيئة أدوات المساحة",
        validationLabel: "الطلب غير مكتمل",
        validationTitle: "أضف مقصدك قبل البدء",
        validationBody: "اكتب طلبًا قصيرًا أو اختر بداية سريعة أدناه، ثم أعد المحاولة.",
        returnToPrompt: "العودة إلى الطلب",
        ready: "المساحة جاهزة",
        openOutput: "افتح المخرج",
        restart: "ابدأ من جديد",
        pathTitle: "كيف سيعمل منسج؟",
        path: ["يفهم الهدف والسياق", "يقترح الشكل والأدوات", "ينجز مع نقاط مراجعة", "يقدّم مخرجًا قابلًا للتحرير"],
        trust: "لا خدمة خارجية تعمل في هذا النموذج. كل الحالات المعروضة محاكاة واضحة.",
        templates: "بدايات سريعة",
        templatesHint: "قوالب خفيفة يمكنك تعديلها قبل البدء.",
        recent: "من مكتبتك",
        recentHint: "أعمال مرتبطة بهذه المساحة.",
        recentEdited: "آخر تعديل هذا الأسبوع",
        recentSaved: "محفوظ في مكتبتي",
        sampleTitle: "مسودة تفاعلية",
        sampleSections: ["ما فهمته من طلبك", "المسار المقترح", "الخطوة التالية"],
        sampleBody: "هذا مخرج تجريبي يوضح كيف تتحول المهمة إلى مساحة عمل مناسبة بدل بقائها داخل رسالة واحدة.",
      }
    : {
        navLearn: "Learn",
        navLibrary: "Library",
        navBack: "Back to my space",
        navLabel: "Space navigation",
        interactive: "Interactive space",
        guided: "Guided",
        fast: "Fast",
        guidedHint: "Minsaj asks you a few short questions to sharpen the result.",
        fastHint: "Start immediately with the fewest steps.",
        newSession: "New session",
        toolsTitle: "Choose how you'll work",
        toolsHint: "Tools adapt to your request",
        modeTitle: "Choose the execution style",
        title: "Start with your intent",
        attach: "Add a file or image",
        voice: "Voice input",
        start: "Start now",
        working: "Minsaj is preparing the right space…",
        workingShort: "Preparing",
        simulation: "Explicit simulation",
        progress: "Preparing workspace tools",
        validationLabel: "Your request is incomplete",
        validationTitle: "Add your intent before starting",
        validationBody: "Write a short request or choose a quick start below, then try again.",
        returnToPrompt: "Return to my request",
        ready: "Your space is ready",
        openOutput: "Open output",
        restart: "Start again",
        pathTitle: "How will Minsaj work?",
        path: ["Understands the goal and context", "Proposes the format and tools", "Executes with review checkpoints", "Delivers an editable output"],
        trust: "No external service runs in this prototype. Every state shown is a clear simulation.",
        templates: "Quick starts",
        templatesHint: "Light templates you can adjust before starting.",
        recent: "From your library",
        recentHint: "Work tied to this space.",
        recentEdited: "Edited this week",
        recentSaved: "Saved in my library",
        sampleTitle: "Interactive draft",
        sampleSections: ["What I understood", "Suggested path", "Next step"],
        sampleBody: "This simulated output shows how a task becomes an appropriate workspace instead of staying trapped in a single message.",
      };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  /* Auto-grow field (reference behavior): the composer grows with its
     content up to a 150px ceiling, from every write path — typing, starter
     quick-fill, and reset. */
  useEffect(() => {
    const field = textareaRef.current;
    if (!field) return;
    field.style.height = "";
    field.style.height = `${Math.min(field.scrollHeight, 150)}px`;
  }, [prompt]);

  function cancelPendingRun() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function toggleTool(label: string) {
    setActiveTools((current) => (current.includes(label) ? current.filter((item) => item !== label) : [...current, label]));
  }

  function start() {
    cancelPendingRun();
    if (!prompt.trim()) {
      setStatus("error");
      window.requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }
    setStatus("working");
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setStatus("ready");
    }, 820);
  }

  function reset() {
    cancelPendingRun();
    setPrompt("");
    setStatus("idle");
  }

  function quickFill(title: string) {
    cancelPendingRun();
    setPrompt(title);
    setStatus("idle");
    textareaRef.current?.focus();
  }

  const base = `/${locale}/app`;
  const libraryHref = `${base}/library`;
  const templates = service.starters.map((title, index) => ({ title, icon: starterIcons[serviceId][index] ?? Sparkles }));

  return (
    <div className="service-space" data-service={serviceId}>
      {/* 1 — Contextual navigation: sibling spaces + way back to home */}
      <nav className="service-nav" aria-label={copy.navLabel}>
        <Link href={`${base}/learn`} className="service-nav__link">
          <GraduationCap size={15} aria-hidden="true" />
          <span>{copy.navLearn}</span>
        </Link>
        <Link href={libraryHref} className="service-nav__link">
          <Library size={15} aria-hidden="true" />
          <span>{copy.navLibrary}</span>
        </Link>
        <span className="service-nav__spacer" aria-hidden="true" />
        <Link href={`${base}/home`} className="service-nav__link service-nav__link--back">
          {isArabic ? <ArrowRight size={15} aria-hidden="true" /> : <ArrowLeft size={15} aria-hidden="true" />}
          <span>{copy.navBack}</span>
        </Link>
      </nav>

      {/* 2 — Welcome: eyebrow · badge · gradient title · lede · new session */}
      <section className="service-welcome">
        <span className="service-welcome__eyebrow">{service.eyebrow}</span>
        <span className="service-welcome__badge">
          <span className="service-dot" aria-hidden="true"><i /><b /></span>
          {copy.interactive}
        </span>
        <h1 className="service-welcome__title">{service.label}</h1>
        <p className="service-welcome__lede">{service.description}</p>
        <button type="button" className="service-welcome__new" onClick={reset}>
          <Plus size={12} aria-hidden="true" />
          <span>{copy.newSession}</span>
        </button>
      </section>

      {/* 3 — Work mode: the service toolkit as selectable modes */}
      <section className="service-toolbelt" aria-labelledby="service-tools-title">
        <header className="service-section-head">
          <h2 id="service-tools-title">{copy.toolsTitle}</h2>
          <p>{copy.toolsHint}</p>
        </header>
        <div className="service-toolbelt__grid" role="group" aria-label={copy.toolsTitle}>
          {tools.map(({ label, icon: ToolIcon }) => {
            const active = activeTools.includes(label);
            return (
              <button
                type="button"
                key={label}
                className={active ? "service-tool is-on" : "service-tool"}
                aria-pressed={active}
                onClick={() => toggleTool(label)}
              >
                <span className="service-tool__icon"><ToolIcon size={17} aria-hidden="true" /></span>
                <strong>{label}</strong>
                <span className="service-tool__check" aria-hidden="true"><Check size={11} /></span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4 — Execution style: guided vs fast */}
      <section className="service-mode" aria-labelledby="service-mode-title">
        <header className="service-section-head">
          <h2 id="service-mode-title">{copy.modeTitle}</h2>
        </header>
        <div className="service-mode-switch" role="tablist" aria-label={copy.modeTitle}>
          <button type="button" role="tab" aria-selected={mode === "guided"} className={mode === "guided" ? "is-active" : ""} onClick={() => setMode("guided")}>
            <span className="service-mode-switch__label"><WandSparkles size={16} aria-hidden="true" /><strong>{copy.guided}</strong></span>
            <small>{copy.guidedHint}</small>
          </button>
          <button type="button" role="tab" aria-selected={mode === "fast"} className={mode === "fast" ? "is-active" : ""} onClick={() => setMode("fast")}>
            <span className="service-mode-switch__label"><Zap size={16} aria-hidden="true" /><strong>{copy.fast}</strong></span>
            <small>{copy.fastHint}</small>
          </button>
        </div>
      </section>

      {/* 5 — The composer: the one glowing container on the stage */}
      <section className="service-composer-zone">
        <div className="service-prompt-shell">
          <div className="service-prompt-area">
            <div className="service-prompt-area__head">
              <span className="service-prompt-area__orb"><Icon size={12} aria-hidden="true" /></span>
              <div className="service-prompt-area__heading">
                <span className="service-prompt-area__eyebrow">{service.eyebrow}</span>
                <h2>{copy.title}</h2>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              id="service-request"
              rows={2}
              value={prompt}
              onChange={(event) => { cancelPendingRun(); setPrompt(event.target.value); setStatus("idle"); }}
              placeholder={service.prompt}
              aria-label={service.prompt}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? "service-request-error" : undefined}
            />
            <div className="service-prompt-area__bottom">
              <div className="service-prompt-area__tools">
                <button type="button" className="service-afford" title={copy.attach} aria-label={copy.attach}>
                  <Paperclip size={15} aria-hidden="true" />
                  <span>{copy.attach}</span>
                </button>
                <button type="button" className="service-afford" title={copy.voice} aria-label={copy.voice}>
                  <Mic size={15} aria-hidden="true" />
                  <span>{copy.voice}</span>
                </button>
              </div>
              <button type="button" className="service-start-button" onClick={start} disabled={status === "working"} data-loading={status === "working"}>
                <span>{status === "working" ? copy.workingShort : copy.start}</span>
                {status === "working" ? <LoaderCircle size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {status === "working" ? <ActivityFeedback state="working" className="service-working" label={copy.simulation} title={copy.working} description={activeTools.length > 0 ? activeTools.join(" · ") : tools.map((tool) => tool.label).join(" · ")} progressLabel={copy.progress} /> : null}
        {status === "error" ? <ActivityFeedback id="service-request-error" state="error" label={copy.validationLabel} title={copy.validationTitle} description={copy.validationBody} action={<button type="button" onClick={() => textareaRef.current?.focus()}>{copy.returnToPrompt}</button>} /> : null}
        {status === "ready" ? (
          <article className="service-output" role="status" aria-live="polite" aria-atomic="true" data-feedback-state="success">
            <header>
              <span><Check size={18} aria-hidden="true" /></span>
              <div><small>{copy.ready}</small><h2>{service.outputTitle}</h2></div>
              <button type="button" onClick={reset}>{copy.restart}</button>
            </header>
            <div className="service-output__canvas">
              <aside>{copy.sampleSections.map((item, index) => <button type="button" className={index === 0 ? "is-active" : ""} key={item}><span>{index + 1}</span>{item}</button>)}</aside>
              <div>
                <span className="service-output__eyebrow">{service.eyebrow}</span>
                <h3>{copy.sampleTitle}</h3>
                <p className="service-output__request">{prompt || service.starters[0]}</p>
                <div className="service-output__block"><WandSparkles size={16} aria-hidden="true" /><p>{copy.sampleBody}</p></div>
                <button type="button" className="service-output__open">{copy.openOutput}<ArrowLeft size={14} aria-hidden="true" /></button>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      {/* 6 — How it works: four connected steps */}
      <section className="service-path-card">
        <header className="service-path-card__head">
          <Info size={14} aria-hidden="true" />
          <h2>{copy.pathTitle}</h2>
        </header>
        <ol className="service-path-card__steps">
          {copy.path.map((step, index) => {
            const complete = status === "ready" || (status === "working" && index < 1);
            const current = !complete && index === (status === "working" ? 1 : 0);
            return (
              <li key={step} className={complete ? "is-complete" : current ? "is-current" : undefined}>
                <span>{complete ? <Check size={12} aria-hidden="true" /> : `0${index + 1}`}</span>
                <p>{step}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 7 — Transparency note */}
      <div className="service-trust" role="note">
        <ShieldCheck size={14} aria-hidden="true" />
        <p>{copy.trust}</p>
      </div>

      {/* 8 + 9 — Quick starts + from your library */}
      <section className="service-lower">
        <div className="service-lower__group">
          <header className="service-lower__head">
            <h2>{copy.templates}</h2>
            <p>{copy.templatesHint}</p>
          </header>
          <div className="service-starters">
            {templates.map(({ title, icon: StarterIcon }) => (
              <button type="button" key={title} onClick={() => quickFill(title)}>
                <span className="service-starters__lead">
                  <span className="service-starters__icon"><StarterIcon size={16} aria-hidden="true" /></span>
                  <strong>{title}</strong>
                </span>
                <ArrowLeft size={12} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="service-lower__group">
          <header className="service-lower__head">
            <h2>{copy.recent}</h2>
            <p>{copy.recentHint}</p>
          </header>
          <div className="service-mini-library">
            <Link href={libraryHref}>
              <span className="service-mini-library__icon"><FileText size={18} aria-hidden="true" /></span>
              <span className="service-mini-library__body">
                <strong>{service.starters[0]}</strong>
                <small><Clock size={12} aria-hidden="true" />{copy.recentEdited}</small>
              </span>
              <ArrowLeft size={12} aria-hidden="true" />
            </Link>
            <Link href={libraryHref}>
              <span className="service-mini-library__icon">{serviceId === "code" ? <Code2 size={18} aria-hidden="true" /> : serviceId === "analyze" ? <ChartNoAxesCombined size={18} aria-hidden="true" /> : serviceId === "explore" ? <Compass size={18} aria-hidden="true" /> : <FileText size={18} aria-hidden="true" />}</span>
              <span className="service-mini-library__body">
                <strong>{service.outputTitle}</strong>
                <small><Clock size={12} aria-hidden="true" />{copy.recentSaved}</small>
              </span>
              <ArrowLeft size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Fade under the floating dock (mobile only) */}
      <div className="service-space__veil" aria-hidden="true" />
    </div>
  );
}
