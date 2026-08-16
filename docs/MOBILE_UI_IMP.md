# Mobile UI Implementation Plan — Visual Parity with Web

> **Status:** Review complete · plan proposed · **no code changed yet**
> **Date:** 2026-08-16
> **Scope:** Bring `apps/mobile` (Expo Router + NativeWind) to design, style, icon and
> content parity with `apps/web` (Next.js 16 + Tailwind v4).
> **Related:** `docs/mobile_imp.md` (Phases 0–8, logic/orientation SSOT — done),
> `docs/guides/responsive-spec.md` (viewport tiers), `docs/design-system/design-system-guide.md`.

---

## 0. Executive Summary

The web app exposes **15 user-facing routes**. The mobile app implements **8**, and of those,
the six non-game screens are *functional stubs* (a `FlatList` proving the API works) rather than
visual ports of the corresponding web view.

The good news: the hard part is already done. `docs/mobile_imp.md` Phases 0–8 built a genuine
cross-platform core — design tokens, contract types, Zod schemas, game logic, the API client and
the orientation engine are all shared, and the two game screens (`/math`, `/english`) are real
ports. Mobile already writes `bg-shell-kid`, `text-text-primary`, `rounded-card` — the same
semantic class names the web uses.

The gap is concentrated in three places:

1. **Missing screens** — the games hub, the badge collection, the kid unlock (emoji pattern)
   screen, and the entire parent section have no mobile counterpart.
2. **Web-only presentation data** — the subject catalogue, badge catalogue and games-hub
   catalogue live in `apps/web/lib/data/` and are not shared. This is the single most visible
   defect: mobile renders the raw string `math` where web renders `Toán` with a `📐` icon on a
   `#3b82f6` tinted tile.
3. **Missing presentation layer** — mobile has no equivalent of `components/ui/` (KidCard,
   KidButton, Badge, ProgressBar, StarRating exists only inside games), no display font loaded,
   no shadow scale, no entrance animations, and all copy is in English while the web is
   entirely Vietnamese.

Estimated effort: **6 phases**, detailed in §7.

---

## 1. Method

What was reviewed, and how:

- Enumerated every route file under `apps/web/app/**` (42 files) and every source file under
  `apps/mobile/src/**` (47 files).
- Read each web page component and the view component it delegates to, focusing on the
  **phone-portrait branch** of each responsive view — that branch is the design contract mobile
  must match, because `apps/mobile` is portrait-locked outside the games.
- Compared the design layer end to end: `packages/shared/src/tokens/tokens.json` →
  `apps/web/app/tokens.generated.css` (web `@theme`) and `packages/shared/tailwind-preset.cjs`
  (mobile NativeWind preset).
- Audited icon sourcing on both sides (`@kid-hub/assets` emoji map, `apps/web/lib/data/subjects.ts`,
  and `lucide-react` imports across the web tree).
- Verified mobile runtime config: `apps/mobile/app.json`, `apps/mobile/src/global.css`,
  `apps/mobile/tailwind.config.js`, and grep-verified the absence of font loading,
  reanimated usage and safe-area handling.

---

## 2. Web Route Inventory

Every user-facing web route, its owning view component, and the design elements mobile must
reproduce. "Phone portrait" describes the branch the mobile port should follow.

### 2.1 Entry & auth

| Route | View component | Purpose | Key design elements |
|---|---|---|---|
| `/` | `app/page.tsx` | Redirects to `/kid-unlock` | — (no UI) |
| `/kid-unlock` | `components/unlock/KidUnlockScreen.tsx` | **Kid** entry gate — 2-tap emoji pattern | 6 emoji tiles (☀️ 🚌 🐶 🍎 ⭐ 🎈), progress hint `n/2`, lockout countdown, `animate-shake` on error |
| `/parent/login` | `components/parent/parent-login/ParentLoginView.tsx` | **Parent** email + password | Step indicator, `bg-shell-parent` (`#f3f2ec`) shell |
| `/parent/pin` | `components/parent/parent-pin/ParentPinScreen.tsx` | Parent PIN second factor | `ParentPinHero` + `ParentPinKeypad`, `Delete` lucide icon, shake on error |

### 2.2 Kid dashboard route group — `(dashboard)`

Shell: `app/(dashboard)/layout.tsx` — `bg-shell-kid` (`#f0f9ff`), fixed `AppSidebar`,
portrait renders a bottom tab bar (`h-16`, white, `shadow-[0_-1px_4px_rgba(0,0,0,0.08)]`).

