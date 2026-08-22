// semester-tabs.tsx — web's grades/SemesterTabs.tsx.

import { Text, View } from 'react-native'

import { coloredShadow } from '@/lib/shadows'
import { tokens } from '@kid-hub/shared'
import { PressableScale } from '@/components/ui/animated'

const SEMESTERS = [1, 2] as const

interface SemesterTabsProps {
  active: 1 | 2
  onChange: (semester: 1 | 2) => void
  compact?: boolean
}

export function SemesterTabs({ active, onChange, compact = false }: SemesterTabsProps) {
  return (
    <View className="flex-row self-start gap-1 rounded-button bg-white p-1">
      {SEMESTERS.map((s) => {
        const isActive = active === s
        return (
          <PressableScale
            key={s}
            onPress={() => onChange(s)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`rounded-chip ${compact ? 'px-4 py-1.5' : 'px-5 py-2'} ${isActive ? 'bg-btn-primary' : ''}`}
            // Web's 0 4px 10px -3px rgba(59,130,246,0.55) glow under the active tab.
            style={isActive ? coloredShadow(tokens.colors['btn-primary'], 'sm', 0.55) : undefined}>
            <Text
              className={`font-display-bold ${compact ? 'text-xs' : 'text-sm'} ${
                isActive ? 'text-white' : 'text-text-secondary'
              }`}>
              Học kỳ {s}
            </Text>
          </PressableScale>
        )
      })}
    </View>
  )
}
