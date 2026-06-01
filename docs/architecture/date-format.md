# DATE_FORMAT — DD/MM Labels on Schedule Views

> **Status:** For Review
> **Scope:** `/schedule` · `/dashboard` · `/parent`
> **No DB changes needed**
> **Date:** 2026-05-31

---

## 1. Overview & Goal

Currently every day label in the schedule shows only the day name ("Thứ Hai", "Hai", etc.). There is no way to tell _which actual date_ a column or tab represents without checking the week subtitle. This spec adds a **DD/MM date** below or beside every day label — in the main schedule grid, day tabs, summary cards, and the parent schedule manager — so the parent and kid always know exactly which date they are looking at.

### Scope

| Route | Area | Audience | Change |
|---|---|---|---|
| `/schedule` | WeekGrid column / row headers | Kid | Add DD/MM below day name |
| `/schedule` | DayTabs (phone portrait) | Kid | Add DD/MM below short day name |
| `/schedule` | DaySummaryCard (phone portrait) | Kid | Append ", DD/MM" to day label |
| `/schedule` | TodayAccentCard (landscape sidebar) | Kid | Add DD/MM below day name |
| `/schedule` | WeekEveningSection day cards | Kid | Add DD/MM below day label |
| `/dashboard` | Hero subtitle line | Kid | `"Thứ Tư 28/05 · …"` |
| `/parent` | ScheduleManager day tabs (school) | Parent | Add DD/MM below short name |
| `/parent` | ScheduleManager day selector (evening) | Parent | Add DD/MM below short name |

**Not in scope:** The `/parent` `TodayOverviewPanel` already shows a full date string via `formatViDate()` — no change needed there.

---

## 2. New Utility Function — `getWeekDates()`

A single pure function added to `lib/schedule-display.ts`. It wraps the existing `getMondayForWeekOffset()` to produce a `Record<DayOfWeek, string>` mapping each day to its `"DD/MM"` label.

```typescript
/** Returns DD/MM date string for every day of the week at the given offset.
 *  weekOffset 0 = current week, -1 = last week, +1 = next week. */
export const getWeekDates = (weekOffset: number): Record<DayOfWeek, string> => {
  const monday = getMondayForWeekOffset(weekOffset)
  const WEEK_DAYS: DayOfWeek[] = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday',
  ]
  return Object.fromEntries(
    WEEK_DAYS.map((dow, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      return [dow, `${dd}/${mm}`]
    })
  ) as Record<DayOfWeek, string>
}
```

For `/dashboard` (no weekOffset), today's date is computed directly:

```typescript
const getTodayDDMM = (): string => {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}
```

---

## 3. Data Flow

**Kid `/schedule` route:**

```
getWeekDates(weekOffset)
  → ScheduleView (weekDates computed)
    → WeekGrid (dateByDay prop)
      → Column/row header cells
    → DayTabs (dateByDay prop)
      → Each tab shows DD/MM below day name
    → DaySummaryCard (dateByDay prop)
```

**Kid `/dashboard` route:**

```
getTodayDDMM()
  → DashboardView (todayDDMM prop)
    → Hero subtitle "Thứ Tư 28/05 · …"
```

**Parent `/parent` route:**

```
getWeekDates(weekOffset) — called inside ScheduleManager
  → Day tabs (school section)
  → Day selector (evening section)
```

---

## 4. Component-by-Component Spec

### 4.1 WeekGrid Column Headers

**Before:**

```
│  T2  │  T3  │  T4  │  T5  │  T6  │
```

**After:**

```
│  T2  │  T3  │  T4  │  T5  │  T6  │
│ 27/05│ 28/05│ 29/05│ 30/05│ 31/05│
```

- Date text: `text-[10px] font-semibold text-slate-400`
- No change to column widths

### 4.2 DayTabs (Phone Portrait)

**Before:**

```
[ T2 ] [ T3 ] [ T4 ] [ T5 ] [ T6 ]
```

**After:**

```
[ T2   ] [ T3   ] [ T4   ] [ T5   ] [ T6   ]
[ 27/05] [ 28/05] [ 29/05] [ 30/05] [ 31/05]
```

- Stack day name on top, date below in `text-[10px]`

### 4.3 Dashboard Hero Subtitle

**Before:**

```
Thứ Tư · Học tốt hôm nay nhé Khôi!
```

**After:**

```
Thứ Tư 28/05 · Học tốt hôm nay nhé Khôi!
```

- Append `" ${todayDDMM}"` after the day name
- No layout change — same single line

### 4.4 ScheduleManager Day Tabs (Parent)

**Before:**

```
[ T2 ] [ T3 ] [ T4 ] [ T5 ] [ T6 ]
```

**After:**

```
[ T2   ] [ T3   ] [ T4   ] [ T5   ] [ T6   ]
[ 27/05] [ 28/05] [ 29/05] [ 30/05] [ 31/05]
```

Same pattern as DayTabs above, applied to both the school period tabs and the evening section day selector.

---

## 5. File Change List

| File | Change | Notes |
|---|---|---|
| `lib/schedule-display.ts` | ADD `getWeekDates()` | New pure function |
| `lib/schedule-display.ts` | ADD `getTodayDDMM()` | Today's date helper |
| `components/schedule/WeekGrid.tsx` | MODIFY | Accept `dateByDay` prop; render DD/MM in headers |
| `components/schedule/DayTabs.tsx` | MODIFY | Accept `dateByDay` prop; render DD/MM below day name |
| `components/schedule/DaySummaryCard.tsx` | MODIFY | Accept `date` string; append to day label |
| `components/schedule/TodayAccentCard.tsx` | MODIFY | Accept `date` string; render below day name |
| `components/schedule/WeekEveningSection.tsx` | MODIFY | Accept `dateByDay` prop; render DD/MM on day cards |
| `components/dashboard/DashboardView.tsx` | MODIFY | Compute `todayDDMM`; insert into hero subtitle |
| `components/parent/ScheduleManager.tsx` | MODIFY | Compute `getWeekDates(weekOffset)`; pass to school and evening day selectors |
| `app/(dashboard)/schedule/page.tsx` | MODIFY | Compute `getWeekDates(weekOffset)`; pass to `ScheduleView` |

---

## 6. Implementation Order

1. Add `getWeekDates()` and `getTodayDDMM()` to `lib/schedule-display.ts`.
2. Update `WeekGrid` — accept and render `dateByDay` — this is the highest-value change.
3. Update `DayTabs` — same pattern.
4. Update `DashboardView` hero subtitle — quick, single-line change.
5. Update `ScheduleManager` day selectors (parent) — pass weekDates computed from the manager's `weekOffset` state.
6. Update remaining schedule components (`DaySummaryCard`, `TodayAccentCard`, `WeekEveningSection`).
