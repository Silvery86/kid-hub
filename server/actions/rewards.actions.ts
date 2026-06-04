'use server'

import { addPoints } from '@/server/services/progress.service'
import { AwardSchema } from '@/server/lib/schemas'

export const awardPointsAction = async (
  userId: string,
  points: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> => {
  const parsed = AwardSchema.safeParse({ userId, points })
  if (!parsed.success) return { success: false, error: 'Invalid input' }
  try {
    const newTotal = await addPoints(parsed.data.userId, parsed.data.points)
    return { success: true, newTotal }
  } catch {
    return { success: false, error: 'Failed to award points' }
  }
}
