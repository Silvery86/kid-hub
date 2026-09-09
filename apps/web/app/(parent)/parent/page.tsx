/**
 * Parent dashboard page — two-panel schedule and grades management interface.
 * Protected by middleware; only accessible with a valid parent session cookie.
 */

export const dynamic = 'force-dynamic'

import { ParentDashboardView } from '@/components/parent/ParentDashboardView'
import {
  getScheduleAction,
  getTodayViewAction,
  getBellScheduleAction,
} from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'
import { getParentContextAction } from '@/server/actions/students.actions'

export default async function ParentDashboardPage() {
  const [scheduleResult, gradesResult, todayResult, context, bellResult] = await Promise.all([
    getScheduleAction(),
    getReportCardAction(),
    getTodayViewAction(),
    getParentContextAction(),
    getBellScheduleAction(),
  ])

  const schedule = scheduleResult.success ? scheduleResult.data : []
  const grades = gradesResult.success ? (gradesResult.data?.grades ?? []) : []
  const todayView = todayResult.success ? todayResult.data : null
  // Empty until a bell schedule exists; the grid then prompts for one.
  const bellSlots = bellResult.success ? (bellResult.data?.slots ?? []) : []

  return (
    <ParentDashboardView
      initialSchedule={schedule}
      initialGrades={grades}
      todayView={todayView}
      bellSlots={bellSlots}
      studentName={context.studentName}
    />
  )
}
