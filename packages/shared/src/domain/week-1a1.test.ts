import { describe, expect, it } from 'vitest'

import { diffWeek, type WeekCell } from './schedule'
import { generateSlots } from './bell-schedule'
import { SUBJECTS } from '../data/subjects'
import type { BellRules, DailySchedule, DayOfWeek } from '../types'

/**
 * End-to-end fixture for the reference timetable — Lớp 1A1, NH 2026–2027
 * (docs/SCHEDULE_PARENT_IMP.md §2.1). Exercises the whole pure data path a week
 * save runs through: the bell rules produce the period slots, the grid cells
 * resolve against them, and the diff decides the writes.
 *
 * This stands in for the browser fixture §11.5 calls for, which cannot run on
 * this machine (libnss3/libnspr4/libasound2t64 absent). It covers the data
 * path, NOT that the grid UI produces these cells.
 */

const RULES: BellRules = {
  periodMinutes: 35,
  transitionMinutes: 5,
  morning: { start: '08:10', periods: 4, recess: { afterPeriod: 2, start: '09:30', minutes: 15 } },
  afternoon: { start: '13:45', periods: 3, recess: { afterPeriod: 6, start: '15:00', minutes: 15 } },
  boarding: true,
  routines: [],
}

/** The printed grid, read straight off the sheet: [tiết][Mon..Fri]. */
const SHEET: [string, string | undefined][][] = [
  // tiết 1
  [['experience', 'Chào cờ'], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['english', undefined]],
  // tiết 2
  [['music', undefined], ['english', undefined], ['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Ôn tập']],
  // tiết 3
  [['vietnamese', 'Học vần'], ['vietnamese', 'Học vần'], ['vietnamese', 'Tập viết'], ['music', undefined], ['vietnamese', 'Ôn tập']],
  // tiết 4
  [['vietnamese', 'Học vần'], ['art', undefined], ['math', undefined], ['math', undefined], ['vietnamese', 'Tập viết']],
  // tiết 5
  [['math', undefined], ['science', undefined], ['pe', undefined], ['science', undefined], ['pe', undefined]],
  // tiết 6
  [['ethics', undefined], ['pe', undefined], ['library', undefined], ['experience', undefined], ['integrated', undefined]],
  // tiết 7
  [['life-skills', undefined], ['life-skills', undefined], ['art', undefined], ['study-guide', undefined], ['experience', undefined]],
]

const DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

const CELLS: WeekCell[] = SHEET.flatMap((row, rowIndex) =>
  row.map(([subjectId, note], dayIndex) => ({
    day: DAYS[dayIndex]!,
    periodNumber: rowIndex + 1,
    subjectId,
    ...(note ? { note } : {}),
  }))
)

describe('Lớp 1A1 — the full week', () => {
  const slots = generateSlots(RULES)

  it('is 35 cells', () => {
    expect(CELLS).toHaveLength(35)
  })

  it('names every cell with a real subject', () => {
    // The Phase 1 regression: before the catalogue grew, 8 of these had no id
    // and collapsed into `activities`.
    const ids = new Set(SUBJECTS.map((s) => s.id))
    const unknown = [...new Set(CELLS.map((c) => c.subjectId))].filter((id) => !ids.has(id))
    expect(unknown).toEqual([])
    expect(CELLS.some((c) => c.subjectId === 'activities')).toBe(false)
  })

  it('places every cell against the bell schedule', () => {
    // A cell the bell schedule cannot time is rejected by saveWeeklyScheduleAction,
    // so this is the check that the two halves of the feature agree.
    for (const cell of CELLS) {
      const slot = slots.find(
        (s) => s.kind === 'PERIOD' && s.periodNumber === cell.periodNumber && s.days.includes(cell.day)
      )
      expect(slot, `tiết ${cell.periodNumber} ${cell.day}`).toBeDefined()
    }
  })

  it('carries the variant on all twelve Tiếng Việt cells', () => {
    const tv = CELLS.filter((c) => c.subjectId === 'vietnamese')
    expect(tv).toHaveLength(12)
    expect(tv.every((c) => c.note)).toBe(true)
    expect(new Set(tv.map((c) => c.note))).toEqual(new Set(['Học vần', 'Tập viết', 'Ôn tập']))
  })

  it('enters as 35 creates and nothing else', () => {
    const diff = diffWeek([], CELLS)
    expect(diff.created).toHaveLength(35)
    expect(diff.updated).toEqual([])
    expect(diff.deleted).toEqual([])
  })

  it('re-saving an unchanged week writes nothing', () => {
    const stored = storedFrom(CELLS)
    expect(diffWeek(stored, CELLS)).toEqual({ created: [], updated: [], deleted: [] })
  })

  it('changing one cell writes exactly one row', () => {
    const stored = storedFrom(CELLS)
    const edited = CELLS.map((c) =>
      c.day === 'wednesday' && c.periodNumber === 6 ? { ...c, subjectId: 'math' } : c
    )
    const diff = diffWeek(stored, edited)
    expect(diff.created).toEqual([])
    expect(diff.deleted).toEqual([])
    expect(diff.updated).toHaveLength(1)
    expect(diff.updated[0]).toMatchObject({ day: 'wednesday', periodNumber: 6, subjectId: 'math' })
  })

  it('clearing Friday deletes seven rows and touches nothing else', () => {
    const stored = storedFrom(CELLS)
    const diff = diffWeek(stored, CELLS.filter((c) => c.day !== 'friday'))
    expect(diff.deleted).toHaveLength(7)
    expect(diff.created).toEqual([])
    expect(diff.updated).toEqual([])
  })
})

/** The week as it would come back from the database after a first save. */
function storedFrom(cells: WeekCell[]): DailySchedule[] {
  return DAYS.map((day) => ({
    day,
    periods: cells
      .filter((c) => c.day === day)
      .map((c) => ({
        id: `${c.day}-${c.periodNumber}`,
        periodNumber: c.periodNumber,
        eventType: 'SCHOOL_PERIOD' as const,
        subjectId: c.subjectId,
        ...(c.note ? { note: c.note } : {}),
        startTime: '08:10',
        endTime: '08:45',
      })),
  }))
}
