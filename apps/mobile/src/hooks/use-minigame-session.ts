// use-minigame-session.ts — shared engine behind use-math-session / use-english-session.
// Wraps use-game-session (shared reducer + timer) and adds: best-score reads via
// @kid-hub/api-client (Phase 4 GET), completion persistence via the matching POST,
// and SFX. Mirrors the web useMathSession / useEnglishSession lifecycle, but sources
// best-scores from the server rather than localStorage (mobile has no localStorage).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MutableRefObject } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  DifficultyLevel,
  GameBestScore,
  GameSaveResult,
  GameSessionState,
  GameType,
} from '@kid-hub/shared'

import { useGameSession } from '@/hooks/use-game-session'
import { useGameAudio, type SoundKey } from '@/hooks/use-game-audio'

/** Common save payload; the caller appends its `minigame` discriminator. */
export interface GameSaveBase {
  level: DifficultyLevel
  correctCount: number
  incorrectCount: number
  timeSpentSecs: number
  homeworkPeriodId?: string
  homeworkDate?: string
}

export interface UseMinigameSessionResult {
  state: GameSessionState
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  isProcessing: MutableRefObject<boolean>
  start: (level: DifficultyLevel) => void
  answerCorrect: () => void
  answerWrong: () => void
  play: (key: SoundKey) => void
  bestScore: GameBestScore | null
  saveError: string | null
}

const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

export function useMinigameSession({
  gameType,
  minigame,
  secondsPerQuestion,
  homeworkPeriodId,
  save,
  fetchBestScores,
}: {
  gameType: GameType
  minigame: string
  secondsPerQuestion: number
  homeworkPeriodId?: string
  save: (base: GameSaveBase) => Promise<GameSaveResult>
  fetchBestScores: () => Promise<GameBestScore[]>
}): UseMinigameSessionResult {
  const { state, startGame, answerCorrect: rawCorrect, answerWrong: rawWrong, starsEarned, pointsEarned } =
    useGameSession()
  const { play } = useGameAudio()
  const queryClient = useQueryClient()

  const bestKey = useMemo(() => ['best-scores', gameType] as const, [gameType])
  const bestQuery = useQuery({ queryKey: bestKey, queryFn: fetchBestScores })

  const isProcessing = useRef(false)
  const savedRef = useRef(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const start = useCallback(
    (level: DifficultyLevel) => {
      savedRef.current = false
      setSaveError(null)
      startGame(gameType, level, secondsPerQuestion)
    },
    [startGame, gameType, secondsPerQuestion]
  )

  // Persist once when the session reaches the result screen.
  useEffect(() => {
    if (state.status !== 'result' || savedRef.current) return
    savedRef.current = true
    play('complete')

    const timeSpentSecs = Math.max(1, Math.round((Date.now() - state.startedAt) / 1000))
    save({
      level: state.level,
      correctCount: state.correctCount,
      incorrectCount: state.totalQuestions - state.correctCount,
      timeSpentSecs,
      homeworkPeriodId,
      homeworkDate: homeworkPeriodId ? todayDateKey() : undefined,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: bestKey }))
      .catch((err: unknown) => setSaveError(err instanceof Error ? err.message : 'Save failed'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.status])

  const answerCorrect = useCallback(() => rawCorrect(secondsPerQuestion), [rawCorrect, secondsPerQuestion])
  const answerWrong = useCallback(() => rawWrong(secondsPerQuestion), [rawWrong, secondsPerQuestion])

  const bestScore =
    bestQuery.data?.find(
      (b) => b.gameType === gameType && b.level === state.level && b.subType === minigame
    ) ?? null

  return {
    state,
    starsEarned,
    pointsEarned,
    isProcessing,
    start,
    answerCorrect,
    answerWrong,
    play,
    bestScore,
    saveError,
  }
}
