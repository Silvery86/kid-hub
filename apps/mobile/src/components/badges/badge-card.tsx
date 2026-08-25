// badge-card.tsx — web's badges/BadgeCard.tsx.
//
// Web greys locked emoji with a CSS `filter: grayscale(.6)`, which RN has no
// equivalent for; the card's own opacity carries that weight instead.

import { tokens } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { coloredShadow } from '@/lib/shadows'

export interface BadgeDisplayItem {
  id: string
  emoji: string
  name: string
  description: string
  isEarned: boolean
  earnedLabel?: string
  progress?: number
}

export function BadgeCard({ badge, compact = false }: { badge: BadgeDisplayItem; compact?: boolean }) {
  const pct = badge.isEarned ? 100 : (badge.progress ?? 0)

  return (
    <View
      className={`min-w-0 flex-1 gap-2 ${compact ? 'rounded-[18px] p-3.5' : 'rounded-[22px] p-4'} ${
        badge.isEarned ? 'bg-white' : 'bg-shell-light'
      }`}
      style={[
        {
          borderWidth: 2,
          borderColor: badge.isEarned
            ? tokens.colors['badge-earned-border']
            : tokens.colors['border-soft'],
          opacity: badge.isEarned ? 1 : 0.75,
        },
        badge.isEarned ? coloredShadow(tokens.colors['progress-high'], 'sm', 0.4) : undefined,
      ]}>
      <Text style={{ fontSize: compact ? 32 : 40 }}>{badge.emoji}</Text>

      <View>
        <Text className={`font-display-bold text-text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
          {badge.name}
        </Text>
        <Text
          className={`mt-0.5 font-display-semibold text-text-secondary ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {badge.description}
        </Text>
      </View>

      {badge.isEarned ? (
        <Text
          className={`font-display-bold text-tier-excellent-text ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {badge.earnedLabel ?? '✓'} Đã đạt
        </Text>
      ) : (
        <View>
          <View className={`overflow-hidden rounded-pill bg-border-soft ${compact ? 'h-1' : 'h-1.5'}`}>
            <View className="h-full rounded-pill bg-btn-primary" style={{ width: `${pct}%` }} />
          </View>
          <Text className="mt-1 font-display-semibold text-[10px] text-text-muted">{pct}%</Text>
        </View>
      )}
    </View>
  )
}
