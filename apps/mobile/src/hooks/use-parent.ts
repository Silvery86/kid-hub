// use-parent.ts — queries and mutations for the parent management screens.
//
// Every mutation invalidates the kid-facing queries it affects, so editing the
// timetable in the parent section updates the kid tabs without a manual refetch.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import * as parentApi from '@/api/parent.api'
import { useStudentKey } from '@/hooks/use-student'

// Every one of these is about a specific child, so the id belongs in the key.
const kidAccessKey = (studentId: string | null) => ['parent', 'kid-access', studentId] as const
const screenTimeKey = (studentId: string | null) => ['parent', 'screen-time', studentId] as const
const activityKey = (studentId: string | null) => ['parent', 'activity', studentId] as const

export function useKidAccessSettings() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: kidAccessKey(studentId),
    queryFn: parentApi.getKidAccessSettings,
    enabled,
  })
}

export function useSaveKidAccessSettings() {
  const qc = useQueryClient()
  const { studentId } = useStudentKey()
  return useMutation({
    mutationFn: (settings: Record<string, boolean>) => parentApi.saveKidAccessSettings(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: kidAccessKey(studentId) }),
  })
}

export function useSetKidPattern() {
  return useMutation({ mutationFn: (pattern: string) => parentApi.setKidPattern(pattern) })
}

export function useScreenTime() {
  const { studentId, enabled } = useStudentKey()
  return useQuery({ queryKey: screenTimeKey(studentId), queryFn: parentApi.getScreenTime, enabled })
}

export function useSetScreenTimeLimit() {
  const qc = useQueryClient()
  const { studentId } = useStudentKey()
  return useMutation({
    mutationFn: (limitMins: number) => parentApi.setScreenTimeLimit(limitMins),
    onSuccess: () => qc.invalidateQueries({ queryKey: screenTimeKey(studentId) }),
  })
}

export function useRecentActivity(limit = 10) {
  const { studentId, enabled } = useStudentKey()
  return useQuery({
    queryKey: [...activityKey(studentId), limit],
    queryFn: () => parentApi.getRecentActivity(limit),
    enabled,
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
