/**
 * Cookie guards. The interesting cases are the ones where a token says one
 * thing and the join table says another — the join table always wins.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const cookieJar = new Map<string, string>()
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined,
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}))

vi.mock('@/server/services/auth.service', () => ({
  PARENT_ACCESS_COOKIE: 'parent_access',
  PARENT_REFRESH_COOKIE: 'parent_refresh',
  KID_SESSION_COOKIE: 'kid_session',
  verifyParentAccessToken: vi.fn(),
  verifyKidSessionToken: vi.fn(),
  canAccessStudent: vi.fn(),
  createParentSession: vi.fn(),
  listStudentsForParent: vi.fn(),
  validateRefreshToken: vi.fn(),
}))

import {
  canAccessStudent,
  createParentSession,
  listStudentsForParent,
  validateRefreshToken,
  verifyKidSessionToken,
  verifyParentAccessToken,
} from '@/server/services/auth.service'
import {
  requireKidSession,
  requireParentSession,
  requireStudentAccess,
  resolveActiveStudent,
} from './auth-guard'

const PARENT = 'parent-1'
const STUDENT_A = 'student-a'
const STUDENT_B = 'student-b'

const signedIn = () => {
  cookieJar.set('parent_access', 'access-token')
  vi.mocked(verifyParentAccessToken).mockResolvedValue({
    parentId: PARENT,
    expiresAt: Date.now() + 1000,
  })
}

beforeEach(() => {
  cookieJar.clear()
  vi.clearAllMocks()
  vi.mocked(verifyParentAccessToken).mockResolvedValue(null)
  vi.mocked(verifyKidSessionToken).mockResolvedValue(null)
  vi.mocked(validateRefreshToken).mockResolvedValue(null)
  vi.mocked(createParentSession).mockResolvedValue({
    accessToken: 'new-access',
    refreshToken: 'new-refresh',
  })
})

describe('requireParentSession', () => {
  it('accepts a valid access cookie', async () => {
    signedIn()
    await expect(requireParentSession()).resolves.toEqual({ parentId: PARENT })
  })

  it('falls back to the refresh cookie and re-issues both cookies', async () => {
    cookieJar.set('parent_refresh', 'refresh-token')
    vi.mocked(validateRefreshToken).mockResolvedValue({ parentId: PARENT, tokenId: 'token-1' })

    await expect(requireParentSession()).resolves.toEqual({ parentId: PARENT })
    expect(cookieJar.get('parent_access')).toBe('new-access')
    expect(cookieJar.get('parent_refresh')).toBe('new-refresh')
  })

  it('throws with no cookies at all', async () => {
    await expect(requireParentSession()).rejects.toThrow('Unauthorized')
  })

  it('throws when the refresh token is rejected — this is how a suspension lands', async () => {
    cookieJar.set('parent_refresh', 'refresh-token')
    vi.mocked(validateRefreshToken).mockResolvedValue(null)
    await expect(requireParentSession()).rejects.toThrow('Unauthorized')
  })
})

describe('requireStudentAccess', () => {
  it('admits a linked parent', async () => {
    signedIn()
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    await expect(requireStudentAccess(STUDENT_A)).resolves.toEqual({
      parentId: PARENT,
      studentId: STUDENT_A,
    })
  })

  it('throws Forbidden — not Unauthorized — for another household’s student', async () => {
    // The distinction matters: the caller is authenticated, just not entitled.
    signedIn()
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    await expect(requireStudentAccess(STUDENT_B)).rejects.toThrow('Forbidden')
  })

  it('throws Unauthorized when there is no session at all', async () => {
    await expect(requireStudentAccess(STUDENT_A)).rejects.toThrow('Unauthorized')
    expect(canAccessStudent).not.toHaveBeenCalled()
  })
})

describe('resolveActiveStudent', () => {
  beforeEach(signedIn)

  it('honours the cookie when the link still exists', async () => {
    cookieJar.set('active_student', STUDENT_B)
    vi.mocked(canAccessStudent).mockResolvedValue(true)
    await expect(resolveActiveStudent()).resolves.toBe(STUDENT_B)
  })

  it('ignores a cookie naming a student the parent is no longer linked to', async () => {
    // Un-sharing a child must not brick the dashboard for the other parent.
    cookieJar.set('active_student', STUDENT_B)
    vi.mocked(canAccessStudent).mockResolvedValue(false)
    vi.mocked(listStudentsForParent).mockResolvedValue([
      { id: STUDENT_A, name: 'A', gradeLevel: 1, avatarUrl: null, role: 'OWNER' },
    ] as never)

    await expect(resolveActiveStudent()).resolves.toBe(STUDENT_A)
  })

  it('falls back to the first student when no cookie is set', async () => {
    vi.mocked(listStudentsForParent).mockResolvedValue([
      { id: STUDENT_A, name: 'A', gradeLevel: 1, avatarUrl: null, role: 'OWNER' },
      { id: STUDENT_B, name: 'B', gradeLevel: 2, avatarUrl: null, role: 'OWNER' },
    ] as never)
    await expect(resolveActiveStudent()).resolves.toBe(STUDENT_A)
  })

  it('throws when the parent has no students', async () => {
    vi.mocked(listStudentsForParent).mockResolvedValue([])
    await expect(resolveActiveStudent()).rejects.toThrow('No students')
  })
})

describe('requireKidSession', () => {
  it('returns the student the kid token is scoped to', async () => {
    cookieJar.set('kid_session', 'kid-token')
    vi.mocked(verifyKidSessionToken).mockResolvedValue({
      studentId: STUDENT_A,
      expiresAt: Date.now() + 1000,
    })
    await expect(requireKidSession()).resolves.toEqual({ studentId: STUDENT_A })
  })

  it('throws with no kid cookie', async () => {
    await expect(requireKidSession()).rejects.toThrow('Unauthorized')
  })

  it('throws on an invalid kid token', async () => {
    cookieJar.set('kid_session', 'bad')
    await expect(requireKidSession()).rejects.toThrow('Unauthorized')
  })

  it('does not accept a parent access cookie as a kid session', async () => {
    signedIn()
    await expect(requireKidSession()).rejects.toThrow('Unauthorized')
  })
})
