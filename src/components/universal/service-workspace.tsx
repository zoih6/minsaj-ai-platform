"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  FileText,
  Globe2,
  GraduationCap,
  Image as ImageIcon,
  LayoutGrid,
  LoaderCircle,
  MessageCircle,
  Mic,
  Palette,
  Paperclip,
  Play,
  Plus,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import type { Locale } from "@nasaq/contracts";
import { ActivityFeedback } from "@/components/universal/activity-feedback";
import { getUniversalService, type UniversalServiceId } from "@/lib/universal-content";

import { ScrollFx } from "@/components/universal/scroll-fx";
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
  ask: ["سياق ذكي", "ملفات", "صوت"],
  learn: ["شرح تفاعلي", "اختبار فهم", "خطة تقدّم"],
  research: ["بحث الويب", "مصادر أكاديمية", "توثيق"],
  create: ["مستند", "صور", "لوحة إبداع"],
  code: ["محرر كود", "معاينة", "فحص أخطاء"],
  analyze: ["جداول", "رسوم", "تحقق بيانات"],
  explore: ["مواضيع منتقاة", "خريطة أفكار", "رحلات معرفية"],
};

const serviceToolsEn: Record<UniversalServiceId, readonly string[]> = {
  ask: ["Smart context", "Files", "Voice"],
  learn: ["Interactive explanation", "Knowledge checks", "Progress path"],
  research: ["Web research", "Academic sources", "Citations"],
  create: ["Document", "Images", "Creative canvas"],
  code: ["Code editor", "Preview", "Error checks"],
  analyze: ["Tables", "Charts", "Data checks"],
  explore: ["Curated topics", "Idea map", "Knowledge trails"],
};

