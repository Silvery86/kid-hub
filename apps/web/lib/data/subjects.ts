/** Static subject definitions for the 1st-grade Vietnamese primary school curriculum. */

import type { Subject } from '@/types'

/**
 * Canonical list of subjects for a 1st-grade Vietnamese primary school class.
 * colorClass → Tailwind background (legacy cards).
 * color + icon → schedule PeriodCell (color-mix tinting).
 */
export const SUBJECTS: readonly Subject[] = [
  { id: 'math', name: 'Toán', colorClass: 'bg-math', iconName: 'Calculator', color: '#3b82f6', icon: '📐' },
  { id: 'vietnamese', name: 'Tiếng Việt', colorClass: 'bg-vietnamese', iconName: 'BookOpen', color: '#ef4444', icon: '📖' },
  { id: 'english', name: 'Tiếng Anh', colorClass: 'bg-english', iconName: 'Globe', color: '#10b981', icon: '🔤' },
  { id: 'science', name: 'Tự nhiên & XH', colorClass: 'bg-science', iconName: 'Leaf', color: '#8b5cf6', icon: '🔬' },
  { id: 'ethics', name: 'Đạo đức', colorClass: 'bg-violet-400', iconName: 'Heart', color: '#14b8a6', icon: '🌱' },
  { id: 'pe', name: 'Thể dục', colorClass: 'bg-pe', iconName: 'Dumbbell', color: '#f59e0b', icon: '⚽' },
  { id: 'music', name: 'Âm nhạc', colorClass: 'bg-music', iconName: 'Music', color: '#f97316', icon: '🎵' },
  { id: 'art', name: 'Mĩ thuật', colorClass: 'bg-art', iconName: 'Palette', color: '#ec4899', icon: '🎨' },
  { id: 'it', name: 'Tin học', colorClass: 'bg-cyan-400', iconName: 'Monitor', color: '#06b6d4', icon: '💻' },
  { id: 'activities', name: 'Hoạt động', colorClass: 'bg-lime-400', iconName: 'Star', color: '#84cc16', icon: '🌟' },
] as const

/** Look up a subject by its ID. Returns undefined if not found. */
export const getSubjectById = (id: string): Subject | undefined => SUBJECTS.find((s) => s.id === id)
