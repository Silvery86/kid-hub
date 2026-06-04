'use server'

import { requireParentSession } from '@/server/lib/auth-guard'
import { ScreenTimeSecsSchema, ScreenTimeLimitSchema } from '@/server/lib/schemas'
import {
  recordScreenTime,
  getTodayScreenTime,
  getDailyLimit,
  setDailyLimit,
} from '@/server/services/screen-time.service'
import { DEFAULT_USER_ID } from '@/lib/constants'

/** Kid-facing: increments today's screen time counter. Called from ScreenTimeTracker every 60s. */
export const addScreenTimeAction = async (
  secs: number
): Promise<{ success: boolean; error?: string }> => {
  const parsed = ScreenTimeSecsSchema.safeParse(secs)
  if (!parsed.success) return { success: false, error: 'Invalid seconds value' }
  try {
    await recordScreenTime(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to record screen time' }
  }
}

export interface ScreenTimeData {
  usedSecs: number
  limitMins: number
}

/** Parent-facing: returns today's total seconds used and the configured daily limit. */
export const getScreenTimeAction = async (): Promise<{
  success: boolean
  data?: ScreenTimeData
  error?: string
}> => {
  try {
    await requireParentSession()
    const [usedSecs, limitMins] = await Promise.all([
      getTodayScreenTime(DEFAULT_USER_ID),
      getDailyLimit(DEFAULT_USER_ID),
    ])
    return { success: true, data: { usedSecs, limitMins } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch screen time'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Parent-facing: updates the daily screen time limit in minutes (30–480). */
export const setScreenTimeLimitAction = async (
  limitMins: number
): Promise<{ success: boolean; error?: string }> => {
  const parsed = ScreenTimeLimitSchema.safeParse(limitMins)
  if (!parsed.success) return { success: false, error: 'Limit must be between 30 and 480 minutes' }
  try {
    await requireParentSession()
    await setDailyLimit(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update limit'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
