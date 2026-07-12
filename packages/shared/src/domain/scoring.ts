/**
 * Pure scoring rules — isomorphic. Owner of stars/points derivation, shared by
 * the game session (Web + Mobile) and the server persistence services.
 */

/** Stars (1–3) from correct answers out of the session total. */
export const calculateStars = (correctCount: number, total: number): 1 | 2 | 3 => {
  const pct = total === 0 ? 0 : Math.round((correctCount / total) * 100)
  if (pct >= 90) return 3
  if (pct >= 60) return 2
  return 1
}

/** Points awarded: 10 per correct answer, multiplied by stars, capped at 300. */
export const calculatePointsEarned = (correctCount: number, stars: 1 | 2 | 3): number =>
  Math.max(0, Math.min(300, correctCount * 10 * stars))
