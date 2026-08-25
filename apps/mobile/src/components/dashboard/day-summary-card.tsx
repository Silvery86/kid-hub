// day-summary-card.tsx — web's DaySummaryCard, local to ScheduleView.

import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'

interface DaySummaryCardProps {
  dayLabel: string
  date?: string
  periodCount: number
  timeRange: string
  isToday: boolean
}

export function DaySummaryCard({
  dayLabel,
  date,
  periodCount,
  timeRange,
  isToday,
}: DaySummaryCardProps) {
  return (
    <View
      className="flex-row items-center gap-3 rounded-[18px] bg-white p-3.5"
      style={shadow('sm')}>
      <View className="h-11 w-11 items-center justify-center rounded-chip bg-schedule-soft">
        <Text className="font-display-extrabold text-[22px] text-schedule-deep">{periodCount}</Text>
      </View>

      <View className="min-w-0 flex-1">
        <Text className="font-display-extrabold text-[15px] text-text-primary">
          {dayLabel}
          {date ? <Text className="text-[13px] text-text-muted">{`  ${date}`}</Text> : null}
        </Text>
        <Text className="font-display-bold text-xs text-text-secondary">
          {periodCount} tiết · {timeRange}
        </Text>
      </View>

      {isToday ? (
        <View className="rounded-pill bg-schedule px-2.5 py-1">
          <Text className="font-display-extrabold text-[11px] text-white">Hôm nay</Text>
        </View>
      ) : null}
    </View>
  )
}
