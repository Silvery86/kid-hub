import { describe, expect, it } from 'vitest'

import { mixWithWhite } from './color'

describe('mixWithWhite', () => {
  it('returns the source colour unchanged at 100%', () => {
    expect(mixWithWhite('#3b82f6', 100)).toBe('#3b82f6')
    expect(mixWithWhite('#10b981', 100)).toBe('#10b981')
  })

  it('returns white at 0%', () => {
    expect(mixWithWhite('#3b82f6', 0)).toBe('#ffffff')
  })

  it('matches the schedule-soft design token', () => {
    // tokens.json defines schedule-soft as #eff6ff — the designer's 8% tint of the
    // schedule blue. Reproducing it exactly confirms the OKLab blend matches what
    // CSS color-mix(in oklab, ...) produces on web.
    expect(mixWithWhite('#3b82f6', 8)).toBe('#eff6ff')
  })

  it('reproduces the tints used by the web subject tiles', () => {
    // The 15% blend behind GradeCard / HomeworkItemRow / SubjectIcon.
    expect(mixWithWhite('#3b82f6', 15)).toBe('#e1edff') // math
    expect(mixWithWhite('#ef4444', 15)).toBe('#ffe6e2') // vietnamese
    expect(mixWithWhite('#10b981', 15)).toBe('#e3f5eb') // english
    expect(mixWithWhite('#8b5cf6', 15)).toBe('#ece8ff') // science
  })

  it('gets lighter as the source weight drops', () => {
    const strong = mixWithWhite('#3b82f6', 60)
    const weak = mixWithWhite('#3b82f6', 15)
    expect(strong).not.toBe(weak)
    // Compare the red channel: a paler tint sits closer to white.
    expect(parseInt(weak.slice(1, 3), 16)).toBeGreaterThan(parseInt(strong.slice(1, 3), 16))
  })

  it('accepts shorthand and unprefixed hex', () => {
    expect(mixWithWhite('#f00', 100)).toBe('#ff0000')
    expect(mixWithWhite('3b82f6', 15)).toBe('#e1edff')
  })

  it('clamps percentages outside 0–100', () => {
    expect(mixWithWhite('#3b82f6', 150)).toBe('#3b82f6')
    expect(mixWithWhite('#3b82f6', -20)).toBe('#ffffff')
  })

  it('falls back to white for unparseable input', () => {
    expect(mixWithWhite('nope', 15)).toBe('#ffffff')
    expect(mixWithWhite('', 15)).toBe('#ffffff')
  })
})
