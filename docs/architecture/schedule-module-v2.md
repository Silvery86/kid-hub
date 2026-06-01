# Schedule Module — Plan v2 Review

> **Status:** Partial Implementation — PM Review Required
> **Version:** 2.0.0 · **Date:** 2026-05-30
> **Route:** `/schedule` · **Authors:** PM · Lead Dev · Designer · QA

Implementation audit of the Grade 1 Reality Upgrade against `schedule-module-v1.md` and the subsequent responsive redesign (`schedule-design.md`). Backend and parent tools are largely complete; kid-facing evening/homework integration and reward wiring remain open.

---

## At a Glance

| Layer | Status |
|---|---|
| Schema & repository layer | 12/12 complete |
| Server actions & services | 8/8 complete |
| Parent `ScheduleManager` tabs | 3/3 complete |
| QA acceptance criteria | 2/6 passing |

---

## 1. What's Complete

### 1.1 Schema (All Shipped)

- `DayOfWeek` enum extended with `saturday` and `sunday`
- `ClassPeriod` extended: `eventType`, `iconKey`, `sortOrder`, `periodNumber` made optional
- Deprecated columns `isHomework` and `homeworkNote` dropped in migration
- `DailyHomework` model added (`userId`, `date`, `subjectId`, `label`, `iconKey`, `isDone`, `doneAt`, `points`)
- `ExtraClassOverride` model added (`periodId`, `userId`, `date`, `reason`)

### 1.2 Repository Layer (All Shipped)

- `schedule.repository.ts` — `getEveningBlocks`, `getDailyHomework`, `createDailyHomework`, `toggleDailyHomeworkDone`, `createExtraClassOverride`, `getOverridesForDate`, `deleteOverride`, `deleteDailyHomework`, `countEveningBlocks`
- `progress.repository.ts` — `addUserPoints` (extracted from `math.repository.ts` + `english.repository.ts`)

### 1.3 Service Layer (All Shipped)

- `schedule.service.ts` — `buildTodayView`, `filterCancelledSlots`, `deriveTimeBand`, `jsDateToDayOfWeek` (extended for sat/sun)

### 1.4 Actions (All Shipped)

- `schedule.actions.ts` — `getTodayViewAction`, `addDailyHomeworkAction`, `toggleHomeworkDoneAction`, `cancelExtraClassAction`, `restoreExtraClassAction`, `createExtraClassAction`, `deleteDailyHomeworkAction`
- `rewards.actions.ts` — `awardPointsAction` (NEW)

### 1.5 Parent Tools (All Shipped)

- `ScheduleManager.tsx` — 3-tab: School · Evening · Homework
- `useSchedule.ts` — polling pauses on hidden tab via `visibilitychange`
- `lib/icons.ts` — `ICON_MAP` + `getIcon` helper
- `lib/constants.ts` — `DAYS_OF_WEEK`, `DAY_LABELS`, `SCHOOL_DAYS`, `MAX_EVENING_BLOCKS_PER_DAY`

---

## 2. What Remains Open

### 2.1 Kid-Facing Components — Missing or Incomplete

| Component | Status | Notes |
|---|---|---|
| `EveningBlockChip.tsx` | Not built | Kid-view chip for evening classes with cancellation indicator |
| `HomeworkCheckbox.tsx` | Partial | Optimistic toggle + `awardPointsAction` not wired |
| `TodayPlanCard.tsx` | Not built | Evening + homework swimlanes for `/schedule` page |

### 2.2 QA Acceptance Criteria — Status

| Criterion | Status |
|---|---|
| Evening extra classes appear in correct day column | Passing (parent view only) |
| Cancelled extra class does **not** appear on that date | Passing (backend logic correct) |
| Daily homework item added by parent appears only on its target date | Not verified (kid view not built) |
| Checking off a homework item awards points and shows reward animation | Failing — `awardPointsAction` not wired in kid checkbox |
| Schedule renders correctly across all 5 viewports | Partial — school grid only tested |
| `useSchedule` polling pauses when tab is hidden | Passing |

---

## 3. Proposed Next Steps (PM Decision Required)

### Proposal A — Complete Kid Evening Integration

Wire `TodayPlanCard` and `EveningBlockChip` into `/schedule` page. Estimated effort: 1 sprint (Lead Dev + Designer).

**Files to create/modify:**

- `components/dashboard/EveningBlockChip.tsx` (NEW)
- `components/dashboard/HomeworkCheckbox.tsx` (MODIFY — add `awardPointsAction` call)
- `components/dashboard/TodayPlanCard.tsx` (NEW)
- `app/(dashboard)/schedule/page.tsx` (MODIFY — add two-panel layout + Suspense)
- `app/(dashboard)/schedule/loading.tsx` (NEW — skeleton)

### Proposal B — Defer Kid Evening View to Next Sprint

Keep current parent-only state. Mark the feature as "Backend complete, kid UI deferred." Acceptable if the parent's ability to manage homework and evening classes is the primary P0.

---

## 4. Open Bugs

### Bug 1 — HomeworkCheckbox Does Not Award Points

**Location:** `components/dashboard/HomeworkCheckbox.tsx`

**Symptom:** Marking a `DailyHomework` item as done via `/homework` page toggles `isDone` in the DB but does **not** call `awardPointsAction`. Points are not incremented.

**Root cause:** The original `toggleHomeworkDoneAction` in `schedule.actions.ts` awards points. However, the `/homework` page calls a separate `markHomeworkDoneAction` in `homework.actions.ts` which does not.

**Fix:** Delete `markHomeworkDoneAction`. Promote `toggleHomeworkDoneAction` (rename to `completeHomeworkAction`) as the single completion path. See `docs/product-spec/feature-backlog.md` — "Homework Reward Loop Unification" (P0).

### Bug 2 — Schedule Viewport Test Coverage Gap

**Location:** `e2e/responsive/viewport-matrix.spec.ts`

**Symptom:** No Playwright tests cover the schedule page in portrait mode or with evening blocks visible.

**Fix:** Add new viewport matrix entries for `/schedule` — phone portrait, tablet portrait — and assert evening blocks and homework checkboxes are visible.
