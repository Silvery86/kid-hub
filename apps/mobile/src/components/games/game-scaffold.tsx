// game-scaffold.tsx — shared pieces every minigame view reuses: the level-select
// screen, the in-play stage (HUD + feedback-tinted body), and the answer button.
// Keeps the six views thin and visually consistent (landscape, dark theme).
import type { ReactNode } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import type { DifficultyLevel } from '@kid-hub/shared'

import { GameHud } from './game-hud'

const LEVELS: DifficultyLevel[] = [1, 2, 3]

/** Idle screen: title + three difficulty buttons + a back affordance. */
export function LevelSelect({
  emoji,
  title,
  subtitle,
  levelLabels,
  onStart,
  onExit,
}: {
  emoji: string
  title: string
  subtitle: string
  levelLabels: Record<DifficultyLevel, string>
  onStart: (level: DifficultyLevel) => void
  onExit: () => void
}) {
  return (
    <View className="flex-1 items-center justify-center gap-5 bg-slate-900 px-8">
      <Text style={{ fontSize: 64 }}>{emoji}</Text>
      <Text className="text-3xl font-extrabold text-white">{title}</Text>
      <Text className="text-base text-slate-300">{subtitle}</Text>
      <View className="flex-row flex-wrap justify-center gap-3">
        {LEVELS.map((lvl) => (
          <Pressable
            key={lvl}
            onPress={() => onStart(lvl)}
            className="min-w-[160px] items-center rounded-2xl bg-blue-600 px-5 py-3 active:bg-blue-700">
            <Text className="text-base font-extrabold text-white">{levelLabels[lvl]}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onExit} hitSlop={8} className="mt-2 px-4 py-2">
        <Text className="text-base font-bold text-slate-400">← Quay lại</Text>
      </Pressable>
    </View>
  )
}

/** In-play stage: HUD on top, a feedback-tinted body that centers its children. */
export function GameStage({
  correctCount,
  questionIndex,
  secondsLeft,
  feedback,
  onExit,
  children,
}: {
  correctCount: number
  questionIndex: number
  secondsLeft: number
  feedback: 'idle' | 'correct' | 'wrong'
  onExit: () => void
  children: ReactNode
}) {
  const tint =
    feedback === 'correct' ? 'bg-emerald-900' : feedback === 'wrong' ? 'bg-red-900' : 'bg-slate-900'
  return (
    <View className="flex-1 bg-slate-900">
      <GameHud
        correctCount={correctCount}
        questionIndex={questionIndex}
        secondsLeft={secondsLeft}
        onExit={onExit}
      />
      <ScrollView
        className={'flex-1 ' + tint}
        contentContainerClassName="flex-grow items-center justify-center gap-5 px-6 py-4">
        {children}
      </ScrollView>
    </View>
  )
}

/** A large tappable answer. Highlights emerald/red once selected. */
export function OptionButton({
  selected,
  isCorrect,
  disabled,
  onPress,
  children,
  testID,
}: {
  selected: boolean
  isCorrect: boolean
  disabled: boolean
  onPress: () => void
  children: ReactNode
  testID?: string
}) {
  const state =
    selected && isCorrect
      ? 'border-emerald-400 bg-emerald-600'
      : selected && !isCorrect
        ? 'border-red-400 bg-red-600'
        : 'border-slate-600 bg-slate-700'
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      testID={testID}
      className={
        'min-h-[72px] min-w-[88px] items-center justify-center rounded-2xl border-4 px-5 py-3 active:opacity-80 ' +
        state
      }>
      {children}
    </Pressable>
  )
}
