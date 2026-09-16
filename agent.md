# agent.md — ملف استمرارية مشروع نَسَق AI (Nasaq AI)

> **الغرض**: هذا الملف هو "الذاكرة الكاملة" للمشروع. إذا فُقدت المحادثة الحالية، افتح محادثة جديدة، اطلب من المساعد قراءة هذا الملف أولاً، وسيستأنف العمل فوراً من نفس النقطة.
>
> **هذا الملف يُحدَّث مع كل مرحلة جديدة — لا تحذف منه شيئاً، أضف فقط.**

---

## 0) بروتوكول الاستئناف السريع (اقرأ هذا أولاً)

```text
1. اقرأ: agent.md (هذا الملف) ← ثم docs/CHANGELOG.md (آخر مرحلة) ← ثم /home/z/my-project/worklog.md (إن كنت في مساحة العمل الأصلية)
2. الموقع المباشر:    https://nasaq-ai-platform.vercel.app
3. مستودع GitHub:     https://github.com/zoih6/nasaq-ai-platform   (خاص — لا تنشره عاماً دون إذن)
4. لوحة Vercel:       https://vercel.com/4zobir89-lab/nasaq-ai-platform
5. تشغيل محلي:        bun install && bun run dev  →  http://localhost:3000  →  يوجه تلقائياً إلى /ar
6. تحقق سريع:         bun run lint (يجب: 0 أخطاء) + bun run build (يجب: ينجح بلا أخطاء)
```

**تحذيرات حرجة (لا تنسَها أبداً):**
- 🚫 **المستودع القديم `zoih6/nasaq-ai` محظور تماماً**: لا تفتحه، لا تعدّله، لا تحذفه، لا تدمجه مع هذا العمل. (طلب صريح من المالك). عملك الحالي على `zoih6/nasaq-ai-platform` فقط.
- 🔑 **لا ترفع أي توكنات أو أسرار إلى المستودع** (ملف `.gitignore` يستثني `.env*` — أبقِه كذلك).
- 🇸🇦 **لغة المستخدم: العربية** — ردّ دائماً بالعربية، ومحتوى المنصة عربي RTL-أولاً.

---

## 1) هوية المشروع

| البند | القيمة |
|---|---|
| الاسم | نَسَق AI (Nasaq AI) — منصة أعمال الذكاء الاصطناعي |
| النوع | واجهة أمامية كاملة (Frontend) — قابلة للربط بباك-اند مستقبلاً |
| التقنية | Next.js 16 (App Router + Turbopack) · React 19 · TypeScript · Tailwind v4 (CSS-first بدون tailwind.config) · Bun |
| البنية | Monorepo: تطبيق جذر + `packages/{contracts, i18n, mock-api, ui}` |
| اللغة | عربي RTL (افتراضي، `/ar`) + إنجليزي LTR (`/en`) عبر next-intl |
| البيانات | Mock API محلي (`@nasaq/mock-api`) — لا `process.env` ولا باك-اند حقيقي بعد |
| النسخة الحالية | v6.1 (انظر docs/CHANGELOG.md — المرحلة 7) |

**الوعد التصميمي**: هوية "Luminous Premium" — بنفسجي `#5548E0` على قشرة أوبسيديان داكنة، لمسات جوهريّة (سماوي/نعناعي/وردي/كهرماني)، خطوط IBM Plex (عربي/لاتيني/مونو).

---

## 2) الحالة الراهنة (آخر تحديث: 2026-09-16)

### الملخص التنفيذي
اكتملت 7 مراحل: (1) إعادة تصميم شاملة بهوية موحّدة، (2) توثيق وتغليف v2، (3) هندسة تخطيط استجابي كاملة، (4) إصلاح عيب تغليف v3، (5) إصلاح تداخلات مرئية أبلغ عنها المالك، (6) منظومة وثائق احترافية (10 وثائق) + سبرنت تجربة R1 (حالات UX + حركة + أداء)، (7) تجهيز النشر: إصلاحات جاهزية الإنتاج + نشر GitHub/Vercel (هذا الملف).

