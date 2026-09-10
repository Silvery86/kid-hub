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
 * CLAUDE.md has listed this constant under "Key Constants" and forbidden a
 * hard-coded year literal for a while, but it had never actually been created —
 * the literal was hard-coded at each call site instead. Added here rather than
 * in apps/web because the mobile grades manager needs the same value.
 *
 * Rolled to 2026–2027 on 2026-09-10 to match the printed timetable and the
 * seed. It is part of SubjectGrade's unique key, so changing it makes the next
 * save of a subject create a SECOND row rather than updating the existing one —
 * existing grades were migrated in the same change. Rolling it again needs the
 * same treatment; see docs/SCHEDULE_PARENT_IMP.md §13.7.
 */
export const CURRENT_ACADEMIC_YEAR = '2026-2027'

/**
 * Where the two Vietnamese school terms end, as "MM-DD".
 *
 * Assumption A3 (docs/SCHEDULE_PARENT_IMP.md §12.4), not a fact: the exact dates
 * are set per province each year. They exist so "copy this week to the end of
 * the semester" has an end, and the copy dialog prints the resulting date before
 * writing anything, so a parent at a school that finishes elsewhere can see the
 * assumption rather than discover it.
 */
export const FIRST_TERM_END_MMDD = '01-15'
export const SECOND_TERM_END_MMDD = '05-31'

/**
 * The school's wall clock.
 *
 * Server-side this cannot be inferred: Vercel runs in UTC, so `new Date()` on
 * the server is seven hours behind the classroom. Any rule that compares the
 * time of day — like the period edit window — has to resolve "now" in this zone
 * on BOTH sides or the grid and the Server Action will disagree about whether a
 * lesson has started.
 */
export const SCHOOL_TIME_ZONE = 'Asia/Ho_Chi_Minh'

/**
 * How long after a lesson starts it stays editable.
 *
 * Set by the PM: a tiết is being taught 15 minutes in, so the timetable for it
 * is a record rather than a plan.
 */
export const PERIOD_EDIT_GRACE_MINUTES = 15

/** Ceiling on one copy-forward, so a single click cannot write an unbounded number of rows. */
export const MAX_COPY_WEEKS = 40

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
