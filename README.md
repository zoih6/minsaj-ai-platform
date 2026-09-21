# منسج · Minsaj AI Platform

**منصة عمل موحّدة للذكاء الاصطناعي، عربية أولًا.** أفكارك خيوط ونحن ننسجها واقعًا — من النية إلى نتيجة منظمة يمكن فهمها وتعديلها وحفظها والعودة إليها.

```text
النية → مساحة العمل → السياق → التنفيذ → مخرج منظم → الحفظ → الاستئناف
```

## نظرة عامة

المنصة تعمل حاليًا كأساس واجهة وتجربة كامل على طبقة بيانات تجريبية (typed mock) — جاهزة للربط الخلفي دون تغيير الواجهة.

| الطبقة | المحتوى |
|---|---|
| **الخدمات (7+1)** | اسأل · تعلّم · ابحث · أنشئ · برمج · حلّل · استكشف + مكتبتي |
| **المساحات النطاقية** | تعلّم / ابحث / أنشئ — مساحات عمل متخصصة منجزة |
| **بوابات الخدمات** | اسأل / برمج / حلّل / استكشف — بوابة موحدة بتسعة أقسام (أدوات عمل، أسلوب تنفيذ، ملقّن، مسار رباعي، بدايات سريعة…) |
| **الأدوات المتقدمة** | المشاريع · الوكلاء · التدفقات · مصادر المعرفة · النماذج |
| **طبقة التشغيل** | سجل التشغيلات · الاستخدام والتكلفة · الفوترة · الفريق والأدوار |
| **الغلاف** | قائمة جانبية ثلاثية المجموعات · لوحة أوامر ⌘K · ثيم فاتح/داكن · عربي RTL / إنجليزي LTR |

## الوثائق — يبدأ العمل من هنا

المشروع **يُدار بالوثائق**: كل ميزة وتفاعل وشاشة له مواصفة تُحدَّث مع الكود.

| اقرأ | الملف |
|---|---|
| 🚪 دليل الجلسة الجديدة | [ONBOARDING.md](./ONBOARDING.md) |
| 📜 مصدر الحقيقة الكامل | [AGENT.md](./AGENT.md) |
| 🛡️ القواعد الحمراء | [AGENT-GUIDE.md](./AGENT-GUIDE.md) |
| 📚 فهرس الوثائق الكامل | [docs/00-INDEX.md](./docs/00-INDEX.md) |
| 🧭 المرحلة الحالية | [docs/05-process/roadmap.md](./docs/05-process/roadmap.md) |
| ⚠️ العيوب المعروفة | [docs/05-process/known-issues.md](./docs/05-process/known-issues.md) |
| 📝 سجل التغييرات | [CHANGELOG.md](./CHANGELOG.md) |
| 🗒️ سجل العمل الحي | [worklog.md](./worklog.md) |

## الحزمة التقنية

Next.js 16 (App Router) · React 19 · TypeScript 5 · Radix UI · lucide-react · next-themes · cmdk · framer-motion · Zod 4 · Tailwind CSS 4 (متاح) مع هوية CSS معمارية مخصصة (14 طبقة تحت `src/app/styles/universal/`).

**بنية monorepo:** `packages/contracts` (عقود Zod) · `packages/i18n` · `packages/mock-api` · `packages/ui`.

## بنية المشروع

```text
src/
├── app/[locale]/          # كل المسارات تحت ar/en
│   ├── (marketing)/       # صفحة الهبوط
│   ├── app/               # التطبيق: home · chat · [service] · learn|research|create
│   │                      #        · agents · flows · knowledge · models · runs · usage …
│   └── preview/           # أسطح تحقق معزولة
├── components/            # app-shell · universal (البوابات) · domain · marketing
├── features/service-workbench/service-registry.ts   # سجل الخدمة الحاكم
└── lib/universal-content.ts                          # بيانات الخدمات
packages/                  # contracts · i18n · mock-api · ui
docs/                      # منظومة الوثائق (منتج · تجربة · تصميم · هندسة · عملية)
```

خريطة المسارات الكاملة (34 مسارًا): [docs/02-experience/information-architecture.md](./docs/02-experience/information-architecture.md).

## التشغيل المحلي

```bash
git clone https://github.com/zoih6/minsaj-ai-platform.git
cd minsaj-ai-platform
npm ci                # لا متغيرات بيئة مطلوبة — طبقة mock مغلقة
npm run dev           # → http://localhost:3000
```

```bash
npm run build         # إنتاجي — يجب أن ينجح بكل المسارات
npm run lint          # ESLint
npx tsc --noEmit      # الأنواع (الأخطاء المعروفة الموثقةة وحدها مقبولة)
```

## النشر

النشر **تلقائي على Vercel** عند كل دفعة إلى `main` (مشروع `minsaj-ai-platform`). لا متغيرات بيئة ولا قاعدة بيانات — التطبيق مستقل بالكامل على طبقته التجريبية.

**قبل كل دفعة (إلزامي):** build ناجح → lint نظيف → فحص بصري (ثيمان × اتجاهان + 390px) → تحديث الوثائق المتأثرة. التفصيل في [AGENT-GUIDE.md](./AGENT-GUIDE.md).

## قواعد المستودع

- 🔴 **لا أسرار:** المستودع عام — يمنع وضع أي توكن أو مفتاح في أي ملف.
- الفرع الإنتاجي `main` فقط — لا force push.
- أي مسار جديد يبدأ بصف في جدول IA قبل الكود.
- أي تفاعل جديد يسجل في جدول التفاعلات بأثره الملموس — «كل زر له أثر».

## الحالة الحالية

- ✅ البناء الإنتاجي نظيف بكل المسارات والنشر الإنتاجي يعمل.
- ✅ أساس الواجهة والتدويل والثيمات والوصولية مكتمل.
- 🎯 **مرحلة العمل الحالية:** ربط منطق الاختيار (أداة العمل × أسلوب التنفيذ يعيد هيكلة الشاشة) — المواصفة جاهزة في [docs/02-experience/interaction-logic.md](./docs/02-experience/interaction-logic.md).
- ⚠️ عيوب معروفة موثقةة تنتظر جدولتها: [known-issues.md](./docs/05-process/known-issues.md).
