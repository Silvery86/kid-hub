// grade-tier-badge.tsx — web's grades/GradeTierBadge.tsx.

import type { BadgeTier } from '@kid-hub/shared'
import { Text, View } from 'react-native'

const TIER_STYLES: Record<BadgeTier, { container: string; label: string }> = {
  excellent: {
    container: 'bg-tier-excellent-bg border-tier-excellent-border',
    label: 'text-tier-excellent-text',
  },
  good: {
    container: 'bg-tier-good-bg border-tier-good-border',
    label: 'text-tier-good-text',
  },
  'needs-practice': {
    container: 'bg-tier-practice-bg border-tier-practice-border',
    label: 'text-tier-practice-text',
  },
}

const TIER_LABELS: Record<BadgeTier, string> = {
  excellent: 'Xuất sắc',
  good: 'Giỏi',
  'needs-practice': 'Cần cố gắng',
}

export function GradeTierBadge({ tier, compact = false }: { tier: BadgeTier; compact?: boolean }) {
  const { container, label } = TIER_STYLES[tier]
  return (
    <View className={`rounded-pill border-2 ${compact ? 'px-2 py-0.5' : 'px-2.5 py-0.5'} ${container}`}>
      <Text className={`font-display-bold ${compact ? 'text-[10px]' : 'text-[11px]'} ${label}`}>
        {TIER_LABELS[tier]}
      </Text>
    </View>
  )
}
