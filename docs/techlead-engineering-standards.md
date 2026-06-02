# Engineering Standards — Kid Hub

**Role:** TechLead — Marcus Chen
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. Codebase Health Scorecard

| Dimension | Score | Notes |
|---|---|---|
| TypeScript strictness | ✅ 9/10 | Strict mode + `noUncheckedIndexedAccess` + `noImplicitOverride` |
| Layer discipline | ✅ 8/10 | Clean separation; minor gaps in ownership guards |
| Test coverage | ❌ 2/10 | Playwright installed, no tests written |
| CI pipeline | ❌ 0/10 | No automated lint/typecheck/build |
| Error handling | ⚠️ 5/10 | Actions return `{ success }` consistently; routes have no error.tsx |
| Security | ⚠️ 6/10 | Auth is solid; headers and ownership gaps remain |
| Documentation | ✅ 8/10 | CLAUDE.md + docs/ folder well maintained |
| Code consistency | ✅ 8/10 | Prettier + ESLint enforced; design tokens followed |

---

## 2. TypeScript Standards

### Compiler Configuration (tsconfig.json)

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noEmit": true
}
```

All new code must compile without errors under these flags. No `// @ts-ignore` or `any` escapes without a documented reason.

### Type Conventions

- Server action return types must use discriminated unions:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

- Avoid `input: unknown` with internal Zod parse — prefer typed input at call sites where the caller is internal code.
- Use `satisfies` for static data arrays instead of `as const`:

```ts
const SUBJECTS = [...] satisfies readonly Subject[]
```

- Never use `Record<string, boolean>` for `kidAccessSettings` across the codebase — define a `KidAccessSettings` interface.

---

## 3. Layer Rules (Enforced)

### Allowed Imports Per Layer

| Layer | Can import from |
|---|---|
| `server/actions/` | `server/services/`, `server/lib/`, `lib/` |
| `server/services/` | `server/repositories/`, `lib/` |
| `server/repositories/` | `lib/db.ts`, `lib/constants.ts` only |
| `lib/` | No Node.js APIs (must be edge-safe) |
| `hooks/` | `server/actions/`, `lib/` |
| `components/` | `hooks/`, `lib/`, `components/` |
| `app/**/page.tsx` | `server/actions/`, `components/`, `lib/` |

### Violations to Watch For

```ts
// BANNED — crashes client bundle
import { scheduleRepository } from '@/server/repositories/schedule.repository'
// in any file under hooks/ or components/

// BANNED — business logic in action
async function createPeriodAction(input) {
  const validated = PeriodSchema.parse(input)
  if (validated.startTime >= validated.endTime) throw new Error(...) // ← belongs in service
}

// BANNED — hard-coded user ID
await prisma.classPeriod.findMany({ where: { userId: 'khoi-default-user' } })
// use DEFAULT_USER_ID from lib/constants.ts

// BANNED — raw Tailwind palette value for semantic color
<div className="bg-yellow-400">  // ← use bg-pe or bg-btn-primary
```

---

## 4. Server Action Checklist

Every server action must satisfy all of the following:

- [ ] `'use server'` directive at top of file
- [ ] Calls `requireParentSession()` for all parent-facing mutations
- [ ] Validates all inputs with Zod before any business logic
- [ ] Delegates business logic to a service, never implements it inline
- [ ] Returns `{ success: true, data? }` or `{ success: false, error: string }`
- [ ] Never returns raw Prisma objects — map to domain types
- [ ] Never throws — catches all errors and returns `{ success: false }`

---

## 5. Repository Checklist

Every repository function must satisfy all of the following:

- [ ] Contains only Prisma queries — no `if`, no `map`, no business logic
- [ ] Every `create`, `update`, `delete`, `upsert` includes `WHERE userId = DEFAULT_USER_ID`
- [ ] Returns typed results (Prisma-generated types or plain objects)
- [ ] Never throws application-level errors — let Prisma errors propagate to the service

### Ownership Guard Audit (Current State)

