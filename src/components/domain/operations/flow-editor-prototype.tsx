"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Bot, Check, CheckSquare2, ChevronDown, CircleStop, Clock3, GitFork, Grip, Mail, Play, Plus, Save, Settings2, ShieldCheck, Sparkles, TimerReset, Trash2, Workflow } from "lucide-react";
import { Badge } from "@minsaj/ui";
import { localize, type FlowDefinition, type LocalizedText, type Locale } from "@minsaj/contracts";
import { DemoToast } from "./shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
type EditorNodeType = "input" | "agent" | "transform" | "approval" | "output";
type EditorNode = { id: string; type: EditorNodeType; label: LocalizedText; description: LocalizedText; position: { x: number; y: number } };
type EditorFlow = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  status: "draft" | "published" | "archived";
  version: number;
  nodes: EditorNode[];
  edges: Array<{ id: string; from: string; to: string }>;
  validation: { errors: number; warnings: number };
  requiresApproval: boolean;
};

const nodeIcons: Record<EditorNodeType, typeof Workflow> = { input: TimerReset, agent: Bot, transform: GitFork, approval: CheckSquare2, output: Mail };
const nodeNames: Record<EditorNodeType, LocalizedText> = {
  input: { ar: "مدخل", en: "Input" }, agent: { ar: "وكيل", en: "Agent" }, transform: { ar: "تحويل", en: "Transform" },
  approval: { ar: "موافقة", en: "Approval" }, output: { ar: "مخرج", en: "Output" },
};
const nodeDescriptions: Record<EditorNodeType, LocalizedText> = {
  input: { ar: "يبدأ التدفق بهدف ونطاق", en: "Starts with an objective and scope" },
  agent: { ar: "ينفذ مهمة منضبطة", en: "Performs a governed task" },
  transform: { ar: "ينظم ويقارن النتائج", en: "Organizes and compares results" },
  approval: { ar: "يوقف التنفيذ حتى قرار بشري", en: "Pauses execution for a human decision" },
  output: { ar: "يحفظ أو يرسل النتيجة", en: "Stores or sends the result" },
};

function toEditorFlow(source: FlowDefinition): EditorFlow {
  return {
    id: source.summary.id,
    name: source.summary.name,
    description: source.summary.description,
    status: source.summary.status,
    version: source.summary.version,
    nodes: source.nodes.map((node, index) => ({ ...node, position: { x: 28 + index * 174, y: index % 2 === 0 ? 140 : 290 } })),
    edges: source.edges.map((edge, index) => ({ ...edge, id: `edge_${index + 1}` })),
    validation: source.validation,
    requiresApproval: source.nodes.some((node) => node.type === "approval"),
  };
}

