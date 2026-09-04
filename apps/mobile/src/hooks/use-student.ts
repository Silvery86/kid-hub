// use-student.ts — which child the app is currently showing.
//
// Every student-scoped path names its student, so the id is not a display
// detail: it belongs in every query key. Two children sharing a key means
// switching shows the previous child's cached grades, which looks like real
// data and is the quietest way this migration could go wrong.
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, createElement, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'

import { apiClient, getActiveStudentId, setActiveStudent, studentApi } from '@/api/http'

export interface StudentOption {
  id: string
  name: string
  gradeLevel: number
}

interface StudentValue {
  /** null while the first resolution is in flight. */
  studentId: string | null
  students: StudentOption[]
  isLoading: boolean
  switchTo: (studentId: string) => void
}

const StudentContext = createContext<StudentValue | null>(null)

export function StudentProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: () => apiClient.listStudents(),
    staleTime: 1000 * 60 * 10,
  })

  // Resolving the active id goes through the same single-flight path the api
  // layer uses, so the transport and the UI can never disagree about which
  // child is on screen.
  const activeQuery = useQuery({
    queryKey: ['active-student', studentsQuery.data?.length ?? 0],
    queryFn: async () => (await studentApi()).studentId,
    enabled: studentsQuery.isSuccess,
  })

  const switchTo = useCallback(
    (studentId: string) => {
      if (studentId === getActiveStudentId()) return
      setActiveStudent(studentId)
      // Everything cached belongs to the previous child. Resetting rather than
      // invalidating means no stale row is ever rendered while the refetch runs.
      void queryClient.resetQueries()
    },
    [queryClient]
  )

  const value = useMemo<StudentValue>(
    () => ({
      studentId: activeQuery.data ?? null,
      students: (studentsQuery.data ?? []) as StudentOption[],
      isLoading: studentsQuery.isLoading || activeQuery.isLoading,
      switchTo,
    }),
    [activeQuery.data, activeQuery.isLoading, studentsQuery.data, studentsQuery.isLoading, switchTo]
  )

  return createElement(StudentContext.Provider, { value }, children)
}

export function useStudent(): StudentValue {
  const ctx = useContext(StudentContext)
  if (!ctx) throw new Error('useStudent must be used inside a StudentProvider')
  return ctx
}

/**
 * The id to put in a query key, and the flag that keeps a query from firing
 * before it is known. Every student-scoped hook uses both.
 */
export function useStudentKey(): { studentId: string | null; enabled: boolean } {
  const { studentId } = useStudent()
  return { studentId, enabled: studentId !== null }
}
