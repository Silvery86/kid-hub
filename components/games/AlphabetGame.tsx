'use client'

/** AlphabetGame — Alphabet Explorer mini-game: uppercase ↔ lowercase letter recognition. */

import { useState, useCallback } from 'react'
import { useEnglishSession } from '@/hooks/useEnglishSession'
import { generateAlphabetQuestions } from '@/lib/data/englishLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { ENGLISH_ALPHABET_SECONDS_PER_QUESTION, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AlphabetQuestion, DifficultyLevel } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'A – M (Dễ)',
  2: 'N – Z (Vừa)',
  3: 'A – Z (Khó)',
}

interface AlphabetGameProps {
  onExit: () => void
  homeworkPeriodId?: string
  onHomeworkSubmit?: () => void
}

export const AlphabetGame = ({ onExit, homeworkPeriodId, onHomeworkSubmit }: AlphabetGameProps) => {
  const { state, starsEarned, pointsEarned, isProcessing, start, answerCorrect, answerWrong, bestScore, saveError } =
    useEnglishSession({
      minigame: 'alphabet',
      secondsPerQuestion: ENGLISH_ALPHABET_SECONDS_PER_QUESTION,
      homeworkPeriodId,
    })

  const [questions, setQuestions] = useState<AlphabetQuestion[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)

  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      const seed = Date.now() + level
      const qs = generateAlphabetQuestions(level, 10, seed)
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

      setTimeout(() => {
        setSelectedAnswer(null)
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 bg-shell-kid">
        <div className="text-8xl select-none" aria-hidden="true">🔤</div>
        <h1 className="text-4xl font-extrabold text-text-primary">Alphabet Explorer</h1>
        <p className="text-lg text-text-secondary">Nhận biết chữ hoa và chữ thường</p>
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

  const isLowerToUpper = currentQuestion.type === 'lower-to-upper'

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
        {/* Instruction */}
        <p className="text-xl font-bold text-text-secondary">
          {isLowerToUpper ? 'Chọn chữ HOA tương ứng' : 'Chọn chữ thường tương ứng'}
        </p>

        {/* Prompt letter */}
        <div
          className={cn(
            'animate-in fade-in anim-duration-200 rounded-3xl px-12 py-8 shadow-2xl',
            isLowerToUpper ? 'bg-slate-700' : 'bg-english'
          )}
          data-testid="letter-prompt"
        >
          <p className="text-center text-[8rem] leading-none font-extrabold text-white select-none">
            {currentQuestion.prompt}
          </p>
        </div>

        {/* Answer buttons */}
        <div className="flex flex-wrap justify-center gap-4 max-w-md">
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
                  'min-h-[4rem] min-w-[5rem] text-5xl font-extrabold rounded-pill transition-colors duration-200',
                  isSelected && isCorrectOption && 'border-emerald-700 bg-emerald-500',
                  isSelected && !isCorrectOption && 'border-red-700 bg-red-500'
                )}
                data-testid={`choice-${choice}`}
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
