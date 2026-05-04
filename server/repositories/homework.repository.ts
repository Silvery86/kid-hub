import { db } from '@/lib/db'
import type { HomeworkItem, DayOfWeek } from '@/types'

/** Returns all homework periods for a user on a given day, with today's completion status. */
export const getTodayHomework = async (
  userId: string,
  day: DayOfWeek,
  date: string
): Promise<HomeworkItem[]> => {
  const periods = await db.classPeriod.findMany({
    where: { userId, day, isHomework: true },
    include: { homeworkCompletions: { where: { date } } },
    orderBy: { startTime: 'asc' },
  })

  return periods.map((p) => {
    const completion = p.homeworkCompletions[0]
    return {
      periodId: p.id,
      subjectId: p.subjectId,
      homeworkNote: p.homeworkNote ?? '',
      startTime: p.startTime,
      isDone: completion?.isDone ?? false,
      doneAt: completion?.doneAt?.toISOString(),
    }
  })
}

/** Marks a homework period as done for today. Idempotent — safe to call multiple times. */
export const markDone = async (periodId: string, userId: string, date: string): Promise<void> => {
  await db.homeworkCompletion.upsert({
    where: { periodId_date: { periodId, date } },
    create: { periodId, userId, date, isDone: true, doneAt: new Date() },
    update: { isDone: true, doneAt: new Date() },
  })
}
