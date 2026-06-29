/**
 * Viewport matrix tests — RESP-007
 *
 * Verifies landscape-first responsive behaviour across priority tiers:
 *   P1 — iPhone 14 landscape  (844 × 390)
 *   P2 — iPhone 14 portrait   (390 × 844)
 *   P3 — iPad Air landscape   (1180 × 820)
 *   P4 — iPad Air portrait    (820 × 1180)
 *
 * Rules under test (RESPONSIVE.md):
 *   - Navigation: sidebar visible in landscape, tab bar visible in portrait, never both
 *   - Tap targets: every interactive element in kid routes ≥ 48px (min-h-tap)
 *   - Safe areas: fixed elements have the required safe-* padding class in DOM
 *   - h-dvh: game container uses dynamic viewport, not static h-screen
 */

import { test, expect, type BrowserContext } from '@playwright/test'
import { createSessionToken, SESSION_COOKIE } from '../fixtures/auth'

const VIEWPORTS = {
  'P1 — iPhone 14 landscape': { width: 844, height: 390 },
  'P2 — iPhone 14 portrait': { width: 390, height: 844 },
  'P3 — iPad Air landscape': { width: 1180, height: 820 },
  'P4 — iPad Air portrait': { width: 820, height: 1180 },
} as const

/** Wide portrait tablet: `lg` width breakpoint + portrait — layout padding must not reserve sidebar. */
const P5_LARGE_TABLET_PORTRAIT = { width: 1024, height: 1366 } as const

const COOKIE_DOMAIN = 'localhost'

/** Add an authenticated session cookie so protected routes are accessible. */
async function injectSession(context: BrowserContext) {
  const token = await createSessionToken('khoi-default-user')
  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: COOKIE_DOMAIN,
      path: '/',
      httpOnly: true,
    },
  ])
}

// ── Navigation switching ─────────────────────────────────────────────────────

test.describe('Navigation — landscape shows sidebar, portrait shows tab bar', () => {
  test('P1 landscape: sidebar visible, tab bar hidden', async ({ page, context }) => {
    await injectSession(context)
    await page.setViewportSize(VIEWPORTS['P1 — iPhone 14 landscape'])
    await page.goto('/dashboard')

    const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
    const tabBar  = page.getByRole('navigation',    { name: 'Main navigation' })

    await expect(sidebar).toBeVisible()
    await expect(tabBar).toBeHidden()
  })

  test('P2 portrait: tab bar visible, sidebar hidden', async ({ page, context }) => {
    await injectSession(context)
    await page.setViewportSize(VIEWPORTS['P2 — iPhone 14 portrait'])
    await page.goto('/dashboard')

    const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
    const tabBar  = page.getByRole('navigation',    { name: 'Main navigation' })

    await expect(tabBar).toBeVisible()
    await expect(sidebar).toBeHidden()
  })

  test('P4 iPad portrait: tab bar visible, sidebar hidden', async ({ page, context }) => {
    await injectSession(context)
    await page.setViewportSize(VIEWPORTS['P4 — iPad Air portrait'])
    await page.goto('/dashboard')

    const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
    const tabBar = page.getByRole('navigation', { name: 'Main navigation' })

    await expect(tabBar).toBeVisible()
    await expect(sidebar).toBeHidden()
  })

  test('P3 iPad landscape: sidebar visible and wide (lg: w-56)', async ({ page, context }) => {
    await injectSession(context)
    await page.setViewportSize(VIEWPORTS['P3 — iPad Air landscape'])
    await page.goto('/dashboard')

    const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
    await expect(sidebar).toBeVisible()

    const box = await sidebar.boundingBox()
    // lg: sidebar is w-56 = 224px; allow ±4px for sub-pixel rounding
    expect(box?.width).toBeGreaterThanOrEqual(220)
  })
})

// ── Tap targets ──────────────────────────────────────────────────────────────

