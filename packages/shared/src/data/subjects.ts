/** Static subject definitions for the Vietnamese general curriculum, lớp 1–12. */

import type { Subject } from '../types'

/**
 * The COMPLETE catalogue — every subject of every grade, 1 through 12. It is
 * deliberately not filtered by grade: this is what `getSubjectById` resolves
 * against, and a lesson recorded in lớp 3 must still render its subject after
 * the child reaches lớp 4 (docs/SCHEDULE_SUBJECT.md S9). Which subjects a grade
 * may CHOOSE from is a separate question, answered by `subjectsForGrade`.
 *
 * Names match what a printed thời khóa biểu actually prints, abbreviations
 * included, so a parent copying one can find each row by the label in front of
 * them: TNXH = Tự nhiên và Xã hội · GDTC = Giáo dục thể chất (thể dục) ·
 * HĐTN = Hoạt động trải nghiệm · KNS = Kĩ năng sống · KHTN = Khoa học tự nhiên ·
 * GDCD = Giáo dục công dân · GDQP–AN = Giáo dục quốc phòng và an ninh.
 *
 * Sources for the per-grade sets: Thông tư 32/2018/TT-BGDĐT and
 * Thông tư 13/2022/TT-BGDĐT (Lịch sử bắt buộc ở THPT).
 * Owner: @kid-hub/shared — apps/web/lib/data/subjects.ts re-exports these so both
 * platforms resolve a subjectId to the same name, colour and icon.
 *
 * colorClass → Tailwind background class (resolved by Tailwind v4 on web and by
 *   NativeWind on mobile — the semantic names come from the shared token preset).
 * color + icon → PeriodCell / GradeCard tinting (see mixWithWhite) and list glyphs.
 * iconName → lucide icon name (lucide-react on web, lucide-react-native on mobile).
 */
