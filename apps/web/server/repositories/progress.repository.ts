/**
 * Server-only module — shared user progress mutations.
 * Extracted from math.repository and english.repository to avoid duplication.
 * No business logic — pure data access only.
 */

import { db } from '@/lib/db'

const todayStr = (): string => new Date().toISOString().split('T')[0]!

/** Adds points to the user's total and updates lastActiveDate for streak tracking. Returns new total. */
export const addUserPoints = async (studentId: string, points: number): Promise<number> => {
  const result = await db.userProgress.upsert({
    where: { studentId },
    create: { studentId, totalPoints: points, currentStreak: 1, lastActiveDate: todayStr() },
    update: { totalPoints: { increment: points }, lastActiveDate: todayStr() },
  })
  return result.totalPoints
}

/**
 * Updates the daily streak — increments if the user was active yesterday,
 * resets to 1 otherwise. No-op if already active today. Returns new streak count.
 * Must be called BEFORE addUserPoints so lastActiveDate hasn't been updated yet.
 */
export const updateStreak = async (studentId: string): Promise<number> => {
  const today = todayStr()
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]!
  const existing = await db.userProgress.findUnique({ where: { studentId } })
  if (!existing) {
    await db.userProgress.create({
      data: { studentId, totalPoints: 0, currentStreak: 1, lastActiveDate: today },
    })
    return 1
  }
  if (existing.lastActiveDate === today) return existing.currentStreak
  const newStreak = existing.lastActiveDate === yesterday ? existing.currentStreak + 1 : 1
  await db.userProgress.update({
    where: { studentId },
    data: { currentStreak: newStreak, lastActiveDate: today },
  })
  return newStreak
}

/** Returns all badge IDs already earned by the user. */
export const getEarnedBadgeIds = async (studentId: string): Promise<string[]> => {
  const progress = await db.userProgress.findUnique({
    where: { studentId },
    include: { earnedBadges: { select: { badgeId: true } } },
  })
  return progress?.earnedBadges.map((b) => b.badgeId) ?? []
}

/**
 * Awards a badge to a user. Creates UserProgress if it doesn't exist.
 *
 * Returns whether the badge was awarded *by this call* — false means it was
 * already earned. The caller needs that distinction to decide whether there is
 * anything to celebrate; an upsert cannot answer it, because it reports success
 * either way, which is why this uses createMany with skipDuplicates instead.
 *
 * The count is also the race guard: two sessions finishing at once both try to
 * insert, and exactly one gets count 1, so a badge can never be celebrated
 * twice.
 */
export const awardBadge = async (studentId: string, badgeId: string): Promise<boolean> => {
  const progress = await db.userProgress.upsert({
    where: { studentId },
    create: { studentId, totalPoints: 0, currentStreak: 0, lastActiveDate: todayStr() },
    update: {},
    select: { id: true },
  })
  const { count } = await db.earnedBadge.createMany({
    data: [{ userProgressId: progress.id, badgeId }],
    skipDuplicates: true,
  })
  return count > 0
}

/** Returns total completed game sessions across math and english. */
export const getTotalGameCount = async (studentId: string): Promise<number> => {
  const [math, english] = await Promise.all([
    db.mathProgress.count({ where: { studentId } }),
    db.englishProgress.count({ where: { studentId } }),
  ])
  return math + english
}
