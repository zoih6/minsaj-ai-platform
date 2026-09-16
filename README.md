<div dir="rtl">

# نَسَق AI — Nasaq AI Platform

منصة أعمال الذكاء الاصطناعي: ابحث، تعلّم، أنشئ، وأدِر — بواجهة عربية أولاً (RTL) وتصميم «Luminous Premium» (بنفسجي على قشرة أوبسيديان).

**🔗 الموقع المباشر**: [nasaq-ai-platform.vercel.app](https://nasaq-ai-platform.vercel.app)
**📦 المستودع**: github.com/zoih6/nasaq-ai-platform · **النشر**: تلقائي عبر Vercel عند كل push إلى `main`

</div>

> 🤖 **For AI coding agents (read this first):** read [`AGENTS.md`](./AGENTS.md) — the single
> entry point (open AGENTS.md standard). Then check [`STATE.md`](./STATE.md) for the current
> snapshot. Skills live in `.claude/skills/` (Agent Skills format). Do not start work without both.

---

<div dir="rtl">

## نظرة سريعة

| | |
|---|---|
| **الإطار** | Next.js 16 (App Router + Turbopack) · React 19 · TypeScript |
| **التنسيق** | Tailwind CSS v4 (CSS-first) + 11 طبقة CSS معمارية |
| **البنية** | Monorepo (Bun workspaces): `packages/{contracts, i18n, mock-api, ui}` |
| **اللغات** | عربي RTL (افتراضي `/ar`) + إنجليزي LTR (`/en`) — next-intl |
| **البيانات** | Mock API محلي (`@nasaq/mock-api`) — جاهز لاستبدال ServiceProvider بالباك-اند (انظر `docs/05`) |

## التشغيل

```bash
bun install        # أو npm install
bun run dev        # http://localhost:3000 → يوجه إلى /ar
bun run build      # بناء إنتاجي
bun run lint       # ESLint
```

## أبرز ما بُني (حتى v6.1)

- **هندسة تخطيط استجابي حقيقية**: سايدبار ثلاثي الحالات (درج/شريط/موسّع) + Container Queries بدل ترقيع media queries + ثبات لمس 44px + صفر خصائص فيزيائية left/right
- **نظام حالات UX كامل**: هياكل تحميل مطابقة، حالات فرغ بواجهات CTA، عقد خطأ من 5 أجزاء، شارات الحقيقة — جرّب `?state=loading|empty|error`
- **حركة محترمة**: تدرّج دخول، scroll-reveal، لمعات — كلها تحت `prefers-reduced-motion`
- **حدود أخطاء وتحميل** لكل مسارات /app (error.tsx + loading.tsx)
- **لوحة أوامر** (⌘K/Ctrl+K) ببحث عربي، إشعارات، شريط تبويبات سفلي للجوال

## البنية

```text
src/app/[locale]/{(marketing), app, preview}   # المسارات (ar|en)
src/app/styles/universal/                     # 11 طبقة CSS مرتبة (foundations → workbench)
src/components/{app-shell, universal, domain}  # القشرة والمكونات
src/features/                                  # research · learn · create · service-workbench
src/lib/viewports.ts                           # مصدر الحقيقة الوحيد للـ breakpoints
packages/{contracts, i18n, mock-api, ui}       # حزم Monorepo
docs/                                          # وثائق احترافية (00-08 + REFERENCES + CHANGELOG)
AGENTS.md / STATE.md / CLAUDE.md                # نظام توجيه الوكلاء (اقرأ AGENTS.md أولاً)
.claude/skills/                                # 7 مهارات Agent Skills (SKILL.md)
```

## الوثائق (`docs/` — إنجليزية)

`00-PRODUCT-BRIEF` · `01-PRD` · `02-UX-SPECIFICATION` · `03-DESIGN-SYSTEM` · `04-FRONTEND-ARCHITECTURE` · `05-BACKEND-INTEGRATION-READINESS` · `06-TESTING-STRATEGY` · `07-ROADMAP` · `README` · `CHANGELOG` (عربي)

## CI

GitHub Actions (`.github/workflows/ci.yml`): عند كل push/PR → تثبيت (Bun) → فحص ESLint → بناء إنتاجي.

</div>
