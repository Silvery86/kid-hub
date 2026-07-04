// use-grades.ts — TanStack Query binding for the report card.
import { useQuery } from '@tanstack/react-query'

import { getGrades } from '@/api/grades.api'

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: getGrades,
  })
}
