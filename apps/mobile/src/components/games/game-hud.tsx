import { Pressable, Text, View } from 'react-native'
import { GAME_QUESTIONS_PER_SESSION } from '@kid-hub/shared'

/**
 * In-game heads-up display: exit | question progress | timer.
 * Landscape bar mirroring the web GameHud. The web draws an SVG timer ring;
 * mobile shows a numeric countdown badge (no react-native-svg dependency).
 */
export function GameHud({
  correctCount,
  questionIndex,
  secondsLeft,
  onExit,
}: {
  correctCount: number
  questionIndex: number
  secondsLeft: number
  onExit: () => void
}) {
  const progress = questionIndex / GAME_QUESTIONS_PER_SESSION
  const isUrgent = secondsLeft <= 3

  return (
    <View className="flex-row items-center gap-3 bg-slate-800 px-4 py-2">
      <Pressable
        onPress={onExit}
        accessibilityLabel="Thoát trò chơi"
        hitSlop={8}
        className="h-11 w-11 items-center justify-center rounded-xl bg-slate-700 active:bg-slate-600">
        <Text className="text-lg font-bold text-slate-300">✕</Text>
      </Pressable>

      <View className="flex-1">
        <View className="mb-1 flex-row justify-between">
          <Text className="text-xs font-semibold text-slate-400">
            Câu {questionIndex + 1}/{GAME_QUESTIONS_PER_SESSION}
          </Text>
          <Text className="text-xs font-semibold text-emerald-400">{correctCount}✓</Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-slate-700">
          <View
            className="h-full rounded-full bg-blue-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </View>
      </View>

      <View
        accessibilityLabel={`${secondsLeft} giây còn lại`}
        className={
          'h-11 w-11 items-center justify-center rounded-full border-2 ' +
          (isUrgent ? 'border-red-400 bg-red-500/20' : 'border-blue-400 bg-slate-700')
        }>
        <Text
          className={
            'text-base font-extrabold ' + (isUrgent ? 'text-red-300' : 'text-slate-100')
          }>
          {secondsLeft}
        </Text>
      </View>
    </View>
  )
}
