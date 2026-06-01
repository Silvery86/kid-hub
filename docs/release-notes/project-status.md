# Kid Hub — Project Status

> Generated: 2026-05-03 · Branch: main · Last commit: `e38ff86`

---

## Completed P0 Security Tasks

All three P0 blockers from `docs/architecture/stability-plan.md` are now resolved.

### P0-1 — Docker `SESSION_SECRET` not Set

**Status:** RESOLVED

**Problem:** `docker-compose.yml` had no `SESSION_SECRET`, meaning the Edge middleware would throw on startup and the app would be non-functional in Docker.

**Fix:** `SESSION_SECRET` is now hardcoded into the `environment:` block of the `app` service in `docker-compose.yml`. The `environment:` block takes precedence over `env_file:`, so this value is authoritative regardless of `.env.local` contents.

**File changed:** `docker-compose.yml` (line 33)

---

### P0-2 — Middleware Silent `SESSION_SECRET` Fallback

**Status:** RESOLVED (TASK-001, 2026-05-02)

**Problem:** `middleware.ts` previously used a known-public default secret (`'dev-secret-…'`) when `SESSION_SECRET` was absent. Any attacker who knew this fallback could forge valid JWTs.

**Fix:** Replaced the fallback with an explicit `throw`:

```typescript
const getSecret = (): Uint8Array => {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be set and at least 32 characters long.')
  }
  return new TextEncoder().encode(secret)
}
```

**File changed:** `middleware.ts` (lines 16–22)

---

### P0-3 — No HTTP-Layer Rate Limiting on `verifyPinAction`

**Status:** RESOLVED (2026-05-03)

**Problem:** PIN brute-force attacks could bypass in-database lockout (`ParentPin.lockedUntil`) by sending concurrent requests — multiple requests could read `lockedUntil = null` simultaneously before any write updated it.

**Fix:** Upstash Redis sliding-window rate limiter added at the Edge middleware layer, which executes before any Server Action or database read:

- **Package:** `@upstash/ratelimit ^2.0.8` + `@upstash/redis ^1.37.0`
- **Config:** 10 requests per IP per 60-second sliding window (`kid-hub:pin` prefix key)
- **Graceful degradation:** Returns `null` when `UPSTASH_REDIS_REST_URL`/`TOKEN` are absent; dev environments without credentials continue to work normally
- **Response:** 429 with `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` headers

**Files added/changed:** `lib/rate-limit.ts` (new), `middleware.ts` (rate-limit block added), `docker-compose.yml` (`env_file` added to load Upstash credentials from `.env.local`)

**To activate in Docker:** `docker compose down && docker compose up --build`

---

### Pre-push Security Shield

**Status:** RESOLVED (2026-05-03)

**Problem:** No automated check prevented accidental secret commits.

**Fix:** `scripts/git-hooks/pre-push.sh` — scans only `+` diff lines against 9 regex patterns:

| Pattern | Targets |
|---|---|
| `-----BEGIN (RSA\|EC\|DSA\|OPENSSH) PRIVATE KEY` | Private keys |
| `(AKIA\|ASIA\|AIPA)[0-9A-Z]{16}` | AWS access key IDs |
| `ghp_[0-9A-Za-z]{36}` | GitHub personal access tokens |
| `xoxb-[0-9]+-[0-9A-Za-z]+` | Slack bot tokens |
| `UPSTASH_REDIS_REST_(URL\|TOKEN)\s*=\s*\S+` | Upstash Redis credentials |
| `SESSION_SECRET\s*=\s*\S+` | JWT signing secrets |
| `DATABASE_URL\s*=.*@` | Postgres connection strings with credentials |
| `password\s*[:=]\s*["'][^"']{8,}["']` | Hardcoded passwords in config |
| `[0-9a-zA-Z/+]{40,}` (context: `secret/key/token`) | Long Base64 strings in secret context |

**Install:**

```bash
chmod +x scripts/git-hooks/pre-push.sh
ln -sf ../../scripts/git-hooks/pre-push.sh .git/hooks/pre-push
```

**Test the scanner in isolation:**

```bash
git diff HEAD~1 HEAD | bash scripts/git-hooks/pre-push.sh --test
```

---

## Bug Audit — Edge Runtime Compatibility

**Scope:** All files imported (directly or transitively) by `middleware.ts`, which runs on the Edge runtime. The Edge runtime does not support Node.js-specific APIs (`fs`, `crypto`, `net`, `http`, `child_process`, etc.).

### Findings

