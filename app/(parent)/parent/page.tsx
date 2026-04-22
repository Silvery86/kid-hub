/**
 * Parent dashboard page — two-panel schedule and grades management interface.
 * Protected by middleware; only accessible with a valid parent session cookie.
 */

import Link from 'next/link'
import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { ScheduleManager } from '@/components/parent/ScheduleManager'
import { GradesManager } from '@/components/parent/GradesManager'
import { SignOutButton } from '@/components/parent/SignOutButton'
import { getScheduleAction } from '@/server/actions/schedule.actions'
import { getReportCardAction } from '@/server/actions/grades.actions'

export default async function ParentDashboardPage() {
  const [scheduleResult, gradesResult] = await Promise.all([
    getScheduleAction(),
    getReportCardAction(),
  ])

  const schedule = scheduleResult.data ?? []
  const grades = gradesResult.data?.grades ?? []
  return (
    <TabletPageContainer className="overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">⚙️ Parent Mode</h1>
          <p className="mt-1 text-slate-500">Quản lý thời khóa biểu và điểm số của Khôi</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
          >
            ← Về Dashboard
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Two-panel layout (each manager in its own scrollable panel) */}
      <div className="grid h-[calc(100vh-9rem)] grid-cols-2 gap-6">
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
          <ScheduleManager initialSchedule={schedule} />
        </div>
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
          <GradesManager initialGrades={grades} />
        </div>
      </div>
    </TabletPageContainer>
  )
}
