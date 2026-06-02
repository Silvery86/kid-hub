# Development Roadmap — Kid Hub

**Last updated:** 2026-06-01

This document describes **new features** that must be built to fulfill product-market fit. It covers only net-new capabilities — improvements to existing functions belong in `project-imp.md`.

---

## Priority Legend

| Label | Meaning |
|---|---|
| P0 | Blocking — must exist before daily household use |
| P1 | Required for full product value |
| P2 | Quality-of-life; good to ship before v1.0 |

---

## P0 — Must Ship First

### F-001: CI/CD Pipeline

**Why:** No automated quality gate means broken TypeScript or ESLint failures can reach main. This is the single highest-risk gap.

**What to build:**

- `.github/workflows/ci.yml` — runs `npm run lint`, `npx tsc --noEmit`, `npm run build` on every push and pull request
- Optional: add Playwright smoke test job (even just one test)

**Acceptance criteria:**

- Pull requests to main are blocked if CI fails
- Build time < 5 minutes
- Zero manual steps required

---

### F-002: Unified Homework Reward Loop

**Why:** Two separate completion flows (`toggleHomeworkDoneAction` and `markHomeworkDoneAction`) award points inconsistently. The child's progress data is unreliable.

**What to build:**

- Single `completeHomeworkAction(itemId: string, source: 'daily' | 'period')` that:
  1. Marks the correct table record as done
  2. Awards points to `UserProgress`
  3. Logs `ActivityEvent` (HOMEWORK_DONE)
  4. Updates streak if first activity of the day
  5. Returns `{ points: number; streakUpdated: boolean }`
- Deprecate and remove `markHomeworkDoneAction` and the points-less path in `toggleHomeworkDoneAction`

**Acceptance criteria:**

- Every homework completion awards exactly 10 points regardless of source
- Activity feed always shows homework completions
- No duplicate point awards if somehow called twice (idempotent)

---

### F-003: Progress Persistence (DB as Source of Truth)

**Why:** `UserProgress` (points, streaks, badges) is stored in localStorage. Any storage clear resets the child's entire progress history. The DB `user_progress` table is unused.

**What to build:**

- `getProgressAction()` — reads from `UserProgress` table; returns full progress object
- `addPointsAction(amount: number)` — atomically increments `totalPoints` in DB
- `updateStreakAction()` — atomically updates `currentStreak` + `lastActiveDate`
- Update `useUserProgress` hook:
  - On mount: call `getProgressAction()`; seed localStorage cache
  - On `addPoints`: call `addPointsAction()` + optimistic localStorage update
  - On `updateStreak`: call `updateStreakAction()` + optimistic update
  - On mount conflict (DB > localStorage): use DB value

**Acceptance criteria:**

- Clearing localStorage does not lose progress
- Reload shows correct point and streak values from DB
- Optimistic updates feel instant (< 50 ms local feedback)

---

## P1 — Required for Full Product Value

### F-004: Route-Level Error Boundaries

**Why:** Any DB error or uncaught exception produces a blank white screen. This is unacceptable for a child-facing app.

**What to build:**

- `app/(dashboard)/error.tsx` — "Oops, something went wrong" with retry button and home link
- `app/(games)/error.tsx` — same pattern with game-themed illustration
- `app/(parent)/error.tsx` — clean error page with sign-out link
- `app/(dashboard)/dashboard/loading.tsx` — skeleton matching `DashboardView` layout
- `app/(dashboard)/grades/loading.tsx` — skeleton matching `GradesView` layout
- `app/(dashboard)/homework/loading.tsx` — skeleton matching `HomeworkListView` layout

**Acceptance criteria:**

- DB timeout on any page shows error screen, not blank white
- Retry button re-attempts the server fetch
- All routes show skeleton on first load (no layout shift)

---

### F-005: Badge System Completion

**Why:** 10 badges are defined but most triggers are never wired. The child can never earn most badges, breaking the core engagement loop.

**What to build:**

- `checkAndAwardBadgesAction(userId, context: BadgeCheckContext)` — centralized badge evaluation
- Badge trigger wiring:

| Badge | Trigger Event | Check |
|---|---|---|
| `first-login` | First `verifyKidPatternAction` success | `earnedBadges.length === 0` |
| `game-win` | Any `saveMathProgressAction` or `saveEnglishProgressAction` | First completion ever |
| `math-ace` | `upsertGradeAction` with subjectId=math | score ≥ 9 |
| `reading-star` | `upsertGradeAction` with subjectId=vietnamese | score ≥ 9 |
| `english-hero` | Any `saveEnglishProgressAction` | First English completion |
| `perfect-10` | `upsertGradeAction` | score === 10 |
| `streak-3` | `updateStreakAction` | currentStreak === 3 |
| `streak-7` | `updateStreakAction` | currentStreak === 7 |
| `all-green` | After any grade upsert | All subjects ≥ 7 (good) |
| `top-score` | `saveMathProgressAction` / `saveEnglishProgressAction` | New best score overall |

