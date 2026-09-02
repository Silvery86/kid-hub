import { defineConfig, devices } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load SESSION_SECRET and other local vars so fixtures can sign test JWTs
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

// One source of truth for the port. The dev server and the URL Playwright waits
// on must agree: hard-coding 3000 in one and letting Next fall back to another
// when the port is taken leaves the run waiting for a server that never appears.
const PORT = process.env.PLAYWRIGHT_PORT ?? '3000'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
