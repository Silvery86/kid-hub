/**
 * Server-only module — all Prisma queries for user/auth data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

/** Retrieves the stored parent PIN record for a user. */
export const getPin = async (
  userId: string
): Promise<{ hash: string; attempts: number; lockedUntil: Date | null } | null> => {
  return db.parentPin.findUnique({
    where: { userId },
    select: { hash: true, attempts: true, lockedUntil: true },
  })
}

/** Creates or updates the parent PIN hash for a user. */
export const savePin = async (userId: string, hash: string): Promise<void> => {
  await db.parentPin.upsert({
    where: { userId },
    create: { userId, hash, attempts: 0 },
    update: { hash, attempts: 0, lockedUntil: null },
  })
}

/** Increments the failed PIN attempt count and optionally sets a lockout time. */
export const recordFailedPinAttempt = async (
  userId: string,
  lockedUntil?: Date
): Promise<void> => {
  await db.parentPin.update({
    where: { userId },
    data: {
      attempts: { increment: 1 },
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  })
}

/** Resets the failed PIN attempt count after a successful verification. */
export const resetPinAttempts = async (userId: string): Promise<void> => {
  await db.parentPin.update({
    where: { userId },
    data: { attempts: 0, lockedUntil: null },
  })
}

/** Retrieves the UserProgress record including badges and best scores. */
export const getUserProgress = async (userId: string) => {
  return db.userProgress.findUnique({
    where: { userId },
    include: { earnedBadges: true, bestScores: true },
  })
}

/** Creates or updates a user's progress record. */
export const upsertUserProgress = async (
  userId: string,
  data: Prisma.UserProgressUncheckedUpdateInput
): Promise<void> => {
  await db.userProgress.upsert({
    where: { userId },
    create: {
      userId,
      totalPoints: (data.totalPoints as number) ?? 0,
      currentStreak: (data.currentStreak as number) ?? 0,
      lastActiveDate: (data.lastActiveDate as string) ?? new Date().toISOString().split('T')[0],
    },
    update: data,
  })
}

/** Retrieves a user record by ID. */
export const getUserById = async (userId: string) => {
  return db.user.findUnique({ where: { id: userId } })
}

/** Gets or creates the default app user (single-user app). */
export const getOrCreateDefaultUser = async (
  id: string,
  name: string,
  gradeLevel: number
) => {
  return db.user.upsert({
    where: { id },
    create: { id, name, gradeLevel },
    update: {},
  })
}
