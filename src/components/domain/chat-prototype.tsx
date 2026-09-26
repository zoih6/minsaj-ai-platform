"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bot, Check, ChevronDown, Copy, GitCompareArrows, Paperclip, RotateCcw, Send, Square, X } from "lucide-react";
import { Badge, MinsajMark } from "@minsaj/ui";
import type { Locale } from "@minsaj/contracts";

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
    ],
    samplePrompt: "حلّل فرص إطلاق خدمة SaaS عربية في السوق السعودي، وميّز بين الأدلة والافتراضات.",
    response: "تشير المعطيات الأولية إلى فرصة واضحة في الفرق الصغيرة التي تستخدم عدة أدوات ذكاء اصطناعي دون سياق موحّد. أنصح بتقسيم الدراسة إلى ثلاثة محاور: حجم المشكلة الفعلية، استعداد الفرق للدفع مقابل التنظيم والحوكمة، وحساسية العملاء لمكان معالجة البيانات. هذه نتيجة أولية وليست تقديرًا لحجم السوق؛ الخطوة التالية هي جمع مصادر محلية ومقابلات مع مستخدمين محتملين قبل اتخاذ قرار تسعير.",
    working: "يحلل السؤال وينظم الإجابة…",
    stopped: "أوقفت التوليد",
    newChat: "محادثة جديدة",
    context: "دراسة إطلاق السوق السعودي",
    demoNotice: "محاكاة تفاعلية — لا يُرسل المحتوى إلى مزود خارجي.",
    fileName: "ملخص-المقابلات.pdf",
    codeLang: "JSON",
    copyCode: "نسخ",
    copied: "تم النسخ",
    codeCaption: "هيكل الدراسة المقترح",
    codeSnippet: ["{", "  \"axes\": [", "    \"fragmentation_cost\",", "    \"willingness_to_pay\",", "    \"data_location_sensitivity\"", "  ],", "  \"next_step\": \"local_sources + user_interviews\",", "  \"confidence\": \"preliminary\"", "}"].join("\n"),
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
    ],
    samplePrompt: "Analyze the opportunity for an Arabic SaaS product in Saudi Arabia and separate evidence from assumptions.",
    response: "The early signal suggests a clear opportunity among small teams that use several AI tools without shared context. I would structure the study around three questions: how costly the fragmentation is today, whether teams will pay for organization and governance, and how sensitive buyers are to data-processing location. This is an initial direction, not a market-size estimate; the next step is to collect local sources and interview representative users before setting pricing.",
    working: "Analyzing the task and structuring the response…",
    stopped: "Generation stopped",
    newChat: "New chat",
    context: "Saudi market launch study",
    demoNotice: "Interactive simulation — content is not sent to an external provider.",
    fileName: "interview-summary.pdf",
    codeLang: "JSON",
    copyCode: "Copy",
    copied: "Copied",
    codeCaption: "Proposed study structure",
    codeSnippet: ["{", "  \"axes\": [", "    \"fragmentation_cost\",", "    \"willingness_to_pay\",", "    \"data_location_sensitivity\"", "  ],", "  \"next_step\": \"local_sources + user_interviews\",", "  \"confidence\": \"preliminary\"", "}"].join("\n"),
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
  /* W9-5/م2 (Bible §6.2): auto-scroll stays pinned while the user rides the
     bottom edge; scrolling up >100px unpins it, the ↓ button (or returning
     to the bottom) re-pins. The copy checkmark is transient. */
  const [pinned, setPinned] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const words = useMemo(() => t.response.split(" "), [t.response]);
  const caretRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (status !== "streaming") return;
    const timer = window.setInterval(() => {
      setResponseLength((length) => {
        if (length >= words.length) {
          window.clearInterval(timer);
          setStatus("completed");
          return length;
        }
        /* W9-5/م2: one word per 70ms — a readable streaming pace (was 2 words
           per 52ms, which finished before the eye could follow and raced the
           scroll-takeover window). */
        return Math.min(length + 1, words.length);
      });
    }, 70);
    return () => window.clearInterval(timer);
  }, [status, words.length]);

  /* While pinned, every streamed chunk keeps the caret inside the viewport.
     Instant — html{scroll-behavior:smooth} would turn "auto" into a smooth
     animation that fights the user's own scroll jumps and can re-pin the
     stream against their intent. */
  useEffect(() => {
    if (status !== "streaming" || !pinned) return;
    caretRef.current?.scrollIntoView({ behavior: "instant", block: "end" });
  }, [responseLength, status, pinned]);

  /* Distance-from-bottom drives the pin: >100px up = the user took over. */
  useEffect(() => {
    if (status !== "streaming") return;
    const readPin = () => {
      const gap = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setPinned(gap <= 100);
    };
    window.addEventListener("scroll", readPin, { passive: true });
    return () => window.removeEventListener("scroll", readPin);
  }, [status]);

  function resumeAutoScroll() {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    setPinned(true);
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(t.codeSnippet);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1600);
    } catch {
      /* clipboard unavailable (permissions/iframe) — the demo degrades quietly */
    }
  }

  function submit() {
    const value = draft.trim();
    if (!value) return;
    setSubmittedPrompt(value);
    setDraft("");
    setResponseLength(0);
    setStatus("streaming");
    setModelOpen(false);
    setPinned(true);
  }

  function stop() {
    setStatus("stopped");
  }

  function reset() {
    setDraft("");
    setSubmittedPrompt("");
    setResponseLength(0);
    setStatus("idle");
    setAttached(false);
    setPinned(true);
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
            <div className="assistant-mark"><MinsajMark size={28} /></div>
            <div className="assistant-copy">
              <div className="assistant-meta"><strong>{t.model}</strong><Badge tone="brand">{status === "streaming" ? (locale === "ar" ? "يكتب" : "Streaming") : (status === "stopped" ? t.stopped : (locale === "ar" ? "مكتمل" : "Completed"))}</Badge></div>
              <p>{words.slice(0, responseLength).join(" ")}{status === "streaming" ? <span ref={caretRef} className="stream-caret" aria-hidden="true" /> : null}</p>
              {status !== "streaming" ? (
                <>
                  {/* W9-5/م2 (Bible §6.2): code block with a [lang][copy] header */}
                  <figure className="chat-code-block" data-testid="chat-code-block">
                    <figcaption className="chat-code-block__head">
                      <span className="chat-code-block__lang">{t.codeLang}</span>
                      <span className="chat-code-block__caption">{t.codeCaption}</span>
                      <button type="button" className="chat-code-block__copy" onClick={copyCode} data-copied={codeCopied} aria-label={codeCopied ? t.copied : t.copyCode}>
                        {codeCopied ? <Check size={13} /> : <Copy size={13} />}{codeCopied ? t.copied : t.copyCode}
                      </button>
                    </figcaption>
                    <pre><code>{t.codeSnippet}</code></pre>
                  </figure>
                  <div className="response-receipt"><span>{locale === "ar" ? "إجابة تجريبية · 312 وحدة" : "Demo response · 312 units"}</span><strong className="ltr-value">$0.18</strong></div>
                </>
              ) : <p className="working-label">{t.working}</p>}
            </div>
          </article>
        </div>
        {/* §6.2: the composer stays reachable — sticky bottom, send becomes stop while streaming */}
        <form className="composer-shell conversation-composer" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} aria-label={t.placeholder} rows={2} />
          <div className="composer-bottom">
            <div className="composer-tools">
              <span className="conversation-composer__hint">{locale === "ar" ? "محاكاة: الإرسال يعيد تشغيل الإجابة التجريبية" : "Simulation: sending replays the demo response"}</span>
            </div>
            {status === "streaming"
              ? <button type="button" className="send-button" onClick={stop} aria-label={locale === "ar" ? "إيقاف" : "Stop"}><Square size={14} fill="currentColor" /></button>
              : <button type="submit" className="send-button" disabled={!draft.trim()} aria-label={locale === "ar" ? "إرسال" : "Send"}><Send size={16} /></button>}
          </div>
        </form>
        {/* §6.2: ↓ appears only when the user took over the scroll (>100px up) */}
        {status === "streaming" && !pinned ? (
          <button type="button" className="chat-scroll-down" onClick={resumeAutoScroll} aria-label={locale === "ar" ? "العودة إلى أحدث نص" : "Jump to latest"}>
            <ChevronDown size={16} />
          </button>
        ) : null}
      </section>
    );
  }

  return (
    <section className="chat-start">
      <div className="chat-start__inner">
        <div className="chat-kicker"><MinsajMark size={46} /></div>
        <h1>{t.title}</h1>
        <p className="chat-start__intro">{t.intro}</p>
        <div className="demo-note"><span />{t.demoNotice}</div>
        <form className="composer-shell" onSubmit={(event) => { event.preventDefault(); submit(); }}>
          {attached ? <div className="attachment-preview"><Paperclip size={14} /><span>{t.fileName}</span><button type="button" onClick={() => setAttached(false)} aria-label={locale === "ar" ? "إزالة الملف" : "Remove file"}><X size={14} /></button></div> : null}
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
            <button className="send-button" type="submit" disabled={!draft.trim()} aria-label={locale === "ar" ? "إرسال" : "Send"}><Send size={16} /></button>
          </div>
        </form>
        <div className="starter-grid">
          {t.starters.map(([title, description]: readonly [string, string], index: number) => <button className="starter" type="button" key={title} onClick={() => setDraft(index === 0 ? t.samplePrompt : `${title}: ${description}`)}><strong>{title}</strong><span>{description}</span></button>)}
        </div>
      </div>
    </section>
  );
}
