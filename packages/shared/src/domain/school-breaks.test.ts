/**
 * These rules decide whether a child is shown a school day or a holiday, so a
 * wrong boundary here shows lessons on Tết or blanks a normal Monday. The
 * inclusive ends and the summer-wins rule are the two things most likely to
 * drift, so both are pinned.
 */
import { describe, expect, it } from 'vitest'

import {
  breakLengthInDays,
  breaksInWeek,
  coversDate,
  findBreakForDate,
  isDayOff,
  isWholeWeekOff,
  pendingPromotion,
  schoolDatesOfWeek,
  upcomingBreaks,
  weekAfterBreak,
} from './school-breaks'
import type { SchoolBreak } from '../types'

const tet: SchoolBreak = {
  id: 'tet',
  kind: 'PUBLIC_HOLIDAY',
  label: 'Tết Nguyên Đán',
  startDate: '2027-02-03',
  endDate: '2027-02-11',
}

const nationalDay: SchoolBreak = {
  id: 'quoc-khanh',
  kind: 'PUBLIC_HOLIDAY',
  label: 'Quốc khánh 2/9',
  startDate: '2027-09-02',
  endDate: '2027-09-02',
}

const summer: SchoolBreak = {
  id: 'he-2027',
  kind: 'SUMMER_BREAK',
  label: 'Nghỉ hè lên lớp 2',
  startDate: '2027-06-01',
  endDate: '2027-09-04',
}

describe('coversDate', () => {
  it('includes both ends', () => {
    expect(coversDate(tet, '2027-02-03')).toBe(true)
    expect(coversDate(tet, '2027-02-11')).toBe(true)
  })

  it('excludes the days either side', () => {
    expect(coversDate(tet, '2027-02-02')).toBe(false)
    expect(coversDate(tet, '2027-02-12')).toBe(false)
  })

  it('handles a single-day holiday', () => {
    expect(coversDate(nationalDay, '2027-09-02')).toBe(true)
    expect(coversDate(nationalDay, '2027-09-03')).toBe(false)
  })
})

describe('findBreakForDate', () => {
  it('returns null on an ordinary school day', () => {
    expect(findBreakForDate([tet, summer], '2027-03-15')).toBeNull()
  })

  it('lets summer win over a holiday inside it', () => {
    // 2/9 falls inside nghỉ hè. Reporting "Quốc khánh" would imply school runs
    // on the 1st and the 3rd, which it does not.
    const found = findBreakForDate([nationalDay, summer], '2027-09-02')
    expect(found?.kind).toBe('SUMMER_BREAK')
    expect(found?.label).toBe('Nghỉ hè lên lớp 2')
  })

  it('finds the holiday when no summer covers the date', () => {
    expect(findBreakForDate([nationalDay, summer], '2027-02-05')).toBeNull()
    expect(findBreakForDate([tet, summer], '2027-02-05')?.id).toBe('tet')
  })
})

describe('isDayOff', () => {
  it('is false when nothing covers the date', () => {
    expect(isDayOff([tet, summer], '2026-11-03')).toBe(false)
  })

  it('is true anywhere inside a break', () => {
    expect(isDayOff([summer], '2027-07-20')).toBe(true)
  })

  it('is false with no breaks at all', () => {
    expect(isDayOff([], '2027-02-05')).toBe(false)
  })
})

describe('schoolDatesOfWeek', () => {
  it('returns Monday to Friday only — no weekend', () => {
    expect(schoolDatesOfWeek('2026-09-07')).toEqual([
      '2026-09-07',
      '2026-09-08',
      '2026-09-09',
      '2026-09-10',
      '2026-09-11',
    ])
  })
})

describe('breaksInWeek', () => {
  it('finds a break covering only part of the week', () => {
    // 30/4/2027 is a Friday; the week is otherwise taught.
    const apr30: SchoolBreak = {
      id: 'apr30',
      kind: 'PUBLIC_HOLIDAY',
      label: 'Ngày Giải phóng 30/4',
      startDate: '2027-04-30',
      endDate: '2027-04-30',
    }
    expect(breaksInWeek([apr30], '2027-04-26').map((b) => b.id)).toEqual(['apr30'])
  })

  it('reports a break once, not once per day it covers', () => {
    expect(breaksInWeek([tet], '2027-02-08')).toHaveLength(1)
  })

  it('is empty for a fully taught week', () => {
    expect(breaksInWeek([tet, summer], '2026-11-02')).toEqual([])
  })
})

