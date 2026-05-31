'use server'

import { cookies } from 'next/headers'
import { verifySessionToken, SESSION_COOKIE } from '@/server/services/auth.service'
import { getUserProgress } from '@/server/repositories/user.repository'
import { DEFAULT_USER_ID } from '@/lib/constants'

const requireParentSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) throw new Error('Unauthorized')
  const session = await verifySessionToken(token)
  if (!session) throw new Error('Unauthorized')
}

export interface KidProgressData {
  totalPoints: number
  currentStreak: number
  lastActiveDate: string
  earnedBadgeIds: string[]
  mathBestStars: number   // highest starsEarned across all math games/levels
  englishBestStars: number // highest starsEarned across all english games/levels
}

export const getKidProgressAction = async (): Promise<{
  success: boolean
  data?: KidProgressData | null
  error?: string
}> => {
  try {
    await requireParentSession()
    const progress = await getUserProgress(DEFAULT_USER_ID)
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
