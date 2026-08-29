/**
 * Server-only module — all Prisma queries for PARENT account data live here.
 * No business logic in this layer — pure data access only.
 *
 * "Who is signing in" lives here; "whose data it is" lives in
 * student.repository.ts. The join between them is parent-student.repository.ts.
 */

import { db } from '@/lib/db'

export interface ParentAuthRecord {
  id: string
  email: string
  passwordHash: string
  loginAttempts: number
  loginLockedUntil: Date | null
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'
  isAdmin: boolean
}

const AUTH_FIELDS = {
  id: true,
  email: true,
  passwordHash: true,
  loginAttempts: true,
  loginLockedUntil: true,
  status: true,
  isAdmin: true,
} as const

// ── Account lookup ───────────────────────────────────────────

/** Retrieves a parent's credentials and account state by id. */
export const getById = async (parentId: string): Promise<ParentAuthRecord | null> => {
  return db.parent.findUnique({ where: { id: parentId }, select: AUTH_FIELDS })
}

/** Retrieves a parent's credentials and account state by email. */
export const getByEmail = async (email: string): Promise<ParentAuthRecord | null> => {
  return db.parent.findUnique({ where: { email }, select: AUTH_FIELDS })
}

/** True when this parent row exists. */
export const exists = async (parentId: string): Promise<boolean> => {
  const row = await db.parent.findUnique({ where: { id: parentId }, select: { id: true } })
  return row !== null
}

/** Creates or updates the credentials on a parent row. */
export const upsertCredentials = async (
  parentId: string,
  email: string,
  passwordHash: string
): Promise<void> => {
  await db.parent.upsert({
    where: { id: parentId },
    create: {
      id: parentId,
      email,
      passwordHash,
      status: 'ACTIVE',
      isAdmin: true,
      approvedAt: new Date(),
    },
    update: {
      email,
      passwordHash,
      loginAttempts: 0,
      loginLockedUntil: null,
    },
  })
}

// ── Login lockout ────────────────────────────────────────────

/** Increments failed parent login attempts and optionally sets lockout expiry. */
export const recordFailedLogin = async (parentId: string, lockedUntil?: Date): Promise<void> => {
  await db.parent.update({
    where: { id: parentId },
    data: {
      loginAttempts: { increment: 1 },
      ...(lockedUntil ? { loginLockedUntil: lockedUntil } : {}),
    },
  })
}

/** Resets parent login attempt counters after a successful login. */
export const resetLoginAttempts = async (parentId: string): Promise<void> => {
  await db.parent.update({
    where: { id: parentId },
    data: { loginAttempts: 0, loginLockedUntil: null },
  })
}

// ── PIN ──────────────────────────────────────────────────────

/** Retrieves the stored parent PIN record. */
export const getPin = async (
  parentId: string
): Promise<{ hash: string; attempts: number; lockedUntil: Date | null } | null> => {
  return db.parentPin.findUnique({
    where: { parentId },
    select: { hash: true, attempts: true, lockedUntil: true },
  })
}

/** Creates or updates the parent PIN hash. */
export const savePin = async (parentId: string, hash: string): Promise<void> => {
  await db.parentPin.upsert({
    where: { parentId },
    create: { parentId, hash, attempts: 0 },
    update: { hash, attempts: 0, lockedUntil: null },
  })
}

/** Increments the failed PIN attempt count and optionally sets a lockout time. */
export const recordFailedPinAttempt = async (
  parentId: string,
  lockedUntil?: Date
): Promise<void> => {
  await db.parentPin.update({
    where: { parentId },
    data: {
      attempts: { increment: 1 },
      ...(lockedUntil ? { lockedUntil } : {}),
    },
  })
}

/** Resets the failed PIN attempt count after a successful verification. */
export const resetPinAttempts = async (parentId: string): Promise<void> => {
  await db.parentPin.update({
    where: { parentId },
    data: { attempts: 0, lockedUntil: null },
  })
}

/**
 * Atomically increments the PIN attempt counter and conditionally sets a lockout expiry
 * in a single SQL statement, eliminating the read-then-increment TOCTOU race condition.
 * Returns the post-update attempts count and lockedUntil value.
 *
 * Raw SQL: the column names here are NOT checked by `prisma generate`, so a schema
 * rename must be reflected below by hand.
 */
export const atomicFailedPinAttempt = async (
  parentId: string,
  maxAttempts: number,
  lockoutSecs: number
): Promise<{ attempts: number; lockedUntil: Date | null }> => {
  const rows = await db.$queryRaw<[{ attempts: number; lockedUntil: Date | null }]>`
    UPDATE parent_pins
    SET
      attempts = attempts + 1,
      "lockedUntil" = CASE
        WHEN attempts + 1 >= ${maxAttempts}
        THEN NOW() + (${lockoutSecs}::int * INTERVAL '1 second')
        ELSE "lockedUntil"
      END
    WHERE "parentId" = ${parentId}
    RETURNING attempts, "lockedUntil"
  `
  const row = rows[0]
  if (!row) throw new Error('PIN record not found during atomic update')
  return { attempts: row.attempts, lockedUntil: row.lockedUntil }
}

// ── Refresh tokens ───────────────────────────────────────────
// The table holds one row per device. Until the per-device session work lands,
// these helpers keep the previous single-token behaviour: saving replaces.

/** Replaces this parent's stored refresh token. */
export const saveRefreshToken = async (
  parentId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await db.$transaction([
    db.refreshToken.deleteMany({ where: { parentId } }),
    db.refreshToken.create({ data: { parentId, tokenHash, expiresAt } }),
  ])
}

/** Returns the parent's live refresh token, or null when there is none. */
export const getActiveRefreshToken = async (
  parentId: string
): Promise<{ tokenHash: string; expiresAt: Date } | null> => {
  return db.refreshToken.findFirst({
    where: { parentId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { tokenHash: true, expiresAt: true },
  })
}

/** Clears persisted refresh token state on parent sign out. */
export const clearRefreshTokens = async (parentId: string): Promise<void> => {
  await db.refreshToken.deleteMany({ where: { parentId } })
}
