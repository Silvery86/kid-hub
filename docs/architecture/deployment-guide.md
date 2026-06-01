# End-to-End Deployment Guide — Kid Hub

> **Status:** Live (updated May 2026)
> **Stack:** Next.js 16 · Neon Postgres · Vercel · Upstash Redis · Cloudflare R2

---

## 0. Service Accounts & Free Tier Summary

Register for all services before starting. Everything below is free for a single-household app.

| Service | Register At | Free Tier Limits | Card Required |
|---|---|---|---|
| **GitHub** | github.com | Unlimited public repos; 2,000 Actions min/month private | No |
| **Vercel** | vercel.com | 100 GB bandwidth, unlimited deploys, 10s function timeout | No |
| **Neon** | neon.tech | 0.5 GB storage, 190 compute-hours/month, 1 project, 10 branches | No |
| **Upstash** | upstash.com | 10,000 requests/day, 256 MB Redis | No |
| **Cloudflare R2** | cloudflare.com | 10 GB storage, 1M writes, 10M reads/month, zero egress fees | Yes (identity only, not charged) |

---

## 1. Code Changes Required Before First Deploy

Apply these once to your repository before pushing to production.

### 1.1 Remove standalone output (required for Vercel)

`next.config.ts` — remove the `output: 'standalone'` line. Vercel builds its own bundle internally.

### 1.2 Add Prisma binary targets (required for Vercel Linux runtime)

`prisma/schema.prisma` — update the generator block:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
  binaryTargets   = ["native", "rhel-openssl-3.0.x"]
}
```

### 1.3 Add postinstall script (required — generates Prisma client on Vercel build)

`package.json` — already done:

```json
"postinstall": "prisma generate"
```

### 1.4 Force dynamic rendering on all data pages (required)

Already done. The following pages have `export const dynamic = 'force-dynamic'`:

- `app/(dashboard)/dashboard/page.tsx`
- `app/(dashboard)/schedule/page.tsx`
- `app/(dashboard)/grades/page.tsx`
- `app/(dashboard)/homework/page.tsx`
- `app/(parent)/parent/page.tsx`

---

## 2. Step-by-Step Infrastructure Setup

### Step 1 — Neon (Database)

**Register:** neon.tech → Sign up free

**Create project:**

1. New Project → choose region closest to you (e.g. `ap-southeast-1` for Vietnam)
2. Database name: `neondb` (default is fine)
3. Note both connection strings from **Connection Details** panel:

| Connection Type | When to Use | Where Endpoint Contains |
|---|---|---|
| **Direct** (unpooled) | Migrations, seeding, local dev | no `-pooler` in hostname |
| **Pooled** | Production app runtime (Vercel) | `-pooler` in hostname |

**Env vars you collect from Neon:**

| Variable | Which Connection | Example Format |
|---|---|---|
| `DATABASE_URL` | Pooled | `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require` |
| `DATABASE_URL_UNPOOLED` | Direct | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require` |

**For production runtime, append these params to `DATABASE_URL` (pooled):**

```
?pgbouncer=true&connect_timeout=15&sslmode=require
```

**Run migrations from local machine (one-time, uses direct URL):**

```bash
DATABASE_URL="<your-direct-url>" pnpm exec prisma migrate deploy
```

**Seed initial data from local machine (one-time, uses direct URL):**

```bash
DATABASE_URL="<your-direct-url>" pnpm prisma:seed
```

Expected output:

```
✅ Default user seeded: Khôi (id: khoi-default-user)
✅ Weekly schedule seeded: 20 periods across 5 days
```

---

### Step 2 — Upstash (Rate Limiting Redis)

**Register:** upstash.com → Sign up free

**Create database:**

1. Console → Create Database
2. Name: `kid-hub-ratelimit`
3. Region: same as your Neon region
4. Type: Regional (free)

**Get credentials:**

1. Click your database → REST API tab
2. Copy both values shown:

| Variable | Where to Find It | Notes |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | REST API tab → UPSTASH_REDIS_REST_URL | Starts with `https://` |
| `UPSTASH_REDIS_REST_TOKEN` | REST API tab → UPSTASH_REDIS_REST_TOKEN | Long base64 string |

Without these, the app still works but PIN rate limiting is disabled (middleware degrades gracefully).

---

### Step 3 — Cloudflare R2 (Media Storage — optional)

Only needed when the English audio/image module is launched.

**Register:** cloudflare.com → Sign up (free, identity verification required, no charge)

**Create bucket:**

1. Dashboard → R2 Object Storage → Create bucket
2. Name: `kid-hub-media`
3. Enable public access → copy the public bucket URL

**Bucket structure to upload to later:**

```
kid-hub-media/
  english/
    audio/    ← .mp3 word pronunciations
    images/   ← .webp word illustrations
```

**Env var you collect from R2:**

| Variable | Where to Find It |
|---|---|
| `NEXT_PUBLIC_MEDIA_BASE_URL` | R2 bucket → Public bucket URL (e.g. `https://pub-xxxx.r2.dev`) |

