'use server'

/**
 * Reward actions — award points to the user.
 * Callable from homework checkboxes, game completions, and any future reward trigger.
 */

import { requireKidSession } from '@/server/lib/auth-guard'
import { z } from 'zod'
import { addUserPoints } from '@/server/services/progress.service'
import type { ActionResult } from '@/types'

export const awardPointsAction = async (
  points: number
): Promise<ActionResult<{ newTotal: number }>> => {
  const parsed = z.number().int().min(1).max(50).safeParse(points)
  if (!parsed.success) return { success: false, error: 'Invalid points value' }
  try {
    const { studentId } = await requireKidSession()
    const newTotal = await addUserPoints(studentId, parsed.data)
    return { success: true, data: { newTotal } }
  } catch {
    return { success: false, error: 'Failed to award points' }
  }
}
