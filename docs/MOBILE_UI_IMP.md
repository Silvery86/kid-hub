# Mobile UI Implementation Plan — Visual Parity with Web

> **Status:** All six phases landed · device verification outstanding
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

### 5.2 Radius tokens — ✅ **TOKENS ADDED (Phase 2, 2026-08-20)** · ⚠️ call sites not migrated

Tokens define only `radius.card` (`1.5rem` → `rounded-card`) and `radius.pill`. The web uses many
raw radii that mobile cannot mirror semantically:

| Web usage | Where | Proposal |
|---|---|---|
| `rounded-4xl` | Dashboard hero, `GameSectionCard` | Add token `radius.hero` = `2rem` |
| `rounded-3xl` | `KidCard`, `GameEntryCard` | Add token `radius.card-lg` = `1.5rem`/`1.75rem` |
| `rounded-[20px]` | `HomeworkItemRow`, `GradesSummaryBar` | Add token `radius.row` = `1.25rem` |
| `rounded-[22px]` | Badges summary | Fold into `radius.hero` |
| `rounded-2xl` / `rounded-xl` | Buttons, chips, tiles | Add `radius.button` = `1rem`, `radius.chip` = `0.75rem` |

**Done:** `tokens.json` now carries `hero` (2rem), `card` (1.5rem), `row` (1.25rem),
`button` (1rem), `chip` (0.75rem) and `pill`. Two deviations from the table above:

- **No `card-lg`.** Tailwind's `rounded-3xl` *is* 1.5rem, which the existing `radius.card`
  already holds — a second token with the same value would only invite drift.
- **`rounded-[22px]` was not folded into `hero`.** 22px → 32px is a real visual change across
  14 web call sites, not a rename. It belongs in the replacement pass, not the token pass.

**Still open:** replacing the raw utilities on both platforms. Phase 2 only added the tokens, so
web renders exactly as before; the migration rides along with the Phase 3 primitive port.

### 5.3 Spacing / tap targets — ✅ shared, ⚠️ underused

`spacing.tap` (3rem), `tap-lg` (4rem), `tap-xl` (5rem) exist in both presets. Web uses
`min-h-tap-lg`; mobile uses none of them. `docs/guides/responsive-spec.md §3.1` mandates them.

**Action:** apply `min-h-tap-lg` to every mobile `Pressable`.

### 5.4 Typography — ✅ **RESOLVED (2026-08-25)** · ⚠️ the original diagnosis was wrong

**What this section originally claimed was false.** It read `fonts.display = "Spline Sans, …"`
out of `tokens.json` and concluded web rendered Spline Sans. It does not, and never did:
`apps/web/app/layout.tsx` loads **Nunito** through `next/font/google` and binds it to
`--font-display`. The token value was dead — Next's font loader sets that variable itself, so the
stack in `tokens.json` never resolved.

Phase 2 vendored Spline Sans on that basis. That was wrong twice over:

1. **It did not match web.** Mobile rendered Spline Sans while web rendered Nunito — the exact
   divergence the phase existed to close.
2. **Spline Sans cannot render Vietnamese.** Its `METADATA.pb` declares only `latin`, `latin-ext`
   and `menu`; the file carries 425 codepoints and is missing `ế ổ ữ ạ ề ứ ơ ư` and most
   precomposed diacritics. The upstream variable font has the same coverage. Since every string in
   this app is Vietnamese, those letters fell back to the system face **mid-word**, on every screen
   built in Phases 3–6.

The Phase 2 note that "800/900 do not exist" was a fact about the wrong font.

**Resolved by standardising on Nunito, one family for both platforms:**

1. ✅ Six static faces vendored — 400/500/600/700/800/900, with the OFL licence. Verified
   individually: correct `usWeightClass`, no `fvar` (true statics, not variable files RN handles
   unreliably), 938 codepoints each, **zero missing Vietnamese**.
2. ✅ `apps/web/app/layout.tsx` now requests `subsets: ['latin', 'vietnamese']`. It previously asked
   for `latin` only, so **web was falling back for every diacritic too** — a live defect on the web
   app, not just a mobile one. The built CSS now carries `U+1EA0-1EF9` on all six weights.
3. ✅ `tokens.json` names Nunito, and the generated preset emits six families.
4. ✅ Mobile weights shifted up now that 800 and 900 exist — see below.

