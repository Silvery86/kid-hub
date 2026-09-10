/** Static subject definitions for the 1st-grade Vietnamese primary school curriculum. */

import type { Subject } from '../types'

/**
 * Canonical list of subjects for a Vietnamese primary school class. Names match
 * what a printed thời khóa biểu actually prints, abbreviations included, so a
 * parent copying one can find each row by the label in front of them:
 * TNXH = Tự nhiên xã hội · GDTC = Giáo dục thể chất (thể dục) ·
 * HĐTN = Hoạt động trải nghiệm · KNS = Kĩ năng sống.
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
  { id: 'ethics', name: 'Đạo đức', colorClass: 'bg-violet-400', iconName: 'Heart', color: '#14b8a6', icon: '🌱' },
  { id: 'pe', name: 'GDTC', colorClass: 'bg-pe', iconName: 'Dumbbell', color: '#f59e0b', icon: '⚽' },
  { id: 'music', name: 'Âm nhạc', colorClass: 'bg-music', iconName: 'Music', color: '#f97316', icon: '🎵' },
  { id: 'art', name: 'Mỹ thuật', colorClass: 'bg-art', iconName: 'Palette', color: '#ec4899', icon: '🎨' },
  { id: 'it', name: 'Tin học', colorClass: 'bg-cyan-400', iconName: 'Monitor', color: '#06b6d4', icon: '💻' },
  { id: 'activities', name: 'Hoạt động', colorClass: 'bg-lime-400', iconName: 'Star', color: '#84cc16', icon: '🌟' },
  { id: 'experience', name: 'HĐTN', colorClass: 'bg-experience', iconName: 'Compass', color: '#22c55e', icon: '🧭' },
  { id: 'life-skills', name: 'KNS', colorClass: 'bg-life-skills', iconName: 'Handshake', color: '#d946ef', icon: '🤝' },
  { id: 'library', name: 'Thư viện', colorClass: 'bg-library', iconName: 'Library', color: '#6366f1', icon: '📚' },
  { id: 'study-guide', name: 'Hướng dẫn học', colorClass: 'bg-study-guide', iconName: 'GraduationCap', color: '#64748b', icon: '📝' },
  { id: 'integrated', name: 'HĐ lồng ghép', colorClass: 'bg-integrated', iconName: 'Layers', color: '#b45309', icon: '🧩' },
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
