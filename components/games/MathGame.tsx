'use client'

/** MathGame — full-screen Number Ninja mini-game with timed arithmetic questions. */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSession, calculateStars, calculatePointsEarned } from '@/hooks/useGameSession'
import { useAudio } from '@/hooks/useAudio'
import { useUserProgress } from '@/hooks/useUserProgress'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generateMathQuestions } from '@/lib/data/mathLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { STORAGE_KEYS, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DifficultyLevel, GameBestScore, MathQuestion } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Cấp 1 (1–10)',
  2: 'Cấp 2 (1–20)',
  3: 'Cấp 3 (1–50)',
}

interface MathGameProps {
  initialLevel?: DifficultyLevel
}

export const MathGame = ({ initialLevel = 1 }: MathGameProps) => {
  const router = useRouter()
  const { state, startGame, answerCorrect, answerWrong, resetGame, starsEarned, pointsEarned } =
    useGameSession()
  const { initialise, play } = useAudio()
  const { addPoints } = useUserProgress()
  const [bestScores, setBestScores] = useLocalStorage<GameBestScore[]>(
    STORAGE_KEYS.USER_PROGRESS,
    []
  )

  const [questions, setQuestions] = useState<MathQuestion[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const isProcessing = useRef(false)

  // Pull current question from generated list
  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  // Begin a new round: generate questions and start the state machine
  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      initialise()
      const qs = generateMathQuestions(level, 10, Date.now() + level)
      setQuestions(qs)
      setSelectedAnswer(null)
      setFeedbackState('idle')
      startGame('math', level)
    },
    [initialise, startGame]
  )

  // Auto-start at initialLevel on mount
  useEffect(() => {
    handleStart(initialLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Award points when game finishes
  useEffect(() => {
    if (state.status === 'result') {
      addPoints(pointsEarned)
      play('complete')
      const newBest: GameBestScore = {
        gameType: 'math',
        level: state.level,
        score: state.correctCount * 10,
        starsEarned,
        achievedAt: new Date().toISOString(),
      }
      setBestScores((prev) => {
        const filtered = prev.filter((b) => !(b.gameType === 'math' && b.level === state.level))
        return [...filtered, newBest]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const handleAnswer = useCallback(
    (answer: number) => {
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
    [state.status, currentQuestion, play, answerCorrect, answerWrong]
  )

  const bestScore = bestScores.find((b) => b.gameType === 'math' && b.level === state.level) ?? null

  // ── Result screen ──────────────────────────────────────────
  if (state.status === 'result') {
    return (
      <GameResultScreen
        gameType="math"
        correctCount={state.correctCount}
        starsEarned={starsEarned}
        pointsEarned={pointsEarned}
        bestStars={bestScore?.starsEarned ?? null}
        onReplay={() => handleStart(state.level)}
        onExit={() => router.push('/dashboard')}
      />
    )
  }

  // ── Idle / level select ────────────────────────────────────
  if (state.status === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8">
        <div className="text-8xl" aria-hidden="true">
          🔢
        </div>
        <h1 className="text-5xl font-extrabold text-white">Number Ninja</h1>
        <div className="flex gap-4">
          {([1, 2, 3] as DifficultyLevel[]).map((lvl) => (
            <KidButton
              key={lvl}
              variant="primary"
              onClick={() => handleStart(lvl)}
              className="min-w-40"
            >
              {LEVEL_LABELS[lvl]}
            </KidButton>
          ))}
        </div>
        <KidButton
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="text-slate-400"
        >
          Quay lại
        </KidButton>
      </div>
    )
  }

  // ── Playing ────────────────────────────────────────────────
  if (!currentQuestion) return null

  return (
    <div className="flex min-h-screen flex-col">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={() => router.push('/dashboard')}
      />

      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-10 px-8 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40'
        )}
      >
        {/* Question card */}
        <div className="animate-in fade-in anim-duration-200 rounded-3xl bg-slate-700 px-16 py-10 text-center shadow-2xl">
          <p className="text-8xl font-extrabold tracking-tight text-white select-none">
            {currentQuestion.operandA} {currentQuestion.operator} {currentQuestion.operandB} = ?
          </p>
        </div>

        {/* Answer buttons */}
        <div className="flex gap-8">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === currentQuestion.correctAnswer
            return (
              <KidButton
                key={option}
                onClick={() => handleAnswer(option)}
                isDisabled={isProcessing.current}
                className={cn(
                  'min-h-32 min-w-48 text-6xl font-extrabold transition-colors duration-200',
                  isSelected && isCorrectOption && 'border-emerald-700 bg-emerald-500',
                  isSelected && !isCorrectOption && 'border-red-700 bg-red-500'
                )}
              >
                {option}
              </KidButton>
            )
          })}
        </div>
      </div>
    </div>
  )
}
