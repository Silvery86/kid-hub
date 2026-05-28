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
