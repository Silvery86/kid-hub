/**
 * Week maths decides which rows a parent sees and which week a save lands in,
 * so an off-by-one here silently writes into the wrong week. These tests pin
 * the two things most likely to break it: the Sunday boundary and the year
 * boundary.
 */
import { describe, expect, it } from 'vitest'

import {
  addWeeks,
  isIsoDate,
  isPastWeek,
  localIsoDate,
  semesterEndIso,
  weekStartOf,
  weekStartOfToday,
  weeksBetween,
  weekStartsBetween,
} from './school-weeks'

describe('weekStartOf', () => {
  // 2026-09-14 is a Monday.
  it.each([
    ['2026-09-14', 'Monday'],
    ['2026-09-15', 'Tuesday'],
    ['2026-09-18', 'Friday'],
    ['2026-09-19', 'Saturday'],
    ['2026-09-20', 'Sunday'],
  ])('maps %s (%s) back to its Monday', (date) => {
    expect(weekStartOf(date)).toBe('2026-09-14')
  })

  it('treats Sunday as the end of the week, not the start', () => {
    // The ISO convention, and what Postgres date_trunc('week') does — the
    // backfill migration and the app must agree or a week splits in two.
    expect(weekStartOf('2026-09-20')).toBe('2026-09-14')
    expect(weekStartOf('2026-09-21')).toBe('2026-09-21')
  })

  it('crosses a year boundary', () => {
    expect(weekStartOf('2027-01-01')).toBe('2026-12-28')
  })

  it('is idempotent', () => {
    expect(weekStartOf(weekStartOf('2026-09-17'))).toBe('2026-09-14')
  })
})

describe('addWeeks / weeksBetween', () => {
  it('steps forward and back over a month boundary', () => {
    expect(addWeeks('2026-09-28', 1)).toBe('2026-10-05')
    expect(addWeeks('2026-10-05', -1)).toBe('2026-09-28')
  })

  it('crosses February in a leap year without drifting', () => {
    expect(addWeeks('2028-02-21', 2)).toBe('2028-03-06')
  })

  it('counts whole weeks, signed', () => {
    expect(weeksBetween('2026-09-14', '2026-10-12')).toBe(4)
    expect(weeksBetween('2026-10-12', '2026-09-14')).toBe(-4)
    expect(weeksBetween('2026-09-14', '2026-09-14')).toBe(0)
  })
})

describe('weekStartsBetween', () => {
  it('lists the weeks after the source, up to the week containing the end date', () => {
    expect(weekStartsBetween('2026-09-14', '2026-10-08')).toEqual([
      '2026-09-21',
      '2026-09-28',
      '2026-10-05',
    ])
  })

  it('excludes the source week — copying a week onto itself is not a copy', () => {
    expect(weekStartsBetween('2026-09-14', '2026-09-18')).toEqual([])
  })

  it('returns nothing when the end date is already past', () => {
    expect(weekStartsBetween('2026-09-14', '2026-08-01')).toEqual([])
  })

  it('caps the run so one click cannot write an unbounded number of rows', () => {
    expect(weekStartsBetween('2026-09-14', '2030-01-01', 4)).toHaveLength(4)
  })
})

describe('semesterEndIso (assumption A3)', () => {
  it('puts an autumn date in học kỳ I, which ends in the FOLLOWING January', () => {
    expect(semesterEndIso('2026-09-14')).toBe('2027-01-15')
  })

  it('puts a February date in học kỳ II, ending in May', () => {
    expect(semesterEndIso('2027-02-10')).toBe('2027-05-31')
  })

  it('keeps early January in học kỳ I of the same calendar year', () => {
    expect(semesterEndIso('2027-01-05')).toBe('2027-01-15')
  })

  it('rolls a June date into the next học kỳ I', () => {
    // Summer: the next boundary that exists is January of the following year.
    expect(semesterEndIso('2027-06-20')).toBe('2028-01-15')
  })
})

describe('isPastWeek', () => {
  it('compares Mondays, so a week in progress stays editable', () => {
    expect(isPastWeek('2026-09-14', '2026-09-14')).toBe(false)
    expect(isPastWeek('2026-09-07', '2026-09-14')).toBe(true)
    expect(isPastWeek('2026-09-21', '2026-09-14')).toBe(false)
  })
})

describe('localIsoDate / weekStartOfToday', () => {
  it('reads the local calendar day, not the UTC one', () => {
    // 23:30 local on the 14th is already the 15th in UTC for UTC+7. Using
    // toISOString() here would move the parent into the wrong day, and on a
    // Sunday night into the wrong week.
    const lateSunday = new Date(2026, 8, 20, 23, 30)
    expect(localIsoDate(lateSunday)).toBe('2026-09-20')
    expect(weekStartOfToday(lateSunday)).toBe('2026-09-14')
  })
})

describe('isIsoDate', () => {
  it.each(['2026-09-14', '2028-02-29'])('accepts %s', (value) => {
    expect(isIsoDate(value)).toBe(true)
  })

  it.each(['2026-13-01', '2026-02-30', '2026-9-14', 'yesterday', ''])(
    'rejects %j',
    (value) => {
      expect(isIsoDate(value)).toBe(false)
    }
  )
})