---

### Step 4 — Vercel (Hosting)

**Register:** vercel.com → Sign up free with GitHub account

**Create project:**

1. New Project → Import Git Repository → select `kid-hub`
2. Framework: Next.js (auto-detected)
3. Root directory: `/` (default)
4. Build command: `pnpm build` (auto-detected from `package.json`)
5. Install command: `pnpm install` (auto-detected)

**Set environment variables:**

Go to: Project Settings → Environment Variables → add each one with scope **Production and Preview**

**From Neon:**

| Key | Value | Scope |
|---|---|---|
| `DATABASE_URL` | Pooled URL + `?pgbouncer=true&connect_timeout=15&sslmode=require` | Production, Preview |

**App secrets:**

| Key | Value | Scope |
|---|---|---|
| `SESSION_SECRET` | 32+ char random string (generate with `openssl rand -base64 32`) | Production, Preview |

**From Upstash (optional):**

| Key | Value | Scope |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` | REST URL from Upstash console | Production, Preview |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from Upstash console | Production, Preview |

**Trigger first deploy:** Click Deploy (or push a commit to `main`).

---

### Step 5 — GitHub Actions Secrets (for CI/CD pipeline)

Go to: GitHub repo → Settings → Secrets and variables → Actions → New repository secret

**From Vercel:**

| Secret Name | Where to Find It |
|---|---|
| `VERCEL_TOKEN` | vercel.com → Account Settings → Tokens → Create |
| `VERCEL_ORG_ID` | Vercel Project Settings → General → Team/Org ID |
| `VERCEL_PROJECT_ID` | Vercel Project Settings → General → Project ID |

**From Neon:**

| Secret Name | Which URL |
|---|---|
| `DATABASE_URL` | Pooled Neon URL (same as Vercel env var) |
| `DATABASE_URL_UNPOOLED` | Direct Neon URL — used only for `prisma migrate deploy` in CI |

**App secrets:**

| Secret Name | Notes |
|---|---|
| `SESSION_SECRET` | Same value as Vercel env var — needed for auth in Playwright tests |

---

## 3. Local Development `.env.local`

Create `.env.local` in project root (gitignored). Use the **direct** Neon URL for local dev.

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=<generate with: openssl rand -base64 32>
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require

UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

NEXT_PUBLIC_MEDIA_BASE_URL=https://pub-xxxx.r2.dev
```

---

## 4. Quick Command Reference

```bash
# Install dependencies (also runs prisma generate via postinstall)
pnpm install

# Run migrations against any DB
DATABASE_URL="<direct-url>" pnpm exec prisma migrate deploy

# Seed database (reads DATABASE_URL from .env.local)
pnpm prisma:seed

# Local dev server
pnpm dev

# Lint check
pnpm lint

# Type check
pnpm exec tsc --noEmit

# Production build verification
pnpm build

# Run e2e tests
pnpm test
```

---

## 5. Common Failure Map

| Error | Cause | Fix |
|---|---|---|
| `SESSION_SECRET must be at least 32 characters` | Missing or short secret in Vercel env | Set a 32+ char value; generate with `openssl rand -base64 32` |
| `PrismaClient has no member 'xxx'` at build time | Stale generated Prisma client | Run `pnpm exec prisma generate` then redeploy |
| `The table 'xxx' does not exist` | Migrations not run against production DB | Run `prisma migrate deploy` with direct Neon URL |
| Pages show no data after deploy | Pages were statically rendered during build when DB was empty | Ensure `export const dynamic = 'force-dynamic'` on all data pages |
| `prisma migrate deploy` fails | Running against pooled URL | Always use direct (unpooled) URL for migrations |
| Random redirect to `/parent/pin` | SESSION_SECRET mismatch between environments | Confirm same SESSION_SECRET value in Vercel and locally |
| PIN rate limit 429 not working | Upstash vars not set | Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to Vercel |

---

## 6. Go-Live Checklist

**Code:**

- [ ] `output: 'standalone'` removed from `next.config.ts`
- [ ] Prisma `binaryTargets` updated in `prisma/schema.prisma`
- [ ] `postinstall: prisma generate` in `package.json`
- [ ] Data pages have `export const dynamic = 'force-dynamic'`

**Neon:**

- [ ] Project created, region chosen
- [ ] Both connection strings copied (direct + pooled)
- [ ] `prisma migrate deploy` run against direct URL — all migrations applied
- [ ] `pnpm prisma:seed` run — user and schedule seeded

**Vercel:**

- [ ] Project linked to GitHub repo
- [ ] `DATABASE_URL` set (pooled URL with `?pgbouncer=true&connect_timeout=15`)
- [ ] `SESSION_SECRET` set (32+ chars)
- [ ] Optional: Upstash and R2 vars set if features are active
- [ ] First deploy succeeded

**Smoke Tests on Live URL:**

- [ ] Parent PIN login works
- [ ] Dashboard loads with schedule data
- [ ] Grades page loads
- [ ] Math game completes and saves score
- [ ] Homework can be marked done