**Weights.** Spline Sans's 700 ceiling forced the Phase 3–6 ports to collapse web's `font-black`
(900) and `font-extrabold` (800) onto a single `font-display-bold`. With the real faces available
those call sites moved up one step: `font-display-semibold` → `font-display-bold`, and
`font-display-bold` → `font-display-extrabold`.

⚠️ **Residual imprecision, deliberately accepted.** The ports had already merged web's 900 and 800
into one class, and which original a given call site came from cannot be recovered by grep. 800 is
the better single guess — web uses `font-extrabold` 179 times against `font-black` 110 — so
headings web renders at 900 render at 800 on mobile. `font-display-black` exists for anyone
correcting a specific screen against its web original.

**Still true from the original section:** RN cannot select a face out of a family by numeric
weight, so weight lives in the class name (`font-display-extrabold`), not beside it.

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

### 5.7 Shadows / elevation — ✅ **RESOLVED (Phase 2, 2026-08-20)**

Web uses `shadow-sm`, `shadow-lg`, `shadow-xl` plus bespoke coloured shadows
(`0 20px 40px -20px {subjectColor}`, `0 4px 10px -3px rgba(59,130,246,0.55)`). Mobile uses **flat
cards with no elevation whatsoever**, which reads as a visibly different design.

**Done:** `tokens.json` gained a `shadows` block (`sm`/`lg`/`xl`, mirroring Tailwind v4's own
values) and `apps/mobile/src/lib/shadows.ts` converts each to
`{ shadowColor, shadowOffset, shadowOpacity, shadowRadius, elevation }`. `coloredShadow(hex)`
covers the bespoke tinted shadows; RN has no `spread`, so the raised opacity stands in for web's
negative pull-back.

**Deviation:** the block is emitted to *neither* generated artifact. Web keeps Tailwind's stock
`shadow-{sm,lg,xl}` — overwriting `--shadow-sm` in `@theme` would have silently restyled every
existing web card — and mobile reads `tokens.shadows` straight from `@kid-hub/shared`, since an RN
shadow is five style props rather than one class.

### 5.8 Animation — ✅ **RESOLVED (Phase 2, 2026-08-20)**

Web ships `animate-fade-slide-up` (staggered `0.08s`/`0.14s`/`0.18s` section entrances),
`animate-pop-in`, `animate-grow-width`, `animate-ping-ring`, `animate-shake`, plus
`active:scale-[0.97]` press feedback and a `prefers-reduced-motion` guard.

Mobile has `react-native-reanimated@4.3.1` and `react-native-worklets` installed but grep confirms
**neither is imported anywhere in `src/`**.

**Done:** `src/components/ui/animated.tsx` ships `FadeSlideUp` (400ms, y 12→0), `PopIn` (350ms,
scale 0.85→1) and `PressableScale` (0.97), all on `Easing.bezier(0.16, 1, 0.3, 1)` — the exact web
values — plus `STAGGER_MS = [80, 140, 180]` for web's section order. Reanimated's own
`useReducedMotion()` stands in for `prefers-reduced-motion`: when it is on, entrances render at
their final frame. `PressableScale` drives the dip from `onPressIn`/`onPressOut` rather than the
`pressed` render prop, so the scale stays on the UI thread when JS is busy.

`animate-grow-width`, `animate-ping-ring` and `animate-shake` are **not** ported — nothing on
mobile needs them until the screens that use them land in Phases 4–5.

### 5.9 Safe areas — ⚠️ wrapper built (Phase 2), screens not yet migrated

Web has `.safe-top/.safe-bottom/.safe-left/.safe-right` and applies them in `AppSidebar`.
On mobile, `react-native-safe-area-context` is installed but `SafeAreaView` appears **only in
`login.tsx`** — the four tab screens render `ScrollView`/`FlatList` straight under the status bar.

**Done (Phase 2):** `src/components/ui/screen.tsx` exports `<Screen>` — `SafeAreaView`
(edges `['top']`, since the tab bar owns the bottom), the shell colour, and the standard page
padding, with `scroll` and `bare` escape hatches. Expo Router already mounts `SafeAreaProvider`
in `ExpoRoot`, so no provider was added.

**Still open:** the four tab screens still render their own `ScrollView`/`FlatList`. They adopt
`<Screen>` when they are rebuilt in Phase 4.

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
order. ✅ marks the ten landed in Phase 3; the rest are Phase 4–5 domain components.

