'use server'

/**
 * Server Actions for parent PIN authentication: set, verify, and clear session.
 * All mutations are guarded by Zod validation.
 */

import { z } from 'zod'
import { cookies } from 'next/headers'
import {
  hashPin,
  comparePin,
  validatePinFormat,
  isLockedOut,
  getLockoutSecondsRemaining,
  calcLockoutExpiry,
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
} from '@/server/services/auth.service'
import * as userRepo from '@/server/repositories/user.repository'
import { DEFAULT_USER_ID } from '@/lib/constants'

const PinSchema = z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits')

const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 8 * 60 * 60, // 8 hours
  path: '/',
}

/** Hashes and saves the parent PIN for the default user. */
export const setPinAction = async (
  pin: string
): Promise<{ success: boolean; error?: string }> => {
  const parsed = PinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }
  if (!validatePinFormat(pin)) {
    return { success: false, error: 'Invalid PIN format' }
  }
  try {
    const hash = await hashPin(pin)
    await userRepo.savePin(DEFAULT_USER_ID, hash)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save PIN' }
  }
}

/**
 * Verifies a submitted PIN. On success, sets a signed HttpOnly session cookie.
 * Enforces lockout after repeated failures.
 */
export const verifyPinAction = async (
  pin: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean; lockoutSeconds?: number }> => {
  const parsed = PinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: 'Invalid PIN format' }
  }
  try {
    const stored = await userRepo.getPin(DEFAULT_USER_ID)
    if (!stored) {
      return { success: false, error: 'No PIN set. Please configure a PIN first.' }
    }
    if (isLockedOut(stored.attempts, stored.lockedUntil)) {
      return {
        success: false,
        isLocked: true,
        lockoutSeconds: getLockoutSecondsRemaining(stored.lockedUntil),
      }
    }
    const valid = await comparePin(pin, stored.hash)
    if (!valid) {
      const newAttempts = stored.attempts + 1
      const shouldLock = newAttempts >= 5
      await userRepo.recordFailedPinAttempt(
        DEFAULT_USER_ID,
        shouldLock ? calcLockoutExpiry() : undefined
      )
      if (shouldLock) {
        return { success: false, isLocked: true, lockoutSeconds: 60 }
      }
      return { success: false, error: 'Incorrect PIN' }
    }
    await userRepo.resetPinAttempts(DEFAULT_USER_ID)
    const token = await createSessionToken(DEFAULT_USER_ID)
    const cookieStore = await cookies()
    cookieStore.set(SESSION_COOKIE, token, SESSION_COOKIE_OPTIONS)
    return { success: true }
  } catch {
    return { success: false, error: 'Verification failed' }
  }
}

/** Checks whether there is a valid server-side parent session. */
export const checkParentSessionAction = async (): Promise<{
  hasSession: boolean
  hasPinSet: boolean
}> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    const hasSession = token ? (await verifySessionToken(token)) !== null : false
    const pinRecord = await userRepo.getPin(DEFAULT_USER_ID)
    return { hasSession, hasPinSet: pinRecord !== null }
  } catch {
    return { hasSession: false, hasPinSet: false }
  }
}

/** Clears the parent session cookie, terminating the authenticated session. */
export const signOutParentAction = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(SESSION_COOKIE)
    return { success: true }
  } catch {
    return { success: false, error: 'Sign out failed' }
  }
}
