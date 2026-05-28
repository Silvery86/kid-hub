/** Dashboard page — main hub view with schedule, games, streaks, and badges. */

export const dynamic = 'force-dynamic'

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { getScheduleAction } from '@/server/actions/schedule.actions'
import { getTodayHomeworkAction } from '@/server/actions/homework.actions'

export default async function DashboardPage() {
  const [scheduleResult, homeworkResult] = await Promise.all([
    getScheduleAction(),
    getTodayHomeworkAction(),
  ])
  const schedule = scheduleResult.data ?? []
  const homework = homeworkResult.data ?? []

  return (
    <TabletPageContainer>
      <DashboardView initialSchedule={schedule} initialHomework={homework} />
    </TabletPageContainer>
  )
}
