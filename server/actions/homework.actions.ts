'use server'

import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import * as homeworkRepo from '@/server/repositories/homework.repository'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import type { HomeworkItem } from '@/types'

/** Fetches today's homework periods with completion status. No auth required — kid-facing. */
export const getTodayHomeworkAction = async (): Promise<{
  success: boolean
  data?: HomeworkItem[]
  error?: string
}> => {
  try {
    const day = todayDayOfWeek()
    if (!day) return { success: true, data: [] }
    const data = await homeworkRepo.getTodayHomework(DEFAULT_USER_ID, day, todayDateKey())
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
    await homeworkRepo.markDone(periodId, DEFAULT_USER_ID, todayDateKey())
    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to mark homework done' }
  }
}