export function ServiceWorkspace({ locale, serviceId }: { locale: Locale; serviceId: UniversalServiceId }) {
  const service = getUniversalService(locale, serviceId);
  const Icon = serviceIcons[serviceId];
  const isArabic = locale === "ar";
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"guided" | "fast">("guided");
  const [status, setStatus] = useState<"idle" | "working" | "ready" | "error">("idle");
  const timerRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const tools = isArabic ? serviceTools[serviceId] : serviceToolsEn[serviceId];

  const copy = isArabic
    ? {
        back: "العودة إلى مساحتي",
        interactive: "مساحة تفاعلية",
        guided: "موجّه",
        fast: "سريع",
        guidedHint: "يسألك نَسَق أسئلة قصيرة لتحسين النتيجة.",
        fastHint: "ابدأ فورًا بأقل عدد من الخطوات.",
        newSession: "جلسة جديدة",
        title: "ابدأ من مقصدك",
        start: "ابدأ الآن",
        attach: "أضف ملفًا أو صورة",
        voice: "إدخال صوتي",
        working: "نَسَق يجهّز المساحة المناسبة…",
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
        pathTitle: "كيف سيعمل نَسَق؟",
        path: ["يفهم الهدف والسياق", "يقترح الشكل والأدوات", "ينجز مع نقاط مراجعة", "يقدّم مخرجًا قابلًا للتحرير"],
        transparent: "لا خدمة خارجية تعمل في هذا النموذج. كل الحالات المعروضة محاكاة واضحة.",
        templates: "بدايات سريعة",
        templatesBody: "قوالب خفيفة يمكنك تعديلها قبل البدء.",
        recent: "من مكتبتك",
        recentBody: "أعمال مرتبطة بهذه المساحة.",
        sampleTitle: "مسودة تفاعلية",
        sampleSections: ["ما فهمته من طلبك", "المسار المقترح", "الخطوة التالية"],
        sampleBody: "هذا مخرج تجريبي يوضح كيف تتحول المهمة إلى مساحة عمل مناسبة بدل بقائها داخل رسالة واحدة.",
      }
    : {
        back: "Back to my space",
        interactive: "Interactive space",
        guided: "Guided",
        fast: "Fast",
        guidedHint: "Nasaq asks a few useful questions to improve the outcome.",
        fastHint: "Begin immediately with the fewest possible steps.",
        newSession: "New session",
        title: "Start with your intent",
        start: "Start now",
        attach: "Add a file or image",
        voice: "Voice input",
        working: "Nasaq is preparing the right space…",
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
        pathTitle: "How will Nasaq work?",
        path: ["Understand the goal and context", "Suggest the right form and tools", "Work with review points", "Deliver an editable outcome"],
        transparent: "No external service runs in this prototype. Every state shown is an explicit simulation.",
        templates: "Quick starts",
        templatesBody: "Lightweight templates you can edit before beginning.",
        recent: "From your library",
        recentBody: "Work connected to this space.",
        sampleTitle: "Interactive draft",
        sampleSections: ["What I understood", "Suggested path", "Next step"],
        sampleBody: "This simulated output shows how a task becomes an appropriate workspace instead of staying trapped in a single message.",
      };

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

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

  const templates = service.starters.map((starter, index) => ({
    title: starter,
    icon: index === 0 ? Sparkles : index === 1 ? FileText : LayoutGrid,
  }));

  return (
    <div className="service-space" data-service={serviceId}>
      <ScrollFx />
      <header className="service-space__header">
        <div>
          <Link href={`/${locale}/app/home`} className="service-space__back"><ArrowLeft size={14} />{copy.back}</Link>
          <span className="service-space__eyebrow"><Icon size={15} />{service.eyebrow}<i />{copy.interactive}</span>
          <h1>{service.label}</h1>
          <p>{service.description}</p>
        </div>
        <button type="button" className="service-space__new" onClick={reset}><Plus size={16} />{copy.newSession}</button>
      </header>

      <div className="service-tool-row" aria-label={isArabic ? "أدوات هذه المساحة" : "Tools in this space"}>
        {tools.map((tool, index) => <span key={tool}>{index === 0 ? <BrainCircuit size={14} /> : index === 1 ? <Globe2 size={14} /> : <ShieldCheck size={14} />}{tool}</span>)}
        <small><CheckCircle2 size={13} />{isArabic ? "تتغير الأدوات حسب طلبك" : "Tools adapt to your request"}</small>
      </div>

      <section className="service-studio">
        <div className="service-studio__main">
          <div className="service-mode-switch" role="tablist" aria-label={isArabic ? "طريقة البدء" : "Starting mode"}>
            <button type="button" role="tab" aria-selected={mode === "guided"} className={mode === "guided" ? "is-active" : ""} onClick={() => setMode("guided")}><WandSparkles size={15} /><span><strong>{copy.guided}</strong><small>{copy.guidedHint}</small></span></button>
            <button type="button" role="tab" aria-selected={mode === "fast"} className={mode === "fast" ? "is-active" : ""} onClick={() => setMode("fast")}><Play size={15} /><span><strong>{copy.fast}</strong><small>{copy.fastHint}</small></span></button>
          </div>

          <div className="service-prompt-area">
            <span className="service-prompt-area__orb"><Icon size={24} /></span>
            <div><small>{service.eyebrow}</small><h2>{copy.title}</h2></div>
            <textarea ref={textareaRef} rows={5} value={prompt} onChange={(event) => { cancelPendingRun(); setPrompt(event.target.value); setStatus("idle"); }} placeholder={service.prompt} aria-label={service.prompt} aria-invalid={status === "error"} aria-describedby={status === "error" ? "service-request-error" : undefined} />
            <div className="service-prompt-area__bottom">
              <div><button type="button" aria-label={copy.attach}><Paperclip size={17} />{copy.attach}</button><button type="button" aria-label={copy.voice}><Mic size={17} />{copy.voice}</button></div>
              <button type="button" className="service-start-button" onClick={start} disabled={status === "working"} data-loading={status === "working"}>{status === "working" ? copy.workingShort : copy.start}{status === "working" ? <LoaderCircle size={17} /> : <ArrowUp size={17} />}</button>
            </div>
          </div>

          {status === "working" ? <ActivityFeedback state="working" className="service-working" label={copy.simulation} title={copy.working} description={tools.join(" · ")} progressLabel={copy.progress} /> : null}
          {status === "error" ? <ActivityFeedback id="service-request-error" state="error" label={copy.validationLabel} title={copy.validationTitle} description={copy.validationBody} action={<button type="button" onClick={() => textareaRef.current?.focus()}>{copy.returnToPrompt}</button>} /> : null}
          {status === "ready" ? (
            <article className="service-output" role="status" aria-live="polite" aria-atomic="true" data-feedback-state="success">
              <header><span><Check size={18} /></span><div><small>{copy.ready}</small><h2>{service.outputTitle}</h2></div><button type="button" onClick={reset}>{copy.restart}</button></header>
              <div className="service-output__canvas">
                <aside>{copy.sampleSections.map((item, index) => <button type="button" className={index === 0 ? "is-active" : ""} key={item}><span>{index + 1}</span>{item}</button>)}</aside>
                <div><span>{service.eyebrow}</span><h3>{copy.sampleTitle}</h3><p>{prompt || service.starters[0]}</p><div className="service-output__block"><WandSparkles size={18} /><p>{copy.sampleBody}</p></div><button type="button">{copy.openOutput}<ArrowLeft size={15} /></button></div>
              </div>
            </article>
          ) : null}
        </div>

        <aside className="service-path-card">
          <div className="service-path-card__head"><span><Sparkles size={17} /></span><div><small>{mode === "guided" ? copy.guided : copy.fast}</small><h2>{copy.pathTitle}</h2></div></div>
          <ol>{copy.path.map((step, index) => <li className={status === "ready" || (status === "working" && index < 2) ? "is-complete" : index === 0 ? "is-current" : ""} key={step}><span>{status === "ready" || (status === "working" && index < 2) ? <Check size={12} /> : index + 1}</span><p>{step}</p></li>)}</ol>
          <div className="service-path-card__note"><ShieldCheck size={15} /><p>{copy.transparent}</p></div>
        </aside>
      </section>

      {status === "idle" || status === "error" ? (
        <section className="service-lower-grid">
          <div>
            <header><span>{copy.templates}</span><p>{copy.templatesBody}</p></header>
            <div className="service-template-grid">{templates.map(({ title, icon: TemplateIcon }) => <button type="button" onClick={() => { cancelPendingRun(); setPrompt(title); setStatus("idle"); }} key={title}><span><TemplateIcon size={18} /></span><strong>{title}</strong><ArrowLeft size={14} /></button>)}</div>
          </div>
          <div>
            <header><span>{copy.recent}</span><p>{copy.recentBody}</p></header>
            <div className="service-mini-library">
              <Link href={`/${locale}/app/library`}><span>{serviceId === "create" ? <ImageIcon size={18} /> : serviceId === "learn" ? <BookOpenCheck size={18} /> : <FileText size={18} />}</span><div><strong>{service.starters[0]}</strong><small>{isArabic ? "آخر تعديل هذا الأسبوع" : "Edited this week"}</small></div><ArrowLeft size={14} /></Link>
              <Link href={`/${locale}/app/library`}><span>{serviceId === "code" ? <Code2 size={18} /> : serviceId === "analyze" ? <ChartNoAxesCombined size={18} /> : <Compass size={18} />}</span><div><strong>{service.outputTitle}</strong><small>{isArabic ? "محفوظ في مكتبتي" : "Saved in my library"}</small></div><ArrowLeft size={14} /></Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
