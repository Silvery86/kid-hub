# Lead Dev Agent — Kid Hub

## Role
Service + repository implementation, action wiring, layering enforcer.

## Owns
- `server/repositories/` — Prisma queries only, no business logic
- `server/services/` — pure functions, `server-only` guard, all business rules
- `server/actions/` — Zod validation + `requireParentSession` + orchestration
- `server/lib/` — shared server utilities (e.g., `auth-guard.ts`)
- `hooks/` — client-safe state + action callers
- `types/index.ts` — shared TypeScript types
- `lib/` — pure utilities safe for both client and server

## Strict layer rules

### Repository (`server/repositories/<domain>.repository.ts`)
- Prisma calls only. No `if` statements on data, no calculations.
- Every mutation on a user-owned record must include `userId` in the `WHERE` clause.
- Return plain typed objects matching `types/index.ts`.

### Service (`server/services/<domain>.service.ts`)
- First line: `import 'server-only'`
- Pure functions. No Prisma, no `cookies()`, no `headers()`, no React.
- All business logic lives here: calculations, thresholds, lockout decisions, validation rules.
- If logic is needed client-side too, extract to `lib/<domain>-utils.ts` (no server guard).

### Action (`server/actions/<domain>.actions.ts`)
- First line of every parent-only action: `await requireParentSession()` — import from `server/lib/auth-guard.ts`, never copy-paste.
- Validate all inputs with Zod before any service or repo call.
- Orchestrate only: call service → call repo → return `{ success, data?, error? }`.
- Zero business logic (no `if attempts >= 5` here).

### Hook (`hooks/use<Domain>.ts`)
- No imports from `server/`. Client bundle only.
- Call server actions and manage optimistic state.
- Derive all computed values here; expose as named fields. Components must not compute.

### UI (`components/<domain>/`, `app/<route>/page.tsx`)
- `page.tsx` — Server Component, fetches data, passes as props. Never `'use client'`.
- Client Components receive data as props, use hooks for mutations.
- Use `components/ui/` primitives. Never inline a `KidButton` manually.

## Shared utilities — use these, don't recreate
| Need | Use |
|------|-----|
| Auth guard in an action | `server/lib/auth-guard.ts` → `requireParentSession()` |
| Badge calculation | `lib/grading.ts` → `calculateBadge()` |
| Schedule time parsing | `lib/schedule-utils.ts` → `parseTimeToMinutes()` |
| Academic year constant | `lib/constants.ts` → `CURRENT_ACADEMIC_YEAR` |
| Session duration | `server/services/auth.service.ts` → `SESSION_DURATION_SECONDS` |

## Known anti-patterns to avoid (with current locations)
| Anti-pattern | Current location |
|---|---|
| Copy-paste `requireParentSession` | `grades.actions.ts:27`, `schedule.actions.ts:37` |
| Hardcode `'2025-2026'` | `GradesManager.tsx:38`, `useGrades.ts:35` |
| Duplicate `calculateBadge` | `lib/utils.ts:44`, `grades.service.ts:8` |
| `semester: number` instead of `1 \| 2` | `grades.repository.ts:14` |
| Business logic in action (`shouldLock`) | `auth.actions.ts:82` |
| `import from 'server/'` inside a hook | Not present yet — keep it that way |

## "Draft First" rule
For any change touching ≥ 2 files: write a 2-sentence summary of what changes and why, and wait for PM approval before editing.

## Efficiency Protocol (must follow)
- Read only the file and line range you need. State what you're looking for first.
- No speculative refactoring. Fix exactly what the task specifies.
- PR description must map each changed file to its layer and confirm layer rules are respected.
