# Kid Hub — Installation & Setup Guide

Generated: 2026-05-03

---

## Prerequisites

| Tool | Minimum version | Install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ (bundled with Node 20) | — |
| Docker Desktop | 4.x | https://www.docker.com/products/docker-desktop |
| Git | 2.x | https://git-scm.com |

---

## 1. Clone and Install Dependencies

```bash
git clone <repo-url> kid-hub
cd kid-hub
npm install
```

---

## 2. Environment Variables

Create `.env.local` in the project root. This file is git-ignored — never commit it.

```bash
cp .env.local.example .env.local   # if example exists
# — OR — create manually:
touch .env.local
```

### Required Variables

#### `SESSION_SECRET`

JWT signing secret for parent session cookies. Must be at least 32 characters long.
The middleware throws at startup if this is missing or too short.

**Generate a secure value:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```ini
SESSION_SECRET=<output of command above>
```

#### `DATABASE_URL`

PostgreSQL connection string. If you are using the Docker Compose setup (recommended), this is
set automatically in `docker-compose.yml` and does **not** need to be in `.env.local`.

For a local PostgreSQL instance (not Docker):
```ini
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/kidhub
```

### Optional Variables (Upstash Redis Rate Limiting)

Without these, the PIN rate limiter degrades gracefully — PIN attempts are not rate-limited,
but the app functions normally. **Required for production.**

```ini
UPSTASH_REDIS_REST_URL=https://<your-instance>.upstash.io
UPSTASH_REDIS_REST_TOKEN=<your-rest-token>
```

**Get credentials:**
1. Sign up at https://upstash.com (free tier: 10,000 commands/day)
2. Create a Redis database (any region)
3. Copy the REST URL and REST Token from the database dashboard

### Complete `.env.local` Example

```ini
# ── Authentication ───────────────────────────────────────────────────────────
SESSION_SECRET=3TKwwNSFR+qifdmoSfR4QBP9tSD0Z/Y4HN9xusywASQ=   # replace with your own

# ── Database (only needed when NOT using Docker Compose) ─────────────────────
DATABASE_URL=postgresql://kidhub:kidhub_dev@localhost:5432/kidhub

# ── Upstash Redis (optional — rate limiting) ─────────────────────────────────
UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token
```

---

## 3. Database Setup (Docker — Recommended)

Docker Compose starts PostgreSQL 16 and the Next.js dev server together with a single command.

### Start the full stack

```bash
docker compose up
```

The first run builds the Next.js image (~2 minutes). Subsequent starts are instant.

- App: http://localhost:3000
- PostgreSQL: `localhost:5432` (user: `kidhub`, password: `kidhub_dev`, db: `kidhub`)

### Rebuild after dependency changes

```bash
docker compose up --build
```

### Run database migrations (first time only)

With the Docker containers running, open a second terminal:

```bash
npm run prisma:migrate
```

This runs `prisma migrate dev` with `.env.local` loaded. It creates all tables, indexes, and
constraints defined in `prisma/schema.prisma`.

### Seed the database

```bash
npm run prisma:seed
```

Seeds the default user (`khoi`) and initial data from `prisma/seed.ts`.

### Stop and remove containers

```bash
docker compose down
# To also delete the PostgreSQL volume (wipes all data):
docker compose down -v
```

---

## 4. Local Development (without Docker)

If you prefer to run PostgreSQL natively:

1. Install PostgreSQL 16
2. Create user and database:
   ```sql
   CREATE USER kidhub WITH PASSWORD 'kidhub_dev';
   CREATE DATABASE kidhub OWNER kidhub;
   ```
3. Set `DATABASE_URL` in `.env.local`
4. Run migrations: `npm run prisma:migrate`
5. Seed: `npm run prisma:seed`
6. Start the dev server: `npm run dev`

App is available at http://localhost:3000.

---

## 5. Playwright E2E Tests

### Install Playwright browsers (first time only)

```bash
npx playwright install chromium
```

### Run all tests

```bash
npm run test
```

This runs: `dotenv -e .env.local -- playwright test`

The `playwright.config.ts` auto-starts the dev server if it is not already running. Tests
load `.env.local` at startup so the `SESSION_SECRET` is available to the auth fixture.

### Run tests with the interactive UI

```bash
npm run test:ui
```

Opens Playwright UI mode — useful for debugging individual test steps and inspecting the DOM
at each assertion point.

### Run a single test file

```bash
npx dotenv -e .env.local -- playwright test e2e/auth/middleware.spec.ts
```

### Auth fixture — how it works

`e2e/fixtures/auth.ts` exports `createSessionToken()`, which signs a real HS256 JWT using the
`SESSION_SECRET` from `.env.local`. Tests inject this token as a cookie using
`context.addCookies()`, bypassing the PIN login page entirely.

```typescript
import { createSessionToken, SESSION_COOKIE } from '../fixtures/auth'

test('protected page loads', async ({ page, context }) => {
  const token = await createSessionToken()
  await context.addCookies([{
    name: SESSION_COOKIE,
    value: token,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }])
  await page.goto('/parent')
})
```

### Playwright test conventions

| Rule | Detail |
|---|---|
| Selectors | Use `data-testid` attributes — never CSS classes or text content |
| Waiting | Use `page.waitForURL()`, `expect(locator).toBeVisible()` — never `sleep()` |
| Time | Use `page.clock` for time-dependent assertions |
| Auth | Always use the `createSessionToken()` fixture for authenticated tests |
| CI | Set `PLAYWRIGHT_BASE_URL=http://localhost:3000` in CI environment |

---

## 6. Git Hooks (Security Shield)

Install the pre-push hook to prevent accidental secret commits:

```bash
chmod +x scripts/git-hooks/pre-push.sh
ln -sf ../../scripts/git-hooks/pre-push.sh .git/hooks/pre-push
```

**Test the scanner without pushing:**
```bash
git diff HEAD~1 HEAD | bash scripts/git-hooks/pre-push.sh --test
```

**Bypass (emergency only — requires PM approval):**
```bash
git push --no-verify
```

---

## 7. Code Quality Scripts

```bash
npm run lint          # ESLint with Next.js config
npm run format        # Prettier — auto-fix all files
npm run format:check  # Prettier — check only (use in CI)
npm run build         # Next.js production build (reveals type errors)
```

---

## 8. Common Issues

### "SESSION_SECRET env var must be set and at least 32 characters long"

The middleware throws this on every request if the secret is missing or too short.
- Check that `.env.local` exists in the project root.
- Verify `SESSION_SECRET` is at least 32 characters.
- In Docker: the `environment:` block in `docker-compose.yml` must have `SESSION_SECRET` set.

### Prisma migration fails: "relation does not exist"

The database is empty. Run `npm run prisma:migrate` to apply all migrations.

### Playwright tests fail with "SESSION_SECRET must be set"

The test fixture (`e2e/fixtures/auth.ts`) reads `SESSION_SECRET` from `process.env`.
- Ensure `.env.local` exists and has `SESSION_SECRET`.
- The test scripts use `dotenv -e .env.local --` prefix to load it.

### Docker: port 5432 already in use

A local PostgreSQL instance is running on the default port. Either stop it or change the
Docker port mapping in `docker-compose.yml` (e.g., `'5433:5432'`) and update `DATABASE_URL`.

### Upstash rate limit not active in Docker

Restart Docker after adding credentials to `.env.local`:
```bash
docker compose down && docker compose up --build
```
The `env_file: [.env.local]` directive in `docker-compose.yml` reads the file at container
start time — it does not hot-reload.
