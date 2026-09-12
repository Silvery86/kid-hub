/**
 * The subject picker, grouped the way a school programme is grouped.
 *
 * One `<select>` in the week grid is where almost every parent meets subjects,
 * so this is the function that actually decides whether the app feels like it
 * knows their child's class. It answers: given a grade, what may be chosen, and
 * under which headings.
 *
 * Pure and isomorphic — Web and Mobile call the same function, so a grade can
 * never offer one set on one platform and another set on the other.
 */

import type { Subject, SubjectBand, SubjectGroup } from '../types'
import { SUBJECTS, getSubjectById } from '../data/subjects'
import { subjectsForGrade } from '../data/subjects-by-grade'

const BAND_LABEL: Record<SubjectBand, string> = {
  required: 'Môn học',
  elective: 'Môn lựa chọn',
  extra: 'Hoạt động khác',
}

/** Heading for subjects kept only because the week being edited already uses them. */
export const IN_USE_LABEL = 'Đang dùng trong tuần này'

const BAND_ORDER: readonly SubjectBand[] = ['required', 'elective', 'extra']

/**
 * The `<optgroup>`s for one grade's picker.
 *
 * `alsoInclude` carries the subject ids the week being edited already uses, and
 * it is not a nicety. A `<select>` whose value matches no `<option>` renders
 * BLANK — so after a child moves up to lớp 4, every TNXH cell of an earlier week
 * would display as empty until something was picked over it. Those subjects are
 * appended under their own heading rather than folded into the programme groups,
 * because they are no longer part of this grade's programme and saying otherwise
 * would be untrue.
 *
 * A grade outside 1–12 falls back to the whole catalogue. The student record is
 * wrong in that case, and offering everything is the failure that still lets a
 * parent finish what they were doing.
 */
export const subjectGroupsForPicker = (
  gradeLevel: number,
  alsoInclude: readonly string[] = []
): SubjectGroup[] => {
  const forGrade = subjectsForGrade(gradeLevel)

  if (forGrade.length === 0) {
    return [{ label: BAND_LABEL.required, subjects: [...SUBJECTS] }]
  }

  const groups: SubjectGroup[] = []
  const placed = new Set<string>()

  for (const band of BAND_ORDER) {
    const subjects = forGrade
      .filter((s) => s.band === band)
      .map((s) => getSubjectById(s.id))
      .filter((s): s is Subject => s != null)

    for (const s of subjects) placed.add(s.id)
    if (subjects.length > 0) groups.push({ label: BAND_LABEL[band], subjects })
  }

  // Deduped and catalogue-ordered, so reopening the same week never reshuffles.
  const strays = SUBJECTS.filter((s) => alsoInclude.includes(s.id) && !placed.has(s.id))
  if (strays.length > 0) groups.push({ label: IN_USE_LABEL, subjects: [...strays] })

  return groups
}
