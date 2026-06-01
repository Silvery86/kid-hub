# Deployment Strategy — Kid Hub

> **Status:** DRAFT — Awaiting PM Approval
> **Date:** 2026-05-06
> **Budget Constraint:** $0–$5 / month
> **Author roles:** PM · Lead Dev · Database Architect · DevOps

---

## 0. Executive Summary

| Concern | Chosen Solution | Est. Monthly Cost |
|---|---|---|
| Frontend + API | Vercel Hobby (Free Tier) | $0 |
| Database | Neon Postgres (Free Tier) | $0 |
| Connection Pooling | Neon built-in PgBouncer pooler | $0 |
| Media / Asset Storage | Cloudflare R2 (Free Tier) | $0 |
| CI/CD | GitHub Actions (Free for public; 2,000 min/month private) | $0 |
| **Total** | | **$0 / month** |

All three infrastructure tiers (compute, database, storage) land on free plans that exceed
the traffic and data requirements of a single-household application. The Coolify / Hetzner VPS
alternative (~€4/month) is documented as Plan B for situations where Vercel's serverless cold-start
limits become a constraint.

---

## 1. Frontend & API Hosting

### 1.1 Option Analysis

#### Option A — Vercel Hobby (Recommended)

| Dimension | Detail |
|---|---|
| Cost | $0 (Hobby plan) |
| Bandwidth | 100 GB / month |
| Serverless function timeout | 10 s (Hobby) |
| Deployments | Unlimited |
| Next.js support | Native — Vercel created Next.js; App Router + Server Actions are first-class |
| Node.js runtime | Full support (no Edge-only restrictions) |
| Required code change | Remove `output: 'standalone'` from `next.config.ts`; add Prisma binary targets |

**Why it wins for this project:**
A single-household app generates ≪ 100 req/min. The 10-second function timeout is only
a risk on the very first cold-start after inactivity; subsequent requests reuse warm
instances. Vercel's native Next.js integration means zero adapter configuration for
Server Actions, RSC streaming, or route handlers. Deploy is triggered by a `git push`.

**Required `next.config.ts` change (not made yet — awaiting PM approval):**

- Remove `output: 'standalone'` — Vercel builds its own optimized bundle internally
- Add `experimental: { serverActions: { bodySizeLimit: '2mb' } }` if audio upload via actions is needed later

#### Option B — Cloudflare Pages + Workers

| Dimension | Detail |
|---|---|
| Cost | $0 (Workers Free: 100k req/day) |
| Next.js support | Via `@cloudflare/next-on-pages` adapter (community-maintained, lags Next.js releases) |
| Prisma compatibility | Prisma 7 uses Node.js APIs not available in the Workers Edge runtime |
| Verdict | **Not viable** without migrating away from Prisma to Drizzle + D1 or a HTTP-based ORM |

#### Option C — Coolify on Hetzner CX11 (Plan B)

| Dimension | Detail |
|---|---|
| Cost | ~€3.29/month (CX11: 1 vCPU, 2 GB RAM) |
| Deployment model | Docker Compose — `output: 'standalone'` stays, no code change |
| Next.js runtime | Node.js — no restrictions |
| Managed TLS / reverse proxy | Traefik (built into Coolify) |
| Ops overhead | SSH access, manual security patches, uptime monitoring |
| When to choose | If Vercel free function timeout causes persistent UX problems |

### 1.2 Recommended Path: Vercel Hobby

```
git push → Vercel CI (builds Next.js) → deploys to global CDN edge network
                                          └─ Server Actions run on Node.js Serverless Functions
                                          └─ Static assets served from edge PoPs
```

**One required pre-flight change before production deploy:**

1. Remove `output: 'standalone'` from `next.config.ts`
2. Add Prisma `binaryTargets` for the Linux-musl environment Vercel uses:

```prisma
// prisma/schema.prisma — generator block
binaryTargets = ["native", "rhel-openssl-3.0.x"]
```

> **PM ACTION REQUIRED:** Approve code change to `next.config.ts` and `prisma/schema.prisma` before the Lead Dev makes the edit.

---

## 2. Database & Connection Management

### 2.1 Neon Free Tier Limits

