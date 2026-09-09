/**
 * When a date may block a schedule edit.
 *
 * The parent schedule screen mixes two kinds of entry, and conflating them is
 * what produced the bug this module exists to prevent:
 *
 *  - `ClassPeriod` — both `SCHOOL_PERIOD` and `EXTRA_CLASS` — is a RECURRING
 *    weekly template. It carries `day`, never a date, so a Monday row governs
 *    every Monday. Locking it against the calendar date of whichever week the
 *    parent happens to be viewing blocks a correct edit and protects nothing:
 *    the edit rewrites past weeks either way, because the row was never
 *    date-scoped. Paging to next week "unlocked" the same row, which made the
 *    lock a puzzle rather than a rule.
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
