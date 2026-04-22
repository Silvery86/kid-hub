/** Schedule page — read-only 5-day weekly timetable with live-class highlighting. */

import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { getScheduleAction } from '@/server/actions/schedule.actions'
import { ScheduleGrid } from '@/components/dashboard/ScheduleGrid'

export default async function SchedulePage() {
  const result = await getScheduleAction()
  const schedule = result.data ?? []

  return (
    <TabletPageContainer className="overflow-hidden p-6">
      <h1 className="mb-5 text-3xl font-extrabold text-slate-800">Thời khóa biểu</h1>
      <ScheduleGrid initialSchedule={schedule} />
    </TabletPageContainer>
  )
}
