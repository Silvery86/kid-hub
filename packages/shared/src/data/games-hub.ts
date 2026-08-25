/**
 * Static catalogue for the /games hub — section cards and coming-soon placeholders.
 * Owner: @kid-hub/shared — apps/web/lib/data/games-hub.ts re-exports these.
 * `href` values are the shared route names; both Next.js and Expo Router use /math
 * and /english.
 */

import type { EnglishGameType, MathGameType } from '../types'

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
  /**
   * Gradient as data rather than a CSS string: React Native cannot parse
   * `linear-gradient(...)`, and expo-linear-gradient wants the stops as an
   * array. Web renders the same values through `cssLinearGradient()`.
   */
  gradientAngle: number
  gradientStops: readonly string[]
  desc: string
  href: '/math' | '/english'
  games: GameSectionGame[]
}

/**
 * The CSS `linear-gradient(...)` for a section, for the web card only.
 * Stops are spread evenly the way the hand-written values were: 0%, 55%, 100%.
 */
export const cssLinearGradient = (section: GameSectionDefinition): string => {
  const last = section.gradientStops.length - 1
  const stops = section.gradientStops.map((color, i) => {
    const pct = i === 0 ? 0 : i === last ? 100 : Math.round((i / last) * 110)
    return `${color} ${pct}%`
  })
  return `linear-gradient(${section.gradientAngle}deg, ${stops.join(', ')})`
}

export const GAME_SECTION_DEFINITIONS: readonly GameSectionDefinition[] = [
  {
    id: 'math',
    label: 'Toán Học',
    emoji: '🧮',
    color: '#3b82f6',
    colorDark: '#1d4ed8',
    gradientAngle: 140,
    gradientStops: ['#60a5fa', '#3b82f6', '#2563eb'],
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
    gradientAngle: 140,
    gradientStops: ['#34d399', '#10b981', '#047857'],
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
