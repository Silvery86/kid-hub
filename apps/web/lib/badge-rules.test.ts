import { describe, it, expect } from 'vitest'
import { streakBadgesFor, STREAK_MILESTONES } from './badge-rules'

describe('streakBadgesFor', () => {
  it('earns nothing below the first milestone', () => {
    expect(streakBadgesFor(0, [])).toEqual([])
    expect(streakBadgesFor(2, [])).toEqual([])
  })

  it('earns streak-3 on the third day', () => {
    expect(streakBadgesFor(3, [])).toEqual(['streak-3'])
  })

  it('does not re-earn what is already held', () => {
    expect(streakBadgesFor(3, ['streak-3'])).toEqual([])
    expect(streakBadgesFor(7, ['streak-3'])).toEqual(['streak-7'])
  })

  it('returns every milestone crossed, not just the highest', () => {
    // A streak that jumps — a corrected count, or a backfill — must not swallow
    // the badge it passed through on the way.
    expect(streakBadgesFor(7, [])).toEqual(['streak-3', 'streak-7'])
  })

  it('keeps earning nothing once both are held', () => {
    expect(streakBadgesFor(30, ['streak-3', 'streak-7'])).toEqual([])
  })

  it('returns milestones in ascending order', () => {
    const earned = streakBadgesFor(100, [])
    expect(earned).toEqual(STREAK_MILESTONES.map((m) => m.badgeId))
  })
})
