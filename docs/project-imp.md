# Improvement Plan — Kid Hub

**Last updated:** 2026-06-02
**Implementation sprint:** 2026-06-02

This document details what must be added, fixed, or optimized within each **existing** module and function to meet the final product requirements. It covers gaps in current implementations only — new features belong in `project-develop.md`.

---

## Implementation Status Summary

| # | Item | Owner | Priority | Status |
|---|---|---|---|---|
| 1 | `updatePeriod` / `deletePeriod` ownership guards | TechLead | P1 | ✅ Done |
| 2 | `toggleHomeworkDoneAction` — award points on completion | BE | P0 | ✅ Done |
| 3 | Security headers (X-Frame-Options, nosniff, Referrer, Permissions) | SA | P1 | ✅ Done |
| 4 | `manifest.json` — fix `orientation`, add `id`/`scope`/`lang`/`dir`/`categories` | SA | P1 | ✅ Done |
| 5 | `app/layout.tsx` — add `metadata.icons` for iOS apple-touch-icon | SA | P1 | ✅ Done |
| 6 | `app/(dashboard)/error.tsx` | FE | P1 | ✅ Done |
| 7 | `app/(games)/error.tsx` | FE | P1 | ✅ Done |
| 8 | `app/(parent)/error.tsx` | FE | P1 | ✅ Done |
| 9 | `app/(dashboard)/dashboard/loading.tsx` | FE | P1 | ✅ Done |
| 10 | `app/(dashboard)/grades/loading.tsx` | FE | P1 | ✅ Done |
| 11 | `app/(dashboard)/homework/loading.tsx` | FE | P1 | ✅ Done |
| 12 | PWA icon PNG files (192, 512, apple-touch-icon) | Designer | P0 | ✅ Done — generated via `scripts/gen-icons.js` |
| 13 | Layering violations — action files calling repositories directly | BE/TechLead | P1 | ✅ Done — 7 action files fixed; 3 new services (progress, screen-time, user); 2 extended (grades, homework); auth.actions retains userRepo (auth domain exception) |
| 14 | `UserProgress` source-of-truth migration to DB | BE | P1 | ✅ Done — `getProgressAction` syncs on mount; `addPoints`/`updateStreak` optimistically update localStorage then reconcile with DB-authoritative totals via `syncPointsAction`/`syncStreakAction` |
| 15 | Badge trigger wiring (`game-win`, `streak-3/7`, `all-green`, `first-login`) | BE | P1 | ✅ Done — `first-login` wired in `verifyKidPatternAction`; `all-green`, `math-ace`, `reading-star`, `perfect-10` added to `rewards.service.ts`; `game-win`/`streak-3/7` were already wired |
| 16 | Refresh token rotation on middleware refresh | SA/BE | P1 | ✅ Done — middleware now rotates both access and refresh JWTs on every token refresh; DB hash update deferred to next full login (Edge runtime constraint) |
| 17 | Lockout timer UI on `/kid-unlock` | FE | P1 | ✅ Already implemented — `KidUnlockScreen.tsx` renders countdown correctly |
| 18 | Grade badge awards on `upsertGradeAction` | BE | P2 | ✅ Done — `checkAndAwardGradeBadges` called after every `upsertGradeAction` |
| 19 | Zod schemas extracted to `server/lib/schemas.ts` | TechLead | P2 | ✅ Done — 17 schemas centralised; `z` import removed from 7 action files; `schedule.actions.ts` also migrated to `requireParentSession` from auth-guard |
| 20 | `getRecentActivityAction` default limit + date grouping | BE | P2 | ✅ Done — `getGroupedActivityAction` added to `kid-access.actions.ts`; groups by date, newest first |
| 21 | `KidAccessSettings` typed interface + Zod | BE | P2 | ✅ Already done — `SettingsSchema = z.record(z.string(), z.boolean())` validates; `requireParentSession` now from `auth-guard.ts` |

---

## 1. Authentication Module

### `verifyKidPatternAction`

