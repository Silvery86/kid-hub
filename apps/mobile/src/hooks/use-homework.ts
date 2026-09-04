// use-homework.ts — TanStack Query bindings for today's homework.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getTodayHomework, markHomeworkDone } from '@/api/homework.api'
import { useStudentKey } from '@/hooks/use-student'

export function useTodayHomework() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['homework', 'today', studentId],
    queryFn: getTodayHomework,
    enabled,
  })
}

export function useMarkHomeworkDone() {
  const queryClient = useQueryClient()
  const { studentId } = useStudentKey()
  return useMutation({
    mutationFn: (periodId: string) => markHomeworkDone(periodId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['homework', 'today', studentId] }),
  })
}
