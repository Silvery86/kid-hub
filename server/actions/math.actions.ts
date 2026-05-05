'use server'

/**
 * Server Actions for the math mini-game module.
 * Kid-facing (no parent auth required) — saving progress and marking homework done.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { saveMathSession, getTodayMathHomework } from '@/server/services/math.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import type { MathSessionResult, } from '@/server/services/math.service'

const SaveMathProgressSchema = z.object({
  minigame: z.enum(['counting', 'addition', 'shapes']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correctCount: z.number().int().min(0).max(10),
  incorrectCount: z.number().int().min(0).max(10),
  timeSpentSecs: z.number().int().min(1).max(600),
  homeworkPeriodId: z.string().optional(),
  homeworkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/** Saves a completed math session to the database and optionally marks homework done. */
export const saveMathProgressAction = async (
  input: unknown
): Promise<{ success: boolean; data?: MathSessionResult; error?: string }> => {
  try {
    const parsed = SaveMathProgressSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    const data = parsed.data
    if (data.correctCount + data.incorrectCount > 10) {
      return { success: false, error: 'correctCount + incorrectCount must not exceed 10' }
    }
    if (data.homeworkPeriodId && !data.homeworkDate) {
      return { success: false, error: 'homeworkDate is required when homeworkPeriodId is set' }
    }

    const result = await saveMathSession(DEFAULT_USER_ID, data)

    if (data.homeworkPeriodId) {
      revalidatePath('/homework')
      revalidatePath('/dashboard')
    }

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Failed to save math progress' }
  }
}

/** Fetches today's pending math homework period for the hub banner. */
export const getTodayMathHomeworkAction = async (): Promise<{
  success: boolean
  data?: { periodId: string; homeworkNote: string } | null
  error?: string
}> => {
  try {
    const day = todayDayOfWeek()
    const date = todayDateKey()
    const data = await getTodayMathHomework(DEFAULT_USER_ID, day, date)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch math homework' }
  }
}