| Gap | What to Add |
|---|---|
| No distinct lockout timer UI | Return `lockoutSecondsRemaining` from action; render countdown in `/kid-unlock` instead of generic error |
| Pattern input does not differentiate "wrong" vs "locked" on UI | Add `isLocked: boolean` field to error response; `/kid-unlock` renders two distinct states |
| No success animation before redirect | Add 300 ms fade-out on success before `redirect('/dashboard')` |

### `verifyPinAction`

| Gap | What to Add |
|---|---|
| Rate limiting in middleware covers IP but action itself has no secondary guard | Add `isRateLimited` check at action level using Upstash (defense-in-depth) |
| Concurrent requests can bypass lockout | Use DB transaction to atomically check + increment `attempts` |

### `parentLoginAction`

| Gap | What to Add |
|---|---|
| No "forgot password" flow | Blocked on email sending infrastructure (P2) |
| Registration action exists but no UI for it | Wire `registerParentAccountAction` to a registration page or integrate into parent setup wizard |

### Session Refresh (Middleware)

| Gap | What to Add |
|---|---|
| Refresh token not rotated on use | Issue new refresh token when access token is refreshed; invalidate old one |
| Old refresh token hash not cleared from DB on sign-out | Call `clearRefreshToken(userId)` in `signOutParentAction` (verify this is done) |

---

## 2. Schedule Module

### `createPeriodAction` / `updatePeriodAction`

| Gap | What to Add |
|---|---|
| Overlap validation exists but returns generic error | Return `conflictingPeriod` details so UI can show "conflicts with [Subject] at [time]" |
| No sort order management when periods are reordered | After create/update, recalculate `sortOrder` for all periods on that day |

### `deletePeriodAction` / `updatePeriodAction`

| Gap | What to Add | Status |
|---|---|---|
| Missing `WHERE userId = DEFAULT_USER_ID` guard (BUG-009) | Add userId filter to all schedule repository mutations | ✅ Fixed — `UpdatePeriodInput` now requires `userId`; both `updatePeriod` and `deletePeriod` filter by `userId` in Prisma WHERE |

### `cancelExtraClassAction`

| Gap | What to Add |
|---|---|
| No UI feedback when a cancellation is applied | After cancel, re-fetch schedule and highlight the cancelled slot as "Cancelled" in the grid |

### `useSchedule` Hook

| Gap | What to Add |
|---|---|
| No stale-data indicator | If last fetch was > 2 minutes ago and tab was hidden, show "refreshing…" indicator |
| No error state | If action fails, display "Schedule unavailable" instead of rendering stale/empty data |
| Polls every 30 s regardless of whether page is visible | Already pauses when `document.hidden` — ensure this works correctly in all browsers |

### Schedule UI (`ScheduleView`, `WeekGrid`)

| Gap | What to Add |
|---|---|
| No `loading.tsx` for `/schedule` (one exists but verify it shows subject skeleton colors) | Verify skeleton matches real layout proportions |
| No empty state when a day has no classes | Show "Không có lịch học" (no classes) message instead of empty grid row |

---

## 3. Homework Module

### `toggleHomeworkDoneAction` (CRITICAL — BUG-002)

| Gap | What to Add | Status |
|---|---|---|
| Does not award points on completion | After marking done: call `progressRepo.addPoints(DEFAULT_USER_ID, item.points)`; return `points` in response | ✅ Fixed — `addUserPoints` now called in action |
| Does not log activity event | After marking done: call `activityRepo.logActivity(HOMEWORK_DONE, label)` | ✅ Already implemented |
| No streak update | After marking done: call `progressRepo.updateStreak(DEFAULT_USER_ID, todayDateKey())` | ⏳ Pending — streak update not yet wired |

### `markHomeworkDoneAction`

| Gap | What to Add |
|---|---|
| Two separate completion flows exist — this and `toggleHomeworkDoneAction` | Evaluate whether to merge into one action or clearly document which table each operates on; ensure both award points consistently |

