# Project Status — Kid Hub

**Last updated:** 2026-06-01
**Version:** 0.1.0
**Branch:** main

---

## Deployment Status

| Environment | Status | Notes |
|---|---|---|
| Local dev | ✅ Running | `npm run dev` + Docker PostgreSQL |
| Staging | ❌ Not configured | No staging environment exists |
| Production | ❌ Not deployed | No production environment exists |
| CI/CD | ❌ Not configured | No GitHub Actions or equivalent |

---

## Code Health

| Metric | Status | Detail |
|---|---|---|
| TypeScript compilation | ✅ Clean | Strict mode, zero errors |
| ESLint | ✅ Passing | No reported lint errors |
| Prettier formatting | ✅ Consistent | Tailwind CSS plugin active |
| Test suite | ❌ No tests | Playwright installed but 0 test files |
| Build | ✅ Builds | Standalone output verified |
| Database migrations | ✅ Current | 5 migrations applied, no pending |
| Prisma schema sync | ✅ In sync | `prisma migrate status` clean |

---

## Security Status

| Control | Status | Notes |
|---|---|---|
| Password hashing (bcrypt 12) | ✅ Active | `parentPasswordHash` |
| PIN hashing (bcrypt 12) | ✅ Active | `ParentPin.hash` |
| Kid pattern hashing (bcrypt 12) | ✅ Active | `kidPatternHash` |
| JWT sessions (HttpOnly cookies) | ✅ Active | HS256, SameSite=lax |
| Parent access token refresh | ✅ Active | Auto-refresh in middleware |
| Rate limiting (Upstash) | ✅ Active | 5 attempts / 60 s on auth |
| Zod input validation | ✅ Active | All write actions |
| `SESSION_SECRET` in docker-compose | ❌ Missing | **P0** — JWTs forgeable in dev |
| Security headers (CSP, HSTS, etc.) | ❌ Missing | **P1** — Not configured |
| Ownership guards on all mutations | ⚠️ Partial | `updatePeriod`, `deletePeriod` need audit |
| CSRF protection | ⚠️ Partial | SameSite=lax provides some coverage |

---

## Known Bugs

### P0 — Blocking (must fix before real users)

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-001 | `SESSION_SECRET` not set in `docker-compose.yml` (line 31) | `docker-compose.yml` | JWTs use no secret in dev — forgeable |
| BUG-002 | Homework reward loop split: `toggleHomeworkDoneAction` does not award points | `server/actions/schedule.actions.ts` | Points inconsistently awarded for homework |
| BUG-003 | No CI pipeline — broken code can merge to main | Root | Production stability risk |

### P1 — High Priority

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-004 | No `loading.tsx` for dashboard, grades, homework routes | `app/(dashboard)/` | Blank screen on slow connections |
| BUG-005 | No `error.tsx` for any route group | `app/*/` | DB errors show white screen |
| BUG-006 | `UserProgress` source-of-truth is localStorage (not DB) | `hooks/useUserProgress.ts` | Progress resets on storage clear |
| BUG-007 | Badge triggers not fully wired (`game-win`, `streak-7`, `all-green`) | `server/actions/rewards.actions.ts` | Several badges never earned |
| BUG-008 | No security headers (CSP, X-Frame-Options, HSTS) | `next.config.ts` | XSS / clickjacking exposure |

### P2 — Medium Priority

| ID | Description | File | Impact |
|---|---|---|---|
| BUG-009 | `updatePeriod`/`deletePeriod` may lack userId WHERE clause | `server/repositories/schedule.repository.ts` | Privilege escalation if user IDs diverge |
| BUG-010 | `useSchedule` polls but has no stale-state indicator | `hooks/useSchedule.ts` | Silently shows outdated schedule |
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

1. `docker-compose.yml` line 31 — `SESSION_SECRET` not set; JWTs forgeable in dev
2. ~~`middleware.ts` silent secret fallback~~ — **FIXED** (2026-05-02)
3. No HTTP-layer rate limiting on `verifyPinAction` — lockout bypassable by concurrent requests

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

---

## Recently Completed

| Date | Change |
|---|---|
| 2026-05-31 | Schedule manager refinements and parent dashboard updates |
| 2026-05-28 | Parent login + kid unlock authentication system |
| 2026-05-27 | Schema sync, activity events, screen time |
| 2026-05-05 | Math + English game modules |
| 2026-05-04 | Homework feature |
| 2026-04-21 | Initial project setup |
