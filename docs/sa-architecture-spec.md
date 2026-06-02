# Architecture Specification — Kid Hub

**Role:** SA — Dana Kim
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. System Overview

Kid Hub is a single-tenant Next.js 16 App Router application serving one household. There is no multi-tenancy, no public registration, and no external API consumers. All data is private to the household.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser / PWA                        │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────┐  │
│  │  Kid Shell    │   │  Games Shell  │   │  Parent   │  │
│  │ (dashboard)   │   │ (math/english)│   │  Shell    │  │
│  └───────┬───────┘   └───────┬───────┘   └─────┬─────┘  │
└──────────┼───────────────────┼─────────────────┼────────┘
           │  HTTPS (cookies)  │                 │
┌──────────▼───────────────────▼─────────────────▼────────┐
│                Next.js 16 App Router                      │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Edge Middleware (middleware.ts)                     │  │
│  │  • JWT verification (kid_session / parent_access)   │  │
│  │  • Auto-refresh parent_access from parent_refresh   │  │
│  │  • Upstash rate-limit on auth POSTs                 │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌──────────────────┐  ┌──────────────────────────────┐   │
│  │  Server Components│  │  Server Actions ('use server')│  │
│  │  (data fetch at  │  │  Zod validation + auth guard  │  │
│  │   render time)   │  │  + service orchestration      │  │
│  └──────────────────┘  └──────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Service Layer (server-only, pure functions)        │  │
│  │  auth · schedule · grades · homework · game · act  │  │
│  └─────────────────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Repository Layer (Prisma only, no logic)           │  │
│  │  user · schedule · grades · math · english · prog  │  │
│  └─────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────┘
                                   │ pg (TCP)
┌──────────────────────────────────▼──────────────────────┐
│            PostgreSQL 16 (Neon Serverless)                │
│  14 models · Prisma ORM · @prisma/adapter-pg             │
└─────────────────────────────────────────────────────────┘

External services (optional):
  • Upstash Redis — sliding window rate limiting
  • Firebase — reserved, not yet active
```

---

## 2. Layer Contract

| Layer | Directory | Import Rule | Allowed Dependencies |
|---|---|---|---|
| Page | `app/**/page.tsx` | No restriction | Server actions, components, lib |
| Server Action | `server/actions/` | `'use server'` | Service only |
| Service | `server/services/` | `'server-only'` | Repository, lib |
| Repository | `server/repositories/` | `'server-only'` | Prisma client only |
| Lib | `lib/` | None | No Node.js APIs |
| Hook | `hooks/` | `'use client'` implied | Actions, lib |
| Component | `components/` | None | Hooks, lib, UI primitives |

**Forbidden crossings:**
- Components/hooks must never import from `server/`
- Actions must never import from `server/repositories/` directly
- Repositories must never contain business logic

---

## 3. Entity Relationship Diagram

```
User (1)─────────────────────────────────────────────────(1) ParentPin
  │
  ├──(1:N)── ClassPeriod ──(1:N)── HomeworkCompletion
  │              │
  │              └──(1:N)── ExtraClassOverride
  │
  ├──(1:N)── SubjectGrade
  │
  ├──(1:N)── DailyHomework
  │
  ├──(1:1)── UserProgress ──(1:N)── EarnedBadge
  │               └──────────(1:N)── GameBestScore
  │
  ├──(1:N)── MathProgress
  ├──(1:N)── EnglishProgress
  ├──(1:N)── ScreenTimeLog
  └──(1:N)── ActivityEvent
```

### Key Constraints

| Constraint | Table | Column(s) |
|---|---|---|
| One period per day slot | `class_periods` | `UNIQUE(userId, day, periodNumber)` |
| One homework per period per day | `homework_completions` | `UNIQUE(periodId, date)` |
| One cancellation per extra class per day | `extra_class_overrides` | `UNIQUE(periodId, date)` |
| One grade per subject per semester/year | `subject_grades` | `UNIQUE(userId, subjectId, semester, academicYear)` |
| One best score per game/level/type | `game_best_scores` | `UNIQUE(userProgressId, gameType, level, subType)` |
| One screen time log per day | `screen_time_logs` | `UNIQUE(userId, date)` |
| One progress record per user | `user_progress` | `UNIQUE(userId)` |

---

## 4. Database Design Decisions

### Date Storage

All dates are stored as `VARCHAR(10)` strings in `"YYYY-MM-DD"` format, not as `DateTime`. This avoids timezone offset bugs when comparing "today" on the server (which may be UTC) against dates entered by the client.

### Single User ID

`DEFAULT_USER_ID = 'khoi-default-user'` is the seeded user. All queries include `WHERE userId = DEFAULT_USER_ID`. This is a deliberate single-tenant simplification and must remain as a constant, never hard-coded as a string literal.

### Kid Access Settings as JSON

`User.kidAccessSettings` is stored as `Json?`. This allows the parent to toggle any number of named feature flags without a schema migration. Trade-off: no type safety at the DB level; Zod validates on write.

### Game Progress Split

`MathProgress` and `EnglishProgress` are separate tables rather than a polymorphic `GameProgress` because their domain-specific fields (`minigame` enum) differ. `GameBestScore` is a shared best-score table keyed by `(gameType, level, subType)`.

---

## 5. Authentication Architecture

### Session Tokens

| Token | Storage | TTL | Algorithm | Payload |
|---|---|---|---|---|
| `kid_session` | HttpOnly cookie | 12 hours | HS256 (Jose) | `{ userId, typ: 'kid-session' }` |
| `parent_access` | HttpOnly cookie | 15 minutes | HS256 | `{ userId, typ: 'parent-access' }` |
| `parent_refresh` | HttpOnly cookie | 30 days | HS256 | `{ userId, typ: 'parent-refresh' }` |

### Auth Flows

```
Kid Unlock:
  /kid-unlock → verifyKidPatternAction()
    → compareKidPattern(input, hash)
    → createKidSessionToken()
    → Set-Cookie: kid_session
    → redirect /dashboard

