/**
 * Pure motion maths — safe on client and server, and the only part of the
 * motion foundation that unit tests can reach.
 *
 * The hooks in hooks/animation/ own React state and timers; everything that can
 * be a plain function lives here instead, so it is testable without a renderer.
 * Values that are design decisions (durations, easings, stagger steps) belong in
 * tokens.json, not here — this file only computes with them.
 */

/** Stagger steps, mirroring `motion.stagger` in tokens.json. */
export const STAGGER_TIGHT = 40
export const STAGGER_BASE = 60
export const STAGGER_LOOSE = 80

/** Durations in ms, mirroring `motion.duration` in tokens.json. */
export const DURATION_INSTANT = 100
export const DURATION_FAST = 150
export const DURATION_BASE = 200
export const DURATION_SLOW = 300
export const DURATION_SLOWER = 400
export const DURATION_CELEBRATE = 700

/**
 * Delay in ms for the item at `index` of a staggered group.
 *
 * Capped so a long list does not end with items arriving seconds after the
 * first: past `maxSteps` every remaining item shares the last delay. A 40-row
 * table should feel like one entrance, not a queue.
 */
export const staggerDelay = (index: number, step = STAGGER_BASE, maxSteps = 8): number => {
  if (!Number.isFinite(index) || index <= 0) return 0
  return Math.min(index, maxSteps) * step
}

/** Delays for a whole group, in order. */
export const staggerDelays = (count: number, step = STAGGER_BASE, maxSteps = 8): number[] =>
  Array.from({ length: Math.max(0, Math.floor(count)) }, (_, i) => staggerDelay(i, step, maxSteps))

/** Standard decelerating curve for JS-driven counts — matches `--ease-decelerate`. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)

/** Clamp a raw elapsed/duration ratio into 0..1, tolerating a zero duration. */
export const progressOf = (elapsedMs: number, durationMs: number): number => {
  if (durationMs <= 0) return 1
  if (!Number.isFinite(elapsedMs) || elapsedMs <= 0) return 0
  return Math.min(elapsedMs / durationMs, 1)
}

/**
 * The value to show partway through a count-up.
 *
 * Rounds toward the target so the final frame lands exactly on it — a count-up
 * that stops at 47 of 48 reads as a bug, and floating point makes that likely
 * if the caller rounds naively.
 */
export const countUpValue = (from: number, to: number, progress: number): number => {
  if (progress >= 1) return to
  return Math.round(from + (to - from) * easeOutCubic(progress))
}

/**
 * Distance to travel for a sliding indicator, as a CSS transform.
 *
 * `count` is the number of equal slots; `index` which one is active. Returned as
 * a percentage of the indicator's own width, so the caller needs no measurement.
 */
export const indicatorOffset = (index: number, count: number): string => {
  if (count <= 0) return 'translateX(0%)'
  const clamped = Math.min(Math.max(index, 0), count - 1)
  return `translateX(${clamped * 100}%)`
}
