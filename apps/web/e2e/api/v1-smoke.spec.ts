import { test, expect, type APIRequestContext } from '@playwright/test'
import { createSessionToken } from '../fixtures/auth'
import {
  HomeworkItemArraySchema,
  ProgressSummarySchema,
  ReportCardSchema,
  TodayViewSchema,
} from '@kid-hub/shared'

// Phase 2, item 8: one smoke test per /api/v1 route.
// These hit the running Next.js dev server (see playwright.config.ts webServer)
// via the Playwright `request` fixture — no browser, just the REST contract.
//
// Read routes assert the response body against the shared response schemas
// (C2), so a server-side shape change that the contract types missed fails the
// test at the exact endpoint instead of silently breaking the mobile client.
//
// Every student-scoped route now names its student in the path and is guarded,
// so the read tests sign in first. Auth routes are exercised through negative
// paths plus one full happy-path flow.

// Seeded parent credentials (prisma/seed.ts). Override via env in other environments.
const PARENT_EMAIL = process.env.TEST_PARENT_EMAIL ?? 'giang8692@gmail.com'
const PARENT_PASSWORD = process.env.TEST_PARENT_PASSWORD ?? 'Giang@123'

test.describe.configure({ mode: 'serial' })

type Session = { accessToken: string; studentId: string }
let sessionPromise: Promise<Session | null> | null = null

/**
 * A parent session for tests that are not about logging in.
 *
 * The token is signed locally with the same SESSION_SECRET the server verifies,
 * rather than obtained from POST /auth/login. That endpoint is rate-limited to
 * 5/60s per IP by design, and a suite that spends that budget on setup starves
 * the handful of tests that are genuinely about login — and then cascades into
 * skips that look like passes.
 */
function session(request: APIRequestContext): Promise<Session | null> {
  sessionPromise ??= buildSession(request)
  return sessionPromise
}

async function buildSession(request: APIRequestContext): Promise<Session | null> {
  const accessToken = await createSessionToken()
  const me = await request.get('/api/v1/parents/me', {
    headers: { authorization: `Bearer ${accessToken}` },
  })
  if (me.status() !== 200) return null
  const { data } = await me.json()
  const studentId = data.students[0]?.id
  return studentId ? { accessToken, studentId } : null
}

test.describe('API v1 — student-scoped read routes', () => {
  let auth: { accessToken: string; studentId: string } | null = null
  let headers: Record<string, string> = {}

  test.beforeAll(async ({ request }) => {
    auth = await session(request)
    if (auth) headers = { authorization: `Bearer ${auth.accessToken}` }
  })

  test.beforeEach(() => {
    test.skip(!auth, 'Seeded household unavailable in this environment')
  })

  test('GET homework/today matches HomeworkItem[] contract', async ({ request }) => {
    const res = await request.get(`/api/v1/students/${auth!.studentId}/homework/today`, { headers })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(() => HomeworkItemArraySchema.parse(body.data)).not.toThrow()
  })

  test('GET schedule matches TodayView contract', async ({ request }) => {
    const res = await request.get(`/api/v1/students/${auth!.studentId}/schedule`, { headers })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(() => TodayViewSchema.parse(body.data)).not.toThrow()
  })

  test('GET grades matches ReportCard contract', async ({ request }) => {
    const res = await request.get(`/api/v1/students/${auth!.studentId}/grades`, { headers })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(() => ReportCardSchema.parse(body.data)).not.toThrow()
  })

  test('GET progress matches the progress-summary contract (or null)', async ({ request }) => {
    const res = await request.get(`/api/v1/students/${auth!.studentId}/progress`, { headers })
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(() => ProgressSummarySchema.parse(body.data)).not.toThrow()
  })
})

/**
 * The tenancy probe. These eight routes shipped with no authentication at all;
 * a live check that they now refuse both an anonymous caller and an authenticated
 * parent asking about a student they are not linked to is the point of the phase.
 */