| Route | View component | Purpose | Key design elements (phone portrait) |
|---|---|---|---|
| `/dashboard` | `components/dashboard/DashboardView.tsx` | Main kid hub | Greeting `Chào {kidName}!` (`text-3xl font-extrabold`); live subtitle `Thứ · DD/MM · HH:mm · Tuần n`; three stat pills (🪙 points amber, 🔥 streak orange, 🏆 badges white — tappable → BadgeModal); **hero card** `rounded-4xl` tinted by current subject colour with radial-gradient overlay, live pulse dot, period progress bar, "Tiếp theo" chip, giant 15%-opacity watermark emoji; **DayRail** card; **game cards** (`GameEntryCard` ×2); **homework preview** card with `ProgressRing` |
| `/schedule` | `components/dashboard/ScheduleView.tsx` | Weekly timetable | `DayTabs`/`DayList`, `PeriodCell` with `color-mix` subject tints, `SubjectLegend`, evening blocks section |
| `/grades` | `components/grades/GradesView.tsx` | Report card | `h1` `Điểm số ⭐`; `SemesterTabs` (compact); `GradesSummaryBar` (blue 📊 avg tile + emerald top-subject tile); `GradeCard` rows — subject tile tinted `color-mix(subject 15%, white)`, `GradeTierBadge`, score bar (`≥9` amber / `≥7` blue / else orange) |
| `/homework` | `components/homework/HomeworkListView.tsx` | Today's homework | `h1` `Bài tập 📚`; `StatusPill` (amber "n chưa làm" / emerald "Xong hết!"); `HomeworkHeader` progress; `HomeworkItemRow` — subject tile, priority rows get 2px subject-coloured border + coloured shadow, done rows `bg-slate-50 opacity-60` + line-through; **full-screen 🎉 celebration overlay** (`animate-pop-in`) then redirect to `/dashboard` |
| `/games` | `components/games/GamesHubView.tsx` | Game launcher hub | `h1` `Trò chơi 🎮` + subtitle; `GameStatsBar` (compact); two `GameSectionCard`s — full-bleed gradient, `boxShadow: 0 20px 40px -20px {color}`, rotated `-8deg` 110px watermark emoji at 15% opacity, per-minigame star totals; `Sắp ra mắt` 3-column grid of `ComingSoonCard` |
| `/unlock` | `components/badges/BadgesView.tsx` | Badge collection | Amber gradient summary card (`from-amber-400 to-amber-500`, `🏆`, `earned/total`, 5-star row); filter pills (`Tất cả` / `Đã đạt ✓` / `Chưa đạt`); `BadgeCard` grid |

### 2.3 Games route group — `(games)`

Shell: `app/(games)/layout.tsx` — `bg-shell-dark` (`#0f172a`), `h-dvh`, `.game-container`
(kills overscroll + touch gestures). Landscape.

| Route | View component | Purpose |
|---|---|---|
| `/math` | `components/games/MathHub.tsx` | Minigame picker → Đếm Sao · Number Ninja · Khám Phá Hình |
| `/english` | `components/games/EnglishHub.tsx` | Minigame picker → Alphabet Explorer · Word Safari · Sound Hunt |

### 2.4 Parent route group — `(parent)`

Shell: `app/(parent)/layout.tsx` — `ParentSidebarNav` (`w-52`, white, `md:flex` only) + content.

| Route | View component | Purpose | Key design elements |
|---|---|---|---|
| `/parent` | `components/parent/ParentDashboardView.tsx` | Overview / schedule / grades manager (via `?view=`) | `TodayOverviewPanel`, `ScheduleManager`, `GradesManager`, `ParentSaveButton` (`Save`/`Check`/`AlertCircle` lucide) |
| `/parent/kid-access` | `components/parent/kid-access/KidAccessView.tsx` | Access toggles, kid pattern setup, screen time, recent activity | `AccessToggleRow`, `KidPatternSetup`, `KidProgressPanel`, `RecentActivityPanel` |

### 2.5 Error states

| Route | File | Purpose |
|---|---|---|
| 404 | `app/not-found.tsx` | 🗺️ card on `#f3f2ec`, "Trang này không có rồi", CTA `Về trang chủ 🏠` |
| Error boundaries | `app/error.tsx`, `app/global-error.tsx`, one per route group | Section-scoped recovery UI |

---

## 3. Mobile Screen Inventory (current state)

