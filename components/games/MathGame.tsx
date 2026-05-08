'use client'

/** MathGame — full-screen Number Ninja mini-game with timed arithmetic questions. */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSession } from '@/hooks/useGameSession'
import { useAudio } from '@/hooks/useAudio'
import { useUserProgress } from '@/hooks/useUserProgress'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { generateMathQuestions } from '@/lib/data/mathLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { STORAGE_KEYS, INPUT_THROTTLE_MS, GAME_SECONDS_PER_QUESTION } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DifficultyLevel, GameBestScore, MathQuestion } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Cấp 1 (1–10)',
  2: 'Cấp 2 (1–20)',
  3: 'Cấp 3 (1–50)',
}

interface MathGameProps {
  initialLevel?: DifficultyLevel
  onExit?: () => void
  homeworkPeriodId?: string
  onHomeworkSubmit?: () => void
}

export const MathGame = ({ initialLevel = 1, onExit, homeworkPeriodId, onHomeworkSubmit }: MathGameProps) => {
  const router = useRouter()
  const handleExit = onExit ?? (() => router.push('/dashboard'))
  const { state, startGame, answerCorrect, answerWrong, starsEarned, pointsEarned } =
    useGameSession()
  const { initialise, play } = useAudio()
  const { addPoints } = useUserProgress()
  const [progress, setProgress] = useLocalStorage<import('@/types').UserProgress | null>(
    STORAGE_KEYS.USER_PROGRESS,
    null
  )
  const bestScores: GameBestScore[] = Array.isArray(progress?.bestScores) ? progress.bestScores : []

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
      startGame('math', level, GAME_SECONDS_PER_QUESTION)
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
        subType: 'addition',
      }
      setProgress((prev) => {
        const prevScores: GameBestScore[] = Array.isArray(prev?.bestScores) ? prev.bestScores : []
        const filtered = prevScores.filter(
          (b) => !(b.gameType === 'math' && b.level === state.level && b.subType === 'addition')
        )
        return prev ? { ...prev, bestScores: [...filtered, newBest] } : null
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
        if (isCorrect) answerCorrect(GAME_SECONDS_PER_QUESTION)
        else answerWrong(GAME_SECONDS_PER_QUESTION)
        isProcessing.current = false
      }, INPUT_THROTTLE_MS)
    },
    [state.status, currentQuestion, play, answerCorrect, answerWrong]
  )

  const [homeworkSubmitted, setHomeworkSubmitted] = useState(false)
  const bestScore =
    bestScores.find(
      (b) => b.gameType === 'math' && b.level === state.level && b.subType === 'addition'
    ) ?? null

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
        onExit={handleExit}
        onHomeworkSubmit={homeworkPeriodId ? () => { setHomeworkSubmitted(true); onHomeworkSubmit?.() } : undefined}
        homeworkSubmitted={homeworkSubmitted}
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
          onClick={handleExit}
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
    <div className="flex h-screen flex-col overflow-hidden">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={handleExit}
      />

      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-2 px-3 py-4 sm:gap-6 sm:px-6 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40'
        )}
      >
        {/* Question card */}
        <div className="animate-in fade-in anim-duration-200 rounded-2xl bg-slate-700 px-4 py-6 text-center shadow-2xl sm:rounded-3xl sm:px-12 sm:py-8">
          <p className="text-4xl font-extrabold tracking-tight text-white select-none sm:text-6xl md:text-8xl">
            {currentQuestion.operandA} {currentQuestion.operator} {currentQuestion.operandB} = ?
          </p>
        </div>

        {/* Answer buttons */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 md:gap-8">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === currentQuestion.correctAnswer
            return (
              <KidButton
                key={option}
                onClick={() => handleAnswer(option)}
                isDisabled={isProcessing.current}
                className={cn(
                  'min-h-20 min-w-20 text-3xl font-extrabold transition-colors duration-200 sm:min-h-28 sm:min-w-36 sm:text-4xl md:min-h-32 md:min-w-48 md:text-6xl',
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
