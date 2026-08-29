/**
 * Server-only module — all Prisma queries for STUDENT profile data live here.
 * No business logic in this layer — pure data access only.
 *
 * "Whose data it is" lives here; "who is signing in" lives in
 * parent.repository.ts.
 */

import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export interface KidPatternRecord {
  id: string
  kidPatternHash: string | null
  kidPatternAttempts: number
  kidPatternLockedUntil: Date | null
}

// ── Profile ──────────────────────────────────────────────────

/** Retrieves a student record by ID. */
export const getById = async (studentId: string) => {
  return db.student.findUnique({ where: { id: studentId } })
}

/** Gets or creates the seeded student (single-household bootstrap). */
export const getOrCreateDefaultStudent = async (
  id: string,
  name: string,
  gradeLevel: number
) => {
  return db.student.upsert({
    where: { id },
    create: { id, name, gradeLevel },
    update: {},
  })
}

// ── Kid unlock pattern ───────────────────────────────────────

/** Reads the kid unlock pattern hash and lockout counters. */
export const getKidPatternRecord = async (
  studentId: string
): Promise<KidPatternRecord | null> => {
  return db.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      kidPatternHash: true,
      kidPatternAttempts: true,
      kidPatternLockedUntil: true,
    },
  })
}

/** Saves the kid unlock pattern hash and resets kid lockout counters. */
export const saveKidPattern = async (studentId: string, hash: string): Promise<void> => {
  await db.student.update({
    where: { id: studentId },
    data: {
      kidPatternHash: hash,
      kidPatternAttempts: 0,
      kidPatternLockedUntil: null,
    },
  })
}

/** Increments failed kid unlock attempts and optionally sets lockout expiry. */
export const recordFailedKidPatternAttempt = async (
  studentId: string,
  lockedUntil?: Date
): Promise<void> => {
  await db.student.update({
    where: { id: studentId },
    data: {
      kidPatternAttempts: { increment: 1 },
      ...(lockedUntil ? { kidPatternLockedUntil: lockedUntil } : {}),
    },
  })
}

/** Resets kid unlock lockout counters after successful verification. */
export const resetKidPatternAttempts = async (studentId: string): Promise<void> => {
  await db.student.update({
    where: { id: studentId },
    data: { kidPatternAttempts: 0, kidPatternLockedUntil: null },
  })
}

// ── Kid access settings ──────────────────────────────────────

/** Reads the kid access feature toggle state. Returns null if never saved (use defaults). */
export const getKidAccessSettings = async (
  studentId: string
): Promise<Record<string, boolean> | null> => {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { kidAccessSettings: true },
  })
  return (student?.kidAccessSettings as Record<string, boolean> | null) ?? null
}

/** Persists the kid access feature toggle state to the database. */
export const saveKidAccessSettings = async (
  studentId: string,
  settings: Record<string, boolean>
): Promise<void> => {
  await db.student.update({
    where: { id: studentId },
    data: { kidAccessSettings: settings },
  })
}

// ── Gamification progress ────────────────────────────────────

/** Retrieves the UserProgress record including badges and best scores. */
export const getUserProgress = async (studentId: string) => {
  return db.userProgress.findUnique({
    where: { studentId },
    include: { earnedBadges: true, bestScores: true },
  })
}

/** Creates or updates a student's progress record. */
export const upsertUserProgress = async (
  studentId: string,
  data: Prisma.UserProgressUncheckedUpdateInput
): Promise<void> => {
  await db.userProgress.upsert({
    where: { studentId },
    create: {
      studentId,
      totalPoints: (data.totalPoints as number) ?? 0,
      currentStreak: (data.currentStreak as number) ?? 0,
      lastActiveDate: (data.lastActiveDate as string) ?? new Date().toISOString().split('T')[0]!,
    },
    update: data,
  })
}
