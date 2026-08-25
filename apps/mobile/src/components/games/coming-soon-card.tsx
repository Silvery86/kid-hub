// coming-soon-card.tsx — web's games/ComingSoonCard.tsx.

import { tokens } from '@kid-hub/shared'
import { Text, View } from 'react-native'

interface ComingSoonCardProps {
  emoji: string
  name: string
  desc: string
  compact?: boolean
}

export function ComingSoonCard({ emoji, name, desc, compact = false }: ComingSoonCardProps) {
  return (
    <View
      accessibilityState={{ disabled: true }}
      className={`flex-1 bg-white ${compact ? 'gap-1.5 rounded-button p-3.5' : 'gap-2 rounded-row p-4'}`}
      style={{
        opacity: 0.5,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: tokens.colors['border-soft'],
      }}>
      <View className={`absolute rounded-pill bg-surface-muted px-2 py-0.5 ${compact ? 'right-2 top-2' : 'right-2.5 top-2.5'}`}>
        <Text className="font-display-bold text-[10px] text-text-muted">Sắp ra mắt</Text>
      </View>
      <Text style={{ fontSize: compact ? 28 : 36 }}>{emoji}</Text>
      <View>
        <Text className={`font-display-bold text-text-body-soft ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
          {name}
        </Text>
        <Text className={`mt-0.5 font-display-semibold text-text-muted ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
          {desc}
        </Text>
      </View>
    </View>
  )
}