| Resource | Free Allowance | Kid Hub Estimate |
|---|---|---|
| Storage | 0.5 GB | < 10 MB (single household) |
| Compute hours | 190 h / month | < 20 h (low traffic) |
| Projects | 1 | 1 |
| Branches | 10 | 2 (main + staging) |
| Auto-suspend | After 5 min idle | Acceptable for personal app |

### 2.2 Connection Pooling — Neon PgBouncer Pooler

Neon provides **two connection endpoints** for each project:

| Endpoint Type | URL Pattern | Mode |
|---|---|---|
| Direct | `ep-<id>.region.aws.neon.tech` | Long-lived connections (dev / migrations) |
| Pooler | `ep-<id>-pooler.region.aws.neon.tech` | PgBouncer transaction-mode (production) |

**Rule:** Production `DATABASE_URL` in Vercel environment variables **must** use the pooler
endpoint. The direct endpoint is reserved for `prisma migrate` CI steps and local dev.

```bash
# .env.local (dev) — direct endpoint
DATABASE_URL="postgresql://user:pass@ep-<id>.region.aws.neon.tech/neondb"

# Vercel env vars (production) — pooler endpoint
DATABASE_URL="postgresql://user:pass@ep-<id>-pooler.region.aws.neon.tech/neondb?pgbouncer=true&connect_timeout=15"

# For prisma migrate in CI only — direct endpoint
DATABASE_URL_UNPOOLED="postgresql://user:pass@ep-<id>.region.aws.neon.tech/neondb"
```

**Why `?pgbouncer=true`:** Tells Prisma to disable prepared statement caching, which is
incompatible with PgBouncer's transaction mode. Without it, concurrent Server Action calls
can corrupt statement IDs and crash the query pipeline.

---

## 3. Media & Asset Storage (English Module)

### 3.1 Option Analysis

#### Option A — Cloudflare R2 (Recommended)

| Dimension | Detail |
|---|---|
| Cost | $0 — Free tier: 10 GB storage, 1M Class-A ops, 10M Class-B ops / month |
| Egress fees | **$0** — R2 has zero egress fees by design |
| CDN | Served through Cloudflare global CDN automatically via R2 public bucket URL |
| SDK | `@aws-sdk/client-s3` (R2 is S3-compatible) — no new dependency |

#### Option B — Backblaze B2

| Dimension | Detail |
|---|---|
| Cost | $0 for first 10 GB storage |
| Egress fees | $0.01/GB **unless** routed through Cloudflare CDN (Bandwidth Alliance) |
| Verdict | Viable but requires Cloudflare CDN config to eliminate egress; extra setup vs. R2 |

### 3.2 Recommended Path: Cloudflare R2

```
Audio / image files → uploaded to R2 bucket (once, via Wrangler CLI or dashboard)
                       └─ R2 public bucket URL → stored in DB (english_words table)
                       └─ Next.js Image / <audio> tag → fetches directly from R2 CDN
                          (no egress fees, no Vercel bandwidth consumed)
```

**Bucket structure:**

```
r2://kid-hub-media/
  english/
    audio/   ← .mp3 / .ogg word pronunciations
    images/  ← .webp word illustrations
  math/      ← (reserved, no binary assets currently needed)
```

**Environment variable to add (not yet):**

```bash
NEXT_PUBLIC_MEDIA_BASE_URL="https://pub-<hash>.r2.dev"
```

---

## 4. CI/CD Pipeline

### 4.1 Workflow Design

```
[git push to main] ──► GitHub Actions: ci.yml
                            │
                    ┌───────▼───────────────────────────────┐
                    │  Job 1: lint-and-type-check            │
                    │    - pnpm install (cached)             │
                    │    - pnpm tsc --noEmit                 │
                    │    - pnpm eslint                       │
                    └───────┬───────────────────────────────┘
                            │ (on success)
                    ┌───────▼───────────────────────────────┐
                    │  Job 2: playwright-e2e                 │
                    │    - Spin up Neon branch (staging)     │
                    │    - DATABASE_URL → staging pooler     │
                    │    - pnpm playwright test              │
                    │    - Upload report as artifact         │
                    └───────┬───────────────────────────────┘
                            │ (on success)
                    ┌───────▼───────────────────────────────┐
                    │  Job 3: deploy-to-vercel               │
                    │    - vercel --prod                     │
                    │    - Runs prisma migrate deploy        │
                    └───────────────────────────────────────┘
```

