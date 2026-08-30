/**
 * Bearer guards. These describe what a token is allowed to reach, which is the
 * question the eight currently-unguarded kid routes will be answering once they
 * move under /students/:studentId.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/server/services/auth.service', () => ({
  verifyParentAccessToken: vi.fn(),
  verifyKidSessionToken: vi.fn(),
  canAccessStudent: vi.fn(),
  isAdmin: vi.fn(),
}))

import {
  canAccessStudent,
  isAdmin,
  verifyKidSessionToken,
  verifyParentAccessToken,
} from '@/server/services/auth.service'
import {
  requireAdminApi,
  requireParentApi,
  requireStudentApi,
  requireStudentReadApi,
} from './api-auth'

const PARENT = 'parent-1'
const STUDENT_A = 'student-a'
const STUDENT_B = 'student-b'

const withBearer = (token: string) =>
  new Request('https://kid.hub/api/v1/x', { headers: { authorization: `Bearer ${token}` } })

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(verifyParentAccessToken).mockResolvedValue(null)
  vi.mocked(verifyKidSessionToken).mockResolvedValue(null)
})

describe('requireParentApi', () => {
  it('returns the parent id for a valid token', async () => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue({
      parentId: PARENT,
      expiresAt: Date.now() + 1000,
    })
    await expect(requireParentApi(withBearer('t'))).resolves.toEqual({ parentId: PARENT })
  })

  it.each([
    ['no header', new Request('https://kid.hub/api/v1/x')],
    ['wrong scheme', new Request('https://kid.hub/api/v1/x', { headers: { authorization: 'Basic t' } })],
    ['empty bearer', new Request('https://kid.hub/api/v1/x', { headers: { authorization: 'Bearer  ' } })],
  ])('refuses when there is %s', async (_label, req) => {
    await expect(requireParentApi(req)).resolves.toBeNull()
  })

  it('refuses an invalid token', async () => {
    await expect(requireParentApi(withBearer('bad'))).resolves.toBeNull()
  })
})

describe('requireStudentApi', () => {
  beforeEach(() => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue({
      parentId: PARENT,
      expiresAt: Date.now() + 1000,
    })
  })

  it('admits a parent linked to the student', async () => {
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    await expect(requireStudentApi(withBearer('t'), STUDENT_A)).resolves.toEqual({
      parentId: PARENT,
    })
  })

  it('refuses a parent who is not linked — the cross-household case', async () => {
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    await expect(requireStudentApi(withBearer('t'), STUDENT_B)).resolves.toBeNull()
  })

  it('refuses a kid token outright: kid sessions never reach parent writes', async () => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue(null)
    vi.mocked(verifyKidSessionToken).mockResolvedValue({
      studentId: STUDENT_A,
      expiresAt: Date.now() + 1000,
    })
    await expect(requireStudentApi(withBearer('kid'), STUDENT_A)).resolves.toBeNull()
  })
})

describe('requireStudentReadApi', () => {
  it('admits a linked parent', async () => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue({
      parentId: PARENT,
      expiresAt: Date.now() + 1000,
    })
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    await expect(requireStudentReadApi(withBearer('t'), STUDENT_A)).resolves.toEqual({
      actor: 'parent',
    })
  })

  it('refuses an unlinked parent', async () => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue({
      parentId: PARENT,
      expiresAt: Date.now() + 1000,
    })
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    await expect(requireStudentReadApi(withBearer('t'), STUDENT_B)).resolves.toBeNull()
  })

  it('admits a kid session for its OWN student', async () => {
    vi.mocked(verifyKidSessionToken).mockResolvedValue({
      studentId: STUDENT_A,
      expiresAt: Date.now() + 1000,
    })
    await expect(requireStudentReadApi(withBearer('kid'), STUDENT_A)).resolves.toEqual({
      actor: 'kid',
    })
  })

  it('refuses a kid session pointed at another student', async () => {
    vi.mocked(verifyKidSessionToken).mockResolvedValue({
      studentId: STUDENT_A,
      expiresAt: Date.now() + 1000,
    })
    await expect(requireStudentReadApi(withBearer('kid'), STUDENT_B)).resolves.toBeNull()
    // The link table is not even consulted — a kid token carries no parent.
    expect(canAccessStudent).not.toHaveBeenCalled()
  })

  it('refuses an anonymous request', async () => {
    await expect(
      requireStudentReadApi(new Request('https://kid.hub/api/v1/x'), STUDENT_A)
    ).resolves.toBeNull()
  })
})

describe('requireAdminApi', () => {
  beforeEach(() => {
    vi.mocked(verifyParentAccessToken).mockResolvedValue({
      parentId: PARENT,
      expiresAt: Date.now() + 1000,
    })
  })

  it('admits an admin', async () => {
    vi.mocked(isAdmin).mockResolvedValue(true)
    await expect(requireAdminApi(withBearer('t'))).resolves.toEqual({ parentId: PARENT })
  })

  it('refuses an ordinary parent', async () => {
    vi.mocked(isAdmin).mockResolvedValue(false)
    await expect(requireAdminApi(withBearer('t'))).resolves.toBeNull()
  })
})
