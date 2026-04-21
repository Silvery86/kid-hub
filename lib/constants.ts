/** Application-wide constants — schedule, grades, auth, game, and UI configuration values. */

import type { DayOfWeek } from '@/types'

// ── App User ──────────────────────────────────────────────────

/** Fixed ID for the single app user (Khôi). Created via prisma/seed.ts. */
export const DEFAULT_USER_ID = 'khoi-default-user'

// ── Schedule ─────────────────────────────────────────────────

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
] as const

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Thứ Hai',
  tuesday: 'Thứ Ba',
  wednesday: 'Thứ Tư',
  thursday: 'Thứ Năm',
  friday: 'Thứ Sáu',
} as const

// ── Grades ───────────────────────────────────────────────────

export const GRADE_SCALE = {
  EXCELLENT: 9,
  GOOD: 7,
} as const

// ── Parent Mode / Auth ────────────────────────────────────────

export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCKOUT_SECONDS = 60
export const PIN_LENGTH = 4

// ── Games ────────────────────────────────────────────────────

export const GAME_QUESTIONS_PER_SESSION = 10
export const GAME_SECONDS_PER_QUESTION = 10
export const MAX_STARS = 3

// ── UI / Interaction ──────────────────────────────────────────

/** Minimum duration (ms) to disable inputs during feedback animations. */
export const INPUT_THROTTLE_MS = 600

/** Duration (ms) of the PIN shake error animation. */
export const PIN_SHAKE_DURATION_MS = 500

// ── localStorage Keys ─────────────────────────────────────────

export const STORAGE_KEYS = {
  SCHEDULE: 'kid-hub:weekly-schedule',
  GRADES: 'kid-hub:grades',
  USER_PROGRESS: 'kid-hub:user-progress',
  PIN_DATA: 'kid-hub:pin-data',
} as const
