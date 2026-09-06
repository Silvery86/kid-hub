# CLAUDE.md — Kid Hub

This file is loaded automatically by every Claude Code agent working in this repository.
Read it fully before starting any task.

---

## Project Overview

Kid Hub is a Next.js 16 (App Router) family dashboard for **many households**.
Parents sign up openly and an admin approves them; each parent manages one or
more students, and a student can be shared with a second parent by invite. Stack:
React 19 · Tailwind CSS v4 · Prisma 7 · PostgreSQL · Server Actions · Playwright.

**The two questions, kept apart.** Nearly every auth bug in this codebase came
from conflating them:

1. *Who is calling?* → `parentId` (or `studentId` for a kid session), from the JWT.
2. *May they touch this student?* → a `parent_students` row, from the database.

A token never answers the second question. Parent mode additionally requires a
PIN proof for the visit (`parent_pin`), which the middleware drops the moment the
browser touches a kid route.

Route groups: `(dashboard)` (kid view), `(games)` (math + English), `(parent)` (parent management).

---

## Efficiency Protocol

These rules apply to every agent on every task. They exist to minimise token usage and prevent
speculative changes that break the codebase.

### 1. No blind reads
Before reading any file, state in one sentence what specific information you are looking for.
Never open a file "to see what's there."

### 2. Read targeted ranges
When you know the relevant section, pass `offset` and `limit` to read only those lines.
Full-file reads are only justified when the task requires understanding the whole file.

### 3. Directory size warning
Before listing or reading a directory, check its size.
If a directory contains more than 50 files and you have no filter, stop and narrow your query.
Use the `efficiency` skill (`/efficiency`) to surface this warning automatically.

### 4. Three-sentence summaries
After completing a read or investigation phase, summarise findings in ≤ 3 sentences before
writing any code. This creates a checkpoint for PM approval.

### 5. Draft First for multi-file changes
Any change touching ≥ 2 files requires a 2-sentence draft (what changes, why) submitted for
PM approval before any file is edited. Single-file fixes may proceed directly.

### 6. Targeted edits only
Use `Edit` (string replacement) rather than `Write` (full file overwrite) unless you are
creating a new file or performing a complete rewrite that was explicitly requested.

### 7. No speculative improvements
Fix exactly what the assigned task specifies. Do not refactor adjacent code, add comments,
or improve naming unless that is the task. Out-of-scope observations belong in a new issue.

### 8. Never commit without explicit PM approval
Do not run `git commit` (or `git push`) after any change — not even a one-liner fix.
Stop after editing files, report what changed, and wait for the PM to say "commit" or
"commit to git" before creating the commit. This rule overrides all other defaults.

### 9. Conventional Commits format (enforced)
Every commit message must follow: `<type>(<scope>): <subject>`

Allowed types: `feat` · `fix` · `docs` · `style` · `refactor` · `perf` · `test` · `chore`

Rules:
- Lowercase type and subject
- Subject in imperative mood — "add feature", not "added" or "adds"
- No period at the end of the subject
- Always include a scope — e.g. `feat(homework): ...`, `fix(ci): ...`, `chore(deps): ...`
- Breaking changes: append `!` after type/scope or add `BREAKING CHANGE:` footer
- Never add a `Co-Authored-By:` trailer or any AI signature to commit messages

---

## Architecture — Quick Reference

> **Monorepo layout (since 2026-06-29, Phase 3):** the Next.js app now lives under
> `apps/web/`. All directory paths in the table below are **relative to `apps/web/`**
> (e.g. `server/services/` → `apps/web/server/services/`). Cross-platform contract
> types/schemas/tokens live in `packages/shared/` (`@kid-hub/shared`). Run scripts
> from the repo root via turbo (`pnpm dev|build|type-check|test`) or per-app with
> `pnpm -C apps/web <script>`. The repo root holds only `package.json`, `turbo.json`,
> `pnpm-workspace.yaml`, and shared meta (`CLAUDE.md`, `agents/`, `docs/`).

Full layering rules and anti-patterns: `docs/guides/team-workflow.md`
Stability risks and priority fix list: `docs/architecture/stability-plan.md`

| Layer | Directory | One-line rule |
|---|---|---|
| Repository | `server/repositories/` | Prisma only, no logic, **studentId or parentId in every mutation WHERE** |
| Service | `server/services/` | `server-only`, pure functions, all business rules |
| Action | `server/actions/` | a guard + Zod + orchestrate only — never a hard-coded id |
| Lib | `lib/` | Pure utils, safe for client and server |
| Hook | `hooks/` | Client-only, calls actions, manages optimistic state |
| UI primitive | `components/ui/` | Reusable, no domain knowledge |
| Domain component | `components/<domain>/` | Presentational, uses hooks + primitives |
| Page | `app/<route-group>/<route>/page.tsx` | Server Component, fetches data, passes as props |
| Tokens | `app/globals.css` `@theme {}` | Only place for design tokens |
| Tests | `e2e/<domain>/` | Playwright, `data-testid` selectors, no sleep() |
| Unit tests | `**/*.test.ts` | vitest (`pnpm -C apps/web test`); route coverage is enforced |

