import 'server-only'

import type { DayOfWeek, HomeworkItem } from '@/types'
import * as homeworkRepo from '@/server/repositories/homework.repository'

/** Returns today's date as "YYYY-MM-DD" — used as the daily key for HomeworkCompletion records. */
export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

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

export const getTodayHomework = (userId: string, day: DayOfWeek, date: string): Promise<HomeworkItem[]> =>
  homeworkRepo.getTodayHomework(userId, day, date)

export const markDone = (periodId: string, userId: string, date: string): Promise<void> =>
  homeworkRepo.markDone(periodId, userId, date)
