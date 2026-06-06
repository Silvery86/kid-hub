'use server'

import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import {
  fetchTodayHomework,
  completeHomework,
  todayDateKey,
} from '@/server/services/homework.service'
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

/** Marks a homework period as done. Awards 10 pts exactly once (idempotent). No auth required — kid-facing. */
export const completeHomeworkAction = async (
  periodId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    await completeHomework(DEFAULT_USER_ID, periodId)
    revalidatePath('/homework')
    revalidatePath('/dashboard')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to complete homework' }
  }
}

