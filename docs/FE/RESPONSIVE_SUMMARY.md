# Front-end responsive implementation summary

**Purpose:** Single entry point for engineers implementing layouts on phones and tablets (portrait and landscape). The normative design spec remains [`docs/RESPONSIVE.md`](../RESPONSIVE.md); this file adds **project rules** from [`CLAUDE.md`](../../CLAUDE.md) and [`docs/PROJECT_SUMMARY.md`](../PROJECT_SUMMARY.md), plus **where code lives** and **verification**.

**Audience:** Anyone touching `app/`, `components/`, or `e2e/` for kid-facing or parent UI.

---

## 1. Product context (why responsive is different here)

Kid Hub is a **PWA for a child** on phone or tablet, with **landscape as the primary gaming and learning posture** (see RESPONSIVE §1). “Mobile-first” in this repo means:

- **Base styles assume P1 landscape** (short height, usable width).
- **Portrait is explicit** via `portrait:` (or layout split with `.portrait-only` / `.landscape-only` when markup must differ).
- **Wide desktop / parent chrome** layers in at **`lg:` (≥ 1024px)** for `(parent)` and dense admin patterns.

Severity framing from RESPONSIVE: broken **P1 landscape** = ship-blocker; broken **P2 portrait only** = high severity; **P3** degradation = normal bug.

---

## 2. Canonical rules (do not duplicate in PRs)

| Topic | Source |
| --- | --- |
| Priority tiers P1 / P2 / P3, viewport examples | [`docs/RESPONSIVE.md`](../RESPONSIVE.md) §1 |
| Landscape-first convention, `portrait:` / `landscape:` / `lg:` usage | §2 |
| Tap targets, gaps, visual vs hit area | §3 |
| Navigation: sidebar (landscape), bottom tabs (portrait), parent sidebar | §4 |
| Safe areas, viewport meta / `viewport-fit=cover` | §5 |
| `(games)`, `(dashboard)`, `(parent)` constraints | §6 |
| Font scale, motion, contrast | §7 |
| Manual test checklist | §8 |

---

## 3. Project rules that affect responsive work (CLAUDE + PROJECT_SUMMARY)

These apply to **every** responsive change:

1. **Design tokens** — Only in `app/globals.css` inside `@theme {}`. Do not add tokens under `:root` for Tailwind utilities. Semantic colours use theme tokens (e.g. `text-text-primary`, `bg-shell-kid`), not raw palette utilities like `bg-yellow-400`.
2. **Layering** — Pages (`app/.../page.tsx`) fetch data; **presentational** responsive layout belongs in `components/<domain>/` and primitives in `components/ui/`. Do not put business logic in Server Actions “just” to drive layout.
3. **Client boundary** — Hooks and client components must **not** import from `server/` (breaks the bundle). Responsive behaviour stays in CSS + React props/state that do not require server-only imports.
4. **E2E** — Playwright tests use `data-testid` selectors; use `page.clock` for time-dependent behaviour, not `sleep()`.
5. **Scope** — Implement what the task requires; do not refactor unrelated surfaces or add unsolicited docs (this file is maintained when responsive policy changes).

---

## 4. Global implementation status (Kid Hub codebase)

The following from RESPONSIVE “open tasks” are **already present** in the repo (verify before re-adding):

| Item | Location |
| --- | --- |
| `@custom-variant landscape` / `portrait` | `app/globals.css` (after `@theme`) |
| `--spacing-tap`, `--spacing-tap-lg`, `--spacing-tap-xl` | `@theme` in `app/globals.css` |
| `.safe-pad`, `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right` | `app/globals.css` |
| `.portrait-only` / `.landscape-only` fallbacks | `app/globals.css` |
| `viewportFit: 'cover'` | `app/layout.tsx` (`export const viewport`) |

Global resets already include `overscroll-behavior`, tap highlight removal, and `touch-action: manipulation` on `*`; games can use `.game-container` where stricter touch handling is required (RESPONSIVE §6.1).

---

## 5. Implementation playbook (TL;DR for daily work)

