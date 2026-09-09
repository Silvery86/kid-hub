import { describe, expect, it } from 'vitest'

import { findRuleIssues, generateSlots, validateAgainstAnchors } from './bell-schedule'
import { presetForGrade, presetByKey } from '../data/bell-presets'
import type { BellRules, BellSlot, DayOfWeek } from '../types'

const WEEKDAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const MON_TO_THU: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday']

/**
 * The rules the real school published, verbatim
 * (docs/SCHEDULE_PARENT_IMP.md §2.2, Lớp 1A1, NH 2026–2027):
 *
 *   7h50 có mặt, thể dục đầu giờ · 8h10 vào tiết 1 · mỗi tiết 35', chuẩn bị 5'
 *   9h30 ra chơi (15') · 11h tan học buổi sáng · nghỉ trưa 11h–13h30
 *   13h45 vào tiết 5 · 15h ra chơi buổi chiều · 16h–17h hướng dẫn hoàn thành
 */
const LOP_1A1: BellRules = {
  periodMinutes: 35,
  transitionMinutes: 5,
  morning: {
    start: '08:10',
    periods: 4,
    recess: { afterPeriod: 2, start: '09:30', minutes: 15 },
  },
  afternoon: {
    start: '13:45',
    periods: 3,
    recess: { afterPeriod: 6, start: '15:00', minutes: 15 },
  },
  routines: [
    { label: 'Có mặt, thể dục đầu giờ', startTime: '07:50', endTime: '08:10', days: WEEKDAYS },
    { label: 'Ăn trưa & ngủ', startTime: '11:00', endTime: '13:30', days: WEEKDAYS },
    // Friday dismisses at 16:00 because it has no guided hour — the only
    // per-day difference in the whole week, and it is data, not a special case.
    { label: 'Hướng dẫn hoàn thành kiến thức', startTime: '16:00', endTime: '17:00', days: MON_TO_THU },
  ],
}

const periods = (slots: BellSlot[]) => slots.filter((s) => s.kind === 'PERIOD')
const at = (slots: BellSlot[], n: number) => periods(slots).find((s) => s.periodNumber === n)

