# دليل تصميم منسج (Minsaj) — Design Bible v1.0
## الإصدار الهندسي التنفيذي 1:1 — RTL أولًا

> **المصدر والاعتماد:** أُنتج هذا الدليل بنموذج Claude Fable 5.1 (Anthropic) ببرومبت هندسي مفصّل قدّمه المالك (2026-09-27)، وسلّمه المالك للفريق ليكون **المعيار المرجعي لنظام التصميم**. يُقرأ مع `docs/03-design/BIBLE-INTEGRATION.md` (سجل قرارات الدمج — إلزامي قبل أي تنفيذ): الدليل يُطبَّق عبر **جسر توكنز** إلى معمارية `--u-*` المجمدة، لا باستبدال الملفات. كل تعارض بين هذا الدليل والهوية المجمدة/بوابات CI يُحسم في وثيقة الدمج.
>
> هذا المستند مواصفة هندسية. كل قيمة قابلة للتنفيذ مباشرة. لا اجتهاد بصري مسموح خارج هذه المواصفة.

---

## 1. الاتجاه الفني والمبادئ الحاكمة

### 1.1 ثلاثة اتجاهات فنية مقترحة

#### الاتجاه A: النول الهادئ Woven Quiet
* **الفلسفة:** النسيج كاستعارة نظامية وليس زخرفية. شبكة، خيط سداة ولحمة، تقاطع عمودي/أفقي = نظام الشبكة نفسه. جمال ناتج عن الدقة الهندسية وليس الزخرفة.
* **الإحساس:** هادئ، دافئ، رصين، واثق. مثل Linear + Apple Notes + Muji. فراغ كبير، لا ضوضاء.
* **لوحة أولية:** ورق دافئ `#FCFCF9` + حجر دافئ `#1A1A19` + خيط طيني `#C85A32` كنقطة تركيز وحيدة 4% من المساحة.
* **طابع طباعي:** هندسي محايد — IBM Plex Sans Arabic + Inter. عناوين ثقيلة (700) مقصودة، نصوص خفيفة (400).
* **المرجع:** Linear.app + Perplexity + Apple Human Interface

#### الاتجاه B: المخطوطة الرقمية Digital Manuscript
* **الفلسفة:** الوراثة العربية المخطوطية معاد تفسيرها رقميًا. تباين حاد، حبر أسود كثيف، هوامش واسعة كالكتاب.
* **الإحساس:** تحريري، نخبوي، أدبي، أكاديمي. مثل NYTimes + Readwise + Craft.
* **لوحة أولية:** حبر `#0B0B0C` + ورق مصفر `#FDF6E3` + ذهبي محروق `#8C6A2B` + قرمزي `#9E2B25`
* **طابع طباعي:** Alexandria للعناوين (هوية عربية قوية) + Amiri للنص الطويل.
* **المرجع:** Manus.im + Notion Editorial

#### الاتجاه C: المختبر الليلي Lab Noir
* **الفلسفة:** أداة للمحترفين. Dark-first، تباين نيون خافت، شبكات تقنية، أرقام Mono.
* **الإحساس:** تقني، سريع، دقيق، للمطورين. مثل Vercel + OpenAI Playground + Cursor.
* **لوحة أولية:** أسود فحمي `#0A0A0B` + رمادي بارد `#202124` + بنفسجي كهربائي `#6D5CFF` + سماوي `#00D1FF`
* **طابع طباعي:** IBM Plex Mono للأرقام + Inter Tight للعناوين.
* **المرجع:** Vercel Dashboard + ChatGPT Dark

### 1.2 الاختيار: الاتجاه A — النول الهادئ Woven Quiet

**لماذا هو الأقوى لمنسج؟**
1. **الاستعارة القابلة للتنفيذ:** «النول» ليس شعارًا، هو `grid system`. السداة = الأعمدة العمودية (12 column grid)، اللحمة = الصفوف الأفقية (4px baseline). هذا يمنح قصة هندسية للمهندس وليس مجرد Moodboard.
2. **الثنائية اللغوية:** الاتجاه B يبالغ في «الشرقية» فيصبح غريبًا على الإنجليزية. الاتجاه C يبالغ في «التقنية» فيصبح باردًا على العربية. الاتجاه A محايد ثقافيًا، يعمل بنفس الجودة `dir="rtl"` و `dir="ltr"`.
3. **مشكلة الترقيع:** الحل هو نظام هادئ يقمع الضوضاء (قلة ألوان، قلة ظلال، قلة radius) لا نظام يضيف زخرفة.
4. **المرجعية المطلوبة (ChatGPT/Apple):** كلاهما يعتمد على الهدوء المكلف (Expensive Quiet) وليس على الألوان الصارخة.
5. **قابلية التوسع لـ 19 مسارًا:** لوحة من لونين أساسيين + لون تركيز واحد تمنع انهيار النظام عند إضافة خدمات جديدة.

**الترجمة التنفيذية للاختيار:**
* نسبة اللون التركيزي (Accent) لا تتجاوز `4%` من أي شاشة.
* لا `gradient` ملون أبدًا. التدرج الوحيد مسموح به هو `from-white to-neutral-50` لإعطاء عمق ورقي.
* الزخرفة الوحيدة المسموحة هي `1px` خط نسيج `woven-line` عند تقاطع الـ grid.

> ⚠️ **قيد الدمج (BIBLE-INTEGRATION §قرار D-8):** لوحة «النول الهادئ» الحرفية (stone/terracotta) تتعارض مع الهوية المجمدة v1 (indigo/violet + أصول العلامة + قالب التسويق + بوابات التباين). المعتمد للتنفيذ الآن: **انضباط الاتجاه A** (هدوء، accent ≤4%، ظلان كحد أقصى، حد هادئ افتراضي) فوق **لوحة الهوية المجمدة**. تبديل اللوحة بالكامل قرار مالك مؤجل (D-8) يتطلب موجة مستقلة.

### 1.3 المبادئ الحاكمة السبعة — ستُقاس عليها كل مراجعة تصميم

| المبدأ | القاعدة القابلة للقياس | كيف نقيسه |
| :--- | :--- | :--- |
| **1. الشبكة قبل الجمال** | كل عنصر يبدأ على `4px` grid. لا قيمة `margin` فردية مثل `13px`. | فحص DevTools — كل `gap/padding/margin` من جدول الـ spacing فقط |
| **2. هدوء مكلف** | `border: 1px solid var(--border)` هو الفاصل الافتراضي، الظل ممنوع إلا للمستوى `elevated` فقط. | عدد الظلال في الصفحة ≤ 2 |
| **3. وزن واحد للقرار** | كل مسار يملك زر `Primary` واحد فقط في الشاشة. الباقي `Secondary/Ghost`. | مراجعة هرمية الأزرار |
| **4. العربية أولاً، لا ترجمة معكوسة** | `line-height` عربي ≥ `1.7`، `letter-spacing` عربي = `0` دائمًا. لا نسخ قيم اللاتينية. | فحص `line-height` للنص العربي |
| **5. مساحة عمل واحدة** | كل الخدمات السبع تطبق نفس `Service Workspace Shell` (Composer + Stages + Artifacts). لا اختراع نمط جديد. | مطابقة الهيكل لـ Section 5 |
| **6. حالات وليس صفحات** | كل مكون يملك 7 حالات مرسومة: `default/hover/focus/loading/empty/error/disabled`. لا حالة ناقصة تنتقل للكود. | Checklist الحالات |
| **7. اللمس = النقر** | كل هدف تفاعلي `min-height: 44px` و `min-width: 44px` حتى على Desktop. | فحص Accessibility |

---

## 2. Design Tokens كاملة (Light + Dark)

### 2.1 الألوان — لوحة كاملة + Semantic Tokens

#### A. لوحة الألوان الأولية (Primitives)

```css
/* Neutral - Warm Stone - أساس المنصة */
--stone-50:  #FCFCF9; --stone-100: #F6F5F2; --stone-200: #EFEDE9;
--stone-300: #E8E6E1; --stone-400: #D6D3CD; --stone-500: #B8B4AE;
--stone-600: #9A9590; --stone-700: #76716C; --stone-800: #4A4642;
--stone-900: #1A1A19; --stone-950: #0F0F0E;

/* Accent - خيط النول - Terracotta */
--terracotta-50: #FDF0EA; --terracotta-100: #F9DCCB; --terracotta-500: #C85A32;
--terracotta-600: #B14E2B; --terracotta-700: #8F3F23;

/* Semantic - Success/Warning/Danger - مصممة لتباين AA على الأبيض */
--success-500: #1B7A4D; --success-50: #E6F4EC;
--warning-500: #8A6D00; --warning-50: #FEF6D8;
--danger-500:  #C6362B; --danger-50:  #FDECEA;
```

