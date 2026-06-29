import { test, expect } from '@playwright/test'

// Phase 2, item 8: one smoke test per /api/v1 route.
// These hit the running Next.js dev server (see playwright.config.ts webServer)
// via the Playwright `request` fixture — no browser, just the REST contract.
//
// Read + homework-done routes are kid-facing (no auth, matching their Server Actions).
// Auth routes are exercised through negative paths plus one full happy-path flow.

// Seeded parent credentials (prisma/seed.ts). Override via env in other environments.
const PARENT_EMAIL = process.env.TEST_PARENT_EMAIL ?? 'giang8692@gmail.com'
const PARENT_PASSWORD = process.env.TEST_PARENT_PASSWORD ?? 'Giang@123'

test.describe('API v1 — kid-facing read routes', () => {
  // GET /api/v1/homework/today
  test('GET /homework/today returns an array', async ({ request }) => {
    const res = await request.get('/api/v1/homework/today')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  // GET /api/v1/schedule
  test('GET /schedule returns today view', async ({ request }) => {
    const res = await request.get('/api/v1/schedule')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
  })

  // GET /api/v1/grades
  test('GET /grades returns a report card', async ({ request }) => {
    const res = await request.get('/api/v1/grades')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toBeTruthy()
  })

  // GET /api/v1/progress
  test('GET /progress returns progress (or null)', async ({ request }) => {
    const res = await request.get('/api/v1/progress')
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body).toHaveProperty('data')
  })
})

test.describe('API v1 — homework write route', () => {
  // POST /api/v1/homework/[id]/done
  // markDone() does a Prisma update keyed on { id, userId }; a non-existent id throws
  // (P2025) which the route maps to 500 — so this exercises the route without mutating
  // any real homework record.
  test('POST /homework/[id]/done with unknown id responds with 500 JSON', async ({ request }) => {
    const res = await request.post('/api/v1/homework/__nonexistent-period-id__/done')
    expect(res.status()).toBe(500)
    const body = await res.json()
    expect(body.success).toBe(false)
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
    test.skip(loginRes.status() !== 200, 'Seeded parent account unavailable in this environment')

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

    const logoutRes = await request.post('/api/v1/auth/logout', {
      data: { refreshToken: refreshed.refreshToken },
    })
    expect(logoutRes.status()).toBe(200)
    expect((await logoutRes.json()).success).toBe(true)
  })
})
