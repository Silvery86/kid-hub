import { test, expect } from '@playwright/test'
import { createSessionToken, SESSION_COOKIE } from '../fixtures/auth'

const COOKIE_DOMAIN = 'localhost'

test.describe('Middleware — parent route protection', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies()
  })

  // TC-MW-SECRET-01
  // Valid JWT signed with the real SESSION_SECRET → middleware passes the request.
  // URL must remain /parent (no redirect).
  test('TC-MW-SECRET-01: valid session cookie allows access to /parent', async ({
    page,
    context,
  }) => {
    const token = await createSessionToken('khoi-default-user')
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: token,
        domain: COOKIE_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    await page.goto('/parent')
    await expect(page).toHaveURL(/\/parent$/)
  })

  // TC-MW-SECRET-02
  // Cookie present but signature is wrong (tampered payload) → middleware rejects it,
  // redirects to /parent/login, and deletes the cookie from the response.
  test('TC-MW-SECRET-02: tampered cookie redirects to /parent/login and deletes cookie', async ({
    page,
    context,
  }) => {
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: 'eyJhbGciOiJIUzI1NiJ9.dGFtcGVyZWQtcGF5bG9hZA.bad-signature',
        domain: COOKIE_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    await page.goto('/parent')
    await expect(page).toHaveURL('/parent/login')
    const cookies = await context.cookies()
    expect(cookies.find(c => c.name === SESSION_COOKIE)).toBeUndefined()
  })

  // TC-MW-SECRET-03
  // No cookie present at all → middleware redirects immediately to /parent/login.
  test('TC-MW-SECRET-03: absent cookie redirects to /parent/login', async ({ page }) => {
    await page.goto('/parent')
    await expect(page).toHaveURL('/parent/login')
  })

  // TC-MW-SESSION-04
  // Parent access cookie remains valid when visiting kid routes.
  test('TC-MW-SESSION-04: dashboard visit keeps parent session valid', async ({
    page,
    context,
  }) => {
    const token = await createSessionToken('khoi-default-user')
    await context.addCookies([
      {
        name: SESSION_COOKIE,
        value: token,
        domain: COOKIE_DOMAIN,
        path: '/',
        httpOnly: true,
        sameSite: 'Lax',
      },
    ])
    await page.goto('/parent')
    await expect(page).toHaveURL(/\/parent$/)

    await page.goto('/dashboard')
    await expect(page).toHaveURL('/unlock')

    await page.goto('/parent')
    await expect(page).toHaveURL(/\/parent$/)
  })

  // TC-MW-KID-05
  // Child route access requires kid_session and redirects to /unlock without it.
  test('TC-MW-KID-05: absent kid_session redirects /dashboard to /unlock', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/unlock')
  })
})
