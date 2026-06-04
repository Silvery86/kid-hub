'use server'

import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import {
  fetchTodayHomework,
  completePeriodHomework,
  todayDateKey,
} from '@/server/services/homework.service'
import { addPoints, incrementStreak } from '@/server/services/progress.service'
import { recordActivity } from '@/server/services/activity.service'
import type { HomeworkItem } from '@/types'

/** Fetches today's homework items (DailyHomework) with completion status. No auth required — kid-facing. */
export const getTodayHomeworkAction = async (): Promise<{
  success: boolean
  data?: HomeworkItem[]
  error?: string
}> => {
  try {
    const data = await fetchTodayHomework(DEFAULT_USER_ID, 'monday', todayDateKey())
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch homework' }
  }
}

/** Marks a homework period as done for today. No auth required — kid-facing. */
export const markHomeworkDoneAction = async (
  periodId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await completePeriodHomework(periodId, DEFAULT_USER_ID, todayDateKey())
    await incrementStreak(DEFAULT_USER_ID)
    await addPoints(DEFAULT_USER_ID, 10)
    void recordActivity(DEFAULT_USER_ID, 'HOMEWORK_DONE', 'Bài tập hôm nay', '📝')
    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to mark homework done' }
  }
}

