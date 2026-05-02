# Kid Hub — Stability Plan

**Date:** 2026-05-02
**Auditor:** PM Agent
**Branch reviewed:** `main` @ `72ed588`

---

## 1. Architecture Overview

### Route Group Structure

```
app/
├── layout.tsx                  — Root layout: Nunito font, PWA metadata, ServiceWorkerRegistrar
├── page.tsx                    — Redirects "/" → "/dashboard"
├── (dashboard)/
│   ├── layout.tsx              — Sidebar + UserProgressProvider + ErrorBoundary
│   ├── template.tsx            — Fade-in animation on every navigation
│   ├── dashboard/page.tsx      — Server Component: fetches schedule, passes to DashboardView
│   ├── grades/page.tsx         — Server Component: fetches report card, renders inline
│   └── schedule/page.tsx       — Server Component: fetches schedule, passes to ScheduleGrid
├── (games)/
│   ├── layout.tsx              — Full-screen dark shell + ErrorBoundary
│   ├── math/page.tsx
│   └── english/page.tsx
└── (parent)/
    ├── layout.tsx              — Minimal shell; relies on middleware for auth (NO ErrorBoundary)
    ├── parent/page.tsx         — Server Component: parallel-fetches schedule + grades
    └── parent/pin/page.tsx     — Client Component ('use client')
```

**Layering:** `page.tsx (Server Component)` → `Server Action ('use server')` → `Service (pure functions)` → `Repository (Prisma)`. Well-structured.

---

## 2. Error Boundary Coverage

| Route Group | ErrorBoundary | Location |
|-------------|---------------|----------|
| `(dashboard)` | Yes | `app/(dashboard)/layout.tsx` line 13 |
| `(games)` | Yes | `app/(games)/layout.tsx` line 9 |
| `(parent)` | **No** | `app/(parent)/layout.tsx` line 8 — plain `<div>` |
| Root | No | `app/layout.tsx` |

**Issues:**

1. **`(parent)/layout.tsx` has no ErrorBoundary** — any render throw in `ScheduleManager` or `GradesManager` produces a white screen with no recovery.
2. **Zero `error.tsx` files exist** — Next.js route-level error boundaries are completely absent. A DB timeout in `dashboard/page.tsx` will crash the segment with no fallback UI.
3. **ErrorBoundary reset is optimistic** (`components/ui/ErrorBoundary.tsx` line 47) — `setState({ hasError: false })` without checking whether the root cause resolved. A persistent error causes an infinite re-throw loop from the user's perspective.
4. **No `not-found.tsx`** — missing pages get raw Next.js defaults.

---

## 3. Environment Variable Safety

| Variable | Runtime | Exposure |
|----------|---------|----------|
| `DATABASE_URL` | `lib/db.ts` line 20 | Server-only |
| `DIRECT_URL` | `prisma migrate` only | Build-time |
| `SESSION_SECRET` | `auth.service.ts` line 19, `middleware.ts` line 14 | Server + Edge |

There are **zero** `NEXT_PUBLIC_` variables. All secrets are server-side. Good.

**Issues:**

1. **Weak secret fallback in `middleware.ts` lines 14–17.** The `?? 'dev-secret-change-in-production...'` fallback is committed to source. Contrast with `auth.service.ts` lines 18–21, which correctly **throws** when the secret is missing — middleware must do the same.
2. **`SESSION_SECRET` is absent from `docker-compose.yml`** (line 31, still marked TODO). Every developer running `docker compose up` uses the known-public fallback secret — JWTs are forgeable.
3. **Firebase packages installed but never imported.** `package.json` lists `firebase@^12.12.0` and `firebase-admin@^13.8.0` as production dependencies. Zero imports in any `.ts`/`.tsx` file. These are dead weight (~6 MB transitive deps) and create a supply-chain attack surface.

---

## 4. Performance Bottlenecks

