import { describe, expect, it } from 'vitest'

import { CURRICULUM_SUBJECT_IDS, subjectsForGrade } from './subjects-by-grade'
import { getSubjectById } from './subjects'

const idsAt = (grade: number) => subjectsForGrade(grade).map((s) => s.id)
const bandOf = (grade: number, id: string) =>
  subjectsForGrade(grade).find((s) => s.id === id)?.band

describe('subjectsForGrade', () => {
  it('names only subjects the catalogue can resolve', () => {
    const unknown = CURRICULUM_SUBJECT_IDS.filter((id) => !getSubjectById(id))
    expect(unknown).toEqual([])
  })

  it.each([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])('gives lớp %i something to teach', (g) => {
    expect(subjectsForGrade(g).filter((s) => s.band === 'required').length).toBeGreaterThan(0)
  })

  it('offers a subject once per grade, never twice', () => {
    for (let g = 1; g <= 12; g += 1) {
      const ids = idsAt(g)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  /**
   * The three transitions of docs/SCHEDULE_SUBJECT.md §3.1 — the reason the
   * table is fixed per GRADE and not per level (S1). If these pass, tiểu học is
   * right; if any fails, a household is being offered the wrong programme.
   */
  describe('the three tiểu học transitions', () => {
    it('lớp 1–2: Tiếng Anh is tự chọn and there is no Tin học', () => {
      expect(bandOf(1, 'english')).toBe('elective')
      expect(bandOf(2, 'english')).toBe('elective')
      expect(idsAt(1)).not.toContain('it-technology')
      expect(idsAt(2)).not.toContain('it-technology')
    })

    it('lớp 3: Tiếng Anh becomes compulsory and Tin học và Công nghệ arrives', () => {
      expect(bandOf(3, 'english')).toBe('required')
      expect(bandOf(3, 'it-technology')).toBe('required')
      // TNXH still runs through lớp 3.
      expect(idsAt(3)).toContain('science')
    })

    it('lớp 4: TNXH ends, Khoa học and Lịch sử và Địa lí begin', () => {
      expect(idsAt(4)).not.toContain('science')
      expect(idsAt(4)).toContain('elementary-science')
      expect(idsAt(4)).toContain('history-geography')
    })
  })

  it('lớp 6 swaps every renamed subject at once', () => {
    const ids = idsAt(6)
    expect(ids).toContain('literature')
    expect(ids).toContain('civics')
    expect(ids).toContain('natural-science')
    expect(ids).toContain('experience-career')
    for (const gone of ['vietnamese', 'ethics', 'elementary-science', 'experience']) {
      expect(ids).not.toContain(gone)
    }
  })

  it('lớp 6–9 splits Tin học và Công nghệ into two printed rows', () => {
    expect(idsAt(8)).not.toContain('it-technology')
    expect(bandOf(8, 'it')).toBe('required')
    expect(bandOf(8, 'technology')).toBe('required')
  })

  /** Thông tư 13/2022: Lịch sử bắt buộc, and 09 electives of which four are taken. */
  it('lớp 10–12 has eight compulsory subjects and exactly nine electives', () => {
    for (const g of [10, 11, 12]) {
      const required = subjectsForGrade(g).filter((s) => s.band === 'required')
      const elective = subjectsForGrade(g).filter((s) => s.band === 'elective')
      expect(required.map((s) => s.id).sort()).toEqual(
        [
          'defense',
          'english',
          'experience-career',
          'history',
          'literature',
          'local-education',
          'math',
          'pe',
        ].sort()
      )
      expect(elective).toHaveLength(9)
      expect(elective.map((s) => s.id)).toContain('physics')
      expect(elective.map((s) => s.id)).toContain('economics-law')
    }
  })

  it('keeps the five printed non-programme blocks in every grade (S13)', () => {
    for (let g = 1; g <= 12; g += 1) {
      const extras = subjectsForGrade(g).filter((s) => s.band === 'extra')
      expect(extras.map((s) => s.id).sort()).toEqual(
        ['activities', 'integrated', 'library', 'life-skills', 'study-guide'].sort()
      )
    }
  })

  it('returns nothing for a grade outside 1–12 rather than guessing', () => {
    expect(subjectsForGrade(0)).toEqual([])
    expect(subjectsForGrade(13)).toEqual([])
  })
})