| Function | Has userId filter | Verified |
|---|---|---|
| `createPeriod` | ✅ | Yes |
| `updatePeriod` | ⚠️ | Needs audit |
| `deletePeriod` | ⚠️ | Needs audit |
| `upsertGrade` | ✅ | Yes |
| `saveMathProgress` | ✅ | Yes |
| `saveEnglishProgress` | ✅ | Yes |
| `logActivity` | ✅ | Yes |
| `saveKidAccessSettings` | ✅ | Yes |

---

## 6. Technical Debt Inventory

### Critical (P0)

| ID | Debt | Location | Impact |
|---|---|---|---|
| TD-001 | No CI pipeline | Root | Any TypeScript error or broken build can land on main undetected |
| TD-002 | Dual homework completion flows | `schedule.actions.ts` + `homework.actions.ts` | Inconsistent reward state |
| TD-003 | `SESSION_SECRET` unset in docker-compose | `docker-compose.yml` L31 | JWTs forgeable in dev |

### High (P1)

| ID | Debt | Location | Impact |
|---|---|---|---|
| TD-004 | `UserProgress` stored in localStorage, not DB | `hooks/useUserProgress.ts` | Points/streaks reset on clear storage; DB table unused |
| TD-005 | No route-level `error.tsx` | All route groups | DB timeouts produce blank white screens |
| TD-006 | No `loading.tsx` in most routes | `dashboard/`, `grades/`, `homework/` | Layout shift on slow connections |
| TD-007 | Ownership guards missing on `updatePeriod`/`deletePeriod` | `schedule.repository.ts` | Privilege escalation if user IDs ever diverge |

### Medium (P2)

| ID | Debt | Location | Impact |
|---|---|---|---|
| TD-008 | No security headers | `next.config.ts` | XSS, clickjacking exposure |
| TD-009 | `useSchedule` polls without stale indicator | `hooks/useSchedule.ts` | User sees outdated schedule with no feedback |
| TD-010 | `input: unknown` + inline Zod in many actions | `server/actions/*.ts` | Inconsistent — some actions typed at call sites, some not |
| TD-011 | Badge trigger wiring incomplete | `server/actions/rewards.actions.ts` | Several badges never awarded |
| TD-012 | `KidAccessSettings` typed as `Record<string, boolean>` | Multiple files | No compile-time safety on toggle keys |

---

## 7. CI Pipeline (Required — Not Implemented)

The following GitHub Actions workflow must be created before any production deployment:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run build
```

---

## 8. Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Server action function | `camelCase` + `Action` suffix | `createPeriodAction` |
| Service function | `camelCase`, verb-noun | `validatePeriodOverlap` |
| Repository function | `camelCase`, verb-noun | `createPeriod` |
| React component | `PascalCase` | `ScheduleManager` |
| Custom hook | `use` + `PascalCase` | `useSchedule` |
| Zod schema | `PascalCase` + `Schema` | `PeriodInputSchema` |
| Type/interface | `PascalCase` | `ClassPeriod` |
| Enum | `SCREAMING_SNAKE` (Prisma) | `DayOfWeek`, `EventType` |
| Constant | `SCREAMING_SNAKE` | `DEFAULT_USER_ID` |
| CSS token | `--color-*`, `--radius-*`, `--spacing-*` | `--color-math` |

---

## 9. Code Review Gate

Pull requests must pass all of the following before merge:

- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero errors
- [ ] No `any` without justification comment
- [ ] No raw Tailwind palette values used semantically
- [ ] No business logic in actions or repositories
- [ ] No hard-coded `'khoi'` or `'2025-2026'` strings
- [ ] No `server/` imports in client files
- [ ] Every new mutation includes userId WHERE clause
- [ ] New Server Actions include Zod validation + auth guard
- [ ] No new `// @ts-ignore` without justification

---

## 10. Dependency Notes

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.1.6 | App Router; keep up to date for security patches |
| Prisma | 7.5.0 | New v7 API; `prisma.config.ts` required |
| Tailwind CSS | 4 | `@theme {}` syntax; no `tailwind.config.ts` tokens |
| Zod | 4.3.6 | Breaking changes from v3 — check `.parse()` vs `.safeParse()` |
| Jose | 6.2.2 | HS256 only — do not change algorithm without key rotation |
| bcryptjs | 3.0.3 | Cost 12 rounds — do not lower |
| React | 19.2.3 | Server Components default; explicit `'use client'` required |
