// day-list.tsx — web's dashboard/DayList.tsx.

import { getSubjectById, schoolPeriodsOnly, tokens, type ClassPeriod } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { coloredShadow, shadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'
import { SubjectIcon } from './subject-icon'

/** Subject colour for an id the catalogue does not know. */
const FALLBACK_COLOR = tokens.colors['text-muted']

interface DayListProps {
  periods: ClassPeriod[]
  currentPeriodNumber: number | null
  onPick?: (period: ClassPeriod) => void
}

export function DayList({ periods, currentPeriodNumber, onPick }: DayListProps) {
  const school = schoolPeriodsOnly(periods).sort(
    (a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)
  )

  return (
    <View className="gap-2">
      {school.map((period) => {
        const subject = getSubjectById(period.subjectId)
        const isNow = currentPeriodNumber != null && period.periodNumber === currentPeriodNumber
        const color = subject?.color ?? FALLBACK_COLOR

        return (
          <PressableScale
            key={period.periodNumber ?? period.startTime}
            onPress={() => onPick?.(period)}
            accessibilityRole="button"
            className="flex-row items-center gap-3 rounded-button bg-white p-3"
            style={[
              isNow ? coloredShadow(color, 'lg', 0.35) : shadow('sm'),
              { borderWidth: 2, borderColor: isNow ? color : 'transparent' },
            ]}>
            <View
              className="h-8 w-8 items-center justify-center rounded-[10px]"
              style={{ backgroundColor: isNow ? color : tokens.colors['surface-muted'] }}>
              <Text
                className="font-display-extrabold text-[13px]"
                style={{ color: isNow ? '#ffffff' : tokens.colors['text-secondary'] }}>
                {period.periodNumber}
              </Text>
            </View>

            <SubjectIcon subjectId={period.subjectId} size={40} rounded={11} />

            <View className="min-w-0 flex-1">
              <Text className="font-display-extrabold text-sm text-text-primary">
                {subject?.name ?? '—'}
              </Text>
              <Text className="font-display-bold text-xs text-text-secondary">
                {period.startTime} – {period.endTime}
              </Text>
            </View>

            {isNow ? (
              <View className="rounded-pill bg-schedule-soft px-2.5 py-1">
                <Text className="font-display-extrabold text-[11px] text-schedule-deep">Đang học</Text>
              </View>
            ) : null}
          </PressableScale>
        )
      })}
    </View>
  )
}
