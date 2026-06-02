# Improvement Plan — Kid Hub

**Last updated:** 2026-06-01

This document details what must be added, fixed, or optimized within each **existing** module and function to meet the final product requirements. It covers gaps in current implementations only — new features belong in `project-develop.md`.

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

| Gap | What to Add |
|---|---|
| Missing `WHERE userId = DEFAULT_USER_ID` guard (BUG-009) | Add userId filter to all schedule repository mutations |

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

| Gap | What to Add |
|---|---|
| Does not award points on completion | After marking done: call `progressRepo.addPoints(DEFAULT_USER_ID, item.points)`; return `points` in response |
| Does not log activity event | After marking done: call `activityRepo.logActivity(HOMEWORK_DONE, label)` |
| No streak update | After marking done: call `progressRepo.updateStreak(DEFAULT_USER_ID, todayDateKey())` |

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

| Gap | What to Add |
|---|---|
| No `error.tsx` in `(dashboard)`, `(games)`, `(parent)` | Create `app/(dashboard)/error.tsx`, `app/(games)/error.tsx`, `app/(parent)/error.tsx` with user-friendly error message + retry button |

### All Routes Without `loading.tsx`

| Route | Add |
|---|---|
| `/dashboard` | `app/(dashboard)/dashboard/loading.tsx` — skeleton with sidebar + cards |
| `/grades` | `app/(dashboard)/grades/loading.tsx` — skeleton with subject cards |
| `/homework` | `app/(dashboard)/homework/loading.tsx` — skeleton with list rows |

---

## 9. Security

### `next.config.ts`

| Gap | What to Add |
|---|---|
| No HTTP security headers | Add `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` |

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
// CURRENT — forces landscape on all devices
"orientation": "landscape"

// CORRECT — lets each device use its natural orientation
"orientation": "any"
```

The app supports both orientations via `portrait:` / `landscape:` CSS variants. Locking to `"landscape"` means the PWA launches sideways on phones and fails iOS installation criteria.

---

### Missing `apple-touch-icon` Link Tag (P1)

iOS Safari does not read `manifest.json` for the home screen icon. It requires an explicit `<link>` tag in `<head>`.

**Fix:** Add to `app/layout.tsx` inside `metadata.icons`:

```ts
export const metadata: Metadata = {
  // ...existing fields...
  icons: {
    apple: '/icons/apple-touch-icon.png',  // 180 × 180 px
    icon: '/icons/icon-192.png',
  },
}
```

Without this, iOS shows a blurry webpage screenshot as the home screen icon instead of the app icon.

---

### `next.config.ts` — Remove `output: 'standalone'` for Vercel (P1)

```ts
// CURRENT — standalone output is for Docker/self-hosted only
const nextConfig: NextConfig = {
  output: 'standalone',
  // ...
}

// CORRECT for Vercel — remove the output field entirely
const nextConfig: NextConfig = {
  // no output field
  // ...
}
```

Vercel's build system handles routing and static asset serving natively. The `standalone` output bundles the app differently and can prevent `public/` files (including `manifest.json` and `sw.js`) from being served at their expected paths. Remove this flag when deploying to Vercel.

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
| Create `public/icons/icon-192.png` (192 × 192) | P0 | ❌ Missing |
| Create `public/icons/icon-512.png` (512 × 512, maskable) | P0 | ❌ Missing |
| Create `public/icons/apple-touch-icon.png` (180 × 180) | P1 | ❌ Missing |
| Fix `manifest.json` `orientation` → `"any"` | P1 | ❌ Wrong value |
| Add `metadata.icons.apple` in `app/layout.tsx` | P1 | ❌ Missing |
| Remove `output: 'standalone'` from `next.config.ts` for Vercel | P1 | ❌ Present |
| Add `id`, `scope`, `lang` to `manifest.json` | P2 | ❌ Missing |
| Add `screenshots` to `manifest.json` | P2 | ❌ Missing |
| Tie `CACHE_VERSION` to build hash | P2 | ❌ Manual string |
