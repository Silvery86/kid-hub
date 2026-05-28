/**
 * Server-only module — do NOT import from client components or hooks.
 * Auth business logic: password/pattern hashing with bcrypt, JWT access/refresh
 * and kid session tokens using jose, plus lockout state calculation.
 */

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { KidSession, ParentRefreshSession, ParentSession } from '@/types'
import {
  KID_PATTERN_LENGTH,
  KID_SESSION_COOKIE,
  KID_SESSION_TTL_SECONDS,
  MAX_PIN_ATTEMPTS,
  PARENT_ACCESS_COOKIE,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_REFRESH_COOKIE,
  PARENT_REFRESH_TTL_SECONDS,
  PIN_LENGTH,
  PIN_LOCKOUT_SECONDS,
} from '@/lib/constants'

const BCRYPT_ROUNDS = 12

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

/** Hash a raw PIN using bcrypt. */
export const hashPin = async (pin: string): Promise<string> =>
  bcrypt.hash(pin, BCRYPT_ROUNDS)

/** Hash a parent account password using bcrypt. */
export const hashPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS)

/** Compare a parent account password against a stored hash. */
export const comparePassword = async (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash)

/** Validate that kid pattern is exactly two symbols (1-6). */
export const validateKidPatternFormat = (pattern: string): boolean =>
  /^[1-6]+$/.test(pattern) && pattern.length === KID_PATTERN_LENGTH

/** Hash a kid unlock pattern using bcrypt. */
export const hashKidPattern = async (pattern: string): Promise<string> =>
  bcrypt.hash(pattern, BCRYPT_ROUNDS)

/** Compare kid unlock pattern against stored hash. */
export const compareKidPattern = async (pattern: string, hash: string): Promise<boolean> =>
  bcrypt.compare(pattern, hash)

/** Compare a raw PIN against a stored bcrypt hash. */
export const comparePin = async (pin: string, hash: string): Promise<boolean> =>
  bcrypt.compare(pin, hash)

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

/** Deterministic one-way hash helper used for storing refresh tokens server-side. */
export const hashTokenForStorage = async (token: string): Promise<string> =>
  bcrypt.hash(token, BCRYPT_ROUNDS)

/** Compares a raw refresh token against the stored hash. */
export const compareStoredTokenHash = async (
  token: string,
  hash: string
): Promise<boolean> => bcrypt.compare(token, hash)

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