| Route | File | State |
|---|---|---|
| `/` | `src/app/index.tsx` | Auth gate — bare `ActivityIndicator` on `bg-shell-kid` |
| `/login` | `src/app/login.tsx` | Parent email/password. **English copy**, no PIN step, no step indicator |
| `(tabs)/dashboard` | `src/app/(tabs)/dashboard.tsx` | **Stub.** "Today" + 3 plain stat cards + 2 game tiles + Sign out |
| `(tabs)/homework` | `src/app/(tabs)/homework.tsx` | **Stub.** `FlatList`, renders raw `subjectId`, ✅/⬜️ text toggle |
| `(tabs)/schedule` | `src/app/(tabs)/schedule.tsx` | **Stub.** `FlatList`, time + `getIcon()` emoji + raw `subjectId` |
| `(tabs)/grades` | `src/app/(tabs)/grades.tsx` | **Stub.** `FlatList`, blue average header, raw `subjectId`, emoji badge |
| `(games)/math` | `src/app/(games)/math.tsx` | ✅ **Real port** — landscape lock, `GameHub`, 3 minigames |
| `(games)/english` | `src/app/(games)/english.tsx` | ✅ **Real port** — landscape lock, `GameHub`, 3 minigames |

Supporting components that already exist and are good: `components/games/*` (11 files, including
`star-rating`, `game-hud`, `game-result`, `game-scaffold`), `components/query-boundary.tsx`,
`components/orientation-lock.tsx`.

---

## 4. Gap Matrix — web route → mobile status

| Web route | Mobile route | Status | Action |
|---|---|---|---|
| `/kid-unlock` | — | ❌ **Missing** | **Create** `src/app/kid-unlock.tsx` — 6 emoji tiles, 2-tap pattern, lockout, shake |
| `/parent/login` | `/login` | ⚠️ Partial | Restyle to `ParentLoginView`; Vietnamese copy; add step indicator |
| `/parent/pin` | — | ❌ **Missing** | **Create** `src/app/parent/pin.tsx` — PIN hero + keypad |
| `/dashboard` | `(tabs)/dashboard` | ⚠️ **Stub** | **Rebuild** — greeting, live subtitle, 3 stat pills, hero card, DayRail, game cards, homework preview |
| `/schedule` | `(tabs)/schedule` | ⚠️ **Stub** | **Rebuild** — day tabs, tinted period cells, subject names, evening blocks, legend |
| `/grades` | `(tabs)/grades` | ⚠️ **Stub** | **Rebuild** — semester tabs, summary bar, GradeCard with tint + tier badge + score bar |
| `/homework` | `(tabs)/homework` | ⚠️ **Stub** | **Rebuild** — status pill, progress header, priority rows, celebration overlay |
| `/games` | — | ❌ **Missing** | **Create** `(tabs)/games.tsx` — stats bar, 2 gradient section cards, coming-soon grid |
| `/unlock` (badges) | — | ❌ **Missing** | **Create** `src/app/unlock.tsx` — amber summary, filter pills, badge grid |
| `/math` | `(games)/math` | ✅ Done | Minor: hub card styling vs web `GameSectionCard` |
| `/english` | `(games)/english` | ✅ Done | Minor: same |
| `/parent` | — | ❌ **Missing** | **Create** `src/app/parent/index.tsx` — see §8 (needs new REST endpoints) |
| `/parent/kid-access` | — | ❌ **Missing** | **Create** `src/app/parent/kid-access.tsx` — see §8 |
| `not-found` | — | ❌ **Missing** | **Create** `src/app/+not-found.tsx` — port the 🗺️ card |
| error boundaries | — | ❌ **Missing** | **Create** `ErrorBoundary` equivalent per stack |

**Score: 2 of 15 routes at parity.**

---

## 5. Design System Parity Audit

### 5.1 Colour tokens — ✅ already SSOT

`packages/shared/src/tokens/tokens.json` is the single source. `pnpm -C packages/shared tokens`
regenerates both `apps/web/app/tokens.generated.css` (`@theme`) and
`packages/shared/tailwind-preset.cjs` (consumed by `apps/mobile/tailwind.config.js`).

Mobile already uses `bg-shell-kid`, `bg-shell-parent`, `text-text-primary`, `text-text-secondary`,
`text-text-muted`, `bg-math`, `bg-english`, `text-schedule`, `bg-btn-primary`, `text-vietnamese`.

**No action needed on colour.** This layer is correct and should not be re-architected.

### 5.2 Radius tokens — ⚠️ incomplete

Tokens define only `radius.card` (`1.5rem` → `rounded-card`) and `radius.pill`. The web uses many
raw radii that mobile cannot mirror semantically:

| Web usage | Where | Proposal |
|---|---|---|
| `rounded-4xl` | Dashboard hero, `GameSectionCard` | Add token `radius.hero` = `2rem` |
| `rounded-3xl` | `KidCard`, `GameEntryCard` | Add token `radius.card-lg` = `1.5rem`/`1.75rem` |
| `rounded-[20px]` | `HomeworkItemRow`, `GradesSummaryBar` | Add token `radius.row` = `1.25rem` |
| `rounded-[22px]` | Badges summary | Fold into `radius.hero` |
| `rounded-2xl` / `rounded-xl` | Buttons, chips, tiles | Add `radius.button` = `1rem`, `radius.chip` = `0.75rem` |