### فحوصات الجودة الحالية (كلها خضراء)
- ✅ `bun run build` — بناء إنتاجي ناجح (Next.js 16.1.3 + Turbopack)
- ✅ `bun run lint` — ESLint صفر أخطاء
- ✅ `tsc --noEmit` — صفر أخطاء أنواع
- ✅ 63/63 فحص تجاوب (21 صفحة × 375/768/1440) — صفر overflow أفقي
- ✅ خادم إنتاجي محلي: كل المسارات المفحوصة ترجع 200
- ✅ صفر تحذيرات hydration، صفر أخطاء console

### إصلاحات المرحلة 7 (جاهزية النشر — مهمة للمستقبل)
1. **`package.json`**: سكربت `build` كان يحتوي `cp -r .next/standalone` (خاصة sandbox) بدون `output:"standalone"` في next.config → كان سيفشل على Vercel. أُصلح إلى `next build` / `next start` القياسيين + حُذفت سكربتات `db:*` (لا يوجد prisma schema في المستودع).
2. **`motion.css:444`**: تعريف تالف `box-shadow: inset-inline-start: 2px solid` — Lightning CSS (dev) تسامح معه لكن PostCSS (build) يرفضه → فشل البناء. أُصلح إلى ظل داخلي حسب الاتجاه (`[dir="rtl"]` → `inset -2px`, `[dir="ltr"]` → `inset 2px`).
3. **أخطاء TypeScript** (كانت مخفية لأن dev لا يفحص الأنواع بالكامل): `chat-prototype.tsx` (تفكيك صفوف `readonly` من `as const`)، `states.tsx` (نوع `IconComponent` متوافق مع Lucide بدل `SVGProps`).
4. **حذف hooks ميتة**: `use-toast.ts` (يستورد وحدة غير موجودة) و`use-mobile.ts` (غير مستخدم) — لم يكن لهما أي مراجع.

---

## 3) خريطة البنية التقنية

```text
nasaq-ai-platform/
├── src/
│   ├── app/
│   │   ├── [locale]/                    # ar | en (next-intl)
│   │   │   ├── (marketing)/page.tsx     # صفحة التسويق
│   │   │   ├── app/                     # القشرة الداخلية (كل صفحات المنصة)
│   │   │   │   ├── home, projects, runs, agents, flows, knowledge,
│   │   │   │   ├── models, skills, tools, team, billing, usage,
│   │   │   │   ├── settings, chat, library
│   │   │   │   └── [service]/           # مسارات مساحات العمل: research | learn | create
│   │   │   ├── preview/                 # صفحات معاينة التأسيس
│   │   │   ├── layout.tsx / not-found.tsx / loading.tsx
│   │   │   └── app/{layout,loading,error}.tsx   # حدود التحميل/الخطأ
│   │   ├── styles/universal/            # 11 طبقة CSS — الترتيب مُقدَّس (انظر §4)
│   │   ├── universal.css                 # نقطة الدخول (12 سطر @import — لا تكسرها)
│   │   └── globals.css                   # طبقة الأنماط التاريخية الضخمة (164KB، منقّحة)
│   ├── components/
│   │   ├── app-shell/app-shell.tsx       # القشرة: آلة حالات السايدبار (انظر §5)
│   │   ├── universal/                    # ScrollFx, states.tsx, Library, Marketing...
│   │   └── domain/                       # نماذج أولية للعمليات والإدارة
│   ├── features/                         # research | learn | create | service-workbench
│   ├── hooks/use-viewport-mode.ts         # SSR-safe breakpoint hook
│   ├── lib/viewports.ts                  # مصدر الحقيقة الوحيد للـ breakpoints
│   └── proxy.ts                          # كان middleware.ts — اصطلاح Next 16
├── packages/
│   ├── contracts/    # أنواع الجلسات/الأحداث/المراحل (عقود مستقبلية للباك-اند)
│   ├── i18n/        # محتوى خدمات ثنائي اللغة
│   ├── mock-api/    # بيانات وهمية + عدّاء الجلسات
│   └── ui/          # Button/Badge/NasaqMark/SectionHeading
├── docs/            # 10 وثائق احترافية (إنجليزية) — انظر §8
├── agent.md         # هذا الملف
└── .github/workflows/ci.yml   # GitHub Actions: install → lint → build
```

