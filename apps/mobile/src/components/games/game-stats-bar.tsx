// game-stats-bar.tsx — web's games/GameStatsBar.tsx.

import { tokens } from '@kid-hub/shared'
import { Text, View } from 'react-native'

interface GameStatsBarProps {
  points: number
  streak: number
  starsEarned: number
  starsMax: number
  badges: number
  compact?: boolean
}

export function GameStatsBar({
  points,
  streak,
  starsEarned,
  starsMax,
  badges,
  compact = false,
}: GameStatsBarProps) {
  const chips = [
    { icon: '🪙', val: String(points), label: 'điểm', bg: tokens.colors['tier-excellent-bg'], fg: tokens.colors['tier-excellent-text'] },
    { icon: '🔥', val: String(streak), label: 'ngày', bg: tokens.colors['tier-practice-bg'], fg: tokens.colors['tier-practice-text'] },
    { icon: '⭐', val: `${starsEarned}/${starsMax}`, label: 'sao', bg: tokens.colors['tier-good-bg'], fg: tokens.colors['tier-good-text'] },
    { icon: '🏆', val: String(badges), label: 'huy hiệu', bg: tokens.colors['schedule-soft'], fg: tokens.colors['tier-good-text'] },
  ]

  return (
    <View className={`flex-row flex-wrap ${compact ? 'gap-1.5' : 'gap-2.5'}`}>
      {chips.map((c) => (
        <View
          key={c.label}
          className={`flex-row items-center gap-1.5 rounded-pill ${compact ? 'px-3 py-1.5' : 'px-3.5 py-2'}`}
          style={{ backgroundColor: c.bg }}>
          <Text style={{ fontSize: compact ? 14 : 18 }}>{c.icon}</Text>
          <Text
            className={`font-display-bold ${compact ? 'text-[11px]' : 'text-[13px]'}`}
            style={{ color: c.fg }}>
            {c.val} {c.label}
          </Text>
        </View>
      ))}
    </View>
  )
}
