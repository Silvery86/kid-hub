// Server-only module — do NOT import from client components or hooks.
import 'server-only'

import type {
  ClassPeriod,
  DailySchedule,
  WeeklySchedule,
  DayOfWeek,
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

// validatePeriodOverlap, deriveTimeBand, filterCancelledSlots and buildTodayView
// are owned by @kid-hub/shared (Phase 2 — mobile_imp.md §10). Re-exported so
// existing callers (e.g. schedule.actions.ts) keep importing them from here.
export {
  validatePeriodOverlap,
  deriveTimeBand,
  filterCancelledSlots,
  buildTodayView,
} from '@kid-hub/shared'

/** Return all days in order as defined by DAYS_OF_WEEK constant. */
export const sortDays = (days: DailySchedule[]): DailySchedule[] =>
  [...days].sort((a, b) => DAYS_OF_WEEK.indexOf(a.day) - DAYS_OF_WEEK.indexOf(b.day))

// ── DB-backed schedule operations ────────────────────────────────────────────

export const getWeeklySchedule = (studentId: string) => scheduleRepo.getWeeklySchedule(studentId)
export const getDaySchedule = (studentId: string, day: DayOfWeek) => scheduleRepo.getDaySchedule(studentId, day)
export const getAllEveningBlocks = (studentId: string) => scheduleRepo.getAllEveningBlocks(studentId)
export const getEveningBlocks = (studentId: string, day: DayOfWeek) => scheduleRepo.getEveningBlocks(studentId, day)
export const getOverridesForDate = (studentId: string, date: string) => scheduleRepo.getOverridesForDate(studentId, date)
export const getDailyHomework = (studentId: string, date: string) => scheduleRepo.getDailyHomework(studentId, date)
export const countEveningBlocks = (studentId: string, day: DayOfWeek) => scheduleRepo.countEveningBlocks(studentId, day)
export const createPeriod = (data: scheduleRepo.CreatePeriodInput) => scheduleRepo.createPeriod(data)
export const getPeriodTimes = (id: string, studentId: string) => scheduleRepo.getPeriodTimes(id, studentId)
export const updatePeriod = (data: scheduleRepo.UpdatePeriodInput) => scheduleRepo.updatePeriod(data)
export const deletePeriod = (id: string, studentId: string) => scheduleRepo.deletePeriod(id, studentId)
export const createOverride = (periodId: string, studentId: string, date: string, reason?: string) =>
  scheduleRepo.createOverride(periodId, studentId, date, reason)
export const deleteOverride = (periodId: string, studentId: string, date: string) =>
  scheduleRepo.deleteOverride(periodId, studentId, date)
export const getDailyHomeworkForDate = (studentId: string, date: string) => scheduleRepo.getDailyHomework(studentId, date)
export const createDailyHomework = (data: scheduleRepo.CreateDailyHomeworkInput) =>
  scheduleRepo.createDailyHomework(data)
export const toggleDailyHomeworkDone = (id: string, studentId: string, isDone: boolean) =>
  scheduleRepo.toggleDailyHomeworkDone(id, studentId, isDone)
export const deleteDailyHomework = (id: string, studentId: string) =>
  scheduleRepo.deleteDailyHomework(id, studentId)
