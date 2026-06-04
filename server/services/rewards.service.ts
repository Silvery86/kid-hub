import 'server-only'

import {
  getEarnedBadgeIds,
  awardBadge,
  getTotalGameCount,
} from '@/server/repositories/progress.repository'
import { getReportCard } from '@/server/repositories/grades.repository'
import { GRADE_SCALE } from '@/lib/constants'

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
 * Checks grade-related badges after a grade is saved.
 * Awards perfect-10, subject-specific excellence (math-ace, reading-star), and all-green.
 * Safe to call after every grade upsert — no-ops if already earned.
 */
export const checkAndAwardGradeBadges = async (
  userId: string,
  subjectId: string,
  score: number
): Promise<void> => {
  const earned = await getEarnedBadgeIds(userId)

  if (score >= 10 && !earned.includes('perfect-10')) {
    await awardBadge(userId, 'perfect-10')
  }

  if (score >= GRADE_SCALE.EXCELLENT) {
    if (subjectId === 'math' && !earned.includes('math-ace')) {
      await awardBadge(userId, 'math-ace')
    }
    if (subjectId === 'vietnamese' && !earned.includes('reading-star')) {
      await awardBadge(userId, 'reading-star')
    }
  }

  if (!earned.includes('all-green')) {
    const allGrades = await getReportCard(userId)
    if (allGrades.length > 0 && allGrades.every((g) => g.score >= GRADE_SCALE.GOOD)) {
      await awardBadge(userId, 'all-green')
    }
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
