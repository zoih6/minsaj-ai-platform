"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bot, ChevronDown, GitCompareArrows, Paperclip, RotateCcw, Send, Square, X } from "lucide-react";
import { Badge, NasaqMark } from "@nasaq/ui";
import type { Locale } from "@nasaq/contracts";

const copy = {
  ar: {
    title: "ما الذي تريد إنجازه؟",
    intro: "ابدأ بالمهمة. يمكنك تغيير النموذج أو المقارنة أو إضافة سياق المشروع قبل الإرسال.",
    placeholder: "اكتب سؤالك أو صف النتيجة التي تريدها…",
    model: "Clarity Pro",
    payer: "رصيد المنصة",
    compare: "مقارنة",
    attach: "ملف",
    starters: [
      ["حلّل سوقًا", "قارن المنافسين وحدد الفرص مع مصادر."],
      ["راجع مستندًا", "استخرج المخاطر والأسئلة والقرارات المفتوحة."],
      ["خطط لمشروع", "حوّل الهدف إلى مراحل ومخرجات ومعايير قبول."],
      ["اكتب مسودة", "أنشئ مسودة مهنية بنبرة وجمهور واضحين."],
    ],
    samplePrompt: "حلّل فرص إطلاق خدمة SaaS عربية في السوق السعودي، وميّز بين الأدلة والافتراضات.",
    response: "تشير المعطيات الأولية إلى فرصة واضحة في الفرق الصغيرة التي تستخدم عدة أدوات ذكاء اصطناعي دون سياق موحّد. أنصح بتقسيم الدراسة إلى ثلاثة محاور: حجم المشكلة الفعلية، استعداد الفرق للدفع مقابل التنظيم والحوكمة، وحساسية العملاء لمكان معالجة البيانات. هذه نتيجة أولية وليست تقديرًا لحجم السوق؛ الخطوة التالية هي جمع مصادر محلية ومقابلات مع مستخدمين محتملين قبل اتخاذ قرار تسعير.",
    working: "يحلل السؤال وينظم الإجابة…",
    stopped: "أوقفت التوليد",
    newChat: "محادثة جديدة",
    context: "دراسة إطلاق السوق السعودي",
    demoNotice: "محاكاة تفاعلية — لا يُرسل المحتوى إلى مزود خارجي.",
    fileName: "ملخص-المقابلات.pdf",
  },
  en: {
    title: "What do you want to accomplish?",
    intro: "Start with the task. You can switch models, compare, or add project context before sending.",
    placeholder: "Ask a question or describe the outcome you need…",
    model: "Clarity Pro",
    payer: "Platform credits",
    compare: "Compare",
    attach: "File",
    starters: [
      ["Analyze a market", "Compare competitors and identify sourced opportunities."],
      ["Review a document", "Extract risks, questions, and open decisions."],
      ["Plan a project", "Turn the goal into phases, outputs, and acceptance criteria."],
      ["Draft content", "Create a professional draft for a clear audience and tone."],
    ],
    samplePrompt: "Analyze the opportunity for an Arabic SaaS product in Saudi Arabia and separate evidence from assumptions.",
    response: "The early signal suggests a clear opportunity among small teams that use several AI tools without shared context. I would structure the study around three questions: how costly the fragmentation is today, whether teams will pay for organization and governance, and how sensitive buyers are to data-processing location. This is an initial direction, not a market-size estimate; the next step is to collect local sources and interview representative users before setting pricing.",
    working: "Analyzing the task and structuring the response…",
    stopped: "Generation stopped",
    newChat: "New chat",
    context: "Saudi market launch study",
    demoNotice: "Interactive simulation — content is not sent to an external provider.",
    fileName: "interview-summary.pdf",
  },
} as const;

