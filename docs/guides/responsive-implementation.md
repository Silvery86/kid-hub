# Responsive Implementation Summary — Kid Hub Frontend

> **Purpose:** Single entry point for engineers implementing layouts on phones and tablets (portrait and landscape).
> The normative design spec is `docs/guides/responsive-spec.md`; this file adds **project rules** and **where code lives**.
>
> **Audience:** Anyone touching `app/`, `components/`, or `e2e/` for kid-facing or parent UI.

---

## 1. Product Context

Kid Hub is a **PWA for a child** on phone or tablet, with **landscape as the primary gaming and learning posture**. "Mobile-first" in this repo means:

- **Base styles assume P1 landscape** (short height, usable width).
- **Portrait is explicit** via `portrait:` (or layout split with `.portrait-only` / `.landscape-only`).
- **Wide desktop / parent chrome** layers in at **`lg:` (≥ 1024px)** for `(parent)` and dense admin patterns.

Severity framing from `responsive-spec.md`: broken **P1 landscape** = ship-blocker; broken **P2 portrait only** = high severity; **P3** degradation = normal bug.

---

## 2. Canonical Rules — Cross-Reference

| Topic | Source |
|---|---|
| Priority tiers P1 / P2 / P3, viewport examples | `responsive-spec.md` §1 |
| Landscape-first convention, `portrait:` / `landscape:` / `lg:` usage | §2 |
| Tap targets, gaps, visual vs hit area | §3 |
| Navigation: sidebar (landscape), bottom tabs (portrait), parent sidebar | §4 |
| Safe areas, viewport meta / `viewport-fit=cover` | §5 |
| `(games)`, `(dashboard)`, `(parent)` constraints | §6 |
| Font scale, motion, contrast | §7 |
| Manual test checklist | §8 |

---

## 3. Project Rules That Affect Responsive Work

These apply to **every** responsive change:

1. **Design tokens** — Only in `app/globals.css` inside `@theme {}`. Do not add tokens under `:root`. Semantic colours use theme tokens (e.g. `text-text-primary`, `bg-shell-kid`), not raw palette utilities like `bg-yellow-400`.
2. **Layering** — Pages (`app/.../page.tsx`) fetch data; **presentational** responsive layout belongs in `components/<domain>/` and primitives in `components/ui/`. Do not put business logic in Server Actions "just" to drive layout.
3. **Client boundary** — Hooks and client components must **not** import from `server/` (breaks the bundle). Responsive behaviour stays in CSS + React props/state that do not require server-only imports.
4. **E2E** — Playwright tests use `data-testid` selectors; use `page.clock` for time-dependent behaviour, not `sleep()`.
5. **Scope** — Implement what the task requires; do not refactor unrelated surfaces.

---

## 4. Global Implementation Status

The following items from `responsive-spec.md` are **already present** in the repo (verify before re-adding):

| Item | Location |
|---|---|
| `@custom-variant landscape` / `portrait` | `app/globals.css` (after `@theme`) |
| `--spacing-tap`, `--spacing-tap-lg`, `--spacing-tap-xl` | `@theme` in `app/globals.css` |
| `.safe-pad`, `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right` | `app/globals.css` |
| `.portrait-only` / `.landscape-only` fallbacks | `app/globals.css` |
| `viewportFit: 'cover'` | `app/layout.tsx` (`export const viewport`) |

---

## 5. Implementation Playbook

### 5.1 Class Order Mental Model

1. **Unprefixed classes** — Layout and sizing for **P1 landscape**.
2. **`portrait:`** — Overrides when height wins over width.
3. **`landscape:`** — Rare; use to re-assert landscape when a subtree inherits unwanted portrait rules.
4. **`sm:` / `md:`** — Width-based refinements (e.g. larger tablets in landscape).
5. **`lg:`+** — Parent / desktop density and side-by-side layouts.

### 5.2 Navigation Contract (Kid Routes)

- **Never** show landscape sidebar and portrait tab bar at the same time.
- Fixed chrome that touches an edge must use the matching **`safe-*`** utility.
- Kid nav: **icons only** in landscape sidebar; **max 4** bottom tabs in portrait.

### 5.3 Heights and Scrolling

