/**
 * Server-only module — do NOT import from client components or hooks.
 * Auth business logic: password/pattern hashing with argon2id (new hashes) plus
 * legacy bcrypt verification, JWT access/refresh and kid session tokens using
 * jose, plus lockout state calculation.
 *
 * NOTE: never import this module from `middleware.ts` — argon2 is a native
 * (Node) addon and would break the Edge runtime. The middleware only uses jose.
 */
import 'server-only'

import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { KidSession, ParentRefreshSession, ParentSession } from '@/types'
import * as userRepo from '@/server/repositories/user.repository'
import {
  KID_PATTERN_LENGTH,
  KID_SESSION_COOKIE,
  KID_SESSION_TTL_SECONDS,
  KID_PATTERN_LOCKOUT_SECONDS,
  MAX_KID_PATTERN_ATTEMPTS,
  MAX_PIN_ATTEMPTS,
  MAX_PARENT_LOGIN_ATTEMPTS,
  PARENT_ACCESS_COOKIE,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_LOGIN_LOCKOUT_SECONDS,
  PARENT_REFRESH_COOKIE,
  PARENT_REFRESH_TTL_SECONDS,
  PIN_LENGTH,
  PIN_LOCKOUT_SECONDS,
} from '@/lib/constants'

// ── Secret hashing ───────────────────────────────────────────────────────────
// New hashes use argon2id (async, runs off the event loop — unlike the pure-JS
// bcryptjs it replaces). Verification transparently accepts both the current
// argon2 hashes and legacy bcrypt hashes so existing stored secrets keep working;
// a legacy hash is upgraded the next time that secret is set (single household).

/** Hash a raw secret with argon2id (the algorithm for all new hashes). */
const hashSecret = (raw: string): Promise<string> => argon2Hash(raw)

/**
 * Verify a raw secret against a stored hash, supporting both the current argon2id
 * scheme (`$argon2…`) and legacy bcrypt hashes (`$2…`).
 */
const verifySecret = async (raw: string, hash: string): Promise<boolean> => {
  if (hash.startsWith('$argon2')) {
    try {
      return await argon2Verify(hash, raw)
    } catch {
      return false
    }
  }
  return bcrypt.compare(raw, hash)
}

/** True when a stored hash still uses the legacy bcrypt scheme (candidate for re-hash). */
export const isLegacyHash = (hash: string): boolean => hash.startsWith('$2')

/** Returns the encoded JWT secret from the environment. */
const getJwtSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}

/** Validate that a raw PIN is exactly PIN_LENGTH digits. */
export const validatePinFormat = (pin: string): boolean =>
  /^\d+$/.test(pin) && pin.length === PIN_LENGTH

/** Hash a raw PIN. */
export const hashPin = async (pin: string): Promise<string> => hashSecret(pin)

/** Hash a parent account password. */
export const hashPassword = async (password: string): Promise<string> => hashSecret(password)

/** Compare a parent account password against a stored hash (argon2 or legacy bcrypt). */
export const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  verifySecret(password, hash)

/** Validate that kid pattern is exactly two symbols (1-6). */
export const validateKidPatternFormat = (pattern: string): boolean =>
  /^[1-6]+$/.test(pattern) && pattern.length === KID_PATTERN_LENGTH

/** Hash a kid unlock pattern. */
export const hashKidPattern = async (pattern: string): Promise<string> => hashSecret(pattern)

/** Compare kid unlock pattern against stored hash (argon2 or legacy bcrypt). */
export const compareKidPattern = async (pattern: string, hash: string): Promise<boolean> =>
  verifySecret(pattern, hash)

/** Compare a raw PIN against a stored hash (argon2 or legacy bcrypt). */
export const comparePin = async (pin: string, hash: string): Promise<boolean> =>
  verifySecret(pin, hash)

/** Determine if an account is currently locked out. */
export const isLockedOut = (attempts: number, lockedUntil: Date | null): boolean => {
  if (attempts < MAX_PIN_ATTEMPTS) return false
  if (!lockedUntil) return false
  return lockedUntil > new Date()
}

/** Return seconds remaining in a lockout window (0 if not locked). */
export const getLockoutSecondsRemaining = (lockedUntil: Date | null): number => {
  if (!lockedUntil) return 0
  const remaining = (lockedUntil.getTime() - Date.now()) / 1000
  return Math.max(0, Math.ceil(remaining))
}

/** Calculate the lockout expiry date after MAX_PIN_ATTEMPTS failures. */
export const calcLockoutExpiry = (): Date =>
  new Date(Date.now() + PIN_LOCKOUT_SECONDS * 1000)