### 5.1 Class order mental model

1. **Unprefixed classes** — Layout and sizing for **P1 landscape**.
2. **`portrait:`** — Overrides when height wins over width (tab bar, taller cards, scroll allowances).
3. **`landscape:`** — Rare; use to re-assert landscape when a subtree inherits unwanted portrait rules.
4. **`sm:` / `md:`** — Width-based refinements (e.g. larger tablets in landscape).
5. **`lg:`+** — Parent / desktop density and side-by-side layouts; **not** used to change kid nav to “desktop nav” on wide viewports (RESPONSIVE §4.3).

### 5.2 Navigation contract (kid routes)

- **Never** show landscape sidebar and portrait tab bar at the same time.
- Fixed chrome that touches an edge must use the matching **`safe-*`** utility (RESPONSIVE §5.3).
- Kid nav: **icons only** in landscape sidebar; **max 4** bottom tabs in portrait.

### 5.3 Heights and scrolling

- Full-viewport shells: prefer **`h-dvh`** over `h-screen` so mobile browser chrome does not clip content (RESPONSIVE §6.1, §8).
- **`(games)`:** No outer scroll on the game frame; canvas fits usable area minus nav and safe insets.
- **`(dashboard)`:** No horizontal scroll; prefer fitting key content in **landscape** without scroll where reasonable.

### 5.4 Touch and density

- **`(dashboard)` / `(games)`:** Interactive targets ≥ `min-h-tap` / `min-w-tap` (48px); primary actions prefer `min-h-tap-lg` where spec says so.
- Minimum **8px** between adjacent tappable controls (`gap-2` or equivalent).
- **`(parent)`:** May use smaller controls (e.g. 36px) but must remain usable on **tablet portrait** (RESPONSIVE §6.3).

### 5.5 Accessibility tied to layout

- Kid-route body text: prefer **`text-lg`** minimum; game button labels **`text-2xl`** minimum (RESPONSIVE §7.1).
- Motion: respect **`prefers-reduced-motion`** for decorative animation; keep essential game motion short (§7.2).

---

## 6. Verification matrix (minimum before merge)

Align with [`docs/RESPONSIVE.md`](../RESPONSIVE.md) §8 and extend with automation guidance:

| Check | Tool / method |
| --- | --- |
| Phone landscape + portrait | Chrome DevTools device mode (rotate) |
| Tablet landscape + portrait | Same |
| Notch / home indicator | Device profile with safe areas; inspect fixed bars |
| Tap targets kid routes | Visual + computed styles / design review |
| Regression suite | Playwright viewport matrix (RESPONSIVE §10 RESP-007) when present |

Document in the PR **which tiers** you exercised if the change touches layout shell, games, or global nav.

---

## 7. Related paths

| Path | Role |
| --- | --- |
| `app/globals.css` | Tokens (`@theme`), orientation variants, safe utilities, global touch/scroll |
| `app/layout.tsx` | Root viewport / font / PWA metadata |
| `app/(dashboard)/`, `app/(games)/`, `app/(parent)/` | Route groups with different responsive strictness |
| `components/ui/` | Reusable primitives (no domain imports) |
| `components/<domain>/` | Domain layouts and shells |
| `e2e/` | Viewport and orientation regression (when added) |

---

## 8. When to update this summary

Update **`docs/FE/RESPONSIVE_SUMMARY.md`** when:

- CLAUDE or PROJECT_SUMMARY changes **global FE policy** (tokens, layers, testing).
- **New global utilities** or viewport defaults ship (so §4 stays accurate).

Normative responsive **design** changes belong in **`docs/RESPONSIVE.md`** first; this file should only reflect them briefly and point to the spec.

---

## 9. Codebase review vs this document

Snapshot: repository reviewed against §3–§7 and [`docs/RESPONSIVE.md`](../RESPONSIVE.md). Items list **current state** and **delta** from the stated requirements.

### 9.1 Aligned (no change required for basic compliance)

