/** Icon map — canonical mapping from iconKey (stored in DB) to display emoji and Vietnamese label. */

export interface IconEntry {
  emoji: string
  label: string
}

export const ICON_MAP: Record<string, IconEntry> = {
  backpack:   { emoji: '🎒', label: 'Học chính' },
  english:    { emoji: '🌍', label: 'Tiếng Anh' },
  'math-extra': { emoji: '🔢', label: 'Toán nâng cao' },
  music:      { emoji: '🎵', label: 'Âm Nhạc' },
  art:        { emoji: '🎨', label: 'Mĩ Thuật' },
  book:       { emoji: '📚', label: 'Bài tập' },
  free:       { emoji: '🎮', label: 'Tự do' },
  sleep:      { emoji: '💤', label: 'Nghỉ ngơi' },
  pe:         { emoji: '⚽', label: 'Thể dục' },
  science:    { emoji: '🔬', label: 'Khoa học' },
}

export const DEFAULT_ICON: IconEntry = { emoji: '📖', label: 'Học' }

export const getIcon = (key?: string | null): IconEntry =>
  (key ? ICON_MAP[key] : undefined) ?? DEFAULT_ICON
