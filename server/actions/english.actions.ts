'use server'

/**
 * Server Actions for the English mini-game module.
 * Kid-facing (no parent auth required) — saving progress and marking homework done.
 */

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { DEFAULT_USER_ID } from '@/lib/constants'
import { saveEnglishSession, getTodayEnglishHomework } from '@/server/services/english.service'
import { todayDateKey, todayDayOfWeek } from '@/server/services/homework.service'
import { recordActivity } from '@/server/services/activity.service'
import { checkAndAwardGameWinBadge } from '@/server/services/rewards.service'
import type { EnglishSessionResult } from '@/server/services/english.service'
import type { EnglishGameType, ActionResult } from '@/types'

const ENGLISH_MINIGAME_LABELS = {
  alphabet: 'Bảng chữ cái',
  vocabulary: 'Từ vựng',
  phonics: 'Phát âm',
} satisfies Record<EnglishGameType, string>

const SaveEnglishProgressSchema = z.object({
  minigame: z.enum(['alphabet', 'vocabulary', 'phonics']),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  correctCount: z.number().int().min(0).max(10),
  incorrectCount: z.number().int().min(0).max(10),
  timeSpentSecs: z.number().int().min(1).max(600),
  homeworkPeriodId: z.string().optional(),
  homeworkDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

/** Saves a completed English session to the database and optionally marks homework done. */
export const saveEnglishProgressAction = async (
  input: unknown
): Promise<ActionResult<EnglishSessionResult>> => {
  try {
    const parsed = SaveEnglishProgressSchema.safeParse(input)
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
    }

    const data = parsed.data
    if (data.correctCount + data.incorrectCount !== 10) {
      return { success: false, error: 'correctCount + incorrectCount must equal 10' }
    }
    if (data.homeworkPeriodId && !data.homeworkDate) {
      return { success: false, error: 'homeworkDate is required when homeworkPeriodId is set' }
    }
    if (data.homeworkPeriodId && data.homeworkDate) {
      const today = todayDateKey()
      if (data.homeworkDate !== today) {
        return { success: false, error: 'homeworkDate must equal today\'s date' }
      }
    }

    const result = await saveEnglishSession(DEFAULT_USER_ID, data)

    if (data.homeworkPeriodId) {
      revalidatePath('/homework')
      revalidatePath('/dashboard')
    }

    const label = `Tiếng Anh · ${ENGLISH_MINIGAME_LABELS[data.minigame] ?? data.minigame} · Cấp ${data.level}`
    void recordActivity(DEFAULT_USER_ID, 'GAME_COMPLETE', label, '🔤')
    void checkAndAwardGameWinBadge(DEFAULT_USER_ID)

    return { success: true, data: result }
  } catch {
    return { success: false, error: 'Failed to save English progress' }
  }
}

/** Fetches today's pending English homework period for the hub banner. */
export const getTodayEnglishHomeworkAction = async (): Promise<
  ActionResult<{ periodId: string; homeworkNote: string } | null>
> => {
  try {
    const day = todayDayOfWeek()
    const date = todayDateKey()
    const data = await getTodayEnglishHomework(DEFAULT_USER_ID, day, date)
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch English homework' }
  }
}
