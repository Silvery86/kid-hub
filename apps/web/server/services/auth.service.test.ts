/**
 * Account-state gate and session validation.
 *
 * The repositories are mocked so these tests describe DECISIONS, not storage:
 * which account states may hold a session, and what invalidates a refresh token.
 * The storage side (join-table isolation, the migration) is exercised against a
 * real database branch, not here.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/repositories/parent.repository', () => ({
  getById: vi.fn(),
  getByEmail: vi.fn(),
  getSignupPayload: vi.fn(),
  createPending: vi.fn(),
  setStatus: vi.fn(),
  countAdmins: vi.fn(),
  upsertCredentials: vi.fn(),
  recordFailedLogin: vi.fn(),
  resetLoginAttempts: vi.fn(),
  createRefreshToken: vi.fn(),
  setRefreshTokenHash: vi.fn(),
  getRefreshTokenById: vi.fn(),
  revokeRefreshToken: vi.fn(),
  revokeAllForParent: vi.fn(),
  touchRefreshToken: vi.fn(),
  getPin: vi.fn(),
  savePin: vi.fn(),
  resetPinAttempts: vi.fn(),
  atomicFailedPinAttempt: vi.fn(),
  listByStatus: vi.fn(),
}))
vi.mock('@/server/repositories/student.repository', () => ({
  create: vi.fn(),
  getKidPatternRecord: vi.fn(),
  saveKidPattern: vi.fn(),
  recordFailedKidPatternAttempt: vi.fn(),
  resetKidPatternAttempts: vi.fn(),
}))
vi.mock('@/server/repositories/parent-student.repository', () => ({
  link: vi.fn(),
  isLinked: vi.fn(),
  listStudentsForParent: vi.fn(),
}))

import * as parentRepo from '@/server/repositories/parent.repository'
import * as parentStudentRepo from '@/server/repositories/parent-student.repository'
import * as studentRepo from '@/server/repositories/student.repository'
import {
  approveParent,
  assertAccountActive,
  createParentSession,
  hashPassword,
  loginWithParentPassword,
  registerParent,
  suspendParent,
  validateRefreshToken,
} from './auth.service'

const PARENT = 'parent-1'
const PASSWORD = 'Correct@12345'

const parentRow = (over: Partial<Record<string, unknown>> = {}) => ({
  id: PARENT,
  email: 'a@test.local',
  passwordHash: '',
  loginAttempts: 0,
  loginLockedUntil: null,
  status: 'ACTIVE',
  isAdmin: false,
  reviewNote: null,
  ...over,
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('assertAccountActive', () => {
  it('admits only ACTIVE', () => {
    expect(assertAccountActive({ status: 'ACTIVE' }).ok).toBe(true)
    expect(assertAccountActive({ status: 'PENDING' }).ok).toBe(false)
    expect(assertAccountActive({ status: 'REJECTED' }).ok).toBe(false)
    expect(assertAccountActive({ status: 'SUSPENDED' }).ok).toBe(false)
  })

  it('reports why, and carries the reviewer note for a rejection', () => {
    expect(assertAccountActive({ status: 'PENDING' })).toEqual({ ok: false, reason: 'pending' })
    expect(assertAccountActive({ status: 'REJECTED', reviewNote: 'not this time' })).toEqual({
      ok: false,
      reason: 'rejected',
      note: 'not this time',
    })
  })
})

describe('loginWithParentPassword', () => {
  it('lets an ACTIVE account in', async () => {
    const passwordHash = await hashPassword(PASSWORD)
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(parentRow({ passwordHash }) as never)

    await expect(loginWithParentPassword('a@test.local', PASSWORD)).resolves.toEqual({
      status: 'ok',
      parentId: PARENT,
    })
  })

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'])('refuses a %s account', async (status) => {
    const passwordHash = await hashPassword(PASSWORD)
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(
      parentRow({ passwordHash, status }) as never
    )

    const result = await loginWithParentPassword('a@test.local', PASSWORD)
    expect(result.status).toBe('not-active')
  })

  it('checks the password BEFORE the account state', async () => {
    // Otherwise the response tells a stranger that this address has an account
    // here, and which state it is in.
    const passwordHash = await hashPassword(PASSWORD)
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(
      parentRow({ passwordHash, status: 'PENDING' }) as never
    )

    const result = await loginWithParentPassword('a@test.local', 'Wrong@12345')
    expect(result.status).toBe('wrong-password')
  })

  it('reports no-account for an unknown address', async () => {
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(null)
    await expect(loginWithParentPassword('nobody@test.local', PASSWORD)).resolves.toEqual({
      status: 'no-account',
    })
  })
})

describe('validateRefreshToken', () => {
  /** Mints a real token pair so the tests exercise the actual JWT + hash path. */
  const issueSession = async (tokenId = 'token-1') => {
    vi.mocked(parentRepo.createRefreshToken).mockResolvedValue({ id: tokenId })
    let storedHash = ''
    vi.mocked(parentRepo.setRefreshTokenHash).mockImplementation(async (_id, hash) => {
      storedHash = hash
    })
    const { refreshToken } = await createParentSession(PARENT)
    return { refreshToken, tokenId, getHash: () => storedHash }
  }

  const stored = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'token-1',
    parentId: PARENT,
    tokenHash: '',
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    ...over,
  })

  it('accepts a live token for an ACTIVE parent', async () => {
    const s = await issueSession()
    vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
      stored({ tokenHash: s.getHash() }) as never
    )
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await expect(validateRefreshToken(s.refreshToken)).resolves.toEqual({
      parentId: PARENT,
      tokenId: 'token-1',
    })
  })

  it('rejects a revoked token', async () => {
    const s = await issueSession()
    vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
      stored({ tokenHash: s.getHash(), revokedAt: new Date() }) as never
    )
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await expect(validateRefreshToken(s.refreshToken)).resolves.toBeNull()
  })

  it('rejects an expired token', async () => {
    const s = await issueSession()
    vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
      stored({ tokenHash: s.getHash(), expiresAt: new Date(Date.now() - 1) }) as never
    )
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await expect(validateRefreshToken(s.refreshToken)).resolves.toBeNull()
  })

  it('rejects a token whose row belongs to a different parent', async () => {
    const s = await issueSession()
    vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
      stored({ tokenHash: s.getHash(), parentId: 'someone-else' }) as never
    )
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await expect(validateRefreshToken(s.refreshToken)).resolves.toBeNull()
  })

  it.each(['PENDING', 'REJECTED', 'SUSPENDED'])(
    'rejects an otherwise-valid token once the account is %s',
    async (status) => {
      // The point of the whole exercise: a gate that only runs at login would
      // let a suspended parent keep working by rotating.
      const s = await issueSession()
      vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
        stored({ tokenHash: s.getHash() }) as never
      )
      vi.mocked(parentRepo.getById).mockResolvedValue(parentRow({ status }) as never)

      await expect(validateRefreshToken(s.refreshToken)).resolves.toBeNull()
    }
  )

  it('rejects a token that does not match the stored hash', async () => {
    const s = await issueSession()
    const other = await issueSession('token-2')
    vi.mocked(parentRepo.getRefreshTokenById).mockResolvedValue(
      stored({ tokenHash: other.getHash() }) as never
    )
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await expect(validateRefreshToken(s.refreshToken)).resolves.toBeNull()
  })

  it('rejects an access token presented as a refresh token', async () => {
    const { accessToken } = await (async () => {
      vi.mocked(parentRepo.createRefreshToken).mockResolvedValue({ id: 'token-1' })
      return createParentSession(PARENT)
    })()

    await expect(validateRefreshToken(accessToken)).resolves.toBeNull()
  })
})