test.describe('Tap targets — interactive elements ≥ 48px in kid routes', () => {
  for (const [label, viewport] of Object.entries(VIEWPORTS) as [string, { width: number; height: number }][]) {
    test(`${label}: all nav links ≥ 48px`, async ({ page, context }) => {
      await injectSession(context)
      await page.setViewportSize(viewport)
      await page.goto('/dashboard')

      // Gather all visible nav links
      const navLinks = page.locator('[aria-label="Main navigation"] a')
      const count = await navLinks.count()

      for (let i = 0; i < count; i++) {
        const link = navLinks.nth(i)
        if (!(await link.isVisible())) continue
        const box = await link.boundingBox()
        expect(box?.height, `Nav link ${i} height in ${label}`).toBeGreaterThanOrEqual(48)
        expect(box?.width,  `Nav link ${i} width in ${label}`).toBeGreaterThanOrEqual(48)
      }
    })
  }

  test('Dashboard game entry cards ≥ 64px (min-h-tap-lg)', async ({ page, context }) => {
    await injectSession(context)
    await page.setViewportSize(VIEWPORTS['P1 — iPhone 14 landscape'])
    await page.goto('/dashboard')

    const gameCards = page.locator('[aria-label^="Chơi"]')
    const count = await gameCards.count()

    for (let i = 0; i < count; i++) {
      const card = gameCards.nth(i)
      if (!(await card.isVisible())) continue
      const box = await card.boundingBox()
      expect(box?.height, `Game card ${i} height`).toBeGreaterThanOrEqual(64)
    }
  })
})

// ── Navigation count (max 4 kid nav items) ───────────────────────────────────

test('Portrait tab bar has ≤ 4 items', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(VIEWPORTS['P2 — iPhone 14 portrait'])
  await page.goto('/dashboard')

  const tabBar  = page.getByRole('navigation', { name: 'Main navigation' })
  const tabItems = tabBar.locator('a')
  const count = await tabItems.count()

  expect(count).toBeLessThanOrEqual(4)
})

// ── Games route: h-dvh ───────────────────────────────────────────────────────

test('Games layout uses h-dvh, not h-screen', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(VIEWPORTS['P1 — iPhone 14 landscape'])
  await page.goto('/games/math')

  // The game container must NOT have the h-screen class
  const gameContainer = page.locator('.game-container').first()
  const classes = await gameContainer.getAttribute('class') ?? ''
  expect(classes).not.toContain('h-screen')
  // It must have h-dvh
  expect(classes).toContain('h-dvh')
})

// ── Safe-area classes on fixed elements ──────────────────────────────────────

test('Landscape sidebar has safe-left class', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(VIEWPORTS['P1 — iPhone 14 landscape'])
  await page.goto('/dashboard')

  const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
  const classes = await sidebar.getAttribute('class') ?? ''
  expect(classes).toContain('safe-left')
})

test('Portrait tab bar has safe-bottom class', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(VIEWPORTS['P2 — iPhone 14 portrait'])
  await page.goto('/dashboard')

  const tabBar = page.getByRole('navigation', { name: 'Main navigation' })
  const classes = await tabBar.getAttribute('class') ?? ''
  expect(classes).toContain('safe-bottom')
})

test('P4 iPad portrait: tab bar has safe-bottom class', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(VIEWPORTS['P4 — iPad Air portrait'])
  await page.goto('/dashboard')

  const tabBar = page.getByRole('navigation', { name: 'Main navigation' })
  const classes = await tabBar.getAttribute('class') ?? ''
  expect(classes).toContain('safe-bottom')
})

test('P5 large tablet portrait: no horizontal overflow on dashboard', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize(P5_LARGE_TABLET_PORTRAIT)
  await page.goto('/dashboard')

  const overflows = await page.evaluate(() => {
    const root = document.documentElement
    return root.scrollWidth > root.clientWidth + 1
  })
  expect(overflows, 'document should not scroll horizontally').toBe(false)
})

test('P5 large tablet portrait: tab bar visible (portrait wins over lg sidebar)', async ({
  page,
  context,
}) => {
  await injectSession(context)
  await page.setViewportSize(P5_LARGE_TABLET_PORTRAIT)
  await page.goto('/dashboard')

  const sidebar = page.getByRole('complementary', { name: 'Main navigation' })
  const tabBar = page.getByRole('navigation', { name: 'Main navigation' })

  await expect(tabBar).toBeVisible()
  await expect(sidebar).toBeHidden()
})
