// segmented-control.tsx — replaces web's w-52 parent sidebar and its ?view=
// query param. A phone has no room for a persistent side rail, so the three
// panels become one control at the top of the screen.

import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'

export interface Segment<T extends string> {
  id: T
  label: string
  emoji: string
}

interface SegmentedControlProps<T extends string> {
  segments: readonly Segment<T>[]
  active: T
  onChange: (id: T) => void
}

export function SegmentedControl<T extends string>({
  segments,
  active,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row gap-1 rounded-button bg-white p-1" style={shadow('sm')}>
      {segments.map((s) => {
        const isActive = s.id === active
        return (
          <PressableScale
            key={s.id}
            onPress={() => onChange(s.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`min-h-tap flex-1 items-center justify-center gap-0.5 rounded-chip py-1.5 ${
              isActive ? 'bg-btn-primary' : ''
            }`}>
            <Text style={{ fontSize: 16 }}>{s.emoji}</Text>
            <Text
              className={`font-display-extrabold text-[11px] ${
                isActive ? 'text-white' : 'text-text-secondary'
              }`}>
              {s.label}
            </Text>
          </PressableScale>
        )
      })}
    </View>
  )
}
