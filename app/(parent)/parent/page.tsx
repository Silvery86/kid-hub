/**
 * Parent dashboard page — two-panel schedule and grades management interface.
 * Protected by middleware; only accessible with a valid parent session cookie.
 */

export const dynamic = 'force-dynamic'

import { ParentDashboardView } from '@/components/parent/ParentDashboardView'
import { getScheduleAction } from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'

export default async function ParentDashboardPage() {
  const [scheduleResult, gradesResult] = await Promise.all([
    getScheduleAction(),
    getReportCardAction(),
  ])

  const schedule = scheduleResult.data ?? []
  const grades = gradesResult.data?.grades ?? []

  return <ParentDashboardView initialSchedule={schedule} initialGrades={grades} />
}
