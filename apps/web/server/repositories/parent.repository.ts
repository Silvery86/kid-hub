/**
 * Server-only module — all Prisma queries for PARENT account data live here.
 * No business logic in this layer — pure data access only.
 *
 * "Who is signing in" lives here; "whose data it is" lives in
 * student.repository.ts. The join between them is parent-student.repository.ts.
 */

import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export type AccountStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'

export interface ParentAuthRecord {
  id: string
  email: string
  passwordHash: string
  loginAttempts: number
  loginLockedUntil: Date | null
  status: AccountStatus
  isAdmin: boolean
  reviewNote: string | null
}

export interface StoredRefreshToken {
  id: string
  parentId: string
  tokenHash: string
  expiresAt: Date
  revokedAt: Date | null
}

const AUTH_FIELDS = {
  id: true,
  email: true,
  passwordHash: true,
  loginAttempts: true,
  loginLockedUntil: true,
  status: true,
  isAdmin: true,
  reviewNote: true,
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

/** Reads a pending applicant's held signup intake. */
export const getSignupPayload = async (parentId: string): Promise<unknown> => {
  const row = await db.parent.findUnique({
    where: { id: parentId },
    select: { signupPayload: true },
  })
  return row?.signupPayload ?? null
}

/** Lists accounts in one state, oldest application first. */
export const listByStatus = async (status: AccountStatus) => {
  return db.parent.findMany({
    where: { status },
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, displayName: true, status: true, createdAt: true },
  })
}

/** Creates a new applicant. Always PENDING — approval is the only way to ACTIVE. */
export const createPending = async (
  email: string,
  passwordHash: string,
  signupPayload: { name: string; gradeLevel: number }
): Promise<{ id: string }> => {
  return db.parent.create({
    data: { email, passwordHash, status: 'PENDING', signupPayload },
    select: { id: true },
  })
}

/** Moves an account to a new state, recording who decided and why. */
export const setStatus = async (
  parentId: string,
  status: AccountStatus,
  opts: { approvedById?: string; reviewNote?: string } = {}
): Promise<void> => {
  const data: Prisma.ParentUncheckedUpdateInput = {
    status,
    reviewNote: opts.reviewNote ?? null,
    ...(status === 'ACTIVE'
      ? {
          approvedAt: new Date(),
          approvedById: opts.approvedById ?? null,
          // Prisma needs its own sentinel to write SQL NULL into a Json column.
          signupPayload: Prisma.DbNull,
        }
      : {}),
  }
  await db.parent.update({ where: { id: parentId }, data })
}

/** How many admins exist. Guards against removing the last one. */
export const countAdmins = async (): Promise<number> => {
  return db.parent.count({ where: { isAdmin: true, status: 'ACTIVE' } })
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
// One row per signed-in device. The row id travels in the refresh JWT as
// `tokenId`, which is what makes revoking a single device possible.

/** Records a new device session. Returns the row id for the token claim. */
export const createRefreshToken = async (
  parentId: string,
  tokenHash: string,
  expiresAt: Date,
  deviceLabel?: string
): Promise<{ id: string }> => {
  return db.refreshToken.create({
    data: { parentId, tokenHash, expiresAt, deviceLabel: deviceLabel ?? null },
    select: { id: true },
  })
}

/** Stores the hash of the token minted for a row that was created empty. */
export const setRefreshTokenHash = async (tokenId: string, tokenHash: string): Promise<void> => {
  await db.refreshToken.update({ where: { id: tokenId }, data: { tokenHash } })
}

/** Reads one device session by its row id. */
export const getRefreshTokenById = async (
  tokenId: string
): Promise<StoredRefreshToken | null> => {
  return db.refreshToken.findUnique({
    where: { id: tokenId },
    select: { id: true, parentId: true, tokenHash: true, expiresAt: true, revokedAt: true },
  })
}

/** Marks one device session revoked. Sign-out and device management both use it. */
export const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  await db.refreshToken.updateMany({
    where: { id: tokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/** Revokes every live session for a parent — suspension and "sign out everywhere". */
export const revokeAllForParent = async (parentId: string): Promise<void> => {
  await db.refreshToken.updateMany({
    where: { parentId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

/** Stamps last use, so the device list can show something meaningful. */
export const touchRefreshToken = async (tokenId: string): Promise<void> => {
  await db.refreshToken.updateMany({
    where: { id: tokenId },
    data: { lastUsedAt: new Date() },
  })
}
