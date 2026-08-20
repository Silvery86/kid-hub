// progress-bar.tsx — web's ui/ProgressBar.tsx.

import { View } from 'react-native'

const getColorClass = (pct: number): string => {
  if (pct >= 90) return 'bg-progress-high'
  if (pct >= 70) return 'bg-progress-mid'
  return 'bg-progress-low'
}

interface ProgressBarProps {
  value: number
  max?: number
  accessibilityLabel?: string
  className?: string
}

export function ProgressBar({ value, max = 100, accessibilityLabel, className = '' }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: value }}
      accessibilityLabel={accessibilityLabel}
      className={`h-4 w-full overflow-hidden rounded-pill bg-progress-track ${className}`.trim()}>
      <View className={`h-full rounded-pill ${getColorClass(pct)}`} style={{ width: `${pct}%` }} />
    </View>
  )
}
