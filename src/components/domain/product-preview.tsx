"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CircleDollarSign,
  Clock3,
  Database,
  FileCheck2,
  FileText,
  GitBranch,
  Globe2,
  ListChecks,
  LockKeyhole,
  MessageSquareText,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { Badge, NasaqMark } from "@nasaq/ui";
import type { Locale } from "@nasaq/contracts";

type Stage = "chat" | "agent" | "flow";
type ScenarioId = "market" | "document" | "content";
type RunStatus = "idle" | "running" | "approval" | "paused" | "completed";
type NodeState = "queued" | "ready" | "running" | "approval" | "paused" | "completed";

type Scenario = {
  label: string;
  project: string;
  prompt: string;
  answer: string;
  insights: readonly string[];
  plan: readonly string[];
  flowNodes: readonly string[];
};

const stageOrder: Stage[] = ["chat", "agent", "flow"];

const scenarios = {
  ar: {
    market: {
      label: "إطلاق سوق",
      project: "إطلاق الخدمة في السوق السعودي",
      prompt: "حلّل فرص إطلاق خدمة SaaS عربية للفرق الصغيرة، وافصل بين الدليل والافتراض.",
      answer: "تظهر الفرصة الأقوى لدى الفرق التي تجمع عدة أدوات ذكاء اصطناعي دون سياق أو حوكمة موحّدة. قبل التسعير، يلزم التحقق من تكلفة التشتت وحساسية مكان معالجة البيانات.",
      insights: ["مشكلة التشتت قابلة للقياس", "الخصوصية عامل شراء", "التسعير ما زال افتراضًا"],
      plan: ["تحديد فرضيات السوق", "جمع المصادر المحلية", "مقارنة البدائل", "صياغة مذكرة القرار"],
      flowNodes: ["سؤال السوق", "باحث السوق", "مقارنة الأدلة", "موافقة بشرية", "ملخص الفريق"],
    },
    document: {
      label: "مراجعة مستند",
      project: "مراجعة اتفاقية الشراكة",
      prompt: "راجع مسودة الاتفاقية وحدد المخاطر والأسئلة المفتوحة دون تعديل الملف الأصلي.",
      answer: "تحتاج المسودة إلى حسم نطاق البيانات، وحدود المسؤولية، وآلية إنهاء الخدمة. سأحافظ على النص الأصلي وأربط كل ملاحظة بموضعها قبل اقتراح أي تعديل.",
      insights: ["3 بنود عالية الأثر", "المصدر محفوظ بلا تعديل", "7 أسئلة تحتاج قرارًا"],
      plan: ["فهرسة بنود الاتفاقية", "استخراج الالتزامات", "تصنيف المخاطر", "إعداد قائمة القرارات"],
      flowNodes: ["المستند", "مراجع العقود", "تصنيف المخاطر", "موافقة بشرية", "مذكرة المراجعة"],
    },
    content: {
      label: "عمليات محتوى",
      project: "تقويم المحتوى للربع الرابع",
      prompt: "حوّل موجز الحملة إلى خطة محتوى قابلة للمراجعة، ولا تنشر أي مادة تلقائيًا.",
      answer: "سأحوّل الموجز إلى موضوعات وقنوات ومواعيد، مع نقطة مراجعة قبل اعتماد كل دفعة. النشر يبقى خارج نطاق التنفيذ حتى موافقة مسؤول المحتوى.",
      insights: ["12 فكرة قابلة للتنفيذ", "نقطتا مراجعة", "النشر متوقف افتراضيًا"],
      plan: ["تحليل الموجز والجمهور", "اقتراح الموضوعات", "توزيع القنوات والمواعيد", "تجهيز حزمة المراجعة"],
      flowNodes: ["موجز الحملة", "منسق المحتوى", "بناء التقويم", "موافقة بشرية", "حزمة المراجعة"],
    },
  },
  en: {
    market: {
      label: "Market launch",
      project: "Saudi market launch",
      prompt: "Analyze the opportunity for an Arabic SaaS product for small teams, separating evidence from assumptions.",
      answer: "The clearest opportunity is among teams combining several AI tools without shared context or governance. Before pricing, we should validate the cost of fragmentation and sensitivity to where data is processed.",
      insights: ["Fragmentation is measurable", "Privacy influences purchase", "Pricing remains an assumption"],
      plan: ["Frame market hypotheses", "Collect local sources", "Compare alternatives", "Draft the decision memo"],
      flowNodes: ["Market question", "Market researcher", "Compare evidence", "Human approval", "Team digest"],
    },
    document: {
      label: "Document review",
      project: "Partnership agreement review",
      prompt: "Review the draft agreement and identify risks and open questions without changing the source file.",
      answer: "The draft needs decisions on data scope, liability boundaries, and service termination. I will preserve the source and tie every observation to its location before proposing edits.",
      insights: ["3 high-impact clauses", "Source remains unchanged", "7 questions need decisions"],
      plan: ["Index agreement clauses", "Extract obligations", "Classify risks", "Prepare decision list"],
      flowNodes: ["Document", "Contract reviewer", "Classify risks", "Human approval", "Review memo"],
    },
    content: {
      label: "Content operations",
      project: "Q4 content calendar",
      prompt: "Turn the campaign brief into a reviewable content plan, with no automatic publishing.",
      answer: "I will structure the brief into themes, channels, and dates, with a review point before each batch. Publishing remains outside the run until the content owner approves it.",
      insights: ["12 actionable ideas", "Two review gates", "Publishing is off by default"],
      plan: ["Analyze brief and audience", "Propose themes", "Map channels and dates", "Prepare the review pack"],
      flowNodes: ["Campaign brief", "Content coordinator", "Build calendar", "Human approval", "Review pack"],
    },
  },
} satisfies Record<Locale, Record<ScenarioId, Scenario>>;

