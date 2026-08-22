// grades-summary-bar.tsx — web's grades/GradesSummaryBar.tsx.

import { getSubjectById, mixWithWhite } from '@kid-hub/shared'
import { Text, View } from 'react-native'

interface GradesSummaryBarProps {
  average: number
  topSubjectId: string | null
  compact?: boolean
}

export function GradesSummaryBar({ average, topSubjectId, compact = false }: GradesSummaryBarProps) {
  const top = topSubjectId ? getSubjectById(topSubjectId) : null

  return (
    <View className={`flex-row ${compact ? 'gap-2' : 'gap-3'}`}>
      <View
        className={`flex-1 flex-row items-center gap-2.5 rounded-row bg-btn-primary ${compact ? 'p-3' : 'px-4 py-3.5'}`}>
        <Text style={{ fontSize: compact ? 24 : 32 }}>📊</Text>
        <View>
          <Text className="font-display-bold text-[11px] uppercase text-white/85">Điểm TB</Text>
          <Text className={`font-display-bold text-white ${compact ? 'text-[22px]' : 'text-[28px]'}`}>
            {average}
          </Text>
        </View>
      </View>

      <View
        className={`flex-1 flex-row items-center gap-2.5 rounded-row bg-surface-success ${compact ? 'p-3' : 'px-4 py-3.5'}`}>
        {top ? (
          <View
            className={`items-center justify-center rounded-[11px] ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
            style={{ backgroundColor: mixWithWhite(top.color, 15) }}>
            <Text style={{ fontSize: 20 }}>{top.icon}</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 24 }}>⭐</Text>
        )}
        <View className="min-w-0 flex-1">
          <Text className="font-display-bold text-[11px] uppercase text-text-muted">
            Môn giỏi nhất
          </Text>
          <Text
            numberOfLines={1}
            className={`font-display-bold text-text-primary ${compact ? 'text-sm' : 'text-base'}`}>
            {top?.name ?? '—'}
          </Text>
        </View>
      </View>
    </View>
  )
}
