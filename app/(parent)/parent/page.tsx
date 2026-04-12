/** Parent dashboard page — two-panel schedule and grades management interface. */

import Link from 'next/link'
import { TabletPageContainer } from '@/components/layout/TabletPageContainer'
import { ScheduleManager } from '@/components/parent/ScheduleManager'
import { GradesManager } from '@/components/parent/GradesManager'

export default function ParentDashboardPage() {
  return (
    <TabletPageContainer className="overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">⚙️ Parent Mode</h1>
          <p className="mt-1 text-slate-500">Quản lý thời khóa biểu và điểm số của Khôi</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-600 shadow-sm transition-colors hover:bg-slate-100"
        >
          ← Về Dashboard
        </Link>
      </div>

      {/* Two-panel layout (each manager in its own scrollable panel) */}
      <div className="grid h-[calc(100vh-9rem)] grid-cols-2 gap-6">
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
          <ScheduleManager />
        </div>
        <div className="flex flex-col overflow-hidden rounded-3xl bg-white p-5 shadow-sm">
          <GradesManager />
        </div>
      </div>
    </TabletPageContainer>
  )
}
