'use server'

/**
 * Server Actions for the math mini-game module.
 * Kid-facing (no parent auth required) — saving progress and marking homework done.
 */

import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { saveMathSession, getTodayMathHomework } from '@/server/services/math.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import { recordActivity } from '@/server/services/activity.service'
import { checkAndAwardGameWinBadge } from '@/server/services/rewards.service'
<<<<<<< HEAD
import { SaveMathProgressSchema } from '@/server/lib/schemas'
import type { MathSessionResult } from '@/server/services/math.service'
=======
import type { MathSessionResult } from '@/server/services/math.service'
import type { MathGameType, ActionResult } from '@/types'
>>>>>>> main

const MATH_MINIGAME_LABELS = {
  counting: 'Đếm số',
  addition: 'Phép tính',
  shapes: 'Hình học',
} satisfies Record<MathGameType, string>


/** Saves a completed math session to the database and optionally marks homework done. */
export const saveMathProgressAction = async (
  input: unknown
): Promise<ActionResult<MathSessionResult>> => {
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

    const label = `Toán · ${MATH_MINIGAME_LABELS[data.minigame] ?? data.minigame} · Cấp ${data.level}`
    void recordActivity(DEFAULT_USER_ID, 'GAME_COMPLETE', label, '🧮')
    void checkAndAwardGameWinBadge(DEFAULT_USER_ID)

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Failed to save math progress' }
  }
}

/** Fetches today's pending math homework period for the hub banner. */
export const getTodayMathHomeworkAction = async (): Promise<
  ActionResult<{ periodId: string; homeworkNote: string } | null>
> => {
  try {
    const day = todayDayOfWeek()
    const date = todayDateKey()
    const data = await getTodayMathHomework(DEFAULT_USER_ID, day, date)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch math homework' }
  }
}
