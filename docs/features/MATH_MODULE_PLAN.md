# Math Module — Feature Plan

**Version:** 1.0.0  
**Status:** Awaiting PM Approval — Do not implement  
**Authors:** PM · Lead Dev · Designer · QA  
**Route:** `/math` (inside `app/(games)/math/`)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Specification — PM & Designer](#2-feature-specification--pm--designer)
3. [Architectural Design — Lead Dev](#3-architectural-design--lead-dev)
4. [Quality Assurance — QA Agent](#4-quality-assurance--qa-agent)
5. [Open Questions & Decisions Log](#5-open-questions--decisions-log)

---

## 1. Executive Summary

The `/math` route is a core educational feature of Kid Hub, targeting a 5-year-old audience (Kindergarten / Grade 1). It replaces the current single-game page with a **three-mini-game hub**, each covering a distinct math curriculum domain. Sessions can optionally be tagged as homework, reporting completion back to the Parent Dashboard.

**Approved Mini-Games:**

| # | Name | Domain | Status |
|---|---|---|---|
| 1 | 🌟 Counting Stars | Counting Objects 1–10 | New |
| 2 | ➕ Number Ninja | Basic Addition/Subtraction within 10 | Existing (light refactor) |
| 3 | 🔷 Shape Quest | Shape Recognition | New |

---

## 2. Feature Specification — PM & Designer

### 2.1 Curriculum Scope

#### Mini-Game 1 — Counting Stars 🌟

**Goal:** Develop pre-numeracy counting fluency for numbers 1–10.

**Mechanic:**
- Display N objects on screen (stars, apples, or ducks — rotates per session).
- Objects animate in one-by-one (100ms stagger) to scaffold counting aloud.
- Child picks the correct number from **3 large answer buttons** (the correct answer + 2 distractors).
- Distractors are always ±1 or ±2 of the correct answer, never negative.

**Levels:**
- Level 1: Count 1–5 objects
- Level 2: Count 1–10 objects
- Level 3: Count 1–10 with mixed object types per question (mixed fruit + animals)

**Session:** 10 questions, 15 seconds per question (longer than Number Ninja — counting takes more time).

---

#### Mini-Game 2 — Number Ninja ➕ *(Existing)*

**Goal:** Reinforce basic addition and subtraction within 10.

**Current Implementation:** Already complete in `components/games/MathGame.tsx`.

**Required Changes (light polish only):**
- Level 1 scope is already 1–10 → relabel it as "Easy" in the UI string.
- Pin the `/math` hub entry for this game to "Level 1 only" for the hub card context.
- No logic changes required.

---

#### Mini-Game 3 — Shape Quest 🔷

**Goal:** Teach recognition of 6 basic shapes aligned with KG curriculum.

**Shapes in scope:** circle · square · triangle · rectangle · star · heart

**Mechanic (Dual Mode — alternates randomly per question):**
- **Mode A — Name → Shape:** Display the shape name as large text. Show 3 shape images as answer buttons. Tap the matching shape.
- **Mode B — Shape → Name:** Display a shape image (large, centered). Show 3 name labels as answer buttons. Tap the correct name.

**Levels:**
- Level 1: 4 shapes (circle, square, triangle, rectangle) — Mode A only
- Level 2: All 6 shapes — Mode A only
- Level 3: All 6 shapes — Dual Mode (A + B mixed)

**Session:** 10 questions, 12 seconds per question.

---

### 2.2 UX/UI — Kid-First Design

#### Hub Layout (`/math` page)

- Full-screen page using `bg-shell-kid` background token.
- Three game cards arranged in a single column (mobile) or 3-column row (tablet+).
- Each card uses `GameEntryCard` (existing component) with the game icon, name, and a "Best Score" badge.
- A "Back to Dashboard" button at the top-left using `KidButton` variant `ghost`.

#### Game Card Design

Each `GameEntryCard` displays:
- Large emoji icon (min 48px)
- Game name in `font-sans` bold, min `text-2xl`
- Star rating for best score (`StarRating` component)
- Subject color stripe: all math games use `bg-math` (`--color-math: #3b82f6`)

#### In-Game UI

All three games share the existing `GameHud` component (correct count, question index, timer). No changes required to `GameHud`.

Answer buttons must meet tap targets:
- Minimum `spacing-tap` (3rem / 48px) in height
- Minimum `spacing-tap-lg` (4rem / 64px) for primary answer choices
- `rounded-pill` border radius for friendliness

#### Feedback States (semantic tokens)

| Event | Visual | Token |
|---|---|---|
| Correct answer | Green flash + ✅ icon + audio | `btn-secondary` (`#34d399`) |
| Wrong answer | Red shake + ❌ icon + audio | `bg-red-400` (semantic: `--color-vietnamese` `#ef4444`) |
| Time running out (≤3s) | Timer turns amber, pulses | `color-progress-low` (`#fb923c`) |
| 3-star result | Confetti + trophy emoji | `color-star-filled` (`#fbbf24`) |

All feedback uses the existing `useAudio` hook (`correct`, `wrong`, `complete` sounds).

---

### 2.3 Homework Integration

#### Concept

A parent can schedule a Math ClassPeriod with `isHomework: true`. When the child launches a math mini-game **on a homework day**, the hub shows a 🏠 **"This is Homework!"** banner above the game cards.

The child plays normally. On game completion, the app records the session against the homework task, marking it done.

#### Flow

1. Parent schedules a `ClassPeriod` with `subjectId = 'math'` and `isHomework = true` for a given day.
2. On that day, the `/math` hub page queries active homework periods for `subjectId = 'math'` and today's date.
3. If a pending homework period exists, the hub renders the homework banner with the period's `homeworkNote`.
4. On game result screen, a **"Submit as Homework"** button appears (alongside Replay/Exit).
5. Tapping "Submit as Homework" calls `completeMathHomeworkAction`, which:
   - Creates a `HomeworkCompletion` record (existing model — `isDone: true`, `doneAt: now()`).
   - Creates a `MathProgress` record with `homeworkPeriodId` set.
6. Parent Dashboard already renders `HomeworkCompletion` records — no new UI needed.

#### Homework Completion State Machine

```
Homework pending (isDone: false)
  └─► Child plays any math mini-game
        └─► Result screen shows "Submit as Homework"
              └─► On tap → isDone: true, doneAt set
                    └─► Dashboard shows ✅
```

---

## 3. Architectural Design — Lead Dev

### 3.1 Logic Flow

```
/math Page (Server Component)
  │
  ├─► Fetch active homework via service (server-side)
  │     server/services/homework.service.ts
  │       └─► server/repositories/homework.repository.ts
  │
  └─► Render MathHub (Client Component)
        │
        ├─► GameEntryCard × 3 (presentational)
        │
        └─► On game completion:
              useMathSession (hook)
                └─► saveMathProgressAction (Server Action)
                      └─► math.service.ts
                            └─► math.repository.ts (Prisma)
```

**Layer responsibilities:**

| Layer | File | Responsibility |
|---|---|---|
| Page | `app/(games)/math/page.tsx` | Fetch today's homework, render hub |
| Hub Component | `components/games/MathHub.tsx` | Orchestrate 3-game selection, show homework banner |
| Game Components | `components/games/CountingGame.tsx`, `MathGame.tsx`, `ShapeGame.tsx` | Individual game UIs, call `useMathSession` on finish |
| Question Generators | `lib/data/countingLevels.ts`, `lib/data/shapeLevels.ts` | Seeded RNG, return typed question arrays |
| Hook | `hooks/useMathSession.ts` | Wraps `useGameSession`, calls `saveMathProgressAction` on finish |
| Action | `server/actions/math.actions.ts` | Zod validation, auth guard, calls service |
| Service | `server/services/math.service.ts` | Business rules: score calc, homework link, best score update |
| Repository | `server/repositories/math.repository.ts` | Prisma queries — `MathProgress`, `GameBestScore`, `HomeworkCompletion` |

---

### 3.2 Data Persistence — Proposed Schema Changes

#### New Enum: `MathGameType`

```prisma
enum MathGameType {
  counting
  addition
  shapes
}
```

#### New Model: `MathProgress`

```prisma
/// Records a single completed math game session.
model MathProgress {
  id               String       @id @default(cuid())
  userId           String
  user             User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  minigame         MathGameType // counting | addition | shapes
  level            Int          // 1, 2, or 3
  correctCount     Int
  incorrectCount   Int
  timeSpentSecs    Int          // Total wall-clock seconds for the session
  starsEarned      Int          // 1–3, derived from correctCount / totalQuestions
  score            Int          // correctCount × 10 × starsEarned
  homeworkPeriodId String?      // FK to ClassPeriod — set when submitted as homework
  homeworkDate     String?      // "YYYY-MM-DD" — mirrors HomeworkCompletion.date
  completedAt      DateTime     @default(now())

  @@index([userId, completedAt])
  @@index([userId, homeworkPeriodId])
  @@map("math_progress")
}
```

#### Schema Changes to Existing Models

`GameBestScore` already has `gameType GameType` and `level Int`. To support per-minigame best scores within math, **add a nullable `subType` field**:

```prisma
model GameBestScore {
  // ... existing fields ...
  subType String? // "counting" | "addition" | "shapes" — null for english
  
  // Change unique constraint:
  @@unique([userProgressId, gameType, level, subType])
}
```

> **Migration note:** The existing unique index `[userProgressId, gameType, level]` must be dropped and replaced with `[userProgressId, gameType, level, subType]`. Existing `math` rows get `subType = 'addition'`.

#### User → MathProgress relation addition

```prisma
model User {
  // ... existing fields ...
  mathProgress MathProgress[]
}
```

---

### 3.3 Server Action Contract

```typescript
// server/actions/math.actions.ts

interface SaveMathProgressInput {
  minigame: 'counting' | 'addition' | 'shapes'
  level: 1 | 2 | 3
  correctCount: number       // 0–10
  incorrectCount: number     // 0–10
  timeSpentSecs: number      // > 0
  homeworkPeriodId?: string  // optional — only on homework submit
  homeworkDate?: string      // "YYYY-MM-DD" — required if homeworkPeriodId set
}

// Returns:
{ success: true,  data: { starsEarned: number; score: number; isNewBest: boolean } }
{ success: false, error: string }
```

**Validation rules (Zod):**
- `correctCount + incorrectCount === 10` (exactly one session)
- `timeSpentSecs` between 1 and 600
- `homeworkDate` must be today's date if `homeworkPeriodId` is provided

---

### 3.4 Edge Runtime Compatibility

All math generation logic **must be pure functions** with no Node.js APIs:

| Component | Edge-safe? | Notes |
|---|---|---|
| `mulberry32` seeded RNG (existing) | ✅ Yes | Pure arithmetic, already used |
| `generateMathQuestions()` (existing) | ✅ Yes | Calls mulberry32 only |
| `generateCountingQuestions()` (new) | ✅ Yes | Must use mulberry32, no `Math.random()` |
| `generateShapeQuestions()` (new) | ✅ Yes | Must use mulberry32, no `Math.random()` |
| `saveMathProgressAction` | ✅ Yes | Server Action runs in Node.js runtime, not Edge |
| `requireParentSession()` (auth guard) | ✅ Yes | Already Edge-compatible per TASK-001 fix |

**Rule:** Question generators live in `lib/data/` (safe for both Edge and Node). Prisma calls stay in `server/repositories/` (Node runtime only).

> **Note:** `middleware.ts` runs on Edge. No Prisma calls may be added there. The math action runs in the Node runtime (default for Server Actions in Next.js App Router) and is not affected.

---

### 3.5 Question Generator Signatures

```typescript
// lib/data/countingLevels.ts
interface CountingQuestion {
  objectEmoji: string     // e.g. '⭐'
  count: number           // 1–10
  choices: number[]       // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

function generateCountingQuestions(
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): CountingQuestion[]
```

```typescript
// lib/data/shapeLevels.ts
type ShapeId = 'circle' | 'square' | 'triangle' | 'rectangle' | 'star' | 'heart'

interface ShapeQuestion {
  mode: 'name-to-shape' | 'shape-to-name'
  targetShape: ShapeId
  choices: ShapeId[]      // [correct, distractor1, distractor2] shuffled
  correctIndex: number
}

function generateShapeQuestions(
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): ShapeQuestion[]
```

---

## 4. Quality Assurance — QA Agent

### 4.1 Test File Locations

```
e2e/
  math/
    math-hub.spec.ts          # Hub navigation
    counting-game.spec.ts     # Counting Stars happy path + resilience
    number-ninja.spec.ts      # Number Ninja happy path + resilience
    shape-quest.spec.ts       # Shape Quest happy path + resilience
    math-homework.spec.ts     # Homework tagging + parent dashboard sync
```

### 4.2 Happy Path Test Cases

#### HP-1 — Math Hub renders all 3 games

```
GIVEN  the child is on /math
WHEN   the page loads
THEN   3 game cards are visible with data-testid:
         "game-card-counting"
         "game-card-addition"
         "game-card-shapes"
AND    each card shows a star rating (0 stars initially)
```

#### HP-2 — Complete Counting Stars (Level 1, all correct)

```
GIVEN  the child taps "Counting Stars" → selects Level 1
WHEN   the game starts
THEN   10 questions are presented sequentially
AND    each question shows an emoji array and 3 answer buttons
WHEN   the child taps the correct answer each time
THEN   a green feedback state appears for 600ms
AND    after question 10 the GameResultScreen appears
AND    starsEarned = 3 (100% correct)
AND    score = 300 (10 × 10 × 3)
AND    "New Best!" indicator is shown
```

#### HP-3 — Complete Shape Quest (Level 3, mixed mode)

```
GIVEN  the child taps "Shape Quest" → selects Level 3
WHEN   the game starts
THEN   questions alternate between name-to-shape and shape-to-name modes
AND    the correct shape/name choice is always present in the 3 buttons
WHEN   the child completes all 10 questions
THEN   the result screen shows correct star count
AND    score is saved to MathProgress
```

#### HP-4 — Homework submission flow

```
GIVEN  today has a homework ClassPeriod with subjectId='math' and isHomework=true
AND    the child navigates to /math
THEN   a homework banner is visible with data-testid="homework-banner"
WHEN   the child completes any mini-game
THEN   a "Submit as Homework" button is visible on the result screen
WHEN   the child taps "Submit as Homework"
THEN   HomeworkCompletion.isDone becomes true
AND    the parent dashboard shows ✅ for that period
AND    the homework banner on /math disappears
```

#### HP-5 — Points update on dashboard after game

```
GIVEN  the child completes a game earning 200 points
WHEN   the child navigates back to the dashboard
THEN   the total points displayed increased by 200
```

---

### 4.3 Resilience Test Cases

#### R-1 — Mid-game browser refresh resets to idle (no crash)

```
GIVEN  the child is on question 5 of Counting Stars
WHEN   the browser tab is refreshed (page.reload())
THEN   the /math page loads at the hub (idle state)
AND    no error boundary is triggered
AND    no orphaned MathProgress record is created (session never saved)
```

#### R-2 — Timer expiry auto-advances the question

```
GIVEN  the child is on question 3
WHEN   the 15-second timer elapses with no tap
THEN   the question is recorded as incorrect
AND    the game auto-advances to question 4
AND    the HUD shows correct count unchanged
```

#### R-3 — Rapid tap prevention (INPUT_THROTTLE_MS)

```
GIVEN  the child is on question 2
WHEN   the child taps a correct answer button 3 times within 200ms
THEN   only 1 correct answer is registered
AND    the question does not skip ahead by 3
```

#### R-4 — Network disconnect during score save

```
GIVEN  the child completes a game
AND    the network is offline (page.context().setOffline(true))
WHEN   the result screen calls saveMathProgressAction
THEN   the result screen does not crash
AND    an error state is shown (e.g. "Couldn't save score — try again")
AND    the Replay and Exit buttons remain functional
```

#### R-5 — Homework submit idempotence

```
GIVEN  HomeworkCompletion already exists with isDone=true for today
WHEN   completeMathHomeworkAction is called again for the same periodId + date
THEN   no duplicate record is created (upsert behaviour)
AND    the action returns { success: true }
```

#### R-6 — Game played with no homework period (no banner crash)

```
GIVEN  no ClassPeriod with subjectId='math' and isHomework=true exists for today
WHEN   the child navigates to /math
THEN   no homework banner renders
AND    the result screen shows NO "Submit as Homework" button
```

---

### 4.4 Test Infrastructure Notes

- Use `data-testid` attributes exclusively for selectors — never CSS classes.
- Game question seeding: set a fixed `seed` prop in tests for deterministic question order.
- Timer tests: use `page.clock.install()` and `page.clock.tick()` — **no `sleep()` calls**.
- Homework tests: seed the database with a `ClassPeriod` via a test helper before the spec runs.

---

## 5. Open Questions & Decisions Log

| # | Question | Status | Decision |
|---|---|---|---|
| OQ-1 | Should Counting Stars use a fixed emoji theme or rotate per session? | **Decided** | Rotate per session (controlled by seed) |
| OQ-2 | Should Shape Quest shapes use SVG or emoji? | **Pending PM** | Prefer SVG for crispness at large sizes |
| OQ-3 | Should `GameBestScore` use a `subType` text field or a new model? | **Decided** | `subType` nullable field + updated unique constraint |
| OQ-4 | Should MathProgress be deleted after N days to control DB size? | **Pending PM** | Suggested: keep 90 days, add `createdAt` index |
| OQ-5 | Does the homework banner appear if homework is already completed? | **Decided** | No — banner only shows if `isDone = false` |
| OQ-6 | Should Number Ninja level lock (Level 1 only from hub, or all 3 levels)? | **Pending PM** | Suggested: all 3 levels accessible from hub |

---

*This document is the source of truth for the Math Module. Implementation begins only after PM sign-off.*
