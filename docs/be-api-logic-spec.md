# Backend Logic Specification — Kid Hub

**Role:** BE — Jordan Osei
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. Server Actions Overview

All backend logic is exposed through Next.js Server Actions (no REST API). Each action is the single entry point from the client. Actions must not be called from other actions.

> **Layering violation detected:** Multiple action files currently import and call repositories directly, bypassing the service layer. This breaks the architecture contract. All such calls must be moved into service functions. See Section 13 for the full list.

### File Map

| File | Actions |
|---|---|
| `server/actions/auth.actions.ts` | Registration, login, PIN, kid pattern, sign out |
| `server/actions/schedule.actions.ts` | Schedule CRUD, extra classes, daily homework CRUD |
| `server/actions/homework.actions.ts` | Today's homework queries, mark done |
| `server/actions/grades.actions.ts` | Report card read, grade upsert |
| `server/actions/math.actions.ts` | Save math session, get today's math homework |
| `server/actions/english.actions.ts` | Save english session, get today's english homework |
| `server/actions/kid-access.actions.ts` | Get/save feature toggles, get recent activity |
| `server/actions/rewards.actions.ts` | Badge + points mutations |
| `server/actions/kid-progress.actions.ts` | Kid progress queries (parent-facing) |
| `server/actions/screen-time.actions.ts` | Screen time logging |

---

## 2. Auth Actions

### `registerParentAccountAction(email, password)`

```
Input:  { email: string, password: string }
Zod:    email().min(1), password string min(8) max(128)
Auth:   None (public)
Flow:
  1. Validate email format + password length
  2. Check no existing account (getByParentEmail)
  3. hashPassword(password, 12)
  4. upsertParentCredentials(userId, email, hash)
  5. createParentAccessToken(userId) + createParentRefreshToken(userId)
  6. Set cookies (parent_access 15 min, parent_refresh 30 days)
Output: { success: true } | { success: false; error: string }
```

### `parentLoginAction(email, password)`

```
Input:  { email: string, password: string }
Auth:   None (public) — rate-limited by Upstash (5/60s per IP)
Flow:
  1. getParentAuthRecord(email)
  2. isLockedOut(record.parentLoginLockedUntil) → return lockout info
  3. comparePassword(password, record.parentPasswordHash)
  4. On fail: recordFailedParentLogin() → { isLocked?, lockoutSeconds? }
  5. On success: resetParentLoginAttempts()
  6. createParentAccessToken() + createParentRefreshToken()
  7. Set cookies
Output: { success: true } | { success: false; error; isLocked?; lockoutSeconds? }
```

### `verifyPinAction(pin)`

```
Input:  { pin: string }
Auth:   None (public) — rate-limited by Upstash (5/60s per IP)
Flow:
  1. getPin(DEFAULT_USER_ID)
  2. isLockedOut(pin.lockedUntil)
  3. comparePin(pin, pin.hash)
  4. On fail: recordFailedPinAttempt()
  5. On success: resetPinAttempts() + createParentAccessToken()
  6. Set parent_access cookie
Output: { success: true } | { success: false; error; isLocked?; lockoutSeconds?; isWrong? }
```

### `verifyKidPatternAction(pattern)`

```
Input:  { pattern: string }  — e.g. "34" (two digits 1–6)
Auth:   None (public)
Flow:
  1. getParentAuthRecord(DEFAULT_USER_ID) → kidPatternHash, kidPatternAttempts
  2. isLockedOut(kidPatternLockedUntil)
  3. compareKidPattern(pattern, hash)
  4. On fail: recordFailedKidPatternAttempt()
  5. On success: resetKidPatternAttempts() + createKidSessionToken()
  6. Set kid_session cookie (12 h)
Output: { success: true } | { success: false; error; isLocked?; lockoutSeconds? }
```

---

## 3. Schedule Actions

### `getScheduleAction(day?)`