const ui = {
  ar: {
    skip: "انتقل إلى المعاينة التفاعلية",
    preview: "معاينة المنتج",
    back: "العودة للرئيسية",
    openApp: "فتح مساحة العمل",
    eyebrow: "جولة منتج تفاعلية · بيانات محلية",
    titleA: "شاهد طريقة العمل،",
    titleB: "لا مجرد الواجهة.",
    intro: "جرّب انتقال المهمة من سؤال واضح إلى وكيل مضبوط ثم تدفق قابل للتكرار، مع بقاء الأثر والتكلفة والموافقة أمامك في كل خطوة.",
    briefTitle: "ما الذي تختبره هنا؟",
    briefItems: ["سياق واحد عبر المراحل", "حدود وأدوات مرئية", "إيصال قبل أي أثر خارجي"],
    local: "محاكاة محلية",
    noExternal: "لا اتصال خارجي",
    scenario: "السيناريو",
    workspace: "مساحة فريق أفق",
    stages: { chat: "المحادثة", agent: "الوكيل", flow: "التدفق" },
    stageMeta: { chat: "اسأل وقارن", agent: "خطّة وحدود", flow: "شغّل وراقب" },
    done: "مكتمل",
    active: "الحالي",
    queued: "لاحقًا",
    promptLabel: "طلبك",
    answerLabel: "إجابة منظّمة",
    model: "Clarity Pro",
    payer: "رصيد المنصة",
    evidence: "إشارات القرار",
    evidenceNote: "نتائج تجريبية توضّح البنية وليست بحثًا سوقيًا فعليًا.",
    toAgent: "حوّل المهمة إلى وكيل",
    agentTitle: "وكيل باحث مضبوط قبل التشغيل",
    agentDescription: "الخطة والأدوات والحدود قابلة للمراجعة؛ لا يبدأ التنفيذ من خلف الكواليس.",
    plan: "خطة التنفيذ",
    policy: "حدود التشغيل",
    readTools: "أدوات قراءة فقط",
    sources: "ويب + ملفات المشروع",
    budget: "حد التكلفة",
    budgetValue: "$1.20 لكل تشغيل",
    approvalRule: "الأثر الخارجي",
    approvalValue: "يحتاج موافقة دائمًا",
    toFlow: "اعتمد الخطة وحوّلها إلى تدفق",
    flowTitle: "تدفق قابل للتكرار والمراقبة",
    flowDescription: "كل عقدة لها حالة واضحة، ولا تتجاوز بوابة الموافقة تلقائيًا.",
    run: "شغّل المعاينة",
    rerun: "إعادة المعاينة",
    running: "التشغيل جارٍ",
    awaiting: "ينتظر موافقتك",
    paused: "متوقف بأمان",
    completed: "اكتمل بأمان",
    approve: "موافقة تجريبية",
    keepPaused: "أبقِ الإجراء متوقفًا",
    approvalTitle: "موافقة مطلوبة",
    approvalBody: "العقدة التالية تنشئ مخرجًا لفريق المشروع. لن يحدث شيء خارج هذه المعاينة.",
    inspector: "شفافية التشغيل",
    status: "الحالة",
    spend: "التكلفة الحالية",
    ceiling: "من سقف $1.20",
    activity: "السجل الحي",
    events: {
      context: "حُمّل سياق المشروع",
      prompt: "ثُبّت الطلب والقيود",
      agent: "أُنشئت خطة الوكيل",
      flow: "حُوّلت الخطة إلى تدفق",
      running: "تُنفذ عقد القراءة",
      approval: "توقف عند بوابة الموافقة",
      paused: "أُبقي الإجراء متوقفًا",
      completed: "سُجل الإيصال النهائي",
    },
    safetyTitle: "سياسة التنفيذ",
    safetyBody: "قراءة محلية ومحاكاة فقط. لا إرسال، لا نشر، ولا مفاتيح حقيقية.",
    receipt: "إيصال المعاينة",
    sourceCount: "3 مصادر تجريبية",
    duration: "زمن تقريبي 18ث",
    footerTitle: "واجهة هادئة عندما تكون المهمة معقدة.",
    footerBody: "نَسَق لا يخفي التشغيل خلف مؤثرات؛ يعرض السياق والقرار والموافقة والتكلفة في المكان نفسه.",
    enterWorkspace: "ادخل النموذج الكامل",
  },
  en: {
    skip: "Skip to the interactive preview",
    preview: "Product preview",
    back: "Back to home",
    openApp: "Open workspace",
    eyebrow: "Interactive product tour · local data",
    titleA: "See the way of working,",
    titleB: "not just the interface.",
    intro: "Move a task from a clear question to a bounded agent and a repeatable flow, while impact, cost, and approval remain visible at every step.",
    briefTitle: "What are you testing?",
    briefItems: ["One context across stages", "Visible tools and limits", "A receipt before external impact"],
    local: "Local simulation",
    noExternal: "No external connection",
    scenario: "Scenario",
    workspace: "Ofuq team workspace",
    stages: { chat: "Chat", agent: "Agent", flow: "Flow" },
    stageMeta: { chat: "Ask and compare", agent: "Plan and limits", flow: "Run and observe" },
    done: "Done",
    active: "Current",
    queued: "Next",
    promptLabel: "Your request",
    answerLabel: "Structured answer",
    model: "Clarity Pro",
    payer: "Platform credits",
    evidence: "Decision signals",
    evidenceNote: "Demo findings illustrate the structure; they are not real market research.",
    toAgent: "Turn this task into an agent",
    agentTitle: "A bounded research agent before execution",
    agentDescription: "The plan, tools, and limits are reviewable; execution never starts behind the scenes.",
    plan: "Execution plan",
    policy: "Run boundaries",
    readTools: "Read-only tools",
    sources: "Web + project files",
    budget: "Cost limit",
    budgetValue: "$1.20 per run",
    approvalRule: "External impact",
    approvalValue: "Always requires approval",
    toFlow: "Approve the plan and turn it into a flow",
    flowTitle: "A repeatable, observable flow",
    flowDescription: "Every node has a visible state and never crosses the approval gate automatically.",
    run: "Run preview",
    rerun: "Run again",
    running: "Run in progress",
    awaiting: "Awaiting your approval",
    paused: "Paused safely",
    completed: "Completed safely",
    approve: "Demo approval",
    keepPaused: "Keep action paused",
    approvalTitle: "Approval required",
    approvalBody: "The next node creates an output for the project team. Nothing leaves this preview.",
    inspector: "Run transparency",
    status: "Status",
    spend: "Current cost",
    ceiling: "of the $1.20 ceiling",
    activity: "Live log",
    events: {
      context: "Project context loaded",
      prompt: "Request and constraints fixed",
      agent: "Agent plan created",
      flow: "Plan converted into a flow",
      running: "Read node executing",
      approval: "Paused at approval gate",
      paused: "Action kept paused",
      completed: "Final receipt recorded",
    },
    safetyTitle: "Execution policy",
    safetyBody: "Local reading and simulation only. No sending, publishing, or real keys.",
    receipt: "Preview receipt",
    sourceCount: "3 demo sources",
    duration: "Approx. duration 18s",
    footerTitle: "A calm interface for complex work.",
    footerBody: "Nasaq does not hide execution behind effects; it keeps context, decisions, approvals, and cost in one place.",
    enterWorkspace: "Enter the full prototype",
  },
} as const;

