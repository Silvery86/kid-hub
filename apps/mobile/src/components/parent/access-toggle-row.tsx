// access-toggle-row.tsx — web's kid-access/AccessToggleRow.tsx.
//
// Uses RN's Switch rather than the hand-built pill web draws: it is the control
// a parent expects on their own phone, and it inherits platform accessibility.

import type { KidAccessFeature } from '@kid-hub/shared'
import { tokens } from '@kid-hub/shared'
import { Switch, Text, View } from 'react-native'

interface AccessToggleRowProps {
  feature: KidAccessFeature
  enabled: boolean
  onToggle: (next: boolean) => void
  disabled?: boolean
}

export function AccessToggleRow({ feature, enabled, onToggle, disabled }: AccessToggleRowProps) {
  return (
    <View className="min-h-tap flex-row items-center gap-3 rounded-[18px] bg-shell-light px-3 py-2.5">
      <View
        className={`h-9 w-9 items-center justify-center rounded-[10px] ${
          enabled ? 'bg-tier-good-bg' : 'bg-border-soft'
        }`}>
        <Text style={{ fontSize: 18 }}>{feature.icon}</Text>
      </View>

      <Text className="min-w-0 flex-1 font-display-bold text-sm text-text-primary">
        {feature.label}
      </Text>

      <Switch
        value={enabled}
        onValueChange={onToggle}
        disabled={disabled}
        accessibilityLabel={feature.label}
        trackColor={{ false: tokens.colors['border-soft'], true: tokens.colors['btn-primary'] }}
        thumbColor="#ffffff"
      />
    </View>
  )
}
