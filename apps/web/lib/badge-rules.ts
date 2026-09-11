/**
 * Which badges a milestone earns — pure, so the rule can be asserted.
 *
 * The service owns the database round-trips; the decision of *which* ids a given
 * streak crosses, given what is already earned, is arithmetic and belongs where
 * a test can reach it. This is the rule that was silently wrong on the kid
 * homework path for as long as it existed, so it is worth pinning down.
 */

/** Streak lengths that earn a badge, ascending. */
export const STREAK_MILESTONES: readonly { days: number; badgeId: string }[] = [
  { days: 3, badgeId: 'streak-3' },
  { days: 7, badgeId: 'streak-7' },
]

/**
 * Badge ids a streak of `currentStreak` days has reached and not yet earned.
 *
 * Crossing two milestones at once is possible — a streak restored from a
 * backfill, or a child returning after the count was corrected — so this returns
 * every milestone reached rather than only the highest.
 */
export const streakBadgesFor = (
  currentStreak: number,
  alreadyEarned: readonly string[]
): string[] =>
  STREAK_MILESTONES.filter(
    (m) => currentStreak >= m.days && !alreadyEarned.includes(m.badgeId)
  ).map((m) => m.badgeId)
