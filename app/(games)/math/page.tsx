import { TabletPageContainer } from '@/components/layout/TabletPageContainer';

export default function MathGamePage() {
  return (
    <TabletPageContainer className="bg-slate-900">
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-8xl mb-6" aria-hidden="true">🔢</div>
          <h1 className="text-4xl font-bold text-white mb-3">Number Ninja</h1>
          <p className="text-slate-400 text-xl">Math mini-game — coming in Sprint 4 ✨</p>
        </div>
      </div>
    </TabletPageContainer>
  );
}
