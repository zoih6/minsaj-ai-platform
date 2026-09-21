# Minsaj AI Platform

هذا المستودع يحتوي على **السورس الأساسي الحالي لمنصة Minsaj AI**، مع الأصول العامة اللازمة لواجهات الموقع. تم تبسيط المستودع والإبقاء على السورس والأصول وملفات التشغيل الأساسية فقط في الجذر:

```text
README.md
PRD.md
package.json
package-lock.json
next.config.ts
tsconfig.json
postcss.config.mjs
eslint.config.mjs
components.json
packages/
public/
src/
.claude/
```

## محتويات المستودع

| المسار | الوصف |
|---|---|
| `src/` | تطبيق الموقع وواجهاته ومساراته ومكوّناته وميزاته وأنماط CSS. |
| `packages/` | الحزم الداخلية المشتركة: العقود، الترجمة، بيانات المحاكاة، ومكوّنات UI. |
| `public/` | الصور والشعارات والأنماط والأصول العامة المستخدمة في الموقع. |
| `README.md` | وثيقة تعريفية بالحالة الحالية وبنية المشروع. |
| `PRD.md` | تعريف المنتج ونطاقه وخريطة صفحاته. |
| `.claude/skills/design-visual-frontend/` | مهارة الوكيل لتصميم وبناء ومراجعة الواجهات بصريًا. |

> مهارة `design-visual-frontend` مثبتة على مستوى المشروع داخل `.claude/skills/`، وتحافظ على ملف `SKILL.md` ومراجعها وملف تعريف OpenAI اللازم لاكتشافها.

## التقنية والبنية

المشروع مبني حول تطبيق React/Next.js داخل `src/`، مع طبقة حزم داخلية تحت `packages/`:

```text
src/
├── app/
│   └── [locale]/
│       ├── (marketing)/
│       ├── app/
│       └── preview/
├── components/
│   ├── app-shell/
│   ├── domain/
│   ├── marketing/
│   ├── theme/
│   └── universal/
├── features/
│   ├── create/
│   ├── learn/
│   ├── research/
│   ├── service-foundation/
│   └── service-workbench/
├── hooks/
├── lib/
└── proxy.ts

packages/
├── contracts/
├── i18n/
├── mock-api/
└── ui/

public/
└── brand/
    ├── backgrounds/
    ├── icons/
    ├── logos/
    ├── motion/
    ├── patterns/
    └── symbols/
```

## هيكل صفحات الموقع

تستخدم الصفحات متغير اللغة `[locale]`، مثل `ar` أو `en`:

```text
src/app/[locale]/
├── (marketing)/page.tsx
├── layout.tsx
├── loading.tsx
├── not-found.tsx
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── error.tsx
│   ├── home/page.tsx
│   ├── chat/page.tsx
│   ├── [service]/page.tsx
│   ├── agents/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [agentId]/edit/page.tsx
│   ├── flows/
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   └── [flowId]/edit/page.tsx
│   ├── projects/
│   │   ├── page.tsx
│   │   └── [projectId]/page.tsx
│   ├── runs/
│   │   ├── page.tsx
│   │   └── [runId]/page.tsx
│   ├── knowledge/
│   │   ├── page.tsx
│   │   └── [collectionId]/page.tsx
│   ├── models/
│   │   ├── page.tsx
│   │   ├── routing/page.tsx
│   │   └── [modelId]/page.tsx
│   ├── billing/page.tsx
│   ├── usage/page.tsx
│   ├── team/page.tsx
│   ├── settings/page.tsx
│   ├── skills/page.tsx
│   └── tools/page.tsx
│
└── preview/
    ├── page.tsx
    └── service-foundation/page.tsx
```

## صفحات القائمة الجانبية

يتم تعريف القائمة الجانبية في:

```text
src/components/app-shell/app-shell.tsx
```

وتحتوي على الأقسام والصفحات التالية:

```text
/{locale}/app/home       # لك — For you
/{locale}/app/chat       # اسأل — Ask
/{locale}/app/learn      # تعلّم — Learn
/{locale}/app/research   # ابحث — Research
/{locale}/app/create     # أنشئ — Create
/{locale}/app/code       # برمج — Code
/{locale}/app/analyze    # حلّل — Analyze
/{locale}/app/explore    # استكشف — Explore
/{locale}/app/library    # مكتبتي — My library
```

وتحت قسم الأدوات المتقدمة:

```text
/{locale}/app/projects   # المشاريع
/{locale}/app/agents     # الوكلاء
/{locale}/app/flows      # التدفقات
/{locale}/app/knowledge  # مصادر المعرفة
/{locale}/app/models     # النماذج
```

أما إعدادات مساحة المستخدم والصفحات الإدارية فهي:

```text
/{locale}/app/settings
/{locale}/app/billing
/{locale}/app/usage
/{locale}/app/team
```

## الخدمات الديناميكية

الخدمات الأساسية مثل `learn` و`research` و`create` و`code` و`analyze` و`explore` تمر عبر المسار الديناميكي:

```text
src/app/[locale]/app/[service]/page.tsx
```

وتتوزع واجهاتها الفعلية على الميزات التالية:

```text
src/features/learn/
src/features/research/
src/features/create/
src/features/service-workbench/
```

## المكوّنات والبيانات

المكوّنات الخاصة بمجالات التطبيق موجودة في:

```text
src/components/domain/
```

وتشمل واجهات المشاريع والوكلاء والتدفقات والتشغيلات والإدارة والمحادثة. أما المكوّنات المشتركة والغلاف العام للموقع فتوجد في:

```text
src/components/app-shell/
src/components/universal/
src/components/theme/
```

وتوجد طبقة البيانات التجريبية والعقود والترجمة في:

```text
packages/contracts/
packages/i18n/
packages/mock-api/
packages/ui/
```

## وثيقة المنتج

للاطلاع على تعريف المنتج ونطاقه وخريطة صفحاته، راجع [PRD.md](./PRD.md).

## مهارة تصميم الواجهات

المسار المثبت للوكيل:

```text
.claude/skills/design-visual-frontend/
├── SKILL.md
├── agents/openai.yaml
└── references/
    ├── core-design.md
    ├── surface-archetypes.md
    ├── review-gates.md
    ├── components-content.md
    ├── domain-guidance.md
    └── frontend-implementation.md
```

تُستخدم المهارة عند تصميم أو بناء أو إعادة تصميم أو مراجعة واجهات الموقع. وهي توجه الوكيل إلى تحليل المهمة أولًا، وبناء ورقة قرار تصميمية مختصرة، واستخدام المكوّنات القابلة لإعادة الاستخدام، والتحقق من السلوك responsive والحالات والتفاعل والنتيجة المرئية عبر المقاسات المطلوبة.

بعد استنساخ المستودع، يبدأ الوكيل جلسة جديدة ليكتشف المهارة تلقائيًا، أو يمكن طلبها صراحةً:

```text
Use the design-visual-frontend skill to redesign or review this interface.
```

## الحالة الحالية

الفرع الحالي هو `main`، وتوجد مهارة تصميم الواجهات على مستوى المشروع لتكون متاحة للوكيل مباشرة بعد استنساخ المستودع.

للحصول على تفاصيل التنفيذ، ابدأ من:

```text
src/app/[locale]/
src/components/app-shell/app-shell.tsx
src/features/
packages/
public/
```
