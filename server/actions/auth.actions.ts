'use server'

/**
 * Server actions for parent account authentication and kid unlock flow.
 * All mutations are guarded by Zod validation.
 */

import { cookies } from 'next/headers'
import {
  ParentEmailSchema,
  ParentPasswordSchema,
  ParentPinSchema,
  KidPatternSchema,
} from '@/server/lib/schemas'
import {
  calcLockoutExpiry,
  compareKidPattern,
  comparePassword,
  comparePin,
  compareStoredTokenHash,
  createKidSessionToken,
  createParentAccessToken,
  createParentRefreshToken,
  hashKidPattern,
  hashPassword,
  hashPin,
  hashTokenForStorage,
  isLockedOut,
  getLockoutSecondsRemaining,
  KID_SESSION_COOKIE,
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
  verifyKidSessionToken,
  verifyParentAccessToken,
  verifyParentRefreshToken,
} from '@/server/services/auth.service'
import { checkAndAwardFirstLoginBadge } from '@/server/services/rewards.service'
import * as userRepo from '@/server/repositories/user.repository'
import {
  DEFAULT_USER_ID,
  KID_PATTERN_LOCKOUT_SECONDS,
  KID_SESSION_TTL_SECONDS,
  MAX_KID_PATTERN_ATTEMPTS,
  MAX_PIN_ATTEMPTS,
  MAX_PARENT_LOGIN_ATTEMPTS,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_LOGIN_LOCKOUT_SECONDS,
  PARENT_REFRESH_TTL_SECONDS,
} from '@/lib/constants'

const PARENT_ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: PARENT_ACCESS_TTL_SECONDS,
  path: '/',
}

const PARENT_REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: PARENT_REFRESH_TTL_SECONDS,
  path: '/',
}

const KID_SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: KID_SESSION_TTL_SECONDS,
  path: '/',
}

const calcParentLoginLockoutExpiry = (): Date =>
  new Date(Date.now() + PARENT_LOGIN_LOCKOUT_SECONDS * 1000)

const calcKidLockoutExpiry = (): Date =>
  new Date(Date.now() + KID_PATTERN_LOCKOUT_SECONDS * 1000)

const issueParentSessionCookies = async (userId: string): Promise<void> => {
  const accessToken = await createParentAccessToken(userId)
  const refreshToken = await createParentRefreshToken(userId)
  const refreshHash = await hashTokenForStorage(refreshToken)
  const refreshExpiresAt = new Date(Date.now() + PARENT_REFRESH_TTL_SECONDS * 1000)

  await userRepo.saveRefreshToken(userId, refreshHash, refreshExpiresAt)

  const cookieStore = await cookies()
  cookieStore.set(PARENT_ACCESS_COOKIE, accessToken, PARENT_ACCESS_COOKIE_OPTIONS)
  cookieStore.set(PARENT_REFRESH_COOKIE, refreshToken, PARENT_REFRESH_COOKIE_OPTIONS)
}

const ensureParentSession = async (): Promise<{ ok: boolean; userId?: string }> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PARENT_ACCESS_COOKIE)?.value

  if (accessToken) {
    const accessSession = await verifyParentAccessToken(accessToken)
    if (accessSession) return { ok: true, userId: accessSession.userId }
  }

  const refreshToken = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
  if (!refreshToken) return { ok: false }

  const refreshSession = await verifyParentRefreshToken(refreshToken)
  if (!refreshSession) return { ok: false }

  const record = await userRepo.getParentAuthRecord(refreshSession.userId)
  if (!record?.refreshTokenHash || !record.refreshTokenExpiresAt) return { ok: false }
  if (record.refreshTokenExpiresAt.getTime() <= Date.now()) return { ok: false }

  const validRefresh = await compareStoredTokenHash(refreshToken, record.refreshTokenHash)
  if (!validRefresh) return { ok: false }

  await issueParentSessionCookies(refreshSession.userId)
  return { ok: true, userId: refreshSession.userId }
}

/** Registers parent account credentials for first-time setup. */
export const registerParentAccountAction = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  const parsedEmail = ParentEmailSchema.safeParse(email)
  if (!parsedEmail.success) {
    return { success: false, error: parsedEmail.error.issues[0]?.message ?? 'Validation error' }
  }

  const parsedPassword = ParentPasswordSchema.safeParse(password)
  if (!parsedPassword.success) {
    return {
      success: false,
      error: parsedPassword.error.issues[0]?.message ?? 'Validation error',
    }
  }

  try {
    const current = await userRepo.getParentAuthRecord(DEFAULT_USER_ID)
    if (!current) {
      return { success: false, error: 'User not found' }
    }
    if (current.parentEmail && current.parentPasswordHash) {
      return { success: false, error: 'Parent account is already configured' }
    }

    const passwordHash = await hashPassword(parsedPassword.data)
    await userRepo.upsertParentCredentials(DEFAULT_USER_ID, parsedEmail.data, passwordHash)
    await issueParentSessionCookies(DEFAULT_USER_ID)

    return { success: true }
  } catch {
    return { success: false, error: 'Failed to register parent account' }
  }
}

