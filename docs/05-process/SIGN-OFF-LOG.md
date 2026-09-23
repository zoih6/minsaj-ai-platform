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
