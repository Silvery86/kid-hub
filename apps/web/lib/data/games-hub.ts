/** Static catalogue for /games hub — section cards and coming-soon placeholders. */

import type { EnglishGameType, MathGameType } from '@/types'

export interface GameSectionGame {
  id: string
  emoji: string
  name: string
}

export interface GameSectionDefinition {
  id: 'math' | 'english'
  label: string
  emoji: string
  color: string
  colorDark: string
  gradient: string
  desc: string
  href: '/math' | '/english'
  games: GameSectionGame[]
}

export const GAME_SECTION_DEFINITIONS: readonly GameSectionDefinition[] = [
  {
    id: 'math',
    label: 'Toán Học',
    emoji: '🧮',
    color: '#3b82f6',
    colorDark: '#1d4ed8',
    gradient: 'linear-gradient(140deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)',
    desc: '3 trò chơi · Đếm, Cộng/Trừ, Hình học',
    href: '/math',
    games: [
      { id: 'counting', emoji: '🌟', name: 'Đếm Sao' },
      { id: 'addition', emoji: '🔢', name: 'Number Ninja' },
      { id: 'shapes', emoji: '🔷', name: 'Khám Phá Hình' },
    ],
  },
  {
    id: 'english',
    label: 'Tiếng Anh',
    emoji: '🔤',
    color: '#10b981',
    colorDark: '#047857',
    gradient: 'linear-gradient(140deg, #34d399 0%, #10b981 55%, #047857 100%)',
    desc: '3 trò chơi · Chữ cái, Từ vựng, Phát âm',
    href: '/english',
    games: [
      { id: 'alphabet', emoji: '🔤', name: 'Alphabet Explorer' },
      { id: 'vocabulary', emoji: '🦁', name: 'Word Safari' },
      { id: 'phonics', emoji: '🔊', name: 'Sound Hunt' },
    ],
  },
] as const

export const COMING_SOON_GAMES = [
  { id: 'science', emoji: '🌱', name: 'Khoa học vui', desc: 'Tự nhiên & Xã hội' },
  { id: 'drawing', emoji: '🎨', name: 'Vẽ Sáng Tạo', desc: 'Mĩ thuật & Hình học' },
  { id: 'music', emoji: '🎵', name: 'Âm Nhạc', desc: 'Nhận biết nốt nhạc' },
] as const

export const STARS_PER_MINIGAME = 3
export const TOTAL_MINIGAMES = GAME_SECTION_DEFINITIONS.reduce(
  (count, section) => count + section.games.length,
  0
)

export type MathMinigameId = MathGameType
export type EnglishMinigameId = EnglishGameType
