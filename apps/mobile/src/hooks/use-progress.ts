// use-progress.ts — TanStack Query binding for the kid's progress summary.
import { useQuery } from '@tanstack/react-query'

import { getProgress } from '@/api/progress.api'
import { useStudentKey } from '@/hooks/use-student'

export function useProgress() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['progress', studentId],
    queryFn: getProgress,
    enabled,
  })
}
