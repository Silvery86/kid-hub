# Parent Dashboard — Feature Review

> **Updated:** 2026-05-30 · **Branch:** main · **Routes reviewed:** 4
> **Gaps found:** 6 · **All 6 implemented** · **Pending:** 0

---

## Status Summary

- G1, G6 implemented 2026-05-30 — `TodayOverviewPanel` added to `/parent`
- G2 implemented 2026-05-30 — `KidProgressPanel` replaces static `ActivitySidebar` in `/parent/kid-access`
- G5 implemented 2026-05-30 — `kidAccessSettings` persisted to DB (migration: `20260530131215_add_kid_access_settings`)
- G3 implemented 2026-05-31 — `ScreenTimeLog` model + heartbeat tracker + live card with +/− limit controls
- G4 implemented 2026-05-31 — `ActivityEvent` model + emission in math/english/homework + `RecentActivityPanel`

---

## 1. Current State — What's Already Built

The parent area covers 4 routes.

### `/parent`

**Status:** Implemented · `app/(parent)/parent/page.tsx` + `ParentDashboardView.tsx`

Two-panel dashboard (or tabbed on phone). Data fetched via `getScheduleAction` and `getReportCardAction` as Server Component props.

| Feature | Description | Actions |
|---|---|---|
| Schedule Manager | Full CRUD on school periods and extra classes. Add/edit/delete periods, cancel a specific occurrence with override. | `createPeriod` · `updatePeriod` · `deletePeriod` · `createExtraClass` · `cancelExtraClass` |
| Grades Manager | Parent edits each subject's score for S1/S2. Badge tier auto-calculated from score. | `upsertGradeAction` (parent-auth guarded) |
| Homework Add | Parent can add/delete daily homework items only through the Schedule Manager row. **No read-only parent view of homework status or completion rate.** | Actions exist but only used kid-side for marking done |

### `/parent/kid-access`

**Status:** Partial — static data · `components/parent/kid-access/KidAccessView.tsx`

Controls what the kid can access. Works for feature toggles.

| Feature | Status | Notes |
|---|---|---|
| Feature Toggles | Working | Parent can turn on/off individual features per group. Now stored server-side (was localStorage). |
| Kid Pattern Setup | Working | Parent can set the kid's unlock pattern. Backed by server action. |
| Screen Time Card | Implemented (G3) | Now shows live data with +/− 30 min limit buttons. Previous state was hardcoded `47 / 120 min`. |
| Recent Activity Feed | Implemented (G4) | `RecentActivityPanel` shows last 10 events with timestamps. Previous state was 3 static items. |

### `/parent/pin` and `/parent/login`

Both routes are fully implemented and match the design files.

---

## 2. Gap Analysis — Before Implementations

| # | Capability | Root Cause (Historical) | Priority |
|---|---|---|---|
| **G1** | See today's homework & completion status | No read-only parent view of `DailyHomework` completion — only kid-side toggle actions existed | P0 |
| **G2** | View kid's game progress & stats (points, streak, best scores, badges) | `KidAccessView` used hardcoded static activity sidebar, not connected to `UserProgress` DB table | P1 |
| **G3** | Real screen time tracking (minutes used vs daily limit) | No `ScreenTimeLog` model; screen time card showed hardcoded `const used = 47; const total = 120` | P2 |
| **G4** | Real recent activity feed (games played, homework done) | No `ActivityEvent` model; activity feed was a hardcoded `const RECENT_ACTIVITY = [{...}]` array | P2 |
| **G5** | Feature toggles persisted server-side | Feature toggles saved only to browser `localStorage` — cleared on device switch | P1 |
| **G6** | Quick "Today at a glance" for parent | No single-screen summary of today's classes + homework + kid stats | P1 |

---

## 3. Implemented Solutions

### G1 — Homework Status Panel (P0)

**Implementation:** `TodayOverviewPanel` added to `/parent`. Shows school periods + evening blocks + homework checklist with ✅/⬜ per item. Combined with G6 into a "🏠 Hôm nay" panel.

Parent can also **delete** a homework item from this tab via `deleteDailyHomeworkAction`.

**Wireframe (implemented):**

