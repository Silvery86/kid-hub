// use-grades.ts — TanStack Query binding for the report card.
import { useQuery } from '@tanstack/react-query'

import { getGrades } from '@/api/grades.api'
import { useStudentKey } from '@/hooks/use-student'

export function useGrades() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['grades', studentId],
    queryFn: getGrades,
    enabled,
  })
}
