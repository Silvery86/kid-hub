/** Kid access feature toggles — UI state; persisted in localStorage on parent kid-access page. */

export type KidAccessGroup = 'games' | 'views' | 'settings'

export interface KidAccessFeature {
  id: string
  icon: string
  label: string
  group: KidAccessGroup
}

export const KID_ACCESS_FEATURES: readonly KidAccessFeature[] = [
  { id: 'math-games', icon: '🧮', label: 'Trò chơi Toán', group: 'games' },
  { id: 'english-games', icon: '🔤', label: 'Trò chơi Tiếng Anh', group: 'games' },
  { id: 'schedule', icon: '📅', label: 'Xem lịch học', group: 'views' },
  { id: 'grades', icon: '⭐', label: 'Xem điểm số', group: 'views' },
  { id: 'homework', icon: '📚', label: 'Bài tập về nhà', group: 'views' },
  { id: 'badges', icon: '🏆', label: 'Huy hiệu & phần thưởng', group: 'views' },
  { id: 'sounds', icon: '🔊', label: 'Âm thanh trò chơi', group: 'settings' },
  { id: 'animations', icon: '✨', label: 'Hiệu ứng hoạt ảnh', group: 'settings' },
] as const

export const KID_ACCESS_GROUP_LABELS: Record<KidAccessGroup, string> = {
  games: 'Trò chơi',
  views: 'Màn hình xem',
  settings: 'Cài đặt',
}

export const DEFAULT_KID_ACCESS_TOGGLES: Record<string, boolean> = Object.fromEntries(
  KID_ACCESS_FEATURES.map((f) => [f.id, true])
)

/** Demo progress % for locked badges (matches design mock). */
export const BADGE_PROGRESS_HINT: Record<string, number> = {
  'english-hero': 75,
  'streak-7': 86,
  'all-green': 90,
  'top-score': 60,
}
