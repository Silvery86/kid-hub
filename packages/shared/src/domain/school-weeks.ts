// Week maths for a dated timetable — pure, isomorphic.
//
// Every function here works on "YYYY-MM-DD" strings anchored to UTC midnight.
// That is deliberate: a Monday must be the same Monday in Hanoi, in CI and in
// Postgres, and `new Date('2026-09-14')` parsed as local time in a UTC-negative
// zone lands on the Sunday. Only `weekStartOfToday` reads a real clock, and it
// reads it in local time, because "which week am I in" is a local question.
//
// See docs/SCHEDULE_PARENT_IMP.md §12.2.

import {
  DAYS_OF_WEEK,
  FIRST_TERM_END_MMDD,
  MAX_COPY_WEEKS,
  SECOND_TERM_END_MMDD,
} from '../constants'
import type { DayOfWeek } from '../types'

/** "YYYY-MM-DD" — the Monday of a school week, and the key a week is stored under. */
export type IsoDate = string

const DAY_MS = 86_400_000

const parseIsoUtc = (iso: IsoDate): Date => new Date(`${iso}T00:00:00.000Z`)

const formatIsoUtc = (date: Date): IsoDate => date.toISOString().slice(0, 10)

/** True for a well-formed calendar date. Rejects "2026-13-01" as well as junk. */
export const isIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  // "2026-02-30" matches the shape but is not a date; JS parses it to Invalid
  // Date, whose toISOString() throws rather than returning something comparable.
  const parsed = parseIsoUtc(value)
  return !Number.isNaN(parsed.getTime()) && formatIsoUtc(parsed) === value
}

/**
 * The Monday of the week containing `iso`.
 *
 * Sunday belongs to the week that began six days earlier — the ISO convention,
 * and the one Postgres `date_trunc('week', …)` uses, so the backfill migration
 * and the application agree on which rows belong to which week.
 */
export const weekStartOf = (iso: IsoDate): IsoDate => {
  const date = parseIsoUtc(iso)
  const dayOfWeek = date.getUTCDay()
  const backToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return formatIsoUtc(new Date(date.getTime() - backToMonday * DAY_MS))
}

/** Today's date in the *local* zone as "YYYY-MM-DD" — never via toISOString(). */
export const localIsoDate = (date = new Date()): IsoDate =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

/** The Monday of the week the caller is living in. */
export const weekStartOfToday = (now = new Date()): IsoDate => weekStartOf(localIsoDate(now))

/** Shifts a date by whole weeks. Negative goes back. */
export const addWeeks = (iso: IsoDate, weeks: number): IsoDate =>
  formatIsoUtc(new Date(parseIsoUtc(iso).getTime() + weeks * 7 * DAY_MS))

/** Whole weeks from `from` to `to`; negative when `to` is earlier. */
export const weeksBetween = (from: IsoDate, to: IsoDate): number =>
  Math.round((parseIsoUtc(to).getTime() - parseIsoUtc(from).getTime()) / (7 * DAY_MS))

/**
 * Every Monday strictly after `fromWeek` up to and including the week that
 * contains `throughDate`. Empty when `throughDate` is not in a later week —
 * the caller then has nothing to copy into and should say so rather than write.
 */
export const weekStartsBetween = (
  fromWeek: IsoDate,
  throughDate: IsoDate,
  maxWeeks = MAX_COPY_WEEKS
): IsoDate[] => {
  const last = weekStartOf(throughDate)
  const count = Math.min(weeksBetween(fromWeek, last), maxWeeks)
  const out: IsoDate[] = []
  for (let i = 1; i <= count; i += 1) out.push(addWeeks(fromWeek, i))
  return out
}

/**
 * The last day of the semester `iso` falls in — assumption A3, §12.4.
 *
 * Vietnamese primary schools run học kỳ I from the start of the school year to
 * mid-January and học kỳ II to the end of May. The exact dates vary by
 * province, so these are constants the copy dialog always prints rather than a
 * fact the code asserts silently.
 */
export const semesterEndIso = (iso: IsoDate): IsoDate => {
  const year = Number(iso.slice(0, 4))
  const monthDay = iso.slice(5)
  // Before mid-January: still in học kỳ I, which ends this calendar year.
  if (monthDay <= FIRST_TERM_END_MMDD) return `${year}-${FIRST_TERM_END_MMDD}`
  // After the second term ends, the next boundary is học kỳ I of the new year.
  if (monthDay > SECOND_TERM_END_MMDD) return `${year + 1}-${FIRST_TERM_END_MMDD}`
  return `${year}-${SECOND_TERM_END_MMDD}`
}

/**
 * A week is closed once it is behind the week the parent is in.
 *
 * The comparison is between two Mondays, never between a Monday and today:
 * mid-week, the week in progress is still editable, and only a *previous*
 * week is a record.
 */
export const isPastWeek = (weekStart: IsoDate, currentWeekStart: IsoDate): boolean =>
  weekStart < currentWeekStart

/**
 * The calendar date a weekday falls on within a given week.
 *
 * Once a period belongs to a dated week, "Thứ Hai" stops being an abstract
 * column heading and becomes a real day that can be in the past — which is what
 * makes a per-day edit lock meaningful where Phase 2 correctly refused one.
 */
export const dateOfWeekday = (weekStart: IsoDate, day: DayOfWeek): IsoDate => {
  const offset = DAYS_OF_WEEK.indexOf(day)
  if (offset < 0) return weekStart
  return formatIsoUtc(new Date(parseIsoUtc(weekStart).getTime() + offset * DAY_MS))
}

/**
 * True when a school day has finished.
 *
 * Whole days only. A lesson that ended an hour ago still belongs to a day the
 * parent may be writing up, and locking cells as the clock passes each tiết
 * would make the grid change under their hands. Today stays open; yesterday
 * does not — the same rule `canEditDatedEntry` already applies to homework.
 */
export const isPastSchoolDay = (
  weekStart: IsoDate,
  day: DayOfWeek,
  todayIso: IsoDate
): boolean => dateOfWeekday(weekStart, day) < todayIso
