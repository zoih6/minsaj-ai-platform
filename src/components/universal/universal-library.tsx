"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpenCheck,
  ChartNoAxesCombined,
  Code2,
  Compass,
  FileText,
  GraduationCap,
  Grid2X2,
  Image as ImageIcon,
  List,
  Palette,
  Plus,
  Search,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@nasaq/contracts";
import { retrySurface, SearchEmpty, SkeletonPage, UniversalEmpty, type SurfaceStateOverride } from "@/components/universal/states";

import { ScrollFx } from "@/components/universal/scroll-fx";
export function UniversalLibrary({ locale, scenario = null }: { locale: Locale; scenario?: SurfaceStateOverride }) {
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const copy = isArabic
    ? {
        eyebrow: "كل ما صنعت وتعلمت واكتشفت",
        title: "مكتبتي",
        body: "ليست قائمة محادثات طويلة؛ هنا تتحول أعمالك إلى دروس وتقارير ومستندات ومشاريع يمكن الرجوع إليها.",
        search: "ابحث في العناوين والمحتوى…",
        new: "ابدأ عملًا جديدًا",
        filters: [["all", "الكل"], ["learn", "تعلّم"], ["research", "بحث"], ["create", "صناعة"], ["code", "برمجة"]],
        results: "عناصر",
        empty: "لا توجد نتائج مطابقة",
        emptyBody: "جرّب كلمة أخرى أو أزل عامل التصفية.",
        clear: "مسح البحث والتصفية",
        filterLabel: "تصفية عناصر المكتبة",
        open: "فتح",
      }
    : {
        eyebrow: "Everything you created, learned, and discovered",
        title: "My library",
        body: "Not an endless chat list. Your work becomes lessons, reports, documents, and projects you can return to.",
        search: "Search titles and content…",
        new: "Start something new",
        filters: [["all", "All"], ["learn", "Learn"], ["research", "Research"], ["create", "Create"], ["code", "Code"]],
        results: "items",
        empty: "No matching results",
        emptyBody: "Try another term or clear the filter.",
        clear: "Clear search and filters",
        filterLabel: "Filter library items",
        open: "Open",
      };
  const items = isArabic
    ? [
        { id: 1, type: "learn", label: "تعلّم", title: "أساسيات علم البيانات", body: "مسار من 8 وحدات مع اختبارات فهم وتمارين قصيرة.", meta: "8 وحدات · 34% مكتمل", icon: GraduationCap, href: "learn" },
        { id: 2, type: "research", label: "بحث", title: "مستقبل الطاقة المتجددة", body: "مقارنة موثقة للاتجاهات والتقنيات والسياسات الحديثة.", meta: "12 مصدرًا · تقرير", icon: SearchCheck, href: "research" },
        { id: 3, type: "code", label: "برمجة", title: "تطبيق نادي القراءة", body: "واجهة متجاوبة ونظام بسيط لتتبع الكتب والمناقشات.", meta: "7 ملفات · معاينة", icon: Code2, href: "code" },
        { id: 4, type: "create", label: "صناعة", title: "قصة بصرية عن المحيطات", body: "لوحة سرد من ستة مشاهد مع نصوص وصور أولية.", meta: "6 مشاهد · مسودة", icon: Palette, href: "create" },
        { id: 5, type: "research", label: "تحليل", title: "قراءة نتائج الاستبيان", body: "أنماط المشاركة وملاحظات حول جودة العينة.", meta: "3 رسوم · جدول", icon: ChartNoAxesCombined, href: "analyze" },
        { id: 6, type: "learn", label: "استكشاف", title: "رحلة إلى فيزياء الزمن", body: "خريطة أفكار تربط النسبية بالفلسفة والخيال العلمي.", meta: "رحلة معرفية", icon: Compass, href: "explore" },
      ]
    : [
        { id: 1, type: "learn", label: "Learn", title: "Data science foundations", body: "An eight-part path with knowledge checks and short practice.", meta: "8 units · 34% complete", icon: GraduationCap, href: "learn" },
        { id: 2, type: "research", label: "Research", title: "The future of renewable energy", body: "A sourced comparison of current trends, technology, and policy.", meta: "12 sources · report", icon: SearchCheck, href: "research" },
        { id: 3, type: "code", label: "Code", title: "Reading club app", body: "A responsive interface and a simple system for books and discussions.", meta: "7 files · preview", icon: Code2, href: "code" },
        { id: 4, type: "create", label: "Create", title: "A visual story about oceans", body: "A six-scene narrative board with copy and early visuals.", meta: "6 scenes · draft", icon: Palette, href: "create" },
        { id: 5, type: "research", label: "Analyze", title: "Survey results", body: "Participation patterns and notes on sample quality.", meta: "3 charts · table", icon: ChartNoAxesCombined, href: "analyze" },
        { id: 6, type: "learn", label: "Explore", title: "A journey into the physics of time", body: "An idea map linking relativity, philosophy, and science fiction.", meta: "Knowledge trail", icon: Compass, href: "explore" },
      ];
  const normalized = query.trim().toLocaleLowerCase(locale);
  const filtered = items.filter((item) => (filter === "all" || item.type === filter) && (!normalized || `${item.title} ${item.body}`.toLocaleLowerCase(locale).includes(normalized)));

  return (
    <div className="universal-library-page">
      <ScrollFx />
      <header className="universal-library-header"><div><span><Sparkles size={14} />{copy.eyebrow}</span><h1>{copy.title}</h1><p>{copy.body}</p></div><Link className="universal-library-new" href={`/${locale}/app/home`}><Plus size={16} />{copy.new}</Link></header>
      <div className="universal-library-toolbar">
        <label><Search size={18} /><input value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder={copy.search} aria-label={copy.search} /></label>
        <div className="universal-library-filters" role="group" aria-label={copy.filterLabel}>{copy.filters.map(([id, label]) => <button type="button" className={filter === id ? "is-active" : ""} aria-pressed={filter === id} onClick={() => setFilter(id!)} key={id}>{label}</button>)}</div>
        <span role="status" aria-live="polite" aria-atomic="true">{filtered.length} {copy.results}</span>
        <div className="universal-library-view"><button type="button" className={view === "grid" ? "is-active" : ""} aria-pressed={view === "grid"} onClick={() => setView("grid")} aria-label="Grid"><Grid2X2 size={16} /></button><button type="button" className={view === "list" ? "is-active" : ""} aria-pressed={view === "list"} onClick={() => setView("list")} aria-label="List"><List size={16} /></button></div>
      </div>
      {scenario === "loading" ? (
        <SkeletonPage label={isArabic ? "جارٍ تجهيز مكتبتك…" : "Preparing your library…"} />
      ) : scenario === "empty" ? (
        <UniversalEmpty
          icon={BookOpenCheck}
          title={isArabic ? "مكتبتك بانتظار أول مخرج" : "Your library awaits its first output"}
          body={
            isArabic
              ? "كل ما تكمله في مساحات العمل — تعلّم، بحث، صناعة، برمجة — يُحفظ هنا بإصداراته وحالته حتى تعود إليه وتكمله."
              : "Everything you finish in a workspace — learn, research, create, code — is saved here with versions and status so you can return and continue."
          }
          action={
            <Link className="universal-library-new" href={`/${locale}/app/home`}>
              <Plus size={16} />
              {copy.new}
            </Link>
          }
        />
      ) : scenario === "error" ? (
        <UniversalEmpty
          icon={SearchCheck}
          tone="error"
          title={isArabic ? "تعذّر تحميل المكتبة" : "Couldn't load the library"}
          body={
            isArabic
              ? "حدث خطأ مؤقت أثناء قراءة عناصر مكتبتك. لم يفقد أي مخرج محفوظ، ويمكنك إعادة المحاولة."
              : "A temporary error occurred while reading your library items. No saved output was lost — you can retry."
          }
          action={
            <button type="button" className="universal-library-new" onClick={retrySurface}>
              <SearchCheck size={16} />
              {isArabic ? "إعادة المحاولة" : "Try again"}
            </button>
          }
        />
      ) : filtered.length ? (
        <div className={`universal-library-grid${view === "list" ? " is-list" : ""}`}>{filtered.map((item, index) => { const Icon = item.icon; return <Link href={`/${locale}/app/${item.href}`} data-type={item.type} className="universal-library-item" key={item.id}><div className={`universal-library-item__cover universal-library-item__cover--${(index % 4) + 1}`}><Icon size={28} /><span>{item.type === "code" ? <Code2 size={16} /> : item.type === "create" ? <ImageIcon size={16} /> : item.type === "learn" ? <BookOpenCheck size={16} /> : <FileText size={16} />}</span></div><div className="universal-library-item__body"><span>{item.label}</span><h2>{item.title}</h2><p>{item.body}</p><div><small>{item.meta}</small><b>{copy.open}<ArrowLeft size={14} /></b></div></div></Link>; })}</div>
      ) : normalized || filter !== "all" ? (
        <SearchEmpty locale={locale} onReset={() => { setQuery(""); setFilter("all"); }} />
      ) : (
        <UniversalEmpty
          icon={BookOpenCheck}
          title={isArabic ? "مكتبتك بانتظار أول مخرج" : "Your library awaits its first output"}
          body={
            isArabic
              ? "كل ما تكمله في مساحات العمل يُحفظ هنا بإصداراته وحالته حتى تعود إليه وتكمله."
              : "Everything you finish in a workspace is saved here with versions and status so you can return and continue."
          }
          action={
            <Link className="universal-library-new" href={`/${locale}/app/home`}>
              <Plus size={16} />
              {copy.new}
            </Link>
          }
        />
      )}
    </div>
  );
}
