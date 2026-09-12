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

import type { CustomSubjectRow, Subject, SubjectBand, SubjectGroup } from '../types'
import { SUBJECTS, getSubjectById, variantsForSubject } from '../data/subjects'
import { subjectsForGrade } from '../data/subjects-by-grade'

const BAND_LABEL: Record<SubjectBand, string> = {
  required: 'Môn học',
  elective: 'Môn lựa chọn',
  extra: 'Hoạt động khác',
}

/** Heading for subjects kept only because the week being edited already uses them. */
export const IN_USE_LABEL = 'Đang dùng trong tuần này'

/** Heading for the subjects a parent added themselves. */
export const CUSTOM_LABEL = 'Môn của trường'

/**
 * A parent's own subject, in the shape the rest of the app already renders.
 *
 * `iconName` is the same for all of them because nothing draws it — both
 * SubjectIcon implementations use the emoji — and `colorClass` is empty because
 * a custom colour cannot have a build-time Tailwind class. Everything that
 * paints a subject reads the hex.
 */
export const customAsSubject = (row: CustomSubjectRow): Subject => ({
  id: row.subjectId,
  name: row.name,
  colorClass: '',
  iconName: 'Shapes',
  color: row.color,
  icon: row.icon,
})

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
  alsoInclude: readonly string[] = [],
  custom: readonly CustomSubjectRow[] = []
): SubjectGroup[] => {
  const forGrade = subjectsForGrade(gradeLevel)
  const customSubjects = custom.map(customAsSubject)

  if (forGrade.length === 0) {
    return [{ label: BAND_LABEL.required, subjects: [...SUBJECTS, ...customSubjects] }]
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

  // Last, under their own heading: a parent scanning for a programme subject
  // should not have to read past the school's extras to find it.
  if (customSubjects.length > 0) {
    for (const s of customSubjects) placed.add(s.id)
    groups.push({ label: CUSTOM_LABEL, subjects: customSubjects })
  }

  // Deduped and catalogue-ordered, so reopening the same week never reshuffles.
  const strays = SUBJECTS.filter((s) => alsoInclude.includes(s.id) && !placed.has(s.id))
  if (strays.length > 0) groups.push({ label: IN_USE_LABEL, subjects: [...strays] })

  return groups
}

/**
 * Resolve a subject id against the programme AND this student's own subjects.
 *
 * `getSubjectById` alone cannot see a custom subject, so anything rendering a
 * saved lesson must come through here or a parent's own subject shows up blank
 * in the very grid they added it for.
 */
export const resolveSubject = (
  subjectId: string,
  custom: readonly CustomSubjectRow[] = []
): Subject | undefined => {
  const found = getSubjectById(subjectId)
  if (found) return found
  const own = custom.find((c) => c.subjectId === subjectId)
  return own ? customAsSubject(own) : undefined
}

/** How many variant chips a subject may offer before the row stops being scannable. */
const MAX_VARIANTS = 12

/**
 * The lesson variants to offer for one subject: the static suggestions, then
 * whatever this household has already typed for it.
 *
 * Static first, on purpose. Those chips sit in the same place week after week,
 * and reordering them by what was used most recently would move the target
 * under a parent who has learnt where it is. Learnt variants are appended, so
 * the familiar list never shifts — it only grows.
 *
 * Deduped case-sensitively: "Học vần" and "học vần" are the same lesson to a
 * person, but only the parent knows which spelling their school prints, and
 * silently folding one into the other would change what they wrote.
 */
export const variantsFor = (
  subjectId: string,
  remembered: Readonly<Record<string, readonly string[]>> = {}
): readonly string[] => {
  const seen = new Set<string>()
  const out: string[] = []

  for (const v of [...variantsForSubject(subjectId), ...(remembered[subjectId] ?? [])]) {
    const trimmed = v.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    out.push(trimmed)
    if (out.length === MAX_VARIANTS) break
  }

  return out
}