```
Input:  day?: DayOfWeek
Auth:   None (kid or parent session — middleware already checked)
Flow:
  1. scheduleRepo.getWeeklySchedule(DEFAULT_USER_ID)
  2. If day provided: filter to that day only
  3. Merge with EveningBlocks and Overrides
Output: { success: true; data: DailySchedule[] } | { success: false; error }
```

### `createPeriodAction(input)`

```
Input:  { day, periodNumber, subjectId, startTime, endTime, roomNumber?, iconKey? }
Zod:    day enum, periodNumber 1–10, subjectId string, times "HH:MM" pattern
Auth:   requireParentSession()
Flow:
  1. Auth guard
  2. Zod parse
  3. scheduleService.validatePeriodOverlap(day, startTime, endTime, DEFAULT_USER_ID)
  4. scheduleRepo.createPeriod(DEFAULT_USER_ID, validated)
Output: { success: true } | { success: false; error }
```

### `addDailyHomeworkAction(input)`

```
Input:  { date, subjectId, label, iconKey?, points? }
Zod:    date "YYYY-MM-DD", subjectId string, label max(150), points default(10)
Auth:   requireParentSession()
Flow:
  1. Auth guard
  2. Zod parse
  3. scheduleRepo.createDailyHomework(DEFAULT_USER_ID, validated)
Output: { success: true; id: string } | { success: false; error }
```

### `toggleHomeworkDoneAction(id, isDone)`

```
Input:  id: string, isDone: boolean
Auth:   None (kid session assumed via middleware)
Flow:
  1. scheduleRepo.toggleDailyHomeworkDone(id, isDone, DEFAULT_USER_ID)
  2. If isDone: award 10 points (BUG: currently not calling progress update)
  3. If isDone: logActivity(HOMEWORK_DONE)
Output: { success: true; points?: number } | { success: false; error }

KNOWN BUG: Points not awarded in this action path (TD-002)
```

---

## 4. Homework Actions

### `getTodayHomeworkAction()`

```
Input:  None
Auth:   None (kid session via middleware)
Flow:
  1. date = todayDateKey()
  2. homeworkRepo.getTodayHomework(DEFAULT_USER_ID, date)
  3. Map to HomeworkItem[]
Output: { success: true; data: HomeworkItem[] } | { success: false; error }
```

### `markHomeworkDoneAction(periodId, date)`

```
Input:  periodId: string, date: string
Auth:   None (kid session via middleware)
Flow:
  1. homeworkRepo.markDone(periodId, date, DEFAULT_USER_ID)
  2. Award 10 points
  3. logActivity(HOMEWORK_DONE)
Output: { success: true } | { success: false; error }

NOTE: This is a separate flow from toggleHomeworkDoneAction — both mark homework
done but via different tables. Must be unified (see TD-002).
```

---

## 5. Math & English Actions

### `saveMathProgressAction(input)`

```
Input:  {
  minigame: 'counting' | 'addition' | 'shapes'
  level: 1 | 2 | 3
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}
Zod:    minigame enum, level 1–3, counts ≥ 0, timeSpentSecs ≥ 0
Auth:   None (kid session via middleware)
Flow:
  1. Zod parse
  2. mathService.saveMathSession(DEFAULT_USER_ID, validated)
     a. Calculate starsEarned (1–3 based on accuracy + time)
     b. Calculate score = correctCount × 10 × starsEarned
     c. mathRepo.saveMathProgress(...)
     d. progressRepo.upsertBestScore(gameType: 'math', level, subType, score, stars)
     e. progressRepo.awardBadge if thresholds met
     f. If homeworkPeriodId: mark homework done
  3. Return session result
Output: { success: true; data: MathSessionResult } | { success: false; error }
```

### `saveEnglishProgressAction(input)`

Identical structure to `saveMathProgressAction` with `minigame: 'alphabet' | 'vocabulary' | 'phonics'`.

---

## 6. Grades Actions

### `upsertGradeAction(input)`

