# NAVIGATION-ARCHITECTURE.md — Global vs Contextual Navigation
## W-DS · Design-System Reconstruction · Who owns which pixel of orientation

> **Purpose.** Define the navigation layers of Minsaj, what may live in each, the vertical budget on a 390px viewport, the drawer's weighted information architecture, and the scope rules for search. Resolves matrix findings `NAV-01…07`, `UNC-02`, `UNC-03`.

---

## 1. The layer model

Minsaj navigation is exactly five layers. Each layer has one owner and one job; an element that belongs to a lower layer may never render in a higher one.

| # | Layer | Scope | Owner | Contents (closed list) |
|---|---|---|---|---|
| L0 | Browser chrome | Device | — | Out of our control; never designed around. |
| L1 | **App header** (global) | Whole app | Shell | Workspace mark · one global search/⌘K trigger (icon) · theme · locale · notifications · avatar. **Nothing else.** |
| L2 | **Page title block** (contextual) | One route | Page | h1 (`--mj-text-h1`) · route lede (≤1 line at 390) · primary route action. |
| L3 | **Page content** | One route | Page | Sections, toolbars with *scoped* search/filter chips, collections. |
| L4 | **Mobile dock** (global) | Whole app | Shell | 5 fixed destinations: «لك» · «اسأل» · «أنشئ» · «استكشف» · «مكتبتي». |

**Rules.**
- **[R-NAV-3]** Page identity is announced exactly once — by L2. The header shows the persistent workspace mark, **not** the page title (today both render; `NAV-03`).
- **[R-NAV-6]** Search is scoped: L1 holds the *global* command palette trigger; a *collection* search field lives inside the section it filters (L3). A page without a filterable collection carries no search field.
- Global layers (L1/L4) never change weight between routes; contextual layers (L2/L3) never grow fixed chrome.

## 2. Header architecture (single grammar — ends the dual-header era)

One header architecture for every `/app/*` route, on every viewport:

- **< 768px:** single row, height **56px** + safe-area inset. `[menu] [mark] ······ [⌘K icon] [theme] [lang] [bell] [avatar]`. No second row, no embedded search field (`NAV-01`: the 107px two-row standard header dies; the 65px focus-canvas header is the reference).
- **768–1023px:** same row, search trigger expands into an inline field (width ≥ 220px).
- **≥ 1024px:** same row with the expanded sidebar present.

The header background is near-solid (`opacity ≥ 0.92`, blur retained only as fallback) — structure, not glass (`NAV-07` / `UNC-02` owner decision default). The floating dock may stay glassy — it reads as an object.

## 3. The 390px vertical budget (declared, enforceable)

The mobile composition spends the viewport as follows (390 × 844 reference, no browser toolbars):

| Band | Height | Content |
|---|---|---|
| Safe-area top | `env(safe-area-inset-top)` (0–47px) | Passed through. |
| **App header (L1)** | **56px** | Single row (§2). |
| Page title block (L2) | ~64px | h1 26px line + lede + route action (wraps to ≤ 88px when the action wraps). |
| **Content (L3)** | **≥ 660px (78%)** | Scrolls. Sections at `--mj-space-600` rhythm. |
| Reserve | 16px | Breathing above the dock. |
| **Dock (L4)** | **56px + safe-area bottom** | Floating dock: 16px inline inset, 12px field radius, `--u-shadow-md`, active pill + indicator. |
| **Chrome total (L1+L4+reserve)** | **≤ 128px = 15.2%** | Hard budget (`NAV-02`; today 177px / 21%). |

**Enforcement.** The budget is asserted in Visual QA (gate B-5, `VISUAL-QA-CHECKLIST.md`): `chromeRatio ≤ 15.5%` at 390 and ≤ 14.5% at 430, measured from the captured DOM (same method as this audit's `verticalBudget` metric).

## 4. Drawer / sidebar information architecture (weighted tiers)

The 19 destinations keep their four groups (IA §2) but are now **visually tiered** — the drawer's information architecture finally renders as hierarchy (`NAV-05`). Sidebar (≥768) and drawer (<768) share the same spec.

| Tier | Group label (AR / EN) | Items | Visual weight |
|---|---|---|---|
| **T1 — Core** | «الخدمات» / Services | لك · اسأل · تعلّم · ابحث · أنشئ · برمج · حلّل · استكشف | `label-m` 13px/600 ink, icon 18 in a 28px chip, row 48px; active = primary pill + 3px inline indicator. |
| **T2 — Workspace** | «أدوات متقدمة» / Advanced tools | المشاريع · الوكلاء · التدفقات · مصادر المعرفة · النماذج | `body-s` 13.5px/500 muted, icon 16 bare, row 44px; active = soft tint (no full pill). |
| **T3 — Operations** | «التشغيل» / Operations | التشغيلات · الاستخدام والتكلفة · الفوترة · الفريق والأدوار | Same register as T2 with hairline group separation; **the whole tier may fold** behind a «التشغيل» disclosure when the drawer exceeds 80vh. |
| **T4 — Personal** | «مساحتي» / My space | مكتبتي · الإعدادات | Pinned footer block above the profile row (not in the scroll), `body-s`, avatar-adjacent. |

**Rules.**
- Group labels always render (utility group gains its label «مساحتي»).
- Tier registers are token-bound (`NavigationItem tier="core|secondary|pinned"`); today every link is 15.36px/44px identical.
- The rail (icon-only) is a ≥768 fine-pointer presentation of the same tiers (icons keep tier chips; tooltips carry labels).
- «ابدأ شيئًا جديدًا» stays as the drawer's single affirmative action, directly under the brand row.

## 5. Mobile dock (L4) — one grammar

- Floating dock: `inset-inline: 16px`, `inset-block-end: max(16px, safe-area)`, height 56–64px, radius 16px, `--u-shadow-md`, near-solid glass.
- 5 items; icon 18 + `label-s` 11.5px; active = `--u-primary` + soft pill + 3px indicator bar. No per-route restyling (kills the bar/dock duality, `NAV-04`).
- Visual weight cap: exactly one shadow token and one hairline — the dock must never read as a card competing with content (`UNC-03`).
- `--mj-tabbar-reserve` stays as the content bottom-reserve mechanism (already honored on all routes).

## 6. Search & command — scope map

| Scope | Surface | Trigger | Behavior |
|---|---|---|---|
| **Global** (navigation + destinations) | L1 header icon + `⌘K` | icon button with kbd hint (≥768) | Opens the command palette (19 destinations, current implementation retained). |
| **Collection** (filter a list on this page) | L3, inside the collection's `ControlBar` | `SearchField scope="collection"` | Filters in place; placeholder names the collection («ابحث في هذه المكتبة»). |
| **Object** (search within an item) | Detail surfaces only | Provided by the pattern, not chrome | e.g., knowledge collection search. |

A route with no filterable collection renders **no** search field (`NAV-06`). The two-row search tray in the standard mobile header is deleted with the single-row header.

## 7. Route-transition behavior

- Transitions use `--u-motion-duration-route` (240ms) — `INT-02` / `[R-MOT-1]`.
- The header/dock never animate on route change (only the route frame does), reinforcing that global chrome is structure, not content.
- Enter offset shrinks to 4px (from 10px) — reduces the "content slides under the header" perception (`UNC-02`).
