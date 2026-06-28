'use server'

import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
<<<<<<< HEAD
import {
  fetchTodayHomework,
  completeHomework,
  todayDateKey,
} from '@/server/services/homework.service'
import type { HomeworkItem } from '@/types'
=======
import * as homeworkService from '@/server/services/homework.service'
import { todayDateKey } from '@/server/services/homework.service'
import { addUserPoints, updateStreak } from '@/server/services/progress.service'
import type { HomeworkItem, ActionResult, ActionVoidResult } from '@/types'
import { recordActivity } from '@/server/services/activity.service'
>>>>>>> main

/** Fetches today's homework items (DailyHomework) with completion status. No auth required — kid-facing. */
export const getTodayHomeworkAction = async (): Promise<ActionResult<HomeworkItem[]>> => {
  try {
<<<<<<< HEAD
    const data = await fetchTodayHomework(DEFAULT_USER_ID, 'monday', todayDateKey())
=======
    // DailyHomework is keyed by date only — no day-of-week filter needed, works on weekends too.
    const data = await homeworkService.getTodayHomework(DEFAULT_USER_ID, 'monday', todayDateKey())
>>>>>>> main
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch homework' }
  }
}

<<<<<<< HEAD
/** Marks a homework period as done. Awards 10 pts exactly once (idempotent). No auth required — kid-facing. */
export const completeHomeworkAction = async (
  periodId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await completeHomework(DEFAULT_USER_ID, periodId)
=======
/** Marks a homework period as done for today. No auth required — kid-facing. */
export const markHomeworkDoneAction = async (periodId: string): Promise<ActionVoidResult> => {
  try {
    await homeworkService.markDone(periodId, DEFAULT_USER_ID, todayDateKey())
    await updateStreak(DEFAULT_USER_ID)
    await addUserPoints(DEFAULT_USER_ID, 10)
    void recordActivity(DEFAULT_USER_ID, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
>>>>>>> main
    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to complete homework' }
  }
}

