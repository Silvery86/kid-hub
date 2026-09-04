// use-best-scores.ts — per-minigame best stars for the games hub.
//
// The progress summary only carries the best stars per subject; the hub shows
// one star row per minigame, which needs the subType-level records.
import { useQueries } from '@tanstack/react-query'
import type { GameBestScore } from '@kid-hub/shared'

import { getEnglishBestScores } from '@/api/english.api'
import { getMathBestScores } from '@/api/math.api'
import { useStudentKey } from '@/hooks/use-student'

export function useBestScores() {
  const { studentId, enabled } = useStudentKey()
  const results = useQueries({
    queries: [
      { queryKey: ['best-scores', 'math', studentId], queryFn: getMathBestScores, enabled },
      { queryKey: ['best-scores', 'english', studentId], queryFn: getEnglishBestScores, enabled },
    ],
  })

  const scores: GameBestScore[] = results.flatMap((r) => r.data ?? [])

  return {
    scores,
    isLoading: results.some((r) => r.isLoading),
    isError: results.some((r) => r.isError),
    refetch: () => {
      for (const r of results) void r.refetch()
    },
  }
}
