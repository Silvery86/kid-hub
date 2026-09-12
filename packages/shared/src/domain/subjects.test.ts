import { describe, expect, it } from 'vitest'

import { IN_USE_LABEL, subjectGroupsForPicker } from './subjects'
import { SUBJECTS } from '../data/subjects'

const labels = (g: number, also: string[] = []) =>
  subjectGroupsForPicker(g, also).map((x) => x.label)
const idsIn = (g: number, label: string, also: string[] = []) =>
  subjectGroupsForPicker(g, also)
    .find((x) => x.label === label)
    ?.subjects.map((s) => s.id) ?? []

describe('subjectGroupsForPicker', () => {
  it('gives tiểu học no elective heading — there is nothing to choose', () => {
    expect(labels(4)).toEqual(['Môn học', 'Hoạt động khác'])
  })

  it('gives lớp 1–2 an elective heading, because Tiếng Anh is tự chọn there', () => {
    expect(labels(1)).toEqual(['Môn học', 'Môn lựa chọn', 'Hoạt động khác'])
    expect(idsIn(1, 'Môn lựa chọn')).toEqual(['english'])
  })

  it('gives THPT all three headings', () => {
    expect(labels(10)).toEqual(['Môn học', 'Môn lựa chọn', 'Hoạt động khác'])
    expect(idsIn(10, 'Môn lựa chọn')).toHaveLength(9)
  })

  it('never emits an empty group', () => {
    for (let g = 1; g <= 12; g += 1) {
      for (const group of subjectGroupsForPicker(g)) {
        expect(group.subjects.length).toBeGreaterThan(0)
      }
    }
  })

  it('lists each subject at most once across all groups', () => {
    for (let g = 1; g <= 12; g += 1) {
      const all = subjectGroupsForPicker(g).flatMap((x) => x.subjects.map((s) => s.id))
      expect(new Set(all).size).toBe(all.length)
    }
  })

  /**
   * The reason `alsoInclude` exists. A <select> whose value matches no <option>
   * renders BLANK — so without this, every TNXH cell of a lớp 3 week would show
   * as empty the moment the child moved up to lớp 4.
   */
  describe('subjects the week still uses but the grade no longer teaches', () => {
    it('appends them under their own heading', () => {
      expect(labels(4, ['science'])).toEqual(['Môn học', 'Hoạt động khác', IN_USE_LABEL])
      expect(idsIn(4, IN_USE_LABEL, ['science'])).toEqual(['science'])
    })

    it('does not repeat one the grade already offers', () => {
      expect(labels(4, ['math'])).toEqual(['Môn học', 'Hoạt động khác'])
    })

    it('ignores an id the catalogue cannot resolve', () => {
      expect(labels(4, ['gone-forever'])).toEqual(['Môn học', 'Hoạt động khác'])
    })

    it('keeps catalogue order and drops duplicates', () => {
      const ids = idsIn(6, IN_USE_LABEL, ['experience', 'vietnamese', 'vietnamese'])
      expect(ids).toEqual(['vietnamese', 'experience'])
    })
  })

  /**
   * A grade outside 1–12 means the student record is wrong. Offering the whole
   * catalogue is the failure that still lets a parent finish the week they were
   * filling in.
   */
  it('falls back to the full catalogue for an impossible grade', () => {
    const groups = subjectGroupsForPicker(0)
    expect(groups).toHaveLength(1)
    expect(groups[0]!.subjects).toHaveLength(SUBJECTS.length)
  })
})
