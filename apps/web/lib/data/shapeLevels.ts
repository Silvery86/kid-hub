/** Deterministic question generators for the Shape Quest mini-game by difficulty level. */

import type { ShapeId, ShapeQuestion, DifficultyLevel } from '@/types'

/**
 * Level 1: 4 shapes (circle, square, triangle, rectangle) — name-to-shape mode only.
 * Level 2: All 6 shapes — name-to-shape mode only.
 * Level 3: All 6 shapes — dual mode (name-to-shape and shape-to-name mixed).
 */

const SHAPES_BY_LEVEL: Record<DifficultyLevel, ShapeId[]> = {
  1: ['circle', 'square', 'triangle', 'rectangle'],
  2: ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'],
  3: ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'],
}

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Keeps questions reproducible within a session but different across sessions.
 */
const createRng = (seed: number) => {
  let s = seed
  return (): number => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Shuffles an array using the provided RNG — returns a new array.
 */
const shuffle = <T>(arr: T[], rng: () => number): T[] =>
  [...arr].sort(() => rng() - 0.5)

/**
 * Picks two distractor shapes from the available pool, excluding the correct one.
 */
const getDistractors = (correct: ShapeId, pool: ShapeId[], rng: () => number): [ShapeId, ShapeId] => {
  const others = shuffle(
    pool.filter((s) => s !== correct),
    rng
  )
  return [others[0]!, others[1]!]
}

/**
 * Generates a seeded set of shape questions for the given level.
 * Level 3 randomly mixes both question modes per question.
 */
export const generateShapeQuestions = (
  level: DifficultyLevel,
  count: number,
  seed: number = Date.now()
): ShapeQuestion[] => {
  const rng = createRng(seed)
  const pool = SHAPES_BY_LEVEL[level]
  const questions: ShapeQuestion[] = []

  for (let i = 0; i < count; i++) {
    const targetShape = pool[Math.floor(rng() * pool.length)]!
    const [d1, d2] = getDistractors(targetShape, pool, rng)
    const shuffledChoices = shuffle([targetShape, d1, d2], rng)
    const correctIndex = shuffledChoices.indexOf(targetShape)
    const mode: ShapeQuestion['mode'] =
      level === 3 && rng() > 0.5 ? 'shape-to-name' : 'name-to-shape'

    questions.push({
      id: `shapes-${level}-${i}-${seed}`,
      mode,
      targetShape,
      choices: shuffledChoices,
      correctIndex,
    })
  }

  return questions
}
