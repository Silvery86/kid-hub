/**
 * Server-only module — do NOT import from client components or hooks.
 * Auth business logic: PIN hashing/comparison with bcrypt, JWT session creation
 * and verification using jose, and lockout state calculation.
 */

import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import type { ParentSession } from '@/types'
import { MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS, PIN_LENGTH } from '@/lib/constants'

const SESSION_COOKIE = 'parent_session'
const SESSION_DURATION_SECONDS = 8 * 60 * 60 // 8 hours
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

/** Create a signed JWT session token for the given user. */
export const createSessionToken = async (userId: string): Promise<string> =>
  new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecret())

/**
 * Verify a session token and return the decoded payload.
 * Returns null if the token is missing, invalid, or expired.
 */
export const verifySessionToken = async (token: string): Promise<ParentSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (typeof payload.userId !== 'string' || typeof payload.exp !== 'number') return null
    return { userId: payload.userId, expiresAt: payload.exp * 1000 }
  } catch {
    return null
  }
}

/** The name of the HttpOnly session cookie. */
export { SESSION_COOKIE }
