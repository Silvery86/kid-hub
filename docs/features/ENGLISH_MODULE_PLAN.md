# English Module — Feature Plan

**Version:** 1.0.0  
**Status:** Awaiting PM Approval — Do not implement  
**Authors:** PM · Lead Dev · Designer · QA  
**Route:** `/english` (inside `app/(games)/english/`)

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

**Key architectural change:** The current `EnglishGame.tsx` (flat, single-entry) is replaced by `EnglishHub.tsx` (hub) + three dedicated game components. The existing question generators in `lib/data/englishLevels.ts` are preserved and extended.

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

**Existing reuse:** The letter-match concept from `generateLetterMatchQuestions()` in `lib/data/englishLevels.ts` is the starting point. A new generator `generateAlphabetQuestions()` will replace it with proper uppercase/lowercase pairing logic.

---

#### Mini-Game 2 — Word Safari 🦁

**Goal:** Build basic English vocabulary (50-word bank) by matching emoji images to their written words and vice versa.

**Mechanic (Dual Mode — alternates randomly per question in Level 2+):**
- **Mode A — Image → Word:** Display a large emoji in the centre. Show 3 word choices as buttons. Tap the correct word.
- **Mode B — Word → Image:** Display a word in large text. Show 3 emoji buttons. Tap the matching image.

**Themes (grouped for progressive difficulty):**
- Theme 1 — Animals: cat, dog, fish, bird, frog, duck, bear, lion, cow, pig (10 words)
- Theme 2 — Fruits: apple, banana, mango, melon, lemon, grape, peach, plum, kiwi, egg (10 words)
- Theme 3 — Vehicles & Others: car, bus, boat, bike, train, plane, ball, kite, drum, doll (10 words)

**Levels:**
- Level 1: Animals only (Theme 1, 10 words) — Mode A only
- Level 2: Animals + Fruits (Themes 1–2, 20 words) — Dual Mode
- Level 3: Full 50-word bank — Dual Mode, 4 choices per question (1 correct + 3 distractors)

**Session:** 10 questions, 15 seconds per question (reading takes longer than counting).

**Existing reuse:** `generatePictureWordQuestions()` handles Mode A. A new generator `generateWordSafariQuestions()` extends it with Mode B (word → image) and theme filtering.

---

#### Mini-Game 3 — Sound Hunt 🔊

**Goal:** Develop phonemic awareness — identify which word starts with a given letter sound, a foundational pre-reading skill.

**Mechanic:**
- Display a large letter in the centre with a phoneme hint label (e.g., `C` with label `"/k/ sound"`).
- Show **3 emoji images** as answer buttons.
- The child taps the emoji whose word starts with that letter sound.
- Distractors are words starting with visually/audibly similar letters (e.g., for `C` → distractors `dog 🐶`, `ball ⚽` but not `kite 🪁` which also has /k/).

**Phoneme groupings:**
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
- **Phase 2 (future):** Audio pronunciation button per question, calling `public/audio/english/phonics/<letter>.mp3`. A new `usePhonicsAudio` hook wraps the Web Audio API. Phase 2 is out of scope for this plan and requires a separate approval.

**Net-new generator:** `generateSoundHuntQuestions()` in `lib/data/englishLevels.ts`.

---

### 2.2 UX/UI — Kid-First Design

#### Hub Layout (`/english` page)

- Full-screen page using `bg-shell-kid` background token.
- Three game cards in a single column (mobile) or 3-column row (tablet+).
- Each card uses the existing `GameEntryCard` component with game icon, name, and best score badge.
- A "Back to Dashboard" button at the top-left using `KidButton` variant `ghost`.
- Subject colour stripe for all English game cards: `bg-english` (`--color-english: #10b981`).

#### Game Card Design

Each `GameEntryCard` displays:
- Large emoji icon (min 48px): 🔤 / 🦁 / 🔊
- Game name in `font-sans` bold, min `text-2xl`
- Star rating for best score (`StarRating` component, 0 stars initially)
- Subject colour stripe: `bg-english`

#### In-Game UI

All three games share the existing `GameHud` component (correct count, question index, timer countdown). No changes to `GameHud` are required.

**Answer button tap targets:**
- Minimum `spacing-tap` (3rem / 48px) height for text-only buttons
- Minimum `spacing-tap-lg` (4rem / 64px) for emoji image buttons (Mode B of Word Safari, Sound Hunt)
- `rounded-pill` border radius

