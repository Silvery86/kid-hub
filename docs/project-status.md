# Project Status — Kid Hub

**Last updated:** 2026-06-21
**Version:** 0.1.0
**Branch:** main @ `be0c229`

> **Reconciled against source** during the v1 production-readiness audit
> (`docs/report/project-review-v1.md`). Several items previously listed here as open
> P0/P1 blockers are now **fixed in code** and have been re-classified below.

---

## Deployment Status

| Environment | Status | Notes |
|---|---|---|
| Local dev | ✅ Running | `npm run dev` + Docker PostgreSQL |
| Staging | ❌ Not configured | No staging environment exists (Vercel + Neon strategy drafted) |
| Production | ❌ Not deployed | No production environment exists |
| CI/CD | ❌ Not configured | No workflow in `.github/` (PR #1 attempt not merged to tree) |

---

## Code Health

| Metric | Status | Detail |
|---|---|---|
| TypeScript compilation | ✅ Clean | Strict mode, zero errors |
| ESLint | ✅ Passing | No reported lint errors |
| Prettier formatting | ✅ Consistent | Tailwind CSS plugin active |
| Test suite | ⚠️ Thin | 3 Playwright specs (`auth`, `games`, `responsive`); **0 unit tests** |
| Build | ✅ Builds | Standalone output verified |
| Database migrations | ✅ Current | 7 migrations applied, no pending |
| Prisma schema sync | ✅ In sync | `prisma migrate status` clean (14 models) |

---

## Security Status

| Control | Status | Notes |
|---|---|---|
| Password hashing (bcrypt 12) | ✅ Active | `parentPasswordHash` |
| PIN hashing (bcrypt 12) | ✅ Active | `ParentPin.hash` |
| Kid pattern hashing (bcrypt 12) | ✅ Active | `kidPatternHash` |
| JWT sessions (HttpOnly cookies) | ✅ Active | HS256, SameSite=lax |
| Parent access token refresh | ✅ Active | Auto-refresh in middleware |
| HTTP-layer rate limiting (Upstash) | ✅ **FIXED** | `middleware.ts` — 10 attempts / 60 s on login + PIN POSTs, returns `429` |
| Zod input validation | ✅ Active | All write actions |
| `SESSION_SECRET` enforcement | ✅ **FIXED** | `middleware.ts` `getSecret()` **throws** if absent/`<32` chars; loaded via `env_file` in compose |
| Security headers (X-Frame, nosniff, Referrer, Permissions) | ✅ **FIXED** | Set in `next.config.ts` |
| Security headers (CSP, HSTS) | ❌ Missing | **P1** — content/transport hardening still absent |
| Ownership guards on mutations | ✅ **FIXED** | `updatePeriod`/`deletePeriod` now carry `userId` in `WHERE` |
| `server-only` guard on services | ⚠️ Partial | Missing the `import 'server-only'` package in auth/schedule/grades services |
| PIN lockout atomicity | ⚠️ Race | TOCTOU window remains (no `$transaction`); mitigated by IP rate limit |
| CSRF protection | ⚠️ Partial | SameSite=lax provides some coverage |

---

## Recently Fixed (verified in audit v1, 2026-06-21)

| ID | Description | Evidence |
|---|---|---|
| ~~BUG-001~~ | `SESSION_SECRET` now enforced (throws) + loaded via `env_file` | `middleware.ts` 41–47, `docker-compose.yml` |
| ~~BUG-004~~ | `loading.tsx` present for dashboard, schedule, homework, grades | `app/(dashboard)/*/loading.tsx` |
| ~~BUG-005~~ | `error.tsx` present for all three route groups | `app/(dashboard|games|parent)/error.tsx` |
| ~~BUG-008~~ | Security headers set (X-Frame, nosniff, Referrer, Permissions) | `next.config.ts` |
| ~~BUG-009~~ | Ownership guard added to `updatePeriod`/`deletePeriod` | `schedule.repository.ts` 142, 156 |

## Known Bugs (still open)

### P0 — Blocking (must fix before real users)

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-002 | Homework reward loop split: `toggleHomeworkDoneAction` does not award points | `server/actions/schedule.actions.ts` | Points inconsistently awarded for homework |
| BUG-003 | No CI pipeline in tree — broken code can merge to main | `.github/` | Production stability risk |

### P1 — High Priority

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-006 | `UserProgress` source-of-truth is localStorage (not DB) | `hooks/useUserProgress.ts` | Progress resets on storage clear |
| BUG-007 | Badge triggers not fully wired (`game-win`, `streak-7`, `all-green`) | `server/actions/rewards.actions.ts` | Several badges never earned |
| BUG-014 | No CSP / HSTS headers | `next.config.ts` | Content-injection / transport hardening gap |
| BUG-015 | No structured logging or error tracking | project-wide | Cannot operate/diagnose in production |

### P2 — Medium Priority

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-010 | `useSchedule` polls but has no stale-state indicator | `hooks/useSchedule.ts` | Silently shows outdated schedule |
| BUG-016 | Unbounded `pg` connection pool (no `max`/timeouts) | `lib/db.ts` | Connection exhaustion risk on serverless |
| BUG-017 | TOCTOU race in PIN lockout (no `$transaction`) | `server/actions/auth.actions.ts` | Lockout bypassable by concurrent in-DB attempts |
| BUG-011 | Kid unlock has no distinct lockout timer UI | `app/kid-unlock/page.tsx` | Confusing "error" message during lockout |
| BUG-012 | No back-to-hub button during game sessions | `components/games/GameHud.tsx` | Child trapped until game ends |
| BUG-013 | `KidAccessSettings` typed as `Record<string, boolean>` | Multiple files | No compile-time safety on toggle keys |

---

## Technical Debt

| ID | Debt | Priority |
|---|---|---|
| TD-001 | Dual homework completion flows (`toggleHomeworkDoneAction` vs `markHomeworkDoneAction`) | P0 |
| TD-002 | No CI pipeline | P0 |
| TD-003 | `UserProgress` split between localStorage and DB | P1 |
| TD-004 | Inline Zod schemas in action files (should be in `server/lib/schemas.ts`) | P2 |
| TD-005 | Firebase dependency installed but not used | P2 |
| TD-006 | `input: unknown` pattern in some actions instead of typed input | P2 |

---

## P0 Blockers (Do Not Deploy Until Resolved)

The original three app-layer blockers are now **resolved**. The remaining blockers are operational:

1. ~~`SESSION_SECRET` not set in compose~~ — **FIXED** (enforced via throw + `env_file`)
2. ~~`middleware.ts` silent secret fallback~~ — **FIXED** (2026-05-02)
3. ~~No HTTP-layer rate limiting on PIN verification~~ — **FIXED** (Upstash 10/60 s in middleware)

**New operational blockers (from audit v1):**

1. **No CI pipeline** in the tree — broken code can reach `main`.
2. **No deployed environment** — staging/production do not exist.
3. **No observability** — no structured logging, error tracking, or health check.

> Note: `CLAUDE.md` "Current P0 Blockers" and `stability-plan.md` still list the resolved items
> and should be reconciled during the implementation phase.

---

## Migration History

| Migration | Date | Change |
|---|---|---|
| `20260421145455_init` | 2026-04-21 | Initial schema: User, ClassPeriod, SubjectGrade, UserProgress |
| `20260504155026_add_homework_feature` | 2026-05-04 | DailyHomework, HomeworkCompletion tables |
| `20260505142624_math_module` | 2026-05-05 | MathProgress, EnglishProgress, GameBestScore, EarnedBadge |
| `20260527000000_sync_schema` | 2026-05-27 | Schema sync, ExtraClassOverride, ActivityEvent, ScreenTimeLog |
| `20260528090000_parent_login_kid_unlock` | 2026-05-28 | ParentPin, parent auth fields, kid pattern fields |
| `20260530131215_add_kid_access_settings` | 2026-05-30 | `User.kidAccessSettings` JSON field |
| `20260531020415_add_screen_time_and_activity` | 2026-05-31 | `ScreenTimeLog`, `ActivityEvent` tables |

---

## Recently Completed

| Date | Change |
|---|---|
| 2026-06-21 | Production-readiness audit v1 (`docs/report/project-review-v1.md`); status docs reconciled |
| 2026-06-XX | Security hardening: secret enforcement, HTTP rate limiting, headers, ownership guards, `error.tsx`/`loading.tsx` |
| 2026-05-31 | Schedule manager refinements and parent dashboard updates |
| 2026-05-28 | Parent login + kid unlock authentication system |
| 2026-05-27 | Schema sync, activity events, screen time |
| 2026-05-05 | Math + English game modules |
| 2026-05-04 | Homework feature |
| 2026-04-21 | Initial project setup |
