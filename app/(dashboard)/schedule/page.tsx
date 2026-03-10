import { TabletPageContainer } from '@/components/layout/TabletPageContainer';

export default function SchedulePage() {
  return (
    <TabletPageContainer>
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6" aria-hidden="true">📅</div>
          <h1 className="text-4xl font-bold text-slate-800 mb-3">Timetable</h1>
          <p className="text-slate-500 text-xl">Weekly schedule — coming in Sprint 2 ✨</p>
        </div>
      </div>
    </TabletPageContainer>
  );
}
