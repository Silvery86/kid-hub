'use client'

/** SoundHuntGame — Sound Hunt mini-game: identify which emoji starts with the given letter sound. */

import { useState, useCallback } from 'react'
import { useEnglishSession } from '@/hooks/useEnglishSession'
import { generateSoundHuntQuestions } from '@/lib/data/englishLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { FlashcardImage } from '@/components/ui/FlashcardImage'
import { EMOJI_IMAGE } from '@/lib/data/gameImages'
import { ENGLISH_WORD_SECONDS_PER_QUESTION, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { SoundHuntQuestion, DifficultyLevel } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Phụ âm rõ ràng (Dễ)',
  2: 'Phụ âm khó (Vừa)',
  3: 'Tất cả âm (Khó)',
}

interface SoundHuntGameProps {
  onExit: () => void
  homeworkPeriodId?: string
  onHomeworkSubmit?: () => void
}

export const SoundHuntGame = ({ onExit, homeworkPeriodId, onHomeworkSubmit }: SoundHuntGameProps) => {
  const { state, starsEarned, pointsEarned, isProcessing, start, answerCorrect, answerWrong, play, bestScore, saveError } =
    useEnglishSession({
      minigame: 'phonics',
      secondsPerQuestion: ENGLISH_WORD_SECONDS_PER_QUESTION,
      homeworkPeriodId,
    })

  const [questions, setQuestions] = useState<SoundHuntQuestion[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)

  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      const seed = Date.now() + level
      const qs = generateSoundHuntQuestions(level, 10, seed)
      setQuestions(qs)
      setSelectedAnswer(null)
      setFeedbackState('idle')
      start(level)
    },
    [start]
  )

  const handleAnswer = useCallback(
    (answer: string) => {
      if (isProcessing.current || state.status !== 'playing' || !currentQuestion) return
      isProcessing.current = true

      const isCorrect = answer === currentQuestion.correctAnswer
      setSelectedAnswer(answer)
      setFeedbackState(isCorrect ? 'correct' : 'wrong')
      play(isCorrect ? 'correct' : 'wrong')

      setTimeout(() => {
        setSelectedAnswer(null)
        setFeedbackState('idle')
        if (isCorrect) answerCorrect()
        else answerWrong()
        isProcessing.current = false
      }, INPUT_THROTTLE_MS)
    },
    [state.status, currentQuestion, answerCorrect, answerWrong, play, isProcessing]
  )

  const handleHomeworkSubmit = () => {
    setHomeworkSubmitted(true)
    onHomeworkSubmit?.()
  }

  // ── Result ─────────────────────────────────────────────────
  if (state.status === 'result') {
    return (
      <GameResultScreen
        gameType="english"
        correctCount={state.correctCount}
        starsEarned={starsEarned}
        pointsEarned={pointsEarned}
        bestStars={bestScore?.starsEarned ?? null}
        onReplay={() => handleStart(state.level)}
        onExit={onExit}
        onHomeworkSubmit={homeworkPeriodId && !homeworkSubmitted ? handleHomeworkSubmit : undefined}
        homeworkSubmitted={homeworkSubmitted}
        saveError={saveError ?? undefined}
      />
    )
  }

  // ── Level select ───────────────────────────────────────────
  if (state.status === 'idle') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 bg-shell-kid">
        <div className="text-8xl select-none" aria-hidden="true">🔊</div>
        <h1 className="text-4xl font-extrabold text-text-primary">Sound Hunt</h1>
        <p className="text-lg text-text-secondary">Tìm từ bắt đầu bằng âm chữ cái</p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          {([1, 2, 3] as DifficultyLevel[]).map((lvl) => (
            <KidButton
              key={lvl}
              variant="secondary"
              onClick={() => handleStart(lvl)}
              className="w-full"
            >
              {LEVEL_LABELS[lvl]}
            </KidButton>
          ))}
        </div>
        <KidButton variant="ghost" onClick={onExit} className="text-text-secondary">
          ← Quay lại
        </KidButton>
      </div>
    )
  }

  // ── Playing ────────────────────────────────────────────────
  if (!currentQuestion) return null

  return (
    <div className="flex min-h-dvh flex-col">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={onExit}
      />

      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-10 px-8 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40'
        )}
      >
        {/* Instruction */}
        <p className="text-xl font-bold text-text-secondary">
          Chọn hình bắt đầu bằng âm này
        </p>

        {/* Letter + phoneme hint */}
        <div
          className="animate-in fade-in anim-duration-200 flex flex-col items-center gap-3 rounded-3xl bg-english px-12 py-8 shadow-2xl"
          data-testid="sound-prompt"
        >
          <p className="text-center text-[7rem] leading-none font-extrabold text-white select-none">
            {currentQuestion.targetLetter}
          </p>
          <p className="text-center text-xl font-bold text-white/80">
            {currentQuestion.phonemeHint}
          </p>
        </div>

        {/* Answer buttons (flashcard image choices) */}
        <div className="flex flex-wrap justify-center gap-6 max-w-md">
          {currentQuestion.choices.map((choice) => {
            const isSelected = selectedAnswer === choice
            const isCorrectOption = choice === currentQuestion.correctAnswer
            return (
              <KidButton
                key={choice}
                variant="secondary"
                onClick={() => handleAnswer(choice)}
                isDisabled={isProcessing.current}
                className={cn(
                  'min-h-20 min-w-20 rounded-pill transition-colors duration-200',
                  isSelected && isCorrectOption && 'border-emerald-700 bg-emerald-500',
                  isSelected && !isCorrectOption && 'border-red-700 bg-red-500'
                )}
                data-testid={`choice-${choice}`}
              >
                <FlashcardImage
                  src={EMOJI_IMAGE[choice]}
                  alt={choice}
                  fallback={choice}
                  className="h-12 w-12 object-contain"
                />
              </KidButton>
            )
          })}
        </div>
      </div>
    </div>
  )
}
