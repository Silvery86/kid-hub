# Schedule Module — Grade 1 Reality Upgrade Plan (v1 Historical)

> **Version:** 1.0.0 (historical)
> **Status:** Superseded — see `docs/architecture/schedule-module-v2.md` for current implementation audit
> **Authors:** PM · Lead Dev · Designer · QA
> **Route:** `/schedule` (inside `app/(dashboard)/schedule/`)
> **Date:** 2026-05-16

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
- **`ScheduleGrid` component** correctly highlights the live active period and today's column using real-time wall-clock polling (`useSchedule` hook, 30s interval).
- **`ScheduleManager` (parent)** supports full CRUD on school periods with inline editing, overlap detection, and batch save.

### 2.2 Gaps for Grade 1 Reality

| Gap | Impact | Evidence |
|---|---|---|
| No evening time range (after 11:10) | Cannot store English class 18:00–19:30 | `periodNumber` 1–5 hardcoded to morning only in seed + `TOTAL_PERIODS = 5` in `ScheduleGrid.tsx` |
| `isHomework` on `ClassPeriod` is ambiguous | A school period is not a homework item; this field is semantically wrong | `prisma/schema.prisma` line 82 |
| No one-off homework model | Parent cannot say "do this worksheet today only" | No `DailyHomework` table exists |
| No event type distinction | Cannot visually differentiate school / extra class / homework / free time | Single `subjectId` string, no `eventType` field |
| No icon system | Kid sees "english" text, not a recognisable icon | `ScheduleGrid.tsx` renders subject label text only |
| No reward hook on homework completion | Checking off homework does not award points | `HomeworkCompletion.isDone` has no reward side-effect |
| No per-date override for recurring events | Cannot cancel Tuesday's English class without deleting the recurring slot | No cancellation/skip model |
| `useSchedule` polls when tab is hidden | Wastes CPU, drains battery on a tablet | `hooks/useSchedule.ts` uses `setInterval` unconditionally |

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
┌──────────────────────────────────────────────────────────────────────────┐
│  Thời Khoá Biểu — Thứ Ba  (Tue 2026-05-19)         landscape phone/tablet│
├────────────────────────┬─────────────────────────────────────────────────┤
│  BUỔI SÁNG 🌅          │  TỐI NAY 🌙                                      │
│  (Morning School)      │  (Evening)                                       │
│                        │                                                  │
│  🎒 07:30 Toán         │  🌍 18:00–19:30  Tiếng Anh   [Hôm nay bị huỷ? ✕]│
│  🎒 08:10 Tiếng Việt   │                                                  │
│  ▶ 09:00 Đạo Đức  ←live│  BÀI TẬP VỀ NHÀ 📚                             │
│  🎒 09:40 Toán         │  ☐  Toán trang 12           +10 ⭐               │
│  🎒 10:30 Thể Dục      │  ☑  Đọc bài Tiếng Việt     +10 ⭐  ✓ Xong!      │
└────────────────────────┴─────────────────────────────────────────────────┘
```

**Evening block cap:** Maximum **3 extra class slots per day**. A parent attempting to add a 4th will see a validation error: "Tối đa 3 buổi học thêm mỗi ngày." This cap is enforced at both the action layer (Zod) and the UI.

**Portrait fallback** (stacked, two tabs):

- Tab 1: "Hôm Nay" — Today's evening + homework (most child-relevant)
- Tab 2: "Tuần Này" — Full 5-day school timetable (Mon–Sun, days with no events greyed out)

### 3.2 Icon System

Icons replace bare text as the primary identifier. Every event type has a canonical icon key stored in the database.

| `iconKey` | Emoji | Vietnamese Label | Used For |
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

| Band | Hours | Token | Usage |
|---|---|---|---|
| Morning | 07:00–12:00 | `--color-band-morning` | Blue-50 / Blue-100 card bg |
| Afternoon | 12:00–17:00 | `--color-band-afternoon` | Amber-50 / Amber-100 card bg |
| Evening | 17:00–22:00 | `--color-band-evening` | Violet-50 / Violet-100 card bg |

### 3.4 Reward Integration

When Trọng Khôi taps the checkbox on a homework item:

1. Optimistic UI: checkbox fills, green flash, star animation (`+10 ⭐`).
2. Server action: set `DailyHomework.isDone = true`, `doneAt = now()`.
3. After confirmation: call `awardPointsAction(userId, points)`.
4. If the server rejects: revert checkbox, show error banner.

---

## 4. Architectural Design — Lead Dev

### 4.1 Database Schema Changes

#### 4.1.1 Extend `ClassPeriod`

```prisma
// DayOfWeek extended to include weekend days
enum DayOfWeek {
  monday
  tuesday
  wednesday
  thursday
  friday
  saturday   // NEW — weekend extra classes
  sunday     // NEW — weekend extra classes
}