describe('registration and approval', () => {
  it('creates an applicant as PENDING and mints no session', async () => {
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(null)
    vi.mocked(parentRepo.createPending).mockResolvedValue({ id: 'new-parent' })

    const result = await registerParent('new@test.local', PASSWORD, { name: 'Bé', gradeLevel: 2 })

    expect(result).toEqual({ parentId: 'new-parent', status: 'PENDING' })
    expect(parentRepo.createPending).toHaveBeenCalledWith(
      'new@test.local',
      expect.any(String),
      { name: 'Bé', gradeLevel: 2 }
    )
    // No student until approval — otherwise the table fills with children of
    // accounts that are never approved.
    expect(studentRepo.create).not.toHaveBeenCalled()
    expect(parentRepo.createRefreshToken).not.toHaveBeenCalled()
  })

  it('refuses a duplicate address', async () => {
    vi.mocked(parentRepo.getByEmail).mockResolvedValue(parentRow() as never)
    await expect(
      registerParent('a@test.local', PASSWORD, { name: 'Bé', gradeLevel: 1 })
    ).rejects.toThrow('Email already registered')
  })

  it('materialises the student and the link on approval', async () => {
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow({ status: 'PENDING' }) as never)
    vi.mocked(parentRepo.getSignupPayload).mockResolvedValue({ name: 'Bé C', gradeLevel: 3 })
    vi.mocked(studentRepo.create).mockResolvedValue({
      id: 'student-c',
      name: 'Bé C',
      gradeLevel: 3,
    })

    await approveParent('admin-1', PARENT)

    expect(studentRepo.create).toHaveBeenCalledWith('Bé C', 3)
    expect(parentStudentRepo.link).toHaveBeenCalledWith(PARENT, 'student-c', 'OWNER')
    expect(parentRepo.setStatus).toHaveBeenCalledWith(PARENT, 'ACTIVE', {
      approvedById: 'admin-1',
    })
  })

  it('does not re-approve an account that is already ACTIVE', async () => {
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow({ status: 'ACTIVE' }) as never)
    await approveParent('admin-1', PARENT)
    expect(studentRepo.create).not.toHaveBeenCalled()
    expect(parentRepo.setStatus).not.toHaveBeenCalled()
  })
})

describe('suspendParent', () => {
  it('revokes every live device, not just the account state', async () => {
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow() as never)

    await suspendParent('admin-1', PARENT, 'abuse')

    expect(parentRepo.setStatus).toHaveBeenCalledWith(PARENT, 'SUSPENDED', {
      reviewNote: 'abuse',
    })
    expect(parentRepo.revokeAllForParent).toHaveBeenCalledWith(PARENT)
  })

  it('refuses to suspend the last admin', async () => {
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow({ isAdmin: true }) as never)
    vi.mocked(parentRepo.countAdmins).mockResolvedValue(1)

    await expect(suspendParent('admin-1', PARENT)).rejects.toThrow('Cannot suspend the last admin')
    expect(parentRepo.setStatus).not.toHaveBeenCalled()
  })

  it('allows suspending an admin while another remains', async () => {
    vi.mocked(parentRepo.getById).mockResolvedValue(parentRow({ isAdmin: true }) as never)
    vi.mocked(parentRepo.countAdmins).mockResolvedValue(2)

    await suspendParent('admin-1', PARENT)
    expect(parentRepo.setStatus).toHaveBeenCalled()
  })
})
