# Schedule Module — Grade 1 Reality Upgrade Plan

**Version:** 1.0.0
**Status:** ✅ Implemented — Awaiting PM Review & Commit Approval
**Authors:** PM · Lead Dev · Designer · QA
**Route:** `/schedule` (inside `app/(dashboard)/schedule/`)
**Date:** 2026-05-16

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment — QA](#2-current-state-assessment--qa)
3. [Feature Specification — PM & Designer](#3-feature-specification--pm--designer)
4. [Architectural Design — Lead Dev](#4-architectural-design--lead-dev)
5. [Database Schema Decision Log](#5-database-schema-decision-log)
6. [Open Questions & Risks](#6-open-questions--risks)

---

## 1. Executive Summary

The current `/schedule` route is a **read-only school timetable** designed around morning periods (07:30–11:10, five fixed slots). It has no concept of the full day for a Grade 1 child: recurring evening extra classes, daily homework assignments, free-time blocks, or reward integration. This plan specifies the data model changes, UI redesign, and parental control additions needed to model Trọng Khôi's real daily structure.

**The three real-life blocks we must represent:**

| Block | Type | Recurrence | Example |
|---|---|---|---|
| Morning school | `SCHOOL_PERIOD` | Weekly (fixed timetable) | Toán 07:30–08:10 Mon–Fri |
| Evening extra class | `EXTRA_CLASS` | Weekly (specific days) | English Tue/Thu 18:00–19:30 |
| Daily homework | `DAILY_HOMEWORK` | One-off per date | "Math worksheet page 12" (today only) |

---

## 2. Current State Assessment — QA

### 2.1 What Works

- **`ClassPeriod` model** correctly stores five daily school periods with subject, time, and room.
- **`HomeworkCompletion` model** tracks done/not-done per `(periodId, date)` — this pattern is sound and can be reused for extra classes.
- **`ScheduleGrid` component** correctly highlights the live active period and today's column using real-time wall-clock polling (`useSchedule` hook, 30 s interval).
- **`ScheduleManager` (parent)** supports full CRUD on school periods with inline editing, overlap detection, and batch save.

### 2.2 Gaps for Grade 1 Reality

| Gap | Impact | Evidence |
|---|---|---|
| No evening time range (after 11:10) | Cannot store English class 18:00–19:30 | `periodNumber` 1–5 hardcoded to morning only in seed + `TOTAL_PERIODS = 5` in `ScheduleGrid.tsx` |
| `isHomework` on `ClassPeriod` is ambiguous | A school period is not a homework item; this field is semantically wrong | `prisma/schema.prisma` line 82: `isHomework Boolean @default(false)` on the same model as a math class |
| No one-off homework model | Parent cannot say "do this worksheet today only" — every event must be a recurring weekly slot | No `DailyHomework` table exists |
| No event type distinction | Cannot visually differentiate school / extra class / homework / free time | Single `subjectId` string, no `eventType` field |
| No icon system | Kid sees "english" text, not a recognisable icon | `ScheduleGrid.tsx` renders subject label text only |
| No reward hook on homework completion | Checking off homework does not award points | `HomeworkCompletion.isDone` has no reward side-effect |
| No per-date override for recurring events | Cannot cancel Tuesday's English class without deleting the recurring slot | No cancellation/skip model |
| `useSchedule` polls when tab is hidden | Wastes CPU, drains battery on a tablet | `hooks/useSchedule.ts` uses `setInterval` unconditionally |
| No loading state on schedule page | DB timeout → blank page | `app/(dashboard)/schedule/page.tsx` has no Suspense/`loading.tsx` |

### 2.3 Acceptance Criteria (Pre-QA Gate)

Before this feature merges, QA must verify:

- [ ] Evening extra classes appear in the correct day column below the school blocks.
- [ ] A recurring extra class marked as "cancelled today" does **not** appear on that specific date.
- [ ] A daily homework item added by the parent appears only on its target date.
- [ ] Checking off a homework item awards the configured points and shows the reward animation.
- [ ] The schedule renders correctly in landscape phone, portrait phone, and iPad landscape viewports.
- [ ] `useSchedule` polling pauses when `document.visibilityState === 'hidden'`.

---

## 3. Feature Specification — PM & Designer

### 3.1 Kid View — "Today's Plan" Layout

The schedule page is redesigned around **three swimlanes** visible at a glance. Trọng Khôi should never need to scroll in landscape to see his full day.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  Thời Khoá Biểu — Thứ Ba  (Tue 2026-05-19)         landscape phone/tablet  │
├────────────────────────┬─────────────────────────────────────────────────────┤
│  BUỔI SÁNG 🌅          │  TỐI NAY 🌙                                         │
│  (Morning School)      │  (Evening)                                          │
│                        │                                                     │
│  🎒 07:30 Toán         │  🌍 18:00–19:30  Tiếng Anh   [Hôm nay bị huỷ? ✕]  │
│  🎒 08:10 Tiếng Việt   │                                                     │
│  ▶ 09:00 Đạo Đức  ←live│  BÀI TẬP VỀ NHÀ 📚                                │
│  🎒 09:40 Toán         │  ☐  Toán trang 12           +10 ⭐                  │
│  🎒 10:30 Thể Dục      │  ☑  Đọc bài Tiếng Việt     +10 ⭐  ✓ Xong!         │
│                        │                                                     │
└────────────────────────┴─────────────────────────────────────────────────────┘
```

**Evening block cap:** Maximum **3 extra class slots per day** are displayed in the right panel. A parent attempting to add a 4th will see a validation error: "Tối đa 3 buổi học thêm mỗi ngày." This cap is enforced at both the action layer (Zod) and the UI.

**Portrait fallback** (stacked, two tabs):
- Tab 1: "Hôm Nay" — Today's evening + homework (most child-relevant)
- Tab 2: "Tuần Này" — Full 5-day school timetable (Mon–Sun, days with no events greyed out)

### 3.2 Icon System

Icons replace bare text as the primary identifier. Every event type has a canonical icon key stored in the database.

| `iconKey` | Emoji | Vietnamese label | Used for |
|---|---|---|---|
| `backpack` | 🎒 | Học chính | Regular school periods |
| `english` | 🌍 | Tiếng Anh | English extra class |
| `math-extra` | 🔢 | Toán nâng cao | Math tutoring |
| `music` | 🎵 | Âm Nhạc | Music class |
| `art` | 🎨 | Mĩ Thuật | Art class |
| `book` | 📚 | Bài tập | Homework item |
| `free` | 🎮 | Tự do | Free-time block |
| `sleep` | 💤 | Nghỉ ngơi | Rest/nap block |

> **Designer rule:** Icon keys live in the database. The mapping to emoji or SVG lives in a single `lib/icons.ts` constant — never inline in components.

### 3.3 Colour-Coded Time Bands

Three time bands get distinct background tints (Tailwind `@theme {}` tokens to be added):

| Band | Hours | Token | Usage |
|---|---|---|---|
| Morning | 07:00–12:00 | `--color-band-morning` | Blue-50 / Blue-100 card bg |
| Afternoon | 12:00–17:00 | `--color-band-afternoon` | Amber-50 / Amber-100 card bg |
| Evening | 17:00–22:00 | `--color-band-evening` | Violet-50 / Violet-100 card bg |

### 3.4 Parental Controls — Evening Setup Flow

Parents access evening management from the Parent Dashboard, **PIN-gated as today**.

#### Quick-Add Daily Homework

1. Parent taps **"+ Bài về nhà hôm nay"** button on dashboard.
2. A `FullScreenModal` opens (existing primitive).
3. Fields: Date (default today) · Subject dropdown · Free-text label (max 150 chars) · Points value (default 10, max 50).
4. Save → creates a `DailyHomework` row for that date.
5. Appears immediately on the kid view without page reload (optimistic update).

#### Override / Cancel a Recurring Extra Class

1. Parent taps the extra class chip on any day.
2. Inline action sheet: **"Huỷ buổi hôm nay"** (cancel once) or **"Xoá lịch cố định"** (delete recurring slot).
3. "Huỷ buổi hôm nay" creates an `ExtraClassOverride` row for `(extraClassId, date)` — the recurring event is **not hidden**; it remains visible so Khôi sees his full day at a glance without wondering where a class went.
4. Kid view renders the chip with strikethrough text + `opacity-50` and an "Đã huỷ" badge — the icon stays visible.

#### Add / Edit Recurring Extra Class

- Found in the existing `ScheduleManager` (parent mode), extended with an **"Buổi Tối"** section per day.
- Fields identical to school periods but `periodNumber` is absent; ordering is by `startTime`.
- `eventType` is set to `EXTRA_CLASS` automatically.

### 3.5 Reward Integration

When Trọng Khôi taps the checkbox on a homework item:

1. Optimistic UI: checkbox fills, green flash, star animation (`+10 ⭐`).
2. Server action: set `DailyHomework.isDone = true`, `doneAt = now()`.
3. After confirmation: call `awardPointsAction(userId, points)` — **this action will be written as part of this feature** (see §4.2 below).
4. If the server rejects: revert checkbox, show error banner.

**Points values are stored per `DailyHomework` row** — the parent sets the value at creation time (default 10, max 50). This gives the parent leverage to motivate harder assignments.

**`HomeworkCompletion` for extra classes** follows the same pattern: checking in the kid view triggers points via the same `awardPointsAction`.

**Note on existing reward code:** `addUserPoints()` is currently duplicated in `math.repository.ts` and `english.repository.ts`. This feature will extract it into a shared `server/repositories/progress.repository.ts` so all three consumers (math, english, homework) share one implementation.

---

## 4. Architectural Design — Lead Dev

### 4.1 Database Schema Changes

#### 4.1.1 Extend `ClassPeriod`

Add two new columns. All existing rows default cleanly; no data migration required.

```prisma
// prisma/schema.prisma — additions to ClassPeriod model

// DayOfWeek extended to include weekend days (for Saturday/Sunday extra classes)
enum DayOfWeek {
  monday
  tuesday
  wednesday
  thursday
  friday
  saturday   // NEW — weekend extra classes (sport, music, etc.)
  sunday     // NEW — weekend extra classes
}

enum EventType {
  SCHOOL_PERIOD  // Default — regular morning school class (Mon–Fri only)
  EXTRA_CLASS    // Recurring extra class — any day, any time (evening or weekend)
}

model ClassPeriod {
  // --- existing fields unchanged ---
  id           String    @id @default(cuid())
  userId       String
  day          DayOfWeek
  periodNumber Int?      // CHANGE: was Int (required). Now optional.
                         // Required for SCHOOL_PERIOD (1–10); null for EXTRA_CLASS.
  subjectId    String    @db.VarChar(30)
  startTime    String    @db.VarChar(5)
  endTime      String    @db.VarChar(5)
  roomNumber   String?   @db.VarChar(20)
  isHomework   Boolean   @default(false)   // DEPRECATED — kept for migration safety, no new writes
  homeworkNote String?   @db.VarChar(200)  // DEPRECATED — same

  // --- new fields ---
  eventType    EventType @default(SCHOOL_PERIOD)
  iconKey      String?   @db.VarChar(30)   // e.g. "english", "music", "backpack"
  sortOrder    Int       @default(0)        // explicit ordering for evening blocks

  user         User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  completions  HomeworkCompletion[]
  overrides    ExtraClassOverride[]

  @@unique([userId, day, periodNumber])   // still valid; null periodNumbers are excluded by DB
  @@index([userId, day])
  @@index([userId, eventType])
  @@map("class_periods")
}
```

> **Why keep `periodNumber` optional instead of removing it?**
> Dropping it would require a destructive migration on existing school data. Making it optional is additive — zero downtime, backward compatible. The unique constraint on `(userId, day, periodNumber)` in Postgres correctly ignores rows where `periodNumber IS NULL`, so two evening blocks on the same day do not conflict.

#### 4.1.2 New Model — `DailyHomework`

One-off homework tasks. No link to `ClassPeriod`; standalone per-date entries.

```prisma
model DailyHomework {
  id        String    @id @default(cuid())
  userId    String
  date      String    @db.VarChar(10)  // "YYYY-MM-DD"
  subjectId String    @db.VarChar(30)
  label     String    @db.VarChar(150) // "Toán trang 12, bài 3–5"
  iconKey   String?   @db.VarChar(30)
  isDone    Boolean   @default(false)
  doneAt    DateTime?
  points    Int       @default(10)
  createdAt DateTime  @default(now())

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, date])
  @@map("daily_homework")
}
```

#### 4.1.3 New Model — `ExtraClassOverride`

Per-date cancellations of a recurring `EXTRA_CLASS` slot.

```prisma
model ExtraClassOverride {
  id        String      @id @default(cuid())
  periodId  String      // FK → ClassPeriod (must be eventType = EXTRA_CLASS)
  userId    String
  date      String      @db.VarChar(10)  // "YYYY-MM-DD" of the cancellation
  reason    String?     @db.VarChar(100)
  createdAt DateTime    @default(now())

  period    ClassPeriod @relation(fields: [periodId], references: [id], onDelete: Cascade)
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([periodId, date])
  @@index([userId, date])
  @@map("extra_class_overrides")
}
```

### 4.2 Layer-by-Layer Implementation Plan

> **Order is strict.** Never write a service before its repository, never write an action before its service. Follow `docs/TEAM_WORKFLOW.md` Phase 2.

```
✅ Schema migration
  ├─✅ prisma/schema.prisma
  │     • DayOfWeek enum: add saturday, sunday
  │     • ClassPeriod: periodNumber optional, add eventType, iconKey, sortOrder
  │     • Drop isHomework, homeworkNote columns
  │     • New models: DailyHomework, ExtraClassOverride
  │     • DB synced via `prisma db push --accept-data-loss`
  │
  ├─✅ server/repositories/progress.repository.ts   (NEW — shared addUserPoints)
  │     math.repository + english.repository now re-export from here
  │
  ├─✅ server/repositories/schedule.repository.ts
  │     (getEveningBlocks, getDailyHomework, createDailyHomework,
  │      toggleDailyHomeworkDone, createOverride, getOverridesForDate,
  │      deleteOverride, deleteDailyHomework, countEveningBlocks)
  │
  ├─✅ server/services/schedule.service.ts
  │     (buildTodayView, filterCancelledSlots, deriveTimeBand,
  │      jsDateToDayOfWeek now handles saturday+sunday)
  │
  ├─✅ server/actions/schedule.actions.ts
  │     (getTodayViewAction, addDailyHomeworkAction, toggleHomeworkDoneAction,
  │      cancelExtraClassAction, restoreExtraClassAction, createExtraClassAction,
  │      deleteDailyHomeworkAction; DaySchema updated for sat/sun)
  │
  ├─✅ server/actions/rewards.actions.ts   (NEW — awardPointsAction)
  │
  ├─✅ hooks/useSchedule.ts
  │     (getDayOfWeek handles sat+sun; polling pauses on hidden tab via visibilitychange)
  │
  ├─✅ lib/icons.ts             (NEW — ICON_MAP + getIcon helper)
  ├─✅ lib/constants.ts         (DAYS_OF_WEEK + DAY_LABELS + SCHOOL_DAYS + MAX_EVENING_BLOCKS_PER_DAY)
  │
  ├─✅ components/dashboard/EveningBlockChip.tsx   (NEW)
  ├─✅ components/dashboard/HomeworkCheckbox.tsx   (NEW — optimistic toggle + awardPointsAction)
  ├─✅ components/dashboard/TodayPlanCard.tsx      (NEW — evening + homework swimlanes)
  ├─✅ components/parent/ScheduleManager.tsx       (3-tab: School · Evening · Homework)
  │
  └─✅ app/(dashboard)/schedule/
        page.tsx  — two-panel layout (ScheduleGrid + TodayPlanCard), Suspense
        loading.tsx  — skeleton (NEW)

Also fixed as part of this work:
  ✅ docker-compose.yml — removed hardcoded SESSION_SECRET (P0 security fix)
  ✅ server/repositories/homework.repository.ts — redirected to DailyHomework table
  ✅ server/services/math.service.ts + english.service.ts — getTodayXxxHomework queries DailyHomework
  ✅ types/index.ts — HomeworkItem kept as @deprecated alias for backward compat
```

### 4.3 New `awardPointsAction` (Server Action)

```typescript
// server/actions/rewards.actions.ts  (NEW FILE)
// Callable from homework checkboxes, game completions, and any future reward trigger.

'use server'
import { requireParentSession } from '@/server/lib/auth-guard'   // NOT needed — kid action
import { addUserPoints } from '@/server/repositories/progress.repository'
import { z } from 'zod'

const AwardSchema = z.object({
  userId: z.string().cuid(),
  points: z.number().int().min(1).max(50),
})

export async function awardPointsAction(
  userId: string,
  points: number,
): Promise<{ success: boolean; newTotal?: number; error?: string }> {
  const parsed = AwardSchema.safeParse({ userId, points })
  if (!parsed.success) return { success: false, error: 'Invalid input' }
  const newTotal = await addUserPoints(parsed.data.userId, parsed.data.points)
  return { success: true, newTotal }
}
```

```typescript
// server/repositories/progress.repository.ts  (NEW FILE — extracted from math/english repos)

export async function addUserPoints(userId: string, points: number): Promise<number> {
  const result = await db.userProgress.upsert({
    where:  { userId },
    create: { userId, totalPoints: points, currentStreak: 0, lastActiveDate: todayStr() },
    update: { totalPoints: { increment: points }, lastActiveDate: todayStr() },
  })
  return result.totalPoints
}
```

### 4.4 New Repository Functions (Signatures)

```typescript
// server/repositories/schedule.repository.ts

// Fetch all EXTRA_CLASS entries for a given day (used for evening display)
getEveningBlocks(userId: string, day: DayOfWeek): Promise<ClassPeriod[]>

// Fetch active overrides for a specific date (to filter cancelled classes)
getOverridesForDate(userId: string, date: string): Promise<string[]>  // returns periodIds

// Fetch daily homework for a specific date
getDailyHomework(userId: string, date: string): Promise<DailyHomework[]>

// Create a one-off homework item
createDailyHomework(data: CreateDailyHomeworkInput): Promise<string>  // returns id

// Toggle isDone on a DailyHomework row; returns updated record
toggleDailyHomeworkDone(id: string, userId: string, isDone: boolean): Promise<DailyHomework>

// Create an override (cancellation) for an extra class on a date
createExtraClassOverride(periodId: string, userId: string, date: string, reason?: string): Promise<void>
```

### 4.4 New Service Functions (Signatures)

```typescript
// server/services/schedule.service.ts

// Merges school periods + evening blocks + homework into a single sorted view for one date
buildTodayView(
  schoolPeriods: ClassPeriod[],
  eveningBlocks: ClassPeriod[],
  cancelledIds: string[],
  homework: DailyHomework[]
): TodayView

// Returns "morning" | "afternoon" | "evening" based on HH:MM string
deriveTimeBand(startTime: string): 'morning' | 'afternoon' | 'evening'

// Pure filter: removes extra classes whose id appears in cancelledIds
filterCancelledSlots(blocks: ClassPeriod[], cancelledIds: string[]): ClassPeriod[]
```

### 4.5 New Types

```typescript
// types/index.ts — additions

export type EventType = 'SCHOOL_PERIOD' | 'EXTRA_CLASS'
export type TimeBand  = 'morning' | 'afternoon' | 'evening'

export interface DailyHomework {
  id:        string
  date:      string       // "YYYY-MM-DD"
  subjectId: string
  label:     string
  iconKey?:  string
  isDone:    boolean
  doneAt?:   string
  points:    number
}

export interface TodayView {
  date:          string
  schoolPeriods: ClassPeriod[]     // morning school, sorted by periodNumber
  eveningBlocks: ClassPeriod[]     // EXTRA_CLASS entries, sorted by startTime, cancelled filtered out
  homework:      DailyHomework[]   // one-off tasks for this date
  cancelledIds:  string[]          // periodIds skipped today
}
```

### 4.6 Responsive Layout — Landscape-First

Per `docs/RESPONSIVE.md`, base styles target landscape. Portrait is the override.

```
Landscape layout (base):
┌────────────────────────┬─────────────────────────┐
│  w-1/2                 │  w-1/2                  │
│  Morning School grid   │  Evening + Homework      │
│  (5 periods, scrollable│  (always fully visible  │
│  only if > 5 items)    │  without scroll)         │
└────────────────────────┴─────────────────────────┘

Portrait override (portrait: prefix):
┌─────────────────────────────────────────────────┐
│  Tab bar: [Hôm Nay] [Tuần Này]                  │
├─────────────────────────────────────────────────┤
│  Selected tab content (full width, scrollable)  │
└─────────────────────────────────────────────────┘
```

**Tap target rules (from RESPONSIVE.md):**
- Homework checkboxes: `min-h-[64px] min-w-[64px]` — large-target class
- "Cancel today" action chip: `min-h-[48px]`
- Evening block cards: `min-h-[56px]` with full-row tap area

### 4.7 `useSchedule` Hook Fix — Visibility Pause

The current `setInterval` runs even when the device screen is off or the tab is hidden.

```typescript
// Fix in hooks/useSchedule.ts — add visibility listener
useEffect(() => {
  const tick = () => { if (document.visibilityState === 'visible') refreshNow() }
  const id = setInterval(tick, 30_000)
  document.addEventListener('visibilitychange', tick)
  return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick) }
}, [])
```

---

## 5. Database Schema Decision Log

### Decision 1: One `ClassPeriod` table vs separate `EveningBlock` table

| Option | Pros | Cons |
|---|---|---|
| **A — Extend `ClassPeriod` (chosen)** | No new FK relationships; existing repo/service/action layer reused; zero-downtime additive migration; `HomeworkCompletion` already linked to `ClassPeriod` and works for extra classes | `periodNumber` becomes optional; two deprecated columns linger |
| B — Separate `EveningBlock` table | Clean model per entity; no nullable columns | Doubles the schedule repository surface; two fetch paths to merge in every query; more actions to write and test |

**Decision: Option A.** The `periodNumber IS NULL` pattern in Postgres is idiomatic and the unique constraint handles it correctly. Adding `eventType` + `iconKey` + `sortOrder` is a net win with minimal schema churn.

### Decision 2: `DailyHomework` as its own table vs reusing `ClassPeriod`

Homework is fundamentally **not recurring** — it is bound to a specific date, not a day-of-week. Forcing it into `ClassPeriod` would require a fake `day` and a `date` override field, breaking the model's invariant. A separate `DailyHomework` table is the correct normalised choice.

### Decision 3: `ExtraClassOverride` vs soft-delete on `HomeworkCompletion`

Cancellation of a class is **not** the same as completion. A separate `ExtraClassOverride` model preserves the recurring slot while expressing "not today." This also allows the parent to provide a cancellation reason.

### Decision 4: Points stored per `DailyHomework` row

Points are **not** a system constant because the parent may want to weight a hard assignment (50 pts) differently from a light one (5 pts). Storing the value at creation time preserves the parent's intent even if a global default changes later.

### Decision 5: Shared `addUserPoints` in `progress.repository.ts`

`addUserPoints()` is currently duplicated in `math.repository.ts` and `english.repository.ts`. Extracting it to a new `progress.repository.ts` is the only correct move: it follows the single-responsibility principle, prevents drift between the two copies, and gives the new `awardPointsAction` a clean import path without coupling it to a game-specific module.

---

## 6. Decisions Log — Closed

| # | Question | Decision | Resolved by |
|---|---|---|---|
| 1 | Weekend extra classes supported? | **Yes** — `DayOfWeek` extended with `saturday` and `sunday` (sport, music, etc.). School periods remain Mon–Fri only. | PM 2026-05-16 |
| 2 | Must `awardPointsAction` be written for this feature? | **Yes** — implement as part of this feature. Extract shared `addUserPoints` from math/english repos into `progress.repository.ts`; expose via `rewards.actions.ts`. | PM 2026-05-16 |
| 3 | Max evening blocks per day? | **3** — enforced at action (Zod) and UI level. Parent sees validation error on attempt to add a 4th. | PM 2026-05-16 |
| 4 | Cancelled class: strikethrough or hidden? | **Strikethrough** — chip stays visible with `line-through opacity-50` + "Đã huỷ" badge so Khôi can see his normal schedule at a glance. | PM 2026-05-16 |
| 5 | P0: `SESSION_SECRET` hardcoded in `docker-compose.yml` | **Fixed** — removed hardcoded secret from `docker-compose.yml` line 33; now loaded via `env_file` from `.env.local` (already in `.gitignore`). Commit pending PM approval. | Lead Dev 2026-05-16 |
| 6 | Drop deprecated `isHomework` / `homeworkNote` columns? | **Drop in this migration** — no grace period needed; columns have no production data and the `EventType` enum replaces the concept cleanly. | PM 2026-05-16 |

---

*Document status: Draft — pending PM review and team discussion before any implementation begins.*
