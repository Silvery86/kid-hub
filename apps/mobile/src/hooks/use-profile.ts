// use-profile.ts — TanStack Query binding for the kid's display profile.
import { useQuery } from '@tanstack/react-query'

import { getKidProfile } from '@/api/profile.api'
import { useStudentKey } from '@/hooks/use-student'

export function useKidProfile() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: ['kid-profile', studentId],
    queryFn: getKidProfile,
    enabled,
    // The name and grade change roughly never; don't refetch on every focus.
    staleTime: 1000 * 60 * 60,
  })
}
