import { describe, it, expect } from 'vitest'
import { calculateStars, calculatePointsEarned } from './scoring'

describe('calculateStars', () => {
  it('awards 3 stars at ≥90%', () => {
    expect(calculateStars(10, 10)).toBe(3)
    expect(calculateStars(9, 10)).toBe(3)
  })
  it('awards 2 stars at 60–89%', () => {
    expect(calculateStars(8, 10)).toBe(2)
    expect(calculateStars(6, 10)).toBe(2)
  })
  it('awards 1 star below 60%', () => {
    expect(calculateStars(5, 10)).toBe(1)
    expect(calculateStars(0, 10)).toBe(1)
  })
  it('treats a zero total as 1 star (no divide-by-zero)', () => {
    expect(calculateStars(0, 0)).toBe(1)
  })
})

describe('calculatePointsEarned', () => {
  it('awards 10 per correct answer, multiplied by stars', () => {
    expect(calculatePointsEarned(5, 2)).toBe(100)
    expect(calculatePointsEarned(3, 1)).toBe(30)
  })
  it('caps at 300', () => {
    expect(calculatePointsEarned(10, 3)).toBe(300)
  })
  it('never goes negative', () => {
    expect(calculatePointsEarned(0, 1)).toBe(0)
  })
})
