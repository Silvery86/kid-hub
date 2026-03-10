import type { Subject } from '@/types';

/**
 * Canonical list of subjects for a 1st-grade Vietnamese primary school class.
 * colorClass  → Tailwind background colour class (used on subject cards).
 * iconName    → lucide-react icon name (rendered via dynamic lookup in SubjectCard).
 */
export const SUBJECTS: readonly Subject[] = [
  { id: 'math',       name: 'Toán',            colorClass: 'bg-blue-400',    iconName: 'Calculator' },
  { id: 'vietnamese', name: 'Tiếng Việt',      colorClass: 'bg-red-400',     iconName: 'BookOpen' },
  { id: 'english',    name: 'Tiếng Anh',       colorClass: 'bg-emerald-400', iconName: 'Globe' },
  { id: 'science',    name: 'Tự nhiên & XH',   colorClass: 'bg-green-400',   iconName: 'Leaf' },
  { id: 'ethics',     name: 'Đạo đức',         colorClass: 'bg-violet-400',  iconName: 'Heart' },
  { id: 'pe',         name: 'Thể dục',         colorClass: 'bg-orange-400',  iconName: 'Dumbbell' },
  { id: 'music',      name: 'Âm nhạc',         colorClass: 'bg-yellow-400',  iconName: 'Music' },
  { id: 'art',        name: 'Mĩ thuật',        colorClass: 'bg-pink-400',    iconName: 'Palette' },
  { id: 'it',         name: 'Tin học',         colorClass: 'bg-cyan-400',    iconName: 'Monitor' },
  { id: 'activities', name: 'Hoạt động',       colorClass: 'bg-lime-400',    iconName: 'Star' },
] as const;

/** Look up a subject by its ID. Returns undefined if not found. */
export const getSubjectById = (id: string): Subject | undefined =>
  SUBJECTS.find((s) => s.id === id);
