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
 *
 * Empty since the lớp 1–12 catalogue landed: `ethics`, `it` and `activities`
 * were the last three, tokenised alongside the sixteen new subjects rather than
 * left as the only rows the token SSOT did not cover. The list may shrink,
 * never grow — a new subject must be tokenised.
 */
const OFF_TOKEN_BY_LEGACY = new Set<string>()

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

  /**
   * S9: the catalogue is the union of every grade, never filtered.
   *
   * TNXH belongs to lớp 1–3 and KHTN to lớp 6–9 — no child ever studies both,
   * yet both must resolve here, or a lesson recorded in lớp 3 would lose its
   * subject the moment the child reached lớp 4. Filtering by grade is the
   * picker's job, not this catalogue's.
   */
  it('holds every grade at once, including subjects no one grade shares', () => {
    expect(getSubjectById('science')?.name).toBe('TNXH')
    expect(getSubjectById('natural-science')?.name).toBe('KHTN')
    expect(getSubjectById('elementary-science')?.name).toBe('Khoa học')
  })

  /**
   * S11: a subject renamed at a level boundary is a SEPARATE id. A single id
   * relabelled by the child's current grade would print last year's lớp 5
   * timetable with this year's lớp 6 labels.
   */
  it.each([
    ['vietnamese', 'literature'],
    ['ethics', 'civics'],
    ['elementary-science', 'natural-science'],
    ['experience', 'experience-career'],
  ])('keeps %s and %s as distinct ids', (primary, secondary) => {
    expect(getSubjectById(primary)).toBeDefined()
    expect(getSubjectById(secondary)).toBeDefined()
    expect(getSubjectById(primary)!.name).not.toBe(getSubjectById(secondary)!.name)
  })
})
