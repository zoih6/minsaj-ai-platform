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
  X,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Locale } from "@minsaj/contracts";
import { ActivityFeedback, FeedbackToast } from "@/components/universal/activity-feedback";
import { getUniversalService, type ServiceToolIconKey, type UniversalServiceId } from "@/lib/universal-content";

const serviceIcons = {
  ask: Brain,
  learn: GraduationCap,
  research: Compass,
  create: FileText,
  code: Code2,
  analyze: ChartNoAxesCombined,
  explore: Compass,
} satisfies Record<UniversalServiceId, typeof Brain>;

/* Icon keys are data (universal-content.ts); this map is the single place
   that resolves them to lucide components — architecture A-5: the gateway
   consumes data, not hard-coded arrays. */
const toolIconMap: Record<ServiceToolIconKey, LucideIcon> = {
  text: FileText,
  mic: Mic,
  brain: Brain,
  lightbulb: Lightbulb,
  list: ListTree,
  route: Route,
  network: Network,
  check: Check,
  code: FileCode,
  eye: Eye,
  sparkles: Sparkles,
  terminal: Terminal,
  bug: Bug,
  table: Table,
  chart: ChartNoAxesCombined,
  shield: ShieldCheck,
  compass: Compass,
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

/* Session state machine (interaction-logic §4, extended 2026-09-21 with the
   guided clarify phase): idle → composing (typing) → error (empty send) →
   clarifying (guided: 3 questions + plan preview) → working → ready → saved.
   Fast mode sends composing → working directly. Every transition keeps the
   composer's draft intact; only reset() clears it. */
type GatewayStatus = "idle" | "error" | "working" | "clarifying" | "ready" | "saved";

function formatClip(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function ServiceWorkspace({ locale, serviceId }: { locale: Locale; serviceId: UniversalServiceId }) {
  const service = getUniversalService(locale, serviceId);
  const Icon = serviceIcons[serviceId];
  const isArabic = locale === "ar";

  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<"guided" | "fast">("guided");
  const [activeTools, setActiveTools] = useState<readonly string[]>([service.tools[0].id]);
  const [status, setStatus] = useState<GatewayStatus>("idle");
  const [clarifyStep, setClarifyStep] = useState(0);
  const [clarifyAnswers, setClarifyAnswers] = useState<(string | null)[]>([null, null, null]);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number } | null>(null);
  const [voiceClip, setVoiceClip] = useState<number | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [qualityStandard, setQualityStandard] = useState<string | null>(null);
  const [outputSection, setOutputSection] = useState(0);
  const [savedItems, setSavedItems] = useState<{ id: number; title: string; when: string }[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);
  const toastRef = useRef<number | null>(null);
  const voiceTickRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  /* Lead tool (interaction-logic §2): with multi-select active (FR-2.2), the
     most recently selected tool drives the four commitments — hint, output
     shape, quick starts, affordances. Deselecting the lead falls back to the
     remaining tail. Deterministic and explainable in the UI. */
  const leadTool = service.tools.find((tool) => tool.id === activeTools[activeTools.length - 1]) ?? service.tools[0];
  const tools = service.tools.map((tool) => ({ ...tool, icon: toolIconMap[tool.iconKey] }));
  const activeToolLabels = activeTools
    .map((id) => service.tools.find((tool) => tool.id === id)?.label)
    .filter((label): label is string => typeof label === "string");

  const showFileAffordance = leadTool.affordances.includes("file");
  const showVoiceAffordance = leadTool.affordances.includes("voice");
  const showQualityAffordance = leadTool.affordances.includes("quality");

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
        toolsHint: "كل أداة تضبط التلميح والمخرج والبدايات والإتاحات",
        modeTitle: "اختيار أسلوب التنفيذ",
        title: "ابدأ من مقصدك",
        attach: "أضف ملفًا أو صورة",
        attachAria: "أضف ملفًا أو صورة إلى الطلب",
        voice: "إدخال صوتي",
        voiceStart: "بدء التسجيل الصوتي",
        voiceStop: "إيقاف التسجيل الصوتي",
        voiceClip: "مقطع صوتي",
        quality: "معيار الجودة",
        qualityPlaceholder: "اختر المعيار…",
        qualityOptions: ["اتساق البيانات", "اكتمال الحقول", "دقة المصادر"],
        removeAttachment: "إزالة المرفق",
        closeLabel: "إغلاق التنبيه",
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
        restart: "ابدأ من جديد",
        save: "حفظ في المكتبة",
        saved: "محفوظ في المكتبتك",
        savedToast: "أُضيف إلى مكتبتك",
        savedNow: "حفظ الآن",
        pathTitle: "كيف سيعمل منسج؟",
        path: ["يفهم الهدف والسياق", "يقترح الشكل والأدوات", "ينجز مع نقاط مراجعة", "يقدّم مخرجًا قابلًا للتحرير"],
        trust: "لا خدمة خارجية تعمل في هذا النموذج. كل الحالات المعروضة محاكاة واضحة.",
        templates: "بدايات سريعة",
        templatesHint: "خاصة بالأداة المختارة — نقرة واحدة تعبّئ الطلب.",
        recent: "من مكتبتك",
        recentHint: "أعمال مرتبطة بهذه المساحة.",
        recentEdited: "آخر تعديل هذا الأسبوع",
        recentSaved: "محفوظ في مكتبتي",
        sampleTitle: "مسودة تفاعلية",
        sampleSections: ["ما فهمته من طلبك", "المسار المقترح", "الخطوة التالية"],
        sampleBodies: [
          "طلبك مفهوم بهذه التركيبة: الأداة والأسلوب والإتاحات أعلاه — وسيلتزم بها منسج قبل أي تنفيذ.",
          "المسار: جمع السياق، ثم المعالجة بأدواتك المختارة، ثم مراجعة قابلة للتعديل قبل الاعتماد.",
          "راجع المخرج وعدّله، أو احفظه في مكتبتك لتستأنفه لاحقًا من حيث توقفت.",
        ],
        outputConfigTool: "الأداة",
        outputConfigMode: "الأسلوب",
        clarifyLabel: "أسئلة توضيحية قبل التنفيذ",
        clarifyProgress: "خطوة",
        clarifyNextHint: "اختر الأنسب — أو اضغط «التالي» للتخطي",
        next: "التالي",
        execute: "نفّذ",
        executeNow: "نفّذ الآن",
        cancelClarify: "إلغاء والعودة للطلب",
        planTitle: "معاينة الخطة",
        planHint: "هكذا سيعمل منسج على طلبك — عدّل إجاباتك بالعودة للخلف أو نفّذ.",
        planTool: "الأدوات",
        planMode: "الأسلوب",
        planScope: "النطاق",
        planAudience: "الجمهور",
        planShape: "شكل المخرج",
        planAttachments: "الإتاحات",
        planDefault: "حسب اقتراح منسج",
        questions: [
          { q: "ما نطاق المهمة؟", hint: "يحدد عمق المعالجة وعدد الخطوات." },
          { q: "لمن ستُصاغ النتيجة؟", hint: "يضبط الأسلوب ومستوى التفصيل." },
          { q: "ما الشكل المفضل للمخرج؟", hint: "يحدد هيكل النتيجة النهائية." },
        ],
        scopeOptions: ["ضيّق ومحدد", "متوازن", "شامل وعميق"],
        audienceOptions: ["لي شخصيًا", "لفريقي", "لجمهور خارجي"],
        shapeOptions: ["نص موجز", "تفصيل بالخطوات"],
        toolHintTemplate: (tool: string) => `التلميح والمخرج والبدايات أدناه صارت خاصة بأداة «${tool}»`,
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
        toolsHint: "Each tool sets the hint, output, quick starts, and inputs",
        modeTitle: "Choose the execution style",
        title: "Start with your intent",
        attach: "Add a file or image",
        attachAria: "Attach a file or image to the request",
        voice: "Voice input",
        voiceStart: "Start voice recording",
        voiceStop: "Stop voice recording",
        voiceClip: "Voice clip",
        quality: "Quality standard",
        qualityPlaceholder: "Pick a standard…",
        qualityOptions: ["Data consistency", "Field completeness", "Source accuracy"],
        removeAttachment: "Remove attachment",
        closeLabel: "Dismiss notification",
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
        restart: "Start again",
        save: "Save to library",
        saved: "Saved in your library",
        savedToast: "Added to your library",
        savedNow: "Saved just now",
        pathTitle: "How will Minsaj work?",
        path: ["Understands the goal and context", "Proposes the format and tools", "Executes with review checkpoints", "Delivers an editable output"],
        trust: "No external service runs in this prototype. Every state shown is a clear simulation.",
        templates: "Quick starts",
        templatesHint: "Tied to the selected tool — one click fills the request.",
        recent: "From your library",
        recentHint: "Work tied to this space.",
        recentEdited: "Edited this week",
        recentSaved: "Saved in my library",
        sampleTitle: "Interactive draft",
        sampleSections: ["What I understood", "Suggested path", "Next step"],
        sampleBodies: [
          "Your request is understood with this composition: the tool, style, and inputs above — Minsaj commits to them before executing.",
          "The path: gather context, process with your selected tools, then an editable review before anything is adopted.",
          "Review and edit the output, or save it to your library to resume later exactly where you stopped.",
        ],
        outputConfigTool: "Tool",
        outputConfigMode: "Style",
        clarifyLabel: "Clarifying questions before execution",
        clarifyProgress: "Step",
        clarifyNextHint: "Pick what fits — or press “Next” to skip",
        next: "Next",
        execute: "Execute",
        executeNow: "Execute now",
        cancelClarify: "Cancel and return to the request",
        planTitle: "Plan preview",
        planHint: "This is how Minsaj will work on your request — go back to adjust, or execute.",
        planTool: "Tools",
        planMode: "Style",
        planScope: "Scope",
        planAudience: "Audience",
        planShape: "Output shape",
        planAttachments: "Inputs",
        planDefault: "As Minsaj suggests",
        questions: [
          { q: "What is the scope of the task?", hint: "Sets the depth and number of steps." },
          { q: "Who is the result for?", hint: "Sets tone and level of detail." },
          { q: "What output shape do you prefer?", hint: "Sets the structure of the final result." },
        ],
        scopeOptions: ["Narrow and specific", "Balanced", "Broad and deep"],
        audienceOptions: ["Just me", "My team", "An outside audience"],
        shapeOptions: ["Concise text", "Step-by-step detail"],
        toolHintTemplate: (tool: string) => `The hint, output, and quick starts below now follow the “${tool}” tool`,
      };

  /* Guided questions — the third question's first option is the lead tool's
     own output shape (interaction-logic §3: معاينة الخطة tied to the tool). */
  const clarifyQuestions = [
    { ...copy.questions[0], options: copy.scopeOptions },
    { ...copy.questions[1], options: copy.audienceOptions },
    { ...copy.questions[2], options: [leadTool.outputTitle, ...copy.shapeOptions] },
  ];

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    if (toastRef.current !== null) window.clearTimeout(toastRef.current);
    if (voiceTickRef.current !== null) window.clearInterval(voiceTickRef.current);
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

  /* Voice mock (I-9): a visible recording state with a live timer. Stopping
     keeps the clip as an attachment chip; the simulation never pretends to
     transcribe — the trust note covers it. */
  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    voiceTickRef.current = window.setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);
    return () => {
      if (voiceTickRef.current !== null) window.clearInterval(voiceTickRef.current);
      voiceTickRef.current = null;
    };
  }, [recording]);

  useEffect(() => {
    if (toast === null) return;
    if (toastRef.current !== null) window.clearTimeout(toastRef.current);
    toastRef.current = window.setTimeout(() => setToast(null), 3200);
    return () => {
      if (toastRef.current !== null) window.clearTimeout(toastRef.current);
      toastRef.current = null;
    };
  }, [toast]);

  function cancelPendingRun() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  /* FR-2.2: multi-select stays, but at least one tool is always active —
     deselecting the last remaining tool is a no-op. */
  function toggleTool(id: string) {
    setActiveTools((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current;
        return current.filter((item) => item !== id);
      }
      return [...current, id];
    });
  }

  /* Switching the execution style mid-clarify returns to composing with the
     draft intact — a visible, explainable behavior (documented §3). */
  function selectMode(next: "guided" | "fast") {
    if (mode === next) return;
    setMode(next);
    if (status === "clarifying") setStatus("idle");
  }

  function run() {
    cancelPendingRun();
    setStatus("working");
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setOutputSection(0);
      setStatus("ready");
    }, 820);
  }

  function start() {
    cancelPendingRun();
    if (!prompt.trim()) {
      setStatus("error");
      window.requestAnimationFrame(() => textareaRef.current?.focus());
      return;
    }
    if (mode === "guided") {
      setClarifyStep(0);
      setClarifyAnswers([null, null, null]);
      setStatus("clarifying");
      return;
    }
    run();
  }

  /* Composer button doubles as the guided stepper (§3: «التالي» ثم «نفّذ»). */
  function onComposerButton() {
    if (status === "clarifying") {
      if (clarifyStep < 3) advanceClarify(null);
      else run();
      return;
    }
    start();
  }

  function advanceClarify(answer: string | null) {
    if (answer !== null) {
      setClarifyAnswers((current) => {
        const next = [...current];
        next[clarifyStep] = answer;
        return next;
      });
    }
    setClarifyStep((step) => Math.min(step + 1, 3));
  }

  function cancelClarify() {
    setStatus("idle");
    window.requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function reset() {
    cancelPendingRun();
    setPrompt("");
    setStatus("idle");
    setClarifyStep(0);
    setClarifyAnswers([null, null, null]);
    setAttachedFile(null);
    setVoiceClip(null);
    setRecording(false);
    setRecordSeconds(0);
    setQualityStandard(null);
    setOutputSection(0);
  }

  function quickFill(title: string) {
    cancelPendingRun();
    setPrompt(title);
    setStatus("idle");
    textareaRef.current?.focus();
  }

  /* I-6 / FR-4.2: saving is a real, observable session-local action — the
     item enters the strip below and the state machine lands on `saved`.
     Cross-route persistence stays out of scope (KI-5, by design). */
  function saveToLibrary() {
    const formatter = new Intl.DateTimeFormat(isArabic ? "ar" : "en", { hour: "2-digit", minute: "2-digit" });
    setSavedItems((current) => [
      { id: Date.now(), title: prompt.trim() || service.starters[0], when: formatter.format(new Date()) },
      ...current,
    ].slice(0, 4));
    setStatus("saved");
    setToast(copy.savedToast);
  }

  function onFilePicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setAttachedFile({ name: file.name, size: file.size });
    event.target.value = "";
  }

  function toggleRecording() {
    if (!recording) {
      setRecordSeconds(0);
      setRecording(true);
      return;
    }
    setRecording(false);
    if (recordSeconds > 0) setVoiceClip(recordSeconds);
    setRecordSeconds(0);
  }

  const base = `/${locale}/app`;
  const libraryHref = `${base}/library`;
  /* Quick starts follow the lead tool (commitment 3). */
  const starters = leadTool.starters.map((title, index) => ({ title, icon: starterIcons[serviceId][index] ?? Sparkles }));

  const attachmentSummary = [
    attachedFile ? attachedFile.name : null,
    voiceClip !== null ? `${copy.voiceClip} ${formatClip(voiceClip)}` : null,
    qualityStandard,
  ].filter((item): item is string => item !== null);

  const composerButtonLabel =
    status === "working" ? copy.workingShort
    : status === "clarifying" ? (clarifyStep < 3 ? copy.next : copy.execute)
    : copy.start;

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

      {/* 3 — Work mode: the service toolkit as selectable modes. Selecting a
          tool re-binds the composer hint, the expected output, the quick
          starts, and the affordance pills (interaction-logic §2). */}
      <section className="service-toolbelt" aria-labelledby="service-tools-title">
        <header className="service-section-head">
          <h2 id="service-tools-title">{copy.toolsTitle}</h2>
          <p>{copy.toolsHint}</p>
        </header>
        <div className="service-toolbelt__grid" role="group" aria-label={copy.toolsTitle}>
          {tools.map(({ id, label, icon: ToolIcon }) => {
            const active = activeTools.includes(id);
            const isLead = leadTool.id === id;
            return (
              <button
                type="button"
                key={id}
                className={active ? "service-tool is-on" : "service-tool"}
                aria-pressed={active}
                onClick={() => toggleTool(id)}
              >
                <span className="service-tool__icon"><ToolIcon size={17} aria-hidden="true" /></span>
                <strong>{label}</strong>
                <span className="service-tool__check" aria-hidden="true">{isLead ? <Check size={11} /> : null}</span>
              </button>
            );
          })}
        </div>
        <p className="service-toolbelt__lead" aria-live="polite">{copy.toolHintTemplate(leadTool.label)}</p>
      </section>

      {/* 4 — Execution style: guided vs fast. Plain toggle buttons with
          aria-pressed (the tab role without tabpanels was an ARIA
          anti-pattern) — FR-2.3 radio behavior, one active at a time. */}
      <section className="service-mode" aria-labelledby="service-mode-title">
        <header className="service-section-head">
          <h2 id="service-mode-title">{copy.modeTitle}</h2>
        </header>
        <div className="service-mode-switch" role="group" aria-label={copy.modeTitle}>
          <button type="button" aria-pressed={mode === "guided"} className={mode === "guided" ? "is-active" : ""} onClick={() => selectMode("guided")}>
            <span className="service-mode-switch__label"><WandSparkles size={16} aria-hidden="true" /><strong>{copy.guided}</strong></span>
            <small>{copy.guidedHint}</small>
          </button>
          <button type="button" aria-pressed={mode === "fast"} className={mode === "fast" ? "is-active" : ""} onClick={() => selectMode("fast")}>
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
              onChange={(event) => { cancelPendingRun(); setPrompt(event.target.value); if (status === "error" || status === "clarifying") setStatus("idle"); }}
              placeholder={leadTool.hint}
              aria-label={leadTool.hint}
              aria-invalid={status === "error"}
              aria-describedby={status === "error" ? "service-request-error" : undefined}
            />
            {attachedFile || voiceClip !== null || qualityStandard ? (
              <div className="service-attachments">
                {attachedFile ? (
                  <span className="service-attachment">
                    <Paperclip size={13} aria-hidden="true" />
                    <b>{attachedFile.name}</b>
                    <button type="button" onClick={() => setAttachedFile(null)} aria-label={copy.removeAttachment}><X size={13} /></button>
                  </span>
                ) : null}
                {voiceClip !== null ? (
                  <span className="service-attachment">
                    <Mic size={13} aria-hidden="true" />
                    <b>{copy.voiceClip} {formatClip(voiceClip)}</b>
                    <button type="button" onClick={() => setVoiceClip(null)} aria-label={copy.removeAttachment}><X size={13} /></button>
                  </span>
                ) : null}
                {qualityStandard ? (
                  <span className="service-attachment">
                    <ShieldCheck size={13} aria-hidden="true" />
                    <b>{qualityStandard}</b>
                    <button type="button" onClick={() => setQualityStandard(null)} aria-label={copy.removeAttachment}><X size={13} /></button>
                  </span>
                ) : null}
              </div>
            ) : null}
            <div className="service-prompt-area__bottom">
              <div className="service-prompt-area__tools">
                {showFileAffordance ? (
                  <>
                    <input ref={fileInputRef} type="file" className="service-file-input" onChange={onFilePicked} accept=".csv,.txt,.md,.json,.pdf,.docx,.png,.jpg,.jpeg,.webp" tabIndex={-1} aria-hidden="true" />
                    <button type="button" className="service-afford" title={copy.attach} aria-label={copy.attachAria} onClick={() => fileInputRef.current?.click()}>
                      <Paperclip size={15} aria-hidden="true" />
                      <span>{copy.attach}</span>
                    </button>
                  </>
                ) : null}
                {showVoiceAffordance ? (
                  <button type="button" className="service-afford" data-recording={recording ? "true" : "false"} title={recording ? copy.voiceStop : copy.voiceStart} aria-label={recording ? copy.voiceStop : copy.voiceStart} aria-pressed={recording} onClick={toggleRecording}>
                    <span className="service-afford__rec" aria-hidden="true" />
                    <span>{recording ? formatClip(recordSeconds) : copy.voice}</span>
                  </button>
                ) : null}
                {showQualityAffordance ? (
                  <label className="service-afford service-afford--select" title={copy.quality}>
                    <ShieldCheck size={15} aria-hidden="true" />
                    <select value={qualityStandard ?? ""} onChange={(event) => setQualityStandard(event.target.value || null)} aria-label={copy.quality}>
                      <option value="">{copy.qualityPlaceholder}</option>
                      {copy.qualityOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                  </label>
                ) : null}
              </div>
              <button type="button" className="service-start-button" onClick={onComposerButton} disabled={status === "working"} data-loading={status === "working"}>
                <span>{composerButtonLabel}</span>
                {status === "working" ? <LoaderCircle size={16} aria-hidden="true" /> : <ArrowUp size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {status === "working" ? <ActivityFeedback state="working" className="service-working" label={copy.simulation} title={copy.working} description={[activeToolLabels.join(" · "), ...attachmentSummary].filter(Boolean).join(" · ")} progressLabel={copy.progress} /> : null}
        {status === "error" ? <ActivityFeedback id="service-request-error" state="error" label={copy.validationLabel} title={copy.validationTitle} description={copy.validationBody} action={<button type="button" onClick={() => textareaRef.current?.focus()}>{copy.returnToPrompt}</button>} /> : null}

        {/* Guided clarify phase (FR-3.2): three short questions, then a plan
            preview — fast mode never sees this card (FR-3.3). */}
        {status === "clarifying" ? (
          <section className="service-clarify" role="group" aria-label={copy.clarifyLabel} aria-live="polite">
            {clarifyStep < 3 ? (
              <>
                <header className="service-clarify__head">
                  <span className="service-clarify__step">{copy.clarifyProgress} {clarifyStep + 1}/3</span>
                  <h3>{clarifyQuestions[clarifyStep].q}</h3>
                  <p>{clarifyQuestions[clarifyStep].hint} — {copy.clarifyNextHint}</p>
                </header>
                <div className="service-clarify__chips" role="group" aria-label={clarifyQuestions[clarifyStep].q}>
                  {clarifyQuestions[clarifyStep].options.map((option) => (
                    <button type="button" key={option} className={clarifyAnswers[clarifyStep] === option ? "is-on" : ""} aria-pressed={clarifyAnswers[clarifyStep] === option} onClick={() => advanceClarify(option)}>
                      {option}
                    </button>
                  ))}
                </div>
                <footer className="service-clarify__foot">
                  <button type="button" className="service-clarify__next" onClick={() => advanceClarify(null)}>
                    {copy.next}
                    {isArabic ? <ArrowLeft size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
                  </button>
                  <button type="button" className="service-clarify__cancel" onClick={cancelClarify}>{copy.cancelClarify}</button>
                </footer>
              </>
            ) : (
              <>
                <header className="service-clarify__head">
                  <span className="service-clarify__step">{copy.planTitle}</span>
                  <h3>{copy.planTitle}</h3>
                  <p>{copy.planHint}</p>
                </header>
                <ul className="service-plan">
                  <li><b>{copy.planTool}</b><span>{activeToolLabels.join(" · ")}</span></li>
                  <li><b>{copy.planMode}</b><span>{mode === "guided" ? copy.guided : copy.fast}</span></li>
                  <li><b>{copy.planScope}</b><span>{clarifyAnswers[0] ?? copy.planDefault}</span></li>
                  <li><b>{copy.planAudience}</b><span>{clarifyAnswers[1] ?? copy.planDefault}</span></li>
                  <li><b>{copy.planShape}</b><span>{clarifyAnswers[2] ?? leadTool.outputTitle}</span></li>
                  {attachmentSummary.length ? <li><b>{copy.planAttachments}</b><span>{attachmentSummary.join(" · ")}</span></li> : null}
                </ul>
                <footer className="service-clarify__foot">
                  <button type="button" className="service-clarify__next" onClick={run}>
                    {copy.executeNow}
                    {isArabic ? <ArrowLeft size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
                  </button>
                  <button type="button" className="service-clarify__cancel" onClick={cancelClarify}>{copy.cancelClarify}</button>
                </footer>
              </>
            )}
          </section>
        ) : null}

        {status === "ready" || status === "saved" ? (
          <article className="service-output" role="status" aria-live="polite" aria-atomic="true" data-feedback-state="success" data-saved={status === "saved" ? "true" : "false"}>
            <header>
              <span><Check size={18} aria-hidden="true" /></span>
              <div>
                <small>{status === "saved" ? copy.saved : copy.ready}</small>
                <h2>{leadTool.outputTitle}</h2>
              </div>
              <div className="service-output__actions">
                <button type="button" onClick={saveToLibrary} disabled={status === "saved"}>{status === "saved" ? copy.saved : copy.save}</button>
                <button type="button" onClick={reset}>{copy.restart}</button>
              </div>
            </header>
            <div className="service-output__canvas">
              <aside aria-label={copy.sampleTitle}>
                {copy.sampleSections.map((item, index) => (
                  <button type="button" className={outputSection === index ? "is-active" : ""} aria-pressed={outputSection === index} onClick={() => setOutputSection(index)} key={item}>
                    <span>{index + 1}</span>{item}
                  </button>
                ))}
              </aside>
              <div>
                <span className="service-output__eyebrow">{service.eyebrow}</span>
                <h3>{copy.sampleTitle}</h3>
                <p className="service-output__request">{prompt || service.starters[0]}</p>
                <ul className="service-output__config">
                  <li><b>{copy.outputConfigTool}</b><span>{activeToolLabels.join(" · ")}</span></li>
                  <li><b>{copy.outputConfigMode}</b><span>{mode === "guided" ? copy.guided : copy.fast}</span></li>
                  {attachmentSummary.length ? <li><b>{copy.planAttachments}</b><span>{attachmentSummary.join(" · ")}</span></li> : null}
                </ul>
                <div className="service-output__block"><WandSparkles size={16} aria-hidden="true" /><p>{copy.sampleBodies[outputSection] ?? copy.sampleBodies[0]}</p></div>
              </div>
            </div>
          </article>
        ) : null}
      </section>

      {/* 6 — How it works: four connected steps. During the guided clarify
          phase step 01 is live; working highlights 02; ready completes all. */}
      <section className="service-path-card">
        <header className="service-path-card__head">
          <Info size={14} aria-hidden="true" />
          <h2>{copy.pathTitle}</h2>
        </header>
        <ol className="service-path-card__steps">
          {copy.path.map((step, index) => {
            const complete = status === "ready" || status === "saved" || (status === "working" && index < 1);
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

      {/* 8 + 9 — Quick starts (lead-tool driven) + from your library.
          Saved items surface first (I-6): a saved element actually enters
          the strip — session-local by design (KI-5). */}
      <section className="service-lower">
        <div className="service-lower__group">
          <header className="service-lower__head">
            <h2>{copy.templates}</h2>
            <p>{copy.templatesHint}</p>
          </header>
          <div className="service-starters">
            {starters.map(({ title, icon: StarterIcon }) => (
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
            {savedItems.slice(0, 2).map((item) => (
              <Link href={libraryHref} key={item.id}>
                <span className="service-mini-library__icon"><FileText size={18} aria-hidden="true" /></span>
                <span className="service-mini-library__body">
                  <strong>{item.title}</strong>
                  <small><Clock size={12} aria-hidden="true" />{copy.savedNow} · {item.when}</small>
                </span>
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            ))}
            {savedItems.length === 0 ? (
              <Link href={libraryHref}>
                <span className="service-mini-library__icon"><FileText size={18} aria-hidden="true" /></span>
                <span className="service-mini-library__body">
                  <strong>{service.starters[0]}</strong>
                  <small><Clock size={12} aria-hidden="true" />{copy.recentEdited}</small>
                </span>
                <ArrowLeft size={12} aria-hidden="true" />
              </Link>
            ) : null}
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

      {toast !== null ? <FeedbackToast message={toast} closeLabel={copy.closeLabel} onDismiss={() => setToast(null)} tone="success" /> : null}
    </div>
  );
}