export function ChatPrototype({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [draft, setDraft] = useState("");
  const [submittedPrompt, setSubmittedPrompt] = useState("");
  const [responseLength, setResponseLength] = useState(0);
  const [status, setStatus] = useState<"idle" | "streaming" | "completed" | "stopped">("idle");
  const [modelOpen, setModelOpen] = useState(false);
  const [compare, setCompare] = useState(false);
  const [attached, setAttached] = useState(false);
  const words = useMemo(() => t.response.split(" "), [t.response]);

  useEffect(() => {
    if (status !== "streaming") return;
    const timer = window.setInterval(() => {
      setResponseLength((length) => {
        if (length >= words.length) {
          window.clearInterval(timer);
          setStatus("completed");
          return length;
        }
        return Math.min(length + 2, words.length);
      });
    }, 52);
    return () => window.clearInterval(timer);
  }, [status, words.length]);

  function submit() {
    const value = draft.trim();
    if (!value) return;
    setSubmittedPrompt(value);
    setDraft("");
    setResponseLength(0);
    setStatus("streaming");
    setModelOpen(false);
  }

  function reset() {
    setDraft("");
    setSubmittedPrompt("");
    setResponseLength(0);
    setStatus("idle");
    setAttached(false);
  }

  if (status !== "idle") {
    return (
      <section className="conversation-demo" aria-live="polite">
        <div className="conversation-demo__header">
          <div><strong>{t.context}</strong><span>{compare ? (locale === "ar" ? "وضع المقارنة" : "Compare mode") : t.model} · {t.payer}</span></div>
          <button type="button" className="button button--outline button--compact" onClick={reset}><RotateCcw size={14} />{t.newChat}</button>
        </div>
        <div className="conversation-thread">
          <div className="user-message"><p>{submittedPrompt}</p>{attached ? <span className="attachment-chip"><Paperclip size={12} />{t.fileName}</span> : null}</div>
          <article className="assistant-message">
            <div className="assistant-mark"><NasaqMark size={30} /></div>
            <div className="assistant-copy">
              <div className="assistant-meta"><strong>{t.model}</strong><Badge tone="brand">{status === "streaming" ? (locale === "ar" ? "يكتب" : "Streaming") : (status === "stopped" ? t.stopped : (locale === "ar" ? "مكتمل" : "Completed"))}</Badge></div>
              <p>{words.slice(0, responseLength).join(" ")}{status === "streaming" ? <span className="stream-caret" aria-hidden="true" /> : null}</p>
              {status !== "streaming" ? <div className="response-receipt"><span>{locale === "ar" ? "إجابة تجريبية · 312 وحدة" : "Demo response · 312 units"}</span><strong className="ltr-value">$0.18</strong></div> : <p className="working-label">{t.working}</p>}
            </div>
          </article>
        </div>
        {status === "streaming" && typeof document !== "undefined" ? createPortal(<button className="stop-button" type="button" onClick={() => setStatus("stopped")}><Square size={12} fill="currentColor" />{locale === "ar" ? "إيقاف" : "Stop"}</button>, document.body) : null}
      </section>
    );
  }

  return (
    <section className="chat-start">
      <div className="chat-start__inner">
        <div className="chat-kicker"><NasaqMark size={42} /></div>
        <h1>{t.title}</h1>
        <p className="chat-start__intro">{t.intro}</p>
        <div className="demo-note"><span />{t.demoNotice}</div>
        <form className="composer-shell" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          {attached ? <div className="attachment-preview"><Paperclip size={13} /><span>{t.fileName}</span><button type="button" onClick={() => setAttached(false)} aria-label={locale === "ar" ? "إزالة الملف" : "Remove file"}><X size={13} /></button></div> : null}
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} />
          <div className="composer-bottom">
            <div className="composer-tools">
              <div className="model-control">
                <button type="button" className="composer-tool" onClick={() => setModelOpen((value) => !value)} aria-expanded={modelOpen}><Bot size={14} /><span>{t.model}</span><ChevronDown size={12} /></button>
                {modelOpen ? <div className="model-menu"><button type="button" className="is-selected" onClick={() => setModelOpen(false)}><span><strong>Clarity Pro</strong><small>{locale === "ar" ? "متوازن · بحث وتحليل" : "Balanced · research and analysis"}</small></span><span>✓</span></button><button type="button" onClick={() => setModelOpen(false)}><span><strong>Sprint Mini</strong><small>{locale === "ar" ? "سريع · تكلفة منخفضة" : "Fast · low cost"}</small></span></button></div> : null}
              </div>
              <button type="button" className={`composer-tool${compare ? " is-active" : ""}`} onClick={() => setCompare((value) => !value)}><GitCompareArrows size={14} /><span>{t.compare}</span></button>
              <button type="button" className={`composer-tool${attached ? " is-active" : ""}`} onClick={() => setAttached((value) => !value)}><Paperclip size={14} /><span>{t.attach}</span></button>
            </div>
            <button className="send-button" type="submit" disabled={!draft.trim()} aria-label={locale === "ar" ? "إرسال" : "Send"}><Send size={15} /></button>
          </div>
        </form>
        <div className="starter-grid">
          {t.starters.map(([title, description]: readonly [string, string], index: number) => <button className="starter" type="button" key={title} onClick={() => setDraft(index === 0 ? t.samplePrompt : `${title}: ${description}`)}><strong>{title}</strong><span>{description}</span></button>)}
        </div>
      </div>
    </section>
  );
}
