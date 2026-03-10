import { TabletPageContainer } from '@/components/layout/TabletPageContainer';

export default function DashboardPage() {
  return (
    <TabletPageContainer>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6" aria-hidden="true">🏠</div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">Dashboard</h1>
          <p className="text-slate-500 text-xl">Today&apos;s overview — coming in Sprint 2 ✨</p>
        </div>
      </div>
    </TabletPageContainer>
  );
}