**Letter / word display (non-button):**
- Minimum `text-8xl` font size for the primary stimulus letter or word
- `font-sans` extrabold weight
- High contrast: white text on `bg-slate-700` card (matching existing `EnglishGame.tsx` prompt style)

#### Feedback States (semantic tokens)

| Event | Visual | Token |
|---|---|---|
| Correct answer | Green flash + ✅ icon + audio | `btn-secondary` (`#34d399`) |
| Wrong answer | Red shake + ❌ icon + audio | `bg-red-400` (semantic: `--color-vietnamese` `#ef4444`) |
| Timer ≤ 3 seconds | Timer amber + pulse animation | `color-progress-low` (`#fb923c`) |
| 3-star result | Confetti + trophy emoji | `color-star-filled` (`#fbbf24`) |

All feedback uses the existing `useAudio` hook (`correct`, `wrong`, `complete` sounds).

---

### 2.3 Homework Integration

#### Concept

A parent can schedule an English `ClassPeriod` with `isHomework: true`. When the child opens the `/english` hub on a homework day, a 🏠 **"This is Homework!"** banner appears above the game cards. The child plays any English mini-game normally. On the result screen, a **"Submit as Homework"** button appears.

#### Flow

1. Parent schedules a `ClassPeriod` with `subjectId = 'english'` and `isHomework = true` for a given day.
2. On that day, the `/english` hub page server-side-fetches active homework periods for `subjectId = 'english'` and today's date.
3. If a pending period exists (`isDone: false`), the hub renders the homework banner with `homeworkNote`.
4. On game completion, a **"Submit as Homework"** button appears on the result screen.
5. Tapping it calls `completeEnglishHomeworkAction`, which:
   - Creates / upserts a `HomeworkCompletion` record (`isDone: true`, `doneAt: now()`).
   - Creates an `EnglishProgress` record with `homeworkPeriodId` set.
6. The Parent Dashboard already renders `HomeworkCompletion` records — no new parent UI needed.

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
        │     data-testid: "game-card-alphabet" | "game-card-vocabulary" | "game-card-phonics"
        │
        └─► On game completion:
              useEnglishSession (hook)
                └─► saveEnglishProgressAction (Server Action)
                      └─► english.service.ts
                            └─► english.repository.ts (Prisma)
```

**Layer responsibilities:**

| Layer | File | Responsibility |
|---|---|---|
| Page | `app/(games)/english/page.tsx` | Fetch today's homework, render hub (replaces current `<EnglishGame />`) |
| Hub Component | `components/games/EnglishHub.tsx` | Orchestrate 3-game selection, show homework banner |
| Game Components | `components/games/AlphabetGame.tsx`, `WordSafariGame.tsx`, `SoundHuntGame.tsx` | Individual game UIs, call `useEnglishSession` on finish |
| Question Generators | `lib/data/englishLevels.ts` | Extended with `generateAlphabetQuestions()`, `generateWordSafariQuestions()`, `generateSoundHuntQuestions()` |
| Hook | `hooks/useEnglishSession.ts` | Wraps `useGameSession`, calls `saveEnglishProgressAction` on finish |
| Action | `server/actions/english.actions.ts` | Zod validation, `requireParentSession` auth guard, calls service |
| Service | `server/services/english.service.ts` | Business rules: score calc, homework link, best score update |
| Repository | `server/repositories/english.repository.ts` | Prisma queries — `EnglishProgress`, `GameBestScore`, `HomeworkCompletion` |

**Migration of existing code:**

| Existing | Disposition |
|---|---|
| `components/games/EnglishGame.tsx` | Replaced by `EnglishHub.tsx` + `AlphabetGame.tsx` + `WordSafariGame.tsx` |
| `lib/data/englishLevels.ts` | Extended in-place; existing generators kept for backward-compat, new generators added |
| `app/(games)/english/page.tsx` | Updated to import `EnglishHub` instead of `EnglishGame` |

---

### 3.2 Data Persistence — Proposed Schema Changes

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
/// Records a single completed English mini-game session.
model EnglishProgress {
  id               String          @id @default(cuid())
  userId           String
  user             User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  minigame         EnglishGameType // alphabet | vocabulary | phonics
  level            Int             // 1, 2, or 3
  correctCount     Int
  incorrectCount   Int
  timeSpentSecs    Int             // Total wall-clock seconds for the session
  starsEarned      Int             // 1–3, derived from correctCount / totalQuestions
  score            Int             // correctCount × 10 × starsEarned
  homeworkPeriodId String?         // FK to ClassPeriod — set when submitted as homework
  homeworkDate     String?         // "YYYY-MM-DD" — required if homeworkPeriodId set
  completedAt      DateTime        @default(now())

  @@index([userId, completedAt])
  @@index([userId, homeworkPeriodId])
  @@map("english_progress")
}
```

