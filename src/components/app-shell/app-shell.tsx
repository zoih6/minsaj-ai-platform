"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bell,
  BookOpen,
  Bot,
  Boxes,
  ChartNoAxesCombined,
  CheckCircle2,
  ChevronDown,
  Code2,
  Command,
  Compass,
  FolderKanban,
  Gauge,
  GraduationCap,
  House,
  Library,
  ListChecks,
  Menu,
  MessageCircle,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Receipt,
  Search,
  SearchCheck,
  Settings,
  Sparkles,
  Users,
  Workflow,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MinsajMark } from "@minsaj/ui";
import { switchLocaleInPath, type Dictionary } from "@minsaj/i18n";
import type { Locale } from "@minsaj/contracts";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { useViewportMode } from "@/hooks/use-viewport-mode";

type ShellNavItem = { id: string; label: string; href: string; icon: LucideIcon };

type ShellTier = "core" | "secondary" | "pinned";

function ShellNavLink({ item, tier, active, onNavigate, tabIndex }: { item: ShellNavItem; tier: ShellTier; active: boolean; onNavigate: () => void; tabIndex?: number }) {
  const Icon = item.icon;
  return <Link href={item.href} data-tier={tier} className={`universal-shell-link${active ? " is-active" : ""}`} title={item.label} aria-current={active ? "page" : undefined} onClick={onNavigate} tabIndex={tabIndex}><span><Icon size={tier === "core" ? 18 : 16} strokeWidth={1.8} /></span><b>{item.label}</b>{item.id === "learn" ? <i /> : null}</Link>;
}

