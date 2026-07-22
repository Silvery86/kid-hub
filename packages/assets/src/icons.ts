/**
 * Icon map — canonical mapping from `iconKey` (stored in the DB, part of the
 * ClassPeriod/DailyHomework contract) to a display emoji and Vietnamese label.
 * Owner: @kid-hub/assets. apps/web/lib/icons.ts re-exports these so web + mobile
 * resolve the same key to the same art (closes the last drift gap — §4.4).
 */

export interface IconEntry {
  emoji: string
  label: string
}

export const ICON_MAP: Record<string, IconEntry> = {
  backpack: { emoji: '🎒', label: 'Học chính' },
  english: { emoji: '🌍', label: 'Tiếng Anh' },
  'math-extra': { emoji: '🔢', label: 'Toán nâng cao' },
  music: { emoji: '🎵', label: 'Âm Nhạc' },
  art: { emoji: '🎨', label: 'Mĩ Thuật' },
  book: { emoji: '📚', label: 'Bài tập' },
  free: { emoji: '🎮', label: 'Tự do' },
  sleep: { emoji: '💤', label: 'Nghỉ ngơi' },
  pe: { emoji: '⚽', label: 'Thể dục' },
  science: { emoji: '🔬', label: 'Khoa học' },
}

export const DEFAULT_ICON: IconEntry = { emoji: '📖', label: 'Học' }

export const getIcon = (key?: string | null): IconEntry =>
  (key ? ICON_MAP[key] : undefined) ?? DEFAULT_ICON
