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
  getSchoolBreaksAction,
  getRememberedVariantsAction,
} from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'
import { getParentContextAction, listStudentsAction } from '@/server/actions/students.actions'
import { getUnreadCountAction } from '@/server/actions/notification.actions'
import { listCustomSubjectsAction } from '@/server/actions/subjects.actions'

export default async function ParentDashboardPage() {
  const [
    scheduleResult,
    gradesResult,
    todayResult,
    context,
    bellResult,
    breaksResult,
    studentList,
    unreadResult,
    variantsResult,
    customResult,
  ] = await Promise.all([
    getWeekScheduleAction(),
    getReportCardAction(),
    getTodayViewAction(),
    getParentContextAction(),
    getBellScheduleAction(),
    getSchoolBreaksAction(),
    listStudentsAction(),
    getUnreadCountAction(),
    getRememberedVariantsAction(),
    listCustomSubjectsAction(),
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
      breaks={breaksResult.success ? breaksResult.data : []}
      studentName={context.studentName}
      students={studentList.success ? studentList.data.students : []}
      activeStudentId={studentList.success ? studentList.data.activeStudentId : null}
      initialUnread={unreadResult.success ? unreadResult.data : 0}
      rememberedVariants={variantsResult.success ? variantsResult.data : {}}
      customSubjects={customResult.success ? customResult.data : []}
    />
  )
}
