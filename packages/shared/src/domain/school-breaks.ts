// Days the regular timetable does not run — pure, isomorphic.
//
// Two kinds, and the difference is not length:
//
//  - PUBLIC_HOLIDAY (nghỉ lễ) — a day off. Tết, 30/4, Quốc khánh, or anything
//    the school declares. Usually one to nine days.
//
//  - SUMMER_BREAK (nghỉ hè) — the 2–3 months between one grade and the next,
//    declared by the parent when the school announces it. It is NOT an empty
//    stretch: summer classes (học hè) and summer homework carry on through it.
//    That is why it suppresses only SCHOOL_PERIOD rows and leaves extra classes
//    and homework alone.
//
// Both suppress the school timetable and nothing else. Extra classes already
// have their own per-date cancellation (ExtraClassOverride) and homework is
// entered by hand for a specific date — silently hiding either would be
// throwing away something the parent typed. See docs/SCHEDULE_PARENT_IMP.md §13.

import { SCHOOL_DAYS } from '../constants'
import type { SchoolBreak } from '../types'
import { addWeeks, type IsoDate } from './school-weeks'

/** True when `iso` falls inside the break, both ends inclusive. */
export const coversDate = (brk: SchoolBreak, iso: IsoDate): boolean =>
  iso >= brk.startDate && iso <= brk.endDate

/**
 * The break covering `iso`, or null.
 *
 * A summer break wins over a public holiday on the same date: 2/9 falling
 * inside nghỉ hè is still nghỉ hè as far as the child is concerned, and
 * showing "Quốc khánh" for one day in the middle of the summer would imply
 * school resumes either side of it.
 */
export const findBreakForDate = (
  breaks: SchoolBreak[],
  iso: IsoDate
): SchoolBreak | null => {
  const covering = breaks.filter((brk) => coversDate(brk, iso))
  if (covering.length === 0) return null
  return covering.find((brk) => brk.kind === 'SUMMER_BREAK') ?? covering[0]!
}

/** True when the regular timetable does not run on `iso`. */
export const isDayOff = (breaks: SchoolBreak[], iso: IsoDate): boolean =>
  findBreakForDate(breaks, iso) !== null

/** The Mon–Fri dates of the week starting `weekStart`, as ISO strings. */
export const schoolDatesOfWeek = (weekStart: IsoDate): IsoDate[] => {
  const monday = new Date(`${weekStart}T00:00:00.000Z`)
  return SCHOOL_DAYS.map((_, index) => {
    const date = new Date(monday.getTime() + index * 86_400_000)
    return date.toISOString().slice(0, 10)
  })
}

/** Every break touching any school day of the given week. */
export const breaksInWeek = (breaks: SchoolBreak[], weekStart: IsoDate): SchoolBreak[] => {
  const dates = schoolDatesOfWeek(weekStart)
  const seen = new Set<string>()
  const out: SchoolBreak[] = []
  for (const date of dates) {
    const brk = findBreakForDate(breaks, date)
    if (!brk) continue
    const identity = brk.id ?? `${brk.kind}-${brk.startDate}-${brk.endDate}`
    if (seen.has(identity)) continue
    seen.add(identity)
    out.push(brk)
  }
  return out
}

/**
 * True when no school day of the week is taught.
 *
 * This is what makes copy-week skip a Tết week: writing a timetable into a week
 * the child spends at home is not wrong so much as pointless, and it would put
 * "own rows" on a week that should keep inheriting.
 */
export const isWholeWeekOff = (breaks: SchoolBreak[], weekStart: IsoDate): boolean =>
  schoolDatesOfWeek(weekStart).every((date) => isDayOff(breaks, date))

/** Breaks that have not finished by `today`, soonest first — what a parent needs to see. */
export const upcomingBreaks = (breaks: SchoolBreak[], today: IsoDate): SchoolBreak[] =>
  breaks
    .filter((brk) => brk.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

/**
 * Whole days in a break, both ends inclusive.
 *
 * Used to say "nghỉ 9 ngày" rather than making the parent subtract two dates,
 * and to sanity-check a summer break the parent typed: three months is normal,
 * three days is a typo.
 */
export const breakLengthInDays = (brk: SchoolBreak): number => {
  const start = new Date(`${brk.startDate}T00:00:00.000Z`).getTime()
  const end = new Date(`${brk.endDate}T00:00:00.000Z`).getTime()
  return Math.round((end - start) / 86_400_000) + 1
}

/**
 * The week a break's last day falls in, so the UI can offer "go to the week
 * school starts again" rather than making the parent page through the summer.
 */
export const weekAfterBreak = (brk: SchoolBreak): IsoDate => {
  const end = new Date(`${brk.endDate}T00:00:00.000Z`)
  const dayOfWeek = end.getUTCDay()
  const backToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const mondayOfEndWeek = new Date(end.getTime() - backToMonday * 86_400_000)
    .toISOString()
    .slice(0, 10)
  return addWeeks(mondayOfEndWeek, 1)
}

/**
 * The summer break that has finished and whose promotion the parent has not
 * confirmed yet, or null.
 *
 * Deliberately a *question to ask*, never an action to take. Advancing a grade
 * on a date alone gets it wrong for a child repeating a year, for one who
 * changed school mid-summer, and for a family that entered the break to block
 * out lessons and never thought about grades at all. The date decides when to
 * ask; the parent decides the answer.
 *
 * A break is only pending once it has genuinely ended — on its last day the
 * child is still on holiday, so the comparison is strict.
 */
export const pendingPromotion = (
  breaks: SchoolBreak[],
  today: IsoDate
): SchoolBreak | null =>
  breaks
    .filter(
      (brk) =>
        brk.kind === 'SUMMER_BREAK' &&
        brk.promotesToGrade != null &&
        !brk.promotedAt &&
        brk.endDate < today
    )
    .sort((a, b) => b.endDate.localeCompare(a.endDate))[0] ?? null