enum EventType {
  SCHOOL_PERIOD  // Default — regular morning school class (Mon–Fri only)
  EXTRA_CLASS    // Recurring extra class — any day, any time
}

model ClassPeriod {
  // --- existing fields unchanged ---
  id           String    @id @default(cuid())
  userId       String
  day          DayOfWeek
  periodNumber Int?      // CHANGE: was Int (required). Now optional.
  subjectId    String    @db.VarChar(30)
  startTime    String    @db.VarChar(5)
  endTime      String    @db.VarChar(5)
  roomNumber   String?   @db.VarChar(20)

  // --- new fields ---
  eventType    EventType @default(SCHOOL_PERIOD)
  iconKey      String?   @db.VarChar(30)
  sortOrder    Int       @default(0)

  @@unique([userId, day, periodNumber])
  @@index([userId, day])
  @@index([userId, eventType])
  @@map("class_periods")
}
```

#### 4.1.2 New Model — `DailyHomework`

```prisma
model DailyHomework {
  id        String    @id @default(cuid())
  userId    String
  date      String    @db.VarChar(10)  // "YYYY-MM-DD"
  subjectId String    @db.VarChar(30)
  label     String    @db.VarChar(150)
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

### 4.2 New `awardPointsAction`

```typescript
// server/actions/rewards.actions.ts  (NEW FILE)
'use server'
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
// server/repositories/progress.repository.ts  (NEW FILE)
export async function addUserPoints(userId: string, points: number): Promise<number> {
  const result = await db.userProgress.upsert({
    where:  { userId },
    create: { userId, totalPoints: points, currentStreak: 0, lastActiveDate: todayStr() },
    update: { totalPoints: { increment: points }, lastActiveDate: todayStr() },
  })
  return result.totalPoints
}
```

### 4.3 `useSchedule` Hook Fix — Visibility Pause

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

**Decision: Extend `ClassPeriod` (Option A).** The `periodNumber IS NULL` pattern in Postgres is idiomatic and the unique constraint handles it correctly. Adding `eventType` + `iconKey` + `sortOrder` is a net win with minimal schema churn.

### Decision 2: `DailyHomework` as its own table vs reusing `ClassPeriod`

Homework is fundamentally **not recurring** — it is bound to a specific date, not a day-of-week. A separate `DailyHomework` table is the correct normalised choice.

### Decision 3: Points stored per `DailyHomework` row

Points are **not** a system constant because the parent may want to weight a hard assignment (50 pts) differently from a light one (5 pts). Storing the value at creation time preserves the parent's intent even if a global default changes later.

### Decision 4: Shared `addUserPoints` in `progress.repository.ts`

`addUserPoints()` was duplicated in `math.repository.ts` and `english.repository.ts`. Extracting it to a new `progress.repository.ts` follows the single-responsibility principle and prevents drift between the two copies.

---

## 6. Decisions Log — Closed

| # | Question | Decision | Resolved by |
|---|---|---|---|
| 1 | Weekend extra classes supported? | **Yes** — `DayOfWeek` extended with `saturday` and `sunday`. School periods remain Mon–Fri only. | PM 2026-05-16 |
| 2 | Must `awardPointsAction` be written for this feature? | **Yes** — implement as part of this feature. | PM 2026-05-16 |
| 3 | Max evening blocks per day? | **3** — enforced at action (Zod) and UI level. | PM 2026-05-16 |
| 4 | Cancelled class: strikethrough or hidden? | **Strikethrough** — chip stays visible with `line-through opacity-50` + "Đã huỷ" badge. | PM 2026-05-16 |
| 5 | Drop deprecated `isHomework` / `homeworkNote` columns? | **Drop in this migration** — no grace period needed. | PM 2026-05-16 |

---

*Document status: Historical v1 reference. Backend/parent tools shipped; kid-facing evening + homework integration incomplete. Review `schedule-module-v2.md` and `schedule-design.md` for current state.*
