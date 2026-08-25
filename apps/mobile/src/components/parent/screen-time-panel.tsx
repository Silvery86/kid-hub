// screen-time-panel.tsx — today's usage against the daily limit, with the
// limit adjustable in steps. Web edits it through a number input; a phone is
// better served by two large targets than a keyboard.

import type { ScreenTime } from '@kid-hub/shared'
import { Text, View } from 'react-native'

import { KidButton } from '@/components/ui/kid-button'

/** Server accepts 30–480 minutes; step in half-hours. */
const MIN_LIMIT = 30
const MAX_LIMIT = 480
const STEP = 30

interface ScreenTimePanelProps {
  screenTime: ScreenTime
  onChangeLimit: (limitMins: number) => void
  isSaving?: boolean
}

export function ScreenTimePanel({ screenTime, onChangeLimit, isSaving }: ScreenTimePanelProps) {
  const usedMins = Math.round(screenTime.usedSecs / 60)
  const pct = screenTime.limitMins > 0
    ? Math.min(100, Math.round((usedMins / screenTime.limitMins) * 100))
    : 0
  const isOver = usedMins >= screenTime.limitMins

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-display-extrabold text-2xl text-text-primary">
          {usedMins} <Text className="text-base text-text-secondary">/ {screenTime.limitMins} phút</Text>
        </Text>
        <Text
          className={`font-display-extrabold text-sm ${isOver ? 'text-btn-danger' : 'text-text-muted'}`}>
          {pct}%
        </Text>
      </View>

      <View className="h-2 overflow-hidden rounded-pill bg-progress-track">
        <View
          className={`h-full rounded-pill ${isOver ? 'bg-btn-danger' : 'bg-progress-complete'}`}
          style={{ width: `${pct}%` }}
        />
      </View>

      <View className="flex-row items-center gap-3">
        <KidButton
          variant="ghost"
          isDisabled={isSaving || screenTime.limitMins <= MIN_LIMIT}
          onPress={() => onChangeLimit(Math.max(MIN_LIMIT, screenTime.limitMins - STEP))}
          accessibilityLabel="Giảm giới hạn 30 phút">
          −
        </KidButton>
        <Text className="flex-1 text-center font-display-extrabold text-sm text-text-secondary">
          Giới hạn mỗi ngày
        </Text>
        <KidButton
          variant="ghost"
          isDisabled={isSaving || screenTime.limitMins >= MAX_LIMIT}
          onPress={() => onChangeLimit(Math.min(MAX_LIMIT, screenTime.limitMins + STEP))}
          accessibilityLabel="Tăng giới hạn 30 phút">
          +
        </KidButton>
      </View>
    </View>
  )
}
