/**
 * The queue rules behind the toast store — pure, so they can be tested.
 *
 * Two decisions live here rather than in hooks/useToast.ts, because both are
 * behaviour a reviewer would want asserted rather than taken on trust:
 *
 *  1. How long a toast lives, which differs by tone.
 *  2. What happens when a fourth arrives, which is an eviction, not a stack.
 */

export type ToastTone = 'success' | 'error' | 'info'

/** Three is enough to see a burst; more is a wall nobody reads. */
export const MAX_VISIBLE = 3

export const SUCCESS_MS = 4000
export const INFO_MS = 5000

/**
 * Errors return `null` — they stay until dismissed.
 *
 * A parent who looked away from the screen must still be able to read why the
 * save failed. Success is different: they watched it work.
 */
export const resolveDuration = (
  tone: ToastTone,
  override: number | null | undefined
): number | null => {
  if (override !== undefined) return override
  if (tone === 'success') return SUCCESS_MS
  if (tone === 'info') return INFO_MS
  return null
}

/**
 * Which ids should start leaving once `incoming` has been added.
 *
 * Counts only toasts that are not already on their way out, so a burst does not
 * evict the same toast twice, and returns oldest-first.
 */
export const idsToEvict = <T extends { id: string; leaving: boolean }>(
  list: readonly T[],
  max: number = MAX_VISIBLE
): string[] => {
  const live = list.filter((t) => !t.leaving)
  if (live.length <= max) return []
  return live.slice(0, live.length - max).map((t) => t.id)
}