**Action:** extend `tokens.json` with the radius scale above, regenerate, then replace raw values
on **both** platforms. This is the only way mobile can stay pinned to web.

### 5.3 Spacing / tap targets — ✅ shared, ⚠️ underused

`spacing.tap` (3rem), `tap-lg` (4rem), `tap-xl` (5rem) exist in both presets. Web uses
`min-h-tap-lg`; mobile uses none of them. `docs/guides/responsive-spec.md §3.1` mandates them.

**Action:** apply `min-h-tap-lg` to every mobile `Pressable`.

### 5.4 Typography — ❌ **broken on mobile**

`tokens.json` sets `fonts.display = "Spline Sans, Inter, ui-sans-serif, system-ui, sans-serif"`.
`apps/mobile/src/global.css` declares `--font-display` as a CSS variable — but **React Native does
not resolve CSS variables into `fontFamily`**, and grep confirms **zero** font loading in the app:
no `useFonts`, no `loadAsync`, no `expo-font` call, no font files under `apps/mobile/assets/`,
despite `expo-font` being an installed dependency.

Consequence: mobile renders in the platform default (SF Pro / Roboto) while web renders Spline Sans.

Weight parity is also off — web leans on `font-black` (900) and `font-extrabold` (800); mobile
mostly uses `font-bold` (700). Without variable-weight font files loaded, RN silently clamps.

**Action:**
1. Vendor Spline Sans (400/700/800/900) into `apps/mobile/assets/fonts/`.
2. Load via `useFonts` in `src/app/_layout.tsx`, gated by `expo-splash-screen`.
3. Add `fontFamily.display` to the generated NativeWind preset so `font-display` works on both.
4. Map `font-extrabold`/`font-black` to the loaded faces.

### 5.5 Icons — ⚠️ two systems, one shared, one not

**System A — emoji (kid-facing).** Owned by `@kid-hub/assets` (`ICON_MAP`, `getIcon`,
`DEFAULT_ICON`). Web re-exports via `apps/web/lib/icons.ts`; mobile imports it directly in
`schedule.tsx`. ✅ Correct.

**System B — subject icons.** `SUBJECTS` in `apps/web/lib/data/subjects.ts` carries
`{ id, name, colorClass, iconName, color, icon }` for 10 subjects — and is **web-only**. This is
why mobile prints `math` instead of `Toán 📐`.

**System C — lucide chrome icons.** Web imports from `lucide-react`:
`X`, `Delete`, `ArrowLeft`, `CheckCircle2`, `Plus`, `Trash2`, `Check`, `AlertCircle`, `Moon`,
`BookOpen`, `Save`, `Clock`. Mobile has **no vector icon library at all** — `(tabs)/_layout.tsx`
comments that it uses emoji "to keep the tabs dependency-free".

**Action:**
1. Move `SUBJECTS` + `getSubjectById` into `packages/shared/src/data/subjects.ts` (drop the
   web-only `colorClass`, keep `color` + `icon` + `iconName`); re-export from web for
   back-compat.
2. Add `lucide-react-native` to `apps/mobile` and use the **same icon names** as web.
3. Keep emoji for all kid-facing surfaces (nav, subjects, badges) — this is deliberate and matches
   the web design; do **not** substitute SF Symbols, which would break cross-platform parity.

### 5.6 Web-only presentation data — ✅ **RESOLVED (Phase 1, 2026-08-16)**

Was the highest-leverage gap in the plan: five catalogues lived under `apps/web/` and were
therefore invisible to mobile, which is why mobile rendered raw ids.

| Catalogue | Feeds | New home |
|---|---|---|
| `SUBJECTS` / `getSubjectById` | Names, colours, icons everywhere | `packages/shared/src/data/subjects.ts` |
| `BADGE_DEFINITIONS` | 10 badges for `/unlock` | `packages/shared/src/data/badges.ts` |
| `GAME_SECTION_DEFINITIONS`, `COMING_SOON_GAMES` | `/games` section cards | `packages/shared/src/data/games-hub.ts` |
| `KID_ACCESS_FEATURES`, `BADGE_PROGRESS_HINT` | Parent access screen | `packages/shared/src/data/kid-access.ts` |
| `DAYS_OF_WEEK`, `SCHOOL_DAYS`, `DAY_LABELS` | Vietnamese day names | `packages/shared/src/constants.ts` |

Each is re-exported from its original web path, so no web import changed. `mixWithWhite()` landed
alongside them in `packages/shared/src/lib/color.ts`.