const stageIcons = {
  chat: MessageSquareText,
  agent: Bot,
  flow: Workflow,
};

function getNodeState(index: number, status: RunStatus, step: number): NodeState {
  if (status === "idle") return index === 0 ? "ready" : "queued";
  if (status === "completed") return "completed";
  if (status === "approval" || status === "paused") {
    if (index < 3) return "completed";
    if (index === 3) return status === "paused" ? "paused" : "approval";
    return "queued";
  }
  if (index < step) return "completed";
  if (index === step) return "running";
  return "queued";
}

export function ProductPreview({ locale }: { locale: Locale }) {
  const t = ui[locale];
  const [scenarioId, setScenarioId] = useState<ScenarioId>("market");
  const [stage, setStage] = useState<Stage>("chat");
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runStep, setRunStep] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const scenario = scenarios[locale][scenarioId];
  const stageIndex = stageOrder.indexOf(stage);

  useEffect(() => {
    if (runStatus !== "running") return;
    const timer = window.setTimeout(() => {
      if (runStep >= 2) {
        setRunStep(3);
        setRunStatus("approval");
      } else {
        setRunStep((value) => value + 1);
      }
    }, 720);
    return () => window.clearTimeout(timer);
  }, [runStatus, runStep]);

  function resetRun() {
    setRunStatus("idle");
    setRunStep(0);
  }

  function chooseScenario(id: ScenarioId) {
    setScenarioId(id);
    setStage("chat");
    resetRun();
  }

  function changeStage(next: Stage) {
    setStage(next);
    if (next !== "flow") resetRun();
  }

  function runPreview() {
    setRunStep(0);
    setRunStatus("running");
  }

  function approvePreview() {
    setRunStep(4);
    setRunStatus("completed");
  }

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = stageOrder.length - 1;
    if (event.key === "ArrowRight") nextIndex = (index + (locale === "ar" ? -1 : 1) + stageOrder.length) % stageOrder.length;
    if (event.key === "ArrowLeft") nextIndex = (index + (locale === "ar" ? 1 : -1) + stageOrder.length) % stageOrder.length;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextStage = stageOrder[nextIndex];
    if (!nextStage) return;
    changeStage(nextStage);
    window.requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
  }

  const cost = runStatus === "completed" ? 1.12 : runStatus === "approval" || runStatus === "paused" ? 0.96 : runStatus === "running" ? 0.34 + runStep * 0.21 : stage === "chat" ? 0.18 : stage === "agent" ? 0.24 : 0.28;
  const budgetPercent = Math.min(100, Math.round((cost / 1.2) * 100));
  const statusLabel = runStatus === "completed" ? t.completed : runStatus === "paused" ? t.paused : runStatus === "approval" ? t.awaiting : runStatus === "running" ? t.running : stage === "flow" ? t.queued : t.active;
  const statusTone: "success" | "warning" | "brand" | "neutral" = runStatus === "completed" ? "success" : runStatus === "approval" || runStatus === "paused" ? "warning" : runStatus === "running" ? "brand" : "neutral";
  const events: string[] = [t.events.context, t.events.prompt];
  if (stageIndex >= 1) events.push(t.events.agent);
  if (stageIndex >= 2) events.push(t.events.flow);
  if (runStatus === "running") events.push(t.events.running);
  if (runStatus === "approval") events.push(t.events.approval);
  if (runStatus === "paused") events.push(t.events.paused);
  if (runStatus === "completed") events.push(t.events.completed);
  const otherLocale: Locale = locale === "ar" ? "en" : "ar";
  const DirectionArrow = locale === "ar" ? ArrowLeft : ArrowRight;
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="product-preview-page">
      <a className="skip-link" href="#interactive-preview">{t.skip}</a>
      <header className="preview-site-header">
        <div className="preview-site-header__inner">
          <Link className="brand-lockup" href={`/${locale}`}>
            <NasaqMark size={34} />
            <span>نَسَق</span>
          </Link>
          <div className="preview-breadcrumb"><span>{t.preview}</span><span aria-hidden="true">/</span><strong>Chat → Agent → Flow</strong></div>
          <div className="preview-header-actions">
            <Link className="preview-back-link" href={`/${locale}`}><BackArrow size={16} aria-hidden="true" />{t.back}</Link>
            <Link className="locale-link" href={`/${otherLocale}/preview`} aria-label={locale === "ar" ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}>{otherLocale.toUpperCase()}</Link>
            <Link className="button button--secondary button--default" href={`/${locale}/app/home`}>{t.openApp}</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="preview-hero" aria-labelledby="preview-title">
          <div className="preview-hero__copy">
            <p className="preview-eyebrow"><span aria-hidden="true" />{t.eyebrow}</p>
            <h1 id="preview-title">{t.titleA}<span>{t.titleB}</span></h1>
            <p>{t.intro}</p>
            <div className="preview-proof-line" aria-label={t.briefTitle}>
              {t.briefItems.map((item) => <span key={item}><Check size={14} aria-hidden="true" />{item}</span>)}
            </div>
          </div>
          <aside className="preview-brief" aria-label={t.briefTitle}>
            <div className="preview-brief__top"><span className="preview-brief__index">01</span><Badge tone="brand">{t.local}</Badge></div>
            <h2>{t.briefTitle}</h2>
            <dl>
              <div><dt>CONTEXT</dt><dd>{locale === "ar" ? "مشروع موحّد" : "Unified project"}</dd></div>
              <div><dt>CONTROL</dt><dd>{locale === "ar" ? "موافقة بشرية" : "Human approval"}</dd></div>
              <div><dt>NETWORK</dt><dd>{t.noExternal}</dd></div>
            </dl>
          </aside>
        </section>

        <section id="interactive-preview" className="preview-workspace" aria-label={t.preview}>
          <div className="preview-workspace__bar">
            <div className="preview-workspace__identity"><NasaqMark size={28} /><span><strong>{t.workspace}</strong><small>{scenario.project}</small></span></div>
            <div className="preview-simulation-state"><span className="preview-live-dot" aria-hidden="true" />{t.local}</div>
            <div className="preview-workspace__meta"><LockKeyhole size={14} aria-hidden="true" /><span>{t.noExternal}</span><span className="mono">DEMO-024</span></div>
          </div>

          <div className="preview-workspace__body">
            <nav className="preview-rail" aria-label={locale === "ar" ? "أقسام المعاينة" : "Preview sections"}>
              <NasaqMark size={34} />
              {stageOrder.map((item) => {
                const Icon = stageIcons[item];
                return <button key={item} type="button" className={stage === item ? "is-active" : ""} onClick={() => changeStage(item)} aria-label={t.stages[item]} aria-current={stage === item ? "page" : undefined}><Icon size={18} /></button>;
              })}
              <span className="preview-rail__spacer" />
              <button type="button" onClick={() => { setStage("chat"); resetRun(); }} aria-label={locale === "ar" ? "إعادة ضبط المعاينة" : "Reset preview"}><RotateCcw size={16} /></button>
            </nav>

            <div className="preview-canvas">
              <div className="preview-context-bar">
                <div><span>{t.scenario}</span><strong>{scenario.project}</strong></div>
                <div className="preview-scenario-switcher" role="group" aria-label={t.scenario}>
                  {(Object.keys(scenarios[locale]) as ScenarioId[]).map((id) => <button key={id} type="button" className={scenarioId === id ? "is-selected" : ""} aria-pressed={scenarioId === id} onClick={() => chooseScenario(id)}>{scenarios[locale][id].label}</button>)}
                </div>
              </div>

              <div className="preview-stage-tabs" role="tablist" aria-label={locale === "ar" ? "مراحل طريقة العمل" : "Workflow stages"}>
                {stageOrder.map((item, index) => {
                  const Icon = stageIcons[item];
                  const selected = stage === item;
                  const passed = stageIndex > index;
                  return (
                    <button
                      key={item}
                      ref={(element) => { tabRefs.current[index] = element; }}
                      id={`preview-tab-${item}`}
                      role="tab"
                      type="button"
                      aria-selected={selected}
                      aria-controls={`preview-panel-${item}`}
                      tabIndex={selected ? 0 : -1}
                      className={`${selected ? "is-active" : ""}${passed ? " is-complete" : ""}`}
                      onClick={() => changeStage(item)}
                      onKeyDown={(event) => handleTabKey(event, index)}
                    >
                      <span className="preview-stage-tabs__icon">{passed ? <Check size={16} /> : <Icon size={16} />}</span>
                      <span><strong><b>0{index + 1}</b>{t.stages[item]}</strong><small>{t.stageMeta[item]}</small></span>
                      <em>{passed ? t.done : selected ? t.active : t.queued}</em>
                    </button>
                  );
                })}
              </div>

              <div id={`preview-panel-${stage}`} role="tabpanel" aria-labelledby={`preview-tab-${stage}`} tabIndex={0} className="preview-stage-panel" key={`${stage}-${scenarioId}`}>
                {stage === "chat" ? (
                  <div className="preview-chat-stage">
                    <div className="preview-panel-heading">
                      <div><span>CHAT / 01</span><h2>{locale === "ar" ? "ابدأ بالنتيجة التي تريدها" : "Start with the outcome you need"}</h2></div>
                      <div className="preview-model-chip"><Bot size={14} /><span><strong>{t.model}</strong><small>{t.payer}</small></span></div>
                    </div>
                    <div className="preview-message preview-message--user"><span>{t.promptLabel}</span><p>{scenario.prompt}</p></div>
                    <article className="preview-answer">
                      <div className="preview-answer__mark"><NasaqMark size={28} /></div>
                      <div><div className="preview-answer__meta"><strong>{t.answerLabel}</strong><Badge tone="success">{t.done}</Badge></div><p>{scenario.answer}</p></div>
                    </article>
                    <section className="preview-evidence" aria-labelledby="preview-evidence-title">
                      <div><span><FileCheck2 size={16} /></span><div><h3 id="preview-evidence-title">{t.evidence}</h3><p>{t.evidenceNote}</p></div></div>
                      <ol>{scenario.insights.map((insight, index) => <li key={insight}><span>0{index + 1}</span>{insight}</li>)}</ol>
                    </section>
                    <div className="preview-panel-action"><span><CircleDollarSign size={14} /> <b className="ltr-value">$0.18</b> · {t.sourceCount}</span><button className="button button--primary button--default" type="button" onClick={() => changeStage("agent")}>{t.toAgent}<DirectionArrow size={16} /></button></div>
                  </div>
                ) : null}

                {stage === "agent" ? (
                  <div className="preview-agent-stage">
                    <div className="preview-panel-heading">
                      <div><span>AGENT / 02</span><h2>{t.agentTitle}</h2><p>{t.agentDescription}</p></div>
                      <Badge tone="warning">{locale === "ar" ? "مسودة قابلة للمراجعة" : "Reviewable draft"}</Badge>
                    </div>
                    <div className="preview-agent-layout">
                      <section className="preview-plan" aria-labelledby="preview-plan-title">
                        <div className="preview-subheading"><ListChecks size={16} /><h3 id="preview-plan-title">{t.plan}</h3><span>4 {locale === "ar" ? "خطوات" : "steps"}</span></div>
                        <ol>{scenario.plan.map((item, index) => <li key={item}><span>{index + 1}</span><div><strong>{item}</strong><small>{index < 2 ? (locale === "ar" ? "قراءة وتحليل" : "Read and analyze") : (locale === "ar" ? "تركيب ومراجعة" : "Synthesize and review")}</small></div><Check size={14} aria-hidden="true" /></li>)}</ol>
                      </section>
                      <section className="preview-policy" aria-labelledby="preview-policy-title">
                        <div className="preview-subheading"><ShieldCheck size={16} /><h3 id="preview-policy-title">{t.policy}</h3></div>
                        <dl>
                          <div><dt><Search size={14} />{t.readTools}</dt><dd>{t.sources}</dd></div>
                          <div><dt><CircleDollarSign size={14} />{t.budget}</dt><dd className="ltr-value">{t.budgetValue}</dd></div>
                          <div><dt><LockKeyhole size={14} />{t.approvalRule}</dt><dd>{t.approvalValue}</dd></div>
                        </dl>
                        <div className="preview-tool-row"><span><Globe2 size={14} /> WEB · READ</span><span><Database size={14} /> FILES · READ</span></div>
                      </section>
                    </div>
                    <div className="preview-panel-action"><span><ShieldCheck size={14} /> {locale === "ar" ? "الخطة لا تعمل قبل اعتمادك" : "The plan cannot run before approval"}</span><button className="button button--primary button--default" type="button" onClick={() => changeStage("flow")}>{t.toFlow}<DirectionArrow size={16} /></button></div>
                  </div>
                ) : null}

                {stage === "flow" ? (
                  <div className="preview-flow-stage">
                    <div className="preview-panel-heading preview-panel-heading--flow">
                      <div><span>FLOW / 03</span><h2>{t.flowTitle}</h2><p>{t.flowDescription}</p></div>
                      <div className="preview-run-actions">
                        {runStatus !== "idle" ? <button className="button button--outline button--compact" type="button" onClick={resetRun}><RotateCcw size={14} />{t.rerun}</button> : null}
                        <button className="button button--primary button--default" type="button" onClick={runPreview} disabled={runStatus === "running" || runStatus === "approval"}><Play size={14} fill="currentColor" />{runStatus === "idle" ? t.run : runStatus === "completed" || runStatus === "paused" ? t.rerun : statusLabel}</button>
                      </div>
                    </div>
                    <div className="preview-flow-canvas" aria-label={t.flowTitle}>
                      <div className="preview-flow-grid">
                        {scenario.flowNodes.map((node, index) => {
                          const state = getNodeState(index, runStatus, runStep);
                          const NodeIcon = index === 0 ? FileText : index === 1 ? Bot : index === 2 ? GitBranch : index === 3 ? ShieldCheck : Send;
                          return (
                            <div className={`preview-flow-node is-${state}`} key={node}>
                              <span className="preview-flow-node__index">0{index + 1}</span>
                              <span className="preview-flow-node__icon">{state === "completed" ? <Check size={18} /> : <NodeIcon size={18} />}</span>
                              <strong>{node}</strong>
                              <small>{state === "completed" ? t.done : state === "running" ? t.running : state === "approval" ? t.awaiting : state === "paused" ? t.paused : state === "ready" ? (locale === "ar" ? "جاهز" : "Ready") : t.queued}</small>
                              {index < scenario.flowNodes.length - 1 ? <span className="preview-flow-connector" aria-hidden="true"><DirectionArrow size={14} /></span> : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {runStatus === "approval" ? (
                      <div className="preview-approval-inline" role="alert">
                        <span className="preview-approval-inline__icon"><ShieldCheck size={18} /></span>
                        <div><strong>{t.approvalTitle}</strong><p>{t.approvalBody}</p></div>
                        <div><button className="button button--primary button--compact" type="button" onClick={approvePreview}>{t.approve}</button><button className="button button--quiet button--compact" type="button" onClick={() => setRunStatus("paused")}>{t.keepPaused}</button></div>
                      </div>
                    ) : null}
                    {runStatus === "paused" ? <div className="preview-paused-note" role="status"><LockKeyhole size={18} /><span><strong>{t.paused}</strong>{locale === "ar" ? " — حُفظت الحالة ويمكنك إعادة المعاينة دون تنفيذ الإجراء." : " — state preserved; you can rerun without executing the action."}</span></div> : null}
                    {runStatus === "completed" ? <div className="preview-complete-note" role="status"><Check size={18} /><span><strong>{t.completed}</strong>{locale === "ar" ? " — سُجلت النتيجة والإيصال دون تنفيذ خارجي." : " — result and receipt recorded with no external execution."}</span></div> : null}
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="preview-inspector" aria-labelledby="preview-inspector-title">
              <div className="preview-inspector__head"><div><span>RUN / RECEIPT</span><h2 id="preview-inspector-title">{t.inspector}</h2></div><Activity size={18} /></div>
              <div className="preview-status-card" aria-live="polite">
                <div><span>{t.status}</span><Badge tone={statusTone}>{statusLabel}</Badge></div>
                <div className="preview-cost"><span>{t.spend}</span><strong className="ltr-value">${cost.toFixed(2)}</strong><small>{t.ceiling}</small></div>
                <div className="preview-budget-track" role="progressbar" aria-label={t.spend} aria-valuemin={0} aria-valuemax={120} aria-valuenow={Math.round(cost * 100)}><span style={{ width: `${budgetPercent}%` }} /></div>
              </div>
              <section className="preview-activity" aria-labelledby="preview-activity-title">
                <h3 id="preview-activity-title">{t.activity}</h3>
                <ol>{events.map((event, index) => <li key={`${event}-${index}`} className={index === events.length - 1 ? "is-current" : ""}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{event}</strong><small><Clock3 size={12} /> {index === events.length - 1 ? (locale === "ar" ? "الآن" : "Now") : `${index + 1}m`}</small></div></li>)}</ol>
              </section>
              <div className="preview-safety-card"><LockKeyhole size={16} /><div><strong>{t.safetyTitle}</strong><p>{t.safetyBody}</p></div></div>
              <div className="preview-receipt"><div><span>{t.receipt}</span><strong className="mono">DEMO-024</strong></div><div><span>{t.sourceCount}</span><span>{t.duration}</span></div></div>
            </aside>
          </div>
        </section>

        <section className="preview-outro">
          <div><span>PRECISION WORKSPACE</span><h2>{t.footerTitle}</h2><p>{t.footerBody}</p></div>
          <Link className="button button--secondary button--prominent" href={`/${locale}/app/home`}>{t.enterWorkspace}<DirectionArrow size={16} /></Link>
        </section>
      </main>
    </div>
  );
}
