import Link from 'next/link';
import { TabletPageContainer } from '@/components/layout/TabletPageContainer';
import { ScheduleManager } from '@/components/parent/ScheduleManager';
import { GradesManager } from '@/components/parent/GradesManager';

export default function ParentDashboardPage() {
  return (
    <TabletPageContainer className="bg-slate-50 p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">⚙️ Parent Mode</h1>
          <p className="text-slate-500 mt-1">Quản lý thời khóa biểu và điểm số của Khôi</p>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 font-bold text-slate-600 shadow-sm hover:bg-slate-100 transition-colors"
        >
          ← Về Dashboard
        </Link>
      </div>

      {/* Two-panel layout (each manager in its own scrollable panel) */}
      <div className="grid grid-cols-2 gap-6 h-[calc(100vh-9rem)]">
        <div className="bg-white rounded-3xl p-5 shadow-sm overflow-hidden flex flex-col">
          <ScheduleManager />
        </div>
        <div className="bg-white rounded-3xl p-5 shadow-sm overflow-hidden flex flex-col">
          <GradesManager />
        </div>
      </div>
    </TabletPageContainer>
  );
}
