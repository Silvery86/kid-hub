// Shape Quest — recognise shapes: name-to-shape (pick the shape) or shape-to-name.
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import {
  SHAPE_SECONDS_PER_QUESTION,
  generateShapeQuestions,
  type DifficultyLevel,
  type ShapeQuestion,
} from '@kid-hub/shared'

import { useMathSession } from '@/hooks/use-math-session'
import { useAnswerFlow } from '@/hooks/use-answer-flow'
import { GameResult } from './game-result'
import { GameStage, LevelSelect, OptionButton } from './game-scaffold'
import { SHAPE_LABELS, ShapeGlyph } from './shape-glyph'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Dễ (4 hình)',
  2: 'Vừa (6 hình)',
  3: 'Khó (2 chế độ)',
}

export function ShapeGame({ onExit }: { onExit: () => void }) {
  const s = useMathSession({ minigame: 'shapes', secondsPerQuestion: SHAPE_SECONDS_PER_QUESTION })
  const flow = useAnswerFlow(s)
  const [questions, setQuestions] = useState<ShapeQuestion[]>([])
  const q = questions[s.state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      setQuestions(generateShapeQuestions(level, 10, Date.now() + level))
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
        emoji="🔷"
        title="Khám Phá Hình"
        subtitle="Nhận biết các hình học!"
        levelLabels={LEVEL_LABELS}
        onStart={handleStart}
        onExit={onExit}
      />
    )
  }

  if (!q) return null

  const isNameToShape = q.mode === 'name-to-shape'

  return (
    <GameStage
      correctCount={s.state.correctCount}
      questionIndex={s.state.currentQuestionIndex}
      secondsLeft={s.state.secondsLeft}
      feedback={flow.feedback}
      onExit={onExit}>
      <Text className="text-lg font-bold text-slate-300">
        {isNameToShape ? 'Hình nào là...?' : 'Hình này tên là gì?'}
      </Text>

      <View className="rounded-3xl bg-slate-700 px-10 py-6">
        {isNameToShape ? (
          <Text className="text-4xl font-extrabold text-white">{SHAPE_LABELS[q.targetShape]}</Text>
        ) : (
          <ShapeGlyph shape={q.targetShape} size={96} />
        )}
      </View>

      <View className="flex-row flex-wrap justify-center gap-4">
        {q.choices.map((choice, idx) => (
          <OptionButton
            key={idx}
            selected={flow.selected === idx}
            isCorrect={idx === q.correctIndex}
            disabled={s.state.status !== 'playing'}
            onPress={() => flow.submit(idx, idx === q.correctIndex)}>
            {isNameToShape ? (
              <ShapeGlyph shape={choice} size={56} />
            ) : (
              <Text className="text-xl font-extrabold text-white">{SHAPE_LABELS[choice]}</Text>
            )}
          </OptionButton>
        ))}
      </View>
    </GameStage>
  )
}
