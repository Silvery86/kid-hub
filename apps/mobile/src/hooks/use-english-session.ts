// use-english-session.ts — thin wrapper binding an EnglishGameType minigame to the
// shared session engine (best-scores + persistence via @kid-hub/api-client).
import type { EnglishGameType } from '@kid-hub/shared'

import { getEnglishBestScores, saveEnglishProgress } from '@/api/english.api'
import { useMinigameSession, type UseMinigameSessionResult } from '@/hooks/use-minigame-session'

export function useEnglishSession({
  minigame,
  secondsPerQuestion,
  homeworkPeriodId,
}: {
  minigame: EnglishGameType
  secondsPerQuestion: number
  homeworkPeriodId?: string
}): UseMinigameSessionResult {
  return useMinigameSession({
    gameType: 'english',
    minigame,
    secondsPerQuestion,
    homeworkPeriodId,
    save: (base) => saveEnglishProgress({ ...base, minigame }),
    fetchBestScores: getEnglishBestScores,
  })
}
