import 'server-only'

import {
  getEarnedBadgeIds,
  awardBadge,
  getTotalGameCount,
} from '@/server/repositories/progress.repository'
import { streakBadgesFor } from '@/lib/badge-rules'
import { getById } from '@/server/repositories/student.repository'
import { notifyBadgeEarned } from '@/server/services/notification.service'

/**
 * Badge rules.
 *
 * These used to return void, which is why a child could earn a badge and never
 * be told: the reward existed in the database and nothing downstream could know
 * it had just happened. They now return the ids awarded *by this call* — an
 * empty array when nothing changed — so an action can carry them back and the
 * app can celebrate the moment rather than leaving it to be discovered later on
 * the badges page.
 *
 * "By this call" is the important part. Re-earning is not a thing; only the
 * transition from not-earned to earned is worth a celebration, and awardBadge
 * reports exactly that.
 *
 * The same transition also notifies the child's parents, so the overlay a child
 * sees and the row an adult reads can never disagree about what happened.
 */

/**
 * Tell every adult with access. Never throws into the caller: a notification
 * that fails to write must not undo a badge that was legitimately earned.
 */
const announce = async (studentId: string, badgeIds: string[]): Promise<void> => {
  if (badgeIds.length === 0) return
  try {
    const student = await getById(studentId)
    if (!student) return
    await Promise.all(badgeIds.map((id) => notifyBadgeEarned(studentId, student.name, id)))
  } catch {
    // Swallowed on purpose — see above.
  }
}

/** Awards the 'game-win' badge on the first ever completed game session. */
export const checkAndAwardGameWinBadge = async (studentId: string): Promise<string[]> => {
  const earned = await getEarnedBadgeIds(studentId)
  if (earned.includes('game-win')) return []
  const count = await getTotalGameCount(studentId)
  if (count < 1) return []
  if (!(await awardBadge(studentId, 'game-win'))) return []
  await announce(studentId, ['game-win'])
  return ['game-win']
}

/** Awards the 'first-login' badge after the first kid session unlock. */
export const checkAndAwardFirstLoginBadge = async (studentId: string): Promise<string[]> => {
  const earned = await getEarnedBadgeIds(studentId)
  if (earned.includes('first-login')) return []
  if (!(await awardBadge(studentId, 'first-login'))) return []
  await announce(studentId, ['first-login'])
  return ['first-login']
}

/**
 * Checks streak milestones and awards what the streak has reached.
 *
 * Which ids those are is decided by lib/badge-rules.ts, where it can be tested;
 * this only does the writes and reports what actually landed.
 */
export const checkAndAwardStreakBadges = async (
  studentId: string,
  currentStreak: number
): Promise<string[]> => {
  const earned = await getEarnedBadgeIds(studentId)
  const due = streakBadgesFor(currentStreak, earned)
  if (due.length === 0) return []

  const awarded: string[] = []
  for (const badgeId of due) {
    if (await awardBadge(studentId, badgeId)) awarded.push(badgeId)
  }
  await announce(studentId, awarded)
  return awarded
}
