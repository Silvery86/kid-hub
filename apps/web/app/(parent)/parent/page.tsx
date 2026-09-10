/**
 * Parent dashboard page — two-panel schedule and grades management interface.
 * Protected by middleware; only accessible with a valid parent session cookie.
 */

export const dynamic = 'force-dynamic'

import { ParentDashboardView } from '@/components/parent/ParentDashboardView'
import {
  getWeekScheduleAction,
  getTodayViewAction,
  getBellScheduleAction,
} from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'
import { getParentContextAction } from '@/server/actions/students.actions'

export default async function ParentDashboardPage() {
  const [scheduleResult, gradesResult, todayResult, context, bellResult] = await Promise.all([
    getWeekScheduleAction(),
    getReportCardAction(),
    getTodayViewAction(),
    getParentContextAction(),
    getBellScheduleAction(),
  ])

  // The current week, resolved: its own rows if it has them, otherwise the most
  // recent earlier week's (docs/SCHEDULE_PARENT_IMP.md §12.2).
  const week = scheduleResult.success ? scheduleResult.data : null
  const grades = gradesResult.success ? (gradesResult.data?.grades ?? []) : []
  const todayView = todayResult.success ? todayResult.data : null
  // Empty until a bell schedule exists; the grid then prompts for one.
  const bellSlots = bellResult.success ? (bellResult.data?.slots ?? []) : []

  return (
    <ParentDashboardView
      initialSchedule={week?.days ?? []}
      initialWeekSource={week?.source}
      initialInheritedFrom={week?.inheritedFrom}
      initialGrades={grades}
      todayView={todayView}
      bellSlots={bellSlots}
      studentName={context.studentName}
    />
  )
}
