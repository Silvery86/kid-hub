// Counting Stars — count the displayed emoji objects, pick the number.
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import {
  COUNTING_SECONDS_PER_QUESTION,
  generateCountingQuestions,
  type CountingQuestion,
  type DifficultyLevel,
} from '@kid-hub/shared'

import { useMathSession } from '@/hooks/use-math-session'
import { useAnswerFlow } from '@/hooks/use-answer-flow'
import { GameResult } from './game-result'
import { GameStage, LevelSelect, OptionButton } from './game-scaffold'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Dễ (1–5)',
  2: 'Vừa (1–10)',
  3: 'Khó (hỗn hợp)',
}

export function CountingGame({ onExit }: { onExit: () => void }) {
  const s = useMathSession({ minigame: 'counting', secondsPerQuestion: COUNTING_SECONDS_PER_QUESTION })
  const flow = useAnswerFlow(s)
  const [questions, setQuestions] = useState<CountingQuestion[]>([])
  const q = questions[s.state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      setQuestions(generateCountingQuestions(level, 10, Date.now() + level))
      flow.reset()
      s.start(level)
    },
    [flow, s]
  )

  if (s.state.status === 'result') {
    return (
      <GameResult
        correctCount={s.state.correctCount}
        starsEarned={s.starsEarned}
        pointsEarned={s.pointsEarned}
        bestStars={s.bestScore?.starsEarned ?? null}
        onReplay={() => handleStart(s.state.level)}
        onExit={onExit}
        saveError={s.saveError ?? undefined}
      />
    )
  }

  if (s.state.status === 'idle') {
    return (
      <LevelSelect
        emoji="🌟"
        title="Đếm Sao"
        subtitle="Đếm số đồ vật trên màn hình!"
        levelLabels={LEVEL_LABELS}
        onStart={handleStart}
        onExit={onExit}
      />
    )
  }

  if (!q) return null

  return (
    <GameStage
      correctCount={s.state.correctCount}
      questionIndex={s.state.currentQuestionIndex}
      secondsLeft={s.state.secondsLeft}
      feedback={flow.feedback}
      onExit={onExit}>
      <Text className="text-xl font-bold text-white">Có bao nhiêu cái?</Text>
      <View className="max-w-[420px] flex-row flex-wrap justify-center gap-2 rounded-3xl bg-slate-700 p-5">
        {Array.from({ length: q.count }).map((_, i) => (
          <Text key={i} style={{ fontSize: 40 }}>
            {q.objectEmoji}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap justify-center gap-4">
        {q.choices.map((choice, idx) => (
          <OptionButton
            key={idx}
            testID={`answer-btn-${idx}`}
            selected={flow.selected === idx}
            isCorrect={idx === q.correctIndex}
            disabled={s.state.status !== 'playing'}
            onPress={() => flow.submit(idx, idx === q.correctIndex)}>
            <Text className="text-5xl font-extrabold text-white">{choice}</Text>
          </OptionButton>
        ))}
      </View>
    </GameStage>
  )
}