/**
 * Parent login with account/password.
 * On success sets access + refresh cookies and resets lockout counters.
 */
export const parentLoginAction = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean; lockoutSeconds?: number }> => {
  const parsedEmail = ParentEmailSchema.safeParse(email)
  if (!parsedEmail.success) {
    return { success: false, error: parsedEmail.error.issues[0]?.message ?? 'Validation error' }
  }

  const parsedPassword = ParentPasswordSchema.safeParse(password)
  if (!parsedPassword.success) {
    return { success: false, error: parsedPassword.error.issues[0]?.message ?? 'Validation error' }
  }

  try {
    const record = await userRepo.getByParentEmail(parsedEmail.data)
    if (!record?.parentPasswordHash) {
      return { success: false, error: 'Invalid credentials' }
    }

    if (isLockedOut(record.parentLoginAttempts, record.parentLoginLockedUntil)) {
      return {
        success: false,
        isLocked: true,
        lockoutSeconds: getLockoutSecondsRemaining(record.parentLoginLockedUntil),
      }
    }

    const valid = await comparePassword(parsedPassword.data, record.parentPasswordHash)
    if (!valid) {
      const newAttempts = record.parentLoginAttempts + 1
      const shouldLock = newAttempts >= MAX_PARENT_LOGIN_ATTEMPTS
      const lockoutUntil = shouldLock ? calcParentLoginLockoutExpiry() : undefined
      await userRepo.recordFailedParentLogin(
        record.id,
        lockoutUntil
      )
      if (shouldLock) {
        return {
          success: false,
          isLocked: true,
          lockoutSeconds: getLockoutSecondsRemaining(lockoutUntil ?? null),
        }
      }
      return { success: false, error: 'Invalid credentials' }
    }

    await userRepo.resetParentLoginAttempts(record.id)
    await issueParentSessionCookies(record.id)
    return { success: true }
  } catch {
    return { success: false, error: 'Login failed' }
  }
}

/** Refreshes parent session using refresh cookie when possible. */
export const refreshParentSessionAction = async (): Promise<{
  success: boolean
  error?: string
}> => {
  const result = await ensureParentSession()
  if (!result.ok) {
    return { success: false, error: 'Session refresh failed' }
  }
  return { success: true }
}

/** Checks whether there is a valid server-side parent session. */
export const checkParentSessionAction = async (): Promise<{
  hasSession: boolean
  hasParentAccount: boolean
}> => {
  try {
    const session = await ensureParentSession()
    const record = await userRepo.getParentAuthRecord(DEFAULT_USER_ID)
    const hasParentAccount = Boolean(record?.parentEmail && record.parentPasswordHash)
    return { hasSession: session.ok, hasParentAccount }
  } catch {
    return { hasSession: false, hasParentAccount: false }
  }
}

/** Stores or updates the kid unlock pattern (requires active parent session). */
export const setKidPatternAction = async (
  pattern: string
): Promise<{ success: boolean; error?: string }> => {
  const parsed = KidPatternSchema.safeParse(pattern)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
  }

  const session = await ensureParentSession()
  if (!session.ok) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const hash = await hashKidPattern(parsed.data)
    await userRepo.saveKidPattern(DEFAULT_USER_ID, hash)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save kid unlock pattern' }
  }
}

/** Verifies kid unlock pattern and mints a kid session cookie on success. */
export const verifyKidPatternAction = async (
  pattern: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean; lockoutSeconds?: number }> => {
  const parsed = KidPatternSchema.safeParse(pattern)
  if (!parsed.success) {
    return { success: false, error: 'Invalid unlock pattern' }
  }

  try {
    const record = await userRepo.getParentAuthRecord(DEFAULT_USER_ID)
    if (!record?.kidPatternHash) {
      return { success: false, error: 'Kid unlock is not configured yet' }
    }

    if (isLockedOut(record.kidPatternAttempts, record.kidPatternLockedUntil)) {
      return {
        success: false,
        isLocked: true,
        lockoutSeconds: getLockoutSecondsRemaining(record.kidPatternLockedUntil),
      }
    }

    const valid = await compareKidPattern(parsed.data, record.kidPatternHash)
    if (!valid) {
      const attempts = record.kidPatternAttempts + 1
      const shouldLock = attempts >= MAX_KID_PATTERN_ATTEMPTS
      const lockUntil = shouldLock ? calcKidLockoutExpiry() : undefined
      await userRepo.recordFailedKidPatternAttempt(DEFAULT_USER_ID, lockUntil)

      if (shouldLock) {
        return {
          success: false,
          isLocked: true,
          lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null),
        }
      }
      return { success: false, error: 'Incorrect unlock pattern' }
    }

    await userRepo.resetKidPatternAttempts(DEFAULT_USER_ID)
    void checkAndAwardFirstLoginBadge(DEFAULT_USER_ID)
    const kidToken = await createKidSessionToken(DEFAULT_USER_ID)
    const cookieStore = await cookies()
    cookieStore.set(KID_SESSION_COOKIE, kidToken, KID_SESSION_COOKIE_OPTIONS)
    return { success: true }
  } catch {
    return { success: false, error: 'Unlock failed' }
  }
}

