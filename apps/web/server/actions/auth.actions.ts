'use server'

/**
 * Server actions for parent account authentication and kid unlock flow.
 * All mutations are guarded by Zod validation.
 * Business logic lives in auth.service — this layer only handles Zod, cookies, and orchestration.
 */

import { z } from 'zod'
import { cookies } from 'next/headers'
import {
  createParentSession,
  createKidSessionToken,
  getParentStatus,
  getPinRecord,
  loginWithParentPassword,
  registerParent,
  revokeRefreshToken,
  savePin,
  saveKidPattern,
  validateRefreshToken,
  verifyKidSessionToken,
  verifyKidUnlockPattern,
  verifyParentAccessToken,
  verifyParentRefreshToken,
  verifyPin,
  KID_SESSION_COOKIE,
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
} from '@/server/services/auth.service'
import type { ActionVoidResult, AuthActionResult } from '@/types'
import {
  DEFAULT_USER_ID,
  KID_PATTERN_LENGTH,
  KID_SESSION_TTL_SECONDS,
  PIN_LENGTH,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_REFRESH_TTL_SECONDS,
} from '@/lib/constants'

const ParentEmailSchema = z.string().trim().toLowerCase().email('Invalid email format')
const ParentPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
const KidPatternSchema = z
  .string()
  .regex(new RegExp(`^[1-6]{${KID_PATTERN_LENGTH}}$`), 'Invalid unlock pattern format')

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

const issueParentSessionCookies = async (userId: string): Promise<void> => {
  const { accessToken, refreshToken } = await createParentSession(userId)
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

  const userId = await validateRefreshToken(refreshToken)
  if (!userId) return { ok: false }

  await issueParentSessionCookies(userId)
  return { ok: true, userId }
}

/** Registers parent account credentials for first-time setup. */
export const registerParentAccountAction = async (
  email: string,
  password: string
): Promise<ActionVoidResult> => {
  const parsedEmail = ParentEmailSchema.safeParse(email)
  if (!parsedEmail.success) {
    return { success: false, error: parsedEmail.error.issues[0]?.message ?? 'Validation error' }
  }
  const parsedPassword = ParentPasswordSchema.safeParse(password)
  if (!parsedPassword.success) {
    return { success: false, error: parsedPassword.error.issues[0]?.message ?? 'Validation error' }
  }

  try {
    await registerParent(DEFAULT_USER_ID, parsedEmail.data, parsedPassword.data)
    await issueParentSessionCookies(DEFAULT_USER_ID)
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg === 'Parent account is already configured') {
      return { success: false, error: msg }
    }
    if (msg === 'User not found') return { success: false, error: msg }
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
): Promise<AuthActionResult> => {
  const parsedEmail = ParentEmailSchema.safeParse(email)
  if (!parsedEmail.success) {
    return { success: false, error: parsedEmail.error.issues[0]?.message ?? 'Validation error' }
  }
  const parsedPassword = ParentPasswordSchema.safeParse(password)
  if (!parsedPassword.success) {
    return { success: false, error: parsedPassword.error.issues[0]?.message ?? 'Validation error' }
  }

  try {
    const result = await loginWithParentPassword(parsedEmail.data, parsedPassword.data)
    if (result.status === 'no-account') {
      return { success: false, error: 'Invalid credentials' }
    }
    if (result.status === 'wrong-password') {
      return { success: false, error: 'Invalid credentials' }
    }
    if (result.status === 'locked') {
      return {
        success: false,
        error: 'Tài khoản bị khóa tạm thời',
        isLocked: true,
        lockoutSeconds: result.lockoutSeconds,
      }
    }
    await issueParentSessionCookies(result.userId)
    return { success: true }
  } catch {
    return { success: false, error: 'Login failed' }
  }
}

/** Refreshes parent session using refresh cookie when possible. */
export const refreshParentSessionAction = async (): Promise<ActionVoidResult> => {
  const result = await ensureParentSession()
  if (!result.ok) return { success: false, error: 'Session refresh failed' }
  return { success: true }
}

/** Checks whether there is a valid server-side parent session. */
export const checkParentSessionAction = async (): Promise<{
  hasSession: boolean
  hasParentAccount: boolean
}> => {
  try {
    const session = await ensureParentSession()
    const { hasParentAccount } = await getParentStatus(DEFAULT_USER_ID)
    return { hasSession: session.ok, hasParentAccount }
  } catch {
    return { hasSession: false, hasParentAccount: false }
  }
}

