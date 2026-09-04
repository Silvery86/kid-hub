// use-schedule.ts — TanStack Query binding for today's schedule.
import { useQuery } from '@tanstack/react-query'

import { getSchedule, getWeekSchedule } from '@/api/schedule.api'
import { useStudentKey } from '@/hooks/use-student'

export function useSchedule() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['schedule', 'today', studentId],
    queryFn: getSchedule,
    enabled,
  })
}

/** The full week, for the schedule screen's day tabs. */
export function useWeekSchedule() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['schedule', 'week', studentId],
    queryFn: getWeekSchedule,
    enabled,
  })
}