export const SUBJECTS: readonly Subject[] = [
  { id: 'math', name: 'Toán', colorClass: 'bg-math', iconName: 'Calculator', color: '#3b82f6', icon: '📐' },
  { id: 'vietnamese', name: 'Tiếng Việt', colorClass: 'bg-vietnamese', iconName: 'BookOpen', color: '#ef4444', icon: '📖' },
  { id: 'english', name: 'Tiếng Anh', colorClass: 'bg-english', iconName: 'Globe', color: '#10b981', icon: '🔤' },
  { id: 'science', name: 'TNXH', colorClass: 'bg-science', iconName: 'Leaf', color: '#8b5cf6', icon: '🔬' },
  { id: 'ethics', name: 'Đạo đức', colorClass: 'bg-ethics', iconName: 'Heart', color: '#14b8a6', icon: '🌱' },
  { id: 'pe', name: 'GDTC', colorClass: 'bg-pe', iconName: 'Dumbbell', color: '#f59e0b', icon: '⚽' },
  { id: 'music', name: 'Âm nhạc', colorClass: 'bg-music', iconName: 'Music', color: '#f97316', icon: '🎵' },
  { id: 'art', name: 'Mỹ thuật', colorClass: 'bg-art', iconName: 'Palette', color: '#ec4899', icon: '🎨' },
  { id: 'it', name: 'Tin học', colorClass: 'bg-it', iconName: 'Monitor', color: '#06b6d4', icon: '💻' },
  { id: 'activities', name: 'Hoạt động', colorClass: 'bg-activities', iconName: 'Star', color: '#84cc16', icon: '🌟' },
  { id: 'experience', name: 'HĐTN', colorClass: 'bg-experience', iconName: 'Compass', color: '#22c55e', icon: '🧭' },
  { id: 'life-skills', name: 'KNS', colorClass: 'bg-life-skills', iconName: 'Handshake', color: '#d946ef', icon: '🤝' },
  { id: 'library', name: 'Thư viện', colorClass: 'bg-library', iconName: 'Library', color: '#6366f1', icon: '📚' },
  { id: 'study-guide', name: 'Hướng dẫn học', colorClass: 'bg-study-guide', iconName: 'GraduationCap', color: '#64748b', icon: '📝' },
  { id: 'integrated', name: 'HĐ lồng ghép', colorClass: 'bg-integrated', iconName: 'Layers', color: '#b45309', icon: '🧩' },
  // ── Lớp 6–12 ─────────────────────────────────────────────────────────────
  // Appended rather than interleaved: until the picker groups by grade
  // (SCHEDULE_SUBJECT.md step 3) this array IS the picker order, and a lớp 1
  // household should not find Hoá học shuffled in among Toán and Tiếng Việt.
  //
  // Four of these are the successor of a primary subject under a new printed
  // name — vietnamese→literature, ethics→civics, elementary-science→
  // natural-science, experience→experience-career. They are separate ids on
  // purpose (S11): a name that changed with the child's current grade would
  // print last year's lớp 5 timetable with this year's lớp 6 labels.
  { id: 'literature', name: 'Ngữ văn', colorClass: 'bg-literature', iconName: 'BookText', color: '#dc2626', icon: '📕' },
  { id: 'civics', name: 'GDCD', colorClass: 'bg-civics', iconName: 'Scale', color: '#0d9488', icon: '⚖️' },
  { id: 'elementary-science', name: 'Khoa học', colorClass: 'bg-elementary-science', iconName: 'FlaskConical', color: '#7c3aed', icon: '🔎' },
  { id: 'natural-science', name: 'KHTN', colorClass: 'bg-natural-science', iconName: 'Atom', color: '#6d28d9', icon: '⚛️' },
  { id: 'history-geography', name: 'Lịch sử và Địa lí', colorClass: 'bg-history-geography', iconName: 'Map', color: '#a16207', icon: '🗺️' },
  { id: 'history', name: 'Lịch sử', colorClass: 'bg-history', iconName: 'Landmark', color: '#854d0e', icon: '🏛️' },
  { id: 'geography', name: 'Địa lí', colorClass: 'bg-geography', iconName: 'Mountain', color: '#0369a1', icon: '🏔️' },
  { id: 'physics', name: 'Vật lí', colorClass: 'bg-physics', iconName: 'Magnet', color: '#3730a3', icon: '🧲' },
  { id: 'chemistry', name: 'Hoá học', colorClass: 'bg-chemistry', iconName: 'FlaskRound', color: '#a21caf', icon: '⚗️' },
  { id: 'biology', name: 'Sinh học', colorClass: 'bg-biology', iconName: 'Dna', color: '#15803d', icon: '🧬' },
  { id: 'economics-law', name: 'GDKT & PL', colorClass: 'bg-economics-law', iconName: 'Gavel', color: '#0e7490', icon: '🏦' },
  { id: 'it-technology', name: 'Tin học và Công nghệ', colorClass: 'bg-it-technology', iconName: 'Cpu', color: '#0891b2', icon: '🖥️' },
  { id: 'technology', name: 'Công nghệ', colorClass: 'bg-technology', iconName: 'Wrench', color: '#78350f', icon: '🔧' },
  { id: 'defense', name: 'GDQP – AN', colorClass: 'bg-defense', iconName: 'Shield', color: '#3f6212', icon: '🛡️' },
  { id: 'local-education', name: 'GD địa phương', colorClass: 'bg-local-education', iconName: 'MapPin', color: '#9a3412', icon: '📍' },
  { id: 'experience-career', name: 'HĐTN – HN', colorClass: 'bg-experience-career', iconName: 'Briefcase', color: '#16a34a', icon: '💼' },
] as const

/** Look up a subject by its ID. Returns undefined if not found. */
export const getSubjectById = (id: string): Subject | undefined => SUBJECTS.find((s) => s.id === id)

/**
 * Lesson variants that make sense for a given subject.
 *
 * The printed timetable writes "Tiếng Việt — Học vần" because a first-grade
 * Vietnamese lesson really is one of several distinct things. No other subject
 * on the 1A1 sheet is broken down that way, and "Đạo đức — Học vần" is simply
 * wrong.
 *
 * These are SUGGESTIONS, not a closed list: D1 (docs/SCHEDULE_PARENT_IMP.md §9)
 * kept the field free text on purpose, because a fixed enum needs curriculum
 * knowledge we do not have and breaks at the first school that words things
 * differently. A parent may still type anything, for any subject — this only
 * decides what is offered without typing.
 */
export const SUBJECT_VARIANTS: Record<string, readonly string[]> = {
  vietnamese: ['Học vần', 'Tập viết', 'Ôn tập', 'Tập đọc', 'Chính tả', 'Kể chuyện'],
  math: ['Ôn tập', 'Luyện tập'],
  experience: ['Chào cờ', 'Sinh hoạt lớp'],
}

/** Suggested variants for a subject — empty when the subject has no natural ones. */
export const variantsForSubject = (subjectId: string): readonly string[] =>
  SUBJECT_VARIANTS[subjectId] ?? []
