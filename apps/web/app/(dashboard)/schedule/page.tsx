/** Schedule page — school timetable with orientation-aware layout. */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { ScheduleView } from '@/components/dashboard/ScheduleView'
import {
  getScheduleAction,
  getAllEveningBlocksAction,
  getTodayViewAction,
} from '@/server/actions/schedule.actions'
import { getClassIdentityAction } from '@/server/actions/students.actions'
import ScheduleLoading from './loading'

export default async function SchedulePage() {
  const [scheduleResult, eveningResult, todayResult, identityResult] = await Promise.all([
    getScheduleAction(),
    getAllEveningBlocksAction(),
    getTodayViewAction(),
    getClassIdentityAction(),
  ])
  const schedule = scheduleResult.success ? scheduleResult.data : []
  const allEveningBlocks = eveningResult.success ? eveningResult.data : []
  const todayBellSlots = todayResult.success ? (todayResult.data.bellSlots ?? []) : []
  const identity = identityResult.success ? identityResult.data : null

  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView
        initialSchedule={schedule}
        allEveningBlocks={allEveningBlocks}
        todayBellSlots={todayBellSlots}
        classIdentity={identity}
      />
    </Suspense>
  )
}