> ⚠️ **قيد الدمج:** هذه الهكسات هي **لوحة الاتجاه A المرجعية**. قيم الإنتاج تبقى لوحة الهوية المجمدة (`--u-*` في `foundations.css`). الجسر الدلالي الكامل في `BIBLE-INTEGRATION.md §3`.

#### B. Semantic Tokens — CSS Variables (البنية الدلالية — تُطبَّق بأسماء القيم المجمدة)

```css
:root {
  /* Light Mode - الافتراضي */
  --bg: #FCFCF9; /* خلفية الصفحة - ورق دافئ */
  --surface: #FFFFFF; /* بطاقة/لوحة - أبيض نقي */
  --surface-2: #F6F5F2; /* ثانوي - hover للصفوف */
  --surface-3: #EFEDE9; /* ثالث - Skeleton/Input Fill */
  --surface-elevated: #FFFFFF; /* Popover/Dialog */

  --border: #E8E6E1;
  --border-strong: #D6D3CD;
  --border-focus: #1A1A19;

  --text-primary: #1A1A19; /* تباين 15.8:1 على الأبيض - AAA */
  --text-secondary: #6E6E78; /* تباين ~5:1 على الأبيض - AA */
  --text-tertiary: #9B9BA3; /* caption فقط ≥500 أو أيقونات — لا نص عادي */
  --text-inverse: #FFFFFF;

  --primary: #1A1A19; /* زر أساسي */
  --primary-hover: #2A2A28;
  --primary-fg: #FFFFFF;

  --accent: #C85A32; /* للـ CTA الثانوي والروابط الهامة فقط */
  --accent-hover: #B14E2B;
  --accent-fg: #FFFFFF;
  --accent-subtle: #FDF0EA; /* خلفية خفيفة للـ badge */

  --success: #1B7A4D; --success-bg: #E6F4EC;
  --warning: #8A6D00; --warning-bg: #FEF6D8;
  --danger: #C6362B; --danger-bg: #FDECEA;

  --ring: #1A1A19; /* حلقة التركيز */
  --shadow-color: 30 15% 15%; /* hsl للظلال */
  --overlay: rgba(26,26,25,0.48); /* backdrop */
}

.dark {
  --bg: #0F0F0E;
  --surface: #1A1A19;
  --surface-2: #222221;
  --surface-3: #2A2928;
  --surface-elevated: #222221;

  --border: #2E2D2B;
  --border-strong: #3A3937;
  --border-focus: #E8E6E1;

  --text-primary: #F2F0EB; /* 14.2:1 على #1A1A19 */
  --text-secondary: #A8A6A0; /* 6.1:1 */
  --text-tertiary: #76746F;
  --text-inverse: #1A1A19;

  --primary: #F2F0EB;
  --primary-hover: #FFFFFF;
  --primary-fg: #0F0F0E;

  --accent: #E07A4F;
  --accent-hover: #F09068;
  --accent-fg: #0F0F0E;
  --accent-subtle: #2E1F1A;

  --ring: #F2F0EB;
  --shadow-color: 0 0% 0%;
  --overlay: rgba(0,0,0,0.64);
}
```

> ⚠️ **قيد الدمج:** البنية الدلالية أعلاه (bg / surface / surface-2 hover / surface-3 skeleton / border / border-strong / text 3 مستويات / accent-subtle) هي المعتمدة. التنفيذ عبر **خريطة الجسر** إلى `--u-bg / --u-surface / --u-hover-veil / --u-surface-subtle / --u-line / --u-line-strong / --u-ink / --u-ink-soft / --u-muted / --u-faint` — لا تُنشئ نظام أسماء ثانيًا في الإنتاج.

#### C. إعداد Tailwind CSS 4 — `@theme` (النمط المرجعي للمشاريع الخضراء)

```css
@import "tailwindcss";

@theme {
  /* Colors - تربط مباشرة بالـ CSS variables */
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-surface-elevated: var(--surface-elevated);

  --color-border: var(--border);
  --color-border-strong: var(--border-strong);

  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);

  --color-primary: var(--primary);
  --color-primary-fg: var(--primary-fg);
  --color-accent: var(--accent);
  --color-accent-fg: var(--accent-fg);

  /* Fonts */
  --font-arabic: "IBM Plex Sans Arabic", system-ui, sans-serif;
  --font-display-ar: "Alexandria", var(--font-arabic);
  --font-latin: "Inter", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Radius */
  --radius-xs: 6px; --radius-sm: 10px; --radius-md: 14px;
  --radius-lg: 20px; --radius-xl: 28px;

  /* Shadows */
  --shadow-sm: 0 1px 2px hsl(var(--shadow-color) / 0.06), 0 1px 3px hsl(var(--shadow-color) / 0.08);
  --shadow-md: 0 4px 12px hsl(var(--shadow-color) / 0.08), 0 1px 3px hsl(var(--shadow-color) / 0.06);
  --shadow-lg: 0 12px 32px hsl(var(--shadow-color) / 0.12), 0 4px 12px hsl(var(--shadow-color) / 0.08);

  /* Breakpoints */
  --breakpoint-xs: 390px; --breakpoint-sm: 640px;
  --breakpoint-md: 768px; --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px; --breakpoint-2xl: 1440px;
}
```

> ⚠️ **قيد الدمج (ممنوع):** لا يستبدل `globals.css`/`foundations.css` بهذا الملف — طبقة `@theme` الحية في المستودع تخدم قالب التسويق ومرتبطة ببوابات CI (token-lint + stylelint ratchet). هذا القسم مرجع بنيوي فقط.

### 2.2 نظام الطباعة العربية

#### A. مقارنة الخطوط والاختيار

| الخط | التصنيف | نقاط القوة | نقاط الضعف | الاستخدام |
| :--- | :--- | :--- | :--- | :--- |
| **IBM Plex Sans Arabic** | هندسي محايد | وضوح ممتاز على الشاشات الصغيرة، أرقام لاتينية متناسقة، وزن 400–700 متوازن | شخصية هادئة جدًا، ليس مميزًا للعناوين الكبيرة | أساسي مقترح للنصوص والواجهة |
| **Alexandria** | هندسي حاد | شخصية عربية قوية، ممتاز للـ Display/Brand، تباين عالي | ضيق بعض الشيء للنص الطويل | للعناوين الكبيرة Display/H1 فقط |
| **Tajawal** | هندسي ودي | ودود، عصري | ارتفاع x كبير يسبب ازدحامًا في الجداول، لا يملك Mono متناسق | احتياطي |
| **Inter** | لاتيني | أفضل خط لاتيني للواجهات، أرقام جدولية ممتازة | — | كل النص اللاتيني والأرقام |
| **IBM Plex Mono** | أحادي | متناسق مع Plex Sans | — | الكود والأرقام والتوكنز |

> ⚠️ **قيد الدمج (قرار D-7):** المستودع مجمد على **Tajawal (متن) + Alexandria (عرض) + Inter (لاتيني) + IBM Plex Mono (كود)** — نفس اختيار الدليل للعرض واللاتيني والمونو، ومختلف في المتن فقط. الحفاظ على Tajawal هو الافتراضي المعتمد (استمرارية الهوية + أساسات W-6 مقيسة عليه)؛ التبديل إلى Plex Sans Arabic قرار مالك مؤجل.

#### B. جدول Type Scale الكامل

