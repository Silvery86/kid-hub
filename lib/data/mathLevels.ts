import type { MathQuestion, DifficultyLevel } from '@/types';

/**
 * Deterministic question generator for the Math mini-game.
 * Level 1: addition/subtraction 1–10
 * Level 2: addition/subtraction 1–20
 * Level 3: addition/subtraction 1–50, including carry/borrow cases
 */

const MAX_BY_LEVEL: Record<DifficultyLevel, number> = { 1: 10, 2: 20, 3: 50 };

/**
 * Generate a wrong answer that is close but clearly distinct.
 * Offset is ±1 or ±2, guaranteed different from the correct answer.
 */
const getWrongAnswer = (correct: number, rng: () => number): number => {
  const offsets = [-2, -1, 1, 2];
  const shuffled = offsets.sort(() => rng() - 0.5);
  for (const offset of shuffled) {
    const candidate = correct + offset;
    if (candidate !== correct && candidate >= 0) return candidate;
  }
  return correct + 3; // Fallback — never equals correct
};

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Using a seed keeps questions reproducible within a session
 * but different across sessions.
 */
const createRng = (seed: number) => {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const generateMathQuestions = (
  level: DifficultyLevel,
  count: number,
  seed: number = Date.now(),
): MathQuestion[] => {
  const rng = createRng(seed);
  const max = MAX_BY_LEVEL[level];
  const questions: MathQuestion[] = [];

  for (let i = 0; i < count; i++) {
    const useSubtraction = level > 1 && rng() > 0.5;
    let a = Math.floor(rng() * (max - 1)) + 1;
    let b = Math.floor(rng() * (max - 1)) + 1;
    const operator: '+' | '-' = useSubtraction ? '-' : '+';

    // Ensure subtraction result is non-negative
    if (operator === '-' && b > a) [a, b] = [b, a];

    // Clamp addition result to max (level 1/2) or 99 (level 3)
    if (operator === '+' && a + b > Math.min(max * 2, 99)) {
      b = Math.floor(rng() * Math.min(a, max / 2)) + 1;
    }

    const correct = operator === '+' ? a + b : a - b;
    const wrong = getWrongAnswer(correct, rng);
    const options: [number, number] = rng() > 0.5 ? [correct, wrong] : [wrong, correct];

    questions.push({
      id: `${level}-${i}-${seed}`,
      operandA: a,
      operandB: b,
      operator,
      correctAnswer: correct,
      options,
    });
  }

  return questions;
};