describe('generateSlots — the Lớp 1A1 golden case', () => {
  const slots = generateSlots(LOP_1A1)

  /**
   * The whole argument for asking parents for rules instead of times: eight
   * numbers reproduce the school's day exactly. If this table ever drifts, the
   * generator is wrong — not the table.
   */
  it.each([
    [1, '08:10', '08:45'],
    [2, '08:50', '09:25'],
    [3, '09:45', '10:20'],
    [4, '10:25', '11:00'],
    [5, '13:45', '14:20'],
    [6, '14:25', '15:00'],
    [7, '15:15', '15:50'],
  ])('tiết %i runs %s – %s', (n, start, end) => {
    expect(at(slots, n)).toMatchObject({ startTime: start, endTime: end })
  })

  it('numbers periods across the day, not per session', () => {
    expect(periods(slots).map((s) => s.periodNumber)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('places both recesses on the clock times the school published', () => {
    const breaks = slots.filter((s) => s.kind === 'BREAK')
    expect(breaks).toHaveLength(2)
    expect(breaks[0]).toMatchObject({ startTime: '09:30', endTime: '09:45', label: 'Ra chơi' })
    expect(breaks[1]).toMatchObject({ startTime: '15:00', endTime: '15:15', label: 'Ra chơi' })
  })

  it('keeps the non-lesson day, which is most of a first grader’s day', () => {
    const routines = slots.filter((s) => s.kind === 'ROUTINE').map((s) => s.label)
    expect(routines).toEqual([
      'Có mặt, thể dục đầu giờ',
      'Ăn trưa & ngủ',
      'Hướng dẫn hoàn thành kiến thức',
    ])
  })

  it('returns the day in chronological order', () => {
    const starts = slots.map((s) => s.startTime)
    expect(starts).toEqual([...starts].sort())
  })

  it('marks everything generated, so nothing looks hand-edited yet', () => {
    expect(slots.every((s) => s.isGenerated)).toBe(true)
  })
})

describe('the anchor jump', () => {
  /**
   * The morning leaves 5' between tiết 2 (ends 09:25) and ra chơi (09:30); the
   * afternoon leaves none — tiết 6 ends 15:00 and ra chơi starts 15:00. One
   * rule set covers both only because a recess is an absolute anchor rather
   * than an offset. This is the test that fails if anyone "simplifies" it.
   */
  it('absorbs different slack in each session', () => {
    const slots = generateSlots(LOP_1A1)
    expect(at(slots, 2)!.endTime).toBe('09:25')
    expect(slots.filter((s) => s.kind === 'BREAK')[0]!.startTime).toBe('09:30')

    expect(at(slots, 6)!.endTime).toBe('15:00')
    expect(slots.filter((s) => s.kind === 'BREAK')[1]!.startTime).toBe('15:00')
  })

  it('resumes the next period from the end of the recess', () => {
    const slots = generateSlots(LOP_1A1)
    expect(at(slots, 3)!.startTime).toBe('09:45')
    expect(at(slots, 7)!.startTime).toBe('15:15')
  })
})

describe('validateAgainstAnchors', () => {
  const slots = generateSlots(LOP_1A1)

  it('passes every anchor the school published', () => {
    expect(
      validateAgainstAnchors(slots, LOP_1A1, {
        morningEnd: '11:00',
        afternoonEnd: '15:50',
        dismissal: { monday: '17:00', friday: '16:00' },
      })
    ).toEqual([])
  })

  it('derives each day’s end from days alone', () => {
    // Friday's last slot is tiết 7 (15:50) because the guided hour excludes it;
    // Monday runs to 17:00 because it does not. No special-casing in the
    // generator — the difference is entirely BellSlot.days.
    const friday = slots.filter((s) => s.days.includes('friday'))
    const monday = slots.filter((s) => s.days.includes('monday'))
    expect(friday.map((s) => s.endTime).sort().at(-1)).toBe('15:50')
    expect(monday.map((s) => s.endTime).sort().at(-1)).toBe('17:00')
  })

  it('treats dismissal as an overrun check, not an equality', () => {
    // Friday ends 15:50 against a stated 16:00 — the ten minutes are packing up.
    expect(validateAgainstAnchors(slots, LOP_1A1, { dismissal: { friday: '16:00' } })).toEqual([])
    // Monday ending 17:00 against a stated 16:30 would mean a rule is wrong.
    const overrun = validateAgainstAnchors(slots, LOP_1A1, { dismissal: { monday: '16:30' } })
    expect(overrun).toHaveLength(1)
    expect(overrun[0]).toMatchObject({ actual: '17:00', expected: '16:30', deltaMinutes: 30 })
  })

  it('reports the delta instead of adjusting', () => {
    // 30' periods instead of 35' pull the morning in by 10 minutes.
    const wrong: BellRules = { ...LOP_1A1, periodMinutes: 30 }
    const mismatches = validateAgainstAnchors(generateSlots(wrong), wrong, { morningEnd: '11:00' })
    expect(mismatches).toHaveLength(1)
    expect(mismatches[0]).toMatchObject({ expected: '11:00', actual: '10:50', deltaMinutes: -10 })
  })

  it('ignores anchors the parent did not supply', () => {
    expect(validateAgainstAnchors(slots, LOP_1A1, {})).toEqual([])
  })
})

describe('findRuleIssues', () => {
  it('accepts the published rules', () => {
    expect(findRuleIssues(LOP_1A1)).toEqual([])
  })

  it('catches a recess anchor that falls before its period ends', () => {
    const backwards: BellRules = {
      ...LOP_1A1,
      morning: { ...LOP_1A1.morning, recess: { afterPeriod: 2, start: '09:00', minutes: 15 } },
    }
    const issues = findRuleIssues(backwards)
    expect(issues).toHaveLength(1)
    expect(issues[0]!.field).toBe('morning.recess.start')
    expect(issues[0]!.message).toContain('09:25')
  })

  it('catches a recess pinned to a period outside its session', () => {
    const stray: BellRules = {
      ...LOP_1A1,
      morning: { ...LOP_1A1.morning, recess: { afterPeriod: 6, start: '09:30', minutes: 15 } },
    }
    expect(findRuleIssues(stray)[0]!.field).toBe('morning.recess.afterPeriod')
  })

  it('catches a zero-length period', () => {
    expect(findRuleIssues({ ...LOP_1A1, periodMinutes: 0 })[0]!.field).toBe('periodMinutes')
  })
})

describe('presets', () => {
  it('offers the primary preset to a first grader', () => {
    expect(presetForGrade(1).key).toBe('primary-35')
    expect(presetForGrade(5).key).toBe('primary-35')
  })

  it('switches to 45-minute periods at THCS', () => {
    expect(presetForGrade(6).key).toBe('secondary-45')
    expect(presetForGrade(6).rules.periodMinutes).toBe(45)
    expect(presetForGrade(12).key).toBe('high-45')
  })

  it('falls back rather than returning nothing for an odd grade', () => {
    expect(presetForGrade(0).key).toBe('primary-35')
    expect(presetForGrade(99).key).toBe('primary-35')
  })

  it('produces a usable timeline from every preset', () => {
    for (const preset of [presetForGrade(1), presetForGrade(6), presetForGrade(10)]) {
      expect(findRuleIssues(preset.rules)).toEqual([])
      expect(periods(generateSlots(preset.rules)).length).toBeGreaterThan(0)
    }
  })

  it('looks up by key', () => {
    expect(presetByKey('primary-35')?.rules.periodMinutes).toBe(35)
    expect(presetByKey('nope')).toBeUndefined()
  })
})
