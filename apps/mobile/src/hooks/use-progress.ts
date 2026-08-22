// use-progress.ts — TanStack Query binding for the kid's progress summary.
import { useQuery } from '@tanstack/react-query'

import { getProgress } from '@/api/progress.api'

export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: getProgress,
  })
}
