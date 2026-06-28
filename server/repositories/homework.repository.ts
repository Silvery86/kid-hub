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

/** Marks a DailyHomework item as done. `periodId` maps to DailyHomework.id. */
export const markDone = async (periodId: string, userId: string, _date: string): Promise<void> => {
  await db.dailyHomework.update({
    where: { id: periodId, userId },
    data: { isDone: true, doneAt: new Date() },
  })
}
