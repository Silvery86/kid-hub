// Server-only module — do NOT import from client components or hooks.
import 'server-only'

import type {
  ClassPeriod,
  DailySchedule,
  WeeklySchedule,
  DayOfWeek,
  DailyHomework,
  TodayView,
  TimeBand,
} from '@/types'
import { DAYS_OF_WEEK } from '@/lib/constants'
import * as scheduleRepo from '@/server/repositories/schedule.repository'
export type { CreatePeriodInput, UpdatePeriodInput, CreateDailyHomeworkInput } from '@/server/repositories/schedule.repository'

/** Map JS Date.getDay() (0=Sun … 6=Sat) to DayOfWeek. */
export const jsDateToDayOfWeek = (date: Date): DayOfWeek | null => {
  const map: Partial<Record<number, DayOfWeek>> = {
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
    0: 'sunday',
  }
  return map[date.getDay()] ?? null
}

/** Return today's DailySchedule from a WeeklySchedule, or null if no data. */
export const deriveToday = (schedule: WeeklySchedule): DailySchedule | null => {
  const today = jsDateToDayOfWeek(new Date())
  if (!today) return null
  return schedule.days.find((d) => d.day === today) ?? null
}

/** Return the next upcoming ClassPeriod relative to current wall-clock time. */
export const findNextClass = (daily: DailySchedule): ClassPeriod | null => {
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  return daily.periods.find((p) => p.startTime > currentTime) ?? null
}

/**
 * Returns true if the proposed period overlaps any existing period on the same day.
 * Overlap: newStart < existingEnd AND newEnd > existingStart.
 * Skips entries without a periodNumber (extra class blocks use startTime comparison instead).
 */
export const validatePeriodOverlap = (proposed: ClassPeriod, existing: ClassPeriod[]): boolean =>
  existing.some(
    (p) =>
      (p.periodNumber == null || p.periodNumber !== proposed.periodNumber) &&
      proposed.startTime < p.endTime &&
      proposed.endTime > p.startTime
  )

/** Return all days in order as defined by DAYS_OF_WEEK constant. */
export const sortDays = (days: DailySchedule[]): DailySchedule[] =>
  [...days].sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day))

/** Derives the time band ("morning" | "afternoon" | "evening") from an "HH:MM" string. */
export const deriveTimeBand = (startTime: string): TimeBand => {
  const minutes = parseInt(startTime.slice(0, 2), 10) * 60 + parseInt(startTime.slice(3, 5), 10)
  if (minutes < 12 * 60) return 'morning'
  if (minutes < 17 * 60) return 'afternoon'
  return 'evening'
}

/** Removes extra class entries whose periodId appears in the cancelled set. */
export const filterCancelledSlots = (
  blocks: ClassPeriod[],
  cancelledIds: string[]
): ClassPeriod[] => {
  if (cancelledIds.length === 0) return blocks
  const cancelled = new Set(cancelledIds)
  return blocks.filter((b) => !b.id || !cancelled.has(b.id))
}

/**
 * Merges school periods, evening blocks, overrides, and daily homework into a single
 * TodayView for the kid schedule page.
 */
export const buildTodayView = (
  date: string,
  schoolPeriods: ClassPeriod[],
  eveningBlocks: ClassPeriod[],
  cancelledIds: string[],
  homework: DailyHomework[]
): TodayView => ({
  date,
  schoolPeriods: [...schoolPeriods].sort(
    (a, b) => (a.periodNumber ?? 99) - (b.periodNumber ?? 99)
  ),
  eveningBlocks: filterCancelledSlots(eveningBlocks, cancelledIds),
  cancelledIds,
  homework,
})

// ── DB-backed schedule operations ────────────────────────────────────────────

export const getWeeklySchedule = (userId: string) => scheduleRepo.getWeeklySchedule(userId)
export const getDaySchedule = (userId: string, day: DayOfWeek) => scheduleRepo.getDaySchedule(userId, day)
export const getAllEveningBlocks = (userId: string) => scheduleRepo.getAllEveningBlocks(userId)
export const getEveningBlocks = (userId: string, day: DayOfWeek) => scheduleRepo.getEveningBlocks(userId, day)
export const getOverridesForDate = (userId: string, date: string) => scheduleRepo.getOverridesForDate(userId, date)
export const getDailyHomework = (userId: string, date: string) => scheduleRepo.getDailyHomework(userId, date)
export const countEveningBlocks = (userId: string, day: DayOfWeek) => scheduleRepo.countEveningBlocks(userId, day)
export const createPeriod = (data: scheduleRepo.CreatePeriodInput) => scheduleRepo.createPeriod(data)
export const updatePeriod = (data: scheduleRepo.UpdatePeriodInput) => scheduleRepo.updatePeriod(data)
export const deletePeriod = (id: string, userId: string) => scheduleRepo.deletePeriod(id, userId)
export const createOverride = (periodId: string, userId: string, date: string, reason?: string) =>
  scheduleRepo.createOverride(periodId, userId, date, reason)
export const deleteOverride = (periodId: string, date: string) => scheduleRepo.deleteOverride(periodId, date)
export const getDailyHomeworkForDate = (userId: string, date: string) => scheduleRepo.getDailyHomework(userId, date)
export const createDailyHomework = (data: scheduleRepo.CreateDailyHomeworkInput) =>
  scheduleRepo.createDailyHomework(data)
export const toggleDailyHomeworkDone = (id: string, userId: string, isDone: boolean) =>
  scheduleRepo.toggleDailyHomeworkDone(id, userId, isDone)
export const deleteDailyHomework = (id: string, userId: string) =>
  scheduleRepo.deleteDailyHomework(id, userId)