| Token | Size (rem/px) | Line-Height عربي | Line-Height لاتيني | Weight | Tracking عربي | Tracking لاتيني | الاستخدام |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | 2.5rem / 40px | 1.15 | 1.1 | 700 (Alexandria) | 0 | -0.02em | عناوين تسويقية / صفحة «لك» |
| `h1` | 1.875rem / 30px | 1.25 | 1.2 | 700 (Alexandria) | 0 | -0.015em | عنوان الصفحة الوحيد |
| `h2` | 1.5rem / 24px | 1.30 | 1.25 | 600 | 0 | -0.01em | عنوان قسم |
| `h3` | 1.25rem / 20px | 1.40 | 1.3 | 600 | 0 | -0.01em | عنوان بطاقة/جدول |
| `h4` | 1.125rem / 18px | 1.40 | 1.35 | 600 | 0 | 0 | عنوان جانبي |
| `body-lg` | 1.0625rem / 17px | 1.75 | 1.6 | 400 | 0 | 0 | نص مقروء طويل (وثائق) |
| `body` | 1rem / 16px | 1.75 | 1.6 | 400 | 0 | 0 | الافتراضي لكل النصوص |
| `body-sm` | 0.875rem / 14px | 1.70 | 1.5 | 400 | 0 | 0 | نص ثانوي، وصف بطاقة |
| `label` | 0.875rem / 14px | 1.40 | 1.4 | 500 | 0 | 0 | تسمية حقل/زر متوسط |
| `caption` | 0.75rem / 12px | 1.40 | 1.4 | 500 | 0 | 0.02em | مساعد، طابع زمني |
| `micro` | 0.6875rem / 11px | 1.30 | 1.3 | 500 | 0 | 0.04em | Badge / فوق عنوان |
| `mono` | 0.875rem / 14px | 1.60 | 1.6 | 400 (Mono) | 0 | 0 | كود، أرقام |

> **قيد الدمج:** سلّم المستودع الحي هو `--mj-text-*` (11 مستوى، موحد في W-6 عبر 19 مسارًا). مطابقة السلّمين تُجرى في W9-1 دون كسر أساسات harmony-probe.

**قواعد العربية الصارمة:**
1. `letter-spacing` للعربية = `0` دائمًا. أي قيمة غير صفر تشوه اتصال الحروف.
2. `line-height` عربي = لاتيني + `0.15`. لا تستخدم نفس القيمة. (المستودع الحي: 1.7 عربي-first — ضمن النطاق)
3. **الأرقام:** لاتينية `0-9` دائمًا مع `font-variant-numeric: tabular-nums lining-nums`. الأرقام الهندية `٠١٢` ممنوعة في الواجهة؛ تُستخدم فقط في المحتوى التحريري المقصود.
4. **نص لاتيني داخل عربي:** يُغلف بـ `<span dir="ltr">` مع `display: inline-block` و `unicode-bidi: isolate` لمنع كسر السطر (المستودع: `.ltr-value` + `.mono` موجودان).
5. الفقرة العربية `max-width: 65ch` لمنع تمدد السطر.
6. العناوين العربية `text-wrap: balance`، النصوص `text-wrap: pretty`.

### 2.3 Spacing / Radius / Shadows / Motion

#### A. Spacing Scale — قاعدة 4px

| Token | Value | الاستخدام الحصري |
| :--- | :--- | :--- |
| `0` | 0 | — |
| `1` | 4px | فجوة داخل `badge` أو بين أيقونة ونص |
| `2` | 8px | `gap` داخل مجموعة أزرار صغيرة، `padding` داخلي للـ chip |
| `3` | 12px | `gap` بين حقل وتسميته، بين أيقونة وعنوان بطاقة |
| `4` | 16px | الأساسي — `padding` البطاقة، `gap` عمودي بين عناصر القائمة |
| `5` | 20px | `padding` بطاقة كبيرة |
| `6` | 24px | `gap` بين الأقسام، `padding` الصفحة على الهاتف |
| `8` | 32px | `gap` بين بطاقات الشبكة، `padding` قسم |
| `10` | 40px | فاصل بين الترويسة والمحتوى |
| `12` | 48px | `padding` صفحة على الديسكتوب |
| `16` | 64px | فاصل بين أقسام الصفحة الكبيرة |
| `20` | 80px | `padding` علوي/سفلي لصفحة فارغة |

القاعدة: لا `margin` عمودي عشوائي. استخدم `gap` في `flex/grid` فقط.

#### B. Radius Scale

| Token | Value | الاستخدام |
| :--- | :--- | :--- |
| `xs` | 6px | `badge`, `chip`, `kbd` |
| `sm` | 10px | `input`, `select`, زر `sm`, `skeleton` |
| `md` | 14px | زر `md/lg`, بطاقة صغيرة, `dropdown` |
| `lg` | 20px | بطاقة متوسطة/كبيرة, `dialog`, `sheet` |
| `xl` | 28px | بطاقة `hero` / لوحة كبيرة |
| `full` | 999px | `avatar`, `switch` thumb |

**القاعدة:** `radius` الداخلي = الخارجي − `padding`. بطاقة `lg (20px)` تحتوي زر `md (14px)`.

> **قيد الدمج:** سلّم المستودع الحي `--u-radius-control 8 / field 12 / card 16 / overlay 22 / pill 999`. الخريان يتعايشان بهوية موثقة في وثيقة الدمج (لا إعادة كتابة شاملة).

#### C. Elevation / Shadows — 5 مستويات بقيم دقيقة

```css
/* Light */
--shadow-1: 0 1px 2px hsl(30 10% 20% / 0.04); /* للبطاقة الثابتة - خفيف جدًا */
--shadow-2: 0 2px 8px hsl(30 10% 20% / 0.06), 0 1px 2px hsl(30 10% 20% / 0.05); /* hover للبطاقة */
--shadow-3: 0 8px 24px hsl(30 10% 20% / 0.08), 0 2px 8px hsl(30 10% 20% / 0.06); /* dropdown/popover */
--shadow-4: 0 16px 48px hsl(30 10% 20% / 0.12), 0 4px 16px hsl(30 10% 20% / 0.08); /* dialog/sheet */
--shadow-5: 0 24px 64px hsl(30 10% 20% / 0.16); /* command palette */
/* Dark - ظلال أغمق + حد داخلي 1px */
.dark --shadow-1: 0 0 0 1px hsl(0 0% 100% / 0.06);
```

**القاعدة:** البطاقات افتراضيًا `shadow-1` أو `border` فقط. `shadow-2` عند `hover` فقط. **لا ظلال متعددة في الشاشة (≤2).**

> **قيد الدمج:** سلّم المستودع الحي `--u-shadow-xs/sm/md/lg/xl + none` (طبقي ومصبوغ بنفسجيًا في الداكن). المعتمد من الدليل هنا: **قاعدة الانضباط** (ظلان كحد أقصى لكل شاشة، الافتراضي حد هادئ) — تُفرض في مراجعات الجودة، لا بتبديل السلّم.

#### D. الحركة Motion — Durations & Easings

