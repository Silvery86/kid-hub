/** Dashboard page — main hub view with schedule, games, streaks, and badges. */

export const dynamic = 'force-dynamic'

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { getScheduleAction, getTodayViewAction } from '@/server/actions/schedule.actions'
import { getTodayHomeworkAction } from '@/server/actions/homework.actions'
import { getKidProfileAction } from '@/server/actions/kid-progress.actions'

export default async function DashboardPage() {
  const [scheduleResult, homeworkResult, todayResult, profileResult] = await Promise.all([
    getScheduleAction(),
    getTodayHomeworkAction(),
    getTodayViewAction(),
    getKidProfileAction(),
  ])
  const schedule = scheduleResult.success ? scheduleResult.data : []
  const homework = homeworkResult.success ? homeworkResult.data : []
  const eveningBlocks = todayResult.success ? (todayResult.data?.eveningBlocks ?? []) : []
  const kidName = (profileResult.success ? profileResult.data?.name : null) ?? 'bạn'

  return (
    <TabletPageContainer>
      <DashboardView
        initialSchedule={schedule}
        initialHomework={homework}
        eveningBlocks={eveningBlocks}
        kidName={kidName}
      />
    </TabletPageContainer>
  )
}
