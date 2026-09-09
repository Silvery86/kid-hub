/** Schedule page — school timetable with orientation-aware layout. */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { ScheduleView } from '@/components/dashboard/ScheduleView'
import {
  getScheduleAction,
  getAllEveningBlocksAction,
  getTodayViewAction,
} from '@/server/actions/schedule.actions'
import ScheduleLoading from './loading'

export default async function SchedulePage() {
  const [scheduleResult, eveningResult, todayResult] = await Promise.all([
    getScheduleAction(),
    getAllEveningBlocksAction(),
    getTodayViewAction(),
  ])
  const schedule = scheduleResult.success ? scheduleResult.data : []
  const allEveningBlocks = eveningResult.success ? eveningResult.data : []
  const todayBellSlots = todayResult.success ? (todayResult.data.bellSlots ?? []) : []

  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView
        initialSchedule={schedule}
        allEveningBlocks={allEveningBlocks}
        todayBellSlots={todayBellSlots}
      />
    </Suspense>
  )
}