### 5.7 Shadows / elevation — ❌ missing

Web uses `shadow-sm`, `shadow-lg`, `shadow-xl` plus bespoke coloured shadows
(`0 20px 40px -20px {subjectColor}`, `0 4px 10px -3px rgba(59,130,246,0.55)`). Mobile uses **flat
cards with no elevation whatsoever**, which reads as a visibly different design.

**Action:** add a `shadows` block to `tokens.json` and a small `src/lib/shadows.ts` on mobile that
converts each token to `{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }`,
since NativeWind's shadow mapping is incomplete on Android.

### 5.8 Animation — ❌ missing

Web ships `animate-fade-slide-up` (staggered `0.08s`/`0.14s`/`0.18s` section entrances),
`animate-pop-in`, `animate-grow-width`, `animate-ping-ring`, `animate-shake`, plus
`active:scale-[0.97]` press feedback and a `prefers-reduced-motion` guard.

Mobile has `react-native-reanimated@4.3.1` and `react-native-worklets` installed but grep confirms
**neither is imported anywhere in `src/`**.

**Action:** build `src/components/ui/animated.tsx` exposing `FadeSlideUp`, `PopIn` and a
`PressableScale`, mirroring the web timings (`cubic-bezier(0.16, 1, 0.3, 1)`, 400ms / 350ms), and
honour `AccessibilityInfo.isReduceMotionEnabled()`.

### 5.9 Safe areas — ⚠️ only one screen handles them

Web has `.safe-top/.safe-bottom/.safe-left/.safe-right` and applies them in `AppSidebar`.
On mobile, `react-native-safe-area-context` is installed but `SafeAreaView` appears **only in
`login.tsx`** — the four tab screens render `ScrollView`/`FlatList` straight under the status bar.

**Action:** wrap every screen in `SafeAreaView` (edges `['top']`; the tab bar handles the bottom),
or adopt `useSafeAreaInsets` in a shared `Screen` wrapper.

### 5.10 Navigation shell — ⚠️ diverges from web

| | Web (portrait) | Mobile (current) |
|---|---|---|
| Tabs | Trang chủ · Lịch · Điểm · **Trò chơi** | Home · **Homework** · Schedule · Grades |
| Labels | Vietnamese | English |
| Header | None — in-page `h1` | `headerShown: true`, default Expo header |
| Bar style | `h-16` white, `shadow-[0_-1px_4px_...]`, emoji icons `text-[22px]`, label `text-[10px] font-extrabold` | Default Expo tab bar |
| Active tint | `text-btn-primary` | `tokens.colors.math` (same hex, different name) |

Web's `TAB_ITEMS` deliberately excludes homework and badges to stay at 4 items
(`AppSidebar.tsx:24-27`); homework is reached from the dashboard's homework card and badges from
the 🏆 stat pill.

**Recommendation:** match web exactly — 4 tabs (Trang chủ, Lịch, Điểm, Trò chơi), `headerShown:
false`, in-page headers, and route to `/homework` + `/unlock` as stack screens pushed from the
dashboard. Reuse `tokens.colors['btn-primary']` for the active tint so the intent is legible.

### 5.11 Language — ❌ mobile is English, web is Vietnamese

Mobile strings: "Today", "Homework", "Schedule", "Grades", "Average score", "Semester", "No
homework today 🎉", "Sign out", "Parent sign in", "Too many attempts…".
Web is Vietnamese throughout ("Chào Khôi!", "Bài tập", "Điểm số", "Điểm TB", "Xong hết rồi!").

Note the game screens are already correctly Vietnamese — the drift is confined to the tab screens
and login.

**Action:** translate all mobile copy to match the web strings verbatim. Where web hard-codes a
name ("Khôi"), take it from `getKidProfileAction`'s mobile equivalent instead.

---

## 6. Component Parity — RN ports required

Mobile has no `components/ui/` layer. These web primitives need native equivalents, in dependency
order:

