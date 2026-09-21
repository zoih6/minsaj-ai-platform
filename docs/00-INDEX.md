# فهرس الوثائق — Documentation Index
## ترتيب القراءة الإلزامي

> منسج يُدار بالوثائق: كل عمل يبدأ من هنا ويعود إليها. هذه هي خريطة المكتبة.

---

## الخريطة

| القسم | الملف | الغرض | متى تُقرأ |
|---|---|---|---|
| **المنتج** | [01-product/PRD.md](./01-product/PRD.md) | ما هو منسج، لماذا، لمن، ومبادؤه غير القابلة للتفاوض | أولًا — دائمًا |
| | [01-product/requirements-app.md](./01-product/requirements-app.md) | المتطلبات المرقّمة FR/NFR القابلة للاختبار | قبل أي ميزة وبعدها |
| **التجربة** | [02-experience/information-architecture.md](./02-experience/information-architecture.md) | خريطة المسارات والتنقل والحاويات | قبل أي صفحة/مسار |
| | [02-experience/interaction-logic.md](./02-experience/interaction-logic.md) | عقد «إذا ضغط كذا → يفتح كذا» — مصفوفات الاختيار وآلات الحالات | قبل أي تفاعل |
| | [02-experience/user-flows.md](./02-experience/user-flows.md) | رحلات المستخدم الكاملة بنقاط الفشل والتعافي | قبل أي ميزة تعبر صفحات |
| | [02-experience/page-specs.md](./02-experience/page-specs.md) | مواصفة كل شاشة: الأقسام والحالات والتنقل | قبل/بعد أي تعديل شاشة |
| **التصميم** | [03-design/design-system.md](./03-design/design-system.md) | التوكنز والخطوط والقوانين والممنوعات | قبل أي تغيير بصري |
| | [03-design/reconstruction/DESIGN-SYSTEM-RECONSTRUCTION.md](./03-design/reconstruction/DESIGN-SYSTEM-RECONSTRUCTION.md) | **W-DS:** إعادة بناء نظام التصميم — التشخيص الجنائي، المبادئ، التوكنز، البنية التنقلية/الاستجابية، الأنماط، QA + المصفوفة والأدلة (بالإنجليزية بقرار المالك — لاستهلاك وكلاء AI؛ المدخل USAGE.md) | قبل أي قرار بصري جديد وبعد اعتماد المالك: قبل كل عمل W-DS تنفيذي |
| **الهندسة** | [04-engineering/architecture.md](./04-engineering/architecture.md) | الطبقات واتجاهات الاعتماد وقوانين الكود والنشر | قبل أي كود |
| | [04-engineering/data-model.md](./04-engineering/data-model.md) | الكيانات والعقود وآلة حالات التشغيل | قبل أي بيانات |
| **العملية** | [05-process/known-issues.md](./05-process/known-issues.md) | العيوب المشخّصة وبروتوكول العيب الجديد | قبل أي عمل — إلزامي |
| | [05-process/roadmap.md](./05-process/roadmap.md) | المراحل وأبواب الخروج | عند تخطيط الجلسة |
| **الجذر** | [AGENT.md](../AGENT.md) | مصدر الحقيقة الكامل للتسليم بين الجلسات | أول ملف في كل جلسة |
| | [AGENT-GUIDE.md](../AGENT-GUIDE.md) | القواعد الحمراء الحرجة | قبل أي كوميت/دفعة |
| | [ONBOARDING.md](../ONBOARDING.md) | دليل الجلسة الجديدة خطوة بخطوة | بداية كل جلسة |
| | [CHANGELOG.md](../CHANGELOG.md) | سجل التغييرات المؤرخ | بعد كل عمل ونهاية كل جلسة |
| | [worklog.md](../worklog.md) | سجل العمل الحي للجلسات | قبل نهاية كل جلسة |

## ترتيب القراءة حسب الدور

- **جلسة جديدة (أي عمل):** ONBOARDING → AGENT → known-issues → مهمتك من roadmap.
- **عمل منتجي:** PRD → user-flows → interaction-logic.
- **عمل شاشة:** page-specs → design-system → (بعد اعتماد W-DS: reconstruction/USAGE.md) → information-architecture.
- **عمل بيانات:** data-model → architecture.
- **قبل الدفع دائمًا:** AGENT-GUIDE (القواعد الحمراء) → بوابة الجودة في AGENT §8.

## قوانين الوثائق

1. **الوثيقة تسبق الكود:** لا تنفيذ بلا مواصفة — ولا مواصفة بلا مكان في الفهرس.
2. **تحديث الكوميت نفسه:** تغيير السلوك دون تحديث وثيقته = تغيير غير مكتمل.
3. **واقية اللغة:** الوثائق عربية بالمصطلحات التقنية الإنجليزية — توثيقًا لقرار «العربية أولًا».
4. كل وثيقة تحمل رأس «الغرض» — إن ضاع الغرض أعيدت الكتابة لا الترقيع.
