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
import * as parentRepo from '@/server/repositories/parent.repository'
import * as parentStudentRepo from '@/server/repositories/parent-student.repository'
import * as studentRepo from '@/server/repositories/student.repository'
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
export const createParentAccessToken = async (parentId: string): Promise<string> =>
  new SignJWT({ parentId, typ: 'parent-access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_ACCESS_TTL_SECONDS}s`)
    .sign(getJwtSecret())

/**
 * Create a long-lived signed JWT parent refresh token.
 *
 * `tokenId` addresses the refresh_tokens row this token belongs to, which is
 * what lets one device be revoked without touching the others.
 */
export const createParentRefreshToken = async (
  parentId: string,
  tokenId: string
): Promise<string> =>
  new SignJWT({ parentId, tokenId, typ: 'parent-refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${PARENT_REFRESH_TTL_SECONDS}s`)
    .sign(getJwtSecret())

/** Create a signed JWT for kid app unlock session, scoped to one student. */
export const createKidSessionToken = async (studentId: string): Promise<string> =>
  new SignJWT({ studentId, typ: 'kid-session' })
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
    if (typeof payload.parentId !== 'string' || typeof payload.exp !== 'number') return null
    return { parentId: payload.parentId, expiresAt: payload.exp * 1000 }
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
    if (typeof payload.parentId !== 'string' || typeof payload.tokenId !== 'string') return null
    if (typeof payload.exp !== 'number') return null
    return {
      parentId: payload.parentId,
      tokenId: payload.tokenId,
      expiresAt: payload.exp * 1000,
    }
  } catch {
    return null
  }
}

/** Verify a kid session token and return decoded payload. */
export const verifyKidSessionToken = async (token: string): Promise<KidSession | null> => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    if (payload.typ !== 'kid-session') return null
    if (typeof payload.studentId !== 'string' || typeof payload.exp !== 'number') return null
    return { studentId: payload.studentId, expiresAt: payload.exp * 1000 }
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
  parentId: string,
  deviceLabel?: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = await createParentAccessToken(parentId)
  const refreshExpiresAt = new Date(Date.now() + PARENT_REFRESH_TTL_SECONDS * 1000)

  // The row is created first because its id has to travel inside the token, and
  // the hash of that token then has to go back into the same row.
  const row = await parentRepo.createRefreshToken(parentId, '', refreshExpiresAt, deviceLabel)
  const refreshToken = await createParentRefreshToken(parentId, row.id)
  await parentRepo.setRefreshTokenHash(row.id, await hashTokenForStorage(refreshToken))

  return { accessToken, refreshToken }
}

/**
 * Validates a refresh token against the DB record.
 * Returns the userId if valid, null otherwise.
 */
export const validateRefreshToken = async (
  refreshToken: string
): Promise<{ parentId: string; tokenId: string } | null> => {
  const session = await verifyParentRefreshToken(refreshToken)
  if (!session) return null

  const stored = await parentRepo.getRefreshTokenById(session.tokenId)
  if (!stored) return null
  if (stored.revokedAt) return null
  if (stored.parentId !== session.parentId) return null
  if (stored.expiresAt.getTime() <= Date.now()) return null

  const valid = await compareStoredTokenHash(refreshToken, stored.tokenHash)
  if (!valid) return null

  // The account gate runs here too, not only at login. Without this, suspending
  // a parent leaves them signed in for as long as they keep rotating.
  const parent = await parentRepo.getById(session.parentId)
  if (!parent || parent.status !== 'ACTIVE') return null

  await parentRepo.touchRefreshToken(stored.id)
  return { parentId: session.parentId, tokenId: stored.id }
}

/** Revokes the single device session the given refresh token belongs to. */
export const revokeRefreshToken = async (refreshToken: string): Promise<void> => {
  const session = await verifyParentRefreshToken(refreshToken)
  if (session) await parentRepo.revokeRefreshToken(session.tokenId)
}

/** Revokes every live session for a parent. */
export const revokeAllForParent = async (parentId: string): Promise<void> => {
  await parentRepo.revokeAllForParent(parentId)
}

/**
 * Returns account and kid-pattern existence flags. The two flags now live on two
 * different rows — credentials on the parent, the unlock pattern on the student —
 * so both ids are needed.
 */
export const getParentStatus = async (
  parentId: string,
  studentId: string
): Promise<{ hasParentAccount: boolean; hasKidPatternSet: boolean }> => {
  const [parent, student] = await Promise.all([
    parentRepo.getById(parentId),
    studentRepo.getKidPatternRecord(studentId),
  ])
  return {
    hasParentAccount: Boolean(parent?.email && parent.passwordHash),
    hasKidPatternSet: Boolean(student?.kidPatternHash),
  }
}

/**
 * Registers parent credentials on first setup.
 * Throws if an account is already configured.
 */
/**
 * Submits a signup application. Open to anyone, but it mints NO session: the
 * account is PENDING until an admin approves it.
 *
 * The student row is deliberately not created here — otherwise the students
 * table fills with children of accounts that will never be approved. The intake
 * is parked on the parent row and materialised inside `approveParent`.
 */
export const registerParent = async (
  email: string,
  password: string,
  firstStudent: { name: string; gradeLevel: number }
): Promise<{ parentId: string; status: 'PENDING' }> => {
  const existing = await parentRepo.getByEmail(email)
  if (existing) throw new Error('Email already registered')
  const passwordHash = await hashPassword(password)
  const created = await parentRepo.createPending(email, passwordHash, firstStudent)
  return { parentId: created.id, status: 'PENDING' }
}

/**
 * Bootstrap path for a deployment that has no accounts yet: creates the founding
 * parent directly as ACTIVE and admin, because an approval queue with nobody able
 * to approve is a deadlock. Used by first-run setup only.
 */
export const registerFoundingParent = async (
  parentId: string,
  email: string,
  password: string
): Promise<void> => {
  const current = await parentRepo.getById(parentId)
  if (current) throw new Error('Parent account is already configured')
  const passwordHash = await hashPassword(password)
  await parentRepo.upsertCredentials(parentId, email, passwordHash)
}

// ── Account approval (admin) ─────────────────────────────────────────────────

export type AccountGateResult =
  | { ok: true }
  | { ok: false; reason: 'pending' | 'rejected' | 'suspended'; note?: string }

/**
 * The single account-state gate. Called from BOTH login and refresh — a gate
 * that only runs at login lets a suspended parent keep working until their
 * access token expires.
 */
export const assertAccountActive = (parent: {
  status: string
  reviewNote?: string | null
}): AccountGateResult => {
  switch (parent.status) {
    case 'ACTIVE':
      return { ok: true }
    case 'PENDING':
      return { ok: false, reason: 'pending' }
    case 'REJECTED':
      return { ok: false, reason: 'rejected', note: parent.reviewNote ?? undefined }
    default:
      return { ok: false, reason: 'suspended' }
  }
}

/** Approves an applicant: activates them and materialises their first student. */
export const approveParent = async (adminId: string, parentId: string): Promise<void> => {
  const parent = await parentRepo.getById(parentId)
  if (!parent) throw new Error('Account not found')
  if (parent.status === 'ACTIVE') return

  const payload = (await parentRepo.getSignupPayload(parentId)) as
    | { name: string; gradeLevel: number }
    | null

  if (payload?.name) {
    const student = await studentRepo.create(payload.name, payload.gradeLevel ?? 1)
    await parentStudentRepo.link(parentId, student.id, 'OWNER')
  }

  await parentRepo.setStatus(parentId, 'ACTIVE', { approvedById: adminId })
}

/** Rejects an applicant. Their credentials stay, so the email cannot be re-used. */
export const rejectParent = async (
  _adminId: string,
  parentId: string,
  note?: string
): Promise<void> => {
  await parentRepo.setStatus(parentId, 'REJECTED', { reviewNote: note })
  await parentRepo.revokeAllForParent(parentId)
}

/**
 * Suspends an approved account. Revoking here rather than waiting for token
 * expiry is what makes suspension take effect immediately.
 */
export const suspendParent = async (
  _adminId: string,
  parentId: string,
  note?: string
): Promise<void> => {
  const parent = await parentRepo.getById(parentId)
  if (parent?.isAdmin && (await parentRepo.countAdmins()) <= 1) {
    throw new Error('Cannot suspend the last admin')
  }
  await parentRepo.setStatus(parentId, 'SUSPENDED', { reviewNote: note })
  await parentRepo.revokeAllForParent(parentId)
}

/** Lists accounts awaiting review. */
export const listPendingParents = () => parentRepo.listByStatus('PENDING')

/** True when this parent may act on the admin surface. */
export const isAdmin = async (parentId: string): Promise<boolean> => {
  const parent = await parentRepo.getById(parentId)
  return Boolean(parent?.isAdmin && parent.status === 'ACTIVE')
}

// ── Students ─────────────────────────────────────────────────────────────────

/** Lists the students this parent is linked to. */
export const listStudentsForParent = (parentId: string) =>
  parentStudentRepo.listStudentsForParent(parentId)

/** True when this parent may touch this student's data. */
export const canAccessStudent = (parentId: string, studentId: string) =>
  parentStudentRepo.isLinked(parentId, studentId)

/** Creates a student and links it to the parent as OWNER. */
export const createStudent = async (
  parentId: string,
  name: string,
  gradeLevel: number
): Promise<{ id: string }> => {
  const student = await studentRepo.create(name, gradeLevel)
  await parentStudentRepo.link(parentId, student.id, 'OWNER')
  return { id: student.id }
}

export type LoginResult =
  | { status: 'ok'; parentId: string }
  | { status: 'no-account' }
  | { status: 'wrong-password' }
  | { status: 'locked'; lockoutSeconds: number }
  | { status: 'not-active'; reason: 'pending' | 'rejected' | 'suspended'; note?: string }

/** Full parent login flow: credential lookup, lockout check, and attempt tracking. */
export const loginWithParentPassword = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const record = await parentRepo.getByEmail(email)
  if (!record?.passwordHash) return { status: 'no-account' }

  if (isLockedOut(record.loginAttempts, record.loginLockedUntil)) {
    return {
      status: 'locked',
      lockoutSeconds: getLockoutSecondsRemaining(record.loginLockedUntil),
    }
  }

  const valid = await comparePassword(password, record.passwordHash)
  if (!valid) {
    const newAttempts = record.loginAttempts + 1
    const shouldLock = newAttempts >= MAX_PARENT_LOGIN_ATTEMPTS
    const lockUntil = shouldLock
      ? new Date(Date.now() + PARENT_LOGIN_LOCKOUT_SECONDS * 1000)
      : undefined
    await parentRepo.recordFailedLogin(record.id, lockUntil)
    if (shouldLock) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null) }
    }
    return { status: 'wrong-password' }
  }

  await parentRepo.resetLoginAttempts(record.id)

  // The account gate runs AFTER the password check, so an unapproved account
  // cannot be told apart from a wrong password by anyone who does not hold it.
  const gate = assertAccountActive(record)
  if (!gate.ok) return { status: 'not-active', reason: gate.reason, note: gate.note }

  return { status: 'ok', parentId: record.id }
}