### N+1 / Extra Round-Trips
- `grades.actions.ts` lines 43–45: `getUserById(userId)` is called as a guard, then `gradesRepo.getReportCard(userId)`. Two sequential DB round-trips on every grades page load. The guard is redundant — `findMany` returns `[]` naturally when no grades exist.

### Missing Suspense Boundaries
**Zero `<Suspense>` wrappers and zero `loading.tsx` files exist.** Every async Server Component (`dashboard/page.tsx`, `grades/page.tsx`, `schedule/page.tsx`, `parent/page.tsx`) blocks the entire HTML stream until its DB query resolves. Users see a blank screen during load.

`app/(parent)/parent/page.tsx` lines 14–17 uses `Promise.all` which correctly parallelises both queries, but still blocks the full page render.

### Unnecessary Re-renders
`hooks/useSchedule.ts` line 50: `setInterval(() => setNow(new Date()), 30_000)` ticks every 30 seconds unconditionally, even when the tab is hidden. Each tick re-renders all consumers.

### Large Bundle Risk
- `firebase` and `firebase-admin` — unused but present in the production bundle.
- `bcryptjs` must never be imported from a client component; there is no `server-only` guard on `auth.service.ts`.

---

## 5. Auth Architecture Risks

### Dual-Auth Situation

Two separate auth stacks are present in `package.json`:

| Stack | Packages | Used? |
|-------|---------|-------|
| Firebase Auth | `firebase`, `firebase-admin` | **No — zero imports** |
| Custom JWT + bcrypt | `jose`, `bcryptjs` | **Yes — active system** |

The active auth system is coherent: PIN → bcrypt hash in `ParentPin` table → `HS256` JWT in `HttpOnly SameSite=lax` cookie → verified in Edge middleware. Firebase is dead scaffolding from a prior sprint.

**Auth-specific risks:**

1. **No HTTP-layer rate limiting.** `verifyPinAction` is a Server Action (POST endpoint) with no IP-based throttle. The in-DB lockout only fires after the PIN has been read from the DB — concurrent requests can bypass it.
2. **TOCTOU race in lockout.** `auth.actions.ts` lines 66–88: `getPin()` → `isLockedOut()` → `comparePin()` → `recordFailedPinAttempt()` are not wrapped in a DB transaction. Two simultaneous failed attempts at `attempts=4` can both read pre-lockout state and both increment without setting `lockedUntil`.
3. **`auth.service.ts` has no `server-only` guard.** Add `import 'server-only'` to get a build-time error if imported from a client component.
4. **`middleware.ts` silent secret fallback** (detailed in Section 3).

---

## 6. Database Safety

### PrismaClient Singleton
`lib/db.ts` correctly uses `globalThis` to cache the client in development. Production instances each get one client. Correct.

### Connection Pooling
`PrismaPg` is configured with only a `connectionString` (`lib/db.ts` line 22). The `pg` driver defaults to **10 connections per process** with no `max`, `idleTimeoutMillis`, or `connectionTimeoutMillis`. On Cloud Run with high concurrency this will cause contention. No external pooler (PgBouncer, Supavisor) is in the stack.

### Index Coverage

| Model | Query Pattern | Index |
|-------|--------------|-------|
| `ClassPeriod` | `WHERE userId, day` | `@@index([userId, day])` — present |
| `SubjectGrade` | `WHERE userId` | `@@index([userId])` — present |
| `ParentPin` | `WHERE userId` | `@unique` — present |
| `UserProgress` | `WHERE userId` | `@unique` — present |

Index coverage is adequate for current access patterns.

### Ownership Check Gap
`schedule.repository.ts` lines 93–108: `updatePeriod` and `deletePeriod` issue `WHERE id = ?` with no `userId` filter. The action layer verifies the session, but the DB layer has no ownership guard — a bug that matters if multi-user support is ever added.

---

## 7. Missing Safeguards