```
Input:  {
  subjectId: string
  score: number
  semester: 1 | 2
  academicYear: string
}
Zod:    subjectId string, score min(0) max(10), semester 1|2, year "YYYY-YYYY"
Auth:   requireParentSession()
Flow:
  1. Auth guard
  2. Zod parse
  3. badge = calculateBadge(score)  — from lib/grading.ts
  4. gradesRepo.upsertGrade(DEFAULT_USER_ID, { ...validated, badge })
Output: { success: true } | { success: false; error }
```

---

## 7. Zod Validation Schemas

All schemas should be exported from a dedicated `server/lib/schemas.ts` file (currently inline — should be refactored).

### Common Schemas

```ts
const TimeSchema = z.string().regex(/^\d{2}:\d{2}$/)
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const SemesterSchema = z.union([z.literal(1), z.literal(2)])
const DifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
const MathGameSchema = z.enum(['counting', 'addition', 'shapes'])
const EnglishGameSchema = z.enum(['alphabet', 'vocabulary', 'phonics'])
const DayOfWeekSchema = z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
```

### Period Schema

```ts
const PeriodInputSchema = z.object({
  day: DayOfWeekSchema,
  periodNumber: z.number().int().min(1).max(10),
  subjectId: z.string().min(1).max(30),
  startTime: TimeSchema,
  endTime: TimeSchema,
  roomNumber: z.string().max(20).optional(),
  iconKey: z.string().max(30).optional(),
})
```

---

## 8. Auth Guard

`requireParentSession()` is defined in `server/lib/auth-guard.ts`. It must be called at the top of every parent-facing mutation action.

```ts
export async function requireParentSession(): Promise<{ userId: string }> {
  const cookie = cookies().get('parent_access')
  if (!cookie) throw new Error('Unauthorized')
  const payload = await verifyParentAccessToken(cookie.value)
  if (!payload) throw new Error('Unauthorized')
  return { userId: payload.userId }
}
```

**Rule:** Actions that call `requireParentSession()` must catch the thrown error and return `{ success: false, error: 'Unauthorized' }` — never let it propagate as an unhandled exception.

---

## 9. Service Layer Logic

### `scheduleService.validatePeriodOverlap(day, startTime, endTime, userId)`

```
1. Fetch all existing periods for that day
2. For each existing period:
   - Parse startTime + endTime to minutes
   - Check if new period overlaps [start, end)
3. Return { hasOverlap: boolean; conflictingPeriod?: ClassPeriod }
```

### `gradesService.calculateBadge(score: number): BadgeTier`

```
score ≥ 9 → 'excellent'
score ≥ 7 → 'good'
score < 7 → 'needs-practice'
```

### `authService.isLockedOut(lockedUntil: Date | null): boolean`

```
if lockedUntil == null → false
if lockedUntil > now → true (still locked)
if lockedUntil ≤ now → false (lockout expired)
```

---

## 10. Data Security Rules

| Rule | Enforcement |
|---|---|
| Every mutation WHERE clause includes userId | Repository layer responsibility |
| Passwords/PINs/patterns never returned from DB | Service layer strips before returning |
| JWT secrets use `SESSION_SECRET` env var, no fallback | `server/services/auth.service.ts` |
| Refresh tokens stored as hash, not plaintext | `user.refreshTokenHash` field |
| Rate limiting on all auth endpoints | Upstash middleware + action-level check |
| Zod parse before any DB write | All write actions |

---

## 11. Return Type Standard

All actions must return a discriminated union. Do not return nullable fields on success responses:

```ts
// CORRECT
type ActionResult<T = void> =
  | { success: true } & (T extends void ? {} : { data: T })
  | { success: false; error: string }

// INCORRECT — ambiguous
return { success: true, data: undefined }
return { success: false }  // missing error message
```

---

## 12. Known Backend Bugs

