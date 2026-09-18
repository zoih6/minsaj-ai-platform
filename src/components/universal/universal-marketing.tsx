"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUp,
  BookOpenCheck,
  ChartNoAxesCombined,
  CheckCircle2,
  Code2,
  Compass,
  GraduationCap,
  Layers3,
  LoaderCircle,
  Menu,
  MessageCircle,
  Mic,
  Palette,
  Paperclip,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";
import { MinsajMark } from "@minsaj/ui";
import type { Locale } from "@minsaj/contracts";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { ActivityFeedback } from "@/components/universal/activity-feedback";
import { universalServices, type UniversalServiceId } from "@/lib/universal-content";

const serviceIcons = {
  ask: MessageCircle,
  learn: GraduationCap,
  research: SearchCheck,
  create: Palette,
  code: Code2,
  analyze: ChartNoAxesCombined,
  explore: Compass,
} satisfies Record<UniversalServiceId, typeof MessageCircle>;

export function UniversalMarketing({ locale }: { locale: Locale }) {
  const services = universalServices[locale];
  const [activeId, setActiveId] = useState<UniversalServiceId>("learn");
  const [prompt, setPrompt] = useState("");
  const [demoState, setDemoState] = useState<"idle" | "working" | "ready">("idle");
  const [menuOpen, setMenuOpen] = useState(false);
  const demoTimerRef = useRef<number | null>(null);
  const active = services.find((service) => service.id === activeId) ?? services[0]!;
  const ActiveIcon = serviceIcons[active.id];
  const isArabic = locale === "ar";
  const otherLocale = isArabic ? "en" : "ar";
  const appHref = `/${locale}/app/home`;

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1181px)");
    function closeMenu() { setMenuOpen(false); }
    function onViewportChange(event: MediaQueryListEvent) { if (event.matches) closeMenu(); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") closeMenu(); }
    desktopQuery.addEventListener("change", onViewportChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      desktopQuery.removeEventListener("change", onViewportChange);
      window.removeEventListener("keydown", onKeyDown);
      if (demoTimerRef.current !== null) window.clearTimeout(demoTimerRef.current);
    };
  }, []);

  const copy = isArabic
    ? {
        nav: { services: "الخدمات", adaptive: "كيف تتكيف؟", experience: "التجربة", trust: "الثقة" },
        open: "افتح منسج",
        eyebrow: "منصة ذكاء اصطناعي تتشكل حولك",
        headlineA: "كل ما تريد أن",
        headlineB: "تتعلّمه، تصنعه، أو تكتشفه.",
        body: "مساحة واحدة تفهم هدفك، تختار لك المسار المناسب، وتمنحك الأدوات التي تحتاجها فقط—سواء كنت تتعلم، تبحث، تكتب، تبرمج، تحلل أو تستكشف.",
        primary: "ابدأ بطريقتك",
        secondary: "شاهد التجربة",
        noCard: "ابدأ بلا بطاقة",
        noSetup: "لا إعداد معقد",
        bilingual: "عربي وإنجليزي من الأصل",
        demoLabel: "جرّبها الآن",
        demoTitle: "ماذا تريد أن تنجز اليوم؟",
        send: "ابدأ",
        preparing: "منسج يهيئ المسار الأنسب…",
        preparingShort: "جارٍ التهيئة",
        simulation: "محاكاة تفاعلية",
        progress: "تهيئة المسار التجريبي",
        demoReady: "فهمت مقصدك",
        demoRoute: "المسار الأنسب لك",
        openSpace: "افتح المساحة",
        forEveryone: "لا تحتاج أن تكون خبيرًا لتستفيد من الذكاء الاصطناعي.",
        audience: ["أتعلّم", "أبحث", "أكتب", "أبرمج", "أحلّل", "أصنع", "أستكشف", "أنظّم حياتي"],
        servicesEyebrow: "منصة واحدة · أبواب متعددة",
        servicesTitle: "ابدأ من هدف، لا من قائمة أدوات.",
        servicesBody: "كل خدمة لها تجربة مصممة لطبيعة المهمة، بينما يحافظ منسج على سياقك وملفاتك وتفضيلاتك في الخلفية.",
        adaptiveEyebrow: "تخصيص بلا قوالب",
        adaptiveTitle: "تتغير المنصة مع ما تريد إنجازه—لا مع مسماك الوظيفي.",
        adaptiveBody: "اختر أهدافك اليوم، عدّلها غدًا، أو ادخل مباشرة. تتقدم الأدوات المناسبة إلى الواجهة وتبقى الإمكانات المتخصصة قريبة دون أن تزدحم الشاشة.",
        steps: [
          ["اختر مقصدك", "تعلّم، بحث، صناعة، برمجة أو مجرد فضول."],
          ["اضبط المسار", "منسج يسأل فقط عما يؤثر فعلًا في النتيجة."],
          ["اعمل بطريقتك", "محادثة، لوحة، مستند، كود أو تقرير بمصادر."],
        ],
        sceneEyebrow: "سياق واحد، أشكال عمل متعددة",
        sceneTitle: "من سؤال سريع إلى مخرج يمكنك استخدامه.",
        sceneBody: "لا يحبس منسج كل شيء داخل فقاعة محادثة. تتحول الإجابة إلى درس، تقرير، مستند، لوحة بيانات أو مشروع قابل للتطوير.",
        sceneCards: ["خطة تعلّم تتكيف مع مستواك", "بحث موثق بمصادر قابلة للفتح", "مسودة وواجهة وكود في مساحة واحدة"],
        trustEyebrow: "الوضوح جزء من التجربة",
        trustTitle: "أنت تعرف دائمًا ماذا يحدث ولماذا.",
        trustBody: "المصادر، استخدام الأدوات، التكلفة، والذاكرة تظهر بوضوح. ويمكنك إيقاف التخصيص أو تغيير المسار في أي وقت.",
        finalTitle: "مكان واحد يتسع لفضولك كله.",
        finalBody: "ابدأ بسؤال بسيط. دع منسج يفتح لك المسار المناسب.",
        finalCta: "استكشف منسج",
        footer: "ذكاء اصطناعي أقرب للناس، وأوضح في كل خطوة.",
        prototype: "نسخة تجريبية تفاعلية · لا تنفّذ خدمات خارجية بعد",
      }
    : {
        nav: { services: "Services", adaptive: "How it adapts", experience: "Experience", trust: "Trust" },
        open: "Open Minsaj",
        eyebrow: "An AI platform that forms around you",
        headlineA: "Everything you want to",
        headlineB: "learn, create, or discover.",
        body: "One space that understands your goal, finds the right path, and reveals only the tools you need—whether you are learning, researching, writing, coding, analyzing, or exploring.",
        primary: "Start your way",
        secondary: "See the experience",
        noCard: "Start without a card",
        noSetup: "No complex setup",
        bilingual: "Arabic and English by design",
        demoLabel: "Try it now",
        demoTitle: "What do you want to accomplish today?",
        send: "Start",
        preparing: "Minsaj is preparing the best path…",
        preparingShort: "Preparing",
        simulation: "Interactive simulation",
        progress: "Preparing the demo path",
        demoReady: "Intent understood",
        demoRoute: "Your best path",
        openSpace: "Open the space",
        forEveryone: "You should not need to be an expert to benefit from AI.",
        audience: ["I learn", "I research", "I write", "I code", "I analyze", "I create", "I explore", "I organize life"],
        servicesEyebrow: "One platform · many doors",
        servicesTitle: "Start with a goal, not a tool list.",
        servicesBody: "Each service is shaped for its kind of work while Minsaj keeps context, files, and preferences connected behind the scenes.",
        adaptiveEyebrow: "Personal, never boxed in",
        adaptiveTitle: "The platform changes with your goal—not your job title.",
        adaptiveBody: "Pick today’s goals, change them tomorrow, or jump straight in. Relevant tools move forward while specialist power stays nearby without crowding the screen.",
        steps: [
          ["Choose your intent", "Learn, research, create, code, or simply follow your curiosity."],
          ["Shape the path", "Minsaj asks only what can meaningfully improve the outcome."],
          ["Work your way", "Conversation, canvas, document, code, or a source-backed report."],
        ],
        sceneEyebrow: "One context, many forms",
        sceneTitle: "From a quick question to something you can use.",
        sceneBody: "Minsaj does not trap every task in a chat bubble. An answer can become a lesson, report, document, data view, or evolving project.",
        sceneCards: ["A learning path that meets your level", "Research with sources you can open", "Writing, interface, and code in one space"],
        trustEyebrow: "Clarity is part of the experience",
        trustTitle: "Always know what is happening and why.",
        trustBody: "Sources, tool use, cost, and memory remain visible. Turn personalization off or change direction whenever you want.",
        finalTitle: "One place for all of your curiosity.",
        finalBody: "Begin with a simple question. Let Minsaj open the right path.",
        finalCta: "Explore Minsaj",
        footer: "AI made more human, and clearer at every step.",
        prototype: "Interactive prototype · no external services execute yet",
      };

  function cancelDemo() {
    if (demoTimerRef.current !== null) {
      window.clearTimeout(demoTimerRef.current);
      demoTimerRef.current = null;
    }
  }

  function selectService(id: UniversalServiceId) {
    cancelDemo();
    setActiveId(id);
    setPrompt("");
    setDemoState("idle");
  }

  function startDemo() {
    cancelDemo();
    setDemoState("working");
    demoTimerRef.current = window.setTimeout(() => {
      demoTimerRef.current = null;
      setDemoState("ready");
    }, 680);
  }

  return (
    <div className="universal-site">
      <header className="universal-nav-wrap">
        <div className="universal-nav">
          <Link className="luma-brand" href={`/${locale}`} aria-label={isArabic ? "منسج الرئيسية" : "Minsaj home"}>
            <span className="luma-brand__mark"><MinsajMark size={34} /></span>
            <span className="luma-brand__word">{isArabic ? "منسج" : "Minsaj"}</span>
            <span className="luma-brand__spark"><Sparkles size={12} /></span>
          </Link>
          <nav className="universal-nav__links" aria-label={isArabic ? "التنقل العام" : "Public navigation"}>
            <a href="#services">{copy.nav.services}</a>
            <a href="#adaptive">{copy.nav.adaptive}</a>
            <a href="#experience">{copy.nav.experience}</a>
            <a href="#trust">{copy.nav.trust}</a>
          </nav>
          <div className="universal-nav__actions">
            <ThemeToggle locale={locale} />
            <Link className="luma-locale" href={`/${otherLocale}`} prefetch={false} aria-label={isArabic ? "English" : "العربية"}>{otherLocale.toUpperCase()}</Link>
            <Link className="luma-button luma-button--ink luma-button--small" href={appHref}>{copy.open}<ArrowLeft size={16} /></Link>
            <button className="universal-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="universal-mobile-menu" aria-label={menuOpen ? (isArabic ? "إغلاق القائمة" : "Close menu") : (isArabic ? "فتح القائمة" : "Open menu")}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
          </div>
        </div>
        <div className="universal-mobile-menu-region" data-state={menuOpen ? "open" : "closed"} aria-hidden={!menuOpen}>
          <div>
            <nav id="universal-mobile-menu" className="universal-mobile-menu" aria-label={isArabic ? "قائمة الهاتف" : "Mobile menu"}>
              <a href="#services" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{copy.nav.services}</a>
              <a href="#adaptive" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{copy.nav.adaptive}</a>
              <a href="#experience" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>{copy.nav.experience}</a>
              <Link href={appHref} tabIndex={menuOpen ? 0 : -1}>{copy.open}</Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="universal-hero">
          <div className="universal-hero__glow universal-hero__glow--one" />
          <div className="universal-hero__glow universal-hero__glow--two" />
          <div className="universal-container universal-hero__grid">
            <div className="universal-hero__copy">
              <span className="luma-kicker"><Sparkles size={14} />{copy.eyebrow}</span>
              <h1>{copy.headlineA}<span>{copy.headlineB}</span></h1>
              <p>{copy.body}</p>
              <div className="universal-hero__actions">
                <Link className="luma-button luma-button--primary luma-button--large" href={appHref}>{copy.primary}<ArrowLeft size={18} /></Link>
                <a className="luma-button luma-button--ghost luma-button--large" href="#interactive-demo"><span className="luma-play"><ArrowUp size={14} /></span>{copy.secondary}</a>
              </div>
              <div className="universal-trust-line">
                <span><CheckCircle2 size={14} />{copy.noCard}</span>
                <span><CheckCircle2 size={14} />{copy.noSetup}</span>
                <span><CheckCircle2 size={14} />{copy.bilingual}</span>
              </div>
            </div>

            <div id="interactive-demo" className="universal-demo-card" data-service={active.id}>
              <div className="universal-demo-card__art" aria-hidden="true">
                <Image src="/minsaj-luminous-world.jpg" alt="" fill priority sizes="(max-width: 900px) 100vw, 46vw" />
                <div className="universal-demo-card__art-fade" />
              </div>
              <div className="universal-demo-card__top">
                <span><span className="universal-live-dot" />{copy.demoLabel}</span>
                <span className="universal-demo-card__status">MINSAJ / ADAPTIVE</span>
              </div>
              <div className="universal-demo-card__body">
                <span className="universal-demo-orb"><ActiveIcon size={20} /></span>
                <h2>{copy.demoTitle}</h2>
                <div className="universal-mode-strip" role="tablist" aria-label={isArabic ? "اختر الخدمة" : "Choose a service"}>
                  {services.map((service) => {
                    const Icon = serviceIcons[service.id];
                    return <button key={service.id} type="button" role="tab" aria-label={service.shortLabel} aria-selected={active.id === service.id} className={active.id === service.id ? "is-active" : ""} onClick={() => selectService(service.id)}><Icon size={16} /><span>{service.shortLabel}</span></button>;
                  })}
                </div>
                <div className="universal-composer">
                  <textarea value={prompt} onChange={(event) => { cancelDemo(); setPrompt(event.target.value); setDemoState("idle"); }} placeholder={active.prompt} aria-label={active.prompt} rows={3} />
                  <div className="universal-composer__bottom">
                    <div><button type="button" aria-label={isArabic ? "إرفاق ملف" : "Attach a file"}><Paperclip size={18} /></button><button type="button" aria-label={isArabic ? "إدخال صوتي" : "Voice input"}><Mic size={18} /></button><span>{active.eyebrow}</span></div>
                    <button type="button" className="universal-send" onClick={startDemo} aria-label={demoState === "working" ? copy.preparingShort : copy.send} disabled={demoState === "working"} data-loading={demoState === "working"}>{demoState === "working" ? <LoaderCircle size={18} /> : <ArrowUp size={18} />}</button>
                  </div>
                </div>
                {demoState === "working" ? <ActivityFeedback state="working" className="universal-demo-result" label={copy.simulation} title={copy.preparing} description={active.eyebrow} progressLabel={copy.progress} /> : null}
                {demoState === "ready" ? <ActivityFeedback state="success" className="universal-demo-result" label={`${copy.demoReady} · ${copy.demoRoute}`} title={active.outputTitle} description={active.outputBody} action={<Link href={`/${locale}/app/${active.slug}`}>{copy.openSpace}<ArrowLeft size={14} /></Link>} /> : null}
                {demoState === "idle" ? (
                  <div className="universal-starters">
                    {active.starters.slice(0, 2).map((starter) => <button type="button" key={starter} onClick={() => { cancelDemo(); setPrompt(starter); setDemoState("idle"); }}>{starter}<ArrowLeft size={14} /></button>)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="universal-audience" aria-label={copy.forEveryone}>
          <div className="universal-container">
            <p>{copy.forEveryone}</p>
            <div>{copy.audience.map((item, index) => <span key={item}><i className={`audience-dot audience-dot--${index % 4}`} />{item}</span>)}</div>
          </div>
        </section>

        <section id="services" className="universal-section universal-services-section">
          <div className="universal-container">
            <div className="universal-section-heading">
              <div><span>{copy.servicesEyebrow}</span><h2>{copy.servicesTitle}</h2></div>
              <p>{copy.servicesBody}</p>
            </div>
            <div className="universal-service-grid">
              {services.map((service, index) => {
                const Icon = serviceIcons[service.id];
                return (
                  <Link href={`/${locale}/app/${service.slug}`} className={`universal-service-card universal-service-card--${service.id}${index === 0 ? " universal-service-card--wide" : ""}`} data-service={service.id} key={service.id}>
                    <div className="universal-service-card__top"><span><Icon size={20} /></span><ArrowLeft size={18} /></div>
                    <small>{service.eyebrow}</small>
                    <h3>{service.label}</h3>
                    <p>{service.description}</p>
                    <div className="universal-service-card__sample">“{service.starters[0]}”</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section id="adaptive" className="universal-section universal-adaptive-section">
          <div className="universal-container universal-adaptive-grid">
            <div className="universal-adaptive-copy">
              <span className="luma-kicker"><Layers3 size={14} />{copy.adaptiveEyebrow}</span>
              <h2>{copy.adaptiveTitle}</h2>
              <p>{copy.adaptiveBody}</p>
              <Link className="luma-text-link" href={appHref}>{copy.primary}<ArrowLeft size={16} /></Link>
            </div>
            <div className="universal-adaptive-visual">
              <div className="universal-adaptive-visual__head"><span className="universal-avatar">ن</span><div><small>{isArabic ? "تجربتك اليوم" : "Your experience today"}</small><strong>{isArabic ? "تعلّم + بحث + استكشاف" : "Learn + Research + Explore"}</strong></div><span className="universal-auto-chip"><Sparkles size={12} />{isArabic ? "متكيّف" : "Adaptive"}</span></div>
              <ol>
                {copy.steps.map(([title, body], index) => <li key={title}><span>{`0${index + 1}`}</span><div><strong>{title}</strong><p>{body}</p></div>{index === 0 ? <div className="universal-mini-goals"><i>تعلّم</i><i>بحث</i><i>فضول</i></div> : null}</li>)}
              </ol>
              <div className="universal-adaptive-note"><ShieldCheck size={16} /><span>{isArabic ? "أنت تتحكم في الأهداف والذاكرة والتوصيات." : "You control goals, memory, and recommendations."}</span></div>
            </div>
          </div>
        </section>

        <section id="experience" className="universal-section universal-scene-section">
          <div className="universal-container">
            <div className="universal-scene-heading"><span>{copy.sceneEyebrow}</span><h2>{copy.sceneTitle}</h2><p>{copy.sceneBody}</p></div>
            <div className="universal-scene-frame">
              <div className="universal-scene-frame__image"><Image src="/minsaj-luminous-world.jpg" alt={isArabic ? "عالم بصري مترابط لخدمات منسج" : "A connected visual world for Minsaj services"} fill sizes="(max-width: 900px) 100vw, 70vw" /></div>
              <div className="universal-scene-frame__floating">
                {copy.sceneCards.map((item, index) => <div className={`universal-float-card universal-float-card--${index + 1}`} key={item}><span>{index === 0 ? <BookOpenCheck size={18} /> : index === 1 ? <SearchCheck size={18} /> : <Code2 size={18} />}</span><strong>{item}</strong><CheckCircle2 size={16} /></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="trust" className="universal-section universal-trust-section">
          <div className="universal-container universal-trust-grid">
            <div><span>{copy.trustEyebrow}</span><h2>{copy.trustTitle}</h2><p>{copy.trustBody}</p></div>
            <div className="universal-trust-cards">
              <article><ShieldCheck size={20} /><strong>{isArabic ? "خصوصية مفهومة" : "Understandable privacy"}</strong><p>{isArabic ? "ذاكرة قابلة للرؤية والإيقاف، وليست صندوقًا غامضًا." : "Memory you can inspect and turn off—not a black box."}</p></article>
              <article><SearchCheck size={20} /><strong>{isArabic ? "مصادر قابلة للتحقق" : "Verifiable sources"}</strong><p>{isArabic ? "افتح المصدر واعرف أين تنتهي الحقيقة ويبدأ الاستنتاج." : "Open the source and see where evidence ends and inference begins."}</p></article>
              <article><WandSparkles size={20} /><strong>{isArabic ? "اقتراحات قابلة للتعديل" : "Editable suggestions"}</strong><p>{isArabic ? "كل تخصيص يفسر نفسه ويمكن تغييره فورًا." : "Every personalization explains itself and can be changed instantly."}</p></article>
            </div>
          </div>
        </section>

        <section className="universal-final-cta">
          <div className="universal-final-cta__glow" />
          <div className="universal-container"><span className="universal-final-orb"><MinsajMark size={46} /></span><h2>{copy.finalTitle}</h2><p>{copy.finalBody}</p><Link className="luma-button luma-button--primary luma-button--large" href={appHref}>{copy.finalCta}<ArrowLeft size={18} /></Link></div>
        </section>
      </main>

      <footer className="universal-footer">
        <div className="universal-container"><div className="luma-brand"><span className="luma-brand__mark"><MinsajMark size={28} /></span><span className="luma-brand__word">{isArabic ? "منسج" : "Minsaj"}</span></div><p>{copy.footer}</p><span>{copy.prototype}</span></div>
      </footer>
    </div>
  );
}
