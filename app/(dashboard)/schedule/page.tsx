/** Schedule page — school timetable (left) + today's evening plan (right). */

export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { getScheduleAction, getTodayViewAction } from '@/server/actions/schedule.actions'
import { ScheduleGrid } from '@/components/dashboard/ScheduleGrid'
import { TodayPlanCard } from '@/components/dashboard/TodayPlanCard'
import ScheduleLoading from './loading'

export default async function SchedulePage() {
  const [scheduleResult, todayResult] = await Promise.all([
    getScheduleAction(),
    getTodayViewAction(),
  ])

  const schedule = scheduleResult.data ?? []
  const todayView = todayResult.data ?? null

  return (
    <TabletPageContainer className="overflow-hidden p-6">
      <h1 className="mb-4 text-3xl font-extrabold text-slate-800">Thời khóa biểu</h1>
      <Suspense fallback={<ScheduleLoading />}>
        {/* Landscape: side-by-side. Portrait: stacked (grid first, then today panel). */}
        <div className="flex h-[calc(100dvh-7rem)] gap-4 portrait:flex-col portrait:overflow-y-auto">
          {/* Left: 5-day school timetable */}
          <div className="flex-1 overflow-hidden portrait:flex-none">
            <ScheduleGrid initialSchedule={schedule} />
          </div>

          {/* Right: today's evening classes + homework */}
          <div className="w-64 flex-shrink-0 portrait:w-full portrait:flex-none">
            <TodayPlanCard todayView={todayView} />
          </div>
        </div>
      </Suspense>
    </TabletPageContainer>
  )
}