| Area | Evidence |
| --- | --- |
| Orientation utilities + safe-area globals | `app/globals.css` — `@custom-variant` portrait/landscape, `.safe-*`, `.portrait-only` / `.landscape-only` |
| Viewport fit for notches | `app/layout.tsx` — `viewportFit: 'cover'` |
| Kid nav contract | `components/layout/AppSidebar.tsx` — `portrait:hidden` sidebar, `landscape:hidden` tab bar, `safe-left` / `safe-bottom`, **4** primary `NAV_ITEMS` |
| Games route shell | `app/(games)/layout.tsx` — `.game-container` + `h-dvh` |
| Game hubs | `components/games/MathHub.tsx`, `EnglishHub.tsx` — `h-dvh`, `portrait:` spacing/grid |
| Playwright RESP-007 | `e2e/responsive/viewport-matrix.spec.ts` — P1/P2 phone + P3 iPad **landscape**; nav exclusivity; nav link ≥ 48px; dashboard game cards ≥ 64px; `h-dvh` on `.game-container`; `safe-left` / `safe-bottom` on chrome |
| Reduced motion (global) | `app/globals.css` — `@media (prefers-reduced-motion: reduce)` shortens animations/transitions |
| Many in-game surfaces | Several `components/games/*` — `portrait:` sizing, `min-h-tap-lg` on answer controls |
| PIN keypad (P1 parent entry) | `components/ui/PinKeypad.tsx` — digit keys use `KidButton` with `min-h-16 min-w-16` (64px) |

### 9.2 Gaps (ordered by severity vs RESPONSIVE tiers)

**Ship-blocker risk (P1 landscape / kid dashboard shell)**

| ID | Issue | Location(s) | Why it matters |
| --- | --- | --- | --- |
| G-01 | Main dashboard uses **`h-screen`** on the primary flex shell | `components/dashboard/DashboardView.tsx` (root `div`) | Summary §5.3: prefer **`h-dvh`** (and friends) so mobile browser chrome does not clip or leave dead space. |
| G-02 | **Fixed two-column** layout (`w-80` + `flex-1`) with **no `portrait:` stack** | `components/dashboard/DashboardView.tsx` | P2 portrait and narrow landscape: high risk of **horizontal overflow** or unusably narrow columns — violates RESPONSIVE §6.2 “no horizontal scroll”. |
| G-03 | Kid dashboard wrapper uses **`min-h-screen`** and **`bg-sky-50`** | `app/(dashboard)/layout.tsx`, `components/layout/TabletPageContainer.tsx` | §5.3 / PROJECT_SUMMARY: **`min-h-dvh`** for full-viewport shells; **`bg-shell-kid`** (token) instead of raw `sky` palette for consistency and theming. |

**High severity (P2 portrait, jank, or spec mismatch)**

| ID | Issue | Location(s) | Why it matters |
| --- | --- | --- | --- |
| G-04 | **`lg:pl-56`** on dashboard layout can interact badly with **wide portrait** viewports (width ≥ 1024px, e.g. large iPad portrait) | `app/(dashboard)/layout.tsx` — `pl-16 lg:pl-56 portrait:pl-0 portrait:pb-16` | When `lg` and `portrait` both apply, horizontal padding for sidebar vs tab bar can conflict. Prefer an explicit combo such as **`lg:portrait:pl-0`** (and matching bottom offset) so portrait never reserves sidebar width. |
| G-05 | Multiple game and homework surfaces use **`min-h-screen`** inside `(games)` | e.g. `MathGame.tsx`, `EnglishGame.tsx`, `ShapeGame.tsx`, `CountingGame.tsx`, `AlphabetGame.tsx`, `SoundHuntGame.tsx`, `WordSafariGame.tsx`, `GameResultScreen.tsx`, `HomeworkMode.tsx` | Outer layout is already `h-dvh`; inner **`min-h-screen`** can fight dynamic viewport and cause scroll/jank (RESPONSIVE §6.1). Prefer **`min-h-dvh`**, **`min-h-full`**, or flex **`flex-1`** within the game shell. |
| G-06 | Full-screen overlays use **`h-screen`** | `components/ui/FullScreenModal.tsx`, `app/(parent)/parent/pin/page.tsx` | Same dynamic viewport issue on notched phones; prefer **`h-dvh`** (and safe-top on fixed full-screen if content touches top). |