/** Stores or updates the kid unlock pattern (requires active parent session). */
export const setKidPatternAction = async (pattern: string): Promise<ActionVoidResult> => {
  const parsed = KidPatternSchema.safeParse(pattern)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Validation error' }
  }
  const session = await ensureParentSession()
  if (!session.ok) return { success: false, error: 'Unauthorized' }

  try {
    await saveKidPattern(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save kid unlock pattern' }
  }
}

/** Verifies kid unlock pattern and mints a kid session cookie on success. */
export const verifyKidPatternAction = async (pattern: string): Promise<AuthActionResult> => {
  const parsed = KidPatternSchema.safeParse(pattern)
  if (!parsed.success) {
    return { success: false, error: 'Invalid unlock pattern' }
  }

  try {
    const result = await verifyKidUnlockPattern(DEFAULT_USER_ID, parsed.data)
    if (result.status === 'not-configured') {
      return { success: false, error: 'Kid unlock is not configured yet' }
    }
    if (result.status === 'locked') {
      return {
        success: false,
        error: 'Đã nhập sai quá nhiều lần',
        isLocked: true,
        lockoutSeconds: result.lockoutSeconds,
      }
    }
    if (result.status === 'wrong') {
      return { success: false, error: 'Incorrect unlock pattern' }
    }
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
    const { hasKidPatternSet } = await getParentStatus(DEFAULT_USER_ID)
    return { hasSession, hasKidPatternSet }
  } catch {
    return { hasSession: false, hasKidPatternSet: false }
  }
}

/** Clears the parent session cookie, terminating the authenticated session. */
export const signOutParentAction = async (): Promise<ActionVoidResult> => {
  try {
    const cookieStore = await cookies()
    const refresh = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
    if (refresh) await revokeRefreshToken(refresh)
    cookieStore.delete(PARENT_ACCESS_COOKIE)
    cookieStore.delete(PARENT_REFRESH_COOKIE)
    return { success: true }
  } catch {
    return { success: false, error: 'Sign out failed' }
  }
}

/** Clears only kid unlock cookie, keeping parent account session intact. */
export const signOutKidAction = async (): Promise<ActionVoidResult> => {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(KID_SESSION_COOKIE)
    return { success: true }
  } catch {
    return { success: false, error: 'Kid sign out failed' }
  }
}

const ParentPinSchema = z
  .string()
  .regex(/^\d{4}$/, `PIN must be exactly ${PIN_LENGTH} digits`)

/** Whether the household has a parent PIN configured. */
export const checkParentPinAction = async (): Promise<{ hasPin: boolean }> => {
  try {
    const record = await getPinRecord(DEFAULT_USER_ID)
    return { hasPin: record?.hasPin ?? false }
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
export const setPinAction = async (pin: string): Promise<ActionVoidResult> => {
  const parsed = ParentPinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid PIN' }
  }
  const session = await ensureParentSession()
  if (!session.ok) return { success: false, error: 'Unauthorized' }

  try {
    await savePin(DEFAULT_USER_ID, parsed.data)
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to save PIN' }
  }
}

/**
 * Verifies parent PIN and issues parent session cookies on success.
 * Used on `/parent/pin` after account login when access cookie was cleared.
 */
export const verifyPinAction = async (pin: string): Promise<AuthActionResult> => {
  const parsed = ParentPinSchema.safeParse(pin)
  if (!parsed.success) {
    return { success: false, error: 'Invalid PIN' }
  }

  try {
    const result = await verifyPin(DEFAULT_USER_ID, parsed.data)
    if (result.status === 'not-configured') {
      return { success: false, error: 'PIN is not configured yet' }
    }
    if (result.status === 'locked') {
      return {
        success: false,
        error: 'PIN bị khóa tạm thời',
        isLocked: true,
        lockoutSeconds: result.lockoutSeconds,
      }
    }
    if (result.status === 'wrong') {
      return { success: false, error: 'Incorrect PIN', isWrong: true }
    }
    await issueParentSessionCookies(DEFAULT_USER_ID)
    return { success: true }
  } catch {
    return { success: false, error: 'PIN verification failed' }
  }
}

// ── Unused but exported for auth-guard compatibility ─────────────────────────
export { verifyParentRefreshToken }