---

## Agent Role Files

Each role has a dedicated instruction file in `agents/`:

| Role | File | Primary responsibility |
|---|---|---|
| PM | `agents/pm.md` | Specs, acceptance criteria, stability gating |
| Lead Dev | `agents/dev.md` | Service/repo/action implementation, layering |
| Designer | `agents/designer.md` | Tailwind tokens, component inventory |
| QA | `agents/qa.md` | Playwright specs, regression gating |

When acting as a specific role, read your role file before starting any task.

---

## Current P0 Blockers (do not deploy until resolved)

1. ~~`docker-compose.yml` line 31 — `SESSION_SECRET` not set; JWTs forgeable in dev~~ — **FIXED / stale** (2026-08-04, B1). The compose file moved to `apps/web/docker-compose.yml` in the Phase 3 monorepo migration; it now loads `SESSION_SECRET` (and the other secrets) via `env_file: .env.local` (line 29–30) rather than leaving it unset. `SESSION_SECRET` is present (≥ 32 chars) in the untracked `.env`/`.env.local`, injected in CI from GitHub secrets (`ci.yml`), and set on the production target (Vercel — see `docs/deployment-setup.md §2.3`). JWT forgery was already precluded by item 2: `getSecret()` throws when `SESSION_SECRET` is missing or < 32 chars, so there is no silent fallback.
2. ~~`middleware.ts` silent secret fallback~~ — **FIXED** (2026-05-02, TASK-001)
3. ~~No HTTP-layer rate limiting on `verifyPinAction`~~ — **FIXED** (2026-07-05, Phase 5 §15). Web PIN/login Server Action POSTs are limited in `middleware.ts` (`getPinRateLimiter`, 10/60 s); the mobile REST path `/api/v1/auth/login` (outside the middleware matcher) is limited by `getLoginRateLimiter` (5/60 s) in `lib/rate-limit.ts`.
4. ~~Eight kid-data REST routes with no authentication of any kind~~ — **FIXED** (2026-09-04, MULTI_AUTH phase 3). `math`, `english`, `progress`, `kid-profile`, `homework/today`, `homework/[id]/done`, `schedule` and `schedule/week` now sit under `/api/v1/students/[studentId]/` behind `guardStudentApp`. `app/api/v1/route-coverage.test.ts` fails the build on any handler that loses its guard, so this cannot recur through review alone.
5. ~~The parent PIN was a client-side redirect, not a gate~~ — **FIXED** (2026-09-04). `parent_refresh` survived clearing the access cookie and middleware minted a new one, so `/parent` was reachable without the PIN. Entering it now mints a `parent-pin` token that middleware requires and drops on any kid route.
6. ~~A kid session outlived the parent session that authorised it~~ — **FIXED** (2026-09-04). Signing out left `kid_session` valid for 12 hours; both sign-out and every kid route now end it.

### Known gaps (not blockers)

- The browser E2E specs cannot run on WSL until `libnss3 libnspr4 libasound2t64`
  are installed; `pnpm -C apps/web test:e2e` currently exercises the API only.
- No email is sent on signup, approval or rejection — the admin checks
  `/parent/admin/approvals`, the applicant retries login.

---

## Key Constants and Shared Utilities

| Need | Location |
|---|---|
| Who is calling (cookies) | `server/lib/auth-guard.ts` → `requireParentSession()` |
| May they touch this student | `server/lib/auth-guard.ts` → `requireStudentAccess()` |
| Which student is this request about | `server/lib/auth-guard.ts` → `resolveStudentContext()` |
| Admin surface | `server/lib/auth-guard.ts` → `requireAdminSession()` |
| Same, for REST handlers | `app/api/v1/_lib/guard.ts` → `guardStudent()` / `guardStudentApp()` |
| Badge calculation | `lib/grading.ts` → `calculateBadge()` |
| Schedule time parsing | `lib/schedule-utils.ts` → `parseTimeToMinutes()` |
| Academic year | `lib/constants.ts` → `CURRENT_ACADEMIC_YEAR` |
| Session duration | `server/services/auth.service.ts` → `SESSION_DURATION_SECONDS` |

---

## What NOT to do (enforced by code review)

- Copy-paste `requireParentSession` — import it from `server/lib/auth-guard.ts`
- Hard-code `'2025-2026'` or a student/parent id — resolve it from the session.
  `DEFAULT_USER_ID` and `DEFAULT_PARENT_ID` are gone; do not reintroduce them
- Add a route under `app/api/v1/students/`, `admin/`, `parents/` or `invites/`
  without a guard — `route-coverage.test.ts` fails the build, per handler
- Put a student id in a JWT claim — the join table is the only authority
- Name a contract field `userId` when it means a student
- Add tokens to `:root` — use `@theme {}` only
- Put business logic in an action — put it in the service
- Import from `server/` inside a hook or component — crashes the client bundle
- Use `bg-yellow-400` or any raw Tailwind palette value for semantic colours
- Call `sleep()` in a Playwright test — use `page.clock`