### 4.2 Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Prisma migrations in CI | `prisma migrate deploy` in Job 3, against unpooled URL | `migrate deploy` is idempotent; pooler URL breaks migration commands |
| Playwright DB | Neon staging branch (free, ephemeral) | Isolation from prod; auto-suspend saves compute |
| Secrets | GitHub Actions Secrets: `VERCEL_TOKEN`, `DATABASE_URL`, `SESSION_SECRET`, `MEDIA_BASE_URL` | Never in code |
| Trigger | `push` to `main` only | No per-PR deploys needed for a personal project |

### 4.3 GitHub Actions Monthly Usage Estimate

| Step | Est. Duration |
|---|---|
| Install + type-check | ~2 min |
| Playwright (headless Chromium) | ~4 min |
| Vercel deploy | ~3 min |
| **Total per push** | **~9 min** |
| Pushes per month (estimate) | ~30 |
| **Total minutes/month** | **~270 min** (< 2,000 min free limit) |

---

## 5. Full Cost Breakdown

| Service | Plan | Limit | Kid Hub Usage | Monthly Cost |
|---|---|---|---|---|
| Vercel | Hobby (Free) | 100 GB bandwidth, 10s functions | < 1 GB, < 100 req/day | **$0** |
| Neon Postgres | Free | 0.5 GB, 190 compute-hours | < 10 MB, < 20 h | **$0** |
| Cloudflare R2 | Free | 10 GB storage, 1M ops | < 500 MB, ~10k ops | **$0** |
| GitHub Actions | Free (private repo) | 2,000 min/month | ~270 min/month | **$0** |
| GitHub (repo hosting) | Free | Unlimited for personal | — | **$0** |
| **Total** | | | | **$0 / month** |

---

## 6. Deployment Steps (High-Level — Not Yet Executed)

> These steps are **planned only**. No action will be taken until PM gives written approval.

### Phase 1 — Prerequisites (one-time setup)

1. Create Neon project → note direct + pooler connection strings
2. Create Cloudflare R2 bucket `kid-hub-media` with public access enabled
3. Create Vercel project linked to GitHub repo
4. Add all secrets to GitHub Actions and Vercel environment variables

### Phase 2 — Code Changes (Lead Dev, 1-file each)

1. `next.config.ts` — remove `output: 'standalone'`
2. `prisma/schema.prisma` — add `binaryTargets` for Vercel Linux
3. `lib/db.ts` — confirm `DATABASE_URL` reads from env (no hardcoding)

### Phase 3 — CI/CD Setup (DevOps)

1. Create `.github/workflows/ci.yml` with 3-job pipeline described above
2. Add Playwright config for CI headless mode (already has `playwright.config.ts`)

### Phase 4 — First Deploy

1. `git push main` → GitHub Actions runs → Vercel deploys
2. Run `prisma migrate deploy` against Neon prod via CI
3. Smoke-test: parent PIN, kid dashboard, math game, homework

### Phase 5 — Media Upload (Lead Dev, before English module launch)

1. Upload audio + image assets to R2 via Wrangler CLI
2. Set `NEXT_PUBLIC_MEDIA_BASE_URL` in Vercel env vars
3. Update English module DB seed with R2 URLs

---

## 7. Open Questions for PM

1. **Repository visibility:** Is the GitHub repo public or private?
   - Public → GitHub Actions is fully free with no minute limits
   - Private → 2,000 min/month free (sufficient, but worth confirming)

2. **Custom domain:** Do we want a custom domain on Vercel (e.g., `kidhub.yourdomain.com`)?
   - Vercel supports custom domains on Hobby plan for free; only requires DNS config

3. **`SESSION_SECRET` rotation plan:** Before prod deploy, we need a rotation plan for the JWT secret.

4. **Staging environment:** Is a separate Vercel preview deployment (per branch) desired, or is a single `main → production` pipeline sufficient?

---

*Document created by Claude Code acting in PM / Lead Dev / Database Architect / DevOps roles.*
*No configuration files, Dockerfiles, or GitHub Actions workflows have been created.*
*Awaiting PM approval before any implementation steps are taken.*
