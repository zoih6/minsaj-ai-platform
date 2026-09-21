"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  Brain,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  Clock,
  Code2,
  Compass,
  FileText,
  Globe2,
  GraduationCap,
  Info,
  LayoutGrid,
  ListTree,
  LoaderCircle,
  MessageCircle,
  Mic,
  Network,
  Palette,
  Paperclip,
  Plus,
  Scale,
  Search,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import { ActivityFeedback } from "@/components/universal/activity-feedback";
import { getUniversalService, type UniversalServiceId } from "@/lib/universal-content";

const serviceIcons = {
  ask: MessageCircle,
  learn: GraduationCap,
  research: SearchCheck,
  create: Palette,
  code: Code2,
  analyze: ChartNoAxesCombined,
  explore: Compass,
} satisfies Record<UniversalServiceId, typeof MessageCircle>;

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

type ComposerTool = { icon: LucideIcon; label: string; smart?: boolean };

export function ServiceWorkspace({ locale, serviceId }: { locale: Locale; serviceId: UniversalServiceId }) {
  const service = getUniversalService(locale, serviceId);
  const Icon = serviceIcons[serviceId];
  const isArabic = locale === "ar";
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"guided" | "fast">("guided");
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  /* Composer affordances: the ask gateway follows the reference tool row
     (attach · voice · smart context); sibling services keep their capability
     meta on the same affordance slots. */
  const composerTools: ComposerTool[] = serviceId === "ask"
    ? [
        { icon: Paperclip, label: isArabic ? "إرفاق ملف" : "Attach a file" },
        { icon: Mic, label: isArabic ? "تسجيل صوتي" : "Voice input" },
        { icon: Brain, label: isArabic ? "سياق ذكي" : "Smart context", smart: true },
      ]
    : (isArabic ? serviceTools[serviceId] : serviceToolsEn[serviceId]).map((tool, index) => ({
        icon: [BrainCircuit, Globe2, ShieldCheck][index] ?? BrainCircuit,
        label: tool,
      }));

  const starterIcons: LucideIcon[] = serviceId === "ask"
    ? [Network, Scale, ListTree]
    : [Sparkles, FileText, LayoutGrid];

  const copy = isArabic
    ? {
        searchPlaceholder: "ابحث في محادثاتك ومساحاتك…",
        interactive: "مساحة تفاعلية مرنة",
        guided: "موّجه",
        fast: "سريع",
        guidedHint: "خطوة بخطوة",
        fastHint: "إنجاز فوري",
        newSession: "جلسة جديدة",
        title: "ابدأ من مقصدك",
        start: "إرسال",
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
        pathTitle: "كيف يعالج منسج طلبك؟",
        path: ["يحلل الهدف والسياق بدقة", "يقترح الأدوات والشكل الأنسب", "يُنجز المهمة مع مراجعات مرحلية"],
        transparent: "هذا النموذج يعمل محليًا للحفاظ على خصوصيتك. البيانات لا تُرسال لخدمات خارجية.",
        templates: "بدايات سريعة",
        recent: "من مكتبتك",
        recentEdited: "آخر تعديل هذا الأسبوع",
        recentSaved: "محفوظ في مكتبتي",
        sampleTitle: "مسودة تفاعلية",
        sampleSections: ["ما فهمته من طلبك", "المسار المقترح", "الخطوة التالية"],
        sampleBody: "هذا مخرج تجريبي يوضح كيف تتحول المهمة إلى مساحة عمل مناسبة بدل بقائها داخل رسالة واحدة.",
      }
    : {
        searchPlaceholder: "Search your chats and spaces…",
        interactive: "Flexible interactive space",
        guided: "Guided",
        fast: "Fast",
        guidedHint: "Step by step",
        fastHint: "Instant results",
        newSession: "New session",
        title: "Start with your intent",
        start: "Send",
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
        pathTitle: "How does Minsaj process your request?",
        path: ["Analyzes the goal and context precisely", "Proposes the right tools and format", "Delivers with staged reviews"],
        transparent: "This prototype runs locally to protect your privacy. No data is sent to external services.",
        templates: "Quick starts",
        recent: "From your library",
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

  const libraryHref = `/${locale}/app/library`;
  const templates = service.starters.map((title, index) => ({ title, icon: starterIcons[index] ?? Sparkles }));

  return (
    <div className="service-space" data-service={serviceId}>
      {/* Quick search — opens the shell command palette */}
      <button type="button" className="service-search" onClick={() => window.dispatchEvent(new CustomEvent("minsaj:command-open"))} aria-label={copy.searchPlaceholder}>
        <Search size={16} aria-hidden="true" />
        <span>{copy.searchPlaceholder}</span>
      </button>

      {/* Welcome — badge · gradient title · lede · new session */}
      <section className="service-welcome">
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

      {/* Stage — transparent wrappers on mobile; studio grid on desktop.
          Same sections, same order, re-flowed not redesigned. */}
      <div className="service-stage">
        <div className="service-stage__main">
          {/* Starting mode — segmented control */}
          <div className="service-mode-switch" role="tablist" aria-label={isArabic ? "طريقة البدء" : "Starting mode"}>
            <button type="button" role="tab" aria-selected={mode === "guided"} className={mode === "guided" ? "is-active" : ""} onClick={() => setMode("guided")}>
              <span className="service-mode-switch__label"><WandSparkles size={16} aria-hidden="true" /><strong>{copy.guided}</strong></span>
              <small>{copy.guidedHint}</small>
            </button>
            <button type="button" role="tab" aria-selected={mode === "fast"} className={mode === "fast" ? "is-active" : ""} onClick={() => setMode("fast")}>
              <span className="service-mode-switch__label"><Zap size={16} aria-hidden="true" /><strong>{copy.fast}</strong></span>
              <small>{copy.fastHint}</small>
            </button>
          </div>

      {/* The composer — the one glowing container on the stage */}
      <div className="service-composer-zone">
        <div className="service-prompt-shell">
          <div className="service-prompt-area">
            <div className="service-prompt-area__head">
              <span className="service-prompt-area__orb"><Icon size={12} aria-hidden="true" /></span>
              <h2>{copy.title}</h2>
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
                {composerTools.map(({ icon: ToolIcon, label, smart }) => (
                  <button type="button" key={label} title={label} aria-label={label} className={smart ? "is-smart" : undefined}>
                    <ToolIcon size={16} aria-hidden="true" />
                  </button>
                ))}
              </div>
              <button type="button" className="service-start-button" onClick={start} disabled={status === "working"} data-loading={status === "working"}>
                <span>{status === "working" ? copy.workingShort : copy.start}</span>
                {status === "working" ? <LoaderCircle size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {status === "working" ? <ActivityFeedback state="working" className="service-working" label={copy.simulation} title={copy.working} description={composerTools.map((tool) => tool.label).join(" · ")} progressLabel={copy.progress} /> : null}
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
        </div>
        </div>

        <aside className="service-stage__rail">
          {/* How it works — connected stepper + privacy note */}
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
                <span>{complete ? <Check size={12} aria-hidden="true" /> : index + 1}</span>
                <p>{step}</p>
              </li>
            );
          })}
        </ol>
        <footer className="service-path-card__note">
          <ShieldCheck size={12} aria-hidden="true" />
          <p>{copy.transparent}</p>
          </footer>
          </section>

          {/* Quick starts + library — quiet rows */}
          {status === "idle" || status === "error" ? (
            <section className="service-lower">
          <div className="service-lower__group">
            <header className="service-lower__head"><h2>{copy.templates}</h2></header>
            <div className="service-starters">
              {templates.map(({ title, icon: StarterIcon }) => (
                <button type="button" key={title} onClick={() => quickFill(title)}>
                  <span className="service-starters__lead">
                    <span className="service-starters__icon"><StarterIcon size={14} aria-hidden="true" /></span>
                    <strong>{title}</strong>
                  </span>
                  <ArrowLeft size={12} aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
          <div className="service-lower__group">
            <header className="service-lower__head"><h2>{copy.recent}</h2></header>
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
          ) : null}
        </aside>
      </div>

      {/* Fade under the floating dock (mobile only) */}
      <div className="service-space__veil" aria-hidden="true" />
    </div>
  );
}
