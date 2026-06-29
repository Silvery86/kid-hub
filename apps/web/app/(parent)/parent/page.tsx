/**
 * Parent dashboard page — two-panel schedule and grades management interface.
 * Protected by middleware; only accessible with a valid parent session cookie.
 */

export const dynamic = 'force-dynamic'

import { ParentDashboardView } from '@/components/parent/ParentDashboardView'
import { getScheduleAction, getTodayViewAction } from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'

export default async function ParentDashboardPage() {
  const [scheduleResult, gradesResult, todayResult] = await Promise.all([
    getScheduleAction(),
    getReportCardAction(),
    getTodayViewAction(),
  ])

  const schedule = scheduleResult.success ? scheduleResult.data : []
  const grades = gradesResult.success ? (gradesResult.data?.grades ?? []) : []
  const todayView = todayResult.success ? todayResult.data : null

  return (
    <ParentDashboardView
      initialSchedule={schedule}
      initialGrades={grades}
      todayView={todayView}
    />
  )
}
