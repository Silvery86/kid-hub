# Schedule Route — Design Spec

> **Source design:** `design/components/schedule.jsx`
> **Target route:** `app/(dashboard)/schedule/`
> **Status:** Pending Review

---

## 1. Summary of Changes

The current schedule is a single 5-column grid that works acceptably on tablet landscape but is unusable on phone and cramped on phone landscape. The redesign introduces **orientation-aware rendering**: a tab-per-day list view on phone portrait, a compact mini-grid on phone landscape, and a richer grid + panel layout on tablet and desktop.

The largest breaking change is in **subject data**: the new `PeriodCell` uses `color-mix(in oklab, <hex> 14%, white)` for cell tinting, which requires each subject to expose a raw hex color rather than a Tailwind class name.

> Schedule is inside `(dashboard)` so `AppSidebar` is already provided by `app/(dashboard)/layout.tsx`. The schedule components do NOT need to import it themselves (unlike `/math` and `/english` which are in the separate `(games)` layout).

---

## 2. Five-Viewport Overview

| Viewport | Breakpoint / Orientation | Layout | Primary Component | Right / Aside |
|---|---|---|---|---|
| **Phone Portrait** | `portrait` ≤ ~480px wide | Single-column, scrollable | `DayTabs` + summary card + `DayList` | — |
| **Phone Landscape** | `landscape` ≤ ~568px tall | Narrow icon rail + main content | `WeekGrid orient="rows-periods"` compact+mini | — |
| **Tablet Portrait** | `portrait` 768–1024px wide | AppSidebar + main column | `WeekGrid orient="rows-periods"` | Bottom today rail (`DayRail`) |
| **Tablet Landscape** | `landscape` 768–1024px tall | AppSidebar + main + aside | `WeekGrid orient="cols-periods"` | 280px: today accent card + `SubjectLegend` |
| **Desktop** | `landscape` ≥ 1280px | Wide sidebar + main + aside | `WeekGrid orient="cols-periods"` | 320px: selected period detail + `SubjectLegend` + week stats |

---

## 3. Grid Orientation System

`WeekGrid` supports two orientations controlled by an `orient` prop:

### `orient="rows-periods"` (Portrait)

Periods are **rows**, days are **columns**. A 64px time label column appears on the left. Best when the screen has more vertical space than horizontal.

```
         T2    T3    T4    T5    T6
07:30  [ Toán ][ TV  ][ ĐĐ ][ TV  ][ TD  ]
08:10  [ TV   ][ Toán][ TV ][ Toán][ TV  ]
09:00  [ ĐĐ  ][ TD  ][ Toán][ TD ][ Toán]
09:40  [ Toán ][ TV  ][ TD ][ TV  ][ ĐĐ  ]
10:30  [ TD   ][ Toán][ TV ][ Toán][ TD  ]
```

### `orient="cols-periods"` (Landscape)

Periods are **columns**, days are **rows**. A 56px day-name row appears at the top. Best when the screen has more horizontal space than vertical.

```
      07:30   08:10   09:00   09:40   10:30
T2  [ Toán ][ TV   ][ ĐĐ   ][ Toán ][ TD   ]
T3  [ TV   ][ Toán ][ TD   ][ TV   ][ Toán ]
T4  [ ĐĐ  ][ TV   ][ Toán ][ TD   ][ TV   ]
T5  [ TV  ][ Toán ][ TD   ][ TV   ][ Toán ]
T6  [ TD  ][ TV   ][ Toán ][ ĐĐ   ][ TD   ]
```

---

## 4. New Components

### 4.1 `WeekGrid`

**Props:**

| Prop | Type | Notes |
|---|---|---|
| `orient` | `'rows-periods' \| 'cols-periods'` | Switches row vs. column layout |
| `compact` | `boolean` | Phone landscape: smaller cells, reduced font |
| `mini` | `boolean` | Phone landscape: no text labels in cells, emoji only |
| `schedule` | `EditableSchedule` | All periods for the week |
| `todayDow` | `DayOfWeek` | Highlights today's column/row |
| `nowMinutes` | `number` | Current time in minutes for live indicator |
| `dateByDay` | `Record<DayOfWeek, string>` | `"DD/MM"` string for each column/row header |

### 4.2 `PeriodCell`

Each cell inside `WeekGrid`. Uses `color-mix(in oklab, <subjectHex> 14%, white)` for background tinting.

**Required:** Every subject in `SUBJECTS` (`lib/data/subjects.ts`) must expose a `hex` field (e.g., `'#3b82f6'`) in addition to `color` (the Tailwind class). The cell reads `hex` directly rather than deriving a color from a class name.

### 4.3 `DayTabs` (Phone Portrait)

Tab bar with `portrait:` visibility. One tab per active school day (Mon–Fri). Each tab shows:

- Short day name (e.g., "T2")
- Date below (`"28/05"`)
- Today indicator dot

### 4.4 `DayList` (Phone Portrait)

Scrollable list of `PeriodRow` entries for the selected day. Each row shows:

- Time range
- Subject icon + name
- Room number (if set)
- Live indicator for current period

### 4.5 `TodayAccentCard` (Landscape Sidebar)

Small card in the right aside showing today's remaining periods and evening blocks at a glance.

---

## 5. Subject Data Change Required

The new `PeriodCell` needs hex colors from the subject definition. Update `lib/data/subjects.ts`:

```typescript
// Before
export const SUBJECTS = [
  { id: 'math', name: 'Toán', color: 'bg-math' },
  // ...
]

// After
export const SUBJECTS = [
  { id: 'math', name: 'Toán', color: 'bg-math', hex: '#3b82f6' },
  // ...
]
```

This is the only breaking change. No DB migration needed.

---

## 6. Responsive Rules

Per `docs/guides/responsive-spec.md`, base styles target landscape. Portrait is the override.

**Landscape layout (base):**

```
┌────────────────────────┬─────────────────────────┐
│  flex-1                │  w-72                   │
│  WeekGrid cols-periods │  TodayAccentCard         │
│  (scrollable only if   │  + SubjectLegend         │
│  > 5 periods)          │  (always fully visible) │
└────────────────────────┴─────────────────────────┘
```

**Portrait override (`portrait:` prefix):**

```
┌──────────────────────────────────────────────┐
│  DayTabs (full width)                        │
├──────────────────────────────────────────────┤
│  DayList (scrollable, full width)            │
└──────────────────────────────────────────────┘
```

**Tap target rules:**

- Period cells: `min-h-[48px]` — full-row tap area
- Day tab buttons: `min-h-[48px]`

---

## 7. File Change List

| File | Change Type | Notes |
|---|---|---|
| `components/schedule/WeekGrid.tsx` | NEW | Main grid, both orientations |
| `components/schedule/PeriodCell.tsx` | NEW | Individual period cell with color-mix tinting |
| `components/schedule/DayTabs.tsx` | NEW | Phone portrait tab bar |
| `components/schedule/DayList.tsx` | NEW | Phone portrait period list |
| `components/schedule/TodayAccentCard.tsx` | NEW | Landscape aside card |
| `components/schedule/SubjectLegend.tsx` | NEW | Subject colour legend for aside |
| `lib/data/subjects.ts` | MODIFY | Add `hex` field to each subject |
| `app/(dashboard)/schedule/page.tsx` | MODIFY | Switch to new component tree, pass `dateByDay` |