**Medium (tokens, contrast, maintainability)**

| ID | Issue | Location(s) | Why it matters |
| --- | --- | --- | --- |
| G-07 | **Raw palette** classes on kid chrome (`bg-blue-500`, `text-slate-*`, `bg-sky-50`, `bg-emerald-500` on cards) | `AppSidebar.tsx`, `DashboardView.tsx`, `GameEntryCard` callers, `TabletPageContainer.tsx` | CLAUDE / RESPONSIVE §7.3 / PROJECT_SUMMARY: semantic colours via **`@theme`** tokens (`bg-shell-kid`, `text-text-primary`, subject tokens such as **`bg-math`** / **`bg-english`**). |
| G-08 | **Schedule grid** uses very small portrait typography (`text-[0.6rem]` etc.) | `components/dashboard/ScheduleGrid.tsx` | Tension with RESPONSIVE §7.1 (kid body ≥ `text-lg`). Either treat schedule as dense exception with PM sign-off or redesign portrait schedule (e.g. scrollable list) to meet minimums. |

**Lower / test coverage**

| ID | Issue | Location(s) | Why it matters |
| --- | --- | --- | --- |
| G-09 | Playwright matrix has **no iPad portrait** | `e2e/responsive/viewport-matrix.spec.ts` | RESPONSIVE §8 explicitly calls out tablet portrait; catches G-04 and schedule/dashboard portrait issues. |
| G-10 | **MathHub / EnglishHub** use **`overflow-y-auto`** on full-height hub | `MathHub.tsx`, `EnglishHub.tsx` | Acceptable for a **menu** if PM agrees; differs from strict “no scroll” for **in-game canvas** (RESPONSIVE §6.1). Document intent or replace with fit-without-scroll where possible. |

---

## 10. Detailed implementation plan

Use this as a work breakdown; keep PRs small and reference gap IDs.

### Phase A — P1 dashboard shell (highest user impact)

| Step | Task | Primary files | Acceptance |
| --- | --- | --- | --- |
| A.1 | Replace **`h-screen`** with **`h-dvh`** (or `min-h-dvh` where scroll is intentional) on the dashboard main shell | `components/dashboard/DashboardView.tsx` | P1 iPhone landscape: no clipped header/footer when URL bar shows/hides; no regression in DevTools dynamic toolbar emulation. |
| A.2 | Add **portrait-first responsive layout** for dashboard: e.g. `flex-col portrait:flex-col` / `portrait:*` column order, full-width columns, remove fixed `w-80` in portrait or replace with `w-full max-w-*` + `lg:w-80` if needed | `DashboardView.tsx` | P2 portrait: **no horizontal scroll**; primary widgets readable without zoom; game cards still ≥ 64px tall (existing e2e). |
| A.3 | Align dashboard layout wrapper: **`min-h-dvh`**, token background | `app/(dashboard)/layout.tsx` | Matches §5.3 and token rules; sidebar/tab offsets unchanged except A.4. |
| A.4 | Fix **wide portrait** padding: ensure **`portrait` always wins** over `lg:` for horizontal inset (e.g. `lg:portrait:pl-0` + bottom tab padding) | `app/(dashboard)/layout.tsx` | iPad/large tablet portrait at ≥ 1024px width: content not shifted by sidebar width; tab bar clearance preserved. |

**Exit criteria for Phase A:** Manual pass on RESPONSIVE §8 checklist for **dashboard** only; existing `viewport-matrix` tests green; optional new e2e assertion for “no horizontal overflow” on `/dashboard` in P2 viewport (scrollWidth vs clientWidth).

### Phase B — Games and overlays (viewport consistency)

