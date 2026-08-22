// day-rail.tsx — web's dashboard/DayRail.tsx.
//
// Web's `animate-ping-ring` on the live dot is not ported: Phase 2 skipped the
// ping keyframe, and a solid dot reads the same at this size.

import { getSubjectById, schoolPeriodsOnly, tokens, type ClassPeriod } from '@kid-hub/shared'
import { ScrollView, Text, View } from 'react-native'

import { coloredShadow } from '@/lib/shadows'
import { PressableScale } from '@/components/ui/animated'
import { SubjectIcon } from './subject-icon'

/** Subject colour for an id the catalogue does not know. */
const FALLBACK_COLOR = tokens.colors['btn-primary']

interface DayRailProps {
  periods: ClassPeriod[]
  currentPeriodNumber: number | null
  progress?: number | null
  onPick?: (period: ClassPeriod) => void
}

export function DayRail({ periods, currentPeriodNumber, progress, onPick }: DayRailProps) {
  const school = schoolPeriodsOnly(periods).sort(
    (a, b) => (a.periodNumber ?? 0) - (b.periodNumber ?? 0)
  )

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2.5 pb-1">
      {school.map((period) => {
        const subject = getSubjectById(period.subjectId)
        const isNow = currentPeriodNumber != null && period.periodNumber === currentPeriodNumber
        const isDone =
          currentPeriodNumber != null &&
          period.periodNumber != null &&
          period.periodNumber < currentPeriodNumber
        const color = subject?.color ?? FALLBACK_COLOR

        return (
          <PressableScale
            key={period.periodNumber ?? period.startTime}
            onPress={() => onPick?.(period)}
            accessibilityRole="button"
            className={`rounded-button bg-white p-3 ${isNow ? 'min-w-[200px]' : 'min-w-[140px]'}`}
            style={[
              {
                borderWidth: 2,
                borderColor: isNow ? color : tokens.colors['border-soft'],
                opacity: isDone ? 0.55 : 1,
              },
              isNow ? coloredShadow(color, 'lg', 0.35) : undefined,
            ]}>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-display-bold text-[10px] uppercase text-text-muted">
                Tiết {period.periodNumber}
              </Text>
              {isDone ? <Text className="text-sm text-progress-complete">✓</Text> : null}
              {isNow ? (
                <View className="h-2 w-2 rounded-pill" style={{ backgroundColor: color }} />
              ) : null}
            </View>

            <View className="flex-row items-center gap-2">
              <SubjectIcon subjectId={period.subjectId} size={28} rounded={8} />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="font-display-bold text-[13px] text-text-primary">
                  {subject?.name}
                </Text>
                <Text className="font-display-semibold text-[11px] text-text-muted">
                  {period.startTime}
                </Text>
              </View>
            </View>

            {isNow && progress != null ? (
              <View className="mt-2 h-1 overflow-hidden rounded-pill bg-surface-muted">
                <View
                  className="h-full rounded-pill"
                  style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: color }}
                />
              </View>
            ) : null}
          </PressableScale>
        )
      })}
    </ScrollView>
  )
}
