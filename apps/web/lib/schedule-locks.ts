/**
 * When a date may block a schedule edit.
 *
 * The parent schedule screen mixes two kinds of entry, and conflating them is
 * what produced the bug this module exists to prevent:
 *
 *  - `EXTRA_CLASS` is a RECURRING weekly arrangement. It carries `day`, never a
 *    date, so a Monday row governs every Monday. Locking it against the
 *    calendar date of whichever week the parent happens to be viewing blocks a
 *    correct edit and protects nothing: the edit rewrites past weeks either
 *    way, because the row was never date-scoped. Paging to next week
 *    "unlocked" the same row, which made the lock a puzzle rather than a rule.
 *
 *  - `SCHOOL_PERIOD` became date-scoped in Phase 6: every row belongs to one
 *    week. The date rule is therefore true for it, and `canEditWeek` states it.
 *    This is not a reversal of the fix above — it is the same rule applied to
 *    data that finally has a date to be judged against.
 *
 *  - `DailyHomework` has a real `date` column. Backdating homework onto a day
 *    that has already happened is meaningless, so the date rule belongs here
 *    and only here.
 *
 * Both live in one file so the distinction is written down once and pinned by a
 * test, rather than surviving as an absence inside a 900-line component.
 */

/** True when `isoDate` ("YYYY-MM-DD") falls before `todayIso`. Zero-padded, so lexical order is chronological. */
export const isPastIsoDate = (isoDate: string, todayIso: string): boolean => isoDate < todayIso

/**
 * A dated entry (homework) is editable today or later, never in the past.
 */
export const canEditDatedEntry = (selectedDate: string, todayIso: string): boolean =>
  !isPastIsoDate(selectedDate, todayIso)

/**
 * A recurring template has no date, so no date can lock it. Always true.
 *
 * Exported deliberately: the call sites read `canEditRecurringEntry()` rather
 * than nothing at all, so re-introducing a date check there is a visible edit
 * against a named rule instead of a plausible-looking addition.
 */
export const canEditRecurringEntry = (): boolean => true

/**
 * A week of school periods is editable while it is the current week or a later
 * one; a week that has finished is a record of what the child actually did.
 *
 * Both arguments are Mondays, never "today": mid-week the week in progress is
 * still open, and comparing a Monday to a Wednesday would close it on Tuesday.
 * The week the parent is in comes from `weekStartOfToday()` in @kid-hub/shared.
 */
export const canEditWeek = (weekStart: string, currentWeekStart: string): boolean =>
  !isPastIsoDate(weekStart, currentWeekStart)

/**
 * A single school day inside an editable week.
 *
 * The week-level rule (`canEditWeek`) is not enough on its own: on Thursday,
 * Monday of the same week has already happened, and a parent editing it would
 * be rewriting a day the child has already lived. Phase 2 refused this rule
 * because the rows carried no date; Phase 6 gave them one, so it now holds.
 *
 * Whole days only — see `isPastSchoolDay` for why the clock does not lock
 * individual periods as they pass.
 */
export const canEditSchoolDay = (dayDateIso: string, todayIso: string): boolean =>
  !isPastIsoDate(dayDateIso, todayIso)
