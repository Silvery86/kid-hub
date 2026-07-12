import { describe, it, expect } from 'vitest'
import {
  generateMathQuestions,
  generateCountingQuestions,
  generateShapeQuestions,
} from './index'
import {
  generateLetterMatchQuestions,
  generateWordSafariQuestions,
} from './english-levels'

const SEED = 20260712

describe('seeded generators are deterministic (same seed → same questions)', () => {
  it('math: identical for the same seed, different for another', () => {
    expect(generateMathQuestions(2, 10, SEED)).toEqual(generateMathQuestions(2, 10, SEED))
    expect(generateMathQuestions(2, 10, SEED)).not.toEqual(generateMathQuestions(2, 10, SEED + 1))
  })

  it('counting + shape: identical for the same seed', () => {
    expect(generateCountingQuestions(3, 8, SEED)).toEqual(generateCountingQuestions(3, 8, SEED))
    expect(generateShapeQuestions(3, 8, SEED)).toEqual(generateShapeQuestions(3, 8, SEED))
  })

  it('english: identical for the same seed', () => {
    expect(generateLetterMatchQuestions(6, SEED)).toEqual(generateLetterMatchQuestions(6, SEED))
    expect(generateWordSafariQuestions(2, 6, SEED)).toEqual(generateWordSafariQuestions(2, 6, SEED))
  })
})

describe('golden seed sequences (locked against accidental logic changes)', () => {
  it('math level 2', () => {
    expect(generateMathQuestions(2, 10, SEED)).toMatchSnapshot()
  })
  it('counting level 3', () => {
    expect(generateCountingQuestions(3, 10, SEED)).toMatchSnapshot()
  })
  it('shape level 3', () => {
    expect(generateShapeQuestions(3, 10, SEED)).toMatchSnapshot()
  })
})

describe('generator invariants', () => {
  it('math: exactly `count` questions, correct answer is among the two options', () => {
    const qs = generateMathQuestions(3, 10, SEED)
    expect(qs).toHaveLength(10)
    for (const q of qs) {
      expect(q.options).toHaveLength(2)
      expect(q.options).toContain(q.correctAnswer)
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0)
    }
  })

  it('counting: correctIndex points at the true count', () => {
    for (const q of generateCountingQuestions(2, 10, SEED)) {
      expect(q.choices[q.correctIndex]).toBe(q.count)
    }
  })

  it('shape: correctIndex points at the target shape', () => {
    for (const q of generateShapeQuestions(3, 10, SEED)) {
      expect(q.choices[q.correctIndex]).toBe(q.targetShape)
    }
  })
})
