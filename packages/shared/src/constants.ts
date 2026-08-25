// Cross-platform constants shared by Web + Mobile. Pure primitives only.
// Owner: @kid-hub/shared. apps/web/lib/constants.ts re-exports these.

import type { DayOfWeek } from './types'

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export const SCHOOL_DAYS: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const

/** Vietnamese weekday labels — the display copy for both platforms. */
export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Thứ Hai',
  tuesday: 'Thứ Ba',
  wednesday: 'Thứ Tư',
  thursday: 'Thứ Năm',
  friday: 'Thứ Sáu',
  saturday: 'Thứ Bảy',
  sunday: 'Chủ Nhật',
} as const

/** Score thresholds (0–10 scale) used to derive a BadgeTier. */
export const GRADE_SCALE = {
  EXCELLENT: 9,
  GOOD: 7,
} as const

/** Parent PIN length (digits). */
export const PIN_LENGTH = 4

/** Kid unlock-pattern length (taps). */
export const KID_PATTERN_LENGTH = 2

/**
 * School year every grade is recorded against.
 *
 * CLAUDE.md has listed this constant under "Key Constants" and forbidden the
 * '2025-2026' literal for a while, but it had never actually been created —
 * the literal was hard-coded at each call site instead. Added here rather than
 * in apps/web because the mobile grades manager needs the same value.
 */
export const CURRENT_ACADEMIC_YEAR = '2025-2026'

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