```
┌─────────────────────────────────────────────┐
│  📝 Bài tập hôm nay          3/5 hoàn thành │
├─────────────────────────────────────────────┤
│  ✅  🔢 Toán  Bài 12 — Phép cộng   09:14    │
│  ✅  📖 TV    Tập viết chữ M        09:30    │
│  ⬜  🌍 Anh   Học 5 từ mới                   │
│  ⬜  🔬 KH    Vẽ vòng đời bướm               │
│  ⬜  🎨 MT    Tô màu bức tranh               │
│                             [+ Thêm bài tập] │
└─────────────────────────────────────────────┘
```

### G2 — Kid Progress Panel (P1)

**Implementation:** `getKidProgressAction` in `server/actions/kid-progress.actions.ts`. `KidProgressPanel` replaces static `ActivitySidebar` in `/parent/kid-access`. Shows points, streak, math/english best stars, badges.

### G3 — Real Screen Time Tracking (P2)

**Implementation:** Migration `20260531020415_add_screen_time_and_activity`. `ScreenTimeTracker` (client) heartbeats every 60s via `addScreenTimeAction` in both dashboard + games layouts. `ScreenTimeCard` shows live data with +/− 30 min limit buttons.

**New model: `ScreenTimeLog`**

```prisma
model ScreenTimeLog {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  date      String   @db.VarChar(10) // "YYYY-MM-DD"
  totalSecs Int      @default(0)
  updatedAt DateTime @updatedAt

  @@unique([userId, date])
  @@map("screen_time_logs")
}
```

### G4 — Real Recent Activity Feed (P2)

**Implementation:** `ActivityEvent` model. Events emitted in `saveMathProgressAction`, `saveEnglishProgressAction`, and `toggleHomeworkDoneAction`. `RecentActivityPanel` shows last 10 events with timestamps in `/parent/kid-access` sidebar.

**New model: `ActivityEvent`**

```prisma
model ActivityEvent {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  type      String   @db.VarChar(30)  // GAME_COMPLETE | HOMEWORK_DONE
  label     String   @db.VarChar(150) // human-readable description shown to parent
  iconKey   String?  @db.VarChar(10)  // emoji displayed in the feed
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@map("activity_events")
}
```

### G5 — Feature Toggles Persisted Server-Side (P1)

**Implementation:** Migration `20260530131215_add_kid_access_settings` adds `users.kid_access_settings` JSON column. `saveKidAccessSettingsAction` called on every toggle. `KidAccessView` receives `initialToggles` from server.

### G6 — Today at a Glance (P1)

**Implementation:** `TodayOverviewPanel` is now the default landing panel.

- **Phone:** New "🏠 Hôm nay" tab (first, default).
- **Tablet:** 3-column layout — Hôm nay | Thời khóa biểu | Điểm số.

---

## 4. Server Actions Audit

| Action | File | Auth Guard | Notes |
|---|---|---|---|
| `getScheduleAction` | `schedule.actions.ts` | `requireParentSession` | Returns all ClassPeriods for the user |
| `getReportCardAction` | `grades.actions.ts` | `requireParentSession` | Returns all SubjectGrades |
| `upsertGradeAction` | `grades.actions.ts` | `requireParentSession` | Creates or updates a grade record |
| `addDailyHomeworkAction` | `schedule.actions.ts` | `requireParentSession` | Creates a DailyHomework row |
| `deleteDailyHomeworkAction` | `schedule.actions.ts` | `requireParentSession` | Deletes a DailyHomework row |
| `saveKidAccessSettingsAction` | `kid-access.actions.ts` | `requireParentSession` | Persists feature toggle state to DB |
| `getKidProgressAction` | `kid-progress.actions.ts` | `requireParentSession` | Returns UserProgress + EarnedBadges + GameBestScores |
| `addScreenTimeAction` | `screen-time.actions.ts` | Kid session (no PIN) | Increments ScreenTimeLog for today |
| `getRecentActivityAction` | `kid-access.actions.ts` | `requireParentSession` | Returns last 10 ActivityEvents |

---

## 5. Priority & Effort Table — Historical

| # | Capability | Effort | Status |
|---|---|---|---|
| G1 | Homework status panel | 2–3 h | **Done 2026-05-30** |
| G2 | Kid progress panel | 3–4 h | **Done 2026-05-30** |
| G3 | Screen time tracking | 4–6 h | **Done 2026-05-31** |
| G4 | Activity feed | 3–4 h | **Done 2026-05-31** |
| G5 | Server-side feature toggles | 2 h | **Done 2026-05-30** |
| G6 | Today overview panel | 2–3 h | **Done 2026-05-30** |
