// use-schedule.ts — TanStack Query binding for today's schedule.
import { useQuery } from '@tanstack/react-query'

import { getSchedule, getWeekSchedule } from '@/api/schedule.api'

export function useSchedule() {
  return useQuery({
    queryKey: ['schedule', 'today'],
    queryFn: getSchedule,
  })
}

/** The full week, for the schedule screen's day tabs. */
export function useWeekSchedule() {
  return useQuery({
    queryKey: ['schedule', 'week'],
    queryFn: getWeekSchedule,
  })
}
