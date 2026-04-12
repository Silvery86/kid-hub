// Server-only module — do NOT import from client components or hooks.
// Business logic only — pure functions that receive data as arguments.
// No direct DB calls here; repositories are called by Server Actions.

import type { ClassPeriod, DailySchedule, WeeklySchedule, DayOfWeek } from '@/types'
import { DAYS_OF_WEEK } from '@/lib/constants'

/** Map JS Date.getDay() (0=Sun) to DayOfWeek. Returns null on weekends. */
const jsDateToDayOfWeek = (date: Date): DayOfWeek | null => {
  const map: Array<DayOfWeek | null> = [
    null,
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    null,
  ]
  return map[date.getDay()] ?? null
}

/** Return today's DailySchedule from a WeeklySchedule, or null if weekend. */
export const deriveToday = (schedule: WeeklySchedule): DailySchedule | null => {
  // TODO Sprint 2: use real date logic
  const today = jsDateToDayOfWeek(new Date())
  if (!today) return null
  return schedule.days.find((d) => d.day === today) ?? null
}

/** Return the next upcoming ClassPeriod relative to current wall-clock time. */
export const findNextClass = (daily: DailySchedule): ClassPeriod | null => {
  // TODO Sprint 2: compare period startTime against current HH:MM
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return daily.periods.find((p) => p.startTime > currentTime) ?? null
}

/**
 * Returns true if the proposed period overlaps any existing period on the same day.
 * Overlap defined as: newStart < existingEnd AND newEnd > existingStart.
 */
export const validatePeriodOverlap = (proposed: ClassPeriod, existing: ClassPeriod[]): boolean =>
  existing.some(
    (p) =>
      p.periodNumber !== proposed.periodNumber &&
      proposed.startTime < p.endTime &&
      proposed.endTime > p.startTime
  )

/** Return all days in order as defined by DAYS_OF_WEEK constant. */
export const sortDays = (days: DailySchedule[]): DailySchedule[] =>
  [...days].sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day))
