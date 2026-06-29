'use client'

/** ShapeGame — "Shape Quest" mini-game for recognising basic geometric shapes. */

import { useState, useCallback } from 'react'
import { useMathSession } from '@/hooks/useMathSession'
import { generateShapeQuestions } from '@/lib/data/shapeLevels'
import { ShapeDisplay, SHAPE_LABELS } from '@/components/games/ShapeDisplay'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { SHAPE_SECONDS_PER_QUESTION, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DifficultyLevel, ShapeId, ShapeQuestion } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Dễ (4 hình)',
  2: 'Vừa (6 hình)',
  3: 'Khó (2 chế độ)',
}

interface ShapeGameProps {
  onExit: () => void
  homeworkPeriodId?: string
  onHomeworkSubmit?: () => void
}

/** Renders a large centred shape for display questions. */
const ShapePrompt = ({ shape }: { shape: ShapeId }) => (
  <div className="animate-in zoom-in-95 anim-duration-200 flex items-center justify-center rounded-2xl bg-slate-700 p-4 shadow-2xl portrait:rounded-3xl portrait:p-6 lg:p-10">
    <ShapeDisplay shape={shape} className="h-20 w-20 portrait:h-28 portrait:w-28 lg:h-36 lg:w-36" />
  </div>
)

/** Renders the shape name as a large centred label for name-to-shape questions. */
const NamePrompt = ({ shape }: { shape: ShapeId }) => (
  <div className="animate-in zoom-in-95 anim-duration-200 rounded-2xl bg-slate-700 px-4 py-3 shadow-2xl portrait:rounded-3xl portrait:px-8 portrait:py-6 lg:px-14 lg:py-10">
    <p className="text-3xl font-extrabold text-white select-none portrait:text-5xl lg:text-7xl">{SHAPE_LABELS[shape]}</p>
  </div>
)

/** Renders a shape as a large tappable answer button. */
const ShapeAnswerButton = ({
  shape,
  isSelected,
  isCorrect,
  onTap,
  disabled,
}: {
  shape: ShapeId
  isSelected: boolean
  isCorrect: boolean
  onTap: () => void
  disabled: boolean
}) => (
  <button
    onClick={onTap}
    disabled={disabled}
    aria-label={SHAPE_LABELS[shape]}
    className={cn(
      'flex min-h-tap-lg min-w-tap-lg items-center justify-center rounded-2xl border-4 p-2 portrait:min-h-28 portrait:min-w-28 portrait:rounded-3xl portrait:p-3 lg:min-h-28 lg:min-w-28 lg:p-4',
      'transition-colors duration-200 touch-manipulation select-none',
      'border-slate-600 bg-slate-700 text-white',
      isSelected && isCorrect && 'border-emerald-400 bg-emerald-600',
      isSelected && !isCorrect && 'border-red-400 bg-red-600',
      !isSelected && !disabled && 'hover:border-slate-400 active:scale-95'
    )}
  >
    <ShapeDisplay shape={shape} className="h-10 w-10 portrait:h-14 portrait:w-14 lg:h-16 lg:w-16" />
  </button>
)

/** Renders a shape name as a large tappable answer button. */
const NameAnswerButton = ({
  shape,
  isSelected,
  isCorrect,
  onTap,
  disabled,
}: {
  shape: ShapeId
  isSelected: boolean
  isCorrect: boolean
  onTap: () => void
  disabled: boolean
}) => (
  <button
    onClick={onTap}
    disabled={disabled}
    aria-label={SHAPE_LABELS[shape]}
    className={cn(
      'min-h-tap min-w-20 rounded-2xl border-4 px-3 py-2 portrait:min-h-16 portrait:min-w-32 portrait:rounded-3xl portrait:px-4 lg:min-h-[4.5rem] lg:min-w-40 lg:px-6 lg:py-3',
      'text-sm font-extrabold text-white transition-colors duration-200 touch-manipulation select-none portrait:text-lg lg:text-2xl',
      'border-slate-600 bg-slate-700',
      isSelected && isCorrect && 'border-emerald-400 bg-emerald-600',
      isSelected && !isCorrect && 'border-red-400 bg-red-600',
      !isSelected && !disabled && 'hover:border-slate-400 active:scale-95'
    )}
  >
    {SHAPE_LABELS[shape]}
  </button>
)

export const ShapeGame = ({ onExit, homeworkPeriodId, onHomeworkSubmit }: ShapeGameProps) => {
  const { state, starsEarned, pointsEarned, isProcessing: isProcessingRef, start, answerCorrect, answerWrong, play, bestScore } =
    useMathSession({ minigame: 'shapes', secondsPerQuestion: SHAPE_SECONDS_PER_QUESTION, homeworkPeriodId })

  const [questions, setQuestions] = useState<ShapeQuestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [isProcessing, setIsProcessing] = useState(false)
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)

  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      const qs = generateShapeQuestions(level, 10, Date.now() + level)
      setQuestions(qs)
      setSelectedIndex(null)
      setFeedbackState('idle')
      start(level)
    },
    [start]
  )

  const handleAnswer = useCallback(
    (choiceIndex: number) => {
      if (isProcessingRef.current || state.status !== 'playing' || !currentQuestion) return
      isProcessingRef.current = true
      setIsProcessing(true)

      const isCorrect = choiceIndex === currentQuestion.correctIndex
      setSelectedIndex(choiceIndex)
      setFeedbackState(isCorrect ? 'correct' : 'wrong')
      play(isCorrect ? 'correct' : 'wrong')

      setTimeout(() => {
        setSelectedIndex(null)
        setFeedbackState('idle')
        if (isCorrect) answerCorrect()
        else answerWrong()
        isProcessingRef.current = false
        setIsProcessing(false)
      }, INPUT_THROTTLE_MS)
    },
    [state.status, currentQuestion, answerCorrect, answerWrong, play, isProcessingRef]
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
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8" data-testid="game-card-shapes">
        <div className="text-8xl" aria-hidden="true">🔷</div>
        <h1 className="text-5xl font-extrabold text-white">Khám Phá Hình</h1>
        <p className="text-xl text-slate-300">Nhận biết các hình học!</p>
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

  const isNameToShape = currentQuestion.mode === 'name-to-shape'

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={onExit}
      />
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-3 px-3 py-2 portrait:gap-6 portrait:py-4 portrait:px-6 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40'
        )}
      >
        <p className="text-base font-bold text-slate-300 select-none portrait:text-2xl">
          {isNameToShape ? 'Hình nào là...?' : 'Hình này tên là gì?'}
        </p>

        {isNameToShape ? (
          <NamePrompt shape={currentQuestion.targetShape} />
        ) : (
          <ShapePrompt shape={currentQuestion.targetShape} />
        )}

        <div className="flex flex-wrap justify-center gap-2 portrait:gap-4 lg:gap-6">
          {currentQuestion.choices.map((choice, idx) => {
            const isSelected = selectedIndex === idx
            const isCorrect = idx === currentQuestion.correctIndex
            return isNameToShape ? (
              <ShapeAnswerButton
                key={idx}
                shape={choice}
                isSelected={isSelected}
                isCorrect={isCorrect}
                onTap={() => handleAnswer(idx)}
                disabled={isProcessing}
              />
            ) : (
              <NameAnswerButton
                key={idx}
                shape={choice}
                isSelected={isSelected}
                isCorrect={isCorrect}
                onTap={() => handleAnswer(idx)}
                disabled={isProcessing}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
