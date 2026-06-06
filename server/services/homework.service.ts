import 'server-only'

import type { DayOfWeek, HomeworkItem } from '@/types'
import * as homeworkRepo from '@/server/repositories/homework.repository'
import { addPoints, incrementStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'

/** Returns today's date as "YYYY-MM-DD" — used as the daily key for HomeworkCompletion records. */
export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

/** Fetches today's homework items for a user. */
export const fetchTodayHomework = async (
  userId: string,
  day: DayOfWeek,
  dateKey: string
): Promise<HomeworkItem[]> => homeworkRepo.getTodayHomework(userId, day, dateKey)

/**
 * Single entry point for all homework completion.
 * Awards 10 pts, updates streak, and logs activity only on first completion (idempotent).
 */
export const completeHomework = async (
  userId: string,
  periodId: string
): Promise<{ alreadyDone: boolean }> => {
  const { marked } = await homeworkRepo.markDone(periodId, userId)
  if (marked) {
    await incrementStreak(userId)
    await addPoints(userId, 10)
    void recordActivity(userId, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
  }
  return { alreadyDone: !marked }
}

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