describe('isWholeWeekOff', () => {
  it('is true when every school day is covered', () => {
    // Mon 8 – Fri 12 Feb 2027. The shipped Tết ends Thursday the 11th, so it
    // takes one more day to close the week.
    expect(isWholeWeekOff([{ ...tet, endDate: '2027-02-12' }], '2027-02-08')).toBe(true)
  })

  it('is false when even one school day is taught', () => {
    // The shipped Tết ends Thursday 11 Feb, so Friday the 12th is back to
    // school and the week is not off — this is the real 2027 case.
    expect(isWholeWeekOff([tet], '2027-02-08')).toBe(false)
  })

  it('ignores the weekend — a Mon–Fri break is a whole week off', () => {
    const weekdaysOnly: SchoolBreak = {
      id: 'w',
      kind: 'PUBLIC_HOLIDAY',
      label: 'Nghỉ bão',
      startDate: '2026-11-02',
      endDate: '2026-11-06',
    }
    expect(isWholeWeekOff([weekdaysOnly], '2026-11-02')).toBe(true)
  })
})

describe('breakLengthInDays', () => {
  it('counts a single day as one, not zero', () => {
    expect(breakLengthInDays(nationalDay)).toBe(1)
  })

  it('counts both ends of a range', () => {
    expect(breakLengthInDays(tet)).toBe(9)
  })

  it('measures a summer in months, not days', () => {
    expect(breakLengthInDays(summer)).toBe(96)
  })
})

describe('upcomingBreaks', () => {
  it('drops breaks that have already finished', () => {
    expect(upcomingBreaks([tet, summer], '2027-03-01').map((b) => b.id)).toEqual(['he-2027'])
  })

  it('keeps a break that is running right now', () => {
    expect(upcomingBreaks([summer], '2027-07-01').map((b) => b.id)).toEqual(['he-2027'])
  })

  it('orders soonest first', () => {
    expect(upcomingBreaks([summer, tet], '2027-01-01').map((b) => b.id)).toEqual([
      'tet',
      'he-2027',
    ])
  })
})

describe('weekAfterBreak', () => {
  it('gives the Monday school resumes on', () => {
    // Summer ends Saturday 4 Sep 2027; classes resume Monday 6 Sep.
    expect(weekAfterBreak(summer)).toBe('2027-09-06')
  })

  it('handles a break ending on a Sunday', () => {
    expect(weekAfterBreak({ ...tet, endDate: '2027-02-07' })).toBe('2027-02-08')
  })
})

describe('pendingPromotion', () => {
  const summerToGrade2: SchoolBreak = {
    id: 'he-2027',
    kind: 'SUMMER_BREAK',
    label: 'Nghỉ hè lên lớp 2',
    startDate: '2027-06-01',
    endDate: '2027-09-04',
    promotesToGrade: 2,
  }

  it('asks once the break has ended', () => {
    expect(pendingPromotion([summerToGrade2], '2027-09-06')?.id).toBe('he-2027')
  })

  it('stays quiet while the child is still on holiday', () => {
    // On the last day of the break the child has not gone back yet.
    expect(pendingPromotion([summerToGrade2], '2027-09-04')).toBeNull()
    expect(pendingPromotion([summerToGrade2], '2027-07-01')).toBeNull()
  })

  it('stops asking once the parent has confirmed', () => {
    const done = { ...summerToGrade2, promotedAt: '2027-09-06T02:00:00.000Z' }
    expect(pendingPromotion([done], '2027-09-20')).toBeNull()
  })

  it('ignores a summer break with no target grade', () => {
    // Entered only to block out lessons — the parent never said anything about
    // grades, so we must not invent a promotion for them.
    const { promotesToGrade: _omitted, ...noTarget } = summerToGrade2
    expect(pendingPromotion([noTarget], '2027-09-06')).toBeNull()
  })

  it('ignores public holidays entirely', () => {
    expect(pendingPromotion([{ ...tet, promotesToGrade: 2 }], '2027-06-01')).toBeNull()
  })

  it('offers the most recently ended break when two are outstanding', () => {
    const older: SchoolBreak = {
      ...summerToGrade2,
      id: 'he-2026',
      endDate: '2026-09-04',
      promotesToGrade: 1,
    }
    expect(pendingPromotion([older, summerToGrade2], '2027-09-06')?.id).toBe('he-2027')
  })

  it('allows a repeated year — same grade in, same grade out', () => {
    const repeat = { ...summerToGrade2, promotesToGrade: 1, label: 'Nghỉ hè (học lại lớp 1)' }
    expect(pendingPromotion([repeat], '2027-09-06')?.promotesToGrade).toBe(1)
  })
})