| Bug ID | Description | Action | Fix |
|---|---|---|---|
| BUG-001 | Homework points not awarded via `toggleHomeworkDoneAction` | `schedule.actions.ts` | Call `progressRepo.addPoints` after toggle |
| BUG-002 | `markHomeworkDoneAction` and `toggleHomeworkDoneAction` operate on different tables | Both | Unify into one action or clarify contract |
| BUG-003 | `updatePeriod` / `deletePeriod` may lack userId WHERE clause | `schedule.repository.ts` | Add `AND userId = DEFAULT_USER_ID` |
| BUG-004 | Badge triggers not fully wired — `game-win`, `streak-7`, `all-green` never fire | `rewards.actions.ts` | Wire to correct event handlers |
| BUG-005 | 10 action files import repositories directly, bypassing the service layer | Multiple — see Section 13 | Move all repository calls into service functions |

---

## 13. Layering Violations — Actions Calling Repositories Directly

The following action files break the layer contract by importing and calling repositories directly. All repository access must go through a service. These must be fixed before the codebase is considered architecturally sound.

### Violation Table

| Action File | Direct Repository Import | Correct Fix |
|---|---|---|
| `auth.actions.ts` | `user.repository` (`* as userRepo`) | Move all user DB reads/writes into `auth.service.ts` methods |
| `schedule.actions.ts` | `schedule.repository` (`* as scheduleRepo`) | Move schedule CRUD calls into `schedule.service.ts` |
| `schedule.actions.ts` | `activity.repository` (`logActivity`) | Move activity logging into `activity.service.ts`; call service from action |
| `homework.actions.ts` | `homework.repository` (`* as homeworkRepo`) | Move homework queries into `homework.service.ts` |
| `grades.actions.ts` | `grades.repository` (`* as gradesRepo`) | Move grade queries into `grades.service.ts` |
| `grades.actions.ts` | `user.repository` (`* as userRepo`) | Move user reads into `grades.service.ts` (or a shared `user.service.ts`) |
| `math.actions.ts` | `activity.repository` (`logActivity`) | Move activity logging into `activity.service.ts`; call service from action |
| `english.actions.ts` | `activity.repository` (`logActivity`) | Move activity logging into `activity.service.ts`; call service from action |
| `kid-access.actions.ts` | `user.repository` (`getKidAccessSettings`, `saveKidAccessSettings`) | Move into `kid-access.service.ts` (create if missing) |
| `kid-access.actions.ts` | `activity.repository` (`getRecentActivity`) | Move into `activity.service.ts` |
| `rewards.actions.ts` | `progress.repository` (`addUserPoints`) | Move into `rewards.service.ts` (create if missing) |
| `kid-progress.actions.ts` | `user.repository` (`getUserProgress`) | Move into a `progress.service.ts` or `user.service.ts` |
| `screen-time.actions.ts` | `screen-time.repository` (multiple) | Move into `screen-time.service.ts` (create if missing) |

### Missing Services to Create

The following service files do not yet exist and must be created to absorb the displaced repository calls:

| Service File | Absorbs From |
|---|---|
| `server/services/activity.service.ts` | `logActivity`, `getRecentActivity` calls across 4 action files |
| `server/services/kid-access.service.ts` | `getKidAccessSettings`, `saveKidAccessSettings` |
| `server/services/rewards.service.ts` | `addUserPoints`, badge checking logic |
| `server/services/screen-time.service.ts` | Screen time log reads and writes |
| `server/services/progress.service.ts` | `getUserProgress` and progress state queries |

### Refactor Pattern

For each violation, the fix follows this pattern:

```ts
// BEFORE (action calling repository directly — wrong)
// server/actions/math.actions.ts
import { logActivity } from '@/server/repositories/activity.repository'

export async function saveMathProgressAction(input: unknown) {
  // ...
  await logActivity(DEFAULT_USER_ID, 'GAME_COMPLETE', label)
}

// AFTER (action calls service — correct)
// server/services/activity.service.ts
import { logActivity } from '@/server/repositories/activity.repository'

export async function recordActivityEvent(userId: string, type: string, label: string) {
  return logActivity(userId, type, label)
}

// server/actions/math.actions.ts
import { recordActivityEvent } from '@/server/services/activity.service'

export async function saveMathProgressAction(input: unknown) {
  // ...
  await recordActivityEvent(DEFAULT_USER_ID, 'GAME_COMPLETE', label)
}
```
