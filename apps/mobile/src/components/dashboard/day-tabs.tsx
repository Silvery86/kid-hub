// day-tabs.tsx — web's dashboard/DayTabs.tsx.

import { DAY_LABELS, SCHOOL_DAYS, dayShortLabel, tokens, type DayOfWeek } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { coloredShadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'

interface DayTabsProps {
  activeDay: DayOfWeek
  todayDow: DayOfWeek | null
  onChange: (day: DayOfWeek) => void
  compact?: boolean
  dateByDay?: Partial<Record<DayOfWeek, string>>
}

export function DayTabs({
  activeDay,
  todayDow,
  onChange,
  compact = true,
  dateByDay,
}: DayTabsProps) {
  return (
    <View className="flex-row gap-1 rounded-button bg-white p-1">
      {SCHOOL_DAYS.map((dow) => {
        const active = dow === activeDay
        const isToday = dow === todayDow
        const date = dateByDay?.[dow]

        return (
          <PressableScale
            key={dow}
            onPress={() => onChange(dow)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            className={`flex-1 items-center rounded-chip ${compact ? 'px-1 py-1' : 'px-2 py-2.5'} ${
              active ? 'bg-schedule' : ''
            }`}
            style={active ? coloredShadow(tokens.colors.schedule, 'sm', 0.5) : undefined}>
            <Text
              className={`font-display-extrabold ${compact ? 'text-[11px]' : 'text-[13px]'} ${
                active ? 'text-white' : isToday ? 'text-schedule-deep' : 'text-text-body'
              }`}>
              {compact ? dayShortLabel(dow) : DAY_LABELS[dow]}
            </Text>
            {date ? (
              <Text
                className={`font-display-bold text-[9px] ${active ? 'text-white' : 'text-text-body'}`}
                style={{ opacity: active ? 0.85 : 0.5 }}>
                {date}
              </Text>
            ) : null}
            {isToday && !active ? (
              <View className="mt-0.5 h-1 w-1 rounded-pill bg-schedule" />
            ) : null}
          </PressableScale>
        )
      })}
    </View>
  )
}
