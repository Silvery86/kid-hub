// Cross-platform constants shared by Web + Mobile. Pure primitives only.
// Owner: @kid-hub/shared. apps/web/lib/constants.ts re-exports these.

/** Score thresholds (0–10 scale) used to derive a BadgeTier. */
export const GRADE_SCALE = {
  EXCELLENT: 9,
  GOOD: 7,
} as const

/** Parent PIN length (digits). */
export const PIN_LENGTH = 4

/** Kid unlock-pattern length (taps). */
export const KID_PATTERN_LENGTH = 2

/** Number of questions in one game session. */
export const GAME_QUESTIONS_PER_SESSION = 10

/** Countdown seconds allotted per question. */
export const GAME_SECONDS_PER_QUESTION = 10

/** Per-minigame countdown seconds. Shared so Web + Mobile time questions identically. */
export const COUNTING_SECONDS_PER_QUESTION = 15
export const SHAPE_SECONDS_PER_QUESTION = 12
export const ENGLISH_ALPHABET_SECONDS_PER_QUESTION = 12
export const ENGLISH_WORD_SECONDS_PER_QUESTION = 15

/** Minimum duration (ms) to lock inputs during answer feedback — also the pause
 *  before advancing so the correct/wrong sound and visual feedback are seen. */
export const INPUT_THROTTLE_MS = 1000
