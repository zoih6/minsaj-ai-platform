"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Database, FileText, FolderOpen, Globe2, LockKeyhole, Plus, Search, ShieldCheck, Sparkles, Upload, X } from "lucide-react";
import { Badge } from "@nasaq/ui";
import { localize, type KnowledgeCollection, type KnowledgeSource, type Locale } from "@nasaq/contracts";
import { DemoToast, LibraryEmpty, LibraryToolbar, OperationsStats } from "@/components/domain/operations/shared";

import { ScrollFx } from "@/components/universal/scroll-fx";
function CollectionStatus({ locale, status }: { locale: Locale; status: KnowledgeCollection["status"] }) {
  const ar = locale === "ar";
  const config = {
    ready: { label: ar ? "جاهزة" : "Ready", tone: "success" as const },
    indexing: { label: ar ? "تُفهرس" : "Indexing", tone: "brand" as const },
    stale: { label: ar ? "تحتاج تحديثًا" : "Needs refresh", tone: "warning" as const },
    failed: { label: ar ? "تعذر تجهيزها" : "Failed", tone: "danger" as const },
  }[status];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}

function SourceStatus({ locale, status }: { locale: Locale; status: KnowledgeSource["status"] }) {
  const ar = locale === "ar";
  const labels: Record<KnowledgeSource["status"], string> = {
    validating: ar ? "يتحقق" : "Validating", scanning: ar ? "يفحص" : "Scanning", extracting: ar ? "يستخرج" : "Extracting",
    indexing: ar ? "يفهرس" : "Indexing", ready: ar ? "جاهز" : "Ready", stale: ar ? "قديم" : "Stale", failed: ar ? "فشل" : "Failed",
  };
  return <Badge tone={status === "ready" ? "success" : status === "stale" ? "warning" : status === "failed" ? "danger" : "brand"}>{labels[status]}</Badge>;
}

