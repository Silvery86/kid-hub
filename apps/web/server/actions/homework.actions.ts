'use server'

import { requireKidSession, resolveStudentContext } from '@/server/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import * as homeworkService from '@/server/services/homework.service'
import { todayDateKey } from '@/server/services/homework.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import type { HomeworkItem, ActionResult, ActionVoidResult } from '@/types'
import { recordActivity } from '@/server/services/activity.service'

/** Fetches today's homework items (DailyHomework) with completion status. No auth required — kid-facing. */
export const getTodayHomeworkAction = async (): Promise<ActionResult<HomeworkItem[]>> => {
  try {
    // DailyHomework is keyed by date only — no day-of-week filter needed, works on weekends too.
    const studentId = await resolveStudentContext()
    const data = await homeworkService.getTodayHomework(studentId, todayDateKey())
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch homework' }
  }
}

/** Marks a homework period as done for today. No auth required — kid-facing. */
export const markHomeworkDoneAction = async (periodId: string): Promise<ActionVoidResult> => {
  try {
    const { studentId } = await requireKidSession()
    await homeworkService.markDone(periodId, studentId, todayDateKey())
    await updateStreak(studentId)
    await addUserPoints(studentId, 10)
    void recordActivity(studentId, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to mark homework done' }
  }
}
