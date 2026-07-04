// use-schedule.ts — TanStack Query binding for today's schedule.
import { useQuery } from '@tanstack/react-query'

import { getSchedule } from '@/api/schedule.api'

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule', 'today'],
    queryFn: getSchedule,
  })
}