- Full-viewport shells: prefer **`h-dvh`** over `h-screen` so mobile browser chrome does not clip content.
- **`(games)`:** No outer scroll on the game frame; canvas fits usable area minus nav and safe insets.
- **`(dashboard)`:** No horizontal scroll; prefer fitting key content in **landscape** without scroll where reasonable.

### 5.4 Touch and Density

- **`(dashboard)` / `(games)`:** Interactive targets ≥ `min-h-tap` / `min-w-tap` (48px); primary actions prefer `min-h-tap-lg`.
- Minimum **8px** between adjacent tappable controls (`gap-2` or equivalent).
- **`(parent)`:** May use smaller controls (e.g. 36px) but must remain usable on **tablet portrait**.

### 5.5 Accessibility Tied to Layout

- Kid-route body text: prefer **`text-lg`** minimum; game button labels **`text-2xl`** minimum.
- Motion: respect **`prefers-reduced-motion`** for decorative animation.

---

## 6. Verification Matrix — Minimum Before Merge

| Check | Tool / Method |
|---|---|
| Phone landscape + portrait | Chrome DevTools device mode (rotate) |
| Tablet landscape + portrait | Same |
| Notch / home indicator | Device profile with safe areas; inspect fixed bars |
| Tap targets kid routes | Visual + computed styles / design review |
| Regression suite | Playwright viewport matrix (RESP-007) when present |

Document in the PR **which tiers** you exercised if the change touches layout shell, games, or global nav.

---

## 7. Related Paths

| Path | Role |
|---|---|
| `app/globals.css` | Tokens (`@theme`), orientation variants, safe utilities, global touch/scroll |
| `app/layout.tsx` | Root viewport / font / PWA metadata |
| `app/(dashboard)/`, `app/(games)/`, `app/(parent)/` | Route groups with different responsive strictness |
| `components/ui/` | Reusable primitives (no domain imports) |
| `components/<domain>/` | Domain layouts and shells |
| `e2e/` | Viewport and orientation regression |

---

## 8. Gap Audit — Current Codebase

### 8.1 Aligned (No Change Required for Basic Compliance)

| Area | Evidence |
|---|---|
| Orientation utilities + safe-area globals | `app/globals.css` — `@custom-variant` portrait/landscape, `.safe-*` |
| Viewport fit for notches | `app/layout.tsx` — `viewportFit: 'cover'` |
| Kid nav contract | `components/layout/AppSidebar.tsx` — `portrait:hidden` sidebar, `landscape:hidden` tab bar, 4 primary `NAV_ITEMS` |
| Games route shell | `app/(games)/layout.tsx` — `.game-container` + `h-dvh` |
| Playwright RESP-007 | `e2e/responsive/viewport-matrix.spec.ts` — P1/P2 phone + P3 iPad landscape |

### 8.2 Gaps — Ordered by Severity

**Ship-blocker risk (P1 landscape / kid dashboard shell)**

| ID | Issue | Location | Why it Matters |
|---|---|---|---|
| G-01 | Main dashboard uses **`h-screen`** on primary flex shell | `components/dashboard/DashboardView.tsx` | Prefer **`h-dvh`** so mobile browser chrome does not clip or leave dead space. |
| G-02 | **Fixed two-column** layout (`w-80` + `flex-1`) with **no `portrait:` stack** | `DashboardView.tsx` | P2 portrait: high risk of **horizontal overflow** — violates §6.2. |
| G-03 | Kid dashboard wrapper uses **`min-h-screen`** and **`bg-sky-50`** | `app/(dashboard)/layout.tsx`, `TabletPageContainer.tsx` | Use **`min-h-dvh`** and **`bg-shell-kid`** token instead. |

**High Severity (P2 portrait)**

| ID | Issue | Location | Why it Matters |
|---|---|---|---|
| G-04 | **`lg:pl-56`** interacts badly with **wide portrait** viewports | `app/(dashboard)/layout.tsx` | iPad portrait at ≥ 1024px width reserves sidebar padding incorrectly. |
| G-05 | Multiple game surfaces use **`min-h-screen`** inside `(games)` | `MathGame.tsx`, `EnglishGame.tsx`, et al. | Inner `min-h-screen` can fight dynamic viewport and cause scroll/jank. |
| G-06 | Full-screen overlays use **`h-screen`** | `FullScreenModal.tsx`, `parent/pin/page.tsx` | Prefer **`h-dvh`** and safe-top on notched devices. |