### `getTodayHomeworkAction`

| Gap | What to Add |
|---|---|
| Only returns `DailyHomework` items — does not return `HomeworkCompletion` (period-linked) items | Merge both types into one list with a `type: 'daily' \| 'period'` discriminator |

### Homework UI (`HomeworkListView`)

| Gap | What to Add |
|---|---|
| No `loading.tsx` | Add skeleton loading state for `/homework` route |
| No empty state illustration | Add friendly "No homework today! 🎉" state |
| Checkbox state not optimistic | Use optimistic update — toggle locally, revert on server error |
| No `+pts` animation on completion | Show `+10 pts` fade-up animation after checkbox tap |

---

## 4. Grades Module

### `upsertGradeAction`

| Gap | What to Add |
|---|---|
| No academic year validation | Validate `academicYear` matches `CURRENT_ACADEMIC_YEAR` constant or a whitelist |
| No badge award after grade upsert | If score ≥ 9 (excellent), check if `math-ace`, `reading-star`, `perfect-10` badges should be awarded |

### `getReportCardAction`

| Gap | What to Add |
|---|---|
| Returns all grades but no average per semester | `buildReportCard` should include `averageScore` per semester, not just overall |

### Grades UI (`GradesView`, `GradeCard`)

| Gap | What to Add |
|---|---|
| No `loading.tsx` | Add skeleton loading state for `/grades` route |
| No visual differentiation between empty grade (no data) and score 0 | Show "Not yet graded" label instead of 0 when no grade record exists |

---

## 5. Games Module

### `saveMathProgressAction` / `saveEnglishProgressAction`

| Gap | What to Add |
|---|---|
| Stars calculation logic not visible — verify accuracy | Confirm star thresholds: 3 stars = 100 % correct, 2 stars = ≥ 70 %, 1 star = any completion |
| Homework linking (`homeworkPeriodId`) sets done but does not award points | After linking to homework: call `toggleHomeworkDoneAction` or award points directly |
| No badge award for `game-win` (BUG-007) | After first game completion: call `rewardsService.checkAndAwardBadge('game-win')` |
| No badge award for `top-score` | After saving best score: check if new score beats previous global best; award badge |

### `useGameSession` Hook

| Gap | What to Add |
|---|---|
| No pause state — child cannot pause a game | Add `'paused'` state to `GameStatus`; show pause overlay in `GameHud` |
| Timer continues when app is backgrounded | Detect `visibilitychange` event and pause timer when tab hidden |

### `useMathSession` / `useEnglishSession`

| Gap | What to Add |
|---|---|
| `saveError` state exists but no UI for it | Show error toast in `GameResultScreen` if save failed |
| `isProcessing` state exists but `GameResultScreen` doesn't show loading | Disable play-again button while `isProcessing` is true |

### Games UI (`GameHud`, `GameResultScreen`)

| Gap | What to Add |
|---|---|
| No back-to-hub button inside game session (BUG-012) | Add floating "✕" or "🏠" button to `GameHud`; confirm exit if game in progress |
| `GameResultScreen` does not show which subject this was for | Add subject label / icon to result screen header |
| Coming-soon cards not actually disabled | Ensure `ComingSoonCard` has `pointer-events: none` and opacity 0.5 |

---

## 6. Gamification & Progress

### `useUserProgress` Hook (TD-003 — CRITICAL)

| Gap | What to Fix |
|---|---|
| Source of truth is localStorage — DB `UserProgress` table goes stale | On mount: fetch progress from DB (`getProgressAction`); sync to localStorage as cache |
| `addPoints` writes only to localStorage | `addPoints` should call a server action to persist; update localStorage optimistically |
| `updateStreak` writes only to localStorage | Same — must persist to DB |
| No conflict resolution if localStorage and DB diverge | On mount: if DB total > localStorage total, prefer DB value |

### `rewards.actions.ts`

