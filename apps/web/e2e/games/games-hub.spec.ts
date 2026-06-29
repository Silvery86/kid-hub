/**
 * Games hub — /games launcher navigation and layout smoke tests.
 */

import { test, expect, type BrowserContext } from '@playwright/test'
import { createSessionToken, SESSION_COOKIE } from '../fixtures/auth'

const COOKIE_DOMAIN = 'localhost'

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

test('Games hub renders section cards and links to math and english', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/games')

  await expect(page.getByRole('heading', { name: /Trò chơi/ })).toBeVisible()
  await expect(page.getByTestId('game-section-math')).toBeVisible()
  await expect(page.getByTestId('game-section-english')).toBeVisible()

  await page.getByTestId('game-section-math').click()
  await expect(page).toHaveURL(/\/math$/)

  await page.goto('/games')
  await page.getByTestId('game-section-english').click()
  await expect(page).toHaveURL(/\/english$/)
})

test('Sidebar games nav links to /games and is active on hub', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/games')

  const gamesLink = page.getByTestId('nav-link-games')
  await expect(gamesLink).toHaveAttribute('href', '/games')
  await expect(gamesLink).toHaveAttribute('aria-current', 'page')
})

test('Portrait tab bar games link goes to /games', async ({ page, context }) => {
  await injectSession(context)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/dashboard')

  const gamesTab = page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByTestId('nav-link-games')
  await expect(gamesTab).toHaveAttribute('href', '/games')
  await gamesTab.click()
  await expect(page).toHaveURL(/\/games$/)
})
