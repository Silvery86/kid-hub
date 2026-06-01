# CLAUDE.md — Kid Hub

This file is loaded automatically by every Claude Code agent working in this repository.
Read it fully before starting any task.

---

## Project Overview

Kid Hub is a Next.js 16 (App Router) family dashboard for a single household:
one parent account (PIN-protected) and one kid profile. Stack:
React 19 · Tailwind CSS v4 · Prisma 7 · PostgreSQL · Server Actions · Playwright (planned).

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

---

## Architecture — Quick Reference

Full layering rules and anti-patterns: `docs/guides/team-workflow.md`
Stability risks and priority fix list: `docs/architecture/stability-plan.md`

| Layer | Directory | One-line rule |
|---|---|---|
| Repository | `server/repositories/` | Prisma only, no logic, userId in every mutation WHERE |
| Service | `server/services/` | `server-only`, pure functions, all business rules |
| Action | `server/actions/` | `requireParentSession` + Zod + orchestrate only |
| Lib | `lib/` | Pure utils, safe for client and server |
| Hook | `hooks/` | Client-only, calls actions, manages optimistic state |
| UI primitive | `components/ui/` | Reusable, no domain knowledge |
| Domain component | `components/<domain>/` | Presentational, uses hooks + primitives |
| Page | `app/<route-group>/<route>/page.tsx` | Server Component, fetches data, passes as props |
| Tokens | `app/globals.css` `@theme {}` | Only place for design tokens |
| Tests | `e2e/<domain>/` | Playwright, `data-testid` selectors, no sleep() |

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

1. `docker-compose.yml` line 31 — `SESSION_SECRET` not set; JWTs forgeable in dev
2. ~~`middleware.ts` silent secret fallback~~ — **FIXED** (2026-05-02, TASK-001)
3. No HTTP-layer rate limiting on `verifyPinAction` — lockout bypassable by concurrent requests

---

## Key Constants and Shared Utilities

| Need | Location |
|---|---|
| Auth guard (actions) | `server/lib/auth-guard.ts` → `requireParentSession()` |
| Badge calculation | `lib/grading.ts` → `calculateBadge()` |
| Schedule time parsing | `lib/schedule-utils.ts` → `parseTimeToMinutes()` |
| Academic year | `lib/constants.ts` → `CURRENT_ACADEMIC_YEAR` |
| Session duration | `server/services/auth.service.ts` → `SESSION_DURATION_SECONDS` |

---

## What NOT to do (enforced by code review)

- Copy-paste `requireParentSession` — import it from `server/lib/auth-guard.ts`
- Hard-code `'2025-2026'` or `'khoi'` — use constants
- Add tokens to `:root` — use `@theme {}` only
- Put business logic in an action — put it in the service
- Import from `server/` inside a hook or component — crashes the client bundle
- Use `bg-yellow-400` or any raw Tailwind palette value for semantic colours
- Call `sleep()` in a Playwright test — use `page.clock`
