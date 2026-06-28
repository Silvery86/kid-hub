# TypeScript Improvement Review

# Đánh Giá Cải Thiện TypeScript

> **Status:** ✅ All 6 issues implemented — 2026-06-15  
> **Reviewed:** 2026-06-15 · **Implemented:** 2026-06-15  
> **Scope:** `server/actions/` (10 files), `hooks/`, `types/index.ts`, `lib/constants.ts`

---

## Summary / Tóm Tắt

6 independent improvements found. Each is self-contained and safe to apply one at a time.

| #   | Issue                                                                | Files affected       | Impact                         | Status  |
| --- | -------------------------------------------------------------------- | -------------------- | ------------------------------ | ------- |
| 1   | `requireParentSession` copy-pasted in 5 files                        | 5 action files       | 🔴 High — security risk        | ✅ Done |
| 2   | Inline action result types — no shared `ActionResult<T>`             | All 10 action files  | 🟡 Medium — maintainability    | ✅ Done |
| 3   | `UseMathSessionResult` / `UseEnglishSessionResult` are identical     | 2 hook files         | 🟡 Medium — duplication        | ✅ Done |
| 4   | `MATH_MINIGAME_LABELS` typed as `Record<string, string>`             | `math.actions.ts`    | 🟢 Low — type safety           | ✅ Done |
| 5   | `SaveMathProgressInput` / `SaveEnglishProgressInput` share structure | `types/index.ts`     | 🟢 Low — DRY                   | ✅ Done |
| 6   | `awardPointsAction` accepts caller-controlled `userId` — no session  | `rewards.actions.ts` | 🔴 High — privilege escalation | ✅ Done |

---

## Issue 1 — `requireParentSession` copy-pasted in 5 action files 🔴

### Problem / Vấn Đề

`requireParentSession` is locally defined **5 times** with identical bodies. The CLAUDE.md spec explicitly forbids this:

> _"Copy-paste `requireParentSession` — import it from `server/lib/auth-guard.ts`"_

But `server/lib/auth-guard.ts` **does not exist yet** — it is listed in CLAUDE.md's Key Constants table but has never been created.

**Files with local copies:**

| File                                     | Uses legacy `SESSION_COOKIE`? |
| ---------------------------------------- | ----------------------------- |
| `server/actions/grades.actions.ts`       | ✅ Yes                        |
| `server/actions/kid-access.actions.ts`   | ✅ Yes                        |
| `server/actions/kid-progress.actions.ts` | ✅ Yes                        |
| `server/actions/schedule.actions.ts`     | ✅ Yes                        |
| `server/actions/screen-time.actions.ts`  | ✅ Yes                        |

All 5 use `SESSION_COOKIE` from `auth.service` (the legacy token name), while the current auth system uses `PARENT_ACCESS_COOKIE` + `PARENT_REFRESH_COOKIE` with a refresh flow (as implemented in `auth.actions.ts`). These local guards do **not** attempt token refresh — meaning a parent with an expired access token will be incorrectly rejected even though a valid refresh token exists.

> **Note (re-verified 2026-06-15):** `homework.actions.ts` and `rewards.actions.ts` intentionally have no `requireParentSession` — they are kid-facing actions. However, see Issue 6 for a security gap in `rewards.actions.ts`.

### Current code (repeated 5×) / Code hiện tại (lặp 5 lần)

```ts
// grades.actions.ts (line 27) — identical in 4 other files
const requireParentSession = async (): Promise<void> => {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value // ← legacy cookie name
  if (!token) throw new Error('Unauthorized')
  const session = await verifySessionToken(token)
  if (!session) throw new Error('Unauthorized')
}
```

### Proposed fix / Đề xuất sửa

Create `server/lib/auth-guard.ts` using the proper `ensureParentSession` logic from `auth.actions.ts`, then replace all 5 local copies with a single import:

