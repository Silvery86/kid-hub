// use-profile.ts — TanStack Query binding for the kid's display profile.
import { useQuery } from '@tanstack/react-query'

import { getKidProfile } from '@/api/profile.api'

export function useKidProfile() {
  return useQuery({
    queryKey: ['kid-profile'],
    queryFn: getKidProfile,
    // The name and grade change roughly never; don't refetch on every focus.
    staleTime: 1000 * 60 * 60,
  })
}
