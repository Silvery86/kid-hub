/**
 * Which subjects a given grade may choose from — lớp 1 through 12.
 *
 * This is the OTHER half of the split in docs/SCHEDULE_SUBJECT.md S9. The
 * catalogue in `subjects.ts` holds every subject of every grade and is what
 * `getSubjectById` resolves against, so a lesson recorded in lớp 3 still renders
 * after the child reaches lớp 4. This file answers a different question: what
 * may be PICKED right now. Nothing here is ever used to render stored data.
 *
 * Sources: Thông tư 32/2018/TT-BGDĐT (chương trình GDPT tổng thể) and
 * Thông tư 13/2022/TT-BGDĐT, which made Lịch sử compulsory at THPT, removed the
 * elective groupings, and left 09 electives of which a student takes 04.
 *
 * The table is fixed in code on purpose (S1). Every school in Vietnam teaches
 * the same programme, so this is not configuration — a parent adds what their
 * school has ON TOP of it (S4), and may not edit or remove what is here (S2, S3).
 */

import type { SubjectBand } from '../types'

/** One subject's claim on a run of grades. A subject may hold several. */
interface GradeSpan {
  readonly id: string
  readonly from: number
  readonly to: number
  readonly band: SubjectBand
}

/**
 * Read this as the printed programme, top to bottom. Order here IS the order a
 * parent sees inside each `<optgroup>`, so the subjects a timetable leads with
 * come first.
 *
 * Three transitions do the real work, and they are why S1 fixes the table per
 * GRADE rather than per level:
 *
 *   lớp 3  — Ngoại ngữ 1 and Tin học và Công nghệ become compulsory
 *   lớp 4  — Tự nhiên và Xã hội ends; Khoa học and Lịch sử và Địa lí begin
 *   lớp 10 — nine subjects drop to elective, and the student takes four
 */
const CURRICULUM: readonly GradeSpan[] = [
  { id: 'math', from: 1, to: 12, band: 'required' },

  { id: 'vietnamese', from: 1, to: 5, band: 'required' },
  { id: 'literature', from: 6, to: 12, band: 'required' },

  // Tự chọn in lớp 1–2, compulsory from lớp 3. Offering it as an elective in the
  // first two years matches the many primary schools that teach it early.
  { id: 'english', from: 1, to: 2, band: 'elective' },
  { id: 'english', from: 3, to: 12, band: 'required' },

  { id: 'ethics', from: 1, to: 5, band: 'required' },
  { id: 'civics', from: 6, to: 9, band: 'required' },

  { id: 'science', from: 1, to: 3, band: 'required' },
  { id: 'elementary-science', from: 4, to: 5, band: 'required' },
  { id: 'natural-science', from: 6, to: 9, band: 'required' },

  { id: 'history-geography', from: 4, to: 9, band: 'required' },
  { id: 'history', from: 10, to: 12, band: 'required' },

  { id: 'physics', from: 10, to: 12, band: 'elective' },
  { id: 'chemistry', from: 10, to: 12, band: 'elective' },
  { id: 'biology', from: 10, to: 12, band: 'elective' },
  { id: 'geography', from: 10, to: 12, band: 'elective' },
  { id: 'economics-law', from: 10, to: 12, band: 'elective' },

  // One printed row at tiểu học, two from lớp 6 — which is why they are three
  // separate ids and not one relabelled by grade (S12).
  { id: 'it-technology', from: 3, to: 5, band: 'required' },
  { id: 'it', from: 6, to: 9, band: 'required' },
  { id: 'it', from: 10, to: 12, band: 'elective' },
  { id: 'technology', from: 6, to: 9, band: 'required' },
  { id: 'technology', from: 10, to: 12, band: 'elective' },

  { id: 'pe', from: 1, to: 12, band: 'required' },
  { id: 'defense', from: 10, to: 12, band: 'required' },

  { id: 'music', from: 1, to: 9, band: 'required' },
  { id: 'music', from: 10, to: 12, band: 'elective' },
  { id: 'art', from: 1, to: 9, band: 'required' },
  { id: 'art', from: 10, to: 12, band: 'elective' },

  { id: 'experience', from: 1, to: 5, band: 'required' },
  { id: 'experience-career', from: 6, to: 12, band: 'required' },
  { id: 'local-education', from: 6, to: 12, band: 'required' },

  // Not in any thông tư — these are the blocks a real thời khoá biểu prints
  // around the lessons. Kept for every grade (S13): a bán trú lớp 8 still has a
  // "hướng dẫn học" period, and guessing which level prints which block would be
  // asserting something we cannot source.
  { id: 'life-skills', from: 1, to: 12, band: 'extra' },
  { id: 'library', from: 1, to: 12, band: 'extra' },
  { id: 'study-guide', from: 1, to: 12, band: 'extra' },
  { id: 'activities', from: 1, to: 12, band: 'extra' },
  { id: 'integrated', from: 1, to: 12, band: 'extra' },
]

export interface GradeSubject {
  id: string
  band: SubjectBand
}

/**
 * The subjects lớp `gradeLevel` may pick from, in programme order.
 *
 * A grade outside 1–12 returns nothing rather than guessing: the caller has a
 * student record that is wrong, and silently handing back the lớp 1 set would
 * hide that.
 */
export const subjectsForGrade = (gradeLevel: number): readonly GradeSubject[] =>
  CURRICULUM.filter((s) => gradeLevel >= s.from && gradeLevel <= s.to).map((s) => ({
    id: s.id,
    band: s.band,
  }))

/** Every subject id the programme mentions, for tests and tooling. */
export const CURRICULUM_SUBJECT_IDS: readonly string[] = [...new Set(CURRICULUM.map((s) => s.id))]
