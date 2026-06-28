import 'server-only'

import {
  getEarnedBadgeIds,
  awardBadge,
  getTotalGameCount,
} from '@/server/repositories/progress.repository'

/**
 * Awards the 'game-win' badge on the first ever completed game session.
 * Safe to call after every game save — no-op if already earned.
 */
export const checkAndAwardGameWinBadge = async (userId: string): Promise<void> => {
  const earned = await getEarnedBadgeIds(userId)
  if (earned.includes('game-win')) return
  const count = await getTotalGameCount(userId)
  if (count >= 1) await awardBadge(userId, 'game-win')
}

/**
 * Awards the 'first-login' badge. Should be called after the first kid session unlock.
 * No-op if already earned.
 */
export const checkAndAwardFirstLoginBadge = async (userId: string): Promise<void> => {
  const earned = await getEarnedBadgeIds(userId)
  if (!earned.includes('first-login')) {
    await awardBadge(userId, 'first-login')
  }
}

/**
 * Checks streak milestones and awards streak-3 / streak-7 badges.
 * Safe to call after every streak update — no-op if already earned.
 */
export const checkAndAwardStreakBadges = async (
  userId: string,
  currentStreak: number
): Promise<void> => {
  const earned = await getEarnedBadgeIds(userId)
  if (currentStreak >= 3 && !earned.includes('streak-3')) {
    await awardBadge(userId, 'streak-3')
  }
  if (currentStreak >= 7 && !earned.includes('streak-7')) {
    await awardBadge(userId, 'streak-7')
  }
}
