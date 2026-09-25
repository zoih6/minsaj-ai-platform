# W-7 Baseline — Service Surfaces & True Responsiveness (§7.9, 2026-09-25)

Owner post-deployment review of W-6 found the six domain service pages visually
broken ("شغل أطفال"), Settings non-responsive on the phone, and desktop-mode
serving a zoomed touch shell instead of the desktop composition. This wave
(W7-1..W7-5) fixed all three root causes. Evidence in this folder:

## DOM measurements (before → after)

| Probe | Before | After | Verdict |
|---|---|---|---|
| `.mj-section__head` height @390 settings (W7-1 dead space) | 300px (48px of content) | **51px** | FIXED |
| Settings layout height @390 | 958px | **710px** | FIXED |
| 980-coarse composition (W7-2, D-6) | drawer + dock + 2.37× zoom | **expanded sidebar, no dock, native 16px body** | FIXED |
| `--mj-coarse-zoom` token | 2.37 | **retired (empty)** | FIXED |
| Dock @390 (regression control) | visible | **visible** | HELD |
| Horizontal overflow @390 settings | none | **none** | HELD |

## G-6 shell probe — 11/11 PASS (new D-6 policy)

390/430 touch shell · 980-coarse = desktop composition (`topbar.single-row ≤60`,
`d6mode.native-body ≥14`, `d6mode.no-zoom-token`) · 1024/1440 controls.
The probe census now exempts visually-hidden native inputs (1×1 a11y pattern)
from the touch floors.

## G-7 (CI enforce vs phase5 baseline) — PASS, stylelint 913 ≤ 929

The W-7 CSS rides canonical tokens only (u2-product__panel-action; no new
component classes; zero legacy refs added).

## Adversarial VLM (Gate B-11) — verdicts

- `vlm/vlm-mobile-critique1.json`, `vlm-desktop-critique1.json` — BEFORE:
  the critique confirms the owner's read (broken hierarchy, floating CTAs,
  patchwork containers, "Grand Canyon of UI" dead space in settings).
- `vlm/vlm-after-mobile1.json` — AFTER (mobile): "التحسن جوهري وليس مجرد
  تجميل سطحي… التصميم الآن يبدو كمنتج احترافي (B+/A−)".
- `vlm/vlm-after-desktop.json` — AFTER (desktop): "الانسجام ممتاز… نفس
  الـ Sidebar والـ Header ولغة الألوان" vs the اسأل reference; remaining
  notes are P2 polish (in-card density), not P0/P1 defects.

## Screenshots

`before-*` = pre-W-7 build (main @ 07b4390) · `after-*` = W-7 build ·
`after-desktopmode-980.png` = desktop-mode-on-phone after D-6.
