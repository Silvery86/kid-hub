// use-math-session.ts — thin wrapper binding a MathGameType minigame to the shared
// session engine (best-scores + persistence via @kid-hub/api-client).
import type { MathGameType } from '@kid-hub/shared'

import { getMathBestScores, saveMathProgress } from '@/api/math.api'
import { useMinigameSession, type UseMinigameSessionResult } from '@/hooks/use-minigame-session'

export function useMathSession({
  minigame,
  secondsPerQuestion,
  homeworkPeriodId,
}: {
  minigame: MathGameType
  secondsPerQuestion: number
  homeworkPeriodId?: string
}): UseMinigameSessionResult {
  return useMinigameSession({
    gameType: 'math',
    minigame,
    secondsPerQuestion,
    homeworkPeriodId,
    save: (base) => saveMathProgress({ ...base, minigame }),
    fetchBestScores: getMathBestScores,
  })
}