/** Create a short-lived signed JWT parent access token. */
export const createParentAccessToken = async (userId: string): Promise<string> =>
  new SignJWT({ userId, typ: 'parent-access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_ACCESS_TTL_SECONDS}s`)
    .sign(getJwtSecret())

/** Create a long-lived signed JWT parent refresh token. */
export const createParentRefreshToken = async (userId: string): Promise<string> =>
  new SignJWT({ userId, typ: 'parent-refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_REFRESH_TTL_SECONDS}s`)
    .sign(getJwtSecret())

/** Create a signed JWT for kid app unlock session. */
export const createKidSessionToken = async (userId: string): Promise<string> =>
  new SignJWT({ userId, typ: 'kid-session' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${KID_SESSION_TTL_SECONDS}s`)
    .sign(getJwtSecret())

/**
 * Verify a parent access token and return the decoded payload.
 * Returns null if the token is missing, invalid, or expired.
 */
export const verifyParentAccessToken = async (token: string): Promise<ParentSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.typ !== 'parent-access') return null
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null
    return { userId: payload.userId, expiresAt: payload.exp * 1000 }
  } catch {
    return null
  }
}

/** Verify a parent refresh token and return decoded payload. */
export const verifyParentRefreshToken = async (
  token: string
): Promise<ParentRefreshSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.typ !== 'parent-refresh') return null
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null
    return { userId: payload.userId, expiresAt: payload.exp * 1000 }
  } catch {
    return null
  }
}

/** Verify a kid session token and return decoded payload. */
export const verifyKidSessionToken = async (token: string): Promise<KidSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.typ !== 'kid-session') return null
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null
    return { userId: payload.userId, expiresAt: payload.exp * 1000 }
  } catch {
    return null
  }
}

/** One-way hash helper used for storing refresh tokens server-side. */
export const hashTokenForStorage = async (token: string): Promise<string> => hashSecret(token)

/** Compares a raw refresh token against the stored hash (argon2 or legacy bcrypt). */
export const compareStoredTokenHash = async (
  token: string,
  hash: string
): Promise<boolean> => verifySecret(token, hash)

/** Backward-compatible alias used by existing server actions. */
export const createSessionToken = createParentAccessToken

/** Backward-compatible alias used by existing server actions. */
export const verifySessionToken = verifyParentAccessToken

/** Cookie names exported for middleware and server actions. */
export {
  PARENT_ACCESS_COOKIE as SESSION_COOKIE,
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
  KID_SESSION_COOKIE,
}

// ── High-level business-logic flows ──────────────────────────────────────────
// Actions must not import from repositories — all DB access goes through here.

/**
 * Creates access + refresh tokens, persists the refresh token hash to the DB,
 * and returns both tokens for the action layer to set as cookies.
 */
export const createParentSession = async (
  userId: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = await createParentAccessToken(userId)
  const refreshToken = await createParentRefreshToken(userId)
  const refreshHash = await hashTokenForStorage(refreshToken)
  const refreshExpiresAt = new Date(Date.now() + PARENT_REFRESH_TTL_SECONDS * 1000)
  await userRepo.saveRefreshToken(userId, refreshHash, refreshExpiresAt)
  return { accessToken, refreshToken }
}

/**
 * Validates a refresh token against the DB record.
 * Returns the userId if valid, null otherwise.
 */
export const validateRefreshToken = async (
  refreshToken: string
): Promise<string | null> => {
  const session = await verifyParentRefreshToken(refreshToken)
  if (!session) return null
  const record = await userRepo.getParentAuthRecord(session.userId)
  if (!record?.refreshTokenHash || !record.refreshTokenExpiresAt) return null
  if (record.refreshTokenExpiresAt.getTime() <= Date.now()) return null
  const valid = await compareStoredTokenHash(refreshToken, record.refreshTokenHash)
  return valid ? session.userId : null
}

/** Clears the persisted refresh token for the userId resolved from the token. */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const session = await verifyParentRefreshToken(refreshToken)
  if (session) await userRepo.clearRefreshToken(session.userId)
}

/** Returns account and kid-pattern existence flags for the given user. */
export const getParentStatus = async (
  userId: string
): Promise<{ hasParentAccount: boolean; hasKidPatternSet: boolean }> => {
  const record = await userRepo.getParentAuthRecord(userId)
  return {
    hasParentAccount: Boolean(record?.parentEmail && record.parentPasswordHash),
    hasKidPatternSet: Boolean(record?.kidPatternHash),
  }
}

/**
 * Registers parent credentials on first setup.
 * Throws if an account is already configured.
 */
export const registerParent = async (
  userId: string,
  email: string,
  password: string
): Promise<void> => {
  const current = await userRepo.getParentAuthRecord(userId)
  if (!current) throw new Error('User not found')
  if (current.parentEmail && current.parentPasswordHash) {
    throw new Error('Parent account is already configured')
  }
  const passwordHash = await hashPassword(password)
  await userRepo.upsertParentCredentials(userId, email, passwordHash)
}

export type LoginResult =
  | { status: 'ok'; userId: string }
  | { status: 'no-account' }
  | { status: 'wrong-password' }
  | { status: 'locked'; lockoutSeconds: number }

/** Full parent login flow: credential lookup, lockout check, and attempt tracking. */
export const loginWithParentPassword = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const record = await userRepo.getByParentEmail(email)
  if (!record?.parentPasswordHash) return { status: 'no-account' }

  if (isLockedOut(record.parentLoginAttempts, record.parentLoginLockedUntil)) {
    return {
      status: 'locked',
      lockoutSeconds: getLockoutSecondsRemaining(record.parentLoginLockedUntil),
    }
  }

  const valid = await comparePassword(password, record.parentPasswordHash)
  if (!valid) {
    const newAttempts = record.parentLoginAttempts + 1
    const shouldLock = newAttempts >= MAX_PARENT_LOGIN_ATTEMPTS
    const lockUntil = shouldLock
      ? new Date(Date.now() + PARENT_LOGIN_LOCKOUT_SECONDS * 1000)
      : undefined
    await userRepo.recordFailedParentLogin(record.id, lockUntil)
    if (shouldLock) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null) }
    }
    return { status: 'wrong-password' }
  }

  await userRepo.resetParentLoginAttempts(record.id)
  return { status: 'ok', userId: record.id }
}

/** Returns PIN status for the given user. */
export const getPinRecord = async (
  userId: string
): Promise<{ hasPin: boolean; attempts: number; lockedUntil: Date | null } | null> => {
  const pin = await userRepo.getPin(userId)
  if (!pin) return null
  return { hasPin: Boolean(pin.hash), attempts: pin.attempts, lockedUntil: pin.lockedUntil }
}

/** Hashes and persists a new parent PIN. */
export const savePin = async (userId: string, rawPin: string): Promise<void> => {
  const hash = await hashPin(rawPin)
  await userRepo.savePin(userId, hash)
}

export type PinVerifyResult =
  | { status: 'ok' }
  | { status: 'wrong' }
  | { status: 'locked'; lockoutSeconds: number }
  | { status: 'not-configured' }

/** Full PIN verification flow with atomic lockout. */
export const verifyPin = async (
  userId: string,
  rawPin: string
): Promise<PinVerifyResult> => {
  const pinRecord = await userRepo.getPin(userId)
  if (!pinRecord?.hash) return { status: 'not-configured' }

  if (isLockedOut(pinRecord.attempts, pinRecord.lockedUntil)) {
    return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(pinRecord.lockedUntil) }
  }

  const valid = await comparePin(rawPin, pinRecord.hash)
  if (!valid) {
    const { attempts: newAttempts, lockedUntil } = await userRepo.atomicFailedPinAttempt(
      userId, MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS
    )
    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockedUntil) }
    }
    return { status: 'wrong' }
  }

  await userRepo.resetPinAttempts(userId)
  return { status: 'ok' }
}

/** Hashes and persists a new kid unlock pattern. */
export const saveKidPattern = async (userId: string, rawPattern: string): Promise<void> => {
  const hash = await hashKidPattern(rawPattern)
  await userRepo.saveKidPattern(userId, hash)
}

export type KidPatternVerifyResult =
  | { status: 'ok' }
  | { status: 'wrong' }
  | { status: 'locked'; lockoutSeconds: number }
  | { status: 'not-configured' }

/** Full kid pattern verification flow with lockout. */
export const verifyKidUnlockPattern = async (
  userId: string,
  rawPattern: string
): Promise<KidPatternVerifyResult> => {
  const record = await userRepo.getParentAuthRecord(userId)
  if (!record?.kidPatternHash) return { status: 'not-configured' }

  if (isLockedOut(record.kidPatternAttempts, record.kidPatternLockedUntil)) {
    return {
      status: 'locked',
      lockoutSeconds: getLockoutSecondsRemaining(record.kidPatternLockedUntil),
    }
  }

  const valid = await compareKidPattern(rawPattern, record.kidPatternHash)
  if (!valid) {
    const newAttempts = record.kidPatternAttempts + 1
    const shouldLock = newAttempts >= MAX_KID_PATTERN_ATTEMPTS
    const lockUntil = shouldLock
      ? new Date(Date.now() + KID_PATTERN_LOCKOUT_SECONDS * 1000)
      : undefined
    await userRepo.recordFailedKidPatternAttempt(userId, lockUntil)
    if (shouldLock) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null) }
    }
    return { status: 'wrong' }
  }

  await userRepo.resetKidPatternAttempts(userId)
  return { status: 'ok' }
}
