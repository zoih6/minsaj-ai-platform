"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { AlertTriangle, ArrowLeft, ArrowRight, Bot, Check, CheckCircle2, ChevronDown, CircleDollarSign, Clock3, Download, FileCheck2, FileText, Mail, Play, RotateCcw, ShieldCheck, Sparkles, X, XCircle } from "lucide-react";
import { Badge } from "@nasaq/ui";
import { localize, type Locale, type RunDetail, type RunStatus } from "@nasaq/contracts";
import { CostValue, DemoToast, RunStatusBadge } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
type ViewStepStatus = "queued" | "running" | "completed" | "waiting" | "skipped" | "failed";
type ViewStep = {
  id: string;
  type: "plan" | "model" | "tool" | "approval" | "artifact";
  label: { ar: string; en: string };
  detail: { ar: string; en: string };
  status: ViewStepStatus;
  durationMs: number | null;
  costUsd: number;
  toolName: string | undefined;
};

function toRunView(source: RunDetail) {
  return {
    id: source.summary.id,
    name: source.summary.title,
    status: source.summary.status,
    trigger: { ar: "تشغيل مجدول من مشروع الإطلاق", en: "Scheduled run from the launch project" },
    startedAt: source.summary.updatedAt,
    model: source.receipt.model,
    billingSource: source.receipt.payer,
    costActualUsd: source.receipt.actual.amountMinor / 100,
    costLimitUsd: source.receipt.reserved.amountMinor / 100,
    plan: source.objective,
    steps: source.steps.map((step, index): ViewStep => ({
      id: step.id,
      type: step.kind,
      label: step.label,
      detail: step.detail,
      status: step.status === "waiting_for_approval" ? "waiting" : step.status,
      durationMs: step.status === "completed" ? [1100, 18400, 9200][index] ?? 3100 : null,
      costUsd: step.cost.amountMinor / 100,
      toolName: step.kind === "tool" ? "web_search.read" : undefined,
    })),
    events: source.events.map((event) => ({ id: `event_${event.sequence}`, timestamp: event.occurredAt, message: event.label, actor: event.kind })),
    approval: source.approval ? {
      title: source.approval.title,
      summary: source.approval.explanation,
      scope: [
        { ar: "إرسال ملخص أسبوعي واحد إلى ٤ أعضاء", en: "Send one weekly digest to 4 members" },
        { ar: "المرفق المحدد في المعاينة فقط", en: "Only the attachment shown in the preview" },
      ],
      externalEffects: [source.approval.payloadPreview],
      costAfterApprovalUsd: source.receipt.reserved.amountMinor / 100,
      authorizedApprover: "Project owner · Sarah",
    } : undefined,
  };
}

