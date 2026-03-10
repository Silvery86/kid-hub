import { TabletPageContainer } from '@/components/layout/TabletPageContainer';

export default function ParentDashboardPage() {
  return (
    <TabletPageContainer className="bg-white">
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-6" aria-hidden="true">⚙️</div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">Parent Dashboard</h1>
          <p className="text-slate-500 text-xl mb-8">Manage schedules &amp; grades here</p>
          <div className="flex gap-6 justify-center flex-wrap">
            {/* Sprint 3: replace placeholders with actual forms */}
            <div className="rounded-3xl border-4 border-dashed border-slate-200 p-8 min-w-48 text-center">
              <div className="text-4xl mb-3" aria-hidden="true">📅</div>
              <p className="font-bold text-slate-600">Schedule Manager</p>
              <p className="text-slate-400 text-sm mt-1">Sprint 3</p>
            </div>
            <div className="rounded-3xl border-4 border-dashed border-slate-200 p-8 min-w-48 text-center">
              <div className="text-4xl mb-3" aria-hidden="true">🌟</div>
              <p className="font-bold text-slate-600">Grades Manager</p>
              <p className="text-slate-400 text-sm mt-1">Sprint 3</p>
            </div>
          </div>
        </div>
      </div>
    </TabletPageContainer>
  );
}