export function AppShell({ children, locale }: { children: ReactNode; locale: Locale; dictionary: Dictionary; workspaceName?: string }) {
  const pathname = usePathname();
  const viewport = useViewportMode();
  const isArabic = locale === "ar";
  const base = `/${locale}/app`;
  const [collapsed, setCollapsed] = useState(false);          // desktop user preference
  const [mobileOpen, setMobileOpen] = useState(false);        // mobile drawer
  const [overlayOpen, setOverlayOpen] = useState(false);      // tablet expand-over-content
  const [commandOpen, setCommandOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const labels = isArabic
    ? {
        forYou: "لك",
        ask: "اسأل",
        learn: "تعلّم",
        research: "ابحث",
        create: "أنشئ",
        code: "برمج",
        analyze: "حلّل",
        explore: "استكشف",
        library: "مكتبتي",
        services: "الخدمات",
        advanced: "أدوات متقدمة",
        operations: "التشغيل",
        runs: "التشغيلات",
        usage: "الاستخدام والتكلفة",
        billing: "الفوترة",
        team: "الفريق والأدوار",
        projects: "المشاريع",
        agents: "الوكلاء",
        flows: "التدفقات",
        knowledge: "مصادر المعرفة",
        models: "النماذج",
        settings: "الإعدادات",
        start: "ابدأ شيئًا جديدًا",
        search: "ابحث في منسج…",
        searchHint: "انتقل إلى خدمة، عمل، أو إعداد",
        noResult: "لا توجد نتيجة مطابقة",
        personal: "مساحتي",
        adaptive: "متكيفة مع أهدافك",
        demo: "نموذج تفاعلي",
        noticeTitle: "مسار تعلّمك ينتظرك",
        noticeBody: "أكملت 34% من أساسيات علم البيانات.",
        savedTitle: "تم حفظ البحث",
        savedBody: "أضيف تقرير الطاقة المتجددة إلى مكتبتك.",
        notifications: "الإشعارات",
        languageLabel: "التبديل إلى الإنجليزية",
        close: "إغلاق",
        collapse: "طي القائمة",
        expand: "توسيع القائمة",
        more: "فتح القائمة",
      }
    : {
        forYou: "For you",
        ask: "Ask",
        learn: "Learn",
        research: "Research",
        create: "Create",
        code: "Code",
        analyze: "Analyze",
        explore: "Explore",
        library: "My library",
        services: "Services",
        advanced: "Advanced tools",
        operations: "Operations",
        runs: "Runs",
        usage: "Usage & cost",
        billing: "Billing",
        team: "Team & roles",
        projects: "Projects",
        agents: "Agents",
        flows: "Flows",
        knowledge: "Knowledge sources",
        models: "Models",
        settings: "Settings",
        start: "Start something new",
        search: "Search Minsaj…",
        searchHint: "Go to a service, item, or setting",
        noResult: "No matching result",
        personal: "My space",
        adaptive: "Adaptive to your goals",
        demo: "Interactive prototype",
        noticeTitle: "Your learning path is waiting",
        noticeBody: "You are 34% through data science foundations.",
        savedTitle: "Research saved",
        savedBody: "The renewable energy report is now in your library.",
        notifications: "Notifications",
        languageLabel: "Switch to Arabic",
        close: "Close",
        collapse: "Collapse navigation",
        expand: "Expand navigation",
        more: "Open menu",
      };

  const primaryItems = [
    { id: "home", label: labels.forYou, href: `${base}/home`, icon: House },
    { id: "chat", label: labels.ask, href: `${base}/chat`, icon: MessageCircle },
    { id: "learn", label: labels.learn, href: `${base}/learn`, icon: GraduationCap },
    { id: "research", label: labels.research, href: `${base}/research`, icon: SearchCheck },
    { id: "create", label: labels.create, href: `${base}/create`, icon: Palette },
    { id: "code", label: labels.code, href: `${base}/code`, icon: Code2 },
    { id: "analyze", label: labels.analyze, href: `${base}/analyze`, icon: ChartNoAxesCombined },
    { id: "explore", label: labels.explore, href: `${base}/explore`, icon: Compass },
  ] as const;
  const advancedItems = [
    { id: "projects", label: labels.projects, href: `${base}/projects`, icon: FolderKanban },
    { id: "agents", label: labels.agents, href: `${base}/agents`, icon: Bot },
    { id: "flows", label: labels.flows, href: `${base}/flows`, icon: Workflow },
    { id: "knowledge", label: labels.knowledge, href: `${base}/knowledge`, icon: BookOpen },
    { id: "models", label: labels.models, href: `${base}/models`, icon: Boxes },
  ] as const;
  /* KI-1 (2026-09-21): the operations layer joins the navigation as a
     labelled fourth group — runs / usage / billing / team were fully working
     routes with zero navigation entries (orphan pages). Skills & tools stay
     reachable through the catalog tabs on the Models page (documented in
     information-architecture.md §3). Command palette picks these up through
     allItems below. */
  const operationsItems = [
    { id: "runs", label: labels.runs, href: `${base}/runs`, icon: ListChecks },
    { id: "usage", label: labels.usage, href: `${base}/usage`, icon: Gauge },
    { id: "billing", label: labels.billing, href: `${base}/billing`, icon: Receipt },
    { id: "team", label: labels.team, href: `${base}/team`, icon: Users },
  ] as const;
  const utilityItems = [
    { id: "library", label: labels.library, href: `${base}/library`, icon: Library },
    { id: "settings", label: labels.settings, href: `${base}/settings`, icon: Settings },
  ] as const;
  const allItems = [...primaryItems, ...utilityItems, ...advancedItems, ...operationsItems];
  const normalized = query.trim().toLocaleLowerCase(locale);
  const filtered = normalized ? allItems.filter((item) => item.label.toLocaleLowerCase(locale).includes(normalized)) : allItems;
  const alternateLocale: Locale = isArabic ? "en" : "ar";

  /* ------------------------------------------------------------------
     Sidebar state machine — one source of truth shared with shell.css
       mobile  → "drawer"   (off-canvas + overlay + bottom tab bar)
       tablet  → overlayOpen ? "expanded"(overlay) : "rail"
       desktop → collapsed ? "rail" : "expanded"
     ------------------------------------------------------------------ */
  const sidebarMode =
    viewport === "mobile" ? "drawer"
    : viewport === "tablet" ? (overlayOpen ? "expanded" : "rail")
    : viewport === null ? "drawer" /* SSR first paint: mobile-safe */
    : (collapsed ? "rail" : "expanded");
  const isOverlay = viewport === "tablet" && overlayOpen;
  const isDrawer = sidebarMode === "drawer";
  const sidebarOpen = mobileOpen || isOverlay;
  const railActive = sidebarMode === "rail";

  /* The deep-work routes (ask · code · analyze · explore) sit on the second
     DECLARED canvas (R-SURF-4, VIS-03 fold): the shell announces it via
     [data-canvas="focus"] — the canvas value itself is the single token
     --u-canvas-focus (foundations.css). Every other route is the standard
     canvas. See shell.css "Focus canvas" section. */
  const focusCanvasRoutes = [`${base}/chat`, `${base}/code`, `${base}/analyze`, `${base}/explore`];
  const focusCanvas = focusCanvasRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  /* Restore desktop collapse preference (deferred — external system read) */
  useEffect(() => {
    const stored = window.localStorage.getItem("minsaj.universal.sidebar");
    if (stored !== "collapsed") return;
    const restoreFrame = window.requestAnimationFrame(() => setCollapsed(true));
    return () => window.cancelAnimationFrame(restoreFrame);
  }, []);

  /* T3 operations fold (NAV-05): the tier folds behind its «التشغيل»
     disclosure only where the drawer exceeds 80vh — the phone band. Sidebar
     bands (tablet/desktop) keep it open and inert. The key remount resets the
     disclosure to its band default when the viewport crosses 768. */
  const foldOpen = viewport === null ? false : viewport !== "mobile";

  /* Reset transient states when the viewport band or route changes.
     Official React "reset state on change" pattern — comparing against the
     last-seen value stored in state, no effects, no cascading renders. */
  const [lastRoute, setLastRoute] = useState(pathname);
  if (lastRoute !== pathname) {
    setLastRoute(pathname);
    setMobileOpen(false);
    setOverlayOpen(false);
  }
  const [lastViewport, setLastViewport] = useState(viewport);
  if (lastViewport !== viewport) {
    setLastViewport(viewport);
    setMobileOpen(false);
    setOverlayOpen(false);
  }

  /* Scroll lock while drawer / overlay / dialogs are open */
  useEffect(() => {
    const lock = sidebarOpen || commandOpen;
    if (!lock) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [sidebarOpen, commandOpen]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setMobileOpen(false);
        setOverlayOpen(false);
        setNotificationsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  /* Page-level search affordances (workspace quick-search) open the same
     command palette through a custom event — one surface, many doors. */
  useEffect(() => {
    function openCommand() {
      setCommandOpen(true);
    }
    window.addEventListener("minsaj:command-open", openCommand);
    return () => window.removeEventListener("minsaj:command-open", openCommand);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeTransient() {
    setMobileOpen(false);
    setOverlayOpen(false);
    setCommandOpen(false);
    setNotificationsOpen(false);
  }

  function toggleSidebar() {
    if (viewport === "mobile") { setMobileOpen((value) => !value); return; }
    if (viewport === "tablet") { setOverlayOpen((value) => !value); return; }
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("minsaj.universal.sidebar", next ? "collapsed" : "expanded");
      return next;
    });
  }

  return (
    <Dialog.Root open={commandOpen} onOpenChange={setCommandOpen}>
      <div className="universal-app-shell" data-sidebar={sidebarMode} data-overlay={isOverlay ? "true" : "false"} data-mobile-open={mobileOpen} data-canvas={focusCanvas ? "focus" : "standard"}>
        <a className="skip-link" href="#main-content">{isArabic ? "انتقل إلى المحتوى" : "Skip to content"}</a>

        <button type="button" className="universal-shell-backdrop" data-state={sidebarOpen ? "open" : "closed"} onClick={() => { setMobileOpen(false); setOverlayOpen(false); }} aria-label={labels.close} aria-hidden={!sidebarOpen} tabIndex={sidebarOpen ? 0 : -1} />

        <aside id="universal-shell-sidebar" className="universal-shell-sidebar" aria-label={isArabic ? "التنقل الرئيسي" : "Primary navigation"}>
          <div className="universal-shell-brand-row">
            <Link href={`/${locale}/app/home`} className="universal-shell-brand"><span><MinsajMark size={34} onDark /></span><b>{isArabic ? "منسج" : "Minsaj"}</b><Sparkles size={12} /></Link>
            <button type="button" className="universal-shell-collapse" onClick={toggleSidebar} aria-label={railActive ? labels.expand : labels.collapse} title={railActive ? labels.expand : labels.collapse}>{railActive ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
            <button type="button" className="universal-shell-close" onClick={() => setMobileOpen(false)} aria-label={labels.close}><X size={18} /></button>
          </div>

          <Link href={`${base}/home`} className="universal-shell-new" onClick={closeTransient} title={labels.start}><span><Plus size={18} /></span><b>{labels.start}</b></Link>

          <nav className="universal-shell-nav">
            {/* Phase 3 / NAV-05 — the drawer's IA renders as hierarchy: four
                weighted tiers (NAVIGATION-ARCHITECTURE §4). T1 Core keeps the
                primary register (label-m/600, 28px icon chips, 48px rows,
                active = primary pill + 3px indicator); T2 Workspace and
                T3 Operations share the secondary register (body-s/500, bare
                16px icons, 44px rows, active = soft tint); T4 Personal is the
                pinned footer below (never in the scroll). */}
            <div className="universal-shell-nav__group" data-tier="core">
              <div className="universal-shell-nav__label" aria-hidden="true">{labels.services}</div>
              <div className="universal-shell-nav__main">{primaryItems.map((item) => <ShellNavLink item={item} tier="core" active={isActive(item.href)} onNavigate={closeTransient} key={item.id} />)}</div>
            </div>
            <div className="universal-shell-nav__group" data-tier="workspace">
              <div className="universal-shell-nav__label" aria-hidden="true">{labels.advanced}</div>
              <div className="universal-shell-nav__secondary">{advancedItems.map((item) => <ShellNavLink item={item} tier="secondary" active={isActive(item.href)} onNavigate={closeTransient} key={item.id} />)}</div>
            </div>
            {/* T3 Operations — hairline separation + the sanctioned fold:
                below 768 the drawer's 19 destinations exceed 80vh, so the
                tier collapses behind its own disclosure (open state is
                DOM-native; key resets it per viewport band). */}
            <details className="universal-shell-nav__group universal-shell-nav__fold" data-tier="operations" open={foldOpen} key={viewport ?? "ssr"}>
              <summary className="universal-shell-nav__label" tabIndex={viewport === "mobile" ? 0 : -1}>
                <span>{labels.operations}</span>
                <ChevronDown size={14} aria-hidden="true" />
              </summary>
              <div className="universal-shell-nav__secondary">{operationsItems.map((item) => <ShellNavLink item={item} tier="secondary" active={isActive(item.href)} onNavigate={closeTransient} key={item.id} />)}</div>
            </details>
          </nav>

          {/* T4 — Personal: pinned footer above the profile row, outside the
              scroll; the utility group finally carries its label «مساحتي». */}
          <div className="universal-shell-nav__group universal-shell-pinned" data-tier="personal">
            <div className="universal-shell-nav__label" aria-hidden="true">{labels.personal}</div>
            <div className="universal-shell-nav__secondary">{utilityItems.map((item) => <ShellNavLink item={item} tier="pinned" active={isActive(item.href)} onNavigate={closeTransient} key={item.id} />)}</div>
          </div>

          <div className="universal-shell-profile">
            <Link href={`${base}/settings`} onClick={closeTransient} title={labels.settings}><span className="universal-shell-avatar">ن</span><span><strong>{labels.personal}</strong><small>{labels.adaptive}</small></span><Settings size={16} /></Link>
          </div>
        </aside>

        <div className="universal-shell-main">
          {/* Phase 3 / NAV-01 + NAV-03 — one header grammar on every /app/*
              route: a single 56px row announcing the workspace mark only.
              Page identity belongs to the page's own title block (L2); the
              global ⌘K trigger is an icon under 768 and an inline field
              above it (R-NAV-6 — the two-row search tray is gone). */}
          <header className="universal-shell-topbar">
            <div className="universal-shell-context">
              <button type="button" onClick={toggleSidebar} aria-label={isDrawer ? labels.more : (railActive ? labels.expand : labels.collapse)} aria-expanded={sidebarOpen} aria-controls="universal-shell-sidebar"><Menu size={20} /></button>
              <Link href={`/${locale}/app/home`} className="universal-shell-mark" aria-label={isArabic ? "منسج" : "Minsaj"}><MinsajMark size={28} /><b>{isArabic ? "منسج" : "Minsaj"}</b></Link>
            </div>
            <Dialog.Trigger asChild><button type="button" className="universal-shell-search" aria-label={labels.search} title={labels.search}><Search size={18} /><span>{labels.search}</span><kbd>⌘K</kbd></button></Dialog.Trigger>
            <div className="universal-shell-actions"><ThemeToggle locale={locale} /><Link href={switchLocaleInPath(pathname, alternateLocale)} prefetch={false} aria-label={labels.languageLabel}>{alternateLocale.toUpperCase()}</Link><button type="button" onClick={() => setNotificationsOpen((value) => !value)} aria-expanded={notificationsOpen} aria-controls="universal-notifications" aria-label={labels.notifications}><Bell size={18} /><i /></button><Link href={`${base}/settings`} className="universal-top-avatar">ن</Link></div>
          </header>

          <aside id="universal-notifications" className="universal-notifications" data-state={notificationsOpen ? "open" : "closed"} role="dialog" aria-label={labels.notifications} aria-hidden={!notificationsOpen}><header><div><span>{labels.notifications}</span><small>2</small></div><button type="button" tabIndex={notificationsOpen ? 0 : -1} onClick={() => setNotificationsOpen(false)} aria-label={labels.close}><X size={18} /></button></header><Link href={`${base}/learn`} tabIndex={notificationsOpen ? 0 : -1} onClick={closeTransient}><span><GraduationCap size={18} /></span><div><strong>{labels.noticeTitle}</strong><p>{labels.noticeBody}</p></div></Link><Link href={`${base}/library`} tabIndex={notificationsOpen ? 0 : -1} onClick={closeTransient}><span><CheckCircle2 size={18} /></span><div><strong>{labels.savedTitle}</strong><p>{labels.savedBody}</p></div></Link></aside>

          <main id="main-content" className="universal-shell-content"><div className="universal-route-frame mj-flow" key={pathname}>{children}</div></main>
        </div>

        <nav className="universal-shell-mobile-nav" aria-label={isArabic ? "التنقل على الهاتف" : "Mobile navigation"}>
          {[primaryItems[0], primaryItems[1], primaryItems[4], primaryItems[7], utilityItems[0]].map((item) => { const Icon = item.icon; return <Link href={item.href} className={isActive(item.href) ? "is-active" : ""} aria-current={isActive(item.href) ? "page" : undefined} key={item.id}><Icon size={18} /><span>{item.label}</span></Link>; })}
        </nav>
      </div>

      <Dialog.Portal>
        <Dialog.Overlay className="universal-command-overlay" />
        <Dialog.Content className="universal-command" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{labels.search}</Dialog.Title>
          <div className="universal-command__input"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder={labels.searchHint} aria-label={labels.searchHint} /><Dialog.Close asChild><button type="button" aria-label={labels.close}><X size={18} /></button></Dialog.Close></div>
          <div className="universal-command__results"><span>{isArabic ? "الخدمات والوجهات" : "Services and destinations"}</span>{filtered.length ? filtered.map((item) => { const Icon = item.icon; return <Link href={item.href} onClick={closeTransient} key={item.id}><span><Icon size={18} /></span><b>{item.label}</b><Command size={14} /></Link>; }) : <p>{labels.noResult}</p>}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