| Step | Task | Primary files | Acceptance |
| --- | --- | --- | --- |
| B.1 | Replace **`min-h-screen`** in game flows with **`min-h-dvh`** or **`min-h-full` + flex chain** inside `(games)` | Listed in G-05 | `viewport-matrix` “Games layout uses h-dvh” still passes; no double scrollbars on `/math` and a representative `/english` game in P1. |
| B.2 | Update **`FullScreenModal`** and **PIN full-screen** overlay to **`h-dvh`**; add **`safe-top`** / **`safe-pad`** if fixed content touches top or edges | `components/ui/FullScreenModal.tsx`, `app/(parent)/parent/pin/page.tsx` | Notched device profiles: no critical UI under status bar or home indicator. |
| B.3 | Confirm **HomeworkMode** full-viewport paths use dvh or flex-1 under dashboard shell | `components/homework/HomeworkMode.tsx` | No `min-h-screen` regression on homework flow in kid routes. |

**Exit criteria for Phase B:** Spot-check all `(games)` routes in P1 + P2; parent PIN in P1 landscape on notched profile.

### Phase C — Tokens and visual debt (no layout change unless coupled)

| Step | Task | Primary files | Acceptance |
| --- | --- | --- | --- |
| C.1 | Migrate **`bg-sky-50`** → **`bg-shell-kid`** on shared kid wrappers | `TabletPageContainer.tsx`, `(dashboard)/layout.tsx` | Visual parity acceptable; uses `@theme` token only. |
| C.2 | Migrate **`AppSidebar`** active/hover colours from raw `blue`/`slate` to semantic tokens (or new tokens if missing) | `AppSidebar.tsx` | No raw `bg-blue-500` / `text-slate-500` for primary chrome; contrast still ≥ AA on white/near-white. |
| C.3 | Pass **`bg-math` / `bg-english`** (or equivalent) into **`GameEntryCard`** instead of `bg-blue-500` / `bg-emerald-500` | `DashboardView.tsx`, `GameEntryCard.tsx` (props/types if needed) | Matches PROJECT_SUMMARY subject tokens. |

**Exit criteria for Phase C:** Grep kid routes for fewer raw `slate-*`/`blue-*` on navigation; design review optional screenshot diff.

### Phase D — Schedule / typography / documentation

| Step | Task | Primary files | Acceptance |
| --- | --- | --- | --- |
| D.1 | **Schedule portrait** — PM/design decision: meet §7.1 minimums vs compact grid; implement agreed pattern | `ScheduleGrid.tsx`, possibly `schedule/page.tsx` | Document decision in PR; WCAG AA for any text still shown. |
| D.2 | Document **hub scroll** policy (G-10) in `docs/RESPONSIVE.md` or a one-line note in §6.1 exception list | Docs | Engineers know when `overflow-y-auto` on hubs is allowed. |

### Phase E — Automated regression

| Step | Task | Primary files | Acceptance |
| --- | --- | --- | --- |
| E.1 | Add **iPad portrait** viewport to `VIEWPORTS` (e.g. 820 × 1180) and tests for: nav tab bar visible, sidebar hidden, layout padding | `e2e/responsive/viewport-matrix.spec.ts` | CI green; catches G-04. |
| E.2 | Optional: assertion **`document.documentElement.scrollWidth <= clientWidth + 1`** on `/dashboard` for P1 and P2 | Same file or new spec | Guards G-02 regression. |

### Suggested sequencing

1. **A** (dashboard) before large game refactors — largest P1/P2 risk.  
2. **B** in parallel or immediately after A (shared `min-h-screen` pattern).  
3. **C** when touching those files anyway, or dedicated small PR to avoid mixing with layout logic.  
4. **D** needs product input before heavy code.  
5. **E** after A.4 so new viewport tests are meaningful.

### Traceability

| Phase | Closes gaps |
| --- | --- |
| A | G-01, G-02, G-03, G-04 (partial) |
| B | G-05, G-06 |
| C | G-07 |
| D | G-08, G-10 |
| E | G-09 (+ reinforces G-02, G-04) |

---

*Last plan update: 2026-05-14 — tied to codebase snapshot during review.*
