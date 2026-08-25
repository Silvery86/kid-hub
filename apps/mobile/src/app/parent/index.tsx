// Parent dashboard — web's /parent (ParentDashboardView).
//
// Web puts a w-52 sidebar beside a two-panel manager and switches with a ?view=
// query param. Neither fits a phone, so the three panels become a segmented
// control over a single scrolling column (MOBILE_UI_IMP.md §9).
import { formatDayTimeRange, schoolPeriodsOnly } from '@kid-hub/shared'
import { Redirect, useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { GradesManager } from '@/components/parent/grades-manager'
import { ScheduleManager } from '@/components/parent/schedule-manager'
import { SegmentedControl, type Segment } from '@/components/parent/segmented-control'
import { QueryBoundary } from '@/components/query-boundary'
import { FadeSlideUp } from '@/components/ui/animated'
import { KidButton } from '@/components/ui/kid-button'
import { Screen } from '@/components/ui/screen'
import { shadow } from '@/lib/shadows'
import { useGrades } from '@/hooks/use-grades'
import { useParentGate } from '@/hooks/use-parent-gate'
import { useSchedule, useWeekSchedule } from '@/hooks/use-schedule'
import { useTodayHomework } from '@/hooks/use-homework'

type PanelView = 'today' | 'schedule' | 'grades'

const SEGMENTS: readonly Segment<PanelView>[] = [
  { id: 'today', label: 'Hôm nay', emoji: '📋' },
  { id: 'schedule', label: 'Lịch học', emoji: '🗓️' },
  { id: 'grades', label: 'Điểm số', emoji: '⭐' },
]

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 gap-1 rounded-button bg-white p-3" style={shadow('sm')}>
      <Text className="font-display-bold text-xl text-text-primary">{value}</Text>
      <Text className="font-display-semibold text-[11px] text-text-secondary">{label}</Text>
    </View>
  )
}

export default function ParentDashboard() {
  const router = useRouter()
  const { isVerified, reset } = useParentGate()
  const [view, setView] = useState<PanelView>('today')

  const today = useSchedule()
  const week = useWeekSchedule()
  const grades = useGrades()
  const homework = useTodayHomework()

  if (!isVerified) return <Redirect href="/parent/pin" />

  const periods = schoolPeriodsOnly(today.data?.schoolPeriods ?? [])
  const homeworkItems = homework.data ?? []
  const doneCount = homeworkItems.filter((h) => h.isDone).length

  return (
    <Screen variant="parent" bare>
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 px-3.5 pb-6 pt-3.5"
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between gap-2">
          <Text className="font-display-bold text-2xl text-text-primary">Bố mẹ 🛡️</Text>
          <KidButton
            variant="ghost"
            onPress={() => {
              // Closing the section re-locks it; the PIN is asked again.
              reset()
              router.replace('/(tabs)/dashboard')
            }}
            accessibilityLabel="Thoát khu vực bố mẹ">
            Thoát
          </KidButton>
        </View>

        <SegmentedControl segments={SEGMENTS} active={view} onChange={setView} />

        {view === 'today' ? (
          <FadeSlideUp className="gap-3">
            <View className="flex-row gap-2">
              <Stat label="Tiết hôm nay" value={String(periods.length)} />
              <Stat label="Bài tập xong" value={`${doneCount}/${homeworkItems.length}`} />
              <Stat
                label="Điểm TB"
                value={grades.data ? grades.data.averageScore.toFixed(1) : '—'}
              />
            </View>

            <View className="gap-2 rounded-card bg-white p-4" style={shadow('sm')}>
              <Text className="font-display-bold text-base text-text-primary">Lịch hôm nay</Text>
              <Text className="font-display-semibold text-xs text-text-secondary">
                {periods.length > 0 ? formatDayTimeRange(periods) : 'Không có tiết học'}
              </Text>
            </View>

            <KidButton onPress={() => router.navigate('/parent/kid-access')}>
              🔐 Quyền của bé
            </KidButton>
          </FadeSlideUp>
        ) : null}

        {view === 'schedule' ? (
          <QueryBoundary
            isLoading={week.isLoading}
            isError={week.isError}
            onRetry={week.refetch}>
            <ScheduleManager week={week.data} />
          </QueryBoundary>
        ) : null}

        {view === 'grades' ? (
          <QueryBoundary
            isLoading={grades.isLoading}
            isError={grades.isError}
            onRetry={grades.refetch}>
            <GradesManager grades={grades.data?.grades ?? []} />
          </QueryBoundary>
        ) : null}
      </ScrollView>
    </Screen>
  )
}
