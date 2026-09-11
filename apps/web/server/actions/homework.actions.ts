'use server'

import { requireKidSession, resolveStudentContext } from '@/server/lib/auth-guard'
import { revalidatePath } from 'next/cache'
import * as homeworkService from '@/server/services/homework.service'
import { todayDateKey } from '@/server/services/homework.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import type { HomeworkItem, ActionResult } from '@/types'
import { recordActivity } from '@/server/services/activity.service'
import { checkAndAwardStreakBadges } from '@/server/services/rewards.service'

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
export const markHomeworkDoneAction = async (
  periodId: string
): Promise<ActionResult<{ newBadgeIds: string[] }>> => {
  try {
    const { studentId } = await requireKidSession()
    await homeworkService.markDone(periodId, studentId, todayDateKey())
    const newStreak = await updateStreak(studentId)
    await addUserPoints(studentId, 10)
    void recordActivity(studentId, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')

    // This path updated the streak but never checked it against the badge
    // milestones — only the parent-side toggle in schedule.actions.ts did. A
    // child building a streak through their own homework page could reach seven
    // days and earn neither streak badge. Awarding it here is a fix, not just
    // plumbing for the celebration.
    const newBadgeIds = await checkAndAwardStreakBadges(studentId, newStreak)

    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true, data: { newBadgeIds } }
  } catch {
    return { success: false, error: 'Failed to mark homework done' }
  }
}
