// evening-blocks.tsx — web's EveningBlockList and WeekEveningSection, both local
// to ScheduleView. Extra-class blocks are the only place Saturday and Sunday
// appear, since the timetable itself is Mon–Fri.

import { DAYS_OF_WEEK, DAY_LABELS, getSubjectById, type ClassPeriod, type DayOfWeek } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { shadow } from '@/lib/shadows'

function BlockRow({ block }: { block: ClassPeriod }) {
  const subject = getSubjectById(block.subjectId)
  return (
    <View className="flex-row items-center gap-2.5">
      <Text style={{ fontSize: 16 }}>{subject?.icon ?? '📚'}</Text>
      <Text className="flex-1 font-display-bold text-sm text-text-primary">
        {subject?.name ?? block.subjectId}
      </Text>
      <Text className="font-display-bold text-xs text-text-muted">
        {block.startTime}–{block.endTime}
      </Text>
    </View>
  )
}

/** The selected day's evening blocks, appended under its period list. */
export function EveningBlockList({ blocks }: { blocks: ClassPeriod[] }) {
  if (blocks.length === 0) return null

  return (
    <View className="mt-3 border-t border-surface-muted pt-3">
      <Text className="mb-2 font-display-extrabold text-[10px] uppercase text-text-muted">
        Học thêm buổi tối
      </Text>
      <View className="gap-2">
        {blocks.map((block, i) => (
          <View key={block.id ?? i} className="rounded-chip bg-shell-light px-3 py-2">
            <BlockRow block={block} />
          </View>
        ))}
      </View>
    </View>
  )
}

/** Every day of the week that has extra classes, as a wrapping set of cards. */
export function WeekEveningSection({
  eveningByDay,
  dateByDay,
}: {
  eveningByDay: Map<DayOfWeek, ClassPeriod[]>
  dateByDay?: Partial<Record<DayOfWeek, string>>
}) {
  const activeDays = DAYS_OF_WEEK.filter((d) => (eveningByDay.get(d) ?? []).length > 0)
  if (activeDays.length === 0) return null

  return (
    <View className="rounded-[22px] bg-white p-4" style={shadow('sm')}>
      <Text className="mb-3 font-display-extrabold text-[11px] uppercase text-text-muted">
        🌙 Học thêm buổi tối
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {activeDays.map((day) => (
          <View
            key={day}
            className="min-w-[140px] flex-1 gap-1.5 rounded-[14px] bg-shell-light px-3 py-2.5">
            <View className="flex-row items-baseline gap-1.5">
              <Text className="font-display-extrabold text-[11px] uppercase text-text-secondary">
                {DAY_LABELS[day]}
              </Text>
              {dateByDay?.[day] ? (
                <Text className="font-display-bold text-[10px] text-text-muted">
                  {dateByDay[day]}
                </Text>
              ) : null}
            </View>
            {(eveningByDay.get(day) ?? []).map((block, i) => (
              <BlockRow key={block.id ?? i} block={block} />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}