Parent Login:
  /parent/login → parentLoginAction()
    → rate-check (5/60s per IP via Upstash)
    → comparePassword(input, hash)
    → createParentAccessToken() + createParentRefreshToken()
    → Set-Cookie: parent_access + parent_refresh
    → redirect /parent/pin

Parent PIN:
  /parent/pin → verifyPinAction()
    → rate-check (5/60s per IP via Upstash)
    → comparePin(input, hash)
    → createParentAccessToken()
    → Set-Cookie: parent_access
    → redirect /parent

Session Refresh (Middleware):
  Request → middleware
    → verify parent_access → OK → pass through
    → verify parent_access → EXPIRED
      → verify parent_refresh → OK
        → createParentAccessToken()
        → Set-Cookie: parent_access (new)
        → pass through
      → verify parent_refresh → EXPIRED/INVALID
        → redirect /parent/login
```

### Lockout Logic

| Trigger | Max Attempts | Lockout Duration | Fields |
|---|---|---|---|
| Parent login | 5 | 60 s | `parentLoginAttempts`, `parentLoginLockedUntil` |
| Parent PIN | 5 | 60 s | `ParentPin.attempts`, `ParentPin.lockedUntil` |
| Kid pattern | 5 | 30 s | `kidPatternAttempts`, `kidPatternLockedUntil` |

---

## 6. Server Action Data Flow

### Typical Mutation Flow

```
Browser (Client Component)
  │  calls Server Action
  ▼
server/actions/*.actions.ts
  1. requireParentSession() — verifies JWT from cookie
  2. z.parse(input)          — Zod schema validation
  3. service.method(data)    — delegates to service
  │
  ▼
server/services/*.service.ts
  1. Business logic / validation
  2. Calls repository method(s)
  │
  ▼
server/repositories/*.repository.ts
  1. Prisma query (always includes WHERE userId)
  2. Returns typed result
  │
  ▼
Back up the stack → { success: true, data? } or { success: false, error: string }
  │
  ▼
Client Component re-renders / updates optimistic state
```

### Kid-Facing Read Flow (Server Component)

```
app/**/page.tsx (Server Component)
  │  calls Server Action directly (no auth guard needed — middleware already checked)
  ▼
server/actions/*.actions.ts
  1. Zod parse (optional for reads)
  2. service.get*(DEFAULT_USER_ID)
  │
  ▼
service → repository → Prisma → PostgreSQL
  │
  ▼
Typed data prop passed to Client Component
```

---

## 7. Security Model

### Implemented

| Control | Mechanism |
|---|---|
| Password storage | bcrypt, 12 rounds |
| PIN storage | bcrypt, 12 rounds |
| Kid pattern storage | bcrypt, 12 rounds |
| Session tokens | HS256 JWT, HttpOnly SameSite=lax cookies |
| Rate limiting | Upstash sliding window on all auth POSTs |
| Input validation | Zod on every server action input |
| Auth guard | `requireParentSession()` on all parent mutations |
| Refresh token rotation | New access token issued on each refresh |

### Gaps (P0/P1)

| Gap | Risk | Fix |
|---|---|---|
| `SESSION_SECRET` not set in `docker-compose.yml` | JWT forgeable in local dev | Set a real secret in compose env |
| No HTTP security headers | XSS, clickjacking exposure | Add CSP, X-Frame-Options, HSTS to `next.config.ts` |
| `updatePeriod`, `deletePeriod` lack userId filter | Horizontal privilege escalation possible | Add `WHERE userId = DEFAULT_USER_ID` to all mutations |
| No CSRF protection on Server Actions | Mitigated by SameSite=lax but not bulletproof | Consider explicit CSRF token for critical mutations |

---

## 8. Deployment Architecture

```
Dockerfile (standalone output)
  └─► Cloud Run or any Docker host

Environment variables required:
  DATABASE_URL           — Neon PostgreSQL connection string
  SESSION_SECRET         — ≥ 32 random bytes (hex or base64)
  UPSTASH_REDIS_REST_URL — Upstash rate limiting
  UPSTASH_REDIS_REST_TOKEN

docker-compose.yml (local dev):
  services:
    db:  postgres:16  (port 5432)
    app: next.js dev server (port 3000)
```

### PWA / Service Worker

- `public/manifest.json` — installable PWA manifest
- `public/sw.js` — service worker (caches static assets)
- Registered via `components/layout/ServiceWorkerRegistrar.tsx`
- `next.config.ts` sets `Service-Worker-Allowed: /` header

---

## 9. Integration Points

| Service | Library | Purpose | Status |
|---|---|---|---|
| PostgreSQL | `pg` + `@prisma/adapter-pg` | Primary data store | Active |
| Neon Serverless | `@neondatabase/serverless` | Serverless Postgres | Active |
| Upstash Redis | `@upstash/ratelimit` + `@upstash/redis` | Rate limiting | Active |
| Firebase | `firebase` + `firebase-admin` | TBD (notifications?) | Installed, not active |
| Jose | `jose` | JWT signing/verification | Active |

---

## 10. Scalability Notes

This application is intentionally **not** designed to scale beyond one household. The `DEFAULT_USER_ID` constant, single-seed approach, and localStorage-backed progress state are all intentional simplifications for a personal-use tool. Any future multi-household support would require:

1. Replace `DEFAULT_USER_ID` constant with session-derived user ID throughout all queries
2. Move `UserProgress` source of truth from localStorage to DB only
3. Add household-scoped access control to all repository queries