```ts
// server/lib/auth-guard.ts  (NEW FILE)
'server-only'
import { cookies } from 'next/headers'
import {
  verifyParentAccessToken,
  verifyParentRefreshToken,
  compareStoredTokenHash,
  PARENT_ACCESS_COOKIE,
  PARENT_REFRESH_COOKIE,
} from '@/server/services/auth.service'
import * as userRepo from '@/server/repositories/user.repository'
import { issueParentSessionCookies } from '@/server/actions/auth.actions' // or inline

export async function requireParentSession(): Promise<{ userId: string }> {
  // mirrors ensureParentSession in auth.actions.ts — with refresh support
  // throws 'Unauthorized' if no valid session exists
}
```

```ts
// In each of the 5 action files — replace the local copy with:
import { requireParentSession } from '@/server/lib/auth-guard'
```

---

## Issue 2 — Inline action result types, no shared `ActionResult<T>` 🟡

### Problem / Vấn Đề

Every action defines its return type inline. There are at least **30 inline return type declarations** across all 10 action files, all following the same shape:

> **Re-verified 2026-06-15:** `homework.actions.ts` (2 instances) and `kid-progress.actions.ts` (1 instance, multi-line so missed in original count) were added to scope. Total is ~30, up from the original count of 28 across 9 files.

```ts
// Repeated pattern across all action files
Promise<{ success: boolean; data?: SomeType; error?: string }>
Promise<{ success: boolean; error?: string; isLocked?: boolean; lockoutSeconds?: number }>
Promise<{ success: boolean; newTotal?: number; error?: string }>
```

This means:

- No single place to change the shape across all actions
- `data` is optional even on success — TypeScript can't distinguish `success: true` from `success: false`
- Consumers must use `if (result.data)` instead of `if (result.success)`

### Proposed fix / Đề xuất sửa

Add a shared `ActionResult<T>` discriminated union to `types/index.ts`:

```ts
// types/index.ts — ADD these types

/**
 * Discriminated union for all Server Action return values.
 * Use `result.success` to narrow the type — data is only available on success.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** Variant for actions that return no data on success */
export type ActionVoidResult = ActionResult<void>

/** Variant for auth actions that may be locked out */
export type AuthActionResult =
  | { success: true }
  | {
      success: false
      error: string
      isLocked?: boolean
      lockoutSeconds?: number
      isWrong?: boolean
    }
```

**Before (grades.actions.ts):**

```ts
export const getReportCardAction = async (): Promise<{
  success: boolean
  data?: ReportCard
  error?: string
}>
```

**After:**

```ts
import type { ActionResult } from '@/types'

export const getReportCardAction = async (): Promise<ActionResult<ReportCard>>
```

**Consumer benefit:**

```ts
const result = await getReportCardAction()

if (result.success) {
  result.data.grades // ✅ TypeScript knows data is ReportCard — no optional chaining
} else {
  result.error // ✅ TypeScript knows error is string
}
```

---

## Issue 3 — `UseMathSessionResult` and `UseEnglishSessionResult` are identical 🟡

### Problem / Vấn Đề

`hooks/useMathSession.ts` and `hooks/useEnglishSession.ts` each define a result interface that is **structurally identical** — only the type comment differs:

```ts
// useMathSession.ts (line 24)
interface UseMathSessionResult {
  state: ReturnType<typeof useGameSession>['state'] // ← could just be GameSessionState
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  isProcessing: React.MutableRefObject<boolean>
  start: (level: DifficultyLevel) => void
  answerCorrect: () => void
  answerWrong: () => void
  bestScore: GameBestScore | null
  saveError: string | null
}

// useEnglishSession.ts (line 24) — identical
interface UseEnglishSessionResult {
  state: ReturnType<typeof useGameSession>['state'] // same
  starsEarned: 1 | 2 | 3
  // ... same 8 fields
}
```

Additionally, both use `ReturnType<typeof useGameSession>['state']` when `GameSessionState` is already exported directly from `useGameSession.ts` — the `ReturnType` extraction is unnecessary complexity.

### Proposed fix / Đề xuất sửa

Extract a shared interface into `types/index.ts` (or a dedicated `hooks/game-session.types.ts`):