---

## 4) نظام طبقات CSS (الأهم — لا تكسر الترتيب)

`src/app/universal.css` يستورد بهذا الترتيب بالضبط:

```text
1. foundations.css  — التوكنات (ألوان/ظلال/أنصاف أقطار/حركة/قياسات سائلة)
2. layout.css       — البدائيات الجوهرية: nq-grid (auto-fill/minmax), nq-split,
                      nq-cluster, nq-data-list (جدول→بطاقات), nq-scroll-x, 44px touch
3. states.css       — هياكل التحميل، حالات الفراغ/الخطأ، شارات الحقيقة
4. marketing.css    — صفحة التسويق
5. shell.css        — القشرة: سايدبار 3 حالات + توببار + شريط تبويبات سفلي + سلّم z-index
6. home.css         — الرئيسية التكيفية
7. workspaces.css   — بطاقات الخدمات ومساحات العمل
8. library.css      — المكتبة
9. responsive.css   — طبقة رقيقة: توجيه فني للتسويق + عقود وصولية فقط (ليست ترقيعات!)
10. motion.css      — scroll-reveal, stagger, shimmer, float, reduced-motion guards
11. workbench.css   — مساحة العمل التفاعلية (research/learn/create)
```

- **المبدأ المقدَّس**: المكونات تتكيّف عبر **Container Queries** (عرض الحاوية المتاح بعد السايدبار) — 4 نطاقات: 1040/880/640/430. **ممنوع** إضافة media queries على مستوى المكوّن (ترقيع) — استخدم بدائع `layout.css` أو نطاقات الحاويات.
- Breakpoints العرض (مصدر الحقيقة `src/lib/viewports.ts`): **768** (موبايل→تابلت) و**1024** (تابلت→سطح مكتب) و**1440** (سطح مكتب واسع).
- **سلّم z-index الموحّد** (موثق في أعلى shell.css): tabbar 50 → dialogs 80-101 → workbench overlays 120-121 → toasts 95+`--nq-tabbar-reserve`.

## 5) قشرة التطبيق (app-shell.tsx)

آلة حالات السايدبار — تُدار بسمات على العنصر الجذري:
- `data-sidebar="drawer" | "rail" | "expanded"`: موبايل(<768)=درج مع backdrop، تابلت(768-1023)=شريط أيقونات (التوسيع=overlay لا دفع)، سطح مكتب(≥1024)=موسّع (الطي→rail مع حفظ localStorage)
- `data-mobile-open`, `data-overlay` — للدرج والغطاء
- زر الطي/التوسيع في **صف العلامة أعلى السايدبار** (وليس أسفله — درس مُعلَّم من ملاحظة المالك)
- قفل التمرير عند فتح الدرج + إغلاق عند تغيير المسار
- العناصر الثابتة (toasts/stop button) تُرحَّل إلى `document.body` عبر createPortal وتُزاح بـ `--nq-tabbar-reserve` (معرّف على `:root` ليوصلها)

## 6) القواعد الذهبية (ممنوع كسرها)

