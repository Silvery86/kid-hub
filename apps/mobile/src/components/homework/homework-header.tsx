// homework-header.tsx — web's homework/HomeworkHeader.tsx.
//
// The percentage ring is drawn inline rather than through ui/progress-ring,
// mirroring web: this one carries a label in the middle and its own stroke
// weight, which the shared primitive deliberately does not expose.

import { dayShortLabel, tokens, type DayOfWeek } from '@kid-hub/shared'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import Svg, { Circle } from 'react-native-svg'

import { shadow } from '@/lib/shadows'

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

interface HomeworkHeaderProps {
  total: number
  done: number
  compact?: boolean
}

export function HomeworkHeader({ total, done, compact = false }: HomeworkHeaderProps) {
  // Resolved after mount, as on web — the label depends on the device clock.
  const [dayLabel, setDayLabel] = useState('')
  useEffect(() => {
    const dow = JS_DAY_TO_DOW[new Date().getDay()]
    setDayLabel(dow ? dayShortLabel(dow) : '')
  }, [])

  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const ring = compact ? 48 : 60
  const r = compact ? 20 : 25
  const stroke = compact ? 5 : 6
  const circumference = 2 * Math.PI * r

  return (
    <View
      className={`rounded-card bg-white ${compact ? 'gap-2 p-3' : 'gap-3 p-4'}`}
      style={shadow('sm')}>
      <View className="flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className={`font-display-extrabold text-text-primary ${compact ? 'text-[13px]' : 'text-base'}`}>
            Bài tập hôm nay
          </Text>
          <Text
            className={`mt-0.5 font-display-bold text-text-secondary ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
            {done}/{total} bài đã hoàn thành
            {dayLabel ? ` · ${dayLabel}` : ''}
          </Text>
        </View>

        <View className="items-center justify-center" style={{ width: ring, height: ring }}>
          <Svg width={ring} height={ring} style={{ position: 'absolute' }}>
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke={tokens.colors['surface-muted']}
              strokeWidth={stroke}
            />
            <Circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke={tokens.colors['progress-complete']}
              strokeWidth={stroke}
              strokeDasharray={`${(circumference * pct) / 100} 999`}
              strokeLinecap="round"
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
            />
          </Svg>
          <Text className={`font-display-extrabold text-text-primary ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
            {pct}%
          </Text>
        </View>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
        className={`overflow-hidden rounded-pill bg-surface-muted ${compact ? 'h-1.5' : 'h-2'}`}>
        <View className="h-full rounded-pill bg-progress-complete" style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}
