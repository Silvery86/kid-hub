// Number Ninja — timed addition/subtraction with two answer choices.
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import {
  GAME_SECONDS_PER_QUESTION,
  generateMathQuestions,
  type DifficultyLevel,
  type MathQuestion,
} from '@kid-hub/shared'

import { useMathSession } from '@/hooks/use-math-session'
import { useAnswerFlow } from '@/hooks/use-answer-flow'
import { GameResult } from './game-result'
import { GameStage, LevelSelect, OptionButton } from './game-scaffold'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Cấp 1 (1–10)',
  2: 'Cấp 2 (1–20)',
  3: 'Cấp 3 (1–50)',
}

export function AdditionGame({ onExit }: { onExit: () => void }) {
  const s = useMathSession({ minigame: 'addition', secondsPerQuestion: GAME_SECONDS_PER_QUESTION })
  const flow = useAnswerFlow(s)
  const [questions, setQuestions] = useState<MathQuestion[]>([])
  const q = questions[s.state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      setQuestions(generateMathQuestions(level, 10, Date.now() + level))
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
        emoji="🔢"
        title="Number Ninja"
        subtitle="Cộng & trừ nhanh"
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
      <View className="rounded-3xl bg-slate-700 px-10 py-6">
        <Text className="text-6xl font-extrabold text-white">
          {q.operandA} {q.operator} {q.operandB} = ?
        </Text>
      </View>
      <View className="flex-row flex-wrap justify-center gap-5">
        {q.options.map((option) => (
          <OptionButton
            key={option}
            selected={flow.selected === option}
            isCorrect={option === q.correctAnswer}
            disabled={s.state.status !== 'playing'}
            onPress={() => flow.submit(option, option === q.correctAnswer)}>
            <Text className="text-5xl font-extrabold text-white">{option}</Text>
          </OptionButton>
        ))}
      </View>
    </GameStage>
  )
}