```ts
// types/index.ts — ADD
import type { GameSessionState } from '@/hooks/useGameSession'

export interface UseGameSessionHookResult {
  state: GameSessionState // ← direct type, not ReturnType extraction
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  isProcessing: React.MutableRefObject<boolean>
  start: (level: DifficultyLevel) => void
  answerCorrect: () => void
  answerWrong: () => void
  bestScore: GameBestScore | null
  saveError: string | null
}
```

```ts
// useMathSession.ts
import type { UseGameSessionHookResult } from '@/types'
export const useMathSession = (...): UseGameSessionHookResult => { ... }

// useEnglishSession.ts
import type { UseGameSessionHookResult } from '@/types'
export const useEnglishSession = (...): UseGameSessionHookResult => { ... }
```

> ⚠️ Note: If the two hooks ever diverge (e.g., math needs an extra field), simply extend: `interface UseMathSessionResult extends UseGameSessionHookResult { extra: string }`.

---

## Issue 4 — `MATH_MINIGAME_LABELS` typed as `Record<string, string>` 🟢

### Problem / Vấn Đề

```ts
// server/actions/math.actions.ts (line 17)
const MATH_MINIGAME_LABELS: Record<string, string> = {
  counting: 'Đếm số',
  addition: 'Phép tính',
  shapes: 'Hình học',
}
```

`Record<string, string>` accepts **any** string key — typos are silently `undefined` at runtime. `MathGameType` already exists in `types/index.ts` as `'counting' | 'addition' | 'shapes'`.

The same pattern appears in `english.actions.ts` with `EnglishGameType`.

### Proposed fix / Đề xuất sửa

```ts
// math.actions.ts
import type { MathGameType } from '@/types'

const MATH_MINIGAME_LABELS: Record<MathGameType, string> = {
  counting: 'Đếm số',
  addition: 'Phép tính',
  shapes: 'Hình học',
  // TypeScript will error if you add/remove a MathGameType and forget to update this
}

// english.actions.ts — same fix with EnglishGameType
import type { EnglishGameType } from '@/types'

const ENGLISH_MINIGAME_LABELS: Record<EnglishGameType, string> = {
  alphabet: 'Bảng chữ cái',
  vocabulary: 'Từ vựng',
  phonics: 'Âm thanh',
}
```

**Bonus:** Use `satisfies` to get both validation AND literal inference:

```ts
const MATH_MINIGAME_LABELS = {
  counting: 'Đếm số',
  addition: 'Phép tính',
  shapes: 'Hình học',
} satisfies Record<MathGameType, string>
```

---

## Issue 5 — `SaveMathProgressInput` and `SaveEnglishProgressInput` share structure 🟢

### Problem / Vấn Đề

```ts
// types/index.ts (line 206-224)
export interface SaveMathProgressInput {
  minigame: MathGameType // ← only difference
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export interface SaveEnglishProgressInput {
  minigame: EnglishGameType // ← only difference
  level: DifficultyLevel
  correctCount: number // ← 6 identical fields
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}
```

6 out of 7 fields are identical. If you add a field (e.g., `sessionId?`) you must update both.

### Proposed fix / Đề xuất sửa

Use a shared base type + extension:

```ts
// types/index.ts — REPLACE the two interfaces

interface SaveProgressInputBase {
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export interface SaveMathProgressInput extends SaveProgressInputBase {
  minigame: MathGameType
}

export interface SaveEnglishProgressInput extends SaveProgressInputBase {
  minigame: EnglishGameType
}
```

Or, more concisely with utility types:

```ts
// Generic version — one type to rule them all
export type SaveProgressInput<T extends MathGameType | EnglishGameType> = {
  minigame: T
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export type SaveMathProgressInput = SaveProgressInput<MathGameType>
export type SaveEnglishProgressInput = SaveProgressInput<EnglishGameType>
// Existing consumers need zero changes — same type names, same shapes
```

---

## Issue 6 — `awardPointsAction` accepts caller-controlled `userId` — no session guard 🔴

> **Found:** 2026-06-15 (not in original review scope)

### Problem / Vấn Đề

