import { describe, expect, it } from 'vitest'

import { SUBJECTS, getSubjectById } from './subjects'
import { tokens } from '../tokens'

/**
 * Every subject printed on the reference timetable — Lớp 1A1, năm học 2026–2027,
 * the sheet this catalogue was measured against (docs/SCHEDULE_PARENT_IMP.md §2.1).
 * Before Phase 1 only 8 of these resolved; the other 5 collapsed into `activities`,
 * so a child saw "Hoạt động" for five different subjects.
 */
const TIMETABLE_SUBJECTS = [
  'Toán',
  'Tiếng Việt',
  'Tiếng Anh',
  'TNXH',
  'Đạo đức',
  'GDTC',
  'Âm nhạc',
  'Mỹ thuật',
  'HĐTN',
  'KNS',
  'Thư viện',
  'Hướng dẫn học',
  'HĐ lồng ghép',
] as const

/**
 * Subjects still carrying a raw Tailwind palette class instead of a token.
 * They predate the token SSOT and are left alone deliberately (CLAUDE.md rule 7).
 * The list may shrink, never grow — a new subject must be tokenised.
 */
const OFF_TOKEN_BY_LEGACY = new Set(['ethics', 'it', 'activities'])

describe('SUBJECTS catalogue', () => {
  it('names every subject on the reference timetable', () => {
    const names = new Set(SUBJECTS.map((s) => s.name))
    const missing = TIMETABLE_SUBJECTS.filter((n) => !names.has(n))
    expect(missing).toEqual([])
  })

  it('resolves each timetable subject to a distinct id', () => {
    const ids = TIMETABLE_SUBJECTS.map(
      (name) => SUBJECTS.find((s) => s.name === name)?.id
    )
    expect(ids).not.toContain(undefined)
    // No two rows of the printed sheet may share an id, or the grid would
    // render two different lessons identically.
    expect(new Set(ids).size).toBe(TIMETABLE_SUBJECTS.length)
  })

  it('never falls back to the generic activities bucket', () => {
    for (const name of TIMETABLE_SUBJECTS) {
      expect(SUBJECTS.find((s) => s.name === name)?.id).not.toBe('activities')
    }
  })

  it('has unique ids and unique tint colours', () => {
    expect(new Set(SUBJECTS.map((s) => s.id)).size).toBe(SUBJECTS.length)
    // PeriodCell tints from `color`; two subjects sharing one hex are
    // indistinguishable in the grid.
    expect(new Set(SUBJECTS.map((s) => s.color)).size).toBe(SUBJECTS.length)
  })

  it('backs every colorClass with a design token', () => {
    const offToken = SUBJECTS.filter(
      (s) => !(s.colorClass.replace(/^bg-/, '') in tokens.colors)
    ).map((s) => s.id)
    expect(offToken.sort()).toEqual([...OFF_TOKEN_BY_LEGACY].sort())
  })

  it('looks up by id', () => {
    expect(getSubjectById('life-skills')?.name).toBe('KNS')
    expect(getSubjectById('nope')).toBeUndefined()
  })
})
