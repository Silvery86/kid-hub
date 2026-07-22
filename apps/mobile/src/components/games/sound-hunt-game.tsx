// Sound Hunt — phonics: pick the emoji whose word starts with the target letter.
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import {
  ENGLISH_WORD_SECONDS_PER_QUESTION,
  generateSoundHuntQuestions,
  type DifficultyLevel,
  type SoundHuntQuestion,
} from '@kid-hub/shared'

import { useEnglishSession } from '@/hooks/use-english-session'
import { useAnswerFlow } from '@/hooks/use-answer-flow'
import { GameResult } from './game-result'
import { GameStage, LevelSelect, OptionButton } from './game-scaffold'
import { RemoteFlashcard } from './remote-flashcard'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Phụ âm rõ ràng (Dễ)',
  2: 'Phụ âm khó (Vừa)',
  3: 'Tất cả âm (Khó)',
}

export function SoundHuntGame({ onExit }: { onExit: () => void }) {
  const s = useEnglishSession({
    minigame: 'phonics',
    secondsPerQuestion: ENGLISH_WORD_SECONDS_PER_QUESTION,
  })
  const flow = useAnswerFlow(s)
  const [questions, setQuestions] = useState<SoundHuntQuestion[]>([])
  const q = questions[s.state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      setQuestions(generateSoundHuntQuestions(level, 10, Date.now() + level))
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
        emoji="🔊"
        title="Sound Hunt"
        subtitle="Tìm từ bắt đầu bằng âm chữ cái"
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
      <Text className="text-lg font-bold text-slate-300">Chọn hình bắt đầu bằng âm này</Text>
      <View className="items-center gap-2 rounded-3xl bg-emerald-700 px-12 py-5">
        <Text className="text-6xl font-extrabold text-white">{q.targetLetter}</Text>
        <Text className="text-center text-base font-bold text-white/80">{q.phonemeHint}</Text>
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
            <RemoteFlashcard emoji={choice} size={52} />
          </OptionButton>
        ))}
      </View>
    </GameStage>
  )
}
