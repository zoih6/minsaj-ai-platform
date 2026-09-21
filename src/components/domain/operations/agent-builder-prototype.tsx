"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, BrainCircuit, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, FlaskConical, GripVertical, Play, Save, ShieldCheck, Sparkles, Wrench, XCircle } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type AgentDefinition, type Locale, type LocalizedText } from "@minsaj/contracts";
import { CostValue, DemoToast } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
const modelOptions = ["Clarity Pro", "Sprint Mini", "Depth Reasoner"];

type BuilderAgent = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  status: "draft" | "published" | "archived";
  version: number;
  instructions: LocalizedText;
  model: string;
  maxIterations: number;
  budgetLimitUsd: number;
  billingMode: "platform_credits" | "byok";
  requiresExternalApproval: boolean;
  tools: Array<{ id: string; name: LocalizedText; description: LocalizedText; risk: "low" | "medium" | "high"; enabled: boolean }>;
};

function setLocalized(value: LocalizedText, locale: Locale, next: string): LocalizedText {
  return locale === "ar" ? { ...value, ar: next } : { ...value, en: next };
}

function toBuilderAgent(source: AgentDefinition): BuilderAgent {
  return {
    id: source.summary.id,
    name: source.summary.name,
    description: source.summary.description,
    status: source.summary.status,
    version: source.summary.version,
    instructions: source.instructions,
    model: source.modelPolicy.primary,
    maxIterations: 8,
    budgetLimitUsd: source.budgetLimit.amountMinor / 100,
    billingMode: source.modelPolicy.payer,
    requiresExternalApproval: source.approvalPolicy === "always_external",
    tools: source.tools.map((tool) => ({
      ...tool,
      risk: tool.risk === "read" ? "low" : tool.risk === "write_internal" ? "medium" : "high",
      description: tool.risk === "read"
        ? { ar: "صلاحية قراءة فقط دون تعديل المصدر.", en: "Read-only access without changing the source." }
        : tool.risk === "write_internal"
          ? { ar: "يكتب داخل المشروع مع تسجيل كامل.", en: "Writes inside the project with a complete record." }
          : { ar: "ينشئ أثرًا خارجيًا ويتطلب موافقة.", en: "Creates an external effect and requires approval." },
    })),
  };
}