#### Schema Changes to Existing Models

**`User` model — add relation:**

```prisma
model User {
  // ... existing fields ...
  englishProgress EnglishProgress[]
}
```

**`GameBestScore.subType` — extend existing field:**

The `subType String?` field already exists with values `"counting" | "addition" | "shapes"` (null previously for English). After this change, English subTypes use `"alphabet" | "vocabulary" | "phonics"`. The existing unique constraint `@@unique([userProgressId, gameType, level, subType])` already handles this — no migration needed for the constraint itself.

> **Migration note:** Existing English rows in `game_best_scores` (if any) have `subType = NULL`. These represent the old flat single-game scores. They should be migrated to `subType = 'vocabulary'` (closest semantic match to the old picture-word game) in the migration script.

#### Neon / Serverless Edge Compatibility

`EnglishProgress` uses only standard Postgres types and Prisma CUID. No JSON columns, no arrays, no large text blobs. The model is structurally identical to `MathProgress` — it is confirmed safe for Neon's serverless Postgres and the Prisma driver adapter (`driverAdapters` preview feature already enabled in `schema.prisma`).

---

### 3.3 Server Action Contract

```typescript
// server/actions/english.actions.ts

interface SaveEnglishProgressInput {
  minigame: 'alphabet' | 'vocabulary' | 'phonics'
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
- `correctCount + incorrectCount === 10` (exactly one complete session)
- `timeSpentSecs` between 1 and 600
- `homeworkDate` must equal today's date (ISO) if `homeworkPeriodId` is provided

**Auth:** `requireParentSession` is NOT called here — this action is called by the child (no PIN). The `userId` is derived from the kid session cookie. Consistent with `MathProgress` pattern.

---

### 3.4 Edge Runtime Compatibility

All English question generators **must be pure functions** with no Node.js APIs:

| Component | Edge-safe? | Notes |
|---|---|---|
| Existing `createRng()` (in `englishLevels.ts`) | ✅ Yes | Pure arithmetic mulberry32-style |
| `generateAlphabetQuestions()` (new) | ✅ Yes | Must use `createRng`, no `Math.random()` |
| `generateWordSafariQuestions()` (new) | ✅ Yes | Must use `createRng`, no `Math.random()` |
| `generateSoundHuntQuestions()` (new) | ✅ Yes | Must use `createRng`, no `Math.random()` |
| `saveEnglishProgressAction` | ✅ Yes | Server Action runs in Node.js runtime, not Edge |
| `requireParentSession()` (auth guard — parent actions only) | ✅ Yes | Already Edge-compatible per TASK-001 fix |

**Rule:** Question generators live in `lib/data/englishLevels.ts` (safe for both Edge and Node). Prisma calls stay in `server/repositories/english.repository.ts` (Node runtime only). No Prisma calls in `middleware.ts`.

---

### 3.5 Question Generator Signatures

```typescript
// lib/data/englishLevels.ts — new additions

// ── Game 1: Alphabet Explorer ──────────────────────────────────

interface AlphabetQuestion {
  id: string
  type: 'upper-to-lower' | 'lower-to-upper'
  prompt: string       // The displayed letter (uppercase or lowercase)
  choices: string[]    // 4 letters (correct + 3 distractors), shuffled
  correctAnswer: string
}

function generateAlphabetQuestions(
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): AlphabetQuestion[]

// ── Game 2: Word Safari ────────────────────────────────────────

interface WordSafariQuestion {
  id: string
  type: 'image-to-word' | 'word-to-image'
  prompt: string        // Emoji (Mode A) or word text (Mode B)
  choices: string[]     // 3–4 items (words for Mode A, emojis for Mode B), shuffled
  correctAnswer: string
  theme: 'animals' | 'fruits' | 'other'
}

function generateWordSafariQuestions(
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): WordSafariQuestion[]

// ── Game 3: Sound Hunt ─────────────────────────────────────────

interface SoundHuntQuestion {
  id: string
  type: 'sound-hunt'
  targetLetter: string   // e.g. 'C'
  phonemeHint: string    // e.g. '/k/ sound'
  choices: string[]      // 3–4 emoji strings, shuffled
  correctAnswer: string  // The emoji whose word starts with targetLetter
  correctWord: string    // The word (e.g. 'cat') — for test assertion
}

