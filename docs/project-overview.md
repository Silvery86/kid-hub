# Project Overview — Kid Hub

**Last updated:** 2026-06-01
**Version:** 0.1.0
**Status:** Active development

---

## What is Kid Hub?

Kid Hub is a single-household learning dashboard built for one parent and one child. It gives the child a gamified, visual view of their school life — schedule, homework, grades, and educational mini-games — while giving the parent a PIN-protected admin panel to configure everything.

The app runs as a Progressive Web App (PWA) optimized for tablets and phones. The child unlocks it with a two-symbol pattern; the parent gains full access with email + password + PIN.

---

## Technical Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js App Router | 16.1.6 |
| Language | TypeScript (strict mode) | 5.x |
| UI | React | 19.2.3 |
| Styling | Tailwind CSS v4 + custom `@theme {}` tokens | 4.x |
| Database | PostgreSQL 16 (Neon Serverless) | 16 |
| ORM | Prisma | 7.5.0 |
| Validation | Zod | 4.3.6 |
| Auth | Jose (JWT HS256) + bcryptjs | 6.2.2 / 3.0.3 |
| Rate Limiting | Upstash Redis (sliding window) | 2.0.8 |
| State (client) | Zustand + localStorage | 5.0.12 |
| Testing | Playwright | 1.59.1 |
| Container | Docker + docker-compose | — |

---

## Architecture Overview

```
Browser (PWA / Tablet)
  │
  ├─ Kid Shell (dashboard, schedule, homework, grades)
  ├─ Games Shell (math, english mini-games)
  └─ Parent Shell (admin dashboard, kid-access)
  │
  ▼
Next.js 16 App Router
  ├─ Edge Middleware (JWT auth + Upstash rate limiting)
  ├─ Server Components (SSR data fetch at render time)
  └─ Server Actions (mutations: Zod + auth guard + service)
  │
  ├─ Service Layer  (server-only, pure business logic)
  ├─ Repository Layer  (Prisma only, no logic, userId in every mutation)
  │
  ▼
PostgreSQL 16 (Neon Serverless)
  14 models — User, ClassPeriod, SubjectGrade, UserProgress,
  MathProgress, EnglishProgress, DailyHomework, HomeworkCompletion,
  EarnedBadge, GameBestScore, ExtraClassOverride, ScreenTimeLog,
  ActivityEvent, ParentPin
```

---

## Route Groups

| Group | Prefix | Purpose | Auth |
|---|---|---|---|
| `(dashboard)` | `/dashboard`, `/schedule`, `/grades`, `/homework` | Kid-facing school views | `kid_session` cookie |
| `(games)` | `/games`, `/math`, `/english` | Educational mini-games | `kid_session` cookie |
| `(parent)` | `/parent`, `/parent/pin`, `/parent/login`, `/parent/kid-access` | Parent admin | `parent_access` cookie |
| Public | `/`, `/kid-unlock` | Entry points | None |

---

## Authentication Model

| Session | TTL | Storage | Used for |
|---|---|---|---|
| `kid_session` | 12 hours | HttpOnly cookie | Kid view access |
| `parent_access` | 15 minutes | HttpOnly cookie | Parent view access |
| `parent_refresh` | 30 days | HttpOnly cookie | Renew parent_access silently |

---

## Key Design Decisions

1. **Single-user household** — `DEFAULT_USER_ID` constant; no multi-tenant routing or RBAC.
2. **Server Actions only** — no REST API; all mutations go through `'use server'` actions.
3. **Dates as strings** — `"YYYY-MM-DD"` stored in `VARCHAR(10)` to avoid UTC offset bugs.
4. **Design tokens in `@theme {}`** — Tailwind v4 syntax; raw palette classes never used semantically.
5. **Orientation variants** — `portrait:` / `landscape:` custom variants instead of breakpoints.
6. **bcrypt at 12 rounds** — for password, PIN, and kid pattern hashing.

---

## Folder Structure

```
kid-hub/
├── app/                    — Next.js App Router (pages, layouts, route groups)
├── components/             — React components (ui/ primitives + domain/)
├── hooks/                  — Client-side hooks (schedule, games, progress, storage)
├── server/
│   ├── actions/            — Server Actions ('use server')
│   ├── services/           — Business logic (server-only)
│   ├── repositories/       — Prisma queries
│   └── lib/                — Auth guard, Zod schemas
├── lib/                    — Client-safe utilities and static data
├── prisma/                 — Schema, migrations, seed
├── e2e/                    — Playwright tests
├── docs/                   — All project documentation
├── agents/                 — AI agent role instructions
└── public/                 — Static assets, PWA manifest, service worker
```

---

## Local Development

```bash
# 1. Start database
docker compose up -d db

# 2. Install dependencies
npm install

# 3. Apply migrations + seed
npx prisma migrate dev
npx prisma db seed

# 4. Start dev server
npm run dev
```

Required `.env.local`:

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=<at-least-32-random-chars>
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```