1. **RTL-أولاً**: صفر خصائص فيزيائية `left/right` في CSS — استخدم `inline-start/end`, `padding-inline`, `margin-block`... (فُحص تدقيقياً: صفر متبقٍ).
2. **44px لمس**: أي هدف لمس لا يقل عن 44×44 (`--u-touch`).
3. **prefers-reduced-motion**: كل حركة/أنميشن تحت `@media (prefers-reduced-motion: no-preference)`.
4. **لا ترقيع media queries** على المكوّنات — Container Queries فقط (انظر §4).
5. **ScrollFx يُركَّب داخل مكوّن جذر الصفحة وليس الـ layout** — وإلا سباق hydration (درس مؤلم من المرحلة 6: React يرطّب الحدود الكسولة بعد mount الـ layout).
6. **التزامن بايت-بايت**: أي تعديل في `src` يُطبَّق على نسخة التسليم/المستودع فوراً (والعكس). تحقّق بـ `diff -r`.
7. **تحقّق داخل الحزمة نفسها**: أي حزمة/بناء يُسلَّم يجب فحصه من داخل الملف الناتج (درس v3: import مفقود داخل zip اكتُشف متأخراً).
8. **لا مكتبات جديدة دون إثبات استخدامها** — أُزيلت 45 اعتمادية ميتة في المرحلة 6. (لا تزال هذه بلا استيرادات لكنها باقية عمداً لضمان ثبات bun.lock: `prisma`, `next-auth`, `framer-motion`, `zustand`, `@tanstack/*`, `z-ai-web-dev-sdk` — فرصة تنظيف مستقبلية بعد تحقق مستقل).
9. **النصوص ثنائية اللغة**: أي محتوى جديد يُضاف بالعربية والإنجليزية معاً (i18n keys في packages/i18n أو كائنات copy المحلية).

## 7) الأوامر والتحقق

```bash
bun install          # ~994 حزمة (يقرأ bun.lock)
bun run dev          # خادم تطوير :3000 → /ar
bun run build        # بناء إنتاجي (next build)
bun run start        # خادم إنتاجي (next start)
bun run lint         # ESLint — يجب 0 أخطاء
```

**في مساحة العمل الأصلية فقط** (غير موجودة في المستودع): `scripts/verify-v6-sweep.sh` (فحص 63 نقطة تجاوب عبر agent-browser)، `scripts/.deploy.env` (توكنات النشر — سرّي!).

## 8) الوثائق (docs/ — إنجليزية، 10 ملفات)

`00-PRODUCT-BRIEF` · `01-PRD` (MoSCoW + تتبع) · `02-UX-SPECIFICATION` · `03-DESIGN-SYSTEM` · `04-FRONTEND-ARCHITECTURE` · `05-BACKEND-INTEGRATION-READINESS` (خطة الربط بالباك-اند: ServiceProvider seam) · `06-TESTING-STRATEGY` · `07-ROADMAP` (M1→M13) · `README` (فهرس) · `CHANGELOG` (سجل المراحل بالعربية).

## 9) النشر (Deployment)

### كيف يعمل الآن
- **المستودع**: `github.com/zoih6/nasaq-ai-platform` (خاص، فرع `main`)
- **Vercel**: مشروع `nasaq-ai-platform` مربوط بالمستودع عبر GitHub App — **كل push إلى `main` ينشر تلقائياً نشراً إنتاجياً**
- **الرابط المباشر**: `https://nasaq-ai-platform.vercel.app`
- إطار Next.js مكتشف تلقائياً؛ الجذر = جذر المستودع؛ Bun يُكتشف من `bun.lock`؛ لا متغيرات بيئة مطلوبة (لا `process.env` في الكود)

### إعادة نشر يدوية (بلا كود جديد)
- من لوحة Vercel: Deployments → أحدث نشر → **Redeploy**
- أو API: `POST https://api.vercel.com/v13/deployments` مع `{"name":"nasaq-ai-platform"}` وتوكن Bearer

### CI (GitHub Actions)
`.github/workflows/ci.yml`: عند كل push/PR → `bun install` → `lint` → `build`. فشل البناء يظهر كعلامة ✗ على الـ commit.

## 10) الدروس المحفوظة (Gotchas — اقرأها قبل أي تشخيص!)

