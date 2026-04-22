/** Dashboard page — main hub view with schedule, games, streaks, and badges. */

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { DashboardView } from '@/components/dashboard/DashboardView'
import { getScheduleAction } from '@/server/actions/schedule.actions'

export default async function DashboardPage() {
  const result = await getScheduleAction()
  const schedule = result.data ?? []

  return (
    <TabletPageContainer>
      <DashboardView initialSchedule={schedule} />
    </TabletPageContainer>
  )
}
