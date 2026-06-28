'use server'

import { requireParentSession } from '@/server/lib/auth-guard'
<<<<<<< HEAD
import { fetchUserProgress } from '@/server/services/user.service'
import { DEFAULT_USER_ID } from '@/lib/constants'
=======
import { getUserProgress } from '@/server/services/user.service'
import { DEFAULT_USER_ID } from '@/lib/constants'
import type { ActionResult } from '@/types'
>>>>>>> main

export interface KidProgressData {
  totalPoints: number
  currentStreak: number
  lastActiveDate: string
  earnedBadgeIds: string[]
  mathBestStars: number   // highest starsEarned across all math games/levels
  englishBestStars: number // highest starsEarned across all english games/levels
}

export const getKidProgressAction = async (): Promise<ActionResult<KidProgressData | null>> => {
  try {
    await requireParentSession()
    const progress = await fetchUserProgress(DEFAULT_USER_ID)
    if (!progress) return { success: true, data: null }

    const mathBestStars = progress.bestScores
      .filter((s) => s.gameType === 'math')
      .reduce((max, s) => Math.max(max, s.starsEarned), 0)

    const englishBestStars = progress.bestScores
      .filter((s) => s.gameType === 'english')
      .reduce((max, s) => Math.max(max, s.starsEarned), 0)

    return {
      success: true,
      data: {
        totalPoints: progress.totalPoints,
        currentStreak: progress.currentStreak,
        lastActiveDate: progress.lastActiveDate,
        earnedBadgeIds: progress.earnedBadges.map((b) => b.badgeId),
        mathBestStars,
        englishBestStars,
      },
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch progress'
    if (msg === 'Unauthorized') return { success: false, error: 'Unauthorized' }
    return { success: false, error: msg }
  }
}