1. **أثر العرض `[m`/`[h`**: مخرجات الطرفية في بيئة العمل قد "تبتلع" النص `[m` و`[h` (تُفسر كأنها ANSI) — مثلاً مجلد `[modelId]` قد يظهر كأنه `odelId]`، و`[multiple]` كأنها `ultiple]`. **الحكم دائماً بالبايتات الخام** (`python3 os.listdir` بـ `bytes` أو `od -c`), لا بالعرض. (سبّب إنذاراً كاذباً كاملاً في 2026-09-16).
2. **dev لا يكشف أخطاء الأنواع/البناء**: Turbopack dev يتسامح (Lightning CSS + لا typecheck). شغّل `tsc --noEmit` و`next build` قبل أي تسليم.
3. **CSS يمر في dev ويفشل في build**: Lightning (dev) أكثر تسامحاً من PostCSS (build) — أي تعريف مشبوه تحقق منه بسكربت parse مستقل.
4. **Hydration race**: مكوّن layout يعدّل DOM قبل ترطيب الحدود الكسولة → التحرك إلى داخل مكونات الصفحات.
5. **position:fixed داخل contain:layout** يكسر — الحل: createPortal إلى body.

## 11) سلسلة طلبات المالك (الأرشيف)

1. إعادة هيكلة شاملة للواجهة + PRD + zip. (اكتمل: v2)
2. هندسة تخطيط استجابي حقيقية بلا ترقيع (desktop/tablet/mobile + RTL). (اكتمل: v3/v4)
3. "اكمل" — متابعة. (اكتمل)
4. تقرير أخطاء: تداخل أدوات متقدمة بالموبايل + تداخل حاويات + زر طي سطح المكتب → عالِج على مستوى كل الموقع. (اكتمل: v5)
5. "رائع جداً الآن، ننتقل لمهمة تطوير type 3: UI/UX + تجربة + تفاعل + أنميشن + سرعة + تجاوب". (اكتمل: v6 — حالات UX + حركة + أداء + وثائق)
6. **2026-09-16 (الحالية)**: إنشاء مستودع GitHub جديد للمشروع الحالي (بدون مساس القديم `zoih6/nasaq-ai` مطلقاً) + تجهيز Vercel + الروابط + هذا الملف. (اكتمل: v6.1)

## 12) الخطوات القادمة المقترحة (حسب docs/07-ROADMAP.md)

- **M4 — عمق رحلة الجلسة**: توجيه الهدف من الرئيسية → مساحات العمل (FR-ASK-003..007)، حفظ المخرجات → المكتبة → الاستئناف (US-004..006)
- **M5+**: الربط بالباك-اند وفق docs/05 (عقود packages/contracts جاهزة)، ثم تفعيل z-ai-web-dev-sdk للميزات الفعلية
- **تنظيف الاعتماديات** (الفرصة الموثقة في §6.8) بعد فحص مستقل
- **تحديث هذا الملف** بعد كل مرحلة + إضافة مرحلة جديدة في docs/CHANGELOG.md

---

## 13) بروتوكول مساحة العمل الأصلية (إن كنت تعمل داخلها)

- المسار: `/home/z/my-project/` — المصدر الحي في `src/` و`packages/`، والنسخة المتطابقة للتسليم/المستودع في `download/nasaq-ai/`
- **worklog.md** (الجذر): سجل تراكمي — كل مهمة تُسجَّل بنمط `Task ID / Agent / Task / Work Log / Stage Summary`
- `scripts/` — سكربتات التحقق والنشر (منها `.deploy.env` السرّي — لا يُرفع أبداً)
- `upload/` و`audit/` و`research/` — مواد تاريخية
- **التوكنات** (GitHub PAT + Vercel) وصلت في محادثة 2026-09-16 ومحفوظة في `scripts/.deploy.env` — **يُنصح المالك بتدويرها** بعد اكتمال كل الإعدادات، وهي لا تُخزَّن في المستودع إطلاقاً.

> آخر تحديث لهذا الملف: المرحلة 7 — 2026-09-16 (النشر على GitHub + Vercel)
