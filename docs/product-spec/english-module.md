# English Module — Feature Plan

> **Version:** 1.0.0 · **Status:** Awaiting PM Approval — Do not implement
> **Authors:** PM · Lead Dev · Designer · QA
> **Route:** `/english` (inside `app/(games)/english/`)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Feature Specification — PM & Designer](#2-feature-specification--pm--designer)
3. [Architectural Design — Lead Dev](#3-architectural-design--lead-dev)
4. [Quality Assurance — QA Agent](#4-quality-assurance--qa-agent)
5. [Open Questions & Decisions Log](#5-open-questions--decisions-log)

---

## 1. Executive Summary

The `/english` route is the second core educational feature of Kid Hub, targeting Trọng Khôi (age 5, Kindergarten). It replaces the current flat single-game `EnglishGame.tsx` component with a **three-mini-game hub**, each covering a distinct early English curriculum domain: letter recognition, vocabulary, and phonics awareness. Sessions can be tagged as homework, reporting completion back to the Parent Dashboard via the existing `HomeworkCompletion` model.

**Approved Mini-Games:**

| # | Name | Domain | Status |
|---|---|---|---|
| 1 | 🔤 Alphabet Explorer | Uppercase ↔ Lowercase Letter Recognition | Refactor of existing letter-match |
| 2 | 🦁 Word Safari | Emoji Vocabulary — Image ↔ Word Matching | Refactor of existing picture-word |
| 3 | 🔊 Sound Hunt | Phonics — First-Letter Sound Recognition | New |

---

## 2. Feature Specification — PM & Designer

### 2.1 Curriculum Scope

#### Mini-Game 1 — Alphabet Explorer 🔤

**Goal:** Develop letter recognition fluency — mapping uppercase letters to their lowercase forms and back, covering the full A–Z alphabet.

**Mechanic:**

- Display one large letter (uppercase or lowercase) in the centre of the screen.
- Show **4 answer buttons**, each displaying a candidate letter, from which the child taps the correct match.
- Distractors are visually similar letters (e.g., for `B` → distractors `D`, `P`, `R`).

**Dual Mode (alternates randomly per question within Level 3):**

- **Mode A — Upper → Lower:** Show uppercase `B`, child taps lowercase `b`.
- **Mode B — Lower → Upper:** Show lowercase `b`, child taps uppercase `B`.

**Levels:**

- Level 1: Letters A–M (13 letters) — Mode A only
- Level 2: Letters N–Z (13 letters) — Mode A only
- Level 3: Full A–Z — Dual Mode (A + B mixed)

**Session:** 10 questions, 12 seconds per question.

---

#### Mini-Game 2 — Word Safari 🦁

**Goal:** Build basic English vocabulary (50-word bank) by matching emoji images to their written words and vice versa.

**Mechanic (Dual Mode):**

- **Mode A — Image → Word:** Display a large emoji in the centre. Show 3 word choices as buttons. Tap the correct word.
- **Mode B — Word → Image:** Display a word in large text. Show 3 emoji buttons. Tap the matching image.

**Themes:**

- Theme 1 — Animals: cat, dog, fish, bird, frog, duck, bear, lion, cow, pig (10 words)
- Theme 2 — Fruits: apple, banana, mango, melon, lemon, grape, peach, plum, kiwi, egg (10 words)
- Theme 3 — Vehicles & Others: car, bus, boat, bike, train, plane, ball, kite, drum, doll (10 words)

**Levels:**

- Level 1: Animals only (Theme 1, 10 words) — Mode A only
- Level 2: Animals + Fruits (Themes 1–2, 20 words) — Dual Mode
- Level 3: Full 50-word bank — Dual Mode, 4 choices per question

**Session:** 10 questions, 15 seconds per question.

---

#### Mini-Game 3 — Sound Hunt 🔊

**Goal:** Develop phonemic awareness — identify which word starts with a given letter sound.

**Mechanic:**

- Display a large letter in the centre with a phoneme hint label (e.g., `C` with label `"/k/ sound"`).
- Show **3 emoji images** as answer buttons.
- The child taps the emoji whose word starts with that letter sound.

**Phoneme Groupings:**

- Group 1 — Clear consonants: B, D, F, G, H, L, M, N, P, R, S, T, V, Z
- Group 2 — Tricky consonants: C (/k/), J, K, Q (/kw/), W, X (/ks/), Y
- Group 3 — Short vowels: A (/æ/ as in apple), E (/ɛ/ as in egg), I (/ɪ/ as in igloo), O (/ɒ/ as in orange), U (/ʌ/ as in umbrella)

**Levels:**

- Level 1: Group 1 consonants only — 3 choices per question
- Level 2: Groups 1 + 2 — 3 choices, includes tricky consonants
- Level 3: All 3 groups — 4 choices per question, includes short vowels

**Session:** 10 questions, 15 seconds per question.

**Audio (Phase plan):**

- **Phase 1 (this plan):** Text-only phoneme hint label — no audio files required.
- **Phase 2 (future):** Audio pronunciation button per question. Out of scope for this plan.

---

### 2.2 UX/UI — Kid-First Design

#### Hub Layout (`/english` page)

- Full-screen page using `bg-shell-kid` background token.
- Three game cards in a single column (mobile) or 3-column row (tablet+).
- Each card uses the existing `GameEntryCard` component.
- Subject colour stripe for all English game cards: `bg-english` (`--color-english: #10b981`).

#### Feedback States

| Event | Visual | Token |
|---|---|---|
| Correct answer | Green flash + ✅ icon + audio | `btn-secondary` (`#34d399`) |
| Wrong answer | Red shake + ❌ icon + audio | `bg-red-400` (semantic: `--color-vietnamese` `#ef4444`) |
| Timer ≤ 3 seconds | Timer amber + pulse animation | `color-progress-low` (`#fb923c`) |
| 3-star result | Confetti + trophy emoji | `color-star-filled` (`#fbbf24`) |

---

### 2.3 Homework Integration

#### Concept

A parent can schedule an English `ClassPeriod` with `isHomework: true`. When the child opens the `/english` hub on a homework day, a 🏠 **"This is Homework!"** banner appears above the game cards.

#### Homework Completion State Machine

```
Homework pending (isDone: false)
  └─► Child plays any English mini-game
        └─► Result screen shows "Submit as Homework"
              └─► On tap → isDone: true, doneAt set
                    └─► Dashboard shows ✅ for that period
                    └─► Homework banner disappears from /english hub
```

---

## 3. Architectural Design — Lead Dev

### 3.1 Logic Flow

```
/english Page (Server Component)
  │
  ├─► Fetch today's active homework via service (server-side)
  │     server/services/homework.service.ts
  │       └─► server/repositories/homework.repository.ts
  │
  └─► Render EnglishHub (Client Component)
        │
        ├─► GameEntryCard × 3 (presentational)
        │
        └─► On game completion:
              useEnglishSession (hook)
                └─► saveEnglishProgressAction (Server Action)
                      └─► english.service.ts
                            └─► english.repository.ts (Prisma)
```

### 3.2 Layer Responsibilities

| Layer | File | Responsibility |
|---|---|---|
| Page | `app/(games)/english/page.tsx` | Fetch today's homework, render hub |
| Hub Component | `components/games/EnglishHub.tsx` | Orchestrate 3-game selection, show homework banner |
| Game Components | `AlphabetGame.tsx`, `WordSafariGame.tsx`, `SoundHuntGame.tsx` | Individual game UIs |
| Question Generators | `lib/data/englishLevels.ts` | Extended with 3 new generators |
| Hook | `hooks/useEnglishSession.ts` | Wraps `useGameSession`, calls `saveEnglishProgressAction` |
| Action | `server/actions/english.actions.ts` | Zod validation, calls service |
| Service | `server/services/english.service.ts` | Business rules: score calc, homework link |
| Repository | `server/repositories/english.repository.ts` | Prisma queries — `EnglishProgress`, `GameBestScore`, `HomeworkCompletion` |

### 3.3 Data Persistence — Proposed Schema Changes

#### New Enum: `EnglishGameType`

```prisma
enum EnglishGameType {
  alphabet
  vocabulary
  phonics
}
```

#### New Model: `EnglishProgress`

```prisma
model EnglishProgress {
  id               String          @id @default(cuid())
  userId           String
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  minigame         EnglishGameType // alphabet | vocabulary | phonics
  level            Int             // 1, 2, or 3
  correctCount     Int
  incorrectCount   Int
  timeSpentSecs    Int
  starsEarned      Int             // 1–3, derived from correctCount / totalQuestions
  score            Int             // correctCount × 10 × starsEarned
  homeworkPeriodId String?         // FK to ClassPeriod
  homeworkDate     String?         // "YYYY-MM-DD"
  completedAt      DateTime        @default(now())

  @@index([userId, completedAt])
  @@index([userId, homeworkPeriodId])
  @@map("english_progress")
}
```

### 3.4 Server Action Contract

```typescript
interface SaveEnglishProgressInput {
  minigame: 'alphabet' | 'vocabulary' | 'phonics'
  level: 1 | 2 | 3
  correctCount: number       // 0–10
  incorrectCount: number     // 0–10
  timeSpentSecs: number      // > 0
  homeworkPeriodId?: string
  homeworkDate?: string      // "YYYY-MM-DD" — required if homeworkPeriodId set
}

// Returns:
// { success: true,  data: { starsEarned: number; score: number; isNewBest: boolean } }
// { success: false, error: string }
```

### 3.5 Question Generator Signatures

```typescript
// lib/data/englishLevels.ts — new additions

interface AlphabetQuestion {
  id: string
  type: 'upper-to-lower' | 'lower-to-upper'
  prompt: string       // The displayed letter
  choices: string[]    // 4 letters (correct + 3 distractors), shuffled
  correctAnswer: string
}

function generateAlphabetQuestions(level: 1 | 2 | 3, count: number, seed: number): AlphabetQuestion[]

interface WordSafariQuestion {
  id: string
  type: 'image-to-word' | 'word-to-image'
  prompt: string        // Emoji (Mode A) or word text (Mode B)
  choices: string[]     // 3–4 items shuffled
  correctAnswer: string
  theme: 'animals' | 'fruits' | 'other'
}

function generateWordSafariQuestions(level: 1 | 2 | 3, count: number, seed: number): WordSafariQuestion[]

interface SoundHuntQuestion {
  id: string
  type: 'sound-hunt'
  targetLetter: string   // e.g. 'C'
  phonemeHint: string    // e.g. '/k/ sound'
  choices: string[]      // 3–4 emoji strings, shuffled
  correctAnswer: string
  correctWord: string    // The word (e.g. 'cat') — for test assertion
}

function generateSoundHuntQuestions(level: 1 | 2 | 3, count: number, seed: number): SoundHuntQuestion[]
```

---

## 4. Quality Assurance — QA Agent

### 4.1 Test File Locations

```
e2e/
  english/
    english-hub.spec.ts
    alphabet-game.spec.ts
    word-safari.spec.ts
    sound-hunt.spec.ts
    english-homework.spec.ts
```

### 4.2 Happy Path Test Cases

#### HP-1 — English Hub renders all 3 games

```
GIVEN  the child is on /english
WHEN   the page loads
THEN   3 game cards are visible with data-testid:
         "game-card-alphabet"
         "game-card-vocabulary"
         "game-card-phonics"
AND    no homework banner is visible (no active homework period)
```

#### HP-2 — Complete Alphabet Explorer (Level 1, all correct)

```
GIVEN  the child taps "Alphabet Explorer" → selects Level 1
WHEN   the child taps the correct lowercase letter each time
THEN   after question 10 the GameResultScreen appears
AND    starsEarned = 3 (100% correct)
AND    score = 300 (10 × 10 × 3)
AND    "New Best!" indicator is shown
```

#### HP-5 — Homework submission flow

```
GIVEN  today has a homework ClassPeriod with subjectId='english' and isHomework=true
AND    the child navigates to /english
THEN   a homework banner is visible with data-testid="homework-banner"
WHEN   the child completes any English mini-game and taps "Submit as Homework"
THEN   HomeworkCompletion.isDone becomes true in the database
AND    navigating back to /english shows no homework banner
```

### 4.3 Resilience Test Cases

#### R-2 — Timer expiry auto-advances the question

```
GIVEN  the child is on question 3 of Sound Hunt (15-second timer)
WHEN   the timer elapses with no tap (page.clock.tick(15_000))
THEN   the question is recorded as incorrect
AND    the game auto-advances to question 4
```

#### R-4 — Network disconnect during score save

```
GIVEN  the child completes an Alphabet Explorer game
AND    the network is offline (page.context().setOffline(true))
WHEN   the result screen calls saveEnglishProgressAction
THEN   the result screen does not crash
AND    an error state is shown (e.g. "Couldn't save score — try again")
```

#### R-5 — Homework submit idempotence

```
GIVEN  a HomeworkCompletion already exists with isDone=true for today's english period
WHEN   completeEnglishHomeworkAction is called again for the same periodId + date
THEN   no duplicate HomeworkCompletion record is created (upsert behaviour)
AND    the action returns { success: true }
```

### 4.4 Test Infrastructure Notes

- Use `data-testid` attributes exclusively — never CSS classes or text selectors.
- Seed all question generators with a fixed `seed` prop in tests for deterministic question order.
- Timer tests: use `page.clock.install()` and `page.clock.tick()` — **no `sleep()` calls**.

---

## 5. Open Questions & Decisions Log

| # | Question | Status | Decision |
|---|---|---|---|
| OQ-1 | Should the existing `EnglishGame.tsx` be deleted or kept as a deprecated fallback? | **Pending PM** | Suggested: delete after `EnglishHub.tsx` is live and tested |
| OQ-3 | Should Level 3 of Word Safari use 4 choices (harder) or 3 choices (consistent)? | **Pending PM** | Proposed: 4 choices for Level 3 to increase challenge |
| OQ-4 | Should Sound Hunt display the phoneme hint as text, or use an audio button from day 1? | **Pending PM** | Proposed: text-only for Phase 1 (no audio infra), audio in Phase 2 |
| OQ-5 | Should existing English rows in `game_best_scores` (subType=NULL) be migrated? | **Pending PM** | Proposed: migrate to subType='vocabulary' |
| OQ-6 | Should `EnglishProgress` be deleted after N days to control DB size? | **Pending PM** | Suggested: match MathProgress policy (90 days) |
| OQ-8 | Should the Sound Hunt phoneme hint label be bilingual (English + Vietnamese)? | **Pending PM** | Proposed: bilingual (e.g., `/k/ — "c" trong từ "cat"`) |

---

*This document is the source of truth for the English Module. Implementation begins only after PM sign-off.*