export function AgentBuilderPrototype({ locale, initialDefinition, isNew = false }: { locale: Locale; initialDefinition: AgentDefinition; isNew?: boolean }) {
  const ar = locale === "ar";
  const [definition, setDefinition] = useState<BuilderAgent>(() => toBuilderAgent(initialDefinition));
  const [step, setStep] = useState(isNew ? "identity" : "instructions");
  const [dirty, setDirty] = useState(isNew);
  const [testPrompt, setTestPrompt] = useState(ar ? "لخّص آخر التغيّرات في اللوائح ذات الصلة." : "Summarize the latest relevant regulatory changes.");
  const [testResult, setTestResult] = useState<"idle" | "running" | "done">("idle");
  const [notice, setNotice] = useState("");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  const PreviousIcon = ar ? ChevronRight : ChevronLeft;
  const NextIcon = ar ? ChevronLeft : ChevronRight;
  const steps = [
    ["identity", ar ? "الهوية" : "Identity", Bot],
    ["instructions", ar ? "التعليمات" : "Instructions", Sparkles],
    ["model", ar ? "النموذج والحدود" : "Model and limits", BrainCircuit],
    ["tools", ar ? "الأدوات" : "Tools", Wrench],
    ["guardrails", ar ? "الحماية" : "Guardrails", ShieldCheck],
    ["test", ar ? "الاختبار" : "Test", FlaskConical],
  ] as const;
  const activeIndex = steps.findIndex(([id]) => id === step);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function mutate(updater: (current: BuilderAgent) => BuilderAgent) {
    setDefinition((current) => updater(current));
    setDirty(true);
  }

  function runTest() {
    setTestResult("running");
    window.setTimeout(() => setTestResult("done"), 650);
  }

  return (
    <div className="builder-page agent-builder-page">
      <ScrollFx />
      <header className="builder-topbar">
        <div className="builder-topbar__identity"><Link className="icon-button" href={`/${locale}/app/agents`} aria-label={ar ? "العودة إلى الوكلاء" : "Back to agents"}><DirectionArrow size={18} /></Link><span className="builder-topbar__divider" /><span className="agent-avatar"><Bot size={18} /></span><div><div><h1>{isNew ? (ar ? "وكيل جديد" : "New agent") : localize(definition.name, locale)}</h1><Badge tone={definition.status === "published" ? "success" : "warning"}>{definition.status === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</Badge>{dirty ? <span className="unsaved-dot">{ar ? "تغييرات غير محفوظة" : "Unsaved changes"}</span> : null}</div><p className="mono">V{definition.version} · {definition.id}</p></div></div>
        <div className="builder-topbar__actions"><button className="button button--quiet button--default" type="button" onClick={() => { setDirty(false); setNotice(ar ? "حُفظت المسودة محليًا." : "Draft saved locally."); }}><Save size={14} />{ar ? "حفظ" : "Save"}</button><button className="button button--primary button--default" type="button" onClick={() => { mutate((current) => ({ ...current, status: "published" })); setDirty(false); setNotice(ar ? "نُشر الوكيل في المحاكاة وأصبح جاهزًا للاستخدام." : "Agent published in the simulation and is ready to use."); }}><Check size={14} />{ar ? "نشر الوكيل" : "Publish agent"}</button></div>
      </header>

      <div className="builder-shell">
        <aside className="builder-steps"><div className="builder-steps__intro"><p>{ar ? "تكوين الوكيل" : "Agent setup"}</p><span>{ar ? `${activeIndex + 1} من ${steps.length}` : `${activeIndex + 1} of ${steps.length}`}</span></div><nav aria-label={ar ? "خطوات تكوين الوكيل" : "Agent setup steps"}>{steps.map(([id, label, Icon], index) => <button type="button" key={id} className={step === id ? "is-active" : ""} aria-current={step === id ? "step" : undefined} onClick={() => setStep(id)}><span className="builder-step-index">{index < activeIndex ? <Check size={14} /> : index + 1}</span><Icon size={16} /><strong>{label}</strong></button>)}</nav><div className="builder-steps__progress"><div><span>{ar ? "اكتمال الإعداد" : "Setup completeness"}</span><b>{Math.round(((activeIndex + 1) / steps.length) * 100)}%</b></div><div><span style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }} /></div></div></aside>

        <main className="builder-canvas">
          {step === "identity" ? <section className="builder-section"><div className="builder-section__heading"><span><Bot size={18} /></span><div><p className="section-kicker">01 · IDENTITY</p><h2>{ar ? "عرّف دورًا يمكن للفريق تمييزه" : "Define a role your team can recognize"}</h2><p>{ar ? "الاسم والوصف يظهران في المكتبة وسجلات التشغيل." : "The name and description appear in the library and run records."}</p></div></div><div className="builder-form-grid"><label className="field field--wide"><span>{ar ? "اسم الوكيل" : "Agent name"}</span><input value={localize(definition.name, locale)} onChange={(event) => mutate((current) => ({ ...current, name: setLocalized(current.name, locale, event.target.value) }))} /></label><label className="field field--wide"><span>{ar ? "وصف النتيجة" : "Outcome description"}</span><textarea value={localize(definition.description, locale)} onChange={(event) => mutate((current) => ({ ...current, description: setLocalized(current.description, locale, event.target.value) }))} /></label></div><div className="builder-tip"><Sparkles size={16} /><p>{ar ? "استخدم اسمًا يصف المسؤولية لا التقنية: «مراقب السياسات» أوضح من «وكيل RAG»." : "Name the responsibility, not the technology: “Policy monitor” is clearer than “RAG agent.”"}</p></div></section> : null}

          {step === "instructions" ? <section className="builder-section"><div className="builder-section__heading"><span><Sparkles size={18} /></span><div><p className="section-kicker">02 · INSTRUCTIONS</p><h2>{ar ? "تعليمات تشغيل قابلة للمراجعة" : "Reviewable operating instructions"}</h2><p>{ar ? "اكتب المهمة والمنهج ومتى يجب أن يتوقف الوكيل ويسأل." : "State the job, method, and when the agent must stop and ask."}</p></div></div><label className="field instruction-field"><span>{ar ? "تعليمات النظام" : "System instructions"}</span><textarea value={localize(definition.instructions, locale)} onChange={(event) => mutate((current) => ({ ...current, instructions: setLocalized(current.instructions, locale, event.target.value) }))} /></label><div className="instruction-checks"><div><CheckCircle2 size={16} /><span>{ar ? "المهمة محددة" : "Task is specific"}</span></div><div><CheckCircle2 size={16} /><span>{ar ? "المخرجات موصوفة" : "Output is described"}</span></div><div><CheckCircle2 size={16} /><span>{ar ? "حدود التوقف ظاهرة" : "Stop conditions are visible"}</span></div></div></section> : null}

          {step === "model" ? <section className="builder-section"><div className="builder-section__heading"><span><BrainCircuit size={18} /></span><div><p className="section-kicker">03 · MODEL & LIMITS</p><h2>{ar ? "وازن الجودة والتكلفة صراحة" : "Balance quality and cost explicitly"}</h2><p>{ar ? "هذه الحدود تُطبّق في كل تشغيل ما لم يفرض المشروع سقفًا أدنى." : "These limits apply to every run unless the project sets a lower ceiling."}</p></div></div><div className="builder-form-grid"><label className="field field--wide"><span>{ar ? "النموذج" : "Model"}</span><select value={definition.model} onChange={(event) => mutate((current) => ({ ...current, model: event.target.value }))}>{modelOptions.map((model) => <option key={model}>{model}</option>)}</select></label><label className="field"><span>{ar ? "أقصى عدد للتكرارات" : "Maximum iterations"}</span><input type="number" min={1} max={20} value={definition.maxIterations} onChange={(event) => mutate((current) => ({ ...current, maxIterations: Number(event.target.value) }))} /></label><label className="field"><span>{ar ? "سقف التكلفة / تشغيل" : "Cost cap / run"}</span><div className="input-with-prefix"><CircleDollarSign size={16} /><input type="number" min={0.1} max={20} step={0.1} value={definition.budgetLimitUsd} onChange={(event) => mutate((current) => ({ ...current, budgetLimitUsd: Number(event.target.value) }))} /></div></label></div><div className="model-comparison"><div><span>{ar ? "تقدير التشغيل المعتاد" : "Typical run estimate"}</span><strong>$0.62–$1.18</strong></div><div><span>{ar ? "السقف الصلب" : "Hard ceiling"}</span><strong><CostValue value={definition.budgetLimitUsd} locale={locale} /></strong></div><div><span>{ar ? "الدفع" : "Billing"}</span><strong>{definition.billingMode === "platform_credits" ? (ar ? "رصيد المنصة" : "Platform credits") : definition.billingMode === "byok" ? "BYOK" : (ar ? "هجين" : "Hybrid")}</strong></div></div></section> : null}

          {step === "tools" ? <section className="builder-section"><div className="builder-section__heading"><span><Wrench size={18} /></span><div><p className="section-kicker">04 · TOOLS</p><h2>{ar ? "امنح أقل قدر لازم من الأدوات" : "Grant only the tools the job needs"}</h2><p>{ar ? "الأدوات القارئة تعمل مباشرة؛ أي أداة ذات أثر خارجي تمر عبر بوابة موافقة." : "Read-only tools run directly; anything with external impact passes through approval."}</p></div></div><div className="tool-permission-list">{definition.tools.map((tool) => <label key={tool.id} className={tool.enabled ? "is-enabled" : ""}><span className="tool-grip"><GripVertical size={16} /></span><span className="tool-symbol"><Wrench size={16} /></span><span className="tool-copy"><strong>{localize(tool.name, locale)}</strong><small>{localize(tool.description, locale)}</small></span><Badge tone={tool.risk === "high" ? "warning" : tool.risk === "medium" ? "brand" : "neutral"}>{tool.risk === "high" ? (ar ? "مرتفع" : "High") : tool.risk === "medium" ? (ar ? "متوسط" : "Medium") : (ar ? "منخفض" : "Low")}</Badge><input className="switch-input" type="checkbox" checked={tool.enabled} onChange={(event) => mutate((current) => ({ ...current, tools: current.tools.map((item) => item.id === tool.id ? { ...item, enabled: event.target.checked } : item) }))} /><span className="switch-visual" aria-hidden="true"><span /></span></label>)}</div></section> : null}

          {step === "guardrails" ? <section className="builder-section"><div className="builder-section__heading"><span><ShieldCheck size={18} /></span><div><p className="section-kicker">05 · GUARDRAILS</p><h2>{ar ? "اجعل نقاط التوقف غير قابلة للتأويل" : "Make stop conditions unambiguous"}</h2><p>{ar ? "الموافقات وحدود المخاطر سياسة تنفيذ، وليست مجرد نص داخل التعليمات." : "Approvals and risk limits are execution policy, not just prose in the prompt."}</p></div></div><div className="guardrail-grid"><label className="guardrail-option"><input type="checkbox" checked={definition.requiresExternalApproval} onChange={(event) => mutate((current) => ({ ...current, requiresExternalApproval: event.target.checked }))} /><span><ShieldCheck size={18} /></span><span><strong>{ar ? "موافقة قبل الأثر الخارجي" : "Approve before external impact"}</strong><small>{ar ? "الإرسال والنشر والكتابة والتحديثات تنتظر إنسانًا مخولًا." : "Sending, publishing, writing, and updates wait for an authorized human."}</small></span></label><label className="guardrail-option"><input type="checkbox" defaultChecked /><span><CircleDollarSign size={18} /></span><span><strong>{ar ? "إيقاف عند سقف التكلفة" : "Stop at cost ceiling"}</strong><small>{ar ? `يتوقف التشغيل عند $${definition.budgetLimitUsd.toFixed(2)} دون تجاوز.` : `The run stops at $${definition.budgetLimitUsd.toFixed(2)} without overage.`}</small></span></label><label className="guardrail-option"><input type="checkbox" defaultChecked /><span><XCircle size={18} /></span><span><strong>{ar ? "منع الاستنتاج بلا مصدر" : "Block unsourced conclusions"}</strong><small>{ar ? "يعلّم النقص بوضوح بدل اختلاق إجابة." : "Marks evidence gaps instead of inventing an answer."}</small></span></label></div></section> : null}

          {step === "test" ? <section className="builder-section builder-test-section"><div className="builder-section__heading"><span><FlaskConical size={18} /></span><div><p className="section-kicker">06 · TEST</p><h2>{ar ? "اختبر السلوك قبل النشر" : "Test behavior before publishing"}</h2><p>{ar ? "الاختبار يستخدم بيانات حتمية ولا يستدعي نموذجًا أو أداة خارجية." : "The test uses deterministic data and calls no external model or tool."}</p></div></div><div className="test-composer"><label className="field"><span>{ar ? "مهمة الاختبار" : "Test task"}</span><textarea value={testPrompt} onChange={(event) => { setTestPrompt(event.target.value); setTestResult("idle"); }} /></label><button className="button button--primary button--default" type="button" onClick={runTest} disabled={!testPrompt.trim() || testResult === "running"}><Play size={14} />{testResult === "running" ? (ar ? "يجري الاختبار…" : "Testing…") : (ar ? "تشغيل آمن" : "Run safely")}</button></div>{testResult === "done" ? <div className="test-result"><div className="test-result__head"><span><CheckCircle2 size={16} /></span><div><strong>{ar ? "اكتمل الاختبار دون آثار خارجية" : "Test completed with no external effects"}</strong><small>{ar ? "٦ خطوات · ٤ مصادر · $0.38 تقديري" : "6 steps · 4 sources · $0.38 estimated"}</small></div></div><p>{ar ? "وجدت ثلاثة تغيّرات ذات صلة. اثنان مؤكّدان من مصادر أولية، والثالث يحتاج مراجعة قبل إدراجه. أعددت ملخصًا موثقًا ومسودة توصية دون إرسالها." : "I found three relevant changes. Two are confirmed by primary sources; the third needs review before inclusion. I prepared a sourced summary and a recommendation draft without sending it."}</p><div className="test-citations"><span>[1] Official bulletin</span><span>[2] Policy registry</span><span>[3] Review needed</span></div></div> : null}</section> : null}

          <footer className="builder-navigation"><button className="button button--quiet button--default" type="button" disabled={activeIndex === 0} onClick={() => setStep(steps[activeIndex - 1]?.[0] ?? step)}><PreviousIcon size={16} />{ar ? "السابق" : "Previous"}</button><span>{steps[activeIndex]?.[1]}</span><button className="button button--outline button--default" type="button" disabled={activeIndex === steps.length - 1} onClick={() => setStep(steps[activeIndex + 1]?.[0] ?? step)}>{ar ? "التالي" : "Next"}<NextIcon size={16} /></button></footer>
        </main>

        <aside className="builder-inspector">
          <div className="builder-inspector__heading"><p className="section-kicker">{ar ? "معاينة السياسة" : "Policy preview"}</p><h2>{ar ? "ما الذي سيحدث؟" : "What will happen?"}</h2></div>
          <div className="agent-preview-card"><span className="agent-preview-card__icon"><Bot size={20} /></span><h3>{localize(definition.name, locale) || (ar ? "وكيل بلا اسم" : "Unnamed agent")}</h3><p>{localize(definition.description, locale)}</p><Badge tone={definition.status === "published" ? "success" : "warning"}>{definition.status === "published" ? (ar ? "منشور" : "Published") : (ar ? "مسودة" : "Draft")}</Badge></div>
          <dl className="policy-facts"><div><dt>{ar ? "النموذج" : "Model"}</dt><dd className="mono">{definition.model.split("/")[1]}</dd></div><div><dt>{ar ? "أدوات مفعّلة" : "Enabled tools"}</dt><dd>{definition.tools.filter((tool) => tool.enabled).length} / {definition.tools.length}</dd></div><div><dt>{ar ? "حد التكرارات" : "Iteration limit"}</dt><dd>{definition.maxIterations}</dd></div><div><dt>{ar ? "سقف التكلفة" : "Cost ceiling"}</dt><dd><CostValue value={definition.budgetLimitUsd} locale={locale} /></dd></div></dl>
          <div className={`approval-policy-summary ${definition.requiresExternalApproval ? "is-safe" : "is-warning"}`}><ShieldCheck size={18} /><div><strong>{definition.requiresExternalApproval ? (ar ? "الأثر الخارجي محمي" : "External impact protected") : (ar ? "لا توجد بوابة موافقة" : "No approval gate")}</strong><p>{definition.requiresExternalApproval ? (ar ? "سيتوقف الوكيل قبل أي إرسال أو كتابة خارجية." : "The agent will stop before any external send or write.") : (ar ? "راجع السياسة قبل نشر الوكيل." : "Review this policy before publishing.")}</p></div></div>
          <div className="builder-inspector__billing"><span>{ar ? "الجهة الدافعة" : "Billing source"}</span><strong>{definition.billingMode === "platform_credits" ? (ar ? "رصيد المنصة" : "Platform credits") : definition.billingMode.toUpperCase()}</strong></div>
        </aside>
      </div>
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
