'use server'

/**
 * Server actions for parent account authentication and kid unlock flow.
 * All mutations are guarded by Zod validation.
 * Business logic lives in auth.service — this layer only handles Zod, cookies, and orchestration.
 */

import {
  ParentEmailSchema,
  ParentPasswordSchema,
  KidPatternSchema,
  ParentPinSchema,
} from '@kid-hub/shared'
import { cookies } from 'next/headers'
import {
  createParentSession,
  createKidSessionToken,
  getParentStatus,
  getPinRecord,
  loginWithParentPassword,
  registerFoundingParent,
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
import { checkRateLimit, getLoginEmailRateLimiter } from '@/lib/rate-limit'
import type { ActionVoidResult, AuthActionResult } from '@/types'
import {
  DEFAULT_PARENT_ID,
  DEFAULT_USER_ID,
  KID_SESSION_TTL_SECONDS,
  PARENT_ACCESS_TTL_SECONDS,
  PARENT_REFRESH_TTL_SECONDS,
} from '@/lib/constants'

// ParentEmailSchema, ParentPasswordSchema, KidPatternSchema and ParentPinSchema
// are owned by @kid-hub/shared (Phase 2 — mobile_imp.md §10) and imported above.

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

const issueParentSessionCookies = async (parentId: string): Promise<void> => {
  const { accessToken, refreshToken } = await createParentSession(parentId)
  const cookieStore = await cookies()
  cookieStore.set(PARENT_ACCESS_COOKIE, accessToken, PARENT_ACCESS_COOKIE_OPTIONS)
  cookieStore.set(PARENT_REFRESH_COOKIE, refreshToken, PARENT_REFRESH_COOKIE_OPTIONS)
}

const ensureParentSession = async (): Promise<{ ok: boolean; parentId?: string }> => {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(PARENT_ACCESS_COOKIE)?.value

  if (accessToken) {
    const accessSession = await verifyParentAccessToken(accessToken)
    if (accessSession) return { ok: true, parentId: accessSession.parentId }
  }

  const refreshToken = cookieStore.get(PARENT_REFRESH_COOKIE)?.value
  if (!refreshToken) return { ok: false }

  const validated = await validateRefreshToken(refreshToken)
  if (!validated) return { ok: false }

  await issueParentSessionCookies(validated.parentId)
  return { ok: true, parentId: validated.parentId }
}

/**
 * Registers the founding parent on a deployment that has none.
 *
 * Open signup with admin approval (`registerParent` in the service) is a
 * different flow with a different screen, and is wired up with the parent UI.
 * This action stays the first-run bootstrap: without it there would be no admin
 * able to approve anyone.
 */
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
    await registerFoundingParent(DEFAULT_PARENT_ID, parsedEmail.data, parsedPassword.data)
    await issueParentSessionCookies(DEFAULT_PARENT_ID)
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

/** Vietnamese copy for each blocked account state (§7.6). */
const ACCOUNT_STATE_MESSAGE = {
  pending: 'Tài khoản đang chờ duyệt',
  rejected: 'Tài khoản đã bị từ chối',
  suspended: 'Tài khoản đã bị vô hiệu hóa',
} as const

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

  // Per-account limit. The middleware limiter keyed on IP cannot see which account a
  // Server Action payload targets, so this is the only place the email is available.
  const rl = await checkRateLimit(getLoginEmailRateLimiter(), parsedEmail.data)
  if (rl && !rl.success) {
    return {
      success: false,
      error: 'Quá nhiều lần thử đăng nhập',
      isLocked: true,
      lockoutSeconds: Math.ceil((rl.reset - Date.now()) / 1000),
    }
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
    if (result.status === 'not-active') {
      return { success: false, error: ACCOUNT_STATE_MESSAGE[result.reason] }
    }
    await issueParentSessionCookies(result.parentId)
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
    const { hasParentAccount } = await getParentStatus(DEFAULT_PARENT_ID, DEFAULT_USER_ID)
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
    const { hasKidPatternSet } = await getParentStatus(DEFAULT_PARENT_ID, DEFAULT_USER_ID)
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

/** Whether the household has a parent PIN configured. */
export const checkParentPinAction = async (): Promise<{ hasPin: boolean }> => {
  try {
    const record = await getPinRecord(DEFAULT_PARENT_ID)
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
    await savePin(DEFAULT_PARENT_ID, parsed.data)
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
    const result = await verifyPin(DEFAULT_PARENT_ID, parsed.data)
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
    await issueParentSessionCookies(DEFAULT_PARENT_ID)
    return { success: true }
  } catch {
    return { success: false, error: 'PIN verification failed' }
  }
}

// ── Unused but exported for auth-guard compatibility ─────────────────────────
export { verifyParentRefreshToken }
