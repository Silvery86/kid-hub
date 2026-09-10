import { describe, expect, it } from 'vitest'

import {
  canEditDatedEntry,
  canEditRecurringEntry,
  canEditSchoolDay,
  canEditWeek,
  isPastIsoDate,
} from './schedule-locks'

describe('canEditRecurringEntry', () => {
  /**
   * The regression this module exists for. Before Phase 2 the parent screen
   * derived a calendar date for the weekday tab on screen and refused edits when
   * that date had passed — so on a Wednesday, Monday's and Tuesday's tabs read
   * "Đã qua ngày" and rejected both add and delete, for rows governing every
   * future Monday and Tuesday.
   *
   * Phase 6 dated the school periods, but extra classes stayed recurring, so
   * this still holds for them.
   */
  it('never blocks a weekday template, whatever today is', () => {
    expect(canEditRecurringEntry()).toBe(true)
  })
})

describe('canEditWeek', () => {
  const thisWeek = '2026-09-14'

  it('allows the week in progress', () => {
    expect(canEditWeek(thisWeek, thisWeek)).toBe(true)
  })

  it('allows a future week', () => {
    expect(canEditWeek('2026-09-21', thisWeek)).toBe(true)
  })

  it('blocks a week that has finished', () => {
    expect(canEditWeek('2026-09-07', thisWeek)).toBe(false)
  })

  it('does not close the current week partway through it', () => {
    // The whole point of comparing Mondays: on Thursday the 17th, the week
    // starting Monday the 14th is still open. Comparing the Monday to today
    // would have shut it on Tuesday.
    expect(canEditWeek(thisWeek, '2026-09-14')).toBe(true)
  })
})

describe('canEditDatedEntry', () => {
  const today = '2026-09-09'

  it('allows today', () => {
    expect(canEditDatedEntry(today, today)).toBe(true)
  })

  it('allows a future date', () => {
    expect(canEditDatedEntry('2026-09-10', today)).toBe(true)
  })

  it('blocks a past date', () => {
    expect(canEditDatedEntry('2026-09-08', today)).toBe(false)
  })

  it('compares across month and year boundaries', () => {
    expect(canEditDatedEntry('2026-08-31', '2026-09-01')).toBe(false)
    expect(canEditDatedEntry('2027-01-01', '2026-12-31')).toBe(true)
  })
})

describe('isPastIsoDate', () => {
  it('is false for the same day', () => {
    expect(isPastIsoDate('2026-09-09', '2026-09-09')).toBe(false)
  })

  it('orders lexically, which is chronological for zero-padded ISO dates', () => {
    expect(isPastIsoDate('2026-09-02', '2026-09-10')).toBe(true)
  })
})

describe('canEditSchoolDay', () => {
  it('blocks a day earlier in the same week', () => {
    // The regression the PM caught: on Thursday, Monday tiết 4 was still
    // editable because only whole past WEEKS were locked.
    expect(canEditSchoolDay('2026-09-07', '2026-09-10')).toBe(false)
  })

  it('allows today', () => {
    expect(canEditSchoolDay('2026-09-10', '2026-09-10')).toBe(true)
  })

  it('allows the rest of the week', () => {
    expect(canEditSchoolDay('2026-09-11', '2026-09-10')).toBe(true)
  })
})
