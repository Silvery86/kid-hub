'use client'

/** EnglishGame — full-screen Word Explorer mini-game with letter and word-matching questions. */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSession } from '@/hooks/useGameSession'
import { useAudio } from '@/hooks/useAudio'
import { useUserProgress } from '@/hooks/useUserProgress'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  generateLetterMatchQuestions,
  generatePictureWordQuestions,
} from '@/lib/data/englishLevels'
import { GameHud } from '@/components/games/GameHud'
import { GameResultScreen } from '@/components/games/GameResultScreen'
import { KidButton } from '@/components/ui/KidButton'
import { FlashcardImage } from '@/components/ui/FlashcardImage'
import { EMOJI_IMAGE } from '@/lib/data/gameImages'
import { STORAGE_KEYS, INPUT_THROTTLE_MS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { DifficultyLevel, GameBestScore, EnglishQuestion } from '@/types'

const LEVEL_LABELS: Record<DifficultyLevel, string> = {
  1: 'Ghép chữ cái',
  2: 'Đọc hình ảnh',
  3: 'Đọc hình ảnh', // reuses level 2 for English
}

interface EnglishGameProps {
  initialLevel?: DifficultyLevel
}

export const EnglishGame = ({ initialLevel = 1 }: EnglishGameProps) => {
  const router = useRouter()
  const { state, startGame, answerCorrect, answerWrong, starsEarned, pointsEarned } =
    useGameSession()
  const { initialise, play } = useAudio()
  const { addPoints } = useUserProgress()
  const [bestScores, setBestScores] = useLocalStorage<GameBestScore[]>(
    STORAGE_KEYS.USER_PROGRESS,
    []
  )

  const [questions, setQuestions] = useState<EnglishQuestion[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'wrong'>('idle')
  const isProcessing = useRef(false)

  const currentQuestion = questions[state.currentQuestionIndex] ?? null

  const handleStart = useCallback(
    (level: DifficultyLevel) => {
      initialise()
      const seed = Date.now() + level
      const qs =
        level === 1
          ? generateLetterMatchQuestions(10, seed)
          : generatePictureWordQuestions(10, seed)
      setQuestions(qs)
      setSelectedAnswer(null)
      setFeedbackState('idle')
      startGame('english', level)
    },
    [initialise, startGame]
  )

  useEffect(() => {
    handleStart(initialLevel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (state.status === 'result') {
      addPoints(pointsEarned)
      play('complete')
      const newBest: GameBestScore = {
        gameType: 'english',
        level: state.level,
        score: state.correctCount * 10,
        starsEarned,
        achievedAt: new Date().toISOString(),
      }
      setBestScores((prev) => {
        const filtered = prev.filter((b) => !(b.gameType === 'english' && b.level === state.level))
        return [...filtered, newBest]
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

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
    [state.status, currentQuestion, play, answerCorrect, answerWrong]
  )

  const bestScore =
    bestScores.find((b) => b.gameType === 'english' && b.level === state.level) ?? null

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
        onExit={() => router.push('/dashboard')}
      />
    )
  }

  // ── Level select ───────────────────────────────────────────
  if (state.status === 'idle') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-8">
        <div className="text-8xl" aria-hidden="true">
          🔤
        </div>
        <h1 className="text-5xl font-extrabold text-white">Word Explorer</h1>
        <div className="flex gap-4">
          {([1, 2] as DifficultyLevel[]).map((lvl) => (
            <KidButton
              key={lvl}
              variant="secondary"
              onClick={() => handleStart(lvl)}
              className="min-w-48"
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

  const isLetterMatch = currentQuestion.type === 'letter-match'

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <GameHud
        correctCount={state.correctCount}
        questionIndex={state.currentQuestionIndex}
        secondsLeft={state.secondsLeft}
        onExit={() => router.push('/dashboard')}
      />

      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-2 px-3 py-2 portrait:gap-4 portrait:py-4 portrait:px-6 transition-colors duration-300',
          feedbackState === 'correct' && 'bg-emerald-900/40',
          feedbackState === 'wrong' && 'bg-red-900/40'
        )}
      >
        {/* Flashcard image — letter-match shows it above the prompt card */}
        {currentQuestion.imageUrl && isLetterMatch && (
          <FlashcardImage
            src={EMOJI_IMAGE[currentQuestion.imageUrl]}
            alt=""
            fallback={currentQuestion.imageUrl}
            className="h-20 w-20 select-none object-contain portrait:h-28 portrait:w-28 lg:h-36 lg:w-36"
          />
        )}

        {/* Prompt card — picture-word shows the flashcard image here instead */}
        <div className="animate-in fade-in anim-duration-200 rounded-2xl bg-slate-700 px-3 py-2 shadow-2xl portrait:rounded-3xl portrait:px-8 portrait:py-4 lg:px-10 lg:py-6">
          {isLetterMatch ? (
            <p className="text-center text-xl font-extrabold tracking-widest text-white select-none portrait:text-3xl lg:text-6xl">
              {currentQuestion.prompt}
            </p>
          ) : (
            <FlashcardImage
              src={EMOJI_IMAGE[currentQuestion.prompt]}
              alt={currentQuestion.correctAnswer}
              fallback={currentQuestion.prompt}
              className="h-24 w-24 object-contain portrait:h-36 portrait:w-36 lg:h-44 lg:w-44"
            />
          )}
          {isLetterMatch && (
            <p className="mt-1 text-center text-xs font-semibold text-slate-400 portrait:mt-2 portrait:text-sm lg:text-lg">
              Chọn chữ cái còn thiếu
            </p>
          )}
        </div>

        {/* Answer buttons */}
        <div className="flex flex-wrap justify-center gap-2 portrait:gap-3 lg:gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = option === currentQuestion.correctAnswer
            return (
              <KidButton
                key={option}
                variant="secondary"
                onClick={() => handleAnswer(option)}
                isDisabled={isProcessing.current}
                className={cn(
                  'min-h-tap-lg min-w-tap-lg text-lg font-extrabold transition-colors duration-200 portrait:min-h-20 portrait:min-w-28 portrait:text-2xl lg:min-h-24 lg:min-w-36 lg:text-4xl',
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
