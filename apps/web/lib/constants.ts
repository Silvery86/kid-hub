/** Application-wide constants — schedule, grades, auth, game, and UI configuration values. */

// ── Schedule ─────────────────────────────────────────────────

// DAYS_OF_WEEK, SCHOOL_DAYS and DAY_LABELS are owned by @kid-hub/shared
// (MOBILE_UI_IMP.md §7 Phase 1) and re-exported here for existing web imports.
export { DAYS_OF_WEEK, SCHOOL_DAYS, DAY_LABELS } from '@kid-hub/shared'

/** Maximum number of EXTRA_CLASS slots per day (enforced at action + UI layer). */
export const MAX_EVENING_BLOCKS_PER_DAY = 3

// ── Grades ───────────────────────────────────────────────────

// GRADE_SCALE, PIN_LENGTH and KID_PATTERN_LENGTH are owned by @kid-hub/shared
// (Phase 2 — mobile_imp.md §10) and re-exported here for existing web imports.
export {
  GRADE_SCALE,
  PIN_LENGTH,
  KID_PATTERN_LENGTH,
  CURRENT_ACADEMIC_YEAR,
} from '@kid-hub/shared'

// ── Parent Mode / Auth ────────────────────────────────────────

export const MAX_PIN_ATTEMPTS = 5
export const PIN_LOCKOUT_SECONDS = 60
export const MAX_PARENT_LOGIN_ATTEMPTS = 5
export const PARENT_LOGIN_LOCKOUT_SECONDS = 60

export const PARENT_ACCESS_COOKIE = 'parent_access'
export const PARENT_REFRESH_COOKIE = 'parent_refresh'
export const KID_SESSION_COOKIE = 'kid_session'

/**
 * Which student the parent is currently looking at. A UI preference, not an
 * authority: the join table decides what they may actually read. Deliberately
 * kept out of the access token so a revoked link cannot be outlived by a claim.
 */
export const ACTIVE_STUDENT_COOKIE = 'active_student'

/**
 * Proof that the PIN was entered for THIS visit to parent mode.
 *
 * A session cookie with no maxAge, dropped by the middleware the moment the
 * browser touches a kid route. Without it the PIN was only a client-side
 * redirect: parent_refresh survived, middleware minted a fresh access token,
 * and anyone holding the device walked into parent mode.
 */
export const PARENT_PIN_COOKIE = 'parent_pin'

export const PARENT_ACCESS_TTL_SECONDS = 15 * 60
export const PARENT_REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60
export const KID_SESSION_TTL_SECONDS = 12 * 60 * 60

/** Upper bound on one PIN entry. The cookie is normally dropped long before
 *  this, on the first kid route the browser visits. */
export const PARENT_PIN_TTL_SECONDS = 30 * 60

export const KID_PATTERN_SYMBOLS = ['1', '2', '3', '4', '5', '6'] as const
export const MAX_KID_PATTERN_ATTEMPTS = 5
export const KID_PATTERN_LOCKOUT_SECONDS = 30

// ── Games ────────────────────────────────────────────────────

// GAME_QUESTIONS_PER_SESSION and GAME_SECONDS_PER_QUESTION are owned by
// @kid-hub/shared (Phase 3 — mobile_imp.md §10) and re-exported for web imports.
// Game timing (per-question seconds + input throttle) is owned by @kid-hub/shared
// (Phase 6 — mobile_imp.md §10) and re-exported for web imports.
export {
  GAME_QUESTIONS_PER_SESSION,
  GAME_SECONDS_PER_QUESTION,
  COUNTING_SECONDS_PER_QUESTION,
  SHAPE_SECONDS_PER_QUESTION,
  ENGLISH_ALPHABET_SECONDS_PER_QUESTION,
  ENGLISH_WORD_SECONDS_PER_QUESTION,
  INPUT_THROTTLE_MS,
} from '@kid-hub/shared'
export const MAX_STARS = 3

// ── UI / Interaction ──────────────────────────────────────────

/** Duration (ms) of the PIN shake error animation. */
export const PIN_SHAKE_DURATION_MS = 500

// ── localStorage Keys ─────────────────────────────────────────

export const STORAGE_KEYS = {
  SCHEDULE: 'kid-hub:weekly-schedule',
  GRADES: 'kid-hub:grades',
  USER_PROGRESS: 'kid-hub:user-progress',
  PIN_DATA: 'kid-hub:pin-data',
  KID_ACCESS_TOGGLES: 'kid-hub:kid-access-toggles',
} as const