| Gap | What to Add |
|---|---|
| `game-win` badge trigger missing (BUG-007) | Wire to `saveMathProgressAction` + `saveEnglishProgressAction` on first completion |
| `streak-3` / `streak-7` badge triggers missing | Check streak count in `updateStreak`; award badge on milestone |
| `all-green` badge trigger missing | After grade upsert: check if all subjects ≥ good; award badge |
| `first-login` badge only in seed — not triggered on real first login | Wire to `verifyKidPatternAction` on first ever successful unlock |

---

## 7. Parent Kid Access

### `saveKidAccessSettingsAction`

| Gap | What to Add |
|---|---|
| Settings typed as `Record<string, boolean>` — no defined key schema | Define `KidAccessSettings` interface with all valid toggle keys; validate against it with Zod |
| No audit log when toggles change | Log `ActivityEvent` when parent changes access settings |

### `getRecentActivityAction`

| Gap | What to Add |
|---|---|
| Default limit not specified — could return too many records | Default `limit = 20`; add hard maximum of 100 |
| Activity items have no date grouping | Return `groupedByDate` structure for easier UI rendering |

---

## 8. Error Handling

### All Route Groups

| Gap | What to Add | Status |
|---|---|---|
| No `error.tsx` in `(dashboard)`, `(games)`, `(parent)` | Create `app/(dashboard)/error.tsx`, `app/(games)/error.tsx`, `app/(parent)/error.tsx` with user-friendly error message + retry button | ✅ Done — all 3 files created |

### All Routes Without `loading.tsx`

| Route | Add | Status |
|---|---|---|
| `/dashboard` | `app/(dashboard)/dashboard/loading.tsx` — skeleton with sidebar + cards | ✅ Done |
| `/grades` | `app/(dashboard)/grades/loading.tsx` — skeleton with subject cards | ✅ Done |
| `/homework` | `app/(dashboard)/homework/loading.tsx` — skeleton with list rows | ✅ Done |

---

## 9. Security

### `next.config.ts`

| Gap | What to Add | Status |
|---|---|---|
| No HTTP security headers | Add `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` | ✅ Done — X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy added to all routes. CSP deferred (risk of breaking Tailwind/Google Fonts inline styles) |

### `docker-compose.yml`

| Gap | What to Fix |
|---|---|
| `SESSION_SECRET` not set (line 31) | Set `SESSION_SECRET` to a real ≥ 32 char random value in compose env |

---

## 10. Code Quality

### Server Actions — Return Types

| Gap | What to Fix |
|---|---|
| Many actions return `{ success: boolean }` without discriminated union | Refactor all actions to `ActionResult<T>` generic discriminated union type |

### Zod Schemas

| Gap | What to Fix |
|---|---|
| Schemas defined inline in action files | Extract all Zod schemas to `server/lib/schemas.ts`; import from there |

---

## 11. PWA (Progressive Web App)

The app is configured as a PWA in code but **does not work as an installable PWA on Vercel** due to several concrete gaps. Users on Android, iOS, and desktop cannot see the "Add to Home Screen" / "Install app" prompt.

### Root Cause — Missing Icon Files (P0)

`public/manifest.json` references two icon paths that do not exist in the repository:

| Referenced Path | Exists? |
|---|---|
| `/icons/icon-192.png` | ❌ No `/icons/` folder in `public/` |
| `/icons/icon-512.png` | ❌ No `/icons/` folder in `public/` |

Browsers require at least one valid, reachable icon (192 × 192 minimum) to display the PWA install prompt. Both icons returning 404 silently blocks the prompt on all platforms.

**Fix:** Create `public/icons/` and add the following files:

| File | Size | Purpose |
|---|---|---|
| `public/icons/icon-192.png` | 192 × 192 px | Standard Android/Chrome install icon |
| `public/icons/icon-512.png` | 512 × 512 px | High-DPI splash screen + maskable |
| `public/icons/apple-touch-icon.png` | 180 × 180 px | iOS "Add to Home Screen" icon |
| `public/icons/favicon-32.png` | 32 × 32 px | Browser tab favicon (optional but recommended) |

