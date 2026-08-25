// schedule-manager.tsx — the phone counterpart of web's parent/ScheduleManager.
//
// Web's version is a 906-line week grid: a day column per weekday, an inline
// editor panel beside it, and drag targets. None of that survives a 390px
// viewport, and MOBILE_UI_IMP.md §9 asks for a mobile design rather than a
// port. So: pick a day, see that day's rows, add or remove one at a time.
//
// The same server rules still apply — overlap, the three-per-day cap on evening
// classes — and are surfaced as the error text the endpoint returns.

import {
  DAY_LABELS,
  SCHOOL_DAYS,
  SUBJECTS,
  getSubjectById,
  schoolPeriodsOnly,
  type ClassPeriod,
  type DayOfWeek,
  type WeekView,
} from '@kid-hub/shared'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-native'

import { DayTabs } from '@/components/dashboard/day-tabs'
import { SubjectIcon } from '@/components/dashboard/subject-icon'
import { KidButton } from '@/components/ui/kid-button'
import { PressableScale } from '@/components/ui/animated'
import { shadow } from '@/lib/shadows'
import { useCreateExtraClass, useCreatePeriod, useDeletePeriod } from '@/hooks/use-parent'

/** New rows land at the end of the day; the parent edits times afterwards. */
const DEFAULT_PERIOD_MINUTES = 40
const FIRST_PERIOD_START = '07:30'
const FIRST_EVENING_START = '18:00'

const toMinutes = (t: string): number => {
  const [h, m] = t.split(':')
  return parseInt(h ?? '0', 10) * 60 + parseInt(m ?? '0', 10)
}

const toTime = (mins: number): string =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`

/** The slot after the last row of the day, so a new row never overlaps. */
const nextSlot = (rows: ClassPeriod[], fallbackStart: string) => {
  const last = [...rows].sort((a, b) => toMinutes(b.endTime) - toMinutes(a.endTime))[0]
  const start = last ? toMinutes(last.endTime) : toMinutes(fallbackStart)
  return { startTime: toTime(start), endTime: toTime(start + DEFAULT_PERIOD_MINUTES) }
}

function SubjectPicker({
  onPick,
  disabled,
}: {
  onPick: (subjectId: string) => void
  disabled?: boolean
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {SUBJECTS.map((s) => (
        <PressableScale
          key={s.id}
          onPress={() => onPick(s.id)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Thêm ${s.name}`}
          className="min-h-tap flex-row items-center gap-1.5 rounded-pill border-2 border-border-soft bg-white px-3 py-1.5"
          style={{ opacity: disabled ? 0.5 : 1 }}>
          <Text style={{ fontSize: 14 }}>{s.icon}</Text>
          <Text className="font-display-extrabold text-xs text-text-primary">{s.name}</Text>
        </PressableScale>
      ))}
    </View>
  )
}

function RowCard({
  period,
  onDelete,
  isDeleting,
}: {
  period: ClassPeriod
  onDelete: () => void
  isDeleting: boolean
}) {
  const subject = getSubjectById(period.subjectId)
  return (
    <View
      className="flex-row items-center gap-3 rounded-button bg-white p-3"
      style={shadow('sm')}>
      <SubjectIcon subjectId={period.subjectId} size={36} rounded={10} />
      <View className="min-w-0 flex-1">
        <Text numberOfLines={1} className="font-display-extrabold text-sm text-text-primary">
          {subject?.name ?? period.subjectId}
        </Text>
        <Text className="font-display-bold text-xs text-text-secondary">
          {period.startTime} – {period.endTime}
          {period.periodNumber != null ? ` · Tiết ${period.periodNumber}` : ''}
        </Text>
      </View>
      <KidButton
        variant="danger"
        isLoading={isDeleting}
        onPress={onDelete}
        accessibilityLabel={`Xoá ${subject?.name ?? period.subjectId}`}>
        🗑
      </KidButton>
    </View>
  )
}

export function ScheduleManager({ week }: { week: WeekView | undefined }) {
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday')
  const [error, setError] = useState('')

  const createPeriod = useCreatePeriod()
  const createExtra = useCreateExtraClass()
  const deletePeriod = useDeletePeriod()

  const periods = useMemo(
    () => schoolPeriodsOnly(week?.days.find((d) => d.day === activeDay)?.periods ?? []),
    [week, activeDay]
  )
  const evening = useMemo(
    () => week?.eveningBlocks.find((d) => d.day === activeDay)?.periods ?? [],
    [week, activeDay]
  )

  const onError = (e: unknown) => setError(e instanceof Error ? e.message : 'Không lưu được')

  const addPeriod = (subjectId: string) => {
    setError('')
    const slot = nextSlot(periods, FIRST_PERIOD_START)
    createPeriod.mutate(
      {
        day: activeDay,
        periodNumber: periods.length + 1,
        subjectId,
        ...slot,
      },
      { onError }
    )
  }

  const addExtraClass = (subjectId: string) => {
    setError('')
    createExtra.mutate({ day: activeDay, subjectId, ...nextSlot(evening, FIRST_EVENING_START) }, { onError })
  }

  const remove = (id?: string) => {
    if (!id) return
    setError('')
    deletePeriod.mutate(id, { onError })
  }

  return (
    <View className="gap-3">
      <DayTabs activeDay={activeDay} todayDow={null} onChange={setActiveDay} compact />

      {error ? (
        <Text className="font-display-bold text-xs text-btn-danger">{error}</Text>
      ) : null}

      <Text className="font-display-extrabold text-sm text-text-primary">
        {DAY_LABELS[activeDay]} · {periods.length} tiết
      </Text>

      {periods.length === 0 ? (
        <Text className="py-3 text-center font-display-bold text-xs text-text-muted">
          Chưa có tiết nào.
        </Text>
      ) : (
        periods.map((p) => (
          <RowCard
            key={p.id ?? `${p.subjectId}-${p.startTime}`}
            period={p}
            isDeleting={deletePeriod.isPending}
            onDelete={() => remove(p.id)}
          />
        ))
      )}

      <Text className="mt-1 font-display-extrabold text-xs uppercase text-text-muted">Thêm tiết</Text>
      <SubjectPicker onPick={addPeriod} disabled={createPeriod.isPending} />

      <Text className="mt-2 font-display-extrabold text-sm text-text-primary">🌙 Học thêm buổi tối</Text>
      {evening.length === 0 ? (
        <Text className="py-2 text-center font-display-bold text-xs text-text-muted">
          Chưa có buổi nào.
        </Text>
      ) : (
        evening.map((p) => (
          <RowCard
            key={p.id ?? `${p.subjectId}-${p.startTime}`}
            period={p}
            isDeleting={deletePeriod.isPending}
            onDelete={() => remove(p.id)}
          />
        ))
      )}
      <SubjectPicker onPick={addExtraClass} disabled={createExtra.isPending} />
    </View>
  )
}