| Web primitive | Mobile target | Notes |
|---|---|---|
| `ui/KidCard.tsx` | ✅ `ui/kid-card.tsx` | `rounded-3xl bg-white p-6` + shadow token |
| `ui/KidButton.tsx` | ✅ `ui/kid-button.tsx` | 4 variants, 4px border, `min-h-tap-lg`, press-scale, loading spinner |
| `ui/Badge.tsx` | ✅ `ui/badge.tsx` | 3 tiers with emoji + border colours |
| `ui/ProgressBar.tsx` | ✅ `ui/progress-bar.tsx` | Colour by pct: ≥90 amber, ≥70 blue, else orange |
| `ui/ProgressRing.tsx` | ✅ `ui/progress-ring.tsx` | Needs `react-native-svg` |
| `ui/StarRating.tsx` | ✅ `ui/star-rating.tsx` | Promoted from `games/`; `max` prop added |
| `ui/PinKeypad.tsx` | ✅ `ui/pin-keypad.tsx` | For `/parent/pin` |
| `ui/FullScreenModal.tsx` | ✅ `ui/full-screen-modal.tsx` | RN `Modal` + `X` icon |
| `ui/ErrorBoundary.tsx` | ✅ `ui/error-boundary.tsx` | Class component, same API |
| `dashboard/SubjectIcon.tsx` | ✅ `dashboard/subject-icon.tsx` | Needs shared `SUBJECTS` (§5.6) |
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

### Phase 2 — Mobile design foundation *(no new screens)* — ✅ **DONE (2026-08-20)**

1. ⚠️→✅ **Fonts** — originally vendored Spline Sans on a false premise; **superseded 2026-08-25**
   by Nunito 400–900, the family web actually renders, and the only one of the two with a
   Vietnamese subset. See §5.4 for the full correction.
2. ✅ **Radius + shadow tokens** — `tokens.json` extended per §5.2 and §5.7, both targets
   regenerated, `src/lib/shadows.ts` added. **Deviations:** no duplicate `card-lg`, `rounded-[22px]`
   left alone, and shadows are consumed from the token module rather than generated into either
   artifact — see §5.2 and §5.7.