```ts
// server/actions/rewards.actions.ts (line 16)
export const awardPointsAction = async (
  userId: string,   // ← caller decides who receives the points
  points: number
): Promise<{ success: boolean; newTotal?: number; error?: string }>
```

`awardPointsAction` is a Server Action with no auth guard. Because Server Actions are HTTP endpoints, the kid UI (or any client) can call it with **any `userId`** and award themselves arbitrary points (up to the 50-point cap per call, but with no rate limit). The single-household context reduces the practical blast radius, but it conflicts with CLAUDE.md's stated intent that all mutations include `userId` in a validated `WHERE` clause driven by the session — not from caller input.

### Proposed fix / Đề xuất sửa

Since this is a single-user household (`DEFAULT_USER_ID` is always the target), remove the `userId` parameter and hardcode it — matching the pattern used in `homework.actions.ts`:

```ts
// server/actions/rewards.actions.ts
import { DEFAULT_USER_ID } from '@/lib/constants'

export const awardPointsAction = async (
  points: number
): Promise<ActionResult<{ newTotal: number }>> => {
  const parsed = z.number().int().min(1).max(50).safeParse(points)
  if (!parsed.success) return { success: false, error: 'Invalid points value' }
  try {
    const newTotal = await addUserPoints(DEFAULT_USER_ID, parsed.data)
    return { success: true, data: { newTotal } }
  } catch {
    return { success: false, error: 'Failed to award points' }
  }
}
```

If caller-specified `userId` is ever needed in a multi-user future, require a parent session and validate the target userId against the session's household.

---

## Recommended Implementation Order / Thứ Tự Khuyến Nghị Triển Khai

```
Issue 6 (awardPointsAction userId)   ← Do first — caller-controlled privilege escalation
    │
    ▼
Issue 1 (requireParentSession)       ← Do second — security impact, needs auth-guard.ts created
    │
    ▼
Issue 2 (ActionResult<T>)            ← Do third — affects all 10 actions; do after auth-guard so new guard uses ActionResult too
    │
    ▼
Issue 3 (shared hook interface)      ← Small refactor, safe
    │
    ▼
Issue 4 (MINIGAME_LABELS type)       ← 2-line change, no risk
    │
    ▼
Issue 5 (SaveProgressInput base)     ← Last — zero consumer impact
```

---

## What was NOT changed / Những gì KHÔNG thay đổi

- `types/index.ts` domain interfaces (`UserProfile`, `Subject`, etc.) — well structured, no issues
- Zod schemas in actions — all correctly use `safeParse` with `fieldErrors` handling
- `lib/constants.ts` — correct use of `as const`, `Record<DayOfWeek, string>`, `satisfies` would be bonus-only
- `useGameSession.ts` reducer — discriminated union `GameAction` is already correct
- `@deprecated HomeworkItem` — already marked, tracked separately
- `auth.actions.ts` check actions (`checkParentSessionAction`, `checkKidSessionAction`, `checkParentPinAction`, `clearParentAccessAction`) — non-standard return shapes that don't fit `ActionResult`; left unchanged intentionally

---

## Implementation Record / Ghi Chép Triển Khai

> **Implemented:** 2026-06-15 — all 6 issues applied in a single sprint

### Files created

| File                       | Purpose                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `server/lib/auth-guard.ts` | Canonical `requireParentSession` with access + refresh token logic |

### Files modified

