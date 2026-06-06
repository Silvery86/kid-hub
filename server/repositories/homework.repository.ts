import { db } from '@/lib/db'
import type { HomeworkItem, DayOfWeek } from '@/types'

/** Returns today's homework items (from DailyHomework table) for a user. */
export const getTodayHomework = async (
  userId: string,
  _day: DayOfWeek,
  date: string
): Promise<HomeworkItem[]> => {
  const items = await db.dailyHomework.findMany({
    where: { userId, date },
    orderBy: { createdAt: 'asc' },
  })

  return items.map((p) => ({
    periodId: p.id,
    subjectId: p.subjectId,
    homeworkNote: p.label,
    startTime: '',
    isDone: p.isDone,
    doneAt: p.doneAt?.toISOString(),
  }))
}

/** Marks a DailyHomework item as done. Returns { marked: true } only on first completion. */
export const markDone = async (periodId: string, userId: string): Promise<{ marked: boolean }> => {
  const result = await db.dailyHomework.updateMany({
    where: { id: periodId, userId, isDone: false },
    data: { isDone: true, doneAt: new Date() },
  })
  return { marked: result.count > 0 }
}
