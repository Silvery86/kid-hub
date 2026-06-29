'use server'

import { z } from 'zod'
import { requireParentSession } from '@/server/lib/auth-guard'
import {
  addScreenTime,
  getScreenTimeToday,
  getScreenTimeLimit,
  setScreenTimeLimit,
} from '@/server/services/screen-time.service'
import { DEFAULT_USER_ID } from '@/lib/constants'
import type { ActionResult, ActionVoidResult } from '@/types'

/** Kid-facing: increments today's screen time counter. Called from ScreenTimeTracker every 60s. */
export const addScreenTimeAction = async (secs: number): Promise<ActionVoidResult> => {
  const parsed = z.number().int().min(1).max(120).safeParse(secs)
  if (!parsed.success) return { success: false, error: 'Invalid seconds value' }
  try {
    await addScreenTime(DEFAULT_USER_ID, parsed.data)
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
export const getScreenTimeAction = async (): Promise<ActionResult<ScreenTimeData>> => {
  try {
    await requireParentSession()
    const [usedSecs, limitMins] = await Promise.all([
      getScreenTimeToday(DEFAULT_USER_ID),
      getScreenTimeLimit(DEFAULT_USER_ID),
    ])
    return { success: true, data: { usedSecs, limitMins } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch screen time'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}

/** Parent-facing: updates the daily screen time limit in minutes (30–480). */
export const setScreenTimeLimitAction = async (limitMins: number): Promise<ActionVoidResult> => {
  const parsed = z.number().int().min(30).max(480).safeParse(limitMins)
  if (!parsed.success) return { success: false, error: 'Limit must be between 30 and 480 minutes' }
  try {
    await requireParentSession()
    await setScreenTimeLimit(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to update limit'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
