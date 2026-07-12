/**
 * Seeded pseudo-random number generator (mulberry32).
 *
 * Using a seed keeps generated questions reproducible within a session but
 * different across sessions. Single source for every game generator so Web and
 * Mobile produce identical sequences for the same seed.
 */
export const createRng = (seed: number): (() => number) => {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
