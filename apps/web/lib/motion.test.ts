import { describe, it, expect } from 'vitest'
import {
  staggerDelay,
  staggerDelays,
  easeOutCubic,
  progressOf,
  countUpValue,
  indicatorOffset,
  STAGGER_BASE,
} from './motion'

describe('staggerDelay', () => {
  it('gives the first item no delay', () => {
    expect(staggerDelay(0)).toBe(0)
  })

  it('steps by the stagger token', () => {
    expect(staggerDelay(1)).toBe(STAGGER_BASE)
    expect(staggerDelay(3)).toBe(STAGGER_BASE * 3)
  })

  it('caps long lists so the tail does not trail seconds behind', () => {
    expect(staggerDelay(40, STAGGER_BASE, 8)).toBe(STAGGER_BASE * 8)
    expect(staggerDelay(9, STAGGER_BASE, 8)).toBe(staggerDelay(8, STAGGER_BASE, 8))
  })

  it('treats a negative or non-finite index as the first item', () => {
    expect(staggerDelay(-2)).toBe(0)
    expect(staggerDelay(Number.NaN)).toBe(0)
  })
})

describe('staggerDelays', () => {
  it('returns one delay per item, in order', () => {
    expect(staggerDelays(3, 50)).toEqual([0, 50, 100])
  })

  it('returns nothing for an empty group', () => {
    expect(staggerDelays(0)).toEqual([])
    expect(staggerDelays(-5)).toEqual([])
  })
})

describe('progressOf', () => {
  it('clamps to 0..1', () => {
    expect(progressOf(-10, 200)).toBe(0)
    expect(progressOf(400, 200)).toBe(1)
    expect(progressOf(100, 200)).toBe(0.5)
  })

  it('reports complete when the duration is zero, rather than dividing by it', () => {
    expect(progressOf(0, 0)).toBe(1)
  })
})

describe('easeOutCubic', () => {
  it('runs from 0 to 1', () => {
    expect(easeOutCubic(0)).toBe(0)
    expect(easeOutCubic(1)).toBe(1)
  })

  it('decelerates — past halfway before half the time', () => {
    expect(easeOutCubic(0.5)).toBeGreaterThan(0.5)
  })
})

describe('countUpValue', () => {
  it('lands exactly on the target', () => {
    expect(countUpValue(0, 48, 1)).toBe(48)
    expect(countUpValue(0, 48, 1.4)).toBe(48)
  })

  it('starts at the origin', () => {
    expect(countUpValue(0, 48, 0)).toBe(0)
  })

  it('counts down as readily as up', () => {
    expect(countUpValue(10, 0, 1)).toBe(0)
    const mid = countUpValue(10, 0, 0.5)
    expect(mid).toBeLessThan(10)
    expect(mid).toBeGreaterThan(0)
  })
})

describe('indicatorOffset', () => {
  it('places the indicator on its own slot', () => {
    expect(indicatorOffset(0, 4)).toBe('translateX(0%)')
    expect(indicatorOffset(2, 4)).toBe('translateX(200%)')
  })

  it('clamps an out-of-range index instead of sliding off the bar', () => {
    expect(indicatorOffset(9, 4)).toBe('translateX(300%)')
    expect(indicatorOffset(-3, 4)).toBe('translateX(0%)')
  })

  it('survives an empty nav', () => {
    expect(indicatorOffset(0, 0)).toBe('translateX(0%)')
  })
})
