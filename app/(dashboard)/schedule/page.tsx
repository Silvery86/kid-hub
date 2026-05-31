/** Schedule page — school timetable with orientation-aware layout. */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { ScheduleView } from '@/components/dashboard/ScheduleView'
import { getScheduleAction, getAllEveningBlocksAction } from '@/server/actions/schedule.actions'
import ScheduleLoading from './loading'

export default async function SchedulePage() {
  const [scheduleResult, eveningResult] = await Promise.all([
    getScheduleAction(),
    getAllEveningBlocksAction(),
  ])
  const schedule = scheduleResult.data ?? []
  const allEveningBlocks = eveningResult.data ?? []

  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView initialSchedule={schedule} allEveningBlocks={allEveningBlocks} />
    </Suspense>
  )
}
