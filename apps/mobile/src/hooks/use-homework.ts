// use-homework.ts — TanStack Query bindings for today's homework.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getTodayHomework, markHomeworkDone } from '@/api/homework.api'

const todayKey = ['homework', 'today'] as const

export function useTodayHomework() {
  return useQuery({
    queryKey: todayKey,
    queryFn: getTodayHomework,
  })
}

export function useMarkHomeworkDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodId: string) => markHomeworkDone(periodId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todayKey }),
  })
}
