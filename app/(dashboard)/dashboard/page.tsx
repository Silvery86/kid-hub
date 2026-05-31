/** Dashboard page — main hub view with schedule, games, streaks, and badges. */

export const dynamic = 'force-dynamic'

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { getScheduleAction, getTodayViewAction } from '@/server/actions/schedule.actions'
import { getTodayHomeworkAction } from '@/server/actions/homework.actions'

export default async function DashboardPage() {
  const [scheduleResult, homeworkResult, todayResult] = await Promise.all([
    getScheduleAction(),
    getTodayHomeworkAction(),
    getTodayViewAction(),
  ])
  const schedule = scheduleResult.data ?? []
  const homework = homeworkResult.data ?? []
  const eveningBlocks = todayResult.data?.eveningBlocks ?? []

  return (
    <TabletPageContainer>
      <DashboardView
        initialSchedule={schedule}
        initialHomework={homework}
        eveningBlocks={eveningBlocks}
      />
    </TabletPageContainer>
  )
}
