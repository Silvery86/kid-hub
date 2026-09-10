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
  // Set only on a holiday or nghỉ hè; the view then leads with the break.
  const activeBreak = todayResult.success ? (todayResult.data.activeBreak ?? null) : null
  const identity = identityResult.success ? identityResult.data : null

  return (
    <Suspense fallback={<ScheduleLoading />}>
      <ScheduleView
        initialSchedule={schedule}
        activeBreak={activeBreak}
        allEveningBlocks={allEveningBlocks}
        todayBellSlots={todayBellSlots}
        classIdentity={identity}
      />
    </Suspense>
  )
}
