# Kid Hub E2E Deploy Guide

Status: Ready for review
Scope: End-to-end deployment for production on Vercel + Neon + optional Cloudflare R2

## 1) What must be true before first deploy

1. You have accounts and projects created for:
- Vercel
- Neon (Postgres)
- GitHub (repo)
- Cloudflare R2 (only if English media assets are used)

2. Your repository has these production readiness code updates applied:
- Remove `output: 'standalone'` from `next.config.ts`
- Add Prisma generator `binaryTargets` in `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}
```

3. You run with pnpm only.

## 2) Environment variables you need

## 2.1 Required for production runtime (Vercel)

| Variable | Required | Example | Notes |
|---|---|---|---|
| DATABASE_URL | Yes | postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=15 | Must be Neon pooler endpoint in production |
| SESSION_SECRET | Yes | 32+ char random string | Must be at least 32 chars; used by middleware + auth JWT |

## 2.2 Required for production migrations (CI/CD)

| Variable | Required | Example | Notes |
|---|---|---|---|
| DATABASE_URL_UNPOOLED | Yes | postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb | Must be Neon direct endpoint for `prisma migrate deploy` |

## 2.3 Optional but strongly recommended

| Variable | Required | Example | Notes |
|---|---|---|---|
| UPSTASH_REDIS_REST_URL | No | https://xxxx.upstash.io | Enables PIN route rate limiting in middleware |
| UPSTASH_REDIS_REST_TOKEN | No | upstash-token | Pair with URL above |
| NEXT_PUBLIC_MEDIA_BASE_URL | Optional | https://pub-xxxx.r2.dev | Needed when serving English audio/image assets from R2 |

## 2.4 CI/CD secrets (GitHub Actions)

| Secret | Required | Notes |
|---|---|---|
| VERCEL_TOKEN | Yes | Token for Vercel CLI deploy |
| VERCEL_ORG_ID | Yes | Vercel org/team id |
| VERCEL_PROJECT_ID | Yes | Vercel project id |
| DATABASE_URL_UNPOOLED | Yes | For migration step |
| DATABASE_URL | Yes | For runtime validation/build contexts if needed |
| SESSION_SECRET | Yes | For e2e/auth-dependent checks |
| UPSTASH_REDIS_REST_URL | Optional | If rate limit must be active in deployed env |
| UPSTASH_REDIS_REST_TOKEN | Optional | If rate limit must be active in deployed env |
| NEXT_PUBLIC_MEDIA_BASE_URL | Optional | If English media module is live |

## 2.5 Local development and local e2e (.env.local)

| Variable | Required | Notes |
|---|---|---|
| DATABASE_URL | Yes | Local Postgres or Neon direct endpoint |
| SESSION_SECRET | Yes | Needed for auth flows and Playwright fixture JWT signing |
| PLAYWRIGHT_BASE_URL | Optional | Defaults to http://localhost:3000 |
| UPSTASH_REDIS_REST_URL | Optional | Optional local parity |
| UPSTASH_REDIS_REST_TOKEN | Optional | Optional local parity |

## 3) End-to-end deployment steps

## Step 1. Prepare infrastructure

1. Create Neon project.
2. Copy both connection strings:
- Direct endpoint -> for `DATABASE_URL_UNPOOLED`
- Pooler endpoint -> for production `DATABASE_URL`
3. Create Vercel project and connect GitHub repository.
4. If English media is needed, create Cloudflare R2 bucket and public URL.

## Step 2. Set environment variables in Vercel

1. Open Vercel project settings -> Environment Variables.
2. Add at minimum:
- `DATABASE_URL` (pooled Neon URL + `?pgbouncer=true&connect_timeout=15`)
- `SESSION_SECRET`
3. Add optional vars if used:
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_MEDIA_BASE_URL`

## Step 3. Create CI pipeline in GitHub Actions

Create `.github/workflows/ci.yml` with 3 jobs:

1. Lint + type-check
- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm exec tsc --noEmit`

2. E2E tests
- `pnpm exec playwright install --with-deps chromium`
- `pnpm test`

3. Production deploy + migrations
- Deploy to Vercel using token/org/project secrets
- Run Prisma migration using unpooled URL:

```bash
DATABASE_URL="$DATABASE_URL_UNPOOLED" pnpm exec prisma migrate deploy
```

Important:
- Never run `migrate deploy` with pooled URL.
- Keep runtime app URL (`DATABASE_URL`) on pooled endpoint.

## Step 4. First release

1. Push to `main`.
2. Confirm GitHub Actions all green.
3. Confirm Vercel deployment succeeded.
4. Run smoke checks in production:
- Parent PIN login works
- Dashboard loads
- Schedule/grades load
- Math game submit flow works
- Homework completion works

## Step 5. Post-deploy validation

1. Check Vercel function logs for auth or DB errors.
2. Verify middleware does not throw `SESSION_SECRET` errors.
3. Verify no Prisma connection saturation in Neon dashboard.
4. If using R2, verify media URLs load from `NEXT_PUBLIC_MEDIA_BASE_URL`.

## 4) Quick command checklist (local)

```bash
pnpm install
pnpm lint
pnpm exec tsc --noEmit
pnpm test
pnpm build
```

## 5) Common failure map

1. `SESSION_SECRET env var must be set and at least 32 characters long`
- Cause: Missing/short secret in Vercel or CI
- Fix: Set a 32+ char value everywhere

2. Prisma migration fails via pooler
- Cause: Running migration with pooled URL
- Fix: Use `DATABASE_URL_UNPOOLED` for migration commands

3. Random auth redirects to `/parent/pin`
- Cause: Secret mismatch between middleware signer/verifier contexts
- Fix: Ensure one consistent `SESSION_SECRET` value in deployed environment

4. 429 on PIN attempts too aggressive or not working
- Cause: Upstash vars missing or window too strict
- Fix: Set Upstash vars, then tune limiter in `lib/rate-limit.ts`

## 6) Recommended secure defaults

1. Generate `SESSION_SECRET` with at least 32 random bytes.
2. Restrict production secrets to production environment scope only.
3. Keep Neon branch separation:
- Production branch for prod app
- Staging branch for CI/e2e
4. Rotate `SESSION_SECRET` when moving from test to real users.

## 7) Go-live checklist

- [ ] `next.config.ts` no longer uses standalone output
- [ ] Prisma binaryTargets updated for Vercel runtime
- [ ] Vercel env vars set (`DATABASE_URL`, `SESSION_SECRET`)
- [ ] CI secrets set (`VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, `DATABASE_URL_UNPOOLED`)
- [ ] `prisma migrate deploy` runs against unpooled endpoint
- [ ] E2E tests pass in CI
- [ ] Production smoke tests pass
- [ ] Optional media and Upstash vars configured if features are enabled
