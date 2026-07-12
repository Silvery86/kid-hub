/** Deterministic question generators for the Counting Stars mini-game by difficulty level. */

import type { CountingQuestion, DifficultyLevel } from '../types'
import { createRng } from './rng'

/**
 * Level 1: count 1–5 objects, single emoji theme per question.
 * Level 2: count 1–10 objects, single emoji theme per question.
 * Level 3: count 1–10 objects, mixed emoji types per question.
 */

const OBJECT_EMOJIS = ['⭐', '🍎', '🦆', '🌸', '🐝', '🍭', '🎈', '🐠']

const MAX_COUNT_BY_LEVEL: Record<DifficultyLevel, number> = { 1: 5, 2: 10, 3: 10 }

/**
 * Generates two distractors for a correct count value.
 * Distractors are ±1 or ±2, clamped to [1, maxCount], and distinct from the correct value.
 */
const getDistractors = (correct: number, maxCount: number, rng: () => number): [number, number] => {
  const candidates = [-2, -1, 1, 2]
    .map((o) => correct + o)
    .filter((n) => n >= 1 && n <= maxCount && n !== correct)

  const shuffled = [...candidates].sort(() => rng() - 0.5)
  const d1 = shuffled[0] ?? (correct > 1 ? correct - 1 : correct + 1)
  const d2 =
    shuffled[1] ??
    (d1 !== correct + 1 && correct + 1 <= maxCount ? correct + 1 : correct > 2 ? correct - 2 : 1)

  return [d1, d2]
}

/**
 * Shuffles an array using the provided RNG — returns a new array.
 */
const shuffle = <T>(arr: T[], rng: () => number): T[] =>
  [...arr].sort(() => rng() - 0.5)

/**
 * Generates a seeded set of counting questions for the given level.
 * Level 3 uses a mixed emoji per object slot instead of a single theme.
 */
export const generateCountingQuestions = (
  level: DifficultyLevel,
  count: number,
  seed: number = Date.now()
): CountingQuestion[] => {
  const rng = createRng(seed)
  const maxCount = MAX_COUNT_BY_LEVEL[level]
  const questions: CountingQuestion[] = []

  for (let i = 0; i < count; i++) {
    const objectCount = Math.floor(rng() * maxCount) + 1
    const emoji =
      level === 3
        ? OBJECT_EMOJIS[Math.floor(rng() * OBJECT_EMOJIS.length)]!
        : OBJECT_EMOJIS[i % OBJECT_EMOJIS.length]!

    const [d1, d2] = getDistractors(objectCount, maxCount, rng)
    const shuffledChoices = shuffle([objectCount, d1, d2], rng)
    const correctIndex = shuffledChoices.indexOf(objectCount)

    questions.push({
      id: `counting-${level}-${i}-${seed}`,
      objectEmoji: emoji,
      count: objectCount,
      choices: shuffledChoices,
      correctIndex,
    })
  }

  return questions
}