export function RunDetailPrototype({ locale, initialRun }: { locale: Locale; initialRun: RunDetail }) {
  const ar = locale === "ar";
  const run = toRunView(initialRun);
  const [runStatus, setRunStatus] = useState<RunStatus>(run.status);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject">("approve");
  const [reason, setReason] = useState("");
  const [receiptReady, setReceiptReady] = useState(run.status === "completed" || run.status === "completed_with_warnings");
  const [notice, setNotice] = useState("");
  const [eventsOpen, setEventsOpen] = useState(false);
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  const approval = run.approval;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function confirmDecision() {
    setDecisionOpen(false);
    if (decision === "reject") {
      setRunStatus("cancelled");
      setNotice(ar ? "رُفض الطلب وأُلغي الأثر الخارجي. لم يُرسل أي شيء." : "Request rejected and external impact cancelled. Nothing was sent.");
      return;
    }
    setRunStatus("running");
    setNotice(ar ? "سُجلت الموافقة؛ ينفذ التدفق الخطوة المصرّح بها فقط." : "Approval recorded; the flow is executing only the authorized step.");
    window.setTimeout(() => { setRunStatus("completed"); setReceiptReady(true); }, 850);
  }

  function downloadReceipt() {
    const payload = {
      id: `rcpt_${run.id}`,
      runId: run.id,
      decision: runStatus === "cancelled" ? "rejected" : "approved",
      reason: reason || (ar ? "مراجعة بشرية للمسودة والتكلفة والنطاق" : "Human review of draft, cost, and scope"),
      payer: run.billingSource,
      actualCostUsd: runStatus === "completed" ? 1.12 : run.costActualUsd,
      externalEffect: runStatus === "completed" ? "Weekly digest sent to the approved recipient list" : "No external effect",
      simulated: true,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payload.id}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(ar ? "نُزّل إيصال JSON محليًا." : "JSON receipt downloaded locally.");
  }

  const timelineSteps = run.steps.map((step) => {
    if (step.type === "approval") return { ...step, status: runStatus === "waiting_for_approval" ? "waiting" as const : runStatus === "cancelled" ? "failed" as const : "completed" as const };
    if (step.status === "queued" && runStatus === "completed") return { ...step, status: "completed" as const };
    if (step.status === "queued" && runStatus === "running") return { ...step, status: "running" as const };
    if (step.status === "queued" && runStatus === "cancelled") return { ...step, status: "skipped" as const };
    return step;
  });

  return (
    <div className="ops-page run-detail-page">
      <ScrollFx />
      <Link className="back-link" href={`/${locale}/app/runs`}><DirectionArrow size={14} />{ar ? "سجل التشغيلات" : "Run history"}</Link>
      <header className="run-detail-hero">
        <div className="run-detail-hero__identity"><span className="run-detail-hero__icon"><Play size={19} /></span><div><div className="run-detail-hero__meta"><RunStatusBadge locale={locale} status={runStatus} /><span className="mono">{run.id}</span></div><h1>{localize(run.name, locale)}</h1><p>{localize(run.trigger, locale)} · {run.startedAt ? (ar ? "بدأ منذ دقيقتين" : "Started 2 minutes ago") : ""}</p></div></div>
        <div className="run-detail-hero__actions"><button className="button button--quiet button--default" type="button" onClick={() => setNotice(ar ? "جُهزت نسخة إعادة تشغيل محلية دون تنفيذ." : "A local rerun draft was prepared without execution.")}><RotateCcw size={14} />{ar ? "إعادة التشغيل" : "Rerun"}</button>{receiptReady || runStatus === "cancelled" ? <button className="button button--outline button--default" type="button" onClick={downloadReceipt}><Download size={14} />{ar ? "تنزيل الإيصال" : "Download receipt"}</button> : null}</div>
      </header>

      {runStatus === "waiting_for_approval" ? <section className="safe-stop-banner"><span><ShieldCheck size={20} /></span><div><strong>{ar ? "توقف آمن قبل الأثر الخارجي" : "Safely paused before external impact"}</strong><p>{ar ? "اكتمل البحث وصياغة الملخص. لم يُرسل البريد حتى يراجع إنسان مخوّل النطاق والتكلفة والمستلمين." : "Research and drafting are complete. No email is sent until an authorized human reviews scope, cost, and recipients."}</p></div><Badge tone="warning">{ar ? "لا أثر حتى الآن" : "No effect yet"}</Badge></section> : null}
      {runStatus === "completed" ? <section className="completed-banner"><span><CheckCircle2 size={20} /></span><div><strong>{ar ? "اكتمل التشغيل ضمن الموافقة" : "Run completed within approval scope"}</strong><p>{ar ? "أُرسل الملخص إلى القائمة المعتمدة فقط، وسُجلت التكلفة والقرار في إيصال غير ملتبس." : "The digest was sent only to the approved list; cost and decision were recorded in an unambiguous receipt."}</p></div></section> : null}
      {runStatus === "cancelled" ? <section className="cancelled-banner"><span><XCircle size={20} /></span><div><strong>{ar ? "رُفض الطلب وأُلغي التشغيل" : "Request rejected and run cancelled"}</strong><p>{ar ? "احتُفظ بالمسودة وسجل القرار، ولم يحدث أي إرسال أو تعديل خارجي." : "The draft and decision record were retained; no external send or change occurred."}</p></div></section> : null}

      <div className="run-detail-layout">
        <main className="run-detail-main">
          <section className="run-plan-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "الخطة المنفذة" : "Execution plan"}</p><h2>{ar ? "خطوات يمكن تتبعها خطوة بخطوة" : "A plan traceable step by step"}</h2></div><Badge tone="brand">{run.model}</Badge></div><p>{localize(run.plan, locale)}</p></section>

          <section className="run-timeline-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "المخطط الزمني" : "Timeline"}</p><h2>{ar ? "سجل التنفيذ" : "Execution record"}</h2></div><span className="timeline-live"><i />{runStatus === "running" ? (ar ? "ينفذ الآن" : "Running now") : runStatus === "waiting_for_approval" ? (ar ? "بانتظار قرار" : "Awaiting decision") : (ar ? "السجل نهائي" : "Record final")}</span></div><ol className="run-timeline">{timelineSteps.map((step, index) => <li key={step.id} className={`is-${step.status}`}><div className="run-timeline__rail"><span>{step.status === "completed" ? <Check size={13} /> : step.status === "failed" || step.status === "skipped" ? <X size={13} /> : step.status === "running" ? <span className="test-pulse" /> : index + 1}</span><i /></div><div className="run-timeline__content"><div className="run-timeline__head"><div><strong>{localize(step.label, locale)}</strong><small>{localize(step.detail, locale)}</small></div><Badge tone={step.status === "waiting" ? "warning" : step.status === "completed" ? "success" : step.status === "failed" ? "danger" : "neutral"}>{step.status === "completed" ? (ar ? "مكتمل" : "Complete") : step.status === "waiting" ? (ar ? "ينتظر" : "Waiting") : step.status === "running" ? (ar ? "يعمل" : "Running") : step.status === "skipped" ? (ar ? "تُخطيت" : "Skipped") : (ar ? "مرفوض" : "Rejected")}</Badge></div><div className="run-timeline__meta"><span><Clock3 size={12} />{step.durationMs ? `${(step.durationMs / 1000).toFixed(1)}s` : "—"}</span><span><CircleDollarSign size={12} /><CostValue value={step.costUsd} locale={locale} /></span>{step.toolName ? <span className="mono">{step.toolName}</span> : null}</div></div></li>)}</ol></section>

          <section className="run-output-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "المخرج المقترح" : "Proposed output"}</p><h2>{ar ? "ملخص المراقبة الأسبوعي" : "Weekly monitoring digest"}</h2></div><Badge>{ar ? "مسودة قابلة للمراجعة" : "Reviewable draft"}</Badge></div><div className="output-document"><div className="output-document__head"><span><FileText size={17} /></span><div><strong>{ar ? "٣ تغيّرات تستحق الانتباه" : "3 changes worth attention"}</strong><small>{ar ? "٤ مصادر موثقة · مستوى الثقة مرتفع" : "4 cited sources · high confidence"}</small></div></div><ul><li><strong>{ar ? "تحديث نافذة الامتثال" : "Compliance window updated"}</strong><span>{ar ? "أصبح الإيداع مطلوبًا خلال ١٥ يومًا بدل ٣٠." : "Submission is now required within 15 days instead of 30."}</span></li><li><strong>{ar ? "إرشادات إفصاح جديدة" : "New disclosure guidance"}</strong><span>{ar ? "تضيف توضيحًا إلزاميًا إلى ملخصات العملاء." : "Adds a mandatory clarification to client summaries."}</span></li><li><strong>{ar ? "إشارة تحتاج مراجعة" : "Signal requiring review"}</strong><span>{ar ? "مصدر ثانوي فقط؛ استُبعدت من التوصية النهائية." : "Secondary source only; excluded from the final recommendation."}</span></li></ul></div></section>

          <button className="event-disclosure" type="button" aria-expanded={eventsOpen} onClick={() => setEventsOpen((open) => !open)}><span><FileCheck2 size={16} />{ar ? "الأحداث التقنية" : "Technical events"}<Badge>{run.events.length}</Badge></span><ChevronDown size={15} className={eventsOpen ? "is-open" : ""} /></button>{eventsOpen ? <section className="technical-events"><table><thead><tr><th>{ar ? "الوقت" : "Time"}</th><th>{ar ? "الحدث" : "Event"}</th><th>{ar ? "الفاعل" : "Actor"}</th></tr></thead><tbody>{run.events.map((event) => <tr key={event.id}><td className="mono">{new Date(event.timestamp).toISOString().slice(11, 19)}</td><td>{localize(event.message, locale)}</td><td className="mono">{event.actor}</td></tr>)}</tbody></table></section> : null}
        </main>

        <aside className="run-inspector">
          <section className="run-facts"><p className="section-kicker">{ar ? "حساب التشغيل" : "Run accounting"}</p><h2>{ar ? "تكلفة وحدود ظاهرة" : "Visible cost and limits"}</h2><dl><div><dt>{ar ? "النموذج" : "Model"}</dt><dd className="mono">{run.model}</dd></div><div><dt>{ar ? "الجهة الدافعة" : "Billing source"}</dt><dd>{run.billingSource === "platform_credits" ? (ar ? "رصيد المنصة" : "Platform credits") : run.billingSource.toUpperCase()}</dd></div><div><dt>{ar ? "التكلفة حتى الآن" : "Cost so far"}</dt><dd><CostValue value={runStatus === "completed" ? 1.12 : run.costActualUsd} locale={locale} /></dd></div><div><dt>{ar ? "السقف" : "Ceiling"}</dt><dd><CostValue value={run.costLimitUsd} locale={locale} /></dd></div></dl><div className="run-cost-meter"><div><span>{ar ? "استخدام السقف" : "Ceiling used"}</span><b>{runStatus === "completed" ? "93%" : "80%"}</b></div><div role="progressbar" aria-label={ar ? "استخدام سقف تكلفة التشغيل" : "Run cost ceiling usage"} aria-valuenow={runStatus === "completed" ? 93 : 80} aria-valuemin={0} aria-valuemax={100}><span style={{ width: runStatus === "completed" ? "93%" : "80%" }} /></div></div></section>

          {approval && runStatus === "waiting_for_approval" ? <section className="approval-decision-card"><div className="approval-decision-card__head"><span><ShieldCheck size={18} /></span><div><p className="section-kicker">{ar ? "بوابة موافقة" : "Approval gate"}</p><h2>{localize(approval.title, locale)}</h2></div></div><p>{localize(approval.summary, locale)}</p><div className="approval-scope"><h3>{ar ? "نطاق القرار" : "Decision scope"}</h3>{approval.scope.map((item) => <div key={item.ar}><CheckCircle2 size={14} /><span>{localize(item, locale)}</span></div>)}</div><div className="approval-effect"><AlertTriangle size={15} /><div><strong>{ar ? "الأثر الخارجي" : "External effect"}</strong><p>{approval.externalEffects.length ? localize(approval.externalEffects[0]!, locale) : (ar ? "لا يوجد" : "None")}</p></div></div><dl><div><dt>{ar ? "تكلفة بعد الموافقة" : "Cost after approval"}</dt><dd><CostValue value={approval.costAfterApprovalUsd} locale={locale} /></dd></div><div><dt>{ar ? "الموافق المخوّل" : "Authorized approver"}</dt><dd>{approval.authorizedApprover}</dd></div></dl><div className="approval-decision-card__actions"><button className="button button--primary button--default" type="button" onClick={() => { setDecision("approve"); setDecisionOpen(true); }}><Check size={14} />{ar ? "مراجعة والموافقة" : "Review and approve"}</button><button className="button button--quiet button--default" type="button" onClick={() => { setDecision("reject"); setDecisionOpen(true); }}><X size={14} />{ar ? "رفض" : "Reject"}</button></div></section> : null}

          {receiptReady || runStatus === "cancelled" ? <section className="approval-receipt"><div className="approval-receipt__seal"><FileCheck2 size={19} /></div><p className="section-kicker">{ar ? "إيصال قرار" : "Decision receipt"}</p><h2>{runStatus === "cancelled" ? (ar ? "رفض موثق" : "Documented rejection") : (ar ? "موافقة وتنفيذ موثقان" : "Approval and execution recorded")}</h2><Badge tone={runStatus === "cancelled" ? "danger" : "success"}>{runStatus === "cancelled" ? (ar ? "لا أثر خارجي" : "No external effect") : (ar ? "تم ضمن النطاق" : "Within scope")}</Badge><dl><div><dt>{ar ? "القرار" : "Decision"}</dt><dd>{runStatus === "cancelled" ? (ar ? "مرفوض" : "Rejected") : (ar ? "موافق عليه" : "Approved")}</dd></div><div><dt>{ar ? "التكلفة النهائية" : "Final cost"}</dt><dd><CostValue value={runStatus === "completed" ? 1.12 : run.costActualUsd} locale={locale} /></dd></div><div><dt>{ar ? "السبب" : "Reason"}</dt><dd>{reason || (ar ? "مراجعة النطاق والمستلمين" : "Scope and recipient review")}</dd></div></dl><button className="button button--outline button--default" type="button" onClick={downloadReceipt}><Download size={14} />{ar ? "تنزيل JSON" : "Download JSON"}</button></section> : null}
        </aside>
      </div>

      <Dialog.Root open={decisionOpen} onOpenChange={setDecisionOpen}><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="approval-dialog" aria-describedby="decision-description"><div className="approval-dialog__header"><span className={decision === "approve" ? "is-approve" : "is-reject"}>{decision === "approve" ? <ShieldCheck size={20} /> : <XCircle size={20} />}</span><div><Dialog.Title>{decision === "approve" ? (ar ? "تأكيد الموافقة" : "Confirm approval") : (ar ? "تأكيد الرفض" : "Confirm rejection")}</Dialog.Title><Dialog.Description id="decision-description">{decision === "approve" ? (ar ? "ستصرّح بخطوة الإرسال المحددة فقط. لا يمتد القرار إلى تشغيلات لاحقة." : "You authorize only the specified send step. This decision does not apply to future runs.") : (ar ? "سيُلغى الإرسال وتُحفظ المسودة وسجل القرار." : "The send will be cancelled while retaining the draft and decision record.")}</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label={ar ? "إغلاق" : "Close"}><X size={16} /></button></Dialog.Close></div><div className="approval-dialog__scope"><div><Mail size={15} /><span><strong>{ar ? "الإجراء" : "Action"}</strong><small>{ar ? "إرسال ملخص أسبوعي واحد" : "Send one weekly digest"}</small></span></div><div><CircleDollarSign size={15} /><span><strong>{ar ? "السقف النهائي" : "Final ceiling"}</strong><small>$1.20 · {ar ? "رصيد المنصة" : "Platform credits"}</small></span></div><div><Bot size={15} /><span><strong>{ar ? "المنفذ" : "Executor"}</strong><small>{run.model}</small></span></div></div><label className="field"><span>{ar ? "سبب القرار" : "Decision reason"}</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={decision === "approve" ? (ar ? "راجعت المستلمين والمحتوى والتكلفة…" : "I reviewed recipients, content, and cost…") : (ar ? "وضح ما يجب تغييره قبل إعادة المحاولة…" : "Explain what must change before retrying…")} required /></label><div className="approval-dialog__note"><Sparkles size={14} /><p>{ar ? "محاكاة Frontend فقط: لا يُرسل بريد ولا تُستهلك أرصدة حقيقية." : "Frontend simulation only: no email is sent and no real credits are used."}</p></div><div className="form-dialog__actions"><Dialog.Close asChild><button className="button button--quiet button--default" type="button">{ar ? "إلغاء" : "Cancel"}</button></Dialog.Close><button className={`button button--default ${decision === "approve" ? "button--primary" : "button--danger"}`} type="button" disabled={!reason.trim()} onClick={confirmDecision}>{decision === "approve" ? <Check size={14} /> : <X size={14} />}{decision === "approve" ? (ar ? "موافقة وتنفيذ" : "Approve and execute") : (ar ? "رفض وإلغاء" : "Reject and cancel")}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
