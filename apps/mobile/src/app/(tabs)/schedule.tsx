// Schedule tab — web's /schedule phone-portrait branch (ScheduleView).
//
// Web's phone branch hides the week navigation (it is `hidden sm:flex`), so this
// screen shows the current week only, exactly as a phone browser does.
import {
  DAY_LABELS,
  formatDayTimeRange,
  formatWeekSubtitleForOffset,
  getWeekDates,
  schoolDaysFromSchedule,
  schoolPeriodsOnly,
  type ClassPeriod,
  type DayOfWeek,
} from '@kid-hub/shared'
import { useMemo, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { QueryBoundary } from '@/components/query-boundary'
import { DayList } from '@/components/dashboard/day-list'
import { DaySummaryCard } from '@/components/dashboard/day-summary-card'
import { DayTabs } from '@/components/dashboard/day-tabs'
import { EveningBlockList, WeekEveningSection } from '@/components/dashboard/evening-blocks'
import { FadeSlideUp, STAGGER_MS } from '@/components/ui/animated'
import { Screen } from '@/components/ui/screen'
import { useNow } from '@/hooks/use-now'
import { useWeekSchedule } from '@/hooks/use-schedule'

const JS_DAY_TO_DOW: Record<number, DayOfWeek> = {
  0: 'sunday',
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

const findCurrentPeriod = (periods: ClassPeriod[], now: Date): ClassPeriod | null => {
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return (
    schoolPeriodsOnly(periods).find(
      (p) => nowMinutes >= toMinutes(p.startTime) && nowMinutes < toMinutes(p.endTime)
    ) ?? null
  )
}

export default function ScheduleScreen() {
  const { data, isLoading, isError, refetch } = useWeekSchedule()
  const now = useNow()

  // Null until the clock is known, so nothing highlights "today" before mount.
  const todayDow = now ? (JS_DAY_TO_DOW[now.getDay()] ?? null) : null

  const schoolDays = useMemo(() => schoolDaysFromSchedule(data?.days ?? []), [data])
  const eveningByDay = useMemo(
    () => new Map((data?.eveningBlocks ?? []).map((d) => [d.day, d.periods])),
    [data]
  )
  const weekDates = useMemo(() => getWeekDates(0), [])

  const [pickedDay, setPickedDay] = useState<DayOfWeek | null>(null)
  const activeDay = pickedDay ?? todayDow ?? 'monday'

  const activePeriods = schoolDays.find((d) => d.day === activeDay)?.periods ?? []
  const currentPeriodNumber =
    now && activeDay === todayDow ? (findCurrentPeriod(activePeriods, now)?.periodNumber ?? null) : null

  return (
    <Screen bare>
      <QueryBoundary isLoading={isLoading} isError={isError} onRetry={refetch}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 px-3.5 pb-4 pt-3.5"
          showsVerticalScrollIndicator={false}>
          <View>
            <Text className="font-display-bold text-[22px] text-text-primary">Lịch học</Text>
            <Text className="mt-0.5 font-display-semibold text-xs text-text-secondary">
              {formatWeekSubtitleForOffset(0)}
            </Text>
          </View>

          <DayTabs
            activeDay={activeDay}
            todayDow={todayDow}
            onChange={setPickedDay}
            compact
            dateByDay={weekDates}
          />

          <FadeSlideUp delay={STAGGER_MS[0]}>
            <DaySummaryCard
              dayLabel={DAY_LABELS[activeDay]}
              date={weekDates[activeDay]}
              periodCount={schoolPeriodsOnly(activePeriods).length}
              timeRange={formatDayTimeRange(activePeriods)}
              isToday={activeDay === todayDow}
            />
          </FadeSlideUp>

          <FadeSlideUp delay={STAGGER_MS[1]}>
            <DayList periods={activePeriods} currentPeriodNumber={currentPeriodNumber} />
            <EveningBlockList blocks={eveningByDay.get(activeDay) ?? []} />
          </FadeSlideUp>

          <FadeSlideUp delay={STAGGER_MS[2]}>
            <WeekEveningSection eveningByDay={eveningByDay} dateByDay={weekDates} />
          </FadeSlideUp>
        </ScrollView>
      </QueryBoundary>
    </Screen>
  )
}