3. ✅ **Icons** — `lucide-react-native@1.33` installed. Emoji stay on kid-facing surfaces.
4. ✅ **Gradients / SVG** — `expo-linear-gradient@~56.0.4` and `react-native-svg@15.15.4` installed
   (the latter is also `lucide-react-native`'s peer).
5. ✅ **Animation** — `ui/animated.tsx` on reanimated, with reduce-motion support — see §5.8.
6. ✅ **Screen wrapper** — `ui/screen.tsx` — see §5.9.

**Verification run:**

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass |
| `pnpm -C packages/shared lint` (purity guard) | ✅ isomorphic — safe for Metro |
| `pnpm -C apps/web build` | ✅ all 28 routes build, static/dynamic split unchanged |
| `pnpm -C apps/web lint` | ✅ 0 errors, 11 pre-existing warnings — none in touched files |
| `expo export --platform android` | ✅ bundles; all four `.ttf` files resolve as Metro assets |
| New utilities compile | ✅ `tailwindcss` run over the mobile config emits `font-display-bold` → `SplineSans-Bold`, `rounded-hero` → `2rem`, `rounded-button`, `min-h-tap-lg` |

The export was run against a throwaway `_ui-probe.tsx` route importing every new module, dep and
class name, since nothing imports the primitive kit yet and Metro would otherwise tree-shake it.
The probe was deleted after the run.

**Web blast radius:** one purely additive block of four `--radius-*` custom properties in
`tokens.generated.css`. No web component changed; no web class changed.

**Not done, deliberately:**

- `apps/mobile` has no ESLint setup at all — `pnpm -C apps/mobile lint` runs `expo lint`, which
  tries to bootstrap `eslint-config-expo` and then fails because `eslint` itself is not installed.
  Configuring mobile linting is its own task, not Phase 2 scope.
- `pnpm install` under pnpm 10.33 drops the now-redundant `catalogs.default.zod` snapshot from
  `pnpm-lock.yaml`. Both consumers still resolve `catalog:` → zod 4.3.6 and the schema tests pass;
  the line is lockfile bookkeeping from a newer pnpm, unrelated to this phase.

**Exit:** ✅ the primitive kit compiles and bundles; existing screens are untouched and still work.

### Phase 3 — UI primitive kit — ✅ **DONE (2026-08-20)**

All ten primitives ported, each built on the Phase 2 foundation (`shadow()`, `PressableScale`,
`font-display-*`, the radius tokens). `Shake` was added to `ui/animated.tsx` — Phase 2 skipped it,
and the PIN keypad needs it.

**Colour was tokenized on both platforms first.** Web's primitives used raw palette
(`bg-blue-500`, `bg-amber-100`, `border-rose-600`), which `CLAUDE.md` forbids and §9 flagged. 17
semantic tokens were added and *both* platforms migrated onto them in the same change.

This turned out to be load-bearing rather than cosmetic. **Tailwind v4's palette is not Tailwind
v3's.** Web runs v4, whose colours are authored in OKLCH; mobile's NativeWind preset runs
tailwindcss 3.4, whose palette is the older sRGB hex set. The same class name therefore renders
differently per platform — `bg-orange-400` is `#ff8904` on web and `#fb923c` on mobile, a 56/255
channel gap. Mirroring web's class names would have shipped visibly different colours.

**Web is not pixel-identical afterwards.** The new tokens carry the v3 hexes, matching the existing
token set (`math #3b82f6`, `star-filled #fbbf24`, `progress-low #fb923c`), so the migrated web
primitives shift toward the design system's own values. 4 of 30 replacements are exact and 12 are
within ΔE-imperceptible range; the largest movers:

| Web was | rendered | now uses | renders | Δ max channel |
|---|---|---|---|---|
| `bg-orange-400` | `#ff8904` | `bg-progress-low` | `#fb923c` | 56 |
| `border-emerald-600` | `#2d9966` | `border-btn-secondary-border` | `#059669` | 40 |
| `hover:bg-emerald-500` | `#37bc7d` | `hover:bg-btn-secondary-hover` | `#10b981` | 39 |
| `border-amber-300` | `#ffd230` | `border-tier-excellent-border` | `#fcd34d` | 29 |
| `text-amber-400` | `#ffb93b` | `text-star-filled` | `#fbbf24` | 23 |
| `bg-blue-500` | `#2b7fff` | `bg-btn-primary` | `#3b82f6` | 16 |

This is arguably a fix: `bg-blue-500` (`#2b7fff`) sat next to `bg-math` (`#3b82f6`) on the same
screens, so web was already rendering two different blues for one intended colour. If pixel
stability on web matters more than design-system coherence, repoint the token hexes at the v4
values instead — one edit to `tokens.json` plus a regen, and mobile follows automatically.

**Platform translations that are not transcription:**

| Primitive | Difference |
|---|---|
| `progress-ring` | `react-native-svg`; RN has no CSS transition, so the ring snaps rather than sweeping. Identical in every static frame |
| `full-screen-modal` | RN `Modal` replaces `createPortal` — it already traps focus and blocks scroll, so web's body-overflow effect has no counterpart. `statusBarTranslucent` stands in for `safe-top` |
| `error-boundary` | Drops `@sentry/nextjs` (mobile has no Sentry wiring) — errors are logged only. `window.location.href` → `router.replace('/')` |
| `pin-keypad` | RN has no CSS grid, so the 4×3 layout is explicit rows of `flex-1` cells; the wider delete key cannot skew the columns |
| `kid-button` | `hover:` variants dropped — no cursor. The press dip comes from `PressableScale`, the native reading of `active:scale-95` |
| `star-rating` | Promoted from `games/star-rating.tsx`. Its gap moves from 2px to web's `gap-2` (8px), so the two games screens that use it change very slightly |

**Verification run:**

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass |
| `pnpm -C apps/web build` | ✅ compiles, 11/11 static pages generated |
| `pnpm -C apps/web lint` | ✅ 0 errors, 11 pre-existing warnings |
| `expo export --platform android` | ✅ bundles with every primitive in the graph |
| New utilities compile | ✅ 22/22 resolve — `bg-btn-danger` → `#fb7185`, `bg-tier-excellent-bg` → `#fef3c7`, `text-text-body` → `#334155`, `bg-progress-mid` → `#60a5fa` |
| Raw palette gone from the ten web primitives | ✅ grep returns nothing |

The export ran against a throwaway `_ui-probe.tsx` route exercising every primitive and variant,
since no screen imports the kit yet. The probe was deleted after the run.

**Exit:** ✅ every primitive compiles, bundles and matches its web counterpart's spacing, radius,
weight and shadow. Screens assemble them in Phases 4–5.

### Phase 4 — Rebuild the four tab screens — ✅ **DONE (2026-08-20)**

All four rebuilt against web's **phone-portrait** branch, which is the layout a phone actually
renders. 1. Grades ✅ · 2. Homework ✅ · 3. Schedule ✅ · 4. Dashboard ✅. Copy is Vietnamese,
`headerShown: false`, and the tab bar now matches web's `NavLink variant="tabbar"` — 64px white
bar, upward hairline shadow, 22px emoji, 10px extrabold label, `btn-primary` active tint.

#### Backend gap §8 missed

§8 lists nine endpoints and calls out `kid-profile` as needed early. It does **not** list a weekly
schedule read — but web's schedule page consumes `getScheduleAction()` (the whole week) plus
`getAllEveningBlocksAction()`, while `GET /api/v1/schedule` returns only `TodayView`. The day tabs
cannot be built from today. Three reads were added:

| Endpoint | Feeds | Note |
|---|---|---|
| `GET /api/v1/schedule/week` | Schedule day tabs | **Not in §8** — add it there for future reference |
| `GET /api/v1/kid-profile` | Dashboard greeting | §8 said pull forward; done |
| `getProgress` fetcher over the existing `GET /api/v1/progress` | Points, streak, badges, best stars | §5 asked for this for Phase 5; it also unblocks the dashboard stat pills |

`WeekViewSchema` and `KidProfileSchema` joined `response.schema.ts`, so both are Zod-validated at
the transport boundary like every other fetcher.

#### Shared helpers moved

`lib/grades-display.ts` and `lib/schedule-display.ts` moved into `@kid-hub/shared` and are
re-exported from their original web paths — no web import changed (Phase 1's pattern). Both are
pure, and both platforms now compute semester averages, week dates, ISO week numbers and day
labels from the same code.

#### Colour tokenization continued

Porting each screen surfaced more raw palette on web. Seven more tokens landed
(`surface-success`, `surface-warn`, `success-bg`, `success-strong`, `success-text`, `border-soft`,
plus Phase 3's set), and the web counterparts were migrated with them: `GradeCard`,
`GradeTierBadge`, `GradesSummaryBar`, `SemesterTabs`, `HomeworkListView`, `HomeworkHeader`,
`HomeworkItemRow`, `DayTabs`, `DayList`, `SubjectLegend`, `ScheduleView`, `DashboardView`,
`DayRail`, `GameEntryCard`. Same caveat as Phase 3: the tokens hold v3 hexes, so these shift
slightly from what Tailwind v4 was rendering.

**One palette collapse:** `GradeTierBadge` used amber/blue/orange **-800 text, -200 border** while
`ui/Badge` used **-700 / -300** for the same three tiers. Two ramps for one concept is an
inconsistency, not an intent — `GradeTierBadge` now uses the shared `tier-*` tokens on both
platforms.

#### Deliberate deviations

| Item | Decision |
|---|---|
| **Tab bar stays 4 tabs, no Trò chơi** | The games hub (Phase 5 §1) and the homework stack route (Phase 5 §3) do not exist yet. Swapping now points a tab at nothing and makes homework unreachable, breaking §7's "each phase leaves the app working". The swap belongs in Phase 5, where both land |
| **`PeriodCell` and `SubjectLegend` not ported** | Both are tablet/desktop-only. Web's phone branch renders `DayList` with no legend, and the exit criterion is parity with the phone branch |
| **Dashboard progress from the server** | Web's `useUserProgress` is localStorage-backed. Mobile reads `GET /api/v1/progress`, so points and streaks survive a reinstall |
| **Hero paints `subject.color`, not `var(--color-{id})`** | Web's version resolves to nothing for subjects with no colour token (ethics, music, art …), leaving the hero unpainted. The catalogue hex is defined for all ten and identical for the ones that do have tokens |
| **Radial gradient → linear** | Per §6's translation rule; `expo-linear-gradient` at a diagonal is the closest RN approximation of web's `radial-gradient(ellipse at 20% 20%, …)` |
| **`animate-ping-ring` on the DayRail live dot** | Not ported (Phase 2 skipped the keyframe). A solid dot reads the same at 8px |
| **Sign-out button on the dashboard** | No web counterpart — web signs out from the parent area, which mobile does not have until Phase 6. Without it there is no way back to the login screen |

#### Verification run

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass |
| `pnpm -C packages/shared lint` (purity guard) | ✅ isomorphic — safe for Metro |
| `pnpm -C apps/web build` | ✅ compiles |
| `pnpm -C apps/web lint` | ✅ 0 errors, 11 pre-existing warnings |
| `expo export --platform android` | ✅ bundles (6.8MB) |
| New utilities compile | ✅ 16/16 resolve |
| Raw palette gone from every ported web component | ✅ grep clean |

**Dead code removed:** `components/homework/HomeworkChip.tsx` and
`components/homework/HomeworkMode.tsx` were referenced by nothing — which is why they were the
only files still carrying raw palette. Both were superseded: the chip by `DashboardView`'s own
homework card, and the mode by `HomeworkListView`, which `/homework` actually renders and which
already has the same celebration-and-redirect flow.

**Exit:** ✅ the four tabs mirror web's phone-portrait branch. Not yet verified on a device — see
§9's "no visual regression testing on mobile" risk.

### Phase 5 — The missing kid screens — ✅ **DONE (2026-08-22)**

1. ✅ **`/games` hub** — stats chips, two gradient section cards, coming-soon grid. Now the 4th tab.
2. ✅ **`/unlock` badges** — amber gradient summary, filter pills, two-up badge grid, pushed from
   the 🏆 pill.
3. ✅ **`/homework`** — moved out of the tabs into a stack route, pushed from the dashboard card.
4. ✅ **`/kid-unlock`** — 6 emoji tiles, 2-tap pattern, lockout countdown, shake on error.
5. ✅ **`+not-found`** — the 🗺️ card.

**The tab bar now matches web exactly**: Trang chủ · Lịch · Điểm · Trò chơi. Phase 4 deferred this
because the games hub and the homework route did not exist; both land here, so the swap is safe.

#### Kid unlock is a UI gate, not an auth boundary

This is the one item that could not be ported as-designed. Web's `/kid-unlock` issues a
`KID_SESSION_COOKIE` that its middleware enforces on every kid route. Mobile cannot reproduce that:
the API authenticates with the Bearer token from parent login, and `/api/v1/*` sits **outside the
middleware matcher**, so a valid token already grants full API access before any pattern is
entered. A pattern check there gates pixels, not data.

So the screen gates the UI (`hooks/use-kid-gate.ts`, per-launch and deliberately not persisted)
while everything that must not live on the device stays server-side behind the new
`POST /api/v1/auth/kid-pattern`: the pattern hash, the attempt counter and the lockout. The route
reuses `getPinRateLimiter` — both are short secrets guarding the same household — and returns
`ok` / `wrong` / `locked` / `not-configured` as data rather than HTTP errors, since the screen
renders all four the same way. `GET` on the same path reports whether a parent has configured a
pattern at all; when none is set the screen lets the kid through rather than trapping them.

Making this a real gate would mean a new token type with its own storage, refresh and server-side
acceptance across the whole mobile auth model — a redesign, not a screen. Worth doing if the parent
section (Phase 6) lands, since that is where a genuine kid/parent split starts to matter.

#### Gradients became data

`GAME_SECTION_DEFINITIONS` stored `gradient` as a CSS string (`linear-gradient(140deg, …)`), which
RN cannot parse. The catalogue now carries `gradientAngle` + `gradientStops`, mobile feeds the
stops to `expo-linear-gradient`, and web builds the identical CSS string through a new
`cssLinearGradient()` helper — verified to reproduce the original `0% / 55% / 100%` stops exactly.
One source, no drift.

#### Deliberate deviations

| Item | Decision |
|---|---|
| **`BadgeModal` deleted** | Phase 4 added it for the dashboard's 🏆 pill. The plan routes that pill to the `/unlock` screen instead, which left the modal unreferenced — dead on arrival, so it is gone |
| **No earned date on badge cards** | Web's localStorage progress records when each badge was earned; `GET /api/v1/progress` returns ids only, so the card falls back to a plain "✓ Đã đạt" |
| **Per-minigame stars come from a second read** | `ProgressSummary` only carries best stars per *subject*. The hub shows a star row per *minigame*, so it also reads `getMathBestScores`/`getEnglishBestScores` (`hooks/use-best-scores.ts`) |
| **No "Bố mẹ" button on kid-unlock** | Web's links to `/parent/login`. Mobile has no parent section until Phase 6 |
| **Locked badge emoji uses opacity, not grayscale** | RN has no `filter: grayscale()`; the card's own opacity carries that weight |
| **Radial gradients → linear** | Per §6, for both the kid-unlock backdrop and the badges summary |

#### A trap worth knowing about

`pnpm type-check` on `@kid-hub/mobile` depends on `apps/mobile/.expo/types/router.d.ts`, a
gitignored generated file listing every valid route. **`expo export` does not regenerate it — only
the dev server does.** A stale copy makes type-check fail on any newly added route with a
misleading "not assignable to Href" error. Run `expo start` once after adding a route.

#### Verification run

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass |
| `pnpm -C packages/shared lint` (purity guard) | ✅ isomorphic — safe for Metro |
| `pnpm -C apps/web build` | ✅ compiles |
| `pnpm -C apps/web lint` | ✅ 0 errors, 11 pre-existing warnings |
| `expo export --platform android` | ✅ bundles (6.9MB) |
| New tokens reach both platforms | ✅ `border-badge-earned-border` compiles to `#fde68a` in the web CSS chunk; both are in the mobile preset |
| Raw palette gone from every ported web component | ✅ grep clean across `games/`, `badges/`, `unlock/`, `not-found` |

**Exit:** ✅ every kid-facing web route has a mobile counterpart. Still unverified on a device.

### Phase 6 — Parent section — ✅ **DONE (2026-08-22)**

1. ✅ **`/parent/login`** — restyled, Vietnamese, on the parent shell.
2. ✅ **`/parent/pin`** — hero, keypad, shake, lockout countdown.
3. ✅ **`/parent`** — overview / schedule manager / grades manager behind a segmented control.
4. ✅ **`/parent/kid-access`** — toggles, pattern setup, screen time, recent activity.

Reached from a 🛡️ **Bố mẹ** button on the kid dashboard — web reaches it from the sidebar, which a
phone has no room for.

#### 6a — the REST surface §8 under-counted

§8 lists seven endpoints for this phase. Its single `PUT /api/v1/schedule` row covers **nine**
separate mutations, so the real surface is **13 handlers across 10 paths**. All landed.

More importantly, §8 says each "must go through `requireParentSession` in the service layer" —
which cannot work. `requireParentSession` reads the parent **cookies** and rotates them; mobile
sends a **Bearer header** and cannot receive a `Set-Cookie` rotation. A `requireParentApi` helper
already existed for this, written earlier and never called; it now returns null instead of throwing
so a handler answers with a 401 in one line rather than wrapping thirteen calls in try/catch.

Before this phase **no `/api/v1` route authenticated at all** — fine for the kid reads in a
single-household app, not fine for parent mutations.

Two deliberate asymmetries with the web actions:

- **`POST /auth/pin` mints no session.** The caller already holds a parent access token, so the PIN
  gates the parent UI rather than granting access. It still *requires* that token, so the route
  cannot be used to brute-force the PIN unauthenticated, and it shares `getPinRateLimiter`.
- **`POST /screen-time` stays unauthenticated**, matching `addScreenTimeAction`: the kid app reports
  its own usage, clamped to two minutes per call.

The transport also had to grow: `HttpTransport` only spoke GET and POST.

#### 6b — designed for a phone, not ported

§9 called this "a genuine mobile design, not a port", and the numbers agree: `ScheduleManager` is
906 lines of week grid, inline editor panel and drag targets built around a `w-52` sidebar.

| Web | Mobile |
|---|---|
| `w-52` sidebar + `?view=` query param | One segmented control over a single scrolling column |
| Week grid, all five days at once | Day tabs — pick a day, see its rows |
| Inline editor panel beside the grid | Tap a subject chip to add; a delete button per row |
| Grades table with number inputs | One row per subject with ± steppers in half points |
| Hand-built toggle pill | RN `Switch`, which inherits platform accessibility |
| Screen-time number input | Two large ± targets stepping in half hours |

The steppers are not only ergonomics: a stepper cannot produce an out-of-range value the server
would reject, so the 0–10 and 30–480 bounds are enforced before the request rather than after.

#### A constant CLAUDE.md promised but nobody had written

`CLAUDE.md` lists `CURRENT_ACADEMIC_YEAR` under "Key Constants" and forbids the `'2025-2026'`
literal under "What NOT to do". **The constant did not exist** — the literal was hard-coded at
three call sites instead. Writing the mobile grades manager needed a value, so the constant now
lives in `@kid-hub/shared` and the two web call sites use it.

#### Deliberate deviations

| Item | Decision |
|---|---|
| **No step indicator on login** | Web's is a setup wizard: email → welcome → create PIN → confirm → success. `registerParentAccountAction` and `setPinAction` have no REST route, so mobile can only *sign in* — an account and its PIN are created on web. An indicator over a single step would claim a flow that does not exist |
| **Parent gate is per-launch** | Like the kid gate, and for the same reason: the API already trusts the Bearer token, so the PIN gates the UI. Leaving the section re-locks it |
| **Period times are not editable in place** | A new row lands in the slot after the last one of that day. A time picker per row is a real piece of design work; adding and removing rows covers the common case |

#### Verification run

| Check | Result |
|---|---|
| `pnpm type-check` (turbo, 5 packages) | ✅ 5/5 pass |
| `pnpm -C packages/shared test` | ✅ 43/43 pass |
| `pnpm -C packages/api-client test` | ✅ 15/15 pass (6 new parent contract tests) |
| `pnpm -C packages/shared lint` (purity guard) | ✅ isomorphic — safe for Metro |
| `pnpm -C apps/web build` | ✅ compiles; all 13 handlers registered |
| `pnpm -C apps/web lint` | ✅ 0 errors, 11 pre-existing warnings |
| `expo export --platform android` | ✅ bundles |
| **Live auth probe** against a running build | ✅ all 10 parent paths 401 unauthenticated *and* with a bogus bearer; a genuine `parent-access` JWT returns 200 with real data; a validly-signed `parent-refresh` token is refused, so the type claim is checked and not just the signature; the kid surface answers 200 throughout |

**Exit:** ✅ all 15 routes have a mobile counterpart. Still unverified on a device — §9's open risk.

---

## 8. Backend Gaps — ✅ closed in Phase 6

The parent section runs entirely on Server Actions, which mobile cannot call. Existing REST
coverage under `/api/v1`: `auth/login`, `auth/logout`, `auth/refresh`, `schedule`, `homework/today`,
`homework/[id]/done`, `grades`, `math`, `english`, `progress`.

All of these landed in Phase 6. The table is kept as the record of what was built — and of the
two rows the original plan got wrong: the weekly schedule read was missing entirely, and the
single schedule-write row turned out to be nine separate mutations.

Note the instruction below it — "each must go through `requireParentSession`" — is **wrong for
REST**: that guard reads cookies, and mobile sends a Bearer header. `requireParentApi` is the
Bearer counterpart.

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
| Kid profile | `getKidProfileAction` | ✅ `GET /api/v1/kid-profile` — added in Phase 4 |
| Weekly schedule read | `getScheduleAction` + `getAllEveningBlocksAction` | ✅ `GET /api/v1/schedule/week` — added in Phase 4. **This row was missing from the original plan**; the schedule day tabs cannot be built from `TodayView` |
| Kid pattern verify | `verifyKidPatternAction` | ✅ `POST`/`GET /api/v1/auth/kid-pattern` — added in Phase 5. Verifies only; it issues no session (see Phase 5 notes) |

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
| ~~Spline Sans licensing / file size~~ | **RESOLVED (2026-08-25).** The real risk was not licensing (OFL, fine) but coverage: Spline Sans has no Vietnamese subset at all. Both platforms now use Nunito, which does, at six weights | — |
| `color-mix` has no RN equivalent | Grade/homework/subject tints drift between platforms | One shared `mixWithWhite()` used by both — never reimplement per platform |
| ~~Web's own raw-palette usage~~ | **RESOLVED for the primitives (Phase 3).** 17 semantic tokens added; the ten web primitives and their mobile ports both use them. Raw palette survives elsewhere in `apps/web` and rides along with Phases 4–6 | — |
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

- [x] All 15 web routes have a mobile counterpart (Phases 4–6).
- [x] Zero raw domain IDs on the four tabs — every `subjectId` resolves through the shared catalogue.
- [x] All copy is Vietnamese, kid and parent screens alike.
- [x] Nunito loads on both platforms, Vietnamese subset included, 400–900 (2026-08-25). Mobile
      selects weight by class name (`font-display-extrabold`), since RN cannot pick a face out of
      a family by numeric weight (§5.4).
- [ ] Every `Pressable` meets `min-h-tap-lg` (`docs/guides/responsive-spec.md §3.1`).
- [x] Every screen respects safe-area insets — the four tabs use `<Screen>` (Phase 4).
- [~] Cards carry the shared shadow tokens (Phase 3 primitives do); sections use the staggered
      entrance animation once the screens land in Phase 4.
- [ ] No colour, radius or spacing literal in `apps/mobile` outside the generated preset.
- [ ] `pnpm type-check` and `pnpm test` green from the repo root.
- [ ] Side-by-side screenshots (web phone-portrait vs. mobile) reviewed per screen.
