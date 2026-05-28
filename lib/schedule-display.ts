/** Pure helpers for schedule UI — week labels, period slots, stats. */

import { DAY_LABELS, SCHOOL_DAYS } from '@/lib/constants'
import type { ClassPeriod, DailySchedule, DayOfWeek } from '@/types'

export interface PeriodSlotLabel {
  periodNumber: number
  startTime: string
  endTime: string
}

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

/** School period rows only (excludes evening extra-class blocks). */
export const schoolPeriodsOnly = (periods: ClassPeriod[]): ClassPeriod[] =>
  periods.filter((p) => p.periodNumber != null)

export const getMaxPeriodNumber = (days: DailySchedule[]): number => {
  let max = 0
  for (const day of days) {
    for (const p of schoolPeriodsOnly(day.periods)) {
      if (p.periodNumber != null && p.periodNumber > max) max = p.periodNumber
    }
  }
  return max || 5
}

/** Column/row headers for period slots — times from first day that has each period. */
export const getPeriodSlotLabels = (days: DailySchedule[]): PeriodSlotLabel[] => {
  const max = getMaxPeriodNumber(days)
  return Array.from({ length: max }, (_, i) => {
    const periodNumber = i + 1
    for (const day of days) {
      const p = schoolPeriodsOnly(day.periods).find((x) => x.periodNumber === periodNumber)
      if (p) {
        return {
          periodNumber,
          startTime: p.startTime,
          endTime: p.endTime,
        }
      }
    }
    return { periodNumber, startTime: '', endTime: '' }
  })
}

export const getPeriodForCell = (
  day: DailySchedule | undefined,
  periodNumber: number
): ClassPeriod | undefined =>
  day ? schoolPeriodsOnly(day.periods).find((p) => p.periodNumber === periodNumber) : undefined

export const formatPeriodDuration = (startTime: string, endTime: string): number => {
  const mins = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime)
  return mins > 0 ? mins : 40
}

export const formatDayTimeRange = (periods: ClassPeriod[]): string => {
  const school = schoolPeriodsOnly(periods)
  if (school.length === 0) return '—'
  const sorted = [...school].sort((a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0))
  const first = sorted[0]
  const last = sorted[sorted.length - 1]
  return `${first?.startTime ?? ''} → ${last?.endTime ?? ''}`
}

const MONTH_NAMES = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
]

/** Monday 12:00 local for a calendar week (0 = this week, -1 = previous, +1 = next). */
export const getMondayForWeekOffset = (weekOffset: number, refDate = new Date()): Date => {
  const day = refDate.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(refDate)
  monday.setHours(12, 0, 0, 0)
  monday.setDate(refDate.getDate() + diff + weekOffset * 7)
  return monday
}

export const getIsoWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/** Subtitle: week number + Mon–Fri date range (no clock — avoids SSR/client hydration drift). */
export const formatWeekSubtitleForOffset = (weekOffset: number): string => {
  const start = getMondayForWeekOffset(weekOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 4)
  const range = `${start.getDate()}–${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`
  return `Tuần ${getIsoWeekNumber(start)} · ${range}`
}

export interface WeekStats {
  totalPeriods: number
  uniqueSubjects: number
}

export const computeWeekStats = (days: DailySchedule[]): WeekStats => {
  const subjectIds = new Set<string>()
  let totalPeriods = 0
  for (const day of days) {
    for (const p of schoolPeriodsOnly(day.periods)) {
      totalPeriods += 1
      subjectIds.add(p.subjectId)
    }
  }
  return { totalPeriods, uniqueSubjects: subjectIds.size }
}

export const countSubjectDistribution = (
  days: DailySchedule[]
): { subjectId: string; count: number }[] => {
  const counts = new Map<string, number>()
  for (const day of days) {
    for (const p of schoolPeriodsOnly(day.periods)) {
      counts.set(p.subjectId, (counts.get(p.subjectId) ?? 0) + 1)
    }
  }
  return [...counts.entries()]
    .map(([subjectId, count]) => ({ subjectId, count }))
    .sort((a, b) => b.count - a.count)
}

export const dayLabel = (dow: DayOfWeek): string => DAY_LABELS[dow]

const DAY_SHORT_MAP: Record<DayOfWeek, string> = {
  monday: 'T2',
  tuesday: 'T3',
  wednesday: 'T4',
  thursday: 'T5',
  friday: 'T6',
  saturday: 'T7',
  sunday: 'CN',
}

/** Short tab label (T2–T6) — local map avoids fragile re-exports from constants. */
export const dayShortLabel = (dow: DayOfWeek): string =>
  DAY_SHORT_MAP[dow] ?? DAY_LABELS[dow]

export const schoolDaysFromSchedule = (days: DailySchedule[]): DailySchedule[] =>
  SCHOOL_DAYS.map((dow) => days.find((d) => d.day === dow) ?? { day: dow, periods: [] })