| التوكن | المدة | Cubic-Bezier | الاستخدام الحصري |
| :--- | :--- | :--- | :--- |
| `instant` | 100ms | `ease-out (0,0,0.2,1)` | تغير لون `hover` للزر، ظهور `tooltip` |
| `fast` | 180ms | `ease-out-expo (0.16,1,0.3,1)` | فتح `dropdown/popover/select`، حركة `underline` للتبويب |
| `base` | 250ms | `ease-in-out (0.4,0,0.2,1)` | فتح `dialog/sheet/drawer`، انزلاق `toast`، انتقال `stages` |
| `slow` | 350ms | `ease-out-expo (0.16,1,0.3,1)` | انتقال صفحة، تمدد الشريط الجانبي، `skeleton → content` |
| `enter` | 500ms | `spring(0.32,0.72)` | ظهور بطاقة `hero` — مرة واحدة في الصفحة |

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1); /* الافتراضي لكل شيء */
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.32, 0.72, 0, 1);
--duration-instant: 100ms; --duration-fast: 180ms; --duration-base: 250ms; --duration-slow: 350ms;
```

**قاعدة:** لا `duration` أكبر من `350ms` إلا لانتقال الصفحة. لا `ease: linear` أبدًا إلا لشريط التقدم.

> **قيد الدمج:** عقد الحركة الحي في المستودع `--u-motion-*` (80/130/200/300/480ms + route 240ms) مملوك لـ motion.css بمالك واحد (INT-02). التوحيد بين العقدين بند في W9-3 بقرار مالك واحد، لا مزج.

---

## 3. نظام القشرة والتخطيط App Shell

### 3.1 الهيكل: Rail + Expanded + Drawer

| المقاس | النمط | السلوك | العرض |
| :--- | :--- | :--- | :--- |
| `0–767px` الهاتف | **Drawer** | مخفي افتراضيًا، يظهر كـ Sheet فوق المحتوى + سحب للإغلاق من الحافة | `280px` عرض الدرج |
| `768–1023px` التابلت | **Rail موسّع** | ثابت قابل للطي؛ الافتراضي موسّع لأن التابلت أفقي | `Expanded: 280px / Rail: 72px` |
| `1024px+` الحاسب | **Rail قابل للطي** | الافتراضي Rail أيقونات فقط مع tooltip؛ يتوسع بضغط زر | `Rail: 72px / Expanded: 280px` |

**لماذا Rail افتراضي على الحاسب؟** الخدمات تحتاج أقصى عرض للمحتوى (artifacts/composer). شريط `280px` دائم يسرق `20%` من `1440px`.

> **قيد الدمج (انحراف مقصود موثق):** القشرة الحية مبنية ومقيسة (rail 76 / expanded 264 / topbar 66، درج T1–T4، تابلت push بقرار D-2، قماش تركيز، dock) ومحروسة بمسبار G-6 في CI ‏(11/11). فروق القياسات (72/280/56) لا تبرر كسر الأساسات — تبقى قيم الدليل مرجعًا تصميميًا لأي إعادة بناء مستقبلية، والحاكم الآن: القيم الحية + مبادئ الدليل.

### 3.2 القياسات الدقيقة

```
--header-height: 56px; (الحاكم الحي: 66px — انحراف موثق)
--sidebar-rail: 72px;  (الحاكم الحي: 76px)
--sidebar-expanded: 280px; (الحاكم الحي: 264px)
--sidebar-icon: 20px; --sidebar-icon-box: 44px;
--content-max-width: 1280px; --content-narrow: 720px; --content-wide: 1440px;
--page-padding-x-mobile: 16px; --page-padding-x-tablet: 24px; --page-padding-x-desktop: 32px;
--page-gutter: 16px;
```

**أقصى عرض محتوى لكل نوع صفحة:**

| نوع الصفحة | `max-width` | ملاحظة |
| :--- | :--- | :--- |
| مساحة عمل الخدمة | `720px` للنص + `420–480px` للـ artifacts الجانبي | عمودان على `lg+` |
| شبكات (أنشئ/استكشف/المشاريع) | `1280px` | شبكة 3 أعمدة |
| جداول (التشغيلات/الفوترة) | `1440px` | `overflow-x-auto` |
| الإعدادات | `1024px` | عمود واحد + تبويبات علوية |
| صفحة «لك» | `1280px` | شبكة bento |

> **قيد الدمج:** سلّم الحاويات الحي (GRD-01): `narrow 560 / prose 780 / wide 1040 / full 1440` — أضيق من الدليل لأن `full 1440` مقيس على المحتوى الفعلي. التوحيد بند W9-3.

### 3.3 تفصيل الشريط الجانبي

**الهيكل العمودي — 4 مجموعات + فاصل:**

```
[Logo + Wordmark عند التوسيع]
--- spacer 8px ---
[مجموعة 1: الخدمات] — أيقونة 20px + نص 14px/500
--- divider 1px + spacer 12px ---
[مجموعة 2: أدوات متقدمة]
--- divider + spacer ---
[مجموعة 3: التشغيل]
--- divider + spacer ---
[مجموعة 4: مساحتي]
[Spacer flex-1]
[User Card 44px + حالة الخطة]
[Collapse Button 44px]
```

**حالة Rail:** الأيقونة في منتصف `44px` مربع · النص مخفي `opacity:0 + visibility:hidden` · `tooltip` عند hover · العنصر النشط: `background: surface-2` + `radius 10px` + شريط عمودي `3px` على الحافة الداخلية.

**Header العلوي:** `[Menu button 44px — يظهر فقط <768px] [Search bar 480px max] [Cmd+K hint] [Spacer] [Notifications 44px] [Avatar 32px]` — Search: ارتفاع `36px`، `bg surface-2`، عند focus يصبح `bg surface + border-focus + shadow-2`.

### 3.4 لوحة الأوامر Cmd+K

`cmdk` مع Radix Dialog — `max-width 640px`، `max-height 480px`، `shadow-5`، `radius 20px` · `overlay: var(--overlay) + blur 4px` · `input` ارتفاع `48px` · النتائج `44px` للصف · اختصار `⌘K / Ctrl+K` مع `kbd` في الهيدر.

### 3.5 قواعد RTL الصارمة

1. **التخطيط:** كل `flex` يستخدم `gap` لا `margin-left`. لا `left/right` في الكود، فقط `inline-start/end` و `block-start/end` (خصائص منطقية إجبارية).
2. **التمرير:** `scrollbar` على الجهة البداية في RTL تلقائيًا — لا تعكسه. الدرج ينزلق من جهة البداية `transform: translateX(100%) → 0`.
3. **الاتجاه:** `dir="rtl"` على `<html>`، كل `Dialog/Sheet` يرث.
4. **الأيقونات:** انظر §8.3 للانعكاس.
5. **الظلال:** لا تعكس الظلال — الضوء يأتي من الأعلى دائمًا.

---

## 4. مواصفات المكونات — بقياسات px/rem

### 4.1 الأزرار Buttons — 4 أنواع × 3 أحجام × 7 حالات

| Variant | خلفية | نص | حد | hover | active |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `primary` | `var(--primary)` | `var(--primary-fg)` | لا يوجد | `var(--primary-hover)` + `translateY(-1px) shadow-1` | `scale(0.98)` |
| `secondary` | `var(--surface)` | `var(--text-primary)` | `1px solid var(--border)` | `bg: var(--surface-2)` | `bg: var(--surface-3)` |
| `ghost` | `transparent` | `var(--text-secondary)` | لا يوجد | `bg: var(--surface-2) text: var(--text-primary)` | `bg: var(--surface-3)` |
| `destructive` | `var(--danger)` | `white` | لا يوجد | `bg: hover أدكن` | `scale(0.98)` |

**الأحجام:**

| Size | Height | Padding-X | Font | Radius | Icon |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `sm` | `32px` | `12px` | `13px/500` | `10px` | `14px` + `gap 6px` |
| `md` | `40px` | `16px` | `14px/500` | `14px` | `16px` + `gap 8px` |
| `lg` | `44px` | `20px` | `14px/500` | `14px` | `18px` + `gap 8px` |

**الحالات السبع:** `default` كما أعلاه · `hover`: `transition 100ms ease-out` + `shadow-1` للـ primary فقط · `focus-visible`: `outline: 2px solid var(--ring)` + `outline-offset: 2px` (لا box-shadow) · `active`: `scale(0.98)` بمدة 50ms · `disabled`: `opacity 0.45 + pointer-events none` · `loading`: يخفي النص `opacity 0` ويضع `spinner 16px` في المركز `absolute inset-0 grid place-items-center` · `error`: `border-color danger + text danger`.

**زر مع أيقونة:** الأيقونة `flex-shrink: 0` + `gap` حسب الحجم. زر أيقونة فقط: `width = height` + `padding: 0` + `grid place-items-center` (أرضية 44px للمس).

### 4.2 حقول الإدخال Inputs

**الهيكل:** `label 12px/500 text-secondary` + `gap 6px` + `field 40px` + `helper 12px text-tertiary` / `error 12px text-danger`

| حالة | حد | خلفية | ظل |
| :--- | :--- | :--- | :--- |
| `default` | `1px solid var(--border)` | `var(--surface)` | لا يوجد |
| `hover` | `1px solid var(--border-strong)` | `var(--surface)` | لا يوجد |
| `focus` | `1px solid var(--border-focus)` | `var(--surface)` | `0 0 0 3px hsl(var(--ring)/0.08)` |
| `error` | `1px solid var(--danger)` | `var(--danger-bg)` | `0 0 0 3px danger/0.10` |
| `disabled` | `1px solid var(--border)` | `var(--surface-3)` | `opacity 0.6` |

القياس: `height 40px` افتراضيًا، `44px` داخل الـ Composer · `padding-inline 12px` · `font 14px/400` · `radius 10px` · placeholder بلون tertiary.

### 4.3 Select / Dropdown

`Trigger` بمقاس Input + سهم chevron `16px` يدور `180deg` عند الفتح (`180ms`) · `Content`: `bg surface-elevated` + `border` + `radius 14px` + `shadow-3` + `padding 6px` + `min-width: var(--radix-trigger-width)` · `Item`: `height 36px` + `padding-inline 10px` + `radius 8px` + `hover/focus: surface-2` + `selected: surface-3 + check icon`.

### 4.4 التبويبات Scrollable Tabs — الحل الجذري لمشكلة القطع

```css
.tabs-root {
  position: relative;
  /* قناع تلاشي عند الطرفين - يظهر فقط عند وجود محتوى مخفي */
  --mask-start: 0%; --mask-end: 0%;
  mask-image: linear-gradient(to left, transparent 0,
    black var(--mask-start), black calc(100% - var(--mask-end)),
    transparent 100%);
}
.tabs-list {
  display: flex; gap: 4px;
  overflow-x: auto; scrollbar-width: none;
  scroll-snap-type: x mandatory;
  scroll-padding-inline: 16px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
}
.tabs-trigger {
  flex: 0 0 auto; scroll-snap-align: start;
  height: 36px; padding-inline: 14px;
  font: 14px/500; color: var(--text-secondary);
  border-radius: 10px; white-space: nowrap;
  transition: color 150ms, background 150ms;
}
.tabs-trigger[data-state="active"] { color: var(--text-primary); background: var(--surface-2); }
```

**المؤشر المتحرك Underline:** لا `border-bottom` ثابت — عنصر `absolute bottom-0 height 2px bg text-primary radius 999px` ينتقل بـ framer-motion `layoutId` بـ `spring 300ms`، العرض = عرض النص متمركزًا.

**أزرار التمرير:** زرّان `32x32` دائريان بـ `bg surface-elevated + border + shadow-2` يظهران فقط عند الحاجة عبر `IntersectionObserver` يراقب أول وآخر تبويب. على الهاتف يتراكبان فوق القناع.

> 🔴 **Errata E-1 (إلزامي قبل أي تنفيذ):** كود النموذج المرجعي الأصلي يحسب الاتجاه بـ `el.scrollLeft > 2` — **خاطئ في RTL على Chrome/Firefox الحديثة** حيث يبدأ `scrollLeft` من 0 عند البداية ويصبح **سالبًا** عند التمرير نحو النهاية، فلا يظهر زر البداية أبدًا، واتجاه `scrollBy({left: +160})` منقولب. **التنفيذ الصحيح المعتمد:**
> ```js
> const start = el.scrollLeft;                    // RTL: 0 عند البداية
> const abs = Math.abs(el.scrollLeft);
> const max = el.scrollWidth - el.clientWidth;
> const atStart = start >= -2;                    // scrollLeft≈0 (أو ≥0)
> const atEnd   = abs >= max - 2;                 // |scrollLeft| بلغ العرض المخفي
> // التمرير نحو البداية (RTL: scrollLeft موجب) ونحو النهاية (سالب):
> prevBtn.onclick = () => el.scrollBy({ left:  atStart ? 0 :  Math.min(160, start + 160), behavior:'smooth' });
> nextBtn.onclick = () => el.scrollBy({ left: -Math.min(160, max - abs), behavior:'smooth' });
> ```
> مع اختبار إلزامي عند 390/768/1440: كل الخيارات السبعة تصل scrollIntoView.

**السلوك على 3 مقاسات:** `390px`: تبويبان ظاهران + قناع `24px` + زر تمرير · `768px`: 4 تبويبات + قناع `16px` بالطرفين · `1440px`: كل التبويبات ظاهرة — لا قناع ولا أزرار.

### 4.5 البطاقات Cards — النظام الموحد

**رياضيات الشبكة:**

```css
.card-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 768px)  { .card-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }

.card {
  display: flex; flex-direction: column;
  min-height: 320px;               /* موحد داخل الشبكة الواحدة */
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 150ms, box-shadow 150ms, transform 150ms;
}
.card:hover { border-color: var(--border-strong); box-shadow: var(--shadow-2); transform: translateY(-2px); }
```

**المحاذاة الداخلية الموحدة — 3 مناطق:**

```
[Media 160px — نسبة 16/10 — object-cover | أيقونة 32px متمركزة إن لا صورة]
[Body flex-1 padding 20px gap 8px]
  - Eyebrow 11px/500 tertiary
  - Title 18px/600 — min-height سطرين — line-clamp-2 — text-wrap balance
  - Description 14px secondary — line-clamp-3 — min-height 3 أسطر
[Footer 56px — border-top — padding 12px 20px — flex justify-between — margin-top: auto]
```

**لماذا `min-height` وليس `height`؟** النص العربي يختلف طوله؛ `min-height` + `grid` يضمنان تساوي الصف، و`flex:1 + margin-top:auto` يثبت الـ footer أسفلًا دائمًا.

**حالات البطاقة:** `loading: skeleton` بنفس min-height · `empty: illustration + text` · `error: border-danger + retry`.

> **قيد الدمج:** بطاقات «أنشئ» الحية (W8-2: 324×158 موحدة، بلا media) باقية — نجحت مقيسة. تشريح الـ media-card أعلاه هو المعيار للبطاقات ذات الوسائط (مكتبتي/المشاريع/المعارض).

### 4.6 القوائم والجداول

* **جدول:** `header 40px bg surface-2 font 12px/500 tertiary` + `row 48px min-height hover surface-2` + `divider 1px border` + `cell padding-inline 16px` + `radius 14px` للجدول كاملاً + `shadow-1`. على الهاتف يتحول لبطاقات تلقائيًا.
* **قائمة بيانات:** `item 56px flex gap 12px padding-inline 16px hover surface-2 radius 10px`.

### 4.7 Dialog / Sheet / Toast / Badge / Skeleton / Empty

* **Dialog:** `max-width 560px` + `radius 20px` + `padding 24px` + `shadow-4` + `overlay blur 8` + `close 32x32` + دخول `scale 0.96→1 + opacity` بـ `250ms ease-out-expo`.
* **Sheet:** `width 480px` ديسكتوب / `100%` هاتف `max-width 420px` — ينزلق من inline-end.
* **Toast:** أسفل `24px` + `max-width 420px` + `radius 14px` + `icon 18px + title 14px/500 + desc 13px` + `duration 4000ms` + swipe للإخفاء.
* **Badge/Chip:** `height 24px (sm) / 28px (md)` + `padding-inline 8px` + `radius full أو 6px` + `12px/500` + variants: neutral/accent/success/warning/danger بنمط `خلفية فاتحة + نص داكن + حد`.
* **Skeleton:** `bg surface-3` + `radius inherit` + `shimmer 1.5s` — بنفس height المحتوى (صفر layout shift).
* **Empty State:** `illustration 120px` خطي `1.5px stroke` + `title h3` + `desc ≤32ch` + `action primary md` + `padding 48px 24px`.

### 4.8 Command Palette

Dialog بـ `padding 0` + `input 48px border-bottom` + `list max-height 320px` + `item 44px` + `footer 40px` يعرض اختصارات بـ `kbd 20px mono 11px radius 6px`.

---

## 5. نمط مساحة عمل الخدمة الموحد Service Workspace

**قلب المنصة: كل الخدمات السبع تطبقه حرفيًا.**

### 5.1 المبدأ: Composer + Stages + Stream + Artifacts + Status

```
┌─────────────────────────────────────────────┐
│ Header: eyebrow الخدمة + h1 + وصف سطر      │
├─────────────────────────────────────────────┤
│ Composer: حقل الإدخال الرئيسي (sticky)      │
├─────────────────────────────────────────────┤
│ Stages: شريط المراحل الأفقي (حتى 5)         │
├─────────────────────────────────────────────┤
│ Content: سجل النشاط Stream + Artifacts      │
│ (عمود واحد هاتف، عمودان حاسب)               │
└─────────────────────────────────────────────┘
[Status Bar: حالة التشغيل + تكلفة + وقت]
```

### 5.2 تفصيل كل جزء

1. **الترويسة:** `eyebrow 11px` + `h1` + `description 14px secondary` — هاتف `padding 16px` / حاسب `24px 0`.
2. **المؤلف Composer (sticky):** `min-height 88px → 160px` عند الكتابة · `bg surface + border + radius 20 + shadow-1` → عند التركيز `shadow-2 + border-focus` · داخلي `textarea auto-resize 15px/1.7 padding 16` + `toolbar 48px`: `[Attach 32] [Model select] [Spacer] [⌘+Enter hint] [Send دائري 36px primary]`.
3. **المراحل Stages:** `height 56px` + تمرير أفقي · كل مرحلة `pill 32px padding-inline 14 radius full icon 14 + label 13px/500` + خط ربط `24px × 1px` · الحالات: `pending: surface-2/tertiary` · `active: accent-subtle/accent + spinner` · `done: success-bg/success + check` · `error: danger-bg/danger`.
4. **سجل النشاط Stream:** `max-width 720px` + `gap 16px` · رسالة مستخدم: `bg surface-2 radius 20 (زراوية سفلية-جهة 6px) max-width 80% align-self end` · رسالة نظام: `transparent + border` · رسالة أداة: `surface-3 + mono 13px` · Markdown بـ line-height 1.75 + كتلة كود `header 40px [lang][copy 28x28] + pre 13px/1.6`.
5. **المخرجات Artifacts:** على `lg+` عمود ثانٍ `width 420px sticky` + `border-inline-start` · على `<lg` تظهر كـ tabs داخل المحتوى · كل artifact بطاقة `min-height 200` + `toolbar 40px [Copy][Download][Expand]`.
6. **شريط الحالة Status Bar (sticky bottom):** `40px` + `bg bg/80 + blur` + `border-top` + `font 12px mono` + نقطة حالة نابضة + تكلفة + وقت.

### 5.3 التكيف لكل خدمة دون فقدان الهوية

| الخدمة | Composer | Stages | Artifacts |
| :--- | :--- | :--- | :--- |
| **اسأل** | نص حر + اقتراحات chips | لا مراحل — streaming مباشر | الرسالة هي المخرج |
| **تعلّم** | اختيار مسار + مستوى | تشخيص → خطة → دراسة → اختبار → شهادة | بطاقة تقدم + شهادة |
| **ابحث** | سؤال بحثي + عمق 3 مستويات | خطة → مصادر وادعاءات → تقرير | تقرير منسق + جدول مصادر [ادعاء|مصدر|ثقة] |
| **أنشئ** | وصف + اختيار preset | مسودة → صياغة → تنقيح → تصدير | معاينة مستند/سلايد/صورة |
| **برمج** | وصف ميزة + stack | خطة → كود → معاينة → اختبار | ملفات كود + preview |
| **حلّل** | رفع ملف dropzone 120px | فحص → تنظيف → تحليل → لوحة | جدول + رسوم |
| **استكشف** | مفهوم مركزي | خريطة → توسع → ربط | رسم معرفي canvas |

> **قيد الدمج:** هذا النمط متحقق بنيويًا في المستودع (`ServiceProductShell` + قالب service-space من W7-3/W7-4). موجات W-9 ترفع تفاصيله (عمود artifacts اللاصق 420px، شريط الحالة، حالات pills الأربع) على البنية القائمة.

---

## 6. مخططات الصفحات Blueprints — الـ 19 مسارًا

**قالب موحد لكل صفحة:** الهدف / الهيكل / التسلسل الهرمي / المكونات / الحالات / تفاصيل الجودة المدرَكة.

### 6.1 «لك» — الرئيسية التكيفية
**الهدف:** عودة سريعة للعمل + اقتراحات سياقية + آخر نشاط — ليست لوحة تحكم مزدحمة.
**هرمية:** `ابدأ بسرعة` → `تابع عملك (3 بطاقات)` → `اقتراحات` → `نشاط`.
**Desktop:** bento — `ابدأ بسرعة` بجانب `تابع عملك 3cards` ثم `اقتراحات chips` ثم `آخر النشاط` قائمة 56px للصف.
**Mobile:** عمود واحد؛ `ابدأ بسرعة` شبكة عمودين `gap 12`؛ بطاقات `min-height 160`.
**الحالات:** loading: skeleton bento / empty: illustration + زر ابدأ / error: retry.
**تفاصيل الجودة:** أيقونة `24px` داخل مربع `44px surface-2 radius 10` · لا أكثر من 3 ألوان بالصفحة والـ accent على زر اسأل فقط · الطابع الزمني mono 12px · فراغ `32px` بين الأقسام · hover بطاقة `translateY -2px` فقط.

### 6.2 «اسأل» — دردشة AI
**الهدف:** محادثة متدفقة سريعة. المرجع ChatGPT لكن RTL.
**هرمية:** Composer هو A1، الرسائل A2، الأدوات A3.
**Desktop:** `stream 720px center + composer sticky bottom` — لا artifacts جانبي. **Mobile:** نفس الشيء + safe-area.
**تفاصيل الجودة:** فقاعة المستخدم `radius 20 (سفلية-جهة 6px) max-width 80%` · مؤشر التدفق `▍` وميض 600ms · كتلة كود بـ header [lang][copy] · auto-scroll يتوقف إذا صعد المستخدم >100px ويظهر زر ↓ للأسفل · empty: 3 prompts مقترحة قابلة للنقر.

### 6.3 «تعلّم»
**هرمية:** مسارك الحالي (progress) → الوحدة → اختبار.
**التكوين:** workspace + stages `تشخيص→خطة→دراسة→اختبار→شهادة` + artifacts بطاقة تقدم.
**تفاصيل:** شريط تقدم `6px radius full fill accent` + badge وقت القراءة mono 12px.

### 6.4 «ابحث» — بحث عميق
**Stages:** `خطة → مصادر وادعاءات → تقرير`.
**Artifacts:** `تقرير.md + جدول مصادر [ادعاء | مصدر | ثقة]`.
**تفاصيل:** كل مصدر `chip ثقة high/medium/low` بألوان success/warning/tertiary + مرجع رقمي `[1]` قابل للنقر يفتح popover.

### 6.5 «أنشئ» — البطاقات الثلاث متطابقة
**الحل الرياضي:** `.create-grid` (1/2/3 أعمدة عند 390/768/1024) + `.create-card` بـ `min-height 380px` (كما §4.5 مع media 160px) + `title line-clamp-2 min-height سطرين` + `desc line-clamp-3` + `footer 56px margin-top:auto`.
**Desktop:** 3 بطاقات صف واحد متطابقة بالمسطرة. **Mobile:** مكدسة بنفس القياس.
**تفاصيل:** media تعرض أيقونة 32px إن لا صورة · eyebrow `مستندات • 12 قالب` · hover يكبر media `scale 1.02` · زر `أنشئ الآن sm primary` ثابت بالـ footer · versions كـ badge.
> **قيد الدمج:** الإنتاج الحي حلّ الاتساق ببطاقات مدمجة 324×158 (W8-2) — تُقاس ضد تشريح الدليل في W9-5 ويُقرر الترقية للـ media-card كاملة أو الإبقاء، بلقطات VLM مقارنة.

### 6.6 «برمج»
**Stages:** `خطة → مشروع كود` · **Artifacts:** ملفات كود + preview iframe 16/9.
**تفاصيل:** شجرة ملفات `220px` بجانب الـ artifact على lg+، tabs على الهاتف.

### 6.7 «حلّل»
**Composer:** `dropzone 120px border-dashed 1.5px radius 20 bg surface-2`.
**Stages:** `فحص → تنظيف → تحليل → لوحة` · **Artifacts:** جدول + chart 240px.

### 6.8 «استكشف» — الرسم المعرفي
**Composer:** مفهوم مركزي `input 44px center 18px`.
**Artifacts:** `canvas 480px bg surface-2 radius 20` بعقد `44px circle`.
**تفاصيل:** العقدة النشطة `border 2px accent + shadow-2 + scale 1.05`.

### الأدوات المتقدمة (5)

* **6.9 المشاريع:** شبكة `card-grid 3 أعمدة` + filter chips + sort select — بطاقة §4.5 بـ `min-height 280`.
* **6.10 الوكلاء:** جدول `avatar 32 + name 14/500 + role 12 secondary + status dot 8` + زر إنشاء وكيل **واحد** primary بالصفحة.
* **6.11 التدفقات:** canvas أفقي `node 160×80 radius 14` + خط `1.5px` + `toolbar 48`.
* **6.12 مصادر المعرفة:** قائمة `56px` لكل مصدر `[icon 20][name][badge نوع][progress][menu]` + upload dropzone.
* **6.13 النماذج:** جدول مقارنة — كل نموذج بطاقة `220px` + badge «الموصى به».

### التشغيل (4)

* **6.14 التشغيلات:** جدول `row 48` + status pill + `duration mono 12` + فلتر زمني tabs — يتحول لبطاقات على الهاتف.
* **6.15 الاستخدام والتكلفة:** `chart 240 + 4 stats cards 120` + progress `8px`.
* **6.16 الفوترة:** `current plan card 200 + جدول فواتير` + زر ترقية primary واحد.
* **6.17 الفريق والأدوار:** جدول `avatar + email mono 13 + role select + invite` + empty: «دعوة أول عضو».

### مساحتي (2)

* **6.18 مكتبتي:** تبويبان `الكل/المفضلة` + شبكة masonry خفيف `gap 16` + filter by type chips.
* **6.19 الإعدادات — التبويبات السبعة بلا قطع:** تطبيق §4.4 كاملًا (ScrollableTabs + قناع + أزرار + underline متحرك) على `الملف الشخصي | التفضيلات | مساحة العمل | مفاتيح المزودين BYOK | التكاملات | البيانات والخصوصية | سجل التدقيق` — الهيكل: `H1 + وصف` ثم `Tabs 44px` ثم `Content max-width 720` بقوائم card 20 · زر حفظ `sticky bottom` · danger zone أسفل الصفحة `border danger radius 14 bg danger-bg`.

---

## 7. الحركة والتفاعلات الدقيقة — جدول كامل

| التفاعل | المدة | Easing | ماذا يتحرك بالضبط |
| :--- | :--- | :--- | :--- |
| hover زر/بطاقة | 100ms | ease-out | bg/border + shadow-1→2 + `translateY -1/-2px` للبطاقة فقط |
| فتح dropdown/popover/select | 180ms | ease-out-expo | `opacity 0→1 + scale 0.97→1 + y 4→0` origin top |
| فتح dialog | 250ms | ease-out-expo | overlay opacity + content `scale 0.96→1` |
| فتح/إغلاق drawer/sheet | 350ms | ease-out-expo | `translateX 100%→0` + overlay opacity |
| ظهور toast | 350ms | spring | `y 16→0 + opacity + scale 0.98→1` |
| streaming نص | 0ms | — | char-by-char مع `cursor ▍ blink 600ms` — لا أنيميشن للحروف |
| انتقال صفحة | 250ms | ease-out-expo | `opacity + y 6→0` للمحتوى فقط — القشرة ثابتة |
| skeleton → content | 250ms | ease-out | تعاقب متداخل 50ms |
| سحب الدرج | تابع للإصبع | linear | translateX بنسبة السحب + overlay عكسيًا |
| tabs underline | 300ms | spring | `x + width` عبر layoutId |
| stages تقدم | 350ms | ease-out-expo | pill bg + icon scale 0.8→1 + line width 0→100% |
| card media zoom | 350ms | ease-out-expo | `scale 1→1.02` داخل overflow hidden |
| tooltip | 100ms | ease-out | opacity + y 2→0 + delay 400ms |

**قاعدة `prefers-reduced-motion`:** كل ما فوق 180ms يصبح ~0ms — انظر §8.4.

---

## 8. الوصولية Accessibility

### 8.1 التباين AA لكل تركيبة
| تركيبة | النسبة | الحكم |
| :--- | :--- | :--- |
| text-primary على bg | ~15:1 | AAA |
| text-secondary على bg | ~5:1 | AA |
| text-tertiary على bg | ~3.2:1 | **فشل للنص <18px** — يُستخدم فقط caption 12px/500 أو أيقونات |
| primary زر على white | ~15:1 | AAA |
| accent زر على white | ~4.6:1 | AA |
| danger على white | ~5.8:1 | AA |
| Dark: text-primary على surface | ~14:1 | AAA |

> **Errata E-2:** الدليل الأصلي برّر استخدام tertiary لنص 12px — **هذا يخالف AA (يتطلب 4.5:1 للنص العادي)**. سياسة المستودع أشد (v18.1 رفعت faint لهذا السبب بالضبط): **tertiary للأيقونات والزخرفة النصية غير الحاملة لمعلومة فقط؛ أي نص يقرأه المستخدم = secondary فأعلى.**

### 8.2 حالات التركيز Focus
* `focus-visible` فقط — لا حلقة عند النقر بالماوس.
* `outline: 2px solid var(--ring)` + `outline-offset: 2px` — لا box-shadow باهت.
* ترتيب tab منطقي: header → sidebar → main → composer + skip-link.
* حصر التركيز داخل dialog (Radix FocusScope).

> **قيد الدمج:** المستودع لديه معالجة تركيز واحدة مقيسة (ACC-02: 3px `--u-primary-glow` إزاحة 3px) — تبقى المعالجة الوحيدة؛ قيم الدليل مرجع بنيوي لا تبديل فردي.

### 8.3 انعكاس الأيقونات في RTL — قاعدة نهائية

**تنعكس (Mirror):** كل أيقونة تدل على **اتجاه أو تقدم زمني** — arrow-right/left، chevron، back، send (سهم الإرسال يشير نحو التقدم).
**لا تنعكس:** أيقونة **شيء** — search، settings، copy، download، trash، star، play (رمز عالمي)، logo، code، chart.
**التنفيذ:** فئة `rtl:flip` حيث `.rtl\:flip:dir(rtl) { transform: scaleX(-1); }`.

### 8.4 أحجام اللمس والحركة
* كل هدف تفاعلي `min 44×44px` حتى ghost icon 20px داخل حاوية 44px.
* `gap` بين هدفين متجاورين `≥8px`.
* `prefers-reduced-motion: reduce` → كل `transition/animation-duration` تصبح `0.01ms !important` + `scroll-behavior: auto`.

---

## 9. قائمة فحص الجودة المدرَكة — 55 بندًا قابلاً للفحص

> تُستخدم هذه القائمة كبوابة B-12 (مع B-11) في كل موجة تصميم — بند بند، مع لقطة/قياس لكل مخالفة.

**محاذاة وشبكة (1–10):**
1. كل `padding/margin/gap` من جدول spacing فقط — لا قيم فردية
2. كل عنصر يبدأ على `4px` grid — فحص DevTools
3. لا `margin` عمودي عشوائي — استخدم `gap` فقط
4. `radius` الداخلي = الخارجي − `padding`
5. `border` واحد فقط لكل بطاقة — لا border مزدوج
6. `divider 1px solid border` فقط — لا shadow كفاصل
7. محاذاة النصوص على baseline واحد — لا قفز 2px
8. أيقونة `20px` داخل حاوية `44px` متمركزة تمامًا
9. ارتفاع الهيدر ثابت على كل المقاسات
10. `max-width` محترم لكل نوع صفحة — لا نص بعرض 1440

**طباعة (11–18):**
11. `line-height` عربي ≥1.7 — لا 1.5
12. `letter-spacing` عربي `0` دائمًا
13. أرقام `tabular-nums` — لا قفز عند العد
14. عناوين `text-wrap: balance` — لا سطر أخير بكلمة واحدة
15. فقرة `max-width 65ch`
16. لا أكثر من وزنين بالصفحة (400 + 600/700)
17. `mono` للكود والأرقام فقط — لا mono للنص العادي
18. نص لاتيني داخل عربي معزول `dir ltr` — لا كسر سطر

**ألوان وظلال (19–26):**
19. اللون التركيزي ≤4% من مساحة الشاشة
20. بطاقة افتراضية `shadow-1` أو `border` فقط — لا shadow-3
21. `hover` يضيف `shadow-2` فقط — لا قفز لـ shadow-4
22. لا gradient ملون إلا بتدرج العلامة المعتمد
23. `overlay ~48%` مع blur — لا 60% قاتم
24. status: خلفية فاتحة + نص داكن — لا نص فاتح على خلفية فاتحة
25. Dark mode: border ظاهر — لا بطاقة تذوب في الخلفية
26. focus ring ظاهر وجميل — لا outline 1px باهت

**تفاعلات (27–35):**
27. زر `primary` واحد فقط في الشاشة
28. زر `loading` يخفي النص ويعرض spinner في المركز
29. `disabled opacity 0.45 + pointer-events none`
30. `skeleton` بنفس height المحتوى — صفر layout shift
31. `empty state` illustration 120px + عنوان + زر
32. `toast` يظهر بحركة ويختفي بـ swipe — لا اختفاء مفاجئ
33. `dialog` يغلق بـ Esc + click overlay + X — ثلاث طرق
34. `tabs underline` ينتقل بحركة — لا قفز فوري
35. `command palette` يفتح بـ ⌘K ويغلق بـ Esc

**محتوى ونبرة (36–42):**
36. رسالة empty لا تقول «لا توجد بيانات» — تقول «ابدأ بإنشاء …»
37. رسالة error تشرح السبب والتالي: «تعذر الحفظ. تحقق من الاتصال [إعادة المحاولة]»
38. `helper text` يشرح الحقل قبل الخطأ
39. `placeholder` ليس `label` — الـ label ظاهر دائمًا
40. `confirm delete` يذكر اسم العنصر
41. نص `loading` فعل مضارع: «جاري الحفظ…»
42. `success toast` يذكر النتيجة: «نُشر التقرير بنسختين»

**تفاصيل لا شعورية (43–55):**
43. `card media` بـ object-fit cover — لا تشوه
44. `avatar` fallback حرف واحد — لا أيقونة عامة
45. `badge` لا يزيد عن كلمتين
46. `kbd` بارتفاع 20px radius 6 mono 11px
47. `scrollbar` مخفي للتبويبات
48. `scroll-snap` للتبويبات — لا توقف في المنتصف
49. `mask fade` عند حواف التبويبات — لا قطع حاد
50. أزرار تمرير التبويبات تظهر فقط عند الحاجة
51. `composer` يكبر 88→160px بحركة — لا قفز
52. `stages` خط الربط يتقدم مع الحالة
53. `copy button` يتحول «✓ تم النسخ» لـ 1.5s ثم يعود
54. لا `tooltip` على الهاتف — ضغط مطول بدل hover
55. كل صفحة تملك `h1` واحدًا فقط

---

## 10. خطة التنفيذ المرحلية

> **قيد الدمج:** الترتيب التالي هو خطة الدليل الأصلية (لمشروع أخضر). التنفيذ الفعلي في المستودع يعبر موجات W-9 المسجلة في `roadmap.md` — نفس الترتيب المنطقي مواءمًا مع بوابات Gate A/B + B-11/B-12 والأدلة المجمدة.

| المرحلة | المخرجات | لماذا أولًا | Definition of Done |
| :--- | :--- | :--- | :--- |
| **0. تمهيد** | توكنز + متغيرات light/dark + خطوط | الأساس | build يمر + تباين AA مفحوص |
| **1. Tokens** | spacing/radius/shadow/motion/type كسلالم + صفحة عرض | يمنع الترقيع اللاحق | لا قيمة hard-coded في الكود |
| **2. App Shell** | Sidebar rail/drawer + Header + breakpoints + ⌘K + RTL | القشرة تحكم كل الصفحات | يعمل على 390/768/1024/1440 + rtl/ltr |
| **3. المكونات المشتركة** | Button/Input/Select/Tabs/Card/Table/Dialog/Toast/Badge/Skeleton/Empty بكل الحالات | تُستخدم 100 مرة — الخطأ يتضاعف | كل variant × كل حالة + RTL flip |
| **4. Service Workspace** | Composer + Stages + Stream + Artifacts + Status كقالب | قلب المنتج — 7 خدمات | صفحة اسأل تعمل كاملة streaming |
| **5. الصفحات — 3 موجات** | **موجة 1 (جودة فورية):** أنشئ + الإعدادات + لك · **موجة 2 (القلب):** اسأل + ابحث + برمج + حلّل · **موجة 3:** تعلّم + استكشف + الأدوات + التشغيل + مكتبتي | الموجة 1 تثبت النظام بصريًا | كل صفحة تطابق blueprint + كل الحالات + فحص جودة §9 |

**قاعدة التسليم:** لا انتقال لمرحلة قبل اجتياز DoD بمراجعة pixel-perfect على 390 و1440.

---

## 11. نماذج مرجعية جاهزة للتنفيذ

> النماذج الكاملة (App Shell · البطاقة الموحدة · شريط التبويبات RTL · الأزرار · مساحة عمل الخدمة) كما وردت من المصدر محفوظة نصًا في سجل الجلسة، وملخصها التنفيذي هنا. عند التنفيذ: القيم تُربط بتوكنز `--u-*` الحية (خريطة الجسر في BIBLE-INTEGRATION.md §3)، لا بأسماء الدليل.

### 11.1 App Shell — النقاط الحاكمة
`dir="rtl"` + sidebar `rail 72 ↔ expanded 280` بانتقال `350ms ease-out-expo` · شعار 32px داخل 56px · nav بمجموعات وفواصل `1px` · عنصر نشط `bg surface-2 + شريط 3px` · header `56px sticky + blur 12 + bg/80` · بحث `36px` بـ kbd ⌘K · درج هاتف `280px max-85vw` يظهر من جهة البداية بـ overlay.

### 11.2 البطاقة الموحدة — الحل الرياضي
`grid 1/2/3 أعمدة (390/768/1024) + gap 16` · بطاقة `flex column min-h-[380px] radius 20 border overflow hidden` · `media 160px` بـ `group-hover:scale-[1.02]` · body `p-5 gap-2` بـ `title line-clamp-2` و`desc line-clamp-3` · footer `h-14 border-t px-5 justify-between mt-auto` · حالات loading (skeleton بنفس البنية) وerror (border danger + retry).

### 11.3 شريط التبويبات RTL — الحزم الثلاث
**(1) القناع:** `mask-image: linear-gradient(to left, transparent 0, black var(--mask-start), black calc(100% - var(--mask-end), transparent 100%)` يُفعَّل فقط عند وجود محتوى مخفي. **(2) الحاوية:** `overflow-x auto + scroll-snap mandatory + scrollbar مخفي + overscroll-behavior contain`. **(3) التحكم:** زرا تمرير 32×32 يظهران بمنطق atStart/atEnd — **بالرياضيات المصححة في Errata E-1** — مع underline متحرك `layoutId` و`scrollIntoView({inline:'center'})` عند التبديل.

### 11.4 الأزرار — مصفوفة كاملة
`primary/secondary/ghost/destructive × sm 32/md 40/lg 44` · focus-visible `outline 2px offset 2px` · active `scale .98` · disabled `opacity .45` · loading: النص `opacity 0` + spinner مطلق في المركز · icon-only مربع بـ `grid place-items-center`.

### 11.5 هيكل مساحة عمل الخدمة
البنية الخمسة (ترويسة/مؤلف sticky/مراحل/محتوى عمودان/شريط حالة sticky) كما §5 — النموذج المرجعي يعرضها بـ Tailwind كاملة مع كتلة كود قابلة للنسخ وزر نسخ بحالة «✓ تم النسخ» وجدول مصادر برقائق ثقة.

### 11.6 حزمة التنفيذ المصدرية (ملاحظة أرشيفية)
سلّم المصدر أيضًا مكونات React مبسطة (`Button` / `UnifiedCard` / `ScrollableTabs` / `ServiceWorkspace`) بصياغة Tailwind-first لمشروع أخضر. **في هذا المستودع لا تُستخدم كما هي** — البنية القائمة (packages/ui + طبقات CSS معمارية + مسبارات) هي الحاكمة، والمكونات المرجعية تُقتبس منها القيم والمواصفات فقط، مع إصلاح E-1 في أي كود تبويبات.

---

## §E سجل Errata — مراجعة المهندس قبل التنفيذ (إلزامي)

| # | الخلل في النص الأصلي | التصحيح المعتمد |
| :--- | :--- | :--- |
| **E-1** | `ScrollableTabs` يحسب الاتجاه بـ `el.scrollLeft > 2` ويمرر بـ `scrollBy({left:+160})` لزر البداية | RTL في Chrome/Firefox: scrollLeft يبدأ 0 ويصبح **سالبًا** نحو النهاية — الرياضيات المصححة في §4.4 + اختبار إلزامي 390/768/1440 |
| **E-2** | تبرير tertiary (~3.2:1) لنص 12px رغم فشل AA | tertiary للأيقونات فقط؛ النص المقروء = secondary فأعلى (سياسة المستودع v18.1) |
| **E-3** | استبدال `globals.css` بالكامل + `app-shell.tsx` بجديد | **ممنوع** — يهدم الهوية المجمدة + بوابات CI (token-lint/stylelint/G-6) و8 مراحل مقيسة. الدمج عبر جسر توكنز فقط |
| **E-4** | لوحة stone/terracotta + خط متن Plex Sans Arabic كإجراء افتراضي | مؤجلان لقرار المالك D-8/D-7 — الحاكم الآن: لوحة الهوية المجمدة + Tajawal |
| **E-5** | بطاقات أنشئ `min-height 380px` توضع مكان الحل القائم | الحل الحي (324×158، W8-2) ناجح مقيسًا؛ الترقية للـ media-card تُقاس بلقطات VLM مقارنة قبل أي تبديل |

**معيار النجاح (كما ختم الدليل):** افتح أي صفحتين متتاليتين — لا يجب أن تشعر أن مصممين مختلفين رسموهما. الهدوء، الشبكة، والوزن الواحد للقرار.

