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
