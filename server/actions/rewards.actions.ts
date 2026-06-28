'use server'

<<<<<<< HEAD
import { addPoints } from '@/server/services/progress.service'
import { AwardSchema } from '@/server/lib/schemas'
=======
/**
 * Reward actions — award points to the user.
 * Callable from homework checkboxes, game completions, and any future reward trigger.
 */

import { z } from 'zod'
import { addUserPoints } from '@/server/services/progress.service'
import { DEFAULT_USER_ID } from '@/lib/constants'
import type { ActionResult } from '@/types'
>>>>>>> main

export const awardPointsAction = async (
  points: number
): Promise<ActionResult<{ newTotal: number }>> => {
  const parsed = z.number().int().min(1).max(50).safeParse(points)
  if (!parsed.success) return { success: false, error: 'Invalid points value' }
  try {
<<<<<<< HEAD
    const newTotal = await addPoints(parsed.data.userId, parsed.data.points)
    return { success: true, newTotal }
=======
    const newTotal = await addUserPoints(DEFAULT_USER_ID, parsed.data)
    return { success: true, data: { newTotal } }
>>>>>>> main
  } catch {
    return { success: false, error: 'Failed to award points' }
  }
}