- Badge earn animation: show `BadgeModal` on next page load after earning (store pending badge in DB)

**Acceptance criteria:**

- Every badge has exactly one trigger point
- Earning a badge shows the `BadgeModal` within the same session
- No duplicate badge awards

---

### F-006: Security Headers

**Why:** No HTTP security headers means the app is exposed to XSS, clickjacking, and content-type sniffing.

**What to build:**

Add to `next.config.ts` in `headers()`:

```ts
{
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data:",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
```

**Acceptance criteria:**

- Security headers visible in browser DevTools → Network → response headers
- No CSP violations in console on any page

---

### F-007: Full Activity Feed View

**Why:** `RecentActivityPanel` only shows the last few events in a small widget. Parents need a proper history view to understand the child's weekly progress.

**What to build:**

- `app/(parent)/parent/activity/page.tsx` — dedicated activity feed page
- `components/parent/ActivityFeedView.tsx`:
  - Events grouped by date (Today, Yesterday, This Week)
  - Filter by type (Games, Homework, All)
  - Paginated (20 per page)
  - Empty state per filter
- `getActivityFeedAction(page, type?)` — paginated + filtered query
- Add "View all activity →" link from `RecentActivityPanel`

**Acceptance criteria:**

- Parent can scroll through full history
- Date grouping makes week-at-a-glance readable
- Filter by game or homework events

---

## P2 — Quality of Life

### F-008: Schedule Copy Week / Templates

**Why:** Creating each period manually is time-consuming. A typical school week has 30–40 periods. Copy-week reduces setup from 30 minutes to 1 minute.

**What to build:**

- `copyWeekAction(sourceWeek, targetWeek)` — copies all SCHOOL_PERIOD entries to another week's date range
- `applyScheduleTemplateAction(templateId)` — applies predefined template (e.g. "Standard Grade 1 Vietnam")
- `ScheduleTemplateSelector` component in `ScheduleManager`
- At minimum: "Copy this week to next week" single-button flow

---

### F-009: Adaptive Practice Recommendations

**Why:** Grade scores and game history are recorded but never consumed to guide the child's next steps. This is the core personalization opportunity.

**What to build:**

- `getRecommendationsAction()` — compares weak subjects (grade < 7) to available games; returns top 2 suggestions
- `RecommendationCard` component on dashboard — "You should practice: [Subject]"
- Logic: if `math` grade < 7 and last math game > 3 days ago → recommend math game

---

### F-010: Offline Homework Sync Queue

**Why:** On slow connections, tapping a homework checkbox fails silently. The child sees no feedback and the item stays unchecked.

**What to build:**

- IndexedDB queue in `useLocalStorage` for pending `completeHomeworkAction` calls
- Service worker intercepts failed action POST → stores in queue
- On reconnect: replay queue in order
- UI indicator: "Saving…" / "Saved ✓" / "⚠ Saved offline — will sync"

---

### F-011: Parent Notification Center

**Why:** Parents currently have no way to know when the child earned a badge or completed homework without actively opening the app.

**What to build:**

- In-app notification dot on `ParentSidebarNav` when new activity since last visit
- `lastParentVisitAt` timestamp in `User` table
- Notification count badge on "Kid Access" nav item

---

### F-012: Science / Art / Music Games

**Why:** Three "coming soon" placeholders exist in the games hub. These represent the next content expansion.

**What to build per game:**

- Game component (following same pattern as `CountingGame`, `AlphabetGame`)
- Level data in `lib/data/`
- Server action (following `saveMathProgressAction` pattern)
- Repository (following `math.repository.ts` pattern)

Suggested order: Science (highest curriculum relevance) → Art → Music.

---

## Architecture Decisions Required Before Building

| Decision | Context | Recommendation |
|---|---|---|
| `UserProgress` migration | Move from localStorage to DB (F-003) | DB is authoritative; localStorage is cache only |
| Badge award timing | Immediate vs deferred | Award immediately in action; queue `BadgeModal` via DB flag |
| Offline strategy | IndexedDB queue vs optimistic-only | IndexedDB queue for homework; optimistic-only for games |
| Activity feed pagination | Cursor vs offset | Cursor-based (by `createdAt`) for infinite scroll |
