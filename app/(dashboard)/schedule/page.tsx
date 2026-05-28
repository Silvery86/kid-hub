/** Schedule page — school timetable with orientation-aware layout. */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { ScheduleView } from '@/components/dashboard/ScheduleView'
import { getScheduleAction } from '@/server/actions/schedule.actions'
import ScheduleLoading from './loading'

export default async function SchedulePage() {
  const scheduleResult = await getScheduleAction()
  const schedule = scheduleResult.data ?? []

  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView initialSchedule={schedule} />
    </Suspense>
  )
}