/** Returns PIN status for the given parent. */
export const getPinRecord = async (
  parentId: string
): Promise<{ hasPin: boolean; attempts: number; lockedUntil: Date | null } | null> => {
  const pin = await parentRepo.getPin(parentId)
  if (!pin) return null
  return { hasPin: Boolean(pin.hash), attempts: pin.attempts, lockedUntil: pin.lockedUntil }
}

/** Hashes and persists a new parent PIN. */
export const savePin = async (parentId: string, rawPin: string): Promise<void> => {
  const hash = await hashPin(rawPin)
  await parentRepo.savePin(parentId, hash)
}

export type PinVerifyResult =
  | { status: 'ok' }
  | { status: 'wrong' }
  | { status: 'locked'; lockoutSeconds: number }
  | { status: 'not-configured' }

/** Full PIN verification flow with atomic lockout. */
export const verifyPin = async (
  parentId: string,
  rawPin: string
): Promise<PinVerifyResult> => {
  const pinRecord = await parentRepo.getPin(parentId)
  if (!pinRecord?.hash) return { status: 'not-configured' }

  if (isLockedOut(pinRecord.attempts, pinRecord.lockedUntil)) {
    return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(pinRecord.lockedUntil) }
  }

  const valid = await comparePin(rawPin, pinRecord.hash)
  if (!valid) {
    const { attempts: newAttempts, lockedUntil } = await parentRepo.atomicFailedPinAttempt(
      parentId, MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS
    )
    if (newAttempts >= MAX_PIN_ATTEMPTS) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockedUntil) }
    }
    return { status: 'wrong' }
  }

  await parentRepo.resetPinAttempts(parentId)
  return { status: 'ok' }
}

/** Hashes and persists a new kid unlock pattern. */
export const saveKidPattern = async (studentId: string, rawPattern: string): Promise<void> => {
  const hash = await hashKidPattern(rawPattern)
  await studentRepo.saveKidPattern(studentId, hash)
}

export type KidPatternVerifyResult =
  | { status: 'ok' }
  | { status: 'wrong' }
  | { status: 'locked'; lockoutSeconds: number }
  | { status: 'not-configured' }

/** Full kid pattern verification flow with lockout. */
export const verifyKidUnlockPattern = async (
  studentId: string,
  rawPattern: string
): Promise<KidPatternVerifyResult> => {
  const record = await studentRepo.getKidPatternRecord(studentId)
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
    await studentRepo.recordFailedKidPatternAttempt(studentId, lockUntil)
    if (shouldLock) {
      return { status: 'locked', lockoutSeconds: getLockoutSecondsRemaining(lockUntil ?? null) }
    }
    return { status: 'wrong' }
  }

  await studentRepo.resetKidPatternAttempts(studentId)
  return { status: 'ok' }
}