export function FlowEditorPrototype({ locale, initialDefinition, isNew = false }: { locale: Locale; initialDefinition: FlowDefinition; isNew?: boolean }) {
  const ar = locale === "ar";
  const [flow, setFlow] = useState<EditorFlow>(() => toEditorFlow(initialDefinition));
  const [selectedId, setSelectedId] = useState(initialDefinition.nodes[0]?.id ?? "");
  const [dirty, setDirty] = useState(isNew);
  const [testState, setTestState] = useState<"idle" | "running" | "waiting">("idle");
  const [notice, setNotice] = useState("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  const selected = flow.nodes.find((node) => node.id === selectedId) ?? null;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function setNodes(nodes: EditorNode[]) {
    setFlow((current) => ({ ...current, nodes, edges: current.edges.filter((edge) => nodes.some((node) => node.id === edge.from) && nodes.some((node) => node.id === edge.to)) }));
    setDirty(true);
  }

  function addNode(type: EditorNodeType) {
    const id = `node_demo_${flow.nodes.length + 1}`;
    const last = flow.nodes.at(-1);
    const next: EditorNode = { id, type, label: nodeNames[type], description: nodeDescriptions[type], position: { x: last ? Math.min(last.position.x + 190, 690) : 120, y: last && last.position.x > 580 ? last.position.y + 145 : (last?.position.y ?? 120) } };
    setFlow((current) => ({ ...current, nodes: [...current.nodes, next], edges: last ? [...current.edges, { id: `edge_${last.id}_${id}`, from: last.id, to: id }] : current.edges }));
    setSelectedId(id);
    setDirty(true);
  }

  function updateSelected(patch: Partial<EditorNode>) {
    if (!selected) return;
    setNodes(flow.nodes.map((node) => node.id === selected.id ? { ...node, ...patch } : node));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(24, Math.min(696, event.clientX - rect.left - 88));
    const y = Math.max(24, Math.min(500, event.clientY - rect.top - 40));
    setNodes(flow.nodes.map((node) => node.id === id ? { ...node, position: { x, y } } : node));
  }

  function runTest() {
    setTestState("running");
    window.setTimeout(() => setTestState("waiting"), 800);
  }

  return (
    <div className="flow-editor-page">
      <ScrollFx />
      <header className="builder-topbar flow-editor-topbar">
        <div className="builder-topbar__identity"><Link className="icon-button" href={`/${locale}/app/flows`} aria-label={ar ? "العودة إلى التدفقات" : "Back to flows"}><DirectionArrow size={18} /></Link><span className="builder-topbar__divider" /><span className="flow-title-icon"><Workflow size={18} /></span><div><div><h1>{isNew ? (ar ? "تدفق جديد" : "New flow") : localize(flow.name, locale)}</h1><Badge tone={flow.status === "published" ? "success" : "warning"}>{flow.status === "published" ? (ar ? "نشط" : "Active") : (ar ? "مسودة" : "Draft")}</Badge>{dirty ? <span className="unsaved-dot">{ar ? "تغييرات غير محفوظة" : "Unsaved changes"}</span> : null}</div><p className="mono">V{flow.version} · {flow.id}</p></div></div>
        <div className="builder-topbar__actions"><button className="button button--quiet button--default" type="button" onClick={() => { setDirty(false); setNotice(ar ? "حُفظت المسودة محليًا." : "Draft saved locally."); }}><Save size={14} />{ar ? "حفظ" : "Save"}</button><button className="button button--outline button--default" type="button" onClick={runTest} disabled={testState === "running"}><Play size={14} />{testState === "running" ? (ar ? "يُختبر…" : "Testing…") : (ar ? "اختبار التدفق" : "Test flow")}</button><button className="button button--primary button--default" type="button" onClick={() => { setFlow((current) => ({ ...current, status: "published" })); setDirty(false); setNotice(ar ? "نُشر التدفق في المحاكاة." : "Flow published in the simulation."); }}><Check size={14} />{ar ? "نشر" : "Publish"}</button></div>
      </header>

      <div className="flow-editor-shell">
        <aside className="node-palette"><div className="node-palette__heading"><p>{ar ? "مكتبة العقد" : "Node library"}</p><span>{ar ? "اسحب أو أضف" : "Drag or add"}</span></div><div className="node-palette__list">{(Object.keys(nodeIcons) as EditorNodeType[]).map((type) => { const Icon = nodeIcons[type]; return <button type="button" key={type} onClick={() => addNode(type)}><span><Icon size={16} /></span><span><strong>{localize(nodeNames[type], locale)}</strong><small>{localize(nodeDescriptions[type], locale)}</small></span><Plus size={14} /></button>; })}</div><div className="node-palette__help"><Sparkles size={16} /><p>{ar ? "ضع بوابة موافقة مباشرة قبل أي عقدة ترسل أو تكتب خارج منسج." : "Place an approval gate immediately before any node that sends or writes outside Minsaj."}</p></div></aside>

        <main className="flow-canvas-panel">
          <div className="flow-canvas-toolbar"><div><button type="button" className="is-active">{ar ? "التصميم" : "Design"}</button><button type="button">{ar ? "سجل الإصدارات" : "Versions"}</button></div><div><span>{ar ? `${flow.nodes.length} عقد` : `${flow.nodes.length} nodes`}</span><button className="icon-button" type="button" aria-label={ar ? "إعدادات اللوحة" : "Canvas settings"}><Settings2 size={16} /></button></div></div>
          <div className="flow-canvas-scroll">
            <div className="flow-canvas" ref={canvasRef} dir="ltr" onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
              <div className="flow-canvas-grid" />
              <svg className="flow-edges" viewBox="0 0 900 620" aria-hidden="true">{flow.edges.map((edge) => { const from = flow.nodes.find((node) => node.id === edge.from); const to = flow.nodes.find((node) => node.id === edge.to); if (!from || !to) return null; const x1 = from.position.x + 176; const y1 = from.position.y + 42; const x2 = to.position.x; const y2 = to.position.y + 42; const mid = (x1 + x2) / 2; return <path key={edge.id} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} />; })}</svg>
              {flow.nodes.map((node, index) => { const Icon = nodeIcons[node.type]; const needsApproval = node.type === "approval"; return <article draggable key={node.id} className={`flow-node flow-node--${node.type} ${selectedId === node.id ? "is-selected" : ""}`} style={{ left: node.position.x, top: node.position.y }} onDragStart={(event) => event.dataTransfer.setData("text/plain", node.id)} onClick={() => setSelectedId(node.id)} dir={ar ? "rtl" : "ltr"} aria-label={`${localize(nodeNames[node.type], locale)}: ${localize(node.label, locale)}`}><span className="flow-node__port flow-node__port--in" /><div className="flow-node__head"><span><Icon size={16} /></span><small>{localize(nodeNames[node.type], locale)}</small><Grip size={14} /></div><strong>{localize(node.label, locale)}</strong><div className="flow-node__footer"><span>{index + 1}</span>{needsApproval ? <Badge tone="warning">{ar ? "توقّف" : "Pause"}</Badge> : <span>{ar ? "جاهز" : "Ready"}</span>}</div><span className="flow-node__port flow-node__port--out" /></article>; })}
              <div className="flow-start-label" style={{ left: 20, top: (flow.nodes[0]?.position.y ?? 140) + 29 }}>{ar ? "ابدأ" : "Start"}</div>
            </div>
          </div>
          {testState !== "idle" ? <div className={`flow-test-bar is-${testState}`}><span className="flow-test-bar__icon">{testState === "running" ? <Clock3 size={16} /> : <ShieldCheck size={16} />}</span><div><strong>{testState === "running" ? (ar ? "ينفذ اختبارًا حتميًا…" : "Running deterministic test…") : (ar ? "توقف بأمان عند بوابة الموافقة" : "Stopped safely at the approval gate")}</strong><small>{testState === "running" ? (ar ? "لا تُستدعى خدمات خارجية" : "No external services are called") : (ar ? "المسودة جاهزة للمراجعة؛ لم يُرسل أي بريد." : "The draft is ready for review; no email was sent.")}</small></div>{testState === "waiting" ? <Link href={`/${locale}/app/runs/run_weekly_watch`}>{ar ? "فتح التشغيل" : "Open run"}<DirectionArrow size={14} /></Link> : <span className="test-pulse" />}</div> : null}
        </main>

        <aside className="node-inspector">
          {selected ? <><div className="node-inspector__heading"><div><p className="section-kicker">{localize(nodeNames[selected.type], locale)}</p><h2>{ar ? "إعدادات العقدة" : "Node settings"}</h2></div><button className="icon-button icon-button--danger" type="button" aria-label={ar ? "حذف العقدة" : "Delete node"} onClick={() => { const remaining = flow.nodes.filter((node) => node.id !== selected.id); setNodes(remaining); setSelectedId(remaining[0]?.id ?? ""); }}><Trash2 size={16} /></button></div><div className="node-inspector__body"><label className="field"><span>{ar ? "الاسم الظاهر" : "Display label"}</span><input value={localize(selected.label, locale)} onChange={(event) => updateSelected({ label: locale === "ar" ? { ...selected.label, ar: event.target.value } : { ...selected.label, en: event.target.value } })} /></label><label className="field"><span>{ar ? "نوع العقدة" : "Node type"}</span><div className="select-with-icon"><span>{(() => { const Icon = nodeIcons[selected.type]; return <Icon size={14} />; })()}</span><select value={selected.type} onChange={(event) => updateSelected({ type: event.target.value as EditorNodeType })}>{(Object.keys(nodeIcons) as EditorNodeType[]).map((type) => <option key={type} value={type}>{localize(nodeNames[type], locale)}</option>)}</select><ChevronDown size={14} /></div></label>{selected.type === "approval" ? <div className="approval-node-settings"><label className="field"><span>{ar ? "الموافق المخوّل" : "Authorized approver"}</span><select defaultValue="ops_lead"><option value="ops_lead">{ar ? "قائد العمليات" : "Operations lead"}</option><option value="project_owner">{ar ? "مالك المشروع" : "Project owner"}</option></select></label><label className="checkbox-row"><input type="checkbox" defaultChecked /><span><strong>{ar ? "سبب القرار مطلوب" : "Decision reason required"}</strong><small>{ar ? "يظهر السبب في إيصال التدقيق." : "The reason appears in the audit receipt."}</small></span></label><div className="approval-preview"><ShieldCheck size={16} /><p>{ar ? "سيتوقف التدفق هنا ويعرض الملخص والتكلفة والجهة الدافعة قبل أي أثر خارجي." : "The flow pauses here and shows the summary, cost, and payer before any external effect."}</p></div></div> : <><label className="field"><span>{ar ? "المهلة بالثواني" : "Timeout in seconds"}</span><input type="number" defaultValue={45} min={5} max={300} /></label><label className="checkbox-row"><input type="checkbox" defaultChecked /><span><strong>{ar ? "إعادة المحاولة مرة واحدة" : "Retry once"}</strong><small>{ar ? "فقط للأخطاء المؤقتة." : "Temporary failures only."}</small></span></label></>}</div></> : <div className="node-inspector__empty"><CircleStop size={20} /><h2>{ar ? "لا توجد عقدة محددة" : "No node selected"}</h2><p>{ar ? "اختر عقدة من اللوحة أو أضف واحدة جديدة." : "Select a node on the canvas or add a new one."}</p></div>}
          <div className="node-inspector__summary"><p className="section-kicker">{ar ? "سياسة التدفق" : "Flow policy"}</p><dl><div><dt>{ar ? "الموافقة" : "Approval"}</dt><dd>{flow.requiresApproval ? (ar ? "مطلوبة" : "Required") : (ar ? "غير مطلوبة" : "Not required")}</dd></div><div><dt>{ar ? "سقف التشغيل" : "Run ceiling"}</dt><dd>$1.20</dd></div><div><dt>{ar ? "الجهة الدافعة" : "Billing"}</dt><dd>{ar ? "رصيد المنصة" : "Platform credits"}</dd></div></dl></div>
        </aside>
      </div>
      {notice ? <DemoToast message={notice} /> : null}
    </div>
  );
}
