/**
 * Server-only module — all Prisma queries for user/auth data live here.
 * No business logic in this layer — pure data access only.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

/** Prisma client may lag schema migrations; cast auth field updates until `prisma generate` runs. */
const updateUser = (args: { where: { id: string }; data: Record<string, unknown> }) =>
  db.user.update(args as Parameters<typeof db.user.update>[0])

export interface ParentAuthRecord {
  id: string
  parentEmail: string | null
  parentPasswordHash: string | null
  parentLoginAttempts: number
  parentLoginLockedUntil: Date | null
  refreshTokenHash: string | null
  refreshTokenExpiresAt: Date | null
  kidPatternHash: string | null
  kidPatternAttempts: number
  kidPatternLockedUntil: Date | null
}

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

export type ParentEmailAuthRecord = {
  id: string
  parentEmail: string | null
  parentPasswordHash: string | null
  parentLoginAttempts: number
  parentLoginLockedUntil: Date | null
  refreshTokenHash: string | null
  refreshTokenExpiresAt: Date | null
  kidPatternHash: string | null
  kidPatternAttempts: number
  kidPatternLockedUntil: Date | null
}

/** Finds the single household user by parent email. */
export const getByParentEmail = async (email: string): Promise<ParentEmailAuthRecord | null> => {
  const record = await db.user.findFirst({
    where: { parentEmail: email },
    select: {
      id: true,
      parentEmail: true,
      parentPasswordHash: true,
      parentLoginAttempts: true,
      parentLoginLockedUntil: true,
      refreshTokenHash: true,
      refreshTokenExpiresAt: true,
      kidPatternHash: true,
      kidPatternAttempts: true,
      kidPatternLockedUntil: true,
    },
  } as Prisma.UserFindFirstArgs)
  return record as ParentEmailAuthRecord | null
}

/** Gets parent auth + kid unlock fields for the configured household user. */
export const getParentAuthRecord = async (userId: string): Promise<ParentAuthRecord | null> => {
  const record = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      parentEmail: true,
      parentPasswordHash: true,
      parentLoginAttempts: true,
      parentLoginLockedUntil: true,
      refreshTokenHash: true,
      refreshTokenExpiresAt: true,
      kidPatternHash: true,
      kidPatternAttempts: true,
      kidPatternLockedUntil: true,
    },
  } as Prisma.UserFindUniqueArgs)
  return record as ParentAuthRecord | null
}

/** Creates or updates parent credentials for the household user. */
export const upsertParentCredentials = async (
  userId: string,
  email: string,
  passwordHash: string
): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      parentEmail: email,
      parentPasswordHash: passwordHash,
      parentLoginAttempts: 0,
      parentLoginLockedUntil: null,
    },
  })
}

/** Stores the latest refresh token hash and expiration timestamp. */
export const saveRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      refreshTokenHash: tokenHash,
      refreshTokenExpiresAt: expiresAt,
    },
  })
}

/** Clears persisted refresh token state on parent sign out. */
export const clearRefreshToken = async (userId: string): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  })
}

/** Increments failed parent login attempts and optionally sets lockout expiry. */
export const recordFailedParentLogin = async (
  userId: string,
  lockedUntil?: Date
): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      parentLoginAttempts: { increment: 1 },
      ...(lockedUntil ? { parentLoginLockedUntil: lockedUntil } : {}),
    },
  })
}

/** Resets parent login attempt counters after successful login. */
export const resetParentLoginAttempts = async (userId: string): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      parentLoginAttempts: 0,
      parentLoginLockedUntil: null,
    },
  })
}

/** Saves kid unlock pattern hash and resets kid lockout counters. */
export const saveKidPattern = async (userId: string, hash: string): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      kidPatternHash: hash,
      kidPatternAttempts: 0,
      kidPatternLockedUntil: null,
    },
  })
}

/** Increments failed kid unlock attempts and optionally sets lockout expiry. */
export const recordFailedKidPatternAttempt = async (
  userId: string,
  lockedUntil?: Date
): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      kidPatternAttempts: { increment: 1 },
      ...(lockedUntil ? { kidPatternLockedUntil: lockedUntil } : {}),
    },
  })
}

/** Resets kid unlock lockout counters after successful verification. */
export const resetKidPatternAttempts = async (userId: string): Promise<void> => {
  await updateUser({
    where: { id: userId },
    data: {
      kidPatternAttempts: 0,
      kidPatternLockedUntil: null,
    },
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
