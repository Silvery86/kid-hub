# Kid Hub — Deep-Dive Developer Guide

> **Purpose:** A single reference document explaining every part of the codebase — architecture,
> data models, auth flows, feature modules, and how each function works end-to-end.
> Written for a developer who wants a complete mental map before touching any code.

---

## Table of Contents

1. [High-Level Overview](#1-high-level-overview)
2. [Technology Stack](#2-technology-stack)
3. [Directory Structure](#3-directory-structure)
4. [Database Schema](#4-database-schema)
5. [Authentication System](#5-authentication-system)
6. [Middleware](#6-middleware)
7. [Server Layer (Repositories → Services → Actions)](#7-server-layer)
8. [Feature Modules](#8-feature-modules)
   - [Dashboard](#81-dashboard)
   - [Schedule](#82-schedule)
   - [Homework](#83-homework)
   - [Grades](#84-grades)
   - [Math Game](#85-math-game)
   - [English Game](#86-english-game)
   - [Rewards & Badges](#87-rewards--badges)
   - [Screen Time](#88-screen-time)
   - [Kid Access Settings](#89-kid-access-settings)
   - [Parent Dashboard](#810-parent-dashboard)
9. [Client Hooks](#9-client-hooks)
10. [Key Constants & Utilities](#10-key-constants--utilities)
11. [Complete Request Flow Diagrams](#11-complete-request-flow-diagrams)

---

## 1. High-Level Overview

Kid Hub is a **single-household family dashboard** built for one parent account and one kid profile
(hardcoded user ID: `khoi-default-user`).

The app has two separate surfaces:

| Surface            | Route group              | Who uses it                                    |
| ------------------ | ------------------------ | ---------------------------------------------- |
| **Kid Surface**    | `(dashboard)`, `(games)` | The child — schedule, homework, learning games |
| **Parent Surface** | `(parent)`               | The parent — manage schedule, grades, settings |

**Entry point:**

- Root `/` immediately redirects to `/kid-unlock`.
- The kid enters a 2-symbol pattern to start a _kid session_.
- The parent navigates to `/parent/login`, authenticates with email + password, then uses a 4-digit PIN for subsequent visits.

---

## 2. Technology Stack

| Layer            | Technology                                                                 |
| ---------------- | -------------------------------------------------------------------------- |
| Framework        | Next.js 15 (App Router, React 19)                                          |
| Styling          | Tailwind CSS v4 — design tokens live in `app/globals.css` `@theme {}` only |
| Font             | Nunito (Google Fonts) via `next/font`                                      |
| Database ORM     | Prisma 7 (`prisma-client-js`, driver adapters)                             |
| Database         | PostgreSQL                                                                 |
| Auth tokens      | `jose` — HMAC-SHA256 JWTs                                                  |
| Password hashing | `bcryptjs` (12 rounds)                                                     |
| Rate limiting    | Upstash Redis sliding window (`@upstash/ratelimit`)                        |
| Validation       | Zod                                                                        |
| PWA              | `manifest.json` + service worker                                           |
| Tests (planned)  | Playwright (e2e/)                                                          |

---

## 3. Directory Structure

```
kid-hub/
├── app/                        # Next.js App Router pages
│   ├── (dashboard)/            # Kid route group
│   │   ├── dashboard/          # /dashboard page
│   │   ├── schedule/           # /schedule page
│   │   ├── grades/             # /grades page
│   │   ├── homework/           # /homework page
│   │   └── unlock/             # /unlock sub-page (kid re-lock)
│   ├── (games)/                # Games route group
│   │   ├── math/               # /math mini-game
│   │   └── english/            # /english mini-game
│   ├── (parent)/               # Parent route group
│   │   └── parent/
│   │       ├── login/          # /parent/login
│   │       ├── pin/            # /parent/pin (PIN gate)
│   │       ├── kid-access/     # /parent/kid-access (feature toggles)
│   │       └── page.tsx        # /parent (parent dashboard)
│   ├── kid-unlock/             # /kid-unlock — pattern unlock screen
│   ├── layout.tsx              # Root layout (font, PWA metadata)
│   ├── page.tsx                # Root page (redirects to /kid-unlock)
│   └── globals.css             # Tailwind base + design tokens
│
├── server/                     # All server-only code
│   ├── repositories/           # Prisma queries — no business logic
│   ├── services/               # Business logic — pure functions
│   └── actions/                # Next.js Server Actions — auth guard + Zod + orchestrate
│
├── components/                 # React UI components
│   ├── ui/                     # Generic primitives (button, card, etc.)
│   ├── dashboard/              # Dashboard domain components
│   ├── games/                  # Game UI components
│   ├── grades/                 # Grades components
│   ├── homework/               # Homework components
│   ├── parent/                 # Parent dashboard components
│   ├── badges/                 # Badge display components
│   ├── kid/                    # Kid unlock + profile components
│   ├── layout/                 # Page containers, nav, service worker
│   └── unlock/                 # Pattern lock UI
│
├── hooks/                      # Client-only React hooks
│   ├── useGameSession.ts       # Core game state machine
│   ├── useMathSession.ts       # Math game logic + server submission
│   ├── useEnglishSession.ts    # English game logic + server submission
│   ├── useSchedule.ts          # Schedule read/write hook
│   ├── useGrades.ts            # Grades read/write hook
│   ├── useUserProgress.ts      # Points, streaks, badges polling
│   └── useLocalStorage.ts      # Generic localStorage hook
│
├── lib/                        # Shared pure utilities (client + server safe)
│   ├── constants.ts            # ALL app-wide constants
│   ├── db.ts                   # Prisma client singleton
│   ├── utils.ts                # calculateScore, clamp, formatDate
│   ├── grading.ts              # calculateBadge()
│   ├── rate-limit.ts           # Upstash rate limiter factory
│   ├── schedule-display.ts     # Schedule display helpers
│   ├── grades-display.ts       # Badge colour/label helpers
│   └── data/                   # Static data constants
│       ├── subjects.ts         # SUBJECTS list
│       ├── badges.ts           # BADGE_DEFINITIONS
│       ├── mathLevels.ts       # Math question generators per level
│       ├── englishLevels.ts    # English question generators
│       ├── countingLevels.ts   # Counting mini-game levels
│       ├── shapeLevels.ts      # Shapes mini-game levels
│       ├── games-hub.ts        # Games hub card config
│       ├── grades.ts           # Grade scale helpers
│       ├── kid-access.ts       # Feature toggle definitions
│       └── schedule.ts         # Schedule display constants
│
├── prisma/
│   ├── schema.prisma           # Database schema (source of truth)
│   ├── seed.ts                 # Seed: creates the khoi-default-user record
│   └── migrations/             # SQL migration history
│
├── middleware.ts               # Edge middleware — session guards + rate limiting
├── types/index.ts              # ALL shared TypeScript types (single source of truth)
└── lib/constants.ts            # ALL app constants
```

---

## 4. Database Schema

### Core design decisions

- **Single user** — all tables use `userId` as a scope filter. The fixed ID is
  `khoi-default-user` (set by `DEFAULT_USER_ID` constant, created by `prisma/seed.ts`).
- **No record = not done** — homework completion is stored by presence, not a boolean on
  every class period.
- **Dates as strings** — all dates stored as `"YYYY-MM-DD"` strings to avoid timezone
  confusion; only `createdAt`/`updatedAt` are real `DateTime`.

### Models

#### `User`

The single household record. Key fields:

| Field                                                             | Purpose                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------ |
| `parentEmail` / `parentPasswordHash`                              | Parent account login credentials                       |
| `parentLoginAttempts` / `parentLoginLockedUntil`                  | Login brute-force protection                           |
| `refreshTokenHash` / `refreshTokenExpiresAt`                      | Server-side stored refresh token                       |
| `kidPatternHash` / `kidPatternAttempts` / `kidPatternLockedUntil` | Kid pattern lock                                       |
| `kidAccessSettings`                                               | JSON blob of feature toggles `{ featureKey: boolean }` |
| `screenTimeLimitMins`                                             | Parent-set daily screen time cap (default 120 min)     |

#### `ParentPin`

A separate model (not on `User`) storing the 4-digit parent PIN hash. One-to-one with `User`.

#### `ClassPeriod`

Weekly recurring time slots. Two types via `eventType`:

- `SCHOOL_PERIOD` — morning/afternoon school classes (1–10 per day), unique by `(userId, day, periodNumber)`.
- `EXTRA_CLASS` — evening tutoring/activity blocks; `periodNumber` is null; capped at
  `MAX_EVENING_BLOCKS_PER_DAY = 3` per day.

Both types share `startTime`/`endTime` (`"HH:MM"`), `subjectId`, optional `iconKey`.

#### `HomeworkCompletion`

One record per `(periodId, date)` when a **recurring class period** is marked done as homework.
Uses `@@unique([periodId, date])`.

#### `DailyHomework`

One-off homework tasks the parent creates for a specific date — not tied to a recurring period.
Has a `points` field (default 10) awarded on completion.

#### `ExtraClassOverride`

A per-date cancellation of a recurring `EXTRA_CLASS`. Creating this record makes the extra
class invisible on that specific date.

#### `SubjectGrade`

School report card grades. One entry per `(userId, subjectId, semester, academicYear)`.
Badge tier is derived from `score` via `calculateBadge()`.

#### `UserProgress`

Gamification totals: `totalPoints`, `currentStreak`, `lastActiveDate`.
One-to-one with `User`. Has child tables:

- `EarnedBadge` — which badge IDs the kid has earned.
- `GameBestScore` — best score per `(gameType, level, subType)`.

#### `MathProgress` / `EnglishProgress`

Session-level records for each completed mini-game play. Store correctCount, stars earned,
score, and optional `homeworkPeriodId` linking to a `DailyHomework` item.

#### `ScreenTimeLog`

One record per `(userId, date)` accumulating `totalSecs`. Updated every 60 seconds from
the client-side `ScreenTimeTracker` component.

#### `ActivityEvent`

Append-only event log for the parent activity feed.

- `type`: `GAME_COMPLETE` | `HOMEWORK_DONE`
- `label`: human-readable string
- `iconKey`: emoji

---

## 5. Authentication System

Kid Hub has **two independent session types** living in HTTP-only cookies.

### 5.1 Parent Authentication

**Tokens:**

| Cookie           | Type                      | TTL        | Purpose                                              |
| ---------------- | ------------------------- | ---------- | ---------------------------------------------------- |
| `parent_access`  | JWT `typ: parent-access`  | 15 minutes | Short-lived — carried on every parent request        |
| `parent_refresh` | JWT `typ: parent-refresh` | 30 days    | Long-lived — used to silently renew the access token |

**JWT payload:** `{ userId, typ, iat, exp }` — signed with `SESSION_SECRET` (HS256).

**Flow — First Login (`/parent/login`):**

```
User submits email + password
  → parentLoginAction()
    → getByParentEmail() — look up user
    → isLockedOut() — check brute-force state
    → comparePassword() — bcrypt compare
    → resetParentLoginAttempts()
    → issueParentSessionCookies()
        → createParentAccessToken()  — 15-min JWT
        → createParentRefreshToken() — 30-day JWT
        → hashTokenForStorage()      — bcrypt hash of refresh token
        → saveRefreshToken()         — store hash in DB
        → set cookies: parent_access + parent_refresh
```

**Flow — Subsequent visits (token renewal):**

```
Middleware reads parent_access cookie
  → valid? → allow through
  → invalid/expired? → read parent_refresh cookie
      → verify JWT signature + typ
      → getParentAuthRecord() — fetch stored hash from DB
      → compareStoredTokenHash() — validate refresh token not revoked
      → createParentAccessToken() — mint new 15-min access token
      → set parent_access cookie in response
```

**Lockout:** After 5 failed login attempts, `parentLoginLockedUntil` is set for 60 seconds.

### 5.2 Parent PIN

The PIN is a separate 4-digit code used as a **secondary gate** after the refresh token auto-renew.
The parent flow is:

1. Visit `/parent/login` → full email + password auth → receives access + refresh cookies.
2. On return visits the access cookie is auto-renewed by middleware.
3. `clearParentAccessAction()` can delete the access cookie, forcing the PIN gate
   (`/parent/pin`) to be used for re-entry without full login.

PIN verification (`verifyPinAction`) has its own lockout (5 attempts → 60s lock).

### 5.3 Kid Pattern Unlock

Kids unlock the app by entering a **2-symbol pattern** using symbols 1–6
(`KID_PATTERN_LENGTH = 2`, `KID_PATTERN_SYMBOLS = ['1','2','3','4','5','6']`).

| Cookie        | Type                   | TTL      |
| ------------- | ---------------------- | -------- |
| `kid_session` | JWT `typ: kid-session` | 12 hours |

**Flow:**

```
Kid enters pattern on /kid-unlock
  → verifyKidPatternAction(pattern)
    → getParentAuthRecord() — fetch kidPatternHash
    → isLockedOut() — check kidPatternAttempts
    → compareKidPattern() — bcrypt compare
    → resetKidPatternAttempts()
    → createKidSessionToken() — 12-hour JWT
    → set cookie: kid_session
    → redirect to /dashboard
```

**Lockout:** 5 wrong attempts → 30-second lock.

### 5.4 `auth.service.ts` — Crypto primitives

All hashing and token operations live here (server-only):

| Export                                    | What it does                                 |
| ----------------------------------------- | -------------------------------------------- |
| `hashPin(pin)`                            | bcrypt hash of 4-digit PIN                   |
| `hashPassword(pw)`                        | bcrypt hash of parent password               |
| `hashKidPattern(p)`                       | bcrypt hash of kid pattern                   |
| `comparePin/Password/KidPattern`          | bcrypt.compare wrappers                      |
| `createParentAccessToken(userId)`         | Signs 15-min JWT                             |
| `createParentRefreshToken(userId)`        | Signs 30-day JWT                             |
| `createKidSessionToken(userId)`           | Signs 12-hour JWT                            |
| `verifyParentAccessToken(token)`          | Verifies and returns `{ userId, expiresAt }` |
| `verifyParentRefreshToken(token)`         | Same for refresh                             |
| `verifyKidSessionToken(token)`            | Same for kid session                         |
| `hashTokenForStorage(token)`              | bcrypt hash of refresh JWT (stored in DB)    |
| `compareStoredTokenHash(token, hash)`     | Validates refresh token wasn't revoked       |
| `isLockedOut(attempts, lockedUntil)`      | Returns true if account is locked            |
| `getLockoutSecondsRemaining(lockedUntil)` | Returns seconds until unlock                 |

---

## 6. Middleware

`middleware.ts` runs on Next.js Edge Runtime and handles **three responsibilities**:

### 6.1 Kid Route Protection

Paths matched: `/`, `/dashboard/*`, `/schedule/*`, `/grades/*`, `/homework/*`, `/games/*`,
`/math/*`, `/english/*`, `/unlock/*`

```
Request arrives at kid path
  → read kid_session cookie
  → absent? → redirect /kid-unlock
  → present but invalid JWT? → delete cookie + redirect /kid-unlock
  → valid? → NextResponse.next()
```

### 6.2 Parent Route Protection

Paths matched: `/parent/*` (except `/parent/login` and `/parent/pin`)

```
Request arrives at protected parent path
  → read parent_access cookie
  → valid? → NextResponse.next()
  → invalid/absent? → read parent_refresh cookie
      → valid refresh? → mint new parent_access → set cookie → NextResponse.next()
      → invalid refresh? → delete both cookies → redirect /parent/login
```

### 6.3 Rate Limiting

POST requests to `/parent/login` and `/parent/pin` are rate-limited via Upstash sliding window
(configured in `lib/rate-limit.ts`). Returns HTTP 429 with `Retry-After` header on excess.

---

## 7. Server Layer

The server is organised into three strict layers:

```
Action  →  Service  →  Repository  →  Prisma  →  PostgreSQL
```

### 7.1 Repositories (`server/repositories/`)

**Rule:** Prisma only. No business logic. Every mutation WHERE-clause must include `userId`.

| File                        | Key functions                                                                                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user.repository.ts`        | `getPin`, `savePin`, `getParentAuthRecord`, `saveRefreshToken`, `saveKidPattern`, `getKidAccessSettings`                                                                                          |
| `schedule.repository.ts`    | `getWeeklySchedule`, `getDaySchedule`, `createPeriod`, `updatePeriod`, `deletePeriod`, `getEveningBlocks`, `createOverride`, `getDailyHomework`, `createDailyHomework`, `toggleDailyHomeworkDone` |
| `homework.repository.ts`    | `getTodayHomework`, `markDone`                                                                                                                                                                    |
| `grades.repository.ts`      | `getReportCard`, `upsertGrade`                                                                                                                                                                    |
| `math.repository.ts`        | `saveMathProgress`, `getMathBestScore`, `upsertMathBestScore`, `addUserPoints`                                                                                                                    |
| `english.repository.ts`     | `saveEnglishProgress`, `getEnglishBestScore`, `upsertEnglishBestScore`                                                                                                                            |
| `progress.repository.ts`    | `getUserProgress`, `addUserPoints`, `updateStreak`, `getEarnedBadgeIds`, `awardBadge`, `getTotalGameCount`                                                                                        |
| `activity.repository.ts`    | `saveActivityEvent`, `getRecentActivity`                                                                                                                                                          |
| `screen-time.repository.ts` | `addScreenTime`, `getScreenTimeToday`, `getScreenTimeLimit`, `setScreenTimeLimit`                                                                                                                 |

### 7.2 Services (`server/services/`)

**Rule:** `import 'server-only'`. Pure functions. All business rules here, never in actions.

| File                  | What it does                                                                                                                                                                                          |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `auth.service.ts`     | All crypto: hashing, JWT creation/verification, lockout logic                                                                                                                                         |
| `math.service.ts`     | `saveMathSession` — star calculation, best score update, points award, homework linkage; `getTodayMathHomework`                                                                                       |
| `english.service.ts`  | Same as math but for English sessions                                                                                                                                                                 |
| `grades.service.ts`   | `calculateBadge(score)` — returns `excellent`/`good`/`needs-practice`; `buildReportCard()` — assembles full report from raw grades                                                                    |
| `homework.service.ts` | `todayDateKey()` — returns `"YYYY-MM-DD"`; `todayDayOfWeek()` — returns current day enum                                                                                                              |
| `schedule.service.ts` | `validatePeriodOverlap()` — checks if a new period overlaps existing ones; `buildTodayView()` — merges school periods + evening blocks + overrides + homework into `TodayView`; `jsDateToDayOfWeek()` |
| `rewards.service.ts`  | `checkAndAwardGameWinBadge()`, `checkAndAwardFirstLoginBadge()`, `checkAndAwardStreakBadges()`                                                                                                        |
| `activity.service.ts` | `recordActivity()` — fire-and-forget event logging; `fetchRecentActivity()`                                                                                                                           |

### 7.3 Actions (`server/actions/`)

**Rule:** Every file has `'use server'`. All mutations validate with Zod. Parent-facing mutations
call `requireParentSession()` first.

| File                      | Actions exposed                                                                                                                                                                                                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `auth.actions.ts`         | `registerParentAccountAction`, `parentLoginAction`, `refreshParentSessionAction`, `checkParentSessionAction`, `setKidPatternAction`, `verifyKidPatternAction`, `checkKidSessionAction`, `signOutParentAction`, `signOutKidAction`, `checkParentPinAction`, `clearParentAccessAction`, `setPinAction`, `verifyPinAction`                    |
| `schedule.actions.ts`     | `getScheduleAction`, `getTodayViewAction`, `getAllEveningBlocksAction`, `getDailyHomeworkByDateAction`, `createPeriodAction`, `updatePeriodAction`, `deletePeriodAction`, `createExtraClassAction`, `cancelExtraClassAction`, `restoreExtraClassAction`, `addDailyHomeworkAction`, `toggleHomeworkDoneAction`, `deleteDailyHomeworkAction` |
| `homework.actions.ts`     | `getTodayHomeworkAction`, `markHomeworkDoneAction`                                                                                                                                                                                                                                                                                         |
| `grades.actions.ts`       | `getReportCardAction`, `upsertGradeAction`                                                                                                                                                                                                                                                                                                 |
| `math.actions.ts`         | `saveMathProgressAction`, `getTodayMathHomeworkAction`                                                                                                                                                                                                                                                                                     |
| `english.actions.ts`      | `saveEnglishProgressAction`, `getTodayEnglishHomeworkAction`                                                                                                                                                                                                                                                                               |
| `rewards.actions.ts`      | `awardPointsAction`                                                                                                                                                                                                                                                                                                                        |
| `screen-time.actions.ts`  | `addScreenTimeAction`, `getScreenTimeAction`, `setScreenTimeLimitAction`                                                                                                                                                                                                                                                                   |
| `kid-access.actions.ts`   | `getKidAccessSettingsAction`, `saveKidAccessSettingsAction`, `getRecentActivityAction`                                                                                                                                                                                                                                                     |
| `kid-progress.actions.ts` | Progress/streak query actions for the kid surface                                                                                                                                                                                                                                                                                          |

---

## 8. Feature Modules

### 8.1 Dashboard

**Route:** `/dashboard` → `app/(dashboard)/dashboard/page.tsx`

**Server side (page component):**

1. `getScheduleAction()` — full weekly schedule
2. `getTodayHomeworkAction()` — today's homework items
3. `getTodayViewAction()` — today's combined view (school + evening + cancelled + homework)

All three run in parallel with `Promise.all`.

**Client side:** `DashboardView` component receives pre-fetched data as props and renders:

- Today's school period timeline
- Evening blocks
- Homework checklist chips
- Quick access to games

---

### 8.2 Schedule

**Routes:** `/schedule` (kid read-only) · `/parent` (parent CRUD)

**Data model:**

- `ClassPeriod` records — either `SCHOOL_PERIOD` or `EXTRA_CLASS`.
- `DailyHomework` records — one-off tasks per date.
- `ExtraClassOverride` records — per-date cancellations.

**Key action flows:**

_Create school period (parent):_

```
createPeriodAction(input)
  → requireParentSession()
  → CreatePeriodSchema.safeParse(input)
  → getDaySchedule() — fetch existing periods for that day
  → validatePeriodOverlap() — reject if times clash
  → scheduleRepo.createPeriod({ eventType: 'SCHOOL_PERIOD' })
  → revalidatePath('/dashboard', '/schedule')
```

_Cancel extra class for a specific date (parent):_

```
cancelExtraClassAction(periodId, date, reason?)
  → requireParentSession()
  → scheduleRepo.createOverride(periodId, userId, date, reason)
  → revalidatePath('/schedule')
```

_Toggle daily homework done (kid):_

```
toggleHomeworkDoneAction(id, isDone)
  → scheduleRepo.toggleDailyHomeworkDone(id, userId, isDone)
  → if isDone:
      recordActivity('HOMEWORK_DONE', label, icon)
      updateStreak(userId)
      addUserPoints(userId, item.points)
      checkAndAwardStreakBadges(userId, newStreak)
  → revalidatePath('/schedule')
```

_Build TodayView (used on dashboard + schedule):_

```
getTodayViewAction()
  → jsDateToDayOfWeek(today)
  → Promise.all([
      getDaySchedule(userId, dow),       // school periods
      getEveningBlocks(userId, dow),     // extra classes
      getOverridesForDate(userId, date), // cancellations today
      getDailyHomework(userId, date),    // one-off homework
    ])
  → buildTodayView(date, schoolPeriods, eveningBlocks, cancelledIds, homework)
     → filters cancelled extra classes out of eveningBlocks
     → returns TodayView { date, schoolPeriods, eveningBlocks, cancelledIds, homework }
```

---

### 8.3 Homework

**Route:** `/homework`

The homework page primarily works with `DailyHomework` (one-off parent-created tasks).

_Mark done (kid):_

```
markHomeworkDoneAction(periodId)
  → homeworkRepo.markDone(periodId, userId, todayDateKey())
  → updateStreak(userId)
  → addUserPoints(userId, 10)
  → recordActivity('HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
  → revalidatePath('/homework', '/dashboard')
```

---

### 8.4 Grades

**Route:** `/grades` (kid read-only) · parent can enter scores via parent dashboard

**`calculateBadge(score)`** (in `grades.service.ts`):

```
score >= 9  → 'excellent'
score >= 7  → 'good'
score < 7   → 'needs-practice'
```

_Upsert grade (parent):_

```
upsertGradeAction(input)
  → requireParentSession()
  → UpsertGradeSchema.safeParse({ subjectId, score, semester, academicYear })
  → calculateBadge(score)
  → gradesRepo.upsertGrade(userId, { ...data, badge })
  → revalidatePath('/grades', '/dashboard')
```

`buildReportCard(userId, grades)` in `grades.service.ts` aggregates raw grade records into the
`ReportCard` shape with an `averageScore` calculation.

---

### 8.5 Math Game

**Route:** `/math`

Three mini-games: **counting** · **addition** · **shapes**

**Difficulty levels:** 1 (easy), 2 (medium), 3 (hard) — question generators in `lib/data/mathLevels.ts`,
`lib/data/countingLevels.ts`, `lib/data/shapeLevels.ts`.

**Question timers:**

- Addition / math: `GAME_SECONDS_PER_QUESTION = 10s`
- Counting: `COUNTING_SECONDS_PER_QUESTION = 15s`
- Shapes: `SHAPE_SECONDS_PER_QUESTION = 12s`

**Session lifecycle (client):**

```
useGameSession hook (state machine)
  States: idle → playing → result

  START action:
    status = 'playing', timer starts

  Per question:
    ANSWER_CORRECT → correctCount++, advance question, reset timer
    ANSWER_WRONG   → advance question, reset timer (no correctCount change)
    TICK           → secondsLeft--; if secondsLeft <= 0, treat as wrong

  Last question answered → status = 'result'

  Stars calculation:
    score% = (correctCount / 10) * 100
    >= 90% → 3 stars
    >= 60% → 2 stars
    < 60%  → 1 star

  Points = correctCount * 10 * stars (clamped 0–300)
```

**Session save (server):**

```
saveMathProgressAction(input)
  → SaveMathProgressSchema.safeParse(input)
  → saveMathSession(userId, data)  ← math.service.ts
      → calculateStars(correctCount, 10)
      → getMathBestScore(userId, minigame, level)
      → saveMathProgress(...)                — always record session
      → if isNewBest: upsertMathBestScore()  — update leaderboard
      → addUserPoints(userId, pointsEarned)
      → if homeworkPeriodId: markDone(periodId, userId, date)
  → recordActivity('GAME_COMPLETE', label, '🧮')
  → checkAndAwardGameWinBadge(userId)
  → if homeworkPeriodId: revalidatePath('/homework', '/dashboard')
```

---

### 8.6 English Game

**Route:** `/english`

Three mini-games: **alphabet** · **vocabulary** · **phonics**

Mirrors the Math game architecture exactly:

- Question generators in `lib/data/englishLevels.ts`
- Timers: `ENGLISH_ALPHABET_SECONDS_PER_QUESTION = 12s`, `ENGLISH_WORD_SECONDS_PER_QUESTION = 15s`
- `useEnglishSession` hook wraps `useGameSession` with English-specific logic
- `saveEnglishProgressAction` → `english.service.ts` → `english.repository.ts`

---

### 8.7 Rewards & Badges

**Badge system:**

Badges are statically defined in `lib/data/badges.ts` (`BADGE_DEFINITIONS`). Earned state is
stored in `EarnedBadge` table.

| Badge ID       | Trigger                         |
| -------------- | ------------------------------- |
| `first-login`  | First kid session unlock        |
| `game-win`     | First completed game            |
| `streak-3`     | 3-day learning streak           |
| `streak-7`     | 7-day learning streak           |
| `math-ace`     | Excellent grade in Math         |
| `english-hero` | Completed English game          |
| `perfect-10`   | Score of 10 in any subject      |
| `all-green`    | All subjects at 'good' or above |
| `top-score`    | New personal best in a game     |

**Reward flow (triggered after game/homework):**

```
checkAndAwardGameWinBadge(userId)
  → getEarnedBadgeIds(userId)  — fetch already-earned list
  → if 'game-win' already there → return (no-op)
  → getTotalGameCount(userId)
  → if count >= 1 → awardBadge(userId, 'game-win')

checkAndAwardStreakBadges(userId, currentStreak)
  → getEarnedBadgeIds(userId)
  → if streak >= 3 && !streak-3 earned → awardBadge('streak-3')
  → if streak >= 7 && !streak-7 earned → awardBadge('streak-7')
```

**Streak logic (`updateStreak` in progress.repository.ts):**

- If `lastActiveDate` is yesterday → `currentStreak + 1`
- If `lastActiveDate` is today → no change (already counted)
- Otherwise → streak resets to 1

**Points:**

- Homework done: +10 points
- Game completion: `correctCount × 10 × stars` (1–300 pts)
- Stored in `UserProgress.totalPoints`

---

### 8.8 Screen Time

**Purpose:** Tracks how long the kid is using the app each day.

**Client:** A `ScreenTimeTracker` component (likely in `components/layout/`) calls
`addScreenTimeAction(60)` every 60 seconds while the kid surface is active.

**Actions:**

| Action                                | Who calls it       | What it does                                   |
| ------------------------------------- | ------------------ | ---------------------------------------------- |
| `addScreenTimeAction(secs)`           | Kid surface (auto) | Increments `ScreenTimeLog.totalSecs` for today |
| `getScreenTimeAction()`               | Parent dashboard   | Returns `{ usedSecs, limitMins }`              |
| `setScreenTimeLimitAction(limitMins)` | Parent dashboard   | Sets `User.screenTimeLimitMins` (30–480 min)   |

---

### 8.9 Kid Access Settings

**Purpose:** Parent can toggle which features (games, sections) are visible to the kid.

Stored as a JSON blob in `User.kidAccessSettings`: `Record<string, boolean>`.
Feature definitions live in `lib/data/kid-access.ts`.

**Actions:**

- `getKidAccessSettingsAction()` — parent reads current toggles
- `saveKidAccessSettingsAction(settings)` — parent saves new toggle map

---

### 8.10 Parent Dashboard

**Route:** `/parent`

**Page loads (server):**

```
Promise.all([
  getScheduleAction(),       → full weekly schedule
  getReportCardAction(),     → all subject grades
  getTodayViewAction(),      → today's combined view
])
```

**`ParentDashboardView` component** manages:

- Schedule CRUD (add/edit/delete periods, extra classes, daily homework)
- Grade entry per subject
- Activity feed (recent kid events)
- Screen time overview

---

## 9. Client Hooks

### `useGameSession` (base game state machine)

Manages the question/timer lifecycle for any game. Uses `useReducer` with actions:
`START`, `ANSWER_CORRECT`, `ANSWER_WRONG`, `TICK`, `FINISH`, `RESET`.

A `setInterval` of 1s fires `TICK` while `status === 'playing'`.
A 400ms transitioning lock (`isTransitioning`) prevents double-tap submissions.

**Returns:** `{ state, startGame, answerCorrect, answerWrong, resetGame, starsEarned, pointsEarned, scorePercent, isTransitioning }`

### `useMathSession`

Wraps `useGameSession` with math-specific logic:

- Provides question data from `lib/data/mathLevels.ts` based on level/minigame.
- On session end, calls `saveMathProgressAction()`.

### `useEnglishSession`

Same pattern as `useMathSession` for English mini-games.

### `useSchedule`

Client-side schedule management — calls schedule actions, manages optimistic state updates.

### `useGrades`

Calls `getReportCardAction` and `upsertGradeAction`, manages loading/error state.

### `useUserProgress`

Polls or fetches `UserProgress` data (points, streak, badges) for display on the dashboard.

### `useLocalStorage`

Generic `useState` wrapper that persists to `localStorage`. Used for caching schedule/progress
data client-side between navigations.

### `useAudio`

Manages game sound effects — plays correct/wrong audio feedback.

---

## 10. Key Constants & Utilities

### Auth constants (`lib/constants.ts`)

| Constant                      | Value                 | Meaning                          |
| ----------------------------- | --------------------- | -------------------------------- |
| `DEFAULT_USER_ID`             | `'khoi-default-user'` | Fixed single-household user ID   |
| `PARENT_ACCESS_TTL_SECONDS`   | `900` (15 min)        | Parent access token lifetime     |
| `PARENT_REFRESH_TTL_SECONDS`  | `2592000` (30 days)   | Parent refresh token lifetime    |
| `KID_SESSION_TTL_SECONDS`     | `43200` (12 hours)    | Kid session lifetime             |
| `MAX_PIN_ATTEMPTS`            | `5`                   | Failures before PIN lockout      |
| `PIN_LOCKOUT_SECONDS`         | `60`                  | PIN lockout duration             |
| `MAX_PARENT_LOGIN_ATTEMPTS`   | `5`                   | Failures before login lockout    |
| `KID_PATTERN_LENGTH`          | `2`                   | Number of symbols in kid pattern |
| `MAX_KID_PATTERN_ATTEMPTS`    | `5`                   | Failures before pattern lockout  |
| `KID_PATTERN_LOCKOUT_SECONDS` | `30`                  | Pattern lockout duration         |
| `MAX_EVENING_BLOCKS_PER_DAY`  | `3`                   | Extra class cap per day          |

### Game constants

| Constant                                | Value |
| --------------------------------------- | ----- |
| `GAME_QUESTIONS_PER_SESSION`            | `10`  |
| `GAME_SECONDS_PER_QUESTION`             | `10`  |
| `COUNTING_SECONDS_PER_QUESTION`         | `15`  |
| `SHAPE_SECONDS_PER_QUESTION`            | `12`  |
| `ENGLISH_ALPHABET_SECONDS_PER_QUESTION` | `12`  |
| `ENGLISH_WORD_SECONDS_PER_QUESTION`     | `15`  |

### Grades scale (`lib/constants.ts`)

```
GRADE_SCALE.EXCELLENT = 9   → 'excellent' badge
GRADE_SCALE.GOOD      = 7   → 'good' badge
                            → 'needs-practice' below 7
```

### Utility functions (`lib/utils.ts`)

- `calculateScore(correct, total)` — returns 0–100 percentage
- `clamp(value, min, max)` — clamps a number

### `lib/grading.ts` — `calculateBadge(score)`

Returns `BadgeTier` based on score vs `GRADE_SCALE`.

---

## 11. Complete Request Flow Diagrams

### Kid unlock flow

```
Browser: /kid-unlock
  ↓ Page renders KidUnlockView (pattern input)
  ↓ Kid enters 2-symbol pattern
  ↓ verifyKidPatternAction(pattern)
      ↓ Zod validates: /^[1-6]{2}$/
      ↓ getParentAuthRecord(DEFAULT_USER_ID) → fetch kidPatternHash
      ↓ isLockedOut(attempts, lockedUntil)?
          → YES: return { isLocked: true, lockoutSeconds }
          → NO: compareKidPattern(pattern, hash)
              → WRONG: recordFailedKidPatternAttempt, maybe lock
              → CORRECT:
                  → resetKidPatternAttempts
                  → createKidSessionToken(userId) — 12h JWT
                  → cookies().set('kid_session', token)
                  → return { success: true }
  ↓ Client redirects to /dashboard
```

### Math game session save flow

```
Kid plays math game → 10 questions answered
  ↓ useGameSession transitions to status='result'
  ↓ useMathSession.handleSubmit()
      ↓ saveMathProgressAction({
            minigame, level, correctCount, incorrectCount,
            timeSpentSecs, homeworkPeriodId?, homeworkDate?
          })
          ↓ SaveMathProgressSchema.safeParse(input)
          ↓ saveMathSession(userId, data)  [math.service.ts]
              ↓ calculateStars(correctCount, 10)
              ↓ getMathBestScore(userId, minigame, level)
              ↓ saveMathProgress(...)          — session history
              ↓ if isNewBest: upsertMathBestScore()
              ↓ addUserPoints(userId, pointsEarned)
              ↓ if homeworkPeriodId: homeworkRepo.markDone(...)
          ↓ recordActivity('GAME_COMPLETE', label, '🧮')
          ↓ checkAndAwardGameWinBadge(userId)
          ↓ if homeworkPeriodId: revalidatePath('/homework')
          ↓ return { starsEarned, score, pointsEarned, isNewBest }
  ↓ Client shows result screen with stars + points
```

### Parent login → PIN gate flow

```
Browser: /parent/login
  ↓ parentLoginAction(email, password)
      ↓ validate email + password (Zod)
      ↓ getByParentEmail(email)
      ↓ isLockedOut? → error
      ↓ comparePassword(password, hash)
          → WRONG: recordFailedParentLogin, maybe lock
          → CORRECT:
              → resetParentLoginAttempts
              → createParentAccessToken (15min JWT)
              → createParentRefreshToken (30day JWT)
              → hashTokenForStorage(refreshToken)
              → saveRefreshToken(userId, hash, expiresAt)
              → cookies().set('parent_access', ...)
              → cookies().set('parent_refresh', ...)
  ↓ redirect to /parent

Later visit:
  ↓ middleware reads parent_access cookie
      → still valid? → allow
      → expired?
          → read parent_refresh cookie
          → verify JWT
          → compareStoredTokenHash(refresh, storedHash)
          → mint new parent_access → set cookie → allow
```

---

## Appendix: Known Issues / P0 Blockers

| #   | Issue                                                                                        | Status                |
| --- | -------------------------------------------------------------------------------------------- | --------------------- |
| 1   | `docker-compose.yml` line 31 — `SESSION_SECRET` not set; JWTs forgeable in dev               | ⚠️ Open               |
| 2   | `middleware.ts` silent secret fallback                                                       | ✅ Fixed (2026-05-02) |
| 3   | No HTTP-layer rate limiting on `verifyPinAction` — lockout bypassable by concurrent requests | ⚠️ Open               |

---

_Last updated: 2026-06-09_