function generateSoundHuntQuestions(
  level: 1 | 2 | 3,
  count: number,
  seed: number,
): SoundHuntQuestion[]
```

---

### 3.6 Media Asset Plan

#### Phase 1 (this plan) — Emoji Only

All visuals use Unicode emoji from the existing `WORD_BANK`. No image files, no audio files. The phoneme hint in Sound Hunt is a text string (`"/k/ sound"`). This eliminates all asset hosting concerns and keeps the route deployable immediately after implementation approval.

#### Phase 2 (future — out of scope for this plan)

| Asset Type | Format | Location | Volume |
|---|---|---|---|
| Phonics audio (letter sounds) | `.mp3` + `.ogg` | `public/audio/english/phonics/<letter>.<ext>` | 26 files × 2 = 52 |
| Word pronunciation audio | `.mp3` + `.ogg` | `public/audio/english/words/<word>.<ext>` | 50 files × 2 = 100 |

Phase 2 also requires:
- A `usePhonicsAudio` hook (wraps Web Audio API, separate from `useAudio`)
- Audio fallback: if file 404s, hide the play button silently (no error thrown)
- Audio file source: to be decided (record locally, or use a TTS API) — requires separate PM approval

---

## 4. Quality Assurance — QA Agent

### 4.1 Test File Locations

```
e2e/
  english/
    english-hub.spec.ts          # Hub navigation and card rendering
    alphabet-game.spec.ts        # Alphabet Explorer happy path + resilience
    word-safari.spec.ts          # Word Safari happy path + resilience
    sound-hunt.spec.ts           # Sound Hunt happy path + resilience
    english-homework.spec.ts     # Homework tagging + parent dashboard sync
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
AND    each card shows a star rating (0 stars initially)
AND    no homework banner is visible (no active homework period)
```

#### HP-2 — Complete Alphabet Explorer (Level 1, all correct)

```
GIVEN  the child taps "Alphabet Explorer" → selects Level 1
WHEN   the game starts
THEN   10 questions are presented sequentially
AND    each question shows a large uppercase letter and 4 lowercase answer buttons
WHEN   the child taps the correct lowercase letter each time
THEN   a green feedback state appears for INPUT_THROTTLE_MS
AND    after question 10 the GameResultScreen appears
AND    starsEarned = 3 (100% correct)
AND    score = 300 (10 × 10 × 3)
AND    "New Best!" indicator is shown
```

#### HP-3 — Complete Word Safari (Level 2, dual mode)

```
GIVEN  the child taps "Word Safari" → selects Level 2
WHEN   the game starts
THEN   questions alternate between image-to-word and word-to-image modes
AND    the correct choice is always present among the 3 buttons
WHEN   the child completes all 10 questions
THEN   the result screen shows correct star count
AND    EnglishProgress record is saved to the database
AND    GameBestScore is updated for gameType='english', subType='vocabulary', level=2
```

#### HP-4 — Complete Sound Hunt (Level 1, all correct)

```
GIVEN  the child taps "Sound Hunt" → selects Level 1
WHEN   the game starts
THEN   10 questions are presented
AND    each question shows a letter, its phoneme hint text, and 3 emoji choices
WHEN   the child taps the emoji whose word starts with the displayed letter
THEN   green feedback appears
AND    after question 10 the result screen appears with correct star count
```

#### HP-5 — Homework submission flow

```
GIVEN  today has a homework ClassPeriod with subjectId='english' and isHomework=true
AND    the child navigates to /english
THEN   a homework banner is visible with data-testid="homework-banner"
WHEN   the child completes any English mini-game
THEN   a "Submit as Homework" button is visible with data-testid="submit-homework-btn"
WHEN   the child taps "Submit as Homework"
THEN   HomeworkCompletion.isDone becomes true in the database
AND    the parent dashboard shows ✅ for that period
AND    navigating back to /english shows no homework banner
```

#### HP-6 — Points update on dashboard after game

```
GIVEN  the child completes Word Safari Level 1 earning 150 points
WHEN   the child navigates back to the dashboard
THEN   UserProgress.totalPoints increased by 150
AND    the dashboard point display reflects the new total
```

---

### 4.3 Resilience Test Cases

#### R-1 — Mid-game browser refresh resets to hub (no crash)

```
GIVEN  the child is on question 5 of Alphabet Explorer
WHEN   the browser tab is refreshed (page.reload())
THEN   the /english page loads at the hub (idle state)
AND    no error boundary is triggered
AND    no orphaned EnglishProgress record is created
```

#### R-2 — Timer expiry auto-advances the question

```
GIVEN  the child is on question 3 of Sound Hunt (15-second timer)
WHEN   the timer elapses with no tap (page.clock.tick(15_000))
THEN   the question is recorded as incorrect
AND    the game auto-advances to question 4
AND    the HUD correct count is unchanged
```

#### R-3 — Rapid tap prevention (INPUT_THROTTLE_MS)

```
GIVEN  the child is on question 2 of Word Safari
WHEN   the child taps a correct answer button 3 times within 200ms
THEN   only 1 correct answer is registered
AND    the question does not advance 3 times
```

#### R-4 — Network disconnect during score save

```
GIVEN  the child completes an Alphabet Explorer game
AND    the network is offline (page.context().setOffline(true))
WHEN   the result screen calls saveEnglishProgressAction
THEN   the result screen does not crash or throw an unhandled error
AND    an error state is shown (e.g. "Couldn't save score — try again")
AND    the Replay and Exit buttons remain functional
```

#### R-5 — Homework submit idempotence

```
GIVEN  a HomeworkCompletion already exists with isDone=true for today's english period
WHEN   completeEnglishHomeworkAction is called again for the same periodId + date
THEN   no duplicate HomeworkCompletion record is created (upsert behaviour)
AND    the action returns { success: true }
```

#### R-6 — Game played with no active homework (no banner, no crash)

```
GIVEN  no ClassPeriod with subjectId='english' and isHomework=true exists for today
WHEN   the child navigates to /english
THEN   no homework banner renders (data-testid="homework-banner" is absent)
AND    the result screen shows NO "Submit as Homework" button
```

#### R-7 — Missing audio file in Phase 2 (graceful degradation)

```
GIVEN  Phase 2 audio is enabled
AND    the audio file for letter 'Q' is missing (public/audio/english/phonics/q.mp3 → 404)
WHEN   a Sound Hunt question displays letter 'Q'
THEN   the phonics play button is hidden (not shown as broken)
AND    the question is still answerable via visual-only phoneme hint
AND    no console error is thrown
```

> Note: R-7 is a Phase 2 test. It is documented here for completeness but should not be implemented until Phase 2 audio is approved.

---

### 4.4 Test Infrastructure Notes

- Use `data-testid` attributes exclusively — never CSS classes or text selectors.
- Seed all question generators with a fixed `seed` prop in tests for deterministic question order.
- Timer tests: use `page.clock.install()` and `page.clock.tick()` — **no `sleep()` calls**.
- Homework tests: seed the database with a `ClassPeriod` via a shared test helper before the spec.
- Best score assertions: query the database directly (via test helper) to verify `GameBestScore` records — do not rely on UI text alone.

---

## 5. Open Questions & Decisions Log

| # | Question | Status | Decision |
|---|---|---|---|
| OQ-1 | Should the existing `EnglishGame.tsx` be deleted or kept as a deprecated fallback? | **Pending PM** | Suggested: delete after `EnglishHub.tsx` is live and tested |
| OQ-2 | Should `generateLetterMatchQuestions()` and `generatePictureWordQuestions()` be kept alongside new generators, or removed? | **Pending PM** | Suggested: remove after migration — their callers in `EnglishGame.tsx` will be deleted |
| OQ-3 | Should Level 3 of Word Safari use 4 choices (harder) or 3 choices (consistent with other games)? | **Pending PM** | Proposed: 4 choices for Level 3 to increase challenge |
| OQ-4 | Should Sound Hunt display the phoneme hint as text, or use an audio button from day 1? | **Pending PM** | Proposed: text-only for Phase 1 (no audio infra), audio in Phase 2 |
| OQ-5 | Should existing English rows in `game_best_scores` (subType=NULL) be migrated? | **Pending PM** | Proposed: migrate to subType='vocabulary'; if no existing rows, migration is a no-op |
| OQ-6 | Should `EnglishProgress` be deleted after N days to control DB size? | **Pending PM** | Suggested: match MathProgress policy (90 days), add cron job in Phase 2 |
| OQ-7 | Alphabet Explorer Level 3 uses dual mode — should uppercase display be coloured differently from lowercase for visual clarity? | **Pending PM** | Proposed: uppercase in `bg-english` accent, lowercase in `bg-slate-700` |
| OQ-8 | Should the Sound Hunt phoneme hint label be in English only, or bilingual (English + Vietnamese)? | **Pending PM** | Proposed: bilingual (e.g., `/k/ — "c" trong từ "cat"`) to support Trọng Khôi's Vietnamese context |

---

*This document is the source of truth for the English Module. Implementation begins only after PM sign-off.*