| Web primitive | Mobile target | Notes |
|---|---|---|
| `ui/KidCard.tsx` | `ui/kid-card.tsx` | `rounded-3xl bg-white p-6` + shadow token |
| `ui/KidButton.tsx` | `ui/kid-button.tsx` | 4 variants, 4px border, `min-h-tap-lg`, press-scale, loading spinner |
| `ui/Badge.tsx` | `ui/badge.tsx` | 3 tiers with emoji + border colours |
| `ui/ProgressBar.tsx` | `ui/progress-bar.tsx` | Colour by pct: ≥90 amber, ≥70 blue, else orange |
| `ui/ProgressRing.tsx` | `ui/progress-ring.tsx` | Needs `react-native-svg` |
| `ui/StarRating.tsx` | ✅ `games/star-rating.tsx` exists | Promote to `ui/`, add `max` prop |
| `ui/PinKeypad.tsx` | `ui/pin-keypad.tsx` | For `/parent/pin` |
| `ui/FullScreenModal.tsx` | `ui/full-screen-modal.tsx` | RN `Modal` + `X` icon |
| `ui/ErrorBoundary.tsx` | `ui/error-boundary.tsx` | Class component, same API |
| `dashboard/SubjectIcon.tsx` | `dashboard/subject-icon.tsx` | Needs shared `SUBJECTS` (§5.6) |
| `dashboard/DayRail.tsx` | `dashboard/day-rail.tsx` | Horizontal period rail |
| `dashboard/BadgeModal.tsx` | `dashboard/badge-modal.tsx` | Needs shared `BADGE_DEFINITIONS` |
| `grades/GradeCard.tsx` | `grades/grade-card.tsx` | `color-mix` → precompute tint in JS (RN has no `color-mix`) |
| `grades/GradeTierBadge.tsx` | `grades/grade-tier-badge.tsx` | |
| `grades/GradesSummaryBar.tsx` | `grades/grades-summary-bar.tsx` | |
| `grades/SemesterTabs.tsx` | `grades/semester-tabs.tsx` | |
| `homework/HomeworkItemRow.tsx` | `homework/homework-item-row.tsx` | Priority border + coloured shadow |
| `homework/HomeworkHeader.tsx` | `homework/homework-header.tsx` | |
| `games/GameSectionCard.tsx` | `games/game-section-card.tsx` | Gradient → `expo-linear-gradient` |
| `games/GameStatsBar.tsx` | `games/game-stats-bar.tsx` | |
| `games/ComingSoonCard.tsx` | `games/coming-soon-card.tsx` | |
| `games/GameEntryCard.tsx` | `games/game-entry-card.tsx` | |
| `badges/BadgeCard.tsx` | `badges/badge-card.tsx` | |

**Two RN-specific translation rules:**

- **`color-mix(in oklab, {color} 15%, white)`** is used pervasively on web (grade cards, homework
  tiles, subject icons) and has no RN equivalent. Write one shared helper
  `mixWithWhite(hex, pct)` in `packages/shared` and use it on **both** platforms so the tints
  cannot drift.
- **CSS gradients** (`linear-gradient(140deg, …)`, `radial-gradient(ellipse at 20% 20%, …)`)
  require `expo-linear-gradient`; the radial overlay on the dashboard hero is best approximated
  with a low-opacity linear gradient or a pre-rendered PNG overlay.

---

## 7. Implementation Plan

Six phases. Each is independently shippable and leaves the app working. Phases 1–2 are pure
infrastructure with **no visual change** — they are prerequisites for everything after.

### Phase 1 — Share the presentation data *(no visual change)* — ✅ **DONE (2026-08-16)**

Unblocks four screens and kills the raw-`subjectId` defect at its root.

1. ✅ Created `packages/shared/src/data/` holding `subjects.ts`, `badges.ts`, `games-hub.ts`,
   `kid-access.ts` and a barrel; moved `DAYS_OF_WEEK`, `SCHOOL_DAYS` and `DAY_LABELS` into
   `packages/shared/src/constants.ts`.
2. ✅ **Deviation from plan — `colorClass` was kept, not stripped.** The `Subject` type already
   lived in `packages/shared/src/types/schedule.ts` *with* `colorClass`, and the values are
   semantic token classes (`bg-math`, `bg-english`) that NativeWind resolves from the same
   generated preset. Removing it would have been a breaking type change for zero benefit.
3. ✅ Added `mixWithWhite(hex, pct)` in `packages/shared/src/lib/color.ts`, implemented in
   **OKLab** to match CSS `color-mix(in oklab, …)` exactly (a naive sRGB lerp gives muddier
   tints). Covered by `color.test.ts` — 8 tests.
4. ✅ Re-exported from `apps/web/lib/data/*` and `apps/web/lib/constants.ts`; **no web import
   path changed** (29 import sites across 33 files untouched).
5. ✅ Verified — see below.

**Verification run:**

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass (8 new) |
| `pnpm -C packages/shared lint` (purity guard) | ✅ isomorphic — safe for Metro |
| `pnpm -C apps/web lint` | ✅ 0 errors (11 pre-existing warnings, none in touched files) |
| `pnpm -C apps/web build` | ✅ all 28 routes build, static/dynamic split unchanged |
| Mobile resolves the new symbols | ✅ verified via a temporary type-check probe |