function AddSourceDialog({ locale, collections, onAdd }: { locale: Locale; collections: KnowledgeCollection[]; onAdd: (source: KnowledgeSource) => void }) {
  const ar = locale === "ar";
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<KnowledgeSource["kind"]>("file");
  const [name, setName] = useState("");
  const [origin, setOrigin] = useState("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "col_launch");

  function submit() {
    const label = name.trim() || (kind === "file" ? (origin.split(/[\\/]/).at(-1) ?? "") : origin).trim();
    if (!label) return;
    onAdd({ id: `src_demo_${Date.now()}`, collectionId, name: { ar: label, en: label }, origin: origin || "local-demo.txt", kind, status: "indexing", chunkCount: 0, sensitivity: "standard", updatedAt: new Date().toISOString() });
    setOpen(false); setName(""); setOrigin("");
  }

  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><button className="button button--primary button--default" type="button"><Plus size={16} />{ar ? "إضافة مصدر" : "Add source"}</button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="command-overlay" /><Dialog.Content className="form-dialog source-dialog" aria-describedby="source-dialog-description"><div className="form-dialog__header"><div><Dialog.Title>{ar ? "إضافة مصدر معرفة" : "Add a knowledge source"}</Dialog.Title><Dialog.Description id="source-dialog-description">{ar ? "يُفحص المصدر ويُستخرج ثم يُفهرس قبل أن يصبح متاحًا للوكلاء." : "The source is scanned, extracted, and indexed before agents can use it."}</Dialog.Description></div><Dialog.Close asChild><button className="icon-button" type="button" aria-label={ar ? "إغلاق" : "Close"}><X size={16} /></button></Dialog.Close></div><div className="source-type-tabs" role="group" aria-label={ar ? "نوع المصدر" : "Source type"}>{([
    ["file", ar ? "ملف" : "File", Upload], ["url", ar ? "رابط" : "URL", Globe2], ["text", ar ? "نص" : "Text", FileText],
  ] as const).map(([id, label, Icon]) => <button type="button" key={id} className={kind === id ? "is-active" : ""} aria-pressed={kind === id} onClick={() => setKind(id)}><Icon size={16} />{label}</button>)}</div><label className="field"><span>{ar ? "اسم واضح" : "Clear name"}</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={ar ? "مثال: دليل الامتثال ٢٠٢٦" : "Example: Compliance guide 2026"} /></label><label className="field"><span>{kind === "file" ? (ar ? "اسم الملف التجريبي" : "Demo filename") : kind === "url" ? (ar ? "الرابط" : "URL") : (ar ? "النص" : "Text")}</span>{kind === "text" ? <textarea value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder={ar ? "الصق النص هنا…" : "Paste text here…"} /> : <input value={origin} onChange={(event) => setOrigin(event.target.value)} placeholder={kind === "url" ? "https://example.com/policy" : "policy-guide.pdf"} />}</label><label className="field"><span>{ar ? "المجموعة" : "Collection"}</span><select value={collectionId} onChange={(event) => setCollectionId(event.target.value)}>{collections.map((collection) => <option key={collection.id} value={collection.id}>{localize(collection.name, locale)}</option>)}</select></label><div className="source-security-note"><ShieldCheck size={16} /><p>{ar ? "محاكاة آمنة: لا يُرفع ملف ولا يُجلب رابط فعلي. الروابط الخاصة وعناوين الشبكة الداخلية ستُرفض في المنتج الحقيقي." : "Safe simulation: no file is uploaded and no URL is fetched. Private and internal-network addresses will be rejected in the real product."}</p></div><div className="form-dialog__actions"><Dialog.Close asChild><button className="button button--quiet button--default" type="button">{ar ? "إلغاء" : "Cancel"}</button></Dialog.Close><button className="button button--primary button--default" type="button" disabled={!name.trim() && !origin.trim()} onClick={submit}>{ar ? "إضافة وبدء الفهرسة" : "Add and start indexing"}</button></div></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function KnowledgePrototype({ locale, initialCollections, initialSources }: { locale: Locale; initialCollections: KnowledgeCollection[]; initialSources: KnowledgeSource[] }) {
  const ar = locale === "ar";
  const [sources, setSources] = useState(initialSources);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;

  useEffect(() => { if (!notice) return; const timer = window.setTimeout(() => setNotice(""), 3000); return () => window.clearTimeout(timer); }, [notice]);
  const normalized = query.trim().toLocaleLowerCase(locale);
  const visible = initialCollections.filter((collection) => (!normalized || `${localize(collection.name, locale)} ${localize(collection.description, locale)}`.toLocaleLowerCase(locale).includes(normalized)) && (filter === "all" || collection.status === filter));

  function addSource(source: KnowledgeSource) {
    setSources((items) => [source, ...items]);
    setNotice(ar ? "أُضيف المصدر محليًا وبدأت محاكاة الفهرسة." : "Source added locally and indexing simulation started.");
    window.setTimeout(() => setSources((items) => items.map((item) => item.id === source.id ? { ...item, status: "ready", chunkCount: 24 } : item)), 1200);
  }

  return <div className="ops-page knowledge-page">
    <ScrollFx /><header className="page-header ops-page-header"><div className="page-header__copy"><p className="page-eyebrow">{ar ? "معرفة محكومة" : "Governed knowledge"}</p><h1 className="page-title">{ar ? "المعرفة" : "Knowledge"}</h1><p className="page-description">{ar ? "نظّم المصادر في مجموعات واضحة، وراقب الفحص والفهرسة، واختبر ما يستطيع الوكيل استرجاعه." : "Organize sources into clear collections, monitor processing, and test exactly what an agent can retrieve."}</p></div><AddSourceDialog locale={locale} collections={initialCollections} onAdd={addSource} /></header><OperationsStats items={[
    { label: ar ? "المجموعات" : "Collections", value: String(initialCollections.length), detail: ar ? "بسياق محدد" : "Scoped context" },
    { label: ar ? "المصادر" : "Sources", value: String(sources.length), detail: ar ? "ملفات وروابط ونصوص" : "Files, URLs, and text" },
    { label: ar ? "المقاطع الجاهزة" : "Ready chunks", value: String(initialCollections.reduce((sum, item) => sum + item.chunkCount, 0)), detail: ar ? "قابلة للاسترجاع" : "Retrievable" },
    { label: ar ? "تحتاج انتباهًا" : "Needs attention", value: String(initialCollections.filter((item) => item.status !== "ready").length), detail: ar ? "فهرسة أو تحديث" : "Indexing or refresh", tone: "attention" },
  ]} /><LibraryToolbar locale={locale} query={query} onQueryChange={setQuery} activeFilter={filter} onFilterChange={setFilter} resultCount={visible.length} filters={[
    { id: "all", label: ar ? "الكل" : "All" }, { id: "ready", label: ar ? "جاهز" : "Ready" }, { id: "indexing", label: ar ? "يفهرس" : "Indexing" }, { id: "stale", label: ar ? "قديم" : "Stale" },
  ]} />{visible.length ? <section className="knowledge-collection-grid" aria-label={ar ? "مجموعات المعرفة" : "Knowledge collections"}>{visible.map((collection) => <article className="knowledge-collection-card" key={collection.id}><div className="knowledge-collection-card__head"><span><Database size={18} /></span><CollectionStatus locale={locale} status={collection.status} /></div><h2>{localize(collection.name, locale)}</h2><p>{localize(collection.description, locale)}</p><dl><div><dt>{ar ? "مصادر" : "Sources"}</dt><dd>{collection.sourceCount}</dd></div><div><dt>{ar ? "مقاطع" : "Chunks"}</dt><dd>{collection.chunkCount}</dd></div><div><dt>{ar ? "وكلاء" : "Agents"}</dt><dd>{collection.usedByAgents}</dd></div></dl><div className="collection-visibility">{collection.visibility === "workspace" ? <Globe2 size={14} /> : <LockKeyhole size={14} />}<span>{collection.visibility === "workspace" ? (ar ? "كل مساحة العمل" : "Whole workspace") : (ar ? "ضمن المشروع" : "Project scoped")}</span></div><Link href={`/${locale}/app/knowledge/${collection.id}`}>{ar ? "فتح المجموعة" : "Open collection"}<DirectionArrow size={14} /></Link></article>)}</section> : <LibraryEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />}<section className="knowledge-sources-panel"><div className="section-heading"><div><p className="section-kicker">{ar ? "حالة المعالجة" : "Processing state"}</p><h2>{ar ? "آخر المصادر" : "Recent sources"}</h2></div><span>{ar ? "الجاهز فقط يدخل الاسترجاع" : "Only ready sources enter retrieval"}</span></div><div className="source-table"><div className="source-table__head"><span>{ar ? "المصدر" : "Source"}</span><span>{ar ? "المجموعة" : "Collection"}</span><span>{ar ? "الحالة" : "Status"}</span><span>{ar ? "المقاطع" : "Chunks"}</span></div>{sources.slice(0, 6).map((source) => { const collection = initialCollections.find((item) => item.id === source.collectionId); const Icon = source.kind === "url" ? Globe2 : source.kind === "text" ? FileText : FolderOpen; return <div className="source-table__row" key={source.id}><span className="source-name"><i><Icon size={16} /></i><span><strong>{localize(source.name, locale)}</strong><small>{source.origin}</small></span></span><span data-label={ar ? "المجموعة" : "Collection"}>{collection ? localize(collection.name, locale) : "—"}</span><span data-label={ar ? "الحالة" : "Status"}><SourceStatus locale={locale} status={source.status} /></span><span data-label={ar ? "المقاطع" : "Chunks"} className="mono">{source.chunkCount || "—"}</span></div>; })}</div></section>{notice ? <DemoToast message={notice} /> : null}</div>;
}

export function KnowledgeCollectionPrototype({ locale, collection, sources }: { locale: Locale; collection: KnowledgeCollection; sources: KnowledgeSource[] }) {
  const ar = locale === "ar";
  const [question, setQuestion] = useState(ar ? "ما أهم القيود التي تؤثر في قرار الإطلاق؟" : "Which constraints most affect the launch decision?");
  const [tested, setTested] = useState(false);
  const DirectionArrow = ar ? ArrowLeft : ArrowRight;
  return <div className="ops-page collection-detail-page"><Link className="back-link" href={`/${locale}/app/knowledge`}><DirectionArrow size={14} />{ar ? "مكتبة المعرفة" : "Knowledge library"}</Link><header className="collection-detail-hero"><div><span><BookOpen size={20} /></span><div><div><CollectionStatus locale={locale} status={collection.status} /><span className="mono">{collection.id}</span></div><h1>{localize(collection.name, locale)}</h1><p>{localize(collection.description, locale)}</p></div></div><button className="button button--outline button--default" type="button"><Plus size={14} />{ar ? "ربط بوكيل" : "Link to agent"}</button></header><div className="collection-detail-layout"><main><section className="collection-sources-card"><div className="section-heading"><div><p className="section-kicker">{ar ? "المصادر" : "Sources"}</p><h2>{ar ? "ما يدخل في سياق الاسترجاع" : "What enters retrieval context"}</h2></div><Badge>{sources.length}</Badge></div>{sources.length ? <div className="collection-source-list">{sources.map((source) => <article key={source.id}><span><FileText size={16} /></span><div><strong>{localize(source.name, locale)}</strong><small>{source.origin}</small></div><SourceStatus locale={locale} status={source.status} /><span className="mono">{source.chunkCount}</span></article>)}</div> : <LibraryEmpty locale={locale} onReset={() => undefined} />}</section><section className="processing-policy-card"><ShieldCheck size={18} /><div><h2>{ar ? "سياسة الفهرسة والاستخدام" : "Indexing and use policy"}</h2><p>{ar ? "يفحص كل مصدر قبل الاستخراج، ويحافظ على نطاق الوصول الأصلي، ولا تُسترجع المصادر القديمة أو الفاشلة افتراضيًا." : "Every source is scanned before extraction, preserves its original access scope, and stale or failed sources are not retrieved by default."}</p></div></section></main><aside className="retrieval-test-card"><div className="retrieval-test-card__head"><span><Search size={18} /></span><div><p className="section-kicker">RETRIEVAL TEST</p><h2>{ar ? "اختبر ما يراه الوكيل" : "Test what the agent sees"}</h2></div></div><label className="field"><span>{ar ? "السؤال" : "Question"}</span><textarea value={question} onChange={(event) => { setQuestion(event.target.value); setTested(false); }} /></label><button className="button button--primary button--default" type="button" disabled={!question.trim()} onClick={() => setTested(true)}><Sparkles size={14} />{ar ? "اختبار الاسترجاع" : "Test retrieval"}</button>{tested ? <div className="retrieval-results"><div><CheckCircle2 size={16} /><span><strong>{ar ? "٣ مقاطع مطابقة" : "3 matching chunks"}</strong><small>{ar ? "لا استدعاء لنموذج خارجي" : "No external model call"}</small></span></div>{[
    ["0.92", ar ? "يجب فصل دليل السوق عن الافتراض التشغيلي…" : "Market evidence must be separated from operational assumptions…"],
    ["0.87", ar ? "القرار النهائي يحتاج مراجعة القيود التنظيمية…" : "The final decision requires a regulatory-constraint review…"],
    ["0.79", ar ? "تحدد نافذة الامتثال الجدول الممكن للإطلاق…" : "The compliance window determines the feasible launch schedule…"],
  ].map(([score, text]) => <article key={score}><span className="mono">{score}</span><p>{text}</p><small>{sources[0] ? localize(sources[0].name, locale) : localize(collection.name, locale)}</small></article>)}</div> : null}<div className="retrieval-safe-note"><Check size={14} />{ar ? "يُعرض النص المسترجع فقط" : "Retrieved text only"}</div></aside></div></div>;
}
