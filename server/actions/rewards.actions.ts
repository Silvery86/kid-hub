'use server'

/**
 * Reward actions — award points to the user.
 * Callable from homework checkboxes, game completions, and any future reward trigger.
 */

import { z } from 'zod'
import { addUserPoints } from '@/server/repositories/progress.repository'

const AwardSchema = z.object({
  userId: z.string().min(1),
  points: z.number().int().min(1).max(50),
})

export const awardPointsAction = async (
  userId: string,
  points: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> => {
  const parsed = AwardSchema.safeParse({ userId, points })
  if (!parsed.success) return { success: false, error: 'Invalid input' }
  try {
    const newTotal = await addUserPoints(parsed.data.userId, parsed.data.points)
    return { success: true, newTotal }
  } catch {
    return { success: false, error: 'Failed to award points' }
  }
}
