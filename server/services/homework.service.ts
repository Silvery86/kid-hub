import 'server-only'

import type { DayOfWeek, HomeworkItem } from '@/types'
import * as homeworkRepo from '@/server/repositories/homework.repository'

/** Returns today's date as "YYYY-MM-DD" — used as the daily key for HomeworkCompletion records. */
export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

/** Fetches today's homework items for a user. */
export const fetchTodayHomework = async (
  userId: string,
  day: DayOfWeek,
  dateKey: string
): Promise<HomeworkItem[]> => homeworkRepo.getTodayHomework(userId, day, dateKey)

/** Marks a homework period (DailyHomework) as done. */
export const completePeriodHomework = async (
  periodId: string,
  userId: string,
  dateKey: string
): Promise<void> => homeworkRepo.markDone(periodId, userId, dateKey)

/** Returns today's DayOfWeek, or null on weekends. */
export const todayDayOfWeek = (): DayOfWeek | null => {
  const map: Array<DayOfWeek | null> = [
    null,
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    null,
  ]
  return map[new Date().getDay()] ?? null
}
