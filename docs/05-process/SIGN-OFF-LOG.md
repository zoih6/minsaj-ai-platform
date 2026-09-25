# SIGN-OFF-LOG.md — سجل الاعتماد الحي
## W-DS · VISUAL-QA-CHECKLIST §5 · مصفوفة الاعتماد تعمل حية منذ Phase 6

> **الغرض.** هذا هو السجل الدائم لاعتمادات المالك على فئات التغيير التي تتطلب موافقته (تعديل التوكنز · تغيير النمط). البروتوكول: المالك يعتمد في المحادثة أولًا، ثم يدخل القيد المؤرَّخ في **نفس الدفعة** التي تحمل التغيير — الوثائق تسافر مع الكود. فحص `scripts/visual-qa/signoff.mjs --check` (يعمل في CI مع كل دفعة) يرفض أي دفعة من فئة «اعتماد المالك» بلا قيد بتاريخها في هذا السجل.
>
> **قبل Phase 6:** الاعتمادات التاريخية موثقة نصًا في [DESIGN-SYSTEM-RECONSTRUCTION.md §7.1–§7.6](../03-design/reconstruction/DESIGN-SYSTEM-RECONSTRUCTION.md) — تُقرأ هناك، ولا تُعاد كتابتها هنا.

---

## نموذج القيد

```markdown
### YYYY-MM-DD · <فئة التغيير> · <عنوان قصير>
- **النطاق:** الملفات/الأنظمة المتأثرة
- **البوابات المطلوبة (§5):** … · **المنفذة والمقاسة:** …
- **اعتماد المالك:** <مضمون رسالة المالك وتاريخها — المرجع التوثيقي §7.x إن وُجد>
- **الأدلة:** مسارات القياسات (evidence/baselines/…)
```

---

### 2026-09-24 · pattern-change + token-scope · W-DS Phase 6 — تقسية QA

- **النطاق:** `src/hooks/use-viewport-mode.ts` + `src/lib/viewports.ts` (حارس المؤشر R-RES-1b) · `src/app/styles/universal/shell.css` + `responsive.css` (بوابات pointer + طبقة التحجيم coarse-wide وسلك `.page-title` داخل النطاق الخشن فقط) · `scripts/visual-qa/shell-probe.mjs` (جديد) · `scripts/visual-qa/signoff.mjs` (جديد) · `scripts/token-lint.mjs` + `.stylelintrc.json` + `package.json` (G-7 لوضع الخطأ) · `.github/workflows/visual-qa-guards.yml` (G-6 + signoff في CI) · هذا السجل.
- **البوابات المطلوبة (§5):** A + B كامل البروتوكول (تغيير نمط القشرة + لمس نطاق التوكنز عبر طبقة إعادة تعريف داخل نطاق وسائط — القيم الأساسية للسلم لم تتغير عند المؤشر الدقيق).
- **المنفذة والمقاسة:** Gate A — بناء نظيف 66/66 · ESLint نظيف · stylelint 929/929 ضمن الـ ratchet · tsc صفر أخطاء جديدة. Gate B — B-5/B-6 عبر مسبار G-6: 11/11 خلية PASS (390/430 لمس + ميزانية ≤14.5%/13.1% · 980-coarse تركيبة لمس + أرضيات عدم التصغير فعليًا ≥14px متن/≥11px مونو + الدرج يفتح · ضوابط 1024/1440 الدقيقة بلا تسرب) + التقاط 100 خلية بصفر انحراف حقلي مقابل phase5 + تعداد G-7 مطابق حرفيًا لخط أساس phase5.
- **اعتماد المالك:** «القرار: PHASE 5 — APPROVED · يسمح ببدء Phase 6» (2026-09-24، محادثة الجلسة) — تصريح Phase 6 (تقسية QA) وفق ترتيب §6 المعتمد، والنطاق أعلاه هو تنفيذه الحرفي: G-7 لوضع الخطأ · مسبار 980-coarse في CI · مصفوفة الاعتماد حية — ويستلزم تنفيذ R-RES-1b/RES-01 كي يمر المسبار أخضر.
- **الأدلة:** `docs/03-design/reconstruction/evidence/baselines/phase6/` (coarse-980-before/after · shell-probe · capture-aggregate · g7-baseline · لقطات).

