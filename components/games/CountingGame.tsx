'use client'

/** CountingGame — "Counting Stars" mini-game where the child counts displayed emoji objects. */

import { useState, useCallback } from 'react'
import { useMathSession } from '@/hooks/useMathSession'
import { generateCountingQuestions } from '@/lib/data/countingLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { COUNTING_SECONDS_PER_QUESTION, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { CountingQuestion, DifficultyLevel } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Dễ (1–5)',
  2: 'Vừa (1–10)',
  3: 'Khó (hỗn hợp)',
}

interface CountingGameProps {
  onExit: () => void
  homeworkPeriodId?: string
  onHomeworkSubmit?: () => void
}

/** Renders N emoji objects in a responsive wrap grid for the child to count. */
const ObjectGrid = ({ emoji, count }: { emoji: string; count: number }) => (
  <div
    className="flex max-w-xs flex-wrap justify-center gap-3"
    aria-label={`${count} ${emoji}`}
    data-testid="object-grid"
  >
    {Array.from({ length: count }).map((_, i) => (
      <span
        key={i}
        className="animate-in zoom-in-95 select-none text-5xl"
        style={{ animationDelay: `${i * 80}ms` }}
        aria-hidden="true"
      >
        {emoji}
      </span>
    ))}
  </div>
)

export const CountingGame = ({ onExit, homeworkPeriodId, onHomeworkSubmit }: CountingGameProps) => {
  const { state, starsEarned, pointsEarned, isProcessing, start, answerCorrect, answerWrong, bestScore } =
    useMathSession({ minigame: 'counting', secondsPerQuestion: COUNTING_SECONDS_PER_QUESTION, homeworkPeriodId })

  const [questions, setQuestions] = useState<CountingQuestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)

  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      const qs = generateCountingQuestions(level, 10, Date.now() + level)
      setQuestions(qs)
      setSelectedIndex(null)
      setFeedbackState('idle')
      start(level)
    },
    [start]
  )

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (isProcessing.current || state.status !== 'playing' || !currentQuestion) return
      isProcessing.current = true

      const isCorrect = choiceIndex === currentQuestion.correctIndex
      setSelectedIndex(choiceIndex)
      setFeedbackState(isCorrect ? 'correct' : 'wrong')

      setTimeout(() => {
        setSelectedIndex(null)
        setFeedbackState('idle')
        if (isCorrect) answerCorrect()
        else answerWrong()
        isProcessing.current = false
      }, INPUT_THROTTLE_MS)
    },
    [state.status, currentQuestion, answerCorrect, answerWrong, isProcessing]
  )

  const handleHomeworkSubmit = () => {
    setHomeworkSubmitted(true)
    onHomeworkSubmit?.()
  }

  if (state.status === 'result') {
    return (
      <GameResultScreen
        gameType="math"
        correctCount={state.correctCount}
        starsEarned={starsEarned}
        pointsEarned={pointsEarned}
        bestStars={bestScore?.starsEarned ?? null}
        onReplay={() => handleStart(state.level)}
        onExit={onExit}
        onHomeworkSubmit={homeworkPeriodId ? handleHomeworkSubmit : undefined}
        homeworkSubmitted={homeworkSubmitted}
      />
    )
  }

  if (state.status === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8" data-testid="game-card-counting">
        <div className="text-8xl" aria-hidden="true">🌟</div>
        <h1 className="text-5xl font-extrabold text-white">Đếm Sao</h1>
        <p className="text-xl text-slate-300">Đếm số đồ vật trên màn hình!</p>
        <div className="flex flex-wrap justify-center gap-4">
          {([1, 2, 3] as DifficultyLevel[]).map((lvl) => (
            <KidButton key={lvl} variant="primary" onClick={() => handleStart(lvl)} className="min-w-40">
              {LEVEL_LABELS[lvl]}
            </KidButton>
          ))}
        </div>
        <KidButton variant="ghost" onClick={onExit} className="text-slate-400">
          Quay lại
        </KidButton>
      </div>
    )
  }

  if (!currentQuestion) return null

  return (
    <div className="flex min-h-screen flex-col">
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
        <p className="text-2xl font-bold text-white select-none">Có bao nhiêu cái?</p>
        <div className="animate-in fade-in anim-duration-200 rounded-3xl bg-slate-700 p-8 shadow-2xl">
          <ObjectGrid emoji={currentQuestion.objectEmoji} count={currentQuestion.count} />
        </div>
        <div className="flex gap-6">
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = selectedIndex === idx
            const isCorrect = idx === currentQuestion.correctIndex
            return (
              <KidButton
                key={idx}
                onClick={() => handleAnswer(idx)}
                isDisabled={isProcessing.current}
                data-testid={`answer-btn-${idx}`}
                className={cn(
                  'min-h-32 min-w-32 text-6xl font-extrabold transition-colors duration-200',
                  isSelected && isCorrect && 'border-emerald-700 bg-emerald-500',
                  isSelected && !isCorrect && 'border-red-700 bg-red-500'
                )}
              >
                {choice}
              </KidButton>
            )
          })}
        </div>
      </div>
    </div>
  )
}