| File | Status | Detail |
|---|---|---|
| `middleware.ts` | Safe | Uses only `jose`, `@upstash/ratelimit` — both Edge-compatible |
| `lib/rate-limit.ts` | Safe | `@upstash/redis` uses `fetch()` internally — Edge-compatible |
| `server/services/auth.service.ts` | Safe | Uses `jose` + `bcryptjs` (pure JS, no Node crypto) |
| `lib/db.ts` (Prisma) | Isolated | Not imported by middleware — only used in server actions/repos |
| `server/repositories/*.ts` | Isolated | Not imported by middleware |

**Conclusion:** No Edge runtime compatibility issues exist in the current middleware import chain.

---

## Bug Audit — Schedule Race Conditions

**Analysis date:** 2026-05-03

### Finding 1 — `validatePeriodOverlap()` Not Called in Actions (MEDIUM)

- **Location:** `server/services/schedule.service.ts`
- **Problem:** `validatePeriodOverlap()` exists in the service but is not wired into any action handler. Two periods on the same day with overlapping time ranges can be created concurrently.
- **Severity:** Medium — requires intentional concurrent editing to trigger; single-user flow is safe.

**Fix Strategy (PM):**

1. In `server/actions/schedule.actions.ts`, call `validatePeriodOverlap()` from the service before `createPeriod()` and `updatePeriod()` calls.
2. Surface the overlap error to the UI as a form validation message (not a 500).
3. No database schema change required.
4. Estimated effort: 1–2 hours (Lead Dev).

---

### Finding 2 — Concurrent `updatePeriod()` Without Transaction (LOW)

- **Location:** `server/repositories/schedule.repository.ts`
- **Problem:** `updatePeriod()` calls `db.classPeriod.update()` without a transaction. If two requests update the same period concurrently, the last write wins and silently discards the earlier one.
- **Severity:** Low — single-user app; concurrent writes require two browser tabs editing the same row simultaneously.
- **No immediate fix required.** Track as tech debt.

---

## Pre-existing TypeScript Errors

These errors existed before 2026-05-03. None are in files touched by the P0 sprint.

| File | Error | Root Cause |
|---|---|---|
| `app/(parent)/parent/pin/page.tsx` | `disabled` prop not found on `PinKeypad` | Component accepts `isDisabled`, caller uses `disabled` |
| `server/actions/auth.actions.ts` | `.errors` does not exist on `ZodError` | Zod v4 breaking change: `.errors` → `.issues` |
| `server/actions/grades.actions.ts` | `GradeRecord[]` not assignable to `SubjectGrade[]` | `semester: number` vs `semester: 1 \| 2` literal type |
| `prisma/prisma.config.ts` | `directUrl` not in Prisma config type | Prisma 7 removed `directUrl` from config object |

**Fix priority:** P1 — block the next sprint's QA sign-off. Estimated: 1 hour total.

**Fix for Zod v4 migration** (affects all action files using `ZodError`):

```typescript
// Before (Zod v3)
error.errors[0].message
// After (Zod v4)
error.issues[0].message
```

---

## Remaining P1 Items (from `stability-plan.md`)

| # | Item | Owner | Effort |
|---|---|---|---|
| P1-1 | Add `error.tsx` to each route group layout | Lead Dev | 1 h |
| P1-2 | Add `ErrorBoundary` to `app/(parent)/layout.tsx` | Lead Dev | 30 min |
| P1-3 | Add `import 'server-only'` to `server/services/auth.service.ts` | Lead Dev | 5 min |
| P1-4 | Remove dead Firebase packages: `npm remove firebase firebase-admin` | Lead Dev | 15 min |
| P1-5 | Fix pre-existing TypeScript errors (table above) | Lead Dev | 1 h |
| P1-6 | Add CI pipeline: `.github/workflows/ci.yml` | QA | 2 h |

---

## Remaining P2 Items

| # | Item | Owner |
|---|---|---|
| P2-1 | `loading.tsx` skeleton files for each route | Designer |
| P2-2 | Game scores Server Action (currently client-only) | Lead Dev |
| P2-3 | Ownership guard on `schedule.repository.ts` mutations | Lead Dev |
| P2-4 | Security headers in `next.config.ts` (CSP, HSTS, X-Frame-Options) | Lead Dev |
| P2-5 | Postgres connection pool size config in `lib/db.ts` | Lead Dev |

---

## Playwright Test Status

| Test Suite | File | Status |
|---|---|---|
| Middleware — valid JWT grants access | `e2e/auth/middleware.spec.ts:TC-MW-SECRET-01` | Written, not yet run against live server |
| Middleware — tampered JWT redirects | `e2e/auth/middleware.spec.ts:TC-MW-SECRET-02` | Written, not yet run |
| Middleware — no cookie redirects | `e2e/auth/middleware.spec.ts:TC-MW-SECRET-03` | Written, not yet run |

**To run:**

```bash
# Start the dev server first (or let Playwright start it)
npm run test
# Or with UI mode:
npm run test:ui
```