### 2026-09-25 · pattern-change + token-scope · W-DS Phase 6 exit-gate approval — W-DS discharged

- **النطاق:** `docs/03-design/reconstruction/DESIGN-SYSTEM-RECONSTRUCTION.md` (§7.8 + Status) · `docs/05-process/roadmap.md` (إقفال W-DS وتسجيل W-6) · `AGENT.md` (§0/§10) · `docs/03-design/reconstruction/UI-UX-AUDIT-MATRIX.csv` (تصحيحا سجل: INT-03 وIMP-02) · هذا السجل.
- **البوابات المطلوبة (§5):** تسجيل اعتماد (فئة docs — لا كود).
- **اعتماد المالك:** «القرار: PHASE 6 — APPROVED · يسمح ببدء المرحلة التالية» (2026-09-25، محادثة الجلسة) — قبول حزمة أدلة Phase 6 (G-7 وضع خطأ بسانيتي محقون · G-6 حي 11/11 · مصفوفة §5 حية · RES-01 محلول بقياسات قبل/بعد · صفر انحراف ×100) — **وبه تُقفل W-DS بأكملها** (Phase 0–6 عبر بواباتها).
- **الأدلة:** `docs/03-design/reconstruction/evidence/baselines/phase6/` + §7.1–§7.8.

### 2026-09-25 · pattern-change + token-scope · W-6 نسجام الصفحات — تفويض وتنفيذ

- **النطاق:** `src/app/styles/universal/{foundations,shell,home,workspaces,library,workbench,motion,marketing,responsive,interaction}.css` + `src/app/universal.css` (v21 §1.2) + `src/app/globals.css` + `src/components/app-shell/app-shell.tsx` + `scripts/visual-qa/harmony-probe.mjs` (جديد) + المصفوفة (7 حالات) + `RESPONSIVE-ARCHITECTURE.md` (سطر التابلت) + أساس `evidence/baselines/w6/`.
- **البوابات المطلوبة (§5):** A + B كامل البروتوكول (تغيير نمط عبر العائلات + لمس قيم توكنز الاستهلاك لا تعريفاتها — لا توكن جديد وُلد ولا قيمة أساسية تغيرت).
- **المنفذة والمقاسة:** Gate A — بناء 66/66 · ESLint نظيف · tsc صفر · stylelint 912≤929. Gate B — مسبار harmony المخصص قبل/بعد: h1 ‏5←1 قيمة @390 و@1440 · إيقاع العائلات الست ← 26.1 موحدًا وأصغر فجوة ‑116←26.1 · تركيز 3px واحد + kbd ‏12.5px · تابلت D-2 ‏264px push بمُسميات · التقاط 100 خلية مقابل phase6: ‏187 فرقًا كلها في فئات الموجة الثلاث وصفر انحدار · G-7 ‏PASS بتحسن صافي (font-size خام 26←18) · G-6 ‏11/11 · فحص إدراكي VLM سليم.
- **اعتماد المالك:** «اريد الان تغير فعلي في الفرونت اند ونسجام الصفحات» (2026-09-25، محادثة الجلسة — جاء مقرونًا باعتماد Phase 6 وتصريح «المرحلة التالية») — تفسيرُه المُنفذ: فوج نسجام مرئي على النتائج المفتوحة الموثقة، وسُجل في roadmap مرحلة W-6 قبل التنفيذ (قاعدة الخارطة 3).
- **الأدلة:** `docs/03-design/reconstruction/evidence/baselines/w6/` (capture-aggregate · harmony-probe قبل/بعد · shell-probe · g7-baseline · 15 لقطة · README بسجل الانحراف).