**Medium (Tokens, maintainability)**

| ID | Issue | Location |
|---|---|---|
| G-07 | Raw palette classes (`bg-blue-500`, `bg-sky-50`) on kid chrome | `AppSidebar.tsx`, `DashboardView.tsx`, `TabletPageContainer.tsx` |
| G-08 | Schedule grid uses very small portrait typography (`text-[0.6rem]`) | `ScheduleGrid.tsx` |

---

## 9. Implementation Plan — Phases

### Phase A — P1 Dashboard Shell

| Step | Task | Primary Files | Acceptance |
|---|---|---|---|
| A.1 | Replace `h-screen` with `h-dvh` on the dashboard main shell | `DashboardView.tsx` | P1 iPhone landscape: no clipped header/footer |
| A.2 | Add **portrait-first responsive layout**: `portrait:flex-col`, full-width columns | `DashboardView.tsx` | P2 portrait: **no horizontal scroll**; game cards ≥ 64px tall |
| A.3 | Align dashboard layout wrapper: `min-h-dvh`, token background | `app/(dashboard)/layout.tsx` | Matches §5.3 and token rules |
| A.4 | Fix wide portrait padding: `portrait` always wins over `lg:` for horizontal inset | `app/(dashboard)/layout.tsx` | iPad portrait at ≥ 1024px: content not shifted by sidebar width |

### Phase B — Games and Overlays

| Step | Task | Primary Files | Acceptance |
|---|---|---|---|
| B.1 | Replace `min-h-screen` in game flows with `min-h-dvh` or `min-h-full` | G-05 files | `viewport-matrix` tests still green |
| B.2 | Update `FullScreenModal` and PIN full-screen overlay to `h-dvh` | `FullScreenModal.tsx`, `parent/pin/page.tsx` | No critical UI under status bar or home indicator |
| B.3 | Confirm `HomeworkMode` full-viewport paths use dvh or flex-1 | `HomeworkMode.tsx` | No `min-h-screen` regression on homework flow |

### Phase C — Tokens and Visual Debt

| Step | Task | Primary Files | Acceptance |
|---|---|---|---|
| C.1 | Migrate `bg-sky-50` → `bg-shell-kid` on shared kid wrappers | `TabletPageContainer.tsx`, `layout.tsx` | Uses `@theme` token only |
| C.2 | Migrate `AppSidebar` active/hover colours to semantic tokens | `AppSidebar.tsx` | No raw `bg-blue-500` on primary chrome |
| C.3 | Pass `bg-math` / `bg-english` into `GameEntryCard` | `DashboardView.tsx`, `GameEntryCard.tsx` | Matches subject tokens |

### Phase D — Schedule / Typography / Documentation

| Step | Task | Primary Files |
|---|---|---|
| D.1 | **Schedule portrait** — PM/design decision: meet §7.1 minimums vs compact grid | `ScheduleGrid.tsx` |
| D.2 | Document **hub scroll** policy (G-10) in responsive spec or exception list | Docs |

### Phase E — Automated Regression

| Step | Task | Primary Files |
|---|---|---|
| E.1 | Add **iPad portrait** viewport to `VIEWPORTS` and tests for: nav tab bar visible, sidebar hidden | `e2e/responsive/viewport-matrix.spec.ts` |
| E.2 | Optional: assertion `document.documentElement.scrollWidth <= clientWidth + 1` on `/dashboard` | Same file or new spec |

### Suggested Sequencing

1. **A** (dashboard) before large game refactors — largest P1/P2 risk.
2. **B** in parallel or immediately after A (shared `min-h-screen` pattern).
3. **C** when touching those files anyway, or dedicated small PR.
4. **D** needs product input before heavy code.
5. **E** after A.4 so new viewport tests are meaningful.

### Traceability

| Phase | Closes Gaps |
|---|---|
| A | G-01, G-02, G-03, G-04 (partial) |
| B | G-05, G-06 |
| C | G-07 |
| D | G-08, G-10 |
| E | G-09 (+ reinforces G-02, G-04) |

---

*Last plan update: 2026-05-14 — tied to codebase snapshot during review.*