test.describe('API v1 — student-scoped routes refuse the wrong caller', () => {
  const FORMERLY_OPEN = [
    'homework/today',
    'schedule',
    'schedule/week',
    'progress',
    'profile',
    'grades',
    'math',
    'english',
  ]

  let auth: { accessToken: string; studentId: string } | null = null

  test.beforeAll(async ({ request }) => {
    auth = await session(request)
  })

  for (const path of FORMERLY_OPEN) {
    test(`GET ${path} is 401 without a token`, async ({ request }) => {
      test.skip(!auth, 'Seeded household unavailable in this environment')
      const res = await request.get(`/api/v1/students/${auth!.studentId}/${path}`)
      expect(res.status()).toBe(401)
    })

    test(`GET ${path} is 403 for a student the caller is not linked to`, async ({ request }) => {
      test.skip(!auth, 'Seeded household unavailable in this environment')
      const res = await request.get(`/api/v1/students/some-other-household/${path}`, {
        headers: { authorization: `Bearer ${auth!.accessToken}` },
      })
      expect(res.status()).toBe(403)
    })
  }

  test('the parent PIN route still rejects an anonymous caller', async ({ request }) => {
    const res = await request.post('/api/v1/auth/pin', { data: { pin: '1234' } })
    expect(res.status()).toBe(401)
  })

  test('the admin surface rejects a non-admin caller', async ({ request }) => {
    const res = await request.get('/api/v1/admin/parents')
    expect(res.status()).toBe(401)
  })
})

test.describe('API v1 — auth routes (negative paths)', () => {
  // POST /api/v1/auth/login — malformed body fails Zod validation.
  test('POST /auth/login rejects invalid input with 400', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', { data: {} })
    expect(res.status()).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  // POST /api/v1/auth/login — well-formed but unknown account.
  // Uses a non-existent email so the seeded account's lockout counter is untouched.
  test('POST /auth/login rejects unknown credentials with 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { email: 'nobody@example.com', password: 'wrong-password-123' },
    })
    expect(res.status()).toBe(401)
    expect((await res.json()).success).toBe(false)
  })

  // POST /api/v1/auth/refresh — malformed body.
  test('POST /auth/refresh rejects invalid input with 400', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh', { data: {} })
    expect(res.status()).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  // POST /api/v1/auth/refresh — well-formed but bogus token.
  test('POST /auth/refresh rejects an invalid token with 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: 'not-a-real-refresh-token' },
    })
    expect(res.status()).toBe(401)
    expect((await res.json()).success).toBe(false)
  })

  // POST /api/v1/auth/logout — malformed body.
  test('POST /auth/logout rejects invalid input with 400', async ({ request }) => {
    const res = await request.post('/api/v1/auth/logout', { data: {} })
    expect(res.status()).toBe(400)
    expect((await res.json()).success).toBe(false)
  })

  // POST /api/v1/auth/logout — revocation is best-effort, so a bogus token still 200s.
  test('POST /auth/logout accepts an unknown token (best-effort) with 200', async ({ request }) => {
    const res = await request.post('/api/v1/auth/logout', {
      data: { refreshToken: 'not-a-real-refresh-token' },
    })
    expect(res.status()).toBe(200)
    expect((await res.json()).success).toBe(true)
  })
})

test.describe('API v1 — auth happy-path flow', () => {
  // Full login → refresh → logout against the seeded parent account.
  // Skips gracefully if the account is not seeded (or is locked) in this environment.
  test('login issues tokens, refresh rotates them, logout revokes', async ({ request }) => {
    const loginRes = await request.post('/api/v1/auth/login', {
      data: { email: PARENT_EMAIL, password: PARENT_PASSWORD },
    })
    test.skip(loginRes.status() !== 200, 'Seeded household unavailable in this environment')

    const login = await loginRes.json()
    expect(login.success).toBe(true)
    expect(typeof login.accessToken).toBe('string')
    expect(typeof login.refreshToken).toBe('string')

    const refreshRes = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: login.refreshToken },
    })
    expect(refreshRes.status()).toBe(200)
    const refreshed = await refreshRes.json()
    expect(refreshed.success).toBe(true)
    expect(typeof refreshed.accessToken).toBe('string')
    expect(typeof refreshed.refreshToken).toBe('string')

    // Genuine rotation (S1): issuing a new refresh token overwrites the stored
    // hash, so the OLD refresh token is revoked and can no longer be exchanged.
    const reuseOld = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: login.refreshToken },
    })
    expect(reuseOld.status()).toBe(401)

    const logoutRes = await request.post('/api/v1/auth/logout', {
      data: { refreshToken: refreshed.refreshToken },
    })
    expect(logoutRes.status()).toBe(200)
    expect((await logoutRes.json()).success).toBe(true)
  })
})
