// Alphabet Explorer — uppercase ↔ lowercase letter recognition.
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import {
  ENGLISH_ALPHABET_SECONDS_PER_QUESTION,
  generateAlphabetQuestions,
  type AlphabetQuestion,
  type DifficultyLevel,
} from '@kid-hub/shared'

import { useEnglishSession } from '@/hooks/use-english-session'
import { useAnswerFlow } from '@/hooks/use-answer-flow'
import { GameResult } from './game-result'
import { GameStage, LevelSelect, OptionButton } from './game-scaffold'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'A – M (Dễ)',
  2: 'N – Z (Vừa)',
  3: 'A – Z (Khó)',
}

export function AlphabetGame({ onExit }: { onExit: () => void }) {
  const s = useEnglishSession({
    minigame: 'alphabet',
    secondsPerQuestion: ENGLISH_ALPHABET_SECONDS_PER_QUESTION,
  })
  const flow = useAnswerFlow(s)
  const [questions, setQuestions] = useState<AlphabetQuestion[]>([])
  const q = questions[s.state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      setQuestions(generateAlphabetQuestions(level, 10, Date.now() + level))
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
        emoji="🔤"
        title="Alphabet Explorer"
        subtitle="Nhận biết chữ hoa và chữ thường"
        levelLabels={LEVEL_LABELS}
        onStart={handleStart}
        onExit={onExit}
      />
    )
  }

  if (!q) return null

  const isLowerToUpper = q.type === 'lower-to-upper'

  return (
    <GameStage
      correctCount={s.state.correctCount}
      questionIndex={s.state.currentQuestionIndex}
      secondsLeft={s.state.secondsLeft}
      feedback={flow.feedback}
      onExit={onExit}>
      <Text className="text-lg font-bold text-slate-300">
        {isLowerToUpper ? 'Chọn chữ HOA tương ứng' : 'Chọn chữ thường tương ứng'}
      </Text>
      <View className="rounded-3xl bg-emerald-700 px-12 py-6">
        <Text className="text-7xl font-extrabold text-white">{q.prompt}</Text>
      </View>
      <View className="flex-row flex-wrap justify-center gap-4">
        {q.choices.map((choice) => (
          <OptionButton
            key={choice}
            testID={`choice-${choice}`}
            selected={flow.selected === choice}
            isCorrect={choice === q.correctAnswer}
            disabled={s.state.status !== 'playing'}
            onPress={() => flow.submit(choice, choice === q.correctAnswer)}>
            <Text className="text-5xl font-extrabold text-white">{choice}</Text>
          </OptionButton>
        ))}
      </View>
    </GameStage>
  )
}
