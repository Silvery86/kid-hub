import { describe, expect, it } from 'vitest'

import { diffWeek, type WeekCell } from './schedule'
import type { DailySchedule } from '../types'

const period = (
  id: string,
  periodNumber: number,
  subjectId: string,
  note?: string
) => ({
  id,
  periodNumber,
  subjectId,
  eventType: 'SCHOOL_PERIOD' as const,
  startTime: '08:10',
  endTime: '08:45',
  ...(note ? { note } : {}),
})

const monday = (...periods: ReturnType<typeof period>[]): DailySchedule[] => [
  { day: 'monday', periods },
]

describe('diffWeek', () => {
  it('creates a cell that has no stored row', () => {
    const next: WeekCell[] = [{ day: 'monday', periodNumber: 1, subjectId: 'math' }]
    expect(diffWeek([], next)).toEqual({ created: next, updated: [], deleted: [] })
  })

  it('deletes a stored row the parent emptied', () => {
    const diff = diffWeek(monday(period('p1', 1, 'math')), [])
    expect(diff).toEqual({ created: [], updated: [], deleted: ['p1'] })
  })

  it('updates in place when the subject changes', () => {
    const diff = diffWeek(monday(period('p1', 1, 'math')), [
      { day: 'monday', periodNumber: 1, subjectId: 'vietnamese' },
    ])
    // Matched on (day, periodNumber) — the same pair the unique constraint uses.
    // A delete-then-insert here would collide with itself.
    expect(diff.updated).toEqual([
      { id: 'p1', day: 'monday', periodNumber: 1, subjectId: 'vietnamese' },
    ])
    expect(diff.created).toEqual([])
    expect(diff.deleted).toEqual([])
  })

  it('updates when only the variant changes', () => {
    const diff = diffWeek(monday(period('p1', 1, 'vietnamese', 'Học vần')), [
      { day: 'monday', periodNumber: 1, subjectId: 'vietnamese', note: 'Tập viết' },
    ])
    expect(diff.updated).toHaveLength(1)
    expect(diff.updated[0]!.note).toBe('Tập viết')
  })

  it('writes nothing for an unchanged week', () => {
    // The point of diffing: one moved subject in a 35-cell grid must be one
    // UPDATE, not 35.
    const current = monday(period('p1', 1, 'math'), period('p2', 2, 'english', 'Ôn tập'))
    const next: WeekCell[] = [
      { day: 'monday', periodNumber: 1, subjectId: 'math' },
      { day: 'monday', periodNumber: 2, subjectId: 'english', note: 'Ôn tập' },
    ]
    expect(diffWeek(current, next)).toEqual({ created: [], updated: [], deleted: [] })
  })

  it('treats an absent note and an empty note as the same', () => {
    const diff = diffWeek(monday(period('p1', 1, 'math')), [
      { day: 'monday', periodNumber: 1, subjectId: 'math', note: '' },
    ])
    expect(diff.updated).toEqual([])
  })

  it('never touches extra classes', () => {
    // Evening blocks carry no periodNumber and live on another surface.
    // Sweeping them into a week save would silently delete them.
    const current: DailySchedule[] = [
      {
        day: 'monday',
        periods: [
          { id: 'x1', subjectId: 'english', eventType: 'EXTRA_CLASS', startTime: '19:00', endTime: '20:00' },
        ],
      },
    ]
    expect(diffWeek(current, [])).toEqual({ created: [], updated: [], deleted: [] })
  })

  it('keeps days independent', () => {
    const current: DailySchedule[] = [
      { day: 'monday', periods: [period('p1', 1, 'math')] },
      { day: 'tuesday', periods: [period('p2', 1, 'math')] },
    ]
    const diff = diffWeek(current, [{ day: 'tuesday', periodNumber: 1, subjectId: 'math' }])
    expect(diff.deleted).toEqual(['p1'])
    expect(diff.updated).toEqual([])
  })

  it('handles a full 35-cell week with one edit', () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
    const current: DailySchedule[] = days.map((day) => ({
      day,
      periods: Array.from({ length: 7 }, (_, i) => period(`${day}-${i + 1}`, i + 1, 'math')),
    }))
    const next: WeekCell[] = days.flatMap((day) =>
      Array.from({ length: 7 }, (_, i) => ({
        day,
        periodNumber: i + 1,
        subjectId: day === 'wednesday' && i === 2 ? 'vietnamese' : 'math',
      }))
    )
    const diff = diffWeek(current, next)
    expect(diff.created).toEqual([])
    expect(diff.deleted).toEqual([])
    expect(diff.updated).toEqual([
      { id: 'wednesday-3', day: 'wednesday', periodNumber: 3, subjectId: 'vietnamese' },
    ])
  })
})
