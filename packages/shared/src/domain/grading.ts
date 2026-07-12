// Pure grading rules — isomorphic. Owner of the badge-tier derivation.

import type { BadgeTier } from '../types'
import { GRADE_SCALE } from '../constants'

/** Derive a BadgeTier from a numeric score (0–10). */
export const calculateBadge = (score: number): BadgeTier => {
  if (score >= GRADE_SCALE.EXCELLENT) return 'excellent'
  if (score >= GRADE_SCALE.GOOD) return 'good'
  return 'needs-practice'
}
