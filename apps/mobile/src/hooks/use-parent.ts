// use-parent.ts — queries and mutations for the parent management screens.
//
// Every mutation invalidates the kid-facing queries it affects, so editing the
// timetable in the parent section updates the kid tabs without a manual refetch.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as parentApi from '@/api/parent.api'

const KID_ACCESS_KEY = ['parent', 'kid-access'] as const
const SCREEN_TIME_KEY = ['parent', 'screen-time'] as const
const ACTIVITY_KEY = ['parent', 'activity'] as const

export function useKidAccessSettings() {
  return useQuery({ queryKey: KID_ACCESS_KEY, queryFn: parentApi.getKidAccessSettings })
}

export function useSaveKidAccessSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (settings: Record<string, boolean>) => parentApi.saveKidAccessSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: KID_ACCESS_KEY }),
  })
}

export function useSetKidPattern() {
  return useMutation({ mutationFn: (pattern: string) => parentApi.setKidPattern(pattern) })
}

export function useScreenTime() {
  return useQuery({ queryKey: SCREEN_TIME_KEY, queryFn: parentApi.getScreenTime })
}

export function useSetScreenTimeLimit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (limitMins: number) => parentApi.setScreenTimeLimit(limitMins),
    onSuccess: () => qc.invalidateQueries({ queryKey: SCREEN_TIME_KEY }),
  })
}

export function useRecentActivity(limit = 10) {
  return useQuery({
    queryKey: [...ACTIVITY_KEY, limit],
    queryFn: () => parentApi.getRecentActivity(limit),
  })
}

/** Invalidates everything a timetable edit can change, on either surface. */
const invalidateSchedule = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: ['schedule'] })
  void qc.invalidateQueries({ queryKey: ['homework'] })
}

export function useUpsertGrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.upsertGrade,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['grades'] }),
  })
}

export function useCreatePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.createPeriod,
    onSuccess: () => invalidateSchedule(qc),
  })
}

export function useDeletePeriod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.deletePeriod,
    onSuccess: () => invalidateSchedule(qc),
  })
}

export function useCreateExtraClass() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.createExtraClass,
    onSuccess: () => invalidateSchedule(qc),
  })
}

export function useAddDailyHomework() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.addDailyHomework,
    onSuccess: () => invalidateSchedule(qc),
  })
}

export function useDeleteDailyHomework() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: parentApi.deleteDailyHomework,
    onSuccess: () => invalidateSchedule(qc),
  })
}
