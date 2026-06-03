/**
 * Server-only module — shared user progress mutations.
 * Extracted from math.repository and english.repository to avoid duplication.
 * No business logic — pure data access only.
 */

import { db } from '@/lib/db'

const todayStr = (): string => new Date().toISOString().split('T')[0]!

/** Adds points to the user's total and updates lastActiveDate for streak tracking. Returns new total. */
export const addUserPoints = async (userId: string, points: number): Promise<number> => {
  const result = await db.userProgress.upsert({
    where: { userId },
    create: { userId, totalPoints: points, currentStreak: 1, lastActiveDate: todayStr() },
    update: { totalPoints: { increment: points }, lastActiveDate: todayStr() },
  })
  return result.totalPoints
}

/**
 * Updates the daily streak — increments if the user was active yesterday,
 * resets to 1 otherwise. No-op if already active today. Returns new streak count.
 * Must be called BEFORE addUserPoints so lastActiveDate hasn't been updated yet.
 */
export const updateStreak = async (userId: string): Promise<number> => {
  const today = todayStr()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!
  const existing = await db.userProgress.findUnique({ where: { userId } })
  if (!existing) {
    await db.userProgress.create({
      data: { userId, totalPoints: 0, currentStreak: 1, lastActiveDate: today },
    })
    return 1
  }
  if (existing.lastActiveDate === today) return existing.currentStreak
  const newStreak = existing.lastActiveDate === yesterday ? existing.currentStreak + 1 : 1
  await db.userProgress.update({
    where: { userId },
    data: { currentStreak: newStreak, lastActiveDate: today },
  })
  return newStreak
}

/** Returns all badge IDs already earned by the user. */
export const getEarnedBadgeIds = async (userId: string): Promise<string[]> => {
  const progress = await db.userProgress.findUnique({
    where: { userId },
    include: { earnedBadges: { select: { badgeId: true } } },
  })
  return progress?.earnedBadges.map((b) => b.badgeId) ?? []
}

/**
 * Awards a badge to a user. Creates UserProgress if it doesn't exist.
 * Silently no-ops if the badge is already earned (upsert).
 */
export const awardBadge = async (userId: string, badgeId: string): Promise<void> => {
  const progress = await db.userProgress.upsert({
    where: { userId },
    create: { userId, totalPoints: 0, currentStreak: 0, lastActiveDate: todayStr() },
    update: {},
    select: { id: true },
  })
  await db.earnedBadge.upsert({
    where: { userProgressId_badgeId: { userProgressId: progress.id, badgeId } },
    create: { userProgressId: progress.id, badgeId },
    update: {},
  })
}

/** Returns total completed game sessions across math and english. */
export const getTotalGameCount = async (userId: string): Promise<number> => {
  const [math, english] = await Promise.all([
    db.mathProgress.count({ where: { userId } }),
    db.englishProgress.count({ where: { userId } }),
  ])
  return math + english
}