/** Checks kid session status and whether kid unlock pattern is configured. */
export const checkKidSessionAction = async (): Promise<{
  hasSession: boolean
  hasKidPatternSet: boolean
}> => {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(KID_SESSION_COOKIE)?.value
    const hasSession = token ? (await verifyKidSessionToken(token)) !== null : false
    const record = await userRepo.getParentAuthRecord(DEFAULT_USER_ID)
    return { hasSession, hasKidPatternSet: Boolean(record?.kidPatternHash) }
  } catch {
    return { hasSession: false, hasKidPatternSet: false }
  }
}

/** Clears the parent session cookie, terminating the authenticated session. */
export const signOutParentAction = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const cookieStore = await cookies()
    const refresh = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
    if (refresh) {
      const session = await verifyParentRefreshToken(refresh)
      if (session) {
        await userRepo.clearRefreshToken(session.userId)
      }
    }

    cookieStore.delete(PARENT_ACCESS_COOKIE)
    cookieStore.delete(PARENT_REFRESH_COOKIE)
    return { success: true }
  } catch {
    return { success: false, error: 'Sign out failed' }
  }
}

/** Clears only kid unlock cookie, keeping parent account session intact. */
export const signOutKidAction = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(KID_SESSION_COOKIE)
    return { success: true }
  } catch {
    return { success: false, error: 'Kid sign out failed' }
  }
}



/** Whether the household has a parent PIN configured. */
export const checkParentPinAction = async (): Promise<{ hasPin: boolean }> => {
  try {
    const pin = await userRepo.getPin(DEFAULT_USER_ID)
    return { hasPin: Boolean(pin?.hash) }
  } catch {
    return { hasPin: false }
  }
}

/** Clears short-lived parent access cookie so PIN verification is required. */
export const clearParentAccessAction = async (): Promise<{ success: boolean }> => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(PARENT_ACCESS_COOKIE)
    return { success: true }
  } catch {
    return { success: false }
  }
}

/** Saves a new parent PIN (requires active parent session). */
export const setPinAction = async (
  pin: string
): Promise<{ success: boolean; error?: string }> => {
  const parsed = ParentPinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid PIN' }
  }

  const session = await ensureParentSession()
  if (!session.ok) {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const hash = await hashPin(parsed.data)
    await userRepo.savePin(DEFAULT_USER_ID, hash)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save PIN' }
  }
}

/**
 * Verifies parent PIN and issues parent session cookies on success.
 * Used on `/parent/pin` after account login when access cookie was cleared.
 */
export const verifyPinAction = async (
  pin: string
): Promise<{
  success: boolean
  error?: string
  isLocked?: boolean
  lockoutSeconds?: number
  isWrong?: boolean
}> => {
  const parsed = ParentPinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: 'Invalid PIN' }
  }

  try {
    const pinRecord = await userRepo.getPin(DEFAULT_USER_ID)
    if (!pinRecord?.hash) {
      return { success: false, error: 'PIN is not configured yet' }
    }

    if (isLockedOut(pinRecord.attempts, pinRecord.lockedUntil)) {
      return {
        success: false,
        isLocked: true,
        lockoutSeconds: getLockoutSecondsRemaining(pinRecord.lockedUntil),
      }
    }

    const valid = await comparePin(parsed.data, pinRecord.hash)
    if (!valid) {
      const newAttempts = pinRecord.attempts + 1
      const shouldLock = newAttempts >= MAX_PIN_ATTEMPTS
      const lockUntil = shouldLock ? calcLockoutExpiry() : undefined
      await userRepo.recordFailedPinAttempt(DEFAULT_USER_ID, lockUntil)

      if (shouldLock) {
        return {
          success: false,
          isLocked: true,
          lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null),
        }
      }
      return { success: false, error: 'Incorrect PIN', isWrong: true }
    }

    await userRepo.resetPinAttempts(DEFAULT_USER_ID)
    await issueParentSessionCookies(DEFAULT_USER_ID)
    return { success: true }
  } catch {
    return { success: false, error: 'PIN verification failed' }
  }
}