| File                                        | Changes                                                                                                                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types/index.ts`                            | Added `import type { MutableRefObject } from 'react'` + `import type { GameSessionState } from '@/hooks/useGameSession'`; replaced duplicate `SaveMathProgressInput`/`SaveEnglishProgressInput` with `SaveProgressInputBase` + extension (Issue 5); appended `ActionVoidResult`, `ActionResult<T>`, `AuthActionResult` (Issue 2); appended `UseGameSessionHookResult` (Issue 3) |
| `server/lib/auth-guard.ts`                  | **NEW** — `requireParentSession()` with refresh-token rotation (Issue 1)                                                                                                                                                                                                                                                                                                        |
| `server/actions/rewards.actions.ts`         | Removed `userId` param, hardcoded `DEFAULT_USER_ID`, return type → `ActionResult<{ newTotal: number }>` (Issues 6, 2)                                                                                                                                                                                                                                                           |
| `server/actions/grades.actions.ts`          | Dropped local `requireParentSession` + legacy auth imports; `import { requireParentSession } from '@/server/lib/auth-guard'`; return types → `ActionResult<ReportCard>` / `ActionVoidResult` (Issues 1, 2)                                                                                                                                                                      |
| `server/actions/kid-access.actions.ts`      | Same auth-guard swap; return types → `ActionResult<…>` / `ActionVoidResult` (Issues 1, 2)                                                                                                                                                                                                                                                                                       |
| `server/actions/kid-progress.actions.ts`    | Same auth-guard swap; return type → `ActionResult<KidProgressData \| null>` (Issues 1, 2)                                                                                                                                                                                                                                                                                       |
| `server/actions/schedule.actions.ts`        | Same auth-guard swap; all 13 action return types updated to `ActionResult<T>` or `ActionVoidResult`; `{ success: true, id }` → `{ success: true, data: { id } }` for create actions; `points` field moved to `data` object (Issues 1, 2)                                                                                                                                        |
| `server/actions/screen-time.actions.ts`     | Same auth-guard swap; return types updated (Issues 1, 2)                                                                                                                                                                                                                                                                                                                        |
| `server/actions/math.actions.ts`            | `MATH_MINIGAME_LABELS` → `satisfies Record<MathGameType, string>`; return types → `ActionResult<…>` (Issues 4, 2)                                                                                                                                                                                                                                                               |
| `server/actions/english.actions.ts`         | `ENGLISH_MINIGAME_LABELS` → `satisfies Record<EnglishGameType, string>`; return types → `ActionResult<…>` (Issues 4, 2)                                                                                                                                                                                                                                                         |
| `server/actions/auth.actions.ts`            | 9 actions updated to `ActionVoidResult` or `AuthActionResult`; 3 lockout returns gained required `error` field (Issue 2)                                                                                                                                                                                                                                                        |
| `server/actions/homework.actions.ts`        | Return types → `ActionResult<HomeworkItem[]>` / `ActionVoidResult` (Issue 2)                                                                                                                                                                                                                                                                                                    |
| `hooks/useMathSession.ts`                   | Removed `UseMathSessionResult`; return type → `UseGameSessionHookResult` from `@/types` (Issue 3)                                                                                                                                                                                                                                                                               |
| `hooks/useEnglishSession.ts`                | Removed `UseEnglishSessionResult`; return type → `UseGameSessionHookResult` from `@/types` (Issue 3)                                                                                                                                                                                                                                                                            |
| `components/dashboard/HomeworkCheckbox.tsx` | `awardPointsAction(DEFAULT_USER_ID, result.points)` → `awardPointsAction(result.data.points)`; removed unused `DEFAULT_USER_ID` import (Issues 6, 2)                                                                                                                                                                                                                            |
| `app/(dashboard)/grades/page.tsx`           | `result.data?.grades ?? []` → `result.success ? result.data.grades : []` (Issue 2)                                                                                                                                                                                                                                                                                              |
| `app/(dashboard)/homework/page.tsx`         | `result.data ?? []` → `result.success ? result.data : []` (Issue 2)                                                                                                                                                                                                                                                                                                             |

### Type design decisions

- **`ActionVoidResult` vs `ActionResult<void>`** — Used separate `ActionVoidResult` type (no `data` field on success) to avoid requiring `return { success: true, data: undefined }` in action bodies. Cleaner at call sites.
- **`AuthActionResult`** — Separate from `ActionResult<T>` because auth failures have extra optional fields (`isLocked`, `lockoutSeconds`, `isWrong`) that don't belong on the shared type.
- **Auth check actions left unchanged** — `checkParentSessionAction`, `checkKidSessionAction`, `checkParentPinAction`, `clearParentAccessAction` have bespoke return shapes and no discriminant `success` pattern; touching them would risk breaking session-gate middleware consumers.
