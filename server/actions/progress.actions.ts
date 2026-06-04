'use server'

/**
 * Kid-facing progress actions — no parent session required.
 * Used by useUserProgress hook to sync localStorage cache with DB state.
 */

import { DEFAULT_USER_ID } from '@/lib/constants'
import { addPoints, incrementStreak } from '@/server/services/progress.service'
import { fetchUserProgress } from '@/server/services/user.service'

export interface ProgressSnapshot {
  totalPoints: number
  currentStreak: number
  lastActiveDate: string
  earnedBadgeIds: string[]
}

/** Fetches current progress from DB. Returns null if user has no progress record yet. */
export const getProgressAction = async (): Promise<{
  success: boolean
  data?: ProgressSnapshot | null
  error?: string
}> => {
  try {
    const progress = await fetchUserProgress(DEFAULT_USER_ID)
    if (!progress) return { success: true, data: null }
    return {
      success: true,
      data: {
        totalPoints: progress.totalPoints,
        currentStreak: progress.currentStreak,
        lastActiveDate: progress.lastActiveDate,
        earnedBadgeIds: progress.earnedBadges.map((b) => b.badgeId),
      },
    }
  } catch {
    return { success: false, error: 'Failed to fetch progress' }
  }
}

/** Persists a points increment to DB. Returns the authoritative new total. */
export const syncPointsAction = async (
  amount: number
): Promise<{ success: boolean; newTotal?: number; error?: string }> => {
  try {
    const newTotal = await addPoints(DEFAULT_USER_ID, amount)
    return { success: true, newTotal }
  } catch {
    return { success: false, error: 'Failed to sync points' }
  }
}

/** Persists a streak update to DB. Returns the authoritative new streak count. */
export const syncStreakAction = async (): Promise<{
  success: boolean
  newStreak?: number
  error?: string
}> => {
  try {
    const newStreak = await incrementStreak(DEFAULT_USER_ID)
    return { success: true, newStreak }
  } catch {
    return { success: false, error: 'Failed to sync streak' }
  }
}