| Gap | Detail |
|-----|--------|
| No rate limiting | `verifyPinAction` exposed as POST with no IP-based throttle |
| No tests | Zero test files; no Vitest, Jest, or Playwright; no `test` script in `package.json` |
| No CI pipeline | `.github/` contains no Actions workflows for lint, typecheck, or build |
| No security headers | `next.config.ts` sets only `Service-Worker-Allowed`; no CSP, `X-Frame-Options`, `X-Content-Type-Options` |
| Game scores localStorage-only | `GameBestScore` table exists in the Prisma schema but is never written to from a Server Action. Scores are lost on browser storage clear. |

---

## 8. Priority Fixes — Ranked

### P0 — Fix Before Any Production Deploy

| # | Issue | File | Fix |
|---|-------|------|-----|
| 1 | `SESSION_SECRET` absent from docker-compose | `docker-compose.yml` line 31 | Add env var with a real random 32+ char string |
| 2 | `middleware.ts` falls back silently to public secret | `middleware.ts` lines 14–17 | Replace `?? fallback` with an explicit `throw`, matching `auth.service.ts` lines 18–21 |
| 3 | No rate limiting on PIN verification | `server/actions/auth.actions.ts` | Add IP-based rate limit (e.g. Upstash) in middleware for the action endpoint |

### P1 — Fix Within the Next Sprint

| # | Issue | File | Fix |
|---|-------|------|-----|
| 4 | No `error.tsx` files | All route groups | Add `app/(dashboard)/error.tsx`, `app/(games)/error.tsx`, `app/(parent)/error.tsx` |
| 5 | `(parent)/layout.tsx` has no ErrorBoundary | `app/(parent)/layout.tsx` line 8 | Wrap `{children}` in `<ErrorBoundary section="parent">` |
| 6 | `auth.service.ts` has no `server-only` guard | `server/services/auth.service.ts` line 1 | Add `import 'server-only'` |
| 7 | Dead Firebase packages | `package.json` | Run `pnpm remove firebase firebase-admin` |
| 8 | No CI pipeline | `.github/` | Add `.github/workflows/ci.yml` with lint, tsc, and build jobs |

### P2 — Improve Within Two Sprints

| # | Issue | File | Fix |
|---|-------|------|-----|
| 9 | No Suspense / `loading.tsx` | All async page routes | Add `loading.tsx` skeleton files; wrap slow fetches in `<Suspense>` |
| 10 | Extra round-trip in `getReportCardAction` | `grades.actions.ts` lines 43–44 | Remove `getUserById` guard |
| 11 | Game scores localStorage-only | `MathGame.tsx` line 35, `EnglishGame.tsx` | Add Server Action writing to `GameBestScore` table |
| 12 | No ownership guard on period mutations | `schedule.repository.ts` lines 93–108 | Add `userId` to `WHERE` clause |
| 13 | No security headers | `next.config.ts` | Add CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` |
| 14 | No tests | Project-wide | Add Vitest for service pure functions; Playwright for PIN auth and game flows |
| 15 | `pg` pool size unconfigured | `lib/db.ts` line 22 | Pass `{ max: 5 }` to `PrismaPg` constructor |

### P3 — Housekeeping

| # | Issue | Fix |
|---|-------|-----|
| 16 | ErrorBoundary reset is optimistic | Add exponential back-off or route navigation on reset |
| 17 | `useSchedule` polls when tab is hidden | Gate `setInterval` on `document.visibilityState` |
| 18 | No `not-found.tsx` | Add a Vietnamese-language 404 page |

---

## Summary

The architecture is solid for a single-user family app: clean server/client layering, correct singleton DB client, Zod validation on all mutations, and properly scoped `HttpOnly` JWT cookies. The **three critical items** before any external-facing deploy are:

1. Missing `SESSION_SECRET` in Docker Compose — JWTs are currently forgeable in the dev environment.
2. Silent secret fallback in `middleware.ts` — the production gate can be bypassed.
3. No HTTP-layer rate limiting on PIN verification — the lockout mechanism has a race condition and can be bypassed by concurrent requests.

Everything else is resilience and quality-of-life hardening.