The 512 × 512 icon must have `"purpose": "maskable"` in `manifest.json` (already set) and must be designed with a safe zone (the center 80 %) so Android's adaptive icon crop doesn't cut off content.

---

### manifest.json — Wrong `orientation` Value (P1)

```json
// CURRENT — forces landscape on all devices  ← FIXED ✅
"orientation": "landscape"

// CORRECT — lets each device use its natural orientation
"orientation": "any"
```

The app supports both orientations via `portrait:` / `landscape:` CSS variants. Locking to `"landscape"` means the PWA launches sideways on phones and fails iOS installation criteria. **Fixed — `orientation` is now `"any"`.** Fields `id`, `scope`, `lang`, `dir`, `categories` also added.

---

### Missing `apple-touch-icon` Link Tag (P1) — ✅ Fixed

iOS Safari does not read `manifest.json` for the home screen icon. It requires an explicit `<link>` tag in `<head>`.

**Fixed:** `metadata.icons` added to `app/layout.tsx`:

```ts
icons: {
  apple: '/icons/apple-touch-icon.png',
  icon: '/icons/icon-192.png',
},
```

> Note: The icon files `/icons/apple-touch-icon.png` and `/icons/icon-192.png` still need to be created by the designer (see Root Cause section above).

---

### `next.config.ts` — `output: 'standalone'` and Vercel (P1) — ⚠️ Correction

> **Correction from previous assessment:** `output: 'standalone'` IS supported by Vercel natively. Vercel's build system detects it and serves `public/` assets correctly regardless of output mode. **Do not remove this flag** — it is required for Docker deployment. The earlier recommendation to remove it was incorrect.

The real cause of PWA not working on Vercel is the missing icon files, not the output mode.

---

### manifest.json — Missing Recommended Fields (P2)

Add these fields to `public/manifest.json` for a complete install experience:

```json
{
  "id": "/",
  "scope": "/",
  "lang": "vi",
  "dir": "ltr",
  "categories": ["education", "kids"],
  "screenshots": [
    {
      "src": "/icons/screenshot-dashboard.png",
      "sizes": "1280x800",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard view"
    }
  ]
}
```

Screenshots appear in the Chrome/Android install dialog and significantly increase install conversion.

---

### Service Worker — `CACHE_VERSION` Not Tied to Build (P2)

```ts
// CURRENT — manual string bump required on every deploy
const CACHE_VERSION = 'kid-hub-v1'
```

If `CACHE_VERSION` is not bumped on deploy, users may receive stale cached HTML after a Vercel deployment. The service worker activate handler deletes old caches only if the version string changes.

**Fix options:**

- Inject build hash at build time via `next.config.ts` environment variable
- Or adopt a library like `next-pwa` or `serwist` that handles cache versioning automatically

---

### Summary Checklist

| Item | Priority | Status |
|---|---|---|
| Create `public/icons/icon-192.png` (192 × 192) | P0 | ✅ Done — `scripts/gen-icons.js` |
| Create `public/icons/icon-512.png` (512 × 512, maskable) | P0 | ✅ Done |
| Create `public/icons/apple-touch-icon.png` (180 × 180) | P1 | ✅ Done |
| Fix `manifest.json` `orientation` → `"any"` | P1 | ✅ Done |
| Add `metadata.icons.apple` in `app/layout.tsx` | P1 | ✅ Done |
| Add `id`, `scope`, `lang`, `dir`, `categories` to `manifest.json` | P1 | ✅ Done |
| ~~Remove `output: 'standalone'` from `next.config.ts`~~ — N/A, Vercel supports it | ~~P1~~ | ⚠️ Not needed |
| Add `screenshots` to `manifest.json` | P2 | ⏳ Needs designer |
| Tie `CACHE_VERSION` to build hash | P2 | ✅ Done — `?v=NEXT_PUBLIC_BUILD_ID` param on SW registration; SW reads via `URLSearchParams(self.location.search)` |