**Independent correctness check on the OKLab blend:** `mixWithWhite('#3b82f6', 8)` returns
`#eff6ff` — byte-identical to the hand-authored `schedule-soft` token in `tokens.json`. The
implementation reproduces the designer's own tint, so mobile tints will match web.

**Exit:** ✅ mobile can now `import { getSubjectById, mixWithWhite, DAY_LABELS } from '@kid-hub/shared'`.

### Phase 2 — Mobile design foundation *(no new screens)*

1. **Fonts** — vendor Spline Sans 400/700/800/900, load with `useFonts` in `_layout.tsx` behind
   the splash screen; add `fontFamily.display` to the token generator output.
2. **Radius + shadow tokens** — extend `tokens.json` per §5.2 and §5.7, regenerate both targets,
   add `src/lib/shadows.ts`.
3. **Icons** — install `lucide-react-native`; keep emoji for kid-facing surfaces.
4. **Gradients** — install `expo-linear-gradient`; **SVG** — install `react-native-svg`
   (needed by `ProgressRing`).
5. **Animation** — build `ui/animated.tsx` (`FadeSlideUp`, `PopIn`, `PressableScale`) on
   reanimated, with reduce-motion support.
6. **Screen wrapper** — `ui/screen.tsx` applying `SafeAreaView` + `bg-shell-kid` + standard padding.

**Exit:** the primitive kit compiles; existing screens still work.

### Phase 3 — UI primitive kit

Port the primitives in §6 (`kid-card`, `kid-button`, `badge`, `progress-bar`, `progress-ring`,
`star-rating` promotion, `pin-keypad`, `full-screen-modal`, `error-boundary`, `subject-icon`).

**Exit:** every primitive renders in isolation and matches its web counterpart's spacing, radius,
weight and shadow.

### Phase 4 — Rebuild the four tab screens

Order matters — simplest first, so the primitives get exercised before the hardest screen.

1. **Grades** — semester tabs, summary bar, `GradeCard` with tint + tier badge + score bar.
2. **Homework** — status pill, progress header, priority rows, done styling, 🎉 celebration
   overlay + redirect.
3. **Schedule** — day tabs, tinted period cells, subject names/icons, evening blocks, legend.
4. **Dashboard** — greeting, live clock subtitle, 3 stat pills, hero card (subject-tinted,
   gradient overlay, pulse dot, progress bar, "Tiếp theo" chip, watermark emoji), DayRail,
   game cards, homework preview with `ProgressRing`.

Also in this phase: switch the tab bar to the web set (Trang chủ · Lịch · Điểm · Trò chơi),
`headerShown: false`, and translate all copy to Vietnamese.

**Exit:** the four tabs are visually indistinguishable from the web phone-portrait branch.

### Phase 5 — The missing kid screens

1. **`/games` hub** — `GameStatsBar`, two gradient `GameSectionCard`s (`expo-linear-gradient`,
   rotated watermark emoji, per-minigame stars), coming-soon grid. Becomes the 4th tab.
2. **`/unlock` badges** — amber gradient summary, filter pills, badge grid. Pushed from the 🏆
   stat pill.
3. **`/homework`** as a stack route pushed from the dashboard homework card (mirroring web
   portrait, where homework has no tab).
4. **`/kid-unlock`** — 6 emoji tiles, 2-tap pattern, lockout countdown, shake on error. Becomes
   the real entry gate; `index.tsx` routes here instead of `/login` for the kid flow.
5. **`+not-found.tsx`** — port the 🗺️ card.

**Note:** `/unlock` needs a badge-progress read. `/api/v1/progress` already returns
`earnedBadgeIds`, `totalPoints`, `currentStreak`, `mathBestStars`, `englishBestStars` — enough to
build the screen. Add a `getProgress` fetcher to `@kid-hub/api-client` (it is currently
app-specific, per the note in `packages/api-client/src/index.ts`).

**Exit:** every kid-facing web route has a mobile counterpart.

### Phase 6 — Parent section

Largest phase and the only one blocked on backend work (see §8).

1. `/parent/login` restyle + Vietnamese copy + step indicator.
2. `/parent/pin` — hero + keypad + shake.
3. `/parent` — overview / schedule manager / grades manager (segmented control replaces the
   `?view=` query param and the `w-52` sidebar, which does not fit a phone).
4. `/parent/kid-access` — toggles, pattern setup, screen time, recent activity.

**Exit:** full parity across all 15 routes.

---

## 8. Backend Gaps Blocking Phase 6

The parent section runs entirely on Server Actions, which mobile cannot call. Existing REST
coverage under `/api/v1`: `auth/login`, `auth/logout`, `auth/refresh`, `schedule`, `homework/today`,
`homework/[id]/done`, `grades`, `math`, `english`, `progress`.

New endpoints required:

