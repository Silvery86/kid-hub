import { describe, expect, it } from 'vitest'

import {
  CUSTOM_LABEL,
  IN_USE_LABEL,
  resolveSubject,
  subjectGroupsForPicker,
  variantsFor,
} from './subjects'
import { SUBJECTS, variantsForSubject } from '../data/subjects'

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

describe('variantsFor', () => {
  it('offers the static suggestions when the household has typed nothing', () => {
    expect(variantsFor('vietnamese')).toEqual([
      'Học vần',
      'Tập viết',
      'Ôn tập',
      'Tập đọc',
      'Chính tả',
      'Kể chuyện',
    ])
  })

  /**
   * Static chips keep their position. A parent learns where "Học vần" sits and
   * reaches for it without reading; reordering by recency would move the target
   * under them.
   */
  it('appends what the household typed instead of reordering', () => {
    expect(variantsFor('math', { math: ['Luyện nói'] })).toEqual([
      'Ôn tập',
      'Luyện tập',
      'Luyện nói',
    ])
  })

  it('teaches a subject that had no suggestions at all', () => {
    expect(variantsForSubject('pe')).toEqual([])
    expect(variantsFor('pe', { pe: ['Đá cầu', 'Chạy bền'] })).toEqual(['Đá cầu', 'Chạy bền'])
  })

  it('does not offer the same variant twice', () => {
    expect(variantsFor('math', { math: ['Ôn tập', 'Ôn tập ', 'Luyện tập'] })).toEqual([
      'Ôn tập',
      'Luyện tập',
    ])
  })

  it('keeps a spelling the household chose rather than folding it into another', () => {
    // Only the parent knows which casing their school prints.
    expect(variantsFor('math', { math: ['ôn tập'] })).toEqual(['Ôn tập', 'Luyện tập', 'ôn tập'])
  })

  it('ignores variants belonging to a different subject', () => {
    expect(variantsFor('math', { vietnamese: ['Học vần'] })).toEqual(['Ôn tập', 'Luyện tập'])
  })

  it('stops at twelve so the chip row stays scannable', () => {
    const many = Array.from({ length: 30 }, (_, i) => `Bài ${i + 1}`)
    expect(variantsFor('pe', { pe: many })).toHaveLength(12)
  })
})

const TOAN_ANH = { subjectId: 'custom_abc123', name: 'Toán tiếng Anh', color: '#0ea5e9', icon: '🏫' }
const ROBOTICS = { subjectId: 'custom_def456', name: 'CLB Robotics', color: '#f43f5e', icon: '🧩' }

describe('a household’s own subjects', () => {
  it('adds them as a group of their own, after the programme', () => {
    expect(labels(8)).toEqual(['Môn học', 'Hoạt động khác'])
    expect(subjectGroupsForPicker(8, [], [TOAN_ANH, ROBOTICS]).map((g) => g.label)).toEqual([
      'Môn học',
      'Hoạt động khác',
      CUSTOM_LABEL,
    ])
  })

  it('keeps the order they were added in', () => {
    const ids = subjectGroupsForPicker(8, [], [TOAN_ANH, ROBOTICS])
      .find((g) => g.label === CUSTOM_LABEL)!
      .subjects.map((s) => s.id)
    expect(ids).toEqual(['custom_abc123', 'custom_def456'])
  })

  /**
   * Without this they would appear twice — once as the household's own, once
   * under "đang dùng trong tuần này" — and a <select> with two identical values
   * is a picker that cannot say which one is selected.
   */
  it('does not repeat one the week is also using', () => {
    const groups = subjectGroupsForPicker(8, ['custom_abc123'], [TOAN_ANH])
    expect(groups.map((g) => g.label)).not.toContain(IN_USE_LABEL)
  })

  it('still offers them when the grade is unknown', () => {
    const all = subjectGroupsForPicker(0, [], [TOAN_ANH]).flatMap((g) => g.subjects.map((s) => s.id))
    expect(all).toContain('custom_abc123')
    expect(all).toHaveLength(SUBJECTS.length + 1)
  })
})

describe('resolveSubject', () => {
  it('finds a programme subject without being told about custom ones', () => {
    expect(resolveSubject('math')?.name).toBe('Toán')
  })

  /**
   * The reason this function exists. getSubjectById reads a static catalogue, so
   * a subject the parent added would render blank in the very grid they added it
   * for — every saved lesson has to resolve through here instead.
   */
  it('finds one the household added', () => {
    expect(resolveSubject('custom_abc123', [TOAN_ANH])).toMatchObject({
      id: 'custom_abc123',
      name: 'Toán tiếng Anh',
      color: '#0ea5e9',
      icon: '🏫',
    })
  })

  it('returns nothing for an id belonging to neither', () => {
    expect(resolveSubject('custom_gone', [TOAN_ANH])).toBeUndefined()
  })

  /** No Tailwind class can exist at build time for a colour typed at runtime. */
  it('paints a custom subject from its hex, not a class', () => {
    const subject = resolveSubject('custom_abc123', [TOAN_ANH])!
    expect(subject.colorClass).toBe('')
    expect(subject.color).toBe('#0ea5e9')
  })
})
