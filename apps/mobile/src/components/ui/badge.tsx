// badge.tsx — web's ui/Badge.tsx.

import { Text, View } from 'react-native'
import type { BadgeTier } from '@kid-hub/shared'

const BADGE_CONFIG: Record<BadgeTier, { container: string; label: string; defaultLabel: string; emoji: string }> = {
  excellent: {
    container: 'bg-tier-excellent-bg border-tier-excellent-border',
    label: 'text-tier-excellent-text',
    defaultLabel: 'Excellent',
    emoji: '⭐',
  },
  good: {
    container: 'bg-tier-good-bg border-tier-good-border',
    label: 'text-tier-good-text',
    defaultLabel: 'Good',
    emoji: '👍',
  },
  'needs-practice': {
    container: 'bg-tier-practice-bg border-tier-practice-border',
    label: 'text-tier-practice-text',
    defaultLabel: 'Keep Trying!',
    emoji: '💪',
  },
}

interface BadgeProps {
  variant: BadgeTier
  label?: string
  className?: string
}

export function Badge({ variant, label, className = '' }: BadgeProps) {
  const config = BADGE_CONFIG[variant]
  return (
    <View
      className={`flex-row items-center gap-1.5 self-start rounded-pill border-2 px-3 py-1.5 ${config.container} ${className}`.trim()}>
      <Text className="text-sm">{config.emoji}</Text>
      <Text className={`font-display-bold text-sm ${config.label}`}>{label ?? config.defaultLabel}</Text>
    </View>
  )
}