| Need | Current (web) | Proposed REST |
|---|---|---|
| Parent PIN verify | `verifyPinAction` | `POST /api/v1/auth/pin` — must reuse `getPinRateLimiter` |
| Schedule write | `updateScheduleAction` | `PUT /api/v1/schedule` |
| Grades write | `updateGradesAction` | `PUT /api/v1/grades` |
| Kid access settings | `getKidAccessSettingsAction` / update | `GET`/`PUT /api/v1/kid-access` |
| Kid pattern set | `setKidPatternAction` | `PUT /api/v1/kid-access/pattern` |
| Screen time | `getScreenTimeAction` | `GET /api/v1/screen-time` |
| Recent activity | `getRecentActivityAction` | `GET /api/v1/activity` |
| Kid profile | `getKidProfileAction` | `GET /api/v1/kid-profile` (also needed by the dashboard greeting in Phase 4) |
| Kid pattern verify | `verifyKidPatternAction` | `POST /api/v1/auth/kid-pattern` (needed by Phase 5) |

Every one of these is a **mutation on the parent surface** — each must go through
`requireParentSession` in the service layer and be rate-limited consistently with
`lib/rate-limit.ts`. Per `CLAUDE.md`, business logic stays in `server/services/`; the route
handler orchestrates only.

**`GET /api/v1/kid-profile` and `POST /api/v1/auth/kid-pattern` are needed earlier than Phase 6**
(Phases 4 and 5 respectively) and should be pulled forward.

---

## 9. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Spline Sans licensing / file size | Fonts may not be redistributable; 4 weights inflate the bundle | Confirm the licence before vendoring; subset to Latin + Vietnamese (the app needs Vietnamese diacritics) |
| `color-mix` has no RN equivalent | Grade/homework/subject tints drift between platforms | One shared `mixWithWhite()` used by both — never reimplement per platform |
| Web's own raw-palette usage | Web uses `bg-amber-100`, `bg-emerald-100`, `bg-slate-50` widely, which `CLAUDE.md` forbids for semantic colour | Tokenize these as part of Phase 2 and fix both platforms together, or the mobile port inherits the violation |
| Radius/shadow token churn | Phase 2 touches generated files on both platforms | Regenerate and diff-review `tokens.generated.css` + `tailwind-preset.cjs` in one commit |
| Parent section on a phone | The `w-52` sidebar + two-panel manager layouts assume ≥768px | Redesign as segmented control + stacked panels; treat as a genuine mobile design, not a port |
| Reanimated on Android | Entrance animations can jank on low-end devices | Keep to opacity/transform only; gate on reduce-motion |
| No visual regression testing on mobile | Parity can silently rot | Consider Maestro or Expo screenshot tests; web already has `pnpm design:check` |

---

## 10. Open Questions for PM

1. **Tab set** — match web exactly (4 tabs: Trang chủ · Lịch · Điểm · Trò chơi, homework reached
   from the dashboard card), or keep 5 tabs on mobile with Bài tập promoted? *Recommendation:
   match web.*
2. **Entry flow** — should mobile launch into `/kid-unlock` (emoji pattern, matching web) with
   parent login behind a "Bố mẹ" affordance, or keep parent login as the entry point?
   *Recommendation: match web — kid pattern first.*
3. **Parent section priority** — is Phase 6 in scope now, or is the mobile app kid-only for the
   foreseeable future? It is ~40% of the remaining work and carries all of the backend cost.
4. **Font** — is vendoring Spline Sans acceptable, or should mobile use a system-font fallback and
   accept a deliberate, documented divergence?
5. **Phase 1 blast radius** — moving `subjects.ts` and friends into `@kid-hub/shared` touches many
   web imports. Confirm this is acceptable before I start (per `CLAUDE.md` §5, Draft First).

---

## 11. Definition of Done

- [ ] All 15 web routes have a mobile counterpart (or a PM-signed-off exclusion).
- [ ] Zero raw domain IDs rendered — every `subjectId` resolves to a name, icon and colour.
- [ ] All copy is Vietnamese and matches the web strings.
- [ ] Spline Sans loads on both platforms; `font-black`/`font-extrabold` render at the right weight.
- [ ] Every `Pressable` meets `min-h-tap-lg` (`docs/guides/responsive-spec.md §3.1`).
- [ ] Every screen respects safe-area insets.
- [ ] Cards carry the shared shadow tokens; sections use the staggered entrance animation.
- [ ] No colour, radius or spacing literal in `apps/mobile` outside the generated preset.
- [ ] `pnpm type-check` and `pnpm test` green from the repo root.
- [ ] Side-by-side screenshots (web phone-portrait vs. mobile) reviewed per screen.
